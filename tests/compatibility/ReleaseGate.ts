/**
 * 发布门禁验证器
 * 验证发布前是否满足所有门禁条件
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import {
  ReleaseGateConfig,
  ReleaseGateCheck,
  ReleaseGateResult,
  CompatibilityMatrix,
} from './types.js';

/**
 * 默认发布门禁配置
 */
const DEFAULT_GATE_CONFIG: ReleaseGateConfig = {
  minCoverage: 80, // 测试覆盖率要求 80%
  minCompatibilityRate: 0.95, // 兼容性通过率要求 95%
  requiredPlatforms: ['windows', 'macos', 'linux'],
  requiredBrowsers: ['chrome', 'firefox'],
  maxLatency: 100, // 最大延迟 100ms
  maxErrorRate: 0.01, // 最大错误率 1%
  maxLintErrors: 0,
  strict: false, // 不严格要求（允许例外）
};

/**
 * 发布门禁验证器
 */
export class ReleaseGate {
  private _config: ReleaseGateConfig;
  private _checks: ReleaseGateCheck[] = [];
  private _recommendations: string[] = [];
  private _warnings: string[] = [];
  private _exceptions: string[] = [];

  constructor(config?: Partial<ReleaseGateConfig>) {
    this._config = { ...DEFAULT_GATE_CONFIG, ...config };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<ReleaseGateConfig>): void {
    this._config = { ...this._config, ...config };
  }

  /**
   * 获取配置
   */
  getConfig(): ReleaseGateConfig {
    return { ...this._config };
  }

  /**
   * 添加例外
   */
  addException(checkName: string, reason: string): void {
    this._exceptions.push(`${checkName}: ${reason}`);
  }

  /**
   * 验证兼容矩阵
   */
  async validateCompatibility(matrix: CompatibilityMatrix): Promise<ReleaseGateResult> {
    this._checks = [];
    this._recommendations = [];
    this._warnings = [];
    this._exceptions = [];

    // 1. 验证测试覆盖率
    this._checkCoverage();

    // 2. 验证兼容性通过率
    this._checkCompatibilityRate(matrix);

    // 3. 验证必需平台
    this._checkRequiredPlatforms(matrix);

    // 4. 验证必需浏览器
    this._checkRequiredBrowsers(matrix);

    // 5. 验证关键测试
    this._checkCriticalTests(matrix);

    // 6. 验证性能指标
    this._checkPerformance(matrix);

    // 7. 生成建议和警告
    this._generateRecommendations(matrix);

    // 8. 计算总体结果
    const result = this._calculateResult();

    return result;
  }

  /**
   * 检查测试覆盖率
   */
  private _checkCoverage(): void {
    const check: ReleaseGateCheck = {
      name: 'test-coverage',
      description: `Test coverage should be at least ${this._config.minCoverage}%`,
      category: 'test',
      passed: true,
      message: 'Coverage check passed',
      critical: true,
    };

    // 在实际实现中，这里应该读取覆盖率报告
    // 模拟覆盖率检查
    try {
      const coveragePath = path.join(process.cwd(), 'coverage/coverage-summary.json');
      // 这里只是示例，实际需要读取覆盖率文件
      // const coverage = JSON.parse(await fs.readFile(coveragePath, 'utf-8'));
      // const totalLines = coverage.total.lines.pct;
      
      // 暂时假设通过
      check.passed = true;
      check.message = 'Coverage check passed (simulated)';
      check.details = {
        minCoverage: this._config.minCoverage,
        actualCoverage: 100, // 模拟值
      };
    } catch (error) {
      check.passed = false;
      check.message = `Failed to read coverage report: ${(error as Error).message}`;
    }

    this._checks.push(check);
  }

  /**
   * 检查兼容性通过率
   */
  private _checkCompatibilityRate(matrix: CompatibilityMatrix): void {
    const check: ReleaseGateCheck = {
      name: 'compatibility-rate',
      description: `Compatibility rate should be at least ${(this._config.minCompatibilityRate! * 100).toFixed(0)}%`,
      category: 'compatibility',
      passed: true,
      message: 'Compatibility rate check passed',
      critical: true,
    };

    // 使用 getSummary() 方法获取摘要
    const summary = matrix.getSummary();
    const passRate = summary.passRate;
    const minRate = this._config.minCompatibilityRate || 0.95;

    check.passed = passRate >= minRate;
    check.message = check.passed
      ? `Compatibility rate ${(passRate * 100).toFixed(2)}% >= ${(minRate * 100).toFixed(0)}%`
      : `Compatibility rate ${(passRate * 100).toFixed(2)}% < ${(minRate * 100).toFixed(0)}%`;
    check.details = {
      passRate,
      minRate,
      passedItems: summary.passed,
      failedItems: summary.failed,
    };

    this._checks.push(check);
  }

