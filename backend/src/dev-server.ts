import http from 'node:http';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { handler as syncHandler } from './handlers/sync.js';
import { handler as ingestHandler } from './handlers/ingest.js';
import { handler as githubHandler } from './handlers/github.js';
import { handler as leasesHandler } from './handlers/leases.js';
import { handler as pushHandler } from './handlers/push.js';
import { handler as tasksHandler } from './handlers/tasks.js';

const PORT = parseInt(process.env.PORT || '3001', 10);

// In-memory mock store for local dev when running without AWS DynamoDB
const mockDb = new Map<string, any>();

const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-API-Key, X-Hub-Signature-256');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const path = url.pathname;
  const method = req.method || 'GET';

  // Read request body
  const buffers: Buffer[] = [];
  for await (const chunk of req) {
    buffers.push(chunk);
  }
  const rawBody = Buffer.concat(buffers).toString('utf-8');

  // Convert to APIGatewayProxyEventV2
  const event: APIGatewayProxyEventV2 = {
    version: '2.0',
    routeKey: `${method} ${path}`,
    rawPath: path,
    rawQueryString: url.searchParams.toString(),
    headers: req.headers as Record<string, string>,
    queryStringParameters: Object.fromEntries(url.searchParams.entries()),
    requestContext: {
      accountId: '123456789012',
      apiId: 'local-api',
      domainName: 'localhost',
      domainPrefix: 'localhost',
      http: {
        method,
        path,
        protocol: 'HTTP/1.1',
        sourceIp: req.socket.remoteAddress || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'local-dev'
      },
      requestId: `req-${Date.now()}`,
      routeKey: `${method} ${path}`,
      stage: 'dev',
      time: new Date().toISOString(),
      timeEpoch: Date.now(),
      authorizer: {
        jwt: {
          claims: {
            sub: 'dev-user-01',
            email: 'dev@lanekeeper.local',
            'custom:workspaceId': 'default'
          },
          scopes: []
        }
      }
    } as any,
    body: rawBody,
    isBase64Encoded: false
  };

  let result: APIGatewayProxyResultV2;

  try {
    if (path === '/api/v1/sync' && method === 'POST') {
      result = await syncHandler(event);
    } else if (path === '/api/v1/quick' && method === 'POST') {
      result = await ingestHandler(event);
    } else if (path === '/api/v1/integrations/github' && method === 'POST') {
      result = await githubHandler(event);
    } else if (path.startsWith('/api/v1/projects/') && path.endsWith('/leases') && method === 'POST') {
      const parts = path.split('/');
      event.pathParameters = { id: parts[4] || 'default' };
      result = await leasesHandler(event);
    } else if (path === '/api/v1/notifications/subscribe' && method === 'POST') {
      result = await pushHandler(event);
    } else if (path === '/api/v1/tasks' && method === 'GET') {
      result = await tasksHandler(event);
    } else if (path.startsWith('/api/v1/tasks/') && method === 'PATCH') {
      const parts = path.split('/');
      event.pathParameters = { key: parts[4] };
      result = await tasksHandler(event);
    } else if (path === '/health') {
      result = { statusCode: 200, body: JSON.stringify({ status: 'healthy', node: process.version }) };
    } else {
      result = { statusCode: 404, body: JSON.stringify({ error: `Not found: ${method} ${path}` }) };
    }
  } catch (err: any) {
    console.error(`Error handling ${method} ${path}:`, err);
    result = {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error', message: err.message })
    };
  }

  const statusCode = typeof result === 'object' && 'statusCode' in result ? result.statusCode || 200 : 200;
  const headers = typeof result === 'object' && 'headers' in result ? result.headers : {};
  const responseBody = typeof result === 'object' && 'body' in result ? result.body || '' : String(result);

  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    ...headers
  });
  res.end(responseBody);
});

server.listen(PORT, () => {
  console.log(`\nLanekeeper Local Backend Server running at http://localhost:${PORT}`);
  console.log(`   - POST /api/v1/sync               (CRDT State Vector Sync)`);
  console.log(`   - POST /api/v1/quick              (Quick Task Ingest)`);
  console.log(`   - POST /api/v1/integrations/github (GitHub Webhooks)`);
  console.log(`   - POST /api/v1/projects/:id/leases(Offline ID Leases)`);
  console.log(`   - POST /api/v1/notifications/subscribe (Push Subs)`);
  console.log(`   - GET  /api/v1/tasks               (List Tasks)`);
  console.log(`   - PATCH /api/v1/tasks/:key         (Transition Task Lane)`);
  console.log(`   - GET  /health                    (Health Check)\n`);
});
