import { TileState } from './types.js';
import { TileRequestManager } from './TileRequestManager.js';
/**
 * 瓦片 ID 生成器
 */
function generateTileId(coord) {
    return `${coord.z}/${coord.x}/${coord.y}`;
}
/**
 * 瓦片请求生成器
 */
function generateRequestId() {
    return `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
/**
 * 瓦片队列类
 * 负责管理瓦片加载队列、优先级控制、LRU缓存
 */
export class TileQueue {
    _config;
    _requestManager;
    _tiles = new Map();
    _pendingTiles = new Set();
    _eventListeners = new Map();
    _isProcessing = false;
    constructor(config) {
        this._config = {
            maxConcurrent: config.maxConcurrent ?? 4,
            maxRetries: config.maxRetries ?? 3,
            retryDelayBase: config.retryDelayBase ?? 1000,
            retryDelayMax: config.retryDelayMax ?? 10000,
            requestTimeout: config.requestTimeout ?? 30000,
            loadFn: config.loadFn,
            maxCacheSize: config.maxCacheSize ?? 1000,
            enableLRU: config.enableLRU ?? true,
            enablePriority: config.enablePriority ?? true,
        };
        this._requestManager = new TileRequestManager({
            maxConcurrent: this._config.maxConcurrent,
            maxRetries: this._config.maxRetries,
            retryDelayBase: this._config.retryDelayBase,
            retryDelayMax: this._config.retryDelayMax,
            requestTimeout: this._config.requestTimeout,
            loadFn: this._config.loadFn,
        });
    }
    /**
     * 添加瓦片到队列
     */
    addTile(coord, url, priority = 0) {
        const tileId = generateTileId(coord);
        // 检查是否已存在
        const existingTile = this._tiles.get(tileId);
        if (existingTile) {
            // 更新优先级
            existingTile.priority = Math.max(existingTile.priority, priority);
            return existingTile;
        }
        // 创建新瓦片
        const tile = {
            coord,
            url,
            state: TileState.PENDING,
            priority,
            retryCount: 0,
            requestId: generateRequestId(),
        };
        this._tiles.set(tileId, tile);
        this._pendingTiles.add(tileId);
        // 触发事件
        this._emit('tileRequested', tile);
        // 启动处理
        this._startProcessing();
        return tile;
    }
    /**
     * 批量添加瓦片
     */
    addTiles(tiles) {
        return tiles.map((t) => this.addTile(t.coord, t.url, t.priority ?? 0));
    }
    /**
     * 移除瓦片
     */
    removeTile(tileId) {
        const tile = this._tiles.get(tileId);
        if (!tile) {
            return false;
        }
        // 取消请求
        this._requestManager.cancel(tile.requestId);
        // 移除
        this._tiles.delete(tileId);
        this._pendingTiles.delete(tileId);
        return true;
    }
    /**
     * 批量移除瓦片
     */
    removeTiles(tileIds) {
        let removedCount = 0;
        tileIds.forEach((tileId) => {
            if (this.removeTile(tileId)) {
                removedCount++;
            }
        });
        return removedCount;
    }
    /**
     * 取消瓦片请求
     */
    cancelTile(tileId) {
        const tile = this._tiles.get(tileId);
        if (!tile) {
            return false;
        }
        const cancelled = this._requestManager.cancel(tile.requestId);
        if (cancelled) {
            tile.state = TileState.CANCELLED;
            this._pendingTiles.delete(tileId);
            this._emit('tileCancelled', tile);
        }
        return cancelled;
    }
    /**
     * 清空队列
     */
    clear() {
        this._requestManager.cancelAll();
        this._tiles.clear();
        this._pendingTiles.clear();
    }
    /**
     * 获取瓦片
     */
    getTile(tileId) {
        return this._tiles.get(tileId);
    }
    /**
     * 获取瓦片（通过坐标）
     */
    getTileByCoord(coord) {
        const tileId = generateTileId(coord);
        return this._tiles.get(tileId);
    }
    /**
     * 检查瓦片是否存在
     */
    hasTile(tileId) {
        return this._tiles.has(tileId);
    }
    /**
     * 获取所有瓦片
     */
    getAllTiles() {
        return Array.from(this._tiles.values());
    }
    /**
     * 获取待处理瓦片
     */
    getPendingTiles() {
        return Array.from(this._pendingTiles)
            .map((tileId) => this._tiles.get(tileId))
            .filter((tile) => tile !== undefined);
    }
    /**
     * 获取加载中的瓦片
     */
    getLoadingTiles() {
        return Array.from(this._tiles.values()).filter((tile) => tile.state === TileState.LOADING);
    }
    /**
     * 获取已加载的瓦片
     */
    getLoadedTiles() {
        return Array.from(this._tiles.values()).filter((tile) => tile.state === TileState.LOADED);
    }
    /**
     * 获取失败的瓦片
     */
    getFailedTiles() {
        return Array.from(this._tiles.values()).filter((tile) => tile.state === TileState.FAILED);
    }
    /**
     * 启动处理队列
     */
    async _startProcessing() {
        if (this._isProcessing) {
            return;
        }
        this._isProcessing = true;
        try {
            while (this._pendingTiles.size > 0) {
                // 按优先级排序
                const tilesToProcess = this._getTilesToProcess();
                if (tilesToProcess.length === 0) {
                    break;
                }
                // 并发加载
                const promises = tilesToProcess.map((tile) => this._processTile(tile));
                await Promise.allSettled(promises);
                // 检查并发限制
                while (this._requestManager.getActiveCount() >= this._config.maxConcurrent) {
                    await new Promise((resolve) => setTimeout(resolve, 10));
                }
            }
        }
        finally {
            this._isProcessing = false;
        }
    }
    /**
     * 获取待处理的瓦片列表
     */
    _getTilesToProcess() {
        const pendingTiles = this.getPendingTiles();
        // 如果启用优先级，按优先级排序
        if (this._config.enablePriority) {
            return pendingTiles.sort((a, b) => b.priority - a.priority);
        }
        return pendingTiles;
    }
    /**
     * 处理单个瓦片
     */
    async _processTile(tile) {
        // 移除待处理标记
        this._pendingTiles.delete(generateTileId(tile.coord));
        try {
            await this._requestManager.request(tile);
            // 根据最终状态触发相应事件
            if (tile.state === TileState.LOADED) {
                this._emit('tileLoaded', tile);
            }
            else if (tile.state === TileState.CANCELLED) {
                this._emit('tileCancelled', tile);
            }
            else if (tile.state === TileState.FAILED) {
                this._emit('tileFailed', tile);
            }
        }
        catch (error) {
            // 确保状态为 FAILED
            tile.state = TileState.FAILED;
            tile.lastError = error;
            this._emit('tileFailed', tile);
        }
    }
    /**
     * 检查是否需要清理缓存
     */
    _checkCacheSize() {
        if (this._config.enableLRU && this._tiles.size > this._config.maxCacheSize) {
            this._evictLRU();
        }
    }
    /**
     * LRU 缓存淘汰
     */
    _evictLRU() {
        const loadedTiles = this.getLoadedTiles();
        // 按加载时间排序（最旧的先删除）
        loadedTiles.sort((a, b) => {
            const timeA = a.loadTime ?? 0;
            const timeB = b.loadTime ?? 0;
            return timeA - timeB;
        });
        // 删除最旧的瓦片
        const toRemove = loadedTiles.slice(0, this._tiles.size - this._config.maxCacheSize);
        toRemove.forEach((tile) => {
            const tileId = generateTileId(tile.coord);
            this._tiles.delete(tileId);
        });
    }
    /**
     * 添加事件监听器
     */
    on(event, listener) {
        if (!this._eventListeners.has(event)) {
            this._eventListeners.set(event, new Set());
        }
        this._eventListeners.get(event).add(listener);
    }
    /**
     * 移除事件监听器
     */
    off(event, listener) {
        const listeners = this._eventListeners.get(event);
        if (listeners) {
            listeners.delete(listener);
        }
    }
    /**
     * 触发事件
     */
    _emit(event, tile) {
        const listeners = this._eventListeners.get(event);
        if (listeners) {
            listeners.forEach((listener) => {
                try {
                    listener(event, tile);
                }
                catch (error) {
                    console.error(`[TileQueue] Event listener error for ${event}:`, error);
                }
            });
        }
    }
    /**
     * 获取统计信息
     */
    getStats() {
        const requestManagerStats = this._requestManager.getStats();
        return {
            ...requestManagerStats,
            queueLength: this._pendingTiles.size,
            loadingCount: this.getLoadingTiles().length,
        };
    }
    /**
     * 获取队列信息
     */
    getInfo() {
        return {
            totalTiles: this._tiles.size,
            pendingTiles: this._pendingTiles.size,
            loadingTiles: this.getLoadingTiles().length,
            loadedTiles: this.getLoadedTiles().length,
            failedTiles: this.getFailedTiles().length,
            cancelledTiles: this.getAllTiles().filter((t) => t.state === TileState.CANCELLED).length,
        };
    }
    /**
     * 重试失败的瓦片
     */
    retryFailedTiles() {
        const failedTiles = this.getFailedTiles();
        let retriedCount = 0;
        failedTiles.forEach((tile) => {
            if (tile.retryCount < this._config.maxRetries) {
                const tileId = generateTileId(tile.coord);
                this._pendingTiles.add(tileId);
                tile.state = TileState.PENDING;
                tile.retryCount = 0;
                tile.lastError = undefined;
                retriedCount++;
            }
        });
        if (retriedCount > 0) {
            this._startProcessing();
        }
        return retriedCount;
    }
    /**
     * 重置统计
     */
    resetStats() {
        this._requestManager.resetStats();
    }
    /**
     * 销毁队列
     */
    dispose() {
        this.clear();
        this._eventListeners.clear();
        this._requestManager.dispose();
    }
}
//# sourceMappingURL=TileQueue.js.map