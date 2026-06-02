from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "user",
            "action_type",
            "action_category",
            "description",
            "resource_type",
            "resource_id",
            "ip_address",
            "user_agent",
            "request_method",
            "endpoint",
            "old_value",
            "new_value",
            "timestamp",
            "severity_level",
        ]
        read_only_fields = fields

    def get_user(self, obj):
        if obj.user is None:
            return None
        return {"id": obj.user_id, "email": getattr(obj.user, "email", None)}
