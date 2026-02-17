/**
 * 压力测试框架
 * 导出所有公共 API
 */

export {
  LoadPattern,
  StressScenario,
  MetricType,
  DEFAULT_LOAD_CONFIG,
  DEFAULT_MONITOR_CONFIG,
  STRESS_TEST_TARGETS,
} from './types.js';

export type {
  LoadConfig,
  MonitorConfig,
  MetricDataPoint,
  Metric,
  SystemResource,
  StressTestResult,
  TestSummary,
  Alert,
  ReportConfig,
} from './types.js';

export { LoadGenerator } from './LoadGenerator.js';
export { StabilityMonitor } from './StabilityMonitor.js';
export { StressTestRunner } from './StressTestRunner.js';
export { StressTestReporter } from './StressTestReporter.js';
