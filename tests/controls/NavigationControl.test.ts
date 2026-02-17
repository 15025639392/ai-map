import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NavigationControl } from '../../src/controls/NavigationControl.js';
import { ControlEventType } from '../../src/controls/types.js';

describe('NavigationControl', () => {
  let navigationControl: NavigationControl;
  const initialState = {
    center: [0, 0] as [number, number],
    zoom: 1,
    rotation: 0,
    tilt: 0,
  };

  beforeEach(() => {
    navigationControl = new NavigationControl(initialState);
  });

  afterEach(() => {
    navigationControl.dispose();
  });

  describe('初始状态', () => {
    it('应该正确初始化导航状态', () => {
      const state = navigationControl.getState();
      expect(state.center).toEqual([0, 0]);
      expect(state.zoom).toBe(1);
      expect(state.rotation).toBe(0);
      expect(state.tilt).toBe(0);
    });

    it('应该接受自定义初始状态', () => {
      const control = new NavigationControl({
        center: [100, 200] as [number, number],
        zoom: 5,
        rotation: Math.PI / 4,
        tilt: Math.PI / 6,
      });

      const state = control.getState();
      expect(state.center).toEqual([100, 200]);
      expect(state.zoom).toBe(5);
      expect(state.rotation).toBeCloseTo(Math.PI / 4);
      expect(state.tilt).toBeCloseTo(Math.PI / 6);

      control.dispose();
    });
  });

  describe('中心点操作', () => {
    it('应该能够设置中心点', () => {
      navigationControl.setCenter([100, 200] as [number, number], { duration: 0 });
      const state = navigationControl.getState();
      expect(state.center).toEqual([100, 200]);
    });

    it('应该能够平移', () => {
      navigationControl.pan(10, 20, { duration: 0 });
      let state = navigationControl.getState();
      expect(state.center).toEqual([10, 20]);

      navigationControl.pan(30, 40, { duration: 0 });
      state = navigationControl.getState();
      expect(state.center).toEqual([40, 60]);
    });
  });

  describe('缩放操作', () => {
    it('应该能够设置缩放级别', () => {
      navigationControl.setZoom(5, { duration: 0 });
      const state = navigationControl.getState();
      expect(state.zoom).toBe(5);
    });

    it('应该能够缩放', () => {
      navigationControl.zoom(1, { duration: 0 });
      expect(navigationControl.getState().zoom).toBe(2);

      navigationControl.zoom(-0.5, { duration: 0 });
      expect(navigationControl.getState().zoom).toBe(1.5);
    });
  });

  describe('旋转操作', () => {
    it('应该能够设置旋转角度', () => {
      navigationControl.setRotation(Math.PI, { duration: 0 });
      const state = navigationControl.getState();
      expect(state.rotation).toBe(Math.PI);
    });

    it('应该能够旋转', () => {
      navigationControl.rotate(Math.PI / 4, { duration: 0 });
      expect(navigationControl.getState().rotation).toBeCloseTo(Math.PI / 4);

      navigationControl.rotate(Math.PI / 4, { duration: 0 });
      expect(navigationControl.getState().rotation).toBeCloseTo(Math.PI / 2);
    });
  });

  describe('倾斜操作', () => {
    it('应该能够设置倾斜角度', () => {
      navigationControl.setTilt(Math.PI / 6, { duration: 0 });
      const state = navigationControl.getState();
      expect(state.tilt).toBeCloseTo(Math.PI / 6);
    });

    it('应该能够倾斜', () => {
      navigationControl.tilt(Math.PI / 12, { duration: 0 });
      expect(navigationControl.getState().tilt).toBeCloseTo(Math.PI / 12, 10);

      navigationControl.tilt(Math.PI / 12, { duration: 0 });
      expect(navigationControl.getState().tilt).toBeCloseTo(Math.PI / 6, 10);
    });
  });

  describe('飞行定位', () => {
    it('应该能够飞行到指定位置', async () => {
      navigationControl.flyTo({
        center: [100, 200] as [number, number],
      });

      // 等待动画完成
      await new Promise((resolve) => setTimeout(resolve, 400));

      const state = navigationControl.getState();
      expect(state.center).toEqual([100, 200]);
    });

    it('应该能够飞行到完整目标状态', async () => {
      navigationControl.flyTo({
        center: [100, 200] as [number, number],
        zoom: 5,
        rotation: Math.PI / 2,
        tilt: Math.PI / 4,
      });

      // 等待动画完成
      await new Promise((resolve) => setTimeout(resolve, 400));

      const state = navigationControl.getState();
      expect(state.center).toEqual([100, 200]);
      expect(state.zoom).toBe(5);
      expect(state.rotation).toBeCloseTo(Math.PI / 2);
      expect(state.tilt).toBeCloseTo(Math.PI / 4);
    });
  });

  describe('事件系统', () => {
    it('应该能够订阅导航改变事件', (done) => {
      const unsubscribe = navigationControl.on(
        ControlEventType.NAVIGATION_CHANGE,
        (event) => {
          expect(event.type).toBe(ControlEventType.NAVIGATION_CHANGE);
          expect(event.data).toBeDefined();
          expect(event.data.newState).toBeDefined();
          unsubscribe();
          done();
        }
      );

      navigationControl.setCenter([10, 20] as [number, number]);
    });

    it('应该能够取消订阅', () => {
      const listener = vi.fn();
      const unsubscribe = navigationControl.on(
        ControlEventType.NAVIGATION_CHANGE,
        listener
      );

      unsubscribe();
      navigationControl.setCenter([10, 20] as [number, number]);

      expect(listener).not.toHaveBeenCalled();
    });

    it('应该在状态改变时发送事件', () => {
      const listener = vi.fn();
      navigationControl.on(ControlEventType.NAVIGATION_CHANGE, listener);

      navigationControl.setCenter([10, 20] as [number, number], { duration: 0 });
      expect(listener).toHaveBeenCalledTimes(1);

      navigationControl.setZoom(5, { duration: 0 });
      expect(listener).toHaveBeenCalledTimes(2);

      navigationControl.setRotation(Math.PI, { duration: 0 });
      expect(listener).toHaveBeenCalledTimes(3);
    });
  });

  describe('性能监控', () => {
    it('应该能够获取性能监控器', () => {
      const monitor = navigationControl.getPerformanceMonitor();
      expect(monitor).toBeDefined();
    });

    it('应该能够记录操作耗时', () => {
      const monitor = navigationControl.getPerformanceMonitor();

      // 手动记录一些性能数据
      monitor.record('setCenter', 10);
      monitor.record('setCenter', 20);
      monitor.record('setCenter', 30);

      expect(monitor.getSampleCount('setCenter')).toBe(3);
      expect(monitor.getAverage('setCenter')).toBe(20);
      expect(monitor.getP95('setCenter')).toBe(30);
    });
  });

  describe('动画', () => {
    it('应该支持平滑动画', (done) => {
      let eventCount = 0;
      navigationControl.on(ControlEventType.NAVIGATION_CHANGE, () => {
        eventCount++;
      });

      navigationControl.setCenter([100, 200] as [number, number], { duration: 300 });

      // 等待动画完成
      setTimeout(() => {
        // 应该触发多次事件（动画过程中）
        expect(eventCount).toBeGreaterThan(1);
        expect(navigationControl.getState().center).toEqual([100, 200]);
        done();
      }, 400);
    });

    it('应该能够取消之前的动画', (done) => {
      let finalState = null;
      navigationControl.on(ControlEventType.NAVIGATION_CHANGE, (event) => {
        finalState = event.data.newState;
      });

      // 启动第一个动画
      navigationControl.setCenter([100, 200] as [number, number], { duration: 500 });

      // 短暂延迟后启动第二个动画
      setTimeout(() => {
        navigationControl.setCenter([300, 400] as [number, number], { duration: 200 });
      }, 100);

      // 等待所有动画完成
      setTimeout(() => {
        expect(finalState.center).toEqual([300, 400]);
        done();
      }, 500);
    });

    it('应该支持无动画的直接更新', () => {
      const listener = vi.fn();
      navigationControl.on(ControlEventType.NAVIGATION_CHANGE, listener);

      navigationControl.setCenter([100, 200] as [number, number], { duration: 0 });

      // 无动画时应该只触发一次事件
      expect(listener).toHaveBeenCalledTimes(1);
      expect(navigationControl.getState().center).toEqual([100, 200]);
    });
  });

  describe('销毁', () => {
    it('应该能够正确销毁控件', () => {
      const monitor = navigationControl.getPerformanceMonitor();
      monitor.record('test', 10);

      navigationControl.dispose();

      // 销毁后应该清除监控数据
      const newMonitor = navigationControl.getPerformanceMonitor();
      expect(newMonitor.getSampleCount('test')).toBe(0);
    });

    it('销毁后不应该发送事件', () => {
      const listener = vi.fn();
      navigationControl.on(ControlEventType.NAVIGATION_CHANGE, listener);

      navigationControl.dispose();
      navigationControl.setCenter([10, 20] as [number, number]);

      // 销毁后不应该触发事件
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
