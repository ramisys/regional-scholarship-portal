"""
Diagnostic command to troubleshoot email notification system in production.
Usage: python manage.py diagnose_email
"""

from django.core.management.base import BaseCommand
from django.conf import settings
from django.core.mail import EmailMessage
from core.models import EmailLog
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Diagnose email configuration and signal status'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=== Email System Diagnostic ===\n'))

        # 1. Check email backend
        self.stdout.write(self.style.WARNING('1. EMAIL BACKEND:'))
        backend = settings.EMAIL_BACKEND
        self.stdout.write(f"   Current: {backend}")
        if 'console' in backend:
            self.stdout.write(self.style.ERROR('   ⚠️  CONSOLE BACKEND DETECTED - Emails are being printed, not sent!'))
        elif 'smtp' in backend:
            self.stdout.write(self.style.SUCCESS('   ✓ SMTP Backend configured'))
        elif 'sendgrid' in backend.lower():
            self.stdout.write(self.style.SUCCESS('   ✓ SendGrid Backend configured'))
        self.stdout.write('')

        # 2. Check email configuration
        self.stdout.write(self.style.WARNING('2. EMAIL CONFIGURATION:'))
        self.stdout.write(f"   HOST: {settings.EMAIL_HOST}")
        self.stdout.write(f"   PORT: {settings.EMAIL_PORT}")
        self.stdout.write(f"   USE_TLS: {settings.EMAIL_USE_TLS}")
        self.stdout.write(f"   HOST_USER: {settings.EMAIL_HOST_USER or 'NOT SET'}")
        self.stdout.write(f"   HOST_PASSWORD: {'SET' if settings.EMAIL_HOST_PASSWORD else 'NOT SET'}")
        self.stdout.write(f"   SENDGRID_API_KEY: {'SET' if getattr(settings, 'SENDGRID_API_KEY', '') else 'NOT SET'}")
        self.stdout.write(f"   DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
        self.stdout.write(f"   FRONTEND_URL: {settings.FRONTEND_URL}")
        
        if ('smtp' in backend and (not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD)):
            self.stdout.write(self.style.ERROR('   ⚠️  Missing SMTP credentials!'))
        if ('sendgrid' in backend.lower() and not getattr(settings, 'SENDGRID_API_KEY', '')):
            self.stdout.write(self.style.ERROR('   ⚠️  Missing SendGrid API key!'))
        self.stdout.write('')

        # 3. Check if EmailLog table exists
        self.stdout.write(self.style.WARNING('3. EMAIL LOG TABLE:'))
        try:
            count = EmailLog.objects.count()
            self.stdout.write(self.style.SUCCESS(f'   ✓ EmailLog table exists - {count} records'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'   ✗ EmailLog table error: {str(e)}'))
        self.stdout.write('')

        # 4. Check recent email logs
        self.stdout.write(self.style.WARNING('4. RECENT EMAIL LOGS:'))
        logs = EmailLog.objects.order_by('-created_at')[:5]
        if logs:
            for log in logs:
                status_style = (
                    self.style.SUCCESS if log.status == EmailLog.Status.SENT 
                    else self.style.ERROR if log.status == EmailLog.Status.FAILED
                    else self.style.WARNING
                )
                self.stdout.write(f'   {status_style(log.status.upper())} - {log.email_type} - {log.recipient_email} - {log.created_at}')
                if log.status == EmailLog.Status.FAILED and log.error_message:
                    self.stdout.write(f"        Error: {log.error_message}")
        else:
            self.stdout.write(self.style.WARNING('   No email logs found'))
        self.stdout.write('')

        # 5. Test SMTP connection
        self.stdout.write(self.style.WARNING('5. SMTP CONNECTION TEST:'))
        try:
            email = EmailMessage(
                subject='[TEST] Email System Diagnostic',
                body='This is a test email from the diagnostic command.',
                from_email=settings.EMAIL_HOST_USER,
                to=[settings.EMAIL_HOST_USER],
            )
            result = email.send()
            if result > 0:
                self.stdout.write(self.style.SUCCESS('   ✓ Test email sent successfully'))
            else:
                self.stdout.write(self.style.ERROR('   ✗ Test email returned 0 (failed to send)'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'   ✗ SMTP error: {str(e)}'))
        self.stdout.write('')

        # 6. Check signal registration
        self.stdout.write(self.style.WARNING('6. SIGNAL REGISTRATION:'))
        try:
            from django.db.models.signals import post_save
            from accounts.models import User
            
            # Count receivers for User post_save signal
            receivers = post_save.receivers_for_model(User)
            self.stdout.write(f'   User post_save receivers: {len(receivers)}')
            for receiver in receivers:
                self.stdout.write(f"      - {receiver[1]()}")
            
            if not receivers:
                self.stdout.write(self.style.ERROR('   ⚠️  No signal receivers registered!'))
            else:
                self.stdout.write(self.style.SUCCESS('   ✓ Signals registered'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'   ✗ Error checking signals: {str(e)}'))
        self.stdout.write('')

        self.stdout.write(self.style.SUCCESS('=== Diagnostic Complete ==='))
