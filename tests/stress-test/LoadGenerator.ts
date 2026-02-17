/**
 * 负载生成器
 * 支持生成 15k QPS 的高并发负载
 */

import {
  LoadConfig,
  LoadPattern,
  MetricDataPoint,
  MetricType,
  DEFAULT_LOAD_CONFIG,
} from './types.js';

/**
 * 负载生成器
 */
export class LoadGenerator {
  private _config: LoadConfig;
  private _running: boolean = false;
  private _currentQPS: number = 0;
  private _qpsHistory: MetricDataPoint[] = [];
  private _workerPool: Worker[] = [];
  private _requestCount: number = 0;
  private _successCount: number = 0;
  private _errorCount: number = 0;
  private _latencies: number[] = [];
  private _startTime: number = 0;

  constructor(config?: Partial<LoadConfig>) {
    this._config = { ...DEFAULT_LOAD_CONFIG, ...config };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<LoadConfig>): void {
    this._config = { ...this._config, ...config };
  }

  /**
   * 获取配置
   */
  getConfig(): LoadConfig {
    return { ...this._config };
  }

  /**
   * 开始生成负载
   */
  async start(requestFn: (requestId: number) => Promise<void>): Promise<void> {
    if (this._running) {
      throw new Error('Load generator is already running');
    }

    this._running = true;
    this._startTime = Date.now();
    this._requestCount = 0;
    this._successCount = 0;
    this._errorCount = 0;
    this._latencies = [];
    this._qpsHistory = [];

    // 启动 QPS 监控
    const monitorInterval = setInterval(() => {
      this._recordQPS();
    }, 1000);

    // 启动负载生成
    switch (this._config.pattern) {
      case LoadPattern.RAMP_UP:
        await this._rampUpLoad(requestFn);
        break;
      case LoadPattern.SPIKE:
        await this._spikeLoad(requestFn);
        break;
      case LoadPattern.SINE_WAVE:
        await this._sineWaveLoad(requestFn);
        break;
      case LoadPattern.RANDOM:
        await this._randomLoad(requestFn);
        break;
      case LoadPattern.CONSTANT:
      default:
        await this._constantLoad(requestFn);
        break;
    }

    // 清理
    clearInterval(monitorInterval);
    this._running = false;
  }

  /**
   * 停止生成负载
   */
  stop(): void {
    this._running = false;
    this._workerPool.forEach(worker => worker.terminate());
    this._workerPool = [];
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    requestCount: number;
    successCount: number;
    errorCount: number;
    errorRate: number;
    avgQPS: number;
    peakQPS: number;
    avgLatency: number;
    p50Latency: number;
    p95Latency: number;
    p99Latency: number;
  } {
    const errorRate = this._requestCount > 0
      ? this._errorCount / this._requestCount
      : 0;

    const sortedLatencies = [...this._latencies].sort((a, b) => a - b);
    const avgLatency = sortedLatencies.length > 0
      ? sortedLatencies.reduce((sum, lat) => sum + lat, 0) / sortedLatencies.length
      : 0;

    const p50Latency = this._percentile(sortedLatencies, 50);
    const p95Latency = this._percentile(sortedLatencies, 95);
    const p99Latency = this._percentile(sortedLatencies, 99);

    const qpsValues = this._qpsHistory.map(d => d.value);
    const avgQPS = qpsValues.length > 0
      ? qpsValues.reduce((sum, qps) => sum + qps, 0) / qpsValues.length
      : 0;
    const peakQPS = qpsValues.length > 0
      ? Math.max(...qpsValues)
      : 0;

    return {
      requestCount: this._requestCount,
      successCount: this._successCount,
      errorCount: this._errorCount,
      errorRate,
      avgQPS,
      peakQPS,
      avgLatency,
      p50Latency,
      p95Latency,
      p99Latency,
    };
  }

  /**
   * 获取 QPS 历史
   */
  getQPSHistory(): MetricDataPoint[] {
    return [...this._qpsHistory];
  }

  /**
   * 获取延迟历史
   */
  getLatencyHistory(): number[] {
    return [...this._latencies];
  }

  /**
   * 是否正在运行
   */
  isRunning(): boolean {
    return this._running;
  }

  /**
   * 持续负载
   */
  private async _constantLoad(requestFn: (requestId: number) => Promise<void>): Promise<void> {
    const requestInterval = 1000 / this._config.targetQPS;
    let requestId = 0;

    while (this._running && Date.now() - this._startTime < this._config.duration * 1000) {
      const promises: Promise<void>[] = [];

      // 批量发送请求以提高效率
      const batchSize = Math.max(1, Math.floor(this._config.targetQPS / 100));
      const batchInterval = requestInterval / batchSize;

      for (let i = 0; i < batchSize && this._running; i++) {
        const startTime = Date.now();
        const currentRequestId = requestId++;

        promises.push(
          requestFn(currentRequestId)
            .then(() => {
              this._successCount++;
              this._latencies.push(Date.now() - startTime);
            })
            .catch((error) => {
              this._errorCount++;
              console.error(`Request ${currentRequestId} failed:`, error);
            })
            .finally(() => {
              this._requestCount++;
            })
        );
      }

      await Promise.all(promises);

      // 控制请求速率
      if (batchInterval > 0) {
        await this._sleep(batchInterval);
      }
    }
  }

