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

  // Show when pipeline completes
  useEffect(() => {
    if (status === 'completed') {
      setVisible(true);
      // Trigger particles after a short delay
      setTimeout(() => setShowParticles(true), 200);
    }
  }, [status]);

  // Fetch word count
  useEffect(() => {
    if (!visible || !sessionId) return;
    fetch(`${API_BASE}/api/artifacts/${sessionId}`)
      .then((r) => r.json())
      .then((artifacts: { size: number }[]) => {
        // Rough estimate: ~5 chars per word
        const totalBytes = artifacts.reduce((sum, a) => sum + a.size, 0);
        setWordCount(Math.round(totalBytes / 5));
      })
      .catch(() => setWordCount(null));
  }, [visible, sessionId]);

  // Escape to dismiss
  useEffect(() => {
    if (!visible) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setVisible(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [visible]);

  const handleDownload = useCallback(() => {
    if (sessionId) {
      window.open(`${API_BASE}/api/artifacts/${sessionId}/download`, '_blank');
    }
  }, [sessionId]);

  const handleViewProposal = useCallback(() => {
    if (sessionId) {
      window.open(`${API_BASE}/api/artifacts/${sessionId}/proposta/preview`, '_blank');
    }
  }, [sessionId]);

  const handleViewLanding = useCallback(() => {
    if (sessionId) {
      window.open(`${API_BASE}/api/artifacts/${sessionId}/landing-page`, '_blank');
    }
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
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90" />

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
                    backgroundColor: `hsl(${140 + Math.random() * 30}, 80%, ${50 + Math.random() * 20}%)`,
                    animation: `victoryParticle 1.2s ease-out ${p.delay}ms forwards`,
                    '--tx': `${p.tx}px`,
                    '--ty': `${p.ty}px`,
                  } as React.CSSProperties}
                />
              ))}
            </div>
          </div>
        )}

        {/* Neo scaled 3x */}
        <div className="relative">
          <div
            className="w-24 h-24 bg-matrix-green/20 border-2 border-matrix-green rounded-lg flex items-center justify-center animate-pulse"
            style={{ boxShadow: '0 0 40px rgba(34, 197, 94, 0.5)' }}
          >
            <span className="text-5xl">🕶️</span>
          </div>
        </div>

        {/* Title */}
        <h1
          className="text-2xl md:text-3xl text-matrix-green font-bold text-center tracking-widest"
          style={{
            fontFamily: '"Press Start 2P", monospace',
            textShadow: '0 0 20px rgba(34, 197, 94, 0.8), 0 0 40px rgba(34, 197, 94, 0.4)',
            animation: 'glow 2s ease-in-out infinite alternate',
          }}
        >
          MISSION COMPLETE
        </h1>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 w-full">
          <div className="bg-black/60 border border-gray-700 rounded-lg p-3 text-center">
            <div className="text-yellow-400 text-lg mb-1">⏱️</div>
            <div className="text-matrix-green font-mono font-bold text-lg">{formatTime(elapsedMs)}</div>
            <div className="text-gray-500 text-xs font-mono">Tempo Total</div>
          </div>
          <div className="bg-black/60 border border-gray-700 rounded-lg p-3 text-center">
            <div className="text-yellow-400 text-lg mb-1">📦</div>
            <div className="text-matrix-green font-mono font-bold text-lg">{artifactsCollected}/7</div>
            <div className="text-gray-500 text-xs font-mono">Artefatos</div>
          </div>
          <div className="bg-black/60 border border-gray-700 rounded-lg p-3 text-center">
            <div className="text-yellow-400 text-lg mb-1">⭐</div>
            <div className="text-matrix-green font-mono font-bold text-lg">{stagesCompleted}/7</div>
            <div className="text-gray-500 text-xs font-mono">Estágios</div>
          </div>
          <div className="bg-black/60 border border-gray-700 rounded-lg p-3 text-center">
            <div className="text-yellow-400 text-lg mb-1">📝</div>
            <div className="text-matrix-green font-mono font-bold text-lg">
              {wordCount !== null ? wordCount.toLocaleString('pt-BR') : '...'}
            </div>
            <div className="text-gray-500 text-xs font-mono">Palavras</div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 w-full">
          <button
            onClick={handleDownload}
            className="w-full px-4 py-2.5 bg-matrix-green/20 border border-matrix-green text-matrix-green font-mono text-sm rounded hover:bg-matrix-green hover:text-matrix-black transition-colors"
          >
            📥 Download Todos os Artefatos
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleViewProposal}
              className="flex-1 px-3 py-2 border border-gray-600 text-gray-300 font-mono text-xs rounded hover:border-matrix-green hover:text-matrix-green transition-colors"
            >
              📄 Ver Proposta
            </button>
            <button
              onClick={handleViewLanding}
              className="flex-1 px-3 py-2 border border-gray-600 text-gray-300 font-mono text-xs rounded hover:border-matrix-green hover:text-matrix-green transition-colors"
            >
              🌐 Ver Landing Page
            </button>
          </div>
          <button
            onClick={handleNewMission}
            className="w-full px-4 py-2.5 bg-yellow-500/10 border border-yellow-500 text-yellow-400 font-mono text-sm rounded hover:bg-yellow-500 hover:text-black transition-colors"
          >
            🚀 Nova Missão
          </button>
        </div>

        {/* Keyboard hint */}
        <span className="text-gray-600 font-mono text-[10px]">
          Esc ou click fora para fechar
        </span>
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes victoryParticle {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
        }
        @keyframes glow {
          from { text-shadow: 0 0 20px rgba(34,197,94,0.8), 0 0 40px rgba(34,197,94,0.4); }
          to { text-shadow: 0 0 30px rgba(34,197,94,1), 0 0 60px rgba(34,197,94,0.6), 0 0 80px rgba(34,197,94,0.3); }
        }
      `}</style>
    </div>
  );
}
