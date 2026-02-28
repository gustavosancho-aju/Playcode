import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { usePipelineStore } from '../stores/usePipelineStore';
import { useGameStore } from '../stores/useGameStore';
import { useSocket } from '../hooks/useSocket';
import { AGENT_DEFINITIONS } from 'shared/types';
import { ArtifactEditor } from './ArtifactEditor';

export function ApprovalPopup() {
  const pendingApproval = usePipelineStore((s) => s.pendingApproval);
  const sessionId = usePipelineStore((s) => s.sessionId);
  const { approveStep, rollbackStep } = useSocket();
  const setTimerRunning = useGameStore((s) => s.setTimerRunning);
  const [showEditor, setShowEditor] = useState(false);

  const agent = pendingApproval
    ? AGENT_DEFINITIONS.find((a) => a.id === pendingApproval.agentId)
    : null;

  // Pause timer when popup visible
  useEffect(() => {
    if (pendingApproval) {
      setTimerRunning(false);
      setShowEditor(false);
    }
  }, [pendingApproval, setTimerRunning]);

  const handleApprove = useCallback(() => {
    approveStep();
    setTimerRunning(true);
  }, [approveStep, setTimerRunning]);

  const handleEdit = useCallback(() => {
    setShowEditor(true);
  }, []);

  const handleBack = useCallback(() => {
    const prevIndex = usePipelineStore.getState().currentStep - 1;
    const prevAgent = prevIndex >= 0 ? AGENT_DEFINITIONS[prevIndex] : null;
    const name = prevAgent?.name || 'anterior';
    if (!window.confirm(`Voltar para ${name}?`)) return;
    rollbackStep();
    setTimerRunning(true);
  }, [rollbackStep, setTimerRunning]);

  // Keyboard shortcuts (only when editor is NOT open)
  useEffect(() => {
    if (!pendingApproval || showEditor) return;

    const handleKey = (e: KeyboardEvent) => {
      // Don't intercept when typing in inputs/textareas
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        handleApprove();
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        handleEdit();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [pendingApproval, showEditor, handleApprove, handleEdit]);

  if (!pendingApproval || !agent) return null;

  // Show editor instead of popup
  if (showEditor && sessionId) {
    return (
      <ArtifactEditor
        sessionId={sessionId}
        artifactName={pendingApproval.artifactName}
        initialContent={pendingApproval.artifactContent}
        onClose={() => setShowEditor(false)}
        onSaveAndContinue={() => {
          setShowEditor(false);
          handleApprove();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Dark backdrop — no dismiss on click */}
      <div className="absolute inset-0 bg-black/80" />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-2xl mx-4 border rounded-lg overflow-hidden"
        style={{ borderColor: agent.color, backgroundColor: 'rgba(13, 13, 13, 0.95)' }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-6 py-4 border-b"
          style={{ borderColor: agent.color }}
        >
          <span className="text-3xl">{agent.icon}</span>
          <div>
            <h2 className="text-lg font-bold font-mono" style={{ color: agent.color }}>
              {agent.name}
            </h2>
            <p className="text-gray-400 text-xs font-mono">{agent.role} — Aprovação necessária</p>
          </div>
          <div className="ml-auto">
            <span
              className="inline-block w-3 h-3 rounded-full animate-pulse"
              style={{ backgroundColor: agent.color }}
            />
          </div>
        </div>

        {/* Artifact preview */}
        <div className="px-6 py-4 max-h-[400px] overflow-y-auto">
          {pendingApproval.artifactName && (
            <div className="mb-3 flex items-center gap-2">
              <span className="text-yellow-400 text-sm">📄</span>
              <span className="text-gray-300 font-mono text-sm">{pendingApproval.artifactName}</span>
            </div>
          )}
          {pendingApproval.artifactContent ? (
            <div className="bg-black/50 rounded p-4 border border-gray-800 prose prose-invert prose-sm max-w-none prose-headings:text-matrix-green prose-a:text-cyan-400 prose-code:text-yellow-300 prose-pre:bg-black/50 prose-pre:border prose-pre:border-gray-800">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{pendingApproval.artifactContent}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-gray-500 font-mono text-sm italic">
              Artefato sendo processado...
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="px-6 py-4 border-t border-gray-800 flex items-center gap-3">
          <button
            onClick={handleApprove}
            className="flex-1 px-4 py-2.5 bg-matrix-green/20 border border-matrix-green text-matrix-green font-mono text-sm rounded hover:bg-matrix-green hover:text-matrix-black transition-colors duration-200"
          >
            ✓ Aprovar <span className="text-xs opacity-60 ml-1">(Enter)</span>
          </button>
          <button
            onClick={handleEdit}
            className="flex-1 px-4 py-2.5 bg-yellow-500/10 border border-yellow-500 text-yellow-400 font-mono text-sm rounded hover:bg-yellow-500 hover:text-black transition-colors duration-200"
          >
            ✎ Editar <span className="text-xs opacity-60 ml-1">(E)</span>
          </button>
          <button
            onClick={handleBack}
            className="flex-1 px-4 py-2.5 bg-red-500/10 border border-red-600 text-red-400 font-mono text-sm rounded hover:bg-red-600 hover:text-white transition-colors duration-200"
          >
            ↩ Voltar
          </button>
        </div>

        {/* Keyboard hint */}
        <div className="px-6 py-2 bg-black/50 text-center">
          <span className="text-gray-600 font-mono text-[10px]">
            Enter = Aprovar · E = Editar · Esc = Manter pausado
          </span>
        </div>
      </div>
    </div>
  );
}
