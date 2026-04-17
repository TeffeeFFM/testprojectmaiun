/**
 * ReviewResult.tsx — универсальный рендер результата AI.
 *
 * Компонент специально делает акцент на разных частях ответа
 * в зависимости от goal:
 *   - bugs         -> сначала исправления и issues
 *   - optimization -> сначала complexity_notes и refactored_code
 *   - learning     -> сначала explanation и feedback
 */

import React from 'react';
import type { IReviewResult, ReviewIssue } from '../types';
import ScoreBadge from './ScoreBadge';

interface ReviewResultProps {
  result: IReviewResult;
}

const ReviewResult: React.FC<ReviewResultProps> = ({ result }) => {
  const showIssues = result.issues && result.issues.length > 0;
  const showRefactor = Boolean(result.refactored_code);
  const showTests = result.tests && result.tests.length > 0;
  const showNextSteps = result.next_steps && result.next_steps.length > 0;

  return (
    <div className="result-card" aria-live="polite">
      <div className="result-header">
        <div>
          <h3 className="result-title">Результат анализа</h3>
          <p className="result-subtitle">
            {result.summary || 'AI сформировал структурированный ответ по вашей цели.'}
          </p>
        </div>

        <ScoreBadge score={result.score} />
      </div>

      <div className="status-section">
        <div className="status-row">
          <span className="status-icon">{result.is_valid ? '✔' : '✖'}</span>
          <span>{result.is_valid ? 'Код в целом рабочий' : 'Есть критические проблемы'}</span>
        </div>

        <div className="status-row">
          <span className="status-icon">{result.complexity_issue ? '⚠' : '✔'}</span>
          <span>
            {result.complexity_issue
              ? result.complexity_notes || 'Есть проблема со сложностью'
              : 'Сложность выглядит приемлемой'}
          </span>
        </div>
      </div>

      {result.goal === 'bugs' && (
        <>
          {showIssues && (
            <section className="result-section">
              <h4 className="result-section__title">Найденные ошибки</h4>
              <ul className="issue-list">
                {result.issues.map((issue: ReviewIssue, index: number) => (
                  <li key={index} className="issue-item">
                    <span className="issue-item__line">
                      {issue.line ? `Строка ${issue.line}` : 'Строка не определена'}
                    </span>
                    <span className="issue-item__text">{issue.description}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {showRefactor && (
            <section className="result-section">
              <h4 className="result-section__title">Исправленный код</h4>
              <pre className="code-block">{result.refactored_code}</pre>
            </section>
          )}

          <section className="result-section">
            <h4 className="result-section__title">Комментарий AI</h4>
            <p className="feedback-text">
              {result.feedback || result.explanation || 'Комментарий не был предоставлен.'}
            </p>
          </section>
        </>
      )}

      {result.goal === 'learning' && (
        <>
          <section className="result-section">
            <h4 className="result-section__title">Объяснение</h4>
            <p className="feedback-text">
              {result.explanation ||
                result.feedback ||
                'Подробное объяснение не было предоставлено.'}
            </p>
          </section>

          {showIssues && (
            <section className="result-section">
              <h4 className="result-section__title">Что можно улучшить</h4>
              <ul className="issue-list">
                {result.issues.map((issue: ReviewIssue, index: number) => (
                  <li key={index} className="issue-item">
                    <span className="issue-item__line">
                      {issue.line ? `Строка ${issue.line}` : 'Замечание'}
                    </span>
                    <span className="issue-item__text">{issue.description}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {showRefactor && (
            <section className="result-section">
              <h4 className="result-section__title">Улучшенный вариант</h4>
              <pre className="code-block">{result.refactored_code}</pre>
            </section>
          )}

          <section className="result-section">
            <h4 className="result-section__title">Комментарий AI</h4>
            <p className="feedback-text">{result.feedback || 'Комментарий не был предоставлен.'}</p>
          </section>
        </>
      )}

      {result.goal === 'optimization' && (
        <>
          <section className="result-section">
            <h4 className="result-section__title">Оптимизация</h4>
            <p className="feedback-text">
              {result.complexity_notes ||
                result.feedback ||
                'Комментарий по оптимизации не был предоставлен.'}
            </p>
          </section>

          {showIssues && (
            <section className="result-section">
              <h4 className="result-section__title">Замечания</h4>
              <ul className="issue-list">
                {result.issues.map((issue: ReviewIssue, index: number) => (
                  <li key={index} className="issue-item">
                    <span className="issue-item__line">
                      {issue.line ? `Строка ${issue.line}` : 'Замечание'}
                    </span>
                    <span className="issue-item__text">{issue.description}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {showRefactor && (
            <section className="result-section">
              <h4 className="result-section__title">Оптимизированный код</h4>
              <pre className="code-block">{result.refactored_code}</pre>
            </section>
          )}

          <section className="result-section">
            <h4 className="result-section__title">Комментарий AI</h4>
            <p className="feedback-text">{result.feedback || 'Комментарий не был предоставлен.'}</p>
          </section>
        </>
      )}

      {showTests && (
        <section className="result-section">
          <h4 className="result-section__title">Тест-кейсы</h4>
          <ul className="bullet-list">
            {result.tests.map((test: string, index: number) => (
              <li key={index}>{test}</li>
            ))}
          </ul>
        </section>
      )}

      {showNextSteps && (
        <section className="result-section">
          <h4 className="result-section__title">Следующие шаги</h4>
          <ul className="bullet-list">
            {result.next_steps.map((step: string, index: number) => (
              <li key={index}>{step}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default ReviewResult;
