# Squad Playground — Matrix Pipeline PRD

## Product Requirements Document (PRD)

**Project:** Squad Playground - Dashboard Visual Gamificado para Consultoria em IA
**Version:** 1.0
**Author:** Morgan (PM) + Sancho
**Date:** 2026-02-27
**Status:** Ready for Architect

---

## 1. Goals and Background Context

### 1.1 Goals

- Transformar a experiencia de consultoria em IA de texto puro (terminal) em uma dashboard visual gamificada estilo Matrix
- Criar pipeline automatizado de 8 agentes especializados (1 MASTER + 7 especialistas) que executam consultoria end-to-end
- Reduzir tempo de preparacao de propostas comerciais de 4-6h manual para 30-60min automatizado
- Aumentar taxa de aprovacao de propostas pela diretoria de clientes para 80%+
- Gamificar a experiencia com gameplay Matrix (personagem Neo pixel art andando entre casas dos agentes)
- Gerar artefatos profissionais automaticamente (briefing, analise financeira, proposta editavel, landing page)

### 1.2 Background Context

Atualmente, o processo de consultoria em solucoes de IA e manual, demorado e propenso a inconsistencias. Consultores gastam 4-6 horas preparando briefings, pesquisando mercado, estruturando propostas e criando apresentacoes para cada cliente. Este tempo poderia ser drasticamente reduzido com automacao inteligente.

O Squad Playground surge como solucao para orquestrar multiplos agentes de IA especializados em um pipeline sequencial que cobre todas as etapas: pesquisa inicial, organizacao de dados pos-reuniao, ideacao criativa, estruturacao tecnica, analise financeira, copywriting persuasivo e design de apresentacao. A gamificacao Matrix com o personagem Neo em pixel art torna a experiencia unica, memoravel e demonstra visualmente o poder da IA para os proprios clientes.

### 1.3 Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-02-27 | 1.0 | PRD inicial criado | Morgan (PM) + Sancho |

---

## 2. Requirements

### 2.1 Functional Requirements

#### Pipeline e Orquestracao de Agentes

- **FR1:** O sistema deve suportar 8 agentes distintos (1 MASTER CEO + 7 especialistas: Pesquisa, Organizador, Solucoes, Estruturas, Financeiro, Closer, Apresentacao)
- **FR2:** O agente MASTER deve delegar tarefas sequencialmente para os especialistas seguindo o pipeline de consultoria
- **FR3:** Cada agente deve seguir protocolo estruturado de output com tags `[AGENT:Nome][STATUS:estado][TASKS]...[/TASKS][OUTPUT]...[/OUTPUT][HANDOFF:Proximo]`
- **FR4:** O sistema deve detectar automaticamente qual agente esta ativo baseado no parsing do output do terminal
- **FR5:** Handoff entre agentes deve ser automatico quando modo hibrido estiver em "auto", ou manual quando em "aprovacao"

#### Interface Visual - Gameplay Matrix

- **FR6:** A dashboard deve exibir 8 "casas" em layout horizontal side-scrolling representando cada agente
- **FR7:** Cada casa deve ter tema visual unico baseado na funcao do agente (cores, icones, decoracao)
- **FR8:** Fundo da dashboard deve ter chuva de codigo Matrix (caracteres verdes caindo) com intensidade ajustavel
- **FR9:** Camera deve seguir o personagem Neo automaticamente com scroll horizontal suave (parallax)
- **FR10:** Indicadores de status devem ser exibidos em cada casa: Aguardando, Processando, Concluido
- **FR11:** Baloes de mensagem devem aparecer acima da casa ativa mostrando o que o agente esta fazendo
- **FR12:** Popup de tarefas deve deslizar da lateral direita quando agente gera lista de tasks, com checkboxes que atualizam em tempo real

#### Personagem Neo (Pixel Art)

- **FR13:** Personagem Neo deve ter visual pixel art (32x32 pixels) com roupa preta e oculos escuros estilo Matrix
- **FR14:** Neo deve ter 7 animacoes: Walking, Running, Idle, Processing, Success, Enter House, Exit House
- **FR15:** Neo deve andar automaticamente da casa atual ate a proxima quando agente for ativado
- **FR16:** Ao chegar na porta da casa, Neo deve entrar com animacao de fade digital (pixels desmaterializando)
- **FR17:** Quando agente completa tarefa, Neo deve sair da casa com artefato coletavel flutuando (visual de download)
- **FR18:** Neo deve deixar rastro verde Matrix desvanecendo enquanto anda
- **FR19:** Durante processamento, Neo deve ter aura verde pulsante e codigo Matrix ao redor

#### Artefatos Gerados

- **FR20:** Agente Pesquisa deve gerar `briefing-previo.md` em formato Markdown editavel
- **FR21:** Agente Organizador deve gerar `briefing-organizado.md` em formato Markdown editavel
- **FR22:** Agente Solucoes deve gerar `ideias-solucoes.md` com 3-5 ideias de produtos IA
- **FR23:** Agente Estruturas deve gerar `estruturas-produtos.md` com PRDs tecnicos de cada ideia
- **FR24:** Agente Financeiro deve gerar `analise-financeira.md` com pesquisa de mercado, ROI, tempo estimado
- **FR25:** Agente Closer deve gerar `proposta-comercial.md` em Markdown com copy persuasiva aplicando frameworks AIDA/PAS
- **FR26:** Agente Apresentacao deve gerar landing page em HTML/CSS/JS com framework moderno
- **FR27:** Todos os artefatos devem ser salvos em `docs/artifacts/{session-id}/` com versionamento opcional via Git

#### Interacao Humana e Controle

- **FR28:** O sistema deve pausar automaticamente apos cada etapa critica e exibir popup: "Aprovar [artefato]?" com botoes [Aprovar] [Editar] [Voltar]
- **FR29:** Usuario deve poder editar qualquer artefato inline antes de aprovar e continuar pipeline
- **FR30:** Modo hibrido deve permitir configurar quais etapas sao automaticas vs requerem aprovacao manual
- **FR31:** Usuario deve poder pausar pipeline a qualquer momento e retomar de onde parou
- **FR32:** Usuario deve poder "voltar para etapa anterior" e reprocessar com ajustes
- **FR33:** Campo de input de comandos deve ter historico navegavel via setas tipo terminal

