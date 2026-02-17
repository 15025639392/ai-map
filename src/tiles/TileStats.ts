import type { ITileStats } from './types.js';

/**
 * 瓦片性能统计类
 */
export class TileStats {
  private _loadTimes: number[] = [];
  private _totalRequests = 0;
  private _successRequests = 0;
  private _failedRequests = 0;
  private _cancelledRequests = 0;

  /**
   * 记录瓦片加载时间
   */
  recordLoadTime(loadTime: number): void {
    this._loadTimes.push(loadTime);
  }

  /**
   * 记录请求开始
   */
  recordRequestStart(): void {
    this._totalRequests++;
  }

  /**
   * 记录请求成功
   */
  recordRequestSuccess(): void {
    this._successRequests++;
  }

  /**
   * 记录请求失败
   */
  recordRequestFailed(): void {
    this._failedRequests++;
  }

  /**
   * 记录请求取消
   */
  recordRequestCancelled(): void {
    this._cancelledRequests++;
  }

  /**
   * 计算百分位数
   */
  private _percentile(p: number): number {
    if (this._loadTimes.length === 0) {
      return 0;
    }

    const sorted = [...this._loadTimes].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  /**
   * 计算平均值
   */
  private _average(): number {
    if (this._loadTimes.length === 0) {
      return 0;
    }
    return this._loadTimes.reduce((sum, time) => sum + time, 0) / this._loadTimes.length;
  }

  /**
   * 清理旧数据
   */
  prune(maxSamples: number = 1000): void {
    if (this._loadTimes.length > maxSamples) {
      this._loadTimes = this._loadTimes.slice(-maxSamples);
    }
  }

  /**
   * 重置统计
   */
  reset(): void {
    this._loadTimes = [];
    this._totalRequests = 0;
    this._successRequests = 0;
    this._failedRequests = 0;
    this._cancelledRequests = 0;
  }

  /**
   * 获取统计信息
   */
  getStats(): Omit<ITileStats, 'queueLength' | 'loadingCount'> {
    return {
      totalRequests: this._totalRequests,
      successRequests: this._successRequests,
      failedRequests: this._failedRequests,
      cancelledRequests: this._cancelledRequests,
      averageLoadTime: this._average(),
      p50: this._percentile(50),
      p95: this._percentile(95),
      p99: this._percentile(99),
    };
  }
}
