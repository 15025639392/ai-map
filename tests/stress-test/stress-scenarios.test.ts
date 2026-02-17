/**
 * 压力测试场景
 * 定义多个压力测试场景
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  LoadGenerator,
  StabilityMonitor,
  StressTestRunner,
  LoadPattern,
  StressScenario,
} from './index.js';

describe('LoadGenerator Tests', () => {
  let generator: LoadGenerator;

  beforeEach(() => {
    generator = new LoadGenerator({
      targetQPS: 100,
      duration: 5,
    });
  });

  afterEach(() => {
    generator.dispose();
  });

  it('should generate constant load', async () => {
    const requests: number[] = [];
    const requestFn = async (requestId: number) => {
      requests.push(requestId);
      await new Promise(resolve => setTimeout(resolve, 1));
    };

    await generator.start(requestFn);

    const stats = generator.getStats();
    expect(stats.requestCount).toBeGreaterThan(0);
    expect(stats.avgQPS).toBeGreaterThan(0);
  }, 10000); // 10秒超时

  it('should calculate latency correctly', async () => {
    const requestFn = async (requestId: number) => {
      await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 20));
    };

    await generator.start(requestFn);

    const stats = generator.getStats();
    expect(stats.avgLatency).toBeGreaterThan(10);
    expect(stats.p95Latency).toBeGreaterThanOrEqual(stats.avgLatency);
  }, 10000); // 10秒超时

  it('should handle errors', async () => {
    let errorCount = 0;
    const requestFn = async (requestId: number) => {
      if (requestId % 10 === 0) {
        errorCount++;
        throw new Error('Simulated error');
      }
      await new Promise(resolve => setTimeout(resolve, 1));
    };

    await generator.start(requestFn);

    const stats = generator.getStats();
    expect(stats.errorCount).toBeGreaterThan(0);
    expect(stats.errorRate).toBeGreaterThan(0);
  }, 10000); // 10秒超时
});

describe('StabilityMonitor Tests', () => {
  let monitor: StabilityMonitor;

  beforeEach(() => {
    monitor = new StabilityMonitor({
      samplingInterval: 100,
      enableProfiling: false,
    });
    monitor.start();
  });

  afterEach(() => {
    monitor.dispose();
  });

  it('should record metrics', () => {
    monitor.recordLatency(100);
    monitor.recordLatency(200);
    monitor.recordLatency(150);

    const latencyMetric = monitor.getMetric('latency');
    expect(latencyMetric).toBeDefined();
    expect(latencyMetric!.data.length).toBe(3);
  });

  it('should calculate statistics', () => {
    for (let i = 0; i < 100; i++) {
      monitor.recordLatency(i);
    }

    const latencyMetric = monitor.getMetric('latency');
    expect(latencyMetric!.statistics.min).toBe(0);
    expect(latencyMetric!.statistics.max).toBe(99);
    expect(latencyMetric!.statistics.avg).toBe(49.5);
  });

  it('should generate alerts', () => {
    monitor.updateConfig({
      alertThresholds: {
        cpuUsage: 0.5,
        memoryUsage: 0.5,
        latency: 50,
        errorRate: 0.05,
      },
    });

    monitor.recordLatency(100);
    monitor.recordLatency(150);

    const alerts = monitor.getAlerts();
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts.some(a => a.metric === 'latency')).toBe(true);
  });

  it('should track system resources', async () => {
    // 等待一下让监控收集一些数据
    await new Promise(resolve => setTimeout(resolve, 200));

    const resources = monitor.getResourceHistory();
    expect(resources.length).toBeGreaterThan(0);

    const latest = resources[resources.length - 1];
    expect(latest.cpuUsage).toBeGreaterThanOrEqual(0);
    expect(latest.cpuUsage).toBeLessThanOrEqual(1);
    expect(latest.memoryUsage).toBeGreaterThanOrEqual(0);
    expect(latest.memoryUsage).toBeLessThanOrEqual(1);
  });
});

describe('StressTestRunner Tests', () => {
  let runner: StressTestRunner;

  beforeEach(() => {
    runner = new StressTestRunner(
      {
        targetQPS: 50,
        duration: 2,
      },
      {
        samplingInterval: 100,
        enableProfiling: false,
      }
    );
  });

  afterEach(() => {
    runner.dispose();
  });

  it('should run stress test', async () => {
    const requestFn = async (requestId: number) => {
      await new Promise(resolve => setTimeout(resolve, 1 + Math.random() * 5));
    };

    const result = await runner.run(StressScenario.MIXED, requestFn);

    expect(result).toBeDefined();
    expect(result.scenario).toBe(StressScenario.MIXED);
    expect(result.duration).toBeGreaterThan(0);
    expect(result.summary.totalRequests).toBeGreaterThan(0);
    expect(result.summary.avgQPS).toBeGreaterThan(0);
  });

  it('should run quick test', async () => {
    const requestFn = async (requestId: number) => {
      await new Promise(resolve => setTimeout(resolve, 1));
    };

    // 创建新的 runner 实例
    const quickRunner = new StressTestRunner({
      targetQPS: 100,
      duration: 5,
    });

    const result = await quickRunner.run(StressScenario.RENDERING, requestFn);

    expect(result).toBeDefined();
    expect(result.duration).toBeLessThanOrEqual(10); // Quick test should be short

    quickRunner.dispose();
  }, 10000); // 10秒超时

  it('should track real-time stats', async () => {
    const requestFn = async (requestId: number) => {
      await new Promise(resolve => setTimeout(resolve, 1));
    };

    const runPromise = runner.run(StressScenario.API_CALLS, requestFn);

    // 等待一下获取实时统计
    await new Promise(resolve => setTimeout(resolve, 500));

    const stats = runner.getRealtimeStats();
    expect(stats.qps).toBeGreaterThanOrEqual(0);
    expect(stats.errorRate).toBeGreaterThanOrEqual(0);

    await runPromise;
  });

  it('should abort running test', async () => {
    const requestFn = async (requestId: number) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
    };

    const runPromise = runner.run(StressScenario.MIXED, requestFn);

    // 等待测试开始
    await new Promise(resolve => setTimeout(resolve, 100));

    // 中止测试
    runner.abort();

    const result = await runPromise;
    expect(result.status).toBe('aborted');
  });
});

describe('Stress Test Scenarios', () => {
  it('should test rendering scenario', async () => {
    const runner = new StressTestRunner({
      targetQPS: 20,
      duration: 1,
    });

    const requestFn = async (requestId: number) => {
      // 模拟渲染操作
      await new Promise(resolve => setTimeout(resolve, 1 + Math.random() * 3));
    };

    const result = await runner.run(StressScenario.RENDERING, requestFn);

    expect(result.scenario).toBe(StressScenario.RENDERING);
    expect(result.summary.avgLatency).toBeGreaterThan(0);
    expect(result.summary.errorRate).toBeLessThanOrEqual(0.05);

    runner.dispose();
  });

  it('should test tile loading scenario', async () => {
    const runner = new StressTestRunner({
      targetQPS: 10,
      duration: 1,
    });

    const requestFn = async (requestId: number) => {
      // 模拟瓦片加载
      await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 30));
    };

    const result = await runner.run(StressScenario.TILE_LOADING, requestFn);

    expect(result.scenario).toBe(StressScenario.TILE_LOADING);
    expect(result.summary.avgLatency).toBeGreaterThan(10);
    expect(result.summary.p95Latency).toBeGreaterThan(0);

    runner.dispose();
  });

  it('should test API calls scenario', async () => {
    const runner = new StressTestRunner({
      targetQPS: 50,
      duration: 1,
    });

    const requestFn = async (requestId: number) => {
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 1 + Math.random() * 5));
    };

    const result = await runner.run(StressScenario.API_CALLS, requestFn);

    expect(result.scenario).toBe(StressScenario.API_CALLS);
    expect(result.summary.avgQPS).toBeGreaterThan(0);
    expect(result.summary.avgQPS).toBeLessThanOrEqual(60);

    runner.dispose();
  });

  it('should test mixed scenario', async () => {
    const runner = new StressTestRunner({
      targetQPS: 30,
      duration: 1,
    });

    const requestFn = async (requestId: number) => {
      // 模拟混合操作
      const operations = [1, 10, 5, 20];
      const delay = operations[requestId % operations.length] + Math.random() * 5;
      await new Promise(resolve => setTimeout(resolve, delay));
    };

    const result = await runner.run(StressScenario.MIXED, requestFn);

    expect(result.scenario).toBe(StressScenario.MIXED);
    expect(result.summary.totalRequests).toBeGreaterThan(0);

    runner.dispose();
  });
});

describe('Load Pattern Tests', () => {
  it('should test ramp-up pattern', async () => {
    const runner = new StressTestRunner({
      pattern: LoadPattern.RAMP_UP,
      targetQPS: 100,
      duration: 2,
      rampUpDuration: 1,
    });

    const requestFn = async (requestId: number) => {
      await new Promise(resolve => setTimeout(resolve, 1));
    };

    const result = await runner.run(StressScenario.MIXED, requestFn);

    expect(result.config.pattern).toBe(LoadPattern.RAMP_UP);
    expect(result.summary.peakQPS).toBeGreaterThan(result.summary.avgQPS * 0.8);

    runner.dispose();
  });

  it('should test spike pattern', async () => {
    const runner = new StressTestRunner({
      pattern: LoadPattern.SPIKE,
      targetQPS: 100,
      duration: 3,
      spikeInterval: 1,
      spikeDuration: 0.5,
      minQPS: 20,
      maxQPS: 100,
    });

    const requestFn = async (requestId: number) => {
      await new Promise(resolve => setTimeout(resolve, 1));
    };

    const result = await runner.run(StressScenario.MIXED, requestFn);

    expect(result.config.pattern).toBe(LoadPattern.SPIKE);
    expect(result.summary.peakQPS).toBeGreaterThan(0);

    runner.dispose();
  });

  it('should test sine wave pattern', async () => {
    const runner = new StressTestRunner({
      pattern: LoadPattern.SINE_WAVE,
      targetQPS: 100,
      duration: 2,
      minQPS: 20,
      maxQPS: 100,
    });

    const requestFn = async (requestId: number) => {
      await new Promise(resolve => setTimeout(resolve, 1));
    };

    const result = await runner.run(StressScenario.MIXED, requestFn);

    expect(result.config.pattern).toBe(LoadPattern.SINE_WAVE);

    runner.dispose();
  });

  it('should test random pattern', async () => {
    const runner = new StressTestRunner({
      pattern: LoadPattern.RANDOM,
      targetQPS: 100,
      duration: 2,
      minQPS: 20,
      maxQPS: 100,
    });

    const requestFn = async (requestId: number) => {
      await new Promise(resolve => setTimeout(resolve, 1));
    };

    const result = await runner.run(StressScenario.MIXED, requestFn);

    expect(result.config.pattern).toBe(LoadPattern.RANDOM);

    runner.dispose();
  });
});
