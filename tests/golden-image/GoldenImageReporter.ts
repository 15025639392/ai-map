/**
 * Golden Image 报告生成器
 * 生成差异报告、HTML 可视化、JSON 导出
 */

import fs from 'fs/promises';
import path from 'path';
import {
  TestReport,
  TestResult,
  DiffLevel,
} from './types.js';

/**
 * Golden Image 报告生成器
 */
export class GoldenImageReporter {
  /**
   * 生成测试报告
   */
  async generateReport(
    results: TestResult[],
    outputDir: string
  ): Promise<string> {
    const report: TestReport = {
      summary: {
        total: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length,
        skipped: 0,
        passRate: results.length > 0
          ? results.filter(r => r.passed).length / results.length
          : 0,
        duration: results.reduce((sum, r) => sum + r.duration, 0),
      },
      results,
      threshold: {
        algorithm: 'ssim',
        threshold: 0.95,
        autoAdjust: true,
        minThreshold: 0.90,
        maxThreshold: 0.99,
        historyWeight: 0.3,
        adaptationRate: 0.1,
      },
      environment: {
        os: process.platform,
        nodeVersion: process.version,
        timestamp: Date.now(),
      },
      generatedAt: Date.now(),
    };

    // 生成 JSON 报告
    const jsonPath = path.join(outputDir, 'report.json');
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(jsonPath, JSON.stringify(report, null, 2));

    // 生成 HTML 报告
    const htmlPath = path.join(outputDir, 'report.html');
    const html = this._generateHTMLReport(report, outputDir);
    await fs.writeFile(htmlPath, html);

    // 生成 Markdown 摘要
    const mdPath = path.join(outputDir, 'summary.md');
    const markdown = this._generateMarkdownSummary(report);
    await fs.writeFile(mdPath, markdown);

    return jsonPath;
  }

  /**
   * 生成 HTML 报告
   */
  private _generateHTMLReport(report: TestReport, outputDir: string): string {
    const { summary, results, generatedAt } = report;
    const passRate = (summary.passRate * 100).toFixed(2);
    const duration = (summary.duration / 1000).toFixed(2);

    const passedResults = results.filter(r => r.passed);
    const failedResults = results.filter(r => !r.passed);

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Golden Image Test Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #f5f5f5;
      padding: 20px;
      line-height: 1.6;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
    }

    .header h1 {
      font-size: 32px;
      margin-bottom: 10px;
    }

