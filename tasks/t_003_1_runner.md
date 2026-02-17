# T-003-1 Runner

- epic_id: E-003
- epic_name: 数据 ETL 与服务化
- story_id: S-003-1
- owner_role: backend_engineer
- development_executor: backend_engineer_lead
- estimate_days: 10

## 1) 任务上下文卡

```json
{
  "task_id": "T-003-1",
  "story_id": "S-003-1",
  "epic_id": "E-003",
  "task_goal": "完成坐标转换与几何修复流程",
  "owner_role": "backend_engineer",
  "development_executor": "backend_engineer_lead",
  "estimate_days": 10,
  "acceptance_criteria": [
    "完成坐标转换与几何修复流程",
    "P99 坐标误差 <=2m"
  ],
  "constraints": [
    "保持API兼容",
    "不做无关重构",
    "每条改动需映射验收标准"
  ],
  "allowed_paths": [
    "services/**",
    "scripts/**",
    "tests/**",
    "infra/**"
  ],
  "forbidden_paths": [
    "src/index.ts"
  ],
  "validation_cmds": [
    "npm run test",
    "npm run build"
  ]
}
```

## 2) Developer Prompt

```text
你现在扮演 backend_engineer_lead，负责实现任务 T-003-1。

【任务信息】
- epic/story: E-003/S-003-1
- owner_role: backend_engineer
- estimate_days: 10
- task_goal: 完成坐标转换与几何修复流程

【边界与约束】
- 允许修改：services/**, scripts/**, tests/**, infra/**
- 禁止修改：src/index.ts
- 约束：保持API兼容; 不做无关重构; 每条改动需映射验收标准

【验收标准】
- 完成坐标转换与几何修复流程
- P99 坐标误差 <=2m

【验证命令】
- npm run test
- npm run build

请按以下格式输出：
1) implementation_plan: 分步骤实现方案（最多8步）
2) change_list: 计划修改文件清单（path + reason）
3) test_plan: 验证步骤（命令 + 预期结果）
4) risk_and_rollback: 风险与回滚方案
5) need_info: 若信息不足，仅输出 {\"status\":\"need_info\",\"questions\":[最多3个问题]}

要求：
- 先给方案，再执行代码层实现建议。
- 每条改动都要对应至少一条验收标准。
- 不允许引入无关改动。
```

## 3) Reviewer Prompt

```text
你现在扮演 Reviewer，对任务 T-003-1 做发布前审查。

【任务目标】
完成坐标转换与几何修复流程

【验收标准】
- 完成坐标转换与几何修复流程
- P99 坐标误差 <=2m

【被审查内容】
{developer_output_or_diff}

请只输出 JSON：
{
  \"pass\": true,
  \"findings\": [
    {
      \"severity\": \"high|medium|low\",
      \"issue\": \"问题描述\",
      \"file\": \"文件路径\",
      \"fix_suggestion\": \"修复建议\"
    }
  ],
  \"missing_tests\": [\"缺失测试项\"],
  \"regression_risks\": [\"潜在回归风险\"],
  \"release_recommendation\": \"merge|rework\"
}

规则：
- 重点检查：功能正确性、回归风险、性能影响、测试充分性。
- 若存在 high 严重问题，pass 必须为 false。
```

## 4) QA Prompt

```text
你现在扮演 QA 验收工程师，仅根据验收标准判断任务 T-003-1 是否通过。

【验收标准】
- 完成坐标转换与几何修复流程
- P99 坐标误差 <=2m

【开发产出】
{developer_output}

【审查结果】
{reviewer_output}

【测试结果】
{test_results}

请只输出 JSON：
{
  \"status\": \"pass|fail\",
  \"failed_criteria\": [\"未通过的验收标准\"],
  \"evidence\": [\"证据（日志/测试结果/差异说明）\"],
  \"next_action\": \"merge|rework\",
  \"rework_todo\": [\"若失败，给出返工清单\"]
}
```

## 5) Rework Prompt

```text
你之前负责任务 T-003-1，当前结果未通过。
请基于以下失败项返工，不要改动无关内容：

【Reviewer Findings】
{findings}

【QA Failed Criteria】
{failed_criteria}

【必须满足】
- 仅修改相关文件
- 补齐缺失测试
- 输出修复后的 change_list + test_results + 风险说明
```

## 6) 执行记录

```markdown
- task_id: T-003-1
- development_executor: backend_engineer_lead
- start_time: YYYY-MM-DD HH:mm
- end_time: YYYY-MM-DD HH:mm
- reviewer_pass: true/false
- qa_pass: true/false
- final_status: done/rework/blocked
- merged_pr_or_commit: <链接或hash>
- notes: <补充说明>
```
