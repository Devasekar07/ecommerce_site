# Phase 1 Local Setup

This document covers the Phase 1 foundation: React frontend, TypeScript commerce API, PostgreSQL, and FastAPI AI service shell.

## Prerequisites

- Node.js 20+
- npm 10+
- Python 3.11+
- Docker with Docker Compose

## Environment Files

Copy each example file and fill the values locally. Do not commit real secrets or credentials.

```sh
cp .env.example .env
cp api/.env.example api/.env
cp frontend/.env.example frontend/.env
cp ai-service/.env.example ai-service/.env
```

Required local variables:

- Root `.env`: `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
- API `.env`: `DATABASE_URL`, `PORT`, `HOST`, `CLIENT_ORIGIN`, `APP_VERSION`, `NODE_ENV`
- Frontend `.env`: `VITE_API_BASE_URL`
- AI service `.env`: `AI_SERVICE_PORT`

## Install Node Dependencies

```sh
npm install
```

## Start PostgreSQL

```sh
docker compose up -d postgres
```

## Prepare the Database

```sh
npm run db:generate
npm run db:migrate
npm run db:seed
```

The seed loads sample fashion products across Women, Men, Kids, Footwear, and Accessories.

## Run the Commerce API

```sh
npm run dev:api
```

Health check:

```sh
curl http://localhost:4000/health
```

Catalogue check:

```sh
curl http://localhost:4000/api/v1/departments
```

## Run the Frontend

```sh
npm run dev:frontend
```

Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

## Run the AI Service Shell

From `ai-service`:

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e .
uvicorn app.main:app --reload --port 8000
```

Health check:

```sh
curl http://localhost:8000/health
```

## Manual Phase 1 Verification

1. Open the frontend home page.
2. Confirm the header shows Women, Men, Kids, Footwear, and Accessories.
3. Open each department page and confirm products load.
4. Open a category page from a department.
5. Open a product detail page and confirm images, GBP price, colours, sizes, availability, and product details are visible.
6. Resize to a mobile viewport and confirm the department menu opens and closes with the menu button.
7. Stop the API and refresh the frontend to confirm the catalogue error state appears.
