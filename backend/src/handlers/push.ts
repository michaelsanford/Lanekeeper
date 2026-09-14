import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { getCognitoAuthContext } from '../common/auth.js';
import { getDocClient, getTableName, isLocalDev, setLocalMemoryItem } from '../common/ddb.js';
import { sendWebPush } from '../services/webpush.js';
import type { PushSubscriptionData } from '../common/types.js';

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const auth = getCognitoAuthContext(event);
  if (!auth) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }

  if (!event.body) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing request body' })
    };
  }

  try {
    const payload = JSON.parse(event.body);
    const sub: PushSubscriptionData = payload.subscription;

    if (!sub || !sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid push subscription payload' })
      };
    }

    const endpointHash = Buffer.from(sub.endpoint).toString('base64url').slice(-32);
    const now = new Date().toISOString();

    if (isLocalDev()) {
      setLocalMemoryItem(`USER#${auth.userId}:SUB#${endpointHash}`, {
        PK: `USER#${auth.userId}`,
        SK: `SUB#${endpointHash}`,
        endpoint: sub.endpoint,
        keys: sub.keys,
        userAgent: event.headers['user-agent'] || '',
        createdAt: now
      });
    } else {
      const ddb = getDocClient();
      await ddb.send(
        new PutCommand({
          TableName: getTableName(),
          Item: {
            PK: `USER#${auth.userId}`,
            SK: `SUB#${endpointHash}`,
            endpoint: sub.endpoint,
            keys: sub.keys,
            userAgent: event.headers['user-agent'] || '',
            createdAt: now
          }
        })
      );
    }

    // Optional test dispatch
    if (payload.sendTest) {
      await sendWebPush(auth.userId, sub, {
        title: 'Lanekeeper Notifications Enabled',
        body: 'Push notifications and due date reminders are now connected!',
        url: '/'
      });
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ success: true, message: 'Subscription saved' })
    };
  } catch (err: any) {
    console.error('Error saving push subscription:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error', details: err.message })
    };
  }
}
