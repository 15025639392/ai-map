import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResourceManager } from '../../src/renderer/ResourceManager.js';

describe('ResourceManager', () => {
  let resourceManager: ResourceManager;

  beforeEach(() => {
    resourceManager = new ResourceManager();
  });

  describe('registerResource', () => {
    it('should register a new resource', () => {
      const mockResource = {} as WebGLTexture;
      const disposeFn = vi.fn();

      resourceManager.registerResource('test-resource', 'texture', mockResource, disposeFn);

      expect(resourceManager.hasResource('test-resource')).toBe(true);
      expect(resourceManager.getResourceCount()).toBe(1);
    });

    it('should throw error if resource already exists', () => {
      const mockResource = {} as WebGLTexture;
      const disposeFn = vi.fn();

      resourceManager.registerResource('test-resource', 'texture', mockResource, disposeFn);

      expect(() =>
        resourceManager.registerResource('test-resource', 'texture', mockResource, disposeFn)
      ).toThrow('Resource test-resource already registered');
    });

    it('should throw error if manager is disposed', () => {
      resourceManager.dispose();

      expect(() =>
        resourceManager.registerResource('test-resource', 'texture', {} as WebGLTexture, vi.fn())
      ).toThrow('ResourceManager is disposed');
    });
  });

  describe('addRef', () => {
    it('should increment reference count', () => {
      const mockResource = {} as WebGLTexture;
      const disposeFn = vi.fn();

      resourceManager.registerResource('test-resource', 'texture', mockResource, disposeFn);
      resourceManager.addRef('test-resource');

      const resource = resourceManager.getResource('test-resource');
      expect(resource?.refCount).toBe(2);
    });

    it('should throw error if resource not found', () => {
      expect(() => resourceManager.addRef('non-existent')).toThrow('Resource non-existent not found');
    });
  });

  describe('releaseRef', () => {
    it('should decrement reference count', () => {
      const mockResource = {} as WebGLTexture;
      const disposeFn = vi.fn();

      resourceManager.registerResource('test-resource', 'texture', mockResource, disposeFn);
      resourceManager.addRef('test-resource');
      resourceManager.releaseRef('test-resource');

      const resource = resourceManager.getResource('test-resource');
      expect(resource?.refCount).toBe(1);
    });

    it('should dispose resource when refCount reaches 0', () => {
      const mockResource = {} as WebGLTexture;
      const disposeFn = vi.fn();

      resourceManager.registerResource('test-resource', 'texture', mockResource, disposeFn);
      resourceManager.releaseRef('test-resource');

      expect(resourceManager.hasResource('test-resource')).toBe(false);
      expect(disposeFn).toHaveBeenCalled();
    });

    it('should throw error if resource not found', () => {
      expect(() => resourceManager.releaseRef('non-existent')).toThrow(
        'Resource non-existent not found'
      );
    });
  });

  describe('disposeResource', () => {
    it('should dispose resource directly', () => {
      const mockResource = {} as WebGLTexture;
      const disposeFn = vi.fn();

      resourceManager.registerResource('test-resource', 'texture', mockResource, disposeFn);
      resourceManager.addRef('test-resource');
      resourceManager.disposeResource('test-resource');

      expect(resourceManager.hasResource('test-resource')).toBe(false);
      expect(disposeFn).toHaveBeenCalled();
    });
  });

  describe('getResource', () => {
    it('should return resource if exists', () => {
      const mockResource = {} as WebGLTexture;
      const disposeFn = vi.fn();

      resourceManager.registerResource('test-resource', 'texture', mockResource, disposeFn);

      const resource = resourceManager.getResource('test-resource');
      expect(resource).toBeDefined();
      expect(resource?.type).toBe('texture');
    });

    it('should return undefined if not exists', () => {
      const resource = resourceManager.getResource('non-existent');
      expect(resource).toBeUndefined();
    });
  });

  describe('getResourceInfo', () => {
    it('should return info for all resources', () => {
      const mockTexture = {} as WebGLTexture;
      const mockProgram = {} as WebGLProgram;

      resourceManager.registerResource('texture1', 'texture', mockTexture, vi.fn());
      resourceManager.registerResource('program1', 'program', mockProgram, vi.fn());

      const info = resourceManager.getResourceInfo();

      expect(info).toHaveLength(2);
      expect(info[0]).toEqual({ id: 'texture1', type: 'texture', refCount: 1 });
      expect(info[1]).toEqual({ id: 'program1', type: 'program', refCount: 1 });
    });
  });

  describe('getResourceCount', () => {
    it('should return correct count', () => {
      expect(resourceManager.getResourceCount()).toBe(0);

      resourceManager.registerResource('r1', 'texture', {} as WebGLTexture, vi.fn());
      resourceManager.registerResource('r2', 'program', {} as WebGLProgram, vi.fn());

      expect(resourceManager.getResourceCount()).toBe(2);
    });
  });

  describe('disposeAll', () => {
    it('should dispose all resources', () => {
      const disposeFn1 = vi.fn();
      const disposeFn2 = vi.fn();

      resourceManager.registerResource('r1', 'texture', {} as WebGLTexture, disposeFn1);
      resourceManager.registerResource('r2', 'program', {} as WebGLProgram, disposeFn2);

      resourceManager.disposeAll();

      expect(resourceManager.getResourceCount()).toBe(0);
      expect(disposeFn1).toHaveBeenCalled();
      expect(disposeFn2).toHaveBeenCalled();
    });
  });

  describe('detectLeaks', () => {
    it('should detect resources with refCount > 0', () => {
      resourceManager.registerResource('leaked', 'texture', {} as WebGLTexture, vi.fn());
      resourceManager.addRef('leaked');

      const leaks = resourceManager.detectLeaks();

      expect(leaks).toContain('leaked');
    });

    it('should not detect resources with refCount = 0', () => {
      resourceManager.registerResource('normal', 'texture', {} as WebGLTexture, vi.fn());
      resourceManager.releaseRef('normal');

      const leaks = resourceManager.detectLeaks();

      expect(leaks).toHaveLength(0);
    });
  });

  describe('dispose', () => {
    it('should dispose all resources and mark as disposed', () => {
      resourceManager.registerResource('r1', 'texture', {} as WebGLTexture, vi.fn());
      resourceManager.dispose();

      expect(resourceManager.getResourceCount()).toBe(0);
      expect(() =>
        resourceManager.registerResource('r2', 'texture', {} as WebGLTexture, vi.fn())
      ).toThrow('ResourceManager is disposed');
    });
  });
});
