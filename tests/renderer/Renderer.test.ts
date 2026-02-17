import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Renderer } from '../../src/renderer/Renderer.js';
import { createMockCanvas, createMockWebGL2Context } from './mocks/webgl-mock.js';
import type { IRenderNode } from '../../src/renderer/types.js';

describe('Renderer', () => {
  let renderer: Renderer;
  let mockCanvas: HTMLCanvasElement;
  let mockContext: any;

  beforeEach(() => {
    vi.useFakeTimers();
    renderer = new Renderer({ targetFPS: 60 });
    mockCanvas = createMockCanvas();
    mockContext = createMockWebGL2Context(mockCanvas);

    // Mock canvas.getContext
    vi.spyOn(mockCanvas, 'getContext').mockReturnValue(mockContext as any);

    // Mock requestAnimationFrame and cancelAnimationFrame
    global.requestAnimationFrame = vi.fn((cb) => {
      return setTimeout(() => cb(performance.now()), 16) as unknown as number;
    });
    global.cancelAnimationFrame = vi.fn(clearTimeout);
  });

  afterEach(() => {
    if (renderer.isRunning) {
      renderer.stop();
    }
    renderer.dispose();
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should create renderer with default config', () => {
      const defaultRenderer = new Renderer();

      expect(defaultRenderer.isRunning).toBe(false);
      expect(defaultRenderer.isPaused).toBe(false);
    });

    it('should create renderer with custom config', () => {
      const customRenderer = new Renderer({ targetFPS: 30, enableFBO: true, enableProfiling: true });

      expect(customRenderer.isRunning).toBe(false);
    });
  });

  describe('attachTo', () => {
    it('should attach to canvas and initialize context', () => {
      renderer.attachTo(mockCanvas);

      expect(renderer.contextInfo).toBeDefined();
      expect(renderer.contextInfo.gl).toBeDefined();
      expect(renderer.contextInfo.canvasSize).toEqual({ width: 800, height: 600 });
    });

    it('should throw error if already attached', () => {
      renderer.attachTo(mockCanvas);

      expect(() => renderer.attachTo(mockCanvas)).toThrow(
        'Renderer already attached to a canvas'
      );
    });
  });

  describe('start', () => {
    it('should start rendering loop', () => {
      renderer.attachTo(mockCanvas);
      renderer.start();

      expect(renderer.isRunning).toBe(true);
      expect(requestAnimationFrame).toHaveBeenCalled();

      renderer.stop();
    });

    it('should throw error if not attached to canvas', () => {
      expect(() => renderer.start()).toThrow('Renderer not attached to canvas');
    });

    it('should not start if already running', () => {
      renderer.attachTo(mockCanvas);
      renderer.start();

      const afCalls = (global.requestAnimationFrame as any).mock.calls.length;
      renderer.start();

      expect((global.requestAnimationFrame as any).mock.calls.length).toBe(afCalls);
      renderer.stop();
    });
  });

  describe('stop', () => {
    it('should stop rendering loop', () => {
      renderer.attachTo(mockCanvas);
      renderer.start();
      renderer.stop();

      expect(renderer.isRunning).toBe(false);
      expect(cancelAnimationFrame).toHaveBeenCalled();
    });

    it('should not throw if not running', () => {
      renderer.stop();

      expect(renderer.isRunning).toBe(false);
    });
  });

  describe('pause and resume', () => {
    it('should pause and resume rendering', () => {
      renderer.attachTo(mockCanvas);
      renderer.start();
      renderer.pause();

      expect(renderer.isPaused).toBe(true);

      renderer.resume();
      expect(renderer.isPaused).toBe(false);

      renderer.stop();
    });
  });

  describe('addNode and removeNode', () => {
    it('should add and remove render nodes', () => {
      renderer.attachTo(mockCanvas);

      const mockNode: IRenderNode = {
        id: 'test-node',
        priority: 1,
        visible: true,
        render: vi.fn(),
      };

      renderer.addNode(mockNode);
      expect(renderer.getNode('test-node')).toBe(mockNode);

      renderer.removeNode('test-node');
      expect(renderer.getNode('test-node')).toBeUndefined();
    });

    it('should throw error if not attached when adding node', () => {
      const mockNode: IRenderNode = {
        id: 'test-node',
        priority: 1,
        visible: true,
        render: vi.fn(),
      };

      expect(() => renderer.addNode(mockNode)).toThrow('Renderer not attached to canvas');
    });
  });

  describe('getStats', () => {
    it('should return null if not attached', () => {
      expect(renderer.getStats()).toBeNull();
    });

    it('should return stats when attached', () => {
      renderer.attachTo(mockCanvas);

      const stats = renderer.getStats();

      expect(stats).toBeDefined();
      expect(stats?.nodeCount).toBe(0);
      expect(stats?.resourceCount).toBe(0);
    });
  });

  describe('resize', () => {
    it('should resize canvas and update viewport', () => {
      renderer.attachTo(mockCanvas);
      const viewportSpy = vi.spyOn(mockContext, 'viewport');
      renderer.resize(1024, 768);

      expect(mockCanvas.width).toBe(1024);
      expect(mockCanvas.height).toBe(768);
      expect(viewportSpy).toHaveBeenCalledWith(0, 0, 1024, 768);
      expect(renderer.contextInfo.canvasSize).toEqual({ width: 1024, height: 768 });
    });
  });

  describe('dispose', () => {
    it('should dispose all resources', () => {
      renderer.attachTo(mockCanvas);
      renderer.start();
      renderer.dispose();

      expect(renderer.isRunning).toBe(false);
      expect(() => renderer.pipeline).toThrow('Renderer not attached to canvas');
    });
  });
});
