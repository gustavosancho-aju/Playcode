import { Router } from 'express';
import { Server } from 'socket.io';
import { PipelineOrchestrator } from '../pipeline/orchestrator';
import { logger } from '../utils/logger';
let orchestrator: PipelineOrchestrator | null = null;

export function createPipelineRouter(io: Server): Router {
  const router = Router();
  orchestrator = new PipelineOrchestrator(io);

  // POST /api/pipeline/start — start pipeline
  router.post('/api/pipeline/start', async (req, res) => {
    const { prompt, document, sessionId, pipelineType } = req.body;

    const input = prompt || document;
    if (!input) {
      res.status(400).json({ error: 'prompt or document is required' });
      return;
    }

    if (orchestrator!.isRunning()) {
      res.status(409).json({ error: 'Pipeline already running' });
      return;
    }

    const sid = sessionId || generateSessionId();
    const type = pipelineType || (document ? 'consultoria' : 'briefing');
    logger.info(`Starting pipeline: session=${sid}, type=${type}`);

    // Start pipeline asynchronously
    orchestrator!.startPipeline(sid, input, type).catch((err) => {
      logger.error(`Pipeline crashed: ${err.message}`);
    });

    res.json({ sessionId: sid, status: 'started', pipelineType: type });
  });

  // GET /api/pipeline/state — get current state
  router.get('/api/pipeline/state', (_req, res) => {
    const state = orchestrator!.getState();
    if (!state) {
      res.json({ status: 'idle' });
      return;
    }
    res.json(state);
  });

  // POST /api/pipeline/approve — approve current step
  router.post('/api/pipeline/approve', (req, res) => {
    const { approved, feedback } = req.body;
    orchestrator!.handleApproval(approved !== false, feedback);
    res.json({ ok: true });
  });

  // Register socket events for approval
  io.on('connection', (socket) => {
    socket.on('heartbeat', () => {
      socket.emit('heartbeat-ack');
    });

    socket.on('pipeline-approve', (data: { approved: boolean; feedback?: string }) => {
      orchestrator!.handleApproval(data.approved, data.feedback);
    });

    socket.on('pipeline-rollback', (data?: { targetStep?: number }) => {
      orchestrator!.rollbackPipeline(data?.targetStep).catch((err) => {
        logger.error(`Rollback failed: ${err.message}`);
      });
    });

    socket.on('layout-selected', (data: { themeId: string }) => {
      orchestrator!.handleThemeSelection(data.themeId);
      logger.info(`Layout theme selected: ${data.themeId}`);
    });

    socket.on('update-pipeline-config', (data: { approvalRequired?: Record<string, boolean> }) => {
      if (data.approvalRequired) {
        orchestrator!.updateApprovalConfig(data.approvalRequired);
        logger.info(`Pipeline approval config updated: ${JSON.stringify(data.approvalRequired)}`);
      }
    });
  });

  return router;
}

function generateSessionId(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 8);
  return `${date}-${rand}`;
}
