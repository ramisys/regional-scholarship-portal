import json

from django.utils.html import strip_tags
from rest_framework import serializers

from applications.models import ApplicationStatusHistory, ScholarshipApplication
from education.models import EducationalBackground
from documents.models import UploadedDocument


class EducationalBackgroundNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = EducationalBackground
        fields = ["id", "school_name", "level", "year_started", "year_ended"]


class UploadedDocumentNestedSerializer(serializers.ModelSerializer):
    fileName = serializers.SerializerMethodField()
    fileUrl = serializers.SerializerMethodField()
    fileType = serializers.CharField(source="document_type", read_only=True)

    class Meta:
        model = UploadedDocument
        fields = ["id", "fileName", "fileUrl", "fileType"]

    def get_fileName(self, obj):
        return obj.file.name.split("/")[-1] if getattr(obj, "file", None) else ""

    def get_fileUrl(self, obj):
        return obj.cloudinary_url or getattr(obj.file, "url", "")


class ApplicationStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_email = serializers.EmailField(source="changed_by.email", read_only=True)

    class Meta:
        model = ApplicationStatusHistory
        fields = ["id", "old_status", "new_status", "changed_by", "changed_by_email", "timestamp", "notes"]
        read_only_fields = ["id", "changed_by", "changed_by_email", "timestamp"]


class ScholarshipApplicationSerializer(serializers.ModelSerializer):
    educational_backgrounds = EducationalBackgroundNestedSerializer(many=True, required=False)
    documents = UploadedDocumentNestedSerializer(many=True, required=False)
    status_history = ApplicationStatusHistorySerializer(many=True, read_only=True)
    applicantName = serializers.SerializerMethodField()
    email = serializers.EmailField(source="applicant.email", read_only=True)
    region = serializers.SerializerMethodField()
    submittedDate = serializers.DateTimeField(source="submission_date", read_only=True)
    lastUpdated = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = ScholarshipApplication
        fields = [
            "id",
            "applicant",
            "applicantName",
            "email",
            "region",
            "title",
            "personal_statement",
            "status",
            "is_draft",
            "submittedDate",
            "lastUpdated",
            "submission_date",
            "created_at",
            "updated_at",
            "educational_backgrounds",
            "documents",
            "status_history",
        ]
        read_only_fields = ["id", "applicant", "status", "submission_date", "created_at", "updated_at"]

    def get_applicantName(self, obj):
        profile = getattr(obj.applicant, "profile", None)
        full_name = getattr(profile, "full_name", "") if profile else ""
        full_name = full_name.strip()
        return full_name or obj.applicant.email

    def get_region(self, obj):
        try:
            payload = json.loads(obj.personal_statement or "{}")
        except (TypeError, ValueError):
            payload = {}

        contact_info = payload.get("contactInfo") if isinstance(payload, dict) else {}
        if isinstance(contact_info, dict):
            region = contact_info.get("region", "")
            if isinstance(region, str):
                return region.strip()

        return ""

    def validate_title(self, value):
        sanitized = strip_tags(value).strip()
        if not sanitized:
            raise serializers.ValidationError("Title is required")
        return sanitized

    def create(self, validated_data):
        educational_items = validated_data.pop("educational_backgrounds", [])
        validated_data.pop("documents", None)
        application = ScholarshipApplication.objects.create(**validated_data)
        for item in educational_items:
            EducationalBackground.objects.create(application=application, **item)
        return application

    def update(self, instance, validated_data):
        educational_items = validated_data.pop("educational_backgrounds", None)
        validated_data.pop("documents", None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()

        if educational_items is not None:
            instance.educational_backgrounds.all().delete()
            for item in educational_items:
                EducationalBackground.objects.create(application=instance, **item)

        return instance
