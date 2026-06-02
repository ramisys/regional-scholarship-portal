from django.urls import path

from coordinator.views import (
	CoordinatorApplicationBulkApproveAPIView,
	CoordinatorApplicationBulkRejectAPIView,
	CoordinatorApplicationBulkStatusUpdateAPIView,
	CoordinatorApplicationListAPIView,
	CoordinatorApplicationStatusUpdateAPIView,
	CoordinatorStatsAPIView,
	CoordinatorRecentApplicationsAPIView,
	CoordinatorNotifyMissingDocumentsAPIView,
)

urlpatterns = [
	path("applications", CoordinatorApplicationListAPIView.as_view(), name="dashboard-applications"),
	path("applications/bulk-approve", CoordinatorApplicationBulkApproveAPIView.as_view(), name="dashboard-applications-bulk-approve"),
	path("applications/bulk-reject", CoordinatorApplicationBulkRejectAPIView.as_view(), name="dashboard-applications-bulk-reject"),
	path("applications/bulk-status-update", CoordinatorApplicationBulkStatusUpdateAPIView.as_view(), name="dashboard-applications-bulk-status-update"),
	path("applications/<int:application_id>/status", CoordinatorApplicationStatusUpdateAPIView.as_view(), name="dashboard-application-status"),
	path("applications/<int:application_id>/notify-missing-documents", CoordinatorNotifyMissingDocumentsAPIView.as_view(), name="dashboard-notify-missing-documents"),
	path("applications/<int:application_id>/notify-missing-documents/", CoordinatorNotifyMissingDocumentsAPIView.as_view(), name="dashboard-notify-missing-documents-slash"),
	path("stats", CoordinatorStatsAPIView.as_view(), name="dashboard-stats"),
	path("recent-applications", CoordinatorRecentApplicationsAPIView.as_view(), name="dashboard-recent-applications"),
]
