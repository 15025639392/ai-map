import { Command } from './Command.js';
import type { IFeature, Coordinate } from '../../vectortypes.js';
import type { IVertexInfo } from '../types.js';

/**
 * 顶点移动命令
 */
export class MoveVertexCommand extends Command {
  private features: IFeature[];
  private vertexInfo: IVertexInfo;
  private oldPosition: Coordinate;
  private newPosition: Coordinate;

  constructor(
    features: IFeature[],
    vertexInfo: IVertexInfo,
    newPosition: Coordinate
  ) {
    super();
    this.features = features;
    this.vertexInfo = { ...vertexInfo }; // 复制顶点信息
    this.oldPosition = [...vertexInfo.position];
    this.newPosition = [...newPosition]; // 复制坐标
  }

  /**
   * 执行命令 - 移动顶点
   */
  protected async doExecute(): Promise<void> {
    const feature = this.features.find((f) => f.id === this.vertexInfo.featureId);
    if (!feature) {
      throw new Error(`Feature ${this.vertexInfo.featureId} not found`);
    }

    const coords = feature.geometry.coordinates as any;
    this.updateCoordinate(coords, this.vertexInfo.coordinateIndex, this.newPosition);
  }

  /**
   * 撤销命令 - 恢复顶点位置
   */
  protected async doUndo(): Promise<void> {
    const feature = this.features.find((f) => f.id === this.vertexInfo.featureId);
    if (!feature) {
      throw new Error(`Feature ${this.vertexInfo.featureId} not found`);
    }

    const coords = feature.geometry.coordinates as any;
    this.updateCoordinate(coords, this.vertexInfo.coordinateIndex, this.oldPosition);
  }

  /**
   * 更新坐标（递归处理嵌套数组）
   */
  private updateCoordinate(
    coords: any,
    index: number,
    newPosition: Coordinate
  ): void {
    // 简化处理：直接找到对应位置的坐标并更新
    // 实际实现中需要根据要素类型正确处理坐标数组结构
    const path = this.getCoordinatePath(coords, index);
    if (path) {
      let target: any = coords;
      for (let i = 0; i < path.length - 1; i++) {
        target = target[path[i]];
      }
      target[path[path.length - 1]] = newPosition;
    }
  }

  /**
   * 获取坐标路径（简化版本）
   */
  private getCoordinatePath(coords: any, index: number): number[] | null {
    // 简化实现：假设坐标是扁平数组
    if (Array.isArray(coords[0])) {
      // 嵌套数组
      const count = this.countCoordinates(coords);
      if (index < count) {
        const foundIndex = this.findIndex(coords, index);
        if (foundIndex !== null) {
          return [foundIndex];
        }
      }
    }
    return null;
  }

  /**
   * 统计坐标数量
   */
  private countCoordinates(coords: any): number {
    if (Array.isArray(coords[0])) {
      return coords.reduce((sum: number, c: any) => sum + this.countCoordinates(c), 0);
    }
    return 1;
  }

  /**
   * 查找坐标索引
   */
  private findIndex(coords: any, targetIndex: number, currentIndex = 0): number | null {
    if (Array.isArray(coords[0])) {
      for (let i = 0; i < coords.length; i++) {
        const result = this.findIndex(coords[i], targetIndex, currentIndex);
        if (result !== null) {
          return i;
        }
        currentIndex += this.countCoordinates(coords[i]);
      }
      return null;
    }
    return currentIndex === targetIndex ? 0 : null;
  }

  /**
   * 获取命令描述
   */
  getDescription(): string {
    return `Move vertex from [${this.oldPosition[0].toFixed(2)}, ${this.oldPosition[1].toFixed(2)}] to [${this.newPosition[0].toFixed(2)}, ${this.newPosition[1].toFixed(2)}]`;
  }

  /**
   * 检查是否可以合并（连续移动同一顶点）
   */
  canMerge(command: Command): boolean {
    if (command instanceof MoveVertexCommand) {
      const other = command as MoveVertexCommand;
      return (
        other.vertexInfo.featureId === this.vertexInfo.featureId &&
        other.vertexInfo.coordinateIndex === this.vertexInfo.coordinateIndex
      );
    }
    return false;
  }

  /**
   * 合并命令
   */
  merge(command: Command): void {
    if (command instanceof MoveVertexCommand) {
      const other = command as MoveVertexCommand;
      this.newPosition = other.newPosition;
    }
  }
}
