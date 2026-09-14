import { createHash } from 'node:crypto';
import type { APIGatewayProxyEventV2, APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { getDocClient, getTableName } from './ddb.js';

export interface AuthContext {
  userId: string;
  email?: string;
  workspaceId: string;
}

/**
 * Extracts authenticated user context from Cognito JWT claims.
 */
export function getCognitoAuthContext(
  event: APIGatewayProxyEventV2 | APIGatewayProxyEventV2WithJWTAuthorizer
): AuthContext | null {
  const authorizer = (event.requestContext as any)?.authorizer;
  const jwt = authorizer?.jwt;
  if (!jwt || !jwt.claims) {
    return null;
  }

  const userId = jwt.claims.sub as string;
  const email = jwt.claims.email as string | undefined;
  // Default workspace is workspace of the user or custom claim
  const workspaceId = (jwt.claims['custom:workspaceId'] as string) || userId;

  return {
    userId,
    email,
    workspaceId
  };
}

/**
 * Computes a SHA-256 hash of an API token.
 */
export function hashApiToken(token: string): string {
  return createHash('sha256').update(token.trim()).digest('hex');
}

/**
 * Validates an API token (e.g. "lk_live_xyz...") against DynamoDB GSI1.
 */
export async function validateApiToken(token: string): Promise<AuthContext | null> {
  if (!token) return null;
  const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
  if (!cleanToken) return null;

  const tokenHash = hashApiToken(cleanToken);
  const ddb = getDocClient();

  const res = await ddb.send(
    new GetCommand({
      TableName: getTableName(),
      Key: {
        PK: `TOKEN_HASH#${tokenHash}`,
        SK: 'METADATA'
      }
    })
  );

  if (!res.Item) {
    return null;
  }

  return {
    userId: res.Item.userId,
    workspaceId: res.Item.workspaceId || res.Item.userId,
    email: res.Item.email
  };
}
