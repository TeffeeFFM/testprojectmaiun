"""
exm/views.py — HTTP-обработчики для AI-ревью кода.

Логика:
  1. Валидируем входные данные через Pydantic
  2. Подтягиваем задачу из банка, если передан problem_id
  3. Отправляем код в AI вместе с level / goal / prompt_style
  4. Возвращаем структурированный ответ
  5. При необходимости сохраняем результат в Solution
"""

from __future__ import annotations

import logging

from pydantic import ValidationError as PydanticValidationError
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Solution
from problems.models import Problem

from .schemas import ReviewRequest
from .services import AIServiceError, AIServiceNotConfiguredError, get_ai_service

logger = logging.getLogger("exm")


def _build_task_description(problem: Problem) -> str:
    """
    Собирает полное описание задачи для AI.

    Чем больше контекста мы дадим модели,
    тем выше шанс получить полезный и точный ответ.
    """
    examples_text = "Не указаны"

    if problem.examples:
        lines = [
            f"Ввод: {ex.get('input', '')} -> Вывод: {ex.get('output', '')}"
            for ex in problem.examples
        ]
        examples_text = "\n".join(lines)

    return (
        f"Задача: {problem.title}\n\n"
        f"Описание: {problem.description}\n\n"
        f"Формат ввода: {problem.input_format or 'Не указан'}\n\n"
        f"Формат вывода: {problem.output_format or 'Не указан'}\n\n"
        f"Примеры:\n{examples_text}"
    )


class ReviewCodeView(APIView):
    """
    POST /api/exm/review/
    """
    permission_classes = [AllowAny]

    def post(self, request):
        # --------------------------------------------------------
        # ШАГ 1. Валидация входных данных
        # --------------------------------------------------------
        try:
            req = ReviewRequest(**request.data)
        except PydanticValidationError as exc:
            errors = [
                f"{' -> '.join(str(loc) for loc in err['loc'])}: {err['msg']}"
                for err in exc.errors()
            ]
            return Response(
                {"error": "Некорректные входные данные", "details": errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --------------------------------------------------------
        # ШАГ 2. Формируем описание задачи
        # --------------------------------------------------------
        problem = None
        task_description = req.task

        if req.problem_id:
            try:
                problem = Problem.objects.get(id=req.problem_id)
                task_description = _build_task_description(problem)
            except Problem.DoesNotExist:
                return Response(
                    {"error": f"Задача с ID={req.problem_id} не найдена"},
                    status=status.HTTP_404_NOT_FOUND,
                )

        if not task_description:
            return Response(
                {"error": "Передайте problem_id или заполните поле task"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --------------------------------------------------------
        # ШАГ 3. Запрос к AI
        # --------------------------------------------------------
        try:
            ai = get_ai_service()
            result = ai.review_code(
                code=req.code,
                task=task_description,
                level=req.level,
                goal=req.goal,
                prompt_style=req.prompt_style,
            )
        except AIServiceNotConfiguredError as exc:
            logger.error("AI не настроен: %s", exc)
            return Response(
                {"error": "AI-сервис не настроен. Проверьте .env на сервере."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except AIServiceError as exc:
            logger.error("Ошибка AI: %s", exc)
            return Response(
                {"error": str(exc)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        # --------------------------------------------------------
        # ШАГ 4. Гарантируем, что goal / prompt_style есть в ответе
        # --------------------------------------------------------
        result = result.model_copy(
            update={
                "goal": result.goal or req.goal,
                "prompt_style": result.prompt_style or req.prompt_style,
            }
        )

        # --------------------------------------------------------
        # ШАГ 5. Сохраняем результат, если это авторизованный пользователь
        # --------------------------------------------------------
        if request.user.is_authenticated and problem:
            Solution.objects.update_or_create(
                profile=request.user.profile,
                problem=problem,
                defaults={
                    "code": req.code,
                    "is_correct": result.is_valid,
                    "score": result.score,
                    "feedback": result.feedback,
                },
            )
            logger.info(
                "Решение сохранено: %s | задача #%s | оценка: %s",
                request.user.email,
                req.problem_id,
                result.score,
            )

        return Response(result.model_dump(), status=status.HTTP_200_OK)


class HealthCheckView(APIView):
    """
    GET /api/exm/health/
    """
    permission_classes = [AllowAny]

    def get(self, request):
        ai_ready = False

        try:
            get_ai_service()
            ai_ready = True
        except AIServiceNotConfiguredError:
            pass

        return Response({"status": "ok", "ai_configured": ai_ready})


class TestReviewView(APIView):
    """
    GET /api/exm/test/
    Тестовый запрос к AI только для staff.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_staff:
            return Response(
                {"error": "Только для администраторов"},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            ai = get_ai_service()
            result = ai.review_code(
                code="def add(a, b):\n    return a + b",
                task="Напиши функцию сложения двух чисел",
                level="junior",
                goal="learning",
                prompt_style="mentor",
            )
            return Response({"status": "ok", "result": result.model_dump()})
        except AIServiceError as exc:
            return Response(
                {"status": "error", "message": str(exc)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
