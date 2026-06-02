from django.shortcuts import render
from rest_framework import generics, permissions
from rest_framework.pagination import PageNumberPagination
from .models import AuditLog
from .serializers import AuditLogSerializer
from .permissions import IsCoordinator


class AuditLogListView(generics.ListAPIView):
	serializer_class = AuditLogSerializer
	permission_classes = [permissions.IsAuthenticated, IsCoordinator]
	class AuditLogPagination(PageNumberPagination):
		page_size = 25
		page_size_query_param = 'page_size'
		max_page_size = 200

	pagination_class = AuditLogPagination

	def get_queryset(self):
		qs = AuditLog.objects.all().select_related("user")
		# Filtering params
		severity = self.request.query_params.get("severity")
		category = self.request.query_params.get("category")
		user_id = self.request.query_params.get("user")
		action_type = self.request.query_params.get("action_type")
		resource_type = self.request.query_params.get("resource_type")
		date_from = self.request.query_params.get("date_from")
		date_to = self.request.query_params.get("date_to")

		if severity:
			qs = qs.filter(severity_level__iexact=severity)
		if category:
			qs = qs.filter(action_category__iexact=category)
		if user_id:
			qs = qs.filter(user_id=user_id)
		if action_type:
			qs = qs.filter(action_type__icontains=action_type)
		if resource_type:
			qs = qs.filter(resource_type__icontains=resource_type)
		if date_from:
			qs = qs.filter(timestamp__gte=date_from)
		if date_to:
			qs = qs.filter(timestamp__lte=date_to)

		return qs.order_by("-timestamp")


class AuditLogDetailView(generics.RetrieveAPIView):
	serializer_class = AuditLogSerializer
	permission_classes = [permissions.IsAuthenticated, IsCoordinator]
	queryset = AuditLog.objects.all().select_related("user")
