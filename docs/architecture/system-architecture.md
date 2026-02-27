# Squad Playground — System Architecture

**Version:** 1.0
**Author:** Aria (Architect)
**Date:** 2026-02-27
**Status:** Ready for Implementation
**Source PRD:** `docs/prd/squad-playground-matrix.md`

---

## 1. Architecture Overview

### 1.1 System Context

O Squad Playground e um sistema de tres camadas que orquestra agentes de IA para consultoria, com uma interface gamificada estilo Matrix como frontend. O sistema roda inteiramente em **localhost** (MVP), com dados de clientes nunca saindo da maquina local.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER (Consultant)                            │
│                    Browser: Chrome/Firefox/Edge                      │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTP + WebSocket
                               │ localhost:5173
┌──────────────────────────────▼──────────────────────────────────────┐
│                     FRONTEND (React SPA)                            │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────────┐     │
│  │ React 18 DOM │  │  Phaser 3     │  │  Zustand Stores      │     │
│  │ (UI Layer)   │  │  (Game Layer) │  │  (State Management)  │     │
│  └──────────────┘  └───────────────┘  └──────────────────────┘     │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ WebSocket (Socket.io)
                               │ localhost:3000
┌──────────────────────────────▼──────────────────────────────────────┐
│                     BACKEND (Node.js)                               │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────────┐     │
│  │ Express      │  │  Pipeline     │  │  Agent Protocol      │     │
│  │ + Socket.io  │  │  Orchestrator │  │  Parser              │     │
│  └──────────────┘  └───────┬───────┘  └──────────────────────┘     │
│                            │                                        │
│  ┌─────────────────────────▼────────────────────────────────┐      │
│  │              Claude Code Adapter                          │      │
│  │  (Abstraction layer over Remote/Headless API)             │      │
│  └─────────────────────────┬────────────────────────────────┘      │
└────────────────────────────┼────────────────────────────────────────┘
                             │ Claude Code Remote API
                             │ (stdin/stdout or HTTP)
┌────────────────────────────▼────────────────────────────────────────┐
│                   CLAUDE CODE (Runtime)                              │
│  ┌────────┐ ┌──────────┐ ┌──────────┐ ┌───────┐ ┌──────────┐     │
│  │MASTER  │ │Pesquisa  │ │Solucoes  │ │Closer │ │Apresent. │     │
│  │(CEO)   │ │& Briefing│ │(Disney)  │ │(Copy) │ │(Landing) │     │
│  └────────┘ └──────────┘ └──────────┘ └───────┘ └──────────┘     │
│             ┌──────────┐ ┌──────────┐ ┌──────────┐                 │
│             │Organizad.│ │Estruturas│ │Financeiro│                  │
│             └──────────┘ └──────────┘ └──────────┘                 │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   FILESYSTEM (Artifact Storage)                     │
│  docs/artifacts/{sessionId}/                                        │
│  ├── pipeline-state.json                                            │
│  ├── 01-briefing-previo.md                                          │
│  ├── 02-briefing-organizado.md                                      │
│  ├── ...                                                            │
│  ├── 06-proposta-comercial.md                                       │
│  └── landing-page/index.html                                        │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Frontend rendering** | React DOM + Phaser Canvas (dual-layer) | React for UI (popups, HUD, editor), Phaser for game (Neo, houses, effects) |
| **State management** | Zustand (shared between React and Phaser) | Single source of truth; no prop drilling; Phaser reads from same store |
| **Real-time comms** | Socket.io (not raw WebSocket) | Auto-reconnect, room support, fallback to polling, battle-tested |
| **Pipeline pattern** | State Machine with persisted state | Supports pause/resume/rollback; state survives server restart |
| **Claude Code integration** | Adapter pattern behind interface | Swappable when API changes; testable with mocks |
| **Storage** | Filesystem only (no database) | Artifacts are Markdown files; no query needs; simplicity |
| **Monorepo structure** | npm workspaces | Shared types between frontend/backend; single install |

---

## 2. Frontend Architecture

### 2.1 Dual-Layer Rendering Model

O frontend usa um modelo de **duas camadas sobrepostas**: o Phaser 3 canvas (game layer) renderiza abaixo, e o React DOM (UI layer) renderiza acima como overlay. Ambas camadas compartilham estado via Zustand.

```
┌─────────────────────────────────────────────────┐
│                 Browser Viewport                 │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │  Z-INDEX 10: React DOM Layer               │  │
│  │  ┌──────┐ ┌─────────┐ ┌────────────────┐  │  │
│  │  │ HUD  │ │ Toasts  │ │ Approval Popup │  │  │
│  │  └──────┘ └─────────┘ └────────────────┘  │  │
│  │  ┌────────────────┐  ┌──────────────────┐  │  │
│  │  │ Progress Bar   │  │ Settings Panel   │  │  │
│  │  └────────────────┘  └──────────────────┘  │  │
│  │  ┌──────────────────────────────────────┐  │  │
│  │  │ Victory Screen (fullscreen overlay)  │  │  │
│  │  └──────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │  Z-INDEX 1: Phaser 3 Canvas Layer          │  │
│  │                                             │  │
│  │  [Background: Code Rain + Parallax Grid]    │  │
│  │                                             │  │
│  │  [Houses]  🏢──🏠──🏠──💡──⚙️──💰──📝──🎨  │  │
│  │           ═══════════════════════════════    │  │
│  │              🕴️ Neo (walking)               │  │
│  │  [Ground: Neon green platform]              │  │
│  │                                             │  │
│  └────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**Comunicacao entre camadas:**

```typescript
// Phaser scene reads from Zustand store (polling every frame)
class PipelineScene extends Phaser.Scene {
  update() {
    const { activeAgent, neoTarget } = useAgentStore.getState();
    // Move Neo toward neoTarget position
  }
}

// React components write to Zustand store
function ApprovalPopup() {
  const approve = useAgentStore(s => s.approveStep);
  return <button onClick={approve}>Aprovar</button>;
}

