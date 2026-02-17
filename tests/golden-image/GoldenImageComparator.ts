/**
 * Golden Image 对比器
 * 提供像素级对比、SSIM 算法、误差计算功能
 */

import {
  ComparisonResult,
  ComparisonAlgorithm,
  ThresholdConfig,
  DEFAULT_THRESHOLD,
  PixelDiff,
  DiffLevel,
  ThresholdAssessment,
  DiffHistory,
} from './types.js';

/**
 * Golden Image 对比器
 */
export class GoldenImageComparator {
  private _config: ThresholdConfig;
  private _diffHistory: Map<string, DiffHistory[]> = new Map();

  constructor(config?: Partial<ThresholdConfig>) {
    this._config = { ...DEFAULT_THRESHOLD, ...config };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<ThresholdConfig>): void {
    this._config = { ...this._config, ...config };
  }

  /**
   * 获取当前配置
   */
  getConfig(): ThresholdConfig {
    return { ...this._config };
  }

  /**
   * 添加差异历史记录
   */
  addDiffHistory(scenario: string, diffValue: number, threshold: number, passed: boolean): void {
    const history = this._diffHistory.get(scenario) || [];
    history.push({
      scenario,
      timestamp: Date.now(),
      diffValue,
      threshold,
      passed,
    });
    // 保留最近 50 条记录
    if (history.length > 50) {
      history.shift();
    }
    this._diffHistory.set(scenario, history);
  }

  /**
   * 获取差异历史
   */
  getDiffHistory(scenario?: string): DiffHistory[] {
    if (scenario) {
      return this._diffHistory.get(scenario) || [];
    }
    const all: DiffHistory[] = [];
    this._diffHistory.forEach(h => all.push(...h));
    return all;
  }

  /**
   * 对比两个图像 Buffer
   */
  async compare(
    actual: Buffer,
    expected: Buffer,
    scenario?: string
  ): Promise<ComparisonResult> {
    const actualPixels = this._bufferToPixels(actual);
    const expectedPixels = this._bufferToPixels(expected);

    if (actualPixels.width !== expectedPixels.width ||
        actualPixels.height !== expectedPixels.height) {
      throw new Error('Image dimensions do not match');
    }

    const { width, height, pixels } = expectedPixels;
    const totalPixels = width * height;

    // 计算像素差异
    const diffPixels: PixelDiff[] = [];
    let totalDiff = 0;
    let maxDiff = 0;

    for (let i = 0; i < pixels.length; i++) {
      const p1 = actualPixels.pixels[i];
      const p2 = pixels[i];

      const dr = p1.r - p2.r;
      const dg = p1.g - p2.g;
      const db = p1.b - p2.b;
      const da = p1.a - p2.a;

      const diff = Math.sqrt(dr * dr + dg * dg + db * db + da * da) / (4 * 255);

      if (diff > 0.01) {
        diffPixels.push({
          x: i % width,
          y: Math.floor(i / width),
          r1: p1.r,
          g1: p1.g,
          b1: p1.b,
          a1: p1.a,
          r2: p2.r,
          g2: p2.g,
          b2: p2.b,
          a2: p2.a,
          diff,
        });
        totalDiff += diff;
        maxDiff = Math.max(maxDiff, diff);
      }
    }

    const avgDiff = diffPixels.length > 0 ? totalDiff / diffPixels.length : 0;
    const diffPercentage = (diffPixels.length / totalPixels) * 100;

    // 根据算法计算差异值
    let diffValue = 0;
    switch (this._config.algorithm) {
      case ComparisonAlgorithm.SSIM:
        diffValue = this._calculateSSIM(actualPixels.pixels, pixels);
        break;
      case ComparisonAlgorithm.MSE:
        diffValue = this._calculateMSE(actualPixels.pixels, pixels);
        break;
      case ComparisonAlgorithm.MAE:
        diffValue = this._calculateMAE(actualPixels.pixels, pixels);
        break;
      case ComparisonAlgorithm.PIXEL_DIFF:
      default:
        diffValue = 1 - (diffPercentage / 100);
        break;
    }

    // 自动调整阈值
    let threshold = this._config.threshold;
    if (this._config.autoAdjust && scenario) {
      const assessment = this.assessThreshold(scenario);
      if (assessment.confidence > 0.7) {
        threshold = assessment.recommended;
      }
    }

    const passed = this._config.algorithm === ComparisonAlgorithm.SSIM
      ? diffValue >= threshold
      : diffValue <= threshold;

    // 记录历史
    if (scenario) {
      this.addDiffHistory(scenario, diffValue, threshold, passed);
    }

    return {
      passed,
      diffLevel: this._determineDiffLevel(diffValue, threshold, this._config.algorithm),
      pixelDiffCount: diffPixels.length,
      totalPixels,
      diffPercentage,
      diffPixels: diffPixels.slice(0, 1000), // 限制返回的差异像素数量
      avgDiff,
      maxDiff,
      ssim: this._calculateSSIM(actualPixels.pixels, pixels),
      mse: this._calculateMSE(actualPixels.pixels, pixels),
      mae: this._calculateMAE(actualPixels.pixels, pixels),
      threshold,
      actualDiff: diffValue,
    };
  }

