import { Server } from 'socket.io';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { claudeRemote } from '../integration/claude-remote';
import { artifactManager } from '../artifacts/artifact-manager';
import { parseAgentOutput, parseTasks } from '../parser/agent-parser';
import { logger } from '../utils/logger';
import type {
  AgentId,
  PipelineState,
  PipelineStep,
  PipelineConfig,
  PipelineType,
  DEFAULT_PIPELINE_CONFIG,
  PIPELINE_ORDER,
} from 'shared/types';
import { LANDING_THEMES } from 'shared/types';

// Pipeline presets
const PIPELINE_PRESETS: Record<string, { steps: AgentId[]; approvalRequired: Partial<Record<AgentId, boolean>> }> = {
  briefing: {
    steps: ['pesquisa'],
    approvalRequired: {},
  },
  consultoria: {
    steps: ['organizador', 'solucoes', 'estruturas', 'financeiro', 'closer', 'apresentacao'],
    approvalRequired: {
      organizador: true,
      solucoes: true,
      estruturas: true,
      financeiro: true,
      closer: true,
      apresentacao: true,
    },
  },
};

// Default pipeline order (legacy)
const PIPELINE_ORDER_VAL: AgentId[] = [
  'pesquisa', 'organizador', 'solucoes', 'estruturas', 'financeiro', 'closer', 'apresentacao',
];

export class PipelineOrchestrator {
  private state: PipelineState | null = null;
  private io: Server;
  private config: PipelineConfig;
  private agentPromptsDir: string;
  private pendingApproval: ((approved: boolean, feedback?: string) => void) | null = null;
  private pendingThemeSelection: ((themeId: string) => void) | null = null;
  private selectedThemeId: string | null = null;

