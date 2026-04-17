/**
 * services/api.ts — Базовый HTTP-клиент на Axios.
 *
 * Зачем переходить с fetch на Axios?
 *   - Интерсепторы: можно автоматически добавлять токен к КАЖДОМУ запросу
 *   - Автообновление токена: если 401 — обновляем refresh token и повторяем запрос
 *   - Лучшая обработка ошибок: Axios выбрасывает исключение для 4xx/5xx автоматически
 *   - Читаемее: axios.get('/url') вместо fetch + response.json() + проверки
 */

import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosError, InternalAxiosRequestConfig } from 'axios';

// ============================================================
// КОНСТАНТЫ
// ============================================================

/**
 * Базовый URL API.
 * import.meta.env.VITE_API_URL — переменная из файла .env фронтенда.
 * Если не задана — используем localhost:8000.
 *
 * Создай файл frontend/.env:
 *   VITE_API_URL=http://127.0.0.1:8000/api
 */
const API_BASE_URL: string = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api';



/** Ключи для хранения токенов в localStorage */
const TOKEN_KEYS = {
  access:  'accessToken',
  refresh: 'refreshToken',
} as const;


// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ РАБОТЫ С ТОКЕНАМИ
// ============================================================

/** Получить access token из localStorage */
export const getAccessToken  = (): string | null => localStorage.getItem(TOKEN_KEYS.access);

/** Получить refresh token из localStorage */
export const getRefreshToken = (): string | null => localStorage.getItem(TOKEN_KEYS.refresh);

/** Сохранить оба токена в localStorage */
export const saveTokens = (access: string, refresh: string): void => {
  localStorage.setItem(TOKEN_KEYS.access,  access);
  localStorage.setItem(TOKEN_KEYS.refresh, refresh);
};

/** Удалить оба токена (при выходе или ошибке авторизации) */
export const clearTokens = (): void => {
  localStorage.removeItem(TOKEN_KEYS.access);
  localStorage.removeItem(TOKEN_KEYS.refresh);
};


// ============================================================
// СОЗДАНИЕ AXIOS-ИНСТАНСА
//
// axiosInstance — это настроенная копия Axios.
// У неё уже прописаны baseURL и Content-Type.
// Все запросы через этот инстанс будут иметь эти настройки.
// ============================================================

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30_000,  // 30 секунд на ответ (AI может думать долго)
});


// ============================================================
// ИНТЕРСЕПТОР ЗАПРОСОВ (Request Interceptor)
//
// Выполняется ПЕРЕД каждым запросом.
// Здесь мы автоматически добавляем JWT-токен в заголовок.
// Это лучше, чем добавлять токен вручную в каждом вызове.
// ============================================================

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();

    // Если токен есть — добавляем заголовок Authorization
    // Формат: "Bearer <токен>" — стандарт JWT
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;  // Возвращаем изменённый config запроса
  },
  (error) => {
    // Ошибка ДО отправки запроса (редкий случай)
    return Promise.reject(error);
  }
);


// ============================================================
// ИНТЕРСЕПТОР ОТВЕТОВ (Response Interceptor)
//
// Выполняется ПОСЛЕ получения ответа.
// Здесь мы обрабатываем ошибку 401:
//   — Пытаемся обновить access token через refresh token
//   — Если обновить не удалось — выходим из системы
//
// Это называется «прозрачное обновление токена»:
// пользователь не замечает, что токен обновился — запрос
// просто автоматически повторяется с новым токеном.
// ============================================================

/**
 * Флаг: сейчас идёт обновление токена?
 * Нужен, чтобы при нескольких одновременных 401-ошибках
 * не запускать несколько refresh-запросов параллельно.
 */
let isRefreshing = false;

/**
 * Очередь запросов, которые ждут обновления токена.
 * Каждый элемент — функция, которую нужно вызвать после обновления.
 */
let refreshQueue: Array<(token: string) => void> = [];

/** Разослать новый токен всем ожидающим запросам */
const processRefreshQueue = (newToken: string): void => {
  refreshQueue.forEach(callback => callback(newToken));
  refreshQueue = [];
};

axiosInstance.interceptors.response.use(
  // Успешный ответ — просто возвращаем без изменений
  (response) => response,

  // Ошибка ответа
  async (error: AxiosError) => {
    // originalRequest — оригинальный запрос, который провалился
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Обрабатываем только 401 (Unauthorized) и только один раз
    // _retry — флаг, чтобы не зациклиться (401 → refresh → 401 → refresh → ...)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = getRefreshToken();

      // Если refresh token тоже нет — выходим из системы
      if (!refreshToken) {
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // Если уже идёт обновление — добавляем в очередь и ждём
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((newToken: string) => {
            if (originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            }
            resolve(axiosInstance(originalRequest));
          });
        });
      }

      // Запускаем обновление токена
      isRefreshing = true;

      try {
        // POST /accounts/token/refresh/ — стандартный эндпоинт simplejwt
        const response = await axios.post(`${API_BASE_URL}/accounts/token/refresh/`, {
          refresh: refreshToken,
        });

        const newAccessToken: string = response.data.access;
        // Сохраняем новый access token (refresh мог тоже обновиться, если ROTATE=True)
        saveTokens(newAccessToken, response.data.refresh ?? refreshToken);

        // Разблокируем все ждущие запросы
        processRefreshQueue(newAccessToken);

        // Повторяем оригинальный запрос с новым токеном
        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        }
        return axiosInstance(originalRequest);

      } catch (refreshError) {
        // Refresh token тоже не сработал — выходим из системы
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);

      } finally {
        isRefreshing = false;
      }
    }

    // Для всех остальных ошибок — просто прокидываем дальше
    return Promise.reject(error);
  }
);


// ============================================================
// ЭКСПОРТИРУЕМЫЕ МЕТОДЫ API
//
// Тонкая обёртка над axiosInstance для удобства использования.
// Возвращаем response.data — это уже распарсенный JSON.
// ============================================================

export const api = {
  /**
   * GET-запрос.
   * @example const problems = await api.get<IProblem[]>('/problems/');
   */
  get: async <T = unknown>(endpoint: string): Promise<T> => {
    const response = await axiosInstance.get<T>(endpoint);
    return response.data;
  },

  /**
   * POST-запрос.
   * @example const result = await api.post<IReviewResult>('/exm/review/', payload);
   */
  post: async <T = unknown>(endpoint: string, data: unknown): Promise<T> => {
    const response = await axiosInstance.post<T>(endpoint, data);
    return response.data;
  },

  /**
   * PUT-запрос (полное обновление ресурса).
   */
  put: async <T = unknown>(endpoint: string, data: unknown): Promise<T> => {
    const response = await axiosInstance.put<T>(endpoint, data);
    return response.data;
  },

  /**
   * PATCH-запрос (частичное обновление ресурса).
   */
  patch: async <T = unknown>(endpoint: string, data: unknown): Promise<T> => {
    const response = await axiosInstance.patch<T>(endpoint, data);
    return response.data;
  },

  /**
   * DELETE-запрос.
   */
  delete: async <T = unknown>(endpoint: string): Promise<T> => {
    const response = await axiosInstance.delete<T>(endpoint);
    return response.data;
  },
};


