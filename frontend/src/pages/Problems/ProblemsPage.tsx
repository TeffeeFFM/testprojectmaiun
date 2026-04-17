import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProblems } from '../../services/problems';
import type { IProblem } from '../../types';
import './ProblemsPage.css';

const ProblemsPage: React.FC = () => {
  const [problems, setProblems] = useState<IProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState<number | ''>('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadProblems = async () => {
    setLoading(true);
    setError(null);

    try {
      const params: Record<string, string | number> = {};

      if (difficulty) params.difficulty = difficulty;
      if (search) params.search = search;

      const data = await getProblems(params);
      setProblems(data);
    } catch (err) {
      console.error('Ошибка загрузки задач:', err);
      setError('Не удалось загрузить задачи. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProblems();
  }, [difficulty, search]);

  const getDifficultyLabel = (level: number) => {
    switch (level) {
      case 1:
        return '⭐ Лёгкая';
      case 2:
        return '⭐⭐ Средняя';
      case 3:
        return '⭐⭐⭐ Сложная';
      default:
        return 'Неизвестно';
    }
  };

  return (
    <div className="problems-page">
      <section className="problems-hero">
        <h1>Банк задач</h1>
        <p>
          Отбирайте задачи по сложности и ищите по названию или описанию. Карточки стали
          более плотными и читаемыми, чтобы банк задач выглядел как полноценный продукт.
        </p>
      </section>

      <section className="filters-card">
        <input
          type="text"
          placeholder="🔍 Поиск по названию или описанию..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />

        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value ? Number(e.target.value) : '')}
          className="difficulty-select"
        >
          <option value="">Все сложности</option>
          <option value="1">Лёгкая</option>
          <option value="2">Средняя</option>
          <option value="3">Сложная</option>
        </select>
      </section>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loader">Загрузка задач...</div>
      ) : (
        <div className="problems-grid">
          {problems.length > 0 ? (
            problems.map((problem) => (
              <Link to={`/problems/${problem.id}`} key={problem.id} className="problem-card">
                <div className="problem-card__head">
                  <h2>{problem.title}</h2>
                  <span className={`difficulty difficulty-${problem.difficulty}`}>
                    {getDifficultyLabel(problem.difficulty)}
                  </span>
                </div>

                <p className="problem-description">
                  {problem.description.length > 170
                    ? `${problem.description.substring(0, 170)}...`
                    : problem.description}
                </p>

                {problem.tags && (
                  <div className="tags">
                    {problem.tags
                      .split(',')
                      .map((tag: string) => tag.trim())
                      .join(' • ')}
                  </div>
                )}
              </Link>
            ))
          ) : (
            <div className="empty-state">
              <p>😕 Задачи не найдены</p>
              <p className="hint">Попробуйте изменить параметры поиска</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProblemsPage;
