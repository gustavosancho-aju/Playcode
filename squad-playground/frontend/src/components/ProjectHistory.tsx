import { useState, useEffect, useCallback } from 'react';
import { AGENT_DEFINITIONS } from 'shared/types';

interface SessionArtifact {
  filename: string;
  agent: string;
}

interface Session {
  sessionId: string;
  createdAt: string;
  pipelineType: string;
  status: string;
  artifactCount: number;
  artifacts: SessionArtifact[];
}

const API = 'http://localhost:3001';

export function ProjectHistory() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<{ filename: string; content: string; isHtml: boolean } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deleteSession = useCallback(async (sessionId: string) => {
    if (!confirm(`Excluir projeto "${sessionId}" e todos os artefatos?`)) return;
    setDeletingId(sessionId);
    try {
      const res = await fetch(`${API}/api/sessions/${sessionId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
      if (expandedSession === sessionId) setExpandedSession(null);
    } catch {
      alert('Erro ao excluir sessão');
    } finally {
      setDeletingId(null);
    }
  }, [expandedSession]);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/sessions`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setSessions(data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar sessões');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const openPreview = async (sessionId: string, filename: string) => {
    try {
      const res = await fetch(`${API}/api/artifacts/${sessionId}/${filename}`);
      if (!res.ok) throw new Error('Not found');
      const content = await res.text();
      const isHtml = filename.endsWith('.html');
      setPreviewContent({ filename, content, isHtml });
    } catch {
      setPreviewContent({ filename, content: 'Erro ao carregar artefato', isHtml: false });
    }
  };

  const getAgentDef = (agentName: string) =>
    AGENT_DEFINITIONS.find((a) => a.id === agentName);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const pipelineBadge = (type: string) => {
    if (type === 'consultoria') return { label: 'Consultoria', color: '#22c55e' };
    if (type === 'briefing') return { label: 'Briefing', color: '#06b6d4' };
    return { label: type, color: '#6b7280' };
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'completed': return { label: 'Concluído', color: '#22c55e' };
      case 'error': return { label: 'Erro', color: '#ef4444' };
      case 'executing': return { label: 'Em execução', color: '#f59e0b' };
      default: return { label: status, color: '#6b7280' };
    }
  };

  const filtered = sessions.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.sessionId.toLowerCase().includes(q) ||
      s.pipelineType.toLowerCase().includes(q) ||
      s.artifacts.some((a) => a.filename.toLowerCase().includes(q))
    );
  });

  return (
    <div className="h-full overflow-y-auto px-6 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="font-display text-2xl font-bold text-gradient tracking-wide">
            PROJETOS
          </h1>
          <p className="text-gray-500 font-display text-sm">
            {sessions.length} sessão(ões) encontrada(s)
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por sessão, tipo ou artefato..."
            className="w-full glass rounded-xl px-4 py-2.5 font-display text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-white/10 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 text-sm"
            >
              ✕
            </button>
          )}
        </div>

        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-500 font-display text-sm animate-pulse">Carregando sessões...</p>
          </div>
        )}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-400 font-display text-sm">{error}</p>
            <button onClick={fetchSessions} className="mt-2 text-green-400 font-display text-xs underline">
              Tentar novamente
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 font-display text-sm">
              {searchQuery ? 'Nenhuma sessão encontrada para esta busca' : 'Nenhuma sessão encontrada. Execute um pipeline primeiro!'}
            </p>
          </div>
        )}

        <div className="space-y-3">
          {filtered.map((session) => {
            const isExpanded = expandedSession === session.sessionId;
            const badge = pipelineBadge(session.pipelineType);
            const sBadge = statusBadge(session.status);

            return (
              <div
                key={session.sessionId}
                className="glass rounded-xl overflow-hidden transition-all hover:bg-white/[0.04] relative"
              >
                <button
                  onClick={() => setExpandedSession(isExpanded ? null : session.sessionId)}
                  className="w-full flex items-center gap-4 px-4 py-3 text-left"
                >
                  <span className="text-gray-600 text-sm">{isExpanded ? '▼' : '▶'}</span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-sm text-gray-200">{session.sessionId}</span>
                      <span
                        className="px-2 py-0.5 rounded-lg font-display text-[10px]"
                        style={{ color: badge.color, border: `1px solid ${badge.color}40`, backgroundColor: `${badge.color}10` }}
                      >
                        {badge.label}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-lg font-display text-[10px]"
                        style={{ color: sBadge.color, border: `1px solid ${sBadge.color}40`, backgroundColor: `${sBadge.color}10` }}
                      >
                        {sBadge.label}
                      </span>
                    </div>
                    <p className="text-gray-500 font-display text-[10px] mt-0.5">
                      {formatDate(session.createdAt)} · {session.artifactCount} artefato(s)
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1">
                      {session.artifacts.slice(0, 6).map((a, i) => {
                        const def = getAgentDef(a.agent);
                        return (
                          <span key={i} className="text-sm" title={a.agent}>
                            {def?.icon || '📄'}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </button>

                {/* Delete button */}
                <button
                  onClick={(e) => { e.stopPropagation(); deleteSession(session.sessionId); }}
                  disabled={deletingId === session.sessionId}
                  className="absolute top-3 right-3 px-2 py-1 text-[10px] font-display rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-400/10 border border-transparent hover:border-red-400/30 transition-all disabled:opacity-30"
                  title="Excluir projeto"
                >
                  {deletingId === session.sessionId ? '...' : '✕'}
                </button>

                {isExpanded && (
                  <div className="border-t border-white/[0.06] px-4 py-3 space-y-2">
                    {session.artifacts.map((artifact) => {
                      const def = getAgentDef(artifact.agent);
                      const isHtml = artifact.filename.endsWith('.html');

                      return (
                        <div
                          key={artifact.filename}
                          className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-all"
                        >
                          <span className="text-sm">{def?.icon || '📄'}</span>
                          <div className="flex-1 min-w-0">
                            <span className="font-mono text-xs text-gray-300">{artifact.filename}</span>
                            <span className="text-gray-600 font-display text-[10px] ml-2">
                              ({def?.name || artifact.agent})
                            </span>
                          </div>
                          <button
                            onClick={() => openPreview(session.sessionId, artifact.filename)}
                            className="px-2.5 py-1 text-[10px] font-display rounded-lg glass text-gray-400 hover:text-white transition-all"
                          >
                            Preview
                          </button>
                          {isHtml && (
                            <a
                              href={`${API}/api/artifacts/${session.sessionId}/landing-page`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 text-[10px] font-display rounded-lg glass text-gray-400 hover:text-cyan-400 transition-all"
                            >
                              Abrir ↗
                            </a>
                          )}
                        </div>
                      );
                    })}

                    <div className="pt-2 flex gap-2">
                      <a
                        href={`${API}/api/artifacts/${session.sessionId}/download`}
                        className="px-3 py-1.5 text-xs font-display rounded-xl glass text-gray-400 hover:text-white transition-all"
                      >
                        ⬇ Download ZIP
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Preview Modal */}
      {previewContent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
          onClick={() => setPreviewContent(null)}
        >
          <div
            className="w-[800px] max-h-[80vh] glass rounded-2xl overflow-hidden flex flex-col shadow-glass"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
              <span className="font-display text-sm text-green-400">{previewContent.filename}</span>
              <button
                onClick={() => setPreviewContent(null)}
                className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {previewContent.isHtml ? (
                <iframe
                  srcDoc={previewContent.content}
                  className="w-full h-[60vh] bg-white rounded-xl"
                  sandbox="allow-same-origin"
                  title="Preview"
                />
              ) : (
                <pre className="font-mono text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {previewContent.content}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
