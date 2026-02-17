/**
 * 性能监控器
 */
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private maxSamples = 1000;

  /**
   * 记录操作耗时
   */
  record(operation: string, duration: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    const samples = this.metrics.get(operation)!;
    samples.push(duration);

    // 限制样本数量
    if (samples.length > this.maxSamples) {
      samples.shift();
    }
  }

  /**
   * 获取 P95 延迟
   */
  getP95(operation: string): number {
    const samples = this.metrics.get(operation);
    if (!samples || samples.length === 0) {
      return 0;
    }

    const sorted = [...samples].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * 0.95);
    return sorted[index];
  }

  /**
   * 获取 P50 延迟
   */
  getP50(operation: string): number {
    const samples = this.metrics.get(operation);
    if (!samples || samples.length === 0) {
      return 0;
    }

    const sorted = [...samples].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * 0.5);
    return sorted[index];
  }

  /**
   * 获取平均延迟
   */
  getAverage(operation: string): number {
    const samples = this.metrics.get(operation);
    if (!samples || samples.length === 0) {
      return 0;
    }

    const sum = samples.reduce((a, b) => a + b, 0);
    return sum / samples.length;
  }

  /**
   * 获取最大延迟
   */
  getMax(operation: string): number {
    const samples = this.metrics.get(operation);
    if (!samples || samples.length === 0) {
      return 0;
    }

    return Math.max(...samples);
  }

  /**
   * 获取最小延迟
   */
  getMin(operation: string): number {
    const samples = this.metrics.get(operation);
    if (!samples || samples.length === 0) {
      return 0;
    }

    return Math.min(...samples);
  }

  /**
   * 获取样本数量
   */
  getSampleCount(operation: string): number {
    return this.metrics.get(operation)?.length || 0;
  }

  /**
   * 清除所有指标
   */
  clear(): void {
    this.metrics.clear();
  }

  /**
   * 清除指定操作的指标
   */
  clearOperation(operation: string): void {
    this.metrics.delete(operation);
  }

  /**
   * 获取所有操作的指标摘要
   */
  getSummary(): Record<string, { p50: number; p95: number; avg: number; min: number; max: number; samples: number }> {
    const summary: Record<string, any> = {};
    this.metrics.forEach((samples, operation) => {
      summary[operation] = {
        p50: this.getP50(operation),
        p95: this.getP95(operation),
        avg: this.getAverage(operation),
        min: this.getMin(operation),
        max: this.getMax(operation),
        samples: samples.length,
      };
    });
    return summary;
  }

  /**
   * 测量操作耗时
   */
  async measure<T>(operation: string, fn: () => T | Promise<T>): Promise<T> {
    const startTime = performance.now();
    const result = await fn();
    const endTime = performance.now();
    this.record(operation, endTime - startTime);
    return result;
  }
}
