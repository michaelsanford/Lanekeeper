import React from 'react';
import type { TaskPriority } from '../../types/index.js';
import { getPriorityConfig } from '../../utils/priorities.js';

interface PriorityBadgeProps {
  priority: TaskPriority;
  showLabel?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  showLabel = true,
  size = 'sm',
  className = ''
}) => {
  if (priority === 'none') return null;

  const config = getPriorityConfig(priority);
  const Icon = config.icon;
  const iconSize = size === 'sm' ? 12 : 14;

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold uppercase tracking-wider rounded border ${
        size === 'sm' ? 'text-[11px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'
      } ${config.badgeClass} ${className}`}
      title={`Priority: ${config.label}`}
    >
      <Icon size={iconSize} className="shrink-0" aria-hidden={true} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
};