#### WebSocket e Comunicacao Backend

- **FR34:** Backend Node.js deve capturar outputs do Claude Code Remote em tempo real
- **FR35:** Backend deve fazer parsing dos outputs usando regex robusto com fallback para mensagens genericas
- **FR36:** WebSocket deve transmitir dados estruturados para frontend: `{agent, status, message, tasks[], artifact}`
- **FR37:** Frontend deve receber updates via WebSocket e atualizar interface sem refresh de pagina

#### Gamificacao e Feedback

- **FR38:** Sistema de pontuacao: +1 moeda por artefato gerado, +1 estrela por etapa completada
- **FR39:** HUD (heads-up display) no canto da tela mostrando: moedas coletadas, estrelas, tempo decorrido
- **FR40:** Ao completar pipeline completo, exibir tela de vitoria com Neo em pose de sucesso e explosao de particulas verdes
- **FR41:** Botao de download de todos os artefatos em ZIP ao final do pipeline

### 2.2 Non-Functional Requirements

#### Performance

- **NFR1:** Latencia entre output do agente e atualizacao visual na dashboard deve ser < 500ms
- **NFR2:** Animacoes do personagem Neo devem rodar a 60fps consistente
- **NFR3:** Dashboard deve suportar sessoes de 2+ horas sem memory leaks ou degradacao de performance
- **NFR4:** Parsing de outputs deve processar mensagens de ate 10.000 caracteres sem lag perceptivel
- **NFR5:** WebSocket deve manter conexao estavel por 2+ horas com auto-reconnect em caso de queda

#### Qualidade e Confiabilidade

- **NFR6:** Parsing de protocolo de agentes deve ter acuracia de 95%+ na identificacao correta do agente
- **NFR7:** Sistema deve ter fallback para mensagens que nao seguem protocolo (exibir como mensagem generica)
- **NFR8:** Artefatos devem ser salvos incrementalmente (auto-save) para evitar perda de dados
- **NFR9:** Logs detalhados devem ser mantidos para debug (Winston ou similar) com niveis: error, warn, info, debug
- **NFR10:** Sistema deve recuperar gracefully de erros de parsing sem crashar a interface

#### Compatibilidade e Acessibilidade

