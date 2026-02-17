import {
  IAPIContext,
  IAPIResponse,
  IAPIMiddlewareConfig,
  IAuthResult,
  IRateLimitResult,
  AuthType,
  AuthError,
  RateLimitError,
  PermissionError,
  APIError,
} from './style-types.js';
import { AuthenticationService } from './AuthenticationService.js';
import { RateLimiterService } from './RateLimiterService.js';

/**
 * API 中间件配置项
 */
interface IMiddlewareHandlers {
  /** 鉴权处理器 */
  authHandler?: (context: IAPIContext) => Promise<IAuthResult>;

  /** 限流处理器 */
  rateLimitHandler?: (context: IAPIContext) => Promise<IRateLimitResult>;

  /** 业务逻辑处理器 */
  businessHandler: (context: IAPIContext) => Promise<any>;

  /** 请求日志处理器 */
  logHandler?: (context: IAPIContext, result: IAPIResponse) => Promise<void>;

  /** 错误处理器 */
  errorHandler?: (error: Error, context: IAPIContext) => Promise<APIError>;
}

/**
 * API 中间件
 * 整合鉴权、限流、日志记录等中间件能力
 */
export class APIMiddleware {
  private _config: IAPIMiddlewareConfig;
  private _authService: AuthenticationService;
  private _rateLimiterService: RateLimiterService;

  constructor(
    config: IAPIMiddlewareConfig,
    authService: AuthenticationService,
    rateLimiterService: RateLimiterService
  ) {
    this._config = config;
    this._authService = authService;
    this._rateLimiterService = rateLimiterService;
  }

  /**
   * 更新配置
   */
  async updateConfig(updates: Partial<IAPIMiddlewareConfig>): Promise<void> {
    this._config = { ...this._config, ...updates };
  }

  /**
   * 获取配置
   */
  async getConfig(): Promise<IAPIMiddlewareConfig> {
    return { ...this._config };
  }

  /**
   * 处理 API 请求
   */
  async handleRequest(
    context: IAPIContext,
    handlers: IMiddlewareHandlers
  ): Promise<APIResponse> {
    const startTime = performance.now();

    try {
      // 鉴权
      if (this._config.enableAuth) {
        const authHandler =
          handlers.authHandler ?? this._defaultAuthHandler.bind(this);
        const authResult = await authHandler(context);

        if (!authResult.success) {
          throw new AuthError(
            authResult.errorCode ?? 'UNAUTHORIZED',
            authResult.error ?? 'Authentication failed'
          );
        }

        // 保存鉴权结果到上下文
        context.attributes = {
          ...context.attributes,
          userId: authResult.userId,
          scopes: authResult.scopes,
        };
      }

      // 限流
      if (this._config.enableRateLimit) {
        const rateLimitHandler =
          handlers.rateLimitHandler ?? this._defaultRateLimitHandler.bind(this);
        const rateLimitResult = await rateLimitHandler(context);

        if (!rateLimitResult.allowed) {
          throw new RateLimitError(
            rateLimitResult.error ?? 'Rate limit exceeded'
          );
        }

        // 保存限流结果到上下文
        context.attributes = {
          ...context.attributes,
          rateLimitRemaining: rateLimitResult.remaining,
          rateLimitResetAfter: rateLimitResult.resetAfter,
        };
      }

      // 业务逻辑
      const data = await handlers.businessHandler(context);

      // 构建成功响应
      const response = new APIResponse({
        success: true,
        data,
        requestId: context.requestId,
        timestamp: Date.now(),
      });

      // 请求日志
      if (this._config.enableLogging && handlers.logHandler) {
        await handlers.logHandler(context, response);
      }

      return response;
    } catch (error) {
      // 错误处理
      const errorHandler =
        handlers.errorHandler ?? this._defaultErrorHandler.bind(this);
      const apiError = await errorHandler(error as Error, context);

      const response = new APIResponse({
        success: false,
        error: apiError.message,
        errorCode: apiError.code,
        requestId: context.requestId,
        timestamp: Date.now(),
      });

      // 记录错误日志
      if (this._config.enableLogging && handlers.logHandler) {
        await handlers.logHandler(context, response);
      }

      return response;
    }
  }

  /**
   * 创建 API 上下文
   */
  createContext(
    requestId: string,
    clientIp: string,
    credential: string,
    path: string,
    method: string,
    userAgent?: string,
    attributes?: Record<string, any>
  ): IAPIContext {
    return {
      requestId,
      clientIp,
      userAgent: userAgent ?? '',
      credential,
      path,
      method,
      timestamp: Date.now(),
      attributes,
    };
  }

  /**
   * 默认鉴权处理器
   */
  private async _defaultAuthHandler(
    context: IAPIContext
  ): Promise<IAuthResult> {
    // 判断凭证类型
    let authType: AuthType;
    if (context.credential.startsWith('sk_')) {
      authType = AuthType.API_KEY;
    } else if (context.credential.includes('.')) {
      authType = AuthType.JWT;
    } else {
      authType = AuthType.API_KEY;
    }

    return this._authService.verifyCredential(context.credential, authType);
  }

