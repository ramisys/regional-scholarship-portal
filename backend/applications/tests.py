from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from applications.models import ScholarshipApplication


User = get_user_model()


class ScholarshipApplicationDraftTests(APITestCase):
	def setUp(self):
		self.user = User.objects.create_user(
			email="student@example.com",
			password="password123",  #nosec B106
			role=User.Role.STUDENT,
		)
		self.client.force_authenticate(user=self.user)

	def test_submit_application_creates_pending_record_from_form_payload(self):
		payload = {
			"personalInfo": {
				"firstName": "Amina",
				"middleName": "",
				"lastName": "Khan",
			},
			"contactInfo": {
				"email": "amina@example.com",
				"phone": "123456789",
				"address": "123 Street",
				"city": "Accra",
				"region": "Greater Accra",
				"postalCode": "GA-001",
			},
			"educationalBackground": [
				{
					"schoolName": "City High",
					"degree": "High School",
					"fieldOfStudy": "Science",
					"startDate": "2018-09-01",
					"endDate": "2021-06-30",
				},
			],
		}

		response = self.client.post("/api/student/applications/", payload, format="json")

		self.assertEqual(response.status_code, 201)
		self.assertTrue(response.data["success"])

		application = ScholarshipApplication.objects.get(applicant=self.user, is_draft=False)
		self.assertEqual(application.status, ScholarshipApplication.Status.PENDING)
		self.assertEqual(application.title, "Amina Khan Scholarship Application")
		self.assertEqual(application.educational_backgrounds.count(), 1)

	def test_submit_application_without_trailing_slash_persists_record(self):
		payload = {
			"personalInfo": {"firstName": "John", "lastName": "Doe"},
			"contactInfo": {
				"email": "john@example.com",
				"phone": "555",
				"address": "1 Main",
				"city": "Kumasi",
				"region": "Ashanti",
				"postalCode": "AK-001",
			},
			"educationalBackground": [
				{
					"schoolName": "Central School",
					"degree": "Secondary",
					"fieldOfStudy": "General",
					"startDate": "2019-09-01",
					"endDate": "2022-06-30",
				}
			],
		}

		response = self.client.post("/api/student/applications", payload, format="json")

		self.assertEqual(response.status_code, 201)
		self.assertTrue(ScholarshipApplication.objects.filter(applicant=self.user, is_draft=False).exists())

	def test_save_draft_creates_application_from_frontend_payload(self):
		payload = {
			"personalInfo": {
				"firstName": "Amina",
				"middleName": "",
				"lastName": "Khan",
				"dateOfBirth": "2004-02-01",
				"gender": "Female",
			},
			"contactInfo": {
				"email": "amina@example.com",
				"phone": "123456789",
				"address": "123 Street",
				"city": "Accra",
				"region": "Greater Accra",
				"postalCode": "GA-001",
			},
			"educationalBackground": [
				{
					"schoolName": "City High",
					"degree": "High School",
					"fieldOfStudy": "Science",
					"startDate": "2018-09-01",
					"endDate": "2021-06-30",
					"gpa": "3.8",
				}
			],
		}

		response = self.client.post("/api/student/applications/draft/", payload, format="json")

		self.assertEqual(response.status_code, 200)
		self.assertTrue(response.data["success"])

		application = ScholarshipApplication.objects.get(applicant=self.user, is_draft=True)
		self.assertEqual(application.status, ScholarshipApplication.Status.DRAFT)
		self.assertEqual(application.title, "Amina Khan Scholarship Application")
		self.assertEqual(application.educational_backgrounds.count(), 1)
		background = application.educational_backgrounds.first()
		self.assertEqual(background.school_name, "City High")
		self.assertEqual(background.level, "High School")
		self.assertEqual(background.year_started, 2018)
		self.assertEqual(background.year_ended, 2021)
