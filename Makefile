PYTHON ?= python3
BACKEND_DIR := backend
FRONTEND_DIR := frontend
BACKEND_VENV := $(BACKEND_DIR)/.venv

.PHONY: bootstrap backend-venv backend-dev frontend-dev lint lint-backend lint-frontend format-frontend typecheck-frontend test test-backend test-frontend docker-up docker-down

bootstrap: backend-venv
	cd $(FRONTEND_DIR) && npm install

backend-venv:
	$(PYTHON) -m venv $(BACKEND_VENV)
	$(BACKEND_VENV)/bin/python -m pip install --upgrade pip
	$(BACKEND_VENV)/bin/pip install -r $(BACKEND_DIR)/requirements.txt

backend-dev:
	$(BACKEND_VENV)/bin/uvicorn app.main:app --reload --host $${API_HOST:-127.0.0.1} --port $${API_PORT:-8000} --app-dir $(BACKEND_DIR)

frontend-dev:
	cd $(FRONTEND_DIR) && npm run dev

lint: lint-backend lint-frontend

lint-backend:
	$(BACKEND_VENV)/bin/python -m pip install --quiet black ruff
	$(BACKEND_VENV)/bin/ruff check $(BACKEND_DIR)
	$(BACKEND_VENV)/bin/black --check $(BACKEND_DIR)

lint-frontend:
	cd $(FRONTEND_DIR) && npm run lint

format-frontend:
	cd $(FRONTEND_DIR) && npm run format

typecheck-frontend:
	cd $(FRONTEND_DIR) && npm run typecheck

test: test-backend test-frontend

test-backend:
	$(BACKEND_VENV)/bin/pytest $(BACKEND_DIR) || true

test-frontend:
	cd $(FRONTEND_DIR) && npm run test

docker-up:
	docker compose up db -d

docker-down:
	docker compose down