  /**
   * 阶梯式负载
   */
  private async _rampUpLoad(requestFn: (requestId: number) => Promise<void>): Promise<void> {
    const rampUpDuration = this._config.rampUpDuration || this._config.duration / 2;
    const steps = 10;
    const stepDuration = rampUpDuration / steps / 1000;
    let requestId = 0;

    for (let step = 1; step <= steps; step++) {
      const targetQPS = (this._config.targetQPS / steps) * step;
      console.log(`Ramping up to ${targetQPS.toFixed(0)} QPS (step ${step}/${steps})`);

      const stepStartTime = Date.now();
      while (this._running && Date.now() - stepStartTime < stepDuration * 1000) {
        const requestInterval = 1000 / targetQPS;

        await this._executeRequest(requestFn, requestId++);
        await this._sleep(requestInterval);
      }
    }

    // 保持目标 QPS 运行剩余时间
    const remainingTime = this._config.duration - rampUpDuration;
    if (remainingTime > 0) {
      this._config.targetQPS = this._config.targetQPS;
      await this._constantLoad(requestFn);
    }
  }

  /**
   * 突发式负载
   */
  private async _spikeLoad(requestFn: (requestId: number) => Promise<void>): Promise<void> {
    const spikeInterval = this._config.spikeInterval || 60;
    const spikeDur = this._config.spikeDuration || 10;
    const baseQPS = this._config.minQPS || 100;
    const spikeQPS = this._config.maxQPS || this._config.targetQPS;
    let requestId = 0;

    while (this._running && Date.now() - this._startTime < this._config.duration * 1000) {
      const cycleTime = (Date.now() - this._startTime) / 1000;
      const inSpike = cycleTime % spikeInterval < spikeDur;

      const currentQPS = inSpike ? spikeQPS : baseQPS;
      console.log(`QPS: ${currentQPS.toFixed(0)} (${inSpike ? 'SPIKE' : 'BASE'})`);

      const cycleDuration = inSpike ? spikeDur : spikeInterval - spikeDur;

      while (this._running && Date.now() - this._startTime < (cycleTime + cycleDuration) * 1000) {
        const requestInterval = 1000 / currentQPS;
        await this._executeRequest(requestFn, requestId++);
        await this._sleep(requestInterval);
      }
    }
  }

  /**
   * 正弦波式负载
   */
  private async _sineWaveLoad(requestFn: (requestId: number) => Promise<void>): Promise<void> {
    const minQPS = this._config.minQPS || 100;
    const maxQPS = this._config.maxQPS || this._config.targetQPS;
    const period = this._config.duration / 4;  // 4 个周期
    let requestId = 0;

    while (this._running && Date.now() - this._startTime < this._config.duration * 1000) {
      const elapsed = (Date.now() - this._startTime) / 1000;
      const phase = (elapsed % period) / period * 2 * Math.PI;
      const currentQPS = minQPS + (maxQPS - minQPS) * (Math.sin(phase) + 1) / 2;

      console.log(`QPS: ${currentQPS.toFixed(0)} (Sine wave)`);

      const requestInterval = 1000 / currentQPS;
      await this._executeRequest(requestFn, requestId++);
      await this._sleep(requestInterval);
    }
  }

  /**
   * 随机负载
   */
  private async _randomLoad(requestFn: (requestId: number) => Promise<void>): Promise<void> {
    const minQPS = this._config.minQPS || 100;
    const maxQPS = this._config.maxQPS || this._config.targetQPS;
    let requestId = 0;

    while (this._running && Date.now() - this._startTime < this._config.duration * 1000) {
      const currentQPS = minQPS + Math.random() * (maxQPS - minQPS);

      const requestInterval = 1000 / currentQPS;
      await this._executeRequest(requestFn, requestId++);
      await this._sleep(requestInterval);
    }
  }

  /**
   * 执行请求
   */
  private async _executeRequest(requestFn: (requestId: number) => Promise<void>, requestId: number): Promise<void> {
    const startTime = Date.now();

    try {
      await requestFn(requestId);
      this._successCount++;
      this._latencies.push(Date.now() - startTime);
    } catch (error) {
      this._errorCount++;
      console.error(`Request ${requestId} failed:`, error);
    }

    this._requestCount++;
  }

  /**
   * 记录 QPS
   */
  private _recordQPS(): void {
    const elapsed = Date.now() - this._startTime;
    const qps = this._requestCount / (elapsed / 1000);

    this._qpsHistory.push({
      timestamp: Date.now(),
      value: qps,
    });

    this._currentQPS = qps;
  }

  /**
   * 计算百分位
   */
  private _percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const index = Math.ceil((p / 100) * values.length) - 1;
    return values[Math.max(0, Math.min(index, values.length - 1))];
  }

  /**
   * 延迟函数
   */
  private _sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.stop();
    this._qpsHistory = [];
    this._latencies = [];
  }
}
