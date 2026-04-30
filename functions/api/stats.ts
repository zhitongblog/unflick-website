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
  /** Latest release tag, e.g. "v0.6.1". Null if no releases or fetch failed. */
  latest_tag: string | null;
  /** Direct link to that release's GitHub page. */
  latest_url: string | null;
  fetchedAt: string;
}

const FALLBACK: Stats = {
  stars: 0,
  downloads: 0,
  latest_tag: null,
  latest_url: null,
  fetchedAt: new Date(0).toISOString(),
};

interface Env {
  /** Optional: bumps the GitHub anonymous rate limit (60/hr/IP) up to 5000/hr.
   *  CF Pages edge IPs are shared with countless other sites so unauthenticated
   *  calls get throttled fast. Set this in the Pages dashboard under
   *  Settings → Environment variables. Fine-grained PAT scoped to public read
   *  on this repo is plenty. */
  GITHUB_TOKEN?: string;
}

async function fetchJson<T>(url: string, env: Env): Promise<T> {
  const headers: Record<string, string> = {
    'User-Agent': 'unflick-website-edge',
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (env.GITHUB_TOKEN) headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;

  const res = await fetch(url, {
    headers,
    cf: { cacheTtl: 300 } as RequestInitCfProperties,
  });
  if (!res.ok) throw new Error(`GitHub ${url} → HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

interface RepoApi { stargazers_count?: number }
interface ReleaseApi {
  tag_name?: string;
  html_url?: string;
  draft?: boolean;
  prerelease?: boolean;
  assets?: Array<{ download_count?: number }>;
}

async function fetchStats(env: Env): Promise<Stats> {
  const repo = await fetchJson<RepoApi>(`https://api.github.com/repos/${REPO}`, env);
  const releases = await fetchJson<ReleaseApi[]>(`https://api.github.com/repos/${REPO}/releases?per_page=100`, env);

  const stars = repo.stargazers_count ?? 0;
  let downloads = 0;
  for (const rel of releases) {
    for (const asset of rel.assets ?? []) {
      downloads += asset.download_count ?? 0;
    }
  }

  // Latest non-draft, non-prerelease. The /releases listing comes back
  // newest-first, so the first match wins.
  const latest = releases.find((r) => !r.draft && !r.prerelease);
  const latest_tag = latest?.tag_name ?? null;
  const latest_url = latest?.html_url ?? null;

  return { stars, downloads, latest_tag, latest_url, fetchedAt: new Date().toISOString() };
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  let body: Stats;
  try {
    body = await fetchStats(env);
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
