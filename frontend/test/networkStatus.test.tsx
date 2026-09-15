import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  getSyncStatus,
  subscribeSyncStatus,
  checkServerHealth,
  syncWithServer,
  resetSyncStatusForTesting
} from '../src/crdt/sync.js';
import { Header } from '../src/components/layout/Header.js';
import { UserAvatar } from '../src/components/layout/UserAvatar.js';
import { ProfileMenu } from '../src/components/layout/ProfileMenu.js';
import { AppSettingsModal } from '../src/components/settings/AppSettingsModal.js';
import { FeatureGateProvider } from '../src/features/index.js';
import type { ProjectMetadata, UserProfile } from '../src/types/index.js';

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
  cliToken: 'lk_dev_seed_token'
};

const mockMetadata: ProjectMetadata = {
  id: 'proj-1',
  name: 'Core Platform',
  prefix: 'CORE',
  templateId: 'kanban-basic',
  swimlaneField: 'priority',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z'
};

describe('Tri-State Network Reachability & Indicators', () => {
  beforeEach(() => {
    resetSyncStatusForTesting();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Sync Telemetry and Health Checks', () => {
    it('initializes with default reachable status', () => {
      const status = getSyncStatus();
      expect(status.reachable).toBe(true);
      expect(status.lastSyncTime).toBeNull();
      expect(status.isSyncing).toBe(false);
    });

    it('notifies subscribers when reachability changes', () => {
      const listener = vi.fn();
      const unsubscribe = subscribeSyncStatus(listener);

      // Initial call on subscribe
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ reachable: true, isSyncing: false })
      );

      unsubscribe();
    });

    it('checks server health and returns true when /health responds 200 OK', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ status: 'healthy' })
      });
      globalThis.fetch = mockFetch as unknown as typeof fetch;

      const isHealthy = await checkServerHealth('http://localhost:3001');
      expect(isHealthy).toBe(true);
      expect(getSyncStatus().reachable).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/health',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('checks server health and returns false when server is down or throws', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
      globalThis.fetch = mockFetch as unknown as typeof fetch;

      const isHealthy = await checkServerHealth('http://localhost:3001');
      expect(isHealthy).toBe(false);
      expect(getSyncStatus().reachable).toBe(false);
    });

    it('marks server unreachable when syncWithServer encounters network error', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch (Connection Refused)'));
      globalThis.fetch = mockFetch as unknown as typeof fetch;

      const result = await syncWithServer('http://localhost:3001', 'token-123');
      expect(result).toBe(false);
      expect(getSyncStatus().reachable).toBe(false);
    });

    it('marks server unreachable when syncWithServer receives HTTP 502/503/504', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ error: 'Service Unavailable' })
      });
      globalThis.fetch = mockFetch as unknown as typeof fetch;

      const result = await syncWithServer('http://localhost:3001', 'token-123');
      expect(result).toBe(false);
      expect(getSyncStatus().reachable).toBe(false);
    });
  });

  describe('Header Status Badge UI', () => {
    it('renders Online status badge in emerald when networkStatus is online', () => {
      const html = renderToString(
        <Header
          metadata={mockMetadata}
          activeView="board"
          onViewChange={vi.fn()}
          onOpenQuickCapture={vi.fn()}
          onOpenHelp={vi.fn()}
          onOpenProjectSettings={vi.fn()}
          onOpenAppSettings={vi.fn()}
          networkStatus="online"
          isOnline={true}
          pushSubscribed={false}
          onTogglePush={vi.fn()}
        />
      );

      expect(html).toContain('Online');
      expect(html).toContain('bg-emerald-950/40');
      expect(html).toContain('text-emerald-400');
      expect(html).toContain('Connected to local &amp; cloud sync');
    });

    it('renders Server Offline status badge in amber when networkStatus is server_offline', () => {
      const html = renderToString(
        <Header
          metadata={mockMetadata}
          activeView="board"
          onViewChange={vi.fn()}
          onOpenQuickCapture={vi.fn()}
          onOpenHelp={vi.fn()}
          onOpenProjectSettings={vi.fn()}
          onOpenAppSettings={vi.fn()}
          networkStatus="server_offline"
          isOnline={true}
          pushSubscribed={false}
          onTogglePush={vi.fn()}
        />
      );

      expect(html).toContain('Server Offline');
      expect(html).toContain('bg-amber-950/40');
      expect(html).toContain('text-amber-400');
      expect(html).toContain('Server unreachable - changes saved locally and will sync when server reconnects');
    });

    it('renders Offline status badge in amber when networkStatus is offline', () => {
      const html = renderToString(
        <Header
          metadata={mockMetadata}
          activeView="board"
          onViewChange={vi.fn()}
          onOpenQuickCapture={vi.fn()}
          onOpenHelp={vi.fn()}
          onOpenProjectSettings={vi.fn()}
          onOpenAppSettings={vi.fn()}
          networkStatus="offline"
          isOnline={false}
          pushSubscribed={false}
          onTogglePush={vi.fn()}
        />
      );

      expect(html).toContain('Offline');
      expect(html).not.toContain('Server Offline');
      expect(html).toContain('bg-amber-950/40');
      expect(html).toContain('Offline mode - changes saved locally');
    });
  });

  describe('UserAvatar Connectivity Indicator', () => {
    it('displays emerald status dot and Online title when networkStatus is online', () => {
      const html = renderToString(
        <UserAvatar
          initials="MS"
          displayName="Michael Sanford"
          networkStatus="online"
          isOnline={true}
        />
      );

      expect(html).toContain('bg-emerald-400');
      expect(html).toContain('title="Status: Online"');
    });

    it('displays amber status dot and Server Offline title when networkStatus is server_offline', () => {
      const html = renderToString(
        <UserAvatar
          initials="MS"
          displayName="Michael Sanford"
          networkStatus="server_offline"
          isOnline={false}
        />
      );

      expect(html).toContain('bg-amber-400');
      expect(html).toContain('title="Status: Server Offline"');
    });

    it('displays amber status dot and Offline title when networkStatus is offline', () => {
      const html = renderToString(
        <UserAvatar
          initials="MS"
          displayName="Michael Sanford"
          networkStatus="offline"
          isOnline={false}
        />
      );

      expect(html).toContain('bg-amber-400');
      expect(html).toContain('title="Status: Offline"');
    });

    it('matches jewel status in ProfileMenu when server is offline', () => {
      const html = renderToString(
        <ProfileMenu
          isOpen={true}
          onClose={vi.fn()}
          profile={mockProfile}
          networkStatus="server_offline"
          isOnline={false}
          onOpenAppSettings={vi.fn()}
        />
      );

      expect(html).toContain('bg-amber-400');
      expect(html).toContain('title="Status: Server Offline"');
    });

    it('matches jewel status in AppSettingsModal when server is offline', () => {
      const html = renderToString(
        <FeatureGateProvider>
          <AppSettingsModal
            isOpen={true}
            onClose={vi.fn()}
            currentTheme="lanekeeper"
            currentMode="dark"
            onSelectTheme={vi.fn()}
            onSelectMode={vi.fn()}
            profile={mockProfile}
            networkStatus="server_offline"
            isOnline={false}
          />
        </FeatureGateProvider>
      );

      expect(html).toContain('bg-amber-400');
      expect(html).toContain('title="Status: Server Offline"');
    });
  });
});
