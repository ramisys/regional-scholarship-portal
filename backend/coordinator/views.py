from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.utils import timezone
from datetime import datetime, timedelta, time
from django.db.models import Count, Q

from applications.models import ApplicationStatusHistory, ScholarshipApplication
from applications.serializers import ScholarshipApplicationSerializer
from coordinator.serializers import BulkApplicationActionSerializer, BulkStatusUpdateSerializer
from coordinator.services import CoordinatorBulkApplicationService
from core.permissions import IsCoordinator
from core.responses import error_response, success_response
from core.email_service import EmailService
from documents.models import UploadedDocument
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


class CoordinatorApplicationListAPIView(APIView):
	permission_classes = [IsAuthenticated, IsCoordinator]

	def get(self, request):
		queryset = ScholarshipApplication.objects.select_related("applicant").prefetch_related(
			"educational_backgrounds",
			"documents",
			"status_history",
		)

		status_filter = request.query_params.get("status")
		search_query = request.query_params.get("q")

		if status_filter:
			queryset = queryset.filter(status=status_filter)
		if search_query:
			queryset = queryset.filter(applicant__email__icontains=search_query)

		serializer = ScholarshipApplicationSerializer(queryset, many=True)
		return success_response("Dashboard applications fetched", serializer.data)


class CoordinatorApplicationStatusUpdateAPIView(APIView):
	permission_classes = [IsAuthenticated, IsCoordinator]

	def patch(self, request, application_id):
		application = ScholarshipApplication.objects.filter(id=application_id).first()
		if not application:
			return error_response("Not found", {"application": ["Application does not exist"]}, status.HTTP_404_NOT_FOUND)

		new_status = request.data.get("status")
		allowed = {
			ScholarshipApplication.Status.UNDER_REVIEW,
			ScholarshipApplication.Status.APPROVED,
			ScholarshipApplication.Status.REJECTED,
		}
		if new_status not in allowed:
			return error_response("Validation failed", {"status": ["Invalid status transition"]})

		old_status = application.status
		application.status = new_status
		application.is_draft = False
		application.save(update_fields=["status", "is_draft", "updated_at"])

		ApplicationStatusHistory.objects.create(
			application=application,
			old_status=old_status,
			new_status=new_status,
			changed_by=request.user,
			notes=request.data.get("notes", "Status updated by coordinator"),
		)

		return success_response("Application status updated", ScholarshipApplicationSerializer(application).data)


class CoordinatorApplicationBulkApproveAPIView(APIView):
	permission_classes = [IsAuthenticated, IsCoordinator]

	def post(self, request):
		serializer = BulkApplicationActionSerializer(data=request.data)
		if not serializer.is_valid():
			return error_response("Validation failed", serializer.errors, status.HTTP_400_BAD_REQUEST)

		result = CoordinatorBulkApplicationService.bulk_update_status(
			user=request.user,
			application_ids=serializer.validated_data["application_ids"],
			target_status=ScholarshipApplication.Status.APPROVED,
			notes=serializer.validated_data.get("notes", "Bulk approve performed by coordinator"),
			action_type="bulk_approve",
		)

		if not result.get("success"):
			return error_response(result.get("message", "Bulk approve failed"), {"application_ids": result.get("missing_ids", [])}, status.HTTP_400_BAD_REQUEST)

		return success_response("Bulk approve completed", {
			"processed_count": result["processed_count"],
			"failed_count": result["failed_count"],
			"skipped": result.get("skipped", []),
			"affected_application_ids": result.get("affected_application_ids", []),
		})


class CoordinatorApplicationBulkRejectAPIView(APIView):
	permission_classes = [IsAuthenticated, IsCoordinator]

	def post(self, request):
		serializer = BulkApplicationActionSerializer(data=request.data)
		if not serializer.is_valid():
			return error_response("Validation failed", serializer.errors, status.HTTP_400_BAD_REQUEST)

		result = CoordinatorBulkApplicationService.bulk_update_status(
			user=request.user,
			application_ids=serializer.validated_data["application_ids"],
			target_status=ScholarshipApplication.Status.REJECTED,
			notes=serializer.validated_data.get("notes", "Bulk reject performed by coordinator"),
			action_type="bulk_reject",
		)

		if not result.get("success"):
			return error_response(result.get("message", "Bulk reject failed"), {"application_ids": result.get("missing_ids", [])}, status.HTTP_400_BAD_REQUEST)

		return success_response("Bulk reject completed", {
			"processed_count": result["processed_count"],
			"failed_count": result["failed_count"],
			"skipped": result.get("skipped", []),
			"affected_application_ids": result.get("affected_application_ids", []),
		})


