// Test ES Module import of RasterLayer
import { RasterLayer, VectorLayer, Renderer, Layer } from './lib/index.js';

console.log('Testing RasterLayer import...');
console.log('✓ Renderer:', typeof Renderer);
console.log('✓ Layer:', typeof Layer);
console.log('✓ RasterLayer:', typeof RasterLayer);
console.log('✓ VectorLayer:', typeof VectorLayer);

// Test creating RasterLayer instance
try {
    const rasterLayer = new RasterLayer({
        name: 'Test Layer',
        tileUrl: 'https://example.com/tiles/{z}/{x}/{y}.png',
        minZoom: 1,
        maxZoom: 18,
        zoom: 10
    });

    console.log('\n✓ RasterLayer instance created successfully!');
    console.log('  Name:', rasterLayer.name);
    console.log('  Tile URL:', rasterLayer.getTileUrl());
    console.log('  Zoom:', rasterLayer.getZoom());
    console.log('  Min Zoom:', rasterLayer.getMinZoom());
    console.log('  Max Zoom:', rasterLayer.getMaxZoom());

    // Test VectorLayer
    const vectorLayer = new VectorLayer({
        name: 'Test Vector Layer'
    });

    console.log('\n✓ VectorLayer instance created successfully!');
    console.log('  Name:', vectorLayer.name);

    console.log('\n✅ All tests passed!');

} catch (error) {
    console.error('✗ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
}
