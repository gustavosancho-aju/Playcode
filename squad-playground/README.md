# Squad Playground — Matrix Pipeline

Dashboard visual gamificado para consultoria em IA com 8 agentes especializados. Interface Matrix-themed com pipeline em tempo real, aprovações interativas e geração automatizada de propostas comerciais e landing pages.

## Screenshot

```
┌──────────────────────────────────────────────────┐
│          🟢 SQUAD PLAYGROUND 🟢                  │
│  👑─📚─📋─💡─🏗️─💰─✍️─🎨                      │
│  [Master][Pesq][Org][Sol][Est][Fin][Clo][Apr]    │
│         ████████████░░░░ 62%                     │
│  ┌─────────────────────────────┐                 │
│  │ 🤖 Neo caminhando...       │                 │
│  └─────────────────────────────┘                 │
│  [Pause] [Download]   ⚙ Settings   ? Help       │
└──────────────────────────────────────────────────┘
```

## Pré-requisitos

- Node.js >= 18.0.0
- npm >= 9.0.0

## Quick Start

```bash
# Clone e instale
git clone <repo-url>
cd squad-playground
npm install

# Inicie em modo desenvolvimento
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3000
- **Health check:** http://localhost:3000/health

## Stack

- **Frontend:** React 18 + Vite 5 + TypeScript 5 + Tailwind CSS 3 + Phaser 3
- **Backend:** Express 4 + Socket.io 4 + Winston 3
- **Shared:** TypeScript types (npm workspaces)

## Estrutura do Projeto

```
squad-playground/
├── frontend/          # React SPA + Phaser 3 game engine
│   ├── src/
│   │   ├── components/  # UI components (Dashboard, BottomBar, etc.)
│   │   ├── game/        # Phaser scenes (PipelineScene, Neo)
│   │   ├── hooks/       # Custom hooks (useSocket)
│   │   ├── stores/      # Zustand stores (settings, agents, connection)
│   │   └── styles/      # Global CSS
│   └── public/          # Static assets
├── backend/           # Express + Socket.io server
│   ├── src/
│   │   ├── routes/      # HTTP endpoints (health, mock)
│   │   ├── parser/      # Agent protocol parser
│   │   ├── pipeline/    # Pipeline orchestrator
│   │   └── server/      # Express + Socket.io setup
│   └── tests/           # Jest tests
├── shared/            # Shared TypeScript types
├── agents/            # AI agent system prompts
├── docs/guide/        # Documentação do usuário
└── scripts/           # Utility scripts
```

## Pipeline dos Agentes

O pipeline processa uma missão de consultoria em 8 etapas:

| # | Agente | Papel | Artefato |
|---|--------|-------|----------|
| 0 | 👑 Master CEO | Orquestrador | — |
| 1 | 📚 Pesquisa | Investigador | briefing-previo.md |
| 2 | 📋 Organizador | Curador | briefing-organizado.md |
| 3 | 💡 Soluções | Visionário | ideias-solucoes.md |
| 4 | 🏗️ Estruturas | Arquiteto | estruturas-produtos.md |
| 5 | 💰 Financeiro | Analista | analise-financeira.md |
| 6 | ✍️ Closer | Persuasor | proposta-comercial.md |
| 7 | 🎨 Apresentação | Designer | landing-spec.md |

## Atalhos de Teclado

| Atalho | Ação |
|--------|------|
| `Enter` | Aprovar artefato |
| `E` | Editar artefato |
| `Escape` | Voltar / Fechar modal |
| `Ctrl+S` | Salvar edição |

## Documentação

- [Guia do Usuário](docs/guide/user-guide.md)
- [Guia dos Agentes](docs/guide/agent-guide.md)
- [Guia de Customização](docs/guide/customization.md)

## Licença

MIT
