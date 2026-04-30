/**
 * Pre-build hook: fetches GitHub star count and total release download count
 * for the unflick repo and writes them to src/data/stats.json so the static
 * pages render real numbers on first paint.
 *
 * If the network fetch fails (rate limit, offline build, etc.), we keep the
 * existing stats.json untouched. This guarantees `npm run build` always
 * succeeds and the site never displays "0 downloads" — which would make the
 * project look dead.
 */

import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = 'zhitongblog/unflick';
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'stats.json');

const headers = {
  'User-Agent': 'unflick-website-build',
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
};

async function fetchJson(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.json();
}

async function fetchStats() {
  const repo = await fetchJson(`https://api.github.com/repos/${REPO}`);
  const stars = repo.stargazers_count ?? 0;

  // Sum download counts across every asset of every release. Paginated; 100/page
  // is the GitHub max. unflick has only a handful of releases so one page is
  // enough for now.
  const releases = await fetchJson(`https://api.github.com/repos/${REPO}/releases?per_page=100`);
  let downloads = 0;
  for (const rel of releases) {
    for (const asset of rel.assets ?? []) {
      downloads += asset.download_count ?? 0;
    }
  }

  const latest = releases.find((r) => !r.draft && !r.prerelease);
  const latest_tag = latest?.tag_name ?? null;
  const latest_url = latest?.html_url ?? null;

  return { stars, downloads, latest_tag, latest_url, fetchedAt: new Date().toISOString() };
}

(async () => {
  try {
    const stats = await fetchStats();
    writeFileSync(OUT, JSON.stringify(stats, null, 2) + '\n', 'utf8');
    console.log(`stats: ⭐ ${stats.stars} · ${stats.downloads} downloads → ${OUT}`);
  } catch (err) {
    if (existsSync(OUT)) {
      const cached = JSON.parse(readFileSync(OUT, 'utf8'));
      console.warn(`stats fetch failed (${err.message}); keeping cached values: ⭐ ${cached.stars} · ${cached.downloads}`);
    } else {
      // First-ever build with no network: bootstrap a zero record so imports
      // don't fail. The CF Pages Function will overwrite the displayed values
      // at runtime anyway.
      writeFileSync(OUT, JSON.stringify({ stars: 0, downloads: 0, fetchedAt: null }, null, 2) + '\n', 'utf8');
      console.warn(`stats fetch failed (${err.message}); wrote zero placeholder. Live API will populate.`);
    }
  }
})();
