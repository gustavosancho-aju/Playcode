import { useEffect, useState, useCallback, useRef } from 'react';
import { usePipelineStore } from '../stores/usePipelineStore';
import { useGameStore } from '../stores/useGameStore';

const API_BASE = 'http://localhost:3001';
const PARTICLE_COUNT = 60;

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  size: number;
  delay: number;
  color: string;
}

function generateParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + Math.random() * 0.3;
    const dist = 80 + Math.random() * 200;
    return {
      id: i,
      x: 0,
      y: 0,
      tx: Math.cos(angle) * dist,
      ty: Math.sin(angle) * dist,
      size: 2 + Math.random() * 6,
      delay: Math.random() * 300,
      color: `hsl(${140 + Math.random() * 80}, 70%, ${50 + Math.random() * 20}%)`,
    };
  });
}

export function VictoryScreen() {
  const status = usePipelineStore((s) => s.status);
  const sessionId = usePipelineStore((s) => s.sessionId);
  const resetPipeline = usePipelineStore((s) => s.reset);
  const { artifactsCollected, stagesCompleted, elapsedMs } = useGameStore();
  const resetGame = useGameStore((s) => s.reset);

  const [visible, setVisible] = useState(false);
  const [wordCount, setWordCount] = useState<number | null>(null);
  const [particles] = useState(generateParticles);
  const [showParticles, setShowParticles] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'completed') {
      setVisible(true);
      setTimeout(() => setShowParticles(true), 200);
    }
  }, [status]);

  useEffect(() => {
    if (!visible || !sessionId) return;
    const controller = new AbortController();
    fetch(`${API_BASE}/api/artifacts/${sessionId}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((artifacts: { size: number }[]) => {
        const totalBytes = artifacts.reduce((sum, a) => sum + a.size, 0);
        setWordCount(Math.round(totalBytes / 5));
      })
      .catch(() => { if (!controller.signal.aborted) setWordCount(null); });
    return () => controller.abort();
  }, [visible, sessionId]);

  useEffect(() => {
    if (!visible) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setVisible(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [visible]);

  const handleDownload = useCallback(() => {
    if (sessionId) window.open(`${API_BASE}/api/artifacts/${sessionId}/download`, '_blank');
  }, [sessionId]);

  const handleViewProposal = useCallback(() => {
    if (sessionId) window.open(`${API_BASE}/api/artifacts/${sessionId}/proposta/preview`, '_blank');
  }, [sessionId]);

  const handleViewLanding = useCallback(() => {
    if (sessionId) window.open(`${API_BASE}/api/artifacts/${sessionId}/landing-page`, '_blank');
  }, [sessionId]);

  const handleDownloadPdf = useCallback(() => {
    if (sessionId) window.open(`${API_BASE}/api/artifacts/${sessionId}/pdf`, '_blank');
  }, [sessionId]);

  const handleNewMission = useCallback(() => {
    setVisible(false);
    setShowParticles(false);
    resetPipeline();
    resetGame();
  }, [resetPipeline, resetGame]);

  if (!visible) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => { if (e.target === overlayRef.current) setVisible(false); }}
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 max-w-lg w-full mx-4">

        {/* Particle explosion */}
        {showParticles && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="relative w-full h-full flex items-center justify-center">
              {particles.map((p) => (
                <span
                  key={p.id}
                  className="absolute rounded-full"
                  style={{
                    width: p.size,
                    height: p.size,
                    backgroundColor: p.color,
                    animation: `victoryParticle 1.2s ease-out ${p.delay}ms forwards`,
                    '--tx': `${p.tx}px`,
                    '--ty': `${p.ty}px`,
                  } as React.CSSProperties}
                />
              ))}
            </div>
          </div>
        )}

        {/* Icon */}
        <div className="relative">
          <div
            className="w-24 h-24 rounded-2xl glass flex items-center justify-center"
            style={{ boxShadow: '0 0 40px rgba(34, 197, 94, 0.3), 0 0 80px rgba(168, 85, 247, 0.15)' }}
          >
            <span className="text-5xl">🕶️</span>
          </div>
        </div>

        {/* Title */}
        <h1
          className="text-2xl md:text-3xl font-display font-bold text-center tracking-wide text-gradient"
          style={{
            animation: 'glow 2s ease-in-out infinite alternate',
          }}
        >
          MISSION COMPLETE
        </h1>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 w-full">
          {[
            { icon: '⏱️', value: formatTime(elapsedMs), label: 'Tempo Total' },
            { icon: '📦', value: `${artifactsCollected}/7`, label: 'Artefatos' },
            { icon: '⭐', value: `${stagesCompleted}/7`, label: 'Estágios' },
            { icon: '📝', value: wordCount !== null ? wordCount.toLocaleString('pt-BR') : '...', label: 'Palavras' },
          ].map((stat) => (
            <div key={stat.label} className="glass rounded-xl p-4 text-center">
              <div className="text-lg mb-1">{stat.icon}</div>
              <div className="text-white font-display font-bold text-lg tabular-nums">{stat.value}</div>
              <div className="text-gray-500 text-xs font-display">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 w-full">
          <button
            onClick={handleDownloadPdf}
            className="w-full px-4 py-3 rounded-xl font-display text-sm font-semibold transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(6,182,212,0.15))',
              border: '1px solid rgba(34,197,94,0.3)',
              color: '#22C55E',
            }}
          >
            Baixar Relatório em PDF
          </button>
          <button
            onClick={handleDownload}
            className="w-full px-4 py-2.5 rounded-xl glass font-display text-xs font-medium text-gray-300 hover:text-white hover:bg-white/[0.05] transition-all duration-300"
          >
            Download Artefatos (ZIP)
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleViewProposal}
              className="flex-1 px-3 py-2.5 rounded-xl glass font-display text-xs font-medium text-gray-400 hover:text-white hover:bg-white/[0.05] transition-all duration-300"
            >
              Ver Proposta
            </button>
            <button
              onClick={handleViewLanding}
              className="flex-1 px-3 py-2.5 rounded-xl glass font-display text-xs font-medium text-gray-400 hover:text-white hover:bg-white/[0.05] transition-all duration-300"
            >
              Ver Landing Page
            </button>
          </div>
          <button
            onClick={handleNewMission}
            className="w-full px-4 py-2.5 rounded-xl font-display text-sm font-medium transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(239,68,68,0.1))',
              border: '1px solid rgba(245,158,11,0.3)',
              color: '#F59E0B',
            }}
          >
            Nova Missão
          </button>
        </div>

        <span className="text-gray-600 text-[10px] font-display">
          Esc ou click fora para fechar
        </span>
      </div>

      <style>{`
        @keyframes victoryParticle {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
        }
        @keyframes glow {
          from { filter: drop-shadow(0 0 8px rgba(34,197,94,0.4)); }
          to { filter: drop-shadow(0 0 16px rgba(168,85,247,0.4)); }
        }
      `}</style>
    </div>
  );
}