- **NFR11:** Dashboard deve funcionar em Chrome, Firefox, Edge (ultimas 2 versoes)
- **NFR12:** Interface deve ser responsiva para resolucoes de 1080p (1920x1080) e superiores
- **NFR13:** Fonte do codigo Matrix deve ser monospace legivel (ex: Fira Code, JetBrains Mono)
- **NFR14:** Contraste de cores deve seguir WCAG AA minimo (verde Matrix #22C55E sobre preto #0D0D0D)

#### Seguranca e Privacidade

- **NFR15:** Artefatos de clientes devem ser salvos localmente (nao enviados para servidores externos)
- **NFR16:** Session IDs devem ser unicos e nao colidir (UUID v4 ou similar)
- **NFR17:** Dados sensiveis de clientes nao devem ser logados em plaintext

#### Manutenibilidade

- **NFR18:** Codigo frontend deve usar TypeScript com tipos estritos
- **NFR19:** Componentes React devem ser modulares e reutilizaveis
- **NFR20:** Protocolo de agentes deve ser documentado em `docs/protocol.md` com exemplos

---

## 3. User Interface Design Goals

### 3.1 Overall UX Vision

O Squad Playground deve proporcionar uma experiencia imersiva e gamificada que transforma o processo tecnico de consultoria em IA em uma jornada visual envolvente estilo Matrix.

**Pilares da Visao UX:**

1. **Imersao Matrix:** Estetica cyberpunk com chuva de codigo, paleta verde neon sobre preto, efeitos glitch e digitais
2. **Gamificacao Intuitiva:** Progresso visual claro (Neo andando, casas acendendo, artefatos sendo coletados)
3. **Transparencia do Pipeline:** Usuario sempre sabe "onde estamos", "o que esta acontecendo" e "o que vem a seguir"
4. **Controle sem Friccao:** Intervencoes humanas sao seamless (popups nao invasivos, edicao inline)
5. **Celebracao de Conquistas:** Cada etapa completada e recompensada visualmente

### 3.2 Key Interaction Paradigms

1. **Observe-First, Intervene-When-Needed** — Sistema roda automaticamente, usuario observa e intervem em pontos criticos
2. **Click-to-Explore, Hover-to-Preview** — Hover mostra preview, Click abre artefato completo
3. **Inline Editing com Auto-Save** — Edicao direto na dashboard com salvamento automatico
4. **Keyboard Shortcuts** — Space (pausar), Enter (aprovar), E (editar), B (voltar), D (download)
5. **Scroll Horizontal Natural** — Camera segue Neo, usuario pode scroll manual

### 3.3 Core Screens and Views

1. **Dashboard Principal (Main Gameplay View)** — Side-scrolling com 8 casas, Neo, chuva de codigo, HUD
2. **Popup de Aprovacao (Approval Modal)** — Preview do artefato com [Aprovar] [Editar] [Voltar]
3. **Editor Inline de Artefatos (Artifact Editor)** — Painel lateral com editor Markdown WYSIWYG
4. **Painel de Tarefas (Tasks Sidebar)** — Lista de checkboxes com progresso em tempo real
5. **Tela de Vitoria (Success Screen)** — Neo em pose de vitoria, stats, botao de download
6. **Painel de Configuracoes (Settings Panel)** — Toggles para efeitos visuais, pontos de aprovacao

### 3.4 Accessibility

**Nivel Alvo:** WCAG AA

- Contraste verde #22C55E sobre preto #0D0D0D = 7.8:1 (passa WCAG AAA)
- Navegacao por teclado (Tab, atalhos documentados)
- Aria-labels em elementos interativos
- Toggle "Reduzir Animacoes" para motion sickness
- Tamanho minimo de texto: 14px, linha de altura 1.5

### 3.5 Branding

**Identidade Visual: "Matrix Consultancy Suite"**

```css
--matrix-black: #0D0D0D
--matrix-green: #22C55E
--matrix-dark-green: #166534
--matrix-neon: #10B981
--gold: #F59E0B
--white: #FFFFFF
--gray: #6B7280
--red: #EF4444
```

**Tipografia:**
- UI: Inter (sans-serif)
- Codigo/Terminal: JetBrains Mono (monospace)
- Titulos: Press Start 2P (pixel art, uso moderado)

### 3.6 Target Device and Platforms

**Primario:** Web Responsive (Desktop-First)

| Plataforma | Suporte | Resolucao Minima |
|------------|---------|------------------|
| Desktop (Chrome) | Primario | 1920x1080 |
| Desktop (Firefox) | Primario | 1920x1080 |
| Desktop (Edge) | Primario | 1920x1080 |
| Desktop (Safari) | Secundario | 1920x1080 |
| Tablet/Mobile | Nao suportado inicialmente | - |

---

## 4. Technical Assumptions

### 4.1 Repository Structure: Monorepo

```
squad-playground/
├── frontend/          # React + TypeScript (Dashboard)
├── backend/           # Node.js + Express (Bridge)
├── agents/            # System prompts dos 8 agentes
├── docs/              # PRDs, arquitetura, artifacts
├── shared/            # Tipos TypeScript compartilhados
└── scripts/           # Utilitarios (setup, build, deploy)
```

### 4.2 Service Architecture: Monolith com Separacao de Camadas

```
Frontend (React SPA + Phaser 3) → WebSocket → Backend (Node.js + Express) → Claude Code Remote API
```

### 4.3 Testing Requirements: Unit + Integration

| Tipo | Cobertura | Ferramentas |
|------|-----------|-------------|
| Unit | 70%+ | Jest + Testing Library |
| Integration | Criticos | Jest + Supertest |
| E2E | Smoke tests | Playwright |

### 4.4 Stack Tecnologico

**Frontend:**
- React 18 + TypeScript 5 + Vite 5
- Phaser 3.60+ (game engine para gameplay Matrix)
- Tailwind CSS 3 + Framer Motion
- Zustand (state management)
- Socket.io-client

**Backend:**
- Node.js 18+ LTS + Express 4
- Socket.io 4 (WebSocket server)
- Winston 3 (logging)
- Zod (validation)

**Agentes:**
- Claude Code Remote/Headless API
- 8 system prompts em Markdown

**DevOps:**
- Git + GitHub + GitHub Actions
- Frontend: Vercel (producao)
- Backend: Railway (producao)

### 4.5 Deployment Strategy

**MVP:** Local-First (localhost:5173 + localhost:3000)
**Producao:** Vercel (frontend) + Railway (backend) + Local (Claude Code)

### 4.6 Additional Technical Assumptions

- Dados de clientes NAO saem da maquina local
- WebSocket usa localhost apenas (MVP)
- Session IDs sao UUID v4
- Sem banco de dados — filesystem e suficiente para artefatos Markdown
- Phaser 3 integra com React via componente wrapper (canvas within React DOM)
- Sprite sheet do Neo em pixel art 32x32, criado com Aseprite ou similar
- Landing page gerada como HTML/CSS/JS standalone (single file ou folder)

---

## 5. Epic List

### Epic 1: Foundation & Visual Dashboard (5 dias)
Estabelecer infraestrutura tecnica completa (monorepo, frontend/backend, WebSocket) e entregar dashboard visual funcional com 8 casas de agentes em layout side-scrolling horizontal com tema Matrix usando dados mockados.

### Epic 2: Agent Pipeline & Protocol Integration (5 dias)
Integrar os 8 agentes com Claude Code Remote, implementar protocolo estruturado de outputs, parser robusto, e handoff automatico entre agentes para executar pipeline completo end-to-end gerando 7 artefatos.

### Epic 3: Matrix Gameplay Experience (7 dias)
Criar personagem Neo em pixel art com animacoes, integrar Phaser 3 para gameplay side-scrolling, implementar movimento automatico, efeitos Matrix (chuva de codigo, glitch, particulas), e sistema de gamificacao.

### Epic 4: Production Ready & Final Artifacts (10 dias)
Implementar intervencao humana, geradores de artefatos finais profissionais (proposta editavel + landing page), polish visual, testes de estabilidade (2h+ sessions), e documentacao completa.

**Total: 28 stories | 27 dias uteis | ~5.4 semanas**

---

## 6. Epic Details

### 6.1 Epic 1: Foundation & Visual Dashboard

**Goal:** Estabelecer infraestrutura tecnica completa e entregar dashboard visual funcional com 8 casas e WebSocket usando dados mockados para validacao.

#### Story 1.1: Project Setup & Monorepo Structure

**As a** developer,
**I want** to set up the monorepo structure with frontend, backend, and shared folders configured with TypeScript, linting, and build tools,
**so that** I have a solid foundation to develop both client and server code with type safety and consistent code quality.

**Acceptance Criteria:**
1. Monorepo created at `/squad-playground/` with folders: `frontend/`, `backend/`, `shared/`, `docs/`, `scripts/`
2. Root `package.json` with workspaces configured for `frontend` and `backend`
3. `frontend/package.json` includes: `react@18.2+`, `vite@5+`, `typescript@5+`, `tailwindcss@3+`
4. `backend/package.json` includes: `express@4+`, `socket.io@4+`, `typescript@5+`, `winston@3+`
5. TypeScript configured in both frontend and backend with strict mode enabled
6. ESLint + Prettier configured with shared rules in root
7. `.gitignore` excludes `node_modules/`, `dist/`, `.env`, `docs/artifacts/`
8. `README.md` in root with setup instructions: `npm install && npm run dev`
9. Running `npm run dev` from root starts both frontend (port 5173) and backend (port 3000) in parallel
10. No console errors when running dev servers

#### Story 1.2: Backend WebSocket Server

**As a** backend developer,
**I want** to create an Express server with Socket.io WebSocket support that can accept connections and echo messages,
**so that** I can validate the real-time communication layer works before implementing complex business logic.

**Acceptance Criteria:**
1. Express server running on `http://localhost:3000`
2. Socket.io server attached to Express, listening on same port
3. Health check endpoint: `GET /health` returns `{ status: 'ok', timestamp: ISO }` with 200 status
4. WebSocket accepts connections on `ws://localhost:3000`
5. Server logs connection events: "Client connected: {socketId}" using Winston
6. Server implements ping-pong test: client sends `{ type: 'ping' }`, server responds `{ type: 'pong', timestamp: ISO }`
7. Server logs all incoming messages at `info` level
8. Server handles client disconnection gracefully, logs: "Client disconnected: {socketId}"
9. Environment variables loaded from `.env` file (port, log level)
10. Running `npm run dev` in `backend/` starts server with nodemon (auto-restart on changes)

#### Story 1.3: Frontend Base & WebSocket Client

**As a** frontend developer,
**I want** to create a React app with Vite, Tailwind CSS, and Socket.io-client that connects to the backend WebSocket,
**so that** I can build the UI and validate bidirectional communication between client and server.

**Acceptance Criteria:**
1. React 18 app scaffolded with Vite, running on `http://localhost:5173`
2. Tailwind CSS configured with Matrix color palette in `tailwind.config.js`
3. Socket.io-client connects to `ws://localhost:3000` on app mount
4. Connection status displayed in UI: "Connected" (green) or "Disconnected" (red)
5. Test button "Send Ping" triggers client to send `{ type: 'ping' }` to server
6. Client receives pong response and displays: "Pong received at {timestamp}"
7. TypeScript types defined in `shared/types.ts`: `SocketMessage`, `ConnectionStatus`
8. Console logs connection events: "WebSocket connected", "WebSocket disconnected"
9. App has dark background and green text as default Matrix theme
10. Running `npm run dev` in `frontend/` starts Vite dev server with HMR working

#### Story 1.4: Agent Protocol Parser (Backend)

**As a** backend developer,
**I want** to implement a parser that extracts agent name, status, tasks, and messages from structured output strings,
**so that** I can transform raw terminal outputs into structured data that the frontend can render visually.

**Acceptance Criteria:**
1. Parser module created at `backend/src/parser/agent-parser.ts`
2. Parser extracts data from protocol format: `[AGENT:Name][STATUS:state] message [TASKS]...[/TASKS] [OUTPUT:file]...[/OUTPUT] [HANDOFF:Next]`
3. Parser returns TypeScript object: `{ agent, status, message, tasks[], output, handoff }`
4. Parser handles missing sections gracefully (returns null/undefined for missing fields)
5. Parser has fallback mode: if no `[AGENT:...]` tag found, returns `{ agent: 'unknown', message: rawText }`
6. Unit tests with Jest covering: valid parsing, missing sections, malformed input, empty strings, long messages (10,000+ chars)
7. Test coverage >= 90% for parser module
8. Parser logs warnings for malformed inputs using Winston
9. TypeScript types exported to `shared/types.ts`: `ParsedAgentMessage`, `Task`
10. Parser exports function: `parseAgentOutput(raw: string): ParsedAgentMessage`

#### Story 1.5: Dashboard Layout & 8 Agent Houses

**As a** user,
**I want** to see a side-scrolling horizontal dashboard with 8 distinct "houses" representing each agent in the pipeline,
**so that** I can visually understand the structure of the consultancy workflow and which agents are involved.

**Acceptance Criteria:**
1. Dashboard component created at `frontend/src/components/Dashboard.tsx`
2. Layout is horizontal side-scrolling container
3. 8 agent houses rendered in sequence: MASTER, Pesquisa, Organizador, Solucoes, Estruturas, Financeiro, Closer, Apresentacao
4. Each house is a card/box component (`AgentHouse.tsx`) with: unique color, agent name, icon/emoji, status indicator
5. Houses evenly spaced with visual connectors (bridges/paths)
6. Minimum house width: 200px, height: 250px
7. Smooth scroll behavior
8. Houses responsive: on smaller screens scale down proportionally
9. Zustand store: `useAgentStore.ts` with state: `agents: AgentState[]`
10. Dashboard reads from Zustand store and renders houses dynamically

**Agent Color Palette:**
- MASTER: #8B5CF6 (Roxo Imperial)
- Pesquisa: #2563EB (Azul Safira)
- Organizador: #059669 (Verde Esmeralda)
- Solucoes: #F59E0B (Amarelo Criativo)
- Estruturas: #374151 (Cinza Carvao)
- Financeiro: #10B981 (Verde Dinheiro)
- Closer: #DC2626 (Vermelho Persuasivo)
- Apresentacao: #EC4899 (Rosa Criativo)

#### Story 1.6: Real-time State Sync via WebSocket

**As a** user,
**I want** agent houses to update their status in real-time when the backend sends WebSocket messages,
**so that** I can see live feedback as the pipeline progresses without refreshing the page.

**Acceptance Criteria:**
1. Backend mock endpoint: `POST /api/mock/agent-update` accepts `{ agent, status, message }`
2. Endpoint broadcasts message via WebSocket to all connected clients
3. Frontend listener updates Zustand store on `agent-update` event
4. AgentHouse component reacts: status indicator changes, border glows, message appears on hover
5. Latency from endpoint call to UI update < 500ms
6. Multiple rapid updates (5+/sec) don't cause UI jank
7. Frontend handles WebSocket reconnection within 3 seconds
8. Test script: `scripts/test-websocket.js` sends 8 sequential mock updates
9. Running test script shows all 8 houses lighting up sequentially
10. Reconnection counter displayed when connection drops

#### Story 1.7: Matrix Visual Theme & Effects

**As a** user,
**I want** the dashboard to have a Matrix-inspired visual theme with falling code rain, green neon accents, and cyberpunk aesthetics,
**so that** the experience feels immersive, unique, and aligned with the AI/tech theme of the project.

**Acceptance Criteria:**
1. Matrix code rain background: Canvas with green characters falling vertically, 30fps minimum
2. Global CSS: bg-matrix-black, text-white, accent text-matrix-green, borders border-matrix-green
3. Typography: Inter (UI), JetBrains Mono (code), Press Start 2P (titles)
4. Glow effects on active elements: box-shadow with green rgba
5. Status indicators styled: gray (waiting), yellow pulsing (processing), green (done)
6. Connector paths styled as green neon lines with subtle glow
7. Page title "SQUAD PLAYGROUND" in Press Start 2P with Matrix rain effect
8. Favicon: 32x32 green matrix-style icon
9. Loading state: animated "CONNECTING..." text
10. 60fps scroll maintained with Matrix rain active

---

### 6.2 Epic 2: Agent Pipeline & Protocol Integration

**Goal:** Integrar 8 agentes com Claude Code Remote, implementar protocolo de outputs, parser robusto, e handoff automatico para pipeline end-to-end gerando 7 artefatos.

#### Story 2.1: Agent Definitions & System Prompts

**As a** consultant,
**I want** 8 AI agents defined with detailed system prompts covering persona, responsibilities, output format, and handoff rules,
**so that** each agent knows exactly what to produce and how to pass work to the next agent in the pipeline.

**Acceptance Criteria:**
1. Directory `agents/` with 8 files: `master.md`, `pesquisa.md`, `organizador.md`, `solucoes.md`, `estruturas.md`, `financeiro.md`, `closer.md`, `apresentacao.md`
2. Each prompt defines: name, role, persona, input format, output format (protocol tags), handoff target
3. MASTER: delegation rules, monitoring, decision logic for auto vs manual handoff
4. Pesquisa: research methodology, briefing structure, output `briefing-previo.md`
5. Organizador: input notes/transcription, structured `briefing-organizado.md`
6. Solucoes: Walt Disney method (Dreamer/Realist/Critic), 3-5 ideas in `ideias-solucoes.md`
7. Estruturas: PRD-like output with scope/features/timeline in `estruturas-produtos.md`
8. Financeiro: market research, ROI, time/cost in `analise-financeira.md`
9. Closer: AIDA/PAS/StoryBrand frameworks, `proposta-comercial.md`
10. Apresentacao: landing page spec in `landing-spec.md`
11. All agents include protocol example in prompt
12. Shared TypeScript type `AgentDefinition` in `shared/types.ts`

#### Story 2.2: Claude Code Remote Integration

**As a** backend developer,
**I want** to connect the backend to Claude Code Remote/Headless API to send commands and receive streamed responses,
**so that** the system can delegate real work to Claude Code agents.

**Acceptance Criteria:**
1. Integration module: `backend/src/integration/claude-remote.ts`
2. Connects to Claude Code Remote using documented API/SDK
3. Function `sendCommand(prompt, systemPrompt): AsyncIterable<string>` with streaming
4. Each chunk emitted as event for real-time processing
5. Timeout: 120 seconds per agent call (configurable via env var)
6. Error handling: connection refused, timeout, invalid response, API errors
7. Retry logic: 1 automatic retry on transient errors
8. Test endpoint: `POST /api/test-agent` accepts `{ agentId, prompt }` with streamed response
9. Status endpoint: `GET /api/claude-status` returns `{ connected, lastPing }`
10. All interactions logged with Winston (prompt summary, response length, duration)

#### Story 2.3: Pipeline Orchestrator (MASTER Agent Logic)

**As a** backend developer,
**I want** the MASTER agent orchestration logic that sequentially delegates work through the 7 specialist agents,
**so that** a single consultancy request triggers the entire pipeline automatically with proper handoffs.

**Acceptance Criteria:**
1. Orchestrator module: `backend/src/pipeline/orchestrator.ts`
2. Pipeline ordered array: `['pesquisa', 'organizador', 'solucoes', 'estruturas', 'financeiro', 'closer', 'apresentacao']`
3. Function `startPipeline(sessionId, initialPrompt): void` starts sequential execution
4. Each step: load system prompt -> send to Claude Code -> parse response -> save artifact -> trigger next
5. State tracked in `PipelineState` with: sessionId, currentAgent, completedSteps[], artifacts[], startedAt, status
6. State persisted to `docs/artifacts/{sessionId}/pipeline-state.json`
7. WebSocket broadcasts state changes: `{ event: 'pipeline-update', agent, status, step, totalSteps }`
8. Hybrid mode: checks `pipelineConfig.approvalRequired[agentId]`, pauses if true
9. Resumes on `approve` event, re-runs on `reject` with feedback
10. Approval points configurable in `backend/config/pipeline.json`
11. Error handling: agent failure pauses pipeline, emits error, allows retry
12. Completion emits: `{ event: 'pipeline-complete', sessionId, duration, artifacts[] }`

#### Story 2.4: Artifact Generation & Storage

**As a** consultant,
**I want** each agent to generate its artifact as a Markdown file saved in an organized session directory,
**so that** I can access, review, and share all deliverables after pipeline completion.

**Acceptance Criteria:**
1. Session directory: `docs/artifacts/{sessionId}/`
2. Consistent naming: `01-briefing-previo.md` through `07-landing-spec.md`
3. Parser extracts content from `[OUTPUT:filename]...[/OUTPUT]` tags
4. YAML frontmatter in each file: agent, sessionId, createdAt, status
5. Fallback: if no [OUTPUT] block, saves entire response
6. Auto-save immediately after agent completes
7. Index file: `docs/artifacts/{sessionId}/index.json`
8. API: `GET /api/artifacts/{sessionId}` lists all artifacts
9. API: `GET /api/artifacts/{sessionId}/{filename}` returns raw Markdown
10. UTF-8 encoded, readable in any Markdown editor

#### Story 2.5: Frontend Pipeline Status & Message Bubbles

**As a** user,
**I want** the dashboard to show which agent is processing with a message bubble displaying activity,
**so that** I get live feedback about pipeline progress.

**Acceptance Criteria:**
1. Frontend handles `pipeline-update` events, updates Zustand store
2. Active house: yellow pulsing border, status 🔄
3. Completed houses: green border, status checkmark
4. Message bubble component above active house
5. Bubble shows: agent name, message text with typewriter animation (30 chars/sec)
6. Bubble auto-dismisses 5 seconds after completion
7. Progress bar at top: `Step 3/7 - Solucoes processing...`
8. Progress percentage: `(completedSteps / totalSteps) * 100`
9. On `approval-required`: house shows pause icon, placeholder popup appears
10. Pipeline error: house shows red indicator, error toast notification

---

### 6.3 Epic 3: Matrix Gameplay Experience

**Goal:** Criar personagem Neo em pixel art, integrar Phaser 3 para gameplay side-scrolling, implementar movimento automatico, efeitos Matrix, e sistema de gamificacao.

#### Story 3.1: Phaser 3 Integration with React

**As a** frontend developer,
**I want** to integrate Phaser 3 into the React app as a dedicated canvas component,
**so that** I can render game elements alongside React UI components without conflicts.

**Acceptance Criteria:**
1. Phaser 3.60+ installed as frontend dependency
2. `GameCanvas.tsx` renders Phaser instance inside a div ref
3. Config: canvas mode, transparent background, width=viewport, height=600px
4. React components render as DOM overlays on top of Phaser canvas
5. Communication via shared Zustand store
6. `PipelineScene.ts` as main gameplay scene
7. Scene loads without errors, placeholder ground shown
8. Window resize triggers Phaser resize
9. Phaser instance destroyed on React unmount (no memory leaks)
10. 60fps maintained alongside React UI

#### Story 3.2: Neo Character — Pixel Art Sprite & Animations

**As a** designer,
**I want** a Neo character sprite sheet in 32x32 pixel art with all required animations,
**so that** the character can be loaded into Phaser and animated for all gameplay states.

**Acceptance Criteria:**
1. Sprite sheet: `frontend/public/assets/sprites/neo-spritesheet.png`
2. Design: black trench coat, dark sunglasses with green Matrix reflection
3. Size: 32x32 pixels per frame
4. 7 animations: idle (2f), walk (6f), run (4f), processing (4f), success (3f), enter (3f), exit (3f) = 25 frames
5. Sprite sheet: 800x32 (25 frames x 32px)
6. Color palette: black, dark gray, white, matrix green, skin tone
7. Phaser sprite atlas JSON: `neo-atlas.json`
8. All 7 animations playable in Phaser scene
9. Scales cleanly to 2x/3x (pixel-perfect via setPixelArt)
10. Fallback: placeholder rectangle works with same animation API

#### Story 3.3: World Map — Agent Houses & Environment

**As a** user,
**I want** 8 themed houses in a Matrix cyberpunk environment with connecting paths,
**so that** the pipeline feels like a real game world.

**Acceptance Criteria:**
1. Horizontal world: 4000px wide x 600px tall
2. Ground: green neon line across bottom third
3. 8 houses positioned evenly, 400px apart
4. Each house unique visual asset (128x128px or 128x160px)
5. Colored glow matching agent color
6. Door sprite on each house: closed default, opens on Neo arrival
7. Connecting paths: green neon lines with pulse animation
8. Background parallax: far (dark grid), mid (code rain), near (ground + houses)
9. Agent names below houses in Press Start 2P font
10. World boundaries: Neo cannot walk past first/last house

#### Story 3.4: Neo Movement & Camera System

**As a** user,
**I want** Neo to automatically walk from house to house when agents are activated, with smooth camera following,
**so that** I can watch pipeline progress as a visual journey.

**Acceptance Criteria:**
1. Neo spawns at MASTER house position
2. On `pipeline-update`: Neo walks toward active agent's house
3. Walking speed: 150px/sec (configurable)
4. Walk animation while moving, idle when stopped
5. Camera follows with smooth lerp (0.1 factor)
6. Camera bounded by world boundaries
7. At target house: stop, enter animation, door opens, Neo fades out, house activates
8. Agent complete: Neo fades in, exit animation, collectible artifact appears, flies to HUD
9. Pipeline pause: Neo plays processing animation at house door
10. Movement queue: completes current movement before starting next

#### Story 3.5: Matrix Visual Effects

**As a** user,
**I want** immersive Matrix visual effects including code rain, glitch transitions, particle systems, and Neo's green trail,
**so that** the gameplay feels authentically cyberpunk.

**Acceptance Criteria:**
1. Code Rain: falling green characters, 30+ columns, intensity varies with agent state
2. Neo Trail: 3 green afterimage sprites with decreasing opacity, disappears 500ms after stop
3. Glitch Transition: 100ms RGB split on house enter/exit
4. Particle Burst: 20-30 green pixel particles on agent completion
5. House Glow: pulsing glow radius (10-30px over 2s cycle)
6. Ambient Particles: 10-15 floating green dots, slow movement
7. All effects toggle-able via settings store
8. "Reduce Motion" mode disables trail, glitch, particles
9. All effects combined: 55+ fps
10. Effects config in Zustand: `useEffectsStore.ts`

#### Story 3.6: Gamification HUD — Score, Stars & Timer

**As a** user,
**I want** a HUD showing collected artifacts, completed stages, and elapsed time,
**so that** the experience feels rewarding and I can track progress at a glance.

**Acceptance Criteria:**
1. HUD as React overlay, position fixed, top-right
2. Displays: Artifacts ({n}/7), Stages ({n}/7), Time (MM:SS)
3. Matrix theme: semi-transparent black, green border, monospace
4. Artifact collected: coin icon scales up 1.5x with "+1" floating text
5. Stage complete: star rotates 360 deg with green glow
6. Max width 200px, non-intrusive
7. Hides during approval popups
8. Timer pauses when pipeline paused
9. Pipeline complete: gold border animation, "COMPLETE!" text
10. Values sync with Zustand: `useGameStore.ts`

---

### 6.4 Epic 4: Production Ready & Final Artifacts

**Goal:** Implementar intervencao humana, geradores de artefatos finais profissionais (proposta editavel + landing page), polish visual, testes de estabilidade (2h+), e documentacao.

#### Story 4.1: Approval Popup & Flow Control

**As a** consultant,
**I want** an approval popup at critical pipeline steps with options to approve, edit, or go back,
**so that** I maintain control over deliverable quality.

**Acceptance Criteria:**
1. `ApprovalPopup.tsx` as modal overlay
2. Triggered by `approval-required` WebSocket event
3. Shows: agent name/icon, artifact preview (rendered Markdown), three buttons
4. Approve: sends approve event, closes popup, Neo resumes
5. Edit: opens inline editor with artifact pre-loaded
6. Back: sends rollback event, pipeline re-runs previous agent
7. Neo plays processing animation while popup visible
8. Timer pauses while popup open
9. Dark backdrop (click outside doesn't dismiss)
10. Keyboard: Enter=Approve, E=Edit, Escape=keep paused
11. Matrix theme: dark background, green borders

#### Story 4.2: Inline Artifact Editor

**As a** consultant,
**I want** to edit artifact content directly in the dashboard using a Markdown editor,
**so that** I can adjust deliverables without leaving the workflow.

**Acceptance Criteria:**
1. `ArtifactEditor.tsx` slide-in panel (width 60vw)
2. Loads Markdown from backend API
3. Syntax highlighting, live preview toggle, line numbers
4. Auto-save every 5 seconds via PUT endpoint
5. Ctrl+S: immediate save with green flash confirmation
6. Save & Continue: saves, approves, closes, resumes pipeline
7. Cancel: discards changes, returns to approval popup
8. Matrix theme: dark bg, green syntax highlighting, JetBrains Mono
9. Handles 10,000+ characters without lag
10. Backend validates UTF-8 before saving

#### Story 4.3: Pipeline Rollback & Retry

**As a** consultant,
**I want** to go back to a previous pipeline step and re-run an agent,
**so that** I can fix issues without restarting the entire pipeline.

**Acceptance Criteria:**
1. Backend rollback handler: resets pipeline state to target step
2. Preserves artifacts from steps BEFORE target
3. Marks target and subsequent steps as pending
4. Frontend: rolled-back houses return to waiting status
5. Neo walks backward to target house
6. Re-executes agent with original or edited input
7. Edited artifacts used as input if modified before rollback
8. No rollback depth limit
9. Rollback logged in pipeline state
10. HUD updates (stars decrease on rollback)

#### Story 4.4: Commercial Proposal Generator

**As a** consultant,
**I want** the Closer agent to generate a professional commercial proposal in editable Markdown,
**so that** I can deliver a polished document to client executives.

**Acceptance Criteria:**
1. Closer prompt includes: cover, executive summary (AIDA), problem statement, proposed solutions, investment/ROI table, timeline, differentiators (PAS), next steps/CTA
2. Professional formatting: headers, tables, bullets, emphasis
3. Financial data in BRL (R$), percentages, comparison tables
4. Placeholders for: `{{client_logo}}`, `{{consultant_signature}}`
5. Markdown passes lint check
6. Saved as `06-proposta-comercial.md`
7. HTML preview endpoint: `GET /api/artifacts/{sessionId}/proposta/preview`
8. Length: 4-8 pages (2000-4000 words)
9. Print-to-PDF via browser (CSS print styles included)
10. Sections re-orderable without breaking formatting

#### Story 4.5: Landing Page Generator

**As a** consultant,
**I want** the Apresentacao agent to generate a professional landing page in HTML/CSS/JS,
**so that** I can present proposals as modern web experiences.

**Acceptance Criteria:**
1. Complete single-page HTML with inline CSS and minimal JS
2. Sections: hero, problem, solutions (cards), investment (pricing), timeline, trust, CTA footer
3. Professional, modern, responsive design (flexbox/grid)
4. Color scheme: professional tone (dark or light theme)
5. Google Fonts via CDN (Inter)
6. Responsive: desktop (1920x1080) and tablet (1024x768)
7. Content populated from: Estruturas, Financeiro, Closer outputs
8. Saved to `docs/artifacts/{sessionId}/landing-page/index.html`
9. CSS alongside: `styles.css`
10. Backend serves preview: `GET /api/artifacts/{sessionId}/landing-page`
11. Download as ZIP (HTML + CSS + assets)
12. Lighthouse performance: 90+

#### Story 4.6: Victory Screen & Artifact Download

**As a** consultant,
**I want** a celebration screen when pipeline completes with stats and download option,
**so that** I feel rewarded and can easily access all deliverables.

**Acceptance Criteria:**
1. `VictoryScreen.tsx` as fullscreen overlay
2. Triggered by `pipeline-complete` event
3. Neo success animation scaled 3x
4. Green particle explosion (50+ particles)
5. Stats: total time, artifacts (7/7), stages (7/7), total word count
6. "MISSION COMPLETE" in Press Start 2P with green glow
7. Download All: ZIP with all artifacts + landing page
8. View Proposal: opens in new tab
9. View Landing Page: opens in new tab
10. New Mission: resets pipeline
11. Dismissable via click outside or Escape
12. Matrix rain intensifies then fades

#### Story 4.7: Error Handling & Loading States

**As a** user,
**I want** graceful error handling with informative messages and loading states,
**so that** I never feel lost about what's happening.

**Acceptance Criteria:**
1. Toast system: success (green), error (red), warning (yellow), info (blue), auto-dismiss 5s
2. WebSocket disconnect: persistent reconnecting banner
3. Agent error: toast with retry countdown
4. Retry fail: popup with [Retry] [Skip] [Stop]
5. Loading states: house spinner, editor "Saving...", download progress bar
6. Skeleton loaders for initial load
7. Empty state: "Start a new mission" CTA
8. 404: "Artifact not yet generated" message
9. All error messages in Portuguese (pt-BR)
10. Error logs in `backend/logs/error.log`

#### Story 4.8: Performance Optimization & Session Stability

**As a** consultant,
**I want** stable 2+ hour sessions without memory leaks or degradation,
**so that** I can use the system for real work.

**Acceptance Criteria:**
1. Heap growth < 50MB over 2 hours (Chrome DevTools)
2. WebSocket heartbeat every 30s, auto-reconnect within 5s
3. Phaser: no orphaned sprites/particles/tweens after pipeline
4. React: no state updates on unmounted components
5. Code rain: max 40 columns, object pool pattern
6. Artifact streaming for large files
7. WebSocket: max 10 updates/sec (batched)
8. Frontend bundle < 500KB gzipped
9. Lighthouse: Performance > 85, Accessibility > 90
10. 3 consecutive pipelines without degradation

#### Story 4.9: Settings Panel & Configuration

**As a** user,
**I want** a settings panel to customize visual effects, approval points, and animation speeds,
**so that** I can tailor the experience to my preferences.

**Acceptance Criteria:**
1. `SettingsPanel.tsx` slide-in from right via gear icon
2. Visual Effects: toggles for Code Rain, Neo Trail, Glitch, Particles, master "Reduce Motion"
3. Pipeline: checkboxes for approval required per agent
4. Animation: sliders for Neo speed (50-300 px/s), typewriter speed (10-100 chars/s)
5. Persisted in localStorage
6. Loaded on mount, applied immediately
7. Reset to Defaults button
8. Matrix theme consistent
9. Changes apply without page reload
10. State in Zustand: `useSettingsStore.ts`

#### Story 4.10: Documentation & User Guide

**As a** new user,
**I want** clear documentation for setup, configuration, and usage,
**so that** I can get started quickly.

**Acceptance Criteria:**
1. README.md: overview, screenshot, quick start, prerequisites
2. `docs/guide/user-guide.md`: how to start mission, approvals, editing, downloads, shortcuts
3. `docs/guide/agent-guide.md`: 8 agent descriptions, outputs, pipeline flow (Mermaid diagram)
4. `docs/guide/customization.md`: modify prompts, change approvals, adjust visuals, add agents
5. Inline help: `?` icon opens quick-reference modal
6. All documentation in Portuguese (pt-BR)

---

## 7. Checklist Results Report

### 7.1 Executive Summary

- **Overall PRD Completeness:** 92%
- **MVP Scope Appropriateness:** Just Right
- **Readiness for Architecture Phase:** READY
- **Most Critical Gaps:** Out-of-scope section not formalized; MVP validation approach implicit

### 7.2 Category Analysis

| Category | Status | Critical Issues |
|----------|--------|-----------------|
| 1. Problem Definition & Context | PASS | Clear problem, target audience, and motivation |
| 2. MVP Scope Definition | PASS | 4 epics well scoped, 27-day timeline realistic |
| 3. User Experience Requirements | PASS | Comprehensive UX vision, interaction paradigms, accessibility |
| 4. Functional Requirements | PASS | 41 FRs covering all system aspects |
| 5. Non-Functional Requirements | PASS | 20 NFRs with measurable targets |
| 6. Epic & Story Structure | PASS | 28 stories, sequentially ordered, appropriately sized |
| 7. Technical Guidance | PASS | Full stack defined, deployment strategy, testing approach |
| 8. Cross-Functional Requirements | PARTIAL | Data storage defined but no formal data model; integration with Claude Code Remote needs validation |
| 9. Clarity & Communication | PASS | Consistent language, well-structured, Portuguese documentation planned |

### 7.3 Top Issues by Priority

**BLOCKERS:** None

**HIGH:**
- Claude Code Remote API stability needs validation before Epic 2 begins (mitigated by adapter pattern)
- Pixel art sprite creation dependency (can use placeholder until ready)

**MEDIUM:**
- Out-of-scope features not formally listed (mobile, multi-user, cloud hosting)
- MVP validation criteria could be more explicit (user testing plan)
- Data model for pipeline state could be formalized

**LOW:**
- Sound effects not specified (optional enhancement)
- Internationalization not addressed (Portuguese only for MVP is fine)
- Analytics/telemetry not specified (optional post-MVP)

### 7.4 MVP Scope Assessment

**Scope is appropriate.** 28 stories across 27 days is achievable with focused development. Key risks:
- Epic 3 (Phaser + pixel art) is the most uncertain — consider placeholder approach
- Epic 4 is the largest (10 stories) — may need scope trimming if timeline pressures arise
- Landing page generator (Story 4.5) is complex — could be simplified to HTML template with injected content

**Features that could be cut for faster MVP:**
- FR38-40 (gamification HUD) — nice but not critical
- Story 3.5 (advanced Matrix effects) — can ship with basic code rain only
- Story 4.9 (settings panel) — hardcode defaults initially

**No missing essential features identified.**

### 7.5 Technical Readiness

- Stack is well-chosen and modern (React, Phaser, Node, Socket.io)
- Monorepo with shared types is good architecture for this size
- Main technical risk: Claude Code Remote API integration (new, potentially unstable)
- Phaser 3 + React integration is proven pattern
- Local-first deployment eliminates hosting complexity

### 7.6 Recommendations

1. **Validate Claude Code Remote API** before starting Epic 2 — create spike/POC in first days
2. **Start sprite creation early** — commission or create pixel art Neo in parallel with Epic 1
3. **Consider feature flags** for gamification elements — ship core pipeline first, add game layer incrementally
4. **Add explicit out-of-scope section** to PRD for alignment
5. **Create protocol spec document** early (Story 1.4) — all agents depend on it

### 7.7 Final Decision

**READY FOR ARCHITECT** — The PRD is comprehensive, well-structured, with clear functional/non-functional requirements, detailed epic/story breakdown, and sufficient technical guidance for the architect to design the system architecture.

---

## 8. Next Steps

### 8.1 UX Expert Prompt

> @ux-design-expert - Review the PRD at `docs/prd/squad-playground-matrix.md`, focusing on sections 3 (UI Design Goals) and the agent color palette. Create wireframes for: (1) Main Dashboard gameplay view with 8 agent houses, (2) Approval Popup with artifact preview, (3) Victory Screen. Define the pixel art style guide for Neo character and agent house assets. Ensure Matrix cyberpunk aesthetic is consistent across all screens. Output to `docs/architecture/ux-spec.md`.

### 8.2 Architect Prompt

> @architect - Review the complete PRD at `docs/prd/squad-playground-matrix.md`. Design the system architecture covering: (1) Frontend architecture — React + Phaser 3 integration pattern, component hierarchy, Zustand store design, (2) Backend architecture — Express + Socket.io server, Claude Code Remote adapter, pipeline orchestrator pattern, (3) Shared protocol — agent communication protocol spec, TypeScript types, (4) Data flow — WebSocket message schemas, artifact storage strategy, pipeline state management. Output to `docs/architecture/system-architecture.md`.

---

_Squad Playground Matrix Pipeline PRD v1.0 — Morgan (PM), planejando o futuro_
