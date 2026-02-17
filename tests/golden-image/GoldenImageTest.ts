/**
 * Golden Image 测试辅助类
 * 提供测试环境设置、渲染控制、截图捕获功能
 */

import {
  GoldenImageComparator,
  GoldenImageManager,
  GoldenImageReporter,
} from './index.js';
import {
  TestScenario,
  TestResult,
  ComparisonResult,
  DiffImageConfig,
  DEFAULT_DIFF_IMAGE_CONFIG,
} from './types.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Golden Image 测试辅助类
 */
export class GoldenImageTest {
  private _comparator: GoldenImageComparator;
  private _manager: GoldenImageManager;
  private _reporter: GoldenImageReporter;
  private _outputDir: string;
  private _diffImageConfig: DiffImageConfig;

  constructor(options?: {
    baseDir?: string;
    outputDir?: string;
    diffImageConfig?: DiffImageConfig;
  }) {
    this._manager = new GoldenImageManager(options?.baseDir);
    this._comparator = new GoldenImageComparator();
    this._reporter = new GoldenImageReporter();
    this._outputDir = options?.outputDir || path.join(process.cwd(), 'test-results', 'golden-image');
    this._diffImageConfig = { ...DEFAULT_DIFF_IMAGE_CONFIG, ...options?.diffImageConfig };
  }

  /**
   * 初始化测试环境
   */
  async initialize(): Promise<void> {
    await this._manager.initialize();
    await fs.mkdir(this._outputDir, { recursive: true });
  }

  /**
   * 运行测试场景
   */
  async runScenario(scenario: TestScenario): Promise<TestResult> {
    const startTime = Date.now();

    try {
      // 设置测试环境
      await scenario.setup();

      // 渲染场景
      await scenario.render();

      // 捕获实际图像（这里需要根据实际渲染器实现）
      const actualImage = await this._captureImage(scenario);

      // 加载或生成 Golden Image
      let goldenImage = await this._manager.loadGoldenImage(scenario.name);

      if (!goldenImage) {
        // 如果没有 Golden Image，创建一个新的
        const width = scenario.width || 800;
        const height = scenario.height || 600;
        goldenImage = await this._manager.saveGoldenImage(
          scenario.name,
          actualImage,
          width,
          height,
          {
            description: scenario.description,
            tags: scenario.tags,
          }
        );

        // 对于新生成的 Golden Image，视为通过
        const result: TestResult = {
          scenario: scenario.name,
          passed: true,
          comparison: {
            passed: true,
            diffLevel: 'identical',
            pixelDiffCount: 0,
            totalPixels: width * height,
            diffPercentage: 0,
            diffPixels: [],
            avgDiff: 0,
            maxDiff: 0,
            threshold: 1,
            actualDiff: 1,
          } as ComparisonResult,
          duration: Date.now() - startTime,
          goldenImage: goldenImage.path,
          actualImage: 'N/A (new golden image)',
          diffImage: 'N/A',
          timestamp: Date.now(),
        };

        return result;
      }

      // 应用场景特定的阈值配置
      if (scenario.threshold) {
        this._comparator.updateConfig(scenario.threshold);
      }

      // 对比图像
      const comparison = await this._comparator.compare(
        actualImage,
        goldenImage.data,
        scenario.name
      );

      // 生成差异图像
      const diffImage = await this._saveDiffImage(
        actualImage,
        goldenImage.data,
        comparison.diffPixels,
        scenario.name
      );

      // 保存实际图像
      const actualImagePath = await this._saveActualImage(actualImage, scenario.name);

      // 清理测试环境
      await scenario.cleanup();

      const result: TestResult = {
        scenario: scenario.name,
        passed: comparison.passed,
        comparison,
        duration: Date.now() - startTime,
        goldenImage: goldenImage.path,
        actualImage: actualImagePath,
        diffImage,
        timestamp: Date.now(),
      };

      return result;
    } catch (error) {
      console.error(`Error running scenario "${scenario.name}":`, error);
      throw error;
    }
  }

