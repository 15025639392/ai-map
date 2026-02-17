import type { ITileStats } from './types.js';
/**
 * 瓦片性能统计类
 */
export declare class TileStats {
    private _loadTimes;
    private _totalRequests;
    private _successRequests;
    private _failedRequests;
    private _cancelledRequests;
    /**
     * 记录瓦片加载时间
     */
    recordLoadTime(loadTime: number): void;
    /**
     * 记录请求开始
     */
    recordRequestStart(): void;
    /**
     * 记录请求成功
     */
    recordRequestSuccess(): void;
    /**
     * 记录请求失败
     */
    recordRequestFailed(): void;
    /**
     * 记录请求取消
     */
    recordRequestCancelled(): void;
    /**
     * 计算百分位数
     */
    private _percentile;
    /**
     * 计算平均值
     */
    private _average;
    /**
     * 清理旧数据
     */
    prune(maxSamples?: number): void;
    /**
     * 重置统计
     */
    reset(): void;
    /**
     * 获取统计信息
     */
    getStats(): Omit<ITileStats, 'queueLength' | 'loadingCount'>;
}
//# sourceMappingURL=TileStats.d.ts.map