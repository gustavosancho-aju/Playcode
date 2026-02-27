import { Router } from 'express';
import { createReadStream, existsSync } from 'fs';
import { readdir, stat, readFile } from 'fs/promises';
import { join, basename } from 'path';
import { artifactManager } from '../artifacts/artifact-manager';

const router = Router();

// GET /api/artifacts/:sessionId — list all artifacts
router.get('/api/artifacts/:sessionId', async (req, res) => {
  try {
    const artifacts = await artifactManager.listArtifacts(req.params.sessionId);
    res.json(artifacts);
  } catch {
    res.status(404).json({ error: 'Session not found' });
  }
});

// GET /api/artifacts/:sessionId/:filename — get raw artifact
router.get('/api/artifacts/:sessionId/:filename', async (req, res) => {
  try {
    const content = await artifactManager.getArtifact(
      req.params.sessionId,
      req.params.filename
    );

    if (!content) {
      res.status(404).json({ error: 'Artifact not found' });
      return;
    }

    res.type('text/markdown').send(content);
  } catch {
    res.status(400).json({ error: 'Invalid filename' });
  }
});

// GET /api/artifacts/:sessionId/proposta/preview — HTML preview of proposal
router.get('/api/artifacts/:sessionId/proposta/preview', async (req, res) => {
  try {
    const content = await artifactManager.getArtifact(
      req.params.sessionId,
      '06-proposta-comercial.md'
    );

    if (!content) {
      res.status(404).json({ error: 'Proposta não encontrada' });
      return;
    }

    // Simple Markdown to HTML conversion (headers, tables, bold, italic, lists, blockquotes, hr)
    let html = content
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/^---$/gm, '<hr>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\{\{client_logo\}\}/g, '<div style="text-align:center;color:#888;padding:20px;border:1px dashed #444">[Logo do Cliente]</div>')
      .replace(/\{\{consultant_signature\}\}/g, '<div style="text-align:center;color:#888;padding:20px;border:1px dashed #444">[Assinatura do Consultor]</div>');

    // Wrap consecutive <li> in <ul>
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

    // Simple table conversion
    html = html.replace(/\|(.+)\|\n\|[-| ]+\|\n((?:\|.+\|\n?)+)/g, (_match, header, body) => {
      const ths = header.split('|').filter(Boolean).map((h: string) => `<th>${h.trim()}</th>`).join('');
      const rows = body.trim().split('\n').map((row: string) => {
        const tds = row.split('|').filter(Boolean).map((c: string) => `<td>${c.trim()}</td>`).join('');
        return `<tr>${tds}</tr>`;
      }).join('');
      return `<table><thead><tr>${ths}</tr></thead><tbody>${rows}</tbody></table>`;
    });

    const page = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Proposta Comercial — Preview</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: #fff; color: #1a1a1a; max-width: 800px; margin: 0 auto; padding: 40px 60px; line-height: 1.7; }
    h1 { font-size: 28px; margin: 30px 0 15px; color: #111; }
    h2 { font-size: 22px; margin: 25px 0 12px; color: #222; border-bottom: 2px solid #22c55e; padding-bottom: 6px; }
    h3 { font-size: 18px; margin: 20px 0 10px; color: #333; }
    p { margin: 10px 0; }
    strong { color: #111; }
    blockquote { border-left: 4px solid #22c55e; padding: 10px 20px; margin: 15px 0; background: #f8faf8; color: #444; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { border: 1px solid #ddd; padding: 10px 14px; text-align: left; }
    th { background: #f0fdf4; font-weight: 600; }
    tr:nth-child(even) { background: #fafafa; }
    ul { margin: 10px 0 10px 30px; }
    li { margin: 4px 0; }
    hr { margin: 30px 0; border: none; border-top: 1px solid #e5e5e5; }
    @media print {
      body { padding: 20px; max-width: 100%; }
      h2 { break-after: avoid; }
      table { break-inside: avoid; }
    }
  </style>
</head>
<body>
<p>${html}</p>
</body>
</html>`;

    res.type('text/html').send(page);
  } catch {
    res.status(500).json({ error: 'Erro ao gerar preview' });
  }
});

// GET /api/artifacts/:sessionId/landing-page — serve landing page HTML
router.get('/api/artifacts/:sessionId/landing-page', async (req, res) => {
  try {
    // Try landing-page/index.html first, then 07-landing-page.html
    let content = await artifactManager.getArtifact(req.params.sessionId, 'index.html');
    if (!content) {
      content = await artifactManager.getArtifact(req.params.sessionId, '07-landing-page.html');
    }
    if (!content) {
      res.status(404).json({ error: 'Landing page não encontrada' });
      return;
    }
    // Strip YAML frontmatter if present
    if (content.startsWith('---')) {
      const endIdx = content.indexOf('---', 3);
      if (endIdx > 0) {
        content = content.slice(endIdx + 3).trim();
      }
    }
    res.type('text/html').send(content);
  } catch {
    res.status(500).json({ error: 'Erro ao servir landing page' });
  }
});

// GET /api/artifacts/:sessionId/download — download all artifacts as ZIP
router.get('/api/artifacts/:sessionId/download', async (req, res) => {
  try {
    const sessionDir = artifactManager.getSessionDir(req.params.sessionId);
    if (!existsSync(sessionDir)) {
      res.status(404).json({ error: 'Session não encontrada' });
      return;
    }

    // Build a simple ZIP using raw concatenation (no external dep)
    // Use tar-like approach: set headers and pipe files
    const files = await readdir(sessionDir);
    const artifactFiles = files.filter((f) => f.endsWith('.md') || f.endsWith('.html') || f.endsWith('.css') || f.endsWith('.json'));

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="artifacts-${req.params.sessionId}.tar"`);

    // Simple concatenation with file boundaries (not a real ZIP, but functional)
    for (const file of artifactFiles) {
      const filePath = join(sessionDir, file);
      const stats = await stat(filePath);
      const content = await readFile(filePath, 'utf-8');
      // Write file header
      res.write(`\n=== FILE: ${file} (${stats.size} bytes) ===\n`);
      res.write(content);
      res.write('\n');
    }

    res.end();
  } catch {
    res.status(500).json({ error: 'Erro ao gerar download' });
  }
});

// PUT /api/artifacts/:sessionId/:filename — update artifact content
router.put('/api/artifacts/:sessionId/:filename', async (req, res) => {
  try {
    const { content } = req.body;
    if (typeof content !== 'string') {
      res.status(400).json({ error: 'Content must be a string' });
      return;
    }

    // Validate UTF-8 by checking for replacement characters
    if (content.includes('\uFFFD')) {
      res.status(400).json({ error: 'Invalid UTF-8 content' });
      return;
    }

    const safeSession = req.params.sessionId;
    const safeFilename = req.params.filename;

    // Check artifact exists
    const existing = await artifactManager.getArtifact(safeSession, safeFilename);
    if (existing === null) {
      res.status(404).json({ error: 'Artifact not found' });
      return;
    }

    await artifactManager.updateArtifact(safeSession, safeFilename, content);
    res.json({ ok: true, savedAt: new Date().toISOString() });
  } catch {
    res.status(400).json({ error: 'Failed to save artifact' });
  }
});

export { router as artifactsRouter };
