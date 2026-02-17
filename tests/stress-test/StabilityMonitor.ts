/**
 * 稳定性监控器
 * 监控 CPU、内存、延迟、错误率、吞吐量等指标
 */

import os from 'os';
import v8 from 'v8';
import {
  MonitorConfig,
  DEFAULT_MONITOR_CONFIG,
  Metric,
  MetricType,
  MetricDataPoint,
  SystemResource,
  Alert,
} from './types.js';

/**
 * 稳定性监控器
 */
export class StabilityMonitor {
  private _config: MonitorConfig;
  private _running: boolean = false;
  private _metrics: Map<MetricType, Metric> = new Map();
  private _resources: SystemResource[] = [];
  private _alerts: Alert[] = [];
  private _monitorInterval?: NodeJS.Timeout;
  private _initialMemory: number = 0;

  constructor(config?: Partial<MonitorConfig>) {
    this._config = { ...DEFAULT_MONITOR_CONFIG, ...config };
    this._initialMemory = this._getMemoryUsage().heapUsed;
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<MonitorConfig>): void {
    this._config = { ...this._config, ...config };
  }

  /**
   * 获取配置
   */
  getConfig(): MonitorConfig {
    return { ...this._config };
  }

  /**
   * 开始监控
   */
  start(): void {
    if (this._running) {
      throw new Error('Monitor is already running');
    }

    this._running = true;
    this._metrics.clear();
    this._resources = [];
    this._alerts = [];

    // 启动定期监控
    this._monitorInterval = setInterval(() => {
      this._collectMetrics();
    }, this._config.samplingInterval);

    console.log(`Stability monitor started (interval: ${this._config.samplingInterval}ms)`);
  }

  /**
   * 停止监控
   */
  stop(): void {
    this._running = false;
    if (this._monitorInterval) {
      clearInterval(this._monitorInterval);
      this._monitorInterval = undefined;
    }

    console.log('Stability monitor stopped');
  }

  /**
   * 是否正在运行
   */
  isRunning(): boolean {
    return this._running;
  }

  /**
   * 记录指标
   */
  recordMetric(type: MetricType, value: number, metadata?: Record<string, any>): void {
    if (!this._metrics.has(type)) {
      this._metrics.set(type, {
        type,
        name: type,
        data: [],
        statistics: {
          min: Infinity,
          max: -Infinity,
          avg: 0,
          p50: 0,
          p95: 0,
          p99: 0,
          stdDev: 0,
        },
      });
    }

    const metric = this._metrics.get(type)!;
    metric.data.push({
      timestamp: Date.now(),
      value,
      metadata,
    });

    // 更新统计数据
    this._updateStatistics(metric);

    // 检查告警
    this._checkAlerts(type, value);
  }

  /**
   * 记录延迟
   */
  recordLatency(latency: number): void {
    this.recordMetric(MetricType.LATENCY, latency);
  }

  /**
   * 记录错误
   */
  recordError(): void {
    const errorMetric = this._metrics.get(MetricType.ERROR_RATE);
    if (errorMetric) {
      const lastValue = errorMetric.data[errorMetric.data.length - 1]?.value || 0;
      const newValue = lastValue + 1;
      this.recordMetric(MetricType.ERROR_RATE, newValue);
    } else {
      this.recordMetric(MetricType.ERROR_RATE, 1);
    }
  }

  /**
   * 记录吞吐量
   */
  recordThroughput(value: number): void {
    this.recordMetric(MetricType.THROUGHPUT, value);
  }

  /**
   * 记录 QPS
   */
  recordQPS(qps: number): void {
    this.recordMetric(MetricType.QPS, qps);
  }

  /**
   * 记录帧率
   */
  recordFrameRate(fps: number): void {
    this.recordMetric(MetricType.FRAME_RATE, fps);
  }

  /**
   * 获取指标
   */
  getMetric(type: MetricType): Metric | undefined {
    return this._metrics.get(type);
  }

  /**
   * 获取所有指标
   */
  getAllMetrics(): Map<MetricType, Metric> {
    return new Map(this._metrics);
  }

  /**
   * 获取资源使用历史
   */
  getResourceHistory(): SystemResource[] {
    return [...this._resources];
  }

  /**
   * 获取告警
   */
  getAlerts(): Alert[] {
    return [...this._alerts];
  }

  /**
   * 获取摘要
   */
  getSummary(): {
    cpuUsageAvg: number;
    cpuUsageMax: number;
    memoryUsageAvg: number;
    memoryUsageMax: number;
    memoryLeaked: number;
    alertCount: number;
    errorCount: number;
  } {
    const cpuValues = this._resources.map(r => r.cpuUsage);
    const memoryValues = this._resources.map(r => r.memoryUsage);

    const cpuUsageAvg = cpuValues.length > 0
      ? cpuValues.reduce((sum, v) => sum + v, 0) / cpuValues.length
      : 0;
    const cpuUsageMax = cpuValues.length > 0 ? Math.max(...cpuValues) : 0;

    const memoryUsageAvg = memoryValues.length > 0
      ? memoryValues.reduce((sum, v) => sum + v, 0) / memoryValues.length
      : 0;
    const memoryUsageMax = memoryValues.length > 0 ? Math.max(...memoryValues) : 0;

    const finalMemory = this._getMemoryUsage().heapUsed;
    const memoryLeaked = finalMemory - this._initialMemory;

    const errorCount = this._metrics.get(MetricType.ERROR_RATE)?.data.length || 0;

    return {
      cpuUsageAvg,
      cpuUsageMax,
      memoryUsageAvg,
      memoryUsageMax,
      memoryLeaked,
      alertCount: this._alerts.length,
      errorCount,
    };
  }

