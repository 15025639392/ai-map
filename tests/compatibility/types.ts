/**
 * 兼容性测试类型定义
 */

/**
 * 支持的浏览器类型
 */
export type BrowserType = 'chrome' | 'firefox' | 'safari' | 'edge';

/**
 * 支持的 Node.js 版本
 */
export type NodeVersion = '16' | '18' | '20' | '22';

/**
 * 支持的平台类型
 */
export type PlatformType = 'windows' | 'macos' | 'linux';

/**
 * 平台配置
 */
export interface PlatformConfig {
  name: string;
  type: PlatformType;
  version?: string;
  architecture?: 'x64' | 'arm64';
}

/**
 * 浏览器配置
 */
export interface BrowserConfig {
  name: BrowserType;
  version: string;
  platform: PlatformType;
}

/**
 * 兼容性测试场景
 */
export interface CompatibilityScenario {
  id: string;
  name: string;
  description: string;
  platforms: PlatformType[];
  browsers?: BrowserConfig[];
  testFunction: () => Promise<SmokeTestResult>;
  priority: 'critical' | 'high' | 'medium' | 'low';
  timeout?: number;
}

/**
 * 冒烟测试结果
 */
export interface SmokeTestResult {
  scenarioId: string;
  platform: PlatformConfig;
  browser?: BrowserConfig;
  passed: boolean;
  duration: number;
  error?: string;
  details?: Record<string, any>;
  timestamp: number;
}

/**
 * 兼容性矩阵项
 */
export interface CompatibilityMatrixItem {
  scenarioId: string;
  scenarioName: string;
  platform: PlatformType;
  browser?: BrowserType;
  browserVersion?: string;
  supported: boolean;
  lastTested: number;
  results: SmokeTestResult[];
}

/**
 * 兼容性矩阵
 */
export interface CompatibilityMatrix {
  version: string;
  generatedAt: number;
  platforms: PlatformConfig[];
  browsers: BrowserConfig[];
  items: CompatibilityMatrixItem[];
  summary: CompatibilitySummary;
}

/**
 * 兼容性摘要
 */
export interface CompatibilitySummary {
  totalScenarios: number;
  totalPlatforms: number;
  totalBrowsers: number;
  passed: number;
  failed: number;
  skipped: number;
  passRate: number;
  criticalPassed: number;
  criticalFailed: number;
}

/**
 * 发布门禁配置
 */
export interface ReleaseGateConfig {
  // 测试覆盖率要求
  minCoverage?: number;
  
  // 兼容性要求
  minCompatibilityRate?: number;
  requiredPlatforms?: PlatformType[];
  requiredBrowsers?: BrowserType[];
  
  // 性能要求
  maxLatency?: number;
  maxErrorRate?: number;
  
  // 代码质量要求
  maxLintErrors?: number;
  
  // 允许的例外场景
  allowedExceptions?: string[];
  
  // 是否严格要求（不允许例外）
  strict?: boolean;
}

/**
 * 发布门禁检查项
 */
export interface ReleaseGateCheck {
  name: string;
  description: string;
  category: 'test' | 'compatibility' | 'performance' | 'quality';
  passed: boolean;
  message: string;
  details?: Record<string, any>;
  critical: boolean;
}

/**
 * 发布门禁结果
 */
export interface ReleaseGateResult {
  version: string;
  checkedAt: number;
  overallPassed: boolean;
  checks: ReleaseGateCheck[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    criticalFailed: number;
  };
  recommendations: string[];
  warnings: string[];
  exceptions: string[];
}

/**
 * 兼容性测试报告
 */
export interface CompatibilityReport {
  matrix: CompatibilityMatrix;
  releaseGate?: ReleaseGateResult;
  generatedAt: number;
  duration: number;
  testResults: SmokeTestResult[];
}

/**
 * 平台信息
 */
export interface PlatformInfo {
  platform: PlatformType;
  architecture?: 'x64' | 'arm64';
  nodeVersion?: string;
  osVersion?: string;
}

/**
 * 测试配置
 */
export interface TestConfig {
  timeout?: number;
  retries?: number;
  parallel?: boolean;
  platforms?: PlatformType[];
  browsers?: BrowserType[];
  excludeScenarios?: string[];
}

/**
 * 冒烟测试运行配置
 */
export interface SmokeTestConfig {
  scenarios: CompatibilityScenario[];
  platforms: PlatformConfig[];
  browsers?: BrowserConfig[];
  config?: TestConfig;
}

/**
 * 兼容性测试运行结果
 */
export interface CompatibilityTestResult {
  matrix: CompatibilityMatrix;
  duration: number;
  platformInfo: PlatformInfo;
  outputPath: string;
}
