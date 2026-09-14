import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  type FeatureFlagId,
  type FeatureFlagDefinition,
  FEATURE_CHANGE_EVENT,
  getAllFeatureFlags,
  getAllFeatureDefinitions,
  isFeatureEnabled,
  setFeatureFlag,
  toggleFeatureFlag,
  resetAllFeatureFlags
} from './engine.js';

export interface FeatureGateContextValue {
  flags: Record<FeatureFlagId, boolean>;
  definitions: FeatureFlagDefinition[];
  isEnabled: (id: FeatureFlagId) => boolean;
  setFlag: (id: FeatureFlagId, enabled: boolean) => void;
  toggleFlag: (id: FeatureFlagId) => boolean;
  resetFlags: () => void;
}

const FeatureGateContext = createContext<FeatureGateContextValue | null>(null);

export interface FeatureGateProviderProps {
  children: React.ReactNode;
  initialFlags?: Partial<Record<FeatureFlagId, boolean>>;
}

export const FeatureGateProvider: React.FC<FeatureGateProviderProps> = ({ children, initialFlags }) => {
  const [flags, setFlags] = useState<Record<FeatureFlagId, boolean>>(() => {
    const current = getAllFeatureFlags();
    if (initialFlags) {
      return { ...current, ...initialFlags };
    }
    return current;
  });

  // Synchronize state with storage and cross-tab/window events
  useEffect(() => {
    const handleUpdate = () => {
      setFlags(getAllFeatureFlags());
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(FEATURE_CHANGE_EVENT, handleUpdate);
      window.addEventListener('storage', handleUpdate);
      return () => {
        window.removeEventListener(FEATURE_CHANGE_EVENT, handleUpdate);
        window.removeEventListener('storage', handleUpdate);
      };
    }
  }, []);

  const isEnabled = useCallback(
    (id: FeatureFlagId): boolean => {
      return flags[id] ?? isFeatureEnabled(id);
    },
    [flags]
  );

  const handleSetFlag = useCallback((id: FeatureFlagId, enabled: boolean) => {
    setFeatureFlag(id, enabled);
    setFlags((prev) => ({ ...prev, [id]: enabled }));
  }, []);

  const handleToggleFlag = useCallback((id: FeatureFlagId): boolean => {
    const next = toggleFeatureFlag(id);
    setFlags((prev) => ({ ...prev, [id]: next }));
    return next;
  }, []);

  const handleResetFlags = useCallback(() => {
    resetAllFeatureFlags();
    setFlags(getAllFeatureFlags());
  }, []);

  const definitions = useMemo(() => getAllFeatureDefinitions(), []);

  const value = useMemo(
    () => ({
      flags,
      definitions,
      isEnabled,
      setFlag: handleSetFlag,
      toggleFlag: handleToggleFlag,
      resetFlags: handleResetFlags
    }),
    [flags, definitions, isEnabled, handleSetFlag, handleToggleFlag, handleResetFlags]
  );

  return (
    <FeatureGateContext.Provider value={value}>
      {children}
    </FeatureGateContext.Provider>
  );
};

export function useFeatureGate(): FeatureGateContextValue {
  const ctx = useContext(FeatureGateContext);
  if (!ctx) {
    // Graceful fallback for components rendered outside provider
    return {
      flags: getAllFeatureFlags(),
      definitions: getAllFeatureDefinitions(),
      isEnabled: (id: FeatureFlagId) => isFeatureEnabled(id),
      setFlag: (id: FeatureFlagId, val: boolean) => setFeatureFlag(id, val),
      toggleFlag: (id: FeatureFlagId) => toggleFeatureFlag(id),
      resetFlags: () => resetAllFeatureFlags()
    };
  }
  return ctx;
}

export interface FeatureGateProps {
  flag: FeatureFlagId;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({ flag, children, fallback = null }) => {
  const { isEnabled } = useFeatureGate();
  return isEnabled(flag) ? <>{children}</> : <>{fallback}</>;
};