// WebSocket events update Zustand store (bridge)
socket.on('pipeline-update', (data) => {
  useAgentStore.getState().updateAgent(data);
});
```

### 2.2 Component Hierarchy

```
App.tsx
├── ConnectionStatus.tsx          # WebSocket connection indicator
├── GameCanvas.tsx                # Phaser 3 wrapper (canvas element)
│   └── PipelineScene.ts          # Main Phaser scene
│       ├── NeoCharacter.ts       # Neo sprite + animations + movement
│       ├── AgentHouse.ts         # House sprites + doors + glow (x8)
│       ├── WorldEnvironment.ts   # Ground, paths, parallax backgrounds
│       └── EffectsManager.ts     # Code rain, particles, trails, glitch
├── UIOverlay.tsx                 # React overlay container (z-index above canvas)
│   ├── ProgressBar.tsx           # Pipeline step indicator
│   ├── HUD.tsx                   # Score, stars, timer
│   ├── MessageBubble.tsx         # Agent message with typewriter
│   ├── TasksSidebar.tsx          # Task checklist popup
│   ├── ApprovalPopup.tsx         # Approve/Edit/Back modal
│   ├── ArtifactEditor.tsx        # Markdown editor panel
│   ├── VictoryScreen.tsx         # Pipeline complete celebration
│   ├── SettingsPanel.tsx         # Configuration toggles
│   ├── ToastContainer.tsx        # Notification toasts
│   └── HelpModal.tsx             # Quick reference (keyboard shortcuts)
└── hooks/
    ├── useSocket.ts              # WebSocket connection + event handling
    ├── useKeyboardShortcuts.ts   # Global keyboard bindings
    └── usePhaserBridge.ts        # Zustand <-> Phaser sync helper
```

### 2.3 Zustand Store Design

O estado global e dividido em **5 stores independentes** para evitar re-renders desnecessarios. Cada store gerencia um dominio especifico.

```typescript
// === shared/types.ts ===

type AgentId = 'master' | 'pesquisa' | 'organizador' | 'solucoes'
             | 'estruturas' | 'financeiro' | 'closer' | 'apresentacao';

type AgentStatus = 'idle' | 'active' | 'processing' | 'done' | 'error' | 'paused';

type PipelineStatus = 'idle' | 'running' | 'paused' | 'approval_required'
                    | 'completed' | 'error';

interface AgentState {
  id: AgentId;
  name: string;
  color: string;
  status: AgentStatus;
  message: string | null;
  artifactPath: string | null;
  position: { x: number; y: number }; // World position for Phaser
}

interface Task {
  text: string;
  status: 'pending' | 'in_progress' | 'completed';
}

interface ParsedAgentMessage {
  agent: AgentId | 'unknown';
  status: AgentStatus;
  message: string;
  tasks: Task[];
  output: { filename: string; content: string } | null;
  handoff: AgentId | null;
}
```

```typescript
// === frontend/src/stores/useAgentStore.ts ===
// Domain: Agent states and pipeline progression

interface AgentStore {
  agents: AgentState[];
  activeAgent: AgentId | null;
  completedSteps: AgentId[];

  updateAgent: (id: AgentId, patch: Partial<AgentState>) => void;
  setActiveAgent: (id: AgentId) => void;
  markCompleted: (id: AgentId) => void;
  resetAll: () => void;
}
```

```typescript
// === frontend/src/stores/usePipelineStore.ts ===
// Domain: Pipeline orchestration state

interface PipelineStore {
  sessionId: string | null;
  status: PipelineStatus;
  currentStep: number;     // 0-6
  totalSteps: number;      // 7
  approvalAgent: AgentId | null;
  approvalArtifact: string | null;

  startPipeline: (sessionId: string) => void;
  requestApproval: (agent: AgentId, artifactPath: string) => void;
  approve: () => void;
  reject: (feedback: string) => void;
  rollback: (toAgent: AgentId) => void;
  completePipeline: () => void;
  reset: () => void;
}
```

```typescript
// === frontend/src/stores/useGameStore.ts ===
// Domain: Gamification state (HUD, score, timer)

interface GameStore {
  artifacts: number;       // 0-7
  stages: number;          // 0-7
  startTime: number | null;
  isPaused: boolean;

  collectArtifact: () => void;
  completeStage: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
}
```

```typescript
// === frontend/src/stores/useEffectsStore.ts ===
// Domain: Visual effects configuration

interface EffectsStore {
  codeRain: boolean;
  neoTrail: boolean;
  glitch: boolean;
  particles: boolean;
  reduceMotion: boolean;  // Master toggle
  neoSpeed: number;       // 50-300 px/s
  typewriterSpeed: number; // 10-100 chars/s

  toggle: (effect: string) => void;
  setNeoSpeed: (speed: number) => void;
  setTypewriterSpeed: (speed: number) => void;
  resetDefaults: () => void;
}
```

```typescript
// === frontend/src/stores/useConnectionStore.ts ===
// Domain: WebSocket connection state

interface ConnectionStore {
  isConnected: boolean;
  reconnectAttempts: number;
  lastPong: number | null;

  setConnected: (value: boolean) => void;
  incrementReconnect: () => void;
  resetReconnect: () => void;
}
```

### 2.4 Phaser 3 Integration Pattern

O ponto critico e que Phaser gerencia seu proprio game loop (requestAnimationFrame) e React gerencia o DOM. Eles NAO devem interferir um no outro.

```typescript
// === frontend/src/components/GameCanvas.tsx ===

import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { PipelineScene } from '../game/PipelineScene';

