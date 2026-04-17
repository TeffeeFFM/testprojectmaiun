/**
 * components/LevelSelector.tsx — Выбор уровня разработчика и цели ревью.
 *
 * Это «умный» UI-компонент: он не содержит бизнес-логики,
 * только рендерит кнопки и сообщает родителю о выборе через onChange.
 *
 * Такой подход называется «управляемый компонент» (Controlled Component):
 * состояние хранится снаружи (в хуке useCodeAnalysis),
 * а компонент только отображает текущее значение.
 */

import React from 'react';
import type { ReviewLevel, ReviewGoal } from '../types';
import { LEVEL_LABELS, GOAL_LABELS } from '../types';


// ============================================================
// ТИПЫ ПРОПСОВ
// ============================================================

interface LevelSelectorProps {
  /** Текущий выбранный уровень */
  level:         ReviewLevel;
  /** Вызывается когда пользователь меняет уровень */
  onLevelChange: (level: ReviewLevel) => void;

  /** Текущая выбранная цель */
  goal:          ReviewGoal;
  /** Вызывается когда пользователь меняет цель */
  onGoalChange:  (goal: ReviewGoal) => void;

  /** Заблокировать во время загрузки */
  disabled?:     boolean;
}


// ============================================================
// ВСПОМОГАТЕЛЬНЫЙ КОМПОНЕНТ: Группа кнопок
// ============================================================

/**
 * ButtonGroup — рендерит группу кнопок «таблетка».
 * Generic <T extends string> означает: T — это строка,
 * но конкретный набор значений определяется при использовании.
 *
 * Это позволяет использовать один компонент и для уровней, и для целей.
 */
interface ButtonGroupProps<T extends string> {
  label:    string;
  options:  Record<T, string>;   // { 'junior': '🌱 Junior', ... }
  value:    T;
  onChange: (value: T) => void;
  disabled: boolean;
}

function ButtonGroup<T extends string>({
  label, options, value, onChange, disabled,
}: ButtonGroupProps<T>) {
  return (
    <div className="selector-group">
      <span className="selector-label">{label}</span>

      <div className="selector-buttons" role="group" aria-label={label}>
        {/* Object.entries — превращает объект в массив [ключ, значение] */}
        {(Object.entries(options) as [T, string][]).map(([key, displayLabel]) => (
          <button
            key={key}
            type="button"

            // Активная кнопка получает дополнительный класс для стилизации
            className={`selector-btn ${value === key ? 'selector-btn--active' : ''}`}

            // При клике — сообщаем родителю о новом значении
            onClick={() => onChange(key)}

            disabled={disabled}

            // aria-pressed — доступность: скринридер знает, нажата ли кнопка
            aria-pressed={value === key}
          >
            {displayLabel}
          </button>
        ))}
      </div>
    </div>
  );
}


// ============================================================
// ОСНОВНОЙ КОМПОНЕНТ
// ============================================================

/**
 * LevelSelector — две группы кнопок: уровень и цель.
 *
 * @example
 * <LevelSelector
 *   level={level}     onLevelChange={setLevel}
 *   goal={goal}       onGoalChange={setGoal}
 *   disabled={isLoading}
 * />
 */
const LevelSelector: React.FC<LevelSelectorProps> = ({
  level, onLevelChange,
  goal,  onGoalChange,
  disabled = false,
}) => {
  return (
    <div className="level-selector">
      {/* Уровень разработчика */}
      <ButtonGroup<ReviewLevel>
        label="Уровень:"
        options={LEVEL_LABELS}
        value={level}
        onChange={onLevelChange}
        disabled={disabled}
      />

      {/* Цель ревью */}
      <ButtonGroup<ReviewGoal>
        label="Цель:"
        options={GOAL_LABELS}
        value={goal}
        onChange={onGoalChange}
        disabled={disabled}
      />
    </div>
  );
};

export default LevelSelector;