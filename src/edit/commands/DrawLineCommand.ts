import { Command } from './Command.js';
import type { IFeature, Coordinate } from '../../vectortypes.js';
import { GeometryType } from '../../vectortypes.js';

/**
 * 线绘制命令
 */
export class DrawLineCommand extends Command {
  private featureCollection: IFeature[];
  private newFeature: IFeature | null = null;
  private coordinates: Coordinate[];
  private style?: any;

  constructor(
    featureCollection: IFeature[],
    coordinates: Coordinate[],
    style?: any
  ) {
    super();
    this.featureCollection = featureCollection;
    this.coordinates = [...coordinates]; // 复制数组
    this.style = style;
  }

  /**
   * 执行命令 - 添加线要素
   */
  protected async doExecute(): Promise<void> {
    const newFeature: IFeature = {
      id: `line-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      geometry: {
        type: GeometryType.LINE,
        coordinates: this.coordinates,
      },
      properties: this.style ? { ...this.style } : {},
    };

    this.newFeature = newFeature;
    this.featureCollection.push(newFeature);
  }

  /**
   * 撤销命令 - 移除线要素
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
    const coordStr = this.coordinates
      .map((c) => `[${c[0].toFixed(1)}, ${c[1].toFixed(1)}]`)
      .join(' -> ');
    return `Draw line with ${this.coordinates.length} points: ${coordStr}`;
  }

  /**
   * 获取创建的要素
   */
  getFeature(): IFeature | null {
    return this.newFeature;
  }
}
