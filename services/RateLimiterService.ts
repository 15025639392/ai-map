import {
  IRateLimitConfig,
  IRateLimitResult,
  IRateLimitStats,
  RateLimitAlgorithm,
  RateLimitError,
} from './style-types.js';

/**
 * 滑动窗口记录
 */
interface IWindowRecord {
  /** 请求时间戳 */
  timestamp: number;

  /** 请求标识 */
  requestId: string;
}

/**
 * 令牌桶状态
 */
interface ITokenBucket {
  /** 当前令牌数 */
  tokens: number;

  /** 最后更新时间 */
  lastRefill: number;
}

/**
 * 限流服务
 * 基于滑动窗口算法实现高并发限流（5k QPS）
 */
export class RateLimiterService {
  private _config: IRateLimitConfig;

  /** 滑动窗口记录：Map<identifier, IWindowRecord[]> */
  private _windowRecords: Map<string, IWindowRecord[]>;

  /** 令牌桶状态：Map<identifier, ITokenBucket> */
  private _tokenBuckets: Map<string, ITokenBucket>;

  /** 统计数据 */
  private _stats: IRateLimitStats;

  /** 延迟记录 */
  private _latencies: number[];

  constructor(config: IRateLimitConfig) {
    this._config = config;
    this._windowRecords = new Map();
    this._tokenBuckets = new Map();
    this._latencies = [];

    this._stats = {
      totalRequests: 0,
      blockedRequests: 0,
      allowedRequests: 0,
      blockRate: 0,
      avgLatency: 0,
      p99Latency: 0,
      updatedAt: Date.now(),
    };
  }

  /**
   * 检查限流
   */
  async checkRateLimit(
    identifier: string,
    requestId?: string
  ): Promise<IRateLimitResult> {
    const startTime = performance.now();
    this._stats.totalRequests++;

    let result: IRateLimitResult;

    switch (this._config.algorithm) {
      case RateLimitAlgorithm.SLIDING_WINDOW:
        result = this._checkSlidingWindow(identifier, requestId ?? '');
        break;
      case RateLimitAlgorithm.TOKEN_BUCKET:
        result = this._checkTokenBucket(identifier);
        break;
      case RateLimitAlgorithm.FIXED_WINDOW:
        result = this._checkFixedWindow(identifier);
        break;
      case RateLimitAlgorithm.LEAKY_BUCKET:
        result = this._checkLeakyBucket(identifier);
        break;
      default:
        result = this._checkSlidingWindow(identifier, requestId ?? '');
    }

    if (result.allowed) {
      this._stats.allowedRequests++;
    } else {
      this._stats.blockedRequests++;
    }

    // 更新统计
    this._stats.blockRate =
      this._stats.totalRequests > 0
        ? this._stats.blockedRequests / this._stats.totalRequests
        : 0;

    // 记录延迟
    const latency = performance.now() - startTime;
    this._latencies.push(latency);
    if (this._latencies.length > 1000) {
      this._latencies.shift();
    }
    this._updateLatencyStats();

    this._stats.updatedAt = Date.now();

    return result;
  }

  /**
   * 重置限流
   */
  async resetRateLimit(identifier: string): Promise<void> {
    this._windowRecords.delete(identifier);
    this._tokenBuckets.delete(identifier);
  }

