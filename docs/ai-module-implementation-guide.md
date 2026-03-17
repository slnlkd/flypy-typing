# Flypy Typing AI 模块实现讲解

## 文档定位

这不是一份泛化的 AI 教程，而是一份基于当前项目真实代码的实现讲解。

目标是帮你弄清楚这套 AI 模块到底怎么落地，包括：

- 后端接口怎么设计
- 模型怎么接
- LangChain 在哪里起作用
- LangGraph 在哪里起作用
- RAG 是怎么做入库和检索的
- 一次 AI 请求是如何从前端走到模型再回到页面的

如果你后续要系统学习 AI 开发，这份文档适合先当作“项目导读”。

---

## 一、先看整体架构

这个项目里的 AI 模块，不是“用某一个框架把所有事情包起来”，而是一个分层明确的工程实现。

核心链路可以概括成：

```text
前端 AI 面板
  -> FastAPI AI 路由
  -> CoachService 业务编排
  -> AIRuntime 调用模型
  -> KnowledgeBaseService 做 RAG
  -> 返回结构化结果给前端
```

当前最关键的后端文件有 4 个：

- `backend/app/api/routes/ai.py`
- `backend/app/services/coach.py`
- `backend/app/services/ai_runtime.py`
- `backend/app/services/knowledge_base.py`

建议你先把这 4 个文件对应起来理解，再去深入 LangChain、LangGraph、RAG 的框架概念。

---

## 二、路由层：AI 能力的入口

路由层在：

- `backend/app/api/routes/ai.py`

它的职责很简单：

- 定义接口
- 定义请求和响应结构
- 做登录态校验
- 把请求转发给 service 层

当前主要暴露了这些接口：

- `POST /api/ai/coach/analyze`
- `POST /api/ai/coach/tasks/generate`
- `POST /api/ai/content/generate`
- `POST /api/ai/qa`
- `POST /api/ai/knowledge-bases/{code}/ingest`

你可以注意到，路由层本身没有：

- 写提示词
- 写检索逻辑
- 直接调大模型
- 直接做向量计算

这说明当前项目的分层是对的：

**路由负责协议，业务逻辑在 service。**

### 你应该学什么

如果你以后自己做 AI 后端，路由层不要直接堆 AI 逻辑。否则后面功能一复杂，维护会很痛苦。

---

## 三、`CoachService`：AI 业务编排核心

核心文件：

- `backend/app/services/coach.py`

这是整个 AI 模块最值得重点看的部分。

它负责的不是“某一个单独模型调用”，而是把业务数据组装成 AI 能力。

当前主要能力有：

- `analyze()`：做教练分析
- `generate_tasks()`：生成训练任务
- `generate_content()`：生成练习内容
- `answer_question()`：做知识问答

你可以把它理解成 AI 应用里的“用例层”。

### 1. `analyze()`

这个方法负责把：

- 练习记录 `records`
- 错字 `wrong_chars`
- 当前训练目标 `goal`

转成：

- 分析摘要
- 弱项列表
- 推荐重点
- 训练任务
- 知识引用

这里并不是所有步骤都交给模型，而是先做很多规则计算，比如：

- `_compute_metrics()`
- `_weakness_labels()`
- `_build_tasks()`

这说明当前实现遵循一个很重要的工程原则：

**能用确定性规则算的，不要先丢给模型。**

### 2. `generate_content()`

这个方法先生成一份规则版内容，然后再尝试用模型优化：

- `char`
- `phrase`
- `article`

如果模型可用，就用 `AIRuntime.complete_text()` 让内容更自然。
如果模型不可用，就保留 fallback 文本。

这就是典型的：

**业务先可用，再让模型增强。**

### 3. `answer_question()`

这个方法最适合拿来学习 AI 工程完整链路。

它做的事情是：

1. 先从知识库检索 citations
2. 再拼 prompt
3. 再调模型
4. 模型失败就返回 fallback answer

也就是说，这不是普通聊天，而是标准的 RAG 问答流程。

### 你应该学什么

`CoachService` 最值得学习的，不是单个函数写法，而是这个思路：

- 业务逻辑先分层
- 规则和模型协作
- 检索和生成分开
- 永远保留 fallback

---

## 四、`AIRuntime`：模型调用抽象层

核心文件：

- `backend/app/services/ai_runtime.py`

这层的作用是把所有模型调用统一封装起来。

当前提供了 3 类能力：

- `complete_text()`：普通文本生成
- `complete_json()`：要求模型返回 JSON
- `embed_texts()`：生成 embedding

### 为什么要单独抽这一层

因为业务代码不应该到处写：

- OpenAI SDK 调用
- DeepSeek base URL
- model name
- chat completion 参数

