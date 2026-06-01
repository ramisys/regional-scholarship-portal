"""
Django signals for the accounts app.

Signals automatically trigger actions when user events occur.
"""

import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from accounts.models import User
from core.email_service import EmailService

logger = logging.getLogger(__name__)


@receiver(post_save, sender=User)
def send_welcome_email_on_registration(sender, instance, created, **kwargs):
    """
    Send welcome email when a new user is registered.
    
    This signal is triggered after a new User instance is saved to the database.
    Only sends email for newly created users, not on updates.
    
    Args:
        sender: The model class (User)
        instance: The actual instance being saved
        created: Boolean indicating if this is a new instance
        **kwargs: Additional keyword arguments
    """
    logger.info(f"User post_save signal triggered: email={instance.email}, created={created}, is_active={instance.is_active}, role={instance.role}")
    
    if created and instance.is_active:
        try:
            # Only send welcome email for student registrations (not coordinators)
            if instance.role == User.Role.STUDENT:
                logger.info(f"Sending welcome email to {instance.email}")
                success = EmailService.send_registration_email(instance)
                if success:
                    logger.info(f"Welcome email sent to {instance.email}")
                else:
                    logger.warning(f"Failed to send welcome email to {instance.email}")
            else:
                logger.info(f"Not sending email - user role is {instance.role}, not STUDENT")
        except Exception as e:
            logger.error(f"Error sending welcome email to {instance.email}: {str(e)}", exc_info=True)
    else:
        if not created:
            logger.debug(f"Not sending email - user not newly created")
        if not instance.is_active:
            logger.debug(f"Not sending email - user is not active")
