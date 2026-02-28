import { Router } from 'express';
import { createReadStream, existsSync } from 'fs';
import { readdir, stat, readFile, mkdir } from 'fs/promises';
import { join, basename, extname } from 'path';
import archiver from 'archiver';
import multer from 'multer';
import { artifactManager } from '../artifacts/artifact-manager';

// Multer config for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

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

// IMPORTANT: Specific routes MUST come before the generic /:filename route

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

    const files = await readdir(sessionDir);
    const artifactFiles = files.filter((f) => f.endsWith('.md') || f.endsWith('.html') || f.endsWith('.css') || f.endsWith('.json'));

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="artifacts-${req.params.sessionId}.zip"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (err) => { throw err; });
    archive.pipe(res);

    for (const file of artifactFiles) {
      const filePath = join(sessionDir, file);
      archive.file(filePath, { name: file });
    }

    await archive.finalize();
  } catch {
    res.status(500).json({ error: 'Erro ao gerar download' });
  }
});

// GET /api/artifacts/:sessionId/pdf — consolidated printable document
router.get('/api/artifacts/:sessionId/pdf', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const artifacts = await artifactManager.listArtifacts(sessionId);

    if (!artifacts || artifacts.length === 0) {
      res.status(404).json({ error: 'Nenhum artefato encontrado' });
      return;
    }

    // Read all markdown artifacts in order
    const sections: { filename: string; content: string }[] = [];
    const mdArtifacts = artifacts
      .filter((a: { filename: string }) => a.filename.endsWith('.md') && !a.filename.includes('pipeline-state') && !a.filename.includes('index.json'))
      .sort((a: { filename: string }, b: { filename: string }) => a.filename.localeCompare(b.filename));

    for (const artifact of mdArtifacts) {
      const content = await artifactManager.getArtifact(sessionId, artifact.filename);
      if (content) {
        sections.push({ filename: artifact.filename, content });
      }
    }

    // Convert markdown to HTML (simple conversion)
    function mdToHtml(md: string): string {
      return md
        .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
        .replace(/^---$/gm, '<hr>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
        // Simple table conversion
        .replace(/\|(.+)\|\n\|[-| ]+\|\n((?:\|.+\|\n?)+)/g, (_match, header, body) => {
          const ths = header.split('|').filter(Boolean).map((h: string) => `<th>${h.trim()}</th>`).join('');
          const rows = body.trim().split('\n').map((row: string) => {
            const tds = row.split('|').filter(Boolean).map((c: string) => `<td>${c.trim()}</td>`).join('');
            return `<tr>${tds}</tr>`;
          }).join('');
          return `<table><thead><tr>${ths}</tr></thead><tbody>${rows}</tbody></table>`;
        });
    }

    const sectionsHtml = sections.map((s, i) => `
      <section class="artifact">
        <div class="artifact-header">${s.filename.replace(/^\d+-/, '').replace(/\.md$/, '').replace(/-/g, ' ').toUpperCase()}</div>
        <p>${mdToHtml(s.content)}</p>
      </section>
      ${i < sections.length - 1 ? '<div class="page-break"></div>' : ''}
    `).join('\n');

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório de Consultoria — ${sessionId}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      background: #fff;
      color: #1a1a1a;
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 60px;
      line-height: 1.8;
    }
    .cover {
      text-align: center;
      padding: 120px 0 80px;
      border-bottom: 3px solid #22c55e;
      margin-bottom: 40px;
    }
    .cover h1 {
      font-size: 36px;
      font-weight: 700;
      color: #111;
      margin-bottom: 12px;
    }
    .cover .subtitle {
      font-size: 18px;
      color: #666;
      font-weight: 300;
    }
    .cover .date {
      margin-top: 30px;
      font-size: 14px;
      color: #999;
    }
    .cover .badge {
      display: inline-block;
      margin-top: 20px;
      padding: 6px 20px;
      background: #f0fdf4;
      border: 1px solid #22c55e;
      border-radius: 20px;
      color: #166534;
      font-size: 12px;
      font-weight: 600;
    }
    .artifact { margin-bottom: 40px; }
    .artifact-header {
      font-size: 11px;
      letter-spacing: 2px;
      color: #22c55e;
      font-weight: 600;
      border-bottom: 1px solid #e5e5e5;
      padding-bottom: 8px;
      margin-bottom: 20px;
    }
    h1 { font-size: 26px; margin: 28px 0 14px; color: #111; }
    h2 { font-size: 21px; margin: 24px 0 12px; color: #222; border-bottom: 2px solid #22c55e; padding-bottom: 6px; }
    h3 { font-size: 17px; margin: 20px 0 10px; color: #333; }
    h4 { font-size: 15px; margin: 16px 0 8px; color: #444; }
    p { margin: 10px 0; }
    strong { color: #111; }
    em { color: #555; }
    code { background: #f4f4f5; padding: 2px 6px; border-radius: 3px; font-size: 13px; color: #d63384; }
    blockquote { border-left: 4px solid #22c55e; padding: 10px 20px; margin: 15px 0; background: #f8faf8; color: #444; font-style: italic; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px; }
    th, td { border: 1px solid #ddd; padding: 10px 14px; text-align: left; }
    th { background: #f0fdf4; font-weight: 600; color: #166534; }
    tr:nth-child(even) { background: #fafafa; }
    ul { margin: 10px 0 10px 30px; }
    li { margin: 4px 0; }
    hr { margin: 30px 0; border: none; border-top: 1px solid #e5e5e5; }
    .page-break { page-break-after: always; height: 1px; }
    .toolbar {
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      background: #111; color: #fff; padding: 12px 24px;
      display: flex; align-items: center; justify-content: space-between;
      font-family: 'Inter', sans-serif;
    }
    .toolbar button {
      background: #22c55e; color: #000; border: none; padding: 8px 20px;
      border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 14px;
    }
    .toolbar button:hover { background: #16a34a; }
    .toolbar .info { font-size: 13px; color: #999; }
    @media print {
      .toolbar { display: none !important; }
      body { padding: 20px; max-width: 100%; }
      .cover { padding: 60px 0 40px; }
      h2 { break-after: avoid; }
      table { break-inside: avoid; }
      .artifact { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <div>
      <strong>📄 Relatório de Consultoria</strong>
      <span class="info" style="margin-left: 16px">${sections.length} documentos</span>
    </div>
    <div style="display:flex;gap:8px">
      <button onclick="window.print()">🖨️ Salvar como PDF</button>
      <button onclick="window.close()" style="background:#333;color:#fff">✕ Fechar</button>
    </div>
  </div>

  <div style="margin-top: 60px">
    <div class="cover">
      <h1>Relatório de Consultoria</h1>
      <div class="subtitle">Documento consolidado gerado automaticamente</div>
      <div class="date">${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
      <div class="badge">SQUAD PLAYGROUND · PIPELINE COMPLETO</div>
    </div>

    ${sectionsHtml}
  </div>
</body>
</html>`;

    res.type('text/html').send(html);
  } catch {
    res.status(500).json({ error: 'Erro ao gerar documento' });
  }
});

// POST /api/artifacts/:sessionId/images — upload image
router.post('/api/artifacts/:sessionId/images', upload.single('image'), async (req, res) => {
  try {
    const { sessionId } = req.params;
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'No image file provided' });
      return;
    }

    const sessionDir = artifactManager.getSessionDir(sessionId);
    const imagesDir = join(sessionDir, 'images');
    await mkdir(imagesDir, { recursive: true });

    // Generate unique filename
    const ext = extname(file.originalname) || '.png';
    const filename = `${Date.now()}${ext}`;
    const filePath = join(imagesDir, filename);

    const { writeFile } = await import('fs/promises');
    await writeFile(filePath, file.buffer);

    const url = `http://localhost:3001/api/artifacts/${sessionId}/images/${filename}`;
    res.json({ ok: true, url, filename });
  } catch {
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// GET /api/artifacts/:sessionId/images/:filename — serve uploaded image
router.get('/api/artifacts/:sessionId/images/:filename', async (req, res) => {
  try {
    const sessionDir = artifactManager.getSessionDir(req.params.sessionId);
    const filePath = join(sessionDir, 'images', basename(req.params.filename));
    if (!existsSync(filePath)) {
      res.status(404).json({ error: 'Image not found' });
      return;
    }
    res.sendFile(filePath);
  } catch {
    res.status(400).json({ error: 'Invalid request' });
  }
});

// GET /api/artifacts/:sessionId/:filename — get raw artifact (MUST be last — catches all)
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
