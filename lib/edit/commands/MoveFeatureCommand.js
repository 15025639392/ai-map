import { Command } from './Command.js';
/**
 * 要素移动命令
 */
export class MoveFeatureCommand extends Command {
    features;
    featureId;
    oldPositions;
    delta;
    constructor(features, featureId, delta) {
        super();
        this.features = features;
        this.featureId = featureId;
        this.delta = [...delta];
        this.oldPositions = new Map();
    }
    /**
     * 执行命令 - 移动要素
     */
    async doExecute() {
        const feature = this.features.find((f) => f.id === this.featureId);
        if (!feature) {
            throw new Error(`Feature ${this.featureId} not found`);
        }
        // 保存原始位置
        this.savePositions(feature);
        // 应用偏移量
        this.applyOffset(feature.geometry.coordinates, this.delta);
    }
    /**
     * 撤销命令 - 恢复要素位置
     */
    async doUndo() {
        const feature = this.features.find((f) => f.id === this.featureId);
        if (!feature) {
            throw new Error(`Feature ${this.featureId} not found`);
        }
        // 恢复原始位置
        this.restorePositions(feature);
    }
    /**
     * 保存位置
     */
    savePositions(feature) {
        const coords = feature.geometry.coordinates;
        this.saveAllPositions(coords);
    }
    /**
     * 保存所有坐标位置
     */
    saveAllPositions(coords) {
        if (Array.isArray(coords[0])) {
            // 嵌套数组
            coords.forEach((c) => this.saveAllPositions(c));
        }
        else {
            // 单个坐标
            this.oldPositions.set(this.featureId, [...coords]);
        }
    }
    /**
     * 恢复位置
     */
    restorePositions(feature) {
        const coords = feature.geometry.coordinates;
        this.restoreAllPositions(coords);
    }
    /**
     * 恢复所有坐标位置
     */
    restoreAllPositions(coords) {
        if (Array.isArray(coords[0])) {
            // 嵌套数组
            coords.forEach((c) => this.restoreAllPositions(c));
        }
        else {
            // 单个坐标
            const oldPos = this.oldPositions.get(this.featureId);
            if (oldPos) {
                coords[0] = oldPos[0];
                coords[1] = oldPos[1];
            }
        }
    }
    /**
     * 应用偏移量
     */
    applyOffset(coords, delta) {
        if (Array.isArray(coords[0])) {
            // 嵌套数组
            coords.forEach((c) => this.applyOffset(c, delta));
        }
        else {
            // 单个坐标
            coords[0] += delta[0];
            coords[1] += delta[1];
        }
    }
    /**
     * 获取命令描述
     */
    getDescription() {
        return `Move feature ${this.featureId} by [${this.delta[0].toFixed(2)}, ${this.delta[1].toFixed(2)}]`;
    }
    /**
     * 检查是否可以合并（连续移动同一要素）
     */
    canMerge(command) {
        if (command instanceof MoveFeatureCommand) {
            const other = command;
            return other.featureId === this.featureId;
        }
        return false;
    }
    /**
     * 合并命令
     */
    merge(command) {
        if (command instanceof MoveFeatureCommand) {
            const other = command;
            this.delta[0] += other.delta[0];
            this.delta[1] += other.delta[1];
        }
    }
}
//# sourceMappingURL=MoveFeatureCommand.js.map