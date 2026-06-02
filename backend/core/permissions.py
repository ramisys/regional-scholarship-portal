import logging

from rest_framework.permissions import BasePermission
from .audit_service import log_security_event

logger = logging.getLogger(__name__)


class IsStudent(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "student")


class IsCoordinator(BasePermission):
    def has_permission(self, request, view):
        if request.user and request.user.is_authenticated and request.user.role == "coordinator":
            return True
        logger.warning(
            "Unauthorized coordinator endpoint access attempt",
            extra={
                "user_id": getattr(request.user, "id", None),
                "email": getattr(request.user, "email", None),
                "role": getattr(request.user, "role", None),
                "path": request.path,
                "remote_addr": request.META.get("REMOTE_ADDR"),
            },
        )
        try:
            log_security_event(
                user=(request.user if getattr(request.user, "is_authenticated", False) else None),
                request=request,
                action_type="permission_denied",
                description=f"Coordinator permission denied for {request.path}",
                severity="WARNING",
            )
        except Exception:
            logger.exception("Failed to write audit log for permission denied")
        return False


class IsOwnerOrCoordinator(BasePermission):
    owner_field = "applicant"

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role == "coordinator":
            return True
        owner = getattr(obj, self.owner_field, None)
        return owner == request.user
