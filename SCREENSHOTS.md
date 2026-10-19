# TaskBoard Capstone: Demo Evidence

Screenshots for each of the 15 final demo items in [PROJECT_BRIEF.md](PROJECT_BRIEF.md) (Part O), plus the CI deploy to EKS. Everything below was captured from the real running system: Docker Compose locally, then an EKS cluster in `ap-south-1` that has since been torn down with `terraform destroy`.

**Path covered:** Application → Git commit → CI pipeline → Docker image → Security scan → Registry → Terraform → Kubernetes → Helm → Ingress → Autoscaling → Monitoring → Troubleshooting

---

## 1. Application

The React dashboard: sidebar, KPI cards, status filters, task table with priority badges, delivery pipeline card and activity feed.

![Dashboard](screenshots/01-ui-dashboard.png)

Creating a task with the modal, and the result in the table and activity feed.

![Create task modal](screenshots/01-ui-create-task-modal.png)
![Task created](screenshots/01-ui-task-created.png)

Responsive layout at phone width: KPI cards in a 2x2 grid and table rows stacked as cards.

![Mobile layout](screenshots/01-ui-mobile.png)

## 2. API

All endpoints in FastAPI's Swagger UI, followed by a full create, read, update and delete cycle on one task (201, 200, 200, 204).

![Swagger endpoints](screenshots/02-swagger-endpoints.png)
![POST /api/tasks](screenshots/02-swagger-post.png)
![GET /api/tasks/{id}](screenshots/02-swagger-get.png)
![PUT /api/tasks/{id}](screenshots/02-swagger-put.png)
![DELETE /api/tasks/{id}](screenshots/02-swagger-delete.png)

Liveness (`/health`), readiness that checks the database (`/ready`), and Prometheus metrics (`/metrics`).

![Health](screenshots/03-health.png)
![Ready](screenshots/03-ready.png)
![Metrics](screenshots/03-metrics.png)

## 3. Database

The `tasks` table in PostgreSQL, created by Alembic migrations.

![Postgres tasks table](screenshots/04-postgres-tasks-table.png)

Pytest suite: 10 tests covering health, readiness, metrics, CRUD, validation and stats.

![Pytest passing](screenshots/05-pytest-passing.png)

## 4. Git

![Git commit](screenshots/11-git-commit.png)

## 5. CI

The GitHub Actions pipeline: test, then build, scan and push for each image, then deploy.

![CI pipeline run](screenshots/14-ci-pipeline-run.png)
![CI pytest logs](screenshots/15-ci-pytest-logs.png)

Run #1 failed in the build stage, so no images were pushed. The pipeline stops before a broken build is promoted, then runs #2 and #3 pass.

![CI runs list](screenshots/19-ci-runs-list.png)

## 6. Docker

The full local stack with Docker Compose, the multi-stage builds, and the two images.

![Docker compose ps](screenshots/06-docker-compose-ps.png)
![Docker build](screenshots/07-docker-build.png)
![Docker images](screenshots/08-docker-images.png)

## 7. Security

Trivy found 9 fixable HIGH vulnerabilities on the first scan: Debian perl packages, `urllib3`, `msgpack` and `setuptools` vendored inside pip, and Alpine `libexpat`. They were fixed by shipping the backend without pip (multi-stage build), applying OS security updates, and moving test dependencies out of the production image. Both images now scan clean, locally and in CI. The CI gate fails the pipeline on any fixable CRITICAL.

![Trivy backend](screenshots/09-trivy-backend.png)
![Trivy frontend](screenshots/10-trivy-frontend.png)
![Trivy in CI](screenshots/16-ci-trivy-scan.png)

## 8. Registry

Both images in GitHub Container Registry, tagged with `latest` and the Git commit SHA.

![GHCR packages](screenshots/17-ghcr-packages.png)
![GHCR SHA tag](screenshots/18-ghcr-backend-sha-tag.png)

## 9. Terraform

The VPC and EKS code, validation, the plan (63 resources), the apply, and the resulting VPC and EKS cluster in the AWS Console.

![Terraform code](screenshots/12-terraform-code.png)
![Terraform validate](screenshots/13-terraform-validate.png)
![Terraform plan](screenshots/21-terraform-plan.png)
![Terraform apply](screenshots/22-terraform-apply.png)
![AWS VPC and EKS cluster](screenshots/23-aws-vpc-and-eks-cluster.jpeg)

## 10. Kubernetes

Three EKS worker nodes, the TaskBoard pods and services, and PostgreSQL data on an EBS gp3 volume.

![Nodes](screenshots/26-kubectl-nodes.png)
![Pods and services](screenshots/27-kubectl-pods-svc.png)
![PVC](screenshots/28-kubectl-pvc.png)

## 11. Helm

![Helm list](screenshots/29-helm-list.png)

## 12. Ingress

The Ingress bound to the AWS Network Load Balancer created by ingress-nginx, and the app opened through the load balancer hostname.

![Ingress](screenshots/30-ingress.png)
![App via ingress](screenshots/31-app-via-ingress.png)

## 13. HPA

Six load generator pods push backend CPU to about 400% of the 50% target. The HPA scales from 2 to 6 replicas, then back to 2 after the load stops and the stabilization window passes.

![HPA scaling up](screenshots/33-hpa-scaling.png)
![Pods under load](screenshots/34-hpa-pods-under-load.png)
![HPA scaled down](screenshots/37-hpa-scaled-down.png)

**Real issue found on EKS:** the HPA first showed `<unknown>`. `kubectl describe hpa` pointed to the metrics API, and `kubectl get apiservice` showed `FailedDiscoveryCheck` with timeouts to port 10251. The EKS metrics-server add-on listens on 10251, which the node security group did not allow from the control plane. The fix is one security group rule in `terraform/main.tf`.

## 14. Monitoring

The TaskBoard Grafana dashboard under load: 326 requests/second, 0% errors, p95 latency of 95 ms, per-pod CPU, and the HPA stepping from 2 to 6 replicas. Prometheus discovers and scrapes every backend pod through the ServiceMonitor (6/6 up).

![Grafana dashboard](screenshots/35-grafana-taskboard-dashboard.png)
![Prometheus targets](screenshots/36-prometheus-targets.png)

## 15. Failure simulation

**Broken image:** the pod sits in `ImagePullBackOff`, `describe` shows the missing tag, and `kubectl set image` fixes it.

![Broken image pod](screenshots/38-broken-image-pod.png)
![Broken image describe](screenshots/39-broken-image-describe.png)
![Broken image fixed](screenshots/40-broken-image-fixed.png)

**Broken Service:** the selector matches no pods, so there are no endpoints and no traffic. Patching the selector brings the endpoints back.

![No endpoints](screenshots/41-broken-service-no-endpoints.png)
![Pod labels](screenshots/42-broken-service-pod-labels.png)
![Service fixed](screenshots/43-broken-service-fixed.png)

## Bonus: deploy from CI

AWS credentials are stored as GitHub secrets. A push runs all four stages, including `helm upgrade` on EKS. Helm history shows revision 2 deployed by CI, and every pod runs the image built from that exact commit.

![GitHub secrets](screenshots/44-github-secrets.png)
![CI deploy run](screenshots/45-ci-deploy-run.png)
![CI deploy logs](screenshots/48-ci-deploy-logs.png)
![Helm history](screenshots/46-helm-history.png)
![Pods running the commit SHA](screenshots/47-pods-running-commit-sha.png)
