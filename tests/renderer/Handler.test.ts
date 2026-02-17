import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Handler } from '../../src/webgl/Handler.js';
import { createMockCanvas, createMockWebGL2Context } from './mocks/webgl-mock.js';

describe('Handler', () => {
  let handler: Handler;
  let mockCanvas: HTMLCanvasElement;
  let mockContext: any;

  beforeEach(() => {
    handler = new Handler();
    mockCanvas = createMockCanvas();
    mockContext = createMockWebGL2Context(mockCanvas);

    // Mock canvas.getContext
    vi.spyOn(mockCanvas, 'getContext').mockReturnValue(mockContext as any);
  });

  describe('initialize', () => {
    it('should initialize WebGL2 context successfully', () => {
      const contextInfo = handler.initialize(mockCanvas);

      expect(contextInfo).toBeDefined();
      expect(contextInfo.gl).toBeDefined();
      expect(contextInfo.canvasSize).toEqual({ width: 800, height: 600 });
      expect(contextInfo.pixelRatio).toBeGreaterThan(0);
    });

    it('should throw error if WebGL2 is not supported', () => {
      vi.spyOn(mockCanvas, 'getContext').mockReturnValue(null);

      expect(() => handler.initialize(mockCanvas)).toThrow('Failed to create WebGL2 context');
    });

    it('should detect extensions', () => {
      mockContext.addMockExtension('EXT_color_buffer_float');
      mockContext.addMockExtension('OES_standard_derivatives');

      const contextInfo = handler.initialize(mockCanvas);

      expect(contextInfo.extensions.floatTextures).toBe(true);
      expect(contextInfo.extensions.standardDerivatives).toBe(true);
      expect(contextInfo.extensions.drawBuffers).toBe(false);
    });
  });

  describe('gl getter', () => {
    it('should return WebGL2 context after initialization', () => {
      handler.initialize(mockCanvas);

      expect(handler.gl).toBeDefined();
    });

    it('should throw error if context is lost', () => {
      handler.initialize(mockCanvas);
      // Simulate context loss
      (handler as any)._contextLost = true;

      expect(() => handler.gl).toThrow('WebGL2 context is not available or lost');
    });
  });

  describe('isContextValid', () => {
    it('should return true when context is valid', () => {
      handler.initialize(mockCanvas);

      expect(handler.isContextValid()).toBe(true);
    });

    it('should return false when context is lost', () => {
      handler.initialize(mockCanvas);
      (handler as any)._contextLost = true;

      expect(handler.isContextValid()).toBe(false);
    });
  });

  describe('getContextInfo', () => {
    it('should return context information', () => {
      handler.initialize(mockCanvas);
      const info = handler.getContextInfo();

      expect(info.gl).toBeDefined();
      expect(info.canvasSize).toEqual({ width: 800, height: 600 });
      expect(info.extensions).toBeDefined();
    });

    it('should throw error if not initialized', () => {
      expect(() => handler.getContextInfo()).toThrow('Handler not initialized');
    });
  });

  describe('onRestore', () => {
    it('should register restore callback', () => {
      const callback = vi.fn();
      handler.initialize(mockCanvas);
      handler.onRestore(callback);

      expect((handler as any)._restoreCallbacks).toContain(callback);
    });
  });

  describe('dispose', () => {
    it('should clean up resources', () => {
      handler.initialize(mockCanvas);
      handler.dispose();

      expect((handler as any)._gl).toBeNull();
      expect((handler as any)._canvas).toBeNull();
      expect((handler as any)._restoreCallbacks).toHaveLength(0);
    });
  });

  describe('context loss and restore', () => {
    it('should handle context lost event', () => {
      handler.initialize(mockCanvas);

      const lostEvent = new Event('webglcontextlost');
      mockCanvas.dispatchEvent(lostEvent);

      expect((handler as any)._contextLost).toBe(true);
    });

    it('should handle context restored event', () => {
      handler.initialize(mockCanvas);
      const restoreCallback = vi.fn();
      handler.onRestore(restoreCallback);

      const lostEvent = new Event('webglcontextlost');
      mockCanvas.dispatchEvent(lostEvent);

      const restoredEvent = new Event('webglcontextrestored');
      mockCanvas.dispatchEvent(restoredEvent);

      expect((handler as any)._contextLost).toBe(false);
      expect(restoreCallback).toHaveBeenCalled();
    });
  });
});
