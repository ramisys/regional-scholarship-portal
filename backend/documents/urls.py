from django.urls import path

from documents.views import DocumentListAPIView, DocumentRetrieveAPIView, DocumentUploadAPIView

urlpatterns = [
    path("upload", DocumentUploadAPIView.as_view(), name="documents-upload"),
    path("application/<int:application_id>", DocumentListAPIView.as_view(), name="documents-list"),
    path("<int:document_id>", DocumentRetrieveAPIView.as_view(), name="documents-retrieve"),
]
