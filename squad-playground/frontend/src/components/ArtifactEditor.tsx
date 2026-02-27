import { useState, useEffect, useRef, useCallback } from 'react';
import { usePipelineStore } from '../stores/usePipelineStore';
import { useGameStore } from '../stores/useGameStore';
import { useSocket } from '../hooks/useSocket';

const API_BASE = 'http://localhost:3001';
const AUTO_SAVE_INTERVAL = 5000;

interface ArtifactEditorProps {
  sessionId: string;
  artifactName: string;
  initialContent: string;
  onClose: () => void;
  onSaveAndContinue: () => void;
}

export function ArtifactEditor({
  sessionId,
  artifactName,
  initialContent,
  onClose,
  onSaveAndContinue,
}: ArtifactEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [savedContent, setSavedContent] = useState(initialContent);
  const [showPreview, setShowPreview] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [flashSave, setFlashSave] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval>>();

  const isDirty = content !== savedContent;

  const save = useCallback(async () => {
    if (!isDirty && saveStatus !== 'idle') return;
    setSaveStatus('saving');
    try {
      const res = await fetch(`${API_BASE}/api/artifacts/${sessionId}/${artifactName}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSavedContent(content);
      setSaveStatus('saved');
      setFlashSave(true);
      setTimeout(() => setFlashSave(false), 500);
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [content, isDirty, saveStatus, sessionId, artifactName]);

  // Auto-save every 5s if dirty
  useEffect(() => {
    autoSaveTimerRef.current = setInterval(() => {
      if (content !== savedContent) {
        save();
      }
    }, AUTO_SAVE_INTERVAL);
    return () => clearInterval(autoSaveTimerRef.current);
  }, [content, savedContent, save]);

  // Ctrl+S
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [save]);

  const handleSaveAndContinue = async () => {
    await save();
    onSaveAndContinue();
  };

  const handleCancel = () => {
    if (isDirty && !window.confirm('Descartar alterações não salvas?')) return;
    onClose();
  };

  // Line numbers
  const lineCount = content.split('\n').length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={handleCancel} />

      {/* Slide-in panel */}
      <div
        className={`relative z-10 w-[60vw] h-full flex flex-col border-l border-matrix-green bg-[#0a0a0a] transition-transform duration-300 ${
          flashSave ? 'ring-2 ring-matrix-green ring-opacity-80' : ''
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <span className="text-yellow-400">📄</span>
            <span className="text-gray-200 font-mono text-sm">{artifactName}</span>
            {isDirty && <span className="text-yellow-400 text-xs font-mono">● não salvo</span>}
            {saveStatus === 'saving' && <span className="text-gray-400 text-xs font-mono">Salvando...</span>}
            {saveStatus === 'saved' && <span className="text-matrix-green text-xs font-mono">✓ Salvo</span>}
            {saveStatus === 'error' && <span className="text-red-400 text-xs font-mono">✗ Erro ao salvar</span>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`px-2 py-1 text-xs font-mono rounded border ${
                showPreview
                  ? 'border-matrix-green text-matrix-green bg-matrix-green/10'
                  : 'border-gray-600 text-gray-400 hover:text-gray-200'
              }`}
            >
              {showPreview ? 'Editor' : 'Preview'}
            </button>
            <button
              onClick={handleCancel}
              className="text-gray-500 hover:text-white text-lg px-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Editor area */}
        <div className="flex-1 flex overflow-hidden">
          {!showPreview ? (
            <div className="flex flex-1 overflow-hidden">
              {/* Line numbers */}
              <div className="py-3 px-2 text-right text-gray-600 font-mono text-xs leading-[1.6] select-none overflow-hidden bg-black/30 min-w-[3rem]">
                {Array.from({ length: lineCount }, (_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 resize-none bg-transparent text-gray-200 font-mono text-xs leading-[1.6] p-3 outline-none overflow-auto"
                style={{ fontFamily: '"JetBrains Mono", monospace' }}
                spellCheck={false}
              />
            </div>
          ) : (
            <div className="flex-1 overflow-auto p-4">
              <pre className="text-gray-300 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                {content}
              </pre>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-800">
          <button
            onClick={handleSaveAndContinue}
            className="flex-1 px-4 py-2 bg-matrix-green/20 border border-matrix-green text-matrix-green font-mono text-sm rounded hover:bg-matrix-green hover:text-matrix-black transition-colors"
          >
            ✓ Salvar & Continuar
          </button>
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-600 text-gray-400 font-mono text-sm rounded hover:text-white hover:border-gray-400 transition-colors"
          >
            Cancelar
          </button>
          <span className="text-gray-600 font-mono text-[10px] ml-auto">
            Ctrl+S = Salvar · Auto-save a cada 5s
          </span>
        </div>
      </div>
    </div>
  );
}
