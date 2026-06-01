"""
Management command to test email functionality.

Usage:
    python manage.py test_emails [--user-email=test@example.com] [--email-type=registration]
"""

import logging
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from accounts.models import ApplicantProfile
from applications.models import ScholarshipApplication, ApplicationStatusHistory
from documents.models import UploadedDocument
from core.email_service import EmailService
from core.models import EmailLog

logger = logging.getLogger(__name__)
User = get_user_model()


class Command(BaseCommand):
    help = 'Test email functionality by sending test emails'

    def add_arguments(self, parser):
        parser.add_argument(
            '--user-email',
            type=str,
            help='Email address to send test emails to',
        )
        parser.add_argument(
            '--email-type',
            type=str,
            choices=['registration', 'application', 'status', 'document', 'reminder', 'all'],
            default='all',
            help='Type of email to test',
        )

    def handle(self, *args, **options):
        user_email = options.get('user_email')
        email_type = options.get('email_type', 'all')

        if not user_email:
            raise CommandError('--user-email is required')

        try:
            # Get or create test user
            user, created = User.objects.get_or_create(
                email=user_email,
                defaults={'role': User.Role.STUDENT}
            )
            
            if created:
                # Create profile
                profile, _ = ApplicantProfile.objects.get_or_create(
                    user=user,
                    defaults={'full_name': 'Test User'}
                )
                self.stdout.write(self.style.SUCCESS(f'Created test user: {user_email}'))
            else:
                self.stdout.write(f'Using existing user: {user_email}')

            # Test based on email type
            if email_type in ['registration', 'all']:
                self._test_registration_email(user)

            if email_type in ['application', 'all']:
                self._test_application_emails(user)

            if email_type in ['status', 'all']:
                self._test_status_update_email(user)

            if email_type in ['document', 'all']:
                self._test_document_emails(user)

            if email_type in ['reminder', 'all']:
                self._test_reminder_emails(user)

            # Show email logs
            self._show_email_logs(user_email)

        except Exception as e:
            raise CommandError(f'Error testing emails: {str(e)}')

    def _test_registration_email(self, user):
        """Test registration email"""
        self.stdout.write('Testing registration email...')
        try:
            result = EmailService.send_registration_email(user)
            if result:
                self.stdout.write(self.style.SUCCESS('✓ Registration email sent'))
            else:
                self.stdout.write(self.style.ERROR('✗ Registration email failed'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Error: {str(e)}'))

    def _test_application_emails(self, user):
        """Test application submission email"""
        self.stdout.write('Testing application emails...')
        try:
            # Create test application
            app, created = ScholarshipApplication.objects.get_or_create(
                applicant=user,
                title='Test Application',
                defaults={
                    'personal_statement': 'This is a test application',
                    'status': ScholarshipApplication.Status.DRAFT,
                    'is_draft': True
                }
            )

            if created:
                self.stdout.write('Created test application')

            # Submit application
            app.submit()
            result = EmailService.send_application_submitted_email(app)
            if result:
                self.stdout.write(self.style.SUCCESS('✓ Application submission email sent'))
            else:
                self.stdout.write(self.style.ERROR('✗ Application submission email failed'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Error: {str(e)}'))

    def _test_status_update_email(self, user):
        """Test status update email"""
        self.stdout.write('Testing status update email...')
        try:
            # Get or create application
            app = ScholarshipApplication.objects.filter(applicant=user).first()
            if not app:
                app = ScholarshipApplication.objects.create(
                    applicant=user,
                    title='Test Application',
                    status=ScholarshipApplication.Status.PENDING,
                    is_draft=False
                )

            # Create status history
            history = ApplicationStatusHistory.objects.create(
                application=app,
                old_status='pending',
                new_status='under_review',
                changed_by=user,
                notes='Your application is being reviewed'
            )

            result = EmailService.send_status_update_email(
                app,
                old_status='pending',
                new_status='under_review',
                message='Your application is being reviewed'
            )
            if result:
                self.stdout.write(self.style.SUCCESS('✓ Status update email sent'))
            else:
                self.stdout.write(self.style.ERROR('✗ Status update email failed'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Error: {str(e)}'))

    def _test_document_emails(self, user):
        """Test document upload email"""
        self.stdout.write('Testing document emails...')
        try:
            # Get or create application
            app = ScholarshipApplication.objects.filter(applicant=user).first()
            if not app:
                app = ScholarshipApplication.objects.create(
                    applicant=user,
                    title='Test Application',
                    status=ScholarshipApplication.Status.PENDING,
                    is_draft=False
                )

            result = EmailService.send_document_uploaded_email(app, type('obj', (object,), {
                'document_type': 'id_card',
                'get_document_type_display': lambda: 'ID Card',
                'uploaded_at': __import__('django.utils.timezone', fromlist=['now']).now()
            })())
            
            if result:
                self.stdout.write(self.style.SUCCESS('✓ Document upload email sent'))
            else:
                self.stdout.write(self.style.ERROR('✗ Document upload email failed'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Error: {str(e)}'))

    def _test_reminder_emails(self, user):
        """Test reminder emails"""
        self.stdout.write('Testing reminder emails...')
        try:
            # Get or create application
            app = ScholarshipApplication.objects.filter(applicant=user, is_draft=True).first()
            if not app:
                app = ScholarshipApplication.objects.create(
                    applicant=user,
                    title='Incomplete Application',
                    status=ScholarshipApplication.Status.DRAFT,
                    is_draft=True
                )

            result = EmailService.send_incomplete_application_reminder(app)
            if result:
                self.stdout.write(self.style.SUCCESS('✓ Incomplete reminder email sent'))
            else:
                self.stdout.write(self.style.ERROR('✗ Incomplete reminder email failed'))

            # Test missing documents reminder
            result = EmailService.send_missing_documents_email(
                app,
                ['ID Card', 'Transcript']
            )
            if result:
                self.stdout.write(self.style.SUCCESS('✓ Missing documents email sent'))
            else:
                self.stdout.write(self.style.ERROR('✗ Missing documents email failed'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Error: {str(e)}'))

    def _show_email_logs(self, user_email):
        """Display email logs for the test user"""
        self.stdout.write('\n' + '='*70)
        self.stdout.write('EMAIL LOGS')
        self.stdout.write('='*70)

        logs = EmailLog.objects.filter(recipient_email=user_email).order_by('-created_at')[:10]

        if not logs:
            self.stdout.write('No email logs found')
            return

        for log in logs:
            status_style = self.style.SUCCESS if log.status == 'sent' else self.style.ERROR
            self.stdout.write(f"\n{status_style('[' + log.status.upper() + ']')} {log.email_type}")
            self.stdout.write(f"  Subject: {log.subject}")
            self.stdout.write(f"  Created: {log.created_at}")
            if log.sent_at:
                self.stdout.write(f"  Sent: {log.sent_at}")
            if log.error_message:
                self.stdout.write(f"  Error: {log.error_message}")
