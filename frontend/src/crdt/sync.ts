import * as Y from 'yjs';
import { crdtStore } from './doc.js';
import { hasRemainingLease, saveLeaseBlock } from './leases.js';

let lastServerVector: Uint8Array | null = null;
let isSyncing = false;
let syncTimeout: number | null = null;

export async function syncWithServer(apiUrl: string, authToken?: string): Promise<boolean> {
  if (isSyncing || !navigator.onLine || !authToken) {
    return false;
  }

  isSyncing = true;
  try {
    const doc = crdtStore.doc;
    const meta = crdtStore.getMetadata();

    const clientVector = Y.encodeStateVector(doc);
    const clientVectorBase64 = Buffer.from(clientVector).toString('base64');

    let clientUpdatesBase64: string | undefined = undefined;
    if (lastServerVector) {
      const clientDiff = Y.encodeStateAsUpdate(doc, lastServerVector);
      if (clientDiff.length > 0 && !(clientDiff.length === 1 && clientDiff[0] === 0)) {
        clientUpdatesBase64 = Buffer.from(clientDiff).toString('base64');
      }
    } else {
      const fullUpdate = Y.encodeStateAsUpdate(doc);
      clientUpdatesBase64 = Buffer.from(fullUpdate).toString('base64');
    }

    const res = await fetch(`${apiUrl}/api/v1/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
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
      const serverDiffBytes = Uint8Array.from(Buffer.from(data.serverDiff, 'base64'));
      Y.applyUpdate(doc, serverDiffBytes);
    }

    if (data.serverStateVector) {
      lastServerVector = Uint8Array.from(Buffer.from(data.serverStateVector, 'base64'));
    }

    // 2. Refill offline ID lease block if running low
    if (!hasRemainingLease(meta.prefix)) {
      try {
        const leaseRes = await fetch(`${apiUrl}/api/v1/projects/${meta.id}/leases?prefix=${meta.prefix}&size=10`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authToken}`
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

export function scheduleSync(apiUrl: string, authToken?: string, delayMs = 1500): void {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }
  syncTimeout = window.setTimeout(() => {
    syncWithServer(apiUrl, authToken);
  }, delayMs);
}