  constructor(io: Server, config?: Partial<PipelineConfig>) {
    this.io = io;
    this.config = {
      approvalRequired: config?.approvalRequired ?? { organizador: true, closer: true },
      agentTimeout: config?.agentTimeout ?? parseInt(process.env.AGENT_TIMEOUT || '600000', 10),
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

  updateApprovalConfig(approvalRequired: Partial<Record<string, boolean>>): void {
    this.config.approvalRequired = approvalRequired as Partial<Record<AgentId, boolean>>;
  }

  async startPipeline(sessionId: string, initialPrompt: string, pipelineType?: PipelineType): Promise<void> {
    if (this.isRunning()) {
      throw new Error('Pipeline already running');
    }

    // Apply preset if pipelineType specified
    const preset = pipelineType ? PIPELINE_PRESETS[pipelineType] : null;
    const agentOrder = preset?.steps ?? PIPELINE_ORDER_VAL;
    if (preset) {
      this.config.approvalRequired = preset.approvalRequired;
    }

    const steps: PipelineStep[] = agentOrder.map((agentId) => ({
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

      const rejectionCounts: Record<number, number> = {};
      const MAX_REJECTIONS = 3;

      for (let i = 0; i < steps.length; i++) {
        this.state.currentStepIndex = i;
        const step = steps[i];
        const agentId = step.agentId;

        // Theme selection before apresentacao
        if (agentId === 'apresentacao' && !this.selectedThemeId) {
          this.broadcast('layout-selection-required', { sessionId });
          logger.info('Waiting for theme selection before apresentacao');
          this.selectedThemeId = await this.waitForThemeSelection();
          logger.info(`Theme selected: ${this.selectedThemeId}`);
        }

        // Execute agent first
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

          // Mark as awaiting_approval (not completed yet) if approval is needed
          step.status = this.config.approvalRequired[agentId] ? 'awaiting_approval' : 'completed';
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

        // Check approval AFTER execution — show THIS agent's output
        if (this.config.approvalRequired[agentId]) {
          this.state.status = 'approval_required';
          await this.saveState();

          // Load THIS agent's artifact for preview
          let artifactContent = '';
          let artifactName = '';
          if (step.artifactPath) {
            artifactName = step.artifactPath.split('/').pop() || '';
            artifactContent = await artifactManager.getArtifact(sessionId, artifactName) || '';
          }

          this.broadcast('approval-required', {
            agent: agentId,
            sessionId,
            step: i + 1,
            totalSteps: steps.length,
            artifactName,
            artifactContent,
          });

          logger.info(`Approval required for ${agentId} output, pausing pipeline`);

          const approved = await this.waitForApproval();
          if (!approved) {
            // Track rejections per step to avoid infinite loop
            rejectionCounts[i] = (rejectionCounts[i] || 0) + 1;

            if (rejectionCounts[i] >= MAX_REJECTIONS) {
              logger.error(`Agent ${agentId} rejected ${MAX_REJECTIONS} times, aborting pipeline`);
              step.status = 'error';
              this.state.status = 'error';
              this.state.error = `Agent ${agentId} rejeitado ${MAX_REJECTIONS} vezes. Pipeline abortado.`;
              await this.saveState();
              this.broadcast('pipeline-error', {
                agent: agentId,
                error: this.state.error,
                step: i + 1,
                totalSteps: steps.length,
              });
              return;
            }

            // User rejected — rollback this step to re-run
            logger.info(`Agent ${agentId} output rejected (${rejectionCounts[i]}/${MAX_REJECTIONS}), will re-run`);
            step.status = 'pending';
            step.artifactPath = null;
            step.startedAt = null;
            step.completedAt = null;
            previousOutput = i > 0 ? await this.getPreviousOutput(i) : initialPrompt;
            i--; // Re-run this same step
            this.state.status = 'executing';
            continue;
          }

          // Approved — mark as completed
          step.status = 'completed';
          await this.saveState();
          this.state.status = 'executing';
        }
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

  handleThemeSelection(themeId: string): void {
    if (this.pendingThemeSelection) {
      this.pendingThemeSelection(themeId);
      this.pendingThemeSelection = null;
    }
  }

  private waitForThemeSelection(): Promise<string> {
    return new Promise((resolve) => {
      this.pendingThemeSelection = (themeId: string) => resolve(themeId);
    });
  }

  async rollbackPipeline(targetStep?: number): Promise<void> {
    if (!this.state) return;

    // Default: rollback to previous step
    const target = targetStep ?? Math.max(0, this.state.currentStepIndex - 1);

    if (target < 0 || target >= this.state.steps.length) return;

    logger.info(`Pipeline rollback: step ${this.state.currentStepIndex} → ${target}`);

    // Mark target and subsequent steps as pending
    for (let i = target; i < this.state.steps.length; i++) {
      this.state.steps[i].status = 'pending';
      this.state.steps[i].startedAt = null;
      this.state.steps[i].completedAt = null;
      // Preserve artifactPath for steps before target (AC: 2)
      if (i >= target) {
        this.state.steps[i].artifactPath = null;
      }
    }

    this.state.currentStepIndex = target;
    this.state.status = 'executing';
    this.state.error = null;
    this.selectedThemeId = null; // Reset theme on rollback
    await this.saveState();

    // Broadcast rollback event
    this.broadcast('pipeline-rollback', {
      sessionId: this.state.sessionId,
      targetStep: target,
      targetAgent: this.state.steps[target].agentId,
    });

    // If approval was pending, reject it to unblock the loop
    if (this.pendingApproval) {
      this.pendingApproval(false);
      this.pendingApproval = null;
    }

    // Re-execute from target step
    const previousOutput = await this.getPreviousOutput(target);
    this.resumeFromStep(target, previousOutput).catch((err) => {
      logger.error(`Rollback re-execution failed: ${err.message}`);
    });
  }

  private async getPreviousOutput(stepIndex: number): Promise<string> {
    if (stepIndex === 0 || !this.state) return '';

    // Try to read artifact from previous step
    const prevStep = this.state.steps[stepIndex - 1];
    if (prevStep.artifactPath) {
      const prevAgent = prevStep.agentId;
      const agentDef = PIPELINE_ORDER_VAL.indexOf(prevAgent);
      if (agentDef >= 0) {
        const content = await artifactManager.getArtifact(
          this.state.sessionId,
          prevStep.artifactPath.split('/').pop() || ''
        );
        if (content) return content;
      }
    }
    return '';
  }

  private async resumeFromStep(fromStep: number, initialInput: string): Promise<void> {
    if (!this.state) return;

    let previousOutput = initialInput;
    const steps = this.state.steps;
    const rejectionCounts: Record<number, number> = {};
    const MAX_REJECTIONS = 3;

    for (let i = fromStep; i < steps.length; i++) {
      this.state.currentStepIndex = i;
      const step = steps[i];
      const agentId = step.agentId;

      // Theme selection before apresentacao
      logger.info(`Agent ${agentId}, selectedThemeId=${this.selectedThemeId}`);
      if (agentId === 'apresentacao' && !this.selectedThemeId) {
        logger.info('Emitting layout-selection-required');
        this.broadcast('layout-selection-required', { sessionId: this.state.sessionId });
        logger.info('Waiting for theme selection before apresentacao (resume)');
        this.selectedThemeId = await this.waitForThemeSelection();
        logger.info(`Theme selected: ${this.selectedThemeId}`);
      }

      // Execute agent first
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

        const parsed = parseAgentOutput(result);
        if (parsed.output) {
          step.artifactPath = await artifactManager.saveArtifact(
            this.state.sessionId, agentId, parsed.output.filename, parsed.output.content
          );
        } else {
          step.artifactPath = await artifactManager.saveArtifact(
            this.state.sessionId, agentId, this.getFallbackFilename(agentId, i), result
          );
        }

        step.status = this.config.approvalRequired[agentId] ? 'awaiting_approval' : 'completed';
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
        this.broadcast('pipeline-error', { agent: agentId, error: msg, step: i + 1, totalSteps: steps.length });
        logger.error(`Pipeline error at ${agentId}: ${msg}`);
        return;
      }

      await this.saveState();

      // Check approval AFTER execution — show THIS agent's output
      if (this.config.approvalRequired[agentId]) {
        this.state.status = 'approval_required';
        await this.saveState();

        let artifactContent = '';
        let artifactName = '';
        if (step.artifactPath) {
          artifactName = step.artifactPath.split('/').pop() || '';
          artifactContent = await artifactManager.getArtifact(this.state.sessionId, artifactName) || '';
        }

        this.broadcast('approval-required', {
          agent: agentId,
          sessionId: this.state.sessionId,
          step: i + 1,
          totalSteps: steps.length,
          artifactName,
          artifactContent,
        });

        const approved = await this.waitForApproval();
        if (!approved) {
          rejectionCounts[i] = (rejectionCounts[i] || 0) + 1;

          if (rejectionCounts[i] >= MAX_REJECTIONS) {
            logger.error(`Agent ${agentId} rejected ${MAX_REJECTIONS} times, aborting pipeline`);
            step.status = 'error';
            this.state.status = 'error';
            this.state.error = `Agent ${agentId} rejeitado ${MAX_REJECTIONS} vezes. Pipeline abortado.`;
            await this.saveState();
            this.broadcast('pipeline-error', {
              agent: agentId,
              error: this.state.error,
              step: i + 1,
              totalSteps: steps.length,
            });
            return;
          }

          logger.info(`Agent ${agentId} output rejected (${rejectionCounts[i]}/${MAX_REJECTIONS}), will re-run`);
          step.status = 'pending';
          step.artifactPath = null;
          step.startedAt = null;
          step.completedAt = null;
          previousOutput = i > 0 ? await this.getPreviousOutput(i) : '';
          i--;
          this.state.status = 'executing';
          continue;
        }

        step.status = 'completed';
        await this.saveState();
        this.state.status = 'executing';
      }
    }

    // Pipeline complete
    this.state.status = 'completed';
    this.state.completedAt = new Date().toISOString();
    await this.saveState();

    const duration = Date.now() - new Date(this.state.startedAt).getTime();
    const artifacts = steps.filter((s) => s.artifactPath).map((s) => s.artifactPath as string);
    this.broadcast('pipeline-complete', { sessionId: this.state.sessionId, duration, artifacts });
    logger.info(`Pipeline completed after rollback: session=${this.state.sessionId}`);
  }

  private waitForApproval(): Promise<boolean> {
    return new Promise((resolve) => {
      this.pendingApproval = (approved: boolean) => resolve(approved);
    });
  }

  private async executeAgent(agentId: AgentId, input: string, systemPrompt: string): Promise<string> {
    let fullResponse = '';
    let lastTasksJson = '';

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

        // Incremental task parsing — detect [TASKS] block changes
        const tasks = parseTasks(fullResponse);
        if (tasks.length > 0) {
          const tasksJson = JSON.stringify(tasks);
          if (tasksJson !== lastTasksJson) {
            lastTasksJson = tasksJson;
            this.broadcast('agent-tasks', {
              agent: agentId,
              tasks,
            });
          }
        }
      } else if (event.type === 'error') {
        throw new Error(event.content);
      }
    }

    return fullResponse;
  }

  private loadAgentPrompt(agentId: AgentId): string {
    let prompt: string;
    try {
      const filePath = join(this.agentPromptsDir, `${agentId}.md`);
      prompt = readFileSync(filePath, 'utf-8');
    } catch {
      logger.warn(`No prompt file for ${agentId}, using default`);
      prompt = `You are the ${agentId} agent. Follow the pipeline protocol.`;
    }

    // Inject selected theme for apresentacao agent
    if (agentId === 'apresentacao' && this.selectedThemeId) {
      const theme = LANDING_THEMES.find((t) => t.id === this.selectedThemeId);
      if (theme) {
        const themeBlock = [
          `**Tema: ${theme.name}**`,
          `- Fonte: ${theme.font} (${theme.fontUrl})`,
          `- Cores CSS:`,
          `  --primary: ${theme.colors.primary}`,
          `  --primary-dark: ${theme.colors.primaryDark}`,
          `  --bg-dark: ${theme.colors.bgDark}`,
          `  --bg-light: ${theme.colors.bgLight}`,
          `  --text-dark: ${theme.colors.textDark}`,
          `  --text-light: ${theme.colors.textLight}`,
          `  --accent: ${theme.colors.accent}`,
          `- Estilo: ${theme.style}`,
        ].join('\n');
        prompt = prompt.replace('{LAYOUT_THEME}', themeBlock);
      }
    }

    // Append knowledge documents if any exist
    const knowledgeDir = join(this.agentPromptsDir, 'knowledge', agentId);
    if (existsSync(knowledgeDir)) {
      const files = readdirSync(knowledgeDir);
      if (files.length > 0) {
        const docs = files.map((f) => {
          try {
            const content = readFileSync(join(knowledgeDir, f), 'utf-8');
            const originalName = f.split('-').slice(1).join('-');
            return `### ${originalName}\n${content}`;
          } catch {
            return '';
          }
        }).filter(Boolean);

        if (docs.length > 0) {
          prompt += `\n\n## Base de Conhecimento\n\nDocumentos de referência fornecidos:\n\n${docs.join('\n\n---\n\n')}`;
        }
      }
    }

    return prompt;
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
