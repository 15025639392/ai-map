import { Command } from './Command.js';
import type { IFeature, Coordinate } from '../../vectortypes.js';
/**
 * 要素移动命令
 */
export declare class MoveFeatureCommand extends Command {
    private features;
    private featureId;
    private oldPositions;
    private delta;
    constructor(features: IFeature[], featureId: string | number, delta: Coordinate);
    /**
     * 执行命令 - 移动要素
     */
    protected doExecute(): Promise<void>;
    /**
     * 撤销命令 - 恢复要素位置
     */
    protected doUndo(): Promise<void>;
    /**
     * 保存位置
     */
    private savePositions;
    /**
     * 保存所有坐标位置
     */
    private saveAllPositions;
    /**
     * 恢复位置
     */
    private restorePositions;
    /**
     * 恢复所有坐标位置
     */
    private restoreAllPositions;
    /**
     * 应用偏移量
     */
    private applyOffset;
    /**
     * 获取命令描述
     */
    getDescription(): string;
    /**
     * 检查是否可以合并（连续移动同一要素）
     */
    canMerge(command: Command): boolean;
    /**
     * 合并命令
     */
    merge(command: Command): void;
}
//# sourceMappingURL=MoveFeatureCommand.d.ts.map