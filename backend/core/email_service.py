"""
Email service for sending notifications to users.

This module provides email functionality for:
- Registration notifications
- Application status updates
- Document notifications
- Reminder notifications

All emails use HTML templates and are sent via configured SMTP backend.
"""

import logging
from typing import List, Optional, Dict, Any
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.utils import timezone

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending email notifications."""
    
    @staticmethod
    def validate_recipient(email: str) -> bool:
        """
        Validate email address format.
        
        Args:
            email: Email address to validate
            
        Returns:
            bool: True if valid, False otherwise
        """
        try:
            validate_email(email)
            return True
        except ValidationError:
            logger.warning(f"Invalid email address: {email}")
            return False
    
    @staticmethod
    def send_html_email(
        subject: str,
        recipient_email: str,
        template_name: str,
        context: Dict[str, Any],
        from_email: Optional[str] = None,
        cc_emails: Optional[List[str]] = None,
        bcc_emails: Optional[List[str]] = None,
        reply_to: Optional[List[str]] = None,
        email_type: str = "other",
        user=None,
        application=None,
    ) -> bool:
        """
        Send an HTML email using Django templates.
        
        Args:
            subject: Email subject
            recipient_email: Recipient email address
            template_name: Path to email template (relative to email_templates)
            context: Template context variables
            from_email: Sender email (defaults to DEFAULT_FROM_EMAIL)
            cc_emails: List of CC email addresses
            bcc_emails: List of BCC email addresses
            reply_to: List of reply-to email addresses
            email_type: Type of email for logging
            user: Optional User instance to associate with email
            application: Optional Application instance to associate with email
            
        Returns:
            bool: True if sent successfully, False otherwise
        """
        # Validate recipient email
        if not EmailService.validate_recipient(recipient_email):
            logger.error(f"Skipping email to invalid address: {recipient_email}")
            return False
        
        # Set defaults
        from_email = from_email or settings.DEFAULT_FROM_EMAIL
        cc_emails = cc_emails or []
        bcc_emails = bcc_emails or []
        reply_to = reply_to or [settings.DEFAULT_FROM_EMAIL]
        
        try:
            # Import here to avoid circular imports
            from core.models import EmailLog
            
            # Create log entry
            log_entry = EmailLog.objects.create(
                recipient_email=recipient_email,
                subject=subject,
                template_name=template_name,
                email_type=email_type,
                user=user,
                application=application,
                status=EmailLog.Status.PENDING
            )
            
            # Add default context variables
            context.setdefault("support_email", settings.DEFAULT_FROM_EMAIL)
            context.setdefault("support_phone", getattr(settings, "SUPPORT_PHONE", "N/A"))
            context.setdefault("app_name", "Regional Scholarship Portal")
            
            # Render HTML content
            html_message = render_to_string(template_name, context)
            
            # Create plain text version
            text_message = strip_tags(html_message)
            
            # Create email
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_message,
                from_email=from_email,
                to=[recipient_email],
                cc=cc_emails,
                bcc=bcc_emails,
                reply_to=reply_to,
            )
            
            # Attach HTML alternative
            email.attach_alternative(html_message, "text/html")
            
            # Send email
            result = email.send()
            
            if result > 0:
                # Update log entry
                log_entry.status = EmailLog.Status.SENT
                log_entry.sent_at = timezone.now()
                log_entry.save(update_fields=["status", "sent_at"])
                
                logger.info(f"Email sent successfully to {recipient_email} (Subject: {subject})")
                return True
            else:
                # Update log entry
                log_entry.status = EmailLog.Status.FAILED
                log_entry.error_message = "Email send returned 0"
                log_entry.save(update_fields=["status", "error_message"])
                
                logger.error(f"Failed to send email to {recipient_email} (Subject: {subject})")
                return False
                
        except Exception as e:
            # Try to update log entry if it exists
            try:
                from core.models import EmailLog
                log = EmailLog.objects.filter(
                    recipient_email=recipient_email,
                    subject=subject,
                    status=EmailLog.Status.PENDING
                ).latest('created_at')
                log.status = EmailLog.Status.FAILED
                log.error_message = str(e)
                log.save(update_fields=["status", "error_message"])
            except Exception:
                pass
            
            logger.error(
                f"Error sending email to {recipient_email}: {str(e)}",
                exc_info=True
            )
            return False
    
    @staticmethod
    def send_registration_email(user, password: Optional[str] = None) -> bool:
        """
        Send welcome email after user registration.
        
        Args:
            user: User instance
            password: Optional password (should not be sent, kept for flexibility)
            
        Returns:
            bool: Email sent successfully
        """
        full_name = getattr(user.profile, 'full_name', user.email) if hasattr(user, 'profile') else user.email
        
        context = {
            "user_name": full_name or user.email,
            "user_email": user.email,
            "portal_url": getattr(settings, "FRONTEND_URL", "http://localhost:5173"),
            "login_url": f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')}/login",
        }
        
        return EmailService.send_html_email(
            subject="Welcome to Regional Scholarship Portal",
            recipient_email=user.email,
            template_name="emails/registration_welcome.html",
            context=context,
            email_type="registration",
            user=user,
        )
    
    @staticmethod
    def send_application_submitted_email(application) -> bool:
        """
        Send confirmation email after application submission.
        
        Args:
            application: ScholarshipApplication instance
            
        Returns:
            bool: Email sent successfully
        """
        user = application.applicant
        full_name = getattr(user.profile, 'full_name', user.email) if hasattr(user, 'profile') else user.email
        
        context = {
            "user_name": full_name or user.email,
            "application_id": application.id,
            "application_title": application.title,
            "submission_date": application.submission_date,
            "status": application.get_status_display(),
            "portal_url": getattr(settings, "FRONTEND_URL", "http://localhost:5173"),
            "application_url": f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')}/applications/{application.id}",
        }
        
        return EmailService.send_html_email(
            subject=f"Application Submitted - Reference #{application.id}",
            recipient_email=user.email,
            template_name="emails/application_submitted.html",
            context=context,
            email_type="application_submitted",
            user=user,
            application=application,
        )
    
    @staticmethod
    def send_status_update_email(application, old_status: str, new_status: str, message: str = "") -> bool:
        """
        Send notification when application status changes.
        
        Args:
            application: ScholarshipApplication instance
            old_status: Previous status
            new_status: New status
            message: Optional custom message
            
        Returns:
            bool: Email sent successfully
        """
        user = application.applicant
        full_name = getattr(user.profile, 'full_name', user.email) if hasattr(user, 'profile') else user.email
        
        # Map status to display text
        status_display = {
            'draft': 'Draft',
            'pending': 'Pending',
            'under_review': 'Under Review',
            'approved': 'Approved',
            'rejected': 'Rejected',
        }
        
        context = {
            "user_name": full_name or user.email,
            "application_id": application.id,
            "application_title": application.title,
            "old_status": status_display.get(old_status, old_status),
            "new_status": status_display.get(new_status, new_status),
            "status_message": message,
            "updated_at": application.updated_at,
            "portal_url": getattr(settings, "FRONTEND_URL", "http://localhost:5173"),
            "application_url": f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')}/applications/{application.id}",
        }
        
        return EmailService.send_html_email(
            subject=f"Application Status Update - Reference #{application.id}",
            recipient_email=user.email,
            template_name="emails/status_update.html",
            context=context,
            email_type="status_update",
            user=user,
            application=application,
        )
    
    @staticmethod
    def send_document_uploaded_email(application, document) -> bool:
        """
        Send notification when document is uploaded successfully.
        
        Args:
            application: ScholarshipApplication instance
            document: UploadedDocument instance
            
        Returns:
            bool: Email sent successfully
        """
        user = application.applicant
        full_name = getattr(user.profile, 'full_name', user.email) if hasattr(user, 'profile') else user.email
        
        context = {
            "user_name": full_name or user.email,
            "application_id": application.id,
            "document_type": document.get_document_type_display(),
            "uploaded_at": document.uploaded_at,
            "portal_url": getattr(settings, "FRONTEND_URL", "http://localhost:5173"),
            "application_url": f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')}/applications/{application.id}",
        }
        
        return EmailService.send_html_email(
            subject=f"Document Uploaded Successfully - Reference #{application.id}",
            recipient_email=user.email,
            template_name="emails/document_uploaded.html",
            context=context,
            email_type="document_uploaded",
            user=user,
            application=application,
        )
    
    @staticmethod
    def send_missing_documents_email(application, missing_documents: List[str]) -> bool:
        """
        Send reminder email about missing required documents.
        
        Args:
            application: ScholarshipApplication instance
            missing_documents: List of missing document types
            
        Returns:
            bool: Email sent successfully
        """
        user = application.applicant
        full_name = getattr(user.profile, 'full_name', user.email) if hasattr(user, 'profile') else user.email
        
        context = {
            "user_name": full_name or user.email,
            "application_id": application.id,
            "missing_documents": missing_documents,
            "portal_url": getattr(settings, "FRONTEND_URL", "http://localhost:5173"),
            "application_url": f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')}/applications/{application.id}",
        }
        
        return EmailService.send_html_email(
            subject=f"Missing Documents - Reference #{application.id}",
            recipient_email=user.email,
            template_name="emails/missing_documents.html",
            context=context,
            email_type="missing_documents",
            user=user,
            application=application,
        )
    
    @staticmethod
    def send_incomplete_application_reminder(application) -> bool:
        """
        Send reminder email about incomplete application.
        
        Args:
            application: ScholarshipApplication instance
            
        Returns:
            bool: Email sent successfully
        """
        user = application.applicant
        full_name = getattr(user.profile, 'full_name', user.email) if hasattr(user, 'profile') else user.email
        
        context = {
            "user_name": full_name or user.email,
            "application_id": application.id,
            "application_title": application.title,
            "portal_url": getattr(settings, "FRONTEND_URL", "http://localhost:5173"),
            "application_url": f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')}/applications/{application.id}",
        }
        
        return EmailService.send_html_email(
            subject=f"Incomplete Application Reminder - Reference #{application.id}",
            recipient_email=user.email,
            template_name="emails/incomplete_reminder.html",
            context=context,
            email_type="incomplete_reminder",
            user=user,
            application=application,
        )
    
    @staticmethod
    def send_bulk_email(
        subject: str,
        template_name: str,
        recipients: List[Dict[str, Any]],
        from_email: Optional[str] = None,
    ) -> tuple[int, int]:
        """
        Send emails to multiple recipients.
        
        Args:
            subject: Email subject
            template_name: Path to email template
            recipients: List of dicts with 'email' and 'context' keys
            from_email: Sender email
            
        Returns:
            tuple: (successful_count, failed_count)
        """
        successful = 0
        failed = 0
        
        for recipient in recipients:
            email_address = recipient.get("email")
            context = recipient.get("context", {})
            
            if EmailService.send_html_email(
                subject=subject,
                recipient_email=email_address,
                template_name=template_name,
                context=context,
                from_email=from_email,
            ):
                successful += 1
            else:
                failed += 1
        
        logger.info(f"Bulk email sent: {successful} successful, {failed} failed")
        return successful, failed
