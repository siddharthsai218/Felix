import { NextResponse } from 'next/server';

/**
 * Robust GitHub repository extractor that:
 * 1. Scrapes `tab=repositories` HTML with block parsing
 * 2. Falls back to pinned items on profile page
 * 3. Falls back to GitHub Public REST API
 */
async function scrapeRepositories(owner: string): Promise<Array<{ name: string; desc: string; lang: string }>> {
  const repos: Array<{ name: string; desc: string; lang: string }> = [];

  // Strategy 1: tab=repositories HTML scrape
  try {
    const ghRes = await fetch(`https://github.com/${owner}?tab=repositories`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Felix-Interview-Coach/1.0)',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(3500),
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

  // Strategy 2: Profile page pinned items
  if (repos.length === 0) {
    try {
      const profileRes = await fetch(`https://github.com/${owner}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Felix-Interview-Coach/1.0)',
          'Accept': 'text/html',
        },
        signal: AbortSignal.timeout(3000),
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

  // Strategy 3: GitHub REST API fallback
  if (repos.length === 0) {
    try {
      const apiRes = await fetch(`https://api.github.com/users/${owner}/repos?sort=updated&per_page=6`, {
        headers: {
          'User-Agent': 'Felix-Interview-Coach/1.0',
          'Accept': 'application/vnd.github.v3+json',
        },
        signal: AbortSignal.timeout(3000),
      });
      if (apiRes.ok) {
        const data = await apiRes.json();
        if (Array.isArray(data)) {
          for (const item of data) {
            if (repos.length < 6) {
              repos.push({
                name: item.name,
                desc: item.description || '',
                lang: item.language || '',
              });
            }
          }
        }
      }
    } catch {}
  }

  return repos;
}

/**
 * Fetch raw README excerpt in parallel with fast timeout
 */
