import { useEffect, useState, useCallback } from 'react';
import { usePipelineStore } from '../stores/usePipelineStore';
import { useToastStore } from '../stores/useToastStore';

export function ErrorToast() {
  const { status, error, currentAgent } = usePipelineStore();
  const addToast = useToastStore((s) => s.addToast);
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);
  const [showRetryPopup, setShowRetryPopup] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // Detect new error
  useEffect(() => {
    if (status !== 'error' || !error || error === lastError) return;
    setLastError(error);
    addToast('error', `${currentAgent || 'Pipeline'}: ${error}`);

    // Start retry countdown (10s)
    setRetryCountdown(10);
  }, [status, error, lastError, currentAgent, addToast]);

  // Countdown timer
  useEffect(() => {
    if (retryCountdown === null || retryCountdown <= 0) {
      if (retryCountdown === 0) {
        // Auto-retry failed, show popup
        setShowRetryPopup(true);
        setRetryCountdown(null);
      }
      return;
    }
    const timer = setTimeout(() => setRetryCountdown(retryCountdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [retryCountdown]);

  const handleRetry = useCallback(() => {
    setShowRetryPopup(false);
    setLastError(null);
    addToast('info', 'Tentando novamente...');
    // Pipeline retry would be triggered via WebSocket — for now just reset error state
    usePipelineStore.getState().setError('');
  }, [addToast]);

  const handleSkip = useCallback(() => {
    setShowRetryPopup(false);
    setLastError(null);
    addToast('warning', 'Agente ignorado, continuando pipeline...');
  }, [addToast]);

  const handleStop = useCallback(() => {
    setShowRetryPopup(false);
    setLastError(null);
    usePipelineStore.getState().reset();
    addToast('info', 'Pipeline interrompido.');
  }, [addToast]);

  // Retry countdown toast
  if (retryCountdown !== null && retryCountdown > 0) {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-sm">
        <div className="bg-red-900/90 border border-red-500 rounded-lg px-4 py-3 shadow-lg">
          <p className="font-mono text-xs text-red-200">
            Erro em {currentAgent || 'pipeline'}. Tentando novamente em{' '}
            <span className="text-red-400 font-bold">{retryCountdown}s</span>
          </p>
        </div>
      </div>
    );
  }

  // Retry popup
  if (showRetryPopup) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/80" />
        <div className="relative z-10 bg-[#0a0a0a] border border-red-600 rounded-lg p-6 max-w-sm mx-4">
          <h3 className="text-red-400 font-mono font-bold text-sm mb-2">
            ⚠️ Falha no agente {currentAgent}
          </h3>
          <p className="text-gray-400 font-mono text-xs mb-4">{error}</p>
          <div className="flex gap-2">
            <button
              onClick={handleRetry}
              className="flex-1 px-3 py-2 bg-matrix-green/20 border border-matrix-green text-matrix-green font-mono text-xs rounded hover:bg-matrix-green hover:text-black transition-colors"
            >
              Tentar Novamente
            </button>
            <button
              onClick={handleSkip}
              className="flex-1 px-3 py-2 bg-yellow-500/10 border border-yellow-500 text-yellow-400 font-mono text-xs rounded hover:bg-yellow-500 hover:text-black transition-colors"
            >
              Pular Agente
            </button>
            <button
              onClick={handleStop}
              className="flex-1 px-3 py-2 bg-red-500/10 border border-red-600 text-red-400 font-mono text-xs rounded hover:bg-red-600 hover:text-white transition-colors"
            >
              Parar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
