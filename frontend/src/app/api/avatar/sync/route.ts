import { NextResponse } from 'next/server';

/**
 * Robust GitHub HTML parser to extract public repositories, descriptions, and languages
 * without hitting GitHub unauthenticated REST API rate limits.
 */
async function scrapeRepositories(owner: string): Promise<Array<{ name: string; desc: string; lang: string }>> {
  const repos: Array<{ name: string; desc: string; lang: string }> = [];

  try {
    const ghRes = await fetch(`https://github.com/${owner}?tab=repositories`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Felix-Interview-Coach/1.0)',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(4500),
    });

    if (ghRes.ok) {
      const html = await ghRes.text();
      const repoBlocks = html.split(/itemprop="name codeRepository"/);
      for (let i = 1; i < repoBlocks.length && repos.length < 8; i++) {
        const block = repoBlocks[i];
        const nameMatch = block.match(/>\s*([a-zA-Z0-9_.-]+)\s*<\/a>/);
        const descMatch = block.match(/itemprop="description">\s*([\s\S]*?)\s*<\/p>/);
        const langMatch = block.match(/itemprop="programmingLanguage">([^<]+)<\/span>/);

        if (nameMatch) {
          const name = nameMatch[1].trim();
          if (name.toLowerCase() !== owner.toLowerCase() && !repos.some((r) => r.name.toLowerCase() === name.toLowerCase())) {
            repos.push({
              name,
              desc: descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : '',
              lang: langMatch ? langMatch[1].trim() : '',
            });
          }
        }
      }
    }
  } catch (e) {
    console.warn(`Scraping repositories for @${owner} failed:`, e);
  }

  // Fallback: If tab=repositories gave nothing, try profile page pinned items
  if (repos.length === 0) {
    try {
      const profileRes = await fetch(`https://github.com/${owner}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Felix-Interview-Coach/1.0)',
          'Accept': 'text/html',
        },
        signal: AbortSignal.timeout(4000),
      });
      if (profileRes.ok) {
        const html = await profileRes.text();
        const pinnedRegex = /<span class="repo"[^>]*title="([^\"]+)"/g;
        let pm;
        while ((pm = pinnedRegex.exec(html)) !== null && repos.length < 6) {
          const name = pm[1].trim();
          if (name.toLowerCase() !== owner.toLowerCase() && !repos.some((r) => r.name.toLowerCase() === name.toLowerCase())) {
            repos.push({ name, desc: '', lang: '' });
          }
        }
      }
    } catch {}
  }

  return repos;
}

/**
 * Fetch raw README excerpt directly from raw.githubusercontent.com
 */
async function fetchReadmeExcerpt(owner: string, repo: string): Promise<string> {
  const branches = ['main', 'master', 'HEAD'];
  for (const branch of branches) {
    try {
      const res = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/README.md`, {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const text = await res.text();
        if (text && text.length > 30) {
          return text.slice(0, 600).replace(/\n+/g, ' ').trim();
        }
      }
    } catch {}
  }
  return '';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { targetRole, difficulty, githubUrl, resumeText, jobDescription } = body;

    const apiKey = process.env.BEYOND_PRESENCE_API_KEY || 'sk-wIOWAXQIVIaJsmmArCmyHNKm6Tzd2LQAxftBJG9Nfgk';
    const agentId = process.env.NEXT_PUBLIC_BEYOND_PRESENCE_AGENT_ID || 'bb8ad996-52ca-4039-98ff-8c5ec31e0ccc';

    let githubContext = '';
    let repoNames: string[] = [];
    let owner = '';

    if (githubUrl?.trim()) {
      // Clean owner from githubUrl or username
      let clean = githubUrl.trim().replace(/^@+/, '').split('?')[0].split('#')[0].replace(/\/+$/, '');
      const match = clean.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/);
      owner = match ? match[1] : clean.split('/')[0];

      if (owner) {
        const repos = await scrapeRepositories(owner);
        repoNames = repos.map((r) => r.name);

        if (repos.length > 0) {
          const repoLines: string[] = [];
          for (let i = 0; i < repos.length; i++) {
            const r = repos[i];
            let line = `- Project "${r.name}"`;
            if (r.lang) line += ` (${r.lang})`;
            if (r.desc) line += `: ${r.desc}`;
            
            // For top 2 repos, get a quick README excerpt
            if (i < 2) {
              const excerpt = await fetchReadmeExcerpt(owner, r.name);
              if (excerpt) {
                line += `\n  Overview: "${excerpt.slice(0, 250)}..."`;
              }
            }
            repoLines.push(line);
          }
          githubContext = `Candidate GitHub: @${owner}\nVerified Public Projects:\n` + repoLines.join('\n');
        } else {
          githubContext = `Candidate GitHub Account: @${owner} (active software developer on GitHub).`;
        }
      }
    }

    const roleName = targetRole || 'Software Engineer';
    const diffLevel = difficulty || 'intermediate';

    // Build dynamic greeting that speaks their actual repos
    let greeting = '';
    if (repoNames.length > 0) {
      const featuredRepos = repoNames.slice(0, 3).join(', ');
      const firstRepo = repoNames[0];
      greeting = `Hello! I am Felix, your technical interviewer for the ${roleName} role. I reviewed your GitHub repositories including ${featuredRepos}. To get started, could you walk me through how you architected your ${firstRepo} project and the key technical trade-offs you made?`;
    } else {
      greeting = `Hello! I am Felix, your technical interviewer for the ${roleName} role. Let's begin: could you walk me through a challenging technical project you worked on recently and the architectural trade-offs you faced?`;
    }

    // Build system prompt strictly commanding the avatar
    const systemPrompt = `You are Felix, an expert technical interview coaching AI conducting a live mock technical interview with a candidate for the target role: "${roleName}" at ${diffLevel} level.

${githubContext ? `CANDIDATE'S PRE-LOADED GITHUB PORTFOLIO & REPOSITORIES:\n${githubContext}\n\n` : ''}${resumeText?.trim() ? `CANDIDATE RESUME SUMMARY:\n"""\n${resumeText.trim().slice(0, 1000)}\n"""\n\n` : ''}${jobDescription?.trim() ? `TARGET JOB REQUIREMENTS:\n"""\n${jobDescription.trim().slice(0, 500)}\n"""\n\n` : ''}CRITICAL INTERVIEW GUIDELINES:
1. QUESTIONING FOCUS: You MUST focus your questions on the candidate's actual GitHub repositories listed above (${repoNames.length > 0 ? repoNames.slice(0, 4).join(', ') : 'their practical software engineering experience'}). Probe their system architecture, data persistence, concurrency, API design, and trade-offs.
2. ABSOLUTE PROHIBITION: NEVER state or say that you cannot access their GitHub profile, cannot view external links, or cannot browse websites. You ALREADY have full knowledge and details of their repositories right in front of you. If the candidate asks whether you can see their GitHub or asks what you know about them, warmly confirm that you have reviewed their repositories and discuss their specific projects.
3. SPOKEN VOICE FORMAT:
   - Ask one sharp technical question at a time.
   - Listen attentively to their explanation.
   - Follow up on specific technical details (state management, error handling, performance).
   - Keep each of your spoken responses concise (2 to 3 sentences max) so it feels like a fast, natural conversation.`;

    const res = await fetch(`https://api.bey.dev/v1/agents/${agentId}`, {
      method: 'PATCH',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system_prompt: systemPrompt,
        greeting,
      }),
    });

    const success = res.ok;
    return NextResponse.json({
      success,
      status: res.status,
      agentId,
      owner,
      repos: repoNames,
      greeting,
    });
  } catch (err: any) {
    console.error('API avatar sync error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
