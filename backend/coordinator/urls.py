from django.urls import path

from coordinator.views import CoordinatorApplicationListAPIView, CoordinatorApplicationStatusUpdateAPIView, CoordinatorStatsAPIView, CoordinatorRecentApplicationsAPIView

urlpatterns = [
    path("applications", CoordinatorApplicationListAPIView.as_view(), name="dashboard-applications"),
    path("applications/<int:application_id>/status", CoordinatorApplicationStatusUpdateAPIView.as_view(), name="dashboard-application-status"),
    path("stats", CoordinatorStatsAPIView.as_view(), name="dashboard-stats"),
    path("recent-applications", CoordinatorRecentApplicationsAPIView.as_view(), name="dashboard-recent-applications"),
]
