## P1 - Requirements Decomposition（参考输出）

```json
{
  "status": "ok",
  "requirements": {
    "functional": {
      "raster_engine": [
        {
          "req_id": "FR-RAS-001",
          "description": "支持 XYZ/WMTS/WMS 栅格源接入，支持多图层叠加与透明混合",
          "priority": "P0"
        },
        {
          "req_id": "FR-RAS-002",
          "description": "实现瓦片请求优先级队列、取消加载、失败重试与本地缓存",
          "priority": "P0"
        },
        {
          "req_id": "FR-RAS-003",
          "description": "支持多缩放级别渐进加载，避免高缩放切换闪烁",
          "priority": "P1"
        }
      ],
      "vector_engine": [
        {
          "req_id": "FR-VEC-001",
          "description": "支持 GeoJSON/MVT 点线面渲染与样式表达式",
          "priority": "P0"
        },
        {
          "req_id": "FR-VEC-002",
          "description": "支持要素拾取、批量更新、分层过滤与高亮",
          "priority": "P0"
        },
        {
          "req_id": "FR-VEC-003",
          "description": "支持标注避让、层级简化、聚合与按视口裁剪",
          "priority": "P1"
        },
        {
          "req_id": "FR-VEC-004",
          "description": "支持 3D 模型（glTF）挂载并与地形融合",
          "priority": "P2"
        }
      ],
      "data_pipeline": [
        {
          "req_id": "FR-DAT-001",
          "description": "支持 Shapefile/GeoJSON/KML/CSV+WKT/GeoTIFF/DEM 数据导入",
          "priority": "P0"
        },
        {
          "req_id": "FR-DAT-002",
          "description": "统一坐标系转换（WGS84/WebMercator）与几何有效性修复",
          "priority": "P0"
        },
        {
          "req_id": "FR-DAT-003",
          "description": "输出 MVT/栅格瓦片/地形瓦片并进行版本化发布",
          "priority": "P0"
        },
        {
          "req_id": "FR-DAT-004",
          "description": "支持增量更新、回滚到指定数据版本",
          "priority": "P1"
        }
      ],
      "interaction_modules": [
        {
          "req_id": "FR-INT-001",
          "module": "navigation",
          "description": "平移/缩放/旋转/倾斜/飞行定位"
        },
        {
          "req_id": "FR-INT-002",
          "module": "query",
          "description": "点击拾取、框选查询、属性面板"
        },
        {
          "req_id": "FR-INT-003",
          "module": "edit",
          "description": "点线面绘制、编辑、吸附、撤销重做"
        },
        {
          "req_id": "FR-INT-004",
          "module": "analysis",
          "description": "测距、面积、缓冲区、剖面、时序回放"
        },
        {
          "req_id": "FR-INT-005",
          "module": "ui_controls",
          "description": "图层管理、比例尺、鹰眼、时间轴"
        }
      ]
    },
    "non_functional": [
      {
        "name": "desktop_fps_p50",
        "metric": "fps",
        "threshold": ">=60"
      },
      {
        "name": "mobile_mid_fps_p50",
        "metric": "fps",
        "threshold": ">=30"
      },
      {
        "name": "interaction_latency_p95",
        "metric": "ms",
        "threshold": "<=120"
      },
      {
        "name": "first_screen_time",
        "metric": "seconds",
        "threshold": "<=2.5"
      },
      {
        "name": "memory_peak_mid_device",
        "metric": "MB",
        "threshold": "<=900"
      },
      {
        "name": "availability",
        "metric": "percentage",
        "threshold": ">=99.9%"
      }
    ],
    "acceptance_criteria": [
      {
        "req_id": "FR-RAS-001",
        "criterion": "同一视图支持至少 3 个栅格图层叠加，透明混合正确",
        "measurement_method": "golden image 比对通过率 >= 98%"
      },
      {
        "req_id": "FR-VEC-001",
        "criterion": "100 万点+5 万线+2 万面场景可渲染并交互",
        "measurement_method": "桌面端 fps_p50 >= 45，拾取正确率 >= 99%"
      },
      {
        "req_id": "FR-DAT-003",
        "criterion": "完整 ETL 后切片发布成功且可追溯版本",
        "measurement_method": "切片完整率 >= 99.95%，发布失败率 <= 0.5%"
      },
      {
        "req_id": "FR-INT-003",
        "criterion": "编辑操作支持撤销重做并无数据错乱",
        "measurement_method": "1000 次随机操作回放一致率 = 100%"
      },
      {
        "req_id": "FR-VEC-004",
        "criterion": "3D 模型加载失败时主地图不崩溃且保持可操作",
        "measurement_method": "故障注入测试通过率 = 100%"
      }
    ]
  },
  "traceability": [
    {
      "kpi": "desktop_fps_p50>=60",
      "mapped_requirements": [
        "FR-RAS-002",
        "FR-VEC-003",
        "FR-VEC-004"
      ]
    },
    {
      "kpi": "interaction_latency_p95<=120ms",
      "mapped_requirements": [
        "FR-INT-001",
        "FR-INT-002",
        "FR-RAS-002"
      ]
    },
    {
      "kpi": "availability>=99.9%",
      "mapped_requirements": [
        "FR-DAT-004",
        "FR-RAS-002"
      ]
    }
  ]
}
```
