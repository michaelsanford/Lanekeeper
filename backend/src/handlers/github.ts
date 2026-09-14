import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { loadDocFromBase64, encodeDocToBase64 } from '../common/crdt.js';
import { getProjectCrdtDoc, saveProjectCrdtDoc } from '../common/ddb.js';
import type { Task } from '../common/types.js';

interface CommitItem {
  id: string;
  message: string;
  url: string;
  author: { name: string; username?: string };
}

export function parseIssueKeysFromCommit(message: string): { key: string; action?: 'close' | 'review' | 'ref' }[] {
  const results: { key: string; action?: 'close' | 'review' | 'ref' }[] = [];
  // Pattern matching: "fixes LK-42", "closes LK-42", "refs LK-42", or just "LK-42"
  const regex = /(?:(fixes|closes|resolves|refs)\s+)?([A-Z]{2,10}-\d+)/gi;

  let match;
  while ((match = regex.exec(message)) !== null) {
    const verb = match[1]?.toLowerCase();
    const key = match[2].toUpperCase();

    let action: 'close' | 'review' | 'ref' = 'ref';
    if (verb === 'fixes' || verb === 'closes' || verb === 'resolves') {
      action = 'close';
    } else if (verb === 'refs') {
      action = 'review';
    }

    results.push({ key, action });
  }

  return results;
}

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const githubEvent = event.headers['x-github-event'] || 'push';

  if (!event.body) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing webhook payload' })
    };
  }

  try {
    const payload = JSON.parse(event.body);
    const commits: CommitItem[] = payload.commits || [];
    const workspaceId = event.queryStringParameters?.workspaceId || 'default';
    const projectId = event.queryStringParameters?.projectId || 'default';

    if (commits.length === 0 && !payload.pull_request) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'No actionable commits or PRs found' })
      };
    }

    // Load project CRDT document
    const existing = await getProjectCrdtDoc(workspaceId, projectId);
    if (!existing) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Project not found' })
      };
    }

    const doc = loadDocFromBase64(existing.yDocState);
    const tasksMap = doc.getMap<Task>('tasks');
    const updatedKeys: string[] = [];

    // Check all commits for issue keys
    for (const commit of commits) {
      const matches = parseIssueKeysFromCommit(commit.message);
      for (const match of matches) {
        // Find matching task by key
        for (const [taskId, task] of tasksMap.entries()) {
          if (task.key === match.key) {
            const updatedTask = { ...task };

            if (match.action === 'close') {
              updatedTask.laneId = 'done';
            } else if (match.action === 'review') {
              updatedTask.laneId = 'review';
            } else if (updatedTask.laneId === 'triage' || updatedTask.laneId === 'todo') {
              updatedTask.laneId = 'inprogress';
            }

            // Append commit link to description notes
            const commitNote = `\n\n> 🔗 **Commit:** [\`${commit.id.slice(0, 7)}\`](${commit.url}) by @${commit.author.username || commit.author.name}: *${commit.message.split('\n')[0]}*`;
            if (!updatedTask.description.includes(commit.id.slice(0, 7))) {
              updatedTask.description = (updatedTask.description || '') + commitNote;
            }
            updatedTask.updatedAt = new Date().toISOString();

            tasksMap.set(taskId, updatedTask);
            updatedKeys.push(task.key);
          }
        }
      }
    }

    if (updatedKeys.length > 0) {
      const newBase64 = encodeDocToBase64(doc);
      await saveProjectCrdtDoc(workspaceId, projectId, newBase64, existing.version + 1);
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        updatedTasks: updatedKeys
      })
    };
  } catch (err: any) {
    console.error('Error processing GitHub webhook:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error', details: err.message })
    };
  }
}
