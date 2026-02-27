import { Router } from 'express';
import { Server } from 'socket.io';
import { logger } from '../utils/logger';

export function createMockRouter(io: Server): Router {
  const router = Router();

  router.post('/api/mock/agent-update', (req, res) => {
    const { agent, status, message } = req.body;

    if (!agent || !status) {
      res.status(400).json({ error: 'agent and status are required' });
      return;
    }

    const payload = { agent, status, message: message || null };
    logger.info(`Mock agent-update: ${agent} → ${status}`);
    io.emit('pipeline-update', payload);

    res.json({ broadcasted: true });
  });

  return router;
}
