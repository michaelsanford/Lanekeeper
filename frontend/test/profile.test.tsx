import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  deriveHandleFromEmail,
  getInitials,
  loadStoredProfile,
  saveStoredProfile,
  DEFAULT_SCOPES,
  USER_PROFILE_STORAGE_KEY,
  USER_PROFILE_CHANGE_EVENT
} from '../src/hooks/useUserProfile.js';
import { UserAvatar } from '../src/components/layout/UserAvatar.js';
import { ProfileMenu } from '../src/components/layout/ProfileMenu.js';
import { AppSettingsModal } from '../src/components/settings/AppSettingsModal.js';
import { HelpModal } from '../src/components/layout/HelpModal.js';
import { Header } from '../src/components/layout/Header.js';
import { FeatureGateProvider } from '../src/features/index.js';
import type { UserProfile, ProjectMetadata } from '../src/types/index.js';

const mockProfile: UserProfile = {
  id: 'usr-1',
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

const mockCognitoProfile: UserProfile = {
  ...mockProfile,
  mfaEnabled: true,
  provider: 'cognito',
  cliToken: 'lk_live_0123456789abcdef0123456789abcdef'
};

const mockMetadata: ProjectMetadata = {
  id: 'proj-1',
  name: 'Core Platform',
  prefix: 'CORE',
  keyCounter: 5,
  templateId: 'software'
};

describe('User Profile Utilities and Logic', () => {
  let originalLocalStorage: any;
  const storageMap = new Map<string, string>();

  beforeEach(() => {
    storageMap.clear();
    originalLocalStorage = (globalThis as any).localStorage;
    (globalThis as any).localStorage = {
      getItem: (k: string) => storageMap.get(k) || null,
      setItem: (k: string, v: string) => storageMap.set(k, String(v)),
      removeItem: (k: string) => storageMap.delete(k),
      clear: () => storageMap.clear(),
      get length() { return storageMap.size; },
      key: (i: number) => Array.from(storageMap.keys())[i] || null
    };
  });

  afterEach(() => {
    if (originalLocalStorage !== undefined) {
      (globalThis as any).localStorage = originalLocalStorage;
    } else {
      delete (globalThis as any).localStorage;
    }
  });

  it('derives clean assignee handles from email addresses', () => {
    expect(deriveHandleFromEmail('michaelsanford@users.noreply.github.com')).toBe('michaelsanford');
    expect(deriveHandleFromEmail('john.doe+lk@example.com')).toBe('john.doe');
    expect(deriveHandleFromEmail('USER_NAME@DOMAIN.COM')).toBe('user_name');
    expect(deriveHandleFromEmail('')).toBe('user');
  });

  it('generates accurate 2-letter uppercase initials', () => {
    expect(getInitials('Michael Sanford')).toBe('MS');
    expect(getInitials('Michael John Sanford')).toBe('MS');
    expect(getInitials('Michael')).toBe('MI');
    expect(getInitials('M')).toBe('M');
    expect(getInitials('', 'alex@example.com')).toBe('AL');
    expect(getInitials('   ', 'david@example.com')).toBe('DA');
    expect(getInitials('', '')).toBe('LK');
  });

  it('loads default profile when local storage is unpopulated', () => {
    const profile = loadStoredProfile();
    expect(profile.id).toBe('dev-user-01');
    expect(profile.email).toBe('michaelsanford@users.noreply.github.com');
    expect(profile.displayName).toBe('Michael Sanford');
    expect(profile.gitAuthorEmail).toBe('michaelsanford@users.noreply.github.com');
    expect(profile.tokenScopes).toEqual(DEFAULT_SCOPES);
    expect(profile.cliToken).toBe('lk_dev_seed_token');
  });

  it('saves and restores profile via local storage with event broadcast', () => {
    const customProfile: UserProfile = {
      ...mockProfile,
      displayName: 'Jane Developer',
      email: 'jane@example.com',
      cliToken: 'lk_live_custom_token'
    };

    saveStoredProfile(customProfile);
    const retrieved = loadStoredProfile();
    expect(retrieved.displayName).toBe('Jane Developer');
    expect(retrieved.email).toBe('jane@example.com');
    expect(retrieved.cliToken).toBe('lk_live_custom_token');
  });
});

describe('UserAvatar Component', () => {
  it('renders initials badge with theme gradient and status dot', () => {
    const html = renderToString(
      <UserAvatar
        initials="MS"
        displayName="Michael Sanford"
        isOnline={true}
        mfaEnabled={false}
      />
    );

    expect(html).toContain('MS');
    expect(html).toContain('bg-emerald-400');
    expect(html).toContain('Status: Online');
  });

  it('renders offline indicator when disconnected', () => {
    const html = renderToString(
      <UserAvatar
        initials="MS"
        displayName="Michael Sanford"
        isOnline={false}
        mfaEnabled={false}
      />
    );

    expect(html).toContain('bg-amber-400');
    expect(html).toContain('Status: Offline');
  });

  it('renders TOTP MFA ring indicator when MFA is active', () => {
    const html = renderToString(
      <UserAvatar
        initials="MS"
        displayName="Michael Sanford"
        isOnline={true}
        mfaEnabled={true}
      />
    );

    expect(html).toContain('ring-indigo-400');
    expect(html).toContain('TOTP MFA Active');
  });

  it('renders image element when avatarUrl is supplied', () => {
    const html = renderToString(
      <UserAvatar
        initials="MS"
        displayName="Michael Sanford"
        avatarUrl="https://avatars.githubusercontent.com/u/12345"
      />
    );

    expect(html).toContain('<img');
    expect(html).toContain('src="https://avatars.githubusercontent.com/u/12345"');
  });

  it('rejects unsafe avatarUrl protocols and falls back to initials badge', () => {
    const html = renderToString(
      <UserAvatar
        initials="MS"
        displayName="Michael Sanford"
        avatarUrl="javascript:alert(1)"
      />
    );

    expect(html).not.toContain('<img');
    expect(html).not.toContain('javascript:');
    expect(html).toContain('MS');
  });

  it('renders different size classes for sm, md, and lg', () => {
    const smHtml = renderToString(<UserAvatar initials="SM" size="sm" />);
    expect(smHtml).toContain('w-7 h-7');

    const mdHtml = renderToString(<UserAvatar initials="MD" size="md" />);
    expect(mdHtml).toContain('w-8 h-8');

    const lgHtml = renderToString(<UserAvatar initials="LG" size="lg" />);
    expect(lgHtml).toContain('w-10 h-10');
  });

  it('renders interactive button when onClick is supplied', () => {
    const onClick = vi.fn();
    const html = renderToString(
      <UserAvatar
        initials="MS"
        displayName="Michael Sanford"
        onClick={onClick}
        title="Custom Profile Title"
      />
    );

    expect(html).toContain('<button');
    expect(html).toContain('title="Custom Profile Title"');
    expect(html).toContain('aria-label="Custom Profile Title"');
  });

  it('renders plain container when onClick is omitted', () => {
    const html = renderToString(<UserAvatar initials="MS" />);
    expect(html).not.toContain('<button');
  });
});

describe('ProfileMenu Component', () => {
  it('renders null when closed', () => {
    const html = renderToString(
      <ProfileMenu
        isOpen={false}
        onClose={vi.fn()}
        profile={mockProfile}
        onOpenAppSettings={vi.fn()}
      />
    );

    expect(html).toBe('');
  });

  it('renders local dev profile card with `lk` cli navigation option', () => {
    const html = renderToString(
      <ProfileMenu
        isOpen={true}
        onClose={vi.fn()}
        profile={mockProfile}
        onOpenAppSettings={vi.fn()}
        onOpenHelp={vi.fn()}
        onOpenAuth={vi.fn()}
      />
    );

    expect(html).toContain('Michael Sanford');
    expect(html).toContain('michaelsanford@users.noreply.github.com');
    expect(html).toContain('Local Dev');
    expect(html).toContain('Profile &amp; Account');
    expect(html).toContain('@michaelsanford');
    expect(html).toContain('Theme &amp; Appearance');
    expect(html).toContain('Feature Gates');
    expect(html).toContain('`lk` cli');
    expect(html).toContain('PAT &amp; Docs');
    expect(html).toContain('Connect AWS Cognito Account...');
  });

  it('renders AWS Cognito badge and sign out button when logged in with Cognito', () => {
    const html = renderToString(
      <ProfileMenu
        isOpen={true}
        onClose={vi.fn()}
        profile={mockCognitoProfile}
        onOpenAppSettings={vi.fn()}
        onOpenHelp={vi.fn()}
        onSignOut={vi.fn()}
      />
    );

    expect(html).toContain('AWS Cognito');
    expect(html).toContain('MFA Active');
    expect(html).toContain('Sign Out');
    expect(html).not.toContain('Connect AWS Cognito Account...');
  });

  it('renders fallback labels when optional profile fields are empty', () => {
    const emptyProfile: UserProfile = {
      id: 'usr-empty',
      email: '',
      displayName: '',
      mfaEnabled: false,
      provider: 'local'
    };

    const html = renderToString(
      <ProfileMenu
        isOpen={true}
        onClose={vi.fn()}
        profile={emptyProfile}
        onOpenAppSettings={vi.fn()}
      />
    );

    expect(html).toContain('Developer');
    expect(html).toContain('dev@lanekeeper.local');
    expect(html).toContain('Configure');
  });
});

describe('AppSettingsModal Profile & Account Tab', () => {
  it('renders Profile & Account tab with Git Author, Cognito status, and link to `lk` cli', () => {
    const html = renderToString(
      <FeatureGateProvider>
        <AppSettingsModal
          isOpen={true}
          onClose={vi.fn()}
          currentTheme="dracula"
          currentMode="dark"
          onSelectTheme={vi.fn()}
          onSelectMode={vi.fn()}
          initialTab="profile"
          profile={mockProfile}
          onUpdateProfile={vi.fn()}
          onGenerateCliToken={vi.fn()}
          onOpenAuth={vi.fn()}
          onOpenHelp={vi.fn()}
        />
      </FeatureGateProvider>
    );

    expect(html).toContain('Personal Identity');
    expect(html).toContain('Git Author &amp; Assignment Configuration');
    expect(html).toContain('michaelsanford@users.noreply.github.com');
    expect(html).toContain('Personal Access Token (PAT) &amp; `lk` cli');
    expect(html).toContain('Open `lk` cli');
    expect(html).toContain('Authenticate with Cognito...');
  });

  it('renders fallback profile values when profile prop is omitted', () => {
    const html = renderToString(
      <FeatureGateProvider>
        <AppSettingsModal
          isOpen={true}
          onClose={vi.fn()}
          currentTheme="tokyo_night"
          currentMode="dark"
          onSelectTheme={vi.fn()}
          onSelectMode={vi.fn()}
          initialTab="profile"
        />
      </FeatureGateProvider>
    );

    expect(html).toContain('Michael Sanford');
    expect(html).toContain('michaelsanford@users.noreply.github.com');
    expect(html).toContain('Local Dev Profile');
  });

  it('renders active Cognito MFA status badge when authenticated with Cognito', () => {
    const html = renderToString(
      <FeatureGateProvider>
        <AppSettingsModal
          isOpen={true}
          onClose={vi.fn()}
          currentTheme="dracula"
          currentMode="dark"
          onSelectTheme={vi.fn()}
          onSelectMode={vi.fn()}
          initialTab="profile"
          profile={mockCognitoProfile}
        />
      </FeatureGateProvider>
    );

    expect(html).toContain('AWS Cognito');
    expect(html).toContain('MFA Active');
    expect(html).not.toContain('Authenticate with Cognito...');
  });
});

describe('Header Profile Integration', () => {
  it('renders UserAvatar in header right pane with user profile', () => {
    const html = renderToString(
      <Header
        metadata={mockMetadata}
        activeView="board"
        onViewChange={vi.fn()}
        onOpenQuickCapture={vi.fn()}
        onOpenHelp={vi.fn()}
        onOpenProjectSettings={vi.fn()}
        onOpenAppSettings={vi.fn()}
        isOnline={true}
        pushSubscribed={false}
        onTogglePush={vi.fn()}
        profile={mockProfile}
      />
    );

    expect(html).toContain('MS');
    expect(html).toContain('Preferences &amp; System Settings');
    expect(html).toContain('CORE');
    expect(html).toContain('Core Platform');
  });

  it('renders default profile initials in header when profile prop is omitted', () => {
    const html = renderToString(
      <Header
        metadata={mockMetadata}
        activeView="board"
        onViewChange={vi.fn()}
        onOpenQuickCapture={vi.fn()}
        onOpenHelp={vi.fn()}
        onOpenProjectSettings={vi.fn()}
        onOpenAppSettings={vi.fn()}
        isOnline={true}
        pushSubscribed={false}
        onTogglePush={vi.fn()}
      />
    );

    expect(html).toContain('MS');
    expect(html).toContain('Online');
  });
});

describe('HelpModal `lk` cli and PAT Section', () => {
  it('renders `lk` cli guide with live PAT, scopes, setup and commands', () => {
    const html = renderToString(
      <HelpModal
        isOpen={true}
        onClose={vi.fn()}
        profile={mockProfile}
        onGenerateCliToken={vi.fn()}
      />
    );

    expect(html).toContain('`lk` cli');
    expect(html).toContain('cli/lk.mjs');
    expect(html).toContain('Personal Access Token (PAT)');
    expect(html).toContain('lk_dev_seed_token');
    expect(html).toContain('All Scopes Active (Locked)');
    expect(html).toContain('tasks:read');
    expect(html).toContain('tasks:write');
    expect(html).toContain('sync:rw');
    expect(html).toContain('leases:issue');
    expect(html).toContain('npm link');
    expect(html).toContain('$env:LANEKEEPER_API_TOKEN');
    expect(html).toContain('export LANEKEEPER_API_TOKEN');
    expect(html).toContain('lk add');
    expect(html).toContain('lk list');
    expect(html).toContain('lk start');
    expect(html).toContain('lk close');
  });
});
