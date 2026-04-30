/**
 * GET /api/stats — live GitHub star count + total release downloads.
 *
 * Cached at the edge for 5 minutes so we don't burn through GitHub's
 * unauthenticated rate limit (60/hr/IP). On any failure we degrade to
 * static fallback values rather than returning an error response —
 * showing "0 downloads" or a broken page makes the project look dead.
 */

const REPO = 'zhitongblog/unflick';

interface Stats {
  stars: number;
  downloads: number;
  fetchedAt: string;
}

const FALLBACK: Stats = { stars: 0, downloads: 0, fetchedAt: new Date(0).toISOString() };

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'unflick-website-edge',
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    cf: { cacheTtl: 300 } as RequestInitCfProperties,
  });
  if (!res.ok) throw new Error(`GitHub ${url} → HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

interface RepoApi { stargazers_count?: number }
interface ReleaseApi { assets?: Array<{ download_count?: number }> }

async function fetchStats(): Promise<Stats> {
  const repo = await fetchJson<RepoApi>(`https://api.github.com/repos/${REPO}`);
  const releases = await fetchJson<ReleaseApi[]>(`https://api.github.com/repos/${REPO}/releases?per_page=100`);

  const stars = repo.stargazers_count ?? 0;
  let downloads = 0;
  for (const rel of releases) {
    for (const asset of rel.assets ?? []) {
      downloads += asset.download_count ?? 0;
    }
  }
  return { stars, downloads, fetchedAt: new Date().toISOString() };
}

export const onRequestGet: PagesFunction = async () => {
  let body: Stats;
  try {
    body = await fetchStats();
  } catch (err) {
    body = { ...FALLBACK, fetchedAt: new Date().toISOString() };
  }

  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json',
      // Browser caches for 1 minute, CDN serves stale-while-revalidate for
      // up to an hour. Keeps GitHub API hits low without making counters
      // feel frozen.
      'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600',
    },
  });
};
