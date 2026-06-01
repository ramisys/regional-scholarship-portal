# API Integration Guide - Email Notifications

## Overview

The email notification system is integrated with Django signals, which means emails are sent automatically when certain events occur. However, you can also manually send emails through the email service or custom API endpoints.

## Automatic Email Triggers

These emails are sent **automatically** without any API calls:

### 1. Registration Email
**Trigger**: User registration (post_save signal on User model)
**Automatic**: Yes
**Response**: None (triggered asynchronously)

### 2. Application Submitted Email
**Trigger**: Application status changes from draft to pending
**Automatic**: Yes
**Response**: Application submission response

```json
{
  "success": true,
  "message": "Application submitted",
  "data": {
    "id": 1,
    "status": "pending",
    "submission_date": "2024-01-15T10:30:00Z"
  }
}
```

### 3. Status Update Email
**Trigger**: ApplicationStatusHistory record created
**Automatic**: Yes
**Response**: Part of coordinator/admin update response

### 4. Document Upload Email
**Trigger**: Document upload (post_save signal on UploadedDocument)
**Automatic**: Yes
**Response**: Document upload response

## Manual Email Sending (Advanced)

For cases where you need to manually send emails, use the email service:

### Python (Backend)

```python
from core.email_service import EmailService
from accounts.models import User

# Get user
user = User.objects.get(email='user@example.com')

# Send registration email manually
EmailService.send_registration_email(user)

# Send application submitted email
from applications.models import ScholarshipApplication
app = ScholarshipApplication.objects.get(id=1)
EmailService.send_application_submitted_email(app)

# Send status update email
EmailService.send_status_update_email(
    application=app,
    old_status='pending',
    new_status='under_review',
    message='Your application is being reviewed'
)

# Send missing documents reminder
EmailService.send_missing_documents_email(
    application=app,
    missing_documents=['Transcript', 'ID Card']
)

# Send incomplete reminder
EmailService.send_incomplete_application_reminder(app)
```

### Django Management Command

```bash
# Test email sending
python manage.py test_emails --user-email=test@example.com --email-type=all

# Send specific email type
python manage.py test_emails --user-email=user@example.com --email-type=registration
```

## Custom API Endpoints (Optional)

If you want to expose manual email sending through API endpoints, create these views:

### Example: Custom Email Endpoint

```python
# applications/views.py

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from core.email_service import EmailService
from core.responses import success_response, error_response

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_reminder_email(request, application_id):
    """
    Manually send reminder email for an application.
    Only coordinators can use this endpoint.
    """
    from core.permissions import IsCoordinator
    
    if not IsCoordinator().has_permission(request, None):
        return error_response(
            "Permission denied",
            {"detail": "Only coordinators can send reminder emails"},
            status.HTTP_403_FORBIDDEN
        )
    
    try:
        app = ScholarshipApplication.objects.get(id=application_id)
        
        # Determine which reminder to send
        email_type = request.data.get('type', 'incomplete')
        
        if email_type == 'incomplete':
            success = EmailService.send_incomplete_application_reminder(app)
        elif email_type == 'missing_docs':
            missing_docs = request.data.get('documents', [])
            success = EmailService.send_missing_documents_email(app, missing_docs)
        else:
            return error_response(
                "Invalid email type",
                {"type": "Unknown email type"},
                status.HTTP_400_BAD_REQUEST
            )
        
        if success:
            return success_response(
                "Reminder email sent successfully",
                {"application_id": application_id, "email_type": email_type}
            )
        else:
            return error_response(
                "Failed to send email",
                {"detail": "Email sending failed"},
                status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    except ScholarshipApplication.DoesNotExist:
        return error_response(
            "Application not found",
            {"id": "Application with this ID does not exist"},
            status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return error_response(
            "Error sending email",
            {"detail": str(e)},
            status.HTTP_500_INTERNAL_SERVER_ERROR
        )
```

### URL Configuration

```python
# applications/urls.py

from django.urls import path
from applications import views

urlpatterns = [
    # ... existing URLs ...
    path('applications/<int:application_id>/send-reminder/', 
         views.send_reminder_email, 
         name='send-reminder-email'),
]
```

## Frontend Integration

### React Hook for Email Actions

