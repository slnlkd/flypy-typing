from celery import Celery

from app.core.config import settings

celery_app = Celery("flypy_typing", broker=settings.redis_url, backend=settings.redis_url)
celery_app.conf.task_default_queue = "flypy-default"
