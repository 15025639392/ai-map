#!/usr/bin/env ts-node
/**
 * 更新 Golden Images 脚本
 * 用于更新指定的 golden images
 */

import { GoldenImageTest, TestScenario } from '../tests/golden-image/index.js';
import path from 'path';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 从配置文件加载测试场景
 */
async function loadScenarios(configPath?: string): Promise<TestScenario[]> {
  const defaultConfigPath = path.join(__dirname, '..', 'golden-image-scenarios.json');

  try {
    const scenariosPath = configPath || defaultConfigPath;
    const content = readFileSync(scenariosPath, 'utf-8');
    const config = JSON.parse(content);

    // 将配置中的函数字符串转换为实际函数（这里需要根据实际情况处理）
    // 由于 JSON 不能直接包含函数，所以这里需要特殊处理
    // 简化版本：直接返回配置对象

    return config.scenarios || [];
  } catch (error) {
    console.warn('Failed to load scenarios from config file, using built-in scenarios');
    return [];
  }
}

/**
 * 内置测试场景
 */
const builtInScenarios: TestScenario[] = [
  {
    name: 'basic-rendering',
    description: 'Basic rendering test case',
    width: 800,
    height: 600,
    setup: async () => {
      console.log('Setting up basic-rendering scenario...');
    },
    render: async () => {
      console.log('Rendering basic-rendering scenario...');
    },
    cleanup: async () => {
      console.log('Cleaning up basic-rendering scenario...');
    },
    tags: ['basic', 'rendering'],
  },
];

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const scenarioNames = args.filter(arg => !arg.startsWith('--'));
  const forceUpdate = args.includes('--force');
  const configPath = args.find(arg => arg.startsWith('--config='))?.split('=')[1];

  console.log('Starting Golden Image Update...\n');

  // 加载测试场景
  let scenarios = await loadScenarios(configPath);
  if (scenarios.length === 0) {
    scenarios = builtInScenarios;
    console.log('Using built-in scenarios\n');
  }

  // 如果指定了场景名称，只更新指定的场景
  if (scenarioNames.length > 0) {
    scenarios = scenarios.filter(s => scenarioNames.includes(s.name));
    if (scenarios.length === 0) {
      console.error(`No scenarios found matching: ${scenarioNames.join(', ')}`);
      process.exit(1);
    }
    console.log(`Updating ${scenarios.length} specified scenario(s)...\n`);
  } else {
    console.log(`Updating ${scenarios.length} scenario(s)...\n`);
  }

  // 创建测试助手
  const goldenImageTest = new GoldenImageTest({
    outputDir: path.join(process.cwd(), 'test-results', 'golden-image'),
  });

  // 初始化
  await goldenImageTest.initialize();

  // 检查哪些场景需要更新
  const manager = goldenImageTest.getManager();
  const existingImages = await manager.listGoldenImages();

  for (const scenario of scenarios) {
    const exists = existingImages.some(img => img.name === scenario.name);

    if (!exists) {
      console.log(`\nℹ Scenario "${scenario.name}" does not have a golden image yet, creating...`);
    } else if (!forceUpdate) {
      console.log(`\nℹ Scenario "${scenario.name}" already has a golden image (use --force to update)`);
      continue;
    } else {
      console.log(`\n⚠ Force updating scenario "${scenario.name}"...`);
    }

    try {
      await goldenImageTest.updateGoldenImage(scenario);
      console.log(`✓ Golden image "${scenario.name}" updated successfully`);
    } catch (error) {
      console.error(`✗ Failed to update golden image "${scenario.name}":`, error);
      process.exit(1);
    }
  }

  // 输出统计信息
  const stats = await manager.getStats();
  console.log('\n========================================');
  console.log('Golden Image Update Summary');
  console.log('========================================');
  console.log(`Total images: ${stats.total}`);
  console.log(`Total size: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log('\nBy tags:');
  Object.entries(stats.byTag).forEach(([tag, count]) => {
    console.log(`  ${tag}: ${count}`);
  });

  console.log('\n✓ Golden images updated successfully!');
}

// 运行主函数
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
