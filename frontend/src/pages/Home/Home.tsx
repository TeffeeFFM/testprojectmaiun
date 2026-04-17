/**
 * pages/Home/Home.tsx — главная страница.
 *
 * Что здесь важно:
 *  - отдельно выделены выбор уровня, цели и стиля промта;
 *  - результат рендерится по-разному в зависимости от цели;
 *  - страница остаётся читаемой и понятной;
 *  - логика анализа вынесена в сервис reviewCode.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import CodeEditor from '../../components/CodeEditor';
import ReviewControls from '../../components/ReviewControls';
import ReviewResult from '../../components/ReviewResult';
import { reviewCode } from '../../services/reviews';
import type { IReviewResult, PromptStyle, ReviewGoal, ReviewLevel } from '../../types';
import './HomePage.css';

const DEMO_CODE = `def validate_password(password):
    if len(password) < 8:
        return False
    has_upper = False
    for i in password:
        if i.isupper():
            has_upper = True
            break
    if not has_upper:
        return False
    return True`;

const DEMO_TASK = 'Проверка надёжности пароля: длина не менее 8 символов и хотя бы одна заглавная буква';

const Home: React.FC = () => {
  const [code, setCode] = useState(DEMO_CODE);
  const [level, setLevel] = useState<ReviewLevel>('junior');
  const [goal, setGoal] = useState<ReviewGoal>('learning');
  const [promptStyle, setPromptStyle] = useState<PromptStyle>('balanced');

  const [result, setResult] = useState<IReviewResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!code.trim()) {
      setError('Сначала вставьте код для анализа');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await reviewCode({
        code,
        task: DEMO_TASK,
        level,
        goal,
        promptStyle,
      });

      setResult(data);
    } catch (err: any) {
      setError(err?.message || 'Не удалось выполнить анализ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="home-page">
      <section className="hero-card">
        <div className="hero-copy">
          <span className="hero-kicker">AI Code Review</span>
          <h1 className="hero-title">Проверка кода, которая подстраивается под цель</h1>
          <p className="hero-text">
            Выбирай цель ревью, стиль промта и уровень разработчика. Для каждой цели AI
            возвращает ответ с разным акцентом: баги, оптимизация или обучение.
          </p>

          <div className="hero-links">
            <Link to="/problems" className="hero-link">
              Перейти в банк задач
            </Link>
            <span className="hero-note">Быстрая проверка доступна прямо здесь</span>
          </div>
        </div>

        <div className="hero-stats">
          <div className="hero-stat">
            <span className="hero-stat__value">3</span>
            <span className="hero-stat__label">цели ревью</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat__value">4</span>
            <span className="hero-stat__label">стиля промта</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat__value">1</span>
            <span className="hero-stat__label">единый интерфейс</span>
          </div>
        </div>
      </section>

      <div className="workspace-grid">
        <div className="workspace-main">
          <ReviewControls
            level={level}
            onLevelChange={setLevel}
            goal={goal}
            onGoalChange={setGoal}
            promptStyle={promptStyle}
            onPromptStyleChange={setPromptStyle}
            disabled={isLoading}
          />

          <section className="editor-card">
            <div className="section-header">
              <h2>Код для анализа</h2>
              <p>Вставьте сюда код, который хотите проверить.</p>
            </div>

            <CodeEditor
              value={code}
              onChange={setCode}
              placeholder="✎ Вставьте ваш код здесь..."
              rows={14}
            />

            {error && (
              <div className="error-message" role="alert">
                {error}
              </div>
            )}

            <button className="submit-btn" onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? '⏳ Анализируем...' : '▶ Анализировать код'}
            </button>
          </section>
        </div>

        <aside className="workspace-aside">
          {result ? (
            <ReviewResult result={result} />
          ) : (
            <section className="result-placeholder">
              <h3>Что покажет AI</h3>
              <p>
                При цели <strong>«Найти баги»</strong> результат будет начинаться с исправленного
                кода и конкретных ошибок. При цели <strong>«Объясни и научи»</strong> — с
                подробного разбора и обучения. При <strong>оптимизации</strong> — с анализа
                сложности и улучшенного решения.
              </p>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
};

export default Home;