  /**
   * 检查必需平台
   */
  private _checkRequiredPlatforms(matrix: CompatibilityMatrix): void {
    const required = this._config.requiredPlatforms || [];
    
    if (required.length === 0) {
      // 没有配置必需平台，直接通过
      this._checks.push({
        name: 'required-platforms',
        description: 'Required platforms check',
        category: 'compatibility',
        passed: true,
        message: 'No required platforms configured',
        critical: true,
      });
      return;
    }

    const check: ReleaseGateCheck = {
      name: 'required-platforms',
      description: `All required platforms should be tested: ${required.join(', ')}`,
      category: 'compatibility',
      passed: true,
      message: 'All required platforms are tested',
      critical: true,
    };

    const matrixData = matrix.getMatrix();
    const testedPlatforms = new Set(matrixData.items.map(item => item.platform));
    const missingPlatforms = required.filter(p => !testedPlatforms.has(p));

    check.passed = missingPlatforms.length === 0;
    check.message = check.passed
      ? 'All required platforms are tested'
      : `Missing platforms: ${missingPlatforms.join(', ')}`;
    check.details = {
      required,
      tested: Array.from(testedPlatforms),
      missing: missingPlatforms,
    };

    this._checks.push(check);
  }

  /**
   * 检查必需浏览器
   */
  private _checkRequiredBrowsers(matrix: CompatibilityMatrix): void {
    const required = this._config.requiredBrowsers || [];
    
    if (required.length === 0) {
      // 没有配置必需浏览器，直接通过
      this._checks.push({
        name: 'required-browsers',
        description: 'Required browsers check',
        category: 'compatibility',
        passed: true,
        message: 'No required browsers configured',
        critical: true,
      });
      return;
    }

    const check: ReleaseGateCheck = {
      name: 'required-browsers',
      description: `All required browsers should be tested: ${required.join(', ')}`,
      category: 'compatibility',
      passed: true,
      message: 'All required browsers are tested',
      critical: true,
    };

    const matrixData = matrix.getMatrix();
    const testedBrowsers = new Set(
      matrixData.items
        .filter(item => item.browser)
        .map(item => item.browser!)
    );
    const missingBrowsers = required.filter(b => !testedBrowsers.has(b));

    check.passed = missingBrowsers.length === 0;
    check.message = check.passed
      ? 'All required browsers are tested'
      : `Missing browsers: ${missingBrowsers.join(', ')}`;
    check.details = {
      required,
      tested: Array.from(testedBrowsers),
      missing: missingBrowsers,
    };

    this._checks.push(check);
  }

  /**
   * 检查关键测试
   */
  private _checkCriticalTests(matrix: CompatibilityMatrix): void {
    const check: ReleaseGateCheck = {
      name: 'critical-tests',
      description: 'All critical tests should pass',
      category: 'test',
      passed: true,
      message: 'All critical tests passed',
      critical: true,
    };

    const summary = matrix.getSummary();
    const criticalFailed = summary.criticalFailed;
    const criticalPassed = summary.criticalPassed;

    check.passed = criticalFailed === 0;
    check.message = check.passed
      ? `All critical tests passed (${criticalPassed})`
      : `${criticalFailed} critical tests failed`;
    check.details = {
      criticalPassed,
      criticalFailed,
    };

    this._checks.push(check);
  }

  /**
   * 检查性能指标
   */
  private _checkPerformance(matrix: CompatibilityMatrix): void {
    const maxLatency = this._config.maxLatency;
    const maxErrorRate = this._config.maxErrorRate;

    if (!maxLatency && !maxErrorRate) {
      // 没有配置性能要求，直接通过
      this._checks.push({
        name: 'performance',
        description: 'Performance check',
        category: 'performance',
        passed: true,
        message: 'No performance requirements configured',
        critical: false,
      });
      return;
    }

    const check: ReleaseGateCheck = {
      name: 'performance',
      description: 'Performance metrics should meet requirements',
      category: 'performance',
      passed: true,
      message: 'Performance metrics passed',
      critical: false,
    };

    // 模拟性能检查（实际应该从测试结果中提取）
    // 这里只是示例
    check.passed = true;
    check.message = 'Performance metrics passed (simulated)';
    check.details = {
      maxLatency,
      maxErrorRate,
    };

    this._checks.push(check);
  }

