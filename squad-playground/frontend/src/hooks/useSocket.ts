import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useConnectionStore } from '../stores/useConnectionStore';
import { useAgentStore } from '../stores/useAgentStore';
import { usePipelineStore } from '../stores/usePipelineStore';
import { useGameStore } from '../stores/useGameStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useChatStore } from '../stores/useChatStore';
import { AGENT_DEFINITIONS } from 'shared/types';
import type { AgentId, AgentStatus } from 'shared/types';

const SOCKET_URL = 'http://localhost:3001';

// Default tasks per agent — shown immediately when agent starts processing
const DEFAULT_AGENT_TASKS: Partial<Record<AgentId, string[]>> = {
  organizador: [
    'Analisar briefing prévio',
    'Processar notas da reunião',
    'Cruzar dados',
    'Priorizar dores/oportunidades',
    'Estruturar briefing organizado',
  ],
  solucoes: [
    'Analisar briefing organizado',
    'Identificar oportunidades de solução',
    'Desenvolver propostas de solução',
    'Definir benefícios e diferenciais',
    'Compilar cardápio de soluções',
  ],
  estruturas: [
    'Analisar soluções propostas',
    'Definir estrutura de cada produto/serviço',
    'Criar cronograma e entregas',
    'Definir metodologia',
    'Compilar estrutura completa',
  ],
  financeiro: [
    'Analisar estruturas propostas',
    'Calcular custos e investimentos',
    'Definir precificação',
    'Projetar ROI e payback',
    'Compilar análise financeira',
  ],
  closer: [
    'Analisar material completo',
    'Estruturar proposta comercial',
    'Definir condições e prazos',
    'Criar argumentos de fechamento',
    'Compilar proposta final',
  ],
  apresentacao: [
    'Analisar proposta comercial',
    'Criar estrutura da apresentação',
    'Desenvolver slides/seções',
    'Adicionar elementos visuais',
    'Compilar apresentação final',
  ],
  pesquisa: [
    'Pesquisar mercado e segmento',
    'Identificar concorrentes',
    'Analisar tendências',
    'Compilar briefing prévio',
  ],
};

interface PipelineUpdateEvent {
  agent: string;
  status: string;
  step: number;
  totalSteps: number;
  message?: string;
  artifactPath?: string;
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const setConnected = useConnectionStore((s) => s.setConnected);
  const resetReconnect = useConnectionStore((s) => s.resetReconnect);
  const incrementReconnect = useConnectionStore((s) => s.incrementReconnect);
  const setLastPong = useConnectionStore((s) => s.setLastPong);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    // Heartbeat every 30s
    let heartbeatTimer: ReturnType<typeof setInterval>;

    socket.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
      resetReconnect();
      heartbeatTimer = setInterval(() => {
        socket.emit('heartbeat');
      }, 30_000);