export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.CANVAS,
      parent: containerRef.current,
      width: window.innerWidth,
      height: 600,
      transparent: true,       // Allows CSS background to show through
      pixelArt: true,          // Crisp pixel art scaling
      physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 } } },
      scene: [PipelineScene],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_HORIZONTALLY,
      },
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      gameRef.current?.destroy(true); // Cleanup on unmount
      gameRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '600px', zIndex: 1 }}
    />
  );
}
```

**Principio:** Phaser SOMENTE le do Zustand store (via `getState()`). Phaser NUNCA escreve no store diretamente. Escrita e feita por event handlers do WebSocket ou por interacoes React.

```
                  WebSocket Event
                       │
                       ▼
              ┌─────────────────┐
              │  Zustand Store   │  ◄── React writes (clicks, approvals)
              │  (Source of Truth)│
              └────────┬─────────┘
                       │
              ┌────────┴─────────┐
              ▼                  ▼
        React DOM            Phaser Scene
        (re-render)          (reads in update())
```

### 2.5 Phaser Scene Architecture

```typescript
// === frontend/src/game/PipelineScene.ts ===

export class PipelineScene extends Phaser.Scene {
  private neo!: NeoCharacter;
  private houses: Map<AgentId, AgentHouseSprite> = new Map();
  private environment!: WorldEnvironment;
  private effects!: EffectsManager;

  // Store snapshot (updated each frame)
  private prevActiveAgent: AgentId | null = null;

  create() {
    this.environment = new WorldEnvironment(this); // Ground, paths, parallax
    this.createHouses();                            // 8 agent houses
    this.neo = new NeoCharacter(this, 200, 400);   // Neo at MASTER position
    this.effects = new EffectsManager(this);        // Rain, particles, etc.

    // Camera follows Neo
    this.cameras.main.startFollow(this.neo.sprite, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, 4000, 600);
  }

  update(time: number, delta: number) {
    const { activeAgent } = useAgentStore.getState();
    const { codeRain, neoTrail } = useEffectsStore.getState();

    // Detect agent change
    if (activeAgent !== this.prevActiveAgent) {
      this.onAgentChanged(activeAgent);
      this.prevActiveAgent = activeAgent;
    }

    this.neo.update(delta);
    this.effects.update(delta, { codeRain, neoTrail });
  }

  private onAgentChanged(agentId: AgentId | null) {
    if (!agentId) return;
    const house = this.houses.get(agentId);
    if (!house) return;
    this.neo.walkTo(house.doorPosition);
    house.activate();
  }
}
```

---

## 3. Backend Architecture

### 3.1 Server Structure

```
backend/
├── src/
│   ├── index.ts                    # Entry point: Express + Socket.io init
│   ├── config/
│   │   ├── env.ts                  # Environment variables (dotenv)
│   │   └── pipeline.json           # Approval points configuration
│   ├── server/
│   │   ├── express.ts              # Express app setup, routes, middleware
│   │   └── socket.ts               # Socket.io server setup, event handlers
│   ├── pipeline/
│   │   ├── orchestrator.ts         # Pipeline state machine (core)
│   │   ├── state.ts                # PipelineState type + persistence
│   │   └── agents.ts               # Agent definitions loader
│   ├── parser/
│   │   └── agent-parser.ts         # Protocol parser ([AGENT:...] tags)
│   ├── integration/
│   │   ├── claude-adapter.ts       # Interface: ClaudeAdapter
│   │   ├── claude-remote.ts        # Implementation: Claude Code Remote
│   │   └── claude-mock.ts          # Implementation: Mock (for testing)
│   ├── artifacts/
│   │   ├── storage.ts              # Filesystem read/write/list
│   │   └── zip.ts                  # ZIP generation for download
│   ├── routes/
│   │   ├── health.ts               # GET /health
│   │   ├── pipeline.ts             # POST /api/pipeline/start, etc.
│   │   ├── artifacts.ts            # GET/PUT /api/artifacts/{...}
│   │   └── mock.ts                 # POST /api/mock/agent-update (dev only)
│   └── utils/
│       ├── logger.ts               # Winston logger configuration
│       └── uuid.ts                 # Session ID generation
├── tests/
│   ├── parser.test.ts              # Parser unit tests
│   ├── orchestrator.test.ts        # Pipeline state machine tests
│   └── integration.test.ts         # WebSocket integration tests
├── package.json
├── tsconfig.json
└── nodemon.json
```

### 3.2 Pipeline Orchestrator — State Machine

O orchestrator e o coracao do backend. Ele implementa uma **maquina de estados finitos** que controla a progressao do pipeline de 7 agentes.

```
                    ┌─────────────────────────────────────────┐
                    │          Pipeline State Machine          │
                    │                                         │
  start()           │                                         │
  ──────────► ┌─────▼─────┐  executeStep()  ┌────────────┐  │
              │   IDLE     │ ──────────────► │ EXECUTING  │  │
              └───────────┘                  └──────┬─────┘  │
                    ▲                               │        │
                    │                    ┌──────────┼────────┐│
                    │                    ▼          ▼        ││
  reset()     ┌────┴──────┐     ┌──────────┐  ┌────────┐   ││
  ◄────────── │ COMPLETED │     │ APPROVAL │  │ ERROR  │   ││
              └───────────┘     │ REQUIRED │  └───┬────┘   ││
                    ▲           └─────┬────┘      │        ││
                    │                 │            │ retry()││
                    │    approve()    │            ▼        ││
                    │    ─────────────┘     ┌──────────┐   ││
                    │                       │ RETRYING │   ││
                    │    rollback()         └──────────┘   ││
                    │    ──────────► back to EXECUTING      ││
                    │                                       ││
                    │   allStepsDone()                      ││
                    └───────────────────────────────────────┘│
                                                             │
                    └─────────────────────────────────────────┘
```

```typescript
// === backend/src/pipeline/orchestrator.ts ===

interface PipelineState {
  sessionId: string;
  status: 'idle' | 'executing' | 'approval_required' | 'completed' | 'error';
  currentStepIndex: number;           // 0-6
  steps: PipelineStep[];              // Ordered list of 7 agent steps
  startedAt: string;                  // ISO timestamp
  completedAt: string | null;
  error: string | null;
}

