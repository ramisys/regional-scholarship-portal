from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from . import audit_service
from .models import AuditLog
from django.core.exceptions import PermissionDenied

# Create your tests here.

User = get_user_model()


class AuditServiceTests(TestCase):
	def setUp(self):
		self.factory = RequestFactory()
		self.user = User.objects.create_user(email='test@example.com', password='testpass', role='coordinator')  #nosec B106

	def test_log_event_creates_record(self):
		initial = AuditLog.objects.count()
		request = self.factory.get('/api/core/audit-logs/')
		request.META['REMOTE_ADDR'] = '127.0.0.1'
		request.META['HTTP_USER_AGENT'] = 'unittest'

		audit_service.log_application_event(
			user=self.user,
			request=request,
			action_type='test_action',
			description='Testing audit log creation',
			resource_type='Test',
			resource_id='1',
		)

		self.assertEqual(AuditLog.objects.count(), initial + 1)

	def test_audit_is_immutable(self):
		a = AuditLog.objects.create(action_type='immutable_test', action_category=AuditLog.Category.APPLICATION)
		with self.assertRaises(PermissionDenied):
			a.description = 'modified'
			a.save()
