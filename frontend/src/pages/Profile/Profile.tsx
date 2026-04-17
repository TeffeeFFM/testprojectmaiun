import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getProfile } from '../../services/auth';
import { getUserSolutions } from '../../services/reviews';
import type { IProfile, ISolution } from '../../types';
import './ProfilePage.css';

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<IProfile | null>(null);
  const [solutions, setSolutions] = useState<ISolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setSolutions([]);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadProfileData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [profileResult, solutionsResult] = await Promise.allSettled([
          getProfile(),
          getUserSolutions(),
        ]);

        if (cancelled) return;

        if (profileResult.status === 'fulfilled') {
          setProfile(profileResult.value);
        } else {
          console.error('Ошибка загрузки профиля:', profileResult.reason);
        }

        if (solutionsResult.status === 'fulfilled') {
          setSolutions(solutionsResult.value);
        } else {
          console.error('Ошибка загрузки решений:', solutionsResult.reason);
        }

        if (profileResult.status === 'rejected' && solutionsResult.status === 'rejected') {
          setError('Не удалось загрузить данные профиля и решения');
        } else if (profileResult.status === 'rejected') {
          setError('Не удалось загрузить данные профиля');
        } else if (solutionsResult.status === 'rejected') {
          setError('Не удалось загрузить решения');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadProfileData();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleLogout = async () => {
    await logout();
  };

  if (loading) {
    return <div className="loader">Загрузка профиля...</div>;
  }

  if (!user) {
    return (
      <div className="not-authorized">
        <p>Чтобы увидеть профиль, войдите в аккаунт.</p>
        <Link to="/login" className="btn btn-primary">
          Войти
        </Link>
      </div>
    );
  }

  const solvedCount = solutions.filter((s) => s.is_correct).length;
  const totalAttempts = solutions.length;
  const successRate = totalAttempts > 0 ? Math.round((solvedCount / totalAttempts) * 100) : 0;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div>
          <h1>Личный кабинет</h1>
          <p>Статистика, решённые задачи и последние попытки.</p>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          Выйти
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <section className="profile-card">
        <div className="avatar-placeholder">{user.username[0].toUpperCase()}</div>

        <div className="user-details">
          <h2>{user.username}</h2>
          <p>{user.email}</p>
          <p className="bio">{profile?.bio || 'Пока нет информации о себе'}</p>
        </div>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{solvedCount}</span>
          <span className="stat-label">Решено задач</span>
        </div>

        <div className="stat-card">
          <span className="stat-value">{totalAttempts}</span>
          <span className="stat-label">Всего попыток</span>
        </div>

        <div className="stat-card">
          <span className="stat-value">{successRate}%</span>
          <span className="stat-label">Успешность</span>
        </div>
      </section>

      <section className="solutions-card">
        <h2>Последние решения</h2>

        {solutions.length === 0 ? (
          <p className="empty-message">
            Вы ещё не решали задачи. <Link to="/problems">Перейти к задачам</Link>
          </p>
        ) : (
          <div className="table-responsive">
            <table className="solutions-table">
              <thead>
                <tr>
                  <th>Задача</th>
                  <th>Результат</th>
                  <th>Оценка</th>
                  <th>Дата</th>
                </tr>
              </thead>
              <tbody>
                {solutions.slice(0, 10).map((sol) => {
                  const score = sol.score ?? null;

                  return (
                    <tr key={sol.id}>
                      <td>
                        <Link to={`/problems/${sol.problem}`} className="problem-link">
                          {sol.problem_title}
                        </Link>
                      </td>
                      <td>
                        {sol.is_correct ? (
                          <span className="success-badge">✅ Успешно</span>
                        ) : (
                          <span className="error-badge">❌ Не пройдено</span>
                        )}
                      </td>
                      <td>
                        {score !== null && score !== undefined ? (
                          <span
                            className={`score ${
                              score >= 80 ? 'high' : score >= 50 ? 'medium' : 'low'
                            }`}
                          >
                            {score}/100
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>{new Date(sol.submitted_at).toLocaleDateString('ru-RU')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default ProfilePage;
