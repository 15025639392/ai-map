import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Layer } from '../../src/renderer/Layer.js';
import { Renderer } from '../../src/renderer/Renderer.js';
import { createMockCanvas, createMockWebGL2Context } from '../renderer/mocks/webgl-mock.js';

// 创建一个管理 WebGL 资源的测试图层
class ResourceLayer extends Layer {
  private _resources: Map<string, { disposeFn: () => void }> = new Map();
  private _resourceManager: any = null;

  constructor(options?: any) {
    super(options || { priority: 10 });
  }

  add(renderer: any): void {
    super.add(renderer);
    // 保存 resourceManager 引用
    if (renderer && renderer.resourceManager) {
      this._resourceManager = renderer.resourceManager;
    }
  }

  render(renderer: any): void {
    // 渲染逻辑
  }

  // 注册资源到图层
  registerLayerResource(resourceId: string): void {
    const disposeFn = () => {
      this._resources.delete(resourceId);
    };

    this._resources.set(resourceId, { disposeFn });
    this.registerResource(resourceId, 'texture', {} as WebGLTexture, disposeFn);
  }

  // 清理所有资源
  protected disposeResources(): void {
    this._resources.forEach((resourceData, resourceId) => {
      // 先尝试通过 renderer 清理
      try {
        this.disposeResource(resourceId);
      } catch (error) {
        // 如果 renderer 不可用，尝试通过保存的 resourceManager 清理
        if (this._resourceManager) {
          try {
            this._resourceManager.disposeResource(resourceId);
          } catch (e) {
            // 忽略错误
          }
        }
        // 然后调用 disposeFn
        resourceData.disposeFn();
      }
    });
    this._resources.clear();
  }

  get resourceCount(): number {
    return this._resources.size;
  }
}

