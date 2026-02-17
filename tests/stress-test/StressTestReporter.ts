/**
 * 压力测试报告生成器
 * 生成详细的测试报告并自动归档
 */

import fs from 'fs/promises';
import path from 'path';
import { gzip } from 'zlib';
import { promisify } from 'util';
import {
  StressTestResult,
  ReportConfig,
  StressScenario,
} from './types.js';

const gzipAsync = promisify(gzip);

/**
 * 压力测试报告生成器
 */
export class StressTestReporter {
  private _defaultConfig: ReportConfig = {
    outputPath: './test-results/stress-test',
    format: 'all',
    includeCharts: true,
    includeRawData: true,
    archivePath: './test-results/stress-test/archive',
    maxArchiveDays: 30,
  };

  /**
   * 生成测试报告
   */
  async generateReport(
    result: StressTestResult,
    outputPath?: string
  ): Promise<string> {
    const config = { ...this._defaultConfig, outputPath };

    // 确保输出目录存在
    await fs.mkdir(config.outputPath, { recursive: true });

    // 生成报告文件名
    const timestamp = new Date(result.startTime).toISOString().replace(/[:.]/g, '-');
    const baseFilename = `${result.scenario}_${timestamp}`;

    // 生成 JSON 报告
    const jsonPath = path.join(config.outputPath, `${baseFilename}.json`);
    const jsonReport = this._generateJSONReport(result);
    await fs.writeFile(jsonPath, JSON.stringify(jsonReport, null, 2));

    // 生成 HTML 报告
    const htmlPath = path.join(config.outputPath, `${baseFilename}.html`);
    const htmlReport = this._generateHTMLReport(result);
    await fs.writeFile(htmlPath, htmlReport);

    // 生成 Markdown 摘要
    const mdPath = path.join(config.outputPath, `${baseFilename}.md`);
    const mdReport = this._generateMarkdownReport(result);
    await fs.writeFile(mdPath, mdReport);

    // 归档旧报告
    if (config.archivePath) {
      await this._archiveOldReports(config);
    }

    console.log(`Report generated: ${jsonPath}`);
    console.log(`HTML report: ${htmlPath}`);
    console.log(`Markdown summary: ${mdPath}`);

    return jsonPath;
  }

  /**
   * 生成 JSON 报告
   */
  private _generateJSONReport(result: StressTestResult): any {
    return {
      testInfo: {
        scenario: result.scenario,
        startTime: new Date(result.startTime).toISOString(),
        endTime: new Date(result.endTime).toISOString(),
        duration: result.duration,
        status: result.status,
      },
      config: result.config,
      summary: result.summary,
      metrics: Object.fromEntries(
        Object.entries(result.metrics).map(([key, value]) => [
          key,
          {
            statistics: (value as any).statistics,
            dataPoints: (value as any).data.length,
          },
        ])
      ),
      resources: {
        sampleCount: result.resources.length,
        cpuUsageAvg: this._calculateAverage(result.resources.map(r => r.cpuUsage)),
        memoryUsageAvg: this._calculateAverage(result.resources.map(r => r.memoryUsage)),
      },
      alerts: {
        total: result.alerts.length,
        byType: this._groupAlertsByType(result.alerts),
        bySeverity: this._groupAlertsBySeverity(result.alerts),
      },
    };
  }