interface PipelineStep {
  agentId: AgentId;
  status: 'pending' | 'executing' | 'completed' | 'error';
  artifactPath: string | null;
  startedAt: string | null;
  completedAt: string | null;
  inputFrom: string | null;           // Path to previous artifact (input)
}

const PIPELINE_ORDER: AgentId[] = [
  'pesquisa', 'organizador', 'solucoes',
  'estruturas', 'financeiro', 'closer', 'apresentacao'
];

class PipelineOrchestrator {
  constructor(
    private claude: ClaudeAdapter,
    private storage: ArtifactStorage,
    private socket: SocketServer,
    private config: PipelineConfig,
  ) {}

  async start(sessionId: string, initialPrompt: string): Promise<void> {
    const state = this.createInitialState(sessionId);
    await this.persistState(state);
    this.socket.broadcast('pipeline-started', { sessionId });
    await this.executeStep(state, 0, initialPrompt);
  }

  private async executeStep(
    state: PipelineState,
    stepIndex: number,
    input: string
  ): Promise<void> {
    const step = state.steps[stepIndex];
    const agentId = step.agentId;

    // Update state
    state.currentStepIndex = stepIndex;
    state.status = 'executing';
    step.status = 'executing';
    step.startedAt = new Date().toISOString();
    await this.persistState(state);

    // Broadcast to frontend
    this.socket.broadcast('pipeline-update', {
      agent: agentId,
      status: 'processing',
      step: stepIndex + 1,
      totalSteps: 7,
    });

    try {
      // Execute agent via Claude Code
      const systemPrompt = await this.loadAgentPrompt(agentId);
      const response = await this.claude.execute(systemPrompt, input);

      // Parse and store artifact
      const parsed = parseAgentOutput(response);
      const artifactPath = await this.storage.saveArtifact(
        state.sessionId, stepIndex, agentId, parsed
      );
      step.artifactPath = artifactPath;
      step.status = 'completed';
      step.completedAt = new Date().toISOString();

      // Broadcast completion
      this.socket.broadcast('pipeline-update', {
        agent: agentId,
        status: 'done',
        step: stepIndex + 1,
        totalSteps: 7,
        artifactPath,
      });

      // Check if approval required
      if (this.config.approvalRequired[agentId]) {
        state.status = 'approval_required';
        await this.persistState(state);
        this.socket.broadcast('approval-required', {
          agent: agentId,
          artifactPath,
          sessionId: state.sessionId,
        });
        return; // Wait for approve/reject event
      }

      // Auto-advance to next step
      await this.advanceToNext(state, artifactPath);

    } catch (error) {
      step.status = 'error';
      state.status = 'error';
      state.error = (error as Error).message;
      await this.persistState(state);
      this.socket.broadcast('pipeline-error', {
        agent: agentId,
        error: state.error,
        sessionId: state.sessionId,
      });
    }
  }

  async approve(sessionId: string): Promise<void> {
    const state = await this.loadState(sessionId);
    const currentStep = state.steps[state.currentStepIndex];
    await this.advanceToNext(state, currentStep.artifactPath!);
  }

  async rollback(sessionId: string, toAgentId: AgentId): Promise<void> {
    const state = await this.loadState(sessionId);
    const targetIndex = PIPELINE_ORDER.indexOf(toAgentId);

    // Reset target and subsequent steps
    for (let i = targetIndex; i < state.steps.length; i++) {
      state.steps[i].status = 'pending';
      state.steps[i].completedAt = null;
      // Preserve artifactPath of target for re-use as input reference
    }

    // Determine input for re-execution
    const input = targetIndex > 0
      ? await this.storage.readArtifact(state.sessionId, state.steps[targetIndex - 1].artifactPath!)
      : ''; // First step uses original prompt

    this.socket.broadcast('pipeline-rollback', {
      toAgent: toAgentId,
      sessionId: state.sessionId,
    });

    await this.executeStep(state, targetIndex, input);
  }

  private async advanceToNext(state: PipelineState, previousArtifact: string): Promise<void> {
    const nextIndex = state.currentStepIndex + 1;
    if (nextIndex >= state.steps.length) {
      state.status = 'completed';
      state.completedAt = new Date().toISOString();
      await this.persistState(state);
      this.socket.broadcast('pipeline-complete', {
        sessionId: state.sessionId,
        duration: Date.now() - new Date(state.startedAt).getTime(),
        artifacts: state.steps.map(s => s.artifactPath).filter(Boolean),
      });
      return;
    }

    const artifactContent = await this.storage.readArtifact(state.sessionId, previousArtifact);
    await this.executeStep(state, nextIndex, artifactContent);
  }
}
```

### 3.3 Claude Code Adapter Pattern

A integracao com Claude Code e isolada atras de uma interface, permitindo mock em testes e troca de implementacao sem impactar o resto do sistema.

```typescript
// === backend/src/integration/claude-adapter.ts ===

interface ClaudeAdapter {
  execute(systemPrompt: string, userPrompt: string): Promise<string>;
  executeStreaming(systemPrompt: string, userPrompt: string): AsyncIterable<string>;
  isAvailable(): Promise<boolean>;
}
```

```typescript
// === backend/src/integration/claude-remote.ts ===
// Real implementation using Claude Code Remote/Headless

import { spawn } from 'child_process';

