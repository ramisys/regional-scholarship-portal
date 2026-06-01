"""
Django signals for the applications app.

Signals automatically trigger actions when application events occur.
"""

import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from applications.models import ScholarshipApplication, ApplicationStatusHistory
from core.email_service import EmailService

logger = logging.getLogger(__name__)


@receiver(post_save, sender=ScholarshipApplication)
def send_application_submitted_email(sender, instance, created, **kwargs):
    """
    Send confirmation email when application is submitted.
    
    This signal is triggered when an application is saved. It only sends an email
    when the application transitions from draft to pending (submitted).
    
    Args:
        sender: The model class (ScholarshipApplication)
        instance: The actual instance being saved
        created: Boolean indicating if this is a new instance
        **kwargs: Additional keyword arguments
    """
    # Only send email for non-draft applications
    if not instance.is_draft and instance.submission_date:
        try:
            success = EmailService.send_application_submitted_email(instance)
            if success:
                logger.info(f"Application submitted email sent to {instance.applicant.email}")
            else:
                logger.warning(f"Failed to send application submitted email to {instance.applicant.email}")
        except Exception as e:
            logger.error(
                f"Error sending application submitted email to {instance.applicant.email}: {str(e)}",
                exc_info=True
            )


@receiver(post_save, sender=ApplicationStatusHistory)
def send_status_update_email(sender, instance, created, **kwargs):
    """
    Send notification email when application status changes.
    
    This signal is triggered when a new status history record is created.
    The status history record contains the old and new status information.
    
    Args:
        sender: The model class (ApplicationStatusHistory)
        instance: The actual instance being saved (status history record)
        created: Boolean indicating if this is a new instance
        **kwargs: Additional keyword arguments
    """
    if created:
        try:
            application = instance.application
            old_status = instance.old_status
            new_status = instance.new_status
            message = instance.notes
            
            success = EmailService.send_status_update_email(
                application=application,
                old_status=old_status,
                new_status=new_status,
                message=message
            )
            
            if success:
                logger.info(
                    f"Status update email sent to {application.applicant.email} "
                    f"({old_status} -> {new_status})"
                )
            else:
                logger.warning(
                    f"Failed to send status update email to {application.applicant.email}"
                )
        except Exception as e:
            logger.error(
                f"Error sending status update email: {str(e)}",
                exc_info=True
            )
