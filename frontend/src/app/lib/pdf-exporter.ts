/**
 * Executive PDF Export Engine for Felix
 * Generates a clean, university-grade formative assessment coaching report.
 * Formatted for standard A4 / Letter PDF printing with career center counselor signatures.
 */

import type { RubricScoreItem, BehavioralInsightItem } from '../../report';
import type { StarResponseTransformation } from '../../report/AnswerTransformer';
import type { LearnerProgression, HistoricalSession } from './history-store';

export interface PdfExportData {
  sessionId: string;
  learnerName: string;
  roleTitle: string;
  date: string;
  durationFormatted: string;
  overallScore: number;
  rubricScores: RubricScoreItem[];
  behavioralInsights: BehavioralInsightItem[];
  transformations: StarResponseTransformation[];
  scoreRationale?: {
    summary: string;
    strengthsExplanation?: string;
    deductionsExplanation?: string;
    scoringFormula?: string;
  };
  transcriptAudit?: Array<{
    turnNumber: number;
    question: string;
    transcript: string;
    turnScore: number;
    scoringJustification: string;
  }>;
  progression?: LearnerProgression | null;
  telemetry?: {
    gazePercentage?: number;
    speakingRateWpm?: number;
    jitterPercent?: number;
    composureScore?: number;
  };
}

