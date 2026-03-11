from app.workers.celery_app import celery_app


@celery_app.task(name="ai.generate_user_profile")
def generate_user_profile(user_id: int) -> dict[str, int]:
    return {"user_id": user_id, "status": 0}
