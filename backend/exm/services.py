"""
exm/services.py — логика обращения к внешнему AI-сервису.

Здесь:
  - подготовка промта;
  - запрос к модели;
  - парсинг и нормализация ответа;
  - приведение ответа к строгой Pydantic-схеме.

Вся работа с HTTP вынесена из view,
чтобы контроллеры не превращались в «комбайн».
"""

from __future__ import annotations

import json
import logging
import re
from typing import Generator

import requests
from django.conf import settings

from .prompts import build_system_prompt, build_user_prompt
from .schemas import AIReviewResponse


# ============================================================
# ЛОГГЕР
# ============================================================

logger = logging.getLogger("exm")


# ============================================================
# КАСТОМНЫЕ ИСКЛЮЧЕНИЯ
# ============================================================

class AIServiceError(Exception):
    """Ошибка при работе с AI-сервисом."""
    pass


class AIServiceNotConfiguredError(AIServiceError):
    """AI-сервис не настроен."""
    pass


# ============================================================
# МИКСИН ПАРСИНГА JSON
# ============================================================

class _JSONParserMixin:
    """
    Общая логика извлечения JSON из ответа AI.

    Модели иногда возвращают:
      - чистый JSON;
      - JSON внутри ```json ... ```;
      - JSON с лишними символами вокруг.

    Мы стараемся привести ответ к нормальной структуре.
    """

    def _parse_ai_response(self, raw_text: str) -> AIReviewResponse:
        if not raw_text:
            raise AIServiceError("Получен пустой ответ от нейросети")

        # 1) JSON внутри ```json ... ```
        json_match = re.search(r"```json\s*(\{.*?\})\s*```", raw_text, re.DOTALL)

        # 2) JSON внутри обычного code block
        if not json_match:
            json_match = re.search(r"```\s*(\{.*?\})\s*```", raw_text, re.DOTALL)

        # 3) Просто фигурные скобки
        if not json_match:
            json_match = re.search(r"(\{.*\})", raw_text, re.DOTALL)

        if not json_match:
            logger.error("JSON не найден в ответе AI. Ответ начинается так: %s", raw_text[:200])
            raise AIServiceError("Не удалось найти JSON в ответе AI")

        json_str = json_match.group(1)
        json_str = json_str[json_str.find("{"):]

        try:
            parsed = json.loads(json_str)
        except json.JSONDecodeError:
            logger.warning("Ошибка парсинга JSON, пробуем исправить лишние запятые")
            fixed = re.sub(r",\s*}", "}", json_str)
            fixed = re.sub(r",\s*]", "]", fixed)
            try:
                parsed = json.loads(fixed)
                logger.info("JSON успешно исправлен после удаления лишних запятых")
            except json.JSONDecodeError as exc:
                logger.error("Не удалось исправить JSON. Исходник: %s", json_str[:300])
                raise AIServiceError("Некорректный JSON в ответе AI") from exc

        # Нормализуем refactored_code вручную до Pydantic
        if parsed.get("refactored_code"):
            parsed["refactored_code"] = (
                str(parsed["refactored_code"])
                .replace("\\n", "\n")
                .replace("\\t", "\t")
            )

        try:
            return AIReviewResponse(**parsed)
        except Exception as exc:
            logger.error("Ошибка структуры AIReviewResponse: %s | Данные: %s", exc, parsed)
            raise AIServiceError("Некорректная структура ответа AI") from exc


# ============================================================
# YANDEX GPT SERVICE
# ============================================================

class YandexGPTService(_JSONParserMixin):
    """
    Сервис для проверки кода через YandexGPT.

    Использует OpenAI-совместимый эндпоинт.
    """

    API_URL = "https://llm.api.cloud.yandex.net/v1/chat/completions"

    def __init__(self):
        self.api_key = getattr(settings, "YANDEX_API_KEY", None)
        self.model_uri = getattr(settings, "YANDEX_MODEL_URI", None)

        if not self.api_key:
            raise AIServiceNotConfiguredError("Не задан YANDEX_API_KEY в настройках Django.")
        if not self.model_uri:
            raise AIServiceNotConfiguredError(
                "Не задан YANDEX_MODEL_URI (используйте gpt://.../yandexgpt/latest)."
            )

        logger.info("YandexGPT сервис инициализирован (модель: %s)", self.model_uri)

    def _build_payload(self, code: str, task: str, level: str, goal: str, prompt_style: str, stream: bool = False):
        system_prompt = build_system_prompt(level, goal, prompt_style)
        user_prompt = build_user_prompt(code=code, task=task, level=level, goal=goal, prompt_style=prompt_style)

        return {
            "model": self.model_uri,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.3,
            "max_tokens": 2200,
            "stream": stream,
        }

    def review_code_stream(self, code: str, task: str, level: str, goal: str, prompt_style: str):
        """
        Потоковый режим — если понадобится отдавать ответ частями.
        Сейчас оставлен как расширение на будущее.
        """
        payload = self._build_payload(code, task, level, goal, prompt_style, stream=True)

        headers = {
            "Authorization": f"Api-Key {self.api_key}",
            "Content-Type": "application/json",
        }

        response = requests.post(
            self.API_URL,
            json=payload,
            headers=headers,
            timeout=180,
            stream=True,
        )
        response.raise_for_status()

        for line in response.iter_lines():
            if not line:
                continue

            decoded = line.decode("utf-8").replace("data: ", "")
            if decoded == "[DONE]":
                break

            try:
                chunk = json.loads(decoded)
                content = chunk["choices"][0]["delta"].get("content", "")
                if content:
                    yield content
            except Exception:
                continue

    def review_code(self, code: str, task: str, level: str, goal: str, prompt_style: str) -> AIReviewResponse:
        payload = self._build_payload(code, task, level, goal, prompt_style, stream=False)

        headers = {
            "Authorization": f"Api-Key {self.api_key}",
            "Content-Type": "application/json",
        }

        response = requests.post(
            self.API_URL,
            json=payload,
            headers=headers,
            timeout=180,
        )
        response.raise_for_status()

        ai_text = response.json()["choices"][0]["message"]["content"]
        return self._parse_ai_response(ai_text)


def get_ai_service():
    """
    Фабрика сервисов.

    Сейчас используется YandexGPT.
    В будущем сюда можно легко добавить второй и третий провайдер.
    """
    provider = getattr(settings, "AI_PROVIDER", "yandex").lower()

    if provider == "yandex":
        return YandexGPTService()

    return YandexGPTService()
