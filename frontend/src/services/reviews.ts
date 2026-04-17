/**
 * services/reviews.ts — запросы к API ревью.
 *
 * Здесь мы отправляем:
 *  - code
 *  - task / problem_id
 *  - level
 *  - goal
 *  - prompt_style
 *
 * Ответ приходит в структурированном виде.
 */

import type {
  IReviewResult,
  ISolution,
  PromptStyle,
  ReviewGoal,
  ReviewLevel,
} from '../types';

const API_BASE = '/api';

export interface ReviewCodePayload {
  code: string;
  task?: string;
  problemId?: number;
  level?: ReviewLevel;
  goal?: ReviewGoal;
  promptStyle?: PromptStyle;
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function readJsonResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function reviewCode(payload: ReviewCodePayload): Promise<IReviewResult> {
  const response = await fetch(`${API_BASE}/exm/review/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({
      code: payload.code,
      task: payload.task ?? '',
      problem_id: payload.problemId ?? null,
      level: payload.level ?? 'junior',
      goal: payload.goal ?? 'learning',
      prompt_style: payload.promptStyle ?? 'balanced',
    }),
  });

  const data = await readJsonResponse(response);

  if (!response.ok) {
    const message =
      data && typeof data === 'object' && 'error' in data
        ? String((data as any).error)
        : 'Ошибка при обращении к API ревью';
    throw new Error(message);
  }

  return data as IReviewResult;
}

export async function getUserSolutions(): Promise<ISolution[]> {
  const response = await fetch(`${API_BASE}/accounts/solutions/`, {
    headers: {
      ...authHeaders(),
    },
  });

  const data = await readJsonResponse(response);

  if (!response.ok) {
    const message =
      data && typeof data === 'object' && 'error' in data
        ? String((data as any).error)
        : 'Не удалось загрузить решения';
    throw new Error(message);
  }

  return Array.isArray(data) ? (data as ISolution[]) : [];
}
