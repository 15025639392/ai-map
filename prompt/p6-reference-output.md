## P6 - Cross-Step Verifier（参考输出）

```json
{
  "status": "ok",
  "verification": {
    "pass": true,
    "coverage_check": [
      {
        "item": "requirement_analysis_core_functions",
        "covered": true,
        "evidence": [
          "P1.functional.raster_engine",
          "P1.functional.vector_engine",
          "P1.functional.data_pipeline",
          "P1.functional.interaction_modules"
        ]
      },
      {
        "item": "layered_architecture_webgl_opengl_compatibility_lod",
        "covered": true,
        "evidence": [
          "P2.architecture.layers",
          "P2.architecture.tech_decisions",
          "P2.architecture.compatibility_strategy",
          "P2.architecture.lod_strategy"
        ]
      },
      {
        "item": "roadmap_mvp_feature_advanced3d_with_quantified_milestones",
        "covered": true,
        "evidence": [
          "P3.roadmap.phases[0..2].milestones"
        ]
      },
      {
        "item": "testing_unit_stress_compatibility",
        "covered": true,
        "evidence": [
          "P4.test_strategy.unit_tests",
          "P4.test_strategy.stress_tests",
          "P4.test_strategy.compatibility_tests"
        ]
      },
      {
        "item": "deployment_lightweight_vs_distributed_dynamic_scaling",
        "covered": true,
        "evidence": [
          "P5.deployment.lightweight_embed",
          "P5.deployment.distributed_architecture",
          "P5.deployment.dynamic_scaling"
        ]
      }
    ],
    "conflicts": [
      {
        "id": "C-001",
        "description": "MVP 阶段桌面 60 FPS 指标与 2026-06 交付窗口存在压力，可能需阶段化目标（45->60）",
        "severity": "medium",
        "fix_instruction": "保持 MVP>=45 FPS，Feature 阶段达成 >=60 FPS 并写入 gate。"
      },
      {
        "id": "C-002",
        "description": "3D 高阶特效与中端移动内存上限 900MB 存在冲突风险",
        "severity": "medium",
        "fix_instruction": "默认对中低端设备启用特效白名单与纹理降采样策略。"
      }
    ],
    "missing_metrics": [],
    "quality_score": {
      "completeness": 95,
      "measurability": 93,
      "feasibility": 88,
      "testability": 94,
      "operability": 90,
      "overall": 92
    }
  }
}
```
