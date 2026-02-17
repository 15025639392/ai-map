import { Command } from './Command.js';
import { GeometryType } from '../../vectortypes.js';
/**
 * 面绘制命令
 */
export class DrawPolygonCommand extends Command {
    featureCollection;
    newFeature = null;
    rings;
    style;
    constructor(featureCollection, rings, style) {
        super();
        this.featureCollection = featureCollection;
        // 深度复制所有环
        this.rings = rings.map((ring) => [...ring]);
        this.style = style;
    }
    /**
     * 执行命令 - 添加面要素
     */
    async doExecute() {
        const newFeature = {
            id: `polygon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            geometry: {
                type: GeometryType.POLYGON,
                coordinates: this.rings,
            },
            properties: this.style ? { ...this.style } : {},
        };
        this.newFeature = newFeature;
        this.featureCollection.push(newFeature);
    }
    /**
     * 撤销命令 - 移除面要素
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
        return `Draw polygon with ${this.rings.length} ring(s)`;
    }
    /**
     * 获取创建的要素
     */
    getFeature() {
        return this.newFeature;
    }
}
//# sourceMappingURL=DrawPolygonCommand.js.map