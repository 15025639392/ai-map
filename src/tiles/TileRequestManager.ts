import type { ITile, ITileRequestConfig, TileLoadFunction, ITileCoord } from './types.js';
import { TileState } from './types.js';
import { TileStats } from './TileStats.js';

/**
 * 瓦片请求管理器
 * 负责管理瓦片请求生命周期、取消操作和失败重试
 */
export class TileRequestManager {
  private _config: Required<ITileRequestConfig>;
  private _requests: Map<string, ITile> = new Map();
  private _activeRequests: Set<string> = new Set();
  private _stats = new TileStats();

  constructor(config: ITileRequestConfig) {
    this._config = {
      maxConcurrent: config.maxConcurrent ?? 4,
      maxRetries: config.maxRetries ?? 3,
      retryDelayBase: config.retryDelayBase ?? 1000,
      retryDelayMax: config.retryDelayMax ?? 10000,
      requestTimeout: config.requestTimeout ?? 30000,
      loadFn: config.loadFn,
    };
  }

  /**
   * 请求瓦片
   */
  async request(tile: ITile): Promise<void> {
    // 检查是否已在队列中
    if (this._requests.has(tile.requestId)) {
      // 瓦片已在请求中，等待其完成
      return;
    }

    // 初始化瓦片状态
    tile.state = TileState.PENDING;
    tile.retryCount = 0;
    this._requests.set(tile.requestId, tile);

    // 尝试加载
    try {
      await this._loadWithRetry(tile);
    } catch (error) {
      // 记录失败
      tile.lastError = error as Error;
      tile.state = TileState.FAILED;
      this._stats.recordRequestFailed();
      throw error;
    } finally {
      this._requests.delete(tile.requestId);
      this._activeRequests.delete(tile.requestId);
    }
  }

  /**
   * 带重试的加载
   */
  private async _loadWithRetry(tile: ITile): Promise<void> {
    while (tile.retryCount <= this._config.maxRetries) {
      // 检查是否已取消
      if (tile.state === TileState.CANCELLED) {
        this._stats.recordRequestCancelled();
        throw new Error('Tile request cancelled');
      }

      // 检查并发限制
      await this._waitForConcurrency();

      // 标记为加载中
      tile.state = TileState.LOADING;
      this._activeRequests.add(tile.requestId);
      this._stats.recordRequestStart();

      const startTime = performance.now();

      try {
        // 执行加载
        const result = await this._loadWithTimeout(tile);

        // 记录加载时间
        const loadTime = performance.now() - startTime;
        tile.loadTime = loadTime;
        tile.state = TileState.LOADED;
        tile.data = result;
        this._stats.recordLoadTime(loadTime);
        this._stats.recordRequestSuccess();

        return;
      } catch (error) {
        // 重试
        tile.retryCount++;
        tile.lastError = error as Error;

        if (tile.retryCount <= this._config.maxRetries) {
          // 计算重试延迟（指数退避）
          const delay = Math.min(
            this._config.retryDelayBase * Math.pow(2, tile.retryCount - 1),
            this._config.retryDelayMax
          );

          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          // 超过最大重试次数
          throw error;
        }
      }
    }
  }

  /**
   * 带超时的加载
   */
  private async _loadWithTimeout(tile: ITile): Promise<any> {
    return Promise.race([
      this._config.loadFn(tile),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Tile request timeout')), this._config.requestTimeout)
      ),
    ]);
  }

  /**
   * 等待并发限制
   */
  private async _waitForConcurrency(): Promise<void> {
    if (this._activeRequests.size < this._config.maxConcurrent) {
      return;
    }

    // 等待直到有空闲位置
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this._activeRequests.size < this._config.maxConcurrent) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 10);
    });
  }

  /**
   * 取消瓦片请求
   */
  cancel(requestId: string): boolean {
    const tile = this._requests.get(requestId);
    if (!tile) {
      return false;
    }

    tile.state = TileState.CANCELLED;
    this._activeRequests.delete(requestId);
    this._stats.recordRequestCancelled();

    return true;
  }

  /**
   * 批量取消请求
   */
  cancelBatch(requestIds: string[]): number {
    let cancelledCount = 0;
    requestIds.forEach((requestId) => {
      if (this.cancel(requestId)) {
        cancelledCount++;
      }
    });
    return cancelledCount;
  }

  /**
   * 取消所有请求
   */
  cancelAll(): number {
    const cancelledCount = this._activeRequests.size;
    this._requests.forEach((tile) => {
      if (tile.state === TileState.LOADING || tile.state === TileState.PENDING) {
        tile.state = TileState.CANCELLED;
        this._stats.recordRequestCancelled();
      }
    });
    this._activeRequests.clear();
    return cancelledCount;
  }

  /**
   * 获取瓦片状态
   */
  getTile(requestId: string): ITile | undefined {
    return this._requests.get(requestId);
  }

  /**
   * 获取活动请求数量
   */
  getActiveCount(): number {
    return this._activeRequests.size;
  }

  /**
   * 获取队列长度
   */
  getQueueLength(): number {
    return this._requests.size - this._activeRequests.size;
  }

  /**
   * 检查是否正在请求
   */
  isRequesting(requestId: string): boolean {
    return this._activeRequests.has(requestId);
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const stats = this._stats.getStats();
    return {
      ...stats,
      queueLength: this.getQueueLength(),
      loadingCount: this.getActiveCount(),
    };
  }

  /**
   * 重置统计
   */
  resetStats(): void {
    this._stats.reset();
  }

  /**
   * 清理所有请求
   */
  dispose(): void {
    this.cancelAll();
    this._requests.clear();
  }
}
