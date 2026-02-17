import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryControl } from '../../src/controls/QueryControl.js';
import { VectorLayer } from '../../src/vectors/VectorLayer.js';
import { QueryType, ControlEventType } from '../../src/controls/types.js';
import type { GeoJSONData } from '../../src/vectortypes.js';

describe('QueryControl', () => {
  let queryControl: QueryControl;
  let mockLayer: any;

  beforeEach(() => {
    queryControl = new QueryControl();

    // 创建模拟图层
    mockLayer = {
      id: 'test-layer',
      isVisible: vi.fn(() => true),
      pick: vi.fn(() => []),
      getFeatures: vi.fn(() => []),
      getFeatureById: vi.fn(() => null),
    };
  });

  afterEach(() => {
    queryControl.dispose();
  });

  describe('图层管理', () => {
    it('应该能够添加图层', () => {
      queryControl.addLayer(mockLayer);
      expect(queryControl['layers']).toContain(mockLayer);
    });

    it('不应该重复添加图层', () => {
      queryControl.addLayer(mockLayer);
      queryControl.addLayer(mockLayer);
      // 不应该重复添加
      expect(queryControl['layers'].filter((l) => l === mockLayer).length).toBe(1);
    });

    it('应该能够移除图层', () => {
      queryControl.addLayer(mockLayer);
      queryControl.removeLayer(mockLayer);
      // 移除后不应该包含图层
      expect(queryControl['layers']).not.toContain(mockLayer);
    });

    it('应该能够清空所有图层', () => {
      queryControl.addLayer(mockLayer);
      queryControl.clearLayers();
      // 清空后应该没有图层
      expect(queryControl['layers'].length).toBe(0);
    });
  });

  describe('点击拾取', () => {
    it('应该能够在图图层上进行拾取', async () => {
      const mockFeatures = [
        { id: 1, geometry: { type: 'point', coordinates: [0, 0] } },
      ];

      mockLayer.pick = vi.fn(() => [
        { feature: mockFeatures[0], distance: 10, screenPosition: [100, 100] },
      ]);

      queryControl.addLayer(mockLayer);

      const result = await queryControl.pick([100, 100] as [number, number]);
      expect(result.features).toHaveLength(1);
      expect(result.features[0]).toEqual(mockFeatures[0]);
      expect(mockLayer.pick).toHaveBeenCalledWith([100, 100]);
    });

    it('应该跳过不可见图层', async () => {
      mockLayer.isVisible = vi.fn(() => false);
      mockLayer.pick = vi.fn(() => []);

      queryControl.addLayer(mockLayer);

      const result = await queryControl.pick([100, 100] as [number, number]);
      expect(result.features).toHaveLength(0);
      expect(mockLayer.pick).not.toHaveBeenCalled();
    });

    it('应该支持从多个图层拾取', async () => {
      const mockLayer2 = { ...mockLayer, id: 'test-layer-2' };

      const features1 = [
        { id: 1, geometry: { type: 'point', coordinates: [0, 0] } },
      ];
      const features2 = [
        { id: 2, geometry: { type: 'point', coordinates: [1, 1] } },
      ];

      mockLayer.pick = vi.fn(() => [
        { feature: features1[0], distance: 10, screenPosition: [100, 100] },
      ]);
      mockLayer2.pick = vi.fn(() => [
        { feature: features2[0], distance: 15, screenPosition: [100, 100] },
      ]);

      queryControl.addLayer(mockLayer);
      queryControl.addLayer(mockLayer2);

      const result = await queryControl.pick([100, 100] as [number, number]);
      expect(result.features).toHaveLength(2);
    });
  });

  describe('框选查询', () => {
    it('应该能够进行框选查询', async () => {
      const mockFeatures = [
        { id: 1, geometry: { type: 'point', coordinates: [5, 5] } },
        { id: 2, geometry: { type: 'point', coordinates: [15, 15] } },
        { id: 3, geometry: { type: 'point', coordinates: [25, 25] } },
      ];

      mockLayer.getFeatures = vi.fn(() => mockFeatures);

      queryControl.addLayer(mockLayer);

      const result = await queryControl.boxQuery([
        [0, 0] as [number, number],
        [20, 20] as [number, number],
      ]);

      // 应该包含前两个要素（在框内）
      expect(result.features).toHaveLength(2);
      expect(result.bounds).toEqual([
        [0, 0] as [number, number],
        [20, 20] as [number, number],
      ]);
    });

    it('应该跳过不可见图层的框选', async () => {
      mockLayer.isVisible = vi.fn(() => false);
      mockLayer.getFeatures = vi.fn(() => [
        { id: 1, geometry: { type: 'point', coordinates: [5, 5] } },
      ]);

      queryControl.addLayer(mockLayer);

      const result = await queryControl.boxQuery([
        [0, 0] as [number, number],
        [20, 20] as [number, number],
      ]);

      expect(result.features).toHaveLength(0);
      expect(mockLayer.getFeatures).not.toHaveBeenCalled();
    });
  });

  describe('ID查询', () => {
    it('应该能够根据ID查询要素', async () => {
      const mockFeature = { id: 1, geometry: { type: 'point', coordinates: [0, 0] } };
      mockLayer.getFeatureById = vi.fn(() => mockFeature);

      queryControl.addLayer(mockLayer);

      const result = await queryControl.queryById(1);
      expect(result.features).toHaveLength(1);
      expect(result.features[0]).toEqual(mockFeature);
    });

    it('应该支持从多个图层查询ID', async () => {
      const mockLayer2 = { ...mockLayer, id: 'test-layer-2' };

      const feature1 = { id: 1, geometry: { type: 'point', coordinates: [0, 0] } };
      const feature2 = { id: 2, geometry: { type: 'point', coordinates: [1, 1] } };

      mockLayer.getFeatureById = vi.fn((id) => (id === 1 ? feature1 : null));
      mockLayer2.getFeatureById = vi.fn((id) => (id === 2 ? feature2 : null));

      queryControl.addLayer(mockLayer);
      queryControl.addLayer(mockLayer2);

      const result = await queryControl.queryById(2);
      expect(result.features).toHaveLength(1);
      expect(result.features[0]).toEqual(feature2);
    });
  });

  describe('属性查询', () => {
    it('应该能够根据属性查询要素', async () => {
      const mockFeatures = [
        { id: 1, geometry: { type: 'point', coordinates: [0, 0] }, properties: { name: 'test' } },
        { id: 2, geometry: { type: 'point', coordinates: [1, 1] }, properties: { name: 'test' } },
        { id: 3, geometry: { type: 'point', coordinates: [2, 2] }, properties: { name: 'other' } },
      ];

      mockLayer.getFeatures = vi.fn(() => mockFeatures);

      queryControl.addLayer(mockLayer);

      const result = await queryControl.queryByProperty('name', 'test');
      expect(result.features).toHaveLength(2);
      expect(result.features.every((f) => f.properties.name === 'test')).toBe(true);
    });

    it('应该处理没有属性的要素', async () => {
      const mockFeatures = [
        { id: 1, geometry: { type: 'point', coordinates: [0, 0] } },
        { id: 2, geometry: { type: 'point', coordinates: [1, 1] }, properties: { name: 'test' } },
      ];

      mockLayer.getFeatures = vi.fn(() => mockFeatures);

      queryControl.addLayer(mockLayer);

      const result = await queryControl.queryByProperty('name', 'test');
      expect(result.features).toHaveLength(1);
    });
  });

  describe('查询类型管理', () => {
    it('应该能够设置激活的查询类型', () => {
      queryControl.setActiveQueryType(QueryType.CLICK);
      expect(queryControl.getActiveQueryType()).toBe(QueryType.CLICK);

      queryControl.setActiveQueryType(QueryType.BOX);
      expect(queryControl.getActiveQueryType()).toBe(QueryType.BOX);
    });

    it('应该能够清除激活的查询类型', () => {
      queryControl.setActiveQueryType(QueryType.CLICK);
      queryControl.setActiveQueryType(null);
      expect(queryControl.getActiveQueryType()).toBeNull();
    });
  });

  describe('选择框管理', () => {
    it('应该能够设置选择框', () => {
      const box = [
        [0, 0] as [number, number],
        [10, 10] as [number, number],
      ];
      queryControl.setSelectionBox(box);
      expect(queryControl.getSelectionBox()).toEqual(box);
    });

    it('应该能够清除选择框', () => {
      const box = [
        [0, 0] as [number, number],
        [10, 10] as [number, number],
      ];
      queryControl.setSelectionBox(box);
      queryControl.setSelectionBox(null);
      expect(queryControl.getSelectionBox()).toBeNull();
    });
  });

  describe('事件系统', () => {
    it('应该在查询结果时发送事件', async () => {
      const listener = vi.fn();
      queryControl.on(ControlEventType.QUERY_RESULT, listener);

      mockLayer.pick = vi.fn(() => []);
      queryControl.addLayer(mockLayer);

      await queryControl.pick([100, 100] as [number, number]);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener.mock.calls[0][0].type).toBe(ControlEventType.QUERY_RESULT);
    });

    it('应该能够取消订阅事件', async () => {
      const listener = vi.fn();
      const unsubscribe = queryControl.on(ControlEventType.QUERY_RESULT, listener);

      unsubscribe();

      mockLayer.pick = vi.fn(() => []);
      queryControl.addLayer(mockLayer);

      await queryControl.pick([100, 100] as [number, number]);

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('性能监控', () => {
    it('应该能够获取性能监控器', () => {
      const monitor = queryControl.getPerformanceMonitor();
      expect(monitor).toBeDefined();
    });

    it('应该自动记录查询性能', async () => {
      mockLayer.pick = vi.fn(() => []);
      queryControl.addLayer(mockLayer);

      await queryControl.pick([100, 100] as [number, number]);

      const monitor = queryControl.getPerformanceMonitor();
      expect(monitor.getSampleCount('query:pick')).toBeGreaterThan(0);
    });
  });

  describe('销毁', () => {
    it('应该能够正确销毁控件', () => {
      const monitor = queryControl.getPerformanceMonitor();
      queryControl.addLayer(mockLayer);

      queryControl.dispose();

      // 销毁后应该清空图层
      expect(queryControl['layers'].length).toBe(0);
      expect(queryControl.getActiveQueryType()).toBeNull();
      expect(queryControl.getSelectionBox()).toBeNull();
    });

    it('销毁后应该清除性能数据', () => {
      const monitor = queryControl.getPerformanceMonitor();
      monitor.record('test', 10);

      queryControl.dispose();

      const newMonitor = queryControl.getPerformanceMonitor();
      expect(newMonitor.getSampleCount('test')).toBe(0);
    });
  });
});
