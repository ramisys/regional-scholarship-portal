from rest_framework import serializers

from education.models import EducationalBackground


class EducationalBackgroundSerializer(serializers.ModelSerializer):
    class Meta:
        model = EducationalBackground
        fields = ["id", "application", "school_name", "level", "year_started", "year_ended"]
        read_only_fields = ["id"]
