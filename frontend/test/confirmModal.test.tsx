import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ConfirmModal } from '../src/components/common/ConfirmModal.js';

describe('ConfirmModal Component', () => {
  it('renders confirmation title, message, and action buttons', () => {
    const html = renderToString(
      <ConfirmModal
        isOpen={true}
        title="Delete task LK-42?"
        message="Are you sure you want to delete this task? This cannot be undone."
        confirmLabel="Delete Task"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(html).toContain('Delete task LK-42?');
    expect(html).toContain('Are you sure you want to delete this task? This cannot be undone.');
    expect(html).toContain('Delete Task');
    expect(html).toContain('Cancel');
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('id="confirm-modal-title"');
    expect(html).toContain('id="confirm-modal-desc"');
  });

  it('renders nothing when isOpen is false', () => {
    const html = renderToString(
      <ConfirmModal
        isOpen={false}
        title="Delete task LK-42?"
        message="Are you sure?"
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(html).toBe('');
  });

  it('supports warning and info variants with default labels', () => {
    const warningHtml = renderToString(
      <ConfirmModal
        isOpen={true}
        title="Apply template?"
        message="This will remap existing lanes."
        variant="warning"
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(warningHtml).toContain('Confirm');
    expect(warningHtml).toContain('Apply template?');

    const infoHtml = renderToString(
      <ConfirmModal
        isOpen={true}
        title="Sync status"
        message="Information update."
        variant="info"
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(infoHtml).toContain('Sync status');
  });
});
