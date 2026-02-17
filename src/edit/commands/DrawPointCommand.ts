import { Command } from './Command.js';
import type { IFeature, Coordinate } from '../../vectortypes.js';
import { GeometryType } from '../../vectortypes.js';

/**
 * 点绘制命令
 */
export class DrawPointCommand extends Command {
  private featureCollection: IFeature[];
  private newFeature: IFeature | null = null;
  private position: Coordinate;
  private style?: any;

  constructor(
    featureCollection: IFeature[],
    position: Coordinate,
    style?: any
  ) {
    super();
    this.featureCollection = featureCollection;
    this.position = position;
    this.style = style;
  }

  /**
   * 执行命令 - 添加点要素
   */
  protected async doExecute(): Promise<void> {
    const newFeature: IFeature = {
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
    return `Draw point at [${this.position[0].toFixed(2)}, ${this.position[1].toFixed(2)}]`;
  }

  /**
   * 获取创建的要素
   */
  getFeature(): IFeature | null {
    return this.newFeature;
  }
}
