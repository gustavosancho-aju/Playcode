# Squad Playground — Matrix Pipeline

Dashboard visual gamificado para consultoria em IA com 8 agentes especializados.

## Quick Start

```bash
npm install
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3000
- **Health:** http://localhost:3000/health

## Stack

- **Frontend:** React 18 + Vite 5 + TypeScript 5 + Tailwind CSS 3 + Phaser 3
- **Backend:** Express 4 + Socket.io 4 + Winston 3
- **Shared:** TypeScript types (npm workspaces)

## Structure

```
squad-playground/
├── frontend/    # React SPA + Phaser 3
├── backend/     # Express + Socket.io
├── shared/      # Shared TypeScript types
├── agents/      # AI agent system prompts
├── docs/        # Documentation + artifacts
└── scripts/     # Utility scripts
```
