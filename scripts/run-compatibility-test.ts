#!/usr/bin/env ts-node
/**
 * 运行兼容性测试脚本
 * 提供命令行接口运行兼容性测试
 */

import { SmokeTestRunner, CompatibilityMatrix } from '../tests/compatibility/index.js';
import { CompatibilityScenario, PlatformConfig, BrowserConfig } from '../tests/compatibility/types.js';

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
 * 创建示例测试场景
 */
function createExampleScenarios(): CompatibilityScenario[] {
  const scenarios: CompatibilityScenario[] = [
    {
      id: 'webgl2-support',
      name: 'WebGL2 Support',
      description: 'Verify WebGL2 context creation and basic rendering',
      platforms: ['windows', 'macos', 'linux'],
      priority: 'critical',
      timeout: 5000,
      testFunction: async () => {
        // 模拟 WebGL2 支持测试
        await new Promise(resolve => setTimeout(resolve, 100));
        return { passed: true, details: { webgl2: true } };
      },
    },
    {
      id: 'basic-rendering',
      name: 'Basic Rendering',
      description: 'Verify basic rendering functionality',
      platforms: ['windows', 'macos', 'linux'],
      priority: 'critical',
      timeout: 5000,
      testFunction: async () => {
        // 模拟基础渲染测试
        await new Promise(resolve => setTimeout(resolve, 150));
        return { passed: true, details: { rendered: true } };
      },
    },
    {
      id: 'layer-creation',
      name: 'Layer Creation',
      description: 'Verify layer creation and management',
      platforms: ['windows', 'macos', 'linux'],
      priority: 'high',
      timeout: 3000,
      testFunction: async () => {
        // 模拟图层创建测试
        await new Promise(resolve => setTimeout(resolve, 80));
        return { passed: true, details: { layers: ['tile', 'vector', 'raster'] } };
      },
    },
    {
      id: 'tile-loading',
      name: 'Tile Loading',
      description: 'Verify tile loading functionality',
      platforms: ['windows', 'macos', 'linux'],
      priority: 'high',
      timeout: 5000,
      testFunction: async () => {
        // 模拟瓦片加载测试
        await new Promise(resolve => setTimeout(resolve, 200));
        return { passed: true, details: { tilesLoaded: 10 } };
      },
    },
    {
      id: 'interaction',
      name: 'User Interaction',
      description: 'Verify user interaction handling',
      platforms: ['windows', 'macos', 'linux'],
      priority: 'medium',
      timeout: 3000,
      testFunction: async () => {
        // 模拟用户交互测试
        await new Promise(resolve => setTimeout(resolve, 50));
        return { passed: true, details: { interactions: ['zoom', 'pan', 'rotate'] } };
      },
    },
    {
      id: 'performance',
      name: 'Performance Check',
      description: 'Verify performance metrics',
      platforms: ['windows', 'macos', 'linux'],
      priority: 'medium',
      timeout: 3000,
      testFunction: async () => {
        // 模拟性能检查测试
        await new Promise(resolve => setTimeout(resolve, 120));
        return { passed: true, details: { fps: 60, latency: 16 } };
      },
    },
  ];

  return scenarios;
}

/**
 * 主函数
 */
async function main() {
  console.log('========================================');
  console.log('  Compatibility Test Runner');
  console.log('========================================');
  console.log();

  const args = parseArgs();
  
  // 配置
  const timeout = args.timeout ? parseInt(args.timeout) : 30000;
  const retries = args.retries ? parseInt(args.retries) : 0;
  const parallel = !!args.parallel;
  const outputPath = args.output || './tests/compatibility-results';
  
  // 创建运行器
  const runner = new SmokeTestRunner({
    timeout,
    retries,
    parallel,
  });
  
  // 创建兼容矩阵
  const matrix = new CompatibilityMatrix(outputPath);
  
  // 添加测试场景
  const scenarios = createExampleScenarios();
  runner.addScenarios(scenarios);
  matrix.addScenarios(scenarios);
  
  console.log(`Loaded ${scenarios.length} test scenarios`);
  console.log(`Platform: ${SmokeTestRunner.getPlatformInfo().platform}`);
  console.log();
  
  try {
    // 运行测试
    const results = await runner.run();
    
    // 添加结果到矩阵
    matrix.addResults(results);
    
    // 保存兼容矩阵
    const matrixFile = await matrix.save();
    console.log();
    console.log('✓ Compatibility matrix saved');
    
    // 生成报告
    const report = matrix.generateReport();
    const reportFile = `${outputPath}/compatibility-report-${Date.now()}.txt`;
    const fs = await import('fs/promises');
    await fs.mkdir(outputPath, { recursive: true });
    await fs.writeFile(reportFile, report, 'utf-8');
    console.log('✓ Compatibility report saved');
    
    // 输出摘要
    const summary = matrix.getSummary();
    console.log();
    console.log('========================================');
    console.log('  Summary');
    console.log('========================================');
    console.log(`Total Scenarios: ${summary.totalScenarios}`);
    console.log(`Passed: ${summary.passed}`);
    console.log(`Failed: ${summary.failed}`);
    console.log(`Skipped: ${summary.skipped}`);
    console.log(`Pass Rate: ${(summary.passRate * 100).toFixed(2)}%`);
    console.log(`Critical Passed: ${summary.criticalPassed}`);
    console.log(`Critical Failed: ${summary.criticalFailed}`);
    console.log('========================================');
    
    // 返回退出码
    const allPassed = results.every(r => r.passed);
    const criticalFailed = summary.criticalFailed > 0;
    
    if (!allPassed || criticalFailed) {
      console.log();
      console.log('✗ Some tests failed');
      process.exit(1);
    } else {
      console.log();
      console.log('✓ All tests passed');
      process.exit(0);
    }
  } catch (error) {
    console.error('Error running compatibility tests:', error);
    process.exit(1);
  }
}

// 运行主函数
main();
