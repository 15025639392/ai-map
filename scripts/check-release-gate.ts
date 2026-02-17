#!/usr/bin/env ts-node
/**
 * 检查发布门禁脚本
 * 验证发布前是否满足所有条件
 */

import { ReleaseGate, CompatibilityMatrix } from '../tests/compatibility/index.js';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * 解析命令行参数
 */
function parseArgs() {
  const args: Record<string, any> = {};
  
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      if (value !== undefined) {
        args[key] = value;
      } else {
        args[key] = true;
      }
    } else if (arg.startsWith('-')) {
      const key = arg.slice(1);
      const nextArg = process.argv[i + 1];
      if (nextArg && !nextArg.startsWith('-')) {
        args[key] = nextArg;
        i++; // 跳过下一个参数
      } else {
        args[key] = true;
      }
    }
  }

  return args;
}

/**
 * 主函数
 */
async function main() {
  console.log('========================================');
  console.log('  Release Gate Checker');
  console.log('========================================');
  console.log();

  const args = parseArgs();
  
  // 配置
  const matrixPath = args.matrix || './tests/compatibility-results/compatibility-matrix-latest.json';
  const outputPath = args.output || './tests/compatibility-results';
  const strict = !!args.strict;
  const minCoverage = args.coverage ? parseFloat(args.coverage) : 80;
  const minCompatRate = args.compatRate ? parseFloat(args.compatRate) : 0.95;

  // 创建发布门禁验证器
  const gate = new ReleaseGate({
    minCoverage,
    minCompatibilityRate: minCompatRate,
    requiredPlatforms: ['windows', 'macos', 'linux'],
    requiredBrowsers: ['chrome', 'firefox'],
    maxLatency: 100,
    maxErrorRate: 0.01,
    strict,
  });

  // 加载兼容矩阵
  let matrix: CompatibilityMatrix;
  try {
    const content = await fs.readFile(matrixPath, 'utf-8');
    matrix = JSON.parse(content);
    console.log(`✓ Loaded compatibility matrix from ${matrixPath}`);
    console.log();
  } catch (error) {
    console.error(`Failed to load compatibility matrix from ${matrixPath}:`);
    console.error((error as Error).message);
    console.log();
    console.log('Tip: Run compatibility tests first:');
    console.log('  npm run test:compatibility-run');
    process.exit(1);
  }

  // 验证发布门禁
  console.log('Running release gate checks...');
  console.log();
  
  const result = await gate.validateCompatibility(matrix);

  // 生成并输出报告
  console.log(gate.generateReport());
  console.log();
  console.log('========================================');
  console.log('  Result');
  console.log('========================================');
  
  if (result.overallPassed) {
    console.log('✓ Release gate passed');
    console.log();
    console.log('Summary:');
    console.log(`  Total Checks: ${result.summary.total}`);
    console.log(`  Passed: ${result.summary.passed}`);
    console.log(`  Failed: ${result.summary.failed}`);
    console.log(`  Critical Failed: ${result.summary.criticalFailed}`);
    console.log();
    console.log('Recommendations:');
    if (result.recommendations.length > 0) {
      result.recommendations.forEach(rec => console.log(`  - ${rec}`));
    } else {
      console.log('  No recommendations');
    }
    console.log();
    
    // 保存报告
    const reportPath = await gate.saveReport(path.join(outputPath, `release-gate-${Date.now()}.txt`));
    console.log(`✓ Report saved to ${reportPath}`);
    console.log();
    
    process.exit(0);
  } else {
    console.log('✗ Release gate failed');
    console.log();
    console.log('Summary:');
    console.log(`  Total Checks: ${result.summary.total}`);
    console.log(`  Passed: ${result.summary.passed}`);
    console.log(`  Failed: ${result.summary.failed}`);
    console.log(`  Critical Failed: ${result.summary.criticalFailed}`);
    console.log();
    console.log('Failed Checks:');
    const failedChecks = result.checks.filter(c => !c.passed);
    failedChecks.forEach(check => {
      const critical = check.critical ? ' [CRITICAL]' : '';
      console.log(`  ✗ ${check.name}${critical}`);
      console.log(`    ${check.message}`);
    });
    console.log();
    
    if (result.recommendations.length > 0) {
      console.log('Recommendations:');
      result.recommendations.forEach(rec => console.log(`  - ${rec}`));
      console.log();
    }
    
    // 保存报告
    const reportPath = await gate.saveReport(path.join(outputPath, `release-gate-${Date.now()}.txt`));
    console.log(`✓ Report saved to ${reportPath}`);
    console.log();
    
    console.log('Action required before release:');
    console.log('  1. Review and fix failed checks');
    console.log('  2. Re-run compatibility tests');
    console.log('  3. Check release gate again');
    console.log();
    
    process.exit(1);
  }
}

// 运行主函数
main();
