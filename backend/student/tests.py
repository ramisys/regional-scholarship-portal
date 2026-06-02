from rest_framework.test import APIClient, APITestCase

from accounts.models import User


class StudentDashboardTrailingSlashTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = User.objects.create_user(
            email="student-dashboard@example.com",
            password="password123",  # nosec B106
            role=User.Role.STUDENT,
        )

    def test_student_stats_route_accepts_trailing_slash(self):
        self.client.force_authenticate(user=self.student)

        response = self.client.get("/api/student/stats/")

        self.assertNotEqual(response.status_code, 404)
