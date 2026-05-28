from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
	def create_user(self, email, password=None, **extra_fields):
		if not email:
			raise ValueError("Email is required")
		email = self.normalize_email(email)
		user = self.model(email=email, **extra_fields)
		user.set_password(password)
		user.save(using=self._db)
		return user

	def create_superuser(self, email, password=None, **extra_fields):
		extra_fields.setdefault("is_staff", True)
		extra_fields.setdefault("is_superuser", True)
		extra_fields.setdefault("role", User.Role.COORDINATOR)
		return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
	class Role(models.TextChoices):
		STUDENT = "student", "Student"
		COORDINATOR = "coordinator", "Coordinator"

	email = models.EmailField(unique=True)
	role = models.CharField(max_length=20, choices=Role.choices, default=Role.STUDENT)
	is_active = models.BooleanField(default=True)
	is_staff = models.BooleanField(default=False)
	created_at = models.DateTimeField(auto_now_add=True)

	objects = UserManager()

	USERNAME_FIELD = "email"
	REQUIRED_FIELDS = []

	def __str__(self):
		return self.email


class ApplicantProfile(models.Model):
	user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
	full_name = models.CharField(max_length=255, blank=True)
	phone_number = models.CharField(max_length=20, blank=True)
	address = models.TextField(blank=True)
	date_of_birth = models.DateField(null=True, blank=True)
	national_id = models.CharField(max_length=64, blank=True)

	def __str__(self):
		return f"Profile<{self.user.email}>"

# Create your models here.
