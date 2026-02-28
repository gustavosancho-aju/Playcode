import { useState, useEffect, useRef, useCallback, DragEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const API_BASE = 'http://localhost:3001';
const AUTO_SAVE_INTERVAL = 5000;

interface ArtifactEditorProps {
  sessionId: string;
  artifactName: string;
  initialContent: string;
  onClose: () => void;
  onSaveAndContinue: () => void;
}

type MarkdownAction = 'bold' | 'italic' | 'h1' | 'h2' | 'h3' | 'ul' | 'ol' | 'code' | 'link';

const TOOLBAR_ITEMS: { action: MarkdownAction; label: string; title: string }[] = [
  { action: 'bold', label: 'B', title: 'Negrito' },
  { action: 'italic', label: 'I', title: 'Itálico' },
  { action: 'h1', label: 'H1', title: 'Título 1' },
  { action: 'h2', label: 'H2', title: 'Título 2' },
  { action: 'h3', label: 'H3', title: 'Título 3' },
  { action: 'ul', label: '•', title: 'Lista' },
  { action: 'ol', label: '1.', title: 'Lista numerada' },
  { action: 'code', label: '<>', title: 'Código' },
  { action: 'link', label: '🔗', title: 'Link' },
];

export function ArtifactEditor({
  sessionId,
  artifactName,
  initialContent,
  onClose,
  onSaveAndContinue,
}: ArtifactEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [savedContent, setSavedContent] = useState(initialContent);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [flashSave, setFlashSave] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval>>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDirty = content !== savedContent;
  const isEdited = content !== initialContent;

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

  const handleReset = () => {
    if (!window.confirm('Resetar para o conteúdo original do agente?')) return;
    setContent(initialContent);
  };

  // Toolbar actions
  const applyMarkdown = (action: MarkdownAction) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.substring(start, end);
    let replacement = '';
    let cursorOffset = 0;

    switch (action) {
      case 'bold':
        replacement = `**${selected || 'texto'}**`;
        cursorOffset = selected ? replacement.length : 2;
        break;
      case 'italic':
        replacement = `*${selected || 'texto'}*`;
        cursorOffset = selected ? replacement.length : 1;
        break;
      case 'h1':
        replacement = `# ${selected || 'Título'}`;
        cursorOffset = replacement.length;
        break;
      case 'h2':
        replacement = `## ${selected || 'Título'}`;
        cursorOffset = replacement.length;
        break;
      case 'h3':
        replacement = `### ${selected || 'Título'}`;
        cursorOffset = replacement.length;
        break;
      case 'ul':
        replacement = `- ${selected || 'item'}`;
        cursorOffset = replacement.length;
        break;
      case 'ol':
        replacement = `1. ${selected || 'item'}`;
        cursorOffset = replacement.length;
        break;
      case 'code':
        if (selected.includes('\n')) {
          replacement = `\`\`\`\n${selected}\n\`\`\``;
        } else {
          replacement = `\`${selected || 'código'}\``;
        }
        cursorOffset = replacement.length;
        break;
      case 'link':
        replacement = `[${selected || 'texto'}](url)`;
        cursorOffset = selected ? replacement.length - 1 : replacement.indexOf('](') + 2;
        break;
    }

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    // Restore cursor position
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + cursorOffset;
      ta.setSelectionRange(pos, pos);
    });
  };

  // Image upload
  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch(`${API_BASE}/api/artifacts/${sessionId}/images`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();

      // Insert markdown image at cursor
      const ta = textareaRef.current;
      const pos = ta?.selectionStart ?? content.length;
      const imgMd = `![${file.name}](${data.url})\n`;
      const newContent = content.substring(0, pos) + imgMd + content.substring(pos);
      setContent(newContent);
    } catch {
      alert('Erro ao fazer upload da imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
    if (files.length > 0) uploadImage(files[0]);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleFileSelect = () => fileInputRef.current?.click();
  const handleEditorScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file);
    e.target.value = '';
  };

  const lineCount = content.split('\n').length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={handleCancel} />

      <div
        className={`relative z-10 w-[85vw] h-full flex flex-col border-l border-matrix-green bg-[#0a0a0a] ${
          flashSave ? 'ring-2 ring-matrix-green ring-opacity-80' : ''
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <span className="text-yellow-400">📄</span>
            <span className="text-gray-200 font-mono text-sm">{artifactName}</span>
            {isEdited && (
              <span className="text-cyan-400 text-xs font-mono border border-cyan-400/40 bg-cyan-400/10 px-2 py-0.5 rounded">
                ✎ Editado por você
              </span>
            )}
            {isDirty && <span className="text-yellow-400 text-xs font-mono">● não salvo</span>}
            {saveStatus === 'saving' && <span className="text-gray-400 text-xs font-mono">Salvando...</span>}
            {saveStatus === 'saved' && <span className="text-matrix-green text-xs font-mono">✓ Salvo</span>}
            {saveStatus === 'error' && <span className="text-red-400 text-xs font-mono">✗ Erro ao salvar</span>}
            {uploading && <span className="text-yellow-400 text-xs font-mono">📤 Enviando imagem...</span>}
          </div>
          <div className="flex items-center gap-2">
            {isEdited && (
              <button
                onClick={handleReset}
                className="px-2 py-1 text-xs font-mono rounded border border-orange-500/50 text-orange-400 hover:bg-orange-500/10"
                title="Resetar para original"
              >
                ↩ Resetar
              </button>
            )}
            <button
              onClick={handleCancel}
              className="text-gray-500 hover:text-white text-lg px-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-800 bg-black/30">
          {TOOLBAR_ITEMS.map(({ action, label, title }) => (
            <button
              key={action}
              onClick={() => applyMarkdown(action)}
              title={title}
              className="px-2 py-1 text-xs font-mono text-gray-300 hover:text-white hover:bg-gray-700 rounded border border-gray-700 hover:border-gray-500 transition-colors min-w-[28px]"
            >
              {label}
            </button>
          ))}
          <div className="w-px h-5 bg-gray-700 mx-1" />
          <button
            onClick={handleFileSelect}
            title="Upload imagem"
            className="px-2 py-1 text-xs font-mono text-gray-300 hover:text-white hover:bg-gray-700 rounded border border-gray-700 hover:border-gray-500 transition-colors"
          >
            📷
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Split view: Editor | Preview */}
        <div className="flex-1 flex overflow-hidden">
          {/* Editor pane */}
          <div
            className={`flex-1 flex flex-col border-r border-gray-800 ${isDragging ? 'ring-2 ring-cyan-400 ring-inset' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="px-3 py-1 text-[10px] font-mono text-gray-600 border-b border-gray-800 bg-black/20">
              EDITOR
            </div>
            <div className="flex flex-1 overflow-hidden">
              {/* Line numbers */}
              <div ref={lineNumbersRef} className="py-3 px-2 text-right text-gray-600 font-mono text-xs leading-[1.6] select-none overflow-hidden bg-black/30 min-w-[3rem]">
                {Array.from({ length: lineCount }, (_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onScroll={handleEditorScroll}
                className="flex-1 resize-none bg-transparent text-gray-200 font-mono text-xs leading-[1.6] p-3 outline-none overflow-auto"
                style={{ fontFamily: '"JetBrains Mono", monospace' }}
                spellCheck={false}
              />
            </div>
            {isDragging && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10 pointer-events-none">
                <span className="text-cyan-400 font-mono text-sm border-2 border-dashed border-cyan-400 px-6 py-3 rounded-lg">
                  Solte a imagem aqui
                </span>
              </div>
            )}
          </div>

          {/* Preview pane */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-3 py-1 text-[10px] font-mono text-gray-600 border-b border-gray-800 bg-black/20">
              PREVIEW
            </div>
            <div className="flex-1 overflow-auto p-4">
              <div className="prose prose-invert prose-sm max-w-none prose-headings:text-matrix-green prose-a:text-cyan-400 prose-code:text-yellow-300 prose-pre:bg-black/50 prose-pre:border prose-pre:border-gray-800">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              </div>
            </div>
          </div>
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
