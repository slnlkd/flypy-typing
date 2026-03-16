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
