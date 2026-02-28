// === Agent Types ===

export type AgentId =
  | 'master'
  | 'pesquisa'
  | 'organizador'
  | 'solucoes'
  | 'estruturas'
  | 'financeiro'
  | 'closer'
  | 'apresentacao';

export type AgentStatus = 'idle' | 'active' | 'processing' | 'done' | 'error' | 'paused';

export interface AgentDefinition {
  id: AgentId;
  name: string;
  role: string;
  color: string;
  icon: string;
  promptFile: string;
  outputFile: string;
  inputFrom: AgentId | 'user';
  handoffTo: AgentId | 'complete';
}

export const AGENT_DEFINITIONS: AgentDefinition[] = [
  {
    id: 'master',
    name: 'Master CEO',
    role: 'Orquestrador',
    color: '#8B5CF6',
    icon: '👑',
    promptFile: 'master.md',
    outputFile: '',
    inputFrom: 'user',
    handoffTo: 'pesquisa',
  },
  {
    id: 'pesquisa',
    name: 'Pesquisa',
    role: 'Investigador',
    color: '#2563EB',
    icon: '📚',
    promptFile: 'pesquisa.md',
    outputFile: '01-briefing-previo.md',
    inputFrom: 'master',
    handoffTo: 'organizador',
  },
  {
    id: 'organizador',
    name: 'Organizador',
    role: 'Curador',
    color: '#059669',
    icon: '📋',
    promptFile: 'organizador.md',
    outputFile: '02-briefing-organizado.md',
    inputFrom: 'pesquisa',
    handoffTo: 'solucoes',
  },
  {
    id: 'solucoes',
    name: 'Soluções',
    role: 'Visionário',
    color: '#F59E0B',
    icon: '💡',
    promptFile: 'solucoes.md',
    outputFile: '03-ideias-solucoes.md',
    inputFrom: 'organizador',
    handoffTo: 'estruturas',
  },
  {
    id: 'estruturas',
    name: 'Estruturas',
    role: 'Arquiteto',
    color: '#374151',
    icon: '🏗️',
    promptFile: 'estruturas.md',
    outputFile: '04-estruturas-produtos.md',
    inputFrom: 'solucoes',
    handoffTo: 'financeiro',
  },
  {
    id: 'financeiro',
    name: 'Financeiro',
    role: 'Analista',
    color: '#10B981',
    icon: '💰',
    promptFile: 'financeiro.md',
    outputFile: '05-analise-financeira.md',
    inputFrom: 'estruturas',
    handoffTo: 'closer',
  },
  {
    id: 'closer',
    name: 'Closer',
    role: 'Persuasor',
    color: '#DC2626',
    icon: '✍️',
    promptFile: 'closer.md',
    outputFile: '06-proposta-comercial.md',
    inputFrom: 'financeiro',
    handoffTo: 'apresentacao',
  },
  {
    id: 'apresentacao',
    name: 'Apresentação',
    role: 'Designer',
    color: '#EC4899',
    icon: '🎨',
    promptFile: 'apresentacao.md',
    outputFile: '07-landing-spec.md',
    inputFrom: 'closer',
    handoffTo: 'complete',
  },
];

// --- Agent State (Frontend) ---

export interface AgentState {
  id: AgentId;
  name: string;
  color: string;
  icon: string;
  status: AgentStatus;
  message: string | null;
  artifactPath: string | null;
  position: { x: number; y: number };
}

// --- Pipeline Types ---

export type PipelineStatus =
  | 'idle'
  | 'executing'
  | 'approval_required'
  | 'completed'
  | 'error';

export interface PipelineState {
  sessionId: string;
  status: PipelineStatus;
  currentStepIndex: number;
  steps: PipelineStep[];
  startedAt: string;
  completedAt: string | null;
  error: string | null;
}

export interface PipelineStep {
  agentId: AgentId;
  status: 'pending' | 'executing' | 'awaiting_approval' | 'completed' | 'error';
  artifactPath: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

// --- Protocol Types ---

export interface ParsedAgentMessage {
  agent: AgentId | 'unknown';
  status: AgentStatus;
  message: string;
  tasks: Task[];
  output: { filename: string; content: string } | null;
  handoff: AgentId | null;
}

export interface Task {
  text: string;
  status: 'pending' | 'in_progress' | 'completed';
}

// --- WebSocket Event Types ---

export interface PipelineUpdateEvent {
  agent: AgentId;
  status: 'processing' | 'done';
  step: number;
  totalSteps: number;
  message?: string;
  artifactPath?: string;
}

export interface ApprovalRequiredEvent {
  agent: AgentId;
  artifactPath: string;
  sessionId: string;
}

export interface PipelineCompleteEvent {
  sessionId: string;
  duration: number;
  artifacts: string[];
}

export interface ArtifactIndex {
  filename: string;
  agent: AgentId;
  createdAt: string;
  size: number;
}

// --- Socket Message Types ---

export interface SocketMessage {
  type: string;
  payload?: unknown;
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

// --- Configuration Types ---

export type PipelineType = 'briefing' | 'consultoria';

export interface PipelineConfig {
  approvalRequired: Partial<Record<AgentId, boolean>>;
  agentTimeout: number;
  maxRetries: number;
  pipelineType?: PipelineType;
  steps?: AgentId[];
}

export const PIPELINE_PRESETS: Record<PipelineType, { steps: AgentId[]; approvalRequired: Partial<Record<AgentId, boolean>> }> = {
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

export const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  approvalRequired: {
    organizador: true,
    closer: true,
  },
  agentTimeout: 120_000,
  maxRetries: 1,
};

export const PIPELINE_ORDER: AgentId[] = [
  'pesquisa',
  'organizador',
  'solucoes',
  'estruturas',
  'financeiro',
  'closer',
  'apresentacao',
];
