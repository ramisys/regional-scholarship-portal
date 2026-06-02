from django.urls import include, path
from rest_framework.routers import SimpleRouter

from applications.views import ScholarshipApplicationViewSet

router = SimpleRouter(trailing_slash=True)
router.register("", ScholarshipApplicationViewSet, basename="applications")

urlpatterns = [
    path("", include(router.urls)),
]
