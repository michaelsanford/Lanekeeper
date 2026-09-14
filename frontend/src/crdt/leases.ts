interface StoredLease {
  prefix: string;
  current: number;
  end: number;
}

const LEASE_STORAGE_KEY = 'lanekeeper_id_leases';
let inMemoryLeases: Record<string, StoredLease> = {};

function getStoredLeases(): Record<string, StoredLease> {
  if (typeof localStorage === 'undefined') {
    return inMemoryLeases;
  }
  try {
    const raw = localStorage.getItem(LEASE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : inMemoryLeases;
  } catch {
    return inMemoryLeases;
  }
}

function saveStoredLeases(leases: Record<string, StoredLease>): void {
  inMemoryLeases = leases;
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(LEASE_STORAGE_KEY, JSON.stringify(leases));
  } catch (err) {
    console.warn('Failed to persist lease to localStorage:', err);
  }
}

export function saveLeaseBlock(prefix: string, start: number, end: number): void {
  const leases = getStoredLeases();
  leases[prefix] = {
    prefix,
    current: start,
    end
  };
  saveStoredLeases(leases);
}

export function getNextTaskKey(prefix: string): string {
  const leases = getStoredLeases();
  const lease = leases[prefix];

  if (lease && lease.current <= lease.end) {
    const key = `${prefix}-${lease.current}`;
    lease.current++;
    saveStoredLeases(leases);
    return key;
  }

  // Fallback temporary key when offline lease is exhausted
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-temp-${randomSuffix}`;
}

export function hasRemainingLease(prefix: string): boolean {
  const leases = getStoredLeases();
  const lease = leases[prefix];
  return !!(lease && lease.current <= lease.end);
}