  /**
   * 生成报告
   */
  generateReport(): {
    metrics: Record<string, Metric>;
    resources: SystemResource[];
    alerts: Alert[];
    summary: ReturnType<StabilityMonitor['getSummary']>;
  } {
    const metrics: Record<string, Metric> = {};
    this._metrics.forEach((metric, type) => {
      metrics[type] = metric;
    });

    return {
      metrics,
      resources: this._resources,
      alerts: this._alerts,
      summary: this.getSummary(),
    };
  }

  /**
   * 清理
   */
  dispose(): void {
    this.stop();
    this._metrics.clear();
    this._resources = [];
    this._alerts = [];
  }

  /**
   * 收集指标
   */
  private _collectMetrics(): void {
    const resource = this._collectSystemResources();
    this._resources.push(resource);

    // 记录 CPU 和内存使用率
    this.recordMetric(MetricType.CPU_USAGE, resource.cpuUsage);
    this.recordMetric(MetricType.MEMORY_USAGE, resource.memoryUsage);
  }

  /**
   * 收集系统资源
   */
  private _collectSystemResources(): SystemResource {
    const memoryUsage = this._getMemoryUsage();
    const cpus = os.cpus();
    const loadAvg = os.loadavg();

    // 计算平均 CPU 使用率（简化版）
    const cpuUsage = this._calculateCPUUsage();

    return {
      timestamp: Date.now(),
      cpuUsage,
      memoryUsage: memoryUsage.heapUsed / memoryUsage.heapTotal,
      memoryUsed: memoryUsage.heapUsed,
      memoryTotal: memoryUsage.heapTotal,
      loadAverage: loadAvg,
    };
  }

  /**
   * 获取内存使用
   */
  private _getMemoryUsage(): {
    heapUsed: number;
    heapTotal: number;
    rss: number;
  } {
    const heapStats = v8.getHeapStatistics();
    const memoryUsage = process.memoryUsage();

    return {
      heapUsed: heapStats.used_heap_size,
      heapTotal: heapStats.total_heap_size,
      rss: memoryUsage.rss,
    };
  }

  /**
   * 计算 CPU 使用率
   */
  private _calculateCPUUsage(): number {
    // 简化版：使用 load average
    const loadAvg = os.loadavg()[0];
    const cpuCount = os.cpus().length;

    // load average / cpu count 给出大致的 CPU 使用率
    const cpuUsage = Math.min(1, loadAvg / cpuCount);

    return cpuUsage;
  }

  /**
   * 更新统计数据
   */
  private _updateStatistics(metric: Metric): void {
    const values = metric.data.map(d => d.value);
    if (values.length === 0) return;

    metric.statistics.min = Math.min(...values);
    metric.statistics.max = Math.max(...values);
    metric.statistics.avg = values.reduce((sum, v) => sum + v, 0) / values.length;

    // 计算百分位
    const sorted = [...values].sort((a, b) => a - b);
    metric.statistics.p50 = this._percentile(sorted, 50);
    metric.statistics.p95 = this._percentile(sorted, 95);
    metric.statistics.p99 = this._percentile(sorted, 99);

    // 计算标准差
    const variance = values.reduce((sum, v) => sum + (v - metric.statistics.avg) ** 2, 0) / values.length;
    metric.statistics.stdDev = Math.sqrt(variance);
  }

  /**
   * 检查告警
   */
  private _checkAlerts(type: MetricType, value: number): void {
    const thresholds = this._config.alertThresholds;
    let shouldAlert = false;
    let alertType: 'warning' | 'error' | 'critical' = 'warning';
    let message = '';

    switch (type) {
      case MetricType.CPU_USAGE:
        if (value > thresholds.cpuUsage) {
          shouldAlert = true;
          alertType = value > thresholds.cpuUsage * 1.2 ? 'critical' : 'error';
          message = `CPU usage is ${(value * 100).toFixed(1)}%`;
        }
        break;
      case MetricType.MEMORY_USAGE:
        if (value > thresholds.memoryUsage) {
          shouldAlert = true;
          alertType = value > thresholds.memoryUsage * 1.1 ? 'critical' : 'error';
          message = `Memory usage is ${(value * 100).toFixed(1)}%`;
        }
        break;
      case MetricType.LATENCY:
        if (value > thresholds.latency) {
          shouldAlert = true;
          alertType = value > thresholds.latency * 2 ? 'critical' : 'error';
          message = `Latency is ${value.toFixed(0)}ms`;
        }
        break;
      case MetricType.ERROR_RATE:
        if (value > thresholds.errorRate) {
          shouldAlert = true;
          alertType = value > thresholds.errorRate * 2 ? 'critical' : 'error';
          message = `Error rate is ${(value * 100).toFixed(1)}%`;
        }
        break;
    }

    if (shouldAlert) {
      this._alerts.push({
        timestamp: Date.now(),
        type: alertType,
        metric: type,
        message,
        value,
        threshold: thresholds[type as keyof typeof thresholds] as number,
      });

      console.warn(`[ALERT] ${type}: ${message}`);
    }
  }

  /**
   * 计算百分位
   */
  private _percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const index = Math.ceil((p / 100) * values.length) - 1;
    return values[Math.max(0, Math.min(index, values.length - 1))];
  }
}