async function fetchReadmeExcerpt(owner: string, repo: string): Promise<string> {
  try {
    const urls = [
      `https://raw.githubusercontent.com/${owner}/${repo}/main/README.md`,
      `https://raw.githubusercontent.com/${owner}/${repo}/master/README.md`,
      `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/README.md`,
    ];
    const fetchPromises = urls.map((url) =>
      fetch(url, { signal: AbortSignal.timeout(2000) }).then(async (res) => {
        if (!res.ok) throw new Error();
        const text = await res.text();
        if (text && text.trim().length > 30) return text;
        throw new Error();
      })
    );
    const text = await Promise.any(fetchPromises);
    return text.slice(0, 500).replace(/\n+/g, ' ').trim();
  } catch {
    return '';
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { targetRole, difficulty, githubUrl, resumeText, jobDescription, archetype, agentId: customAgentId } = body;

    const apiKey = process.env.BEYOND_PRESENCE_API_KEY || 'sk-5K2RrvXjWYnRk-_ttCddRcULeMyOtqwQTy1O93PEdxA';
    const agentId = process.env.NEXT_PUBLIC_BEYOND_PRESENCE_AGENT_ID || process.env.BEYOND_PRESENCE_AVATAR_ID || customAgentId || '36be1e17-4228-4557-9cdc-45bdd5420814';

    let githubContext = '';
    let repoNames: string[] = [];
    let owner = '';
    let targetRepo = '';

    if (githubUrl?.trim()) {
      let clean = githubUrl.trim().replace(/^@+/, '').split('?')[0].split('#')[0].replace(/\/+$/, '');
      const match = clean.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)(?:\/([a-zA-Z0-9_.-]+))?/);
      if (match) {
        owner = match[1];
        targetRepo = match[2] ? match[2].replace(/\.git$/, '') : '';
      } else if (clean.includes('/')) {
        const parts = clean.split('/');
        owner = parts[0];
        targetRepo = parts[1] ? parts[1].replace(/\.git$/, '') : '';
      } else {
        owner = clean;
      }

      if (owner) {
        if (targetRepo) {
          // A specific repository was provided (e.g., github.com/owner/project)
          repoNames = [targetRepo];
          const excerpt = await fetchReadmeExcerpt(owner, targetRepo);
          githubContext = `Candidate GitHub: @${owner}\nSpecific Target Project: "${targetRepo}"\n${excerpt ? `Project Overview:\n"""\n${excerpt}\n"""` : ''}`;
        } else {
          // A user profile was provided (e.g., github.com/owner or username)
          const repos = await scrapeRepositories(owner);
          repoNames = repos.map((r) => r.name);

          if (repos.length > 0) {
            const repoLines: string[] = [];
            for (let i = 0; i < repos.length; i++) {
              const r = repos[i];
              let line = `- Project "${r.name}"`;
              if (r.lang) line += ` (${r.lang})`;
              if (r.desc) line += `: ${r.desc}`;
              repoLines.push(line);
            }

            // Fetch README for the first repository if available
            const topExcerpt = await fetchReadmeExcerpt(owner, repos[0].name);
            if (topExcerpt) {
              repoLines[0] += `\n  Overview: "${topExcerpt.slice(0, 250)}..."`;
            }

            githubContext = `Candidate GitHub: @${owner}\nVerified Public Projects:\n` + repoLines.join('\n');
          } else {
            githubContext = `Candidate GitHub Account: @${owner} (active software developer on GitHub).`;
          }
        }
      }
    }

    const roleName = targetRole || 'Software Engineer';
    const diffLevel = difficulty || 'intermediate';
    const hasGithub = Boolean(githubUrl?.trim() && repoNames.length > 0);
    const hasResume = Boolean(resumeText?.trim());

    const archetypeName =
      archetype === 'pragmatic-architect'
        ? 'Pragmatic Staff Architect'
        : archetype === 'rapid-fire-recruiter'
        ? 'Rapid-Fire Recruiter'
        : 'Supportive Felix';

    // Build dynamic greeting that speaks their actual repos ONLY if provided
    let greeting = '';
    if (archetype === 'pragmatic-architect') {
      if (hasGithub) {
        greeting = `Hello, I'm your interviewer today. I examined your GitHub projects including ${repoNames.slice(0, 3).join(', ')}. To start, walk me through the system boundaries of ${repoNames[0]}, and what failure states or latency bottlenecks you had to mitigate.`;
      } else if (hasResume) {
        greeting = `Hello, I'm your interviewer today for ${roleName}. I reviewed your background. To kick off, walk me through an architecture decision where you had to balance distributed consistency against latency.`;
      } else {
        greeting = `Hello, I'm your interviewer for ${roleName}. To begin, when architecting a high-load system, how do you defend against cascading failures, cache stampedes, and partition splits?`;
      }
    } else if (archetype === 'rapid-fire-recruiter') {
      if (hasGithub) {
        greeting = `Hello! I'm your interviewer today. I took a look at your GitHub profile including ${repoNames.slice(0, 3).join(', ')}. In 60 seconds, give me the executive elevator summary of ${repoNames[0]} and its measurable impact.`;
      } else if (hasResume) {
        greeting = `Hello! I'm your interviewer today for ${roleName}. In 60 seconds, give me your executive pitch: what is the single biggest measurable ROI you delivered on your previous engineering project?`;
      } else {
        greeting = `Hello! I'm your interviewer for ${roleName}. In 60 seconds, walk me through your engineering core competency and how you manage high-velocity delivery under tight deadlines.`;
      }
    } else {
      if (hasGithub) {
        const featuredRepos = repoNames.slice(0, 3).join(', ');
        const firstRepo = repoNames[0];
        greeting = `Hello! I am Felix, your technical interviewer for the ${roleName} role. I reviewed your GitHub repositories including ${featuredRepos}. To get started, could you walk me through how you architected your ${firstRepo} project and the key technical trade-offs you made?`;
      } else if (hasResume) {
        greeting = `Hello! I am Felix, your technical interviewer for the ${roleName} role. I reviewed your resume background. To begin, could you walk me through a technical accomplishment relevant to ${roleName}?`;
      } else {
        greeting = `Hello! I am Felix, your technical interviewer for the ${roleName} role. To begin our discussion, how do you typically approach designing a resilient system architecture that can scale under high load?`;
      }
    }

    // Build system prompt strictly commanding the avatar
    let systemPrompt = `You are ${archetypeName}, an expert technical interview coaching AI conducting a live mock technical interview with a candidate for the target role: "${roleName}" at ${diffLevel} level.\n\n`;

    if (archetype === 'pragmatic-architect') {
      systemPrompt += `ARCHETYPE MANDATE: Pragmatic Staff Architect. You are rigorous, analytical, and uncompromising on engineering depth. Probing questions must focus on edge cases, distributed failure states, data consistency models, p99 tail latency, and explicit trade-offs. Challenge the candidate on what happens when infrastructure fails.\n\n`;
    } else if (archetype === 'rapid-fire-recruiter') {
      systemPrompt += `ARCHETYPE MANDATE: Rapid-Fire Recruiter. You are fast-paced, concise, and executive-focused. You test time management, 30-to-60 second elevator summaries, and quantified business impact ($ / % metrics, timeline delivery). Insist on succinct answers with zero filler.\n\n`;
    } else {
      systemPrompt += `ARCHETYPE MANDATE: Supportive Felix. You provide high reassurance, patience, and positive reinforcement. You build psychological safety, validate effort, and gently scaffold structured thinking.\n\n`;
    }

    if (hasGithub) {
      systemPrompt += `CANDIDATE'S PRE-LOADED GITHUB PORTFOLIO & REPOSITORIES:\n${githubContext}\n\n`;
    }

    if (hasResume) {
      systemPrompt += `CANDIDATE RESUME SUMMARY:\n"""\n${resumeText.trim().slice(0, 1000)}\n"""\n\n`;
    }

    if (jobDescription?.trim()) {
      systemPrompt += `TARGET JOB REQUIREMENTS:\n"""\n${jobDescription.trim().slice(0, 500)}\n"""\n\n`;
    }

    if (!hasGithub && !hasResume) {
      systemPrompt += `CANDIDATE CONTEXT: The candidate has NOT submitted a personal GitHub profile or resume.
CRITICAL MANDATE:
- DO NOT refer to "your GitHub", "your repositories", "your resume", or "your project" that you pretend to know.
- Do NOT claim you have seen their codebase or portfolio.
- Ask standard technical domain questions, architectural trade-offs, and behavioral engineering scenarios for the ${roleName} role.\n\n`;
    }

    systemPrompt += `CRITICAL INTERVIEW GUIDELINES:
1. QUESTIONING FOCUS: ${
      hasGithub
        ? `Focus your questions on the candidate's actual GitHub repositories listed above (${repoNames.slice(0, 4).join(', ')}). Probe their system architecture, data persistence, concurrency, and trade-offs.`
        : hasResume
        ? `Focus your questions on their real experiences, tools, and accomplishments from their resume.`
        : `Ask foundational and practical engineering questions for ${roleName}: system design principles, state management, caching, reliability, and behavioral teamwork scenarios.`
    }
2. ABSOLUTE PROHIBITION: ${
      hasGithub
        ? `NEVER state that you cannot access their GitHub profile or view code. You have already reviewed their repositories. If asked, confirm you reviewed their projects (${repoNames.slice(0, 3).join(', ')}).`
        : `Do NOT pretend to know personal projects or repositories the candidate did not mention. Focus on general technical competence for ${roleName}.`
    }
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
        capabilities: [],
      }),
    });

    const success = res.ok;
    return NextResponse.json({
      success,
      status: res.status,
      agentId,
      owner,
      targetRepo,
      repos: repoNames,
      greeting,
    });
  } catch (err: any) {
    console.error('API avatar sync error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
