import {
  IAPIKey,
  ICreateAPIKeyConfig,
  IJWTConfig,
  IJWTPayload,
  IAuthResult,
  IPermissionCheck,
  AuthType,
  AuthError,
  PermissionError,
} from './style-types.js';

/**
 * 鉴权服务
 * 提供 API Key 验证、Token 生成与验证、权限校验等功能
 */
export class AuthenticationService {
  private _apiKeys: Map<string, IAPIKey>;
  private _jwtConfig?: IJWTConfig;

  constructor(config?: { jwtConfig?: IJWTConfig }) {
    this._apiKeys = new Map();
    this._jwtConfig = config?.jwtConfig;
  }

  /**
   * 设置 JWT 配置
   */
  setJWTConfig(config: IJWTConfig): void {
    this._jwtConfig = config;
  }

  /**
   * 创建 API Key
   */
  async createAPIKey(config: ICreateAPIKeyConfig): Promise<IAPIKey> {
    const key = this._generateAPIKey();
    const now = Date.now();

    // 默认过期时间为 30 天（2592000 秒）
    const defaultExpiresIn = 2592000;

    const apiKey: IAPIKey = {
      key,
      userId: config.userId,
      scopes: config.scopes,
      createdAt: now,
      expiresAt: config.expiresIn !== undefined && config.expiresIn > 0
        ? now + config.expiresIn * 1000
        : config.expiresIn === 0
        ? 0
        : now + defaultExpiresIn * 1000,
      active: true,
      rateLimit: config.rateLimit,
      description: config.description,
    };

    this._apiKeys.set(key, apiKey);

    return { ...apiKey };
  }

  /**
   * 获取 API Key
   */
  async getAPIKey(key: string): Promise<IAPIKey | null> {
    const apiKey = this._apiKeys.get(key);
    return apiKey ? { ...apiKey } : null;
  }

  /**
   * 验证 API Key
   */
  async verifyAPIKey(key: string): Promise<IAuthResult> {
    const apiKey = this._apiKeys.get(key);

    if (!apiKey) {
      return {
        success: false,
        error: 'Invalid API key',
        errorCode: 'INVALID_API_KEY',
      };
    }

    if (!apiKey.active) {
      return {
        success: false,
        error: 'API key is inactive',
        errorCode: 'INVALID_API_KEY',
      };
    }

    if (apiKey.expiresAt > 0 && Date.now() > apiKey.expiresAt) {
      return {
        success: false,
        error: 'API key has expired',
        errorCode: 'EXPIRED_API_KEY',
      };
    }

    // 更新最后使用时间
    apiKey.lastUsedAt = Date.now();

    return {
      success: true,
      userId: apiKey.userId,
      scopes: apiKey.scopes,
    };
  }

  /**
   * 撤销 API Key
   */
  async revokeAPIKey(key: string): Promise<boolean> {
    const apiKey = this._apiKeys.get(key);
    if (!apiKey) {
      return false;
    }

    apiKey.active = false;
    return true;
  }

  /**
   * 删除 API Key
   */
  async deleteAPIKey(key: string): Promise<boolean> {
    return this._apiKeys.delete(key);
  }

  /**
   * 列出用户的 API Keys
   */
  async listUserAPIKeys(userId: string): Promise<IAPIKey[]> {
    const apiKeys = Array.from(this._apiKeys.values())
      .filter(ak => ak.userId === userId)
      .map(ak => ({ ...ak }));

    return apiKeys;
  }

  /**
   * 更新 API Key
   */
  async updateAPIKey(
    key: string,
    updates: Partial<{
      active: boolean;
      rateLimit: number;
      description: string;
      scopes: string[];
    }>
  ): Promise<IAPIKey | null> {
    const apiKey = this._apiKeys.get(key);
    if (!apiKey) {
      return null;
    }

    Object.assign(apiKey, updates);

    return { ...apiKey };
  }

  /**
   * 生成 JWT Token
   */
  async generateToken(userId: string, scopes: string[]): Promise<string> {
    if (!this._jwtConfig) {
      throw new AuthError('JWT_NOT_CONFIGURED', 'JWT configuration not set');
    }

    const now = Date.now();
    const iat = Math.floor(now / 1000);
    const exp = iat + this._jwtConfig.expiresIn;

    const payload: IJWTPayload = {
      userId,
      scopes,
      iat,
      exp,
      iss: this._jwtConfig.issuer,
      aud: this._jwtConfig.audience,
    };

    // 简化实现：返回 Base64 编码的 payload
    // 实际实现应该使用 JWT 库（如 jsonwebtoken）进行签名
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
      'base64'
    );
    const encodedSecret = Buffer.from(this._jwtConfig.secret).toString(
      'base64'
    );

    // 模拟签名（实际应使用 HMAC-SHA256）
    const signature = this._sign(encodedPayload, this._jwtConfig.secret);