    .header .meta {
      font-size: 14px;
      opacity: 0.9;
    }

    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      padding: 30px;
      background: #fafafa;
      border-bottom: 1px solid #e0e0e0;
    }

    .summary-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      text-align: center;
    }

    .summary-card .value {
      font-size: 36px;
      font-weight: bold;
      margin-bottom: 5px;
    }

    .summary-card .label {
      color: #666;
      font-size: 14px;
    }

    .summary-card.success .value {
      color: #4caf50;
    }

    .summary-card.error .value {
      color: #f44336;
    }

    .summary-card.info .value {
      color: #2196f3;
    }

    .tabs {
      display: flex;
      background: #f0f0f0;
      border-bottom: 1px solid #ddd;
    }

    .tab {
      padding: 15px 30px;
      cursor: pointer;
      background: none;
      border: none;
      font-size: 14px;
      font-weight: 500;
      color: #666;
      border-bottom: 2px solid transparent;
      transition: all 0.3s;
    }

    .tab:hover {
      background: #e0e0e0;
    }

    .tab.active {
      background: white;
      color: #667eea;
      border-bottom-color: #667eea;
    }

    .tab-content {
      padding: 30px;
      display: none;
    }

    .tab-content.active {
      display: block;
    }

    .test-result {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      transition: all 0.3s;
    }

    .test-result:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .test-result.passed {
      border-left: 4px solid #4caf50;
    }

    .test-result.failed {
      border-left: 4px solid #f44336;
    }

    .test-result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .test-result-title {
      font-size: 18px;
      font-weight: 600;
    }

    .test-result-status {
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .test-result-status.passed {
      background: #e8f5e9;
      color: #4caf50;
    }

    .test-result-status.failed {
      background: #ffebee;
      color: #f44336;
    }

    .test-result-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 15px;
    }

    .detail-item {
      background: #f9f9f9;
      padding: 10px;
      border-radius: 4px;
    }

    .detail-label {
      font-size: 12px;
      color: #666;
      margin-bottom: 5px;
    }

    .detail-value {
      font-size: 14px;
      font-weight: 500;
    }

    .diff-level-identical { color: #4caf50; }
    .diff-level-minor { color: #8bc34a; }
    .diff-level-moderate { color: #ffc107; }
    .diff-level-major { color: #ff9800; }
    .diff-level-critical { color: #f44336; }

    .images {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }

    .image-container {
      background: #f5f5f5;
      padding: 10px;
      border-radius: 4px;
    }

    .image-label {
      font-size: 12px;
      color: #666;
      margin-bottom: 8px;
      text-align: center;
    }

    .image-placeholder {
      height: 200px;
      background: #e0e0e0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
      font-size: 14px;
      border-radius: 4px;
    }

    .no-results {
      text-align: center;
      padding: 60px 20px;
      color: #999;
      font-size: 16px;
    }

    .diff-stats {
      background: #f9f9f9;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 15px;
    }

    .diff-stats-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e0e0e0;
    }

    .diff-stats-row:last-child {
      border-bottom: none;
    }

    .timestamp {
      font-size: 12px;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Golden Image Test Report</h1>
      <div class="meta">
        Generated at: ${new Date(generatedAt).toLocaleString()}
        | Environment: ${report.environment.os} | Node ${report.environment.nodeVersion}
      </div>
    </div>

    <div class="summary">
      <div class="summary-card info">
        <div class="value">${summary.total}</div>
        <div class="label">Total Tests</div>
      </div>
      <div class="summary-card success">
        <div class="value">${summary.passed}</div>
        <div class="label">Passed</div>
      </div>
      <div class="summary-card error">
        <div class="value">${summary.failed}</div>
        <div class="label">Failed</div>
      </div>
      <div class="summary-card info">
        <div class="value">${passRate}%</div>
        <div class="label">Pass Rate</div>
      </div>
      <div class="summary-card info">
        <div class="value">${duration}s</div>
        <div class="label">Duration</div>
      </div>
    </div>

    <div class="tabs">
      <button class="tab active" onclick="showTab('all')">All (${summary.total})</button>
      <button class="tab" onclick="showTab('passed')">Passed (${summary.passed})</button>
      <button class="tab" onclick="showTab('failed')">Failed (${summary.failed})</button>
    </div>

    <div id="tab-all" class="tab-content active">
      ${this._generateTestResultsHTML(results, outputDir)}
    </div>

    <div id="tab-passed" class="tab-content">
      ${passedResults.length > 0
        ? this._generateTestResultsHTML(passedResults, outputDir)
        : '<div class="no-results">No passed tests</div>'}
    </div>

    <div id="tab-failed" class="tab-content">
      ${failedResults.length > 0
        ? this._generateTestResultsHTML(failedResults, outputDir)
        : '<div class="no-results">No failed tests</div>'}
    </div>
  </div>

  <script>
    function showTab(tabId) {
      // Hide all tab contents
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });

      // Remove active class from all tabs
      document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
      });

      // Show selected tab content
      document.getElementById('tab-' + tabId).classList.add('active');

      // Add active class to clicked tab
      event.target.classList.add('active');
    }
  </script>
</body>
</html>
    `;

    return html;
  }

  /**
   * 生成测试结果 HTML
   */
  private _generateTestResultsHTML(results: TestResult[], outputDir: string): string {
    if (results.length === 0) {
      return '<div class="no-results">No test results</div>';
    }

    return results.map(result => {
      const diffLevelClass = `diff-level-${result.comparison.diffLevel}`;
      const diffPercentage = result.comparison.diffPercentage.toFixed(2);

      return `
        <div class="test-result ${result.passed ? 'passed' : 'failed'}">
          <div class="test-result-header">
            <div class="test-result-title">${result.scenario}</div>
            <div class="test-result-status ${result.passed ? 'passed' : 'failed'}">
              ${result.passed ? 'PASSED' : 'FAILED'}
            </div>
          </div>

          <div class="test-result-details">
            <div class="detail-item">
              <div class="detail-label">Diff Level</div>
              <div class="detail-value ${diffLevelClass}">${result.comparison.diffLevel.toUpperCase()}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Diff Percentage</div>
              <div class="detail-value">${diffPercentage}%</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Duration</div>
              <div class="detail-value">${result.duration}ms</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Timestamp</div>
              <div class="detail-value timestamp">${new Date(result.timestamp).toLocaleString()}</div>
            </div>
          </div>

          <div class="diff-stats">
            <div class="diff-stats-row">
              <span>Pixels Diff:</span>
              <span>${result.comparison.pixelDiffCount} / ${result.comparison.totalPixels}</span>
            </div>
            <div class="diff-stats-row">
              <span>Avg Diff:</span>
              <span>${result.comparison.avgDiff.toFixed(4)}</span>
            </div>
            <div class="diff-stats-row">
              <span>Max Diff:</span>
              <span>${result.comparison.maxDiff.toFixed(4)}</span>
            </div>
            <div class="diff-stats-row">
              <span>SSIM:</span>
              <span>${result.comparison.ssim?.toFixed(4) ?? 'N/A'}</span>
            </div>
            <div class="diff-stats-row">
              <span>MSE:</span>
              <span>${result.comparison.mse?.toFixed(4) ?? 'N/A'}</span>
            </div>
            <div class="diff-stats-row">
              <span>Threshold:</span>
              <span>${result.comparison.threshold.toFixed(4)}</span>
            </div>
            <div class="diff-stats-row">
              <span>Actual Diff:</span>
              <span>${result.comparison.actualDiff.toFixed(4)}</span>
            </div>
          </div>

          <div class="images">
            <div class="image-container">
              <div class="image-label">Golden Image</div>
              <div class="image-placeholder">${path.basename(result.goldenImage)}</div>
            </div>
            <div class="image-container">
              <div class="image-label">Actual Image</div>
              <div class="image-placeholder">${path.basename(result.actualImage)}</div>
            </div>
            <div class="image-container">
              <div class="image-label">Diff Image</div>
              <div class="image-placeholder">${path.basename(result.diffImage)}</div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * 生成 Markdown 摘要
   */
  private _generateMarkdownSummary(report: TestReport): string {
    const { summary, results, generatedAt } = report;

    const failedTests = results.filter(r => !r.passed);

    let md = `# Golden Image Test Summary\n\n`;
    md += `Generated at: ${new Date(generatedAt).toLocaleString()}\n\n`;
    md += `Environment: ${report.environment.os} | Node ${report.environment.nodeVersion}\n\n`;

    md += `## Summary\n\n`;
    md += `| Metric | Value |\n`;
    md += `|--------|-------|\n`;
    md += `| Total Tests | ${summary.total} |\n`;
    md += `| Passed | ${summary.passed} |\n`;
    md += `| Failed | ${summary.failed} |\n`;
    md += `| Pass Rate | ${(summary.passRate * 100).toFixed(2)}% |\n`;
    md += `| Duration | ${(summary.duration / 1000).toFixed(2)}s |\n\n`;

    if (failedTests.length > 0) {
      md += `## Failed Tests\n\n`;
      failedTests.forEach((result, index) => {
        md += `### ${index + 1}. ${result.scenario}\n\n`;
        md += `- **Diff Level**: ${result.comparison.diffLevel}\n`;
        md += `- **Diff Percentage**: ${result.comparison.diffPercentage.toFixed(2)}%\n`;
        md += `- **Pixels Diff**: ${result.comparison.pixelDiffCount} / ${result.comparison.totalPixels}\n`;
        md += `- **SSIM**: ${result.comparison.ssim?.toFixed(4) ?? 'N/A'}\n`;
        md += `- **Duration**: ${result.duration}ms\n\n`;
      });
    }

    return md;
  }
}
