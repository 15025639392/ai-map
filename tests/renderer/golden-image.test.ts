/**
 * Golden Image 测试示例
 * 演示如何使用 golden image 测试框架
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  GoldenImageTest,
  TestScenario,
  ComparisonAlgorithm,
} from '../golden-image/index.js';
import path from 'path';
import crypto from 'crypto';

/**
 * 创建测试场景
 */
function createTestScenarios(): TestScenario[] {
  return [
    {
      name: 'basic-canvas',
      description: 'Basic canvas rendering',
      width: 400,
      height: 300,
      tags: ['basic', 'canvas'],
      setup: async () => {
        // 设置测试环境
      },
      render: async () => {
        // 渲染场景（这里需要根据实际渲染器实现）
      },
      cleanup: async () => {
        // 清理测试环境
      },
    },
    {
      name: 'solid-color',
      description: 'Solid color rendering',
      width: 200,
      height: 200,
      tags: ['color', 'simple'],
      threshold: {
        algorithm: ComparisonAlgorithm.SSIM,
        threshold: 0.98,
      },
      setup: async () => {},
      render: async () => {},
      cleanup: async () => {},
    },
  ];
}

/**
 * 生成测试图像（模拟）
 */
function generateTestImage(width: number, height: number, color: string = '#ff0000'): Buffer {
  // 解析颜色
  let hex = color.replace('#', '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }

  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // 创建 RGBA buffer
  const buffer = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    buffer[i * 4] = r;
    buffer[i * 4 + 1] = g;
    buffer[i * 4 + 2] = b;
    buffer[i * 4 + 3] = 255; // Alpha
  }

  return buffer;
}

