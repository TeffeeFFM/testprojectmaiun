/**
 * services/problems.ts — API для банка задач.
 *
 * Здесь все запросы к задачам собраны в одном месте,
 * чтобы страницы не работали напрямую с fetch.
 */

import type { IProblem } from '../types';

const API_BASE = '/api';

function buildQueryString(params?: Record<string, string | number | undefined | null>) {
  if (!params) return '';

  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
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

export async function getProblems(
  params?: Record<string, string | number | undefined | null>
): Promise<IProblem[]> {
  const response = await fetch(`${API_BASE}/problems/${buildQueryString(params)}`);

  const data = await readJsonResponse(response);

  if (!response.ok) {
    const message =
      data && typeof data === 'object' && 'error' in data
        ? String((data as any).error)
        : 'Не удалось загрузить задачи';
    throw new Error(message);
  }

  return Array.isArray(data) ? data : (data?.results ?? []);
}

export async function getProblem(id: number): Promise<IProblem> {
  const response = await fetch(`${API_BASE}/problems/${id}/`);

  const data = await readJsonResponse(response);

  if (!response.ok) {
    const message =
      data && typeof data === 'object' && 'error' in data
        ? String((data as any).error)
        : 'Не удалось загрузить задачу';
    throw new Error(message);
  }

  return data as IProblem;
}
