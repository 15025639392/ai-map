/**
 * 压力测试运行器
 * 整合负载生成和监控，支持 8 小时长期运行测试
 */

import { LoadGenerator } from './LoadGenerator.js';
import { StabilityMonitor } from './StabilityMonitor.js';
import { StressTestReporter } from './StressTestReporter.js';
import {
  LoadConfig,
  MonitorConfig,
  StressScenario,
  StressTestResult,
  TestSummary,
  MetricType,
  STRESS_TEST_TARGETS,
} from './types.js';

/**
 * 压力测试运行器
 */
export class StressTestRunner {
  private _loadGenerator: LoadGenerator;
  private _monitor: StabilityMonitor;
  private _reporter: StressTestReporter;
  private _running: boolean = false;
  private _aborted: boolean = false;
  private _abortController?: AbortController;
  private _startTime: number = 0;

  constructor(
    loadConfig?: Partial<LoadConfig>,
    monitorConfig?: Partial<MonitorConfig>
  ) {
    this._loadGenerator = new LoadGenerator(loadConfig);
    this._monitor = new StabilityMonitor(monitorConfig);
    this._reporter = new StressTestReporter();
  }

  /**
   * 运行压力测试
   */
  async run(
    scenario: StressScenario,
    requestFn: (requestId: number) => Promise<void>
  ): Promise<StressTestResult> {
    if (this._running) {
      throw new Error('Stress test is already running');
    }

    this._running = true;
    this._startTime = Date.now();
    this._abortController = new AbortController();

    console.log(`Starting stress test: ${scenario}`);
    console.log(`Load config:`, this._loadGenerator.getConfig());
    console.log(`Monitor config:`, this._monitor.getConfig());

    // 启动监控
    this._monitor.start();

    // 运行负载测试
    try {
      await this._runLoadTest(scenario, requestFn, this._abortController.signal);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Stress test aborted');
      } else {
        console.error('Stress test error:', error);
        throw error;
      }
    }

    // 停止监控
    this._monitor.stop();

    // 生成测试结果
    const result = this._generateResult(scenario);
    this._running = false;

