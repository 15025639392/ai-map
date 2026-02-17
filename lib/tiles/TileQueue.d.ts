import type { ITile, ITileCoord, ITileQueueConfig, ITileStats, TileQueueEvent, TileQueueEventListener } from './types.js';
/**
 * 瓦片队列类
 * 负责管理瓦片加载队列、优先级控制、LRU缓存
 */
export declare class TileQueue {
    private _config;
    private _requestManager;
    private _tiles;
    private _pendingTiles;
    private _eventListeners;
    private _isProcessing;
    constructor(config: ITileQueueConfig);
    /**
     * 添加瓦片到队列
     */
    addTile(coord: ITileCoord, url: string, priority?: number): ITile;
    /**
     * 批量添加瓦片
     */
    addTiles(tiles: Array<{
        coord: ITileCoord;
        url: string;
        priority?: number;
    }>): ITile[];
    /**
     * 移除瓦片
     */
    removeTile(tileId: string): boolean;
    /**
     * 批量移除瓦片
     */
    removeTiles(tileIds: string[]): number;
    /**
     * 取消瓦片请求
     */
    cancelTile(tileId: string): boolean;
    /**
     * 清空队列
     */
    clear(): void;
    /**
     * 获取瓦片
     */
    getTile(tileId: string): ITile | undefined;
    /**
     * 获取瓦片（通过坐标）
     */
    getTileByCoord(coord: ITileCoord): ITile | undefined;
    /**
     * 检查瓦片是否存在
     */
    hasTile(tileId: string): boolean;
    /**
     * 获取所有瓦片
     */
    getAllTiles(): ITile[];
    /**
     * 获取待处理瓦片
     */
    getPendingTiles(): ITile[];
    /**
     * 获取加载中的瓦片
     */
    getLoadingTiles(): ITile[];
    /**
     * 获取已加载的瓦片
     */
    getLoadedTiles(): ITile[];
    /**
     * 获取失败的瓦片
     */
    getFailedTiles(): ITile[];
    /**
     * 启动处理队列
     */
    private _startProcessing;
    /**
     * 获取待处理的瓦片列表
     */
    private _getTilesToProcess;
    /**
     * 处理单个瓦片
     */
    private _processTile;
    /**
     * 检查是否需要清理缓存
     */
    private _checkCacheSize;
    /**
     * LRU 缓存淘汰
     */
    private _evictLRU;
    /**
     * 添加事件监听器
     */
    on(event: TileQueueEvent, listener: TileQueueEventListener): void;
    /**
     * 移除事件监听器
     */
    off(event: TileQueueEvent, listener: TileQueueEventListener): void;
    /**
     * 触发事件
     */
    private _emit;
    /**
     * 获取统计信息
     */
    getStats(): ITileStats;
    /**
     * 获取队列信息
     */
    getInfo(): {
        totalTiles: number;
        pendingTiles: number;
        loadingTiles: number;
        loadedTiles: number;
        failedTiles: number;
        cancelledTiles: number;
    };
    /**
     * 重试失败的瓦片
     */
    retryFailedTiles(): number;
    /**
     * 重置统计
     */
    resetStats(): void;
    /**
     * 销毁队列
     */
    dispose(): void;
}
//# sourceMappingURL=TileQueue.d.ts.map