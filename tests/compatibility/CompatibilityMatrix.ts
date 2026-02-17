/**
 * 兼容矩阵管理器
 * 管理支持的浏览器/Node 版本、平台配置、测试矩阵
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import {
  CompatibilityMatrix,
  CompatibilityMatrixItem,
  PlatformConfig,
  BrowserConfig,
  CompatibilitySummary,
  CompatibilityScenario,
  SmokeTestResult,
} from './types.js';

/**
 * 默认支持的平台列表
 */
const DEFAULT_PLATFORMS: PlatformConfig[] = [
  { name: 'windows', type: 'windows', architecture: 'x64' },
  { name: 'windows', type: 'windows', architecture: 'arm64' },
  { name: 'macos', type: 'macos', architecture: 'x64' },
  { name: 'macos', type: 'macos', architecture: 'arm64' },
  { name: 'linux', type: 'linux', architecture: 'x64' },
  { name: 'linux', type: 'linux', architecture: 'arm64' },
];

/**
 * 默认支持的浏览器列表
 */
const DEFAULT_BROWSERS: BrowserConfig[] = [
  { name: 'chrome', version: '>=120', platform: 'windows' },
  { name: 'chrome', version: '>=120', platform: 'macos' },
  { name: 'chrome', version: '>=120', platform: 'linux' },
  { name: 'firefox', version: '>=121', platform: 'windows' },
  { name: 'firefox', version: '>=121', platform: 'macos' },
  { name: 'firefox', version: '>=121', platform: 'linux' },
  { name: 'safari', version: '>=17', platform: 'macos' },
  { name: 'edge', version: '>=120', platform: 'windows' },
];

/**
 * 兼容矩阵管理器
 */
export class CompatibilityMatrix {
  private _matrix: CompatibilityMatrix;
  private _scenarios: Map<string, CompatibilityScenario> = new Map();
  private _storagePath: string;

  constructor(storagePath?: string) {
    this._storagePath = storagePath || './tests/compatibility-results';
    this._matrix = this._createEmptyMatrix();
  }

  /**
   * 创建空的兼容矩阵
   */
  private _createEmptyMatrix(): CompatibilityMatrix {
    return {
      version: '1.0.0',
      generatedAt: Date.now(),
      platforms: [...DEFAULT_PLATFORMS],
      browsers: [...DEFAULT_BROWSERS],
      items: [],
      summary: {
        totalScenarios: 0,
        totalPlatforms: DEFAULT_PLATFORMS.length,
        totalBrowsers: DEFAULT_BROWSERS.length,
        passed: 0,
        failed: 0,
        skipped: 0,
        passRate: 0,
        criticalPassed: 0,
        criticalFailed: 0,
      },
    };
  }

  /**
   * 添加测试场景
   */
  addScenario(scenario: CompatibilityScenario): void {
    this._scenarios.set(scenario.id, scenario);
    this._updateMatrixItems();
  }

  /**
   * 批量添加测试场景
   */
  addScenarios(scenarios: CompatibilityScenario[]): void {
    scenarios.forEach(scenario => this.addScenario(scenario));
  }

  /**
   * 更新矩阵项
   */
  private _updateMatrixItems(): void {
    const items: CompatibilityMatrixItem[] = [];
    
    for (const scenario of this._scenarios.values()) {
      for (const platformType of scenario.platforms) {
        // 平台兼容性
        const platformItem: CompatibilityMatrixItem = {
          scenarioId: scenario.id,
          scenarioName: scenario.name,
          platform: platformType,
          supported: true,
          lastTested: 0,
          results: [],
        };
        
        items.push(platformItem);

        // 浏览器兼容性（如果配置了浏览器）
        if (scenario.browsers && scenario.browsers.length > 0) {
          for (const browser of scenario.browsers) {
            if (browser.platform === platformType) {
              const browserItem: CompatibilityMatrixItem = {
                scenarioId: scenario.id,
                scenarioName: scenario.name,
                platform: platformType,
                browser: browser.name,
                browserVersion: browser.version,
                supported: true,
                lastTested: 0,
                results: [],
              };
              
              items.push(browserItem);
            }
          }
        }
      }
    }

    this._matrix.items = items;
    this._updateSummary();
  }

  /**
   * 添加测试结果
   */
  addResult(result: SmokeTestResult): void {
    // 查找对应的矩阵项
    const item = this._matrix.items.find(item => {
      const platformMatch = item.platform === result.platform.type;
      const browserMatch = !item.browser || item.browser === result.browser?.name;
      return item.scenarioId === result.scenarioId && platformMatch && browserMatch;
    });

    if (item) {
      // 更新支持状态
      if (!result.passed) {
        item.supported = false;
      }
      
      // 添加结果记录
      item.results.push(result);
      
      // 限制结果数量（保留最近 10 条）
      if (item.results.length > 10) {
        item.results = item.results.slice(-10);
      }
      
      // 更新最后测试时间
      item.lastTested = result.timestamp;
      
      // 更新摘要
      this._updateSummary();
    }
  }

  /**
   * 批量添加测试结果
   */
  addResults(results: SmokeTestResult[]): void {
    results.forEach(result => this.addResult(result));
  }