  /**
   * 评估并推荐阈值
   */
  assessThreshold(scenario: string): ThresholdAssessment {
    const history = this._diffHistory.get(scenario) || [];

    if (history.length < 3) {
      return {
        recommended: this._config.threshold,
        confidence: 0,
        reason: 'Insufficient historical data',
        history: {
          avgDiff: 0,
          minDiff: 0,
          maxDiff: 0,
          stdDev: 0,
          count: history.length,
        },
      };
    }

    const diffs = history.map(h => h.diffValue);
    const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    const minDiff = Math.min(...diffs);
    const maxDiff = Math.max(...diffs);
    const variance = diffs.reduce((sum, d) => sum + (d - avgDiff) ** 2, 0) / diffs.length;
    const stdDev = Math.sqrt(variance);

    // 基于历史统计推荐阈值
    let recommended: number;
    const isSSIM = this._config.algorithm === ComparisonAlgorithm.SSIM;

    if (isSSIM) {
      // SSIM: 推荐为平均值 - 2 个标准差
      recommended = avgDiff - 2 * stdDev;
      recommended = Math.max(
        this._config.minThreshold || 0.9,
        Math.min(this._config.maxThreshold || 0.99, recommended)
      );
    } else {
      // 其他算法: 推荐为平均值 + 2 个标准差
      recommended = avgDiff + 2 * stdDev;
      recommended = Math.max(
        this._config.minThreshold || 0.05,
        Math.min(this._config.maxThreshold || 0.2, recommended)
      );
    }

    // 计算置信度（基于数据稳定性和数量）
    // 稳定性：标准差越小，稳定性越高
    const stability = Math.max(0, 1 - Math.min(1, stdDev / Math.max(1, Math.abs(avgDiff))));
    const dataVolume = Math.min(1, history.length / 10);
    const confidence = stability * dataVolume;

    const assessment: ThresholdAssessment = {
      recommended,
      confidence,
      reason: `Based on ${history.length} historical tests with ${stability.toFixed(2)} stability`,
      history: {
        avgDiff,
        minDiff,
        maxDiff,
        stdDev,
        count: history.length,
      },
    };

    // 如果阈值需要调整
    const adjustment = recommended - this._config.threshold;
    if (Math.abs(adjustment) > 0.01) {
      assessment.adjustment = {
        oldThreshold: this._config.threshold,
        newThreshold: recommended,
        adjustment,
        percentage: (adjustment / this._config.threshold) * 100,
      };
    }

    return assessment;
  }

  /**
   * 确定 diff level
   */
  private _determineDiffLevel(
    diffValue: number,
    threshold: number,
    algorithm: ComparisonAlgorithm
  ): DiffLevel {
    const isSSIM = algorithm === ComparisonAlgorithm.SSIM;
    const ratio = isSSIM ? diffValue / threshold : threshold / diffValue;

    if (ratio >= 0.99) {
      return DiffLevel.IDENTICAL;
    } else if (ratio >= 0.95) {
      return DiffLevel.MINOR;
    } else if (ratio >= 0.85) {
      return DiffLevel.MODERATE;
    } else if (ratio >= 0.7) {
      return DiffLevel.MAJOR;
    } else {
      return DiffLevel.CRITICAL;
    }
  }