class CoordinatorApplicationBulkStatusUpdateAPIView(APIView):
	permission_classes = [IsAuthenticated, IsCoordinator]

	def patch(self, request):
		serializer = BulkStatusUpdateSerializer(data=request.data)
		if not serializer.is_valid():
			return error_response("Validation failed", serializer.errors, status.HTTP_400_BAD_REQUEST)

		result = CoordinatorBulkApplicationService.bulk_update_status(
			user=request.user,
			application_ids=serializer.validated_data["application_ids"],
			target_status=serializer.validated_data["status"],
			notes=serializer.validated_data.get("notes", "Bulk status update performed by coordinator"),
			action_type="bulk_status_update",
		)

		if not result.get("success"):
			return error_response(result.get("message", "Bulk status update failed"), {"application_ids": result.get("missing_ids", [])}, status.HTTP_400_BAD_REQUEST)

		return success_response("Bulk status update completed", {
			"processed_count": result["processed_count"],
			"failed_count": result["failed_count"],
			"skipped": result.get("skipped", []),
			"affected_application_ids": result.get("affected_application_ids", []),
		})


class CoordinatorStatsAPIView(APIView):
	permission_classes = [IsAuthenticated, IsCoordinator]

	def get(self, request):
		total_applications = ScholarshipApplication.objects.exclude(is_draft=True).count()
		pending_review = ScholarshipApplication.objects.filter(status=ScholarshipApplication.Status.UNDER_REVIEW).count()
		
		# Get counts for today
		today = timezone.now().date()
		today_start = timezone.make_aware(datetime.combine(today, time.min))
		today_end = timezone.make_aware(datetime.combine(today, time.max))
		
		approved_today = ScholarshipApplication.objects.filter(
			status=ScholarshipApplication.Status.APPROVED,
			updated_at__gte=today_start,
			updated_at__lte=today_end
		).count()
		
		rejected_today = ScholarshipApplication.objects.filter(
			status=ScholarshipApplication.Status.REJECTED,
			updated_at__gte=today_start,
			updated_at__lte=today_end
		).count()
		
		# Placeholder for region stats (region field not yet in model)
		applications_by_region = []
		
		stats = {
			"totalApplications": total_applications,
			"pendingReview": pending_review,
			"approvedToday": approved_today,
			"rejectedToday": rejected_today,
			"applicationsByRegion": applications_by_region,
		}
		
		return success_response("Dashboard statistics fetched", stats)


class CoordinatorRecentApplicationsAPIView(APIView):
	permission_classes = [IsAuthenticated, IsCoordinator]

	def get(self, request):
		recent_apps = ScholarshipApplication.objects.select_related("applicant", "applicant__profile").exclude(
			is_draft=True
		).order_by("-updated_at")[:10]
		serializer = ScholarshipApplicationSerializer(recent_apps, many=True)
		return success_response("Recent applications fetched", serializer.data)


class CoordinatorNotifyMissingDocumentsAPIView(APIView):
	"""
	Send notification to student about missing or incomplete documents.
	
	Request body:
	{
		"missing_documents": ["id_card", "transcript", "passport"]  # List of document types
	}
	"""
	permission_classes = [IsAuthenticated, IsCoordinator]

	def post(self, request, application_id):
		# Get application
		application = ScholarshipApplication.objects.select_related("applicant").filter(id=application_id).first()
		if not application:
			return error_response(
				"Not found", 
				{"application": ["Application does not exist"]}, 
				status.HTTP_404_NOT_FOUND
			)

		# Get list of missing documents
		missing_documents = request.data.get("missing_documents", [])
		if not missing_documents or not isinstance(missing_documents, list):
			return error_response(
				"Validation failed",
				{"missing_documents": ["Missing documents list is required and must be a list"]},
				status.HTTP_400_BAD_REQUEST
			)

		try:
			# Send email notification (may be queued to background worker)
			sent_or_queued = EmailService.send_missing_documents_email(application, missing_documents)
			if sent_or_queued:
				msg = "Notification sent successfully"
				if getattr(settings, 'ENABLE_BACKGROUND_EMAILS', False):
					msg = "Notification queued for delivery"
				logger.info(f"Notify missing documents: application={application.id} queued={getattr(settings, 'ENABLE_BACKGROUND_EMAILS', False)}")
				return success_response(
					msg,
					{
						"application_id": application.id,
						"student_email": application.applicant.email,
						"documents_notified": missing_documents
					}
				)
			else:
				logger.error(f"Failed to send/queue notification for application={application.id}")
				return error_response(
					"Failed to send notification",
					{"email": ["Failed to send email to student"]},
					status.HTTP_500_INTERNAL_SERVER_ERROR
				)
		except Exception as e:
			return error_response(
				"Error sending notification",
				{"error": [str(e)]},
				status.HTTP_500_INTERNAL_SERVER_ERROR
			)
