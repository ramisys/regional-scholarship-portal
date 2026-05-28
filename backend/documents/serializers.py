import os

from rest_framework import serializers

from documents.models import UploadedDocument


class UploadedDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = UploadedDocument
        fields = ["id", "application", "file", "cloudinary_url", "document_type", "uploaded_at"]
        read_only_fields = ["id", "cloudinary_url", "uploaded_at"]

    def validate_file(self, value):
        max_size = int(os.getenv("MAX_UPLOAD_SIZE_BYTES", str(5 * 1024 * 1024)))
        allowed_extensions = {".pdf", ".png", ".jpg", ".jpeg"}

        if value.size > max_size:
            raise serializers.ValidationError("File exceeds max allowed size")

        extension = os.path.splitext(value.name)[1].lower()
        if extension not in allowed_extensions:
            raise serializers.ValidationError("Unsupported file format")

        return value
