import json

from django.db import transaction
from django.utils import timezone
from django.utils.html import strip_tags
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from applications.models import ApplicationStatusHistory, ScholarshipApplication
from education.models import EducationalBackground
from applications.serializers import ScholarshipApplicationSerializer
from core.responses import error_response, success_response


class ScholarshipApplicationViewSet(viewsets.ModelViewSet):
	serializer_class = ScholarshipApplicationSerializer
	permission_classes = [IsAuthenticated]

	def _truthy(self, value):
		if isinstance(value, bool):
			return value
		if value is None:
			return False
		return str(value).strip().lower() in {"1", "true", "yes", "on"}

	def _default_title(self, request):
		profile = getattr(request.user, "profile", None)
		full_name = getattr(profile, "full_name", "") if profile else ""
		full_name = full_name.strip()
		if full_name:
			return f"{full_name} Scholarship Application"
		return f"{request.user.email} Scholarship Application"

	def _parse_year(self, value):
		if not value:
			return None
		try:
			return int(str(value)[:4])
		except (TypeError, ValueError):
			return None

	def _normalize_application_payload(self, request):
		data = request.data or {}
		personal_info = data.get("personalInfo") or {}
		contact_info = data.get("contactInfo") or {}
		title = strip_tags(data.get("title") or "").strip()
		if not title:
			name_parts = [personal_info.get("firstName"), personal_info.get("lastName")]
			candidate_name = " ".join(part for part in name_parts if part).strip()
			title = f"{candidate_name} Scholarship Application" if candidate_name else self._default_title(request)

		personal_statement = data.get("personal_statement")
		if personal_statement is None:
			personal_statement = json.dumps(
				{
					"personalInfo": personal_info,
					"contactInfo": contact_info,
				},
				ensure_ascii=False,
			)

		raw_backgrounds = data.get("educational_backgrounds")
		if raw_backgrounds is None:
			raw_backgrounds = data.get("educationalBackground") or []

		normalized_backgrounds = []
		for item in raw_backgrounds:
			if not isinstance(item, dict):
				continue
			school_name = item.get("school_name") or item.get("schoolName") or ""
			level = item.get("level") or item.get("degree") or item.get("fieldOfStudy") or "Unknown"
			year_started = self._parse_year(item.get("year_started") or item.get("startDate"))
			year_ended = self._parse_year(item.get("year_ended") or item.get("endDate"))
			if not school_name or year_started is None:
				continue
			normalized_backgrounds.append(
				{
					"school_name": school_name,
					"level": level,
					"year_started": year_started,
					"year_ended": year_ended,
				}
			)

		return title, personal_statement, normalized_backgrounds

	def _replace_educational_backgrounds(self, application, educational_backgrounds):
		application.educational_backgrounds.all().delete()
		for item in educational_backgrounds:
			EducationalBackground.objects.create(application=application, **item)

	def _create_submitted_application(self, request):
		title, personal_statement, educational_backgrounds = self._normalize_application_payload(request)
		application = ScholarshipApplication.objects.create(
			applicant=request.user,
			title=title,
			personal_statement=personal_statement,
			status=ScholarshipApplication.Status.PENDING,
			is_draft=False,
			submission_date=timezone.now(),
		)
		self._replace_educational_backgrounds(application, educational_backgrounds)
		return application

	def _save_draft_application(self, request):
		title, personal_statement, educational_backgrounds = self._normalize_application_payload(request)
		application = ScholarshipApplication.objects.filter(
			applicant=request.user,
			is_draft=True,
		).order_by("-updated_at").first()

		if application is None:
			application = ScholarshipApplication.objects.create(
				applicant=request.user,
				title=title,
				personal_statement=personal_statement,
				status=ScholarshipApplication.Status.DRAFT,
				is_draft=True,
			)
		else:
			application.title = title
			application.personal_statement = personal_statement
			application.status = ScholarshipApplication.Status.DRAFT
			application.is_draft = True
			application.save(update_fields=["title", "personal_statement", "status", "is_draft", "updated_at"])

		self._replace_educational_backgrounds(application, educational_backgrounds)
		return application

	def get_queryset(self):
		queryset = ScholarshipApplication.objects.select_related("applicant").prefetch_related(
			"educational_backgrounds",
			"status_history",
			"documents",
		)
		if self.request.user.role == "coordinator":
			return queryset
		return queryset.filter(applicant=self.request.user)

	def list(self, request, *args, **kwargs):
		serializer = self.get_serializer(self.get_queryset(), many=True)
		return success_response("Applications fetched", serializer.data)

	def retrieve(self, request, *args, **kwargs):
		instance = self.get_object()
		serializer = self.get_serializer(instance)
		return success_response("Application fetched", serializer.data)

	@transaction.atomic
	def create(self, request, *args, **kwargs):
		application = self._create_submitted_application(request)
		serializer = self.get_serializer(application)
		return success_response("Application created", serializer.data, status.HTTP_201_CREATED)

	def update(self, request, *args, **kwargs):
		partial = kwargs.pop("partial", False)
		instance = self.get_object()
		if request.user.role != "coordinator" and instance.applicant != request.user:
			return error_response("Forbidden", {"detail": "You do not have access"}, status.HTTP_403_FORBIDDEN)

		serializer = self.get_serializer(instance, data=request.data, partial=partial)
		serializer.is_valid(raise_exception=True)
		serializer.save()
		return success_response("Application updated", serializer.data)

	def destroy(self, request, *args, **kwargs):
		instance = self.get_object()
		if request.user.role != "coordinator" and instance.applicant != request.user:
			return error_response("Forbidden", {"detail": "You do not have access"}, status.HTTP_403_FORBIDDEN)
		instance.delete()
		return success_response("Application deleted")

	@action(detail=False, methods=["post"], url_path="draft")
	def save_draft(self, request):
		application = self._save_draft_application(request)
		return success_response("Draft saved", self.get_serializer(application).data)

	@action(detail=True, methods=["post"], url_path="submit")
	def submit_application(self, request, pk=None):
		instance = self.get_object()
		if request.user.role != "coordinator" and instance.applicant != request.user:
			return error_response("Forbidden", {"detail": "You do not have access"}, status.HTTP_403_FORBIDDEN)

		old_status = instance.status
		instance.submit()
		ApplicationStatusHistory.objects.create(
			application=instance,
			old_status=old_status,
			new_status=instance.status,
			changed_by=request.user,
			notes="Application submitted",
		)
		return success_response("Application submitted", self.get_serializer(instance).data)
