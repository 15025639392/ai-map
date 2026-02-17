/**
 * 拾取管理器
 */
export class PickingManager {
    features = [];
    spatialIndex = null;
    config;
    constructor(config = {}) {
        this.config = {
            pointRadius: config.pointRadius || 10,
            lineRadius: config.lineRadius || 5,
            polygonRadius: config.polygonRadius || 2,
        };
    }
    /**
     * 添加要素
     */
    addFeatures(features) {
        this.features = [...this.features, ...features];
        this.buildSpatialIndex();
    }
    /**
     * 清空要素
     */
    clear() {
        this.features = [];
        this.spatialIndex = null;
    }
    /**
     * 构建空间索引（使用R-Tree的简化版本）
     */
    buildSpatialIndex() {
        if (this.features.length === 0) {
            this.spatialIndex = null;
            return;
        }
        // 简化版：使用网格索引
        this.spatialIndex = this.buildGridIndex(this.features);
    }
    /**
     * 构建网格索引
     */
    buildGridIndex(features) {
        // 计算总体边界
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        for (const feature of features) {
            const bounds = this.getFeatureBounds(feature);
            minX = Math.min(minX, bounds[0][0]);
            minY = Math.min(minY, bounds[0][1]);
            maxX = Math.max(maxX, bounds[1][0]);
            maxY = Math.max(maxY, bounds[1][1]);
        }
        // 如果要素太少，不分割
        if (features.length <= 10) {
            return {
                bounds: [
                    [minX, minY],
                    [maxX, maxY],
                ],
                features,
            };
        }
        // 分割为4个子节点
        const midX = (minX + maxX) / 2;
        const midY = (minY + maxY) / 2;
        const quadrants = [
            { bounds: [[minX, minY], [midX, midY]], features: [] },
            { bounds: [[midX, minY], [maxX, midY]], features: [] },
            { bounds: [[minX, midY], [midX, maxY]], features: [] },
            { bounds: [[midX, midY], [maxX, maxY]], features: [] },
        ];
        for (const feature of features) {
            const bounds = this.getFeatureBounds(feature);
            const centerX = (bounds[0][0] + bounds[1][0]) / 2;
            const centerY = (bounds[0][1] + bounds[1][1]) / 2;
            for (const quadrant of quadrants) {
                if (centerX >= quadrant.bounds[0][0] && centerX < quadrant.bounds[1][0] &&
                    centerY >= quadrant.bounds[0][1] && centerY < quadrant.bounds[1][1]) {
                    quadrant.features.push(feature);
                    break;
                }
            }
        }
        const children = quadrants
            .filter((q) => q.features.length > 0)
            .map((q) => this.buildGridIndex(q.features));
        return {
            bounds: [
                [minX, minY],
                [maxX, maxY],
            ],
            children: children,
            features: children.length > 0 ? children.flatMap((c) => c.features) : features,
        };
    }
    /**
     * 获取要素边界
     */
    getFeatureBounds(feature) {
        return this.getGeometryBounds(feature.geometry);
    }
    /**
     * 获取几何边界
     */
    getGeometryBounds(geometry) {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        const visitCoordinates = (coords) => {
            if (Array.isArray(coords[0])) {
                coords.forEach((c) => visitCoordinates(c));
            }
            else {
                minX = Math.min(minX, coords[0]);
                minY = Math.min(minY, coords[1]);
                maxX = Math.max(maxX, coords[0]);
                maxY = Math.max(maxY, coords[1]);
            }
        };
        visitCoordinates(geometry.coordinates);
        return [
            [minX, minY],
            [maxX, maxY],
        ];
    }
    /**
     * 查询节点
     */
    queryNode(node, point) {
        if (!node)
            return [];
        // 检查点是否在节点边界内（稍微放宽一点，以处理边界情况）
        if (point[0] < node.bounds[0][0] - 0.1 || point[0] > node.bounds[1][0] + 0.1 ||
            point[1] < node.bounds[0][1] - 0.1 || point[1] > node.bounds[1][1] + 0.1) {
            return [];
        }
        if (node.children) {
            // 如果有子节点，递归查询
            const results = [];
            for (const child of node.children) {
                results.push(...this.queryNode(child, point));
            }
            return results;
        }
        else {
            // 叶子节点，返回所有要素
            return node.features;
        }
    }
    /**
     * 拾取要素
     */
    pick(screenPosition, projection) {
        // 暂时禁用空间索引，使用全量扫描
        const candidates = this.features;
        const results = [];
        for (const feature of candidates) {
            const distance = this.calculateDistance(feature.geometry, screenPosition, projection);
            if (distance !== null && distance < this.getPickRadius(feature.geometry)) {
                results.push({
                    feature,
                    distance,
                    screenPosition,
                });
            }
        }
        // 按距离排序
        results.sort((a, b) => a.distance - b.distance);
        return results;
    }
    /**
     * 计算距离
     */
    calculateDistance(geometry, screenPosition, projection) {
        const transform = (coord) => projection ? projection(coord) : coord;
        let minDistance = null;
        const visitCoordinates = (coords) => {
            if (Array.isArray(coords[0])) {
                coords.forEach((c) => visitCoordinates(c));
            }
            else {
                const transformed = transform(coords);
                const distance = Math.sqrt(Math.pow(transformed[0] - screenPosition[0], 2) +
                    Math.pow(transformed[1] - screenPosition[1], 2));
                if (minDistance === null || distance < minDistance) {
                    minDistance = distance;
                }
            }
        };
        visitCoordinates(geometry.coordinates);
        return minDistance;
    }
    /**
     * 获取拾取半径
     */
    getPickRadius(geometry) {
        switch (geometry.type) {
            case 'point':
            case 'multi_point':
                return this.config.pointRadius;
            case 'line':
            case 'multi_line':
                return this.config.lineRadius;
            case 'polygon':
            case 'multi_polygon':
                return this.config.polygonRadius;
            default:
                return 10;
        }
    }
    /**
     * 测试拾取准确率
     */
    testAccuracy(testCases) {
        let correct = 0;
        for (const testCase of testCases) {
            const results = this.pick(testCase.point);
            if (testCase.expectedPick) {
                // 应该拾取：检查该特征是否在结果中，且距离在拾取半径内
                const picked = results.some((r) => r.feature.id === testCase.feature.id &&
                    r.distance < this.getPickRadius(testCase.feature.geometry));
                if (picked) {
                    correct++;
                }
            }
            else {
                // 不应该拾取：检查该特征不在结果中，或者所有结果距离都超过拾取半径
                const notPicked = !results.some((r) => r.feature.id === testCase.feature.id &&
                    r.distance < this.getPickRadius(testCase.feature.geometry));
                if (notPicked) {
                    correct++;
                }
            }
        }
        return {
            total: testCases.length,
            correct,
            accuracy: testCases.length > 0 ? (correct / testCases.length) * 100 : 0,
        };
    }
    /**
     * 获取统计信息
     */
    getStats() {
        return {
            totalFeatures: this.features.length,
            spatialIndexBuilt: this.spatialIndex !== null,
        };
    }
    /**
     * 销毁
     */
    dispose() {
        this.clear();
    }
}
//# sourceMappingURL=PickingManager.js.map