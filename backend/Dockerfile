# ---------- stage 1: install dependencies into a virtualenv ----------
FROM python:3.12-slim AS build

ENV PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

COPY requirements.txt .
RUN python -m venv /opt/venv \
 && /opt/venv/bin/pip install -r requirements.txt \
 # pip is only needed to build the venv; leaving it out of the runtime image
 # also removes the libraries it vendors (urllib3, msgpack, ...) from Trivy's findings.
 && /opt/venv/bin/pip uninstall -y pip

# ---------- stage 2: runtime ----------
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH"

# 1. OS security updates, and no pip in the runtime image
RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/* \
 && python -m pip uninstall -y pip

WORKDIR /app

# 2. dependencies from the build stage
COPY --from=build /opt/venv /opt/venv

# 3. migrations, then application code
COPY alembic.ini .
COPY alembic ./alembic
COPY app ./app
COPY start.sh .

# 4. never run as root
RUN useradd --create-home --uid 10001 appuser && chmod +x start.sh
USER 10001

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=20s \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# runs alembic upgrade head, then uvicorn
CMD ["./start.sh"]
