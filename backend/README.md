# FastAPI Backend

## 目标

正式业务后台，覆盖：

- 认证与用户
- 练习数据
- 内容题库
- 管理后台 API
- AI 模块预留

## 本地启动

1. 复制环境变量

```bash
cp .env.example .env
```

2. 安装依赖

```bash
pip install -e .[ai]
```

3. 启动数据库与缓存

```bash
docker compose -f docker-compose.backend.yml up -d postgres redis minio
```

4. 执行迁移

```bash
alembic upgrade head
```

5. 启动服务

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## DeepSeek 配置

当前后端按 OpenAI 兼容接口接模型，已经兼容 DeepSeek。要启用 DeepSeek，在 `backend/.env` 里增加：

```env
CHAT_PROVIDER=deepseek
DEEPSEEK_API_KEY=your-deepseek-api-key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_CHAT_MODEL=deepseek-chat
CHAT_TEMPERATURE=0.3
```

如果你后面想切换推理模型，也可以把 `DEEPSEEK_CHAT_MODEL` 改成：

```env
DEEPSEEK_CHAT_MODEL=deepseek-reasoner
```

说明：

- `deepseek-chat` 适合大多数对话、教练分析、题目生成场景
- `deepseek-reasoner` 更偏推理，成本和响应延迟通常更高
- `DEEPSEEK_BASE_URL` 默认就是 `https://api.deepseek.com`
- 当前实现会优先读取 `CHAT_PROVIDER=deepseek` 下的 `DEEPSEEK_*` 配置

## RAG 与向量检索

当前后端已支持基于 `pgvector` 的知识库入库与检索。

可选的 embedding 配置如下：

```env
EMBEDDING_PROVIDER=openai
EMBEDDING_API_KEY=
EMBEDDING_BASE_URL=
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=256
```

说明：

- 如果配置了 embedding 接口，会优先使用真实 embedding
- 如果未配置，会自动退回本地哈希向量，仍可完成入库和检索，但语义效果较弱
- 默认知识库会在应用启动时自动写入数据库，用于 AI 教练和问答

## SMTP 验证码

启用真实邮箱验证码发送时，先在 `backend/.env` 配置：

```env
SMTP_ENABLED=true
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=your-account@example.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-account@example.com
SMTP_USE_TLS=true
SMTP_USE_SSL=false
SMTP_TIMEOUT_SECONDS=15
SMTP_SUBJECT_PREFIX=[Flypy]
SMTP_FALLBACK_ENABLED=false
SMTP_FALLBACK_HOST=
SMTP_FALLBACK_PORT=587
SMTP_FALLBACK_USERNAME=
SMTP_FALLBACK_PASSWORD=
SMTP_FALLBACK_FROM=
SMTP_FALLBACK_USE_TLS=true
SMTP_FALLBACK_USE_SSL=false
```

Docker 本地开发会直接读取 `backend/.env`，修改后需要重启后端容器：

```bash
docker compose -f backend/docker-compose.backend.yml up -d --build backend
```

常见规则：

- `587` 端口通常配 `SMTP_USE_TLS=true`
- `465` 端口通常配 `SMTP_USE_SSL=true`
- `SMTP_PASSWORD` 一般填邮箱授权码，不是网页登录密码
- 如果主 SMTP 不稳定，可配置 `SMTP_FALLBACK_*` 作为备用线路，发送失败时会自动重试备用服务

## 文档

- Swagger UI: `http://localhost:8000/docs`
- OpenAPI: `http://localhost:8000/openapi.json`
