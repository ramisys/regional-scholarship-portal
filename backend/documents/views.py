from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.conf import settings

from core.responses import error_response, success_response
from applications.models import ScholarshipApplication
from documents.models import UploadedDocument
from documents.serializers import UploadedDocumentSerializer


class DocumentUploadAPIView(APIView):
	permission_classes = [IsAuthenticated]
	throttle_scope = "upload"

	def post(self, request):
		serializer = UploadedDocumentSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)

		application = serializer.validated_data["application"]
		if request.user.role != "coordinator" and application.applicant != request.user:
			return error_response("Forbidden", {"detail": "You do not have access"}, status.HTTP_403_FORBIDDEN)

		if application.is_draft or application.status == ScholarshipApplication.Status.DRAFT:
			return error_response(
				"Submission required",
				{"detail": "You can upload documents only after submitting the application."},
				status.HTTP_400_BAD_REQUEST,
			)

		# Enforce per-application document quota
		max_per_app = getattr(settings, "MAX_DOCUMENTS_PER_APPLICATION", 10)
		existing_count = UploadedDocument.objects.filter(application=application).count()
		if existing_count >= max_per_app:
			return error_response(
				"Upload limit reached",
				{"detail": f"Maximum of {max_per_app} documents allowed for this application"},
				status.HTTP_400_BAD_REQUEST,
			)

		# TODO: integrate virus scan here (e.g., ClamAV) before saving

		serializer.save()
		return success_response("Document uploaded", serializer.data, status.HTTP_201_CREATED)


class DocumentRetrieveAPIView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request, document_id):
		document = UploadedDocument.objects.select_related("application", "application__applicant").filter(id=document_id).first()
		if not document:
			return error_response("Not found", {"document": ["Document does not exist"]}, status.HTTP_404_NOT_FOUND)

		if request.user.role != "coordinator" and document.application.applicant != request.user:
			return error_response("Forbidden", {"detail": "You do not have access"}, status.HTTP_403_FORBIDDEN)

		return success_response("Document fetched", UploadedDocumentSerializer(document).data)