  /**
   * 更新摘要
   */
  private _updateSummary(): void {
    const scenarios = Array.from(this._scenarios.values());
    
    // 统计通过的项
    const passedItems = this._matrix.items.filter(item => {
      const latestResult = item.results[item.results.length - 1];
      return latestResult?.passed === true;
    });
    
    const failedItems = this._matrix.items.filter(item => {
      const latestResult = item.results[item.results.length - 1];
      return latestResult?.passed === false;
    });

    // 关键测试统计
    const criticalPassed = passedItems.filter(item => {
      const scenario = this._scenarios.get(item.scenarioId);
      return scenario?.priority === 'critical';
    }).length;

    const criticalFailed = failedItems.filter(item => {
      const scenario = this._scenarios.get(item.scenarioId);
      return scenario?.priority === 'critical';
    }).length;

    this._matrix.summary = {
      totalScenarios: scenarios.length,
      totalPlatforms: this._matrix.platforms.length,
      totalBrowsers: this._matrix.browsers.length,
      passed: passedItems.length,
      failed: failedItems.length,
      skipped: this._matrix.items.length - passedItems.length - failedItems.length,
      passRate: this._matrix.items.length > 0 ? passedItems.length / this._matrix.items.length : 0,
      criticalPassed,
      criticalFailed,
    };
  }

  /**
   * 获取兼容矩阵
   */
  getMatrix(): CompatibilityMatrix {
    return { ...this._matrix };
  }

  /**
   * 获取平台配置列表
   */
  getPlatforms(): PlatformConfig[] {
    return [...this._matrix.platforms];
  }

  /**
   * 添加平台配置
   */
  addPlatform(platform: PlatformConfig): void {
    this._matrix.platforms.push(platform);
  }

  /**
   * 获取浏览器配置列表
   */
  getBrowsers(): BrowserConfig[] {
    return [...this._matrix.browsers];
  }

  /**
   * 添加浏览器配置
   */
  addBrowser(browser: BrowserConfig): void {
    this._matrix.browsers.push(browser);
  }

  /**
   * 获取兼容性摘要
   */
  getSummary(): CompatibilitySummary {
    return { ...this._matrix.summary };
  }

  /**
   * 获取特定场景的兼容性
   */
  getScenarioCompatibility(scenarioId: string): CompatibilityMatrixItem[] {
    return this._matrix.items.filter(item => item.scenarioId === scenarioId);
  }

  /**
   * 获取特定平台的兼容性
   */
  getPlatformCompatibility(platformType: string): CompatibilityMatrixItem[] {
    return this._matrix.items.filter(item => item.platform === platformType);
  }

  /**
   * 获取特定浏览器的兼容性
   */
  getBrowserCompatibility(browserType: string): CompatibilityMatrixItem[] {
    return this._matrix.items.filter(item => item.browser === browserType);
  }

  /**
   * 获取不支持的配置
   */
  getUnsupported(): CompatibilityMatrixItem[] {
    return this._matrix.items.filter(item => !item.supported);
  }

  /**
   * 保存到文件
   */
  async save(filename?: string): Promise<string> {
    const dir = this._storagePath;
    
    // 确保目录存在
    await fs.mkdir(dir, { recursive: true });
    
    // 生成文件名
    const name = filename || `compatibility-matrix-${Date.now()}.json`;
    const filepath = path.join(dir, name);
    
    // 保存矩阵
    await fs.writeFile(
      filepath,
      JSON.stringify(this._matrix, null, 2),
      'utf-8'
    );
    
    console.log(`Compatibility matrix saved to ${filepath}`);
    return filepath;
  }

  /**
   * 从文件加载
   */
  async load(filepath: string): Promise<void> {
    const content = await fs.readFile(filepath, 'utf-8');
    this._matrix = JSON.parse(content);
    console.log(`Compatibility matrix loaded from ${filepath}`);
  }

  /**
   * 重置矩阵
   */
  reset(): void {
    this._matrix = this._createEmptyMatrix();
    this._scenarios.clear();
    // 不调用 _updateMatrixItems，因为 _scenarios 已清空
  }

  /**
   * 生成兼容性报告
   */
  generateReport(): string {
    const summary = this._matrix.summary;
    const lines: string[] = [];
    
    lines.push('# Compatibility Matrix Report');
    lines.push('');
    lines.push(`Generated: ${new Date(this._matrix.generatedAt).toISOString()}`);
    lines.push('');
    
    lines.push('## Summary');
    lines.push('');
    lines.push(`- Total Scenarios: ${summary.totalScenarios}`);
    lines.push(`- Total Platforms: ${summary.totalPlatforms}`);
    lines.push(`- Total Browsers: ${summary.totalBrowsers}`);
    lines.push(`- Passed: ${summary.passed}`);
    lines.push(`- Failed: ${summary.failed}`);
    lines.push(`- Skipped: ${summary.skipped}`);
    lines.push(`- Pass Rate: ${(summary.passRate * 100).toFixed(2)}%`);
    lines.push(`- Critical Passed: ${summary.criticalPassed}`);
    lines.push(`- Critical Failed: ${summary.criticalFailed}`);
    lines.push('');
    
    // 不支持的配置
    const unsupported = this.getUnsupported();
    if (unsupported.length > 0) {
      lines.push('## Unsupported Configurations');
      lines.push('');
      for (const item of unsupported) {
        lines.push(`- ${item.scenarioName}`);
        lines.push(`  Platform: ${item.platform}`);
        if (item.browser) {
          lines.push(`  Browser: ${item.browser} ${item.browserVersion}`);
        }
        lines.push(`  Last Tested: ${new Date(item.lastTested).toISOString()}`);
        lines.push('');
      }
    }
    
    // 按平台分组
    const platforms = Array.from(
      new Set(this._matrix.items.map(item => item.platform))
    );
    
    for (const platform of platforms) {
      lines.push(`## Platform: ${platform}`);
      lines.push('');
      
      const items = this.getPlatformCompatibility(platform);
      for (const item of items) {
        const status = item.supported ? '✓' : '✗';
        const browser = item.browser ? ` / ${item.browser} ${item.browserVersion}` : '';
        lines.push(`${status} ${item.scenarioName}${browser}`);
      }
      lines.push('');
    }
    
    return lines.join('\n');
  }
}
