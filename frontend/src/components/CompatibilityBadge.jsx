import React from 'react';

export default function CompatibilityBadge({ score, size = 'md' }) {
  const numScore = Number(score) || 0;

  let colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let badgeLabel = 'Optimal Match';

  if (numScore >= 85) {
    colorClasses = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    badgeLabel = 'Optimal Match';
  } else if (numScore >= 70) {
    colorClasses = 'bg-green-100 text-green-800 border-green-300';
    badgeLabel = 'Strong Match';
  } else if (numScore >= 55) {
    colorClasses = 'bg-amber-100 text-amber-800 border-amber-300';
    badgeLabel = 'Moderate Match';
  } else {
    colorClasses = 'bg-rose-100 text-rose-800 border-rose-300';
    badgeLabel = 'Low Compatibility';
  }

  const sizeClasses = size === 'lg'
    ? 'px-3.5 py-1.5 text-base font-bold'
    : size === 'sm'
    ? 'px-2 py-0.5 text-xs font-semibold'
    : 'px-2.5 py-1 text-sm font-semibold';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border shadow-sm ${colorClasses} ${sizeClasses}`}>
      <span className="relative flex h-2 w-2">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
          numScore >= 70 ? 'bg-emerald-400' : 'bg-amber-400'
        }`} />
        <span className={`relative inline-flex rounded-full h-2 w-2 ${
          numScore >= 70 ? 'bg-emerald-500' : 'bg-amber-500'
        }`} />
      </span>
      <span>{numScore.toFixed(1)}% Match</span>
      <span className="opacity-75 font-normal text-xs">&bull; {badgeLabel}</span>
    </span>
  );
}
