from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is None:
        return response

    if isinstance(exc, ValidationError):
        message = "Validation failed"
        errors = response.data
    else:
        message = response.data.get("detail", "Request failed") if isinstance(response.data, dict) else "Request failed"
        errors = response.data if isinstance(response.data, dict) else {}

    response.data = {
        "success": False,
        "message": message,
        "errors": errors,
    }

    if response.status_code == status.HTTP_401_UNAUTHORIZED:
        response.data["message"] = "Authentication failed"

    return response
