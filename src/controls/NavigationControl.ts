import {
  INavigationState,
  INavigationOptions,
  IFlyToTarget,
  ControlEventType,
} from './types.js';
import { EventBus } from './EventBus.js';
import { PerformanceMonitor } from './PerformanceMonitor.js';
import type { Coordinate } from '../vectortypes.js';

/**
 * 默认导航选项
 */
const DEFAULT_OPTIONS: INavigationOptions = {
  duration: 300,
  easing: (t: number) => t * (2 - t), // easeOutQuad
};

/**
 * 导航控件
 */
export class NavigationControl {
  private state: INavigationState;
  private eventBus: EventBus;
  private performanceMonitor: PerformanceMonitor;
  private animationFrame: number | null = null;
  private targetState: INavigationState | null = null;

  constructor(
    initialState: INavigationState = {
      center: [0, 0],
      zoom: 1,
      rotation: 0,
      tilt: 0,
    }
  ) {
    this.state = { ...initialState };
    this.eventBus = new EventBus();
    this.performanceMonitor = new PerformanceMonitor();
  }

  /**
   * 获取当前导航状态
   */
  getState(): INavigationState {
    return { ...this.state };
  }

  /**
   * 设置中心点
   */
  setCenter(center: Coordinate, options?: INavigationOptions): void {
    this.updateState({ center }, options);
  }

  /**
   * 设置缩放级别
   */
  setZoom(zoom: number, options?: INavigationOptions): void {
    this.updateState({ zoom }, options);
  }

  /**
   * 缩放
   */
  zoom(delta: number, options?: INavigationOptions): void {
    const newZoom = this.state.zoom + delta;
    this.setZoom(newZoom, options);
  }

  /**
   * 设置旋转角度
   */
  setRotation(rotation: number, options?: INavigationOptions): void {
    this.updateState({ rotation }, options);
  }

  /**
   * 旋转
   */
  rotate(delta: number, options?: INavigationOptions): void {
    const newRotation = this.state.rotation + delta;
    this.setRotation(newRotation, options);
  }

  /**
   * 设置倾斜角度
   */
  setTilt(tilt: number, options?: INavigationOptions): void {
    this.updateState({ tilt }, options);
  }

  /**
   * 倾斜
   */
  tilt(delta: number, options?: INavigationOptions): void {
    const newTilt = this.state.tilt + delta;
    this.setTilt(newTilt, options);
  }

  /**
   * 飞行定位
   */
  flyTo(target: IFlyToTarget, options?: INavigationOptions): void {
    const newTargetState: INavigationState = {
      center: target.center,
      zoom: target.zoom ?? this.state.zoom,
      rotation: target.rotation ?? this.state.rotation,
      tilt: target.tilt ?? this.state.tilt,
    };
    this.updateState(newTargetState, options);
  }

  /**
   * 平移
   */
  pan(deltaX: number, deltaY: number, options?: INavigationOptions): void {
    const newCenter: Coordinate = [
      this.state.center[0] + deltaX,
      this.state.center[1] + deltaY,
    ];
    this.setCenter(newCenter, options);
  }

  /**
   * 更新状态（支持动画）
   */
  private updateState(
    partialState: Partial<INavigationState>,
    options?: INavigationOptions
  ): void {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    // 如果没有动画时长，直接更新
    if (!opts.duration || opts.duration <= 0) {
      this.applyUpdate(partialState);
      return;
    }

    // 使用动画过渡
    this.animateToState(partialState, opts);
  }

  /**
   * 应用更新
   */
  private applyUpdate(partialState: Partial<INavigationState>): void {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...partialState };
    this.emitNavigationChangeEvent(oldState);
  }

  /**
   * 动画过渡到目标状态
   */
  private animateToState(
    partialState: Partial<INavigationState>,
    options: INavigationOptions
  ): void {
    // 取消之前的动画
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
    }

    const startTime = performance.now();
    const startState = { ...this.state };
    const endState = { ...this.state, ...partialState };

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / (options.duration || 300), 1);
      const easedProgress = options.easing ? options.easing(progress) : progress;

      // 插值计算
      this.state = {
        center: this.interpolate(startState.center, endState.center, easedProgress),
        zoom: startState.zoom + (endState.zoom - startState.zoom) * easedProgress,
        rotation: startState.rotation + (endState.rotation - startState.rotation) * easedProgress,
        tilt: startState.tilt + (endState.tilt - startState.tilt) * easedProgress,
      };

      this.emitNavigationChangeEvent(startState);

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      } else {
        this.animationFrame = null;
      }
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  /**
   * 插值计算坐标
   */
  private interpolate(start: Coordinate, end: Coordinate, t: number): Coordinate {
    return [
      start[0] + (end[0] - start[0]) * t,
      start[1] + (end[1] - start[1]) * t,
    ];
  }

  /**
   * 发送导航改变事件
   */
  private emitNavigationChangeEvent(oldState: INavigationState): void {
    this.eventBus.emit(ControlEventType.NAVIGATION_CHANGE, {
      oldState,
      newState: { ...this.state },
    });
  }

  /**
   * 订阅事件
   */
  on(eventType: ControlEventType, listener: any): () => void {
    return this.eventBus.on(eventType, listener);
  }

  /**
   * 取消订阅
   */
  off(eventType: ControlEventType, listener: any): void {
    this.eventBus.off(eventType, listener);
  }

  /**
   * 获取性能监控器
   */
  getPerformanceMonitor(): PerformanceMonitor {
    return this.performanceMonitor;
  }

  /**
   * 销毁控件
   */
  dispose(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.eventBus.clear();
    this.performanceMonitor.clear();
  }
}
