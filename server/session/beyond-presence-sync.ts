import { config } from '../core/config.js';

interface SyncAgentOptions {
  targetRole: string;
  difficulty: string;
  githubContext?: string;
  resumeText?: string;
  firstQuestion?: string;
}

/**
 * Synchronize Beyond Presence avatar agent on bey.dev with candidate role,
 * GitHub projects context, and custom interview greeting.
 */
export async function syncBeyondPresenceAgent(options: SyncAgentOptions): Promise<boolean> {
  const apiKey = config.beyondPresenceApiKey || 'sk-wIOWAXQIVIaJsmmArCmyHNKm6Tzd2LQAxftBJG9Nfgk';
  const agentId = config.beyondPresenceAvatarId || 'bb8ad996-52ca-4039-98ff-8c5ec31e0ccc';

  if (!apiKey) {
    console.warn('⚠️ Beyond Presence API key not set, skipping agent prompt sync.');
    return false;
  }

  const { targetRole, difficulty, githubContext, resumeText, firstQuestion } = options;
  const roleName = targetRole || 'Software Engineer';
  const diffLevel = difficulty || 'intermediate';

  // Extract repo names if mentioned in githubContext
  const repoMatches = githubContext ? Array.from(githubContext.matchAll(/Project "([^"]+)"/g)).map((m) => m[1]) : [];

  let prompt = `You are Felix, an expert technical interview coaching AI. You are conducting an interactive live mock technical interview for a candidate practicing for the target role: "${roleName}" at ${diffLevel} level.\n\n`;

  if (githubContext?.trim()) {
    prompt += `CANDIDATE'S PRE-LOADED GITHUB PORTFOLIO & REPOSITORIES:\n${githubContext.trim()}\n\n`;
  }

  if (resumeText?.trim()) {
    prompt += `CANDIDATE RESUME / EXPERIENCE:\n"""\n${resumeText.trim().slice(0, 1500)}\n"""\n\n`;
  }

  prompt += `CRITICAL INTERVIEW GUIDELINES:
1. QUESTIONING FOCUS: You MUST actively challenge and ask questions specifically about the candidate's real GitHub repositories mentioned above (${repoMatches.length > 0 ? repoMatches.slice(0, 4).join(', ') : 'their software projects'}).
2. ABSOLUTE PROHIBITION: NEVER state or say that you cannot access their GitHub profile, cannot view external links, or cannot view code. You ALREADY have full knowledge and details of their repositories right in front of you. If the candidate asks whether you can see their GitHub or asks about their profile, warmly confirm that you have reviewed their repositories and discuss their specific projects.
3. SPOKEN VOICE FORMAT:
   - Ask one sharp technical question at a time.
   - Listen attentively to their explanation.
   - Follow up on specific technical details (state management, error handling, performance).
   - Keep each of your spoken responses concise (2 to 3 sentences max) so it feels like a fast, natural conversation.`;

  let greeting = '';
  if (firstQuestion) {
    greeting = `Hello! I am Felix, your technical interviewer for ${roleName}. I reviewed your GitHub repositories including ${repoMatches.slice(0, 3).join(', ') || 'your portfolio'}. Let's get started: ${firstQuestion}`;
  } else if (repoMatches.length > 0) {
    const featured = repoMatches.slice(0, 3).join(', ');
    const firstRepo = repoMatches[0];
    greeting = `Hello! I am Felix, your technical interviewer for the ${roleName} role. I reviewed your GitHub repositories including ${featured}. To begin, could you walk me through how you architected your ${firstRepo} project and the key technical trade-offs you made?`;
  } else {
    greeting = `Hello! I am Felix, your technical interviewer for the ${roleName} role. Let's begin: could you walk me through a challenging technical project you worked on recently and the architectural trade-offs you faced?`;
  }

  try {
    const res = await fetch(`https://api.bey.dev/v1/agents/${agentId}`, {
      method: 'PATCH',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system_prompt: prompt,
        greeting,
      }),
    });

    if (res.ok) {
      console.log(`✅ Beyond Presence agent ${agentId} synced with role "${roleName}" and GitHub context.`);
      return true;
    } else {
      const err = await res.text();
      console.warn(`Failed to sync Beyond Presence agent (${res.status}):`, err);
      return false;
    }
  } catch (err) {
    console.warn('Network error syncing Beyond Presence agent:', err);
    return false;
  }
}
