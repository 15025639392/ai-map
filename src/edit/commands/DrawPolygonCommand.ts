import { Command } from './Command.js';
import type { IFeature, Coordinate } from '../../vectortypes.js';
import { GeometryType } from '../../vectortypes.js';

/**
 * 面绘制命令
 */
export class DrawPolygonCommand extends Command {
  private featureCollection: IFeature[];
  private newFeature: IFeature | null = null;
  private rings: Coordinate[][];
  private style?: any;

  constructor(
    featureCollection: IFeature[],
    rings: Coordinate[][],
    style?: any
  ) {
    super();
    this.featureCollection = featureCollection;
    // 深度复制所有环
    this.rings = rings.map((ring) => [...ring]);
    this.style = style;
  }

  /**
   * 执行命令 - 添加面要素
   */
  protected async doExecute(): Promise<void> {
    const newFeature: IFeature = {
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
  protected async doUndo(): Promise<void> {
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
  getDescription(): string {
    return `Draw polygon with ${this.rings.length} ring(s)`;
  }

  /**
   * 获取创建的要素
   */
  getFeature(): IFeature | null {
    return this.newFeature;
  }
}
