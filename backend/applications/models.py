from django.conf import settings
from django.db import models
from django.utils import timezone

# Create your models here.
class ScholarshipApplication(models.Model):
	class Status(models.TextChoices):
		DRAFT = "draft", "Draft"
		PENDING = "pending", "Pending"
		UNDER_REVIEW = "under_review", "Under Review"
		APPROVED = "approved", "Approved"
		REJECTED = "rejected", "Rejected"

	applicant = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name="applications",
	)
	title = models.CharField(max_length=255)
	personal_statement = models.TextField(blank=True)
	status = models.CharField(max_length=30, choices=Status.choices, default=Status.DRAFT)
	is_draft = models.BooleanField(default=True)
	submission_date = models.DateTimeField(null=True, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	def submit(self):
		self.is_draft = False
		self.status = self.Status.PENDING
		self.submission_date = timezone.now()
		self.save(update_fields=["is_draft", "status", "submission_date", "updated_at"])

	def __str__(self):
		return f"Application<{self.id}:{self.applicant.email}>"


class ApplicationStatusHistory(models.Model):
	application = models.ForeignKey(
		ScholarshipApplication,
		on_delete=models.CASCADE,
		related_name="status_history",
	)
	old_status = models.CharField(max_length=30)
	new_status = models.CharField(max_length=30)
	changed_by = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="status_changes",
	)
	timestamp = models.DateTimeField(auto_now_add=True)
	notes = models.TextField(blank=True)

	class Meta:
		ordering = ["-timestamp"]

	def __str__(self):
		return f"StatusHistory<{self.application_id}:{self.old_status}->{self.new_status}>"
# Create your models here.
