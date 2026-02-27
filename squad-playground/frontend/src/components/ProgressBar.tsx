import { usePipelineStore } from '../stores/usePipelineStore';

export function ProgressBar() {
  const { status, currentStep, totalSteps, currentAgent } = usePipelineStore();

  if (status === 'idle') return null;

  const percentage = totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0;
  const isComplete = status === 'completed';
  const isError = status === 'error';

  return (
    <div className="w-full max-w-3xl px-4">
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-xs text-matrix-green">
          {isComplete
            ? 'Pipeline concluído!'
            : isError
              ? 'Pipeline erro'
              : `Step ${currentStep}/${totalSteps} — ${currentAgent || ''} processando...`}
        </span>
        <span className="font-mono text-xs text-gray-500">{percentage}%</span>
      </div>
      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isError ? 'bg-red-500' : isComplete ? 'bg-matrix-green' : 'bg-matrix-green animate-pulse'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
