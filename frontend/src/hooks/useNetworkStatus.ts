import { useState, useEffect, useCallback, useRef } from 'react';
import {
  subscribeSyncStatus,
  checkServerHealth,
  syncWithServer,
  getSyncStatus
} from '../crdt/sync.js';

export type NetworkStatus = 'online' | 'server_offline' | 'offline';

export interface UseNetworkStatusResult {
  status: NetworkStatus;
  isOnline: boolean;
  isServerReachable: boolean;
  isBrowserOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
  checkNow: () => Promise<void>;
}

export function useNetworkStatus(apiUrl?: string, authToken?: string): UseNetworkStatusResult {
  const [isBrowserOnline, setIsBrowserOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const initialSync = getSyncStatus();
  const [isServerReachable, setIsServerReachable] = useState(initialSync.reachable);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(initialSync.lastSyncTime);
  const [isSyncing, setIsSyncing] = useState(initialSync.isSyncing);

  const backoffDelayRef = useRef(3000);
  const probeTimeoutRef = useRef<number | null>(null);

  // Subscribe to CRDT sync status events
  useEffect(() => {
    const unsubscribe = subscribeSyncStatus((sync) => {
      setIsServerReachable(sync.reachable);
      setLastSyncTime(sync.lastSyncTime);
      setIsSyncing(sync.isSyncing);
    });
    return unsubscribe;
  }, []);

  // Listen to browser network interface online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsBrowserOnline(true);
      if (apiUrl) {
        checkServerHealth(apiUrl).then((healthy) => {
          if (healthy && authToken) {
            syncWithServer(apiUrl, authToken);
          }
        });
      }
    };

    const handleOffline = () => {
      setIsBrowserOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [apiUrl, authToken]);

  // Initial health probe on mount and on window focus
  useEffect(() => {
    if (!isBrowserOnline || !apiUrl) return;

    checkServerHealth(apiUrl);

    const handleFocus = () => {
      if (navigator.onLine && apiUrl) {
        checkServerHealth(apiUrl).then((healthy) => {
          if (healthy && authToken) {
            syncWithServer(apiUrl, authToken);
          }
        });
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [apiUrl, authToken, isBrowserOnline]);

  // Adaptive health check probe loop when server is detected offline
  useEffect(() => {
    if (!isBrowserOnline || isServerReachable || !apiUrl) {
      if (probeTimeoutRef.current) {
        clearTimeout(probeTimeoutRef.current);
        probeTimeoutRef.current = null;
      }
      backoffDelayRef.current = 3000;
      return;
    }

    let isCancelled = false;

    const scheduleProbe = () => {
      probeTimeoutRef.current = window.setTimeout(async () => {
        if (isCancelled) return;
        const healthy = await checkServerHealth(apiUrl);
        if (healthy) {
          backoffDelayRef.current = 3000;
          if (authToken) {
            syncWithServer(apiUrl, authToken);
          }
        } else {
          // Exponential backoff up to 12s
          backoffDelayRef.current = Math.min(backoffDelayRef.current * 1.5, 12000);
          if (!isCancelled) {
            scheduleProbe();
          }
        }
      }, backoffDelayRef.current);
    };

    scheduleProbe();

    return () => {
      isCancelled = true;
      if (probeTimeoutRef.current) {
        clearTimeout(probeTimeoutRef.current);
        probeTimeoutRef.current = null;
      }
    };
  }, [apiUrl, authToken, isBrowserOnline, isServerReachable]);

  const checkNow = useCallback(async () => {
    if (!navigator.onLine || !apiUrl) return;
    const healthy = await checkServerHealth(apiUrl);
    if (healthy && authToken) {
      await syncWithServer(apiUrl, authToken);
    }
  }, [apiUrl, authToken]);

  let status: NetworkStatus = 'online';
  if (!isBrowserOnline) {
    status = 'offline';
  } else if (!isServerReachable) {
    status = 'server_offline';
  }

  return {
    status,
    isOnline: status === 'online',
    isServerReachable,
    isBrowserOnline,
    isSyncing,
    lastSyncTime,
    checkNow
  };
}
