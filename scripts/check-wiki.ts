/**
 * Checks the wiki source in wiki/ (published to the GitHub wiki by .github/workflows/wiki.yml):
 *
 * - every wiki link ([[Page]], [[Text|Page]], or [text](Page)) points to an existing page;
 * - every repository link ({{repo}}/blob/HEAD/<path> or {{repo}}/tree/HEAD/<path>) points to a
 *   file or folder that exists;
 * - every page is listed in _Sidebar.md, so nothing is unreachable;
 * - pages follow the plain-copy rules (no em dashes, no emoji).
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const WIKI = join(ROOT, 'wiki');
const SPECIAL = new Set(['_Sidebar', '_Footer', 'Home']);
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

/** GitHub wiki page names: the file name without .md; spaces and hyphens are equivalent. */
function pageKey(name: string): string {
  return name.trim().replace(/\s+/g, '-').toLowerCase();
}

function lineOf(text: string, index: number): number {
  return text.slice(0, index).split('\n').length;
}

function main(): void {
  const files = readdirSync(WIKI).filter((f) => f.endsWith('.md'));
  const pages = new Set(files.map((f) => pageKey(f.slice(0, -3))));
  const sidebar = readFileSync(join(WIKI, '_Sidebar.md'), 'utf8');
  const sidebarTargets = new Set<string>();
  const problems: string[] = [];

  for (const file of files) {
    const text = readFileSync(join(WIKI, file), 'utf8');
    const where = (i: number) => `${file}:${lineOf(text, i)}`;

    for (const m of text.matchAll(/\[\[([^\]]+)\]\]/g)) {
      const parts = (m[1] ?? '').split('|');
      const target = (parts[parts.length - 1] ?? '').split('#')[0] ?? '';
      if (!pages.has(pageKey(target))) problems.push(`${where(m.index)} unknown page "${target}"`);
      if (file === '_Sidebar.md') sidebarTargets.add(pageKey(target));
    }

    for (const m of text.matchAll(/\]\(([^)\s]+)\)/g)) {
      const href = m[1] ?? '';
      if (href.startsWith('{{repo}}/')) {
        const path = href.replace(/^\{\{repo\}\}\/(blob|tree)\/HEAD\//, '').split('#')[0] ?? '';
        if (path === href || !existsSync(join(ROOT, decodeURIComponent(path)))) {
          problems.push(`${where(m.index)} repository link not found: ${href}`);
        }
      } else if (!/^(https?:|mailto:|tel:|#)/.test(href)) {
        const target = href.split('#')[0] ?? '';
        if (!pages.has(pageKey(target))) problems.push(`${where(m.index)} unknown page "${href}"`);
      }
    }

    const dash = text.indexOf('\u2014');
    if (dash >= 0) problems.push(`${where(dash)} em dash (use a comma, colon, or period)`);
    const emoji = text.search(EMOJI);
    if (emoji >= 0) problems.push(`${where(emoji)} emoji or symbol character`);
  }

  for (const file of files) {
    const name = file.slice(0, -3);
    if (!SPECIAL.has(name) && !sidebarTargets.has(pageKey(name))) {
      problems.push(`${file} is not linked from _Sidebar.md`);
    }
  }
  if (!sidebar.includes('[[Home]]')) problems.push('_Sidebar.md must link to [[Home]]');

  if (problems.length > 0) {
    console.error(`✖ Wiki check found ${problems.length} problem(s):`);
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log(`✓ Wiki: ${files.length} pages, links and sidebar OK.`);
}

main();
