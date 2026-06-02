from rest_framework.test import APIClient, APITestCase

from accounts.models import User
from applications.models import ScholarshipApplication
from coordinator.models import BulkProcessingLog


class CoordinatorBulkProcessingTests(APITestCase):
    def setUp(self):
        self.coordinator = User.objects.create_user(
            email="coordinator@example.com",
            password="password123",  #nosec B106
            role=User.Role.COORDINATOR,
        )
        self.student = User.objects.create_user(
            email="student@example.com",
            password="password123",  #nosec B106
            role=User.Role.STUDENT,
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.coordinator)

        self.app_one = ScholarshipApplication.objects.create(
            applicant=self.student,
            title="Application One",
            personal_statement="Statement 1",
            status=ScholarshipApplication.Status.PENDING,
            is_draft=False,
        )
        self.app_two = ScholarshipApplication.objects.create(
            applicant=self.student,
            title="Application Two",
            personal_statement="Statement 2",
            status=ScholarshipApplication.Status.PENDING,
            is_draft=False,
        )
        self.app_finalized = ScholarshipApplication.objects.create(
            applicant=self.student,
            title="Application Finalized",
            personal_statement="Statement 3",
            status=ScholarshipApplication.Status.APPROVED,
            is_draft=False,
        )

    def test_bulk_approve_updates_multiple_applications_and_logs_action(self):
        response = self.client.post(
            "/api/dashboard/applications/bulk-approve/",
            {"application_ids": [self.app_one.id, self.app_two.id]},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        data = response.data
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["processed_count"], 2)
        self.assertEqual(data["data"]["failed_count"], 0)

        self.app_one.refresh_from_db()
        self.app_two.refresh_from_db()
        self.assertEqual(self.app_one.status, ScholarshipApplication.Status.APPROVED)
        self.assertEqual(self.app_two.status, ScholarshipApplication.Status.APPROVED)

        log = BulkProcessingLog.objects.filter(action_type="bulk_approve").first()
        self.assertIsNotNone(log)
        self.assertEqual(log.application_count, 2)
        self.assertCountEqual(log.affected_application_ids, [self.app_one.id, self.app_two.id])

    def test_bulk_status_update_skips_finalized_applications(self):
        response = self.client.patch(
            "/api/dashboard/applications/bulk-status-update/",
            {"application_ids": [self.app_one.id, self.app_finalized.id], "status": ScholarshipApplication.Status.REJECTED},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        data = response.data
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["processed_count"], 1)
        self.assertEqual(data["data"]["failed_count"], 1)
        self.assertEqual(data["data"]["skipped"][0]["id"], self.app_finalized.id)

        self.app_one.refresh_from_db()
        self.app_finalized.refresh_from_db()
        self.assertEqual(self.app_one.status, ScholarshipApplication.Status.REJECTED)
        self.assertEqual(self.app_finalized.status, ScholarshipApplication.Status.APPROVED)

    def test_bulk_endpoints_forbid_non_coordinator_users(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(
            "/api/dashboard/applications/bulk-approve/",
            {"application_ids": [self.app_one.id]},
            format="json",
        )

        self.assertEqual(response.status_code, 403)

    def test_bulk_reject_with_invalid_id_returns_error_and_no_updates(self):
        response = self.client.post(
            "/api/dashboard/applications/bulk-reject/",
            {"application_ids": [self.app_one.id, 99999]},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.app_one.refresh_from_db()
        self.assertEqual(self.app_one.status, ScholarshipApplication.Status.PENDING)
