import { describe, it, expect, vi } from 'vitest';
import { saveLeaseBlock, getNextTaskKey, onLeaseDegraded } from '../src/crdt/leases.js';

describe('offline lease degradation signal', () => {
  it('does not fire while the lease still has remaining capacity', () => {
    saveLeaseBlock('DEG', 1, 3);
    const listener = vi.fn();
    const unsubscribe = onLeaseDegraded(listener);

    getNextTaskKey('DEG');
    getNextTaskKey('DEG');
    getNextTaskKey('DEG');

    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it('fires with the exhausted prefix once the lease runs out', () => {
    saveLeaseBlock('DEG2', 1, 1);
    const listener = vi.fn();
    const unsubscribe = onLeaseDegraded(listener);

    getNextTaskKey('DEG2'); // consumes the only reserved key
    expect(listener).not.toHaveBeenCalled();

    const fallbackKey = getNextTaskKey('DEG2'); // now exhausted
    expect(listener).toHaveBeenCalledWith('DEG2');
    expect(fallbackKey).toMatch(/^DEG2-temp-\d+$/);
    unsubscribe();
  });

  it('unsubscribing stops further notifications', () => {
    saveLeaseBlock('DEG3', 1, 0); // already exhausted
    const listener = vi.fn();
    const unsubscribe = onLeaseDegraded(listener);
    unsubscribe();

    getNextTaskKey('DEG3');

    expect(listener).not.toHaveBeenCalled();
  });
});
