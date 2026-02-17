import { Command } from './Command.js';
import type { IFeature, Coordinate } from '../../vectortypes.js';
/**
 * 点绘制命令
 */
export declare class DrawPointCommand extends Command {
    private featureCollection;
    private newFeature;
    private position;
    private style?;
    constructor(featureCollection: IFeature[], position: Coordinate, style?: any);
    /**
     * 执行命令 - 添加点要素
     */
    protected doExecute(): Promise<void>;
    /**
     * 撤销命令 - 移除点要素
     */
    protected doUndo(): Promise<void>;
    /**
     * 获取命令描述
     */
    getDescription(): string;
    /**
     * 获取创建的要素
     */
    getFeature(): IFeature | null;
}
//# sourceMappingURL=DrawPointCommand.d.ts.map