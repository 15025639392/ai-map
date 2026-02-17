import type { IRenderNode, IContextInfo, IRenderStats } from './types.js';
/**
 * 渲染阶段
 */
export declare enum RenderPhase {
    PRE_RENDER = 0,
    RENDER = 1,
    POST_RENDER = 2
}
/**
 * 渲染管线
 * 负责 pre-render、render、post-render 三阶段流程编排
 */
export declare class RenderPipeline {
    private _contextInfo;
    private _nodes;
    private _sortedNodes;
    private _dirty;
    private _stats;
    private _lastFrameTime;
    private _frameCount;
    private _fpsUpdateTime;
    constructor(_contextInfo: IContextInfo);
    /**
     * 添加渲染节点
     */
    addNode(node: IRenderNode): void;
    /**
     * 移除渲染节点
     */
    removeNode(id: string): void;
    /**
     * 获取渲染节点
     */
    getNode(id: string): IRenderNode | undefined;
    /**
     * 更新渲染节点
     */
    updateNode(id: string, updateFn: (node: IRenderNode) => void): void;
    /**
     * 排序渲染节点（按优先级）
     */
    private _sortNodes;
    /**
     * 执行渲染管线
     */
    execute(deltaTime: number): void;
    /**
     * Pre-render 阶段
     */
    private _preRender;
    /**
     * Render 阶段
     */
    private _render;
    /**
     * Post-render 阶段
     */
    private _postRender;
    /**
     * 更新统计信息
     */
    private _updateStats;
    /**
     * 获取统计信息
     */
    getStats(): IRenderStats;
    /**
     * 获取可见节点数量
     */
    getVisibleNodeCount(): number;
    /**
     * 清空所有节点
     */
    clearNodes(): void;
    /**
     * 销毁渲染管线
     */
    dispose(): void;
}
//# sourceMappingURL=RenderPipeline.d.ts.map