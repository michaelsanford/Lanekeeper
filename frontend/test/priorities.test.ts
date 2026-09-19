import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { PRIORITY_CONFIG, ORDERED_PRIORITIES, getPriorityConfig } from '../src/utils/priorities.js';
import { PriorityBadge } from '../src/components/common/PriorityBadge.js';
import { QuickCaptureModal, applySuggestion } from '../src/components/capture/QuickCaptureModal.js';
import type { TaskPriority } from '../src/types/index.js';

describe('Priorities Configuration and Helpers', () => {
  it('defines distinct icons, labels, and descending weights for priorities', () => {
    expect(PRIORITY_CONFIG.urgent.label).toBe('Urgent');
    expect(PRIORITY_CONFIG.high.label).toBe('High');
    expect(PRIORITY_CONFIG.medium.label).toBe('Medium');
    expect(PRIORITY_CONFIG.low.label).toBe('Low');
    expect(PRIORITY_CONFIG.none.label).toBe('None');

    expect(PRIORITY_CONFIG.urgent.weight).toBeGreaterThan(PRIORITY_CONFIG.high.weight);
    expect(PRIORITY_CONFIG.high.weight).toBeGreaterThan(PRIORITY_CONFIG.medium.weight);
    expect(PRIORITY_CONFIG.medium.weight).toBeGreaterThan(PRIORITY_CONFIG.low.weight);
    expect(PRIORITY_CONFIG.low.weight).toBeGreaterThan(PRIORITY_CONFIG.none.weight);

    expect(PRIORITY_CONFIG.urgent.icon).toBeDefined();
    expect(PRIORITY_CONFIG.high.icon).toBeDefined();
    expect(PRIORITY_CONFIG.medium.icon).toBeDefined();
    expect(PRIORITY_CONFIG.low.icon).toBeDefined();
    expect(PRIORITY_CONFIG.none.icon).toBeDefined();
  });

  it('orders active priorities in ORDERED_PRIORITIES', () => {
    expect(ORDERED_PRIORITIES).toEqual(['urgent', 'high', 'medium', 'low']);
  });

  it('getPriorityConfig returns matching config or none fallback', () => {
    expect(getPriorityConfig('urgent').label).toBe('Urgent');
    expect(getPriorityConfig('none').label).toBe('None');
    // @ts-expect-error test fallback for unknown priority
    expect(getPriorityConfig('unknown' as TaskPriority).label).toBe('None');
  });
});

describe('PriorityBadge Component', () => {
  it('renders badge with icon and label for active priorities', () => {
    const priorities: TaskPriority[] = ['urgent', 'high', 'medium', 'low'];
    for (const prio of priorities) {
      const html = renderToString(React.createElement(PriorityBadge, { priority: prio }));
      expect(html).toContain(PRIORITY_CONFIG[prio].label);
      expect(html).toContain(`Priority: ${PRIORITY_CONFIG[prio].label}`);
      expect(html).toContain('<svg');
    }
  });

  it('renders nothing when priority is none', () => {
    const html = renderToString(React.createElement(PriorityBadge, { priority: 'none' }));
    expect(html).toBe('');
  });

  it('supports hiding the label for icon-only representation', () => {
    const html = renderToString(
      React.createElement(PriorityBadge, { priority: 'urgent', showLabel: false })
    );
    expect(html).toContain('<svg');
    expect(html).toContain('Priority: Urgent');
    expect(html).not.toContain('<span>Urgent</span>');
  });

  it('supports size variants sm and md', () => {
    const smHtml = renderToString(
      React.createElement(PriorityBadge, { priority: 'high', size: 'sm' })
    );
    const mdHtml = renderToString(
      React.createElement(PriorityBadge, { priority: 'high', size: 'md' })
    );

    expect(smHtml).toContain('text-[11px]');
    expect(mdHtml).toContain('text-xs');
  });
});

describe('Quick Capture applySuggestion', () => {
  it('appends prefix trigger without trailing space so suggestions activate immediately', () => {
    const result = applySuggestion('Deploy API', 10, '^');
    expect(result.newText).toBe('Deploy API ^');
    expect(result.newCaretPos).toBe(12);
  });

  it('appends prefix trigger from empty input', () => {
    const result = applySuggestion('', 0, '!');
    expect(result.newText).toBe('!');
    expect(result.newCaretPos).toBe(1);
  });

  it('replaces active trigger at end of input with macro and trailing space', () => {
    const result = applySuggestion('Fix bug ^', 9, '^tomorrow');
    expect(result.newText).toBe('Fix bug ^tomorrow ');
    expect(result.newCaretPos).toBe(18);
  });

  it('replaces partially typed token before caret', () => {
    const result = applySuggestion('Refactor auth !urg', 18, '!urgent');
    expect(result.newText).toBe('Refactor auth !urgent ');
    expect(result.newCaretPos).toBe(22);
  });

  it('handles replacement in middle of string without duplicating spaces', () => {
    const result = applySuggestion('Fix ^tom before release', 8, '^tomorrow');
    expect(result.newText).toBe('Fix ^tomorrow before release');
    expect(result.newCaretPos).toBe(14);
  });
});

describe('QuickCaptureModal Component', () => {
  it('renders title, input, preview, and token insertion controls', () => {
    const html = renderToString(
      React.createElement(QuickCaptureModal, {
        isOpen: true,
        onClose: vi.fn(),
        onSubmitTask: vi.fn(),
        availableTags: ['auth', 'billing']
      })
    );

    expect(html).toContain('Quick Task Ingestion');
    expect(html).toContain('Type a task title...');
    expect(html).toContain('Insert:');
    expect(html).toContain('^ due');
    expect(html).toContain('! priority');
    expect(html).toContain('~ estimate');
    expect(html).toContain('# tag');
    expect(html).toContain('@ user');
    expect(html).toContain('Syntax Guide');
    expect(html).toContain('Create Task');
  });

  it('renders nothing when closed', () => {
    const html = renderToString(
      React.createElement(QuickCaptureModal, {
        isOpen: false,
        onClose: vi.fn(),
        onSubmitTask: vi.fn()
      })
    );
    expect(html).toBe('');
  });
});
