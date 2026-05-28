from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from core.responses import error_response, success_response
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
