from rest_framework.permissions import BasePermission


class IsStudent(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "student")


class IsCoordinator(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "coordinator")


class IsOwnerOrCoordinator(BasePermission):
    owner_field = "applicant"

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role == "coordinator":
            return True
        owner = getattr(obj, self.owner_field, None)
        return owner == request.user
