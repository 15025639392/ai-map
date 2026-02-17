/**
 * 冒烟测试运行器
 * 支持在不同平台上运行冒烟测试，快速验证核心功能
 */

import {
  CompatibilityScenario,
  SmokeTestResult,
  PlatformConfig,
  BrowserConfig,
  TestConfig,
  SmokeTestConfig,
  PlatformInfo,
} from './types.js';

/**
 * 获取当前平台信息
 */
function getCurrentPlatformInfo(): PlatformInfo {
  const platform = process.platform;
  const arch = process.arch;
  
  let platformType: 'windows' | 'macos' | 'linux';
  if (platform === 'win32') {
    platformType = 'windows';
  } else if (platform === 'darwin') {
    platformType = 'macos';
  } else {
    platformType = 'linux';
  }
  
  return {
    platform: platformType,
    architecture: arch === 'arm64' ? 'arm64' : 'x64',
    nodeVersion: process.version,
    osVersion: process.release?.os || process.platform,
  };
}

/**
 * 冒烟测试运行器
 */
export class SmokeTestRunner {
  private _scenarios: Map<string, CompatibilityScenario> = new Map();
  private _config: TestConfig = {};
  private _running: boolean = false;
  private _results: SmokeTestResult[] = [];
  private _startTime: number = 0;

  constructor(config?: TestConfig) {
    this._config = config || {};
  }

  /**
   * 添加测试场景
   */
  addScenario(scenario: CompatibilityScenario): void {
    this._scenarios.set(scenario.id, scenario);
  }

  /**
   * 批量添加测试场景
   */
  addScenarios(scenarios: CompatibilityScenario[]): void {
    scenarios.forEach(scenario => this.addScenario(scenario));
  }

  /**
   * 移除测试场景
   */
  removeScenario(scenarioId: string): void {
    this._scenarios.delete(scenarioId);
  }

  /**
   * 获取所有测试场景
   */
  getScenarios(): CompatibilityScenario[] {
    return Array.from(this._scenarios.values());
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<TestConfig>): void {
    this._config = { ...this._config, ...config };
  }

  /**
   * 运行冒烟测试
   */
  async run(config?: SmokeTestConfig): Promise<SmokeTestResult[]> {
    if (this._running) {
      throw new Error('Smoke test is already running');
    }

    const mergedConfig = config ? { ...this._config, ...config.config } : this._config;
    const scenarios = config?.scenarios || this.getScenarios();
    const platform = config?.platforms?.[0] || this._getCurrentPlatform();
    
    // 过滤场景
    const filteredScenarios = scenarios.filter(scenario => {
      // 排除在排除列表中的场景
      if (mergedConfig.excludeScenarios?.includes(scenario.id)) {
        return false;
      }
      
      // 检查平台支持
      if (!scenario.platforms.includes(platform.type)) {
        return false;
      }
      
      return true;
    });

    console.log(`Starting smoke test with ${filteredScenarios.length} scenarios`);
    console.log(`Platform: ${platform.name} (${platform.type})`);

    this._running = true;
    this._startTime = Date.now();
    this._results = [];

    try {
      if (mergedConfig.parallel) {
        await this._runParallel(filteredScenarios, platform, config?.browsers);
      } else {
        await this._runSequential(filteredScenarios, platform, config?.browsers);
      }

      const duration = Date.now() - this._startTime;
      console.log(`Smoke test completed in ${duration}ms`);
      console.log(`Passed: ${this._results.filter(r => r.passed).length}/${this._results.length}`);

      return this._results;
    } finally {
      this._running = false;
    }
  }

  /**
   * 并行运行测试
   */
  private async _runParallel(
    scenarios: CompatibilityScenario[],
    platform: PlatformConfig,
    browsers?: BrowserConfig[]
  ): Promise<void> {
    const promises = scenarios.map(async scenario => {
      const browserList = browsers || [];
      
      if (browserList.length > 0) {
        // 运行跨浏览器测试
        for (const browser of browserList) {
          await this._runScenario(scenario, platform, browser);
        }
      } else {
        // 仅平台测试
        await this._runScenario(scenario, platform);
      }
    });

    await Promise.all(promises);
  }

