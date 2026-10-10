import React, { useEffect, useState } from 'react';

interface ScoreIndicatorProps {
  score: number;
  maxScore?: number;
  type?: 'circular' | 'bar';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export const ScoreIndicator: React.FC<ScoreIndicatorProps> = ({ 
  score, 
  maxScore = 5, 
  type = 'circular', 
  size = 'md',
  label
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  const percentage = (animatedScore / maxScore) * 100;
  
  const getColorClass = (val: number) => {
    const ratio = val / maxScore;
    if (ratio < 0.5) return 'text-orange-500 stroke-orange-500 bg-orange-500';
    if (ratio < 0.8) return 'text-yellow-500 stroke-yellow-500 bg-yellow-500';
    return 'text-green-500 stroke-green-500 bg-green-500';
  };

  const colorClasses = getColorClass(score);
  const strokeClass = colorClasses.split(' ')[1];
  const bgClass = colorClasses.split(' ')[2];
  const textClass = colorClasses.split(' ')[0];

  if (type === 'bar') {
    return (
      <div className="w-full flex flex-col gap-1">
        {label && <div className="text-sm font-medium text-slate-700 flex justify-between">
          <span>{label}</span>
          <span className="font-bold">{score}/{maxScore}</span>
        </div>}
        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ease-out rounded-full ${bgClass}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }

  // Circular logic
  const sizeMap = { sm: 40, md: 80, lg: 120 };
  const s = sizeMap[size];
  const strokeWidth = s * 0.1;
  const radius = (s - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex items-center justify-center" style={{ width: s, height: s }}>
        <svg className="transform -rotate-90 w-full h-full">
          <circle
            cx={s / 2}
            cy={s / 2}
            r={radius}
            strokeWidth={strokeWidth}
            className="stroke-slate-200 fill-none"
          />
          <circle
            cx={s / 2}
            cy={s / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`fill-none transition-all duration-1000 ease-out ${strokeClass}`}
          />
        </svg>
        <div className={`absolute flex flex-col items-center justify-center ${textClass}`}>
          <span className={size === 'lg' ? 'text-3xl font-bold' : size === 'md' ? 'text-xl font-bold' : 'text-sm font-bold'}>
            {score}
          </span>
        </div>
      </div>
      {label && <span className="text-sm font-medium text-slate-600">{label}</span>}
    </div>
  );
};
