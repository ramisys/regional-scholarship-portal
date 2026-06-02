from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import ApplicantProfile

User = get_user_model()


class ProfileUpdateTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email="student@example.com", password="StrongPassword123!")
        self.profile = ApplicantProfile.objects.create(user=self.user, full_name="")

    def test_profile_update_accepts_first_and_last_name(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.put(
            "/api/auth/profile/",
            {"first_name": "John", "last_name": "Doe"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.full_name, "John Doe")
