from django.contrib import admin
from django.utils.html import format_html
from core.models import EmailLog


@admin.register(EmailLog)
class EmailLogAdmin(admin.ModelAdmin):
    list_display = [
        'email_type_badge',
        'recipient_email',
        'subject_preview',
        'status_badge',
        'created_at',
        'sent_at',
        'retry_count'
    ]
    list_filter = [
        'status',
        'email_type',
        'created_at',
    ]
    search_fields = [
        'recipient_email',
        'subject',
        'user__email'
    ]
    readonly_fields = [
        'recipient_email',
        'subject',
        'email_type',
        'template_name',
        'user',
        'application',
        'status',
        'created_at',
        'sent_at',
        'error_message',
        'retry_count',
        'last_retry_at'
    ]
    fieldsets = (
        ('Email Details', {
            'fields': ('recipient_email', 'subject', 'email_type', 'template_name')
        }),
        ('Related Objects', {
            'fields': ('user', 'application')
        }),
        ('Status', {
            'fields': ('status', 'error_message', 'retry_count', 'last_retry_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'sent_at')
        }),
    )
    ordering = ['-created_at']
    date_hierarchy = 'created_at'

    def email_type_badge(self, obj):
        """Display email type with colored badge"""
        colors = {
            'registration': 'blue',
            'application_submitted': 'green',
            'status_update': 'orange',
            'document_uploaded': 'purple',
            'missing_documents': 'red',
            'incomplete_reminder': 'yellow',
        }
        color = colors.get(obj.email_type, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 3px; font-size: 11px;">{}</span>',
            color,
            obj.get_email_type_display()
        )
    email_type_badge.short_description = 'Email Type'

    def status_badge(self, obj):
        """Display status with colored badge"""
        colors = {
            'sent': 'green',
            'pending': 'orange',
            'failed': 'red',
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 3px; font-size: 11px;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'

    def subject_preview(self, obj):
        """Display subject preview (truncated)"""
        max_length = 60
        if len(obj.subject) > max_length:
            return obj.subject[:max_length] + '...'
        return obj.subject
    subject_preview.short_description = 'Subject'

    def has_add_permission(self, request):
        """Prevent adding email logs through admin"""
        return False

    def has_delete_permission(self, request, obj=None):
        """Allow deletion of email logs"""
        return request.user.is_superuser

