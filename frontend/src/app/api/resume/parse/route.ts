import { NextResponse } from 'next/server';

interface ExtractedProject {
  name: string;
  description: string;
  techStack?: string[];
}

interface ExtractedExperience {
  company: string;
  role: string;
  highlights: string[];
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded. Please upload a PDF resume.' },
        { status: 400 }
      );
    }

    const fileName = file.name || 'resume.pdf';
    if (!fileName.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: 'Invalid file format. Please upload a PDF file (.pdf).' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let rawPdfText = '';
    let pageCount = 1;

    // 1. Local extraction via pdf-parse
    try {
      // Dynamic import to support various bundler runtime environments
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pdfModule = require('pdf-parse');
      if (typeof pdfModule.PDFParse === 'function') {
        const parser = new pdfModule.PDFParse({ data: buffer });
        const parseResult = await parser.getText();
        rawPdfText = (parseResult?.text || '').trim();
        pageCount = parseResult?.total || 1;
        await parser.destroy();
      } else if (typeof pdfModule === 'function') {
        const parseResult = await pdfModule(buffer);
        rawPdfText = (parseResult?.text || '').trim();
        pageCount = parseResult?.numpages || 1;
      }
    } catch (parseErr) {
      console.warn('Local pdf-parse extraction warning:', parseErr);
    }

    // 2. Intelligent structuring with Gemini
    const apiKey =
      process.env.GEMINI_API_KEY ||
      'AQ.Ab8RN6LYpmPS-oxD4cJXft4KZGhtR3ZPOStRbNaWBM-FzBs-Dw';

    const b64Data = buffer.toString('base64');
    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-2.5-flash'];

    let structuredSummary = '';
    let detectedSkills: string[] = [];
    let detectedProjects: ExtractedProject[] = [];
    let detectedExperiences: ExtractedExperience[] = [];
    let candidateName = '';

    const promptText = `You are Felix, an expert technical resume parser for interview coaching.
Extract all key technical details from this resume to help prepare personalized, grounded interview questions.

Return a JSON object matching this schema:
{
  "candidateName": string,
  "summary": string (a crisp 2-3 sentence technical overview highlighting core domain, tech stack, and primary focus),
  "skills": string[] (list of top 8-15 programming languages, frameworks, cloud tools, and databases),
  "projects": [
    {
      "name": string,
      "description": string (the architectural problem solved, key decisions, metrics),
      "techStack": string[]
    }
  ],
  "experiences": [
    {
      "company": string,
      "role": string,
      "highlights": string[]
    }
  ]
}

Raw extracted text from PDF:
"""
${rawPdfText.slice(0, 10000)}
"""`;

    for (const model of candidateModels) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    // Provide PDF inline if under 4MB, plus the prompt
                    buffer.length < 4 * 1024 * 1024
                      ? { inlineData: { mimeType: 'application/pdf', data: b64Data } }
                      : { text: 'PDF Document Text:' },
                    { text: promptText },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 2000,
              },
            }),
            signal: AbortSignal.timeout(8000),
          }
        );

        if (!res.ok) continue;

        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) continue;

        let cleaned = text.trim();
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
        candidateName = parsed.candidateName || '';
        structuredSummary = parsed.summary || '';
        detectedSkills = Array.isArray(parsed.skills) ? parsed.skills : [];
        detectedProjects = Array.isArray(parsed.projects) ? parsed.projects : [];
        detectedExperiences = Array.isArray(parsed.experiences) ? parsed.experiences : [];
        break;
      } catch (geminiErr) {
        console.warn(`Gemini extraction using ${model} skipped:`, geminiErr);
      }
    }

    // Fallback heuristic extraction if Gemini is unavailable
    if (!structuredSummary && rawPdfText) {
      const lines = rawPdfText.split('\n').map((l: string) => l.trim()).filter(Boolean);
      structuredSummary = lines.slice(0, 5).join(' ');
      // Simple regex for common skills
      const skillKeywords = ['TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'Java', 'React', 'Next.js', 'Node.js', 'PostgreSQL', 'Docker', 'Kubernetes', 'AWS', 'Tailwind', 'GraphQL', 'Redis'];
      detectedSkills = skillKeywords.filter((k) =>
        new RegExp(`\\b${k}\\b`, 'i').test(rawPdfText)
      );
    }

    // Format the comprehensive resumeText for question grounding
    const formattedResumeText = [
      candidateName ? `Candidate Name: ${candidateName}` : '',
      structuredSummary ? `Summary: ${structuredSummary}` : '',
      detectedSkills.length > 0 ? `Skills: ${detectedSkills.join(', ')}` : '',
      detectedProjects.length > 0
        ? `Projects:\n${detectedProjects.map((p) => `- ${p.name}: ${p.description} (Stack: ${(p.techStack || []).join(', ')})`).join('\n')}`
        : '',
      detectedExperiences.length > 0
        ? `Experience:\n${detectedExperiences.map((e) => `- ${e.role} at ${e.company}: ${(e.highlights || []).join('; ')}`).join('\n')}`
        : '',
      // Include snippet of raw text if structured extraction is sparse
      (!detectedProjects.length && rawPdfText) ? `Resume Content:\n${rawPdfText.slice(0, 2000)}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    return NextResponse.json({
      success: true,
      fileName,
      fileSizeBytes: buffer.length,
      pageCount,
      candidateName,
      summary: structuredSummary || 'Resume successfully uploaded and parsed.',
      skills: detectedSkills,
      projects: detectedProjects,
      experiences: detectedExperiences,
      extractedText: formattedResumeText || rawPdfText.slice(0, 3000),
      rawTextSnippet: rawPdfText.slice(0, 500),
    });
  } catch (error: any) {
    console.error('Error parsing PDF resume:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to parse resume PDF' },
      { status: 500 }
    );
  }
}
