from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from applications.models import ScholarshipApplication
from core.permissions import IsStudent
from core.responses import success_response


class StudentDashboardStatsAPIView(APIView):
	permission_classes = [IsAuthenticated, IsStudent]

	def get(self, request):
		queryset = ScholarshipApplication.objects.filter(applicant=request.user)
		data = {
			"total": queryset.count(),
			"pending": queryset.filter(status=ScholarshipApplication.Status.PENDING).count(),
			"approved": queryset.filter(status=ScholarshipApplication.Status.APPROVED).count(),
			"rejected": queryset.filter(status=ScholarshipApplication.Status.REJECTED).count(),
		}
		return success_response("Student dashboard stats fetched", data)


class StudentDashboardRecentActivityAPIView(APIView):
	permission_classes = [IsAuthenticated, IsStudent]

	def get(self, request):
		activities = []
		applications = ScholarshipApplication.objects.filter(applicant=request.user).prefetch_related("status_history")

		for application in applications:
			if application.submission_date:
				activities.append(
					{
						"id": f"submission-{application.id}",
						"title": f"{application.title} submitted",
						"date": application.submission_date.isoformat(),
						"status": application.status,
						"timestamp": application.submission_date,
					}
				)

			for history in application.status_history.all():
				activities.append(
					{
						"id": f"history-{history.id}",
						"title": f"{application.title} updated to {history.new_status.replace('_', ' ')}",
						"date": history.timestamp.isoformat(),
						"status": history.new_status,
						"timestamp": history.timestamp,
					}
				)

		activities.sort(key=lambda item: item["timestamp"], reverse=True)
		payload = [
			{
				"id": activity["id"],
				"title": activity["title"],
				"date": activity["date"],
				"status": activity["status"],
			}
			for activity in activities[:5]
		]
		return success_response("Student recent activity fetched", payload)