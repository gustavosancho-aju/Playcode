#!/usr/bin/env npx ts-node
/**
 * Landing Page Server — Servidor dedicado que sempre serve a última landing page gerada.
 * Roda em localhost:4000 (configurável via env LANDING_PORT)
 */
import { createServer } from 'http';
import { readdir, stat, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const PORT = parseInt(process.env.LANDING_PORT || '4000', 10);
const ARTIFACTS_DIR = join(__dirname, 'docs', 'artifacts');

async function getLatestSession(): Promise<string | null> {
  if (!existsSync(ARTIFACTS_DIR)) return null;

  const entries = await readdir(ARTIFACTS_DIR);
  let latest: { name: string; mtime: number } | null = null;

  for (const entry of entries) {
    const dir = join(ARTIFACTS_DIR, entry);
    const s = await stat(dir);
    if (s.isDirectory() && (!latest || s.mtimeMs > latest.mtime)) {
      latest = { name: entry, mtime: s.mtimeMs };
    }
  }

  return latest?.name ?? null;
}

async function getLandingHtml(sessionId: string): Promise<string | null> {
  const dir = join(ARTIFACTS_DIR, sessionId);

  // Try index.html first, then 07-landing-page.html
  for (const filename of ['index.html', '07-landing-page.html']) {
    const filePath = join(dir, filename);
    if (existsSync(filePath)) {
      let content = await readFile(filePath, 'utf-8');
      // Strip YAML frontmatter
      if (content.startsWith('---')) {
        const endIdx = content.indexOf('---', 3);
        if (endIdx > 0) content = content.slice(endIdx + 3).trim();
      }
      return content;
    }
  }
  return null;
}

const WRAPPER = (body: string, sessionId: string) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Landing Page — ${sessionId}</title>
  <style>
    .lp-toolbar {
      position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
      background: #111; color: #aaa; font: 12px/1 monospace;
      padding: 6px 16px; display: flex; justify-content: space-between; align-items: center;
    }
    .lp-toolbar a { color: #4ade80; text-decoration: none; margin-left: 12px; }
    .lp-toolbar .dot { width: 8px; height: 8px; border-radius: 50%; background: #4ade80; display: inline-block; margin-right: 8px; }
    body { padding-top: 32px; }
  </style>
  <script>
    // Auto-refresh: polls every 3s, reloads on change
    let lastHash = '';
    setInterval(async () => {
      try {
        const r = await fetch('/_meta');
        const data = await r.json();
        if (lastHash && data.hash !== lastHash) location.reload();
        lastHash = data.hash;
      } catch {}
    }, 3000);
  </script>
</head>
<body>
  <div class="lp-toolbar">
    <span><span class="dot"></span>Session: ${sessionId}</span>
    <span>
      <a href="/_meta">meta</a>
      <a href="/" title="Reload">↻</a>
    </span>
  </div>
  ${body}
</body>
</html>`;

const NO_LANDING = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Aguardando...</title>
<style>body{display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0a0a0a;color:#aaa;font-family:monospace;}
.c{text-align:center;} h1{color:#4ade80;font-size:48px;} p{margin-top:16px;font-size:18px;}</style>
<script>setTimeout(()=>location.reload(),5000)</script>
</head><body><div class="c"><h1>⏳</h1><p>Nenhuma landing page gerada ainda.<br>Execute o pipeline e volte aqui.</p></div></body></html>`;

let cachedHash = '';
let cachedHtml = '';
let cachedSession = '';

async function refresh() {
  const session = await getLatestSession();
  if (!session) { cachedHash = ''; cachedHtml = ''; cachedSession = ''; return; }

  const html = await getLandingHtml(session);
  if (!html) { cachedHash = ''; cachedHtml = ''; cachedSession = ''; return; }

  // Simple hash: length + first/last chars
  const hash = `${session}-${html.length}-${html.charCodeAt(100) || 0}`;
  cachedHash = hash;
  cachedSession = session;
  cachedHtml = html;
}

const server = createServer(async (req, res) => {
  await refresh();

  if (req.url === '/_meta') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ session: cachedSession, hash: cachedHash }));
    return;
  }

  if (!cachedHtml) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(NO_LANDING);
    return;
  }

  // If the landing page is a full HTML doc, inject toolbar; otherwise wrap it
  let finalHtml: string;
  if (cachedHtml.includes('<html') || cachedHtml.includes('<!DOCTYPE')) {
    // Inject auto-refresh script before </head>
    const script = `<script>
      let lastHash='';
      setInterval(async()=>{try{const r=await fetch('/_meta');const d=await r.json();if(lastHash&&d.hash!==lastHash)location.reload();lastHash=d.hash;}catch{}},3000);
    </script>`;
    finalHtml = cachedHtml.replace('</head>', script + '</head>');
  } else {
    finalHtml = WRAPPER(cachedHtml, cachedSession);
  }

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(finalHtml);
});

server.listen(PORT, () => {
  console.log(`\n🌐 Landing Page Server rodando em http://localhost:${PORT}`);
  console.log(`   Artifacts dir: ${ARTIFACTS_DIR}`);
  console.log(`   Auto-refresh: a cada 3s\n`);
});
