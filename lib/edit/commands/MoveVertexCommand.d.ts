import { Command } from './Command.js';
import type { IFeature, Coordinate } from '../../vectortypes.js';
import type { IVertexInfo } from '../types.js';
/**
 * 顶点移动命令
 */
export declare class MoveVertexCommand extends Command {
    private features;
    private vertexInfo;
    private oldPosition;
    private newPosition;
    constructor(features: IFeature[], vertexInfo: IVertexInfo, newPosition: Coordinate);
    /**
     * 执行命令 - 移动顶点
     */
    protected doExecute(): Promise<void>;
    /**
     * 撤销命令 - 恢复顶点位置
     */
    protected doUndo(): Promise<void>;
    /**
     * 更新坐标（递归处理嵌套数组）
     */
    private updateCoordinate;
    /**
     * 获取坐标路径（简化版本）
     */
    private getCoordinatePath;
    /**
     * 统计坐标数量
     */
    private countCoordinates;
    /**
     * 查找坐标索引
     */
    private findIndex;
    /**
     * 获取命令描述
     */
    getDescription(): string;
    /**
     * 检查是否可以合并（连续移动同一顶点）
     */
    canMerge(command: Command): boolean;
    /**
     * 合并命令
     */
    merge(command: Command): void;
}
//# sourceMappingURL=MoveVertexCommand.d.ts.map