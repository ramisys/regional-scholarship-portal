from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.utils.encoding import force_bytes
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from datetime import timedelta

from accounts.models import ApplicantProfile
from accounts.serializers import (
	ChangePasswordSerializer,
	LoginSerializer,
	ManageRoleSerializer,
	PasswordResetConfirmSerializer,
	PasswordResetRequestSerializer,
	RegisterSerializer,
	UserSerializer,
)
from core.permissions import IsCoordinator
from core.responses import error_response, success_response

User = get_user_model()


class RegisterAPIView(APIView):
	permission_classes = [AllowAny]
	throttle_scope = "auth"

	def post(self, request):
		serializer = RegisterSerializer(data=request.data)
		if not serializer.is_valid():
			# Extract the first validation error message for display
			errors = serializer.errors
			if "email" in errors:
				return error_response(str(errors["email"][0]), {"email": errors["email"]}, status.HTTP_400_BAD_REQUEST)
			# For other errors, return all errors
			return error_response("Validation failed", errors, status.HTTP_400_BAD_REQUEST)
		user = serializer.save()
		user_data = UserSerializer(user).data
		return success_response("Registration successful", user_data, status.HTTP_201_CREATED)


class LoginAPIView(APIView):
	permission_classes = [AllowAny]
	throttle_scope = "auth"

	def post(self, request):
		serializer = LoginSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		email = serializer.validated_data["email"].lower()
		password = serializer.validated_data["password"]
		user = authenticate(request=request, email=email, password=password)

		if not user:
			return error_response("Invalid credentials", {"detail": "Email or password is incorrect"}, status.HTTP_401_UNAUTHORIZED)

		refresh = RefreshToken.for_user(user)
		access_token = str(refresh.access_token)

		# Set refresh token as httpOnly cookie
		response = success_response("Login successful", {"access": access_token, "user": UserSerializer(user).data})
		cookie_secure = not settings.DEBUG
		cookie_samesite = getattr(settings, "COOKIE_SAMESITE", "Lax")
		refresh_lifetime = settings.SIMPLE_JWT.get('REFRESH_TOKEN_LIFETIME', timedelta(days=7))
		max_age = int(refresh_lifetime.total_seconds()) if isinstance(refresh_lifetime, timedelta) else refresh_lifetime
		response.set_cookie(
			"refresh",
			str(refresh),
			httponly=True,
			secure=cookie_secure,
			samesite=cookie_samesite,
			max_age=max_age,
			path="/",
		)
		return response


class LogoutAPIView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request):
		# Read refresh token from cookie if available
		refresh_token = request.COOKIES.get("refresh")
		if not refresh_token:
			return error_response("Validation failed", {"refresh": ["Refresh token is required"]})

		try:
			token = RefreshToken(refresh_token)
			token.blacklist()
		except Exception:
			return error_response("Validation failed", {"refresh": ["Invalid refresh token"]})

		response = success_response("Logout successful")
		response.delete_cookie("refresh")
		return response


