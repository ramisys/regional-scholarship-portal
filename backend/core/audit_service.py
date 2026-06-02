from typing import Any, Dict, Optional
from django.utils import timezone
from django.db import transaction
from django.conf import settings
from .models import AuditLog

SENSITIVE_KEYS = {"password", "password1", "password2", "token", "access", "refresh", "secret", "api_key"}


def _sanitize(obj: Any) -> Any:
    if obj is None:
        return None
    if isinstance(obj, dict):
        return {k: ("<REDACTED>" if k.lower() in SENSITIVE_KEYS else _sanitize(v)) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_sanitize(i) for i in obj]
    return obj


def _extract_request_meta(request) -> Dict[str, Any]:
    if not request:
        return {}
    ip = None
    # Common headers
    x_forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded:
        ip = x_forwarded.split(",")[0].strip()
    else:
        ip = request.META.get("REMOTE_ADDR")
    ua = request.META.get("HTTP_USER_AGENT")
    method = getattr(request, "method", None)
    path = getattr(request, "path", None)
    return {"ip": ip, "ua": ua, "method": method, "path": path}


def _create_entry(**kwargs):
    try:
        # Use transaction.on_commit to avoid interfering with request lifecycle
        def _write():
            AuditLog.objects.create(**kwargs)

        try:
            transaction.on_commit(_write)
        except Exception:
            # Fallback if transaction manager not available
            _write()
    except Exception:
        # Never bubble errors from auditing into application logic
        return None


def log_event(
    user=None,
    request=None,
    action_type: str = "",
    action_category: str = AuditLog.Category.APPLICATION,
    description: str = "",
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    old_value: Optional[Any] = None,
    new_value: Optional[Any] = None,
    severity: str = AuditLog.Severity.INFO,
):
    meta = _extract_request_meta(request)
    entry = {
        "user": user,
        "action_type": action_type,
        "action_category": action_category,
        "description": description,
        "resource_type": resource_type,
        "resource_id": resource_id,
        "ip_address": meta.get("ip"),
        "user_agent": meta.get("ua"),
        "request_method": meta.get("method"),
        "endpoint": meta.get("path"),
        "old_value": _sanitize(old_value),
        "new_value": _sanitize(new_value),
        "severity_level": severity,
        "timestamp": timezone.now(),
    }
    _create_entry(**entry)


# Convenience wrappers

def log_auth_event(**kwargs):
    kwargs.setdefault("action_category", AuditLog.Category.AUTHENTICATION)
    return log_event(**kwargs)


def log_application_event(**kwargs):
    kwargs.setdefault("action_category", AuditLog.Category.APPLICATION)
    return log_event(**kwargs)


def log_document_event(**kwargs):
    kwargs.setdefault("action_category", AuditLog.Category.DOCUMENT)
    return log_event(**kwargs)


def log_security_event(**kwargs):
    kwargs.setdefault("action_category", AuditLog.Category.SECURITY)
    kwargs.setdefault("severity", AuditLog.Severity.WARNING)
    return log_event(**kwargs)


def log_admin_action(**kwargs):
    kwargs.setdefault("action_category", AuditLog.Category.ADMINISTRATION)
    return log_event(**kwargs)
