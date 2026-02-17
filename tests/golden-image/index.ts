/**
 * Golden Image 回归测试框架
 * 导出所有公共 API
 */

export {
  ComparisonAlgorithm,
  DiffLevel,
  DEFAULT_THRESHOLD,
  DEFAULT_DIFF_IMAGE_CONFIG,
} from './types.js';

export type {
  PixelDiff,
  ComparisonResult,
  ThresholdConfig,
  GoldenImageMetadata,
  GoldenImageInfo,
  TestScenario,
  TestResult,
  TestReport,
  DiffImageConfig,
  ThresholdAssessment,
  DiffHistory,
} from './types.js';

export { GoldenImageComparator } from './GoldenImageComparator.js';
export { GoldenImageManager } from './GoldenImageManager.js';
export { GoldenImageTest } from './GoldenImageTest.js';
export { GoldenImageReporter } from './GoldenImageReporter.js';
