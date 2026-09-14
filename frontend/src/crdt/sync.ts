import * as Y from 'yjs';
import { crdtStore } from './doc.js';
import { hasRemainingLease, saveLeaseBlock } from './leases.js';

let lastServerVector: Uint8Array | null = null;
let isSyncing = false;
let syncTimeout: number | null = null;

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function getDefaultApiUrl(): string {
  if (import.meta.env?.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (import.meta.env?.DEV) return 'http://localhost:3001';
  return '';
}

export function getDefaultAuthToken(): string | undefined {
  if (import.meta.env?.DEV) return 'lk_dev_seed_token';
  return undefined;
}

export async function syncWithServer(apiUrl?: string, authToken?: string): Promise<boolean> {
  const resolvedUrl = apiUrl || getDefaultApiUrl();
  const resolvedToken = authToken || getDefaultAuthToken();

  if (isSyncing || !navigator.onLine || !resolvedUrl || !resolvedToken) {
    return false;
  }

  isSyncing = true;
  try {
    const doc = crdtStore.doc;
    const meta = crdtStore.getMetadata();

    const clientVector = Y.encodeStateVector(doc);
    const clientVectorBase64 = uint8ArrayToBase64(clientVector);

    let clientUpdatesBase64: string | undefined = undefined;
    if (lastServerVector) {
      const clientDiff = Y.encodeStateAsUpdate(doc, lastServerVector);
      if (clientDiff.length > 0 && !(clientDiff.length === 1 && clientDiff[0] === 0)) {
        clientUpdatesBase64 = uint8ArrayToBase64(clientDiff);
      }
    } else {
      const fullUpdate = Y.encodeStateAsUpdate(doc);
      clientUpdatesBase64 = uint8ArrayToBase64(fullUpdate);
    }

    const res = await fetch(`${resolvedUrl}/api/v1/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resolvedToken}`
      },
      body: JSON.stringify({
        workspaceId: 'default',
        projectId: meta.id,
        stateVector: clientVectorBase64,
        updates: clientUpdatesBase64
      })
    });

    if (!res.ok) {
      console.warn('Sync responded with status:', res.status);
      return false;
    }

    const data = await res.json();

    // 1. Apply server diff to local CRDT document
    if (data.serverDiff) {
      const serverDiffBytes = base64ToUint8Array(data.serverDiff);
      Y.applyUpdate(doc, serverDiffBytes);
    }

    if (data.serverStateVector) {
      lastServerVector = base64ToUint8Array(data.serverStateVector);
    }

    // 2. Refill offline ID lease block if running low
    if (!hasRemainingLease(meta.prefix)) {
      try {
        const leaseRes = await fetch(`${resolvedUrl}/api/v1/projects/${meta.id}/leases?prefix=${meta.prefix}&size=10`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resolvedToken}`
          }
        });
        if (leaseRes.ok) {
          const leaseData = await leaseRes.json();
          saveLeaseBlock(leaseData.prefix, leaseData.start, leaseData.end);
        }
      } catch (err) {
        console.warn('Failed to fetch offline lease:', err);
      }
    }

    return true;
  } catch (err) {
    console.warn('CRDT sync error:', err);
    return false;
  } finally {
    isSyncing = false;
  }
}

export function scheduleSync(apiUrl?: string, authToken?: string, delayMs = 1500): void {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }
  syncTimeout = window.setTimeout(() => {
    syncWithServer(apiUrl, authToken);
  }, delayMs);
}
