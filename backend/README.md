# Regional Scholarship Portal Backend (MVP)

## Stack
- Django
- Django REST Framework
- PostgreSQL
- JWT (SimpleJWT)
- Cloudinary
- django-cors-headers
- python-dotenv

## Folder Structure

```
backend/
  config/
    settings.py
    urls.py
  core/
    exceptions.py
    middleware.py
    permissions.py
    responses.py
  accounts/
    models.py
    serializers.py
    urls.py
    views.py
  applications/
    models.py
    serializers.py
    urls.py
    views.py
  education/
    models.py
    serializers.py
    urls.py
    views.py
  documents/
    models.py
    serializers.py
    urls.py
    views.py
  coordinator/
    urls.py
    views.py
  verification/
    urls.py
    views.py
  requirements.txt
  .env.example
  manage.py
```

## Setup
1. Create PostgreSQL database and credentials.
2. Copy `.env.example` to `.env` and update values.
3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Run migrations:

```bash
python manage.py makemigrations
python manage.py migrate
```

5. Start API server:

```bash
python manage.py runserver
```

## Core Endpoints

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `POST /api/auth/password-reset`
- `POST /api/auth/password-reset-confirm`
- `GET /api/auth/profile`
- `PUT /api/auth/profile`
- `POST /api/auth/change-password`
- `PATCH /api/auth/users/:id/role`

### Applications
- `GET /api/applications/`
- `POST /api/applications/`
- `GET /api/applications/:id`
- `PUT /api/applications/:id`
- `DELETE /api/applications/:id`
- `POST /api/applications/:id/submit`

### Educational Background
- `POST /api/education/`
- `PUT /api/education/:id`
- `DELETE /api/education/:id`

### Documents
- `POST /api/documents/upload`
- `GET /api/documents/:id`

### Coordinator
- `GET /api/dashboard/applications`
- `PATCH /api/dashboard/applications/:id/status`

### Verification
- `GET /api/verify-applicant/:id`

## Standard API Format

Success:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

Error:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {}
}
```

Verification restricted response:
```json
{
  "message": "Restricted Data"
}
```

## Security Controls Implemented
- JWT auth and token refresh
- Role-based access (student, coordinator)
- Anti-IDOR object-level ownership filtering
- Registration honeypot field (`honeypot`)
- File type and size validation
- Scoped rate limiting for auth and upload endpoints
- CORS restricted to configured frontend origins only
- Env-based secrets and credentials
- Secure headers middleware

## Frontend Integration (Axios)
Service files are available in:
- `src/services/authService.js`
- `src/services/applicationService.js`
- `src/services/documentService.js`
- `src/services/dashboardService.js`

## Login Integration Example

```js
import { login } from "../services/authService";

const res = await login({ email, password });
if (res.success) {
  const role = localStorage.getItem("userRole");
  if (role === "coordinator") {
    navigate("/coordinator/dashboard");
  } else {
    navigate("/student/dashboard");
  }
}
```

## Protected Request Example

```js
import { getApplications } from "../services/applicationService";

const result = await getApplications();
```

All service requests send:
```
Authorization: Bearer <access_token>
```

## API Testing Instructions
1. Register a student and coordinator user via `POST /api/auth/register`.
2. Login with each role via `POST /api/auth/login`.
3. Test ownership by trying to fetch another student's application.
4. Upload valid and invalid file types to verify upload guards.
5. Refresh expired tokens via `POST /api/auth/refresh`.
6. Verify unauthenticated call to `/api/verify-applicant/:id` returns restricted payload.

## Deployment Preparation Checklist
- Set `DJANGO_DEBUG=False`.
- Set production `DJANGO_SECRET_KEY`.
- Configure production PostgreSQL.
- Configure Cloudinary credentials.
- Set strict `DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`.
- Use HTTPS and reverse proxy.
- Run `python manage.py check --deploy`.
- Collect static files via `python manage.py collectstatic --noinput`.
