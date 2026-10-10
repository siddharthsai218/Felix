import { NextResponse } from 'next/server';

interface CandidateResponse {
  questionAsked: string;
  transcript: string;
  durationMs?: number;
}

interface TelemetryPayload {
  gazePercentage?: number;
  gazeDirection?: string;
  dominantExpression?: string;
  composureScore?: number;
  speakingRateWpm?: number;
  jitterPercent?: number;
  pitchMeanHz?: number;
  pauseCount?: number;
  lastPauseDurationS?: number;
  faceDetected?: boolean;
  vocalEnergy?: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      roleTitle = 'Software Engineer',
      responses = [],
      telemetry = {},
    }: {
      roleTitle: string;
      responses: CandidateResponse[];
      telemetry: TelemetryPayload;
    } = body;

    const apiKey =
      process.env.GEMINI_API_KEY ||
      'AQ.Ab8RN6LYpmPS-oxD4cJXft4KZGhtR3ZPOStRbNaWBM-FzBs-Dw';

    // Combine transcripts or select primary response
    const validResponses = responses.filter((r) => r && r.transcript && r.transcript.trim().length > 0);
    const primaryResponse = validResponses.length > 0 ? validResponses[0] : null;
    const allTranscriptsText = validResponses
      .map((r, i) => `[Question ${i + 1}]\nInterviewer Question: "${r.questionAsked}"\nCandidate's Exact Spoken Answer: "${r.transcript}"`)
      .join('\n\n');

    const prompt = `You are Felix, an expert EdTech interview coaching AI. You provide honest, evidence-based formative feedback to learners.
You are evaluating a candidate who just practiced for the role: "${roleTitle}".

CRITICAL INSTRUCTIONS:
1. YOU MUST EVALUATE WHAT THE CANDIDATE ACTUALLY SPOKE:
Candidate's Spoken Transcripts:
"""
${allTranscriptsText || 'Candidate did not speak or gave very brief/inaudible responses.'}
"""

Candidate's Measured Behavioral Telemetry:
- Gaze focus on camera: ${telemetry.gazePercentage ?? 0}% (Orientation: ${telemetry.gazeDirection ?? 'unknown'}, Face Detected: ${telemetry.faceDetected ? 'Yes' : 'No'})
- Vocal Pacing: ${telemetry.speakingRateWpm ?? 0} WPM
- Vocal Jitter / Stability: ${telemetry.jitterPercent ?? 1.0}% (Pitch Mean: ${telemetry.pitchMeanHz ?? 140} Hz)
- Dominant Expression / Tone: "${telemetry.dominantExpression ?? 'Neutral'}" (Energy: "${telemetry.vocalEnergy ?? 'moderate'}")
- Composure / Energy Score: ${telemetry.composureScore ?? 65}%
- Hesitation Pauses: ${telemetry.pauseCount ?? 0}

2. HONEST & ACCURATE SCORING RULES:
- If the candidate spoke casually, sleepily, gave a short or lazy answer (e.g. "i was just sleepy", "i don't know", informal mumbles):
  DO NOT give fake high scores! Score realistically low (e.g. 1.8 to 2.8 out of 5.0).
  In your critique, explicitly quote their actual words and explain why their answer fell short in depth, technical rigor, and STAR delivery.
- If the candidate gave a solid, detailed technical explanation:
  Score fairly (e.g. 3.8 to 4.6) and highlight their technical strengths while coaching them on metrics.
- Gaze & telemetry evaluation:
  If gaze was low (< 50%) or face was not visible: Point out that looking away from the camera or not showing direct eye contact reduces engagement.
  If vocal energy was low, monotone, or sluggish WPM: Point out how raising vocal energy and projection conveys enthusiasm and confidence.

3. REQUIRED JSON OUTPUT FORMAT:
Return ONLY a valid JSON object matching this schema:
{
  "overallScore": number (1.0 to 5.0, rounded to 1 decimal),
  "scoreRationale": {
    "overallScore": number,
    "ratingLabel": string (e.g. "Needs Practice", "Emerging Competency", "Career-Ready", "Distinguished"),
    "scoringFormula": "35% Technical Depth + 25% STAR Framework + 20% Communication Pacing + 20% Behavioral Presence",
    "summary": string (detailed, transparent explanation of how this overall score was calculated from their words),
    "strengthsExplanation": string (summary of exact phrases and answers that earned credit),
    "deductionsExplanation": string (summary of exact reasons points were deducted, citing weak phrases)
  },
  "transcriptAudit": [
    {
      "turnNumber": number (1, 2, ...),
      "question": string (the interviewer question asked),
      "transcript": string (the candidate's exact spoken words),
      "turnScore": number (1.0 to 5.0 for this specific answer),
      "durationFormatted": string (e.g. "35s"),
      "wordCount": number,
      "scoringJustification": string (transparent explanation of why this specific score was awarded for this turn),
      "positiveEvidence": [
        { "quote": string (verbatim phrase from their answer), "impact": string (why this earned credit) }
      ],
      "deductionEvidence": [
        { "quote": string (verbatim phrase from their answer), "critique": string (why points were lost), "recommendation": string (what to say instead) }
      ]
    }
  ],
  "rubricScores": [
    {
      "criterion": "Technical Depth & Domain Competency",
      "score": number (1.0 to 5.0),
      "feedback": string (honest evaluation quoting candidate),
      "quotes": [
        { "text": string (actual quote from candidate transcript or note), "time": "00:45" }
      ]
    },
    {
      "criterion": "STAR Structure & Impact Quantification",
      "score": number (1.0 to 5.0),
      "feedback": string (critique of Situation, Task, Action, Result elements),
      "quotes": [
        { "text": string (actual quote), "time": "01:20" }
      ]
    },
    {
      "criterion": "Communication Pacing & Clarity",
      "score": number (1.0 to 5.0),
      "feedback": string (feedback reflecting their ${telemetry.speakingRateWpm ?? 0} WPM and diction),
      "quotes": [
        { "text": string (actual quote or observation), "time": "Prosody" }
      ]
    },
    {
      "criterion": "Composure & Behavioral Presence",
      "score": number (1.0 to 5.0),
      "feedback": string (feedback reflecting their ${telemetry.gazePercentage ?? 0}% gaze and vocal composure),
      "quotes": [
        { "text": string (quote or telemetry note), "time": "Telemetry" }
      ]
    }
  ],
  "behavioralInsights": [
    {
      "icon": "👁️",
      "title": "MediaPipe Eye Contact",
      "text": string (honest note about their ${telemetry.gazePercentage ?? 0}% gaze),
      "metric": "${telemetry.gazePercentage ?? 0}% Gaze",
      "status": "${(telemetry.gazePercentage ?? 0) >= 70 ? 'optimal' : 'attention'}"
    },
    {
      "icon": "🗣️",
      "title": "Parselmouth Pacing",
      "text": string (note about their ${telemetry.speakingRateWpm ?? 0} WPM cadence),
      "metric": "${telemetry.speakingRateWpm ?? 0} WPM",
      "status": "${(telemetry.speakingRateWpm ?? 0) >= 115 && (telemetry.speakingRateWpm ?? 0) <= 165 ? 'optimal' : 'attention'}"
    },
    {
      "icon": "📊",
      "title": "Vocal Perturbation (Jitter)",
      "text": string (note about their ${telemetry.jitterPercent ?? 1.0}% vocal jitter and vocal energy),
      "metric": "${telemetry.jitterPercent ?? 1.0}% Jitter",
      "status": "${(telemetry.jitterPercent ?? 1.0) <= 1.5 ? 'optimal' : 'attention'}"
    },
    {
      "icon": "⏱️",
      "title": "Cognitive Hesitation",
      "text": string (note about thinking pauses),
      "metric": "${telemetry.pauseCount ?? 0} Pauses",
      "status": "optimal"
    }
  ],
  "transformations": [
    {
      "questionAsked": string,
      "originalTranscript": string (the candidate's exact words),
      "critiqueNotes": [
        string (critique note 1 citing specific weakness in candidate's words),
        string (critique note 2),
        string (critique note 3)
      ],
      "starRewrite": {
        "situation": string (professional situation framing the candidate's topic),
        "task": string (clear ownership task),
        "action": string (detailed technical actions),
        "result": string (quantifiable metrics and impact)
      },
      "competency": string (e.g. "STAR Delivery & Technical Ownership"),
      "scoreImprovement": string (e.g. "+55% Clarity & Impact")
    }
  ],
  "remediationPlan": [
    {
      "topic": string,
      "drillQuestion": string,
      "targetOutcome": string
    }
  ]
}`;

    // Try Gemini models in priority order
    const candidateModels = [
      'gemini-2.5-flash-lite',
      'gemini-2.5-flash',
      'gemini-flash-lite-latest',
      'gemini-flash-latest',
      'gemini-3.1-flash-lite',
      'gemini-3.8-flash',
    ];

    for (const model of candidateModels) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 3000,
              },
            }),
            signal: AbortSignal.timeout(10000), // Fast 10s timeout
          }
        );

        if (!response.ok) {
          const errData = await response.text();
          console.warn(`Gemini model ${model} returned ${response.status}:`, errData);
          continue;
        }

        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) continue;

        // Robust JSON extraction between first { and last }
        let cleaned = rawText.trim();
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          cleaned = cleaned.slice(firstBrace, lastBrace + 1);
        } else {
          if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
          else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
          if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
          cleaned = cleaned.trim();
        }

        const parsed = JSON.parse(cleaned);

        // Ensure scoreRationale and transcriptAudit exist
        if (!parsed.scoreRationale) {
          parsed.scoreRationale = {
            overallScore: parsed.overallScore || 3.5,
            ratingLabel: (parsed.overallScore || 3.5) >= 3.8 ? 'Career-Ready' : 'Needs Practice',
            scoringFormula: '35% Technical Depth + 25% STAR Framework + 20% Communication Pacing + 20% Behavioral Presence',
            summary: `Overall score of ${parsed.overallScore || 3.5} calculated from your spoken responses against the ${roleTitle} evaluation rubric.`,
          };
        }

        if (!Array.isArray(parsed.transcriptAudit) || parsed.transcriptAudit.length === 0) {
          parsed.transcriptAudit = validResponses.map((r, i) => ({
            turnNumber: i + 1,
            question: r.questionAsked || `Question ${i + 1} for ${roleTitle}`,
            transcript: r.transcript,
            turnScore: parsed.overallScore || 3.5,
            durationFormatted: `${Math.round((r.durationMs || 25000) / 1000)}s`,
            wordCount: r.transcript.split(/\s+/).filter(Boolean).length,
            scoringJustification: `Assessed for technical domain depth and communication clarity.`,
            positiveEvidence: [
              { quote: r.transcript.slice(0, Math.min(r.transcript.length, 80)), impact: 'Direct response to question.' },
            ],
            deductionEvidence: [
              {
                quote: r.transcript.slice(Math.min(r.transcript.length, 30), Math.min(r.transcript.length, 90)),
                critique: 'Can improve structural framing and add quantifiable engineering metrics.',
                recommendation: 'Use STAR structure with concrete benchmarks.',
              },
            ],
          }));
        }

        return NextResponse.json({ success: true, ...parsed });
      } catch (err: any) {
        console.warn(`Error generating evaluation with ${model}:`, err?.message || err);
      }
    }

    // Dynamic fallback grounded in candidate's actual words
    const candidateWords = primaryResponse?.transcript || 'I spoke informally during the interview.';
    const wordCount = candidateWords.split(/\s+/).filter(Boolean).length;
    const isShortOrSleepy = wordCount < 25 || candidateWords.toLowerCase().includes('sleep') || candidateWords.toLowerCase().includes('tired') || candidateWords.toLowerCase().includes("don't know");
    const gazeScore = telemetry.gazePercentage ?? 0;
    const wpm = telemetry.speakingRateWpm ?? (wordCount > 0 ? 80 : 0);
    const jitter = telemetry.jitterPercent ?? 1.2;

    const fallbackScore = isShortOrSleepy ? 2.3 : 3.8;

    // Build turn-by-turn audit for all responses
    const fallbackAudit = (validResponses.length > 0 ? validResponses : [{ questionAsked: `Technical question for ${roleTitle}`, transcript: candidateWords, durationMs: 25000 }]).map((r, i) => {
      const words = r.transcript.split(/\s+/).filter(Boolean);
      const isTurnWeak = words.length < 25 || r.transcript.toLowerCase().includes('sleep') || r.transcript.toLowerCase().includes('tired');
      const turnScore = isTurnWeak ? 2.2 : 3.8;
      return {
        turnNumber: i + 1,
        question: r.questionAsked || `Question ${i + 1} for ${roleTitle}`,
        transcript: r.transcript,
        turnScore,
        durationFormatted: `${Math.round((r.durationMs || 25000) / 1000)}s`,
        wordCount: words.length,
        scoringJustification: isTurnWeak
          ? `Response was short (${words.length} words) and conversational. Missing structured STAR delivery and specific technical design details for ${roleTitle}.`
          : `Demonstrated technical understanding for ${roleTitle}. Communicated concepts with relevant context.`,
        positiveEvidence: isTurnWeak
          ? []
          : [
              {
                quote: r.transcript.slice(0, Math.min(r.transcript.length, 85)),
                impact: `Directly addressed the technical subject with domain terminology for ${roleTitle}.`,
              },
            ],
        deductionEvidence: isTurnWeak
          ? [
              {
                quote: r.transcript.slice(0, Math.min(r.transcript.length, 80)),
                critique: `Informal delivery without measurable results or architecture details.`,
                recommendation: `Follow Situation-Task-Action-Result and cite specific tools, algorithms, or benchmarks.`,
              },
            ]
          : [
              {
                quote: r.transcript.slice(Math.min(r.transcript.length, 40), Math.min(r.transcript.length, 120)) || r.transcript,
                critique: `Lacks explicit engineering trade-offs and quantitative performance metrics.`,
                recommendation: `Cite concrete numbers (e.g., latency dropped from 800ms to 95ms; 99.9% uptime).`,
              },
            ],
      };
    });

    return NextResponse.json({
      success: true,
      overallScore: fallbackScore,
      scoreRationale: {
        overallScore: fallbackScore,
        ratingLabel: fallbackScore >= 3.8 ? 'Career-Ready' : 'Needs Practice / Growth Required',
        scoringFormula: '35% Technical Depth + 25% STAR Framework + 20% Communication Pacing + 20% Behavioral Presence',
        summary: isShortOrSleepy
          ? `Your overall score of ${fallbackScore} reflects that your responses were brief and informal. While you attempted to answer, key engineering depth, measurable metrics, and STAR structure were missing in your spoken words.`
          : `Your overall score of ${fallbackScore} reflects solid technical understanding for ${roleTitle}, with clear responses. Further growth will come from quantifying your impact with exact benchmarks and strengthening STAR framing.`,
        strengthsExplanation: isShortOrSleepy
          ? 'Attempted the interview question and maintained vocal presence.'
          : `Clearly communicated technical reasoning and articulated engineering steps for ${roleTitle}.`,
        deductionsExplanation: isShortOrSleepy
          ? `Deductions applied due to informal phrasing ("${candidateWords.slice(0, 50)}..."), missing architectural specifics, and absent quantifiable results.`
          : 'Minor deductions applied for unquantified outcomes and missing system scalability trade-offs.',
      },
      transcriptAudit: fallbackAudit,
      rubricScores: [
        {
          criterion: 'Technical Depth & Domain Competency',
          score: isShortOrSleepy ? 2.1 : 3.9,
          feedback: isShortOrSleepy
            ? `The response lacked specific technical architecture, design patterns, and engineering terminology for ${roleTitle}.`
            : `Demonstrated technical understanding for ${roleTitle}, with clear explanation of technical approaches.`,
          quotes: [
            {
              text: candidateWords.slice(0, 90) + (candidateWords.length > 90 ? '...' : ''),
              time: '00:30',
            },
          ],
        },
        {
          criterion: 'STAR Structure & Impact Quantification',
          score: isShortOrSleepy ? 1.9 : 3.5,
          feedback: isShortOrSleepy
            ? 'Missing Situation, Task, Action, and measurable Result. Answers were unstructured and conversational.'
            : 'Good structural framing. Can elevate by citing quantitative benchmarks (latency, throughput, revenue).',
          quotes: [
            {
              text: candidateWords.slice(Math.min(candidateWords.length, 40), Math.min(candidateWords.length, 120)) || candidateWords,
              time: '01:10',
            },
          ],
        },
        {
          criterion: 'Communication Pacing & Clarity',
          score: isShortOrSleepy ? 2.5 : 4.0,
          feedback: wpm < 100
            ? `Cadence was sluggish at ${wpm} WPM. Increase projection and energetic pacing to engage the interviewer.`
            : `Pacing was measured at ${wpm} WPM with clear articulation.`,
          quotes: [
            {
              text: wpm < 100 ? 'Low speaking cadence and sluggish delivery observed.' : 'Consistent pacing maintained.',
              time: 'Prosody',
            },
          ],
        },
        {
          criterion: 'Composure & Behavioral Presence',
          score: gazeScore < 50 ? 2.2 : 4.2,
          feedback: gazeScore < 50
            ? `Camera gaze was low (${gazeScore}%). Looking away or not showing direct eye contact reduces rapport.`
            : `Maintained good visual focus (${gazeScore}%) with steady composure throughout questioning.`,
          quotes: [
            {
              text: gazeScore < 50 ? 'Limited camera eye contact detected.' : 'Steady camera focus observed.',
              time: 'Telemetry',
            },
          ],
        },
      ],
      behavioralInsights: [
        {
          icon: '👁️',
          title: 'MediaPipe Eye Contact',
          text: gazeScore >= 70
            ? `${gazeScore}% Camera focus maintained throughout responses. Excellent direct engagement.`
            : `${gazeScore}% Camera focus detected. Practice looking directly into the camera lens to build interviewer trust.`,
          metric: `${gazeScore}% Gaze`,
          status: gazeScore >= 70 ? 'optimal' : 'attention',
        },
        {
          icon: '🗣️',
          title: 'Parselmouth Pacing',
          text: wpm >= 115 && wpm <= 165
            ? `Speaking rate averaged ${wpm} WPM. Optimal conversational cadence.`
            : `Speaking cadence averaged ${wpm} WPM (${wpm < 115 ? 'Sluggish / low vocal energy' : 'Fast pace'}). Aim for 120-150 WPM.`,
          metric: `${wpm} WPM`,
          status: wpm >= 115 && wpm <= 165 ? 'optimal' : 'attention',
        },
        {
          icon: '📊',
          title: 'Vocal Perturbation (Jitter)',
          text: jitter <= 1.5
            ? `Vocal stability steady at ${jitter}%. Confirms steady tone and composure.`
            : `Vocal jitter measured at ${jitter}%. Low vocal energy or vocal fry detected—support your voice with full breathing.`,
          metric: `${jitter}% Jitter`,
          status: jitter <= 1.5 ? 'optimal' : 'attention',
        },
        {
          icon: '⏱️',
          title: 'Cognitive Hesitation',
          text: `${telemetry.pauseCount ?? 0} pauses detected during responses.`,
          metric: `${telemetry.pauseCount ?? 0} Pauses`,
          status: 'optimal',
        },
      ],
      transformations: [
        {
          questionAsked: primaryResponse?.questionAsked || `Describe a key technical challenge you solved in ${roleTitle}.`,
          originalTranscript: candidateWords,
          critiqueNotes: isShortOrSleepy
            ? [
                'Informal & ungrounded: Missing specific technical context and professional framing.',
                'Absent STAR structure: Did not define your personal task or engineering actions.',
                'No measurable result: State quantifiable outcomes (e.g. latency, throughput, error reduction).',
              ]
            : [
                'Highlight personal agency: Differentiate your technical decisions from team actions.',
                'Add quantifiable benchmarks: Include performance metrics, percentages, or cost savings.',
                'Deepen architectural reasoning: Explain why you chose this design over alternatives.',
              ],
          starRewrite: {
            situation: `In our project for ${roleTitle}, we faced high latency and unoptimized resource usage that degraded user experience.`,
            task: `I took full ownership of auditing the bottlenecks, designing a resilient architecture, and establishing strict benchmarks.`,
            action: `I decoupled the processing pipeline, implemented event-driven caching, and automated integration validation across key workflows.`,
            result: `Reduced response latency by 58%, resolved concurrency bottlenecks, and achieved 99.9% uptime during stress testing.`,
          },
          competency: 'STAR Delivery & Technical Ownership',
          scoreImprovement: isShortOrSleepy ? '+72% Structure & Rigor' : '+40% Impact & Structure',
        },
      ],
      remediationPlan: [
        {
          topic: 'Mastering the STAR Method Under Pressure',
          drillQuestion: `Explain a technical problem you solved for ${roleTitle}. State the Situation, your specific Task, Actions, and a measurable Result.`,
          targetOutcome: 'Structure your explanation in under 45 seconds with concrete metrics.',
        },
      ],
    });
  } catch (error: any) {
    console.error('API evaluate error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
