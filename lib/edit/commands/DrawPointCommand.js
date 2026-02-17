import { Command } from './Command.js';
import { GeometryType } from '../../vectortypes.js';
/**
 * 点绘制命令
 */
export class DrawPointCommand extends Command {
    featureCollection;
    newFeature = null;
    position;
    style;
    constructor(featureCollection, position, style) {
        super();
        this.featureCollection = featureCollection;
        this.position = position;
        this.style = style;
    }
    /**
     * 执行命令 - 添加点要素
     */
    async doExecute() {
        const newFeature = {
            id: `point-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            geometry: {
                type: GeometryType.POINT,
                coordinates: this.position,
            },
            properties: this.style ? { ...this.style } : {},
        };
        this.newFeature = newFeature;
        this.featureCollection.push(newFeature);
    }
    /**
     * 撤销命令 - 移除点要素
     */
    async doUndo() {
        if (!this.newFeature) {
            throw new Error('Feature not created');
        }
        const index = this.featureCollection.indexOf(this.newFeature);
        if (index > -1) {
            this.featureCollection.splice(index, 1);
        }
    }
    /**
     * 获取命令描述
     */
    getDescription() {
        return `Draw point at [${this.position[0].toFixed(2)}, ${this.position[1].toFixed(2)}]`;
    }
    /**
     * 获取创建的要素
     */
    getFeature() {
        return this.newFeature;
    }
}
//# sourceMappingURL=DrawPointCommand.js.map