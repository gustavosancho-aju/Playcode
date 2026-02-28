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

  useEffect(() => {
    if (!pendingApproval || showEditor) return;

    const handleKey = (e: KeyboardEvent) => {
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
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />

      <div
        className="relative z-10 w-full max-w-2xl mx-4 glass rounded-2xl overflow-hidden shadow-glass"
        style={{ borderColor: `${agent.color}30` }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06]"
        >
          <span className="text-3xl">{agent.icon}</span>
          <div>
            <h2 className="text-lg font-bold font-display" style={{ color: agent.color }}>
              {agent.name}
            </h2>
            <p className="text-gray-400 text-xs font-display">{agent.role} — Aprovação necessária</p>
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
              <span className="text-gray-300 font-display text-sm">{pendingApproval.artifactName}</span>
            </div>
          )}
          {pendingApproval.artifactContent ? (
            <div className="bg-black/30 rounded-xl p-4 border border-white/[0.06] prose prose-invert prose-sm max-w-none prose-headings:text-green-400 prose-a:text-cyan-400 prose-code:text-yellow-300 prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/[0.06] prose-pre:rounded-xl">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{pendingApproval.artifactContent}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-gray-500 font-display text-sm italic">
              Artefato sendo processado...
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="px-6 py-4 border-t border-white/[0.06] flex items-center gap-3">
          <button
            onClick={handleApprove}
            className="flex-1 px-4 py-2.5 rounded-xl font-display text-sm font-semibold transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(6,182,212,0.15))',
              border: '1px solid rgba(34,197,94,0.3)',
              color: '#22C55E',
            }}
          >
            ✓ Aprovar <span className="text-xs opacity-60 ml-1">(Enter)</span>
          </button>
          <button
            onClick={handleEdit}
            className="flex-1 px-4 py-2.5 rounded-xl font-display text-sm font-semibold transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(234,179,8,0.1))',
              border: '1px solid rgba(245,158,11,0.3)',
              color: '#F59E0B',
            }}
          >
            ✎ Editar <span className="text-xs opacity-60 ml-1">(E)</span>
          </button>
          <button
            onClick={handleBack}
            className="flex-1 px-4 py-2.5 rounded-xl font-display text-sm font-semibold transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(220,38,38,0.1))',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#EF4444',
            }}
          >
            ↩ Voltar
          </button>
        </div>

        {/* Keyboard hint */}
        <div className="px-6 py-2 bg-black/30 text-center">
          <span className="text-gray-600 font-display text-[10px]">
            Enter = Aprovar · E = Editar · Esc = Manter pausado
          </span>
        </div>
      </div>
    </div>
  );
}
