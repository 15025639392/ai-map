/**
 * 样式服务、鉴权、限流相关类型定义
 */

/**
 * 样式类型
 */
export enum StyleType {
  /** 矢量图层样式 */
  VECTOR = 'vector',
  /** 栅格图层样式 */
  RASTER = 'raster',
  /** 地形样式 */
  TERRAIN = 'terrain',
  /** 标注样式 */
  LABEL = 'label',
}

/**
 * 样式配置接口
 */
export interface IStyleConfig {
  /** 样式 ID */
  id: string;

  /** 样式名称 */
  name: string;

  /** 样式类型 */
  type: StyleType;

  /** 样式定义（JSON 字符串） */
  definition: string;

  /** 创建者 ID */
  createdBy: string;

  /** 创建时间戳 */
  createdAt: number;

  /** 更新时间戳 */
  updatedAt: number;

  /** 版本号 */
  version: number;

  /** 是否公开 */
  isPublic: boolean;

  /** 标签 */
  tags?: string[];

  /** 描述 */
  description?: string;
}

/**
 * 样式创建配置
 */
export interface ICreateStyleConfig {
  /** 样式名称 */
  name: string;

  /** 样式类型 */
  type: StyleType;

  /** 样式定义 */
  definition: string;

  /** 创建者 ID */
  createdBy: string;

  /** 是否公开 */
  isPublic?: boolean;

  /** 标签 */
  tags?: string[];

  /** 描述 */
  description?: string;
}

/**
 * 样式更新配置
 */
export interface IUpdateStyleConfig {
  /** 样式名称 */
  name?: string;

  /** 样式定义 */
  definition?: string;

  /** 是否公开 */
  isPublic?: boolean;

  /** 标签 */
  tags?: string[];

  /** 描述 */
  description?: string;
}

/**
 * 样式查询配置
 */
export interface IStyleQuery {
  /** 样式 ID */
  id?: string;

  /** 创建者 ID */
  createdBy?: string;

  /** 样式类型 */
  type?: StyleType;

  /** 是否公开 */
  isPublic?: boolean;

  /** 标签 */
  tags?: string[];

  /** 关键词搜索 */
  keyword?: string;

  /** 分页偏移 */
  offset?: number;

  /** 每页数量 */
  limit?: number;
}

/**
 * 样式查询结果
 */
export interface IStyleQueryResult {
  /** 样式列表 */
  styles: IStyleConfig[];

  /** 总数 */
  total: number;

  /** 偏移量 */
  offset: number;

  /** 每页数量 */
  limit: number;
}

/**
 * 样式应用配置
 */
export interface IApplyStyleConfig {
  /** 样式 ID */
  styleId: string;

  /** 应用目标 */
  target: string;

  /** 应用参数 */
  params?: Record<string, any>;
}

/**
 * 样式应用结果
 */
export interface IApplyStyleResult {
  /** 应用成功 */
  success: boolean;

  /** 应用时间戳 */
  appliedAt: number;

  /** 样式版本 */
  version: number;

  /** 错误信息 */
  error?: string;
}

/**
 * 鉴权方式
 */
export enum AuthType {
  /** API Key */
  API_KEY = 'api_key',

  /** JWT Token */
  JWT = 'jwt',

  /** OAuth */
  OAUTH = 'oauth',
}

/**
 * API Key 配置
 */
export interface IAPIKey {
  /** Key 值 */
  key: string;

  /** 用户 ID */
  userId: string;

  /** 权限范围 */
  scopes: string[];

  /** 创建时间 */
  createdAt: number;

  /** 过期时间 */
  expiresAt: number;

  /** 最后使用时间 */
  lastUsedAt?: number;

  /** 是否激活 */
  active: boolean;

  /** 速率限制（每分钟请求数） */
  rateLimit?: number;

  /** 描述 */
  description?: string;
}

/**
 * API Key 创建配置
 */
export interface ICreateAPIKeyConfig {
  /** 用户 ID */
  userId: string;

  /** 权限范围 */
  scopes: string[];

  /** 过期时间（秒，0 表示永不过期） */
  expiresIn?: number;

  /** 速率限制 */
  rateLimit?: number;

  /** 描述 */
  description?: string;
}

/**
 * JWT Token 配置
 */
export interface IJWTConfig {
  /** Secret */
  secret: string;

  /** 过期时间（秒） */
  expiresIn: number;

  /** 签发者 */
  issuer?: string;

  /** 受众 */
  audience?: string;
}

/**
 * JWT Payload
 */
