# Role Contributions by Domain

This document maps the five team roles to the actual features, files, and implementation evidence found in the `regional-scholarship-portal` repository.

## 1. Lead Cloud & DevOps Engineer

Contributions and evidence:
- Deployment and production readiness
  - `docs/CLOUDINARY_SETUP.md`: Render deployment steps, Docker deployment env var guidance, and platform secret recommendations.
  - `docker-compose.prod.yml`: production compose file used for containerized deployments.
- Cloudinary integration
  - `backend/config/settings.py`: configures `cloudinary_storage` as the default file backend and loads `CLOUDINARY_*` environment variables.
  - `backend/.env`: environment file that contains Cloudinary secret placeholders and local config patterns.
- Secure environment variables and secrets handling
  - `backend/config/settings.py`: uses `os.getenv()` for `DJANGO_SECRET_KEY`, database credentials, `CLOUDINARY_*`, and JWT cookie settings.
  - `backend/config/settings.py`: production hardening flags such as `SECURE_SSL_REDIRECT`, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`, `SECURE_HSTS_SECONDS`, `SECURE_HSTS_INCLUDE_SUBDOMAINS`, and `SECURE_HSTS_PRELOAD`.
  - `docs/CLOUDINARY_SETUP.md`: explicitly states "Never commit credentials to git" and recommends Render Secrets/GitHub Secrets.

## 2. API & IAM Engineer

Contributions and evidence:
- REST API implementation
  - `backend/accounts/views.py`: registration, login, logout, profile, password change, password reset, and role management endpoints.
  - `backend/applications/views.py`: application list/filter access, object retrieval, and student-specific querysets.
  - `backend/coordinator/views.py`: coordinator batch actions and review endpoints.
  - `backend/core/views.py`: coordinator-only audit log API endpoints.
  - `backend/accounts/urls.py`, `backend/coordinator/urls.py`, `backend/config/urls.py`: API routing structure.
- JWT authentication and session security
  - `backend/config/settings.py`: enables `rest_framework_simplejwt.authentication.JWTAuthentication` and `rest_framework_simplejwt.token_blacklist`.
  - `backend/accounts/views.py`: `LoginAPIView` and `JWTRefreshAPIView` use `RefreshToken`, set httpOnly refresh cookies, rotate refresh tokens, and return access tokens safely.
  - `backend/config/settings.py`: JWT lifetimes configured by `JWT_ACCESS_MINUTES`, `JWT_REFRESH_DAYS`, `ROTATE_REFRESH_TOKENS`, and `BLACKLIST_AFTER_ROTATION`.
- Field-level masking and sensitive-data sanitization
  - `backend/core/audit_service.py`: `_sanitize()` redacts `password`, `password1`, `password2`, `token`, `access`, `refresh`, `secret`, and `api_key` before audit log storage.
  - `backend/accounts/serializers.py`: `RegisterSerializer` and `UserSerializer` limit exposed fields and validate registration inputs securely.

## 3. Database Architect & RBAC Lead

Contributions and evidence:
- Data model design and user roles
  - `backend/accounts/models.py`: custom `User` model with `Role` enum values (`student` and `coordinator`) and role-aware manager defaults.
  - `backend/coordinator/models.py`: `BulkProcessingLog` model records coordinator bulk actions and affected application IDs.
  - Domain model organization under `backend/applications`, `backend/documents`, `backend/education`, `backend/verification`.
- RBAC, ownership enforcement, and Anti-IDOR logic
  - `backend/core/permissions.py`: `IsCoordinator`, `IsStudent`, and `IsOwnerOrCoordinator` enforce role-based access.
  - `backend/applications/views.py`: filters student applications by `request.user` and denies access when a coordinator is not acting on owned records.
  - `backend/documents/views.py`, `backend/education/views.py`, `backend/verification/views.py`: verify `application.applicant == request.user` for student access and allow coordinators only when appropriate.
  - `backend/accounts/views.py`: `ManageUserRoleAPIView` uses `IsAuthenticated` and `IsCoordinator` for role changes.
- Bulk database operation design
  - `backend/coordinator/services.py`: `CoordinatorBulkApplicationService.bulk_update_status()` uses `transaction.atomic()`, `select_for_update()`, conditional status checks, `bulk_update()`, and `ApplicationStatusHistory` save operations.
  - `backend/coordinator/urls.py`: exposes bulk approve, bulk reject, and bulk status update endpoints.
  - `backend/coordinator/tests.py`: validates bulk endpoint authorization and behavior.

## 4. Frontend UI & Component Engineer

Contributions and evidence:
- Dashboard and routing interfaces
  - `src/app/pages/coordinator/ApplicationManagement.tsx`: coordinator dashboard with application review, detail modal, bulk actions, and missing document notifications.
  - `src/app/pages/student/ApplicationDetail.tsx`: displays student application details with parsed personal/contact entries.
  - `src/app/pages/student/ApplicationForm.tsx`: full scholarship application form with draft recovery.
  - `src/app/App.tsx` and `src/app/components/Layout.tsx`: route definitions and role-based navigation.
- Interactive filtering and search UI
  - `src/app/pages/coordinator/ApplicationManagement.tsx`: local state filters for search term, region, status, and selection toggles.
  - bulk selection and action handling with `handleSelectAll()`, `toggleSelection()`, and `performBulkAction()`.
- Complex forms and dynamic formsets
  - `src/app/pages/student/ApplicationForm.tsx`: uses `react-hook-form`, `useFieldArray`, and tabbed sections for personal/contact/education.
  - draft persistence using server fallback and `localStorage` backup.
- Shared UI component usage
  - `src/app/components/ui/`: reusable components for `Button`, `Input`, `Select`, `Dialog`, `Table`, `Badge`, and cards.
  - `src/app/components/loading/`: skeletons, page loaders, and action loaders for polished UX.

## 5. DevSecOps & Compliance Analyst

Contributions and evidence:
- Active defense and anti-abuse controls
  - `backend/accounts/serializers.py`: `RegisterSerializer` adds a honeypot field and rejects submissions when it is filled.
  - `backend/core/middleware.py`: `AuditMiddleware` logs failed requests and security-related responses.
  - `backend/core/permissions.py`: `IsCoordinator` logs unauthorized access attempts and emits security audit events.
- Audit logging and compliance controls
  - `backend/core/audit_service.py`: centralized event logging, request metadata extraction, and sensitive-data sanitization.
  - `backend/accounts/signals.py`, `backend/applications/signals.py`, `backend/documents/signals.py`: audit events for registration, application submission/status change, and document upload.
  - `docs/AUDIT_IMPLEMENTATION.md`: documents audit model, service, middleware, and frontend audit log pages.
- Security and compliance documentation
  - `docs/IMPLEMENTATION_CHECKLIST.md`: tracked JWT token storage, honeypot protection, and other security checklist items.
  - test annotations in `backend/applications/tests.py`, `backend/coordinator/tests.py`, and `backend/core/tests.py` use `#nosec B106` for documented test-only hardcoded passwords.

---

This file is now structured as a role accountability map with exact code evidence for each contribution area.