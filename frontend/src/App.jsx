import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "./api.js";

const STATUSES = [
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
];
const PRIORITIES = ["low", "medium", "high", "urgent"];
const STATUS_LABEL = Object.fromEntries(STATUSES.map((s) => [s.value, s.label]));

const PIPELINE = [
  { name: "Test", detail: "pytest + vite build" },
  { name: "Build", detail: "docker buildx" },
  { name: "Scan", detail: "Trivy HIGH/CRITICAL" },
  { name: "Push", detail: "ghcr.io" },
  { name: "Deploy", detail: "helm upgrade" },
];

const NAV = [
  { label: "Dashboard", icon: "▦", active: true },
  { label: "My tasks", icon: "✓" },
  { label: "Projects", icon: "◫" },
  { label: "Team", icon: "◎" },
  { label: "Reports", icon: "▤" },
  { label: "Settings", icon: "⚙" },
];

const WORKSPACES = [
  { name: "Platform", color: "#6366f1" },
  { name: "Mobile app", color: "#14b8a6" },
  { name: "Marketing site", color: "#f59e0b" },
];

const EMPTY_FORM = { title: "", description: "", status: "todo", priority: "medium", assignee: "", due_date: "" };

function initials(name) {
  return (name || "?")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function timeAgo(iso) {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function isOverdue(task) {
  return task.due_date && task.status !== "done" && task.due_date < new Date().toISOString().slice(0, 10);
}

function Sidebar({ open, onClose }) {
  return (
    <aside className={`sidebar ${open ? "sidebar--open" : ""}`}>
      <div className="brand">
        <span className="brand__logo">✓</span>
        <span className="brand__name">TaskBoard</span>
        <button className="sidebar__close" onClick={onClose} aria-label="Close menu">×</button>
      </div>
      <nav className="nav">
        {NAV.map((item) => (
          <a key={item.label} href="#" className={`nav__item ${item.active ? "nav__item--active" : ""}`}>
            <span className="nav__icon">{item.icon}</span>
            {item.label}
          </a>
        ))}
      </nav>
      <div className="sidebar__section">Workspaces</div>
      <nav className="nav">
        {WORKSPACES.map((ws) => (
          <a key={ws.name} href="#" className="nav__item">
            <span className="nav__dot" style={{ background: ws.color }} />
            {ws.name}
          </a>
        ))}
      </nav>
      <div className="sidebar__footer">
        <span className="avatar avatar--sm">PD</span>
        <div>
          <div className="sidebar__user">Pushkar Desai</div>
          <div className="sidebar__role">Platform engineer</div>
        </div>
      </div>
    </aside>
  );
}

function KpiCards({ stats }) {
  const cards = [
    { label: "Total tasks", value: stats.total, hint: `${stats.by_status.todo} waiting to start`, tone: "indigo" },
    { label: "In progress", value: stats.by_status.in_progress, hint: `${stats.by_status.review} in review`, tone: "sky" },
    { label: "Completion", value: `${stats.completion_rate}%`, hint: `${stats.by_status.done} done`, tone: "emerald", bar: stats.completion_rate },
    { label: "Overdue", value: stats.overdue, hint: stats.overdue ? "needs attention" : "all on track", tone: "rose" },
  ];
  return (
    <section className="kpis">
      {cards.map((card) => (
        <div key={card.label} className={`kpi kpi--${card.tone}`}>
          <div className="kpi__label">{card.label}</div>
          <div className="kpi__value">{card.value}</div>
          {card.bar !== undefined && (
            <div className="kpi__bar"><span style={{ width: `${card.bar}%` }} /></div>
          )}
          <div className="kpi__hint">{card.hint}</div>
        </div>
      ))}
    </section>
  );
}

function TaskTable({ tasks, onStatusChange, onDelete }) {
  if (tasks.length === 0) {
    return <div className="empty">No tasks here yet. Create one with the “New task” button.</div>;
  }
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Task</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Assignee</th>
            <th>Due</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td data-label="Task">
                <div className="task__title">{task.title}</div>
                {task.description && <div className="task__desc">{task.description}</div>}
              </td>
              <td data-label="Status">
                <select
                  className={`status status--${task.status}`}
                  value={task.status}
                  onChange={(e) => onStatusChange(task, e.target.value)}
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </td>
              <td data-label="Priority">
                <span className={`badge badge--${task.priority}`}>{task.priority}</span>
              </td>
              <td data-label="Assignee">
                {task.assignee ? (
                  <span className="assignee">
                    <span className="avatar avatar--sm">{initials(task.assignee)}</span>
                    {task.assignee}
                  </span>
                ) : (
                  <span className="muted">Unassigned</span>
                )}
              </td>
              <td data-label="Due" className={isOverdue(task) ? "overdue" : ""}>
                {task.due_date || <span className="muted">-</span>}
              </td>
              <td className="actions">
                <button className="icon-btn" onClick={() => onDelete(task)} aria-label={`Delete ${task.title}`} title="Delete">
                  🗑
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActivityFeed({ tasks }) {
  const recent = [...tasks].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 6);
  return (
    <div className="card">
      <div className="card__title">Recent activity</div>
      <ul className="feed">
        {recent.map((task) => {
          // the two timestamps are set separately on insert, so allow a small gap
          const created = Math.abs(new Date(task.updated_at) - new Date(task.created_at)) < 1000;
          return (
            <li key={task.id} className="feed__item">
              <span className="avatar avatar--sm">{initials(task.assignee)}</span>
              <div>
                <div>
                  <strong>{task.assignee || "Someone"}</strong> {created ? "created" : "moved"}{" "}
                  <em>{task.title}</em>
                  {!created && <> to <strong>{STATUS_LABEL[task.status]}</strong></>}
                </div>
                <div className="feed__time">{timeAgo(task.updated_at)}</div>
              </div>
            </li>
          );
        })}
        {recent.length === 0 && <li className="muted">Nothing yet.</li>}
      </ul>
    </div>
  );
}

function PipelineCard() {
  return (
    <div className="card">
      <div className="card__title">Delivery pipeline</div>
      <ol className="pipeline">
        {PIPELINE.map((stage) => (
          <li key={stage.name} className="pipeline__stage">
            <span className="pipeline__dot">✓</span>
            <div>
              <div className="pipeline__name">{stage.name}</div>
              <div className="pipeline__detail">{stage.detail}</div>
            </div>
          </li>
        ))}
      </ol>
      <div className="pipeline__footer">GitHub Actions → GHCR → EKS</div>
    </div>
  );
}

function CreateTaskModal({ onClose, onCreate }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onCreate({
        ...form,
        description: form.description || null,
        assignee: form.assignee || null,
        due_date: form.due_date || null,
      });
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="modal__header">
          <h2>New task</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">×</button>
        </div>
        <label>
          Title
          <input autoFocus required maxLength={200} value={form.title} onChange={update("title")} placeholder="What needs to be done?" />
        </label>
        <label>
          Description
          <textarea rows={3} value={form.description} onChange={update("description")} placeholder="Optional details" />
        </label>
        <div className="modal__row">
          <label>
            Status
            <select value={form.status} onChange={update("status")}>
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </label>
          <label>
            Priority
            <select value={form.priority} onChange={update("priority")}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
        </div>
        <div className="modal__row">
          <label>
            Assignee
            <input maxLength={100} value={form.assignee} onChange={update("assignee")} placeholder="Name" />
          </label>
          <label>
            Due date
            <input type="date" value={form.due_date} onChange={update("due_date")} />
          </label>
        </div>
        {error && <div className="alert">{error}</div>}
        <div className="modal__footer">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? "Creating..." : "Create task"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [taskList, taskStats] = await Promise.all([api.listTasks(), api.stats()]);
      setTasks(taskList);
      setStats(taskStats);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return tasks.filter(
      (t) =>
        (filter === "all" || t.status === filter) &&
        (!term || t.title.toLowerCase().includes(term) || (t.assignee || "").toLowerCase().includes(term))
    );
  }, [tasks, filter, search]);

  const counts = useMemo(() => {
    const c = { all: tasks.length };
    for (const s of STATUSES) c[s.value] = tasks.filter((t) => t.status === s.value).length;
    return c;
  }, [tasks]);

  async function runAndRefresh(action) {
    try {
      await action();
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="layout">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      {menuOpen && <div className="scrim" onClick={() => setMenuOpen(false)} />}

      <main className="main">
        <header className="header">
          <button className="menu-btn" onClick={() => setMenuOpen(true)} aria-label="Open menu">☰</button>
          <div>
            <div className="breadcrumb">Platform / Sprint 21</div>
            <h1>Dashboard</h1>
          </div>
          <div className="header__actions">
            <input
              className="search"
              type="search"
              placeholder="Search tasks or people"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="btn btn--primary" onClick={() => setShowModal(true)}>+ New task</button>
          </div>
        </header>

        {error && (
          <div className="alert alert--banner">
            <strong>Backend error:</strong> {error}
            <button className="btn btn--ghost btn--sm" onClick={refresh}>Retry</button>
          </div>
        )}

        {loading ? (
          <div className="loading"><span className="spinner" /> Loading tasks...</div>
        ) : (
          <>
            {stats && <KpiCards stats={stats} />}

            <div className="grid">
              <section className="card card--flush">
                <div className="toolbar">
                  <div className="card__title">Tasks</div>
                  <div className="filters" role="tablist">
                    {[{ value: "all", label: "All" }, ...STATUSES].map((s) => (
                      <button
                        key={s.value}
                        role="tab"
                        aria-selected={filter === s.value}
                        className={`filter ${filter === s.value ? "filter--active" : ""}`}
                        onClick={() => setFilter(s.value)}
                      >
                        {s.label} <span className="filter__count">{counts[s.value] ?? 0}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <TaskTable
                  tasks={visible}
                  onStatusChange={(task, status) => runAndRefresh(() => api.updateTask(task.id, { status }))}
                  onDelete={(task) => runAndRefresh(() => api.deleteTask(task.id))}
                />
              </section>

              <div className="side">
                <PipelineCard />
                <ActivityFeed tasks={tasks} />
              </div>
            </div>
          </>
        )}
      </main>

      {showModal && (
        <CreateTaskModal
          onClose={() => setShowModal(false)}
          onCreate={async (task) => {
            await api.createTask(task);
            await refresh();
          }}
        />
      )}
    </div>
  );
}
