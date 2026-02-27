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
      className={`fixed top-4 right-4 z-40 px-4 py-3 rounded-lg border font-mono text-xs max-w-[200px] ${
        isPipelineComplete
          ? 'border-yellow-400 bg-black/80 animate-pulse'
          : 'border-matrix-green bg-black/70'
      }`}
    >
      {isPipelineComplete && (
        <div className="text-yellow-400 font-bold text-center mb-2 text-sm">
          COMPLETE!
        </div>
      )}

      <div className="flex items-center gap-2 mb-1">
        <span className="text-yellow-400">📦</span>
        <span className="text-gray-300">
          Artifacts: <span className="text-matrix-green font-bold">{artifactsCollected}</span>/7
        </span>
      </div>

      <div className="flex items-center gap-2 mb-1">
        <span className="text-yellow-400">⭐</span>
        <span className="text-gray-300">
          Stages: <span className="text-matrix-green font-bold">{stagesCompleted}</span>/{totalStages}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-yellow-400">⏱️</span>
        <span className="text-gray-300">
          Time: <span className="text-matrix-green font-bold">{formatTime(elapsedMs)}</span>
        </span>
      </div>
    </div>
  );
}
