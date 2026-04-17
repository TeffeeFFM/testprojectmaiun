import React from 'react';
import '../App.css';

interface ScoreBadgeProps {
  score: number;
  className?: string;
}

const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score, className = '' }) => {
  const getScoreClass = () => {
    if (score >= 80) return 'score-high';
    if (score >= 50) return 'score-medium';
    return 'score-low';
  };

  return (
    <div className={`score-badge ${getScoreClass()} ${className}`.trim()}>
      <span className="score-icon">★</span>
      <span className="score-text">Оценка: {score}/100</span>
    </div>
  );
};

export default ScoreBadge;