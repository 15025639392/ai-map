import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Renderer } from '../../src/renderer/Renderer.js';
import { createMockCanvas, createMockWebGL2Context } from './mocks/webgl-mock.js';
import type { IRenderNode } from '../../src/renderer/types.js';

describe('Renderer Integration Tests', () => {
  let renderer: Renderer;
  let mockCanvas: HTMLCanvasElement;
  let mockContext: any;

  beforeEach(() => {
    vi.useFakeTimers();
    renderer = new Renderer({ targetFPS: 60, enableProfiling: true });
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

  describe('Complete Rendering Pipeline', () => {
    it('should handle complete rendering lifecycle', () => {
      // Attach renderer
      renderer.attachTo(mockCanvas);
      expect(renderer.contextInfo).toBeDefined();

      // Add render nodes
      const node1: IRenderNode = {
        id: 'node-1',
        priority: 10,
        visible: true,
        render: vi.fn(),
      };

      const node2: IRenderNode = {
        id: 'node-2',
        priority: 5,
        visible: true,
        render: vi.fn(),
      };

      renderer.addNode(node1);
      renderer.addNode(node2);

      expect(renderer.getNode('node-1')).toBe(node1);
      expect(renderer.getNode('node-2')).toBe(node2);

      // Start rendering
      renderer.start();
      expect(renderer.isRunning).toBe(true);

      // Wait a bit for rendering
      vi.advanceTimersByTime(100);

      // Stop rendering
      renderer.stop();
      expect(renderer.isRunning).toBe(false);
    });

    it('should render nodes in priority order', () => {
      renderer.attachTo(mockCanvas);

      const renderOrder: string[] = [];
      const node1: IRenderNode = {
        id: 'node-1',
        priority: 5,
        visible: true,
        render: () => renderOrder.push('node-1'),
      };

      const node2: IRenderNode = {
        id: 'node-2',
        priority: 10,
        visible: true,
        render: () => renderOrder.push('node-2'),
      };

      const node3: IRenderNode = {
        id: 'node-3',
        priority: 7,
        visible: true,
        render: () => renderOrder.push('node-3'),
      };

      renderer.addNode(node1);
      renderer.addNode(node2);
      renderer.addNode(node3);

      renderer.renderFrame();

      expect(renderOrder).toEqual(['node-2', 'node-3', 'node-1']);
    });

    it('should skip invisible nodes', () => {
      renderer.attachTo(mockCanvas);

      const renderOrder: string[] = [];
      const node1: IRenderNode = {
        id: 'node-1',
        priority: 10,
        visible: true,
        render: () => renderOrder.push('node-1'),
      };

      const node2: IRenderNode = {
        id: 'node-2',
        priority: 5,
        visible: false,
        render: () => renderOrder.push('node-2'),
      };

      renderer.addNode(node1);
      renderer.addNode(node2);

      renderer.renderFrame();

      expect(renderOrder).toEqual(['node-1']);
      expect(renderOrder).not.toContain('node-2');
    });
  });

  describe('Resource Management Integration', () => {
    it('should manage WebGL resources through lifecycle', () => {
      renderer.attachTo(mockCanvas);

      const mockTexture = {} as WebGLTexture;
      const disposeFn = vi.fn();

      // Register texture resource
      renderer.resourceManager.registerResource('test-texture', 'texture', mockTexture, disposeFn);

      expect(renderer.resourceManager.hasResource('test-texture')).toBe(true);

      // Add ref
      renderer.resourceManager.addRef('test-texture');
      expect(renderer.resourceManager.getResource('test-texture')?.refCount).toBe(2);

      // Release ref
      renderer.resourceManager.releaseRef('test-texture');
      expect(renderer.resourceManager.getResource('test-texture')?.refCount).toBe(1);

      // Dispose resource
      renderer.resourceManager.disposeResource('test-texture');
      expect(renderer.resourceManager.hasResource('test-texture')).toBe(false);
      expect(disposeFn).toHaveBeenCalled();
    });

    it('should detect resource leaks', () => {
      renderer.attachTo(mockCanvas);

      // Create leaked resource
      renderer.resourceManager.registerResource('leaked-texture', 'texture', {} as WebGLTexture, vi.fn());
      renderer.resourceManager.addRef('leaked-texture');

      const leaks = renderer.resourceManager.detectLeaks();
      expect(leaks).toContain('leaked-texture');

      // Clean up
      renderer.resourceManager.disposeAll();
    });
  });

  describe('Performance and Stability', () => {
    it('should handle multiple render cycles without memory leaks', () => {
      renderer.attachTo(mockCanvas);

      const node: IRenderNode = {
        id: 'test-node',
        priority: 10,
        visible: true,
        render: vi.fn(),
      };

      renderer.addNode(node);

      // Run multiple render frames
      for (let i = 0; i < 100; i++) {
        renderer.renderFrame();
      }

      // Check no memory leaks
      const leaks = renderer.resourceManager.detectLeaks();
      expect(leaks).toHaveLength(0);
    });

    it('should maintain stable frame rate', () => {
      renderer.attachTo(mockCanvas);

      const node: IRenderNode = {
        id: 'test-node',
        priority: 10,
        visible: true,
        render: vi.fn(),
      };

      renderer.addNode(node);
      renderer.start();

      // Simulate 60 frames
      for (let i = 0; i < 60; i++) {
        vi.advanceTimersByTime(16);
      }

      const stats = renderer.getStats();
      expect(stats).toBeDefined();
      expect(stats?.nodeCount).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle context loss gracefully', () => {
      renderer.attachTo(mockCanvas);

      const node: IRenderNode = {
        id: 'test-node',
        priority: 10,
        visible: true,
        render: vi.fn(),
      };

      renderer.addNode(node);
      renderer.start();

      // Simulate context loss
      (renderer as any)._handler._contextLost = true;

      expect(renderer.handler.isContextValid()).toBe(false);
      renderer.stop();
    });

    it('should handle invalid node operations', () => {
      renderer.attachTo(mockCanvas);

      expect(() => renderer.removeNode('non-existent')).not.toThrow();
    });
  });

  describe('Stats and Monitoring', () => {
    it('should track rendering statistics', () => {
      // Mock performance.now() to simulate time progression
      let now = 0;
      vi.spyOn(performance, 'now').mockImplementation(() => now);

      renderer.attachTo(mockCanvas);

      // Add multiple nodes
      for (let i = 0; i < 5; i++) {
        renderer.addNode({
          id: `node-${i}`,
          priority: 10 - i,
          visible: true,
          render: vi.fn(),
        });
      }

      // Render some frames (need to simulate time for FPS calculation)
      for (let i = 0; i < 70; i++) {
        vi.advanceTimersByTime(16);
        now += 16;
        renderer.renderFrame();
      }

      const stats = renderer.getStats();
      expect(stats).toBeDefined();
      expect(stats?.nodeCount).toBe(5);
      expect(stats?.fps).toBeGreaterThan(0);

      vi.restoreAllMocks();
    });
  });
});
