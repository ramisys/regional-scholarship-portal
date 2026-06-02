from django.urls import path

from accounts.views import (
    ChangePasswordAPIView,
    JWTRefreshAPIView,
    LoginAPIView,
    LogoutAPIView,
    ManageUserRoleAPIView,
    PasswordResetConfirmAPIView,
    PasswordResetRequestAPIView,
    ProfileAPIView,
    RegisterAPIView,
)

urlpatterns = [
    path("register/", RegisterAPIView.as_view(), name="auth-register"),
    path("login/", LoginAPIView.as_view(), name="auth-login"),
    path("logout/", LogoutAPIView.as_view(), name="auth-logout"),
    path("refresh/", JWTRefreshAPIView.as_view(), name="auth-refresh"),
    path("profile/", ProfileAPIView.as_view(), name="auth-profile"),
    path("change-password/", ChangePasswordAPIView.as_view(), name="auth-change-password"),
    path("password-reset/", PasswordResetRequestAPIView.as_view(), name="auth-password-reset"),
    path("password-reset-confirm/", PasswordResetConfirmAPIView.as_view(), name="auth-password-reset-confirm"),
    path("users/<int:user_id>/role/", ManageUserRoleAPIView.as_view(), name="auth-manage-role"),
]
