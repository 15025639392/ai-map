# Prompt Chaining 可落地最佳实践指南

> 目标：把“链式提示（Prompt Chaining）”从概念变成可上线、可评估、可维护的生产流程。

## 1. 基于原文的核心结论（分析）

根据 Prompt Engineering Guide 的《链式提示》页面，链式提示的核心价值有三点：

1. 将复杂任务拆成多个子任务，逐步完成，显著提升稳定性与可控性。  
2. 每一步输出都可检查、可回放，便于定位问题（透明度更高）。  
3. 适合“多次转换/多约束”任务，特别是文档问答、复杂对话助手、个性化流程。

页面示例采用“先抽取引文，再基于引文回答”的两段链路，这个模式非常适合落地：

- 第 1 步：检索/抽取相关证据。  
- 第 2 步：根据证据生成答案。  

这比“一次性大提示”更容易保证答案可追溯。

## 2. 什么时候该用链，什么时候不该用

### 适用场景（建议用）

- 任务至少包含 2 个不同目标（如“抽取 + 推理 + 生成”）。
- 输出必须可解释（要证据、要审计、要复盘）。
- 需要对某一步单独优化（如抽取准确率低）。
- 存在多文档处理，且部分步骤可并行。

### 不适用场景（先别用）

- 单一、短路径任务（例如简单改写、单次分类）。
- 时延极度敏感且无法并行。
- 缺少评估数据，无法判断链路是否优于单提示。

## 3. 生产级链路设计原则（可直接执行）

### 原则 A：一步一职责（Single Responsibility）

每个子提示只做一件事：

- Step 1: 抽取证据
- Step 2: 证据清洗
- Step 3: 回答生成
- Step 4: 质量校验

避免一个步骤同时做“检索 + 总结 + 立场判断”。

### 原则 B：为每一步定义 I/O 契约

每个步骤必须有固定输入输出结构（推荐 JSON/XML）。

最小契约示例：

```json
{
  "step": "extract_quotes",
  "input": {
    "question": "string",
    "document": "string"
  },
  "output": {
    "quotes": ["string"],
    "status": "ok|no_quote|error"
  }
}
```

### 原则 C：失败可回退

为每步定义失败策略：

- `no_quote`：触发“扩展检索”或降级回复“未找到证据”。
- `format_error`：自动重试一次（更强格式约束）。
- `low_confidence`：进入人工审核队列。

### 原则 D：可观测性优先

必须记录：

- 每步输入摘要（脱敏）
- 每步输出
- 令牌消耗与耗时
- 错误码与重试次数
- 最终答案引用证据的覆盖率

### 原则 E：能并行就并行

对独立子任务并发执行，例如：

- 多文档证据抽取并行
- 多候选答案生成并行
- 再做统一排序与融合

## 4. 标准四层链路模板（推荐起步架构）

## Layer 1: Intent & Scope（任务界定）

输入用户问题，输出：任务类型、信息边界、成功标准。

## Layer 2: Evidence（证据提取）

从文档/知识库中抽取相关片段，仅输出证据，不做结论。

## Layer 3: Synthesis（答案生成）

只基于 Layer 2 的证据作答；证据不足时明确说“不足”。

## Layer 4: Verification（校验与修订）

检查：事实一致性、格式合规、引用完整性；必要时回写 Layer 3 重生成。

## 5. 文档问答落地 SOP（对照原文示例升级）

### Step 1 抽取（Extractor）

系统要求：只输出 `<quotes>` 包裹的证据列表；找不到输出固定标记。

### Step 2 清洗（Normalizer）

移除引用噪声（如 `[27]`）、重复句、超长片段；保留原文定位信息。

### Step 3 回答（Answerer）

必须遵守：

- 仅依据证据回答
- 答案后附“证据映射”
- 无证据时拒答或说明信息不足

### Step 4 校验（Verifier）

检查项：

- 每条关键结论是否有对应证据
- 是否出现证据外新增事实
- 输出格式是否满足前端契约

## 6. 提示词工程模板（可直接复制）

### 6.1 证据抽取模板

```text
你是证据抽取器。任务：仅从给定文档中抽取与问题直接相关的原文片段。

输出要求：
1) 只输出 JSON。
2) 字段：status, quotes。
3) 若无相关证据，status="no_quote"，quotes=[]。

问题：{{question}}
文档：{{document}}
```

### 6.2 回答生成模板

```text
你是问答助手。仅根据输入 quotes 回答，不可引入 quotes 之外的新事实。

输出 JSON 字段：
- answer: 字符串
- evidence_used: 使用到的 quotes 下标数组
- confidence: 0~1
- needs_more_info: 布尔值

question: {{question}}
quotes: {{quotes_json}}
```

### 6.3 质量校验模板

```text
你是质量审查器。检查 answer 是否严格由 quotes 支撑。

输出 JSON 字段：
- pass: 布尔值
- issues: 字符串数组
- fix_instruction: 给回答器的修复建议

question: {{question}}
quotes: {{quotes_json}}
answer: {{answer_json}}
```

## 7. 评估与验收（上线前必做）

### 离线评估（至少 100 条样本）

- Quote Recall：应抽到关键证据的比例
- Grounded Accuracy：答案被证据支撑的比例
- Format Pass Rate：结构化输出一次通过率
- End-to-End Latency：P95 延迟
- Cost per Query：单请求成本

### 在线监控

- 每步失败率与重试率
- 用户追问率（反映首答质量）
- 人工兜底率
- 幻觉告警率（无证据结论）

### 发布门槛（示例）

- Grounded Accuracy >= 90%
- Format Pass Rate >= 98%
- P95 延迟 <= 6s
- 幻觉告警率 <= 2%

## 8. 常见反模式（高频踩坑）

1. 把所有步骤塞进一个提示，导致不可控。  
2. 子步骤无结构化输出，后续解析脆弱。  
3. 没有“无证据”分支，模型被迫胡编。  
4. 没有步骤级日志，问题无法复盘。  
5. 串行执行全部步骤，忽视可并行环节。

## 9. 30 天落地路线图（团队执行版）

- 第 1 周：定义目标任务 + 样本集 + 指标基线。  
- 第 2 周：完成 2~4 步链路与 I/O 契约。  
- 第 3 周：接入评估与观测，完成失败回退策略。  
- 第 4 周：灰度发布、A/B 对比单提示方案、优化成本与时延。

## 10. 关键结论

链式提示不是“把提示写长”，而是“把任务拆对、链路建稳、评估做实”。

一个可落地的链式系统至少应具备：

- 子任务拆分
- 结构化交接
- 失败回退
- 全链路观测
- 指标驱动迭代

---

## 参考来源

- Prompt Engineering Guide（中文）《链式提示》：https://www.promptingguide.ai/zh/techniques/prompt_chaining
- Anthropic Docs《Chain complex prompts for stronger performance》：https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/chain-prompts
- OpenAI Docs《Reasoning best practices》：https://developers.openai.com/api/docs/guides/reasoning-best-practices
