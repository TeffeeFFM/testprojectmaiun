"""
Маршруты приложения exm.

Здесь лежат эндпоинты:
- /api/exm/review/
- /api/exm/health/
- /api/exm/test/
"""

from django.urls import path

from .views import ReviewCodeView, HealthCheckView, TestReviewView

urlpatterns = [
    path("review/", ReviewCodeView.as_view(), name="review-code"),
    path("health/", HealthCheckView.as_view(), name="health-check"),
    path("test/", TestReviewView.as_view(), name="test-review"),
]
