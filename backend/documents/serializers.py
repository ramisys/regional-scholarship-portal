import os
from django.conf import settings

from rest_framework import serializers

from documents.models import UploadedDocument

try:
    import magic
except Exception:
    magic = None


class UploadedDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = UploadedDocument
        fields = ["id", "application", "file", "cloudinary_url", "document_type", "uploaded_at"]
        read_only_fields = ["id", "cloudinary_url", "uploaded_at"]

    def validate_file(self, value):
        env_max = int(os.getenv("MAX_UPLOAD_SIZE_BYTES", str(5 * 1024 * 1024)))
        max_size = getattr(settings, "MAX_UPLOAD_SIZE_BYTES", env_max)
        allowed_extensions = {".pdf", ".png", ".jpg", ".jpeg"}

        if value.size > max_size:
            raise serializers.ValidationError("File exceeds max allowed size")

        extension = os.path.splitext(value.name)[1].lower()
        if extension not in allowed_extensions:
            raise serializers.ValidationError("Unsupported file format")

        # MIME sniffing when python-magic is available
        detected_mime = None
        try:
            if magic is not None:
                # Read a small chunk to detect mime
                head = value.read(2048)
                detected_mime = magic.from_buffer(head, mime=True)
                value.seek(0)
        except Exception:
            detected_mime = None

        if detected_mime:
            if extension == ".pdf" and detected_mime not in ("application/pdf", "application/x-pdf"):
                raise serializers.ValidationError("File content does not match .pdf format")
            if extension in {".png", ".jpg", ".jpeg"} and not detected_mime.startswith("image/"):
                raise serializers.ValidationError("File content is not a valid image")

        return value
