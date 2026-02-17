import type { VectorLayer } from '../vectors/VectorLayer.js';
import { EditToolType, EditState } from './types.js';
import type { IDrawOptions, ISelectionInfo, IEditResult, IVertexInfo, IEditConfig } from './types.js';
import type { Coordinate } from '../vectortypes.js';
/**
 * 编辑控制器
 */
export declare class EditController {
    private layers;
    private undoRedoManager;
    private currentTool;
    private currentState;
    private drawingPoints;
    private selection;
    private config;
    constructor(config?: IEditConfig);
    /**
     * 添加图层
     */
    addLayer(layer: VectorLayer): void;
    /**
     * 移除图层
     */
    removeLayer(layer: VectorLayer): void;
    /**
     * 获取所有要素
     */
    private getAllFeatures;
    /**
     * 激活绘制点工具
     */
    activateDrawPointTool(options?: IDrawOptions): void;
    /**
     * 激活绘制线工具
     */
    activateDrawLineTool(options?: IDrawOptions): void;
    /**
     * 激活绘制面工具
     */
    activateDrawPolygonTool(options?: IDrawOptions): void;
    /**
     * 激活选择工具
     */
    activateSelectTool(): void;
    /**
     * 激活移动工具
     */
    activateMoveTool(): void;
    /**
     * 激活顶点编辑工具
     */
    activateEditVertexTool(): void;
    /**
     * 取消工具
     */
    deactivateTool(): void;
    /**
     * 添加绘制点
     */
    addDrawPoint(position: Coordinate): Promise<void>;
    /**
  
    /**
     * 完成绘制
     */
    finishDraw(): Promise<IEditResult>;
    /**
     * 取消绘制
     */
    cancelDraw(): void;
    /**
     * 执行点绘制
     */
    private executeDrawPoint;
    /**
     * 执行线绘制
     */
    private executeDrawLine;
    /**
     * 执行面绘制
     */
    private executeDrawPolygon;
    /**
     * 移动顶点
     */
    moveVertex(vertexInfo: IVertexInfo, newPosition: Coordinate): Promise<IEditResult>;
    /**
     * 移动要素
     */
    moveFeature(featureId: string | number, delta: Coordinate): Promise<IEditResult>;
    /**
     * 撤销
     */
    undo(): Promise<IEditResult>;
    /**
     * 重做
     */
    redo(): Promise<IEditResult>;
    /**
     * 是否可以撤销
     */
    canUndo(): boolean;
    /**
     * 是否可以重做
     */
    canRedo(): boolean;
    /**
     * 获取撤销数量
     */
    getUndoCount(): number;
    /**
     * 获取重做数量
     */
    getRedoCount(): number;
    /**
     * 清空历史
     */
    clearHistory(): void;
    /**
     * 获取当前工具
     */
    getCurrentTool(): EditToolType;
    /**
     * 获取当前状态
     */
    getCurrentState(): EditState;
    /**
     * 获取绘制点
     */
    getDrawingPoints(): Coordinate[];
    /**
     * 获取选择
     */
    getSelection(): ISelectionInfo;
    /**
     * 批量回放验证
     */
    batchReplayValidation(count: number): Promise<{
        success: boolean;
        iterations: number;
        failures: number;
    }>;
    /**
     * 销毁控制器
     */
    dispose(): void;
}
//# sourceMappingURL=EditController.d.ts.map