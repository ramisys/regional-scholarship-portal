from django.conf import settings
from django.db import models


class BulkProcessingLog(models.Model):
    class ActionType(models.TextChoices):
        BULK_APPROVE = "bulk_approve", "Bulk Approve"
        BULK_REJECT = "bulk_reject", "Bulk Reject"
        BULK_STATUS_UPDATE = "bulk_status_update", "Bulk Status Update"
        BULK_ASSIGN_REVIEW = "bulk_assign_review", "Bulk Assign Review"

    coordinator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="bulk_actions",
    )
    action_type = models.CharField(max_length=50, choices=ActionType.choices)
    application_count = models.PositiveIntegerField()
    affected_application_ids = models.JSONField(default=list)
    notes = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"BulkProcessingLog<{self.action_type}:{self.application_count}>"
