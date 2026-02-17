import { UndoRedoManager } from './UndoRedoManager.js';
import { DrawPointCommand } from './commands/DrawPointCommand.js';
import { DrawLineCommand } from './commands/DrawLineCommand.js';
import { DrawPolygonCommand } from './commands/DrawPolygonCommand.js';
import { MoveVertexCommand } from './commands/MoveVertexCommand.js';
import { MoveFeatureCommand } from './commands/MoveFeatureCommand.js';
import type { VectorLayer } from '../vectors/VectorLayer.js';
import {
  EditToolType,
  EditState,
} from './types.js';
import type {
  IDrawOptions,
  ISelectionInfo,
  IEditResult,
  IVertexInfo,
  IEditConfig,
} from './types.js';
import type { IFeature, Coordinate } from '../vectortypes.js';

/**
 * 编辑控制器
 */
export class EditController {
  private layers: VectorLayer[] = [];
  private undoRedoManager: UndoRedoManager;
  private currentTool: EditToolType = EditToolType.NONE;
  private currentState: EditState = EditState.IDLE;
  private drawingPoints: Coordinate[] = [];
  private selection: ISelectionInfo = { features: [], vertices: [] };
  private config: IEditConfig;

  constructor(config: IEditConfig = {}) {
    this.config = {
      maxHistory: config.maxHistory ?? 1000,
      autoSave: config.autoSave ?? true,
      enabledTools: config.enabledTools ?? [],
    };
    this.undoRedoManager = new UndoRedoManager(this.config);
  }

  /**
   * 添加图层
   */
  addLayer(layer: VectorLayer): void {
    if (!this.layers.includes(layer)) {
      this.layers.push(layer);
    }
  }

  /**
   * 移除图层
   */
  removeLayer(layer: VectorLayer): void {
    const index = this.layers.indexOf(layer);
    if (index > -1) {
      this.layers.splice(index, 1);
    }
  }

  /**
   * 获取所有要素
   */
  private getAllFeatures(): IFeature[] {
    const features: IFeature[] = [];
    for (const layer of this.layers) {
      features.push(...layer.getFeatures());
    }
    return features;
  }

  /**
   * 激活绘制点工具
   */
  activateDrawPointTool(options?: IDrawOptions): void {
    this.currentTool = EditToolType.DRAW_POINT;
    this.currentState = EditState.DRAWING;
    this.drawingPoints = [];
  }

  /**
   * 激活绘制线工具
   */
  activateDrawLineTool(options?: IDrawOptions): void {
    this.currentTool = EditToolType.DRAW_LINE;
    this.currentState = EditState.DRAWING;
    this.drawingPoints = [];
  }

  /**
   * 激活绘制面工具
   */
  activateDrawPolygonTool(options?: IDrawOptions): void {
    this.currentTool = EditToolType.DRAW_POLYGON;
    this.currentState = EditState.DRAWING;
    this.drawingPoints = [];
  }

  /**
   * 激活选择工具
   */
  activateSelectTool(): void {
    this.currentTool = EditToolType.SELECT;
    this.currentState = EditState.SELECTING;
    this.selection = { features: [], vertices: [] };
  }

  /**
   * 激活移动工具
   */
  activateMoveTool(): void {
    this.currentTool = EditToolType.MOVE;
    this.currentState = EditState.IDLE;
  }

  /**
   * 激活顶点编辑工具
   */
  activateEditVertexTool(): void {
    this.currentTool = EditToolType.EDIT_VERTEX;
    this.currentState = EditState.EDITING_VERTEX;
  }

  /**
   * 取消工具
   */
  deactivateTool(): void {
    this.currentTool = EditToolType.NONE;
    this.currentState = EditState.IDLE;
    this.drawingPoints = [];
    this.selection = { features: [], vertices: [] };
  }

  /**
   * 添加绘制点
   */
  async addDrawPoint(position: Coordinate): Promise<void> {
    if (this.currentState !== EditState.DRAWING) {
      return;
    }

    switch (this.currentTool) {
      case EditToolType.DRAW_POINT:
          await this.executeDrawPoint(position);
        this.currentState = EditState.IDLE;
        break;

      case EditToolType.DRAW_LINE:
      case EditToolType.DRAW_POLYGON:
        this.drawingPoints.push(position);
        break;
    }
  }

  /**

  /**
   * 完成绘制
   */
  async finishDraw(): Promise<IEditResult> {
    if (this.currentState !== EditState.DRAWING) {
      return {
        success: false,
        error: 'Not in drawing state',
        affectedFeatures: [],
      };
    }

    const result: IEditResult = {
      success: true,
      affectedFeatures: [],
    };

    switch (this.currentTool) {
      case EditToolType.DRAW_LINE:
        if (this.drawingPoints.length >= 2) {
          const feature = await this.executeDrawLine(this.drawingPoints);
          if (feature) {
            result.affectedFeatures.push(feature);
          }
        }
        break;

      case EditToolType.DRAW_POLYGON:
        if (this.drawingPoints.length >= 3) {
          const feature = await this.executeDrawPolygon([this.drawingPoints]);
          if (feature) {
            result.affectedFeatures.push(feature);
          }
        }
        break;
    }

    this.currentState = EditState.IDLE;
    this.drawingPoints = [];
    return result;
  }