class JWTRefreshAPIView(TokenRefreshView):
	permission_classes = [AllowAny]

	def post(self, request, *args, **kwargs):
		# Prefer refresh token from cookie; otherwise fallback to body
		refresh_token = request.COOKIES.get("refresh")
		if refresh_token and not request.data.get("refresh"):
			try:
				token = RefreshToken(refresh_token)
				new_access = str(token.access_token)
				# Handle rotation if enabled
				new_refresh = None
				if settings.SIMPLE_JWT.get("ROTATE_REFRESH_TOKENS", False):
					try:
						new_refresh = str(token.rotate())
					except Exception:
						new_refresh = None
				data = {"access": new_access}
				resp = success_response("Token refreshed", data)
				if new_refresh:
					cookie_secure = not settings.DEBUG
					cookie_samesite = getattr(settings, "COOKIE_SAMESITE", "Lax")
					refresh_lifetime = settings.SIMPLE_JWT.get('REFRESH_TOKEN_LIFETIME', timedelta(days=7))
					max_age = int(refresh_lifetime.total_seconds()) if isinstance(refresh_lifetime, timedelta) else refresh_lifetime
					resp.set_cookie("refresh", new_refresh, httponly=True, secure=cookie_secure, samesite=cookie_samesite, max_age=max_age, path="/")
				return resp
			except Exception:
				return error_response("Token refresh failed", {"refresh": ["Invalid refresh token"]}, status.HTTP_400_BAD_REQUEST)

		# Fallback to default behavior (refresh in body)
		response = super().post(request, *args, **kwargs)
		if response.status_code >= 400:
			return error_response("Token refresh failed", response.data, response.status_code)
		# If token rotation returned a new refresh, set cookie and return only access
		refresh_value = response.data.get("refresh") if isinstance(response.data, dict) else None
		access_value = response.data.get("access") if isinstance(response.data, dict) else None
		out = {"access": access_value}
		resp = success_response("Token refreshed", out)
		if refresh_value:
			cookie_secure = not settings.DEBUG
			refresh_lifetime = settings.SIMPLE_JWT.get('REFRESH_TOKEN_LIFETIME', timedelta(days=7))
			max_age = int(refresh_lifetime.total_seconds()) if isinstance(refresh_lifetime, timedelta) else refresh_lifetime
			resp.set_cookie("refresh", refresh_value, httponly=True, secure=cookie_secure, samesite="Lax", max_age=max_age, path="/")
		return resp


class ProfileAPIView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		ApplicantProfile.objects.get_or_create(user=request.user)
		return success_response("Profile fetched", UserSerializer(request.user).data)

	def put(self, request):
		serializer = UserSerializer(request.user, data=request.data, partial=True)
		serializer.is_valid(raise_exception=True)
		serializer.save()
		return success_response("Profile updated", serializer.data)


class ChangePasswordAPIView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request):
		serializer = ChangePasswordSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		old_password = serializer.validated_data["old_password"]
		new_password = serializer.validated_data["new_password"]

		if not request.user.check_password(old_password):
			return error_response("Validation failed", {"old_password": ["Old password is incorrect"]})

		request.user.set_password(new_password)
		request.user.save(update_fields=["password"])
		return success_response("Password changed successfully")


class PasswordResetRequestAPIView(APIView):
	permission_classes = [AllowAny]
	throttle_scope = "auth"

	def post(self, request):
		serializer = PasswordResetRequestSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)

		email = serializer.validated_data["email"].lower()
		user = User.objects.filter(email=email).first()
		if user:
			uid = urlsafe_base64_encode(force_bytes(user.pk))
			token = default_token_generator.make_token(user)
			reset_url_base = settings.FRONTEND_RESET_PASSWORD_URL
			reset_link = f"{reset_url_base}?uid={uid}&token={token}"
			send_mail(
				subject="Password reset request",
				message=f"Use this link to reset your password: {reset_link}",
				from_email=settings.DEFAULT_FROM_EMAIL,
				recipient_list=[user.email],
				fail_silently=True,
			)

		return success_response("If the email exists, a reset link has been sent")


class PasswordResetConfirmAPIView(APIView):
	permission_classes = [AllowAny]
	throttle_scope = "auth"

	def post(self, request):
		serializer = PasswordResetConfirmSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		uid = serializer.validated_data["uid"]
		token = serializer.validated_data["token"]
		new_password = serializer.validated_data["new_password"]

		try:
			user_id = force_str(urlsafe_base64_decode(uid))
			user = User.objects.get(id=user_id)
		except Exception:
			return error_response("Validation failed", {"uid": ["Invalid reset identifier"]})

		if not default_token_generator.check_token(user, token):
			return error_response("Validation failed", {"token": ["Invalid or expired token"]})

		user.set_password(new_password)
		user.save(update_fields=["password"])
		return success_response("Password reset successful")


class ManageUserRoleAPIView(APIView):
	permission_classes = [IsAuthenticated, IsCoordinator]

	def patch(self, request, user_id):
		target_user = User.objects.filter(id=user_id).first()
		if not target_user:
			return error_response("Not found", {"user": ["User does not exist"]}, status.HTTP_404_NOT_FOUND)

		serializer = ManageRoleSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		target_user.role = serializer.validated_data["role"]
		target_user.save(update_fields=["role"])
		return success_response("Role updated", UserSerializer(target_user).data)
