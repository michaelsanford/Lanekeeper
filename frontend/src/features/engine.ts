export type FeatureFlagId = 'timeTracking' | 'doneLaneArchiving';

export type FeatureFlagCategory = 'productivity' | 'experimental' | 'collaboration' | 'appearance';
export type FeatureFlagStage = 'alpha' | 'beta' | 'stable' | 'preview';

export interface FeatureFlagDefinition {
  id: FeatureFlagId;
  name: string;
  description: string;
  defaultValue: boolean;
  category: FeatureFlagCategory;
  stage?: FeatureFlagStage;
}

export const FEATURE_DEFINITIONS: Record<FeatureFlagId, FeatureFlagDefinition> = {
  timeTracking: {
    id: 'timeTracking',
    name: 'Time Tracking & Session Timers',
    description: 'Enables interactive task session timers, focus cockpit stopwatch controls, and cumulative time-spent tracking across cards and tables.',
    defaultValue: false,
    category: 'productivity',
    stage: 'stable'
  },
  doneLaneArchiving: {
    id: 'doneLaneArchiving',
    name: 'Done Lane Auto-Archive & Clean Up',
    description: 'Clean up completed swimlanes by archiving tasks older than a configurable number of days. Preserves data in Table View.',
    defaultValue: false,
    category: 'productivity',
    stage: 'stable'
  }
};

export const FEATURE_STORAGE_KEY = 'lanekeeper_feature_flags';
export const FEATURE_CHANGE_EVENT = 'lanekeeper_feature_flags_change';

export const ARCHIVE_DAYS_STORAGE_KEY = 'lanekeeper_archive_threshold_days';
export const ARCHIVE_DAYS_CHANGE_EVENT = 'lanekeeper_archive_days_change';
const DEFAULT_ARCHIVE_THRESHOLD_DAYS = 7;
let inMemoryArchiveDays: number | null = null;

export function getArchiveThresholdDays(): number {
  if (typeof localStorage !== 'undefined') {
    try {
      const val = localStorage.getItem(ARCHIVE_DAYS_STORAGE_KEY);
      if (val !== null) {
        const parsed = parseInt(val, 10);
        if (!isNaN(parsed) && parsed >= 0) {
          return parsed;
        }
      }
    } catch {}
  }
  return inMemoryArchiveDays ?? DEFAULT_ARCHIVE_THRESHOLD_DAYS;
}

export function setArchiveThresholdDays(days: number): void {
  const safeDays = Math.max(0, Math.floor(days));
  inMemoryArchiveDays = safeDays;
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(ARCHIVE_DAYS_STORAGE_KEY, safeDays.toString());
    } catch {}
  }
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent(ARCHIVE_DAYS_CHANGE_EVENT, { detail: safeDays }));
    } catch {}
  }
}

let inMemoryStore: Record<string, boolean> = {};

/**
 * Checks URL query parameters for temporary flag overrides.
 * Supports ?ff_<flagId>=true/false/1/0 or ?feature_<flagId>=true/false/1/0
 */
export function getUrlFlagOverride(id: FeatureFlagId, searchString?: string): boolean | null {
  let search = searchString;
  if (search === undefined && typeof window !== 'undefined' && window.location) {
    search = window.location.search;
  }
  if (!search) return null;
  try {
    const params = new URLSearchParams(search);
    const val = params.get(`ff_${id}`) ?? params.get(`feature_${id}`);
    if (val === null) return null;
    const lower = val.trim().toLowerCase();
    if (lower === 'true' || lower === '1' || lower === 'on') return true;
    if (lower === 'false' || lower === '0' || lower === 'off') return false;
  } catch {}
  return null;
}

/**
 * Reads stored flag preferences from localStorage or in-memory fallback.
 */
export function getStoredFlags(): Record<string, boolean> {
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(FEATURE_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
  }
  return { ...inMemoryStore };
}

/**
 * Saves flag preferences to localStorage and dispatches change event.
 */
export function saveStoredFlags(flags: Record<string, boolean>): void {
  inMemoryStore = { ...flags };

  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(FEATURE_STORAGE_KEY, JSON.stringify(flags));
    } catch {}
  }

  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent(FEATURE_CHANGE_EVENT, { detail: flags }));
    } catch {}
  }
}

/**
 * Gets the effective state of a feature flag, accounting for URL overrides,
 * localStorage preferences, and default values.
 */
export function isFeatureEnabled(id: FeatureFlagId, urlSearch?: string): boolean {
  const urlOverride = getUrlFlagOverride(id, urlSearch);
  if (urlOverride !== null) return urlOverride;

  const stored = getStoredFlags();
  if (typeof stored[id] === 'boolean') {
    return stored[id];
  }

  const def = FEATURE_DEFINITIONS[id];
  return def ? def.defaultValue : false;
}

/**
 * Gets all effective flags mapped to boolean states.
 */
export function getAllFeatureFlags(urlSearch?: string): Record<FeatureFlagId, boolean> {
  const result = {} as Record<FeatureFlagId, boolean>;
  for (const key of Object.keys(FEATURE_DEFINITIONS) as FeatureFlagId[]) {
    result[key] = isFeatureEnabled(key, urlSearch);
  }
  return result;
}

/**
 * Sets a specific feature flag state.
 */
export function setFeatureFlag(id: FeatureFlagId, enabled: boolean): void {
  const stored = getStoredFlags();
  stored[id] = enabled;
  saveStoredFlags(stored);
}

/**
 * Toggles a feature flag and returns the new state.
 */
export function toggleFeatureFlag(id: FeatureFlagId): boolean {
  const current = isFeatureEnabled(id);
  const next = !current;
  setFeatureFlag(id, next);
  return next;
}

/**
 * Resets all feature flags back to their default values.
 */
export function resetAllFeatureFlags(): void {
  inMemoryStore = {};
  inMemoryArchiveDays = null;
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(FEATURE_STORAGE_KEY);
      localStorage.removeItem(ARCHIVE_DAYS_STORAGE_KEY);
    } catch {}
  }
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent(FEATURE_CHANGE_EVENT, { detail: {} }));
      window.dispatchEvent(new CustomEvent(ARCHIVE_DAYS_CHANGE_EVENT, { detail: DEFAULT_ARCHIVE_THRESHOLD_DAYS }));
    } catch {}
  }
}

/**
 * Returns all registered flag definitions.
 */
export function getAllFeatureDefinitions(): FeatureFlagDefinition[] {
  return Object.values(FEATURE_DEFINITIONS);
}
