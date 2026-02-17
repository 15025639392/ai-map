import type { IRenderNode, IRenderer, ILayerOptions, ILifecycleHooks } from './types.js';
import { LayerState } from './types.js';

/**
 * Layer 基类
 * 负责图层生命周期管理（add/remove/show/hide）
 */
export abstract class Layer implements IRenderNode {
  private static _idCounter = 0;

  readonly id: string;
  priority: number;
  visible: boolean;
  readonly name: string;

  private _state: LayerState = LayerState.INITIALIZED;
  private _hooks: ILifecycleHooks;
  private _renderer: IRenderer | null = null;
  private _disposed = false;

  constructor(options: ILayerOptions = {}) {
    this.id = options.id || `layer-${Layer._idCounter++}`;
    this.priority = options.priority ?? 0;
    this.visible = options.visible ?? true;
    this.name = options.name || this.id;
    this._hooks = options.hooks || {};
  }

  /**
   * 获取图层状态
   */
  get state(): LayerState {
    return this._state;
  }

  /**
   * 获取关联的渲染器
   */
  get renderer(): IRenderer | null {
    return this._renderer;
  }

  /**
   * 添加到渲染器
   */
  add(renderer: IRenderer): void {
    if (this._disposed) {
      throw new Error(`Layer ${this.id} is disposed`);
    }

    if (this._state === LayerState.ADDED || this._state === LayerState.SHOWN) {
      console.warn(`Layer ${this.id} is already added`);
      return;
    }

    this._renderer = renderer;

    // 注册渲染节点
    renderer.pipeline.addNode(this);

    // 触发 onAdd 钩子
    this._triggerHook('onAdd');

    this._state = LayerState.ADDED;

    // 如果可见，设置为 SHOWN 状态
    if (this.visible) {
      this._state = LayerState.SHOWN;
    }
  }

  /**
   * 从渲染器移除
   */
  remove(): void {
    if (this._disposed) {
      throw new Error(`Layer ${this.id} is disposed`);
    }

    if (this._state === LayerState.INITIALIZED || this._state === LayerState.REMOVED) {
      console.warn(`Layer ${this.id} is not added`);
      return;
    }

    // 触发 onRemove 钩子
    this._triggerHook('onRemove');

    // 从渲染管线移除
    if (this._renderer) {
      this._renderer.pipeline.removeNode(this.id);
      this._renderer = null;
    }

    this._state = LayerState.REMOVED;
  }

  /**
   * 显示图层
   */
  show(): void {
    if (this._disposed) {
      throw new Error(`Layer ${this.id} is disposed`);
    }

    if (this._state === LayerState.INITIALIZED || this._state === LayerState.REMOVED) {
      console.warn(`Layer ${this.id} is not added. Add it to renderer first.`);
      return;
    }

    if (this.visible) {
      return;
    }

    this.visible = true;

    // 触发 onShow 钩子
    this._triggerHook('onShow');

    this._state = LayerState.SHOWN;
  }

  /**
   * 隐藏图层
   */
  hide(): void {
    if (this._disposed) {
      throw new Error(`Layer ${this.id} is disposed`);
    }

    if (this._state === LayerState.INITIALIZED || this._state === LayerState.REMOVED) {
      console.warn(`Layer ${this.id} is not added. Add it to renderer first.`);
      return;
    }

    if (!this.visible) {
      return;
    }

    this.visible = false;

    // 触发 onHide 钩子
    this._triggerHook('onHide');

    this._state = LayerState.HIDDEN;
  }

  /**
   * 切换可见性
   */
  toggle(): void {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * 更新优先级
   */
  setPriority(priority: number): void {
    if (this._disposed) {
      throw new Error(`Layer ${this.id} is disposed`);
    }

    if (this.priority !== priority) {
      this.priority = priority;

      // 如果已添加到渲染器，更新渲染管线
      if (this._renderer) {
        this._renderer.pipeline.updateNode(this.id, () => {
          // 优先级更新会触发重新排序
        });
      }
    }
  }

  /**
   * 检查是否已添加到渲染器
   */
  isAdded(): boolean {
    return (
      this._state === LayerState.ADDED ||
      this._state === LayerState.SHOWN ||
      this._state === LayerState.HIDDEN
    );
  }

  /**
   * 检查是否可见
   */
  isVisible(): boolean {
    return this.visible;
  }

  /**
   * 检查是否已销毁
   */
  protected isDisposed(): boolean {
    return this._disposed;
  }

  /**
   * 注册 WebGL 资源
   */
  protected registerResource(
    resourceId: string,
    type: 'texture' | 'program' | 'buffer' | 'framebuffer',
    resource: WebGLTexture | WebGLProgram | WebGLBuffer | WebGLFramebuffer,
    disposeFn: () => void
  ): void {
    if (!this._renderer) {
      throw new Error(`Layer ${this.id} is not added to a renderer`);
    }

    this._renderer.resourceManager.registerResource(resourceId, type, resource, disposeFn);
  }

  /**
   * 增加 WebGL 资源引用
   */
  protected addResourceRef(resourceId: string): void {
    if (!this._renderer) {
      throw new Error(`Layer ${this.id} is not added to a renderer`);
    }

    this._renderer.resourceManager.addRef(resourceId);
  }

  /**
   * 减少 WebGL 资源引用
   */
  protected releaseResourceRef(resourceId: string): void {
    if (!this._renderer) {
      throw new Error(`Layer ${this.id} is not added to a renderer`);
    }

    this._renderer.resourceManager.releaseRef(resourceId);
  }

  /**
   * 直接释放 WebGL 资源
   */
  protected disposeResource(resourceId: string): void {
    if (!this._renderer) {
      throw new Error(`Layer ${this.id} is not added to a renderer`);
    }

    this._renderer.resourceManager.disposeResource(resourceId);
  }

  /**
   * 渲染方法（由子类实现）
   */
  abstract render(renderer: IRenderer): void;

  /**
   * 清理资源（由子类实现）
   */
  protected disposeResources(): void {
    // 子类可以重写此方法来清理自定义资源
  }

  /**
   * 销毁图层
   */
  dispose(): void {
    if (this._disposed) {
      return;
    }

    // 保存渲染器引用，用于清理资源
    const renderer = this._renderer;

    // 如果已添加到渲染器，移除
    if (this.isAdded()) {
      this.remove();
    }

    // 清理资源（在 remove 之后，但使用保存的引用）
    this._renderer = renderer;
    this.disposeResources();
    this._renderer = null;

    this._disposed = true;
    this._state = LayerState.DISPOSED;
  }

  /**
   * 触发生命周期钩子
   */
  private async _triggerHook(hookName: keyof ILifecycleHooks): Promise<void> {
    const hook = this._hooks[hookName];
    if (hook) {
      try {
        await hook();
      } catch (error) {
        console.error(`[Layer ${this.id}] Hook ${hookName} failed:`, error);
      }
    }
  }
}
