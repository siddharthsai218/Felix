import React, { useState, useEffect } from 'react';

interface DrillCardProps {
  question: string;
  targetOutcome: string;
  timeLimitSeconds?: number;
  onComplete?: (score: number) => void;
}

export const DrillCard: React.FC<DrillCardProps> = ({ 
  question, 
  targetOutcome, 
  timeLimitSeconds = 120,
  onComplete 
}) => {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimitSeconds);
  const [isCompleted, setIsCompleted] = useState(false);
  const [drillScore, setDrillScore] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (isActive && timeLeft === 0) {
      handleComplete();
    }
    return () => clearInterval(timer);
  }, [isActive, timeLeft]);

  const handleStart = () => setIsActive(true);
  
  const handleComplete = () => {
    setIsActive(false);
    setIsCompleted(true);
    const mockScore = Math.floor(Math.random() * 3) + 3; // 3 to 5
    setDrillScore(mockScore);
    if (onComplete) onComplete(mockScore);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (isCompleted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex flex-col items-center justify-center gap-4 transition-all animate-fade-in">
        <h3 className="text-xl font-bold text-green-800">Drill Complete!</h3>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-sm text-slate-500 mb-1">Previous</div>
            <div className="text-2xl font-bold text-slate-400 line-through">2/5</div>
          </div>
          <div className="text-3xl text-green-500 font-bold animate-bounce">→</div>
          <div className="text-center">
            <div className="text-sm text-green-600 mb-1">New Score</div>
            <div className="text-3xl font-bold text-green-600">{drillScore}/5</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded uppercase tracking-wide">
          Micro-Drill
        </span>
        <span className="text-slate-500 text-sm font-medium bg-slate-100 px-2 py-1 rounded">
          ⏱ {formatTime(timeLeft)}
        </span>
      </div>
      
      <h4 className="text-lg font-semibold text-slate-800 mb-2">{question}</h4>
      <p className="text-sm text-slate-600 mb-5">
        <span className="font-medium text-slate-700">Target Outcome:</span> {targetOutcome}
      </p>

      {!isActive ? (
        <button 
          onClick={handleStart}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Start Practice Drill
        </button>
      ) : (
        <div className="flex gap-2">
          <button 
            onClick={handleComplete}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            End & Score
          </button>
        </div>
      )}
    </div>
  );
};