  /**
   * 顺序运行测试
   */
  private async _runSequential(
    scenarios: CompatibilityScenario[],
    platform: PlatformConfig,
    browsers?: BrowserConfig[]
  ): Promise<void> {
    const browserList = browsers || [];

    for (const scenario of scenarios) {
      if (browserList.length > 0) {
        // 运行跨浏览器测试
        for (const browser of browserList) {
          await this._runScenario(scenario, platform, browser);
        }
      } else {
        // 仅平台测试
        await this._runScenario(scenario, platform);
      }
    }
  }

  /**
   * 运行单个测试场景
   */
  private async _runScenario(
    scenario: CompatibilityScenario,
    platform: PlatformConfig,
    browser?: BrowserConfig
  ): Promise<void> {
    const retries = this._config.retries || 0;
    let lastError: Error | null = null;
    let result: SmokeTestResult | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const startTime = Date.now();
        
        // 运行测试
        const testResult = await Promise.race([
          scenario.testFunction(),
          this._timeout(scenario.timeout || this._config.timeout || 30000, scenario.id),
        ]);

        const duration = Date.now() - startTime;

        result = {
          scenarioId: scenario.id,
          platform,
          browser,
          passed: testResult.passed,
          duration,
          error: testResult.error,
          details: testResult.details,
          timestamp: Date.now(),
        };

        if (testResult.passed) {
          break;
        }
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === retries) {
          result = {
            scenarioId: scenario.id,
            platform,
            browser,
            passed: false,
            duration: scenario.timeout || 30000,
            error: lastError?.message || 'Unknown error',
            timestamp: Date.now(),
          };
        }
      }
    }

    if (result) {
      this._results.push(result);
      console.log(
        `[${result.passed ? 'PASS' : 'FAIL'}] ${scenario.name} ` +
        `(${platform.name}${browser ? ` / ${browser.name} ${browser.version}` : ''}) ` +
        `${result.duration}ms`
      );
    }
  }

  /**
   * 超时处理
   */
  private _timeout(ms: number, scenarioId: string): Promise<{ passed: boolean; error: string }> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          passed: false,
          error: `Timeout after ${ms}ms`,
        });
      }, ms);
    });
  }

  /**
   * 获取当前平台配置
   */
  private _getCurrentPlatform(): PlatformConfig {
    const info = getCurrentPlatformInfo();
    return {
      name: info.platform,
      type: info.platform,
      architecture: info.architecture,
    };
  }

  /**
   * 获取测试结果
   */
  getResults(): SmokeTestResult[] {
    return [...this._results];
  }

  /**
   * 获取通过率
   */
  getPassRate(): number {
    if (this._results.length === 0) return 0;
    const passed = this._results.filter(r => r.passed).length;
    return passed / this._results.length;
  }

  /**
   * 获取关键测试通过数
   */
  getCriticalPassed(): number {
    return this._results.filter(r => {
      const scenario = this._scenarios.get(r.scenarioId);
      return r.passed && scenario?.priority === 'critical';
    }).length;
  }

  /**
   * 获取关键测试失败数
   */
  getCriticalFailed(): number {
    return this._results.filter(r => {
      const scenario = this._scenarios.get(r.scenarioId);
      return !r.passed && scenario?.priority === 'critical';
    }).length;
  }

  /**
   * 是否正在运行
   */
  isRunning(): boolean {
    return this._running;
  }

  /**
   * 停止测试
   */
  stop(): void {
    this._running = false;
  }

  /**
   * 清空结果
   */
  clearResults(): void {
    this._results = [];
  }

  /**
   * 获取当前平台信息
   */
  static getPlatformInfo(): PlatformInfo {
    return getCurrentPlatformInfo();
  }
}