      // Send current pipeline config on connect
      const { pipeline } = useSettingsStore.getState();
      socket.emit('update-pipeline-config', { approvalRequired: pipeline.approvalPerAgent });
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
      clearInterval(heartbeatTimer);
    });

    socket.io.on('reconnect_attempt', () => {
      incrementReconnect();
    });

    socket.on('pong', () => {
      setLastPong(Date.now());
    });

    socket.on('pipeline-update', (data: PipelineUpdateEvent) => {
      const agentId = data.agent.toLowerCase() as AgentId;
      useAgentStore.getState().updateAgent(agentId, {
        status: data.status as AgentStatus,
        message: data.message || null,
        artifactPath: data.artifactPath || null,
      });
      usePipelineStore.getState().updateProgress({
        agent: agentId,
        status: data.status,
        step: data.step,
        totalSteps: data.totalSteps,
        message: data.message,
        artifactPath: data.artifactPath,
      });

      // Inject default tasks when agent starts processing
      if (data.status === 'processing') {
        const defaultTasks = DEFAULT_AGENT_TASKS[agentId];
        if (defaultTasks) {
          const tasks = defaultTasks.map((text, i) => ({
            text,
            status: (i === 0 ? 'in_progress' : 'pending') as 'pending' | 'in_progress' | 'completed',
          }));
          usePipelineStore.getState().updateTasks(agentId, tasks);
        }
      }

      // Mark all tasks as completed when agent finishes
      if (data.status === 'done') {
        const existing = usePipelineStore.getState().allTasks[agentId];
        if (existing && existing.length > 0) {
          const completed = existing.map((t) => ({ ...t, status: 'completed' as const }));
          usePipelineStore.getState().updateTasks(agentId, completed);
        }
      }

      if (data.message) {
        const def = AGENT_DEFINITIONS.find((a) => a.id === agentId);
        if (def) {
          useChatStore.getState().addMessage({
            agentId,
            icon: def.icon,
            name: def.name,
            color: def.color,
            text: data.message,
          });
        }
      }
    });

    // Track streaming progress to advance tasks
    const chunkCounts: Record<string, number> = {};
    socket.on('agent-stream', (data: { agent: string; chunk: string }) => {
      const agentId = data.agent.toLowerCase() as AgentId;
      chunkCounts[agentId] = (chunkCounts[agentId] || 0) + data.chunk.length;

      const tasks = usePipelineStore.getState().allTasks[agentId];
      if (!tasks || tasks.length === 0) return;

      // Estimate progress: advance one task per ~20% of expected output (~2000 chars per task)
      const charsPerTask = 2000;
      const completedCount = Math.min(
        Math.floor(chunkCounts[agentId] / charsPerTask),
        tasks.length - 1, // Keep last task as in_progress until 'done'
      );

      const currentCompleted = tasks.filter((t) => t.status === 'completed').length;
      if (completedCount > currentCompleted) {
        const updated = tasks.map((t, i) => ({
          ...t,
          status: (i < completedCount ? 'completed' : i === completedCount ? 'in_progress' : 'pending') as 'pending' | 'in_progress' | 'completed',
        }));
        usePipelineStore.getState().updateTasks(agentId, updated);
      }
    });

    socket.on('agent-tasks', (data: { agent: string; tasks: Array<{ text: string; status: string }> }) => {
      usePipelineStore.getState().updateTasks(
        data.agent as AgentId,
        data.tasks as Array<{ text: string; status: 'pending' | 'in_progress' | 'completed' }>,
      );
    });

    socket.on('pipeline-started', (data: { sessionId: string }) => {
      usePipelineStore.getState().setSession(data.sessionId);
      // Reset chunk counts for new pipeline
      Object.keys(chunkCounts).forEach((k) => delete chunkCounts[k]);
    });

    socket.on('approval-required', (data: { agent: string; artifactName?: string; artifactContent?: string }) => {
      usePipelineStore.getState().setApprovalRequired(
        data.agent as AgentId,
        data.artifactName || '',
        data.artifactContent || '',
      );
    });

    socket.on('pipeline-rollback', (data: { targetStep: number; targetAgent: string }) => {
      usePipelineStore.getState().handleRollback(data.targetStep, data.targetAgent as AgentId);
      // Decrease game stats on rollback
      const currentStep = usePipelineStore.getState().currentStep;
      const stepsRolledBack = currentStep - data.targetStep;
      if (stepsRolledBack > 0) {
        for (let i = 0; i < stepsRolledBack; i++) {
          const gs = useGameStore.getState();
          if (gs.stagesCompleted > 0) {
            useGameStore.setState({
              stagesCompleted: gs.stagesCompleted - 1,
              artifactsCollected: Math.max(0, gs.artifactsCollected - 1),
            });
          }
        }
      }
      // Reset agent statuses for rolled-back agents
      const pipelineOrder = AGENT_DEFINITIONS.map((a) => a.id);
      for (let i = data.targetStep; i < pipelineOrder.length; i++) {
        useAgentStore.getState().updateAgent(pipelineOrder[i] as AgentId, {
          status: 'idle',
          message: null,
          artifactPath: null,
        });
      }
    });

    socket.on('pipeline-complete', (data: { artifacts: string[] }) => {
      usePipelineStore.getState().setCompleted(data.artifacts);
    });

    socket.on('pipeline-error', (data: { error: string }) => {
      usePipelineStore.getState().setError(data.error);
    });

    // Subscribe to settings changes to push pipeline config
    let prevApproval = JSON.stringify(useSettingsStore.getState().pipeline.approvalPerAgent);
    const unsubSettings = useSettingsStore.subscribe((state) => {
      const curr = JSON.stringify(state.pipeline.approvalPerAgent);
      if (curr !== prevApproval) {
        prevApproval = curr;
        socket.emit('update-pipeline-config', { approvalRequired: state.pipeline.approvalPerAgent });
      }
    });

    return () => {
      clearInterval(heartbeatTimer);
      unsubSettings();
      socket.disconnect();
    };
  }, [setConnected, resetReconnect, incrementReconnect, setLastPong]);

  const sendPing = useCallback(() => {
    socketRef.current?.emit('ping');
  }, []);

  const approveStep = useCallback(() => {
    socketRef.current?.emit('pipeline-approve', { approved: true });
    usePipelineStore.getState().clearApproval();
  }, []);

  const rollbackStep = useCallback(() => {
    socketRef.current?.emit('pipeline-rollback');
    usePipelineStore.getState().clearApproval();
  }, []);

  return { sendPing, approveStep, rollbackStep };
}
