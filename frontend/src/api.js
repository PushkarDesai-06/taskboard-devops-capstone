// Relative URLs on purpose: Nginx (local/compose) or the Ingress (Kubernetes)
// decides which backend actually receives /api traffic.
async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    let detail = `${response.status} ${response.statusText}`;
    try {
      const body = await response.json();
      if (body.detail) detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
    } catch {
      // response had no JSON body
    }
    throw new Error(detail);
  }
  return response.status === 204 ? null : response.json();
}

export const api = {
  listTasks: () => request("/api/tasks"),
  stats: () => request("/api/tasks/stats"),
  createTask: (task) => request("/api/tasks", { method: "POST", body: JSON.stringify(task) }),
  updateTask: (id, changes) => request(`/api/tasks/${id}`, { method: "PUT", body: JSON.stringify(changes) }),
  deleteTask: (id) => request(`/api/tasks/${id}`, { method: "DELETE" }),
};
