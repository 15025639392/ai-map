# AI 任务驱动器模板（Task Driver）

> 用途：把 `P7` 里的 task 交给 AI 执行，按「开发 -> 审查 -> 验收」闭环推进。  
> 输入来源：`prompt/p7-reference-output.md` 中 `delivery_pack.backlog[].stories[].tasks[]`。

---

## 1. 使用方式（每个 task 单独跑）

1. 从 `P7` 选择一个 `task_id`。  
2. 填写下面“任务上下文卡”。  
3. 依次执行：`开发提示词` -> `审查提示词` -> `验收提示词`。  
4. 若审查或验收失败，把失败项回灌给开发提示词重做。  
5. 完成后记录到“任务执行记录”。

---

## 2. 任务上下文卡（先填这个）

```json
{
  "task_id": "T-XXX",
  "story_id": "S-XXX",
  "epic_id": "E-XXX",
  "task_goal": "一句话描述本任务目标",
  "owner_role": "frontend_engineer|backend_engineer|graphics_engineer|qa_engineer|devops_engineer",
  "development_executor": "frontend_engineer_lead|backend_engineer_lead|graphics_engineer_lead|qa_engineer_lead|devops_engineer_lead",
  "estimate_days": 3,
  "acceptance_criteria": [
    "验收标准1",
    "验收标准2"
  ],
  "constraints": [
    "保持API兼容",
    "不做无关重构"
  ],
  "allowed_paths": [
    "src/**",
    "tests/**"
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

---

## 3. 开发提示词（Developer）

> 把下面整段发给 AI（替换花括号变量）。

```text
你现在扮演 {development_executor}，负责实现任务 {task_id}。

【任务信息】
- epic/story: {epic_id}/{story_id}
- owner_role: {owner_role}
- estimate_days: {estimate_days}
- task_goal: {task_goal}

【边界与约束】
- 允许修改：{allowed_paths}
- 禁止修改：{forbidden_paths}
- 约束：{constraints}

【验收标准】
{acceptance_criteria}

【验证命令】
{validation_cmds}

请按以下格式输出：
1) implementation_plan: 分步骤实现方案（最多8步）
2) change_list: 计划修改文件清单（path + reason）
3) test_plan: 验证步骤（命令 + 预期结果）
4) risk_and_rollback: 风险与回滚方案
5) need_info: 若信息不足，仅输出 {"status":"need_info","questions":[最多3个问题]}

要求：
- 先给方案，再执行代码层实现建议。
- 每条改动都要对应至少一条验收标准。
- 不允许引入无关改动。
```

---

## 4. 审查提示词（Reviewer）

> 把「开发产出 + 代码diff/说明」喂给这个提示词。

```text
你现在扮演 Reviewer，对任务 {task_id} 做发布前审查。

【任务目标】
{task_goal}

【验收标准】
{acceptance_criteria}

【被审查内容】
{developer_output_or_diff}

请只输出 JSON：
{
  "pass": true,
  "findings": [
    {
      "severity": "high|medium|low",
      "issue": "问题描述",
      "file": "文件路径",
      "fix_suggestion": "修复建议"
    }
  ],
  "missing_tests": ["缺失测试项"],
  "regression_risks": ["潜在回归风险"],
  "release_recommendation": "merge|rework"
}

规则：
- 重点检查：功能正确性、回归风险、性能影响、测试充分性。
- 若存在 high 严重问题，pass 必须为 false。
```

---

## 5. 验收提示词（QA）

> 把「开发产出 + 审查结果 + 测试结果」喂给这个提示词。

```text
你现在扮演 QA 验收工程师，仅根据验收标准判断任务 {task_id} 是否通过。

【验收标准】
{acceptance_criteria}

【开发产出】
{developer_output}

【审查结果】
{reviewer_output}

【测试结果】
{test_results}

请只输出 JSON：
{
  "status": "pass|fail",
  "failed_criteria": ["未通过的验收标准"],
  "evidence": ["证据（日志/测试结果/差异说明）"],
  "next_action": "merge|rework",
  "rework_todo": ["若失败，给出返工清单"]
}
```

---

## 6. 失败回灌提示词（Rework）

> 当 Reviewer/QA 失败时，直接把失败项回灌给开发者。

```text
你之前负责任务 {task_id}，当前结果未通过。
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

---

## 7. 任务执行记录（建议复制到工单系统）

```markdown
- task_id: T-XXX
- development_executor: xxx_lead
- start_time: YYYY-MM-DD HH:mm
- end_time: YYYY-MM-DD HH:mm
- reviewer_pass: true/false
- qa_pass: true/false
- final_status: done/rework/blocked
- merged_pr_or_commit: <链接或hash>
- notes: <补充说明>
```

---

## 8. 最小执行清单（Checklist）

- [ ] 已填写任务上下文卡（含 `development_executor`）
- [ ] Developer 输出包含实现方案/改动清单/测试计划
- [ ] Reviewer 输出为结构化 JSON 且无 high 未解决问题
- [ ] QA 输出通过，或给出明确返工清单
- [ ] 任务执行记录已落档