export interface IJWTPayload {
  /** 用户 ID */
  userId: string;

  /** 权限范围 */
  scopes: string[];

  /** 签发时间 */
  iat: number;

  /** 过期时间 */
  exp: number;

  /** 签发者 */
  iss?: string;

  /** 受众 */
  aud?: string;
}

/**
 * 鉴权结果
 */
export interface IAuthResult {
  /** 鉴权成功 */
  success: boolean;

  /** 用户 ID */
  userId?: string;

  /** 权限范围 */
  scopes?: string[];

  /** 错误信息 */
  error?: string;

  /** 错误代码 */
  errorCode?: 'INVALID_API_KEY' | 'EXPIRED_API_KEY' | 'INVALID_TOKEN' | 'EXPIRED_TOKEN' | 'INSUFFICIENT_SCOPES';
}

/**
 * 权限检查结果
 */
export interface IPermissionCheck {
  /** 是否有权限 */
  granted: boolean;

  /** 缺少的权限 */
  missingScopes?: string[];

  /** 错误信息 */
  error?: string;
}

/**
 * 限流算法类型
 */
export enum RateLimitAlgorithm {
  /** 固定窗口 */
  FIXED_WINDOW = 'fixed_window',

  /** 滑动窗口 */
  SLIDING_WINDOW = 'sliding_window',

  /** 令牌桶 */
  TOKEN_BUCKET = 'token_bucket',

  /** 漏桶 */
  LEAKY_BUCKET = 'leaky_bucket',
}

/**
 * 限流配置
 */
export interface IRateLimitConfig {
  /** 时间窗口（秒） */
  windowSize: number;

  /** 最大请求数 */
  maxRequests: number;

  /** 算法类型 */
  algorithm: RateLimitAlgorithm;
}

/**
 * 限流结果
 */
export interface IRateLimitResult {
  /** 是否允许请求 */
  allowed: boolean;

  /** 剩余请求数 */
  remaining: number;

  /** 重置时间（秒） */
  resetAfter: number;

  /** 错误信息 */
  error?: string;
}

/**
 * 限流统计
 */
export interface IRateLimitStats {
  /** 总请求数 */
  totalRequests: number;

  /** 被限流请求数 */
  blockedRequests: number;

  /** 通过请求数 */
  allowedRequests: number;

  /** 限流率 */
  blockRate: number;

  /** 平均延迟（毫秒） */
  avgLatency: number;

  /** P99 延迟（毫秒） */
  p99Latency: number;

  /** 更新时间 */
  updatedAt: number;
}

/**
 * API 请求上下文
 */
export interface IAPIContext {
  /** 请求 ID */
  requestId: string;

  /** 客户端 IP */
  clientIp: string;

  /** User Agent */
  userAgent: string;

  /** API Key 或 Token */
  credential: string;

  /** 请求路径 */
  path: string;

  /** HTTP 方法 */
  method: string;

  /** 请求时间戳 */
  timestamp: number;

  /** 自定义属性 */
  attributes?: Record<string, any>;
}

/**
 * API 中间件配置
 */
export interface IAPIMiddlewareConfig {
  /** 是否启用鉴权 */
  enableAuth: boolean;

  /** 是否启用限流 */
  enableRateLimit: boolean;

  /** 是否启用日志 */
  enableLogging: boolean;

  /** 限流配置 */
  rateLimitConfig: IRateLimitConfig;

  /** JWT 配置 */
  jwtConfig?: IJWTConfig;
}

/**
 * API 响应
 */
export interface IAPIResponse<T = any> {
  /** 成功 */
  success: boolean;

  /** 数据 */
  data?: T;

  /** 错误信息 */
  error?: string;

  /** 错误代码 */
  errorCode?: string;

  /** 请求 ID */
  requestId: string;

  /** 时间戳 */
  timestamp: number;
}

/**
 * API 错误
 */
export class APIError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * 鉴权错误
 */
export class AuthError extends APIError {
  constructor(code: string, message: string) {
    super(code, message, 401);
    this.name = 'AuthError';
  }
}

/**
 * 限流错误
 */
export class RateLimitError extends APIError {
  constructor(message: string) {
    super('RATE_LIMIT_EXCEEDED', message, 429);
    this.name = 'RateLimitError';
  }
}

/**
 * 权限错误
 */
export class PermissionError extends APIError {
  constructor(message: string) {
    super('INSUFFICIENT_PERMISSION', message, 403);
    this.name = 'PermissionError';
  }
}