class ClaudeRemoteAdapter implements ClaudeAdapter {
  async execute(systemPrompt: string, userPrompt: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const fullPrompt = `${systemPrompt}\n\n---\n\n${userPrompt}`;

      const proc = spawn('claude', [
        '--print',           // Output only, no interactive
        '--dangerously-skip-permissions',
        '-p', fullPrompt,
      ]);

      let output = '';
      proc.stdout.on('data', (chunk) => { output += chunk.toString(); });
      proc.stderr.on('data', (chunk) => { logger.warn('Claude stderr:', chunk.toString()); });
      proc.on('close', (code) => {
        if (code === 0) resolve(output);
        else reject(new Error(`Claude exited with code ${code}`));
      });

      // Timeout
      setTimeout(() => {
        proc.kill();
        reject(new Error('Claude Code timeout (120s)'));
      }, 120_000);
    });
  }

  async *executeStreaming(systemPrompt: string, userPrompt: string): AsyncIterable<string> {
    // Streaming implementation for real-time updates
    const fullPrompt = `${systemPrompt}\n\n---\n\n${userPrompt}`;
    const proc = spawn('claude', ['--print', '-p', fullPrompt]);

    for await (const chunk of proc.stdout) {
      yield chunk.toString();
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const proc = spawn('claude', ['--version']);
      return new Promise((resolve) => {
        proc.on('close', (code) => resolve(code === 0));
        setTimeout(() => { proc.kill(); resolve(false); }, 5000);
      });
    } catch { return false; }
  }
}
```

```typescript
// === backend/src/integration/claude-mock.ts ===
// Mock implementation for development and testing

class ClaudeMockAdapter implements ClaudeAdapter {
  private mockResponses: Map<AgentId, string>;

  async execute(systemPrompt: string, userPrompt: string): Promise<string> {
    const agentId = this.detectAgent(systemPrompt);
    const mockPath = `agents/mocks/${agentId}-response.md`;
    return fs.readFile(mockPath, 'utf-8');
  }
  // ...
}
```

### 3.4 REST API Endpoints

```yaml
# Health
GET  /health                                    → { status, timestamp, claudeAvailable }

# Pipeline Control
POST /api/pipeline/start                        → { sessionId }
     Body: { prompt: string, config?: PipelineConfig }
POST /api/pipeline/{sessionId}/approve          → { nextAgent }
POST /api/pipeline/{sessionId}/reject           → { rerunAgent }
     Body: { feedback: string }
POST /api/pipeline/{sessionId}/rollback         → { targetAgent }
     Body: { toAgent: AgentId }
POST /api/pipeline/{sessionId}/pause            → { status: 'paused' }
POST /api/pipeline/{sessionId}/resume           → { status: 'executing' }
GET  /api/pipeline/{sessionId}/state            → PipelineState

# Artifacts
GET  /api/artifacts/{sessionId}                 → ArtifactIndex[]
GET  /api/artifacts/{sessionId}/{filename}      → Raw Markdown content
PUT  /api/artifacts/{sessionId}/{filename}      → { saved: true }
     Body: { content: string }
GET  /api/artifacts/{sessionId}/download        → ZIP file (all artifacts)
GET  /api/artifacts/{sessionId}/landing-page    → HTML (served directly)
GET  /api/artifacts/{sessionId}/proposta/preview → HTML (rendered Markdown)

# Claude Status
GET  /api/claude-status                         → { available, lastCheck }

# Development Only
POST /api/mock/agent-update                     → { broadcasted: true }
     Body: { agent, status, message }
POST /api/mock/pipeline-simulate                → { sessionId }
```

### 3.5 Socket.io Event Schema

```yaml
# === Server → Client Events ===

pipeline-started:
  sessionId: string

pipeline-update:
  agent: AgentId
  status: 'processing' | 'done'
  step: number         # 1-7
  totalSteps: 7
  message?: string     # Agent message for bubble
  artifactPath?: string

pipeline-error:
  agent: AgentId
  error: string
  sessionId: string

approval-required:
  agent: AgentId
  artifactPath: string
  sessionId: string

pipeline-rollback:
  toAgent: AgentId
  sessionId: string

pipeline-complete:
  sessionId: string
  duration: number     # milliseconds
  artifacts: string[]  # List of artifact paths

agent-message:         # Streaming: partial messages during processing
  agent: AgentId
  chunk: string
  isComplete: boolean

tasks-update:
  agent: AgentId
  tasks: Task[]

# === Client → Server Events ===

pipeline:start:
  prompt: string
  config?: { approvalRequired: Record<AgentId, boolean> }

pipeline:approve:
  sessionId: string

pipeline:reject:
  sessionId: string
  feedback: string

pipeline:rollback:
  sessionId: string
  toAgent: AgentId

pipeline:pause:
  sessionId: string

pipeline:resume:
  sessionId: string

ping:
  # heartbeat

# === Server → Client (Connection) ===

pong:
  timestamp: string
```

---

## 4. Shared Protocol Specification

### 4.1 Agent Communication Protocol

Todos os 8 agentes DEVEM seguir este formato de output para que o parser funcione corretamente.

```
[AGENT:{AgentName}][STATUS:{status}]

{Message content — what the agent is doing or reporting}

[TASKS]
- [x] Completed task description
- [~] In progress task description
- [ ] Pending task description
[/TASKS]

[OUTPUT:{filename}]
{Artifact content in Markdown format}
[/OUTPUT]

[HANDOFF:{NextAgentName}]
{Brief context for the next agent}
[/HANDOFF]
```

**Regras do protocolo:**

| Tag | Required | Format |
|-----|----------|--------|
| `[AGENT:Name]` | YES | First line, exact agent name |
| `[STATUS:state]` | YES | Same line as AGENT. Values: `active`, `processing`, `done` |
| Message text | YES | Free-form text between header and first block |
| `[TASKS]...[/TASKS]` | NO | Checklist with `[x]`, `[~]`, `[ ]` markers |
| `[OUTPUT:file]...[/OUTPUT]` | YES | Artifact content. `file` = output filename |
| `[HANDOFF:Name]...[/HANDOFF]` | NO | Context for next agent (auto-detected from pipeline order if absent) |

### 4.2 Parser Implementation

```typescript
// === backend/src/parser/agent-parser.ts ===

const AGENT_REGEX = /\[AGENT:(\w+)\]\[STATUS:(\w+)\]/;
const TASKS_REGEX = /\[TASKS\]([\s\S]*?)\[\/TASKS\]/;
const OUTPUT_REGEX = /\[OUTPUT:([^\]]+)\]([\s\S]*?)\[\/OUTPUT\]/;
const HANDOFF_REGEX = /\[HANDOFF:(\w+)\]([\s\S]*?)\[\/HANDOFF\]/;
const TASK_LINE_REGEX = /^-\s*\[([ x~])\]\s*(.+)$/gm;

