import type { Task } from '../types/index.js';

const BUCKET = '0';
const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz';
const INITIAL_RANK = `${BUCKET}|h00000:`;

/**
 * Extracts normalized base-36 lexical rank characters from envelope (e.g. "0|h00000:" -> "h00000").
 */
export function parseRank(rank?: string): string {
  if (!rank) return '';
  const match = rank.match(/^[0-9]\|([^:]*):?$/);
  const raw = match ? match[1] : rank;
  return raw.toLowerCase().replace(/[^0-9a-z]/g, '');
}

/**
 * Formats a raw lexical rank string into standard Jira-compatible Lexorank envelope ("0|value:").
 */
export function formatRank(value: string): string {
  return `${BUCKET}|${value}:`;
}

/**
 * Generates a lexical rank string strictly before the provided rank.
 */
export function getRankBefore(next: string): string {
  const n = parseRank(next);
  if (!n) return 'h00000';

  const firstIdx = DIGITS.indexOf(n[0]);
  if (firstIdx > 1) {
    const mid = Math.floor(firstIdx / 2);
    return DIGITS[mid];
  }
  if (firstIdx === 1) {
    return '0i';
  }

  // If n starts with '0', find the first non-zero digit
  let leadingZeros = 0;
  while (leadingZeros < n.length && n[leadingZeros] === '0') {
    leadingZeros++;
  }

  if (leadingZeros === n.length) {
    return '0' + n + 'i';
  }

  const nextCharIdx = DIGITS.indexOf(n[leadingZeros]);
  const zeros = '0'.repeat(leadingZeros);
  if (nextCharIdx > 1) {
    const mid = Math.floor(nextCharIdx / 2);
    return zeros + DIGITS[mid];
  }
  return zeros + '0i';
}

/**
 * Generates a lexical rank string strictly after the provided rank.
 */
export function getRankAfter(prev: string): string {
  const p = parseRank(prev);
  if (!p) return 'h00000';

  const firstIdx = DIGITS.indexOf(p[0]);
  if (firstIdx !== -1 && firstIdx < 35) {
    const mid = firstIdx + Math.max(1, Math.floor((DIGITS.length - firstIdx) / 2));
    if (mid < DIGITS.length) {
      return DIGITS[mid];
    }
  }

  return p + 'i';
}

/**
 * Generates a lexical string strictly between two base-36 strings where a < b.
 */
export function getRankBetweenStrings(a: string, b: string): string {
  if (a >= b) {
    return a + 'i';
  }

  let prefix = '';
  let i = 0;

  while (true) {
    const digitA = i < a.length ? DIGITS.indexOf(a[i]) : 0;
    const digitB = i < b.length ? DIGITS.indexOf(b[i]) : DIGITS.length;

    if (digitA === digitB) {
      prefix += DIGITS[digitA];
      i++;
      continue;
    }

    if (digitB - digitA > 1) {
      const mid = Math.floor((digitA + digitB) / 2);
      return prefix + DIGITS[mid];
    }

    // digitB - digitA === 1: append digitA and find something greater than the rest of a
    prefix += DIGITS[digitA];
    i++;

    while (i < a.length) {
      const d = DIGITS.indexOf(a[i]);
      if (d < DIGITS.length - 1) {
        const mid = d + Math.max(1, Math.floor((DIGITS.length - d) / 2));
        return prefix + DIGITS[mid];
      }
      prefix += a[i];
      i++;
    }

    return prefix + 'i';
  }
}

/**
 * Calculates a new lexical rank strictly between prevRank and nextRank.
 * Handles head insertion (prevRank undefined), tail insertion (nextRank undefined),
 * and middle insertion (prevRank and nextRank both defined).
 */
export function getRankBetween(prevRank?: string, nextRank?: string): string {
  const p = parseRank(prevRank);
  const n = parseRank(nextRank);

  if (!p && !n) {
    return INITIAL_RANK;
  }

  if (!p && n) {
    return formatRank(getRankBefore(n));
  }

  if (p && !n) {
    return formatRank(getRankAfter(p));
  }

  return formatRank(getRankBetweenStrings(p, n));
}

/**
 * Sorts tasks within a lane deterministically by their rank, with fallbacks to creation time and ID.
 */
export function sortTasksByRank(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const rankA = a.rank || '';
    const rankB = b.rank || '';
    if (rankA !== rankB) {
      return rankA.localeCompare(rankB);
    }
    if (a.createdAt !== b.createdAt) {
      return a.createdAt.localeCompare(b.createdAt);
    }
    return a.id.localeCompare(b.id);
  });
}
