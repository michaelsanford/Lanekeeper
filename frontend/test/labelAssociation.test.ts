import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPONENTS_DIR = resolve(__dirname, '../src/components');

function listTsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...listTsxFiles(full));
    } else if (entry.endsWith('.tsx')) {
      out.push(full);
    }
  }
  return out;
}

describe('Form label association', () => {
  const files = listTsxFiles(COMPONENTS_DIR);
  expect(files.length).toBeGreaterThan(0);

  for (const file of files) {
    const relPath = file.slice(COMPONENTS_DIR.length + 1);
    const source = readFileSync(file, 'utf8');
    const htmlForMatches = [...source.matchAll(/htmlFor=["']([^"']+)["']/g)].map((m) => m[1]);

    if (htmlForMatches.length === 0) continue;

    it(`${relPath}: every htmlFor references an id present in the same file`, () => {
      for (const forId of htmlForMatches) {
        const hasMatchingId = new RegExp(`id=["']${forId}["']`).test(source) || new RegExp(`id=\\{[^}]*${forId}[^}]*\\}`).test(source);
        expect(hasMatchingId, `htmlFor="${forId}" in ${relPath} has no matching id`).toBe(true);
      }
    });
  }

  it('found labels with htmlFor in the components known to have been fixed', () => {
    const filesWithHtmlFor = files
      .map((f) => f.slice(COMPONENTS_DIR.length + 1))
      .filter((relPath) => readFileSync(join(COMPONENTS_DIR, relPath), 'utf8').includes('htmlFor='));

    expect(filesWithHtmlFor).toEqual(
      expect.arrayContaining([
        join('auth', 'AuthModal.tsx'),
        join('project', 'ProjectSettingsModal.tsx'),
        join('settings', 'AppSettingsModal.tsx'),
        join('task', 'TaskDetailDrawer.tsx')
      ])
    );
  });
});
