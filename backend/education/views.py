from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from core.responses import error_response, success_response
from education.models import EducationalBackground
from education.serializers import EducationalBackgroundSerializer


class EducationalBackgroundAPIView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request):
		serializer = EducationalBackgroundSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		application = serializer.validated_data["application"]

		if request.user.role != "coordinator" and application.applicant != request.user:
			return error_response("Forbidden", {"detail": "You do not have access"}, status.HTTP_403_FORBIDDEN)

		serializer.save()
		return success_response("Educational record created", serializer.data, status.HTTP_201_CREATED)

	def put(self, request, education_id):
		instance = EducationalBackground.objects.filter(id=education_id).first()
		if not instance:
			return error_response("Not found", {"education": ["Record does not exist"]}, status.HTTP_404_NOT_FOUND)

		if request.user.role != "coordinator" and instance.application.applicant != request.user:
			return error_response("Forbidden", {"detail": "You do not have access"}, status.HTTP_403_FORBIDDEN)

		serializer = EducationalBackgroundSerializer(instance, data=request.data, partial=False)
		serializer.is_valid(raise_exception=True)
		new_application = serializer.validated_data.get("application", instance.application)
		if request.user.role != "coordinator" and new_application.applicant != request.user:
			return error_response("Forbidden", {"detail": "Invalid application"}, status.HTTP_403_FORBIDDEN)

		serializer.save()
		return success_response("Educational record updated", serializer.data)

	def delete(self, request, education_id):
		instance = EducationalBackground.objects.filter(id=education_id).first()
		if not instance:
			return error_response("Not found", {"education": ["Record does not exist"]}, status.HTTP_404_NOT_FOUND)

		if request.user.role != "coordinator" and instance.application.applicant != request.user:
			return error_response("Forbidden", {"detail": "You do not have access"}, status.HTTP_403_FORBIDDEN)

		instance.delete()
		return success_response("Educational record deleted")
