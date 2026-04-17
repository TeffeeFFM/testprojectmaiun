/**
 * hooks/useCodeAnalysis.ts — Кастомный хук для ревью кода.
 *
 * Зачем выносить логику в хук?
 *
 * Без хука (плохо):
 *   Компоненты Home и ProblemDetail содержат одинаковый код:
 *   useState для code/result/loading/error, handleReview() и т.д.
 *   Это дублирование — нарушение принципа DRY (Don't Repeat Yourself).
 *
 * С хуком (хорошо):
 *   Вся логика — в одном месте.
 *   Компонент остаётся «тупым» (Dumb Component) — знает только как РЕНДЕРИТЬ.
 *   Хук знает как РАБОТАТЬ с данными.
 *
 * Это часть Clean Architecture:
 *   UI Layer     (компоненты .tsx) — как выглядит
 *   Logic Layer  (хуки .ts)        — как работает
 *   Data Layer   (сервисы .ts)     — откуда данные
 */

import { useState, useCallback } from 'react';
import { reviewCode } from '../services/reviews';
import type { IReviewResult, ReviewLevel, ReviewGoal } from '../types';
// from .prompts import build_system_prompt
//C:\Users\Student\Desktop\exXww\backend\exm\prompts.py


// ============================================================
// ТИП: что возвращает хук
// ============================================================

/**
 * Всё, что предоставляет useCodeAnalysis.
 * Компонент деструктурирует нужные поля.
 */
interface UseCodeAnalysisReturn {
  /** Текущий код в редакторе */
  code:          string;
  /** Обновить код (передаётся в onChange редактора) */
  setCode:       (code: string) => void;

  /** Выбранный уровень разработчика */
  level:         ReviewLevel;
  setLevel:      (level: ReviewLevel) => void;

  /** Выбранная цель ревью */
  goal:          ReviewGoal;
  setGoal:       (goal: ReviewGoal) => void;

  /** Результат от AI (null до первого запроса) */
  result:        IReviewResult | null;
  /** Идёт ли сейчас запрос к AI */
  isLoading:     boolean;
  /** Текст ошибки (null если ошибки нет) */
  error:         string | null;

  /** Запустить ревью. Возвращает результат или null при ошибке. */
  submitReview:  (taskOrProblemId: string | number) => Promise<IReviewResult | null>;
  /** Сбросить результат и ошибку */
  resetResult:   () => void;
}


// ============================================================
// ХУК
// ============================================================

/**
 * useCodeAnalysis — управляет всем состоянием для формы ревью кода.
 *
 * @param initialCode - Начальный код в редакторе (опционально)
 *
 * @example
 * // В компоненте Home:
 * const { code, setCode, level, setLevel, goal, setGoal,
 *         result, isLoading, error, submitReview } = useCodeAnalysis();
 *
 * // В компоненте ProblemDetail:
 * const { code, setCode, result, isLoading, submitReview } = useCodeAnalysis();
 * // ...
 * await submitReview(problem.id);  // Передаём ID задачи
 */
export function useCodeAnalysis(initialCode: string = ''): UseCodeAnalysisReturn {

  // ---- Состояния -----------------------------------------------

  const [code,      setCode]      = useState<string>(initialCode);
  const [level,     setLevel]     = useState<ReviewLevel>('junior');
  const [goal,      setGoal]      = useState<ReviewGoal>('learning');
  const [result,    setResult]    = useState<IReviewResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error,     setError]     = useState<string | null>(null);


  // ---- Сброс результата ----------------------------------------

  const resetResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);


  // ---- Основной метод: отправить на ревью ----------------------

  /**
   * submitReview — универсальная функция для обоих сценариев:
   *   1. Главная страница: передаём строку с описанием задачи
   *      await submitReview('Напишите функцию сложения')
   *
   *   2. Страница задачи из банка: передаём числовой ID
   *      await submitReview(5)  // problem_id = 5
   *
   * useCallback — мемоизирует функцию.
   * Без useCallback функция пересоздаётся при каждом рендере —
   * это может вызывать лишние ре-рендеры дочерних компонентов.
   * С useCallback — функция создаётся один раз (пока не изменятся зависимости).
   */
  const submitReview = useCallback(async (
    taskOrProblemId: string | number
  ): Promise<IReviewResult | null> => {
    console.log({ goal, level });

    // Валидация: не отправляем пустой код
    if (!code.trim()) {
      setError('Напишите код перед отправкой на проверку');
      return null;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      let reviewResult: IReviewResult;

      if (typeof taskOrProblemId === 'number') {
        // Сценарий 2: задача из банка — передаём ID
        reviewResult = await reviewCode(code, '', taskOrProblemId, level, goal);
      } else {
        // Сценарий 1: свободное ревью — передаём описание как строку
        reviewResult = await reviewCode(code, taskOrProblemId, undefined, level, goal);
      }

      setResult(reviewResult);
      return reviewResult;

    } catch (err: unknown) {
      // err: unknown — TypeScript требует проверить тип перед использованием
      const message = err instanceof Error
        ? err.message
        : 'Произошла неизвестная ошибка';

      setError(message);
      return null;

    } finally {
      // finally выполняется всегда — убираем индикатор загрузки
      setIsLoading(false);
    }

  }, [code, level, goal]);  // Зависимости useCallback: пересоздаём если изменились


  // ---- Возвращаем всё необходимое --------------------------------

  return {
    code,     setCode,
    level,    setLevel,
    goal,     setGoal,
    result,   isLoading, error,
    submitReview,
    resetResult,
  };
}