export function parseAgentOutput(raw: string): ParsedAgentMessage {
  // Agent + Status
  const agentMatch = raw.match(AGENT_REGEX);
  const agent = agentMatch?.[1]?.toLowerCase() as AgentId ?? 'unknown';
  const status = agentMatch?.[2]?.toLowerCase() as AgentStatus ?? 'active';

  // Message (text between header and first block tag)
  const headerEnd = agentMatch ? raw.indexOf(agentMatch[0]) + agentMatch[0].length : 0;
  const firstBlock = Math.min(
    ...[/\[TASKS\]/, /\[OUTPUT:/, /\[HANDOFF:/]
      .map(r => { const m = raw.search(r); return m === -1 ? Infinity : m; })
  );
  const message = raw.slice(headerEnd, firstBlock === Infinity ? undefined : firstBlock).trim();

  // Tasks
  const tasksMatch = raw.match(TASKS_REGEX);
  const tasks: Task[] = [];
  if (tasksMatch) {
    let m: RegExpExecArray | null;
    const taskRegex = /^-\s*\[([ x~])\]\s*(.+)$/gm;
    while ((m = taskRegex.exec(tasksMatch[1])) !== null) {
      tasks.push({
        text: m[2].trim(),
        status: m[1] === 'x' ? 'completed' : m[1] === '~' ? 'in_progress' : 'pending',
      });
    }
  }

  // Output
  const outputMatch = raw.match(OUTPUT_REGEX);
  const output = outputMatch
    ? { filename: outputMatch[1].trim(), content: outputMatch[2].trim() }
    : null;

  // Handoff
  const handoffMatch = raw.match(HANDOFF_REGEX);
  const handoff = handoffMatch?.[1]?.toLowerCase() as AgentId ?? null;

  return { agent, status, message, tasks, output, handoff };
}
```

### 4.3 Shared TypeScript Types

```typescript
// === shared/types.ts ===
// This file is imported by BOTH frontend and backend

// --- Agent Types ---
export type AgentId = 'master' | 'pesquisa' | 'organizador' | 'solucoes'
                    | 'estruturas' | 'financeiro' | 'closer' | 'apresentacao';

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
  { id: 'master',        name: 'Master CEO',    role: 'Orquestrador', color: '#8B5CF6', icon: '👑', promptFile: 'master.md',        outputFile: '',                     inputFrom: 'user',        handoffTo: 'pesquisa' },
  { id: 'pesquisa',      name: 'Pesquisa',      role: 'Investigador', color: '#2563EB', icon: '📚', promptFile: 'pesquisa.md',      outputFile: '01-briefing-previo.md',     inputFrom: 'master',      handoffTo: 'organizador' },
  { id: 'organizador',   name: 'Organizador',   role: 'Curador',      color: '#059669', icon: '📋', promptFile: 'organizador.md',   outputFile: '02-briefing-organizado.md', inputFrom: 'pesquisa',    handoffTo: 'solucoes' },
  { id: 'solucoes',      name: 'Solucoes',      role: 'Visionario',   color: '#F59E0B', icon: '💡', promptFile: 'solucoes.md',      outputFile: '03-ideias-solucoes.md',     inputFrom: 'organizador', handoffTo: 'estruturas' },
  { id: 'estruturas',    name: 'Estruturas',    role: 'Arquiteto',    color: '#374151', icon: '🏗️', promptFile: 'estruturas.md',    outputFile: '04-estruturas-produtos.md', inputFrom: 'solucoes',    handoffTo: 'financeiro' },
  { id: 'financeiro',    name: 'Financeiro',    role: 'Analista',     color: '#10B981', icon: '💰', promptFile: 'financeiro.md',    outputFile: '05-analise-financeira.md',  inputFrom: 'estruturas',  handoffTo: 'closer' },
  { id: 'closer',        name: 'Closer',        role: 'Persuasor',    color: '#DC2626', icon: '✍️', promptFile: 'closer.md',        outputFile: '06-proposta-comercial.md',  inputFrom: 'financeiro',  handoffTo: 'apresentacao' },
  { id: 'apresentacao',  name: 'Apresentacao',  role: 'Designer',     color: '#EC4899', icon: '🎨', promptFile: 'apresentacao.md',  outputFile: '07-landing-spec.md',        inputFrom: 'closer',      handoffTo: 'complete' },
];

// --- Pipeline Types ---
export type PipelineStatus = 'idle' | 'executing' | 'approval_required' | 'completed' | 'error';

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
  status: 'pending' | 'executing' | 'completed' | 'error';
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

// --- Configuration Types ---
export interface PipelineConfig {
  approvalRequired: Partial<Record<AgentId, boolean>>;
  agentTimeout: number;
  maxRetries: number;
}

export const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  approvalRequired: {
    organizador: true,
    closer: true,
  },
  agentTimeout: 120_000,
  maxRetries: 1,
};
```

---

## 5. Data Flow Diagrams

### 5.1 Pipeline Execution Flow

```
User clicks "Start Mission"
         │
         ▼
[Frontend] ──socket.emit('pipeline:start', { prompt })──► [Backend]
                                                              │
                                                  orchestrator.start(sessionId, prompt)
                                                              │
                                                    ┌─────────▼──────────┐
                                                    │ For each agent 1-7: │
                                                    │                     │
                                                    │  1. Load system     │
                                                    │     prompt          │
                                                    │  2. Call Claude     │
                                                    │     Adapter         │
                                                    │  3. Parse response  │
                                                    │  4. Save artifact   │
                                                    │  5. Broadcast       │
                                                    │     update          │
                                                    │  6. Check approval  │
                                                    │     required?       │
                                                    │     YES → pause     │
                                                    │     NO  → next step │
                                                    └─────────┬──────────┘
                                                              │
                                       socket.emit('pipeline-update')
                                                              │
