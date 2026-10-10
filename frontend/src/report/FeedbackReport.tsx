import React, { useState } from 'react';
import { ScoreIndicator } from './ScoreIndicator';
import { DrillCard } from './DrillCard';

// Dummy data to simulate the backend payload
const MOCK_REPORT_DATA = {
  sessionId: 'sess_123',
  date: new Date().toLocaleDateString(),
  roleTitle: 'Backend Developer',
  overallScore: 3.8,
  rubricScores: [
    {
      criterion: 'Technical Depth',
      score: 4,
      feedback: 'You demonstrated strong knowledge of system design principles, particularly around database sharding.',
      quotes: [{ text: "I would implement hash-based sharding to distribute the load evenly", time: "04:12" }]
    },
    {
      criterion: 'Communication',
      score: 3,
      feedback: 'Clear explanations, but could be more concise when describing architecture tradeoffs.',
      quotes: [{ text: "So basically, if we use a monolith... well, it's easier at first, but then, you know, scaling is hard...", time: "08:45" }]
    },
    {
      criterion: 'Problem Solving',
      score: 4,
      feedback: 'Excellent structured approach to breaking down the problem.',
      quotes: [{ text: "First, I'd define the core requirements. Second, capacity planning. Third, the high-level design.", time: "01:20" }]
    }
  ],
  behavioralInsights: [
    { icon: '🗣️', text: 'Pacing was excellent (140 wpm). Keep it up!' },
    { icon: '🤔', text: 'You used a lot of filler words ("um", "like") during the technical deep dive.' }
  ],
  remediationPlan: [
    {
      topic: 'Concise Technical Explanations',
      drillQuestion: 'Explain the difference between a process and a thread in 30 seconds.',
      targetOutcome: 'Deliver a clear, concise answer without filler words.'
    }
  ]
};

export const FeedbackReport: React.FC = () => {
  const data = MOCK_REPORT_DATA;
  const [activeDrill, setActiveDrill] = useState<number | null>(null);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-slate-50 min-h-screen font-sans text-slate-800">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row items-center justify-between bg-white p-8 rounded-2xl shadow-sm mb-8 border border-slate-100">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Interview Feedback</h1>
          <div className="flex gap-4 text-slate-500 font-medium">
            <span>{data.roleTitle}</span>
            <span>•</span>
            <span>{data.date}</span>
          </div>
        </div>
        <div className="mt-6 md:mt-0">
          <ScoreIndicator score={data.overallScore} size="lg" label="Overall Score" />
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Rubric & Details */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <h2 className="text-xl font-bold text-slate-800 border-b pb-2">Rubric Breakdown</h2>
          
          {data.rubricScores.map((rubric, idx) => (
            <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800">{rubric.criterion}</h3>
                <div className="w-32">
                  <ScoreIndicator score={rubric.score} type="bar" />
                </div>
              </div>
              <p className="text-slate-600 mb-4">{rubric.feedback}</p>
              
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Evidence from Transcript</p>
                {rubric.quotes.map((quote, qIdx) => (
                  <div key={qIdx} className="flex gap-3 text-sm">
                    <span className="text-blue-500 font-mono bg-blue-50 px-1.5 py-0.5 rounded shrink-0">{quote.time}</span>
                    <span className="italic text-slate-600">"{quote.text}"</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Insights & Remediation */}
        <div className="flex flex-col gap-6">
          
          {/* Behavioral Insights */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Behavioral Cues</h2>
            <ul className="flex flex-col gap-4">
              {data.behavioralInsights.map((insight, idx) => (
                <li key={idx} className="flex gap-3 items-start">
                  <span className="text-2xl">{insight.icon}</span>
                  <span className="text-slate-600 text-sm">{insight.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Remediation Plan */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 border-t-4 border-t-blue-500">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Action Plan</h2>
            <p className="text-sm text-slate-500 mb-4">Targeted drills to improve your weak areas.</p>
            
            <div className="flex flex-col gap-4">
              {data.remediationPlan.map((plan, idx) => (
                <div key={idx}>
                  <DrillCard 
                    question={plan.drillQuestion}
                    targetOutcome={plan.targetOutcome}
                  />
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};
