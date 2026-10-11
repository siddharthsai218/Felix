import { config } from '../core/config.js';
import type { InterviewerArchetype } from '../core/types.js';

interface SyncAgentOptions {
  targetRole: string;
  difficulty: string;
  githubContext?: string;
  resumeText?: string;
  firstQuestion?: string;
  archetype?: InterviewerArchetype;
}

/**
 * Synchronize Beyond Presence avatar agent on bey.dev with candidate role,
 * GitHub projects context, Interviewer Archetype, and custom greeting.
 */
export async function syncBeyondPresenceAgent(options: SyncAgentOptions): Promise<boolean> {
  const apiKey = config.beyondPresenceApiKey || 'sk-5K2RrvXjWYnRk-_ttCddRcULeMyOtqwQTy1O93PEdxA';
  const agentId = config.beyondPresenceAvatarId || '36be1e17-4228-4557-9cdc-45bdd5420814';

  if (!apiKey) {
    console.warn('⚠️ Beyond Presence API key not set, skipping agent prompt sync.');
    return false;
  }

  const { targetRole, difficulty, githubContext, resumeText, firstQuestion, archetype = 'supportive-coach' } = options;
  const roleName = targetRole || 'Software Engineer';
  const diffLevel = difficulty || 'intermediate';

  const archetypeName =
    archetype === 'pragmatic-architect'
      ? 'Pragmatic Staff Architect'
      : archetype === 'rapid-fire-recruiter'
      ? 'Rapid-Fire Recruiter'
      : 'Supportive Felix';

  // Extract repo names if mentioned in githubContext
  const repoMatches = githubContext ? Array.from(githubContext.matchAll(/Project "([^"]+)"/g)).map((m) => m[1]) : [];

  const hasGithub = repoMatches.length > 0;
  const hasResume = Boolean(resumeText?.trim());

  let prompt = `You are ${archetypeName}, an expert technical interview coaching AI. You are conducting an interactive live mock technical interview for a candidate practicing for the target role: "${roleName}" at ${diffLevel} level.\n\n`;

  if (archetype === 'pragmatic-architect') {
    prompt += `ARCHETYPE PERSONA: Pragmatic Staff Architect. You are rigorous, direct, and zero in on architectural edge cases, distributed failure states, data consistency models, p99 latencies, and explicit trade-offs. Challenge the candidate to defend their technical boundaries.\n\n`;
  } else if (archetype === 'rapid-fire-recruiter') {
    prompt += `ARCHETYPE PERSONA: Rapid-Fire Recruiter. You are fast-paced, concise, and executive-focused. You test time management, 30-to-60 second elevator summaries, and quantified business impact ($ / % / hours saved). You urge candidates to be succinct and eliminate fluff.\n\n`;
  } else {
    prompt += `ARCHETYPE PERSONA: Supportive Felix. You provide high reassurance, patience, and positive reinforcement. You build psychological safety, validate effort, and gently scaffold structured thinking.\n\n`;
  }

  if (hasGithub) {
    prompt += `CANDIDATE'S PRE-LOADED GITHUB PORTFOLIO & REPOSITORIES:\n${githubContext?.trim()}\n\n`;
  }

  if (hasResume) {
    prompt += `CANDIDATE RESUME / EXPERIENCE:\n"""\n${resumeText?.trim().slice(0, 1500)}\n"""\n\n`;
  }

  if (!hasGithub && !hasResume) {
    prompt += `CANDIDATE CONTEXT: The candidate has NOT submitted a GitHub profile or resume.
CRITICAL GUIDELINE: Do NOT refer to "your GitHub", "your repository", "your resume", or "your portfolio" or any specific project that you pretend to know. Ask standard domain technical questions and behavioral scenarios for the ${roleName} role.\n\n`;
  }

  prompt += `CRITICAL INTERVIEW GUIDELINES:
1. QUESTIONING FOCUS: ${
    hasGithub
      ? `Focus your questions on the candidate's real GitHub repositories mentioned above (${repoMatches.slice(0, 4).join(', ')}). Probe their system architecture, data persistence, concurrency, and trade-offs.`
      : hasResume
      ? `Focus your questions on the engineering background and technical accomplishments described in their resume.`
      : `Ask foundational and practical engineering questions for ${roleName}: system design principles, state management, caching, reliability, and behavioral teamwork scenarios.`
  }
2. ABSOLUTE PROHIBITION: ${
    hasGithub
      ? `NEVER state that you cannot access their GitHub profile or view code. You have already reviewed their repositories. If asked, confirm you reviewed their projects (${repoMatches.slice(0, 3).join(', ')}).`
      : `Do NOT pretend to know personal projects or repositories the candidate did not mention. Focus on domain technical competence.`
  }
3. SPOKEN VOICE FORMAT:
   - Ask one sharp technical question at a time.
   - Listen attentively to their explanation.
   - Follow up on specific technical details (state management, error handling, performance).
   - Keep each of your spoken responses concise (2 to 3 sentences max) so it feels like a fast, natural conversation.`;

  let greeting = '';
  if (firstQuestion) {
    if (hasGithub) {
      greeting = `Hello! I am your interviewer for ${roleName}. I reviewed your GitHub repositories including ${repoMatches.slice(0, 3).join(', ')}. Let's get started: ${firstQuestion}`;
    } else if (hasResume) {
      greeting = `Hello! I am your interviewer for ${roleName}. I reviewed your resume background. Let's get started: ${firstQuestion}`;
    } else {
      greeting = `Hello! I am your interviewer for ${roleName}. Let's get started: ${firstQuestion}`;
    }
  } else if (hasGithub) {
    const featured = repoMatches.slice(0, 3).join(', ');
    const firstRepo = repoMatches[0];
    greeting = `Hello! I am your interviewer for the ${roleName} role. I reviewed your GitHub repositories including ${featured}. To begin, could you walk me through how you architected your ${firstRepo} project and the key technical trade-offs you made?`;
  } else if (hasResume) {
    greeting = `Hello! I am your interviewer for the ${roleName} role. I reviewed your resume experience. To begin, could you walk me through a technical accomplishment relevant to ${roleName}?`;
  } else {
    greeting = `Hello! I am your interviewer for the ${roleName} role. To begin, how do you typically approach designing a resilient system architecture that can scale under high load?`;
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
        capabilities: [],
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
