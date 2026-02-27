import { Router } from 'express';
import { claudeRemote } from '../integration/claude-remote';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/claude-status
router.get('/api/claude-status', (_req, res) => {
  res.json(claudeRemote.getStatus());
});

// POST /api/test-agent — test a single agent call with streaming
router.post('/api/test-agent', async (req, res) => {
  const { agentId, prompt, systemPrompt } = req.body;

  if (!prompt) {
    res.status(400).json({ error: 'prompt is required' });
    return;
  }

  logger.info(`Test agent call: ${agentId || 'custom'}`);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  try {
    for await (const event of claudeRemote.sendCommand(
      prompt,
      systemPrompt || 'You are a helpful assistant.',
      { timeout: 120_000 }
    )) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);

      if (event.type === 'done' || event.type === 'error') {
        break;
      }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    res.write(`data: ${JSON.stringify({ type: 'error', content: msg })}\n\n`);
  }

  res.end();
});

export { router as claudeRouter };
