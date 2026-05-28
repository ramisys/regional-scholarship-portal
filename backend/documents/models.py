from django.db import models

from applications.models import ScholarshipApplication


class UploadedDocument(models.Model):
	class DocumentType(models.TextChoices):
		ID_CARD = "id_card", "ID Card"
		PASSPORT = "passport", "Passport"
		TRANSCRIPT = "transcript", "Transcript"
		OTHER = "other", "Other"

	application = models.ForeignKey(
		ScholarshipApplication,
		on_delete=models.CASCADE,
		related_name="documents",
	)
	file = models.FileField(upload_to="documents/%Y/%m/%d")
	cloudinary_url = models.URLField(blank=True)
	document_type = models.CharField(max_length=50, choices=DocumentType.choices)
	uploaded_at = models.DateTimeField(auto_now_add=True)

	def save(self, *args, **kwargs):
		super().save(*args, **kwargs)
		file_url = getattr(self.file, "url", "")
		if file_url and self.cloudinary_url != file_url:
			self.cloudinary_url = file_url
			super().save(update_fields=["cloudinary_url"])

	def __str__(self):
		return f"Document<{self.id}:{self.document_type}>"
