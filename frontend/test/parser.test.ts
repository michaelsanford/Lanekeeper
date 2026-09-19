import { describe, it, expect } from 'vitest';
import { parseQuickTask, parseDateToken } from '../src/utils/parser.js';

describe('Frontend Quick Task Ingestion Parser', () => {
  const fixedBaseDate = new Date('2026-09-15T12:00:00Z');

  it('parses title, tags, priority, assignee, estimate, and due date', () => {
    const input = 'Optimize database connection pool #infra !high ^2026-11-04 @michael ~45m';
    const res = parseQuickTask(input, fixedBaseDate);

    expect(res.title).toBe('Optimize database connection pool');
    expect(res.tags).toEqual(['infra']);
    expect(res.priority).toBe('high');
    expect(res.assignee).toBe('michael');
    expect(res.estimateMinutes).toBe(45);
    expect(res.dueDate).toBeDefined();

    const d = new Date(res.dueDate!);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(10); // Nov
    expect(d.getDate()).toBe(4);
  });

  it('parses month-day format ^apr-04 with rollover for past dates', () => {
    // Current base is Sep 15, 2026. apr-04 has already passed in 2026, so advances to 2027.
    const resPast = parseQuickTask('Filing taxes ^apr-04', fixedBaseDate);
    expect(resPast.dueDate).toBeDefined();
    const dPast = new Date(resPast.dueDate!);
    expect(dPast.getFullYear()).toBe(2027);
    expect(dPast.getMonth()).toBe(3); // April
    expect(dPast.getDate()).toBe(4);
  });

  it('parses month-day format ^nov-04 for future dates in current year', () => {
    const resFuture = parseQuickTask('Product launch ^nov-04', fixedBaseDate);
    expect(resFuture.dueDate).toBeDefined();
    const dFuture = new Date(resFuture.dueDate!);
    expect(dFuture.getFullYear()).toBe(2026);
    expect(dFuture.getMonth()).toBe(10); // Nov
    expect(dFuture.getDate()).toBe(4);
  });

  it('supports explicit year in month-day tokens', () => {
    const d = parseDateToken('apr-04-2026', fixedBaseDate);
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2026);
    expect(d!.getMonth()).toBe(3);
    expect(d!.getDate()).toBe(4);
  });

  it('supports day-month format', () => {
    const d = parseDateToken('04-apr', fixedBaseDate);
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2027);
    expect(d!.getMonth()).toBe(3);
    expect(d!.getDate()).toBe(4);
  });

  it('returns null for impossible calendar dates', () => {
    expect(parseDateToken('feb-31', fixedBaseDate)).toBeNull();
    expect(parseDateToken('jun-31', fixedBaseDate)).toBeNull();
  });
});
