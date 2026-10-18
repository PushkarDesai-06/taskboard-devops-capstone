import os
from datetime import date

from fastapi import Depends, FastAPI, HTTPException, Response, status
from prometheus_fastapi_instrumentator import Instrumentator
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

app = FastAPI(
    title="TaskBoard API",
    version=os.getenv("APP_VERSION", "dev"),
    description="Task management API for the Session 21 DevOps capstone.",
)

Instrumentator(excluded_handlers=["/metrics", "/health", "/ready"]).instrument(app).expose(
    app, include_in_schema=False
)

STATUSES = ["todo", "in_progress", "review", "done"]
PRIORITIES = ["low", "medium", "high", "urgent"]


@app.get("/")
def root():
    return {"service": "taskboard-backend", "version": app.version, "docs": "/docs"}


@app.get("/health")
def health():
    # Liveness: the process is up and able to answer HTTP.
    return {"status": "UP"}


@app.get("/ready")
def ready(response: Response, db: Session = Depends(get_db)):
    # Readiness: we can actually serve traffic, which means the database answers.
    try:
        db.execute(text("SELECT 1"))
    except Exception as exc:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {"status": "NOT_READY", "reason": type(exc).__name__}
    return {"status": "READY"}


@app.get("/api/tasks", response_model=list[schemas.TaskOut])
def list_tasks(
    status: schemas.Status | None = None,
    priority: schemas.Priority | None = None,
    db: Session = Depends(get_db),
):
    query = select(models.Task).order_by(models.Task.id.desc())
    if status:
        query = query.where(models.Task.status == status)
    if priority:
        query = query.where(models.Task.priority == priority)
    return db.scalars(query).all()


# Declared before /api/tasks/{task_id} so "stats" is not parsed as an id.
@app.get("/api/tasks/stats", response_model=schemas.TaskStats)
def task_stats(db: Session = Depends(get_db)):
    by_status = dict.fromkeys(STATUSES, 0)
    for value, count in db.execute(
        select(models.Task.status, func.count()).group_by(models.Task.status)
    ):
        by_status[value] = count

    by_priority = dict.fromkeys(PRIORITIES, 0)
    for value, count in db.execute(
        select(models.Task.priority, func.count()).group_by(models.Task.priority)
    ):
        by_priority[value] = count

    overdue = db.scalar(
        select(func.count())
        .select_from(models.Task)
        .where(models.Task.due_date < date.today(), models.Task.status != "done")
    )
    total = sum(by_status.values())
    return schemas.TaskStats(
        total=total,
        by_status=by_status,
        by_priority=by_priority,
        completion_rate=round(by_status["done"] / total * 100, 1) if total else 0.0,
        overdue=overdue or 0,
    )


def _get_task_or_404(db: Session, task_id: int) -> models.Task:
    task = db.get(models.Task, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    return task


@app.get("/api/tasks/{task_id}", response_model=schemas.TaskOut)
def get_task(task_id: int, db: Session = Depends(get_db)):
    return _get_task_or_404(db, task_id)


@app.post("/api/tasks", response_model=schemas.TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(payload: schemas.TaskCreate, db: Session = Depends(get_db)):
    task = models.Task(**payload.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@app.put("/api/tasks/{task_id}", response_model=schemas.TaskOut)
def update_task(task_id: int, payload: schemas.TaskUpdate, db: Session = Depends(get_db)):
    task = _get_task_or_404(db, task_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    return task


@app.delete("/api/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = _get_task_or_404(db, task_id)
    db.delete(task)
    db.commit()
