from django.urls import path

from education.views import EducationalBackgroundAPIView

urlpatterns = [
    path("", EducationalBackgroundAPIView.as_view(), name="education-create"),
    path("<int:education_id>", EducationalBackgroundAPIView.as_view(), name="education-update-delete"),
]
