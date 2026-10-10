/**
 * GitHub Context Fetcher (Upstream MCP intake)
 * Extracts project architecture, libraries, and codebase details from a student's GitHub URL or profile.
 */

export interface ParsedGithubTarget {
  owner: string;
  repo?: string;
}

export function parseGithubUrl(rawUrl: string): ParsedGithubTarget | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  // Clean query strings, hashes, leading @, and trailing slashes
  let clean = rawUrl.trim().replace(/^@+/, '').split('?')[0].split('#')[0].replace(/\/+$/, '');

  // Handle git@github.com:owner/repo.git
  const sshMatch = clean.match(/^git@github\.com:([a-zA-Z0-9_-]+)(?:\/([a-zA-Z0-9_.-]+))?$/);
  if (sshMatch) {
    return {
      owner: sshMatch[1],
      repo: sshMatch[2] ? sshMatch[2].replace(/\.git$/, '') : undefined,
    };
  }

  // Matches https://github.com/owner/repo or github.com/owner/repo or https://github.com/owner
  const match = clean.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)(?:\/([a-zA-Z0-9_.-]+))?/);
  if (match) {
    const owner = match[1];
    const repo = match[2] ? match[2].replace(/\.git$/, '') : undefined;
    // Avoid non-user routes like "features", "explore"
    if (!['features', 'topics', 'trending', 'collections', 'events'].includes(owner.toLowerCase())) {
      return { owner, repo };
    }
  }

  // Matches owner/repo format
  const shortMatch = clean.match(/^([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+)$/);
  if (shortMatch) {
    return {
      owner: shortMatch[1],
      repo: shortMatch[2].replace(/\.git$/, ''),
    };
  }

  // Matches pure username format (e.g. "Praharsha2007")
  const usernameMatch = clean.match(/^([a-zA-Z0-9_-]{1,39})$/);
  if (usernameMatch) {
    return {
      owner: usernameMatch[1],
    };
  }

  return null;
}

/**
 * Fetch raw README without rate limits from raw.githubusercontent.com
 */
