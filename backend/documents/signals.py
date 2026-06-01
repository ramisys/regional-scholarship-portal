"""
Django signals for the documents app.

Signals automatically trigger actions when document events occur.
"""

import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from documents.models import UploadedDocument
from core.email_service import EmailService

logger = logging.getLogger(__name__)


@receiver(post_save, sender=UploadedDocument)
def send_document_uploaded_email(sender, instance, created, **kwargs):
    """
    Send notification email when a document is uploaded successfully.
    
    This signal is triggered when a new UploadedDocument instance is saved.
    Only sends email for newly created documents (not updates).
    
    Args:
        sender: The model class (UploadedDocument)
        instance: The actual instance being saved
        created: Boolean indicating if this is a new instance
        **kwargs: Additional keyword arguments
    """
    if created:
        try:
            application = instance.application
            success = EmailService.send_document_uploaded_email(application, instance)
            
            if success:
                logger.info(
                    f"Document uploaded email sent to {application.applicant.email} "
                    f"(Document: {instance.document_type})"
                )
            else:
                logger.warning(
                    f"Failed to send document uploaded email to {application.applicant.email}"
                )
        except Exception as e:
            logger.error(
                f"Error sending document uploaded email: {str(e)}",
                exc_info=True
            )