    return `${encodedPayload}.${signature}`;
  }

  /**
   * 验证 JWT Token
   */
  async verifyToken(token: string): Promise<IAuthResult> {
    if (!this._jwtConfig) {
      return {
        success: false,
        error: 'JWT configuration not set',
        errorCode: 'INVALID_TOKEN',
      };
    }

    try {
      const parts = token.split('.');
      if (parts.length !== 2) {
        return {
          success: false,
          error: 'Invalid token format',
          errorCode: 'INVALID_TOKEN',
        };
      }

      const [encodedPayload, signature] = parts;

      // 验证签名
      const expectedSignature = this._sign(
        encodedPayload,
        this._jwtConfig.secret
      );
      if (signature !== expectedSignature) {
        return {
          success: false,
          error: 'Invalid token signature',
          errorCode: 'INVALID_TOKEN',
        };
      }

      // 解码 payload
      const payload = JSON.parse(
        Buffer.from(encodedPayload, 'base64').toString()
      ) as IJWTPayload;

      // 验证过期时间
      if (payload.exp < Math.floor(Date.now() / 1000)) {
        return {
          success: false,
          error: 'Token has expired',
          errorCode: 'EXPIRED_TOKEN',
        };
      }

      // 验证签发者和受众（可选）
      if (
        this._jwtConfig.issuer &&
        payload.iss &&
        payload.iss !== this._jwtConfig.issuer
      ) {
        return {
          success: false,
          error: 'Invalid token issuer',
          errorCode: 'INVALID_TOKEN',
        };
      }

      if (
        this._jwtConfig.audience &&
        payload.aud &&
        payload.aud !== this._jwtConfig.audience
      ) {
        return {
          success: false,
          error: 'Invalid token audience',
          errorCode: 'INVALID_TOKEN',
        };
      }

      return {
        success: true,
        userId: payload.userId,
        scopes: payload.scopes,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Invalid token',
        errorCode: 'INVALID_TOKEN',
      };
    }
  }

  /**
   * 检查权限
   */
  async checkPermission(
    userId: string,
    requiredScopes: string[],
    userScopes: string[]
  ): Promise<IPermissionCheck> {
    const missingScopes: string[] = [];

    for (const scope of requiredScopes) {
      if (!this._hasScope(userScopes, scope)) {
        missingScopes.push(scope);
      }
    }

    if (missingScopes.length > 0) {
      return {
        granted: false,
        missingScopes,
        error: `Missing required scopes: ${missingScopes.join(', ')}`,
      };
    }

    return {
      granted: true,
    };
  }

  /**
   * 验证凭证（API Key 或 Token）
   */
  async verifyCredential(credential: string, type: AuthType): Promise<IAuthResult> {
    switch (type) {
      case AuthType.API_KEY:
        return this.verifyAPIKey(credential);
      case AuthType.JWT:
        return this.verifyToken(credential);
      default:
        return {
          success: false,
          error: 'Unsupported auth type',
          errorCode: 'INVALID_API_KEY',
        };
    }
  }

  /**
   * 清理过期的 API Keys
   */
  async cleanupExpiredAPIKeys(): Promise<number> {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, apiKey] of this._apiKeys.entries()) {
      if (apiKey.expiresAt > 0 && now > apiKey.expiresAt) {
        this._apiKeys.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * 获取 API Key 统计
   */
  async getAPIKeyStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    expired: number;
  }> {
    const now = Date.now();
    const apiKeys = Array.from(this._apiKeys.values());

    return {
      total: apiKeys.length,
      active: apiKeys.filter(ak => ak.active).length,
      inactive: apiKeys.filter(ak => !ak.active).length,
      expired: apiKeys.filter(
        ak => ak.expiresAt > 0 && now > ak.expiresAt
      ).length,
    };
  }

  /**
   * 清空所有 API Keys（测试用）
   */
  async clearAll(): Promise<void> {
    this._apiKeys.clear();
  }

  /**
   * 生成 API Key
   */
  private _generateAPIKey(): string {
    const timestamp = Date.now();
    const random1 = Math.random().toString(36).substring(2, 10);
    const random2 = Math.random().toString(36).substring(2, 10);
    return `${random1}${timestamp.toString(36)}${random2}`;
  }

  /**
   * 签名（简化实现）
   */
  private _sign(data: string, secret: string): string {
    // 简化实现：使用简单的哈希
    // 实际实现应使用 HMAC-SHA256
    const combined = data + secret;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * 检查是否有权限
   */
  private _hasScope(userScopes: string[], requiredScope: string): boolean {
    // 精确匹配
    if (userScopes.includes(requiredScope)) {
      return true;
    }

    // 通配符匹配
    for (const userScope of userScopes) {
      if (userScope.endsWith('*')) {
        const prefix = userScope.slice(0, -1);
        if (requiredScope.startsWith(prefix)) {
          return true;
        }
      }
    }

    return false;
  }
}
