# Regional Scholarship Portal

A full-stack scholarship application portal with a React + Vite frontend and a Django REST backend. The system supports role-based access for students and coordinators, application submission, document uploads, review workflows, and audit logging.

## Repository Overview

- `backend/` — Django application with REST API, authentication, verification, document upload, and coordinator tools.
- `src/` — Frontend React application built with Vite, Tailwind CSS, Radix UI, and custom components.
- `Dockerfile` — Frontend Docker image that builds and serves the Vite app via Nginx.
- `backend/Dockerfile` — Full production container for Django + frontend static build.
- `docker-compose.prod.yml` — Production compose setup for backend and database.

## Tech Stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS, Radix UI, React Router, Axios
- Backend: Django, Django REST Framework, SimpleJWT, PostgreSQL, Cloudinary, WhiteNoise
- Deployment: Docker, Nginx, Gunicorn

## Key Features

- User registration, login, and password recovery
- Role-based access control for students and coordinators
- Multi-step student application flow
- Document upload with file size/type validation
- Application tracking and detail views for students
- Coordinator dashboards and application management
- Audit log review for coordinator users
- JWT refresh and token handling
- CORS and CSRF protection

## Project Structure

```
backend/
  config/
  accounts/
  applications/
  education/
  documents/
  coordinator/
  verification/
  core/
  manage.py
  requirements.txt
  Dockerfile
src/
  app/
    components/
    contexts/
    pages/
    utils/
  services/
  styles/
  main.tsx
package.json
pnpm-lock.yaml
Dockerfile
docker-compose.prod.yml
.env.example
backend/.env.example
```

## Local Setup

### Prerequisites

- Node.js 20+
- pnpm
- Python 3.11+
- PostgreSQL
- A PostgreSQL database for the backend

### Backend Setup

1. Create and activate a Python virtual environment.
2. Install backend dependencies:

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

3. Copy the backend environment example and update values:

```bash
cd backend
copy .env.example .env
```

4. Run migrations:

```bash
python manage.py makemigrations
python manage.py migrate
```

5. Start the backend server:

```bash
python manage.py runserver
```

The backend API will be available at `http://localhost:8000/api` by default.

### Frontend Setup

1. Install frontend dependencies from the repository root:

```bash
pnpm install
```

2. Create a Vite environment file if you need to override the API URL:

```bash
copy .env.example .env
```

3. Add or update the API base URL in `.env`:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

4. Start the frontend development server:

```bash
pnpm dev
```

Open the frontend at the Vite URL shown in the terminal (typically `http://localhost:5173`).

> The frontend uses `import.meta.env.VITE_API_BASE_URL` and defaults to `http://localhost:8000/api` when the variable is not provided.

## Running Both Locally

Start the backend first, then the frontend.

- Backend: `python backend/manage.py runserver`
- Frontend: `pnpm dev`

## Environment Variables

The backend loads `backend/.env` from `backend/config/settings.py`.

Important backend variables include:

- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG`
- `DJANGO_ALLOWED_HOSTS`
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT`
- `JWT_ACCESS_MINUTES`, `JWT_REFRESH_DAYS`
- `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`
- `MAX_UPLOAD_SIZE_BYTES`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `EMAIL_BACKEND`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USE_TLS`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`
- `DEFAULT_FROM_EMAIL`
- `FRONTEND_URL`, `FRONTEND_RESET_PASSWORD_URL`
- `SUPPORT_PHONE`

For the frontend, set `VITE_API_BASE_URL` in the repository root `.env` if your backend is hosted at a non-default location.

## API Endpoints

The backend registers these major URL namespaces:

- `POST /api/auth/` — authentication and user profile operations
- `GET|POST /api/applications/` — application CRUD and submission
- `POST|PUT|DELETE /api/education/` — educational background records
- `POST /api/documents/` — document uploads
- `GET /api/student/` — student dashboard and application tracking
- `GET /api/dashboard/` — coordinator dashboard and application review
- `GET /api/` — verification routes

## Docker and Production

### Production Compose

Use the production compose file to build and deploy the backend and database:

```bash
docker compose -f docker-compose.prod.yml build --pull --no-cache
docker compose -f docker-compose.prod.yml up -d
```

### Frontend Dockerfile

The root `Dockerfile` builds the frontend app and serves it with Nginx.

### Backend Dockerfile

The `backend/Dockerfile` builds the frontend first, installs Python dependencies, copies the built frontend assets into Django static files, and runs Gunicorn.

## Notes

- The backend supports `DATABASE_URL` if provided, and will use it in place of individual `POSTGRES_*` values.
- For step-by-step usage instructions, see [docs/USER_GUIDE.md](docs/USER_GUIDE.md).
- In production, `DJANGO_DEBUG` should be set to `False` and Cloudinary variables must be configured.
- The backend uses WhiteNoise to serve static assets when `DEBUG=False`.

## Helpful Commands

- `pnpm dev` — run frontend development server
- `pnpm build` — build frontend production assets
- `python backend/manage.py runserver` — run backend locally
- `python backend/manage.py migrate` — apply database migrations
- `docker compose -f docker-compose.prod.yml up -d` — run production stack
