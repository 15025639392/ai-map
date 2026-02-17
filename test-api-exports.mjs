// 测试所有 API 导出
console.log('Testing API exports...\n');

async function testImports() {
  const results = [];

  // 测试核心渲染器
  try {
    const { Renderer } = await import('./lib/index.js');
    results.push({ module: 'Renderer', success: true, type: typeof Renderer });
  } catch (error) {
    results.push({ module: 'Renderer', success: false, error: error.message });
  }

  try {
    const { Layer } = await import('./lib/index.js');
    results.push({ module: 'Layer', success: true, type: typeof Layer });
  } catch (error) {
    results.push({ module: 'Layer', success: false, error: error.message });
  }

  try {
    const { RenderPipeline } = await import('./lib/index.js');
    results.push({ module: 'RenderPipeline', success: true, type: typeof RenderPipeline });
  } catch (error) {
    results.push({ module: 'RenderPipeline', success: false, error: error.message });
  }

  try {
    const { ResourceManager } = await import('./lib/index.js');
    results.push({ module: 'ResourceManager', success: true, type: typeof ResourceManager });
  } catch (error) {
    results.push({ module: 'ResourceManager', success: false, error: error.message });
  }

  try {
    const { Handler } = await import('./lib/index.js');
    results.push({ module: 'Handler', success: true, type: typeof Handler });
  } catch (error) {
    results.push({ module: 'Handler', success: false, error: error.message });
  }

  // 测试图层类型
  try {
    const { LayerState } = await import('./lib/index.js');
    results.push({ module: 'LayerState', success: true, type: typeof LayerState });
  } catch (error) {
    results.push({ module: 'LayerState', success: false, error: error.message });
  }

  try {
    const { RenderPhase } = await import('./lib/index.js');
    results.push({ module: 'RenderPhase', success: true, type: typeof RenderPhase });
  } catch (error) {
    results.push({ module: 'RenderPhase', success: false, error: error.message });
  }

  // 测试矢量图层
  try {
    const { VectorLayer } = await import('./lib/index.js');
    results.push({ module: 'VectorLayer', success: true, type: typeof VectorLayer });
  } catch (error) {
    results.push({ module: 'VectorLayer', success: false, error: error.message });
  }

  // 测试栅格图层
  try {
    const { RasterLayer } = await import('./lib/index.js');
    results.push({ module: 'RasterLayer', success: true, type: typeof RasterLayer });
  } catch (error) {
    results.push({ module: 'RasterLayer', success: false, error: error.message });
  }

  // 测试控件
  try {
    const { EventBus } = await import('./lib/index.js');
    results.push({ module: 'EventBus', success: true, type: typeof EventBus });
  } catch (error) {
    results.push({ module: 'EventBus', success: false, error: error.message });
  }

  try {
    const { PerformanceMonitor } = await import('./lib/index.js');
    results.push({ module: 'PerformanceMonitor', success: true, type: typeof PerformanceMonitor });
  } catch (error) {
    results.push({ module: 'PerformanceMonitor', success: false, error: error.message });
  }

  try {
    const { NavigationControl } = await import('./lib/index.js');
    results.push({ module: 'NavigationControl', success: true, type: typeof NavigationControl });
  } catch (error) {
    results.push({ module: 'NavigationControl', success: false, error: error.message });
  }

  try {
    const { QueryControl } = await import('./lib/index.js');
    results.push({ module: 'QueryControl', success: true, type: typeof QueryControl });
  } catch (error) {
    results.push({ module: 'QueryControl', success: false, error: error.message });
  }

  try {
    const { LayerManager } = await import('./lib/index.js');
    results.push({ module: 'LayerManager', success: true, type: typeof LayerManager });
  } catch (error) {
    results.push({ module: 'LayerManager', success: false, error: error.message });
  }

  // 测试编辑功能
  try {
    const { EditController } = await import('./lib/index.js');
    results.push({ module: 'EditController', success: true, type: typeof EditController });
  } catch (error) {
    results.push({ module: 'EditController', success: false, error: error.message });
  }

  try {
    const { UndoRedoManager } = await import('./lib/index.js');
    results.push({ module: 'UndoRedoManager', success: true, type: typeof UndoRedoManager });
  } catch (error) {
    results.push({ module: 'UndoRedoManager', success: false, error: error.message });
  }

  // 测试瓦片管理
  try {
    const { TileQueue } = await import('./lib/index.js');
    results.push({ module: 'TileQueue', success: true, type: typeof TileQueue });
  } catch (error) {
    results.push({ module: 'TileQueue', success: false, error: error.message });
  }

  try {
    const { TileRequestManager } = await import('./lib/index.js');
    results.push({ module: 'TileRequestManager', success: true, type: typeof TileRequestManager });
  } catch (error) {
    results.push({ module: 'TileRequestManager', success: false, error: error.message });
  }

  try {
    const { TileStats } = await import('./lib/index.js');
    results.push({ module: 'TileStats', success: true, type: typeof TileStats });
  } catch (error) {
    results.push({ module: 'TileStats', success: false, error: error.message });
  }

  // 打印结果
  console.log('Import Test Results:\n');
  console.log('='.repeat(60));

  let successCount = 0;
  let failCount = 0;

  results.forEach(result => {
    if (result.success) {
      console.log(`✅ ${result.module.padEnd(25)} ${result.type}`);
      successCount++;
    } else {
      console.log(`❌ ${result.module.padEnd(25)} ${result.error}`);
      failCount++;
    }
  });

  console.log('='.repeat(60));
  console.log(`Total: ${results.length}`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`Success Rate: ${((successCount / results.length) * 100).toFixed(1)}%`);

  if (failCount === 0) {
    console.log('\n🎉 All exports are working correctly!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some exports are failing. Please check the errors above.');
    process.exit(1);
  }
}

testImports();
