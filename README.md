# TaskBoard: DevOps Capstone

A small SaaS-style task manager used to show the full path from a developer laptop to a monitored Kubernetes cluster on AWS.

**Stack:** React + Vite, FastAPI, PostgreSQL, SQLAlchemy, Alembic, Pytest, Docker, GitHub Actions, Trivy, GHCR, Terraform, AWS VPC + EKS, Helm, ingress-nginx, HPA, Prometheus, Grafana.

The full walkthrough is in [PROJECT_BRIEF.md](PROJECT_BRIEF.md). Evidence for every demo step, with captions, is in [SCREENSHOTS.md](SCREENSHOTS.md).

## Quick start (local)

```bash
docker compose up --build
```

| URL | What |
|---|---|
| http://localhost:3000 | TaskBoard UI |
| http://localhost:8000/docs | Swagger UI |
| http://localhost:8000/health | Liveness |
| http://localhost:8000/ready | Readiness (checks the database) |
| http://localhost:8000/metrics | Prometheus metrics |

Tests:

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
pytest -v
```

## Layout

```text
frontend/               React app, multi-stage Dockerfile (Node build -> unprivileged Nginx)
backend/                FastAPI app, Alembic migrations, pytest suite, multi-stage Dockerfile
docker-compose.yml      full local stack
.github/workflows/      CI/CD: test -> build -> Trivy -> push to GHCR -> Helm deploy
terraform/              AWS VPC + EKS (ap-south-1)
k8s/                    namespace, gp3 StorageClass, ingress-nginx values
helm/taskboard/         app chart: deployments, services, postgres, ingress, HPA, ServiceMonitor, dashboard
monitoring/             kube-prometheus-stack values
troubleshooting/        deliberately broken manifests (bad image, bad Service selector)
scripts/load-test.sh    load generator for the HPA demo
```

## API

| Method | Path |
|---|---|
| GET | `/api/tasks` (filters: `status`, `priority`) |
| GET | `/api/tasks/{id}` |
| POST | `/api/tasks` |
| PUT | `/api/tasks/{id}` |
| DELETE | `/api/tasks/{id}` |
| GET | `/api/tasks/stats` |

## Deploying to AWS

```bash
cd terraform && terraform init && terraform apply
aws eks update-kubeconfig --region ap-south-1 --name taskboard-eks

kubectl apply -f k8s/namespace.yaml -f k8s/storageclass-gp3.yaml
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx -n ingress-nginx --create-namespace -f k8s/ingress-nginx-values.yaml
helm upgrade --install monitoring prometheus-community/kube-prometheus-stack -n monitoring --create-namespace -f monitoring/kube-prometheus-stack-values.yaml
helm upgrade --install taskboard ./helm/taskboard -n taskboard -f helm/taskboard/values-eks.yaml
```

Tear everything down afterwards so the bill stops:

```bash
helm uninstall taskboard -n taskboard
helm uninstall ingress-nginx -n ingress-nginx   # removes the AWS load balancer
cd terraform && terraform destroy
```