describe('Golden Image Tests', () => {
  let goldenImageTest: GoldenImageTest;

  beforeAll(async () => {
    goldenImageTest = new GoldenImageTest({
      outputDir: path.join(process.cwd(), 'test-results', 'golden-image'),
    });

    await goldenImageTest.initialize();
  });

  describe('GoldenImageComparator', () => {
    it('should compare identical images', async () => {
      const comparator = goldenImageTest.getComparator();
      const image = generateTestImage(100, 100, '#ff0000');

      const result = await comparator.compare(image, image);

      expect(result.passed).toBe(true);
      expect(result.diffLevel).toBe('identical');
      expect(result.pixelDiffCount).toBe(0);
      expect(result.ssim).toBeGreaterThan(0.99);
    });

    it('should detect differences in images', async () => {
      const comparator = goldenImageTest.getComparator();
      const image1 = generateTestImage(100, 100, '#ff0000');
      const image2 = generateTestImage(100, 100, '#00ff00');

      const result = await comparator.compare(image1, image2);

      // 检查各项差异指标是否正确计算
      expect(result.ssim).toBeDefined();
      expect(result.mse).toBeDefined();
      expect(result.mae).toBeDefined();

      // MSE 和 MAE 应该大于 0（不同颜色的纯色图像）
      expect(result.mse).toBeGreaterThan(0);
      expect(result.mae).toBeGreaterThan(0);

      // 使用 MSE 算法应该检测到明显差异（设置更严格的阈值）
      comparator.updateConfig({
        algorithm: ComparisonAlgorithm.MSE,
        threshold: 1, // MSE 阈值
      });
      const mseResult = await comparator.compare(image1, image2);
      expect(mseResult.passed).toBe(false); // MSE 应该检测到差异

      // 总像素数应该正确
      expect(result.totalPixels).toBe(100 * 100);
    });

    it('should support different comparison algorithms', async () => {
      const comparator = goldenImageTest.getComparator();
      const image1 = generateTestImage(100, 100, '#ff0000');
      const image2 = generateTestImage(100, 100, '#ff0100'); // Slightly different

      // SSIM
      comparator.updateConfig({ algorithm: ComparisonAlgorithm.SSIM });
      const ssimResult = await comparator.compare(image1, image2);
      expect(ssimResult.ssim).toBeDefined();
      expect(ssimResult.ssim).toBeGreaterThan(0.99); // 应该非常相似

      // MSE
      comparator.updateConfig({ algorithm: ComparisonAlgorithm.MSE });
      const mseResult = await comparator.compare(image1, image2);
      expect(mseResult.mse).toBeDefined();
      expect(mseResult.mae).toBeDefined();

      // MAE
      comparator.updateConfig({ algorithm: ComparisonAlgorithm.MAE });
      const maeResult = await comparator.compare(image1, image2);
      expect(maeResult.mae).toBeDefined();
    });

    it('should assess and recommend thresholds', async () => {
      const comparator = goldenImageTest.getComparator();
      const image = generateTestImage(100, 100, '#ff0000');

      // 添加一些历史数据（略微变化的图像）
      for (let i = 0; i < 5; i++) {
        // 生成略微不同的图像以产生变化
        const r = 255 + (i % 3) - 1; // 254-256
        const similarImage = generateTestImage(100, 100, `#${r.toString(16).padStart(2, '0')}0000`);
        await comparator.compare(image, similarImage, 'test-scenario');
      }

      const assessment = comparator.assessThreshold('test-scenario');

      expect(assessment.recommended).toBeDefined();
      // 即使有变化，置信度也应该合理
      expect(assessment.confidence).toBeGreaterThanOrEqual(0);
      expect(assessment.confidence).toBeLessThanOrEqual(1);
      expect(assessment.history.count).toBe(5);
    });
  });

  describe('GoldenImageManager', () => {
    it('should save and load golden images', async () => {
      const manager = goldenImageTest.getManager();
      const image = generateTestImage(100, 100, '#00ff00');

      const saved = await manager.saveGoldenImage(
        'test-save-load',
        image,
        100,
        100,
        { tags: ['test'] }
      );

      expect(saved.metadata.name).toBe('test-save-load');
      expect(saved.metadata.width).toBe(100);
      expect(saved.metadata.height).toBe(100);
      expect(saved.metadata.tags).toContain('test');

      const loaded = await manager.loadGoldenImage('test-save-load');

      expect(loaded).not.toBeNull();
      expect(loaded!.metadata.name).toBe('test-save-load');

      // 清理
      await manager.deleteGoldenImage('test-save-load');
    });

    it('should update golden images', async () => {
      const manager = goldenImageTest.getManager();
      const image1 = generateTestImage(100, 100, '#0000ff');
      const image2 = generateTestImage(100, 100, '#ff00ff');

      await manager.saveGoldenImage('test-update', image1, 100, 100);

      const updated = await manager.updateGoldenImage('test-update', image2, 100, 100);

      expect(updated.metadata.version).toBe(2);
      expect(updated.metadata.updatedAt).toBeGreaterThan(updated.metadata.createdAt);

      // 清理
      await manager.deleteGoldenImage('test-update');
    });

    it('should list all golden images', async () => {
      const manager = goldenImageTest.getManager();
      const image = generateTestImage(100, 100, '#ffff00');

      await manager.saveGoldenImage('test-list-1', image, 100, 100);
      await manager.saveGoldenImage('test-list-2', image, 100, 100);

      const images = await manager.listGoldenImages();

      expect(images.length).toBeGreaterThanOrEqual(2);
      expect(images.find(img => img.name === 'test-list-1')).toBeDefined();
      expect(images.find(img => img.name === 'test-list-2')).toBeDefined();

      // 清理
      await manager.deleteGoldenImage('test-list-1');
      await manager.deleteGoldenImage('test-list-2');
    });

    it('should find images by tag', async () => {
      const manager = goldenImageTest.getManager();
      const image = generateTestImage(100, 100, '#00ffff');

      await manager.saveGoldenImage('test-tag', image, 100, 100, {
        tags: ['color', 'blue'],
      });

      const byColor = await manager.findByTag('color');
      const byBlue = await manager.findByTag('blue');

      expect(byColor.length).toBeGreaterThan(0);
      expect(byBlue.length).toBeGreaterThan(0);

      // 清理
      await manager.deleteGoldenImage('test-tag');
    });

    it('should get stats', async () => {
      const manager = goldenImageTest.getManager();
      const stats = await manager.getStats();

      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('totalSize');
      expect(stats).toHaveProperty('byTag');
      expect(stats).toHaveProperty('versions');
    });
  });

  describe('Integration Tests', () => {
    it('should run a complete test scenario', async () => {
      const scenarios = createTestScenarios();
      const scenario = scenarios[0];

      // 创建模拟的 golden image
      const manager = goldenImageTest.getManager();
      const goldenImage = generateTestImage(400, 300, '#ff0000');
      await manager.saveGoldenImage(scenario.name, goldenImage, 400, 300);

      // 运行测试场景
      const result = await goldenImageTest.runScenario(scenario);

      expect(result).toBeDefined();
      expect(result.scenario).toBe(scenario.name);
      expect(result.duration).toBeGreaterThan(0);
      expect(result.timestamp).toBeGreaterThan(0);

      // 清理
      await manager.deleteGoldenImage(scenario.name);
    });

    it('should handle non-existent golden images', async () => {
      const scenario: TestScenario = {
        name: 'non-existent-test',
        description: 'Test with non-existent golden image',
        width: 100,
        height: 100,
        setup: async () => {},
        render: async () => {},
        cleanup: async () => {},
      };

      const result = await goldenImageTest.runScenario(scenario);

      expect(result.passed).toBe(true);
      expect(result.comparison.diffLevel).toBe('identical');

      // 清理
      await goldenImageTest.getManager().deleteGoldenImage('non-existent-test');
    });

    it('should generate test report', async () => {
      const results = [
        {
          scenario: 'test1',
          passed: true,
          comparison: {
            passed: true,
            diffLevel: 'identical' as const,
            pixelDiffCount: 0,
            totalPixels: 10000,
            diffPercentage: 0,
            diffPixels: [],
            avgDiff: 0,
            maxDiff: 0,
            threshold: 0.95,
            actualDiff: 1,
          },
          duration: 100,
          goldenImage: '/path/to/golden.png',
          actualImage: '/path/to/actual.png',
          diffImage: '/path/to/diff.png',
          timestamp: Date.now(),
        },
      ];

      const reportPath = await goldenImageTest.generateReport(results);

      expect(reportPath).toBeDefined();
    });

    it('should calculate test stats correctly', async () => {
      const results = [
        {
          scenario: 'test1',
          passed: true,
          comparison: {
            passed: true,
            diffLevel: 'identical' as const,
            pixelDiffCount: 0,
            totalPixels: 10000,
            diffPercentage: 0,
            diffPixels: [],
            avgDiff: 0,
            maxDiff: 0,
            threshold: 0.95,
            actualDiff: 1,
          },
          duration: 100,
          goldenImage: '/path/to/golden.png',
          actualImage: '/path/to/actual.png',
          diffImage: '/path/to/diff.png',
          timestamp: Date.now(),
        },
        {
          scenario: 'test2',
          passed: false,
          comparison: {
            passed: false,
            diffLevel: 'minor' as const,
            pixelDiffCount: 100,
            totalPixels: 10000,
            diffPercentage: 1,
            diffPixels: [],
            avgDiff: 0.5,
            maxDiff: 1,
            threshold: 0.95,
            actualDiff: 0.9,
          },
          duration: 200,
          goldenImage: '/path/to/golden.png',
          actualImage: '/path/to/actual.png',
          diffImage: '/path/to/diff.png',
          timestamp: Date.now(),
        },
      ];

      const stats = goldenImageTest.getStats(results);

      expect(stats.total).toBe(2);
      expect(stats.passed).toBe(1);
      expect(stats.failed).toBe(1);
      expect(stats.passRate).toBe(0.5);
      expect(stats.avgDuration).toBe(150);
      expect(stats.maxDuration).toBe(200);
      expect(stats.minDuration).toBe(100);
    });
  });

  afterAll(async () => {
    // 清理测试输出
    await goldenImageTest.cleanup();
  });
});
