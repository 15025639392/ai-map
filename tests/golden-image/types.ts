/**
 * Golden Image 回归测试框架类型定义
 */

/**
 * 对比算法类型
 */
export enum ComparisonAlgorithm {
  PIXEL_DIFF = 'pixel_diff',
  SSIM = 'ssim',
  MSE = 'mse',
  MAE = 'mae',
}

/**
 * 差异级别
 */
export enum DiffLevel {
  IDENTICAL = 'identical',      // 完全相同
  MINOR = 'minor',              // 轻微差异
  MODERATE = 'moderate',        // 中等差异
  MAJOR = 'major',              // 重大差异
  CRITICAL = 'critical',        // 严重差异
}

/**
 * 像素差异信息
 */
export interface PixelDiff {
  x: number;
  y: number;
  r1: number;  // actual red
  g1: number;  // actual green
  b1: number;  // actual blue
  a1: number;  // actual alpha
  r2: number;  // expected red
  g2: number;  // expected green
  b2: number;  // expected blue
  a2: number;  // expected alpha
  diff: number; // total difference
}

/**
 * 对比结果
 */
export interface ComparisonResult {
  passed: boolean;
  diffLevel: DiffLevel;
  pixelDiffCount: number;
  totalPixels: number;
  diffPercentage: number;
  diffPixels: PixelDiff[];
  avgDiff: number;
  maxDiff: number;
  ssim?: number;           // SSIM 指标 (0-1, 1 表示完全相同)
  mse?: number;            // 均方误差
  mae?: number;            // 平均绝对误差
  threshold: number;
  actualDiff: number;
}

/**
 * 误差阈值配置
 */
export interface ThresholdConfig {
  algorithm: ComparisonAlgorithm;
  threshold: number;           // 阈值（百分比或绝对值）
  autoAdjust: boolean;         // 是否自动调整
  minThreshold?: number;       // 最小阈值
  maxThreshold?: number;       // 最大阈值
  historyWeight?: number;      // 历史数据权重 (0-1)
  adaptationRate?: number;     // 适应率 (0-1)
}

/**
 * 默认阈值配置
 */
export const DEFAULT_THRESHOLD: ThresholdConfig = {
  algorithm: ComparisonAlgorithm.SSIM,
  threshold: 0.95,             // SSIM 阈值 0.95
  autoAdjust: true,
  minThreshold: 0.90,
  maxThreshold: 0.99,
  historyWeight: 0.3,
  adaptationRate: 0.1,
};

/**
 * Golden Image 元数据
 */
export interface GoldenImageMetadata {
  name: string;
  version: number;
  width: number;
  height: number;
  createdAt: number;
  updatedAt: number;
  description?: string;
  tags?: string[];
  environment?: {
    os?: string;
    browser?: string;
    renderer?: string;
    resolution?: string;
  };
  threshold?: ThresholdConfig;
}

/**
 * Golden Image 信息
 */
export interface GoldenImageInfo {
  metadata: GoldenImageMetadata;
  data: Buffer;
  path: string;
}

/**
 * 测试场景配置
 */
export interface TestScenario {
  name: string;
  description?: string;
  width: number;
  height: number;
  setup: () => Promise<void>;
  render: () => Promise<void>;
  cleanup: () => Promise<void>;
  threshold?: Partial<ThresholdConfig>;
  tags?: string[];
}

/**
 * 测试结果
 */
export interface TestResult {
  scenario: string;
  passed: boolean;
  comparison: ComparisonResult;
  duration: number;
  goldenImage: string;
  actualImage: string;
  diffImage: string;
  timestamp: number;
}

/**
 * 测试报告
 */
export interface TestReport {
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    passRate: number;
    duration: number;
  };
  results: TestResult[];
  threshold: ThresholdConfig;
  environment: {
    os: string;
    nodeVersion: string;
    timestamp: number;
  };
  generatedAt: number;
}

/**
 * 差异图像配置
 */
export interface DiffImageConfig {
  highlightColor: string;      // 高亮颜色 (hex)
  highlightAlpha: number;       // 高亮透明度 (0-1)
  diffAlpha: number;            // 差异显示透明度 (0-1)
  showOriginal: boolean;       // 是否显示原图
  showExpected: boolean;       // 是否显示期望图
  showDiffOnly: boolean;      // 是否只显示差异
}

/**
 * 默认差异图像配置
 */
export const DEFAULT_DIFF_IMAGE_CONFIG: DiffImageConfig = {
  highlightColor: '#FF0000',
  highlightAlpha: 0.8,
  diffAlpha: 0.5,
  showOriginal: true,
  showExpected: true,
  showDiffOnly: false,
};

/**
 * 自动阈值评估结果
 */
export interface ThresholdAssessment {
  recommended: number;
  confidence: number;          // 置信度 (0-1)
  reason: string;
  history: {
    avgDiff: number;
    minDiff: number;
    maxDiff: number;
    stdDev: number;
    count: number;
  };
  adjustment?: {
    oldThreshold: number;
    newThreshold: number;
    adjustment: number;
    percentage: number;
  };
}

/**
 * 历史差异记录
 */
export interface DiffHistory {
  scenario: string;
  timestamp: number;
  diffValue: number;
  threshold: number;
  passed: boolean;
}
