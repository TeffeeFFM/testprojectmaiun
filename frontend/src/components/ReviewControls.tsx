/**
 * ReviewControls.tsx — кнопки выбора уровня, цели и стиля промта.
 *
 * Это управляемый UI-компонент:
 * - состояние хранится в родителе;
 * - здесь только отображение и события.
 */

import React from 'react';
import type { PromptStyle, ReviewGoal, ReviewLevel } from '../types';
import {
  GOAL_DESCRIPTIONS,
  GOAL_LABELS,
  LEVEL_LABELS,
  PROMPT_DESCRIPTIONS,
  PROMPT_LABELS,
} from '../types';

interface OptionGroupProps<T extends string> {
  label: string;
  description: string;
  options: Record<T, string>;
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}

function OptionGroup<T extends string>({
  label,
  description,
  options,
  value,
  onChange,
  disabled = false,
}: OptionGroupProps<T>) {
  return (
    <section className="control-card">
      <div className="control-card__header">
        <div>
          <h3 className="control-card__title">{label}</h3>
          <p className="control-card__description">{description}</p>
        </div>
      </div>

      <div className="option-grid" role="group" aria-label={label}>
        {(Object.entries(options) as [T, string][]).map(([key, text]) => (
          <button
            key={key}
            type="button"
            className={`option-btn ${value === key ? 'option-btn--active' : ''}`}
            onClick={() => onChange(key)}
            disabled={disabled}
            aria-pressed={value === key}
          >
            {text}
          </button>
        ))}
      </div>
    </section>
  );
}

interface ReviewControlsProps {
  level: ReviewLevel;
  onLevelChange: (value: ReviewLevel) => void;

  goal: ReviewGoal;
  onGoalChange: (value: ReviewGoal) => void;

  promptStyle: PromptStyle;
  onPromptStyleChange: (value: PromptStyle) => void;

  disabled?: boolean;
}

const ReviewControls: React.FC<ReviewControlsProps> = ({
  level,
  onLevelChange,
  goal,
  onGoalChange,
  promptStyle,
  onPromptStyleChange,
  disabled = false,
}) => {
  return (
    <div className="review-controls">
      <OptionGroup<ReviewLevel>
        label="Уровень разработчика"
        description="Это влияет на глубину объяснений и строгость ревью."
        options={LEVEL_LABELS}
        value={level}
        onChange={onLevelChange}
        disabled={disabled}
      />

      <OptionGroup<ReviewGoal>
        label="Цель ревью"
        description={GOAL_DESCRIPTIONS[goal]}
        options={GOAL_LABELS}
        value={goal}
        onChange={onGoalChange}
        disabled={disabled}
      />

      <OptionGroup<PromptStyle>
        label="Стиль промта"
        description={PROMPT_DESCRIPTIONS[promptStyle]}
        options={PROMPT_LABELS}
        value={promptStyle}
        onChange={onPromptStyleChange}
        disabled={disabled}
      />
    </div>
  );
};

export default ReviewControls;
