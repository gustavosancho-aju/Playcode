import { useState, useEffect, useCallback, useRef } from 'react';
import { AGENT_DEFINITIONS } from 'shared/types';

interface MemoryDocument {
  filename: string;
  sessionId: string;
  agent: string;
  type: 'md' | 'html';
  createdAt: string;
  size: number;
  title: string;
}

interface SearchResult extends MemoryDocument {
  snippet: string;
  matchCount: number;
}

const AGENT_MAP = Object.fromEntries(
  AGENT_DEFINITIONS.map((a) => [a.id, { name: a.name, icon: a.icon, color: a.color }])
);

function getAgentInfo(agentId: string) {
  return AGENT_MAP[agentId] || { name: agentId, icon: '📄', color: '#6B7280' };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function highlightText(text: string, query: string): JSX.Element {
  if (!query) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-yellow-400/30 text-yellow-200 rounded px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

// Simple markdown to HTML for preview
function renderMarkdown(md: string): string {
  // Strip frontmatter
  let text = md;
  if (text.startsWith('---')) {
    const end = text.indexOf('---', 3);
    if (end > 0) text = text.slice(end + 3).trim();
  }

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^#### (.+)$/gm, '<h4 class="text-sm font-bold text-gray-200 mt-4 mb-1">$1</h4>')
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold text-gray-100 mt-5 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-green-400 mt-6 mb-2 border-b border-green-400/20 pb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-green-300 mt-6 mb-3">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-gray-100">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-gray-300">$1</em>')
    .replace(/^&gt; (.+)$/gm, '<blockquote class="border-l-2 border-green-500/50 pl-3 my-2 text-gray-400 italic">$1</blockquote>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 text-gray-300">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 text-gray-300">$2</li>')
    .replace(/`([^`]+)`/g, '<code class="bg-gray-800 px-1 rounded text-green-300 text-xs">$1</code>')
    .replace(/^---$/gm, '<hr class="border-gray-700 my-4">')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\|(.+)\|\n\|[-| ]+\|\n((?:\|.+\|\n?)+)/g, (_match, header, body) => {
      const ths = header.split('|').filter(Boolean).map((h: string) => `<th class="border border-gray-700 px-3 py-1 bg-gray-800/50 text-green-400 text-xs">${h.trim()}</th>`).join('');
      const rows = body.trim().split('\n').map((row: string) => {
        const tds = row.split('|').filter(Boolean).map((c: string) => `<td class="border border-gray-700 px-3 py-1 text-gray-300 text-xs">${c.trim()}</td>`).join('');
        return `<tr>${tds}</tr>`;
      }).join('');
      return `<table class="w-full border-collapse my-3"><thead><tr>${ths}</tr></thead><tbody>${rows}</tbody></table>`;
    });
}

export function MemoryScreen() {
  const [documents, setDocuments] = useState<MemoryDocument[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<{ sessionId: string; filename: string; type: string } | null>(null);
  const [docContent, setDocContent] = useState<string>('');
  const [filterAgent, setFilterAgent] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'md' | 'html'>('all');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Fetch all documents
  useEffect(() => {
    fetch('/api/memory/documents')
      .then((r) => r.json())
      .then((data) => {
        setDocuments(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Debounced search
  const doSearch = useCallback((q: string) => {
    if (!q.trim()) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    fetch(`/api/memory/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data) => {
        setSearchResults(data.results);
        setSearching(false);
      })
      .catch(() => setSearching(false));
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 300);
  };

  // Open document preview
  const openDocument = (sessionId: string, filename: string, type: string) => {
    setSelectedDoc({ sessionId, filename, type });
    fetch(`/api/memory/document/${sessionId}/${filename}`)
      .then((r) => r.json())
      .then((data) => setDocContent(data.content || ''))
      .catch(() => setDocContent('Erro ao carregar documento'));
  };

  // Filter documents
  const displayDocs = (searchResults || documents).filter((doc) => {
    if (filterAgent && doc.agent !== filterAgent) return false;
    if (filterType !== 'all' && doc.type !== filterType) return false;
    return true;
  });

  // Get unique agents from documents
  const uniqueAgents = [...new Set(documents.map((d) => d.agent))];

  return (
    <div className="h-full flex flex-col bg-black/40 overflow-hidden">
      {/* Header with search */}
      <div className="flex-none p-4 border-b border-gray-800 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-green-400 font-mono text-lg font-bold flex items-center gap-2">
            <span className="text-xl">🧠</span> Memoria
          </h2>
          <span className="text-gray-500 font-mono text-xs">
            {searchResults ? `${displayDocs.length} resultados` : `${displayDocs.length} documentos`}
          </span>
        </div>

        {/* Search bar */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar nos documentos..."
            className="w-full bg-gray-900/80 border border-gray-700 rounded-lg px-4 py-2 pl-10 text-gray-200 font-mono text-sm placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition-colors"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">
            {searching ? '...' : '🔍'}
          </span>
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setSearchResults(null); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Agent filter chips */}
          <button
            onClick={() => setFilterAgent(null)}
            className={`px-2.5 py-1 rounded-full text-xs font-mono transition-colors ${
              !filterAgent ? 'bg-green-500/20 text-green-400 border border-green-500/40' : 'bg-gray-800 text-gray-500 border border-gray-700 hover:text-gray-300'
            }`}
          >
            Todos
          </button>
          {uniqueAgents.map((agentId) => {
            const info = getAgentInfo(agentId);
            return (
              <button
                key={agentId}
                onClick={() => setFilterAgent(filterAgent === agentId ? null : agentId)}
                className={`px-2.5 py-1 rounded-full text-xs font-mono transition-colors flex items-center gap-1 ${
                  filterAgent === agentId
                    ? 'border text-white'
                    : 'bg-gray-800 text-gray-500 border border-gray-700 hover:text-gray-300'
                }`}
                style={filterAgent === agentId ? { borderColor: info.color, backgroundColor: `${info.color}20` } : undefined}
              >
                <span>{info.icon}</span>
                <span>{info.name}</span>
              </button>
            );
          })}

          <div className="w-px h-5 bg-gray-700 mx-1" />

          {/* Type filter */}
          {(['all', 'md', 'html'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-2.5 py-1 rounded-full text-xs font-mono transition-colors ${
                filterType === t ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' : 'bg-gray-800 text-gray-500 border border-gray-700 hover:text-gray-300'
              }`}
            >
              {t === 'all' ? 'Todos' : t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Document list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="text-center text-gray-500 font-mono text-sm py-20">Carregando documentos...</div>
        ) : displayDocs.length === 0 ? (
          <div className="text-center text-gray-600 font-mono text-sm py-20">
            {searchQuery ? 'Nenhum resultado encontrado' : 'Nenhum documento disponivel'}
          </div>
        ) : (
          displayDocs.map((doc) => {
            const info = getAgentInfo(doc.agent);
            const isSearchResult = 'snippet' in doc;
            return (
              <button
                key={`${doc.sessionId}-${doc.filename}`}
                onClick={() => openDocument(doc.sessionId, doc.filename, doc.type)}
                className="w-full text-left bg-gray-900/60 border border-gray-800 rounded-lg p-3 hover:border-green-500/30 hover:bg-gray-900/80 transition-all group"
              >
                <div className="flex items-start gap-3">
                  {/* Agent icon */}
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                    style={{ backgroundColor: `${info.color}20`, border: `1px solid ${info.color}40` }}
                  >
                    {info.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Title */}
                    <div className="flex items-center gap-2">
                      <span className="text-gray-200 font-mono text-sm font-medium truncate group-hover:text-green-400 transition-colors">
                        {doc.title}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase ${
                        doc.type === 'html' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {doc.type}
                      </span>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-3 mt-1 text-gray-600 font-mono text-[11px]">
                      <span style={{ color: info.color }}>{info.name}</span>
                      <span>{doc.sessionId}</span>
                      <span>{formatDate(doc.createdAt)}</span>
                      <span>{formatSize(doc.size)}</span>
                    </div>

                    {/* Search snippet */}
                    {isSearchResult && (
                      <div className="mt-2 text-gray-400 text-xs font-mono bg-gray-800/50 rounded px-2 py-1.5 leading-relaxed">
                        {highlightText((doc as SearchResult).snippet, searchQuery)}
                        <span className="text-yellow-500/60 ml-2">({(doc as SearchResult).matchCount} matches)</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Document Preview Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setSelectedDoc(null)}>
          <div
            className="bg-gray-900 border border-gray-700 rounded-xl w-[90vw] max-w-4xl h-[85vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                  style={{
                    backgroundColor: `${getAgentInfo(documents.find((d) => d.sessionId === selectedDoc.sessionId && d.filename === selectedDoc.filename)?.agent || '').color}20`,
                  }}
                >
                  {getAgentInfo(documents.find((d) => d.sessionId === selectedDoc.sessionId && d.filename === selectedDoc.filename)?.agent || '').icon}
                </div>
                <div>
                  <div className="text-gray-200 font-mono text-sm font-medium">{selectedDoc.filename}</div>
                  <div className="text-gray-500 font-mono text-[11px]">{selectedDoc.sessionId}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-gray-500 hover:text-gray-300 text-lg px-2"
              >
                ✕
              </button>
            </div>

            {/* Modal content */}
            <div className="flex-1 overflow-y-auto p-6">
              {selectedDoc.type === 'html' ? (
                <iframe
                  srcDoc={docContent}
                  className="w-full h-full border-0 rounded bg-white"
                  sandbox="allow-same-origin"
                  title="Document preview"
                />
              ) : (
                <div
                  className="prose prose-invert max-w-none font-mono text-sm text-gray-300 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(docContent) }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
