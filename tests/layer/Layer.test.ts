import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Layer } from '../../src/renderer/Layer.js';
import { LayerState } from '../../src/renderer/types.js';
import { createMockCanvas, createMockWebGL2Context } from '../renderer/mocks/webgl-mock.js';
import type { IRenderer } from '../../src/renderer/types.js';

// 创建一个测试用的 Layer 子类
class TestLayer extends Layer {
  renderCalled = 0;
  renderFn = vi.fn();

  render(renderer: IRenderer): void {
    this.renderCalled++;
    this.renderFn(renderer);
  }
}

describe('Layer', () => {
  let renderer: IRenderer;
  let mockCanvas: HTMLCanvasElement;
  let mockContext: any;

  beforeEach(() => {
    mockCanvas = createMockCanvas();
    mockContext = createMockWebGL2Context(mockCanvas);

    renderer = {
      resourceManager: {
        registerResource: vi.fn(),
        addRef: vi.fn(),
        releaseRef: vi.fn(),
        disposeResource: vi.fn(),
        getResourceCount: vi.fn(() => 0),
        detectLeaks: vi.fn(() => []),
        hasResource: vi.fn(() => false),
        getResource: vi.fn(() => undefined),
        getResourceInfo: vi.fn(() => []),
        disposeAll: vi.fn(),
        dispose: vi.fn(),
      },
      gl: mockContext as unknown as WebGL2RenderingContext,
      pipeline: {
        addNode: vi.fn(),
        removeNode: vi.fn(),
        getNode: vi.fn(),
        updateNode: vi.fn(),
      },
    };
  });

  describe('Constructor', () => {
    it('should create layer with auto-generated id', () => {
      const layer = new TestLayer();
      expect(layer.id).toMatch(/^layer-\d+$/);
      expect(layer.priority).toBe(0);
      expect(layer.visible).toBe(true);
    });

    it('should create layer with custom options', () => {
      const layer = new TestLayer({
        id: 'test-layer',
        priority: 10,
        visible: false,
        name: 'Test Layer',
      });
      expect(layer.id).toBe('test-layer');
      expect(layer.priority).toBe(10);
      expect(layer.visible).toBe(false);
      expect(layer.name).toBe('Test Layer');
    });

    it('should initialize with INITIALIZED state', () => {
      const layer = new TestLayer();
      expect(layer.state).toBe(LayerState.INITIALIZED);
    });
  });

  describe('add', () => {
    it('should add layer to renderer', () => {
      const layer = new TestLayer();
      layer.add(renderer);

      expect(renderer.pipeline.addNode).toHaveBeenCalledWith(layer);
      expect(layer.state).toBe(LayerState.SHOWN);
      expect(layer.renderer).toBe(renderer);
    });

    it('should add invisible layer', () => {
      const layer = new TestLayer({ visible: false });
      layer.add(renderer);

      expect(renderer.pipeline.addNode).toHaveBeenCalledWith(layer);
      expect(layer.state).toBe(LayerState.ADDED);
      expect(layer.visible).toBe(false);
    });

    it('should call onAdd hook', () => {
      const onAdd = vi.fn();
      const layer = new TestLayer({ hooks: { onAdd } });
      layer.add(renderer);

      expect(onAdd).toHaveBeenCalled();
    });

    it('should not add if already added', () => {
      const layer = new TestLayer();

      const addSpy = vi.spyOn(renderer.pipeline, 'addNode');
      layer.add(renderer);
      layer.add(renderer);

      expect(addSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw error if layer is disposed', () => {
      const layer = new TestLayer();
      layer.dispose();

      expect(() => layer.add(renderer)).toThrow('is disposed');
    });

    it('should handle async onAdd hook', async () => {
      const onAdd = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });
      const layer = new TestLayer({ hooks: { onAdd } });

      await layer.add(renderer);

      expect(onAdd).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove layer from renderer', () => {
      const layer = new TestLayer();
      layer.add(renderer);

      layer.remove();

      expect(renderer.pipeline.removeNode).toHaveBeenCalledWith(layer.id);
      expect(layer.state).toBe(LayerState.REMOVED);
      expect(layer.renderer).toBeNull();
    });

    it('should call onRemove hook', () => {
      const onRemove = vi.fn();
      const layer = new TestLayer({ hooks: { onRemove } });
      layer.add(renderer);

      layer.remove();

      expect(onRemove).toHaveBeenCalled();
    });

    it('should not remove if not added', () => {
      const layer = new TestLayer();

      const removeSpy = vi.spyOn(renderer.pipeline, 'removeNode');
      layer.remove();

      expect(removeSpy).not.toHaveBeenCalled();
    });

    it('should throw error if layer is disposed', () => {
      const layer = new TestLayer();
      layer.add(renderer);
      layer.dispose();

      expect(() => layer.remove()).toThrow('is disposed');
    });

    it('should handle async onRemove hook', async () => {
      const onRemove = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });
      const layer = new TestLayer({ hooks: { onRemove } });
      layer.add(renderer);

      await layer.remove();

      expect(onRemove).toHaveBeenCalled();
    });
  });

  describe('show', () => {
    it('should show hidden layer', () => {
      const onShow = vi.fn();
      const layer = new TestLayer({ visible: false, hooks: { onShow } });
      layer.add(renderer);

      layer.show();

      expect(layer.visible).toBe(true);
      expect(layer.state).toBe(LayerState.SHOWN);
      expect(onShow).toHaveBeenCalled();
    });

    it('should not show if already visible', () => {
      const onShow = vi.fn();
      const layer = new TestLayer({ hooks: { onShow } });
      layer.add(renderer);

      layer.show();

      expect(onShow).not.toHaveBeenCalled();
    });

    it('should warn if layer is not added', () => {
      const layer = new TestLayer({ visible: false });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      layer.show();
      consoleWarnSpy.mockRestore();

      expect(layer.visible).toBe(false);
    });

    it('should throw error if layer is disposed', () => {
      const layer = new TestLayer({ visible: false });
      layer.add(renderer);
      layer.dispose();

      expect(() => layer.show()).toThrow('is disposed');
    });

    it('should handle async onShow hook', async () => {
      const onShow = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });
      const layer = new TestLayer({ visible: false, hooks: { onShow } });
      layer.add(renderer);

      await layer.show();

      expect(onShow).toHaveBeenCalled();
    });
  });

  describe('hide', () => {
    it('should hide visible layer', () => {
      const onHide = vi.fn();
      const layer = new TestLayer({ hooks: { onHide } });
      layer.add(renderer);

      layer.hide();

      expect(layer.visible).toBe(false);
      expect(layer.state).toBe(LayerState.HIDDEN);
      expect(onHide).toHaveBeenCalled();
    });

    it('should not hide if already hidden', () => {
      const onHide = vi.fn();
      const layer = new TestLayer({ visible: false, hooks: { onHide } });
      layer.add(renderer);

      layer.hide();

      expect(onHide).not.toHaveBeenCalled();
    });

    it('should warn if layer is not added', () => {
      const layer = new TestLayer();

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      layer.hide();
      consoleWarnSpy.mockRestore();

      expect(layer.visible).toBe(true);
    });

    it('should throw error if layer is disposed', () => {
      const layer = new TestLayer();
      layer.add(renderer);
      layer.dispose();

      expect(() => layer.hide()).toThrow('is disposed');
    });

    it('should handle async onHide hook', async () => {
      const onHide = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });
      const layer = new TestLayer({ hooks: { onHide } });
      layer.add(renderer);

      await layer.hide();

      expect(onHide).toHaveBeenCalled();
    });
  });

  describe('toggle', () => {
    it('should toggle visible to hidden', () => {
      const onHide = vi.fn();
      const layer = new TestLayer({ hooks: { onHide } });
      layer.add(renderer);

      layer.toggle();

      expect(layer.visible).toBe(false);
      expect(layer.state).toBe(LayerState.HIDDEN);
      expect(onHide).toHaveBeenCalled();
    });

    it('should toggle hidden to visible', () => {
      const onShow = vi.fn();
      const layer = new TestLayer({ visible: false, hooks: { onShow } });
      layer.add(renderer);

      layer.toggle();

      expect(layer.visible).toBe(true);
      expect(layer.state).toBe(LayerState.SHOWN);
      expect(onShow).toHaveBeenCalled();
    });
  });

  describe('setPriority', () => {
    it('should update priority', () => {
      const layer = new TestLayer({ priority: 5 });
      layer.setPriority(10);

      expect(layer.priority).toBe(10);
    });

    it('should update pipeline if layer is added', () => {
      const layer = new TestLayer({ priority: 5 });
      layer.add(renderer);

      layer.setPriority(10);

      expect(renderer.pipeline.updateNode).toHaveBeenCalledWith(layer.id, expect.any(Function));
    });

    it('should not call updateNode if priority unchanged', () => {
      const layer = new TestLayer({ priority: 5 });
      layer.add(renderer);

      layer.setPriority(5);

      expect(renderer.pipeline.updateNode).not.toHaveBeenCalled();
    });

    it('should throw error if layer is disposed', () => {
      const layer = new TestLayer();
      layer.dispose();

      expect(() => layer.setPriority(10)).toThrow('is disposed');
    });
  });

  describe('isAdded', () => {
    it('should return false for initialized layer', () => {
      const layer = new TestLayer();
      expect(layer.isAdded()).toBe(false);
    });

    it('should return true for added layer', () => {
      const layer = new TestLayer();
      layer.add(renderer);
      expect(layer.isAdded()).toBe(true);
    });

    it('should return false for removed layer', () => {
      const layer = new TestLayer();
      layer.add(renderer);
      layer.remove();
      expect(layer.isAdded()).toBe(false);
    });
  });

  describe('isVisible', () => {
    it('should return visible status', () => {
      const layer = new TestLayer({ visible: true });
      expect(layer.isVisible()).toBe(true);

      layer.visible = false;
      expect(layer.isVisible()).toBe(false);
    });
  });

  describe('Resource Management', () => {
    it('should register resource through renderer', () => {
      const layer = new TestLayer();
      layer.add(renderer);

      const mockTexture = {} as WebGLTexture;
      layer.registerResource('test-texture', 'texture', mockTexture, vi.fn());

      expect(renderer.resourceManager.registerResource).toHaveBeenCalledWith(
        'test-texture',
        'texture',
        mockTexture,
        expect.any(Function)
      );
    });

    it('should add resource ref', () => {
      const layer = new TestLayer();
      layer.add(renderer);

      layer.addResourceRef('test-resource');

      expect(renderer.resourceManager.addRef).toHaveBeenCalledWith('test-resource');
    });

    it('should release resource ref', () => {
      const layer = new TestLayer();
      layer.add(renderer);

      layer.releaseResourceRef('test-resource');

      expect(renderer.resourceManager.releaseRef).toHaveBeenCalledWith('test-resource');
    });

    it('should dispose resource', () => {
      const layer = new TestLayer();
      layer.add(renderer);

      layer.disposeResource('test-resource');

      expect(renderer.resourceManager.disposeResource).toHaveBeenCalledWith('test-resource');
    });

    it('should throw error if not added to renderer', () => {
      const layer = new TestLayer();

      expect(() => layer.registerResource('test', 'texture', {} as WebGLTexture, vi.fn())).toThrow(
        'not added to a renderer'
      );
    });
  });

  describe('dispose', () => {
    it('should dispose layer', () => {
      const layer = new TestLayer();
      layer.add(renderer);

      layer.dispose();

      expect(layer.state).toBe(LayerState.DISPOSED);
      expect(layer.renderer).toBeNull();
    });

    it('should remove from renderer if added', () => {
      const layer = new TestLayer();
      layer.add(renderer);

      layer.dispose();

      expect(renderer.pipeline.removeNode).toHaveBeenCalledWith(layer.id);
    });

    it('should not throw if called twice', () => {
      const layer = new TestLayer();
      layer.dispose();

      expect(() => layer.dispose()).not.toThrow();
    });

    it('should call disposeResources', () => {
      class CustomLayer extends TestLayer {
        disposeResourcesCalled = false;

        protected disposeResources(): void {
          this.disposeResourcesCalled = true;
        }
      }

      const layer = new CustomLayer();
      layer.add(renderer);

      layer.dispose();

      expect(layer.disposeResourcesCalled).toBe(true);
    });
  });

  describe('render', () => {
    it('should call render implementation', () => {
      const layer = new TestLayer();
      layer.render(renderer);

      expect(layer.renderCalled).toBe(1);
      expect(layer.renderFn).toHaveBeenCalledWith(renderer);
    });
  });

  describe('Hook Error Handling', () => {
    it('should handle onAdd hook error', () => {
      const onAdd = vi.fn(() => {
        throw new Error('Hook error');
      });
      const layer = new TestLayer({ hooks: { onAdd } });

      expect(() => layer.add(renderer)).not.toThrow();
      expect(layer.state).toBe(LayerState.SHOWN);
    });

    it('should handle onRemove hook error', () => {
      const onRemove = vi.fn(() => {
        throw new Error('Hook error');
      });
      const layer = new TestLayer({ hooks: { onRemove } });
      layer.add(renderer);

      expect(() => layer.remove()).not.toThrow();
      expect(layer.state).toBe(LayerState.REMOVED);
    });

    it('should handle onShow hook error', () => {
      const onShow = vi.fn(() => {
        throw new Error('Hook error');
      });
      const layer = new TestLayer({ visible: false, hooks: { onShow } });
      layer.add(renderer);

      expect(() => layer.show()).not.toThrow();
      expect(layer.visible).toBe(true);
    });

    it('should handle onHide hook error', () => {
      const onHide = vi.fn(() => {
        throw new Error('Hook error');
      });
      const layer = new TestLayer({ hooks: { onHide } });
      layer.add(renderer);

      expect(() => layer.hide()).not.toThrow();
      expect(layer.visible).toBe(false);
    });
  });
});
