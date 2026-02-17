import type { ITile, ITileRequestConfig } from './types.js';
/**
 * 瓦片请求管理器
 * 负责管理瓦片请求生命周期、取消操作和失败重试
 */
export declare class TileRequestManager {
    private _config;
    private _requests;
    private _activeRequests;
    private _stats;
    constructor(config: ITileRequestConfig);
    /**
     * 请求瓦片
     */
    request(tile: ITile): Promise<void>;
    /**
     * 带重试的加载
     */
    private _loadWithRetry;
    /**
     * 带超时的加载
     */
    private _loadWithTimeout;
    /**
     * 等待并发限制
     */
    private _waitForConcurrency;
    /**
     * 取消瓦片请求
     */
    cancel(requestId: string): boolean;
    /**
     * 批量取消请求
     */
    cancelBatch(requestIds: string[]): number;
    /**
     * 取消所有请求
     */
    cancelAll(): number;
    /**
     * 获取瓦片状态
     */
    getTile(requestId: string): ITile | undefined;
    /**
     * 获取活动请求数量
     */
    getActiveCount(): number;
    /**
     * 获取队列长度
     */
    getQueueLength(): number;
    /**
     * 检查是否正在请求
     */
    isRequesting(requestId: string): boolean;
    /**
     * 获取统计信息
     */
    getStats(): {
        queueLength: number;
        loadingCount: number;
        totalRequests: number;
        successRequests: number;
        failedRequests: number;
        cancelledRequests: number;
        averageLoadTime: number;
        p50: number;
        p95: number;
        p99: number;
    };
    /**
     * 重置统计
     */
    resetStats(): void;
    /**
     * 清理所有请求
     */
    dispose(): void;
}
//# sourceMappingURL=TileRequestManager.d.ts.map