  /**
   * 默认限流处理器
   */
  private async _defaultRateLimitHandler(
    context: IAPIContext
  ): Promise<IRateLimitResult> {
    // 使用 API Key 或 IP 作为限流标识
    const identifier = context.credential.startsWith('sk_')
      ? context.credential
      : context.clientIp;

    return this._rateLimiterService.checkRateLimit(identifier);
  }

  /**
   * 默认错误处理器
   */
  private async _defaultErrorHandler(
    error: Error,
    context: IAPIContext
  ): Promise<APIError> {
    // 已经是 APIError，直接返回
    if (error instanceof APIError) {
      return error;
    }

    // 转换为 APIError
    return new APIError('INTERNAL_ERROR', error.message, 500);
  }
}

/**
 * API 响应类
 */
export class APIResponse {
  private _data: IAPIResponse;

  constructor(data: IAPIResponse) {
    this._data = data;
  }

  get data(): IAPIResponse {
    return this._data;
  }

  /**
   * 转换为 JSON
   */
  toJSON(): IAPIResponse {
    return { ...this._data };
  }

  /**
   * 转换为 HTTP 响应
   */
  toHTTPResponse(): { statusCode: number; body: IAPIResponse } {
    let statusCode = 200;

    if (!this._data.success) {
      // 根据错误代码确定状态码
      if (this._data.errorCode === 'INVALID_API_KEY' || this._data.errorCode === 'EXPIRED_API_KEY' || this._data.errorCode === 'INVALID_TOKEN' || this._data.errorCode === 'EXPIRED_TOKEN') {
        statusCode = 401;
      } else if (this._data.errorCode === 'INSUFFICIENT_PERMISSION' || this._data.errorCode === 'INSUFFICIENT_SCOPES') {
        statusCode = 403;
      } else if (this._data.errorCode === 'RATE_LIMIT_EXCEEDED') {
        statusCode = 429;
      } else {
        statusCode = 500;
      }
    }

    return {
      statusCode,
      body: this._data,
    };
  }

  /**
   * 添加响应头
   */
  getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'X-Request-Id': this._data.requestId,
      'X-Timestamp': this._data.timestamp.toString(),
    };

    // 添加限流相关头
    if (this._data.success && this._data.attributes?.rateLimitRemaining !== undefined) {
      headers['X-RateLimit-Remaining'] = String(this._data.attributes.rateLimitRemaining);
      headers['X-RateLimit-Reset'] = String(this._data.attributes.rateLimitResetAfter);
    }

    return headers;
  }
}

/**
 * 快捷方法：创建带有鉴权和限流的 API 处理器
 */
export function createAPIHandler(
  middleware: APIMiddleware,
  businessHandler: (context: IAPIContext) => Promise<any>,
  options?: {
    requiredScopes?: string[];
    customRateLimitIdentifier?: (context: IAPIContext) => string;
  }
) {
  return async (context: IAPIContext): Promise<APIResponse> => {
    return middleware.handleRequest(context, {
      businessHandler,
      authHandler: async (ctx) => {
        // 验证凭证
        let authType: AuthType;
        if (ctx.credential.startsWith('sk_')) {
          authType = AuthType.API_KEY;
        } else if (ctx.credential.includes('.')) {
          authType = AuthType.JWT;
        } else {
          authType = AuthType.API_KEY;
        }

        const result = await (middleware as any)._authService.verifyCredential(
          ctx.credential,
          authType
        );

        if (!result.success) {
          return result;
        }

        // 检查权限范围
        if (options?.requiredScopes && result.scopes) {
          const hasRequiredScopes = options.requiredScopes.every(scope =>
            result.scopes!.includes(scope)
          );
          if (!hasRequiredScopes) {
            return {
              success: false,
              error: 'Insufficient permissions',
              errorCode: 'INSUFFICIENT_SCOPES',
            };
          }
        }

        return result;
      },
      rateLimitHandler: async (ctx) => {
        const identifier = options?.customRateLimitIdentifier
          ? options.customRateLimitIdentifier(ctx)
          : ctx.credential.startsWith('sk_')
          ? ctx.credential
          : ctx.clientIp;

        return (middleware as any)._rateLimiterService.checkRateLimit(
          identifier
        );
      },
    });
  };
}

/**
 * 快捷方法：批量处理 API 请求
 */
export async function batchHandleRequests(
  middleware: APIMiddleware,
  contexts: IAPIContext[],
  handlers: IMiddlewareHandlers
): Promise<APIResponse[]> {
  // 并发处理所有请求
  const results = await Promise.all(
    contexts.map(ctx => middleware.handleRequest(ctx, handlers))
  );

  return results;
}
