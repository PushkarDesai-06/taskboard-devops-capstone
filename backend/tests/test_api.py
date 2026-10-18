from datetime import date, timedelta


def make_task(client, **overrides):
    payload = {"title": "Write tests", "priority": "high", **overrides}
    response = client.post("/api/tasks", json=payload)
    assert response.status_code == 201, response.text
    return response.json()


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "UP"}


def test_ready_checks_database(client):
    response = client.get("/ready")
    assert response.status_code == 200
    assert response.json() == {"status": "READY"}


def test_metrics_exposed(client):
    client.get("/api/tasks")
    response = client.get("/metrics")
    assert response.status_code == 200
    assert "http_requests_total" in response.text


def test_create_and_get_task(client):
    task = make_task(client, assignee="Pushkar")
    assert task["status"] == "todo"
    assert task["assignee"] == "Pushkar"

    response = client.get(f"/api/tasks/{task['id']}")
    assert response.status_code == 200
    assert response.json()["title"] == "Write tests"


def test_list_tasks_with_filter(client):
    make_task(client, title="A", status="todo")
    make_task(client, title="B", status="done")

    assert len(client.get("/api/tasks").json()) == 2
    done = client.get("/api/tasks", params={"status": "done"}).json()
    assert [t["title"] for t in done] == ["B"]


def test_update_task(client):
    task = make_task(client)
    response = client.put(f"/api/tasks/{task['id']}", json={"status": "in_progress"})
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "in_progress"
    assert body["title"] == "Write tests"


def test_delete_task(client):
    task = make_task(client)
    assert client.delete(f"/api/tasks/{task['id']}").status_code == 204
    assert client.get(f"/api/tasks/{task['id']}").status_code == 404


def test_missing_task_returns_404(client):
    assert client.get("/api/tasks/9999").status_code == 404
    assert client.put("/api/tasks/9999", json={"title": "x"}).status_code == 404
    assert client.delete("/api/tasks/9999").status_code == 404


def test_validation_rejects_bad_input(client):
    assert client.post("/api/tasks", json={"title": ""}).status_code == 422
    assert client.post("/api/tasks", json={"title": "x", "status": "nope"}).status_code == 422


def test_stats(client):
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    make_task(client, status="done")
    make_task(client, status="todo", due_date=yesterday)
    make_task(client, status="in_progress", priority="urgent")
    make_task(client, status="done", due_date=yesterday)

    stats = client.get("/api/tasks/stats").json()
    assert stats["total"] == 4
    assert stats["by_status"] == {"todo": 1, "in_progress": 1, "review": 0, "done": 2}
    assert stats["by_priority"]["urgent"] == 1
    assert stats["completion_rate"] == 50.0
    assert stats["overdue"] == 1
