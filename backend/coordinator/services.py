from django.db import transaction
from django.utils import timezone

from applications.models import ApplicationStatusHistory, ScholarshipApplication
from coordinator.models import BulkProcessingLog


class CoordinatorBulkApplicationService:
    FINAL_STATUSES = {
        ScholarshipApplication.Status.APPROVED,
        ScholarshipApplication.Status.REJECTED,
    }
    ALLOWED_STATUSES = {
        ScholarshipApplication.Status.UNDER_REVIEW,
        ScholarshipApplication.Status.APPROVED,
        ScholarshipApplication.Status.REJECTED,
    }

    @classmethod
    def bulk_update_status(cls, user, application_ids, target_status, notes=None, action_type=None):
        if target_status not in cls.ALLOWED_STATUSES:
            raise ValueError("Invalid bulk status")

        unique_ids = list(dict.fromkeys(application_ids))
        action_type = action_type or f"bulk_{target_status}"
        notes = notes or f"Bulk {action_type.replace('_', ' ')} performed by coordinator"
        updated_applications = []
        skipped = []
        history_records = []
        now = timezone.now()

        with transaction.atomic():
            applications = list(
                ScholarshipApplication.objects.select_for_update()
                .filter(id__in=unique_ids)
                .order_by("id")
            )

            found_ids = {application.id for application in applications}
            missing_ids = [application_id for application_id in unique_ids if application_id not in found_ids]
            if missing_ids:
                return {
                    "success": False,
                    "message": "Some application IDs were not found.",
                    "missing_ids": missing_ids,
                    "processed_count": 0,
                    "failed_count": len(missing_ids),
                }

            for application in applications:
                if application.status == target_status:
                    skipped.append({"id": application.id, "reason": "Already in target status"})
                    continue

                if application.status == ScholarshipApplication.Status.DRAFT:
                    skipped.append({"id": application.id, "reason": "Draft applications cannot be updated"})
                    continue

                if application.status in cls.FINAL_STATUSES and application.status != target_status:
                    skipped.append({"id": application.id, "reason": "Application already finalized"})
                    continue

                old_status = application.status
                application.status = target_status
                application.is_draft = False
                application.updated_at = now
                updated_applications.append(application)
                history_records.append(
                    ApplicationStatusHistory(
                        application=application,
                        old_status=old_status,
                        new_status=target_status,
                        changed_by=user,
                        notes=notes,
                    )
                )

            if updated_applications:
                ScholarshipApplication.objects.bulk_update(
                    updated_applications,
                    ["status", "is_draft", "updated_at"],
                )
                for history in history_records:
                    history.save()

            BulkProcessingLog.objects.create(
                coordinator=user,
                action_type=action_type,
                application_count=len(unique_ids),
                affected_application_ids=[app.id for app in updated_applications],
                notes=notes,
            )

        return {
            "success": True,
            "message": "Bulk action completed",
            "processed_count": len(updated_applications),
            "failed_count": len(skipped),
            "skipped": skipped,
            "affected_application_ids": [app.id for app in updated_applications],
            "requested_count": len(unique_ids),
        }
