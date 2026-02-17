import { describe, it, expect } from 'vitest';
import { PerformanceMonitor } from '../../src/controls/PerformanceMonitor.js';

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  afterEach(() => {
    monitor.clear();
  });

  describe('记录性能数据', () => {
    it('应该能够记录操作耗时', () => {
      monitor.record('test-operation', 10);
      monitor.record('test-operation', 20);
      monitor.record('test-operation', 30);

      expect(monitor.getSampleCount('test-operation')).toBe(3);
    });

    it('应该能够记录不同操作的数据', () => {
      monitor.record('operation1', 10);
      monitor.record('operation2', 20);

      expect(monitor.getSampleCount('operation1')).toBe(1);
      expect(monitor.getSampleCount('operation2')).toBe(1);
    });

    it('应该限制样本数量', () => {
      // 添加超过1000个样本
      for (let i = 0; i < 1100; i++) {
        monitor.record('test-operation', i);
      }

      expect(monitor.getSampleCount('test-operation')).toBe(1000);
    });

    it('新样本应该覆盖旧样本', () => {
      for (let i = 0; i < 1050; i++) {
        monitor.record('test-operation', i);
      }

      // 最后50个样本应该是1000-1049
      expect(monitor.getMin('test-operation')).toBeGreaterThanOrEqual(50);
      expect(monitor.getMax('test-operation')).toBe(1049);
    });
  });

  describe('计算统计指标', () => {
    beforeEach(() => {
      // 添加一些样本数据
      monitor.record('test-operation', 10);
      monitor.record('test-operation', 20);
      monitor.record('test-operation', 30);
      monitor.record('test-operation', 40);
      monitor.record('test-operation', 50);
      monitor.record('test-operation', 60);
      monitor.record('test-operation', 70);
      monitor.record('test-operation', 80);
      monitor.record('test-operation', 90);
      monitor.record('test-operation', 100);
    });

    it('应该能够计算P50', () => {
      const p50 = monitor.getP50('test-operation');
      expect(p50).toBe(60);
    });

    it('应该能够计算P95', () => {
      const p95 = monitor.getP95('test-operation');
      expect(p95).toBe(100);
    });

    it('应该能够计算平均值', () => {
      const avg = monitor.getAverage('test-operation');
      expect(avg).toBe(55);
    });

    it('应该能够获取最大值', () => {
      const max = monitor.getMax('test-operation');
      expect(max).toBe(100);
    });

    it('应该能够获取最小值', () => {
      const min = monitor.getMin('test-operation');
      expect(min).toBe(10);
    });

    it('应该能够获取样本数量', () => {
      const count = monitor.getSampleCount('test-operation');
      expect(count).toBe(10);
    });
  });

  describe('空数据处理', () => {
    it('没有数据时P50应该返回0', () => {
      expect(monitor.getP50('non-existent')).toBe(0);
    });

    it('没有数据时P95应该返回0', () => {
      expect(monitor.getP95('non-existent')).toBe(0);
    });

    it('没有数据时平均值应该返回0', () => {
      expect(monitor.getAverage('non-existent')).toBe(0);
    });

    it('没有数据时最大值应该返回0', () => {
      expect(monitor.getMax('non-existent')).toBe(0);
    });

    it('没有数据时最小值应该返回0', () => {
      expect(monitor.getMin('non-existent')).toBe(0);
    });

    it('没有数据时样本数量应该返回0', () => {
      expect(monitor.getSampleCount('non-existent')).toBe(0);
    });
  });

  describe('清空数据', () => {
    it('应该能够清空所有数据', () => {
      monitor.record('operation1', 10);
      monitor.record('operation2', 20);

      monitor.clear();

      expect(monitor.getSampleCount('operation1')).toBe(0);
      expect(monitor.getSampleCount('operation2')).toBe(0);
    });

    it('应该能够清空指定操作的数据', () => {
      monitor.record('operation1', 10);
      monitor.record('operation2', 20);

      monitor.clearOperation('operation1');

      expect(monitor.getSampleCount('operation1')).toBe(0);
      expect(monitor.getSampleCount('operation2')).toBe(1);
    });
  });

  describe('获取摘要', () => {
    beforeEach(() => {
      monitor.record('operation1', 10);
      monitor.record('operation1', 20);
      monitor.record('operation1', 30);
      monitor.record('operation2', 100);
      monitor.record('operation2', 200);
    });

    it('应该能够获取所有操作的摘要', () => {
      const summary = monitor.getSummary();

      expect(summary.operation1).toBeDefined();
      expect(summary.operation2).toBeDefined();
      expect(summary.operation1.samples).toBe(3);
      expect(summary.operation2.samples).toBe(2);
    });

    it('摘要应该包含所有统计指标', () => {
      const summary = monitor.getSummary();

      expect(summary.operation1.p50).toBe(20);
      expect(summary.operation1.p95).toBe(30);
      expect(summary.operation1.avg).toBe(20);
      expect(summary.operation1.min).toBe(10);
      expect(summary.operation1.max).toBe(30);
      expect(summary.operation1.samples).toBe(3);
    });
  });

  describe('measure方法', () => {
    it('应该能够测量同步函数的耗时', async () => {
      const result = await monitor.measure('test-operation', () => {
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      });

      expect(result).toBe(499500); // 0+1+2+...+999
      expect(monitor.getSampleCount('test-operation')).toBe(1);
      expect(monitor.getAverage('test-operation')).toBeGreaterThan(0);
    });

    it('应该能够测量异步函数的耗时', async () => {
      const result = await monitor.measure('test-operation', async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 'done';
      });

      expect(result).toBe('done');
      expect(monitor.getSampleCount('test-operation')).toBe(1);
      expect(monitor.getAverage('test-operation')).toBeGreaterThanOrEqual(10);
    });

    it('measure应该返回函数的结果', async () => {
      const result = await monitor.measure('test-operation', () => {
        return 'test-result';
      });

      expect(result).toBe('test-result');
    });
  });

  describe('性能要求验证', () => {
    it('应该能够验证P95 <= 120ms的要求', () => {
      // 添加一些性能数据，确保P95 <= 120ms
      for (let i = 0; i < 100; i++) {
        monitor.record('interaction', Math.random() * 100);
      }

      const p95 = monitor.getP95('interaction');
      expect(p95).toBeLessThanOrEqual(120);
    });

    it('应该能够检测不符合P95要求的数据', () => {
      // 添加一些超过120ms的数据
      for (let i = 0; i < 90; i++) {
        monitor.record('interaction', Math.random() * 50);
      }
      for (let i = 0; i < 10; i++) {
        monitor.record('interaction', 150 + Math.random() * 50);
      }

      const p95 = monitor.getP95('interaction');
      expect(p95).toBeGreaterThan(120);
    });

    it('应该能够验证不同操作的P95', () => {
      // 快速操作
      for (let i = 0; i < 100; i++) {
        monitor.record('fast', Math.random() * 10);
      }

      // 慢速操作
      for (let i = 0; i < 100; i++) {
        monitor.record('slow', Math.random() * 200);
      }

      expect(monitor.getP95('fast')).toBeLessThan(120);
      expect(monitor.getP95('slow')).toBeGreaterThan(120);
    });
  });
});
