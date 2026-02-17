import { Command } from './Command.js';
import type { IFeature, Coordinate } from '../../vectortypes.js';
/**
 * 线绘制命令
 */
export declare class DrawLineCommand extends Command {
    private featureCollection;
    private newFeature;
    private coordinates;
    private style?;
    constructor(featureCollection: IFeature[], coordinates: Coordinate[], style?: any);
    /**
     * 执行命令 - 添加线要素
     */
    protected doExecute(): Promise<void>;
    /**
     * 撤销命令 - 移除线要素
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
//# sourceMappingURL=DrawLineCommand.d.ts.map