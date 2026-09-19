import React from 'react';
import { AlertOctagon, ArrowUp, Equal, ArrowDown, Minus } from 'lucide-react';
import type { TaskPriority } from '../types/index.js';

export interface PriorityItemConfig {
  id: TaskPriority;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number; 'aria-hidden'?: boolean | 'true' | 'false' }>;
  badgeClass: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
  weight: number;
}

export const PRIORITY_CONFIG: Record<TaskPriority, PriorityItemConfig> = {
  urgent: {
    id: 'urgent',
    label: 'Urgent',
    icon: AlertOctagon,
    badgeClass: 'bg-rose-950/80 text-rose-300 border-rose-600/80',
    textClass: 'text-rose-400',
    bgClass: 'bg-rose-950/80',
    borderClass: 'border-rose-800/80',
    weight: 4
  },
  high: {
    id: 'high',
    label: 'High',
    icon: ArrowUp,
    badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-600/80',
    textClass: 'text-amber-400',
    bgClass: 'bg-amber-950/80',
    borderClass: 'border-amber-800/80',
    weight: 3
  },
  medium: {
    id: 'medium',
    label: 'Medium',
    icon: Equal,
    badgeClass: 'bg-blue-950/80 text-blue-300 border-blue-600/80',
    textClass: 'text-blue-400',
    bgClass: 'bg-blue-950/80',
    borderClass: 'border-blue-800/80',
    weight: 2
  },
  low: {
    id: 'low',
    label: 'Low',
    icon: ArrowDown,
    badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
    textClass: 'text-slate-400',
    bgClass: 'bg-slate-800/80',
    borderClass: 'border-slate-700/80',
    weight: 1
  },
  none: {
    id: 'none',
    label: 'None',
    icon: Minus,
    badgeClass: 'bg-slate-900 text-slate-500 border-slate-800',
    textClass: 'text-slate-500',
    bgClass: 'bg-slate-900',
    borderClass: 'border-slate-800',
    weight: 0
  }
};

export const ORDERED_PRIORITIES: TaskPriority[] = ['urgent', 'high', 'medium', 'low'];

export function getPriorityConfig(priority: TaskPriority): PriorityItemConfig {
  return PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.none;
}
