from django.urls import include, path

from applications.views import ScholarshipApplicationViewSet
from student.views import StudentDashboardRecentActivityAPIView, StudentDashboardStatsAPIView

urlpatterns = [
    path('applications/draft', ScholarshipApplicationViewSet.as_view({'post': 'save_draft'}), name='student-application-draft'),
    path('applications', include('applications.urls')),
    path('stats', StudentDashboardStatsAPIView.as_view(), name='student-dashboard-stats'),
    path('recent-activity', StudentDashboardRecentActivityAPIView.as_view(), name='student-dashboard-recent-activity'),
]