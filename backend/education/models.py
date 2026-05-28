from django.db import models

# Create your models here.
from django.core.exceptions import ValidationError
from applications.models import ScholarshipApplication

class EducationalBackground(models.Model):
	application = models.ForeignKey(
		ScholarshipApplication,
		on_delete=models.CASCADE,
		related_name="educational_backgrounds",
	)
	school_name = models.CharField(max_length=255)
	level = models.CharField(max_length=100)
	year_started = models.PositiveIntegerField()
	year_ended = models.PositiveIntegerField(null=True, blank=True)

	def clean(self):
		if self.year_ended and self.year_ended < self.year_started:
			raise ValidationError("year_ended must be greater than or equal to year_started")

	def __str__(self):
		return f"{self.school_name} ({self.level})"