describe('Layer Memory Management', () => {
  let renderer: Renderer;
  let mockCanvas: HTMLCanvasElement;
  let mockContext: any;

  beforeEach(() => {
    mockCanvas = createMockCanvas();
    mockContext = createMockWebGL2Context(mockCanvas);

    vi.spyOn(mockCanvas, 'getContext').mockReturnValue(mockContext as any);

    renderer = new Renderer({ targetFPS: 60, enableProfiling: true });
    renderer.attachTo(mockCanvas);
  });

  afterEach(() => {
    if (renderer.isRunning) {
      renderer.stop();
    }
    renderer.dispose();
  });

  describe('Layer Add/Remove Memory', () => {
    it('should not leak memory when adding and removing layers', () => {
      const initialResourceCount = renderer.resourceManager.getResourceCount();

      // 添加多个图层
      const layers: ResourceLayer[] = [];
      for (let i = 0; i < 10; i++) {
        const layer = new ResourceLayer();
        layers.push(layer);
        layer.add(renderer);
      }

      // 资源数量应该增加
      expect(renderer.resourceManager.getResourceCount()).toBeGreaterThanOrEqual(initialResourceCount);

      // 移除所有图层
      layers.forEach((layer) => {
        layer.remove();
      });

      // 检查内存泄漏
      const leaks = renderer.resourceManager.detectLeaks();
      expect(leaks).toHaveLength(0);
    });

    it('should clean up resources when layer is removed', () => {
      const layer = new ResourceLayer();
      layer.add(renderer);

      // 注册资源
      layer.registerLayerResource('resource-1');
      layer.registerLayerResource('resource-2');

      expect(layer.resourceCount).toBe(2);

      // 移除并销毁图层
      layer.remove();
      layer.dispose();

      // 资源应该被释放
      const leaks = renderer.resourceManager.detectLeaks();
      expect(leaks).toHaveLength(0);
    });
  });

  describe('Layer Show/Hide Memory', () => {
    it('should not leak memory when showing and hiding layers', () => {
      const layer = new ResourceLayer();
      layer.add(renderer);

      const initialResourceCount = renderer.resourceManager.getResourceCount();

      // 注册一些资源
      layer.registerLayerResource('resource-1');
      layer.registerLayerResource('resource-2');

      // 多次显示/隐藏
      for (let i = 0; i < 100; i++) {
        layer.hide();
        layer.show();
      }

      // 资源数量应该保持稳定
      expect(renderer.resourceManager.getResourceCount()).toBe(initialResourceCount + 2);

      // 清理
      layer.remove();
      layer.dispose();

      // 检查内存泄漏
      const leaks = renderer.resourceManager.detectLeaks();
      expect(leaks).toHaveLength(0);
    });

    it('should not leak memory when toggling visibility', () => {
      const layer = new ResourceLayer();
      layer.add(renderer);

      layer.registerLayerResource('resource-1');

      const initialResourceCount = renderer.resourceManager.getResourceCount();

      // 多次切换可见性
      for (let i = 0; i < 1000; i++) {
        layer.toggle();
      }

      // 资源数量应该保持稳定
      expect(renderer.resourceManager.getResourceCount()).toBe(initialResourceCount);

      // 清理
      layer.remove();
      layer.dispose();

      // 检查内存泄漏
      const leaks = renderer.resourceManager.detectLeaks();
      expect(leaks).toHaveLength(0);
    });
  });

  describe('Layer Switch Memory', () => {
    it('should not leak memory when switching between layers', () => {
      const layer1 = new ResourceLayer();
      const layer2 = new ResourceLayer();
      const layer3 = new ResourceLayer();

      layer1.add(renderer);
      layer2.add(renderer);
      layer3.add(renderer);

      layer1.registerLayerResource('resource-1');
      layer2.registerLayerResource('resource-2');
      layer3.registerLayerResource('resource-3');

      const initialResourceCount = renderer.resourceManager.getResourceCount();

      // 切换图层可见性
      for (let i = 0; i < 100; i++) {
        layer1.hide();
        layer2.show();
        layer2.hide();
        layer3.show();
        layer3.hide();
        layer1.show();
      }

      // 资源数量应该保持稳定
      expect(renderer.resourceManager.getResourceCount()).toBe(initialResourceCount);

      // 清理
      layer1.remove();
      layer1.dispose();
      layer2.remove();
      layer2.dispose();
      layer3.remove();
      layer3.dispose();

      // 检查内存泄漏
      const leaks = renderer.resourceManager.detectLeaks();
      expect(leaks).toHaveLength(0);
    });

    it('should not leak memory when replacing layers', () => {
      const layers: ResourceLayer[] = [];

      // 初始添加图层
      for (let i = 0; i < 5; i++) {
        const layer = new ResourceLayer();
        layer.add(renderer);
        layer.registerLayerResource(`resource-${i}`);
        layers.push(layer);
      }

      // 替换图层
      for (let i = 0; i < 10; i++) {
        const oldLayer = layers[i % 5];
        const newLayer = new ResourceLayer();
        newLayer.add(renderer);
        newLayer.registerLayerResource(`new-resource-${i}`);

        layers[i % 5] = newLayer;

        // 移除旧图层
        oldLayer.remove();
        oldLayer.dispose();
      }

      // 清理所有图层
      layers.forEach((layer) => {
        layer.remove();
        layer.dispose();
      });

      // 检查内存泄漏
      const leaks = renderer.resourceManager.detectLeaks();
      expect(leaks).toHaveLength(0);
    });
  });

  describe('Layer Dispose Memory', () => {
    it('should clean up all resources when disposed', () => {
      const layer = new ResourceLayer();
      layer.add(renderer);

      // 注册多个资源
      for (let i = 0; i < 10; i++) {
        layer.registerLayerResource(`resource-${i}`);
      }

      expect(layer.resourceCount).toBe(10);

      // 销毁图层
      layer.dispose();

      // 检查内存泄漏
      const leaks = renderer.resourceManager.detectLeaks();
      expect(leaks).toHaveLength(0);

      // 图层状态应该更新
      expect(layer.state).toBe('disposed');
    });

    it('should not leak memory when disposing multiple layers', () => {
      const layers: ResourceLayer[] = [];

      // 添加多个图层
      for (let i = 0; i < 20; i++) {
        const layer = new ResourceLayer();
        layer.add(renderer);
        for (let j = 0; j < 5; j++) {
          layer.registerLayerResource(`resource-${i}-${j}`);
        }
        layers.push(layer);
      }

      // 销毁所有图层
      layers.forEach((layer) => {
        layer.dispose();
      });

      // 检查内存泄漏
      const leaks = renderer.resourceManager.detectLeaks();
      expect(leaks).toHaveLength(0);
    });

    it('should handle dispose of already removed layer', () => {
      const layer = new ResourceLayer();
      layer.add(renderer);

      layer.registerLayerResource('resource-1');

      // 先移除
      layer.remove();

      // 再销毁
      expect(() => layer.dispose()).not.toThrow();

      // 检查内存泄漏
      const leaks = renderer.resourceManager.detectLeaks();
      expect(leaks).toHaveLength(0);
    });
  });

  describe('Layer Lifecycle Stress Test', () => {
    it('should handle rapid add/remove operations without memory leak', () => {
      for (let i = 0; i < 100; i++) {
        const layer = new ResourceLayer();
        layer.add(renderer);
        layer.registerLayerResource(`resource-${i}`);
        layer.remove();
        layer.dispose();
      }

      // 检查内存泄漏
      const leaks = renderer.resourceManager.detectLeaks();
      expect(leaks).toHaveLength(0);
    });

    it('should handle rapid show/hide operations without memory leak', () => {
      const layer = new ResourceLayer();
      layer.add(renderer);
      layer.registerLayerResource('resource-1');

      for (let i = 0; i < 1000; i++) {
        layer.show();
        layer.hide();
      }

      // 清理
      layer.remove();
      layer.dispose();

      // 检查内存泄漏
      const leaks = renderer.resourceManager.detectLeaks();
      expect(leaks).toHaveLength(0);
    });

    it('should handle complex lifecycle without memory leak', () => {
      const layers: ResourceLayer[] = [];

      for (let cycle = 0; cycle < 10; cycle++) {
        // 添加图层
        for (let i = 0; i < 5; i++) {
          const layer = new ResourceLayer();
          layer.add(renderer);
          layer.registerLayerResource(`resource-${cycle}-${i}`);
          layers.push(layer);
        }

        // 切换可见性
        layers.forEach((layer) => {
          if (Math.random() > 0.5) {
            layer.show();
          } else {
            layer.hide();
          }
        });

        // 移除一半图层
        for (let i = 0; i < layers.length / 2; i++) {
          const layer = layers.pop();
          if (layer) {
            layer.remove();
            layer.dispose();
          }
        }
      }

      // 清理剩余图层
      layers.forEach((layer) => {
        layer.remove();
        layer.dispose();
      });

      // 检查内存泄漏
      const leaks = renderer.resourceManager.detectLeaks();
      expect(leaks).toHaveLength(0);
    });
  });

  describe('Resource Reference Counting', () => {
    it('should properly manage resource references', () => {
      const layer = new ResourceLayer();
      layer.add(renderer);

      // 注册资源
      layer.registerLayerResource('shared-resource');

      // 增加引用
      layer.addResourceRef('shared-resource');
      layer.addResourceRef('shared-resource');

      // 减少引用（不应释放）
      layer.releaseResourceRef('shared-resource');
      layer.releaseResourceRef('shared-resource');

      // 检查资源是否被释放
      const resource = renderer.resourceManager.getResource('shared-resource');
      // 应该还存在，因为初始注册的引用还在
      expect(resource).toBeDefined();

      // 通过 remove 触发完全释放
      layer.remove();
      layer.dispose();
    });

    it('should not leak when using addRef/releaseRef', () => {
      const layer = new ResourceLayer();
      layer.add(renderer);

      // 注册资源并操作引用
      layer.registerLayerResource('resource-1');

      for (let i = 0; i < 100; i++) {
        layer.addResourceRef('resource-1');
        layer.releaseResourceRef('resource-1');
      }

      // 清理
      layer.remove();
      layer.dispose();

      // 检查内存泄漏
      const leaks = renderer.resourceManager.detectLeaks();
      expect(leaks).toHaveLength(0);
    });
  });

  describe('Layer Memory with Hooks', () => {
    it('should not leak memory with hooks', () => {
      const onAdd = vi.fn();
      const onRemove = vi.fn();
      const onShow = vi.fn();
      const onHide = vi.fn();

      const layer = new ResourceLayer({
        hooks: {
          onAdd,
          onRemove,
          onShow,
          onHide,
        },
      });

      layer.add(renderer);
      layer.registerLayerResource('resource-1');

      // 多次显示/隐藏
      for (let i = 0; i < 50; i++) {
        layer.hide();
        layer.show();
      }

      layer.remove();
      layer.dispose();

      // 检查内存泄漏
      const leaks = renderer.resourceManager.detectLeaks();
      expect(leaks).toHaveLength(0);

      // 钩子应该被调用
      expect(onAdd).toHaveBeenCalled();
      expect(onRemove).toHaveBeenCalled();
      expect(onShow).toHaveBeenCalled();
      expect(onHide).toHaveBeenCalled();
    });
  });
});
