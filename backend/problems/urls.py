"""
Маршруты приложения problems.

Router регистрирует ProblemViewSet как /api/problems/
при подключении этого urls.py на уровне path("api/", include("problems.urls")).
"""

from rest_framework.routers import DefaultRouter

from .views import ProblemViewSet

router = DefaultRouter()
router.register(r"problems", ProblemViewSet, basename="problem")

urlpatterns = router.urls