[Frontend] ◄──────────────────────────────────────────────────┘
     │
     ▼
Zustand store updated → React re-renders UI → Phaser moves Neo
```

### 5.2 Approval Flow

```
[Backend] ──socket.emit('approval-required', { agent, artifact })──► [Frontend]
                                                                         │
                                                              ApprovalPopup appears
                                                              Neo plays idle animation
                                                              Timer pauses
                                                                         │
                                                              ┌──────────┼──────────┐
                                                              ▼          ▼          ▼
                                                          [Approve]  [Edit]    [Back]
                                                              │          │          │
                                              socket.emit     │   Opens   │  socket.emit
                                              ('approve')     │  Editor   │  ('rollback')
                                                              │          │          │
[Backend] ◄───────────────────────────────────────────────────┘          │          │
     │                                                                    │          │
     ▼                                                                    ▼          ▼
orchestrator.approve()                                    ArtifactEditor  orchestrator.rollback()
     │                                                    User edits      Reset steps
     ▼                                                    Save via PUT    Re-execute agent
advanceToNext()                                           Then approve
```

### 5.3 Artifact Storage Layout

```
docs/artifacts/
└── {sessionId}/                          # UUID v4, e.g., a1b2c3d4-...
    ├── pipeline-state.json               # Current state (persisted)
    ├── index.json                        # Artifact manifest
    ├── 01-briefing-previo.md             # Pesquisa output
    ├── 02-briefing-organizado.md         # Organizador output
    ├── 03-ideias-solucoes.md             # Solucoes output
    ├── 04-estruturas-produtos.md         # Estruturas output
    ├── 05-analise-financeira.md          # Financeiro output
    ├── 06-proposta-comercial.md          # Closer output
    └── landing-page/                     # Apresentacao output
        ├── index.html
        └── styles.css
```

**Artifact YAML Frontmatter:**

```yaml
---
agent: pesquisa
sessionId: a1b2c3d4-e5f6-7890-abcd-ef1234567890
createdAt: 2026-02-27T14:30:00.000Z
status: completed
step: 1
---

# Briefing Previo — Empresa XYZ
...
```

---

## 6. Security Architecture

### 6.1 Threat Model (Local-First MVP)

| Threat | Risk Level | Mitigation |
|--------|------------|------------|
| Client data leakage | LOW (local only) | No external API calls with client data; filesystem only |
| WebSocket hijacking | LOW (localhost) | Bind to 127.0.0.1 only; no external access |
| Path traversal (artifact API) | MEDIUM | Validate session/filename params; use `path.resolve` + whitelist |
| Claude Code injection | LOW | System prompts are static files, not user-controlled |
| XSS via artifact content | MEDIUM | Sanitize Markdown before rendering; use DOMPurify |
| Session ID collision | LOW | UUID v4 = 2^122 possibilities |

### 6.2 Implementation Rules

1. **Backend binds to `127.0.0.1`** only (not `0.0.0.0`)
2. **Artifact paths validated**: `path.resolve(baseDir, sessionId, filename)` must start with `baseDir`
3. **No `eval()` or `Function()`** anywhere in codebase
4. **DOMPurify** for all Markdown→HTML rendering in frontend
5. **Winston sanitizer**: strip potential PII from log messages
6. **`.env` in `.gitignore`**: never commit secrets

---

## 7. Performance Architecture

### 7.1 Frontend Performance Budget

| Metric | Target | Strategy |
|--------|--------|----------|
| Bundle size | < 500KB gzipped | Vite tree-shaking; lazy load Phaser |
| TTI | < 3s | Code split: load Phaser async after initial React render |
| FPS (Phaser) | 60fps | Object pool for particles; cap rain columns at 40 |
| Memory (2h) | < 200MB growth | Destroy Phaser objects on pipeline reset; WeakRef for caches |

### 7.2 Code Splitting Strategy

```typescript
// Phaser loaded lazily — not in initial bundle
const GameCanvas = lazy(() => import('./components/GameCanvas'));

// Artifact editor loaded on demand
const ArtifactEditor = lazy(() => import('./components/ArtifactEditor'));

// Victory screen loaded on demand
const VictoryScreen = lazy(() => import('./components/VictoryScreen'));
```

### 7.3 WebSocket Throttling

```typescript
// Backend: batch rapid updates
class SocketThrottler {
  private queue: Map<string, any> = new Map();
  private interval: NodeJS.Timeout;

  constructor(private socket: SocketServer, private maxPerSecond = 10) {
    this.interval = setInterval(() => this.flush(), 1000 / maxPerSecond);
  }

  emit(event: string, data: any) {
    this.queue.set(event, data); // Latest value wins (dedup)
  }

  private flush() {
    for (const [event, data] of this.queue) {
      this.socket.broadcast(event, data);
    }
    this.queue.clear();
  }
}
```

### 7.4 Phaser Object Pooling

```typescript
// Reuse particle objects instead of creating/destroying
class ParticlePool {
  private pool: Phaser.GameObjects.Sprite[] = [];

  acquire(scene: Phaser.Scene): Phaser.GameObjects.Sprite {
    const sprite = this.pool.pop() || scene.add.sprite(0, 0, 'particle');
    sprite.setActive(true).setVisible(true);
    return sprite;
  }

