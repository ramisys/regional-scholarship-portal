# Email Notification System Documentation

## Overview

The Email Notification System is a comprehensive Django-based email service that automatically sends notifications to applicants for important application events and updates. The system uses Gmail SMTP for reliable email delivery and includes HTML email templates, automatic signal-based triggers, and email logging for monitoring.

## Features

✅ **Automatic Email Triggers**
- Registration notifications
- Application submission confirmations
- Application status updates
- Document upload confirmations
- Missing documents reminders
- Incomplete application reminders

✅ **Professional Email Templates**
- Responsive HTML emails
- Mobile-friendly design
- Custom branding support
- Dynamic content injection

✅ **Reliable Delivery**
- Gmail SMTP authentication via App Passwords
- Email logging and tracking
- Error handling and retry support
- Validation of recipient emails

✅ **Security**
- Credentials stored in environment variables
- No hardcoded secrets
- Secure SMTP over TLS
- Header injection prevention

## Setup Instructions

### 1. Environment Variables Configuration

Update your `.env` file with Gmail SMTP credentials:

```env
# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=no-reply@regional-scholarship.local
FRONTEND_URL=http://localhost:5173
SUPPORT_PHONE=+1 (555) 123-4567
```

### 2. Gmail App Password Setup

To use Gmail SMTP securely:

1. **Enable 2-Factor Authentication** on your Google Account
   - Go to https://myaccount.google.com/
   - Select "Security" from the left menu
   - Enable 2-Step Verification

2. **Create App Password**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer" (or your device)
   - Google will generate a 16-character password
   - Copy this password to `EMAIL_HOST_PASSWORD` in your `.env` file

### 3. Install Dependencies

The system uses Django's built-in email framework, but ensure you have the latest Django:

```bash
pip install Django==6.0.5
pip install djangorestframework==3.17.1
```

### 4. Run Database Migrations

The system includes an `EmailLog` model for tracking email attempts:

```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Verify Configuration

Test the email setup in Django shell:

```bash
python manage.py shell
```

Then in the shell:

```python
from django.core.mail import send_mail
from django.conf import settings

result = send_mail(
    'Test Email',
    'This is a test email',
    settings.DEFAULT_FROM_EMAIL,
    ['recipient@example.com'],
    fail_silently=False,
)
print(f"Email sent: {result}")
```

## Email Service API

### Core Functions

#### `send_registration_email(user)`
Sends a welcome email after user registration.

```python
from core.email_service import EmailService

EmailService.send_registration_email(user)
```

#### `send_application_submitted_email(application)`
Sends confirmation when an application is submitted.

```python
EmailService.send_application_submitted_email(application)
```

#### `send_status_update_email(application, old_status, new_status, message="")`
Sends notification when application status changes.

```python
EmailService.send_status_update_email(
    application=app,
    old_status='draft',
    new_status='pending',
    message='Your application has been received.'
)
```

#### `send_document_uploaded_email(application, document)`
Sends confirmation when a document is uploaded.

```python
EmailService.send_document_uploaded_email(application, document)
```

#### `send_missing_documents_email(application, missing_documents)`
Sends reminder about missing documents.

```python
EmailService.send_missing_documents_email(
    application,
    ['Transcript', 'ID Card']
)
```

#### `send_incomplete_application_reminder(application)`
Sends reminder about incomplete application.

```python
EmailService.send_incomplete_application_reminder(application)
```

#### `send_bulk_email(subject, template_name, recipients, from_email=None)`
Sends emails to multiple recipients.

```python
recipients = [
    {'email': 'user1@example.com', 'context': {'user_name': 'User 1'}},
    {'email': 'user2@example.com', 'context': {'user_name': 'User 2'}},
]
successful, failed = EmailService.send_bulk_email(
    subject='Reminder',
    template_name='emails/incomplete_reminder.html',
    recipients=recipients
)
print(f"Sent: {successful}, Failed: {failed}")
```

## Automatic Signal Triggers

The system automatically sends emails based on model changes:

### Registration Signal
**Triggered**: When a new User is created
**Template**: `registration_welcome.html`

### Application Submission Signal
**Triggered**: When `ScholarshipApplication.is_draft` changes to False
**Template**: `application_submitted.html`

### Status Update Signal
**Triggered**: When a new `ApplicationStatusHistory` record is created
**Template**: `status_update.html`

### Document Upload Signal
**Triggered**: When a new `UploadedDocument` is created
**Template**: `document_uploaded.html`

## Email Templates

All templates are located in `backend/templates/emails/`:

### 1. `registration_welcome.html`
- Welcome message
- Login link
- Next steps guide

### 2. `application_submitted.html`
- Submission confirmation
- Reference number
- Status information
- Timeline expectations

### 3. `status_update.html`
- Old and new status
- Status change details
- Conditional messages per status
- Application link

### 4. `document_uploaded.html`
- Document type confirmation
- Upload timestamp
- Next steps

### 5. `missing_documents.html`
- List of missing documents
- Upload instructions
- Importance of timely submission

### 6. `incomplete_reminder.html`
- Incomplete application notice
- Completion checklist
- Deadline reminder

## Email Logging

All email sending attempts are logged in the `EmailLog` model for monitoring and debugging.

### View Email Logs

```python
from core.models import EmailLog

# Get all failed emails
failed_emails = EmailLog.objects.filter(status='failed')

# Get emails for a specific user
user_emails = EmailLog.objects.filter(user=user)

# Get specific email type
registration_emails = EmailLog.objects.filter(email_type='registration')

