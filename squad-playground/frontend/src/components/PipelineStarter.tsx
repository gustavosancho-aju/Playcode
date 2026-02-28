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
      <div className="rounded-2xl overflow-hidden shadow-glass" style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)' }}>
        {/* Header */}
        <div className="px-5 py-3 border-b border-white/[0.06]">
          <h3 className="text-white font-display text-sm font-semibold flex items-center gap-2">
            <span className="text-green-400">⚡</span> Iniciar Pipeline
          </h3>
        </div>

        {/* Pipeline type selector */}
        <div className="px-5 pt-4 flex gap-2">
          {PIPELINE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setPipelineType(opt.id)}
              className={`flex-1 flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-display text-xs transition-all duration-300 ${
                pipelineType === opt.id
                  ? 'bg-white/[0.07] text-white shadow-glow'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]'
              }`}
              style={pipelineType === opt.id ? { border: '1px solid rgba(255,255,255,0.08)' } : { border: '1px solid transparent' }}
            >
              <span>{opt.icon}</span>
              <div className="text-left">
                <div className="font-semibold">{opt.label}</div>
                <div className="text-[10px] opacity-60">{opt.description}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Textarea */}
        <div className="p-5">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Descreva o briefing do cliente aqui...&#10;&#10;Ex: Empresa de tecnologia que quer lançar um SaaS de gestão para pequenas empresas. Faturamento atual R$ 500k/mês..."
            className="w-full h-32 bg-white/[0.03] border border-white/[0.06] rounded-xl p-3.5 text-gray-200 font-mono text-xs leading-relaxed resize-none outline-none focus:border-white/[0.12] transition-all placeholder:text-gray-600"
            spellCheck={false}
          />
        </div>

        {error && (
          <div className="px-5 pb-2">
            <p className="text-red-400 font-display text-xs">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="px-5 pb-5 flex items-center gap-3">
          <button
            onClick={handleStart}
            disabled={!prompt.trim() || loading}
            className="flex-1 px-4 py-2.5 rounded-xl font-display text-sm font-semibold transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(6,182,212,0.15))',
              border: '1px solid rgba(34,197,94,0.3)',
              color: '#22C55E',
            }}
          >
            {loading ? '⏳ Iniciando...' : '▶ Executar Pipeline'}
          </button>
          <span className="text-gray-600 font-display text-[10px]">Ctrl+Enter</span>
        </div>
      </div>
    </div>
  );
}
