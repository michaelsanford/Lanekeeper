import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  deriveHandleFromEmail,
  getInitials,
  DEFAULT_SCOPES
} from '../src/hooks/useUserProfile.js';
import { UserAvatar } from '../src/components/layout/UserAvatar.js';
import { ProfileMenu } from '../src/components/layout/ProfileMenu.js';
import { AppSettingsModal } from '../src/components/settings/AppSettingsModal.js';
import { HelpModal } from '../src/components/layout/HelpModal.js';
import { FeatureGateProvider } from '../src/features/index.js';
import type { UserProfile } from '../src/types/index.js';

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

describe('User Profile Utilities and Logic', () => {
  it('derives clean assignee handles from email addresses', () => {
    expect(deriveHandleFromEmail('michaelsanford@users.noreply.github.com')).toBe('michaelsanford');
    expect(deriveHandleFromEmail('john.doe+lk@example.com')).toBe('john.doe');
    expect(deriveHandleFromEmail('')).toBe('user');
  });

  it('generates accurate 2-letter uppercase initials', () => {
    expect(getInitials('Michael Sanford')).toBe('MS');
    expect(getInitials('Michael')).toBe('MI');
    expect(getInitials('M')).toBe('M');
    expect(getInitials('', 'alex@example.com')).toBe('AL');
    expect(getInitials('', '')).toBe('LK');
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
});

describe('ProfileMenu Component', () => {
  it('renders local dev profile card with CLI token and navigation options', () => {
    const html = renderToString(
      <ProfileMenu
        isOpen={true}
        onClose={vi.fn()}
        profile={mockProfile}
        onOpenAppSettings={vi.fn()}
        onOpenHelp={vi.fn()}
      />
    );

    expect(html).toContain('Michael Sanford');
    expect(html).toContain('michaelsanford@users.noreply.github.com');
    expect(html).toContain('Local Dev');
    expect(html).toContain('Personal Access Token (lk CLI)');
    expect(html).toContain('Profile &amp; Account');
    expect(html).toContain('@michaelsanford');
    expect(html).toContain('Developer CLI Companion');
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
});

describe('AppSettingsModal Profile & Account Tab', () => {
  it('renders Profile & Account tab with Git Author, PAT, and locked scopes', () => {
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
        />
      </FeatureGateProvider>
    );

    expect(html).toContain('Personal Identity');
    expect(html).toContain('Git Author &amp; Assignment Configuration');
    expect(html).toContain('michaelsanford@users.noreply.github.com');
    expect(html).toContain('Personal Access Token (lk CLI Companion)');
    expect(html).toContain('lk_dev_seed_token');
    expect(html).toContain('All Scopes Active (Locked)');
    expect(html).toContain('tasks:read');
    expect(html).toContain('tasks:write');
    expect(html).toContain('sync:rw');
    expect(html).toContain('leases:issue');
    expect(html).toContain('$env:LANEKEEPER_API_TOKEN');
    expect(html).toContain('export LANEKEEPER_API_TOKEN');
  });
});

describe('HelpModal CLI Companion Section', () => {
  it('renders Developer CLI Companion guide with setup and commands', () => {
    const html = renderToString(
      <HelpModal isOpen={true} onClose={vi.fn()} />
    );

    expect(html).toContain('Developer CLI Companion (lk)');
    expect(html).toContain('cli/lk.mjs');
    expect(html).toContain('npm link');
    expect(html).toContain('$env:LANEKEEPER_API_TOKEN');
    expect(html).toContain('lk add');
    expect(html).toContain('lk list');
    expect(html).toContain('lk start');
    expect(html).toContain('lk close');
  });
});
