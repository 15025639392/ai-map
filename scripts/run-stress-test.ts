#!/usr/bin/env ts-node
/**
 * 运行压力测试脚本
 * 提供命令行接口运行压力测试
 */

import { StressTestRunner } from '../tests/stress-test/index.js';
import {
  StressScenario,
  LoadPattern,
  STRESS_TEST_TARGETS,
} from '../tests/stress-test/types.js';

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
 * 创建模拟请求函数
 */
function createMockRequestFn(scenario: StressScenario) {
  return async (requestId: number): Promise<void> => {
    // 模拟不同的请求类型
    switch (scenario) {
      case StressScenario.RENDERING:
        // 模拟渲染操作
        await new Promise(resolve => setTimeout(resolve, 1 + Math.random() * 5));
        break;
      case StressScenario.TILE_LOADING:
        // 模拟瓦片加载
        await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 50));
        break;
      case StressScenario.API_CALLS:
        // 模拟 API 调用
        await new Promise(resolve => setTimeout(resolve, 1 + Math.random() * 3));
        break;
      case StressScenario.MIXED:
      default:
        // 模拟混合操作
        const operations = [1, 10, 2, 5];
        const delay = operations[requestId % operations.length] + Math.random() * 10;
        await new Promise(resolve => setTimeout(resolve, delay));
        break;
    }
  };
}

/**
 * 主函数
 */
async function main() {
  const opts = parseArgs();

  console.log('========================================');
  console.log('Stress Test Runner');
  console.log('========================================\n');

  // 解析场景
  const scenarioMap: Record<string, StressScenario> = {
    'rendering': StressScenario.RENDERING,
    'tile_loading': StressScenario.TILE_LOADING,
    'api_calls': StressScenario.API_CALLS,
    'mixed': StressScenario.MIXED,
  };
  const scenario = scenarioMap[opts.scenario] || StressScenario.MIXED;

  // 解析负载模式
  const patternMap: Record<string, LoadPattern> = {
    'constant': LoadPattern.CONSTANT,
    'ramp_up': LoadPattern.RAMP_UP,
    'spike': LoadPattern.SPIKE,
    'sine_wave': LoadPattern.SINE_WAVE,
    'random': LoadPattern.RANDOM,
  };
  const pattern = patternMap[opts.pattern] || LoadPattern.CONSTANT;

  // 解析 QPS
  const qps = parseInt(opts.qps, 10);
  const duration = parseInt(opts.duration, 10);

  // 创建测试运行器
  const runner = new StressTestRunner(
    {
      pattern,
      targetQPS: qps,
      duration,
      rampUpDuration: opts.rampUp ? parseInt(opts.rampUp, 10) : undefined,
      minQPS: opts.minQps ? parseInt(opts.minQps, 10) : undefined,
      maxQPS: opts.maxQps ? parseInt(opts.maxQps, 10) : undefined,
    },
    {
      samplingInterval: 1000,
      alertThresholds: {
        cpuUsage: 0.9,
        memoryUsage: 0.9,
        latency: 1000,
        errorRate: 0.05,
      },
      enableProfiling: true,
    }
  );

  // 创建请求函数
  const requestFn = createMockRequestFn(scenario);

  try {
    let result;

    if (opts.stability) {
      // 运行 8 小时稳定性测试
      console.log(`\n🚀 Running 8-hour stability test`);
      console.log(`   Scenario: ${scenario}`);
      console.log(`   Target: ${qps} QPS`);
      console.log(`   Report interval: ${opts.reportInterval} minutes\n`);

      result = await runner.runStabilityTest(scenario, requestFn, {
        qps,
        duration,
        reportInterval: parseInt(opts.reportInterval, 10) * 60 * 1000,
      });
    } else if (opts.quick) {
      // 运行快速测试
      console.log(`\n⚡ Running quick test`);
      console.log(`   Scenario: ${scenario}`);
      console.log(`   QPS: ${qps}`);
      console.log(`   Duration: 60 seconds\n`);

      result = await runner.runQuickTest(scenario, requestFn, {
        qps,
        duration: 60,
      });
    } else {
      // 运行标准测试
      console.log(`\n🎯 Running stress test`);
      console.log(`   Scenario: ${scenario}`);
      console.log(`   QPS: ${qps}`);
      console.log(`   Duration: ${duration}s (${(duration / 60).toFixed(1)}min)`);
      console.log(`   Pattern: ${pattern}\n`);

      result = await runner.run(scenario, requestFn);
    }

    // 生成报告
    console.log(`\n✅ Test completed!`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Duration: ${result.duration}s`);
    console.log(`   Total requests: ${result.summary.totalRequests.toLocaleString()}`);
    console.log(`   Success rate: ${((result.summary.successfulRequests / result.summary.totalRequests) * 100).toFixed(2)}%`);
    console.log(`   Avg QPS: ${result.summary.avgQPS.toFixed(0)}`);
    console.log(`   P95 Latency: ${result.summary.p95Latency.toFixed(2)}ms`);

    // 保存报告
    const reportPath = await runner.generateReport(result, opts.output);
    console.log(`\n📊 Report saved to: ${reportPath}`);

    // 判断测试是否通过
    if (result.status === 'failed') {
      console.log('\n⚠️  Test FAILED!');
      console.log(`   Error rate: ${(result.summary.errorRate * 100).toFixed(2)}%`);
      console.log(`   Alerts: ${result.alerts.length}`);
      process.exit(1);
    } else {
      console.log('\n✅ Test PASSED!');
    }

  } catch (error: any) {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  } finally {
    runner.dispose();
  }
}

// 运行主函数
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
