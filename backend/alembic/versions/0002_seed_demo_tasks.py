"""seed demo tasks

Revision ID: 0002
Revises: 0001
Create Date: 2026-10-18
"""
from datetime import date, timedelta

from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None

tasks = sa.table(
    "tasks",
    sa.column("title", sa.String),
    sa.column("description", sa.Text),
    sa.column("status", sa.String),
    sa.column("priority", sa.String),
    sa.column("assignee", sa.String),
    sa.column("due_date", sa.Date),
)


def upgrade() -> None:
    today = date.today()
    op.bulk_insert(
        tasks,
        [
            {"title": "Set up GitHub Actions pipeline", "description": "pytest, build, Trivy, push to GHCR",
             "status": "done", "priority": "high", "assignee": "Pushkar", "due_date": today - timedelta(days=6)},
            {"title": "Write Terraform for VPC + EKS", "description": "ap-south-1, two AZs, single NAT",
             "status": "done", "priority": "high", "assignee": "Pushkar", "due_date": today - timedelta(days=3)},
            {"title": "Package app as a Helm chart", "description": "backend, frontend, postgres, ingress, HPA",
             "status": "review", "priority": "medium", "assignee": "Riya", "due_date": today + timedelta(days=1)},
            {"title": "Grafana dashboard for API latency", "description": "p95 latency and error rate panels",
             "status": "in_progress", "priority": "medium", "assignee": "Arjun", "due_date": today + timedelta(days=3)},
            {"title": "Load test the HPA", "description": "Drive CPU above 50% and watch replicas grow",
             "status": "in_progress", "priority": "urgent", "assignee": "Pushkar", "due_date": today},
            {"title": "Document troubleshooting runbook", "description": "ImagePullBackOff and empty endpoints",
             "status": "todo", "priority": "low", "assignee": "Meera", "due_date": today + timedelta(days=7)},
            {"title": "Rotate database credentials", "description": "Move secrets to AWS Secrets Manager",
             "status": "todo", "priority": "high", "assignee": "Arjun", "due_date": today - timedelta(days=1)},
        ],
    )


def downgrade() -> None:
    op.execute("DELETE FROM tasks")
