import { Router, Request, Response } from 'express';
import { readdir, readFile, stat } from 'fs/promises';
import { join, extname } from 'path';
import { existsSync } from 'fs';
import { artifactManager } from '../artifacts/artifact-manager';

const SESSION_ID_REGEX = /^[a-zA-Z0-9_-]+$/;
const ARTIFACTS_DIR = join(__dirname, '..', '..', '..', 'docs', 'artifacts');

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

function extractAgent(filename: string, content: string): string {
  // Try frontmatter first
  const match = content.match(/^agent:\s*(\w+)/m);
  if (match) return match[1];
  // Try filename prefix like "01-organizador-output.md"
  const fnMatch = filename.match(/^\d+-(\w+)/);
  if (fnMatch) return fnMatch[1];
  return 'unknown';
}

function filenameToTitle(filename: string): string {
  return filename
    .replace(/^\d+-/, '')
    .replace(/\.(md|html|css)$/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function extractSnippet(content: string, query: string, contextChars = 80): string {
  // Strip frontmatter
  let text = content;
  if (text.startsWith('---')) {
    const end = text.indexOf('---', 3);
    if (end > 0) text = text.slice(end + 3);
  }
  text = text.trim();

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const idx = lowerText.indexOf(lowerQuery);
  if (idx === -1) return text.slice(0, 150);

  const start = Math.max(0, idx - contextChars);
  const end = Math.min(text.length, idx + query.length + contextChars);
  let snippet = text.slice(start, end).replace(/\n/g, ' ');
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet += '...';
  return snippet;
}

async function getAllDocuments(): Promise<MemoryDocument[]> {
  const docs: MemoryDocument[] = [];

  if (!existsSync(ARTIFACTS_DIR)) return docs;

  const sessions = await readdir(ARTIFACTS_DIR);

  for (const sessionId of sessions) {
    if (!SESSION_ID_REGEX.test(sessionId)) continue;
    const sessionDir = join(ARTIFACTS_DIR, sessionId);

    const dirStat = await stat(sessionDir);
    if (!dirStat.isDirectory()) continue;

    const files = await readdir(sessionDir);

    for (const filename of files) {
      const ext = extname(filename).toLowerCase();
      if (ext !== '.md' && ext !== '.html') continue;
      if (filename === 'index.json' || filename === 'pipeline-state.json') continue;

      const filePath = join(sessionDir, filename);
      const fileStat = await stat(filePath);
      const content = await readFile(filePath, 'utf-8');
      const agent = extractAgent(filename, content);
      const type = ext === '.md' ? 'md' : 'html';

      docs.push({
        filename,
        sessionId,
        agent,
        type,
        createdAt: fileStat.mtime.toISOString(),
        size: fileStat.size,
        title: filenameToTitle(filename),
      });
    }
  }

  // Sort newest first
  docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return docs;
}

const router = Router();

// GET /api/memory/documents — list all artifacts across all sessions
router.get('/api/memory/documents', async (_req: Request, res: Response) => {
  try {
    const docs = await getAllDocuments();
    res.json(docs);
  } catch {
    res.status(500).json({ error: 'Erro ao listar documentos' });
  }
});

// GET /api/memory/search?q=texto — full-text search across all artifacts
router.get('/api/memory/search', async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string || '').trim();
    if (!query) {
      res.status(400).json({ error: 'Query parameter "q" is required' });
      return;
    }
    if (query.length > 200) {
      res.status(400).json({ error: 'Query too long' });
      return;
    }

    const results: SearchResult[] = [];
    if (!existsSync(ARTIFACTS_DIR)) {
      res.json({ results, total: 0 });
      return;
    }

    const sessions = await readdir(ARTIFACTS_DIR);
    const lowerQuery = query.toLowerCase();

    for (const sessionId of sessions) {
      if (!SESSION_ID_REGEX.test(sessionId)) continue;
      const sessionDir = join(ARTIFACTS_DIR, sessionId);

      const dirStat = await stat(sessionDir);
      if (!dirStat.isDirectory()) continue;

      const files = await readdir(sessionDir);

      for (const filename of files) {
        const ext = extname(filename).toLowerCase();
        if (ext !== '.md' && ext !== '.html') continue;
        if (filename === 'index.json' || filename === 'pipeline-state.json') continue;

        const filePath = join(sessionDir, filename);
        const content = await readFile(filePath, 'utf-8');
        const lowerContent = content.toLowerCase();

        if (!lowerContent.includes(lowerQuery)) continue;

        const fileStat = await stat(filePath);
        const agent = extractAgent(filename, content);
        const type = ext === '.md' ? 'md' : 'html';

        // Count occurrences
        let matchCount = 0;
        let searchIdx = 0;
        while ((searchIdx = lowerContent.indexOf(lowerQuery, searchIdx)) !== -1) {
          matchCount++;
          searchIdx += lowerQuery.length;
        }

        results.push({
          filename,
          sessionId,
          agent,
          type,
          createdAt: fileStat.mtime.toISOString(),
          size: fileStat.size,
          title: filenameToTitle(filename),
          snippet: extractSnippet(content, query),
          matchCount,
        });
      }
    }

    // Sort by match count descending
    results.sort((a, b) => b.matchCount - a.matchCount);

    res.json({ results, total: results.length });
  } catch {
    res.status(500).json({ error: 'Erro na busca' });
  }
});

// GET /api/memory/document/:sessionId/:filename — get full document content
router.get('/api/memory/document/:sessionId/:filename', async (req: Request, res: Response) => {
  const { sessionId, filename } = req.params;
  if (!SESSION_ID_REGEX.test(sessionId)) {
    res.status(400).json({ error: 'Invalid session ID' });
    return;
  }
  try {
    const content = await artifactManager.getArtifact(sessionId, filename);
    if (!content) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }
    res.json({ content, filename, sessionId });
  } catch {
    res.status(400).json({ error: 'Invalid request' });
  }
});

export { router as memoryRouter };
