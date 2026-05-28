from django.urls import path

from documents.views import DocumentRetrieveAPIView, DocumentUploadAPIView

urlpatterns = [
    path("upload", DocumentUploadAPIView.as_view(), name="documents-upload"),
    path("<int:document_id>", DocumentRetrieveAPIView.as_view(), name="documents-retrieve"),
]