  /**
   * 批量重置限流
   */
  async resetAllRateLimits(): Promise<void> {
    this._windowRecords.clear();
    this._tokenBuckets.clear();
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<IRateLimitStats> {
    this._updateLatencyStats();
    return { ...this._stats };
  }

  /**
   * 重置统计信息
   */
  async resetStats(): Promise<void> {
    this._stats = {
      totalRequests: 0,
      blockedRequests: 0,
      allowedRequests: 0,
      blockRate: 0,
      avgLatency: 0,
      p99Latency: 0,
      updatedAt: Date.now(),
    };
    this._latencies = [];
  }

  /**
   * 更新配置
   */
  async updateConfig(updates: Partial<IRateLimitConfig>): Promise<void> {
    this._config = { ...this._config, ...updates };
  }

  /**
   * 获取配置
   */
  async getConfig(): Promise<IRateLimitConfig> {
    return { ...this._config };
  }

  /**
   * 检查滑动窗口限流
   */
  private _checkSlidingWindow(
    identifier: string,
    requestId: string
  ): IRateLimitResult {
    const now = Date.now();
    const windowMs = this._config.windowSize * 1000;
    const windowStart = now - windowMs;

    // 获取或创建窗口记录
    let records = this._windowRecords.get(identifier);
    if (!records) {
      records = [];
      this._windowRecords.set(identifier, records);
    }

    // 清理过期记录
    records = records.filter(r => r.timestamp >= windowStart);
    this._windowRecords.set(identifier, records);

    // 检查是否超过限制
    if (records.length >= this._config.maxRequests) {
      // 计算最早记录的过期时间
      const oldestRecord = records[0];
      const resetAfter = Math.ceil(
        (oldestRecord.timestamp + windowMs - now) / 1000
      );

      return {
        allowed: false,
        remaining: 0,
        resetAfter,
        error: `Rate limit exceeded: ${this._config.maxRequests} requests per ${this._config.windowSize}s`,
      };
    }

    // 添加新记录
    records.push({ timestamp: now, requestId });

    // 计算剩余请求数
    const remaining = this._config.maxRequests - records.length;

    // 计算重置时间
    const resetAfter = windowMs / 1000;

    return {
      allowed: true,
      remaining,
      resetAfter,
    };
  }

  /**
   * 检查令牌桶限流
   */
  private _checkTokenBucket(identifier: string): IRateLimitResult {
    const now = Date.now();
    const windowMs = this._config.windowSize * 1000;

    // 计算补充速率（每秒补充的令牌数）
    const refillRate = this._config.maxRequests / this._config.windowSize;

    // 获取或创建令牌桶
    let bucket = this._tokenBuckets.get(identifier);
    if (!bucket) {
      bucket = {
        tokens: this._config.maxRequests,
        lastRefill: now,
      };
      this._tokenBuckets.set(identifier, bucket);
    }

    // 补充令牌
    const elapsed = (now - bucket.lastRefill) / 1000; // 秒
    const tokensToAdd = Math.floor(elapsed * refillRate);
    bucket.tokens = Math.min(
      bucket.tokens + tokensToAdd,
      this._config.maxRequests
    );
    bucket.lastRefill = now;
    this._tokenBuckets.set(identifier, bucket);

    // 检查是否有令牌
    if (bucket.tokens >= 1) {
      bucket.tokens--;
      this._tokenBuckets.set(identifier, bucket);

      // 计算补充满令牌的时间
      const tokensNeeded = this._config.maxRequests - bucket.tokens;
      const refillTime = tokensNeeded / refillRate;

      return {
        allowed: true,
        remaining: Math.floor(bucket.tokens),
        resetAfter: Math.ceil(refillTime),
      };
    }

    // 没有令牌，计算等待时间
    const waitTime = (1 - bucket.tokens) / refillRate;

    return {
      allowed: false,
      remaining: 0,
      resetAfter: Math.ceil(waitTime),
      error: `Rate limit exceeded: bucket is empty, wait ${Math.ceil(waitTime)}s`,
    };
  }

  /**
   * 检查固定窗口限流
   */
  private _checkFixedWindow(identifier: string): IRateLimitResult {
    const now = Date.now();
    const windowMs = this._config.windowSize * 1000;

    // 计算当前窗口的起始时间
    const currentWindowStart = Math.floor(now / windowMs) * windowMs;
    const nextWindowStart = currentWindowStart + windowMs;

    // 使用窗口起始时间作为键
    const windowKey = `${identifier}_${currentWindowStart}`;

    let count = this._windowRecords.get(windowKey)?.length ?? 0;

    if (count >= this._config.maxRequests) {
      const resetAfter = Math.ceil((nextWindowStart - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetAfter,
        error: `Rate limit exceeded: ${this._config.maxRequests} requests per ${this._config.windowSize}s`,
      };
    }

    // 增加计数
    const records = this._windowRecords.get(windowKey) ?? [];
    records.push({ timestamp: now, requestId: windowKey });
    this._windowRecords.set(windowKey, records);

    count++;

    // 清理过期窗口
    const oldWindowKey = `${identifier}_${currentWindowStart - windowMs}`;
    this._windowRecords.delete(oldWindowKey);

    return {
      allowed: true,
      remaining: this._config.maxRequests - count,
      resetAfter: Math.ceil((nextWindowStart - now) / 1000),
    };
  }

  /**
   * 检查漏桶限流
   */
  private _checkLeakyBucket(identifier: string): IRateLimitResult {
    const now = Date.now();

    // 漏桶速率（每秒处理的请求数）
    const leakRate = this._config.maxRequests / this._config.windowSize;

    // 获取或创建桶（复用令牌桶的数据结构）
    let bucket = this._tokenBuckets.get(identifier);
    if (!bucket) {
      bucket = {
        tokens: 0,
        lastRefill: now,
      };
      this._tokenBuckets.set(identifier, bucket);
    }

    // 漏出（减少令牌）
    const elapsed = (now - bucket.lastRefill) / 1000; // 秒
    const tokensToLeak = elapsed * leakRate;
    bucket.tokens = Math.max(0, bucket.tokens - tokensToLeak);
    bucket.lastRefill = now;

    // 检查桶是否已满（如果桶中的令牌 >= maxRequests，说明请求堆积过多，需要阻塞）
    // 使用略微宽松的检查，处理浮点数精度问题
    if (bucket.tokens >= this._config.maxRequests - 0.0001) {
      const waitTime = (bucket.tokens - this._config.maxRequests + 1) / leakRate;

      return {
        allowed: false,
        remaining: 0,
        resetAfter: Math.ceil(waitTime),
        error: `Rate limit exceeded: bucket is full, wait ${Math.ceil(waitTime)}s`,
      };
    }

    // 添加令牌到桶中
    bucket.tokens++;
    this._tokenBuckets.set(identifier, bucket);

    return {
      allowed: true,
      remaining: Math.max(0, Math.floor(this._config.maxRequests - bucket.tokens)),
      resetAfter: bucket.tokens / leakRate,
    };
  }

  /**
   * 更新延迟统计
   */
  private _updateLatencyStats(): void {
    if (this._latencies.length === 0) {
      this._stats.avgLatency = 0;
      this._stats.p99Latency = 0;
      return;
    }

    // 计算平均延迟
    const sum = this._latencies.reduce((a, b) => a + b, 0);
    this._stats.avgLatency = sum / this._latencies.length;

    // 计算 P99 延迟
    const sorted = [...this._latencies].sort((a, b) => a - b);
    const p99Index = Math.floor(sorted.length * 0.99);
    this._stats.p99Latency = sorted[p99Index] ?? sorted[sorted.length - 1];
  }

  /**
   * 清理过期数据
   */
  async cleanup(): Promise<number> {
    const now = Date.now();
    const windowMs = this._config.windowSize * 1000;
    const windowStart = now - windowMs;

    let cleaned = 0;

    // 清理滑动窗口记录
    for (const [key, records] of this._windowRecords.entries()) {
      const validRecords = records.filter(r => r.timestamp >= windowStart);
      if (validRecords.length === 0) {
        this._windowRecords.delete(key);
        cleaned++;
      } else if (validRecords.length !== records.length) {
        this._windowRecords.set(key, validRecords);
      }
    }

    return cleaned;
  }
}
