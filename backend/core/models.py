from django.db import models
from django.conf import settings
from django.core.exceptions import PermissionDenied


class EmailLog(models.Model):
    """
    Model to track email send attempts.
    
    This model logs all email sending attempts for monitoring,
    debugging, and audit purposes.
    """
    
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        SENT = "sent", "Sent"
        FAILED = "failed", "Failed"
    
    class EmailType(models.TextChoices):
        REGISTRATION = "registration", "Registration"
        APPLICATION_SUBMITTED = "application_submitted", "Application Submitted"
        STATUS_UPDATE = "status_update", "Status Update"
        DOCUMENT_UPLOADED = "document_uploaded", "Document Uploaded"
        MISSING_DOCUMENTS = "missing_documents", "Missing Documents"
        INCOMPLETE_REMINDER = "incomplete_reminder", "Incomplete Reminder"
        OTHER = "other", "Other"
    
    # Email details
    recipient_email = models.EmailField()
    subject = models.CharField(max_length=255)
    email_type = models.CharField(
        max_length=50,
        choices=EmailType.choices,
        default=EmailType.OTHER
    )
    template_name = models.CharField(max_length=255)
    
    # Related objects
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="email_logs"
    )
    application = models.ForeignKey(
        'applications.ScholarshipApplication',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="email_logs"
    )
    
    # Status tracking
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    error_message = models.TextField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    
    # Retry tracking
    retry_count = models.PositiveIntegerField(default=0)
    last_retry_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["recipient_email", "-created_at"]),
            models.Index(fields=["status", "-created_at"]),
            models.Index(fields=["email_type", "-created_at"]),
        ]
    
    def __str__(self):
        return f"EmailLog<{self.id}:{self.email_type}:{self.recipient_email}>"


class AuditLog(models.Model):
    class Severity(models.TextChoices):
        INFO = "INFO", "Info"
        WARNING = "WARNING", "Warning"
        CRITICAL = "CRITICAL", "Critical"

    class Category(models.TextChoices):
        AUTHENTICATION = "AUTHENTICATION", "Authentication"
        APPLICATION = "APPLICATION", "Application"
        DOCUMENT = "DOCUMENT", "Document"
        SECURITY = "SECURITY", "Security"
        ADMINISTRATION = "ADMINISTRATION", "Administration"

    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs"
    )
    action_type = models.CharField(max_length=150)
    action_category = models.CharField(max_length=50, choices=Category.choices)
    description = models.TextField(blank=True)
    resource_type = models.CharField(max_length=150, blank=True, null=True)
    resource_id = models.CharField(max_length=255, blank=True, null=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)
    request_method = models.CharField(max_length=10, blank=True, null=True)
    endpoint = models.CharField(max_length=255, blank=True, null=True)
    old_value = models.JSONField(null=True, blank=True)
    new_value = models.JSONField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    severity_level = models.CharField(max_length=10, choices=Severity.choices, default=Severity.INFO, db_index=True)

    class Meta:
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["action_category", "-timestamp"]),
            models.Index(fields=["user", "-timestamp"]),
            models.Index(fields=["resource_type", "resource_id"]),
            models.Index(fields=["severity_level", "-timestamp"]),
        ]

    def save(self, *args, **kwargs):
        # Enforce append-only: once created, records cannot be modified
        if self.pk is not None:
            raise PermissionDenied("AuditLog entries are immutable and cannot be modified")
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"AuditLog<{self.id}:{self.action_type}:{self.action_category}:{self.timestamp}>"

