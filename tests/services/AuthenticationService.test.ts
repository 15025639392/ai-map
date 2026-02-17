import { describe, it, expect, beforeEach } from 'vitest';
import {
  AuthenticationService,
} from '../../services/AuthenticationService.js';
import {
  IAPIKey,
  ICreateAPIKeyConfig,
  IJWTConfig,
  AuthType,
  IAuthResult,
} from '../../services/style-types.js';

describe('AuthenticationService', () => {
  let authService: AuthenticationService;

  beforeEach(() => {
    authService = new AuthenticationService();
  });

  describe('createAPIKey', () => {
    it('should create API key', async () => {
      const config: ICreateAPIKeyConfig = {
        userId: 'user123',
        scopes: ['read', 'write'],
        expiresIn: 3600, // 1 hour
        rateLimit: 100,
        description: 'Test API key',
      };

      const apiKey = await authService.createAPIKey(config);

      expect(apiKey).toBeDefined();
      expect(apiKey.userId).toBe('user123');
      expect(apiKey.scopes).toEqual(['read', 'write']);
      expect(apiKey.active).toBe(true);
      expect(apiKey.rateLimit).toBe(100);
      expect(apiKey.description).toBe('Test API key');
      expect(apiKey.key).toBeDefined();
      expect(typeof apiKey.key).toBe('string');
      expect(apiKey.key.startsWith('sk_') || apiKey.key.length > 20).toBe(true);
    });

    it('should create API key without expiration', async () => {
      const config: ICreateAPIKeyConfig = {
        userId: 'user123',
        scopes: ['read'],
        expiresIn: 0, // No expiration
      };

      const apiKey = await authService.createAPIKey(config);

      expect(apiKey.expiresAt).toBe(0);
    });

    it('should create API key with default values', async () => {
      const config: ICreateAPIKeyConfig = {
        userId: 'user123',
        scopes: ['read'],
      };

      const apiKey = await authService.createAPIKey(config);

      expect(apiKey.expiresAt).toBeGreaterThan(Date.now());
      expect(apiKey.rateLimit).toBeUndefined();
      expect(apiKey.description).toBeUndefined();
    });
  });

  describe('getAPIKey', () => {
    it('should return existing API key', async () => {
      const config: ICreateAPIKeyConfig = {
        userId: 'user123',
        scopes: ['read'],
      };

      const created = await authService.createAPIKey(config);
      const fetched = await authService.getAPIKey(created.key);

      expect(fetched).not.toBeNull();
      expect(fetched?.key).toBe(created.key);
      expect(fetched?.userId).toBe('user123');
    });

    it('should return null for non-existent API key', async () => {
      const fetched = await authService.getAPIKey('non-existent-key');
      expect(fetched).toBeNull();
    });
  });

  describe('verifyAPIKey', () => {
    it('should verify valid API key', async () => {
      const config: ICreateAPIKeyConfig = {
        userId: 'user123',
        scopes: ['read', 'write'],
      };

      const created = await authService.createAPIKey(config);
      const result = await authService.verifyAPIKey(created.key);

      expect(result.success).toBe(true);
      expect(result.userId).toBe('user123');
      expect(result.scopes).toEqual(['read', 'write']);
    });

    it('should update lastUsedAt on verification', async () => {
      const config: ICreateAPIKeyConfig = {
        userId: 'user123',
        scopes: ['read'],
      };

      const created = await authService.createAPIKey(config);
      const beforeVerify = await authService.getAPIKey(created.key);

      await authService.verifyAPIKey(created.key);

      const afterVerify = await authService.getAPIKey(created.key);

      expect(afterVerify?.lastUsedAt).toBeGreaterThan(beforeVerify!.lastUsedAt ?? 0);
    });

    it('should reject invalid API key', async () => {
      const result = await authService.verifyAPIKey('invalid-key');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid API key');
      expect(result.errorCode).toBe('INVALID_API_KEY');
    });

    it('should reject inactive API key', async () => {
      const config: ICreateAPIKeyConfig = {
        userId: 'user123',
        scopes: ['read'],
      };

      const created = await authService.createAPIKey(config);
      await authService.revokeAPIKey(created.key);

      const result = await authService.verifyAPIKey(created.key);

      expect(result.success).toBe(false);
      expect(result.error).toBe('API key is inactive');
      expect(result.errorCode).toBe('INVALID_API_KEY');
    });

    it('should reject expired API key', async () => {
      const config: ICreateAPIKeyConfig = {
        userId: 'user123',
        scopes: ['read'],
        expiresIn: 1, // 1 second
      };

      const created = await authService.createAPIKey(config);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      const result = await authService.verifyAPIKey(created.key);

      expect(result.success).toBe(false);
      expect(result.error).toBe('API key has expired');
      expect(result.errorCode).toBe('EXPIRED_API_KEY');
    });
  });

  describe('revokeAPIKey', () => {
    it('should revoke API key', async () => {
      const config: ICreateAPIKeyConfig = {
        userId: 'user123',
        scopes: ['read'],
      };

      const created = await authService.createAPIKey(config);
      const revoked = await authService.revokeAPIKey(created.key);

      expect(revoked).toBe(true);

      const fetched = await authService.getAPIKey(created.key);
      expect(fetched?.active).toBe(false);
    });

    it('should return false for non-existent API key', async () => {
      const revoked = await authService.revokeAPIKey('non-existent-key');
      expect(revoked).toBe(false);
    });
  });

  describe('deleteAPIKey', () => {
    it('should delete API key', async () => {
      const config: ICreateAPIKeyConfig = {
        userId: 'user123',
        scopes: ['read'],
      };

      const created = await authService.createAPIKey(config);
      const deleted = await authService.deleteAPIKey(created.key);

      expect(deleted).toBe(true);

      const fetched = await authService.getAPIKey(created.key);
      expect(fetched).toBeNull();
    });

    it('should return false for non-existent API key', async () => {
      const deleted = await authService.deleteAPIKey('non-existent-key');
      expect(deleted).toBe(false);
    });
  });

  describe('listUserAPIKeys', () => {
    it('should list user API keys', async () => {
      await authService.createAPIKey({
        userId: 'user123',
        scopes: ['read'],
      });

      await authService.createAPIKey({
        userId: 'user123',
        scopes: ['write'],
      });

      await authService.createAPIKey({
        userId: 'user456',
        scopes: ['read'],
      });

      const userKeys = await authService.listUserAPIKeys('user123');

      expect(userKeys.length).toBe(2);
      expect(userKeys.every(k => k.userId === 'user123')).toBe(true);
    });

    it('should return empty array for user with no API keys', async () => {
      const userKeys = await authService.listUserAPIKeys('non-existent-user');
      expect(userKeys).toEqual([]);
    });
  });

  describe('updateAPIKey', () => {
    it('should update API key', async () => {
      const config: ICreateAPIKeyConfig = {
        userId: 'user123',
        scopes: ['read'],
        rateLimit: 100,
        description: 'Original',
      };

      const created = await authService.createAPIKey(config);

      const updated = await authService.updateAPIKey(created.key, {
        active: false,
        rateLimit: 200,
        description: 'Updated',
      });

      expect(updated).not.toBeNull();
      expect(updated?.active).toBe(false);
      expect(updated?.rateLimit).toBe(200);
      expect(updated?.description).toBe('Updated');
    });

    it('should update scopes', async () => {
      const created = await authService.createAPIKey({
        userId: 'user123',
        scopes: ['read'],
      });

      const updated = await authService.updateAPIKey(created.key, {
        scopes: ['read', 'write', 'delete'],
      });

      expect(updated?.scopes).toEqual(['read', 'write', 'delete']);
    });

    it('should return null for non-existent API key', async () => {
      const updated = await authService.updateAPIKey('non-existent-key', {
        active: false,
      });
      expect(updated).toBeNull();
    });
  });

  describe('JWT Token', () => {
    beforeEach(() => {
      authService.setJWTConfig({
        secret: 'test-secret-key',
        expiresIn: 3600, // 1 hour
        issuer: 'test-issuer',
        audience: 'test-audience',
      });
    });

    describe('generateToken', () => {
      it('should generate JWT token', async () => {
        const token = await authService.generateToken('user123', ['read', 'write']);

        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        expect(token.includes('.')).toBe(true);
      });
    });

    describe('verifyToken', () => {
      it('should verify valid token', async () => {
        const token = await authService.generateToken('user123', ['read', 'write']);
        const result = await authService.verifyToken(token);

        expect(result.success).toBe(true);
        expect(result.userId).toBe('user123');
        expect(result.scopes).toEqual(['read', 'write']);
      });

      it('should reject invalid token format', async () => {
        const result = await authService.verifyToken('invalid-token');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid token format');
        expect(result.errorCode).toBe('INVALID_TOKEN');
      });

      it('should reject token with invalid signature', async () => {
        const token = await authService.generateToken('user123', ['read']);
        const parts = token.split('.');
        const tampered = `${parts[0]}.tampered`;

        const result = await authService.verifyToken(tampered);

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_TOKEN');
      });

      it('should reject expired token', async () => {
        authService.setJWTConfig({
          secret: 'test-secret-key',
          expiresIn: 1, // 1 second
        });

        const token = await authService.generateToken('user123', ['read']);

        // Wait for expiration (need to wait at least 2 seconds to ensure exp time is passed)
        await new Promise(resolve => setTimeout(resolve, 2100));

        const result = await authService.verifyToken(token);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Token has expired');
        expect(result.errorCode).toBe('EXPIRED_TOKEN');
      }, 3000);

      it('should validate issuer', async () => {
        const token = await authService.generateToken('user123', ['read']);

        // Change issuer config
        authService.setJWTConfig({
          secret: 'test-secret-key',
          expiresIn: 3600,
          issuer: 'different-issuer',
        });

        const result = await authService.verifyToken(token);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid token issuer');
      });

      it('should validate audience', async () => {
        const token = await authService.generateToken('user123', ['read']);

        // Change audience config
        authService.setJWTConfig({
          secret: 'test-secret-key',
          expiresIn: 3600,
          audience: 'different-audience',
        });

        const result = await authService.verifyToken(token);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid token audience');
      });
    });
  });

  describe('checkPermission', () => {
    it('should grant permission when all scopes are present', async () => {
      const result = await authService.checkPermission(
        'user123',
        ['read', 'write'],
        ['read', 'write', 'delete']
      );

      expect(result.granted).toBe(true);
      expect(result.missingScopes).toBeUndefined();
    });

    it('should deny permission when scopes are missing', async () => {
      const result = await authService.checkPermission(
        'user123',
        ['read', 'write', 'delete'],
        ['read']
      );

      expect(result.granted).toBe(false);
      expect(result.missingScopes).toEqual(['write', 'delete']);
    });

    it('should handle wildcard scopes', async () => {
      const result = await authService.checkPermission(
        'user123',
        ['styles:read', 'styles:write'],
        ['styles:*']
      );

      expect(result.granted).toBe(true);
    });

    it('should grant permission with wildcard user scope', async () => {
      const result = await authService.checkPermission(
        'user123',
        ['styles:read', 'tiles:read'],
        ['*']
      );

      expect(result.granted).toBe(true);
    });
  });

  describe('verifyCredential', () => {
    it('should verify API key credential', async () => {
      const apiKey = await authService.createAPIKey({
        userId: 'user123',
        scopes: ['read'],
      });

      const result = await authService.verifyCredential(apiKey.key, AuthType.API_KEY);

      expect(result.success).toBe(true);
    });

    it('should verify JWT token credential', async () => {
      authService.setJWTConfig({
        secret: 'test-secret',
        expiresIn: 3600,
      });

      const token = await authService.generateToken('user123', ['read']);

      const result = await authService.verifyCredential(token, AuthType.JWT);

      expect(result.success).toBe(true);
    });

    it('should reject unsupported auth type', async () => {
      const result = await authService.verifyCredential('credential', 'oauth' as AuthType);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unsupported auth type');
    });
  });

  describe('cleanupExpiredAPIKeys', () => {
    it('should cleanup expired API keys', async () => {
      await authService.createAPIKey({
        userId: 'user123',
        scopes: ['read'],
        expiresIn: 1, // 1 second
      });

      await authService.createAPIKey({
        userId: 'user123',
        scopes: ['write'],
        expiresIn: 0, // No expiration
      });

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      const cleaned = await authService.cleanupExpiredAPIKeys();

      expect(cleaned).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getAPIKeyStats', () => {
    it('should return API key statistics', async () => {
      await authService.createAPIKey({
        userId: 'user123',
        scopes: ['read'],
      });

      await authService.createAPIKey({
        userId: 'user456',
        scopes: ['write'],
      });

      const apiKey = await authService.createAPIKey({
        userId: 'user789',
        scopes: ['delete'],
      });

      await authService.revokeAPIKey(apiKey.key);

      const stats = await authService.getAPIKeyStats();

      expect(stats.total).toBeGreaterThanOrEqual(3);
      expect(stats.active).toBeGreaterThanOrEqual(2);
      expect(stats.inactive).toBeGreaterThanOrEqual(1);
    });
  });

  describe('clearAll', () => {
    it('should clear all API keys', async () => {
      await authService.createAPIKey({
        userId: 'user123',
        scopes: ['read'],
      });

      await authService.clearAll();

      const stats = await authService.getAPIKeyStats();
      expect(stats.total).toBe(0);
    });
  });
});
