import { Router } from 'express';
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