  /**
   * 取消绘制
   */
  cancelDraw(): void {
    this.currentState = EditState.IDLE;
    this.drawingPoints = [];
  }

  /**
   * 执行点绘制
   */
  private async executeDrawPoint(position: Coordinate): Promise<IFeature | null> {
    const features = this.getAllFeatures();
    const command = new DrawPointCommand(features, position);

    await this.undoRedoManager.executeCommand(command);

    return command.getFeature();
  }

  /**
   * 执行线绘制
   */
  private async executeDrawLine(coordinates: Coordinate[]): Promise<IFeature | null> {
    const features = this.getAllFeatures();
    const command = new DrawLineCommand(features, coordinates);

    await this.undoRedoManager.executeCommand(command);

    return command.getFeature();
  }

  /**
   * 执行面绘制
   */
  private async executeDrawPolygon(rings: Coordinate[][]): Promise<IFeature | null> {
    const features = this.getAllFeatures();
    const command = new DrawPolygonCommand(features, rings);

    await this.undoRedoManager.executeCommand(command);

    return command.getFeature();
  }

  /**
   * 移动顶点
   */
  moveVertex(vertexInfo: IVertexInfo, newPosition: Coordinate): Promise<IEditResult> {
    const features = this.getAllFeatures();
    const command = new MoveVertexCommand(features, vertexInfo, newPosition);

    try {
      return this.undoRedoManager.executeCommand(command).then(() => ({
        success: true,
        affectedFeatures: [features.find((f) => f.id === vertexInfo.featureId)!],
      }));
    } catch (error: any) {
      return Promise.resolve({
        success: false,
        error: error.message,
        affectedFeatures: [],
      });
    }
  }

  /**
   * 移动要素
   */
  moveFeature(featureId: string | number, delta: Coordinate): Promise<IEditResult> {
    const features = this.getAllFeatures();
    const command = new MoveFeatureCommand(features, featureId, delta);

    try {
      return this.undoRedoManager.executeCommand(command).then(() => ({
        success: true,
        affectedFeatures: [features.find((f) => f.id === featureId)!],
      }));
    } catch (error: any) {
      return Promise.resolve({
        success: false,
        error: error.message,
        affectedFeatures: [],
      });
    }
  }

  /**
   * 撤销
   */
  async undo(): Promise<IEditResult> {
    try {
      await this.undoRedoManager.undo();
      return {
        success: true,
        affectedFeatures: [],
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        affectedFeatures: [],
      };
    }
  }

  /**
   * 重做
   */
  async redo(): Promise<IEditResult> {
    try {
      await this.undoRedoManager.redo();
      return {
        success: true,
        affectedFeatures: [],
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        affectedFeatures: [],
      };
    }
  }

  /**
   * 是否可以撤销
   */
  canUndo(): boolean {
    return this.undoRedoManager.canUndo();
  }

  /**
   * 是否可以重做
   */
  canRedo(): boolean {
    return this.undoRedoManager.canRedo();
  }

  /**
   * 获取撤销数量
   */
  getUndoCount(): number {
    return this.undoRedoManager.getUndoCount();
  }

  /**
   * 获取重做数量
   */
  getRedoCount(): number {
    return this.undoRedoManager.getRedoCount();
  }

  /**
   * 清空历史
   */
  clearHistory(): void {
    this.undoRedoManager.clear();
  }

  /**
   * 获取当前工具
   */
  getCurrentTool(): EditToolType {
    return this.currentTool;
  }

  /**
   * 获取当前状态
   */
  getCurrentState(): EditState {
    return this.currentState;
  }

  /**
   * 获取绘制点
   */
  getDrawingPoints(): Coordinate[] {
    return [...this.drawingPoints];
  }

  /**
   * 获取选择
   */
  getSelection(): ISelectionInfo {
    return {
      features: [...this.selection.features],
      vertices: [...this.selection.vertices],
      bounds: this.selection.bounds,
    };
  }

  /**
   * 批量回放验证
   */
  async batchReplayValidation(count: number): Promise<{
    success: boolean;
    iterations: number;
    failures: number;
  }> {
    return await this.undoRedoManager.batchReplayValidation(count);
  }

  /**
   * 销毁控制器
   */
  dispose(): void {
    this.deactivateTool();
    this.layers = [];
    this.undoRedoManager.clear();
  }
}
