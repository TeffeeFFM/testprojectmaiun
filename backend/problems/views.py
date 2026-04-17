from rest_framework import viewsets
from rest_framework.filters import SearchFilter
from rest_framework.permissions import AllowAny

from .models import Problem
from .serializers import ProblemSerializer


class ProblemViewSet(viewsets.ModelViewSet):
    serializer_class = ProblemSerializer
    permission_classes = [AllowAny]
    queryset = Problem.objects.all().order_by("id")
    filter_backends = [SearchFilter]
    search_fields = ["title", "description", "tags"]

    def get_queryset(self):
        queryset = super().get_queryset()

        difficulty = self.request.query_params.get("difficulty")
        if difficulty not in (None, ""):
            try:
                queryset = queryset.filter(difficulty=int(difficulty))
            except (TypeError, ValueError):
                pass

        return queryset
