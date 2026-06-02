from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='BulkProcessingLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('action_type', models.CharField(choices=[('bulk_approve', 'Bulk Approve'), ('bulk_reject', 'Bulk Reject'), ('bulk_status_update', 'Bulk Status Update'), ('bulk_assign_review', 'Bulk Assign Review')], max_length=50)),
                ('application_count', models.PositiveIntegerField()),
                ('affected_application_ids', models.JSONField(default=list)),
                ('notes', models.TextField(blank=True)),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('coordinator', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='bulk_actions', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
