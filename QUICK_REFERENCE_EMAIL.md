# Email Notification System - Quick Reference Guide

## Setup (5 Minutes)

### 1. Update .env
```env
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-16-char-app-password
```

### 2. Run Migrations
```bash
python manage.py migrate
```

### 3. Test
```bash
python manage.py test_emails --user-email=test@example.com
```

## Sending Emails

### Automatically (No Code Needed)
- ✅ User registration → Welcome email
- ✅ Application submit → Confirmation email
- ✅ Status change → Update notification
- ✅ Document upload → Confirmation email

### Manually in Python
```python
from core.email_service import EmailService

# Registration email
EmailService.send_registration_email(user)

# Application submission
EmailService.send_application_submitted_email(application)

# Status update
EmailService.send_status_update_email(application, 'pending', 'approved')

# Document upload
EmailService.send_document_uploaded_email(application, document)

# Missing documents
EmailService.send_missing_documents_email(application, ['ID Card'])

# Incomplete reminder
EmailService.send_incomplete_application_reminder(application)

# Bulk emails
EmailService.send_bulk_email(
    subject='Subject',
    template_name='emails/template.html',
    recipients=[
        {'email': 'user@example.com', 'context': {'name': 'User'}},
    ]
)
```

## Monitoring

### Admin Interface
```
Django Admin → Core → Email logs
- Filter by status, type, date
- Search by email or subject
- View error messages
```

### Python Shell
```python
from core.models import EmailLog

# All emails
EmailLog.objects.all()

# Failed emails
EmailLog.objects.filter(status='failed')

# By type
EmailLog.objects.filter(email_type='registration')

# By user
EmailLog.objects.filter(recipient_email='user@example.com')

# Statistics
from django.db.models import Count, Q
EmailLog.objects.aggregate(
    total=Count('id'),
    sent=Count('id', filter=Q(status='sent')),
    failed=Count('id', filter=Q(status='failed'))
)
```

## Environment Variables

```env
# Required
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=app-password

# Optional
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=no-reply@portal.local
FRONTEND_URL=http://localhost:5173
SUPPORT_PHONE=+1 (555) 123-4567
```

## Email Template Variables

All templates have access to:
```python
{
    'user_name': 'Full Name',
    'application_id': 123,
    'application_title': 'App Title',
    'status': 'Pending',
    'portal_url': 'http://localhost:5173',
    'application_url': 'http://localhost:5173/applications/123',
    'support_email': 'support@example.com',
    'support_phone': '+1 555-123-4567',
    'app_name': 'Regional Scholarship Portal',
}
```

## Common Tasks

### Send Email to User
```python
from core.email_service import EmailService
from accounts.models import User

user = User.objects.get(email='user@example.com')
EmailService.send_registration_email(user)
```

### Check Failed Emails
```python
from core.models import EmailLog

failed = EmailLog.objects.filter(status='failed')
for log in failed:
    print(f"{log.recipient_email}: {log.error_message}")
```

### Retry Failed Email
```python
from core.email_service import EmailService

# Manually resend
log = EmailLog.objects.get(id=1)
# Determine email type and resend
```

### Monitor Email Logs
```bash
# Watch for recent emails
python manage.py shell
from core.models import EmailLog
from django.utils import timezone
from datetime import timedelta

# Last hour
recent = EmailLog.objects.filter(
    created_at__gte=timezone.now() - timedelta(hours=1)
)
print(f"Emails sent: {recent.count()}")
```

### Create Custom Email Template
1. Create HTML file in `backend/templates/emails/my-email.html`
2. Add function to `core/email_service.py`
3. Add signal if automatic trigger needed
4. Update EmailLog model choices if new type

## Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| Emails not sending | Check .env EMAIL_HOST_USER/PASSWORD |
| "Auth failed" | Use App Password, not regular password |
| Template not found | Check path: `emails/filename.html` |
| No emails in logs | Run migrations: `python manage.py migrate` |
| Signal not triggering | Check apps.py ready() method has signal import |
| SMTP error | Verify 2FA enabled on Gmail account |

## Key Files

| File | Purpose |
|------|---------|
| `core/email_service.py` | Email functions |
| `core/models.py` | EmailLog model |
| `*/signals.py` | Auto-triggers |
| `templates/emails/*.html` | Email templates |
| `core/admin.py` | Admin interface |
| `.env.example` | Config template |

## Testing

```bash
# Test all email types
python manage.py test_emails --user-email=test@example.com --email-type=all

# Test specific type
python manage.py test_emails --user-email=test@example.com --email-type=registration

# See help
python manage.py help test_emails
```

## Development Tips

### Use Console Backend
```env
# In development only
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

Emails will print to console, not send via SMTP.

### Check Email Logs
```python
from core.models import EmailLog
EmailLog.objects.latest('created_at')
```

### Debug Template Rendering
```python
from django.template.loader import render_to_string

html = render_to_string('emails/welcome.html', {
    'user_name': 'Test User'
})
print(html)
```

### Check Settings
```python
from django.conf import settings
print(settings.EMAIL_HOST)
print(settings.EMAIL_PORT)
```

## Documentation Files

- **EMAIL_NOTIFICATION_SETUP.md** - Complete setup guide (read first)
- **API_INTEGRATION_GUIDE.md** - How to integrate with frontend
- **MIGRATION_INSTRUCTIONS.md** - Database setup
- **EMAIL_SYSTEM_SUMMARY.md** - What was implemented
- **IMPLEMENTATION_CHECKLIST_EMAIL.md** - Full checklist

## Support

### Gmail App Password Setup
1. Go to https://myaccount.google.com/
2. Security → Enable 2-Step Verification
3. App Passwords → Mail/Windows Computer
4. Copy 16-char password to .env

### Email Not Working?
1. Check .env has correct credentials
2. Verify EMAIL_BACKEND is correct
3. Run test_emails command
4. Check EmailLog for errors
5. Review Django logs for stack trace

### Questions?
- Check EMAIL_NOTIFICATION_SETUP.md (900 lines)
- Check API_INTEGRATION_GUIDE.md (400 lines)
- Review code comments in email_service.py
- Check inline docstrings in functions

## Quick Commands

```bash
# Test email system
python manage.py test_emails --user-email=test@example.com

# Check migrations
python manage.py showmigrations core

# Django admin
python manage.py runserver
# Then go to http://localhost:8000/admin/

# See email logs
python manage.py shell
# from core.models import EmailLog; EmailLog.objects.all()

# Create superuser
python manage.py createsuperuser

# Run all Django checks
python manage.py check
```

## Email Types Quick Reference

| Type | Trigger | Template | Manual |
|------|---------|----------|--------|
| Registration | User signup | ✅ | ✅ |
| App Submitted | App submit | ✅ | ✅ |
| Status Update | Status change | ✅ | ✅ |
| Document Upload | Doc upload | ✅ | ✅ |
| Missing Docs | Manual | ✅ | ✅ |
| Incomplete | Manual | ✅ | ✅ |

## Production Checklist

- [ ] .env configured with production values
- [ ] DATABASE_URL set for production DB
- [ ] DJANGO_DEBUG=False
- [ ] ALLOWED_HOSTS configured
- [ ] Migrations run on production DB
- [ ] SMTP credentials verified
- [ ] Email log reviewed
- [ ] All email types tested
- [ ] Error handling verified
- [ ] Monitoring configured

---

**Version**: 1.0
**Last Updated**: January 2024
**Quick Reference**: Yes