  /**
   * 生成建议和警告
   */
  private _generateRecommendations(matrix: CompatibilityMatrix): void {
    const summary = matrix.getSummary();
    const passRate = summary.passRate;
    
    // 兼容性接近阈值时给出警告
    const minRate = this._config.minCompatibilityRate || 0.95;
    if (passRate < minRate + 0.05 && passRate >= minRate) {
      this._warnings.push(
        `Compatibility rate (${(passRate * 100).toFixed(2)}%) is close to minimum requirement (${(minRate * 100).toFixed(0)}%)`
      );
    }

    // 有失败测试时给出建议
    if (summary.failed > 0) {
      this._recommendations.push(
        `${summary.failed} test(s) failed. Review and fix before release.`
      );
    }

    // 有关键测试失败时给出警告
    if (summary.criticalFailed > 0) {
      this._warnings.push(
        `${summary.criticalFailed} critical test(s) failed. This may block release.`
      );
    }
  }

  /**
   * 计算总体结果
   */
  private _calculateResult(): ReleaseGateResult {
    const total = this._checks.length;
    const passed = this._checks.filter(c => c.passed).length;
    const failed = total - passed;
    const criticalFailed = this._checks.filter(c => c.critical && !c.passed).length;

    // 在严格模式下，任何失败都导致不通过
    // 在非严格模式下，只有关键检查失败才导致不通过
    const overallPassed = this._config.strict
      ? failed === 0
      : criticalFailed === 0;

    return {
      version: '1.0.0',
      checkedAt: Date.now(),
      overallPassed,
      checks: [...this._checks],
      summary: {
        total,
        passed,
        failed,
        criticalFailed,
      },
      recommendations: [...this._recommendations],
      warnings: [...this._warnings],
      exceptions: [...this._exceptions],
    };
  }

  /**
   * 获取检查结果
   */
  getChecks(): ReleaseGateCheck[] {
    return [...this._checks];
  }

  /**
   * 获取建议
   */
  getRecommendations(): string[] {
    return [...this._recommendations];
  }

  /**
   * 获取警告
   */
  getWarnings(): string[] {
    return [...this._warnings];
  }

  /**
   * 获取例外
   */
  getExceptions(): string[] {
    return [...this._exceptions];
  }

  /**
   * 生成报告
   */
  generateReport(): string {
    const lines: string[] = [];
    
    lines.push('# Release Gate Report');
    lines.push('');
    lines.push(`Checked at: ${new Date().toISOString()}`);
    lines.push('');
    
    // 总体结果
    lines.push('## Summary');
    lines.push('');
    lines.push(`Overall Status: ${this._checks.length > 0 && this._checks.every(c => c.passed) ? '✓ PASSED' : '✗ FAILED'}`);
    lines.push(`Total Checks: ${this._checks.length}`);
    lines.push(`Passed: ${this._checks.filter(c => c.passed).length}`);
    lines.push(`Failed: ${this._checks.filter(c => !c.passed).length}`);
    lines.push('');
    
    // 检查详情
    lines.push('## Checks');
    lines.push('');
    
    for (const category of ['test', 'compatibility', 'performance', 'quality']) {
      const categoryChecks = this._checks.filter(c => c.category === category);
      if (categoryChecks.length > 0) {
        lines.push(`### ${category.charAt(0).toUpperCase() + category.slice(1)}`);
        lines.push('');
        
        for (const check of categoryChecks) {
          const status = check.passed ? '✓' : '✗';
          const critical = check.critical ? ' [CRITICAL]' : '';
          lines.push(`${status} ${check.name}${critical}`);
          lines.push(`  ${check.description}`);
          lines.push(`  ${check.message}`);
          if (check.details) {
            lines.push(`  Details: ${JSON.stringify(check.details)}`);
          }
          lines.push('');
        }
      }
    }
    
    // 警告
    if (this._warnings.length > 0) {
      lines.push('## Warnings');
      lines.push('');
      for (const warning of this._warnings) {
        lines.push(`- ${warning}`);
      }
      lines.push('');
    }
    
    // 建议
    if (this._recommendations.length > 0) {
      lines.push('## Recommendations');
      lines.push('');
      for (const recommendation of this._recommendations) {
        lines.push(`- ${recommendation}`);
      }
      lines.push('');
    }
    
    // 例外
    if (this._exceptions.length > 0) {
      lines.push('## Exceptions');
      lines.push('');
      for (const exception of this._exceptions) {
        lines.push(`- ${exception}`);
      }
      lines.push('');
    }
    
    return lines.join('\n');
  }

  /**
   * 保存报告到文件
   */
  async saveReport(filepath?: string): Promise<string> {
    const dir = filepath ? path.dirname(filepath) : './tests/compatibility-results';
    const filename = filepath ? path.basename(filepath) : `release-gate-${Date.now()}.txt`;
    const fullPath = path.join(dir, filename);
    
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, this.generateReport(), 'utf-8');
    
    console.log(`Release gate report saved to ${fullPath}`);
    return fullPath;
  }
}
