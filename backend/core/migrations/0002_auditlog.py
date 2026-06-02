# Generated migration for AuditLog model
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='AuditLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('action_type', models.CharField(max_length=150)),
                ('action_category', models.CharField(choices=[('AUTHENTICATION', 'Authentication'), ('APPLICATION', 'Application'), ('DOCUMENT', 'Document'), ('SECURITY', 'Security'), ('ADMINISTRATION', 'Administration')], max_length=50)),
                ('description', models.TextField(blank=True)),
                ('resource_type', models.CharField(blank=True, max_length=150, null=True)),
                ('resource_id', models.CharField(blank=True, max_length=255, null=True)),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('user_agent', models.TextField(blank=True, null=True)),
                ('request_method', models.CharField(blank=True, max_length=10, null=True)),
                ('endpoint', models.CharField(blank=True, max_length=255, null=True)),
                ('old_value', models.JSONField(blank=True, null=True)),
                ('new_value', models.JSONField(blank=True, null=True)),
                ('timestamp', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('severity_level', models.CharField(choices=[('INFO', 'Info'), ('WARNING', 'Warning'), ('CRITICAL', 'Critical')], default='INFO', max_length=10, db_index=True)),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='audit_logs', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-timestamp'],
                'indexes': [
                    models.Index(fields=['action_category', '-timestamp'], name='core_audit_action_cat_ts_idx'),
                    models.Index(fields=['user', '-timestamp'], name='core_audit_user_ts_idx'),
                    models.Index(fields=['resource_type', 'resource_id'], name='core_audit_resource_idx'),
                    models.Index(fields=['severity_level', '-timestamp'], name='core_audit_severity_ts_idx'),
                ],
            },
        ),
    ]
