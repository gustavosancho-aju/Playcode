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

export { router as artifactsRouter };
