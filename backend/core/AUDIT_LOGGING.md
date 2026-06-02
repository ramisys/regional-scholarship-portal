Audit Logging System
=====================

Overview
--------
This document describes the centralized audit logging system implemented for the Regional Scholarship Application Portal.

Key Points
- Audit entries are recorded to the `AuditLog` model (append-only).
- Sensitive fields (passwords, tokens, secrets) are sanitized before saving.
- Only coordinators may access audit logs via API (`GET /api/core/audit-logs/`).
- Middleware and signals capture common authentication, application, and document events.

Indexing and Performance
- The `AuditLog` model includes indexes on timestamp, severity, user, category, and resource.
- Queries should use pagination and filtered endpoints to avoid large response bodies.

Retention and Archiving
- Logs are preserved indefinitely by default. For long-term retention and archiving, export to a data warehouse or compressed S3 archive.
- Do not rely on the application to delete logs; treat them as immutable for compliance.

Security
- Audit entries are immutable via model `save()`; attempts to modify will raise an exception.
- Logs are sanitized and exclude raw passwords and tokens.
- Only coordinator users can read the audit API; permission denials are themselves logged.

Testing
- Run Django tests for the `core` app to verify audit creation and immutability.

Example commands
```
# Run core tests
python manage.py test core

# Create migrations then migrate
python manage.py makemigrations core
python manage.py migrate
```

Operational notes
- For production, consider shipping logs to a centralized logging solution (ELK, Splunk) for retention, alerting, and search.
- If traffic is very high, write audit logs to a dedicated write-optimized table or a logging service to avoid database contention.