如果上层每个 service 都直接写 SDK 调用，后面你一旦切模型提供商，改动会扩散到整个项目。

现在的实现是：

- `CoachService` 不关心具体 SDK
- `KnowledgeBaseService` 不关心具体 SDK
- 它们只依赖 `AIRuntime`

这就是典型的“模型运行时抽象”。

### 当前支持的能力

这套实现走的是 OpenAI 兼容协议，所以可以接：

- OpenAI
- DeepSeek
- 其他兼容 OpenAI API 的服务

### 你应该学什么

真实 AI 项目里，最容易腐烂的地方就是模型调用散落一地。

`AIRuntime` 这种薄封装很值得你模仿。

---

## 五、`KnowledgeBaseService`：RAG 的核心实现

核心文件：

- `backend/app/services/knowledge_base.py`

如果说 `CoachService` 是 AI 应用编排核心，那 `KnowledgeBaseService` 就是这个项目里 RAG 的核心。

它负责：

- 默认知识库初始化
- 文档切片
- 生成 embedding
- chunk 入库
- 向量检索
- 检索结果重排

### 1. 文本切片

入口函数：

- `split_text()`

它会把长文按固定长度切成 chunk，并保留一定 overlap。

这一步很关键，因为 embedding 和向量检索一般都不是拿整篇大文直接做，而是按 chunk 存储。

### 2. 入库

入口函数：

- `ingest_document()`

做的事情是：

1. 找到或创建知识库
2. 创建文档记录
3. 切 chunk
4. 给每个 chunk 生成 embedding
5. 写入 `KnowledgeChunk`

### 3. 检索

入口函数：

- `retrieve()`

当前的实现不是纯向量检索，而是：

1. 先按 `cosine_distance` 做向量召回
2. 再做 `_keyword_overlap()` 重排

也就是一个轻量 hybrid retrieval：

- 向量负责召回
- 关键词负责排序校正

这比纯向量检索更稳，尤其适合中文训练规则类知识。

### 4. embedding fallback

如果没有配置真实 embedding 模型，系统会退回：

- `_hash_embed()`

这不是高质量语义向量，但它保证了功能仍可运行。

这体现了一个工程思路：

**先保证系统可用，再逐步提升效果。**

### 你应该学什么

RAG 不是“接个向量库”这么简单。

完整链路应该是：

`文档 -> chunk -> embedding -> 存储 -> 检索 -> 重排 -> 注入 prompt`

当前项目已经把这条链基本做完整了。

---

## 六、LangChain 在这个项目里具体做了什么

在：

- `backend/app/services/coach.py`

当前项目里引入了：

```python
from langchain_core.prompts import ChatPromptTemplate
```

实际用途主要是 `_render_prompt()`。

### 它在这里的职责

不是“主框架”，而是一个 Prompt 组织工具。

作用是把：

- `system_prompt`
- `user_prompt`

按消息结构组装好。

如果没装 LangChain，也能直接降级成普通字符串。

### 这说明什么

说明当前项目不是为了“全套拥抱 LangChain”而设计的，而是只用了它最有价值的一小部分能力。

这非常符合真实项目：

- 需要 PromptTemplate，就用
- 不需要的部分，不强上

### 你应该学什么

LangChain 不是必须整个框架一口吞。

你可以先学它最实用的几块：

- PromptTemplate
- OutputParser
- Retriever 抽象
- ChatModel 封装

---

## 七、LangGraph 在这个项目里具体做了什么

仍然在：

- `backend/app/services/coach.py`

当前项目用了：

```python
from langgraph.graph import END, START, StateGraph
```

最核心的逻辑在：

- `_run_graph()`

### 当前图里有哪些节点

- `collect_user_state`
- `analyze_weakness`
- `retrieve_knowledge`
- `generate_plan`

然后把它们按顺序连起来：

```text
START
 -> collect_user_state
 -> analyze_weakness
 -> retrieve_knowledge
 -> generate_plan
 -> END
```

### 这里为什么适合 LangGraph

因为“教练分析”不是一个单点动作，而是多步骤流程：

1. 先算指标
2. 再找弱项
3. 再查知识
4. 再产出训练计划

这种流程如果以后继续长大，LangGraph 会很适合扩展，例如再加：

- `persist_result`
- `generate_followup`
- `choose_next_training_mode`

### 注意一个很重要的点

图里的节点不是都在调模型。

很多节点只是普通 Python 处理。

这反而是正确做法，因为 LangGraph 的价值是：

**编排状态流，不是强迫每一步都变成 LLM 调用。**

### 你应该学什么

学 LangGraph 时，不要把它理解成“图形化聊天工具”。

它更像：

- AI workflow orchestrator
- 有状态业务流程图

---

