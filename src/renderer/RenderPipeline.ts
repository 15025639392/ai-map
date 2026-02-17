import type { IRenderNode, IContextInfo, IRenderStats } from './types.js';

/**
 * 渲染阶段
 */
export enum RenderPhase {
  PRE_RENDER,
  RENDER,
  POST_RENDER,
}

/**
 * 渲染管线
 * 负责 pre-render、render、post-render 三阶段流程编排
 */
export class RenderPipeline {
  private _nodes: Map<string, IRenderNode> = new Map();
  private _sortedNodes: IRenderNode[] = [];
  private _dirty = true;
  private _stats: IRenderStats = {
    fps: 0,
    frameTime: 0,
    nodeCount: 0,
    resourceCount: 0,
  };
  private _lastFrameTime = 0;
  private _frameCount = 0;
  private _fpsUpdateTime = 0;

  constructor(private _contextInfo: IContextInfo) {}

  /**
   * 添加渲染节点
   */
  addNode(node: IRenderNode): void {
    if (this._nodes.has(node.id)) {
      throw new Error(`RenderNode ${node.id} already exists`);
    }

    this._nodes.set(node.id, node);
    this._dirty = true;
  }

  /**
   * 移除渲染节点
   */
  removeNode(id: string): void {
    if (this._nodes.delete(id)) {
      this._dirty = true;
    }
  }

  /**
   * 获取渲染节点
   */
  getNode(id: string): IRenderNode | undefined {
    return this._nodes.get(id);
  }

  /**
   * 更新渲染节点
   */
  updateNode(id: string, updateFn: (node: IRenderNode) => void): void {
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
  private _sortNodes(): void {
    if (!this._dirty) return;

    this._sortedNodes = Array.from(this._nodes.values())
      .filter((node) => node.visible)
      .sort((a, b) => b.priority - a.priority);

    this._stats.nodeCount = this._sortedNodes.length;
    this._dirty = false;
  }

  /**
   * 执行渲染管线
   */
  execute(deltaTime: number): void {
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
  private _preRender(deltaTime: number): void {
    this._sortNodes();

    // 执行 pre-render 逻辑（如果节点有此方法）
    this._sortedNodes.forEach((node) => {
      if ('preRender' in node && typeof (node as any).preRender === 'function') {
        (node as any).preRender(deltaTime);
      }
    });
  }

  /**
   * Render 阶段
   */
  private _render(deltaTime: number): void {
    const gl = this._contextInfo.gl;

    // 清空缓冲区
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // 创建一个简单的 renderer 对象供节点使用
    const rendererObj = {
      resourceManager: undefined as any,
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
  private _postRender(deltaTime: number): void {
    // 执行 post-render 逻辑（如果节点有此方法）
    this._sortedNodes.forEach((node) => {
      if ('postRender' in node && typeof (node as any).postRender === 'function') {
        (node as any).postRender(deltaTime);
      }
    });
  }

  /**
   * 更新统计信息
   */
  private _updateStats(now: number): void {
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
  getStats(): IRenderStats {
    // Ensure stats are up-to-date
    this._sortNodes();
    return { ...this._stats };
  }

  /**
   * 获取可见节点数量
   */
  getVisibleNodeCount(): number {
    return this._sortedNodes.length;
  }

  /**
   * 清空所有节点
   */
  clearNodes(): void {
    this._nodes.clear();
    this._sortedNodes = [];
    this._dirty = true;
  }

  /**
   * 销毁渲染管线
   */
  dispose(): void {
    this.clearNodes();
    this._nodes.clear();
    this._sortedNodes = [];
  }
}