    return result;
  }

  /**
   * 运行长时间稳定性测试（8小时）
   */
  async runStabilityTest(
    scenario: StressScenario,
    requestFn: (requestId: number) => Promise<void>,
    config?: {
      qps?: number;
      duration?: number;
      reportInterval?: number;
    }
  ): Promise<StressTestResult> {
    const qps = config?.qps || STRESS_TEST_TARGETS.HIGH_LOAD.qps;
    const duration = config?.duration || STRESS_TEST_TARGETS.HIGH_LOAD.duration;
    const reportInterval = config?.reportInterval || 60 * 60 * 1000; // 每小时报告一次

    console.log(`Starting 8-hour stability test: ${scenario}`);
    console.log(`Target: ${qps} QPS for ${duration / 3600} hours`);

    // 更新配置
    this._loadGenerator.updateConfig({
      targetQPS: qps,
      duration: duration,
    });

    // 设置定期报告
    const reportTimer = setInterval(() => {
      const elapsed = Date.now() - this._startTime;
      const progress = (elapsed / (duration * 1000)) * 100;
      console.log(`Progress: ${progress.toFixed(1)}% (${(elapsed / 1000 / 60).toFixed(0)}min / ${(duration / 60).toFixed(0)}min)`);

      // 生成中间报告
      const partialResult = this._generateResult(scenario);
      console.log(`Current QPS: ${partialResult.summary.avgQPS.toFixed(0)}`);
      console.log(`Current Error Rate: ${(partialResult.summary.errorRate * 100).toFixed(2)}%`);
      console.log(`Current Memory: ${(partialResult.summary.cpuUsageAvg! * 100).toFixed(1)}% CPU`);
    }, reportInterval);

    try {
      // 运行完整测试
      const result = await this.run(scenario, requestFn);
      clearInterval(reportTimer);
      return result;
    } catch (error) {
      clearInterval(reportTimer);
      throw error;
    }
  }

  /**
   * 运行快速压力测试（用于调试）
   */
  async runQuickTest(
    scenario: StressScenario,
    requestFn: (requestId: number) => Promise<void>,
    config?: {
      qps?: number;
      duration?: number;
    }
  ): Promise<StressTestResult> {
    const qps = config?.qps || 1000;
    const duration = config?.duration || 60; // 1 分钟

    console.log(`Running quick test: ${scenario} (${qps} QPS, ${duration}s)`);

    this._loadGenerator.updateConfig({
      targetQPS: qps,
      duration: duration,
    });

    return this.run(scenario, requestFn);
  }

  /**
   * 中止测试
   */
  abort(): void {
    if (this._abortController) {
      this._abortController.abort();
      this._aborted = true;
    }
    this._loadGenerator.stop();
    this._monitor.stop();
    this._running = false;
  }

  /**
   * 是否正在运行
   */
  isRunning(): boolean {
    return this._running;
  }

  /**
   * 生成测试报告
   */
  generateReport(result: StressTestResult, outputPath?: string): Promise<string> {
    return this._reporter.generateReport(result, outputPath);
  }

  /**
   * 获取实时统计
   */
  getRealtimeStats(): {
    qps: number;
    errorRate: number;
    avgLatency: number;
    cpuUsage: number;
    memoryUsage: number;
  } {
    const loadStats = this._loadGenerator.getStats();
    const monitorSummary = this._monitor.getSummary();

    return {
      qps: loadStats.avgQPS,
      errorRate: loadStats.errorRate,
      avgLatency: loadStats.avgLatency,
      cpuUsage: monitorSummary.cpuUsageAvg,
      memoryUsage: monitorSummary.memoryUsageAvg,
    };
  }

  /**
   * 运行负载测试
   */
  private async _runLoadTest(
    scenario: StressScenario,
    requestFn: (requestId: number) => Promise<void>,
    signal: AbortSignal
  ): Promise<void> {
    // 包装请求函数以收集指标
    const monitoredRequestFn = async (requestId: number): Promise<void> => {
      const startTime = Date.now();

      try {
        await requestFn(requestId);
        const latency = Date.now() - startTime;
        this._monitor.recordLatency(latency);
      } catch (error) {
        this._monitor.recordError();
        throw error;
      }
    };

    // 运行负载生成器
    await this._loadGenerator.start(monitoredRequestFn);
  }

  /**
   * 生成测试结果
   */
  private _generateResult(scenario: StressScenario): StressTestResult {
    const endTime = Date.now();
    const duration = (endTime - this._startTime) / 1000;
    const loadStats = this._loadGenerator.getStats();
    const monitorReport = this._monitor.generateReport();
    const monitorSummary = this._monitor.getSummary();

    // 构建指标映射
    const metrics: Record<MetricType, any> = {} as any;
    monitorReport.metrics[`${MetricType.LATENCY}`] && (metrics[MetricType.LATENCY] = monitorReport.metrics[`${MetricType.LATENCY}`]);
    monitorReport.metrics[`${MetricType.QPS}`] && (metrics[MetricType.QPS] = monitorReport.metrics[`${MetricType.QPS}`]);
    monitorReport.metrics[`${MetricType.CPU_USAGE}`] && (metrics[MetricType.CPU_USAGE] = monitorReport.metrics[`${MetricType.CPU_USAGE}`]);
    monitorReport.metrics[`${MetricType.MEMORY_USAGE}`] && (metrics[MetricType.MEMORY_USAGE] = monitorReport.metrics[`${MetricType.MEMORY_USAGE}`]);

    // 构建摘要
    const summary: TestSummary = {
      totalRequests: loadStats.requestCount,
      successfulRequests: loadStats.successCount,
      failedRequests: loadStats.errorCount,
      errorRate: loadStats.errorRate,
      avgQPS: loadStats.avgQPS,
      peakQPS: loadStats.peakQPS,
      avgLatency: loadStats.avgLatency,
      p50Latency: loadStats.p50Latency,
      p95Latency: loadStats.p95Latency,
      p99Latency: loadStats.p99Latency,
      throughput: loadStats.avgQPS * (1 - loadStats.errorRate),
      cpuUsageAvg: monitorSummary.cpuUsageAvg,
      cpuUsageMax: monitorSummary.cpuUsageMax,
      memoryLeaked: monitorSummary.memoryLeaked,
    };

    // 判断测试状态
    const status: 'passed' | 'failed' | 'aborted' =
      this._aborted
        ? 'aborted'
        : loadStats.errorRate > 0.05 || monitorSummary.alertCount > 10
        ? 'failed'
        : 'passed';

    return {
      scenario,
      startTime: this._startTime,
      endTime,
      duration,
      config: this._loadGenerator.getConfig(),
      metrics,
      resources: monitorReport.resources,
      alerts: monitorReport.alerts,
      summary,
      status,
    };
  }

  /**
   * 清理
   */
  dispose(): void {
    this.abort();
    this._loadGenerator.dispose();
    this._monitor.dispose();
  }
}
