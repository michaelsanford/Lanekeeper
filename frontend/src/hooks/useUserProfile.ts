import { useState, useEffect, useCallback } from 'react';
import type { UserProfile, AuthSession } from '../types/index.js';

export const USER_PROFILE_STORAGE_KEY = 'lanekeeper_user_profile';
export const USER_PROFILE_CHANGE_EVENT = 'lanekeeper_user_profile_change';

export const DEFAULT_SCOPES = [
  'tasks:read',
  'tasks:write',
  'sync:rw',
  'leases:issue'
];

export function deriveHandleFromEmail(email: string): string {
  if (!email) return 'user';
  const prefix = email.split('@')[0].split('+')[0];
  return prefix.replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase();
}

export function getInitials(name: string, email?: string): string {
  const cleanName = (name || '').trim();
  if (cleanName) {
    const parts = cleanName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (parts.length === 1 && parts[0].length >= 2) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (parts.length === 1) {
      return parts[0][0].toUpperCase();
    }
  }
  if (email) {
    const handle = deriveHandleFromEmail(email);
    return handle.slice(0, 2).toUpperCase();
  }
  return 'LK';
}

const DEFAULT_PROFILE: UserProfile = {
  id: 'dev-user-01',
  email: 'michaelsanford@users.noreply.github.com',
  displayName: 'Michael Sanford',
  gitAuthorName: 'Michael Sanford',
  gitAuthorEmail: 'michaelsanford@users.noreply.github.com',
  defaultAssigneeHandle: 'michaelsanford',
  dailyFocusTargetMinutes: 240,
  mfaEnabled: false,
  provider: 'local',
  tokenScopes: DEFAULT_SCOPES,
  cliToken: 'lk_dev_seed_token'
};

export function loadStoredProfile(): UserProfile {
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_PROFILE,
          ...parsed,
          tokenScopes: parsed.tokenScopes || DEFAULT_SCOPES
        };
      }
    } catch {}
  }
  return DEFAULT_PROFILE;
}

export function saveStoredProfile(profile: UserProfile): void {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(profile));
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent(USER_PROFILE_CHANGE_EVENT, { detail: profile }));
      }
    } catch {}
  }
}

export function useUserProfile(authSession?: AuthSession | null) {
  const [profile, setProfile] = useState<UserProfile>(() => loadStoredProfile());

  // Synchronize profile with Cognito auth session when available
  useEffect(() => {
    if (authSession?.email) {
      setProfile((prev) => {
        const isCognito = authSession.accessToken && authSession.accessToken !== 'mock-access-token';
        const updated: UserProfile = {
          ...prev,
          id: authSession.userId || prev.id,
          email: authSession.email,
          provider: isCognito ? 'cognito' : 'local',
          mfaEnabled: Boolean(isCognito)
        };
        saveStoredProfile(updated);
        return updated;
      });
    }
  }, [authSession]);

  // Listen for storage events across tabs and windows
  useEffect(() => {
    const handleStorageChange = () => {
      setProfile(loadStoredProfile());
    };
    window.addEventListener(USER_PROFILE_CHANGE_EVENT, handleStorageChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener(USER_PROFILE_CHANGE_EVENT, handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile((prev) => {
      const updated: UserProfile = {
        ...prev,
        ...updates
      };
      // If email updated and handle was default or unset, re-derive handle
      if (updates.email && (!updates.defaultAssigneeHandle || updates.defaultAssigneeHandle === prev.defaultAssigneeHandle)) {
        updated.defaultAssigneeHandle = deriveHandleFromEmail(updates.email);
      }
      saveStoredProfile(updated);
      return updated;
    });
  }, []);

  const generateCliToken = useCallback(() => {
    const randomHex = Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    const newToken = `lk_live_${randomHex}`;
    updateProfile({ cliToken: newToken });
    return newToken;
  }, [updateProfile]);

  return {
    profile,
    updateProfile,
    generateCliToken,
    initials: getInitials(profile.displayName, profile.email)
  };
}
