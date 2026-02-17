## P5 - Deployment & Scaling（参考输出）

```json
{
  "status": "ok",
  "deployment": {
    "lightweight_embed": {
      "topology": "单 SDK + CDN 瓦片 + 轻量 API（鉴权/配置）",
      "applicable_scenarios": [
        "业务系统快速嵌入地图",
        "低并发可视化页面",
        "运维资源有限的小团队"
      ],
      "cost_level": "low",
      "ops_complexity": "low"
    },
    "distributed_architecture": {
      "topology": "api_gateway -> tile_service/feature_service/style_service -> cache(redis) -> object_storage + metadata_db(postgis)，etl_orchestrator 异步处理",
      "core_services": [
        "api_gateway",
        "tile_service",
        "feature_service",
        "style_service",
        "auth_quota_service",
        "etl_orchestrator",
        "observability_stack"
      ],
      "traffic_strategy": [
        "租户级限流与配额",
        "热点瓦片边缘缓存预热",
        "读写分离与异步化 ETL"
      ],
      "multi_region_strategy": [
        "同城双可用区主备",
        "跨地域异步复制",
        "按区域 DNS/GSLB 分流"
      ]
    },
    "dynamic_scaling": {
      "triggers": [
        {
          "metric": "tile_qps",
          "threshold": ">12000",
          "window": "5m"
        },
        {
          "metric": "api_latency_p95_ms",
          "threshold": ">200",
          "window": "10m"
        },
        {
          "metric": "queue_backlog_jobs",
          "threshold": ">5000",
          "window": "10m"
        },
        {
          "metric": "cpu_usage",
          "threshold": ">70%",
          "window": "10m"
        }
      ],
      "actions": [
        {
          "type": "scale_out",
          "details": "自动扩容 tile_service + feature_service 副本数至 1.5x"
        },
        {
          "type": "scale_out",
          "details": "扩展缓存节点并触发热点瓦片预热"
        },
        {
          "type": "degrade",
          "details": "客户端下发降级策略：关闭阴影、降低 LOD 精度、限制并发请求"
        },
        {
          "type": "scale_in",
          "details": "低峰连续 30m 后按 15% 步长缩容"
        }
      ],
      "safeguards": [
        "设置最小副本数防抖",
        "扩缩容冷却时间 15 分钟",
        "关键租户流量保护优先级",
        "自动扩容失败触发告警与人工接管"
      ]
    },
    "rollback_and_dr": {
      "release_strategy": "canary_10_30_100 + blue_green",
      "rollback_steps": [
        "检测到门禁失败立即冻结发布",
        "流量回切旧版本",
        "恢复上一版本配置与模型",
        "执行数据版本回滚（如有 schema 变更）",
        "触发事故复盘与 RCA"
      ],
      "rto": "<=15m",
      "rpo": "<=5m"
    }
  }
}
```
