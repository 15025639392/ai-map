/**
 * 渲染阶段
 */
export var RenderPhase;
(function (RenderPhase) {
    RenderPhase[RenderPhase["PRE_RENDER"] = 0] = "PRE_RENDER";
    RenderPhase[RenderPhase["RENDER"] = 1] = "RENDER";
    RenderPhase[RenderPhase["POST_RENDER"] = 2] = "POST_RENDER";
})(RenderPhase || (RenderPhase = {}));
/**
 * 渲染管线
 * 负责 pre-render、render、post-render 三阶段流程编排
 */
export class RenderPipeline {
    _contextInfo;
    _nodes = new Map();
    _sortedNodes = [];
    _dirty = true;
    _stats = {
        fps: 0,
        frameTime: 0,
        nodeCount: 0,
        resourceCount: 0,
    };
    _lastFrameTime = 0;
    _frameCount = 0;
    _fpsUpdateTime = 0;
    constructor(_contextInfo) {
        this._contextInfo = _contextInfo;
    }
    /**
     * 添加渲染节点
     */
    addNode(node) {
        if (this._nodes.has(node.id)) {
            throw new Error(`RenderNode ${node.id} already exists`);
        }
        this._nodes.set(node.id, node);
        this._dirty = true;
    }
    /**
     * 移除渲染节点
     */
    removeNode(id) {
        if (this._nodes.delete(id)) {
            this._dirty = true;
        }
    }
    /**
     * 获取渲染节点
     */
    getNode(id) {
        return this._nodes.get(id);
    }
    /**
     * 更新渲染节点
     */
    updateNode(id, updateFn) {
        const node = this._nodes.get(id);
        if (!node) {
            throw new Error(`RenderNode ${id} not found`);
        }
        updateFn(node);
        this._dirty = true;
    }
    /**
     * 排序渲染节点（按优先级）
     */
    _sortNodes() {
        if (!this._dirty)
            return;
        this._sortedNodes = Array.from(this._nodes.values())
            .filter((node) => node.visible)
            .sort((a, b) => b.priority - a.priority);
        this._stats.nodeCount = this._sortedNodes.length;
        this._dirty = false;
    }
    /**
     * 执行渲染管线
     */
    execute(deltaTime) {
        const now = performance.now();
        // Pre-render 阶段
        this._preRender(deltaTime);
        // Render 阶段
        this._render(deltaTime);
        // Post-render 阶段
        this._postRender(deltaTime);
        // 更新统计信息
        this._updateStats(now);
    }
    /**
     * Pre-render 阶段
     */
    _preRender(deltaTime) {
        this._sortNodes();
        // 执行 pre-render 逻辑（如果节点有此方法）
        this._sortedNodes.forEach((node) => {
            if ('preRender' in node && typeof node.preRender === 'function') {
                node.preRender(deltaTime);
            }
        });
    }
    /**
     * Render 阶段
     */
    _render(deltaTime) {
        const gl = this._contextInfo.gl;
        // 清空缓冲区
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // 创建一个简单的 renderer 对象供节点使用
        const rendererObj = {
            resourceManager: undefined,
            gl: this._contextInfo.gl,
            pipeline: this,
        };
        // 渲染所有节点
        this._sortedNodes.forEach((node) => {
            node.render(rendererObj);
        });
    }
    /**
     * Post-render 阶段
     */
    _postRender(deltaTime) {
        // 执行 post-render 逻辑（如果节点有此方法）
        this._sortedNodes.forEach((node) => {
            if ('postRender' in node && typeof node.postRender === 'function') {
                node.postRender(deltaTime);
            }
        });
    }
    /**
     * 更新统计信息
     */
    _updateStats(now) {
        if (this._lastFrameTime === 0) {
            this._lastFrameTime = now;
            return;
        }
        const frameTime = now - this._lastFrameTime;
        this._stats.frameTime = frameTime;
        this._frameCount++;
        if (now - this._fpsUpdateTime >= 1000) {
            this._stats.fps = Math.round((this._frameCount * 1000) / (now - this._fpsUpdateTime));
            this._frameCount = 0;
            this._fpsUpdateTime = now;
        }
        this._lastFrameTime = now;
    }
    /**
     * 获取统计信息
     */
    getStats() {
        // Ensure stats are up-to-date
        this._sortNodes();
        return { ...this._stats };
    }
    /**
     * 获取可见节点数量
     */
    getVisibleNodeCount() {
        return this._sortedNodes.length;
    }
    /**
     * 清空所有节点
     */
    clearNodes() {
        this._nodes.clear();
        this._sortedNodes = [];
        this._dirty = true;
    }
    /**
     * 销毁渲染管线
     */
    dispose() {
        this.clearNodes();
        this._nodes.clear();
        this._sortedNodes = [];
    }
}
//# sourceMappingURL=RenderPipeline.js.map