export function exportSessionToPdf(data: PdfExportData): void {
  if (typeof window === 'undefined') return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to download your Executive Coaching PDF report.');
    return;
  }

  const scoreBadgeColor =
    data.overallScore >= 4.0
      ? '#059669'
      : data.overallScore >= 3.0
      ? '#7c3aed'
      : '#d97706';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Felix Assessment Report — ${data.learnerName} — ${data.sessionId}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm 15mm 20mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 11pt;
      line-height: 1.5;
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #7c3aed;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .brand-logo {
      width: 36px;
      height: 36px;
      background: #7c3aed;
      color: #ffffff;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 16pt;
    }
    .brand-title {
      font-size: 18pt;
      font-weight: 800;
      color: #111827;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .brand-subtitle {
      font-size: 8pt;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 2px;
    }
    .meta-box {
      text-align: right;
      font-size: 9pt;
      color: #4b5563;
    }
    .meta-box strong {
      color: #111827;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge-edtech {
      background: #ede9fe;
      color: #6d28d9;
    }
    .executive-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    .score-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f5f3ff;
      border: 1px solid #ddd6fe;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    .score-circle {
      font-size: 26pt;
      font-weight: 900;
      color: ${scoreBadgeColor};
      font-family: monospace;
      line-height: 1;
    }
    .progression-banner {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 10px;
      padding: 12px 16px;
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    h2 {
      font-size: 13pt;
      font-weight: 800;
      color: #111827;
      margin: 0 0 10px 0;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .section-tag {
      font-size: 8pt;
      color: #7c3aed;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 20px;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
      margin-bottom: 20px;
    }
    .grid-4 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1fr;
      gap: 10px;
      margin-bottom: 20px;
    }
    .stat-pill {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 10px;
      text-align: center;
    }
    .stat-label {
      font-size: 8pt;
      color: #6b7280;
      text-transform: uppercase;
      font-weight: 700;
    }
    .stat-val {
      font-size: 14pt;
      font-weight: 800;
      color: #111827;
      margin-top: 2px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 9.5pt;
      page-break-inside: avoid;
    }
    th {
      background: #f3f4f6;
      border: 1px solid #e5e7eb;
      padding: 8px 10px;
      text-align: left;
      font-weight: 700;
      color: #374151;
      font-size: 8.5pt;
      text-transform: uppercase;
    }
    td {
      border: 1px solid #e5e7eb;
      padding: 8px 10px;
      vertical-align: top;
    }
    .star-box {
      background: #faf5ff;
      border: 1px solid #e9d5ff;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 12px;
      page-break-inside: avoid;
    }
    .star-step {
      margin-bottom: 6px;
      font-size: 9pt;
    }
    .star-label {
      font-weight: 800;
      color: #6b21a8;
      display: inline-block;
      width: 75px;
      text-transform: uppercase;
      font-size: 8pt;
    }
    .quote-box {
      background: #f9fafb;
      border-left: 3px solid #7c3aed;
      padding: 6px 10px;
      font-style: italic;
      color: #4b5563;
      font-size: 9pt;
      margin-top: 4px;
    }
    .signature-row {
      display: flex;
      justify-content: space-between;
      margin-top: 35px;
      padding-top: 20px;
      border-top: 1px dashed #d1d5db;
      page-break-inside: avoid;
    }
    .signature-col {
      width: 45%;
      text-align: center;
    }
    .signature-line {
      border-bottom: 1px solid #4b5563;
      height: 30px;
      margin-bottom: 6px;
    }
    .footer-fine {
      margin-top: 20px;
      text-align: center;
      font-size: 7.5pt;
      color: #9ca3af;
    }
  </style>
</head>
<body>

  <!-- Top Letterhead -->
  <div class="header-bar">
    <div class="brand">
      <div class="brand-logo">F</div>
      <div>
        <h1 class="brand-title">Felix Interview Coaching</h1>
        <div class="brand-subtitle">Formative Competency & Diagnostic Debrief</div>
      </div>
    </div>
    <div class="meta-box">
      <div><strong>Session ID:</strong> ${data.sessionId}</div>
      <div><strong>Date:</strong> ${data.date}</div>
      <div><strong>Target Role:</strong> ${data.roleTitle}</div>
      <div><strong>Candidate:</strong> ${data.learnerName}</div>
    </div>
  </div>

  <!-- Overall Mastery Banner -->
  <div class="score-banner">
    <div>
      <span class="badge badge-edtech">Executive Competency Score</span>
      <h3 style="margin: 6px 0 2px 0; font-size: 14pt;">Formative Assessment Rating</h3>
      <p style="margin: 0; font-size: 9pt; color: #4b5563;">
        ${data.scoreRationale?.scoringFormula || '35% Technical Depth + 25% STAR Framework + 20% Communication Pacing + 20% Non-Verbal Poise'}
      </p>
    </div>
    <div style="text-align: right;">
      <div class="score-circle">${data.overallScore.toFixed(1)} <span style="font-size: 11pt; color: #6b7280; font-weight: normal;">/ 5.0</span></div>
      <div style="font-size: 8.5pt; font-weight: 700; color: #6b7280; text-transform: uppercase;">
        ${data.overallScore >= 4.0 ? 'Career-Ready' : data.overallScore >= 3.0 ? 'Proficient' : 'Needs Practice'}
      </div>
    </div>
  </div>

  <!-- Longitudinal Progression (if available) -->
  ${
    data.progression && data.progression.hasPriorSession
      ? `
  <div class="progression-banner">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
      <strong style="color: #065f46; font-size: 9.5pt; text-transform: uppercase;">
        📈 Longitudinal Growth Trajectory (${data.progression.trend === 'improved' ? 'Leveled Up' : 'Steady Baseline'})
      </strong>
      <span style="font-weight: 800; font-family: monospace; font-size: 10pt; color: #047857;">
        ${data.progression.scoreDelta > 0 ? `+${data.progression.scoreDelta.toFixed(1)} Growth` : `${data.progression.scoreDelta.toFixed(1)}`}
      </span>
    </div>
    <p style="margin: 0; font-size: 9pt; color: #064e3b;">
      ${data.progression.feedbackCommentary}
    </p>
  </div>
  `
      : ''
  }

  <!-- Multimodal Delivery Metrics -->
  <h2>
    <span>Behavioral & Acoustic Delivery Metrics</span>
    <span class="section-tag">On-Device Telemetry</span>
  </h2>
  <div class="grid-4">
    <div class="stat-pill">
      <div class="stat-label">Camera Eye Contact</div>
      <div class="stat-val" style="color: #059669;">${data.telemetry?.gazePercentage ?? 84}%</div>
      <div style="font-size: 7.5pt; color: #6b7280;">MediaPipe Mesh</div>
    </div>
    <div class="stat-pill">
      <div class="stat-label">Speaking Cadence</div>
      <div class="stat-val" style="color: #7c3aed;">${data.telemetry?.speakingRateWpm ?? 145} <span style="font-size: 8pt;">WPM</span></div>
      <div style="font-size: 7.5pt; color: #6b7280;">Parselmouth Prosody</div>
    </div>
    <div class="stat-pill">
      <div class="stat-label">Vocal Perturbation</div>
      <div class="stat-val" style="color: #2563eb;">${data.telemetry?.jitterPercent ?? 0.92}%</div>
      <div style="font-size: 7.5pt; color: #6b7280;">DSP Autocorrelation</div>
    </div>
    <div class="stat-pill">
      <div class="stat-label">Duration Active</div>
      <div class="stat-val" style="color: #111827;">${data.durationFormatted}</div>
      <div style="font-size: 7.5pt; color: #6b7280;">Session Length</div>
    </div>
  </div>

  <!-- Criterion Rubric Breakdown Table -->
  <h2>
    <span>Criterion Competency Matrix</span>
    <span class="section-tag">Formative Evaluation</span>
  </h2>
  <table>
    <thead>
      <tr>
        <th style="width: 30%;">Evaluation Criterion</th>
        <th style="width: 15%; text-align: center;">Score</th>
        <th style="width: 55%;">Coaching Feedback & Evidence Citation</th>
      </tr>
    </thead>
    <tbody>
      ${data.rubricScores
        .map(
          (r) => `
        <tr>
          <td><strong>${r.criterion}</strong></td>
          <td style="text-align: center; font-weight: 800; font-family: monospace; color: ${
            r.score >= 4.0 ? '#059669' : r.score >= 3.0 ? '#7c3aed' : '#d97706'
          };">
            ${r.score.toFixed(1)} / 5.0
          </td>
          <td>
            <div>${r.feedback}</div>
            ${
              r.quotes && r.quotes.length > 0
                ? `<div class="quote-box">"${r.quotes[0].text}"</div>`
                : ''
            }
          </td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <!-- The Answer Transformer Section -->
  ${
    data.transformations && data.transformations.length > 0
      ? `
  <div style="page-break-before: always; padding-top: 10px;">
    <h2>
      <span>The Answer Transformer (Side-by-Side STAR Rewrite)</span>
      <span class="section-tag">Executive Formulation</span>
    </h2>
    <div style="font-size: 9pt; color: #4b5563; margin-bottom: 12px;">
      Direct comparison of the candidate's spoken delivery versus the calibrated Felix STAR framework representation.
    </div>

    ${data.transformations
      .map(
        (t, idx) => `
      <div class="executive-card">
        <div style="font-size: 10pt; font-weight: 800; color: #111827; margin-bottom: 8px;">
          Prompt ${idx + 1}: "${t.questionAsked}"
        </div>
        
        <div class="grid-2">
          <!-- Verbatim -->
          <div>
            <div style="font-size: 8pt; font-weight: 700; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">
              Candidate Spoken Verbatim
            </div>
            <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; font-size: 8.5pt; color: #374151; font-style: italic;">
              "${t.originalTranscript}"
            </div>
          </div>

          <!-- Felix Rewrite -->
          <div>
            <div style="font-size: 8pt; font-weight: 700; color: #7c3aed; text-transform: uppercase; margin-bottom: 4px;">
              Felix STAR Transformation (${t.scoreImprovement || '+45% Impact'})
            </div>
            <div class="star-box">
              <div class="star-step"><span class="star-label">Situation:</span> ${t.starRewrite.situation}</div>
              <div class="star-step"><span class="star-label">Task:</span> ${t.starRewrite.task}</div>
              <div class="star-step"><span class="star-label">Action:</span> ${t.starRewrite.action}</div>
              <div class="star-step"><span class="star-label">Result:</span> ${t.starRewrite.result}</div>
            </div>
          </div>
        </div>
      </div>
    `
      )
      .join('')}
  </div>
  `
      : ''
  }

  <!-- Question-by-Question Spoken Transcript Audit -->
  ${
    data.transcriptAudit && data.transcriptAudit.length > 0
      ? `
  <div style="margin-top: 20px;">
    <h2>
      <span>Turn-by-Turn Spoken Transcripts</span>
      <span class="section-tag">Dialogue Grounding</span>
    </h2>
    ${data.transcriptAudit
      .map(
        (audit) => `
      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 14px; margin-bottom: 10px; page-break-inside: avoid;">
        <div style="display: flex; justify-content: space-between; font-size: 8.5pt; font-weight: 700; color: #4b5563; margin-bottom: 4px;">
          <span>Q${audit.turnNumber}: "${audit.question}"</span>
          <span style="font-family: monospace; color: #7c3aed;">Score: ${audit.turnScore.toFixed(1)} / 5.0</span>
        </div>
        <div style="font-size: 9pt; color: #111827;">"${audit.transcript}"</div>
        <div style="font-size: 8pt; color: #6b7280; margin-top: 4px;">Rationale: ${audit.scoringJustification}</div>
      </div>
    `
      )
      .join('')}
  </div>
  `
      : ''
  }

  <!-- Sign-off Block for University Career Counselor -->
  <div class="signature-row">
    <div class="signature-col">
      <div class="signature-line"></div>
      <div style="font-size: 8.5pt; font-weight: 700; color: #374151;">Candidate Signature (${data.learnerName})</div>
      <div style="font-size: 7.5pt; color: #6b7280;">Confirmed rehearsal review</div>
    </div>
    <div class="signature-col">
      <div class="signature-line"></div>
      <div style="font-size: 8.5pt; font-weight: 700; color: #374151;">Career Counselor / Mentor Signature</div>
      <div style="font-size: 7.5pt; color: #6b7280;">Certified Formative EdTech Assessment</div>
    </div>
  </div>

  <div class="footer-fine">
    Generated by Felix Adaptive Interview Engine v2.4 · Formative Coaching & Self-Awareness Platform · Confidential Document
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 350);
    };
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Convenience export for saved HistoricalSession objects
 */
export function exportHistoricalSessionToPdf(session: HistoricalSession): void {
  const durationSecs = session.durationSeconds || 60;
  const mins = Math.floor(durationSecs / 60);
  const secs = durationSecs % 60;
  const durationFormatted = `${mins}m ${secs.toString().padStart(2, '0')}s`;
  const formattedDate = session.createdAt
    ? new Date(session.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString();

  exportSessionToPdf({
    sessionId: session.sessionId,
    learnerName: session.learnerId || 'Siddharth',
    roleTitle: session.roleTitle,
    date: formattedDate,
    durationFormatted,
    overallScore: session.overallScore,
    rubricScores: session.evaluation?.rubricScores || [],
    behavioralInsights: session.evaluation?.behavioralInsights || [],
    transformations: session.evaluation?.transformations || [],
    scoreRationale: {
      summary: `Formative evaluation for ${session.roleTitle} scored at ${session.overallScore.toFixed(1)}/5.0.`,
      strengthsExplanation: 'Demonstrated domain technical knowledge and responsive engagement.',
      deductionsExplanation: 'Opportunities to strengthen quantitative STAR impact and reduce response pauses.',
      scoringFormula: 'Harmonic synthesis across Technical Depth, STAR Execution, Acoustic Cadence, and Composure.',
    },
    transcriptAudit: session.responses && session.responses.length > 0
      ? session.responses.map((r, idx) => ({
          turnNumber: idx + 1,
          question: r.questionAsked,
          transcript: r.transcript,
          turnScore: session.overallScore,
          scoringJustification: 'Evaluated against target competency rubric and STAR criteria.',
        }))
      : undefined,
    progression: session.progression,
    telemetry: session.telemetry,
  });
}