  /**
   * 计算 SSIM (Structural Similarity Index)
   */
  private _calculateSSIM(pixels1: number[][], pixels2: number[][]): number {
    const n = pixels1.length;
    if (n === 0) return 0;

    // 简化版 SSIM 计算（使用全局统计）
    let sum1 = 0, sum2 = 0;
    let sumSq1 = 0, sumSq2 = 0;
    let sumProd = 0;

    for (let i = 0; i < n; i++) {
      const gray1 = (pixels1[i][0] + pixels1[i][1] + pixels1[i][2]) / 3;
      const gray2 = (pixels2[i][0] + pixels2[i][1] + pixels2[i][2]) / 3;

      sum1 += gray1;
      sum2 += gray2;
      sumSq1 += gray1 * gray1;
      sumSq2 += gray2 * gray2;
      sumProd += gray1 * gray2;
    }

    const mean1 = sum1 / n;
    const mean2 = sum2 / n;
    const var1 = sumSq1 / n - mean1 * mean1;
    const var2 = sumSq2 / n - mean2 * mean2;
    const cov = sumProd / n - mean1 * mean2;

    // SSIM 常数
    const C1 = 6.5025;
    const C2 = 58.5225;

    const ssim = ((2 * mean1 * mean2 + C1) * (2 * cov + C2)) /
                 ((mean1 * mean1 + mean2 * mean2 + C1) * (var1 + var2 + C2));

    return Math.max(0, Math.min(1, ssim));
  }

  /**
   * 计算 MSE (Mean Squared Error)
   */
  private _calculateMSE(pixels1: number[][], pixels2: number[][]): number {
    const n = pixels1.length;
    if (n === 0) return 0;

    let sum = 0;
    for (let i = 0; i < n; i++) {
      const d1 = pixels1[i][0] - pixels2[i][0];
      const d2 = pixels1[i][1] - pixels2[i][1];
      const d3 = pixels1[i][2] - pixels2[i][2];
      sum += d1 * d1 + d2 * d2 + d3 * d3;
    }

    return sum / (3 * n);
  }

  /**
   * 计算 MAE (Mean Absolute Error)
   */
  private _calculateMAE(pixels1: number[][], pixels2: number[][]): number {
    const n = pixels1.length;
    if (n === 0) return 0;

    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += Math.abs(pixels1[i][0] - pixels2[i][0]);
      sum += Math.abs(pixels1[i][1] - pixels2[i][1]);
      sum += Math.abs(pixels1[i][2] - pixels2[i][2]);
    }

    return sum / (3 * n);
  }

  /**
   * Buffer 转为像素数据
   */
  private _bufferToPixels(buffer: Buffer): {
    width: number;
    height: number;
    pixels: number[][];
  } {
    // 假设是 RGBA 格式 (4 bytes per pixel)
    const pixelCount = buffer.length / 4;
    // 尝试推断尺寸（假设是 4:3 或 16:9 等常见比例）
    const sqrt = Math.sqrt(pixelCount);
    const width = Math.round(sqrt);
    const height = Math.round(pixelCount / width);

    const pixels: number[][] = [];
    for (let i = 0; i < pixelCount; i++) {
      pixels.push([
        buffer[i * 4],     // R
        buffer[i * 4 + 1], // G
        buffer[i * 4 + 2], // B
        buffer[i * 4 + 3], // A
      ]);
    }

    return { width, height, pixels };
  }

  /**
   * 生成差异图像 Buffer
   */
  generateDiffImage(
    actual: Buffer,
    expected: Buffer,
    diffPixels: PixelDiff[],
    width: number,
    height: number
  ): Buffer {
    const actualData = this._bufferToPixels(actual);
    const expectedData = this._bufferToPixels(expected);
    const diffBuffer = Buffer.alloc(width * height * 4);

    const diffSet = new Set(diffPixels.map(p => `${p.x},${p.y}`));

    for (let i = 0; i < actualData.pixels.length; i++) {
      const x = i % width;
      const y = Math.floor(i / width);
      const isDiff = diffSet.has(`${x},${y}`);

      let r, g, b, a;

      if (isDiff) {
        // 红色高亮差异区域
        r = 255;
        g = 0;
        b = 0;
        a = 200;
      } else {
        // 混合显示原图和期望图
        r = (actualData.pixels[i][0] + expectedData.pixels[i][0]) / 2;
        g = (actualData.pixels[i][1] + expectedData.pixels[i][1]) / 2;
        b = (actualData.pixels[i][2] + expectedData.pixels[i][2]) / 2;
        a = (actualData.pixels[i][3] + expectedData.pixels[i][3]) / 2;
      }

      diffBuffer[i * 4] = r;
      diffBuffer[i * 4 + 1] = g;
      diffBuffer[i * 4 + 2] = b;
      diffBuffer[i * 4 + 3] = a;
    }

    return diffBuffer;
  }
}
