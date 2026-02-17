import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EditController } from '../../src/edit/EditController.js';
import { VectorLayer } from '../../src/vectors/VectorLayer.js';
import {
  EditToolType,
  EditState,
} from '../../src/edit/types.js';
import type { Coordinate, IFeature } from '../../src/vectortypes.js';

// 创建模拟的VectorLayer
function createMockLayer() {
  const mockLayer = {
    id: `layer-${Date.now()}`,
    getFeatures: vi.fn(() => []),
    addFeature: vi.fn(),
    pick: vi.fn(() => []),
    isVisible: vi.fn(() => true),
    show: vi.fn(),
    hide: vi.fn(),
  } as any;

  return mockLayer;
}

describe('EditController', () => {
  let controller: EditController;
  let mockLayer: any;

  beforeEach(() => {
    controller = new EditController({ maxHistory: 100 });
    mockLayer = createMockLayer();
    controller.addLayer(mockLayer);
  });

  afterEach(() => {
    controller.dispose();
  });

  describe('图层管理', () => {
    it('应该能够添加图层', () => {
      const layer = createMockLayer();
      controller.addLayer(layer);

      // 图层应该被添加
      expect(controller['layers']).toContain(layer);
    });

    it('不应该重复添加图层', () => {
      controller.addLayer(mockLayer);
      controller.addLayer(mockLayer);

      // 不应该重复添加
      expect(controller['layers'].filter((l) => l === mockLayer).length).toBe(1);
    });

    it('应该能够移除图层', () => {
      controller.removeLayer(mockLayer);

      // 图层应该被移除
      expect(controller['layers']).not.toContain(mockLayer);
    });
  });

  describe('工具激活', () => {
    it('应该能够激活点绘制工具', () => {
      controller.activateDrawPointTool();

      expect(controller.getCurrentTool()).toBe(EditToolType.DRAW_POINT);
      expect(controller.getCurrentState()).toBe(EditState.DRAWING);
    });

    it('应该能够激活线绘制工具', () => {
      controller.activateDrawLineTool();

      expect(controller.getCurrentTool()).toBe(EditToolType.DRAW_LINE);
      expect(controller.getCurrentState()).toBe(EditState.DRAWING);
    });

    it('应该能够激活面绘制工具', () => {
      controller.activateDrawPolygonTool();

      expect(controller.getCurrentTool()).toBe(EditToolType.DRAW_POLYGON);
      expect(controller.getCurrentState()).toBe(EditState.DRAWING);
    });

    it('应该能够激活选择工具', () => {
      controller.activateSelectTool();

      expect(controller.getCurrentTool()).toBe(EditToolType.SELECT);
      expect(controller.getCurrentState()).toBe(EditState.SELECTING);
    });

    it('应该能够激活移动工具', () => {
      controller.activateMoveTool();

      expect(controller.getCurrentTool()).toBe(EditToolType.MOVE);
      expect(controller.getCurrentState()).toBe(EditState.IDLE);
    });

    it('应该能够激活顶点编辑工具', () => {
      controller.activateEditVertexTool();

      expect(controller.getCurrentTool()).toBe(EditToolType.EDIT_VERTEX);
      expect(controller.getCurrentState()).toBe(EditState.EDITING_VERTEX);
    });

    it('应该能够取消工具', () => {
      controller.activateDrawPointTool();
      controller.deactivateTool();

      expect(controller.getCurrentTool()).toBe(EditToolType.NONE);
      expect(controller.getCurrentState()).toBe(EditState.IDLE);
    });
  });

  describe('绘制操作', () => {
    it('应该能够绘制点', () => {
      mockLayer.getFeatures = vi.fn(() => []);

      controller.activateDrawPointTool();
      controller.addDrawPoint([100, 200] as [number, number]);

      // 状态应该变为IDLE
      expect(controller.getCurrentState()).toBe(EditState.IDLE);

      // 应该可以撤销
      expect(controller.canUndo()).toBe(true);
    });

    it('应该能够绘制线', () => {
      mockLayer.getFeatures = vi.fn(() => []);

      controller.activateDrawLineTool();
      controller.addDrawPoint([100, 200] as [number, number]);
      controller.addDrawPoint([200, 300] as [number, number]);
      controller.addDrawPoint([300, 400] as [number, number]);

      const result = controller.finishDraw();

      expect(result.success).toBe(true);
      expect(result.affectedFeatures).toHaveLength(1);
      expect(controller.canUndo()).toBe(true);
    });

    it('应该能够绘制面', () => {
      mockLayer.getFeatures = vi.fn(() => []);

      controller.activateDrawPolygonTool();
      controller.addDrawPoint([100, 200] as [number, number]);
      controller.addDrawPoint([200, 300] as [number, number]);
      controller.addDrawPoint([300, 400] as [number, number]);

      const result = controller.finishDraw();

      expect(result.success).toBe(true);
      expect(result.affectedFeatures).toHaveLength(1);
      expect(controller.canUndo()).toBe(true);
    });

    it('应该能够取消绘制', () => {
      controller.activateDrawLineTool();
      controller.addDrawPoint([100, 200] as [number, number]);
      controller.addDrawPoint([200, 300] as [number, number]);

      controller.cancelDraw();

      expect(controller.getCurrentState()).toBe(EditState.IDLE);
      expect(controller.getDrawingPoints()).toHaveLength(0);
    });

    it('非绘制状态下添加点应该被忽略', () => {
      controller.addDrawPoint([100, 200] as [number, number]);

      expect(controller.getDrawingPoints()).toHaveLength(0);
    });
  });

  describe('修改操作', () => {
    it('应该能够移动顶点', async () => {
      const features: IFeature[] = [
        {
          id: 'test-feature',
          geometry: {
            type: 'point' as any,
            coordinates: [100, 200] as [number, number],
          },
          properties: {},
        },
      ];

      mockLayer.getFeatures = vi.fn(() => features);

      const result = await controller.moveVertex(
        {
          featureId: 'test-feature',
          coordinateIndex: 0,
          position: [100, 200] as [number, number],
        },
        [150, 250] as [number, number]
      );

      expect(result.success).toBe(true);
      expect(controller.canUndo()).toBe(true);
    });

    it('应该能够移动要素', async () => {
      const features: IFeature[] = [
        {
          id: 'test-feature',
          geometry: {
            type: 'point' as any,
            coordinates: [100, 200] as [number, number],
          },
          properties: {},
        },
      ];

      mockLayer.getFeatures = vi.fn(() => features);

      const result = await controller.moveFeature('test-feature', [10, 20] as [number, number]);

      expect(result.success).toBe(true);
      expect(controller.canUndo()).toBe(true);
    });
  });

  describe('撤销重做', () => {
    beforeEach(() => {
      mockLayer.getFeatures = vi.fn(() => []);
    });

    it('应该能够撤销操作', async () => {
      controller.activateDrawPointTool();
      controller.addDrawPoint([100, 200] as [number, number]);

      expect(controller.canUndo()).toBe(true);

      await controller.undo();

      expect(controller.canUndo()).toBe(false);
      expect(controller.canRedo()).toBe(true);
    });

    it('应该能够重做操作', async () => {
      controller.activateDrawPointTool();
      controller.addDrawPoint([100, 200] as [number, number]);

      await controller.undo();

      expect(controller.canRedo()).toBe(true);

      await controller.redo();

      expect(controller.canUndo()).toBe(true);
      expect(controller.canRedo()).toBe(false);
    });

    it('应该能够执行多个撤销和重做', async () => {
      // 执行3个点绘制
      controller.activateDrawPointTool();
      controller.addDrawPoint([100, 200] as [number, number]);
      controller.activateDrawPointTool();
      controller.addDrawPoint([200, 300] as [number, number]);
      controller.activateDrawPointTool();
      controller.addDrawPoint([300, 400] as [number, number]);

      expect(controller.getUndoCount()).toBe(3);

      // 撤销2个
      await controller.undo();
      await controller.undo();

      expect(controller.getUndoCount()).toBe(1);
      expect(controller.getRedoCount()).toBe(2);

      // 重做1个
      await controller.redo();

      expect(controller.getUndoCount()).toBe(2);
      expect(controller.getRedoCount()).toBe(1);
    });

    it('新的操作应该清空重做栈', async () => {
      // 执行操作
      controller.activateDrawPointTool();
      controller.addDrawPoint([100, 200] as [number, number]);

      // 撤销
      await controller.undo();

      expect(controller.getRedoCount()).toBe(1);

      // 执行新操作
      controller.activateDrawPointTool();
      controller.addDrawPoint([200, 300] as [number, number]);

      // 重做栈应该被清空
      expect(controller.getRedoCount()).toBe(0);
    });

    it('应该能够清空历史', async () => {
      controller.activateDrawPointTool();
      controller.addDrawPoint([100, 200] as [number, number]);
      controller.activateDrawPointTool();
      controller.addDrawPoint([200, 300] as [number, number]);

      expect(controller.getUndoCount()).toBe(2);

      controller.clearHistory();

      expect(controller.canUndo()).toBe(false);
      expect(controller.canRedo()).toBe(false);
    });
  });

  describe('批量回放验证', () => {
    beforeEach(() => {
      mockLayer.getFeatures = vi.fn(() => []);
    });

    it('应该能够执行批量回放验证', async () => {
      // 执行100个操作
      for (let i = 0; i < 100; i++) {
        controller.activateDrawPointTool();
        controller.addDrawPoint([i * 10, i * 10] as [number, number]);
      }

      const result = await controller.batchReplayValidation(100);

      expect(result.success).toBe(true);
      expect(result.iterations).toBe(100);
      expect(result.failures).toBe(0);
    });

    it('1000次回放应该100%成功', async () => {
      // 执行100个操作
      for (let i = 0; i < 100; i++) {
        controller.activateDrawPointTool();
        controller.addDrawPoint([i * 10, i * 10] as [number, number]);
      }

      const result = await controller.batchReplayValidation(1000);

      expect(result.success).toBe(true);
      expect(result.iterations).toBe(1000);
      expect(result.failures).toBe(0);
    });
  });

  describe('状态查询', () => {
    it('应该能够获取当前工具', () => {
      controller.activateDrawPointTool();

      expect(controller.getCurrentTool()).toBe(EditToolType.DRAW_POINT);
    });

    it('应该能够获取当前状态', () => {
      controller.activateDrawLineTool();

      expect(controller.getCurrentState()).toBe(EditState.DRAWING);
    });

    it('应该能够获取绘制点', () => {
      controller.activateDrawLineTool();
      controller.addDrawPoint([100, 200] as [number, number]);
      controller.addDrawPoint([200, 300] as [number, number]);

      const points = controller.getDrawingPoints();

      expect(points).toHaveLength(2);
      expect(points).toEqual([
        [100, 200] as [number, number],
        [200, 300] as [number, number],
      ]);
    });

    it('应该能够获取选择信息', () => {
      controller.activateSelectTool();

      const selection = controller.getSelection();

      expect(selection.features).toHaveLength(0);
      expect(selection.vertices).toHaveLength(0);
    });
  });

  describe('错误处理', () => {
    it('应该处理移动不存在的要素', async () => {
      try {
        await controller.moveFeature('non-existent', [10, 20] as [number, number]);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect((error as Error).message).toContain('not found');
      }
    });

    it('应该处理移动不存在的顶点', async () => {
      try {
        await controller.moveVertex(
          {
            featureId: 'non-existent',
            coordinateIndex: 0,
            position: [0, 0] as [number, number],
          },
          [10, 20] as [number, number]
        );
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect((error as Error).message).toContain('not found');
      }
    });

    it('应该处理在不正确状态下的操作', async () => {
      const result = await controller.finishDraw();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('销毁', () => {
    it('应该能够正确销毁控制器', () => {
      controller.activateDrawPointTool();
      controller.addDrawPoint([100, 200] as [number, number]);

      controller.dispose();

      expect(controller['layers']).toHaveLength(0);
      expect(controller.getCurrentTool()).toBe(EditToolType.NONE);
      expect(controller.getCurrentState()).toBe(EditState.IDLE);
      expect(controller.canUndo()).toBe(false);
      expect(controller.canRedo()).toBe(false);
    });
  });
});