```jsx
// src/hooks/useEmailNotification.js

import { useCallback, useState } from 'react';
import { api } from '@/utils/api';

export function useEmailNotification() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const sendReminderEmail = useCallback(async (applicationId, emailType = 'incomplete') => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.post(
        `/applications/${applicationId}/send-reminder/`,
        { type: emailType }
      );

      setSuccess(response.data.message);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to send email';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMissingDocumentsEmail = useCallback(async (applicationId, documents) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.post(
        `/applications/${applicationId}/send-reminder/`,
        { type: 'missing_docs', documents }
      );

      setSuccess(response.data.message);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to send email';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    sendReminderEmail,
    sendMissingDocumentsEmail,
    isLoading,
    error,
    success,
  };
}
```

### React Component Usage

```jsx
// src/components/ApplicationActions.jsx

import { useState } from 'react';
import { useEmailNotification } from '@/hooks/useEmailNotification';

export function ApplicationActions({ application }) {
  const { sendReminderEmail, isLoading, error, success } = useEmailNotification();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSendReminder = async () => {
    try {
      await sendReminderEmail(application.id, 'incomplete');
      // Show success toast
      setShowConfirm(false);
    } catch (err) {
      // Error is handled in hook
    }
  };

  return (
    <div className="application-actions">
      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}
      
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <button
        onClick={() => setShowConfirm(true)}
        disabled={isLoading}
      >
        {isLoading ? 'Sending...' : 'Send Reminder'}
      </button>

      {showConfirm && (
        <ConfirmDialog
          title="Send Reminder Email?"
          message="This will send a reminder email to the applicant."
          onConfirm={handleSendReminder}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}
```

## Monitoring Email Status

### Check Email Logs

```python
from core.models import EmailLog

# Get all failed emails
failed = EmailLog.objects.filter(status='failed')

# Get emails for specific user
user_emails = EmailLog.objects.filter(recipient_email='user@example.com')

# Get statistics
from django.db.models import Count, Q

stats = EmailLog.objects.aggregate(
    total=Count('id'),
    sent=Count('id', filter=Q(status='sent')),
    failed=Count('id', filter=Q(status='failed')),
    pending=Count('id', filter=Q(status='pending'))
)

print(f"Total: {stats['total']}, Sent: {stats['sent']}, Failed: {stats['failed']}")
```

### Email Log Admin Interface

1. Go to Django Admin: `/admin/`
2. Navigate to "Core" > "Email logs"
3. Filter by:
   - Status (Sent, Failed, Pending)
   - Email Type (Registration, Application Submitted, etc.)
   - Date Range
4. Search by recipient email or subject

## Error Handling

### Common Error Responses

```json
// Invalid email
{
  "success": false,
  "message": "Invalid email address",
  "errors": {
    "email": "Invalid email format"
  }
}

// Template not found
{
  "success": false,
  "message": "Email template not found",
  "errors": {
    "template": "emails/unknown.html not found"
  }
}

// SMTP connection error
{
  "success": false,
  "message": "Failed to send email",
  "errors": {
    "detail": "SMTP connection failed"
  }
}

// User not found
{
  "success": false,
  "message": "User not found",
  "errors": {
    "user_id": "User with this ID does not exist"
  }
}
```

## Best Practices

1. **Always use EmailService functions** - Don't construct emails manually
2. **Check email logs** - Monitor for failed emails
3. **Use environment variables** - Never hardcode email addresses
4. **Rate limit** - Consider implementing rate limiting for email endpoints
5. **Test in development** - Use console backend during development
6. **Monitor production** - Set up alerts for email failures
7. **Handle errors gracefully** - Provide clear error messages to users

## Debugging

### Enable Debug Logging

```python
# settings.py

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'DEBUG',
            'class': 'logging.FileHandler',
            'filename': 'email_debug.log',
        },
    },
    'loggers': {
        'core.email_service': {
            'handlers': ['file'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}
```

### Test Email Sending

```bash
# Send test email
python manage.py shell

from core.email_service import EmailService
from accounts.models import User

user = User.objects.first()
result = EmailService.send_registration_email(user)
print(f"Email sent: {result}")
```

## Celery Integration (Optional)

For async email sending with Celery:

```python
# core/tasks.py

from celery import shared_task
from core.email_service import EmailService
from accounts.models import User

@shared_task
def send_registration_email_async(user_id):
    try:
        user = User.objects.get(id=user_id)
        EmailService.send_registration_email(user)
    except User.DoesNotExist:
        pass

# In signals
@receiver(post_save, sender=User)
def send_welcome_email_on_registration(sender, instance, created, **kwargs):
    if created and instance.is_active:
        send_registration_email_async.delay(instance.id)
```

See [EMAIL_NOTIFICATION_SETUP.md](./EMAIL_NOTIFICATION_SETUP.md) for more details.