  release(sprite: Phaser.GameObjects.Sprite) {
    sprite.setActive(false).setVisible(false);
    this.pool.push(sprite);
  }
}
```

---

## 8. Monorepo Structure

### 8.1 Final Directory Layout

```
squad-playground/
├── package.json                      # Root: workspaces, dev scripts
├── tsconfig.base.json                # Shared TypeScript config
├── .eslintrc.js                      # Shared ESLint config
├── .prettierrc                       # Shared Prettier config
├── .gitignore
├── .env.example                      # Environment variables template
├── README.md
│
├── shared/                           # Shared package
│   ├── package.json
│   ├── tsconfig.json
│   └── types.ts                      # All shared TypeScript types
│
├── frontend/                         # React + Phaser frontend
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── index.html
│   ├── public/
│   │   ├── favicon.ico
│   │   └── assets/
│   │       ├── sprites/
│   │       │   ├── neo-spritesheet.png
│   │       │   └── neo-atlas.json
│   │       ├── houses/              # Agent house assets
│   │       └── fonts/               # Press Start 2P (local)
│   └── src/
│       ├── main.tsx                 # Entry point
│       ├── App.tsx                  # Root component
│       ├── components/              # React UI components
│       ├── game/                    # Phaser game code
│       │   ├── PipelineScene.ts
│       │   ├── NeoCharacter.ts
│       │   ├── AgentHouseSprite.ts
│       │   ├── WorldEnvironment.ts
│       │   └── EffectsManager.ts
│       ├── stores/                  # Zustand stores
│       ├── hooks/                   # Custom React hooks
│       ├── utils/                   # Frontend utilities
│       └── styles/
│           └── globals.css          # Tailwind imports + Matrix vars
│
├── backend/                         # Node.js backend
│   ├── package.json
│   ├── tsconfig.json
│   ├── nodemon.json
│   └── src/
│       ├── index.ts
│       ├── config/
│       ├── server/
│       ├── pipeline/
│       ├── parser/
│       ├── integration/
│       ├── artifacts/
│       ├── routes/
│       └── utils/
│
├── agents/                          # Agent system prompts
│   ├── master.md
│   ├── pesquisa.md
│   ├── organizador.md
│   ├── solucoes.md
│   ├── estruturas.md
│   ├── financeiro.md
│   ├── closer.md
│   ├── apresentacao.md
│   └── mocks/                       # Mock responses for dev
│       ├── pesquisa-response.md
│       └── ...
│
├── docs/
│   ├── prd/
│   │   └── squad-playground-matrix.md
│   ├── architecture/
│   │   └── system-architecture.md   # THIS FILE
│   ├── guide/
│   │   ├── user-guide.md
│   │   ├── agent-guide.md
│   │   └── customization.md
│   └── artifacts/                   # Generated session artifacts
│       └── .gitkeep
│
└── scripts/
    ├── test-websocket.js            # WebSocket test script
    └── dev.sh                       # Start both frontend + backend
```

### 8.2 NPM Workspace Configuration

```json
// === Root package.json ===
{
  "name": "squad-playground",
  "private": true,
  "workspaces": ["shared", "frontend", "backend"],
  "scripts": {
    "dev": "concurrently \"npm run dev -w backend\" \"npm run dev -w frontend\"",
    "build": "npm run build -w shared && npm run build -w backend && npm run build -w frontend",
    "test": "npm run test -w backend && npm run test -w frontend",
    "lint": "eslint . --ext .ts,.tsx",
    "typecheck": "tsc --noEmit -p frontend/tsconfig.json && tsc --noEmit -p backend/tsconfig.json"
  },
  "devDependencies": {
    "concurrently": "^8.2.0",
    "eslint": "^8.50.0",
    "prettier": "^3.0.0",
    "typescript": "^5.2.0"
  }
}
```

---

## 9. Architectural Risk Register

| Risk | Probability | Impact | Mitigation | Owner |
|------|-------------|--------|------------|-------|
| Claude Code Remote API instability | MEDIUM | HIGH | Adapter pattern isolates; mock adapter enables development without Claude | @dev |
| Phaser 3 + React conflict (rendering, events) | LOW | HIGH | Strict separation: Phaser reads Zustand only; React DOM overlay; no direct DOM manipulation from Phaser | @dev |
| WebSocket memory leak in 2h+ sessions | MEDIUM | MEDIUM | Heartbeat mechanism; throttled events; Phaser object pooling; periodic heap checks | @dev |
| Parser fails on unexpected agent output | HIGH | MEDIUM | Regex with fallback mode; logs malformed input; UI shows generic message | @dev |
| Pixel art sprite creation delays | MEDIUM | LOW | Fallback placeholder (colored rectangle) from day 1; sprite is cosmetic enhancement | @ux |
| Landing page quality inconsistent | MEDIUM | MEDIUM | Apresentacao agent uses specific HTML template; post-generation Lighthouse check | @dev |

---

## 10. Architecture Validation Checklist

- [x] All 41 FRs mapped to architectural components
- [x] All 20 NFRs addressed with specific strategies
- [x] Frontend: React DOM + Phaser 3 dual-layer defined
- [x] Backend: Pipeline state machine with persist/rollback
- [x] Shared: Protocol spec with parser implementation
- [x] Data flow: WebSocket events fully specified
- [x] Security: Local-first, path validation, DOMPurify
- [x] Performance: Bundle budget, object pooling, throttling
- [x] Monorepo: Workspace structure with shared types
- [x] Testing: Strategy per layer (unit/integration/e2e)
- [x] Risk register: 6 risks identified with mitigations

---

## 11. Next Steps

### For @ux-design-expert:
> Review this architecture document alongside the PRD. Focus on: (1) the dual-layer rendering model — understand that React DOM sits above Phaser canvas, (2) the 8 agent house positions in the 4000x600 world, (3) the Neo sprite sheet spec (32x32, 25 frames, 7 animations). Create wireframes and pixel art style guide that work within these technical constraints. Output to `docs/architecture/ux-spec.md`.

### For @dev:
> Start with Epic 1 stories using this architecture as guide. Key files to create first: `shared/types.ts` (all types from Section 4.3), `backend/src/parser/agent-parser.ts` (parser from Section 4.2), and the monorepo structure from Section 8.1. Use `ClaudeMockAdapter` during Epic 1 — no real Claude Code integration needed yet.

---

_Squad Playground System Architecture v1.0 — Aria, arquitetando o futuro_
