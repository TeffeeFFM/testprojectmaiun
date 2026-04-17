import type { IUser, IProfile } from '../types';

const API_BASE = '/api';

async function readJsonResponse(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function loginRequest(email: string, password: string) {
  const response = await fetch(`${API_BASE}/accounts/login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.error || 'Ошибка входа');
  }

  return data as {
    user: IUser;
    access: string;
    refresh: string;
  };
}

export async function registerRequest(
  username: string,
  email: string,
  password1: string,
  password2: string
) {
  const response = await fetch(`${API_BASE}/accounts/register/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, email, password1, password2 }),
  });

  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.error || 'Ошибка регистрации');
  }

  return data as {
    user: IUser;
    access: string;
    refresh: string;
  };
}

export async function getCurrentUser(): Promise<IUser> {
  const res = await fetch(`${API_BASE}/accounts/me/`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new Error('Unauthorized');
  }

  return res.json();
}

export async function getProfile(): Promise<IProfile> {
  const res = await fetch(`${API_BASE}/accounts/profile/`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new Error('Ошибка профиля');
  }

  return res.json();
}
