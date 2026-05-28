from django.contrib.auth import get_user_model
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from applications.models import ScholarshipApplication
from core.responses import success_response

User = get_user_model()


class VerifyApplicantAPIView(APIView):
	permission_classes = [AllowAny]

	def get(self, request, applicant_id):
		if not request.user or not request.user.is_authenticated:
			return Response({"message": "Restricted Data"})

		target_user = User.objects.filter(id=applicant_id).first()
		if not target_user:
			return success_response("Verification complete", {"exists": False, "verified": False})

		is_self = request.user.id == target_user.id
		if request.user.role != "coordinator" and not is_self:
			return Response({"message": "Restricted Data"})

		latest_application = (
			ScholarshipApplication.objects.filter(applicant=target_user)
			.order_by("-updated_at")
			.first()
		)

		data = {
			"exists": True,
			"verified": target_user.role == "student",
			"has_profile": hasattr(target_user, "profile"),
			"application_count": target_user.applications.count(),
			"latest_status": latest_application.status if latest_application else None,
		}
		return success_response("Verification complete", data)
