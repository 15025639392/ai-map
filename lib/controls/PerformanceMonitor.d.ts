/**
 * 性能监控器
 */
export declare class PerformanceMonitor {
    private metrics;
    private maxSamples;
    /**
     * 记录操作耗时
     */
    record(operation: string, duration: number): void;
    /**
     * 获取 P95 延迟
     */
    getP95(operation: string): number;
    /**
     * 获取 P50 延迟
     */
    getP50(operation: string): number;
    /**
     * 获取平均延迟
     */
    getAverage(operation: string): number;
    /**
     * 获取最大延迟
     */
    getMax(operation: string): number;
    /**
     * 获取最小延迟
     */
    getMin(operation: string): number;
    /**
     * 获取样本数量
     */
    getSampleCount(operation: string): number;
    /**
     * 清除所有指标
     */
    clear(): void;
    /**
     * 清除指定操作的指标
     */
    clearOperation(operation: string): void;
    /**
     * 获取所有操作的指标摘要
     */
    getSummary(): Record<string, {
        p50: number;
        p95: number;
        avg: number;
        min: number;
        max: number;
        samples: number;
    }>;
    /**
     * 测量操作耗时
     */
    measure<T>(operation: string, fn: () => T | Promise<T>): Promise<T>;
}
//# sourceMappingURL=PerformanceMonitor.d.ts.map