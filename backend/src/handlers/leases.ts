import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getCognitoAuthContext } from '../common/auth.js';
import { allocateOfflineLease } from '../common/counter.js';

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const auth = getCognitoAuthContext(event);
  if (!auth) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }

  const projectId = event.pathParameters?.id || 'default';
  const prefix = (event.queryStringParameters?.prefix || 'LK').toUpperCase();
  const blockSize = Math.min(parseInt(event.queryStringParameters?.size || '10', 10), 50);

  try {
    const lease = await allocateOfflineLease(auth.workspaceId, projectId, prefix, blockSize);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(lease)
    };
  } catch (err: any) {
    console.error('Error allocating offline lease:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error', details: err.message })
    };
  }
}
