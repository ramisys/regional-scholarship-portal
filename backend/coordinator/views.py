from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.utils import timezone
from datetime import datetime, timedelta, time
from django.db.models import Count, Q

from applications.models import ApplicationStatusHistory, ScholarshipApplication
from applications.serializers import ScholarshipApplicationSerializer
from core.permissions import IsCoordinator
from core.responses import error_response, success_response


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
