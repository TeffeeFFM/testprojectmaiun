/**
 * types/index.ts — центральное место для всех общих типов проекта.
 *
 * Почему это важно:
 * - сюда смотрят компоненты, страницы и сервисы;
 * - если здесь не экспортировать тип, TypeScript будет ругаться;
 * - так проще поддерживать проект и не плодить дубли.
 */

export type ReviewLevel = 'junior' | 'middle' | 'senior';
export type ReviewGoal = 'bugs' | 'optimization' | 'learning';
export type PromptStyle = 'balanced' | 'strict' | 'mentor' | 'concise';

export interface ReviewIssue {
  line?: number | null;
  description: string;
}

export interface IReviewResult {
  goal: ReviewGoal;
  prompt_style: PromptStyle;

  is_valid: boolean;
  score: number;

  summary: string;
  feedback: string;

  issues: ReviewIssue[];
  explanation?: string | null;

  complexity_issue: boolean;
  complexity_notes?: string | null;

  refactored_code?: string | null;

  next_steps: string[];
  tests: string[];
}

export interface IProblemExample {
  input: string;
  output: string;
}

export interface IProblem {
  id: number;
  title: string;
  description: string;
  input_format?: string | null;
  output_format?: string | null;
  difficulty: number;
  tags?: string;
  examples?: IProblemExample[];
}

export interface ISolution {
  id: number;
  problem: number;
  problem_title?: string;
  code: string;
  is_correct: boolean;
  score?: number | null;
  feedback?: string | null;
  submitted_at: string;
}

export interface IProfile {
  id: number;
  bio?: string | null;
}

export interface IUser {
  id: number;
  username: string;
  email: string;
}

export const LEVEL_LABELS: Record<ReviewLevel, string> = {
  junior: '🌱 Junior',
  middle: '⚙ Middle',
  senior: '🚀 Senior',
};

export const GOAL_LABELS: Record<ReviewGoal, string> = {
  bugs: '🐛 Найти баги',
  optimization: '⚡ Оптимизировать',
  learning: '📚 Объясни и научи',
};

export const PROMPT_LABELS: Record<PromptStyle, string> = {
  balanced: '⚖ Баланс',
  strict: '🧪 Строгий аудит',
  mentor: '🧠 Наставник',
  concise: '✂ Коротко',
};

export const GOAL_DESCRIPTIONS: Record<ReviewGoal, string> = {
  bugs: 'Главный акцент — на логических ошибках, краевых случаях и исправленном коде.',
  optimization: 'Главный акцент — на скорости, памяти и оптимизированной версии решения.',
  learning: 'Главный акцент — на объяснении, разборе и обучении через обратную связь.',
};

export const PROMPT_DESCRIPTIONS: Record<PromptStyle, string> = {
  balanced: 'Сбалансированный ответ без перегруза.',
  strict: 'Жёсткий, точный и требовательный разбор.',
  mentor: 'Поддерживающий и объясняющий стиль.',
  concise: 'Короткий ответ без лишних деталей.',
};
