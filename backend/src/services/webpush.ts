import webpush from 'web-push';
import { DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { getDocClient, getTableName } from '../common/ddb.js';
import type { PushSubscriptionData } from '../common/types.js';

let vapidConfigured = false;

function ensureVapidConfig() {
  if (!vapidConfigured) {
    const subject = process.env.VAPID_SUBJECT || 'mailto:notifications@lanekeeper.dev';
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;

    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      vapidConfigured = true;
    }
  }
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  badge?: string;
  icon?: string;
}

/**
 * Sends an encrypted Web Push notification to a target browser subscription.
 */
export async function sendWebPush(
  userId: string,
  sub: PushSubscriptionData,
  payload: PushNotificationPayload
): Promise<boolean> {
  ensureVapidConfig();

  const pushSubscription: webpush.PushSubscription = {
    endpoint: sub.endpoint,
    keys: {
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth
    }
  };

  try {
    await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
    return true;
  } catch (err: any) {
    // 410 Gone or 404 Not Found means the browser unsubscribed or expired
    if (err.statusCode === 410 || err.statusCode === 404) {
      await removeStaleSubscription(userId, sub.endpoint);
    } else {
      console.error('Failed to send web push notification:', err);
    }
    return false;
  }
}

/**
 * Removes an expired push subscription from DynamoDB.
 */
async function removeStaleSubscription(userId: string, endpoint: string): Promise<void> {
  const ddb = getDocClient();
  const endpointHash = Buffer.from(endpoint).toString('base64url').slice(-32);

  try {
    await ddb.send(
      new DeleteCommand({
        TableName: getTableName(),
        Key: {
          PK: `USER#${userId}`,
          SK: `SUB#${endpointHash}`
        }
      })
    );
  } catch (err) {
    console.warn('Error removing stale push subscription:', err);
  }
}
