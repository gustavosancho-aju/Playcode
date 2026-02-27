import { Server } from 'socket.io';
import { readFileSync } from 'fs';
import { join } from 'path';
import { claudeRemote } from '../integration/claude-remote';
import { artifactManager } from '../artifacts/artifact-manager';
import { parseAgentOutput } from '../parser/agent-parser';
import { logger } from '../utils/logger';
import type {
  AgentId,
  PipelineState,
  PipelineStep,
  PipelineConfig,
  DEFAULT_PIPELINE_CONFIG,
  PIPELINE_ORDER,
} from 'shared/types';

// Re-import constants (shared/types exports them as values)
const PIPELINE_ORDER_VAL: AgentId[] = [
  'pesquisa', 'organizador', 'solucoes', 'estruturas', 'financeiro', 'closer', 'apresentacao',
];

export class PipelineOrchestrator {
  private state: PipelineState | null = null;
  private io: Server;
  private config: PipelineConfig;
  private agentPromptsDir: string;
  private pendingApproval: ((approved: boolean, feedback?: string) => void) | null = null;

  constructor(io: Server, config?: Partial<PipelineConfig>) {
    this.io = io;
    this.config = {
      approvalRequired: config?.approvalRequired ?? { organizador: true, closer: true },
      agentTimeout: config?.agentTimeout ?? 120_000,
      maxRetries: config?.maxRetries ?? 1,
    };
    this.agentPromptsDir = join(__dirname, '..', '..', '..', 'agents');
  }

  getState(): PipelineState | null {
    return this.state;
  }

  isRunning(): boolean {
    return this.state?.status === 'executing' || this.state?.status === 'approval_required';
  }

  async startPipeline(sessionId: string, initialPrompt: string): Promise<void> {
    if (this.isRunning()) {
      throw new Error('Pipeline already running');
    }

    const steps: PipelineStep[] = PIPELINE_ORDER_VAL.map((agentId) => ({
      agentId,
      status: 'pending',
      artifactPath: null,
      startedAt: null,
      completedAt: null,
    }));

    this.state = {
      sessionId,
      status: 'executing',
      currentStepIndex: 0,
      steps,
      startedAt: new Date().toISOString(),
      completedAt: null,
      error: null,
    };

    // Create session directory
    await artifactManager.ensureSessionDir(sessionId);
    await this.saveState();

    logger.info(`Pipeline started: session=${sessionId}`);
    this.broadcast('pipeline-started', { sessionId });

    try {
      let previousOutput = initialPrompt;

      for (let i = 0; i < steps.length; i++) {
        this.state.currentStepIndex = i;
        const step = steps[i];
        const agentId = step.agentId;

        // Check approval required
        if (this.config.approvalRequired[agentId]) {
          this.state.status = 'approval_required';
          await this.saveState();

          this.broadcast('approval-required', {
            agent: agentId,
            sessionId,
            step: i + 1,
            totalSteps: steps.length,
          });

          logger.info(`Approval required for ${agentId}, pausing pipeline`);

          const approved = await this.waitForApproval();
          if (!approved) {
            // User rejected, re-run previous step with feedback
            logger.info(`Agent ${agentId} rejected, pipeline paused`);
            continue;
          }

          this.state.status = 'executing';
        }

        // Execute agent
        step.status = 'executing';
        step.startedAt = new Date().toISOString();
        await this.saveState();

        this.broadcast('pipeline-update', {
          agent: agentId,
          status: 'processing',
          step: i + 1,
          totalSteps: steps.length,
          message: `${agentId} processando...`,
        });

        try {
          const systemPrompt = this.loadAgentPrompt(agentId);
          const result = await this.executeAgent(agentId, previousOutput, systemPrompt);

          // Parse and save artifact
          const parsed = parseAgentOutput(result);
          if (parsed.output) {
            const artifactPath = await artifactManager.saveArtifact(
              sessionId,
              agentId,
              parsed.output.filename,
              parsed.output.content
            );
            step.artifactPath = artifactPath;
          } else {
            // Fallback: save entire response
            const fallbackFilename = this.getFallbackFilename(agentId, i);
            const artifactPath = await artifactManager.saveArtifact(
              sessionId,
              agentId,
              fallbackFilename,
              result
            );
            step.artifactPath = artifactPath;
          }

          step.status = 'completed';
          step.completedAt = new Date().toISOString();
          previousOutput = result;

          this.broadcast('pipeline-update', {
            agent: agentId,
            status: 'done',
            step: i + 1,
            totalSteps: steps.length,
            message: `${agentId} concluído`,
            artifactPath: step.artifactPath,
          });
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          step.status = 'error';
          this.state.status = 'error';
          this.state.error = `Agent ${agentId} failed: ${msg}`;
          await this.saveState();

          this.broadcast('pipeline-error', {
            agent: agentId,
            error: msg,
            step: i + 1,
            totalSteps: steps.length,
          });

          logger.error(`Pipeline error at ${agentId}: ${msg}`);
          return;
        }

        await this.saveState();
      }

      // Pipeline complete
      this.state.status = 'completed';
      this.state.completedAt = new Date().toISOString();
      await this.saveState();

      const duration = Date.now() - new Date(this.state.startedAt).getTime();
      const artifacts = steps
        .filter((s) => s.artifactPath)
        .map((s) => s.artifactPath as string);

      this.broadcast('pipeline-complete', {
        sessionId,
        duration,
        artifacts,
      });

      logger.info(`Pipeline completed: session=${sessionId}, duration=${duration}ms, artifacts=${artifacts.length}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (this.state) {
        this.state.status = 'error';
        this.state.error = msg;
        await this.saveState();
      }
      logger.error(`Pipeline fatal error: ${msg}`);
    }
  }

  handleApproval(approved: boolean, feedback?: string): void {
    if (this.pendingApproval) {
      this.pendingApproval(approved, feedback);
      this.pendingApproval = null;
    }
  }

  private waitForApproval(): Promise<boolean> {
    return new Promise((resolve) => {
      this.pendingApproval = (approved: boolean) => resolve(approved);
    });
  }

  private async executeAgent(agentId: AgentId, input: string, systemPrompt: string): Promise<string> {
    let fullResponse = '';

    for await (const event of claudeRemote.sendCommand(input, systemPrompt, {
      timeout: this.config.agentTimeout,
      retries: this.config.maxRetries,
    })) {
      if (event.type === 'chunk') {
        fullResponse += event.content;
        // Emit streaming chunks for live UI
        this.broadcast('agent-stream', {
          agent: agentId,
          chunk: event.content,
        });
      } else if (event.type === 'error') {
        throw new Error(event.content);
      }
    }

    return fullResponse;
  }

  private loadAgentPrompt(agentId: AgentId): string {
    try {
      const filePath = join(this.agentPromptsDir, `${agentId}.md`);
      return readFileSync(filePath, 'utf-8');
    } catch {
      logger.warn(`No prompt file for ${agentId}, using default`);
      return `You are the ${agentId} agent. Follow the pipeline protocol.`;
    }
  }

  private getFallbackFilename(agentId: AgentId, stepIndex: number): string {
    const num = String(stepIndex + 1).padStart(2, '0');
    return `${num}-${agentId}-output.md`;
  }

  private broadcast(event: string, data: unknown): void {
    this.io.emit(event, data);
  }

  private async saveState(): Promise<void> {
    if (this.state) {
      await artifactManager.saveState(this.state.sessionId, this.state);
    }
  }
}
