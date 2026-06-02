from .models import AuditLog


class SecurityHeadersMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        response["X-Content-Type-Options"] = "nosniff"
        response["X-Frame-Options"] = "DENY"
        response["Referrer-Policy"] = "same-origin"
        return response


class AuditMiddleware:
    """Middleware to capture request metadata for audit logging and record failed access attempts.

    Logs only security-relevant events to avoid heavy write amplification.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        from .audit_service import log_security_event

        response = self.get_response(request)

        try:
            status = getattr(response, "status_code", None)
            user = getattr(request, "user", None)
            if status in (401, 403):
                log_security_event(
                    user=(user if user and user.is_authenticated else None),
                    request=request,
                    action_type="unauthorized_access",
                    description=f"Request returned status {status}",
                    severity=AuditLog.Severity.WARNING if status == 403 else AuditLog.Severity.CRITICAL,
                )
            elif status and status >= 500:
                log_security_event(
                    user=(user if user and user.is_authenticated else None),
                    request=request,
                    action_type="server_error",
                    description=f"Server error response status {status} at {request.path}",
                    severity=AuditLog.Severity.CRITICAL,
                )
        except Exception:
            # Don't let auditing break responses
            pass

        return response
