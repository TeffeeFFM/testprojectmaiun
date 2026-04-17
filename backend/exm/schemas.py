"""
exm/schemas.py — Pydantic-схемы для валидации данных.

Используем две основные схемы:
  - ReviewRequest     — входящий запрос от фронтенда
  - AIReviewResponse   — структурированный ответ от AI

Здесь же лежит вложенная схема Issue, чтобы ответ был более читаемым
и удобным для фронтенда.
"""

from __future__ import annotations

from typing import Optional, Literal, List

from pydantic import BaseModel, Field, field_validator


# ============================================================
# ВЛОЖЕННАЯ СХЕМА: ОДНА ПРОБЛЕМА / ОДИН БАГ
# ============================================================

class AIReviewIssue(BaseModel):
    """
    Одна конкретная проблема в коде.

    line        — номер строки, если его удалось определить
    description — краткое понятное описание проблемы
    """
    line: Optional[int] = Field(
        default=None,
        description="Номер строки с проблемой"
    )
    description: str = Field(
        ...,
        min_length=1,
        description="Описание найденной проблемы"
    )

    @field_validator("description")
    @classmethod
    def normalize_description(cls, value: str) -> str:
        return value.strip()


# ============================================================
# СХЕМА ВХОДЯЩЕГО ЗАПРОСА
# ============================================================

class ReviewRequest(BaseModel):
    """
    Входные данные для запроса ревью кода.
    """
    code: str = Field(
        ...,
        min_length=1,
        max_length=10_000,
        description="Код для проверки"
    )
    task: str = Field(
        default="",
        max_length=5_000,
        description="Описание задачи, если не передан problem_id"
    )
    problem_id: Optional[int] = Field(
        default=None,
        gt=0,
        description="ID задачи из банка"
    )
    level: Literal["junior", "middle", "senior"] = Field(
        default="junior",
        description="Уровень разработчика"
    )
    goal: Literal["bugs", "optimization", "learning"] = Field(
        default="learning",
        description="Цель ревью"
    )
    prompt_style: Literal["balanced", "strict", "mentor", "concise"] = Field(
        default="balanced",
        description="Стиль промта"
    )

    @field_validator("code")
    @classmethod
    def code_must_not_be_empty(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Код не может быть пустым или состоять только из пробелов")
        return value.strip()

    @field_validator("task")
    @classmethod
    def normalize_task(cls, value: str) -> str:
        return value.strip()


# ============================================================
# СХЕМА ОТВЕТА AI
# ============================================================

class AIReviewResponse(BaseModel):
    """
    Структурированный ответ от AI.

    Структура специально сделана более богатой, чем раньше:
      - разные поля могут быть важнее в зависимости от goal;
      - фронтенд может по-разному отрисовывать ответ;
      - сохраняется совместимость через feedback и refactored_code.
    """
    goal: Optional[Literal["bugs", "optimization", "learning"]] = Field(
        default=None,
        description="Цель ревью"
    )
    prompt_style: Optional[Literal["balanced", "strict", "mentor", "concise"]] = Field(
        default=None,
        description="Стиль промта"
    )
    is_valid: bool = Field(
        description="True, если код в целом корректен"
    )
    score: int = Field(
        ...,
        ge=0,
        le=100,
        description="Оценка качества от 0 до 100"
    )
    summary: str = Field(
        default="",
        description="Краткий итог"
    )
    feedback: str = Field(
        default="",
        description="Основной развернутый комментарий"
    )
    issues: List[AIReviewIssue] = Field(
        default_factory=list,
        description="Список найденных проблем"
    )
    explanation: Optional[str] = Field(
        default=None,
        description="Подробное объяснение для обучения"
    )
    complexity_issue: bool = Field(
        default=False,
        description="Есть ли проблема со сложностью"
    )
    complexity_notes: Optional[str] = Field(
        default=None,
        description="Комментарий по времени и памяти"
    )
    refactored_code: Optional[str] = Field(
        default=None,
        description="Улучшенная версия кода"
    )
    next_steps: List[str] = Field(
        default_factory=list,
        description="Следующие шаги для улучшения"
    )
    tests: List[str] = Field(
        default_factory=list,
        description="Тест-кейсы для проверки"
    )

    @field_validator("score", mode="before")
    @classmethod
    def clamp_score(cls, value) -> int:
        """
        Приводим score к int и зажимаем в диапазон 0–100.
        """
        try:
            score = int(value)
        except (TypeError, ValueError):
            return 0
        return max(0, min(100, score))

    @field_validator("summary", "feedback", "explanation", "complexity_notes", mode="before")
    @classmethod
    def ensure_text_is_string(cls, value):
        """
        Гарантируем, что текстовые поля не развалятся из-за None.
        """
        if value is None:
            return None
        text = str(value).strip()
        return text if text else None

    @field_validator("refactored_code", mode="before")
    @classmethod
    def normalize_refactored_code(cls, value):
        """
        Приводим код к нормальному виду, если модель вернула его в JSON-строке.
        """
        if value is None:
            return None
        text = str(value)
        return text.replace("\\n", "\n").replace("\\t", "\t")

    @field_validator("next_steps", "tests", mode="before")
    @classmethod
    def ensure_list_of_strings(cls, value):
        """
        Если AI вернул не список, а строку, пытаемся исправить ситуацию.
        """
        if value is None:
            return []
        if isinstance(value, list):
            return [str(item).strip() for item in value if str(item).strip()]
        if isinstance(value, str) and value.strip():
            return [value.strip()]
        return []