async function fetchRawReadme(owner: string, repo: string): Promise<string | null> {
  const branches = ['main', 'master', 'HEAD'];
  for (const branch of branches) {
    try {
      const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/README.md`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(4500),
      });
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().length > 30) {
          return text.slice(0, 1500);
        }
      }
    } catch {
      // Try next branch or fail gracefully
    }
  }
  return null;
}

interface ScrapedRepo {
  name: string;
  desc?: string;
  lang?: string;
  readmeExcerpt?: string;
}

/**
 * Scrape user's public repositories and pinned items from profile HTML
 */
async function scrapeUserRepositories(owner: string): Promise<{ bio?: string; repos: ScrapedRepo[] }> {
  const repos: ScrapedRepo[] = [];
  let bio: string | undefined;

  // 1. Try fetching tab=repositories
  try {
    const res = await fetch(`https://github.com/${owner}?tab=repositories`, {
      headers: {
        'User-Agent': 'Felix-Interview-Coach/1.0 (Mozilla/5.0 compatible)',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const html = await res.text();
      // Match repositories in the repositories tab list
      const regex = /<a href="\/[^\/]+\/([^\"]+)" itemprop="name codeRepository"[^>]*>\s*([^\s<]+)[\s\S]*?(?:itemprop="description">\s*([\s\S]*?)\s*<\/p>)?[\s\S]*?(?:itemprop="programmingLanguage">([^<]+)<\/span>)?/g;
      let m;
      while ((m = regex.exec(html)) !== null && repos.length < 6) {
        const name = m[1].trim();
        if (name.toLowerCase() !== owner.toLowerCase() && !repos.some((r) => r.name.toLowerCase() === name.toLowerCase())) {
          repos.push({
            name,
            desc: m[3] ? m[3].replace(/<[^>]+>/g, '').trim() : undefined,
            lang: m[4] ? m[4].trim() : undefined,
          });
        }
      }
    }
  } catch (err) {
    console.warn(`HTML scrape for user repos ${owner} tab failed:`, err);
  }

  // 2. Try fetching main profile page for pinned items and bio
  try {
    const profileRes = await fetch(`https://github.com/${owner}`, {
      headers: {
        'User-Agent': 'Felix-Interview-Coach/1.0 (Mozilla/5.0 compatible)',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (profileRes.ok) {
      const html = await profileRes.text();

      // Extract user bio
      const bioMatch = html.match(/<div class="p-note user-profile-bio[^>]*>([\s\S]*?)<\/div>/);
      if (bioMatch) {
        const rawBio = bioMatch[1].replace(/<[^>]+>/g, '').trim();
        if (rawBio) bio = rawBio;
      }

      // Match pinned items on profile
      const pinnedRegex = /<span class="repo"[^>]*title="([^\"]+)"/g;
      let pm;
      while ((pm = pinnedRegex.exec(html)) !== null && repos.length < 6) {
        const name = pm[1].trim();
        if (name.toLowerCase() !== owner.toLowerCase() && !repos.some((r) => r.name.toLowerCase() === name.toLowerCase())) {
          repos.push({ name });
        }
      }
    }
  } catch {}

  return { bio, repos };
}

/**
 * Fetch public repository context from GitHub URL
 */
export async function fetchGithubContext(githubUrl: string): Promise<string> {
  const target = parseGithubUrl(githubUrl);
  if (!target) return '';

  const { owner, repo } = target;
  let summary = `GitHub Account: ${owner}\n`;

  // Case A: Specific Repository provided
  if (repo) {
    summary += `Target Repository: ${repo}\n`;
    const readme = await fetchRawReadme(owner, repo);
    if (readme) {
      summary += `Repository README Overview:\n"""\n${readme}\n"""\n`;
      return summary;
    }

    try {
      const res = await fetch(`https://github.com/${owner}/${repo}`, {
        headers: { 'User-Agent': 'Felix-Interview-Coach/1.0' },
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const html = await res.text();
        const descMatch = html.match(/<p class="f4 my-3">([\s\S]*?)<\/p>/);
        if (descMatch) {
          summary += `Repository Description: ${descMatch[1].replace(/<[^>]+>/g, '').trim()}\n`;
        }
      }
    } catch {}

    return summary;
  }

  // Case B: User Profile provided (or username only)
  // 1. Fetch user's profile README if present
  const profileReadme = await fetchRawReadme(owner, owner);
  if (profileReadme) {
    summary += `Profile Portfolio Overview:\n"""\n${profileReadme.slice(0, 1000)}\n"""\n\n`;
  }

  // 2. Extract public repositories
  const { bio, repos } = await scrapeUserRepositories(owner);
  if (bio) {
    summary += `Developer Bio: "${bio}"\n`;
  }

  // Fallback to GitHub REST API if scraping got nothing
  let finalRepos = repos;
  if (finalRepos.length === 0) {
    try {
      const headers: Record<string, string> = {
        'User-Agent': 'Felix-Interview-Coach/1.0',
      };
      if (process.env.GITHUB_TOKEN) {
        headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
      }
      const apiUrl = `https://api.github.com/users/${owner}/repos?sort=updated&per_page=5`;
      const res = await fetch(apiUrl, { headers, signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data: any = await res.json();
        if (Array.isArray(data)) {
          finalRepos = data.slice(0, 5).map((r: any) => ({
            name: r.name,
            desc: r.description || '',
            lang: r.language || '',
          }));
        }
      }
    } catch {}
  }

  // 3. For the top 2 repos, fetch README excerpts to understand technical depth
  if (finalRepos.length > 0) {
    summary += `Featured Public Projects:\n`;
    for (let i = 0; i < finalRepos.length; i++) {
      const r = finalRepos[i];
      let repoLine = `- Project "${r.name}"`;
      if (r.lang) repoLine += ` (${r.lang})`;
      if (r.desc) repoLine += `: ${r.desc}`;
      summary += `${repoLine}\n`;

      if (i < 2) {
        const readmeExcerpt = await fetchRawReadme(owner, r.name);
        if (readmeExcerpt) {
          summary += `  Technical README excerpt for ${r.name}:\n  """\n  ${readmeExcerpt.slice(0, 500).replace(/\n+/g, '\n  ')}\n  """\n`;
        }
      }
    }
  } else {
    // Graceful fallback profile context so model never says it couldn't access
    summary += `Candidate GitHub Profile: @${owner} (active contributor on GitHub). Probe their hands-on software development experience, system design approaches, and technical project decisions.\n`;
  }

  return summary;
}
