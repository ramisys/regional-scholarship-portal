Audit Logging Implementation Summary

Endpoints
- GET /api/core/audit-logs/  - list audit logs (coordinator only)
- GET /api/core/audit-logs/:id/ - retrieve an audit log entry (coordinator only)

Backend
- Model: `core.models.AuditLog` (append-only, immutability enforced in `save()`)
- Service: `core.audit_service` provides `log_auth_event`, `log_application_event`, `log_document_event`, `log_security_event`, `log_admin_action`
- Middleware: `core.middleware.AuditMiddleware` logs 401/403/5xx responses
- Signals: User registration, application submission/status change, document upload now create audit entries
- Permissions: `core.permissions.IsCoordinator` logs denied access attempts
- Migrations: `backend/core/migrations/0002_auditlog.py`

Frontend
- New React page: `src/app/pages/coordinator/AuditLogs.tsx`
- Uses existing API client with `VITE_API_BASE_URL` to call `/api/core/audit-logs/`

Testing
- Run `python manage.py test core` to execute basic tests validating record creation and immutability.

Notes
- Sensitive fields are sanitized by `core.audit_service._sanitize`
- Audit entries are designed to be append-only. Administrative deletion should be implemented outside the app (database-level policies or separate archiving process).
- Indexes were added to the model migration to help filtering performance.

Next steps
- Wire the new frontend page into the coordinator navigation.
- Add more hooks (e.g., authentication backend hooks for login failures, password resets).
- Consider shipping logs to a centralized logging/analytics platform for long-term retention and searchability.