  /**
   * 批量运行测试场景
   */
  async runScenarios(scenarios: TestScenario[]): Promise<TestResult[]> {
    const results: TestResult[] = [];

    for (const scenario of scenarios) {
      const result = await this.runScenario(scenario);
      results.push(result);
    }

    return results;
  }

  /**
   * 捕获图像（需要根据实际渲染器实现）
   */
  private async _captureImage(scenario: TestScenario): Promise<Buffer> {
    // 这里需要根据实际的渲染器实现来捕获图像
    // 目前返回一个模拟的 buffer
    const width = scenario.width || 800;
    const height = scenario.height || 600;
    const bufferSize = width * height * 4; // RGBA
    return Buffer.alloc(bufferSize);
  }

  /**
   * 保存实际图像
   */
  private async _saveActualImage(imageData: Buffer, scenarioName: string): Promise<string> {
    const filename = `${scenarioName}_actual.png`;
    const filepath = path.join(this._outputDir, filename);
    await fs.writeFile(filepath, imageData);
    return filepath;
  }

  /**
   * 保存差异图像
   */
  private async _saveDiffImage(
    actual: Buffer,
    expected: Buffer,
    diffPixels: any[],
    scenarioName: string
  ): Promise<string> {
    const diffBuffer = this._comparator.generateDiffImage(
      actual,
      expected,
      diffPixels,
      800, // 需要从场景中获取
      600
    );

    const filename = `${scenarioName}_diff.png`;
    const filepath = path.join(this._outputDir, filename);
    await fs.writeFile(filepath, diffBuffer);
    return filepath;
  }

  /**
   * 更新 Golden Image
   */
  async updateGoldenImage(scenario: TestScenario): Promise<void> {
    const startTime = Date.now();

    try {
      await scenario.setup();
      await scenario.render();

      const actualImage = await this._captureImage(scenario);

      const width = scenario.width || 800;
      const height = scenario.height || 600;

      await this._manager.updateGoldenImage(
        scenario.name,
        actualImage,
        width,
        height,
        {
          description: scenario.description,
          tags: scenario.tags,
        }
      );

      await scenario.cleanup();

      console.log(`Golden image "${scenario.name}" updated in ${Date.now() - startTime}ms`);
    } catch (error) {
      console.error(`Error updating golden image "${scenario.name}":`, error);
      throw error;
    }
  }

  /**
   * 批量更新 Golden Images
   */
  async updateGoldenImages(scenarios: TestScenario[]): Promise<void> {
    for (const scenario of scenarios) {
      await this.updateGoldenImage(scenario);
    }
  }

  /**
   * 生成测试报告
   */
  async generateReport(results: TestResult[]): Promise<string> {
    return this._reporter.generateReport(results, this._outputDir);
  }

  /**
   * 获取测试统计信息
   */
  getStats(results: TestResult[]): {
    total: number;
    passed: number;
    failed: number;
    passRate: number;
    avgDuration: number;
    maxDuration: number;
    minDuration: number;
  } {
    if (results.length === 0) {
      return {
        total: 0,
        passed: 0,
        failed: 0,
        passRate: 0,
        avgDuration: 0,
        maxDuration: 0,
        minDuration: 0,
      };
    }

    const passed = results.filter(r => r.passed).length;
    const durations = results.map(r => r.duration);

    return {
      total: results.length,
      passed,
      failed: results.length - passed,
      passRate: passed / results.length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      maxDuration: Math.max(...durations),
      minDuration: Math.min(...durations),
    };
  }

  /**
   * 清理输出目录
   */
  async cleanup(): Promise<void> {
    try {
      await fs.rm(this._outputDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to cleanup output directory:', error);
    }
  }

  /**
   * 获取输出目录
   */
  getOutputDir(): string {
    return this._outputDir;
  }

  /**
   * 获取比较器
   */
  getComparator(): GoldenImageComparator {
    return this._comparator;
  }

  /**
   * 获取管理器
   */
  getManager(): GoldenImageManager {
    return this._manager;
  }
}
