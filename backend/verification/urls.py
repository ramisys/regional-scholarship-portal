from django.urls import path

from verification.views import VerifyApplicantAPIView

urlpatterns = [
    path("verify-applicant/<int:applicant_id>", VerifyApplicantAPIView.as_view(), name="verify-applicant"),
]
