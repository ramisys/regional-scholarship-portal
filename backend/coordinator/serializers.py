from rest_framework import serializers

from applications.models import ScholarshipApplication


class BulkApplicationActionSerializer(serializers.Serializer):
    application_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        allow_empty=False,
    )
    notes = serializers.CharField(required=False, allow_blank=True, max_length=500)

    def validate_application_ids(self, value):
        if not value:
            raise serializers.ValidationError("At least one application ID is required.")
        if len(value) != len(set(value)):
            raise serializers.ValidationError("Duplicate application IDs are not allowed.")
        return value


class BulkStatusUpdateSerializer(BulkApplicationActionSerializer):
    status = serializers.ChoiceField(
        choices=[
            ScholarshipApplication.Status.UNDER_REVIEW,
            ScholarshipApplication.Status.APPROVED,
            ScholarshipApplication.Status.REJECTED,
        ]
    )
