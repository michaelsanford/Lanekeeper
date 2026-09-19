import type { QuickParseResult, TaskPriority } from '../types/index.js';

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

  const words = raw.split(/\s+/);
  const remainingWords: string[] = [];

  for (const word of words) {
    if (word.startsWith('#') && word.length > 1) {
      const tag = word.slice(1).toLowerCase().replace(/[^a-z0-9_-]/g, '');
      if (tag) {
        tags.push(tag);
        continue;
      }
    }

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

    if (word.startsWith('@') && word.length > 1) {
      assignee = word.slice(1).replace(/[^a-zA-Z0-9_.-]/g, '');
      continue;
    }

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
        const pts = parseInt(matchPoints[1], 10);
        if (!isNaN(pts)) {
          estimateMinutes = pts * 60;
          continue;
        }
      }
    }

    if (word.startsWith('^') && word.length > 1) {
      const dateToken = word.slice(1).toLowerCase();
      const parsedDate = parseDateToken(dateToken, baseDate);
      if (parsedDate) {
        dueDate = parsedDate.toISOString();
        continue;
      }
    }

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

const MONTH_NAMES: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11
};

export function parseDateToken(token: string, baseDate: Date = new Date()): Date | null {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const date = baseDate.getDate();

  if (token === 'today') {
    return new Date(year, month, date, 23, 59, 59);
  }

  if (token === 'tomorrow' || token === 'tmrw') {
    return new Date(year, month, date + 1, 23, 59, 59);
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
    if (diff <= 0) diff += 7;
    return new Date(year, month, date + diff, 23, 59, 59);
  }

  // ISO format: YYYY-MM-DD or YYYY-M-D (with - or /)
  const isoMatch = token.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const d = new Date(y, m, day, 23, 59, 59);
    if (!isNaN(d.getTime()) && d.getMonth() === m && d.getDate() === day) {
      return d;
    }
  }

  // Month-Day format: e.g. apr-04, apr-4, november-14, apr-04-2027
  const monthDayMatch = token.match(/^([a-z]{3,9})[-/](\d{1,2})(?:[-/](\d{4}))?$/);
  if (monthDayMatch) {
    const mStr = monthDayMatch[1];
    if (mStr in MONTH_NAMES) {
      const mIndex = MONTH_NAMES[mStr];
      const day = parseInt(monthDayMatch[2], 10);
      const explicitYear = monthDayMatch[3] ? parseInt(monthDayMatch[3], 10) : undefined;

      const targetYear =
        explicitYear !== undefined
          ? explicitYear
          : new Date(year, mIndex, day, 23, 59, 59).getTime() < baseDate.getTime()
          ? year + 1
          : year;

      const candidate = new Date(targetYear, mIndex, day, 23, 59, 59);
      if (!isNaN(candidate.getTime()) && candidate.getMonth() === mIndex && candidate.getDate() === day) {
        return candidate;
      }
    }
  }

  // Day-Month format: e.g. 04-apr, 4-apr, 14-november, 04-apr-2027
  const dayMonthMatch = token.match(/^(\d{1,2})[-/]([a-z]{3,9})(?:[-/](\d{4}))?$/);
  if (dayMonthMatch) {
    const mStr = dayMonthMatch[2];
    if (mStr in MONTH_NAMES) {
      const mIndex = MONTH_NAMES[mStr];
      const day = parseInt(dayMonthMatch[1], 10);
      const explicitYear = dayMonthMatch[3] ? parseInt(dayMonthMatch[3], 10) : undefined;

      const targetYear =
        explicitYear !== undefined
          ? explicitYear
          : new Date(year, mIndex, day, 23, 59, 59).getTime() < baseDate.getTime()
          ? year + 1
          : year;

      const candidate = new Date(targetYear, mIndex, day, 23, 59, 59);
      if (!isNaN(candidate.getTime()) && candidate.getMonth() === mIndex && candidate.getDate() === day) {
        return candidate;
      }
    }
  }

  return null;
}
