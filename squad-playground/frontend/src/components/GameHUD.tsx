import { useEffect, useRef } from 'react';
import { useGameStore } from '../stores/useGameStore';
import { usePipelineStore } from '../stores/usePipelineStore';

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function GameHUD() {
  const {
    artifactsCollected,
    stagesCompleted,
    totalStages,
    elapsedMs,
    isTimerRunning,
    isPipelineComplete,
    tick,
    setTimerRunning,
    collectArtifact,
    completeStage,
    setPipelineComplete,
  } = useGameStore();
  const pipelineStatus = usePipelineStore((s) => s.status);
  const prevStepRef = useRef(0);
  const pipelineStep = usePipelineStore((s) => s.currentStep);

  // Timer tick
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => tick(100), 100);
    return () => clearInterval(interval);
  }, [isTimerRunning, tick]);

  // Sync with pipeline
  useEffect(() => {
    if (pipelineStatus === 'executing' && !isTimerRunning) {
      setTimerRunning(true);
    }
    if (pipelineStatus === 'approval_required') {
      setTimerRunning(false);
    }
    if (pipelineStatus === 'completed') {
      setPipelineComplete();
    }
  }, [pipelineStatus, isTimerRunning, setTimerRunning, setPipelineComplete]);

  // Track stage completions
  useEffect(() => {
    if (pipelineStep > prevStepRef.current) {
      completeStage();
      collectArtifact();
      prevStepRef.current = pipelineStep;
    }
  }, [pipelineStep, completeStage, collectArtifact]);

  if (pipelineStatus === 'idle') return null;

  return (
    <div
      className={`fixed top-4 right-4 z-40 px-5 py-4 rounded-2xl glass font-mono text-xs max-w-[200px] shadow-glass ${
        isPipelineComplete ? 'border-yellow-400/30' : ''
      }`}
    >
      {isPipelineComplete && (
        <div className="text-gradient-gold font-display font-bold text-center mb-3 text-sm tracking-wide">
          COMPLETE
        </div>
      )}

      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Artifacts</span>
          <span className="text-white font-bold tabular-nums">{artifactsCollected}/7</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-500">Stages</span>
          <span className="text-white font-bold tabular-nums">{stagesCompleted}/{totalStages}</span>
        </div>

        <div className="w-full h-px bg-white/[0.06]" />

        <div className="flex items-center justify-between">
          <span className="text-gray-500">Time</span>
          <span className="text-matrix-green font-bold tabular-nums">{formatTime(elapsedMs)}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1 w-full bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${(stagesCompleted / totalStages) * 100}%`,
            background: isPipelineComplete
              ? 'linear-gradient(90deg, #F59E0B, #EF4444)'
              : 'linear-gradient(90deg, #22C55E, #06B6D4)',
          }}
        />
      </div>
    </div>
  );
}
