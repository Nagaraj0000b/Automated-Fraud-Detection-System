export const getDecisionRecommendation = (status = 'pending') => {
  if (status === 'blocked') return 'Do not proceed';
  if (status === 'flagged') return 'Manual review required';
  if (status === 'approved') return 'Safe to proceed';
  return 'Awaiting review';
};

export const getDecisionTone = (status = 'pending') => {
  if (status === 'blocked') return 'bg-rose-100 text-rose-700';
  if (status === 'flagged') return 'bg-amber-100 text-amber-700';
  if (status === 'approved') return 'bg-emerald-100 text-emerald-700';
  return 'bg-slate-100 text-slate-700';
};
