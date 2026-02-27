import { usePipelineStore } from '../stores/usePipelineStore';

export function ErrorToast() {
  const { status, error, currentAgent } = usePipelineStore();

  if (status !== 'error' || !error) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-red-900/90 border border-red-500 rounded-lg px-4 py-3 shadow-lg">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-red-400 text-lg">⚠️</span>
          <span className="font-mono text-sm font-bold text-red-300">
            Pipeline Error {currentAgent ? `— ${currentAgent}` : ''}
          </span>
        </div>
        <p className="font-mono text-xs text-red-200">{error}</p>
      </div>
    </div>
  );
}