# Statistics
from django.db.models import Count
stats = EmailLog.objects.values('status').annotate(count=Count('id'))
```

### Email Log Model Fields

- `recipient_email`: Email address
- `subject`: Email subject
- `email_type`: Type of email (registration, application_submitted, etc.)
- `status`: PENDING, SENT, FAILED
- `error_message`: Error details if failed
- `user`: Associated user
- `application`: Associated application
- `created_at`: Creation timestamp
- `sent_at`: Send timestamp
- `retry_count`: Number of retry attempts

## Frontend Integration

### Success Response
After triggering an email action:

```json
{
  "success": true,
  "message": "Application submitted successfully",
  "data": {
    "application_id": 123,
    "status": "pending"
  }
}
```

### React Component Example

```jsx
import { useState } from 'react';
import { submitApplication } from '@/services/applicationService';

export function ApplicationSubmitButton({ application }) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await submitApplication(application.id);
      setMessage('Application submitted! Check your email for confirmation.');
      // Optionally show a success toast notification
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? 'Submitting...' : 'Submit Application'}
      </button>
      {message && <p className="message">{message}</p>}
    </div>
  );
}
```

## Testing

### Local Development (Console Backend)

In development, emails are printed to console instead of being sent:

```env
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

Check Django server console for email output.

### Manual Testing

```python
from django.core.management import call_command

# Test registration email
from accounts.models import User
user = User.objects.create_user(email='test@example.com', password='testpass')
# Email signal will trigger automatically

# Test application submission
from applications.models import ScholarshipApplication
app = ScholarshipApplication.objects.create(
    applicant=user,
    title='Test App'
)
app.submit()  # Triggers email signal

# Test status update
from applications.models import ApplicationStatusHistory
history = ApplicationStatusHistory.objects.create(
    application=app,
    old_status='pending',
    new_status='under_review',
    notes='Under review by coordinator'
)
# Email signal will trigger automatically
```

### Run Tests

```bash
# Create test file: backend/core/tests/test_email_service.py
python manage.py test core.tests.test_email_service
```

### Test Email Service

```python
# backend/core/tests/test_email_service.py
from django.test import TestCase
from django.core import mail
from django.conf import settings
from accounts.models import User
from core.email_service import EmailService

class EmailServiceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass'
        )

    def test_send_registration_email(self):
        with self.settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend'):
            result = EmailService.send_registration_email(self.user)
            self.assertTrue(result)
            self.assertEqual(len(mail.outbox), 1)
            self.assertIn('Welcome', mail.outbox[0].subject)
```

## Production Deployment

### Best Practices

1. **Use Environment Variables**
   - Never hardcode credentials
   - Store in deployment platform (Render, Heroku, AWS)

2. **Gmail Limitations**
   - Limit: 500 emails/day for regular accounts
   - Use SendGrid, Mailgun for higher volume

3. **Email Rate Limiting**
   - Consider throttling for bulk operations
   - Implement retry with exponential backoff

4. **Monitoring**
   - Review `EmailLog` regularly
   - Set up alerts for high failure rates
   - Monitor email delivery rates

5. **Alternative Providers**
   For production with high volume:
   - SendGrid
   - AWS SES
   - Mailgun
   - Postmark

### Switch to SendGrid

```python
# Update settings.py
EMAIL_BACKEND = 'sgbackend.SendgridBackend'
SENDGRID_API_KEY = os.getenv('SENDGRID_API_KEY')

# Install
pip install sendgrid-django
```

## Troubleshooting

### Emails Not Sending

1. **Check Email Backend**
   ```python
   from django.conf import settings
   print(settings.EMAIL_BACKEND)
   ```

2. **Verify Gmail Credentials**
   - Ensure App Password (not regular password)
   - Check 2FA is enabled
   - Verify email address in .env

3. **Check Logs**
   ```python
   from core.models import EmailLog
   failed = EmailLog.objects.filter(status='failed')
   for log in failed:
       print(f"{log.recipient_email}: {log.error_message}")
   ```

4. **Test Connection**
   ```python
   import smtplib
   try:
       server = smtplib.SMTP('smtp.gmail.com', 587)
       server.starttls()
       server.login('your-email@gmail.com', 'app-password')
       print("Connection successful!")
   except Exception as e:
       print(f"Connection failed: {e}")
   ```

### Common Issues

| Issue | Solution |
|-------|----------|
| "Authentication failed" | Use App Password, not regular password |
| "TLS connection not available" | Ensure EMAIL_USE_TLS=True |
| "Invalid recipient address" | Validate email format in context |
| "Template not found" | Check template path in DIRS setting |
| "Signal not triggering" | Verify signals.py is imported in apps.py ready() |

## Security Considerations

1. **Credentials Management**
   - Use environment variables only
   - Never commit .env files
   - Rotate credentials regularly

2. **Email Validation**
   - All emails validated before sending
   - Prevents header injection attacks
   - Sanitizes context variables

3. **Data Privacy**
   - Don't include sensitive data in subject
   - Keep recipient list private
   - Implement data retention policy

4. **Rate Limiting**
   - Consider implementing email throttling
   - Monitor for spam/abuse patterns
   - Log all email attempts

## Performance Tips

1. **Use Celery for Async Emails**
   ```python
   from celery import shared_task
   
   @shared_task
   def send_email_task(email_type, **kwargs):
       # Send email asynchronously
       pass
   ```

2. **Batch Operations**
   - Use `send_bulk_email()` for multiple recipients
   - Reduces individual transaction overhead

3. **Template Caching**
   - Django automatically caches templates
   - No additional configuration needed

4. **Connection Pooling**
   - Consider email backend with connection pooling
   - Reduces SMTP connection overhead

## Additional Resources

- [Django Email Documentation](https://docs.djangoproject.com/en/6.0/topics/email/)
- [Gmail App Password Guide](https://support.google.com/accounts/answer/185833)
- [Email Best Practices](https://www.emailonacid.com/blog/article/email-standards/)
- [Responsive Email Templates](https://mjml.io/)
