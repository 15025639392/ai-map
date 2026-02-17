import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LayerManager } from '../../src/controls/LayerManager.js';
import { ControlEventType } from '../../src/controls/types.js';
import { Layer } from '../../src/renderer/Layer.js';

describe('LayerManager', () => {
  let layerManager: LayerManager;
  let mockLayer: any;

  beforeEach(() => {
    layerManager = new LayerManager();

    // 创建模拟图层
    mockLayer = {
      id: 'test-layer',
      isVisible: vi.fn(() => true),
      show: vi.fn(),
      hide: vi.fn(),
      setPriority: vi.fn(),
    };
  });

  afterEach(() => {
    layerManager.dispose();
  });

  describe('添加图层', () => {
    it('应该能够添加图层', () => {
      const layerId = layerManager.addLayer(mockLayer);
      expect(layerId).toBe('test-layer');
      expect(layerManager.getLayer('test-layer')).toBeDefined();
    });

    it('应该能够自定义图层名称', () => {
      const layerId = layerManager.addLayer(mockLayer, 'custom-name');
      expect(layerId).toBe('custom-name');
      expect(layerManager.getLayer('custom-name')).toBeDefined();
    });

    it('应该能够设置图层顺序', () => {
      const layerId = layerManager.addLayer(mockLayer, 'test-layer', 10);
      const item = layerManager.getLayer('test-layer');
      expect(item?.zIndex).toBe(10);
    });

    it('不应该重复添加相同ID的图层', () => {
      layerManager.addLayer(mockLayer, 'test-layer');

      // 尝试添加相同名称的图层
      layerManager.addLayer(mockLayer, 'test-layer');

      const item = layerManager.getLayer('test-layer');
      expect(item).toBeDefined();
    });

    it('应该自动分配图层顺序', () => {
      const mockLayer2 = { ...mockLayer, id: 'test-layer-2' };

      const id1 = layerManager.addLayer(mockLayer);
      const id2 = layerManager.addLayer(mockLayer2);

      const item1 = layerManager.getLayer(id1);
      const item2 = layerManager.getLayer(id2);

      expect(item1?.zIndex).toBe(0);
      expect(item2?.zIndex).toBe(1);
    });
  });

  describe('移除图层', () => {
    it('应该能够移除图层', () => {
      layerManager.addLayer(mockLayer);
      const result = layerManager.removeLayer('test-layer');
      expect(result).toBe(true);
      expect(layerManager.getLayer('test-layer')).toBeUndefined();
    });

    it('移除不存在的图层应该返回false', () => {
      const result = layerManager.removeLayer('non-existent');
      expect(result).toBe(false);
    });

    it('应该能够根据图层对象移除', () => {
      layerManager.addLayer(mockLayer);
      const result = layerManager.removeLayerByObject(mockLayer);
      expect(result).toBe(true);
      expect(layerManager.getLayer('test-layer')).toBeUndefined();
    });
  });

  describe('获取图层', () => {
    it('应该能够获取单个图层', () => {
      layerManager.addLayer(mockLayer);
      const item = layerManager.getLayer('test-layer');
      expect(item).toBeDefined();
      expect(item?.layer).toBe(mockLayer);
      expect(item?.name).toBe('test-layer');
    });

    it('获取不存在的图层应该返回undefined', () => {
      const item = layerManager.getLayer('non-existent');
      expect(item).toBeUndefined();
    });

    it('应该能够获取所有图层', () => {
      const mockLayer2 = { ...mockLayer, id: 'test-layer-2' };

      layerManager.addLayer(mockLayer, 'layer1', 2);
      layerManager.addLayer(mockLayer2, 'layer2', 1);

      const allLayers = layerManager.getAllLayers();
      expect(allLayers).toHaveLength(2);
      // 应该按zIndex排序
      expect(allLayers[0].zIndex).toBe(1);
      expect(allLayers[1].zIndex).toBe(2);
    });

    it('应该能够获取可见图层', () => {
      const mockLayer2 = { ...mockLayer, id: 'test-layer-2', isVisible: vi.fn(() => false) };

      layerManager.addLayer(mockLayer, 'layer1');
      layerManager.addLayer(mockLayer2, 'layer2');

      const visibleLayers = layerManager.getVisibleLayers();
      expect(visibleLayers).toHaveLength(1);
      expect(visibleLayers[0].name).toBe('layer1');
    });
  });

  describe('图层可见性', () => {
    it('应该能够设置图层可见性', () => {
      layerManager.addLayer(mockLayer);
      const result = layerManager.setLayerVisibility('test-layer', false);
      expect(result).toBe(true);
      expect(mockLayer.hide).toHaveBeenCalled();
    });

    it('应该能够显示隐藏的图层', () => {
      layerManager.addLayer(mockLayer);
      layerManager.setLayerVisibility('test-layer', false);
      const result = layerManager.setLayerVisibility('test-layer', true);
      expect(result).toBe(true);
      expect(mockLayer.show).toHaveBeenCalled();
    });

    it('设置不存在的图层可见性应该返回false', () => {
      const result = layerManager.setLayerVisibility('non-existent', true);
      expect(result).toBe(false);
    });

    it('应该能够切换图层可见性', () => {
      mockLayer.isVisible = vi.fn(() => true);
      layerManager.addLayer(mockLayer);

      layerManager.toggleLayerVisibility('test-layer');
      expect(mockLayer.hide).toHaveBeenCalled();

      layerManager.toggleLayerVisibility('test-layer');
      expect(mockLayer.show).toHaveBeenCalled();
    });

    it('切换不存在的图层可见性应该返回false', () => {
      const result = layerManager.toggleLayerVisibility('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('图层顺序', () => {
    beforeEach(() => {
      mockLayer.setPriority = vi.fn();
    });

    it('应该能够设置图层顺序', () => {
      layerManager.addLayer(mockLayer, 'test-layer', 0);
      const result = layerManager.setLayerOrder('test-layer', 10);
      expect(result).toBe(true);
      expect(mockLayer.setPriority).toHaveBeenCalledWith(10);
    });

    it('设置不存在的图层顺序应该返回false', () => {
      const result = layerManager.setLayerOrder('non-existent', 10);
      expect(result).toBe(false);
    });

    it('应该能够上移图层', () => {
      const mockLayer2 = { ...mockLayer, id: 'test-layer-2', setPriority: vi.fn() };

      layerManager.addLayer(mockLayer, 'layer1', 0);
      layerManager.addLayer(mockLayer2, 'layer2', 1);

      const result = layerManager.moveLayerUp('layer1');
      expect(result).toBe(true);
      // layer1的zIndex应该大于layer2
      const item1 = layerManager.getLayer('layer1');
      const item2 = layerManager.getLayer('layer2');
      expect(item1?.zIndex).toBeGreaterThan(item2?.zIndex || 0);
    });

    it('最上层图层上移应该返回false', () => {
      layerManager.addLayer(mockLayer, 'test-layer', 0);
      const result = layerManager.moveLayerUp('test-layer');
      expect(result).toBe(false);
    });

    it('应该能够下移图层', () => {
      const mockLayer2 = { ...mockLayer, id: 'test-layer-2', setPriority: vi.fn() };

      layerManager.addLayer(mockLayer, 'layer1', 1);
      layerManager.addLayer(mockLayer2, 'layer2', 0);

      const result = layerManager.moveLayerDown('layer1');
      expect(result).toBe(true);
      const item1 = layerManager.getLayer('layer1');
      const item2 = layerManager.getLayer('layer2');
      expect(item1?.zIndex).toBeLessThan(item2?.zIndex || 0);
    });

    it('最下层图层下移应该返回false', () => {
      layerManager.addLayer(mockLayer, 'test-layer', 0);
      const result = layerManager.moveLayerDown('test-layer');
      expect(result).toBe(false);
    });

    it('应该能够将图层移至顶部', () => {
      const mockLayer2 = { ...mockLayer, id: 'test-layer-2', setPriority: vi.fn() };

      layerManager.addLayer(mockLayer, 'layer1', 0);
      layerManager.addLayer(mockLayer2, 'layer2', 10);

      layerManager.moveLayerToTop('layer1');
      const item1 = layerManager.getLayer('layer1');
      const item2 = layerManager.getLayer('layer2');
      expect(item1?.zIndex).toBeGreaterThan(item2?.zIndex || 0);
    });

    it('应该能够将图层移至底部', () => {
      const mockLayer2 = { ...mockLayer, id: 'test-layer-2', setPriority: vi.fn() };

      layerManager.addLayer(mockLayer, 'layer1', 10);
      layerManager.addLayer(mockLayer2, 'layer2', 0);

      layerManager.moveLayerToBottom('layer1');
      const item1 = layerManager.getLayer('layer1');
      const item2 = layerManager.getLayer('layer2');
      expect(item1?.zIndex).toBeLessThan(item2?.zIndex || 0);
    });
  });

  describe('重命名图层', () => {
    it('应该能够重命名图层', () => {
      layerManager.addLayer(mockLayer, 'old-name');
      const result = layerManager.renameLayer('old-name', 'new-name');
      expect(result).toBe(true);
      expect(layerManager.getLayer('new-name')).toBeDefined();
      expect(layerManager.getLayer('old-name')).toBeUndefined();
    });

    it('重命名不存在的图层应该返回false', () => {
      const result = layerManager.renameLayer('non-existent', 'new-name');
      expect(result).toBe(false);
    });

    it('新名称已存在应该返回false', () => {
      const mockLayer2 = { ...mockLayer, id: 'test-layer-2' };

      layerManager.addLayer(mockLayer, 'layer1');
      layerManager.addLayer(mockLayer2, 'layer2');

      const result = layerManager.renameLayer('layer1', 'layer2');
      expect(result).toBe(false);
    });
  });

  describe('清空图层', () => {
    it('应该能够清空所有图层', () => {
      const mockLayer2 = { ...mockLayer, id: 'test-layer-2' };

      layerManager.addLayer(mockLayer, 'layer1');
      layerManager.addLayer(mockLayer2, 'layer2');

      layerManager.clear();

      expect(layerManager.getLayerCount()).toBe(0);
      expect(layerManager.getLayer('layer1')).toBeUndefined();
      expect(layerManager.getLayer('layer2')).toBeUndefined();
    });
  });

  describe('图层数量', () => {
    it('应该能够获取图层数量', () => {
      expect(layerManager.getLayerCount()).toBe(0);

      layerManager.addLayer(mockLayer, 'layer1');
      expect(layerManager.getLayerCount()).toBe(1);

      const mockLayer2 = { ...mockLayer, id: 'test-layer-2' };
      layerManager.addLayer(mockLayer2, 'layer2');
      expect(layerManager.getLayerCount()).toBe(2);
    });
  });

  describe('事件系统', () => {
    it('应该在添加图层时发送事件', () => {
      const listener = vi.fn();
      layerManager.on(ControlEventType.LAYER_CHANGE, listener);

      layerManager.addLayer(mockLayer);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener.mock.calls[0][0].data.action).toBe('add');
    });

    it('应该在移除图层时发送事件', () => {
      layerManager.addLayer(mockLayer);

      const listener = vi.fn();
      layerManager.on(ControlEventType.LAYER_CHANGE, listener);

      layerManager.removeLayer('test-layer');

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener.mock.calls[0][0].data.action).toBe('remove');
    });

    it('应该在改变图层可见性时发送事件', () => {
      layerManager.addLayer(mockLayer);

      const listener = vi.fn();
      layerManager.on(ControlEventType.LAYER_VISIBILITY_CHANGE, listener);

      layerManager.setLayerVisibility('test-layer', false);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener.mock.calls[0][0].data.visible).toBe(false);
    });

    it('应该在改变图层顺序时发送事件', () => {
      layerManager.addLayer(mockLayer, 'test-layer', 0);

      const listener = vi.fn();
      layerManager.on(ControlEventType.LAYER_ORDER_CHANGE, listener);

      layerManager.setLayerOrder('test-layer', 10);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener.mock.calls[0][0].data.newZIndex).toBe(10);
    });

    it('应该能够取消订阅', () => {
      const listener = vi.fn();
      const unsubscribe = layerManager.on(ControlEventType.LAYER_CHANGE, listener);

      unsubscribe();
      layerManager.addLayer(mockLayer);

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('性能监控', () => {
    it('应该能够获取性能监控器', () => {
      const monitor = layerManager.getPerformanceMonitor();
      expect(monitor).toBeDefined();
    });

    it('应该自动记录操作性能', () => {
      layerManager.addLayer(mockLayer);

      const monitor = layerManager.getPerformanceMonitor();
      expect(monitor.getSampleCount('layer:add')).toBeGreaterThan(0);
    });

    it('应该记录多种操作的性能', () => {
      layerManager.addLayer(mockLayer);
      layerManager.setLayerVisibility('test-layer', false);
      layerManager.setLayerOrder('test-layer', 10);
      layerManager.removeLayer('test-layer');

      const monitor = layerManager.getPerformanceMonitor();
      expect(monitor.getSampleCount('layer:add')).toBeGreaterThan(0);
      expect(monitor.getSampleCount('layer:setVisibility')).toBeGreaterThan(0);
      expect(monitor.getSampleCount('layer:setOrder')).toBeGreaterThan(0);
      expect(monitor.getSampleCount('layer:remove')).toBeGreaterThan(0);
    });
  });

  describe('销毁', () => {
    it('应该能够正确销毁管理器', () => {
      layerManager.addLayer(mockLayer);
      layerManager.dispose();

      expect(layerManager.getLayerCount()).toBe(0);
    });

    it('销毁后应该清除性能数据', () => {
      layerManager.addLayer(mockLayer);

      const monitor = layerManager.getPerformanceMonitor();
      monitor.record('test', 10);

      layerManager.dispose();

      const newMonitor = layerManager.getPerformanceMonitor();
      expect(newMonitor.getSampleCount('layer:add')).toBe(0);
      expect(newMonitor.getSampleCount('test')).toBe(0);
    });
  });
});
