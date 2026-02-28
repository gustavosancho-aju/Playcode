import { usePipelineStore } from '../stores/usePipelineStore';

export function ProgressBar() {
  const { status, currentStep, totalSteps, currentAgent } = usePipelineStore();

  if (status === 'idle') return null;

  const percentage = totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0;
  const isComplete = status === 'completed';
  const isError = status === 'error';

  return (
    <div className="w-full max-w-3xl px-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-display text-xs text-gray-300">
          {isComplete
            ? 'Pipeline concluído!'
            : isError
              ? 'Pipeline erro'
              : `Step ${currentStep}/${totalSteps} — ${currentAgent || ''} processando...`}
        </span>
        <span className="font-display text-xs text-gray-500 tabular-nums">{percentage}%</span>
      </div>
      <div className="w-full h-2 bg-white/[0.04] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${isError ? '' : isComplete ? '' : 'animate-pulse'}`}
          style={{
            width: `${percentage}%`,
            background: isError
              ? '#ef4444'
              : isComplete
                ? 'linear-gradient(90deg, #22c55e, #06b6d4)'
                : 'linear-gradient(90deg, #22c55e, #06b6d4)',
          }}
        />
      </div>
    </div>
  );
}
