from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView

from .models import Profile, Solution

User = get_user_model()


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response(
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
            }
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        password = request.data.get("password") or ""

        if not email or not password:
            return Response(
                {"error": "Email и пароль обязательны"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response(
                {"error": "Неверный email или пароль"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.check_password(password):
            return Response(
                {"error": "Неверный email или пароль"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        Profile.objects.get_or_create(user=user)

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                },
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            }
        )


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = (request.data.get("username") or "").strip()
        email = (request.data.get("email") or "").strip().lower()
        password1 = request.data.get("password1") or ""
        password2 = request.data.get("password2") or ""

        if not username or not email or not password1 or not password2:
            return Response({"error": "Все поля обязательны"}, status=400)

        if password1 != password2:
            return Response({"error": "Пароли не совпадают"}, status=400)

        if User.objects.filter(email__iexact=email).exists():
            return Response({"error": "Email уже используется"}, status=400)

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password1,
        )

        Profile.objects.get_or_create(user=user)

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                },
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=201,
        )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return Response({"status": "ok"})


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)
        return Response(
            {
                "id": profile.id,
                "bio": profile.bio,
            }
        )


class UserSolutionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)

        solutions = (
            Solution.objects.filter(profile=profile)
            .select_related("problem")
            .order_by("-submitted_at")
        )

        data = [
            {
                "id": sol.id,
                "problem": sol.problem.id,
                "problem_title": sol.problem.title,
                "code": sol.code,
                "is_correct": sol.is_correct,
                "score": sol.score,
                "feedback": sol.feedback,
                "submitted_at": sol.submitted_at.isoformat(),
            }
            for sol in solutions
        ]

        return Response(data)
