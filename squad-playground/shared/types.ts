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
    icon: '◈',
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
    icon: '⟐',
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
    icon: '⬡',
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
    icon: '⟡',
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
    icon: '⎔',
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
    icon: '◇',
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
    icon: '⟁',
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
    icon: '⬢',
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
  tasks?: Task[];
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

// --- Landing Page Themes ---

export interface LandingTheme {
  id: string;
  name: string;
  description: string;
  font: string;
  fontUrl: string;
  colors: {
    primary: string;
    primaryDark: string;
    bgDark: string;
    bgLight: string;
    textDark: string;
    textLight: string;
    accent: string;
  };
  style: string; // Brief style description for the agent
}

export const LANDING_THEMES: LandingTheme[] = [
  {
    id: 'neon-hacker',
    name: 'Neon Hacker',
    description: 'Cyberpunk escuro com glow neon verde, grid futurista e efeitos de brilho',
    font: 'Inter',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
    colors: {
      primary: '#22c55e',
      primaryDark: '#166534',
      bgDark: '#0f172a',
      bgLight: '#f8fafc',
      textDark: '#1e293b',
      textLight: '#f8fafc',
      accent: '#06b6d4',
    },
    style: 'Dark cyberpunk com hero escuro, grid lines no background, glow effects em botões, bordas neon, cards com glassmorphism. Estilo hacker/tech.',
  },
  {
    id: 'corporate-blue',
    name: 'Corporate Blue',
    description: 'Profissional e limpo com azul corporativo, cards com sombra e layout estruturado',
    font: 'Plus Jakarta Sans',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
    colors: {
      primary: '#2563eb',
      primaryDark: '#1d4ed8',
      bgDark: '#0f172a',
      bgLight: '#ffffff',
      textDark: '#1e293b',
      textLight: '#f8fafc',
      accent: '#3b82f6',
    },
    style: 'Clean corporativo com fundo branco, hero com gradiente azul sutil, cards com box-shadow, tipografia profissional. Header fixo com navegação. Estilo empresarial confiável.',
  },
  {
    id: 'sunset-warm',
    name: 'Sunset Warm',
    description: 'Gradientes quentes em laranja e coral, formas orgânicas e visual acolhedor',
    font: 'DM Sans',
    fontUrl: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap',
    colors: {
      primary: '#f97316',
      primaryDark: '#ea580c',
      bgDark: '#1c1917',
      bgLight: '#fffbeb',
      textDark: '#292524',
      textLight: '#fef3c7',
      accent: '#ef4444',
    },
    style: 'Gradientes quentes (laranja→coral), fundo creme claro, formas arredondadas (border-radius grandes), blob shapes decorativos, visual friendly e acolhedor. Botões com gradiente warm.',
  },
  {
    id: 'minimal-mono',
    name: 'Minimal Mono',
    description: 'Ultra minimalista em preto e branco, tipografia grande e muito espaço em branco',
    font: 'Space Grotesk',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap',
    colors: {
      primary: '#171717',
      primaryDark: '#0a0a0a',
      bgDark: '#0a0a0a',
      bgLight: '#fafafa',
      textDark: '#171717',
      textLight: '#fafafa',
      accent: '#6b7280',
    },
    style: 'Ultra minimalista: fundo branco puro, sem gradientes, sem sombras pesadas. Tipografia GRANDE (h1 72px+), muito whitespace, linhas finas como separadores. Accent em cinza. Sem cards — layout flat. Botões com borda fina preta.',
  },
  {
    id: 'luxury-gold',
    name: 'Luxury Gold',
    description: 'Premium elegante com dourado, fundo escuro e tipografia serif sofisticada',
    font: 'Playfair Display',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800&family=Lato:wght@300;400;700&display=swap',
    colors: {
      primary: '#d4a853',
      primaryDark: '#b8942e',
      bgDark: '#1a1a1a',
      bgLight: '#faf9f6',
      textDark: '#1a1a1a',
      textLight: '#f5f0e8',
      accent: '#c9a84c',
    },
    style: 'Luxury premium: fundo escuro (#1a1a1a), headings em Playfair Display (serif), body em Lato (sans-serif). Dourado como accent, bordas finas douradas, gradientes sutis preto→dourado. Sem border-radius (quadrado). Elegante e sofisticado.',
  },
];

// --- Knowledge Documents ---

export interface AgentKnowledgeDoc {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  uploadedAt: string;
}

// --- Team Structure ---

export interface AgentGroup {
  label: string;
  icon: string;
  color: string;
  agents: AgentId[];
}

export const AGENT_GROUPS: AgentGroup[] = [
  { label: 'Orquestração', icon: '◈', color: '#8B5CF6', agents: ['master'] },
  { label: 'Pesquisa & Análise', icon: '⟐', color: '#2563EB', agents: ['pesquisa'] },
  { label: 'Estratégia & Organização', icon: '⬡', color: '#059669', agents: ['organizador', 'solucoes'] },
  { label: 'Arquitetura & Finanças', icon: '⎔', color: '#374151', agents: ['estruturas', 'financeiro'] },
  { label: 'Vendas & Apresentação', icon: '⟁', color: '#DC2626', agents: ['closer', 'apresentacao'] },
];