## 八、以 `/api/ai/qa` 为例，走一遍完整调用链

这是当前项目里最适合学习的一条链路。

### 第 1 步：前端发请求

前端会把这些信息发到后端：

- 用户问题 `question`
- 最近练习记录 `records`
- 错字列表 `wrongChars`

### 第 2 步：FastAPI 路由接收

在：

- `backend/app/api/routes/ai.py`

对应函数：

- `ask_ai()`

它做的事情：

- 校验请求结构
- 校验登录态
- 调 `coach_service.answer_question(...)`

### 第 3 步：先做 RAG 检索

在：

- `CoachService.answer_question()`

首先会执行：

- `_retrieve_knowledge()`

也就是先拿到知识片段 `citations`。

这一点非常关键：

**先检索，再生成。**

这就是 RAG 的核心顺序。

### 第 4 步：构造 fallback

在正式调模型前，系统会先准备一份 fallback answer。

这样即使模型调用失败，也不会整个接口挂掉。

### 第 5 步：拼 Prompt

Prompt 里会包含：

- 用户问题
- 近期表现指标
- 高频错字
- 检索到的知识片段

### 第 6 步：调模型

通过：

- `AIRuntime.complete_text()`

把 prompt 发到 DeepSeek 或兼容的 OpenAI 接口。

### 第 7 步：返回结果

如果模型成功：

- 返回模型回答 + citations

如果模型失败：

- 返回 fallback answer + citations

### 这一条链最值得你记住的结构

```text
问题输入
 -> 知识检索
 -> prompt 组装
 -> 模型生成
 -> fallback 兜底
 -> 返回答案和引用
```

---

## 九、这套实现里最值得学习的工程实践

### 1. 规则优先，模型增强

项目里很多逻辑不是模型做的，而是规则做的：

- 指标计算
- 弱项判断
- 任务结构生成

模型主要负责语言表达和增强。

这很重要，因为很多初学者会过度依赖大模型。

### 2. Service 分层清楚

- 路由层负责接口
- `CoachService` 负责业务
- `AIRuntime` 负责模型
- `KnowledgeBaseService` 负责 RAG

这让系统很容易继续扩展。

### 3. fallback 思维非常强

项目里有很多降级路径：

- LangChain 不可用时降级
- LangGraph 不可用时降级
- embedding 不可用时降级
- 模型不可用时降级

这说明当前实现是按“可上线”思维写的，而不是 demo 思维。

### 4. RAG 是业务增强，不是独立炫技模块

知识检索最终服务的是：

- 教练分析
- AI 问答

这比单独做一个“知识库聊天页”更有产品价值。

### 5. 模型调用被统一抽象

这一点以后你自己做项目时一定要保留。

不要在业务函数里到处直接写 SDK。

---

## 十、如果你后面要继续系统学习，建议怎么学

建议顺序：

### 第一步：先吃透这 4 个文件

- `backend/app/services/coach.py`
- `backend/app/services/knowledge_base.py`
- `backend/app/services/ai_runtime.py`
- `backend/app/api/routes/ai.py`

### 第二步：按职责学，不要按名词学

学习顺序建议是：

1. 先看模型运行时抽象
2. 再看 RAG
3. 再看业务编排
4. 最后看 LangGraph 和 LangChain 的增强作用

因为真实工程里，最难的是职责划分，不是框架 API。

### 第三步：自己重写一遍 `/api/ai/qa`

这个接口最适合练手，因为它同时包含：

- 路由
- RAG
- Prompt
- 模型调用
- fallback

只要你能自己从零重写一版，基本就真正入门了。

---

## 十一、后续可以继续深入的专题

后面如果你系统学习，我建议按下面顺序继续：

### 1. 逐行讲 `CoachService`

重点学习：

- AI 业务编排
- LangGraph 状态流
- 规则和模型怎么配合

### 2. 逐行讲 `KnowledgeBaseService`

重点学习：

- chunk 切片
- embedding
- 向量检索
- hybrid retrieval

### 3. 手写一个最小 AI demo

目标是自己从零写：

- `FastAPI + DeepSeek + 简单 RAG`

这样会真正把知识从“看懂”变成“能自己做”。

---

## 十二、总结

这个项目里的 AI 模块，最值得学的不是某个框架本身，而是它的工程组织方式：

- 用 `FastAPI` 管接口
- 用 `CoachService` 管业务编排
- 用 `AIRuntime` 管模型调用
- 用 `KnowledgeBaseService` 管 RAG
- 用 `LangChain` 做 Prompt 增强
- 用 `LangGraph` 做工作流编排
- 用 fallback 保证系统稳定

如果你能把这套分层真正理解透，后面再去学更复杂的 Agent、Tool Calling、多工作流系统，就会顺很多。
