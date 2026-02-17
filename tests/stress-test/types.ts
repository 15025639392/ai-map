/**
 * 压力测试类型定义
 */

/**
 * 负载模式
 */
export enum LoadPattern {
  CONSTANT = 'constant',        // 持续负载
  RAMP_UP = 'ramp_up',        // 阶梯式增加
  SPIKE = 'spike',            // 突发式负载
  SINE_WAVE = 'sine_wave',    // 正弦波式
  RANDOM = 'random',           // 随机负载
}

/**
 * 压力测试场景
 */
export enum StressScenario {
  RENDERING = 'rendering',           // 渲染压力测试
  TILE_LOADING = 'tile_loading',     // 瓦片加载压力测试
  API_CALLS = 'api_calls',         // API 调用压力测试
  MIXED = 'mixed',                 // 混合场景
}

/**
 * 监控指标类型
 */
export enum MetricType {
  QPS = 'qps',                   // 每秒请求数
  LATENCY = 'latency',             // 延迟
  ERROR_RATE = 'error_rate',         // 错误率
  CPU_USAGE = 'cpu_usage',          // CPU 使用率
  MEMORY_USAGE = 'memory_usage',    // 内存使用率
  THROUGHPUT = 'throughput',        // 吞吐量
  FRAME_RATE = 'frame_rate',       // 帧率
}

/**
 * 负载配置
 */
export interface LoadConfig {
  pattern: LoadPattern;
  targetQPS: number;
  duration: number;               // 测试持续时间（秒）
  rampUpDuration?: number;         // ramp-up 持续时间（秒）
  spikeInterval?: number;          // 突发间隔（秒）
  spikeDuration?: number;          // 突发持续时间（秒）
  minQPS?: number;              // 最小 QPS（用于正弦波/随机）
  maxQPS?: number;              // 最大 QPS（用于正弦波/随机）
  concurrentUsers?: number;       // 并发用户数
}

/**
 * 监控配置
 */
export interface MonitorConfig {
  samplingInterval: number;       // 采样间隔（毫秒）
  alertThresholds: {
    cpuUsage: number;            // CPU 使用率告警阈值（0-1）
    memoryUsage: number;         // 内存使用率告警阈值（0-1）
    latency: number;             // 延迟告警阈值（毫秒）
    errorRate: number;          // 错误率告警阈值（0-1）
  };
  enableProfiling: boolean;       // 是否启用性能分析
}

/**
 * 指标数据点
 */
export interface MetricDataPoint {
  timestamp: number;
  value: number;
  metadata?: Record<string, any>;
}

/**
 * 监控指标
 */
export interface Metric {
  type: MetricType;
  name: string;
  data: MetricDataPoint[];
  statistics: {
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
    stdDev: number;
  };
}

/**
 * 系统资源监控
 */
export interface SystemResource {
  timestamp: number;
  cpuUsage: number;            // CPU 使用率（0-1）
  memoryUsage: number;         // 内存使用率（0-1）
  memoryUsed: number;          // 已使用内存（字节）
  memoryTotal: number;         // 总内存（字节）
  loadAverage: number[];        // 负载平均值（1/5/15 分钟）
}

/**
 * 测试结果
 */
export interface StressTestResult {
  scenario: StressScenario;
  startTime: number;
  endTime: number;
  duration: number;
  config: LoadConfig;
  metrics: Record<MetricType, Metric>;
  resources: SystemResource[];
  alerts: Alert[];
  summary: TestSummary;
  status: 'passed' | 'failed' | 'aborted';
}

/**
 * 测试摘要
 */
export interface TestSummary {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  errorRate: number;
  avgQPS: number;
  peakQPS: number;
  avgLatency: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  throughput: number;
  frameRateAvg?: number;
  frameRateMin?: number;
  frameRateP95?: number;
  memoryLeaked?: number;
  cpuUsageAvg?: number;
  cpuUsageMax?: number;
}

/**
 * 告警信息
 */
export interface Alert {
  timestamp: number;
  type: 'warning' | 'error' | 'critical';
  metric: MetricType;
  message: string;
  value: number;
  threshold: number;
}

/**
 * 测试报告配置
 */
export interface ReportConfig {
  outputPath: string;
  format: 'json' | 'html' | 'markdown' | 'all';
  includeCharts: boolean;
  includeRawData: boolean;
  archivePath?: string;           // 归档路径
  maxArchiveDays?: number;        // 保留归档天数
}

/**
 * 默认负载配置
 */
export const DEFAULT_LOAD_CONFIG: LoadConfig = {
  pattern: LoadPattern.CONSTANT,
  targetQPS: 1000,
  duration: 300,  // 5 分钟
  concurrentUsers: 100,
};

/**
 * 默认监控配置
 */
export const DEFAULT_MONITOR_CONFIG: MonitorConfig = {
  samplingInterval: 1000,  // 1 秒
  alertThresholds: {
    cpuUsage: 0.8,      // 80%
    memoryUsage: 0.9,   // 90%
    latency: 1000,      // 1 秒
    errorRate: 0.05,    // 5%
  },
  enableProfiling: true,
};

/**
 * 压力测试目标配置
 */
export const STRESS_TEST_TARGETS = {
  HIGH_LOAD: {
    qps: 15000,
    duration: 8 * 60 * 60,  // 8 小时
    description: '15k QPS for 8 hours',
  },
  MEDIUM_LOAD: {
    qps: 5000,
    duration: 2 * 60 * 60,  // 2 小时
    description: '5k QPS for 2 hours',
  },
  LOW_LOAD: {
    qps: 1000,
    duration: 30 * 60,  // 30 分钟
    description: '1k QPS for 30 minutes',
  },
} as const;
