import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getProblem } from '../../services/problems';
import { reviewCode } from '../../services/reviews';
import type { IProblem, IProblemExample, IReviewResult } from '../../types';
import CodeEditor from '../../components/CodeEditor';
import ReviewResult from '../../components/ReviewResult';
import './ProblemDetailPage.css';

interface DifficultyBadgeProps {
  difficulty: number;
}

const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({ difficulty }) => {
  const labels: Record<number, string> = {
    1: '⭐ Лёгкая',
    2: '⭐⭐ Средняя',
    3: '⭐⭐⭐ Сложная',
  };

  return <span className="difficulty-badge">{labels[difficulty] ?? '❓ Неизвестно'}</span>;
};

const ProblemDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [problem, setProblem] = useState<IProblem | null>(null);
  const [code, setCode] = useState<string>('# Напишите решение здесь\n');
  const [result, setResult] = useState<IReviewResult | null>(null);

  const [loadingProblem, setLoadingProblem] = useState(true);
  const [loadingReview, setLoadingReview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadProblem(Number(id));
    }
  }, [id]);

  const loadProblem = async (problemId: number) => {
    setLoadingProblem(true);
    setError(null);

    try {
      const data = await getProblem(problemId);
      setProblem(data);
    } catch (err) {
      setError('Не удалось загрузить задачу. Попробуйте обновить страницу.');
      console.error('Ошибка загрузки задачи:', err);
    } finally {
      setLoadingProblem(false);
    }
  };

  const handleReview = async () => {
    if (!problem) return;

    if (!code.trim() || code.trim() === '# Напишите решение здесь') {
      setError('Напишите код перед отправкой на проверку');
      return;
    }

    setLoadingReview(true);
    setError(null);
    setResult(null);

    try {
      const data = await reviewCode({
        code,
        task: problem.title,
        problemId: problem.id,
        level: 'junior',
        goal: 'bugs',
        promptStyle: 'strict',
      });

      setResult(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Произошла неизвестная ошибка при проверке кода');
      }
    } finally {
      setLoadingReview(false);
    }
  };

  if (loadingProblem) {
    return <div className="loader">Загрузка задачи...</div>;
  }

  if (!problem) {
    return <div className="error-message">{error ?? 'Задача не найдена'}</div>;
  }

  return (
    <div className="problem-detail-page">
      <div className="problem-detail-grid">
        <section className="problem-panel">
          <h1>{problem.title}</h1>
          <DifficultyBadge difficulty={problem.difficulty} />

          <div className="description">
            <p>{problem.description}</p>
          </div>

          {problem.input_format && (
            <div className="format-section">
              <h3>Формат ввода</h3>
              <p>{problem.input_format}</p>
            </div>
          )}

          {problem.output_format && (
            <div className="format-section">
              <h3>Формат вывода</h3>
              <p>{problem.output_format}</p>
            </div>
          )}

          {problem.examples && problem.examples.length > 0 && (
            <div className="examples-section">
              <h3>Примеры</h3>

              {problem.examples.map((ex: IProblemExample, index: number) => (
                <div key={index} className="example-card">
                  <div>
                    <strong>Ввод:</strong>
                    <pre>{ex.input}</pre>
                  </div>
                  <div>
                    <strong>Вывод:</strong>
                    <pre>{ex.output}</pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="solution-panel">
          {!user && (
            <p className="auth-hint">
              💡 Войдите в аккаунт, чтобы результаты сохранялись в профиле
            </p>
          )}

          <div className="section-header">
            <h2>Ваше решение</h2>
            <p>На странице задачи AI делает упор на поиск багов и исправленный код.</p>
          </div>

          <CodeEditor
            value={code}
            onChange={setCode}
            placeholder="✎ Напишите код решения..."
            rows={16}
          />

          {error && <p className="error-message">{error}</p>}

          <button className="submit-btn" onClick={handleReview} disabled={loadingReview}>
            {loadingReview ? '⏳ Проверяем...' : 'Отправить на проверку'}
          </button>

          {result && <ReviewResult result={result} />}
        </section>
      </div>
    </div>
  );
};

export default ProblemDetailPage;
