## P4 - QA & Validation Strategy（参考输出）

```json
{
  "status": "ok",
  "test_strategy": {
    "unit_tests": [
      {
        "area": "render_precision",
        "method": "golden_image_diff + 关键像素采样",
        "dataset": "city_core_10k_features + terrain_demo_set",
        "pass_threshold": "图像差异像素占比 <=1.5%"
      },
      {
        "area": "projection_accuracy",
        "method": "WGS84/WebMercator 双向转换误差对比",
        "dataset": "global_control_points_50k",
        "pass_threshold": "平均误差 <=0.5m，P99 <=2m"
      },
      {
        "area": "picking_accuracy",
        "method": "自动化点击回放 + truth_label 校验",
        "dataset": "mixed_vector_scene_1m",
        "pass_threshold": "拾取准确率 >=99%"
      }
    ],
    "stress_tests": [
      {
        "scenario": "high_qps_tile_burst",
        "load_profile": "15k tile_qps，持续 30 分钟，峰谷波动 30%",
        "metrics": [
          "tile_response_p95_ms",
          "error_rate",
          "cache_hit_ratio",
          "cpu_memory_usage"
        ],
        "thresholds": [
          "tile_response_p95_ms <= 180",
          "error_rate <= 1%",
          "cache_hit_ratio >= 80%",
          "无持续性内存泄漏"
        ]
      },
      {
        "scenario": "massive_vector_rendering",
        "load_profile": "1e8 features 离线切片 + 在线浏览回放",
        "metrics": [
          "etl_success_rate",
          "render_fps_p50",
          "gc_pause_p95_ms"
        ],
        "thresholds": [
          "etl_success_rate >= 99.5%",
          "render_fps_p50 desktop >= 45",
          "gc_pause_p95_ms <= 40"
        ]
      },
      {
        "scenario": "long_running_stability",
        "load_profile": "连续运行 8 小时，循环缩放平移与图层切换",
        "metrics": [
          "memory_growth_mb",
          "crash_count",
          "frame_drop_ratio"
        ],
        "thresholds": [
          "memory_growth_mb <= 120",
          "crash_count = 0",
          "frame_drop_ratio <= 5%"
        ]
      }
    ],
    "compatibility_tests": [
      {
        "platform": "web_desktop",
        "device_tier": "high",
        "browser_or_os": "Chrome 122+ / Edge 122+",
        "required_result": "full_feature_pass"
      },
      {
        "platform": "web_desktop",
        "device_tier": "medium",
        "browser_or_os": "Safari 17+ macOS",
        "required_result": "core_feature_pass_with_minor_degrade"
      },
      {
        "platform": "web_mobile",
        "device_tier": "mid",
        "browser_or_os": "iOS Safari 17+ / Android Chrome 122+",
        "required_result": "core_feature_pass_fps>=30"
      },
      {
        "platform": "web_mobile",
        "device_tier": "low",
        "browser_or_os": "Android WebView (近两年)",
        "required_result": "read_only_mode_available"
      }
    ],
    "automation_pipeline": [
      "pre_merge: lint + unit_tests + contract_tests",
      "nightly: render_regression + stress_smoke + compatibility_subset",
      "weekly: full_stress + full_compatibility_matrix",
      "release_candidate: 全量回归 + 容灾演练 + 性能门禁检查"
    ],
    "release_gate": [
      {
        "metric": "critical_unit_test_pass_rate",
        "threshold": "100%",
        "block_release_if_failed": true
      },
      {
        "metric": "render_precision_pass_rate",
        "threshold": ">=98%",
        "block_release_if_failed": true
      },
      {
        "metric": "interaction_latency_p95_ms",
        "threshold": "<=120",
        "block_release_if_failed": true
      },
      {
        "metric": "availability_sla_projection",
        "threshold": ">=99.9%",
        "block_release_if_failed": true
      },
      {
        "metric": "security_scan_critical",
        "threshold": "0",
        "block_release_if_failed": true
      }
    ]
  }
}
```
