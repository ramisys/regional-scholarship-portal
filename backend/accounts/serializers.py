from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password as django_validate_password
from django.utils.html import strip_tags
from rest_framework import serializers

from accounts.models import ApplicantProfile

User = get_user_model()


class ApplicantProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicantProfile
        fields = ["full_name", "phone_number", "address", "date_of_birth", "national_id"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    honeypot = serializers.CharField(write_only=True, required=False, allow_blank=True)
    profile = ApplicantProfileSerializer(required=False)

    class Meta:
        model = User
        fields = ["email", "password", "role", "honeypot", "profile"]

    def validate_honeypot(self, value):
        if value:
            raise serializers.ValidationError("Bot submission detected")
        return value

    def validate_password(self, value):
        django_validate_password(value)
        return value

    def validate_email(self, value):
        email = strip_tags(value).strip().lower()
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError("An account with this email already exists")
        return email

    def validate_role(self, value):
        allowed_roles = [User.Role.STUDENT, User.Role.COORDINATOR]
        if value not in allowed_roles:
            raise serializers.ValidationError("Invalid role")
        return value

    def create(self, validated_data):
        validated_data.pop("honeypot", None)
        profile_data = validated_data.pop("profile", None)
        raw_password = validated_data.pop("password")

        user = User.objects.create_user(password=raw_password, **validated_data)

        if profile_data:
            profile_serializer = ApplicantProfileSerializer(data=profile_data)
            profile_serializer.is_valid(raise_exception=True)
            ApplicantProfile.objects.create(user=user, **profile_serializer.validated_data)

        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8)


class UserSerializer(serializers.ModelSerializer):
    profile = ApplicantProfileSerializer(required=False)
    first_name = serializers.CharField(required=False, write_only=True, allow_blank=True)
    last_name = serializers.CharField(required=False, write_only=True, allow_blank=True)

    class Meta:
        model = User
        fields = ["id", "email", "role", "created_at", "profile", "first_name", "last_name"]
        read_only_fields = ["id", "created_at"]

    def update(self, instance, validated_data):
        first_name = validated_data.pop("first_name", None)
        last_name = validated_data.pop("last_name", None)
        profile_data = validated_data.pop("profile", None)

        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()

        profile, _ = ApplicantProfile.objects.get_or_create(user=instance)

        if profile_data is not None:
            for field, value in profile_data.items():
                setattr(profile, field, value)

        full_name_parts = []
        if first_name:
            full_name_parts.append(first_name.strip())
        if last_name:
            full_name_parts.append(last_name.strip())

        if full_name_parts:
            profile.full_name = " ".join(full_name_parts)

        profile.save()
        return instance


class ManageRoleSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=User.Role.choices)
