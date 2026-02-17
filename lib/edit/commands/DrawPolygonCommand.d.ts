import { Command } from './Command.js';
import type { IFeature, Coordinate } from '../../vectortypes.js';
/**
 * 面绘制命令
 */
export declare class DrawPolygonCommand extends Command {
    private featureCollection;
    private newFeature;
    private rings;
    private style?;
    constructor(featureCollection: IFeature[], rings: Coordinate[][], style?: any);
    /**
     * 执行命令 - 添加面要素
     */
    protected doExecute(): Promise<void>;
    /**
     * 撤销命令 - 移除面要素
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
//# sourceMappingURL=DrawPolygonCommand.d.ts.map