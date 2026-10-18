from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Status = Literal["todo", "in_progress", "review", "done"]
Priority = Literal["low", "medium", "high", "urgent"]


class TaskBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    status: Status = "todo"
    priority: Priority = "medium"
    assignee: str | None = Field(default=None, max_length=100)
    due_date: date | None = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    status: Status | None = None
    priority: Priority | None = None
    assignee: str | None = Field(default=None, max_length=100)
    due_date: date | None = None


class TaskOut(TaskBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class TaskStats(BaseModel):
    total: int
    by_status: dict[str, int]
    by_priority: dict[str, int]
    completion_rate: float
    overdue: int
