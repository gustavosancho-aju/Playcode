import { Router } from 'express';
import { readdir, stat, readFile, rm } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { artifactManager } from '../artifacts/artifact-manager';

const router = Router();
const ARTIFACTS_DIR = join(__dirname, '..', '..', '..', 'docs', 'artifacts');

interface SessionSummary {
  sessionId: string;
  createdAt: string;
  pipelineType: string;
  status: string;
  artifactCount: number;
  artifacts: { filename: string; agent: string }[];
}

// GET /api/sessions — list all past sessions
router.get('/api/sessions', async (_req, res) => {
  try {
    if (!existsSync(ARTIFACTS_DIR)) {
      res.json([]);
      return;
    }

    const dirs = await readdir(ARTIFACTS_DIR);
    const sessions: SessionSummary[] = [];

    for (const dir of dirs) {
      const dirPath = join(ARTIFACTS_DIR, dir);
      const dirStat = await stat(dirPath);
      if (!dirStat.isDirectory()) continue;

      // Read pipeline state if exists
      let pipelineType = 'unknown';
      let pipelineStatus = 'unknown';
      const statePath = join(dirPath, 'pipeline-state.json');
      if (existsSync(statePath)) {
        try {
          const stateRaw = await readFile(statePath, 'utf-8');
          const state = JSON.parse(stateRaw);
          pipelineStatus = state.status || 'unknown';
          // Infer type from step count
          if (state.steps?.length === 1) pipelineType = 'briefing';
          else if (state.steps?.length >= 6) pipelineType = 'consultoria';
        } catch { /* ignore parse errors */ }
      }

      // List artifacts (md + html, skip state/index files)
      const files = await readdir(dirPath);
      const artifactFiles = files.filter(
        (f) => (f.endsWith('.md') || f.endsWith('.html')) && f !== 'index.json' && f !== 'pipeline-state.json'
      );

      const artifacts = artifactFiles.map((f) => {
        const agentMatch = f.match(/^\d+-(\w+)/);
        return { filename: f, agent: agentMatch?.[1] || 'unknown' };
      });

      sessions.push({
        sessionId: dir,
        createdAt: dirStat.mtime.toISOString(),
        pipelineType,
        status: pipelineStatus,
        artifactCount: artifactFiles.length,
        artifacts,
      });
    }

    // Sort by date descending
    sessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list sessions' });
  }
});

// GET /api/sessions/:sessionId — get session details with artifact contents
router.get('/api/sessions/:sessionId', async (req, res) => {
  try {
    const state = await artifactManager.getState(req.params.sessionId);
    const artifacts = await artifactManager.listArtifacts(req.params.sessionId);
    res.json({ state, artifacts });
  } catch {
    res.status(404).json({ error: 'Session not found' });
  }
});

// DELETE /api/sessions/:sessionId — delete a session and all its artifacts
router.delete('/api/sessions/:sessionId', async (req, res) => {
  const { sessionId } = req.params;

  // Validate sessionId to prevent path traversal
  if (!sessionId || /[\/\\]/.test(sessionId)) {
    res.status(400).json({ error: 'Invalid session ID' });
    return;
  }

  const dirPath = join(ARTIFACTS_DIR, sessionId);
  if (!existsSync(dirPath)) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  try {
    await rm(dirPath, { recursive: true, force: true });
    res.json({ ok: true, sessionId });
  } catch {
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

export { router as sessionsRouter };
