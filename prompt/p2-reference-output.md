## P2 - Architecture ADR（参考输出）

```json
{
  "status": "ok",
  "architecture": {
    "layers": {
      "data_layer": {
        "components": [
          "object_storage_tiles",
          "postgis_metadata_store",
          "redis_hot_cache",
          "version_manifest_repo"
        ],
        "responsibilities": [
          "存储栅格/矢量/地形瓦片",
          "维护数据版本与元数据索引",
          "提供热点缓存与低延迟读取",
          "支持版本回滚与审计"
        ]
      },
      "service_layer": {
        "components": [
          "tile_service",
          "feature_service",
          "style_service",
          "etl_orchestrator",
          "auth_quota_service",
          "observability_service"
        ],
        "responsibilities": [
          "统一地图数据 API（瓦片/要素/样式）",
          "执行坐标转换、切片、增量更新",
          "提供鉴权、限流、多租户隔离",
          "输出监控指标与追踪日志"
        ]
      },
      "presentation_layer": {
        "components": [
          "web_sdk_renderer",
          "interaction_framework",
          "layer_manager",
          "native_adapter_interface"
        ],
        "responsibilities": [
          "执行矢量/栅格/3D 渲染",
          "提供统一交互事件模型",
          "管理图层生命周期与样式",
          "抽象渲染后端以兼容 Native 扩展"
        ]
      }
    },
    "tech_decisions": [
      {
        "decision_id": "ADR-001",
        "topic": "webgl_vs_opengl",
        "chosen_option": "Web 端采用 WebGL2 优先 + WebGL1 降级；Native 扩展预留 OpenGL/Metal/Vulkan 后端",
        "rationale": [
          "WebGL2 在浏览器可部署性与能力间平衡最佳",
          "WebGL1 降级可保障兼容面",
          "Native 高性能需求可后续通过 RHI 接入"
        ],
        "alternatives": [
          {
            "option": "仅 WebGL1",
            "pros": [
              "兼容面更广"
            ],
            "cons": [
              "高级渲染能力受限",
              "性能上限低"
            ]
          },
          {
            "option": "直接 WebGPU",
            "pros": [
              "未来性能潜力高"
            ],
            "cons": [
              "生态与兼容成熟度不足",
              "首年交付风险高"
            ]
          }
        ],
        "rollback_plan": "若 WebGL2 特性导致兼容故障，按 capability_detection 自动切换 WebGL1 管线并关闭高阶特效。"
      },
      {
        "decision_id": "ADR-002",
        "topic": "vector_data_format",
        "chosen_option": "服务端主格式采用 MVT，客户端补充 GeoJSON 动态编辑通道",
        "rationale": [
          "MVT 带宽效率与分级渲染友好",
          "GeoJSON 便于业务侧编辑与调试"
        ],
        "alternatives": [
          {
            "option": "全 GeoJSON",
            "pros": [
              "可读性强"
            ],
            "cons": [
              "大规模传输与渲染成本高"
            ]
          }
        ],
        "rollback_plan": "若 MVT 生成链路异常，临时切换到预生成 GeoJSON 分片服务，限制最大视图范围。"
      },
      {
        "decision_id": "ADR-003",
        "topic": "service_architecture",
        "chosen_option": "微服务 + API Gateway + 事件队列（ETL 异步）",
        "rationale": [
          "支持多租户与独立扩缩容",
          "易于高峰流量隔离"
        ],
        "alternatives": [
          {
            "option": "单体服务",
            "pros": [
              "初期实现快"
            ],
            "cons": [
              "后期扩展受限",
              "可用性与隔离能力弱"
            ]
          }
        ],
        "rollback_plan": "若微服务运维复杂度超标，保留合并部署模式（逻辑服务不拆库）作为中间形态。"
      }
    ],
    "compatibility_strategy": {
      "capability_detection": [
        "启动检测 WebGL2/1 可用性与关键扩展",
        "检测 max_texture_size、uniform 上限、可用内存等级",
        "检测移动端机型档位（高/中/低）"
      ],
      "degrade_path": [
        "path_a: webgl2_full -> webgl2_lite(关闭阴影/后处理)",
        "path_b: webgl2_lite -> webgl1_compatible(关闭3D体积特效)",
        "path_c: webgl1_compatible -> canvas2d_readonly(只读基础地图)"
      ],
      "platform_matrix": [
        "Chrome 122+ / Edge 122+ / Safari 17+ / iOS Safari 17+ / Android Chrome 122+"
      ]
    },
    "lod_strategy": {
      "spatial_structure": [
        "2D 使用 quadtree 管理瓦片层级",
        "3D 地形采用分块四叉树 + SSE",
        "模型层采用视锥裁剪 + 包围体剔除"
      ],
      "sse_rules": [
        "desktop: refine when sse > 2.0",
        "mid_mobile: refine when sse > 3.0",
        "low_mobile: refine when sse > 4.5"
      ],
      "cache_policy": [
        "hot_cache_l1: 最近 90 秒可视瓦片常驻",
        "warm_cache_l2: 最近 10 分钟瓦片按 LRU 淘汰",
        "memory_guard: 设备内存超过阈值后主动降级与清理"
      ],
      "anti_flicker_rules": [
        "引入 LOD hysteresis（升降级阈值分离）",
        "邻级预取 + 跨级混合过渡 120ms",
        "避免镜头轻微移动触发频繁重切片"
      ]
    }
  }
}
```
