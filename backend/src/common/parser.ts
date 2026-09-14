import type { QuickParseResult, TaskPriority } from './types.js';

/**
 * Parses quick-add text into structured task fields.
 * Example syntax:
 * "Fix auth middleware lockup #backend #security !urgent ^tomorrow @michael ~2h"
 */
export function parseQuickTask(input: string, baseDate: Date = new Date()): QuickParseResult {
  const raw = input.trim();
  if (!raw) {
    return {
      title: '',
      tags: [],
      priority: 'none'
    };
  }

  const tags: string[] = [];
  let priority: TaskPriority = 'none';
  let dueDate: string | undefined = undefined;
  let assignee: string | undefined = undefined;
  let estimateMinutes: number | undefined = undefined;

  // Split tokens by whitespace while preserving remainder for title
  const words = raw.split(/\s+/);
  const remainingWords: string[] = [];

  for (const word of words) {
    // 1. Tags: #tag or #tag-name
    if (word.startsWith('#') && word.length > 1) {
      const tag = word.slice(1).toLowerCase().replace(/[^a-z0-9_-]/g, '');
      if (tag) {
        tags.push(tag);
        continue;
      }
    }

    // 2. Priority: !urgent, !high, !med, !medium, !low, !none
    if (word.startsWith('!') && word.length > 1) {
      const prioStr = word.slice(1).toLowerCase();
      if (prioStr === 'urgent' || prioStr === 'critical') {
        priority = 'urgent';
        continue;
      } else if (prioStr === 'high' || prioStr === 'h') {
        priority = 'high';
        continue;
      } else if (prioStr === 'med' || prioStr === 'medium' || prioStr === 'm') {
        priority = 'medium';
        continue;
      } else if (prioStr === 'low' || prioStr === 'l') {
        priority = 'low';
        continue;
      } else if (prioStr === 'none') {
        priority = 'none';
        continue;
      }
    }

    // 3. Assignee: @username
    if (word.startsWith('@') && word.length > 1) {
      assignee = word.slice(1).replace(/[^a-zA-Z0-9_.-]/g, '');
      continue;
    }

    // 4. Estimate: ~30m, ~2h, ~1.5h, ~4pt
    if (word.startsWith('~') && word.length > 1) {
      const estStr = word.slice(1).toLowerCase();
      const matchHours = estStr.match(/^([\d.]+)h$/);
      const matchMinutes = estStr.match(/^(\d+)m$/);
      const matchPoints = estStr.match(/^(\d+)pt$/);

      if (matchHours) {
        const hours = parseFloat(matchHours[1]);
        if (!isNaN(hours)) {
          estimateMinutes = Math.round(hours * 60);
          continue;
        }
      } else if (matchMinutes) {
        const mins = parseInt(matchMinutes[1], 10);
        if (!isNaN(mins)) {
          estimateMinutes = mins;
          continue;
        }
      } else if (matchPoints) {
        // Interpret points as ~1h per point for estimation
        const pts = parseInt(matchPoints[1], 10);
        if (!isNaN(pts)) {
          estimateMinutes = pts * 60;
          continue;
        }
      }
    }

    // 5. Due date: ^today, ^tomorrow, ^mon, ^tue, ^wed, ^thu, ^fri, ^sat, ^sun, ^YYYY-MM-DD
    if (word.startsWith('^') && word.length > 1) {
      const dateToken = word.slice(1).toLowerCase();
      const parsedDate = parseDateToken(dateToken, baseDate);
      if (parsedDate) {
        dueDate = parsedDate.toISOString();
        continue;
      }
    }

    // Otherwise, it is part of the task title
    remainingWords.push(word);
  }

  const title = remainingWords.join(' ').trim() || 'Untitled Task';

  return {
    title,
    tags,
    priority,
    dueDate,
    assignee,
    estimateMinutes
  };
}

function parseDateToken(token: string, baseDate: Date): Date | null {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const date = baseDate.getDate();

  if (token === 'today') {
    const d = new Date(year, month, date, 23, 59, 59);
    return d;
  }

  if (token === 'tomorrow' || token === 'tmrw') {
    const d = new Date(year, month, date + 1, 23, 59, 59);
    return d;
  }

  const daysOfWeek: Record<string, number> = {
    sun: 0, sunday: 0,
    mon: 1, monday: 1,
    tue: 2, tuesday: 2,
    wed: 3, wednesday: 3,
    thu: 4, thursday: 4,
    fri: 5, friday: 5,
    sat: 6, saturday: 6
  };

  if (token in daysOfWeek) {
    const targetDay = daysOfWeek[token];
    const currentDay = baseDate.getDay();
    let diff = targetDay - currentDay;
    if (diff <= 0) diff += 7; // Next occurrence
    const d = new Date(year, month, date + diff, 23, 59, 59);
    return d;
  }

  // ISO date format YYYY-MM-DD
  const isoMatch = token.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const d = new Date(y, m, day, 23, 59, 59);
    if (!isNaN(d.getTime())) {
      return d;
    }
  }

  return null;
}
