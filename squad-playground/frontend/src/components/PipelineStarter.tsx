import { useState } from 'react';
import { usePipelineStore } from '../stores/usePipelineStore';

const API_BASE = 'http://localhost:3001';

type PipelineType = 'consultoria' | 'briefing';

const PIPELINE_OPTIONS: { id: PipelineType; label: string; description: string; icon: string }[] = [
  { id: 'consultoria', label: 'Consultoria', description: '6 agentes — pipeline completo', icon: '🏢' },
  { id: 'briefing', label: 'Briefing', description: '1 agente — pesquisa rápida', icon: '🔍' },
];

export function PipelineStarter() {
  const [prompt, setPrompt] = useState('');
  const [pipelineType, setPipelineType] = useState<PipelineType>('consultoria');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const status = usePipelineStore((s) => s.status);

  const isRunning = status === 'executing' || status === 'approval_required';

  const handleStart = async () => {
    if (!prompt.trim() || loading || isRunning) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/pipeline/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), pipelineType }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao iniciar pipeline');
      }

      // Pipeline started — UI will update via socket events
      setPrompt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleStart();
    }
  };

  if (isRunning) return null;

  return (
    <div className="w-full max-w-lg pointer-events-auto">
      <div className="border border-matrix-green/30 rounded-lg bg-black/80 backdrop-blur-sm overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-800">
          <h3 className="text-matrix-green font-mono text-sm font-bold">⚡ Iniciar Pipeline</h3>
        </div>

        {/* Pipeline type selector */}
        <div className="px-4 pt-3 flex gap-2">
          {PIPELINE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setPipelineType(opt.id)}
              className={`flex-1 flex items-center gap-2 px-3 py-2 rounded border font-mono text-xs transition-all ${
                pipelineType === opt.id
                  ? 'border-matrix-green text-matrix-green bg-matrix-green/10'
                  : 'border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-500'
              }`}
            >
              <span>{opt.icon}</span>
              <div className="text-left">
                <div className="font-bold">{opt.label}</div>
                <div className="text-[10px] opacity-60">{opt.description}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Textarea */}
        <div className="p-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Descreva o briefing do cliente aqui...&#10;&#10;Ex: Empresa de tecnologia que quer lançar um SaaS de gestão para pequenas empresas. Faturamento atual R$ 500k/mês..."
            className="w-full h-32 bg-black/50 border border-gray-700 rounded p-3 text-gray-200 font-mono text-xs leading-relaxed resize-none outline-none focus:border-matrix-green/50 transition-colors placeholder:text-gray-600"
            spellCheck={false}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 pb-2">
            <p className="text-red-400 font-mono text-xs">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="px-4 pb-4 flex items-center gap-3">
          <button
            onClick={handleStart}
            disabled={!prompt.trim() || loading}
            className="flex-1 px-4 py-2.5 bg-matrix-green/20 border border-matrix-green text-matrix-green font-mono text-sm rounded hover:bg-matrix-green hover:text-matrix-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Iniciando...' : '▶ Executar Pipeline'}
          </button>
          <span className="text-gray-600 font-mono text-[10px]">Ctrl+Enter</span>
        </div>
      </div>
    </div>
  );
}
