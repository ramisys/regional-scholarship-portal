from django.urls import path

from coordinator.views import (
	CoordinatorApplicationListAPIView,
	CoordinatorApplicationStatusUpdateAPIView,
	CoordinatorStatsAPIView,
	CoordinatorRecentApplicationsAPIView,
	CoordinatorNotifyMissingDocumentsAPIView,
)

urlpatterns = [
	path("applications", CoordinatorApplicationListAPIView.as_view(), name="dashboard-applications"),
	path("applications/<int:application_id>/status", CoordinatorApplicationStatusUpdateAPIView.as_view(), name="dashboard-application-status"),
	path("applications/<int:application_id>/notify-missing-documents", CoordinatorNotifyMissingDocumentsAPIView.as_view(), name="dashboard-notify-missing-documents"),
	path("stats", CoordinatorStatsAPIView.as_view(), name="dashboard-stats"),
	path("recent-applications", CoordinatorRecentApplicationsAPIView.as_view(), name="dashboard-recent-applications"),
]