  /**
   * 生成 HTML 报告
   */
  private _generateHTMLReport(result: StressTestResult): string {
    const { summary, alerts, resources, metrics } = result;
    const durationHours = (result.duration / 3600).toFixed(2);
    const passRate = (summary.successfulRequests / summary.totalRequests * 100).toFixed(2);

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Stress Test Report - ${result.scenario}</title>
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

    .status-bar {
      padding: 20px 30px;
      border-bottom: 1px solid #e0e0e0;
    }

    .status {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status.passed {
      background: #4caf50;
      color: white;
    }

    .status.failed {
      background: #f44336;
      color: white;
    }

    .status.aborted {
      background: #ff9800;
      color: white;
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
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 5px;
      color: #667eea;
    }

    .summary-card .label {
      color: #666;
      font-size: 14px;
    }

    .section {
      padding: 30px;
      border-bottom: 1px solid #e0e0e0;
    }

    .section h2 {
      font-size: 24px;
      margin-bottom: 20px;
      color: #333;
    }

    .section h3 {
      font-size: 18px;
      margin-bottom: 15px;
      color: #555;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }

    .metric-item {
      background: #f9f9f9;
      padding: 15px;
      border-radius: 4px;
    }

    .metric-item .label {
      font-size: 12px;
      color: #666;
      margin-bottom: 8px;
    }

    .metric-item .value {
      font-size: 20px;
      font-weight: 600;
      color: #333;
    }

    .alerts-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .alert-item {
      padding: 12px;
      border-left: 4px solid;
      margin-bottom: 10px;
      background: #f5f5f5;
      border-radius: 0 4px 4px 0;
    }

    .alert-item.warning {
      border-left-color: #ff9800;
    }

    .alert-item.error {
      border-left-color: #f44336;
    }

    .alert-item.critical {
      border-left-color: #b71c1c;
    }

    .alert-item .time {
      font-size: 12px;
      color: #999;
      margin-bottom: 5px;
    }

    .alert-item .message {
      font-size: 14px;
      color: #333;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Stress Test Report</h1>
      <div class="meta">
        Scenario: ${result.scenario} |
        Duration: ${durationHours}h |
        Started: ${new Date(result.startTime).toLocaleString()}
      </div>
    </div>

    <div class="status-bar">
      <span class="status ${result.status}">${result.status.toUpperCase()}</span>
    </div>

    <div class="summary">
      <div class="summary-card">
        <div class="value">${summary.totalRequests.toLocaleString()}</div>
        <div class="label">Total Requests</div>
      </div>
      <div class="summary-card">
        <div class="value">${summary.successfulRequests.toLocaleString()}</div>
        <div class="label">Successful</div>
      </div>
      <div class="summary-card">
        <div class="value">${summary.failedRequests.toLocaleString()}</div>
        <div class="label">Failed</div>
      </div>
      <div class="summary-card">
        <div class="value">${passRate}%</div>
        <div class="label">Pass Rate</div>
      </div>
      <div class="summary-card">
        <div class="value">${summary.avgQPS.toFixed(0)}</div>
        <div class="label">Avg QPS</div>
      </div>
      <div class="summary-card">
        <div class="value">${summary.peakQPS.toFixed(0)}</div>
        <div class="label">Peak QPS</div>
      </div>
      <div class="summary-card">
        <div class="value">${summary.p95Latency.toFixed(0)}ms</div>
        <div class="label">P95 Latency</div>
      </div>
      <div class="summary-card">
        <div class="value">${(summary.errorRate * 100).toFixed(2)}%</div>
        <div class="label">Error Rate</div>
      </div>
    </div>

    <div class="section">
      <h2>Performance Metrics</h2>
      <div class="metrics-grid">
        <div class="metric-item">
          <div class="label">Average QPS</div>
          <div class="value">${summary.avgQPS.toFixed(0)}</div>
        </div>
        <div class="metric-item">
          <div class="label">Peak QPS</div>
          <div class="value">${summary.peakQPS.toFixed(0)}</div>
        </div>
        <div class="metric-item">
          <div class="label">Average Latency</div>
          <div class="value">${summary.avgLatency.toFixed(2)}ms</div>
        </div>
        <div class="metric-item">
          <div class="label">P50 Latency</div>
          <div class="value">${summary.p50Latency.toFixed(2)}ms</div>
        </div>
        <div class="metric-item">
          <div class="label">P95 Latency</div>
          <div class="value">${summary.p95Latency.toFixed(2)}ms</div>
        </div>
        <div class="metric-item">
          <div class="label">P99 Latency</div>
          <div class="value">${summary.p99Latency.toFixed(2)}ms</div>
        </div>
        <div class="metric-item">
          <div class="label">Throughput</div>
          <div class="value">${summary.throughput.toFixed(0)}/s</div>
        </div>
        <div class="metric-item">
          <div class="label">Error Rate</div>
          <div class="value">${(summary.errorRate * 100).toFixed(2)}%</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>System Resources</h2>
      <div class="metrics-grid">
        <div class="metric-item">
          <div class="label">Avg CPU Usage</div>
          <div class="value">${(summary.cpuUsageAvg! * 100).toFixed(1)}%</div>
        </div>
        <div class="metric-item">
          <div class="label">Max CPU Usage</div>
          <div class="value">${(summary.cpuUsageMax! * 100).toFixed(1)}%</div>
        </div>
        <div class="metric-item">
          <div class="label">Avg Memory Usage</div>
          <div class="value">${(summary.memoryUsageAvg! * 100).toFixed(1)}%</div>
        </div>
        <div class="metric-item">
          <div class="label">Max Memory Usage</div>
          <div class="value">${(summary.memoryUsageMax! * 100).toFixed(1)}%</div>
        </div>
        <div class="metric-item">
          <div class="label">Memory Leaked</div>
          <div class="value">${(summary.memoryLeaked! / 1024 / 1024).toFixed(2)}MB</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>Alerts (${alerts.length})</h2>
      <div class="alerts-list">
        ${alerts.length === 0
          ? '<p style="color: #4caf50;">No alerts generated</p>'
          : alerts.map(alert => `
            <div class="alert-item ${alert.type}">
              <div class="time">${new Date(alert.timestamp).toLocaleString()}</div>
              <div class="message">${alert.message}</div>
            </div>
          `).join('')
        }
      </div>
    </div>
  </div>
</body>
</html>
    `;

    return html;
  }

  /**
   * 生成 Markdown 报告
   */
  private _generateMarkdownReport(result: StressTestResult): string {
    const { summary, alerts, resources } = result;
    const durationHours = (result.duration / 3600).toFixed(2);
    const passRate = (summary.successfulRequests / summary.totalRequests * 100).toFixed(2);

    let md = `# Stress Test Report - ${result.scenario}\n\n`;
    md += `**Status:** ${result.status.toUpperCase()}\n\n`;
    md += `**Duration:** ${durationHours} hours\n\n`;
    md += `**Started:** ${new Date(result.startTime).toLocaleString()}\n\n`;
    md += `**Ended:** ${new Date(result.endTime).toLocaleString()}\n\n`;

    md += `## Summary\n\n`;
    md += `| Metric | Value |\n`;
    md += `|--------|-------|\n`;
    md += `| Total Requests | ${summary.totalRequests.toLocaleString()} |\n`;
    md += `| Successful | ${summary.successfulRequests.toLocaleString()} |\n`;
    md += `| Failed | ${summary.failedRequests.toLocaleString()} |\n`;
    md += `| Pass Rate | ${passRate}% |\n`;
    md += `| Average QPS | ${summary.avgQPS.toFixed(0)} |\n`;
    md += `| Peak QPS | ${summary.peakQPS.toFixed(0)} |\n`;
    md += `| Average Latency | ${summary.avgLatency.toFixed(2)}ms |\n`;
    md += `| P95 Latency | ${summary.p95Latency.toFixed(2)}ms |\n`;
    md += `| P99 Latency | ${summary.p99Latency.toFixed(2)}ms |\n`;
    md += `| Error Rate | ${(summary.errorRate * 100).toFixed(2)}% |\n\n`;

    md += `## Performance Metrics\n\n`;
    md += `| Metric | Value |\n`;
    md += `|--------|-------|\n`;
    md += `| Average QPS | ${summary.avgQPS.toFixed(0)} |\n`;
    md += `| Peak QPS | ${summary.peakQPS.toFixed(0)} |\n`;
    md += `| Average Latency | ${summary.avgLatency.toFixed(2)}ms |\n`;
    md += `| P50 Latency | ${summary.p50Latency.toFixed(2)}ms |\n`;
    md += `| P95 Latency | ${summary.p95Latency.toFixed(2)}ms |\n`;
    md += `| P99 Latency | ${summary.p99Latency.toFixed(2)}ms |\n`;
    md += `| Throughput | ${summary.throughput.toFixed(0)}/s |\n`;
    md += `| Error Rate | ${(summary.errorRate * 100).toFixed(2)}% |\n\n`;

    md += `## System Resources\n\n`;
    md += `| Metric | Value |\n`;
    md += `|--------|-------|\n`;
    md += `| Average CPU Usage | ${(summary.cpuUsageAvg! * 100).toFixed(1)}% |\n`;
    md += `| Maximum CPU Usage | ${(summary.cpuUsageMax! * 100).toFixed(1)}% |\n`;
    md += `| Average Memory Usage | ${(summary.memoryUsageAvg! * 100).toFixed(1)}% |\n`;
    md += `| Maximum Memory Usage | ${(summary.memoryUsageMax! * 100).toFixed(1)}% |\n`;
    md += `| Memory Leaked | ${(summary.memoryLeaked! / 1024 / 1024).toFixed(2)}MB |\n\n`;

    if (alerts.length > 0) {
      md += `## Alerts (${alerts.length})\n\n`;
      alerts.forEach((alert, index) => {
        md += `### ${index + 1}. ${alert.type.toUpperCase()} - ${alert.metric}\n\n`;
        md += `**Time:** ${new Date(alert.timestamp).toLocaleString()}\n\n`;
        md += `**Message:** ${alert.message}\n\n`;
        md += `**Value:** ${alert.value}\n\n`;
        md += `**Threshold:** ${alert.threshold}\n\n`;
      });
    } else {
      md += `## Alerts\n\n`;
      md += `No alerts generated.\n\n`;
    }

    return md;
  }

  /**
   * 归档旧报告
   */
  private async _archiveOldReports(config: ReportConfig): Promise<void> {
    try {
      const archiveDir = config.archivePath!;
      await fs.mkdir(archiveDir, { recursive: true });

      const files = await fs.readdir(config.outputPath!);
      const now = Date.now();
      const maxAge = (config.maxArchiveDays || 30) * 24 * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(config.outputPath!, file);
        const stats = await fs.stat(filePath);

        // 只归档旧的报告文件
        const age = now - stats.mtimeMs;
        if (age > maxAge && (file.endsWith('.json') || file.endsWith('.html'))) {
          const archivePath = path.join(archiveDir, file);

          // 如果归档文件已存在，压缩后再移动
          if (await this._fileExists(archivePath)) {
            const content = await fs.readFile(filePath);
            const compressed = await gzipAsync(content);
            await fs.writeFile(`${archivePath}.gz`, compressed);
            await fs.unlink(filePath);
            console.log(`Archived and compressed: ${file}`);
          } else {
            await fs.rename(filePath, archivePath);
            console.log(`Archived: ${file}`);
          }
        }
      }

      // 清理过期的归档
      const archiveFiles = await fs.readdir(archiveDir);
      for (const file of archiveFiles) {
        const filePath = path.join(archiveDir, file);
        const stats = await fs.stat(filePath);

        if (now - stats.mtimeMs > maxAge * 2) {
          await fs.unlink(filePath);
          console.log(`Removed old archive: ${file}`);
        }
      }
    } catch (error) {
      console.warn('Failed to archive reports:', error);
    }
  }

  /**
   * 检查文件是否存在
   */
  private async _fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 计算平均值
   */
  private _calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  /**
   * 按类型分组告警
   */
  private _groupAlertsByType(alerts: any[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    alerts.forEach(alert => {
      const type = alert.metric;
      grouped[type] = (grouped[type] || 0) + 1;
    });
    return grouped;
  }

  /**
   * 按严重程度分组告警
   */
  private _groupAlertsBySeverity(alerts: any[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    alerts.forEach(alert => {
      const severity = alert.type;
      grouped[severity] = (grouped[severity] || 0) + 1;
    });
    return grouped;
  }
}
