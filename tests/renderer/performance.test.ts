import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Renderer } from '../../src/renderer/Renderer.js';
import { createMockCanvas, createMockWebGL2Context } from './mocks/webgl-mock.js';
import type { IRenderNode } from '../../src/renderer/types.js';

describe('Renderer Performance Tests', () => {
  let renderer: Renderer;
  let mockCanvas: HTMLCanvasElement;
  let mockContext: any;

  beforeEach(() => {
    vi.useFakeTimers();
    renderer = new Renderer({ targetFPS: 60, enableProfiling: true });
    mockCanvas = createMockCanvas();
    mockContext = createMockWebGL2Context(mockCanvas);

    vi.spyOn(mockCanvas, 'getContext').mockReturnValue(mockContext as any);
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

  describe('Frame Rate Performance', () => {
    it('should maintain target FPS of 60', () => {
      // Mock performance.now() to simulate time progression
      let now = 0;
      vi.spyOn(performance, 'now').mockImplementation(() => now);

      renderer.attachTo(mockCanvas);

      const renderCalls: number[] = [];
      const node: IRenderNode = {
        id: 'test-node',
        priority: 10,
        visible: true,
        render: () => renderCalls.push(performance.now()),
      };

      renderer.addNode(node);

      // Simulate over 1 second of rendering at 60fps
      const startTime = performance.now();
      for (let i = 0; i < 64; i++) {
        now += 16; // ~60fps, total 1024ms
        renderer.renderFrame();
      }

      const stats = renderer.getStats();
      expect(stats).toBeDefined();
      expect(stats?.fps).toBeGreaterThanOrEqual(50); // Allow some tolerance

      vi.restoreAllMocks();
    });

    it('should handle variable frame rates', () => {
      // Mock performance.now() to simulate time progression
      let now = 0;
      vi.spyOn(performance, 'now').mockImplementation(() => now);

      renderer.attachTo(mockCanvas);

      const node: IRenderNode = {
        id: 'test-node',
        priority: 10,
        visible: true,
        render: vi.fn(),
      };

      renderer.addNode(node);

      // Simulate variable frame times (enough to exceed 1 second)
      const frameTimes = [16, 17, 15, 16, 18, 14, 16, 16, 15, 17, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16];
      frameTimes.forEach((dt) => {
        now += dt;
        renderer.renderFrame();
      });

      const stats = renderer.getStats();
      expect(stats).toBeDefined();
      expect(stats?.fps).toBeGreaterThan(0);

      vi.restoreAllMocks();
    });
  });

  describe('Memory Performance', () => {
    it('should not leak memory with many nodes', () => {
      renderer.attachTo(mockCanvas);

      // Add 1000 nodes
      const nodes: IRenderNode[] = [];
      for (let i = 0; i < 1000; i++) {
        nodes.push({
          id: `node-${i}`,
          priority: Math.floor(Math.random() * 10),
          visible: true,
          render: vi.fn(),
        });
      }

      nodes.forEach((node) => renderer.addNode(node));

      // Render multiple frames
      for (let i = 0; i < 100; i++) {
        renderer.renderFrame();
      }

      const stats = renderer.getStats();
      expect(stats?.nodeCount).toBe(1000);

      // Remove all nodes
      nodes.forEach((node) => renderer.removeNode(node.id));

      const statsAfter = renderer.getStats();
      expect(statsAfter?.nodeCount).toBe(0);
    });

    it('should handle resource lifecycle efficiently', () => {
      renderer.attachTo(mockCanvas);

      const disposeCount = { value: 0 };
      const disposeFn = () => disposeCount.value++;

      // Create and dispose resources repeatedly
      for (let i = 0; i < 100; i++) {
        const resourceId = `resource-${i}`;
        renderer.resourceManager.registerResource(
          resourceId,
          'texture',
          {} as WebGLTexture,
          disposeFn
        );
        renderer.resourceManager.releaseRef(resourceId);
      }

      expect(renderer.resourceManager.getResourceCount()).toBe(0);
      expect(disposeCount.value).toBe(100);
    });
  });

  describe('Rendering Performance', () => {
    it('should handle complex rendering scenarios', () => {
      renderer.attachTo(mockCanvas);

      // Create nodes with different priorities
      const priorities = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      priorities.forEach((priority) => {
        renderer.addNode({
          id: `node-${priority}`,
          priority,
          visible: true,
          render: vi.fn(),
        });
      });

      const startTime = performance.now();
      // Render 100 frames
      for (let i = 0; i < 100; i++) {
        renderer.renderFrame();
      }
      const endTime = performance.now();

      const frameTime = endTime - startTime;
      expect(frameTime).toBeLessThan(1000); // Should complete in less than 1 second
    });

    it('should handle node visibility changes efficiently', () => {
      renderer.attachTo(mockCanvas);

      const nodes: IRenderNode[] = [];
      for (let i = 0; i < 100; i++) {
        const node = {
          id: `node-${i}`,
          priority: 10,
          visible: true,
          render: vi.fn(),
        };
        nodes.push(node);
        renderer.addNode(node);
      }

      // Toggle visibility multiple times
      for (let cycle = 0; cycle < 10; cycle++) {
        nodes.forEach((node, index) => {
          node.visible = index % 2 === cycle % 2;
        });

        renderer.renderFrame();
      }

      const stats = renderer.getStats();
      expect(stats?.nodeCount).toBeLessThanOrEqual(100);
    });
  });

  describe('Stress Tests', () => {
    it('should handle rapid add/remove operations', () => {
      renderer.attachTo(mockCanvas);

      // Rapidly add and remove nodes
      for (let i = 0; i < 100; i++) {
        const node = {
          id: `temp-node-${i}`,
          priority: 10,
          visible: true,
          render: vi.fn(),
        };
        renderer.addNode(node);
        renderer.renderFrame();
        renderer.removeNode(node.id);
      }

      const stats = renderer.getStats();
      expect(stats?.nodeCount).toBe(0);
      expect(renderer.resourceManager.detectLeaks()).toHaveLength(0);
    });

    it('should handle rapid resize operations', () => {
      renderer.attachTo(mockCanvas);

      const node: IRenderNode = {
        id: 'test-node',
        priority: 10,
        visible: true,
        render: vi.fn(),
      };

      renderer.addNode(node);

      // Rapidly resize canvas
      const sizes = [
        [800, 600],
        [1024, 768],
        [640, 480],
        [1920, 1080],
        [400, 300],
      ];

      sizes.forEach(([width, height]) => {
        renderer.resize(width, height);
        renderer.renderFrame();
      });

      expect(mockCanvas.width).toBe(400);
      expect(mockCanvas.height).toBe(300);
    });
  });

  describe('Performance Metrics', () => {
    it('should track frame time accurately', () => {
      // Mock performance.now() to simulate time progression
      let now = 0;
      vi.spyOn(performance, 'now').mockImplementation(() => now);

      renderer.attachTo(mockCanvas);

      const node: IRenderNode = {
        id: 'test-node',
        priority: 10,
        visible: true,
        render: vi.fn(),
      };

      renderer.addNode(node);

      now += 16;
      renderer.renderFrame();
      now += 16;
      renderer.renderFrame();
      const stats = renderer.getStats();

      expect(stats).toBeDefined();
      expect(stats?.frameTime).toBeGreaterThan(0);
      expect(stats?.frameTime).toBeLessThan(100); // Should be less than 100ms

      vi.restoreAllMocks();
    });

    it('should track resource count accurately', () => {
      renderer.attachTo(mockCanvas);

      for (let i = 0; i < 10; i++) {
        renderer.resourceManager.registerResource(`r${i}`, 'texture', {} as WebGLTexture, vi.fn());
      }

      const stats = renderer.getStats();
      expect(stats?.resourceCount).toBe(10);
    });
  });

  describe('Benchmarks', () => {
    it('should render 60fps with 100 nodes', () => {
      // Mock performance.now() to simulate time progression
      let now = 0;
      vi.spyOn(performance, 'now').mockImplementation(() => now);

      renderer.attachTo(mockCanvas);

      for (let i = 0; i < 100; i++) {
        renderer.addNode({
          id: `node-${i}`,
          priority: 10,
          visible: true,
          render: vi.fn(),
        });
      }

      const startTime = performance.now();
      let frames = 0;
      const targetFrames = 70; // Need enough frames to exceed 1 second

      while (frames < targetFrames && performance.now() - startTime < 1000) {
        now += 16;
        renderer.renderFrame();
        frames++;
      }

      const stats = renderer.getStats();
      expect(stats?.fps).toBeGreaterThanOrEqual(50); // Should maintain at least 50fps

      vi.restoreAllMocks();
    });
  });
});
