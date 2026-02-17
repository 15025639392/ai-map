import type { IFeature, Coordinate } from '../vectortypes.js';
export type { IFeature, Coordinate } from '../vectortypes.js';
/**
 * 编辑工具类型
 */
export declare enum EditToolType {
    /** 无工具 */
    NONE = "none",
    /** 点绘制 */
    DRAW_POINT = "draw_point",
    /** 线绘制 */
    DRAW_LINE = "draw_line",
    /** 面绘制 */
    DRAW_POLYGON = "draw_polygon",
    /** 选择工具 */
    SELECT = "select",
    /** 移动工具 */
    MOVE = "move",
    /** 顶点编辑 */
    EDIT_VERTEX = "edit_vertex"
}
/**
 * 编辑状态
 */
export declare enum EditState {
    /** 空闲 */
    IDLE = "idle",
    /** 绘制中 */
    DRAWING = "drawing",
    /** 选择中 */
    SELECTING = "selecting",
    /** 移动中 */
    MOVING = "moving",
    /** 编辑顶点中 */
    EDITING_VERTEX = "editing_vertex"
}
/**
 * 编辑事件类型
 */
export declare enum EditEventType {
    /** 工具改变 */
    TOOL_CHANGE = "tool_change",
    /** 状态改变 */
    STATE_CHANGE = "state_change",
    /** 要素添加 */
    FEATURE_ADD = "feature_add",
    /** 要素修改 */
    FEATURE_MODIFY = "feature_modify",
    /** 要素删除 */
    FEATURE_DELETE = "feature_delete",
    /** 撤销 */
    UNDO = "undo",
    /** 重做 */
    REDO = "redo",
    /** 操作执行 */
    COMMAND_EXECUTE = "command_execute"
}
/**
 * 绘制选项
 */
export interface IDrawOptions {
    /** 是否启用吸附 */
    snapEnabled?: boolean;
    /** 吸附距离（像素） */
    snapDistance?: number;
    /** 默认样式 */
    style?: {
        fillColor?: string;
        strokeColor?: string;
        strokeWidth?: number;
    };
}
/**
 * 编辑操作
 */
export interface IEditOperation {
    /** 操作类型 */
    type: string;
    /** 操作时间戳 */
    timestamp: number;
    /** 操作数据 */
    data: any;
}
/**
 * 命令接口
 */
export interface ICommand {
    /** 执行命令 */
    execute(): Promise<void>;
    /** 撤销命令 */
    undo(): Promise<void>;
    /** 获取命令描述 */
    getDescription(): string;
    /** 是否可以合并 */
    canMerge?(command: ICommand): boolean;
    /** 合并命令 */
    merge?(command: ICommand): void;
}
/**
 * 顶点信息
 */
export interface IVertexInfo {
    /** 要素ID */
    featureId: string | number;
    /** 坐标索引 */
    coordinateIndex: number;
    /** 坐标位置 */
    position: Coordinate;
    /** 是否是起始点 */
    isStart?: boolean;
    /** 是否是结束点 */
    isEnd?: boolean;
}
/**
 * 选择信息
 */
export interface ISelectionInfo {
    /** 选中的要素 */
    features: IFeature[];
    /** 选中的顶点 */
    vertices: IVertexInfo[];
    /** 选择框范围 */
    bounds?: [Coordinate, Coordinate];
}
/**
 * 编辑结果
 */
export interface IEditResult {
    /** 是否成功 */
    success: boolean;
    /** 错误信息 */
    error?: string;
    /** 影响的要素 */
    affectedFeatures: IFeature[];
}
/**
 * 编辑配置
 */
export interface IEditConfig {
    /** 最大历史记录数 */
    maxHistory?: number;
    /** 是否自动保存 */
    autoSave?: boolean;
    /** 启用的工具 */
    enabledTools?: EditToolType[];
}
//# sourceMappingURL=types.d.ts.map