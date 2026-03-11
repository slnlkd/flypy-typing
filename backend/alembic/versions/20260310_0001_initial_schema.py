"""initial schema

Revision ID: 20260310_0001
Revises:
Create Date: 2026-03-10 00:00:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260310_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("email", sa.String(length=255), nullable=False, unique=True),
        sa.Column("display_name", sa.String(length=100), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="active"),
        sa.Column("is_admin", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("password_hash", sa.String(length=255), nullable=True),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
    )
    op.create_table(
        "email_login_codes",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("code", sa.String(length=16), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "user_sessions",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.BigInteger(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("token_id", sa.String(length=64), nullable=False, unique=True),
        sa.Column("refresh_token_id", sa.String(length=64), nullable=False, unique=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "user_settings",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.BigInteger(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("dark_mode", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("show_keyboard", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("show_pinyin", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("highlight_keys", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("font_size", sa.Integer(), nullable=False, server_default="24"),
        sa.Column("sound_enabled", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("sound_volume", sa.Integer(), nullable=False, server_default="50"),
        sa.Column("char_count", sa.Integer(), nullable=False, server_default="50"),
        sa.Column("phrase_count", sa.Integer(), nullable=False, server_default="20"),
        sa.Column("char_pool", sa.Integer(), nullable=False, server_default="500"),
        sa.Column("practice_type", sa.String(length=32), nullable=False, server_default="random"),
        sa.Column("timer_mode", sa.String(length=32), nullable=False, server_default="none"),
        sa.Column("daily_goal_chars", sa.Integer(), nullable=False, server_default="1000"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
    )
    op.create_table(
        "content_articles",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("slug", sa.String(length=120), nullable=False, unique=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("category", sa.String(length=64), nullable=False),
        sa.Column("difficulty", sa.String(length=32), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="draft"),
        sa.Column("tags", sa.JSON(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("source", sa.String(length=255), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
    )
    op.create_table(
        "practice_sessions",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.BigInteger(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("mode", sa.String(length=32), nullable=False),
        sa.Column("content_type", sa.String(length=32), nullable=True),
        sa.Column("content_id", sa.BigInteger(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
        sa.Column("timer_mode", sa.String(length=32), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "practice_records",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("session_id", sa.BigInteger(), sa.ForeignKey("practice_sessions.id", ondelete="CASCADE"), nullable=True),
        sa.Column("user_id", sa.BigInteger(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("mode", sa.String(length=32), nullable=False),
        sa.Column("speed", sa.Integer(), nullable=False),
        sa.Column("accuracy", sa.Integer(), nullable=False),
        sa.Column("total_chars", sa.Integer(), nullable=False),
        sa.Column("correct_chars", sa.Integer(), nullable=False),
        sa.Column("wrong_chars", sa.Integer(), nullable=False),
        sa.Column("max_combo", sa.Integer(), nullable=False),
        sa.Column("duration", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "wrong_char_stats",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.BigInteger(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("char", sa.String(length=16), nullable=False),
        sa.Column("pinyin", sa.String(length=64), nullable=False),
        sa.Column("flypy_code", sa.String(length=32), nullable=False),
        sa.Column("count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_wrong_char_stats_user_char", "wrong_char_stats", ["user_id", "char"], unique=True)
    op.create_table(
        "knowledge_bases",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("code", sa.String(length=80), nullable=False, unique=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="draft"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
    )
    op.create_table(
        "knowledge_documents",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("knowledge_base_id", sa.BigInteger(), sa.ForeignKey("knowledge_bases.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("source_type", sa.String(length=32), nullable=False),
        sa.Column("storage_path", sa.String(length=512), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
    )
    op.create_table(
        "ai_model_configs",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("provider", sa.String(length=64), nullable=False),
        sa.Column("model_type", sa.String(length=32), nullable=False),
        sa.Column("model_name", sa.String(length=120), nullable=False),
        sa.Column("is_enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("settings_json", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
    )
    op.create_table(
        "coach_profiles",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.BigInteger(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("level", sa.String(length=32), nullable=False, server_default="beginner"),
        sa.Column("weakness_summary", sa.Text(), nullable=True),
        sa.Column("goals_json", sa.JSON(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "coach_recommendations",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.BigInteger(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("recommendation_type", sa.String(length=32), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("coach_recommendations")
    op.drop_table("coach_profiles")
    op.drop_table("ai_model_configs")
    op.drop_table("knowledge_documents")
    op.drop_table("knowledge_bases")
    op.drop_index("ix_wrong_char_stats_user_char", table_name="wrong_char_stats")
    op.drop_table("wrong_char_stats")
    op.drop_table("practice_records")
    op.drop_table("practice_sessions")
    op.drop_table("content_articles")
    op.drop_table("user_settings")
    op.drop_table("user_sessions")
    op.drop_table("email_login_codes")
    op.drop_table("users")
