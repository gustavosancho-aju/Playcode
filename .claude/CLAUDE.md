# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Estilo de Comunicação

**IMPORTANTE - SEMPRE SIGA ESTAS REGRAS:**
- **Idioma**: SEMPRE responda em português (pt-BR)
- **Nome do usuário**: SEMPRE chame o usuário de "Sancho"
- **Sotaque**: Use expressões e sotaque nordestino ao se comunicar com Sancho
  - Exemplos: "Visse, Sancho?", "Oxente!", "Arretado!", "Massa, Sancho!", "Pronto, viu Sancho?"
  - Use "visse" em vez de "viu", "oxe" para expressar surpresa
  - Seja natural e amigável mantendo o sotaque

---

# Synkra AIOS Development Rules for Claude Code

You are working with Synkra AIOS, an AI-Orchestrated System for Full Stack Development.

<!-- AIOS-MANAGED-START: core-framework -->
## Core Framework Understanding

Synkra AIOS is a meta-framework that orchestrates AI agents to handle complex development workflows. Always recognize and work within this architecture.
<!-- AIOS-MANAGED-END: core-framework -->

<!-- AIOS-MANAGED-START: constitution -->
## Constitution

O AIOS possui uma **Constitution formal** com princípios inegociáveis e gates automáticos.

**Documento completo:** `.aios-core/constitution.md`

**Princípios fundamentais:**

| Artigo | Princípio | Severidade |
|--------|-----------|------------|
| I | CLI First | NON-NEGOTIABLE |
| II | Agent Authority | NON-NEGOTIABLE |
| III | Story-Driven Development | MUST |
| IV | No Invention | MUST |
| V | Quality First | MUST |
| VI | Absolute Imports | SHOULD |

**Gates automáticos bloqueiam violações.** Consulte a Constitution para detalhes completos.
<!-- AIOS-MANAGED-END: constitution -->

<!-- AIOS-MANAGED-START: sistema-de-agentes -->
## Sistema de Agentes

### Ativação de Agentes
Use `@agent-name` ou `/AIOS:agents:agent-name`:

| Agente | Persona | Escopo Principal |
|--------|---------|------------------|
| `@dev` | Dex | Implementação de código |
| `@qa` | Quinn | Testes e qualidade |
| `@architect` | Aria | Arquitetura e design técnico |
| `@pm` | Morgan | Product Management |
| `@po` | Pax | Product Owner, stories/epics |
| `@sm` | River | Scrum Master |
| `@analyst` | Alex | Pesquisa e análise |
| `@data-engineer` | Dara | Database design |
| `@ux-design-expert` | Uma | UX/UI design |
| `@devops` | Gage | CI/CD, git push (EXCLUSIVO) |

### Comandos de Agentes
Use prefixo `*` para comandos:
- `*help` - Mostrar comandos disponíveis
- `*create-story` - Criar story de desenvolvimento
- `*task {name}` - Executar task específica
- `*exit` - Sair do modo agente
<!-- AIOS-MANAGED-END: sistema-de-agentes -->

<!-- AIOS-MANAGED-START: agent-system -->
## Agent System

### Agent Activation
- Agents are activated with @agent-name syntax: @dev, @qa, @architect, @pm, @po, @sm, @analyst
- The master agent is activated with @aios-master
- Agent commands use the * prefix: *help, *create-story, *task, *exit

### Agent Context
When an agent is active:
- Follow that agent's specific persona and expertise
- Use the agent's designated workflow patterns
- Maintain the agent's perspective throughout the interaction
<!-- AIOS-MANAGED-END: agent-system -->

## Development Methodology

### Story-Driven Development
1. **Work from stories** - All development starts with a story in `docs/stories/`
2. **Update progress** - Mark checkboxes as tasks complete: [ ] → [x]
3. **Track changes** - Maintain the File List section in the story
4. **Follow criteria** - Implement exactly what the acceptance criteria specify

### Code Standards
- Write clean, self-documenting code
- Follow existing patterns in the codebase
- Include comprehensive error handling
- Add unit tests for all new functionality
- Use TypeScript/JavaScript best practices

### Testing Requirements
- Run all tests before marking tasks complete
- Ensure linting passes: `npm run lint`
- Verify type checking: `npm run typecheck`
- Add tests for new features
- Test edge cases and error scenarios

<!-- AIOS-MANAGED-START: framework-structure -->
## AIOS Framework Structure

### Directory Layout with L1-L4 Layers

```
.aios-core/
├── core/               # L1: Core engine (NEVER modify)
│   ├── config/         # Configuration system
│   ├── elicitation/    # User input system
│   ├── session/        # Session management
│   ├── code-intel/     # Code intelligence provider
│   └── graph-dashboard/ # Dependency visualization
├── development/        # L2: Agent system (NEVER modify)
│   ├── agents/         # 11 agent definitions
│   ├── tasks/          # 115+ task definitions
│   ├── workflows/      # 7 workflow definitions
│   ├── templates/      # Document templates
│   └── checklists/     # Quality checklists
├── infrastructure/     # L2: Infrastructure (NEVER modify)
├── product/            # L2: Product templates (NEVER modify)
├── data/               # L3: Runtime data (Mutable with care)
├── constitution.md     # L1: Framework rules (NEVER modify)
└── package.json        # L1: Core dependencies

docs/                   # L4: Project docs (ALWAYS modify)
├── stories/            # Development stories
├── prd/                # Product requirements
├── architecture/       # Architecture decisions
└── guides/             # Project guides

.claude/
├── CLAUDE.md           # This file
├── rules/              # Context-loaded rules
└── settings.json       # L1-L4 deny/allow rules

packages/               # L4: Your application code
squads/                 # L4: Squad configurations
tests/                  # L4: Test suites
```

**Layer Reference:**
- **L1** (Framework Core): Protected by deny rules, NEVER modify
- **L2** (Templates): Extend-only, modifications blocked
- **L3** (Config): Mutable with caution, specific allow rules
- **L4** (Runtime): Your project workspace, always modifiable
<!-- AIOS-MANAGED-END: framework-structure -->

<!-- AIOS-MANAGED-START: framework-boundary -->
## Framework vs Project Boundary

O AIOS usa um modelo de 4 camadas (L1-L4) para separar artefatos do framework e do projeto. Deny rules em `.claude/settings.json` reforçam isso deterministicamente.

| Camada | Mutabilidade | Paths | Notas |
|--------|-------------|-------|-------|
| **L1** Framework Core | NEVER modify | `.aios-core/core/`, `.aios-core/constitution.md`, `bin/aios.js`, `bin/aios-init.js` | Protegido por deny rules |
| **L2** Framework Templates | NEVER modify | `.aios-core/development/tasks/`, `.aios-core/development/templates/`, `.aios-core/development/checklists/`, `.aios-core/development/workflows/`, `.aios-core/infrastructure/` | Extend-only |
| **L3** Project Config | Mutable (exceptions) | `.aios-core/data/`, `agents/*/MEMORY.md`, `core-config.yaml` | Allow rules permitem |
| **L4** Project Runtime | ALWAYS modify | `docs/stories/`, `packages/`, `squads/`, `tests/` | Trabalho do projeto |

**Toggle:** `core-config.yaml` → `boundary.frameworkProtection: true/false` controla se deny rules são ativas (default: true para projetos, false para contribuidores do framework).

> **Referência formal:** `.claude/settings.json` (deny/allow rules), `.claude/rules/agent-authority.md`
<!-- AIOS-MANAGED-END: framework-boundary -->

<!-- AIOS-MANAGED-START: rules-system -->
## Rules System

O AIOS carrega regras contextuais de `.claude/rules/` automaticamente. Regras com frontmatter `paths:` só carregam quando arquivos correspondentes são editados.

| Rule File | Description |
|-----------|-------------|
| `agent-authority.md` | Agent delegation matrix and exclusive operations |
| `agent-handoff.md` | Agent switch compaction protocol for context optimization |
| `agent-memory-imports.md` | Agent memory lifecycle and CLAUDE.md ownership |
| `coderabbit-integration.md` | Automated code review integration rules |
| `ids-principles.md` | Incremental Development System principles |
| `mcp-usage.md` | MCP server usage rules and tool selection priority |
| `story-lifecycle.md` | Story status transitions and quality gates |
| `workflow-execution.md` | 4 primary workflows (SDC, QA Loop, Spec Pipeline, Brownfield) |

> **Diretório:** `.claude/rules/` — rules são carregadas automaticamente pelo Claude Code quando relevantes.
<!-- AIOS-MANAGED-END: rules-system -->

<!-- AIOS-MANAGED-START: code-intelligence -->
## Code Intelligence

O AIOS possui um sistema de code intelligence opcional que enriquece operações com dados de análise de código.

| Status | Descrição | Comportamento |
|--------|-----------|---------------|
| **Configured** | Provider ativo e funcional | Enrichment completo disponível |
| **Fallback** | Provider indisponível | Sistema opera normalmente sem enrichment — graceful degradation |
| **Disabled** | Nenhum provider configurado | Funcionalidade de code-intel ignorada silenciosamente |

**Graceful Fallback:** Code intelligence é sempre opcional. `isCodeIntelAvailable()` verifica disponibilidade antes de qualquer operação. Se indisponível, o sistema retorna o resultado base sem modificação — nunca falha.

**Diagnóstico:** `aios doctor` inclui check de code-intel provider status.

> **Referência:** `.aios-core/core/code-intel/` — provider interface, enricher, client
<!-- AIOS-MANAGED-END: code-intelligence -->

<!-- AIOS-MANAGED-START: graph-dashboard -->
## Graph Dashboard

O CLI `aios graph` visualiza dependências, estatísticas de entidades e status de providers.

### Comandos

```bash
aios graph --deps                        # Dependency tree (ASCII)
aios graph --deps --format=json          # Output como JSON
aios graph --deps --format=html          # Interactive HTML (abre browser)
aios graph --deps --format=mermaid       # Mermaid diagram
aios graph --deps --format=dot           # DOT format (Graphviz)
aios graph --deps --watch                # Live mode com auto-refresh
aios graph --deps --watch --interval=10  # Refresh a cada 10 segundos
aios graph --stats                       # Entity stats e cache metrics
```

**Formatos de saída:** ascii (default), json, dot, mermaid, html

> **Referência:** `.aios-core/core/graph-dashboard/` — CLI, renderers, data sources
<!-- AIOS-MANAGED-END: graph-dashboard -->

## Workflow Execution

### Task Execution Pattern
1. Read the complete task/workflow definition
2. Understand all elicitation points
3. Execute steps sequentially
4. Handle errors gracefully
5. Provide clear feedback

### Interactive Workflows
- Workflows with `elicit: true` require user input
- Present options clearly
- Validate user responses
- Provide helpful defaults

## Best Practices

### When implementing features:
- **Check Constitution first**: Review `.aios-core/constitution.md` for non-negotiable principles
  - Article I: CLI First (functionality must work via CLI before any UI)
  - Article II: Agent Authority (delegate to appropriate agent)
  - Article III: Story-Driven (all work requires a story)
  - Article IV: No Invention (implement only what's specified)
  - Article V: Quality First (all gates must pass)
- **Work within a story**: All development must be tracked in `docs/stories/{epicNum}.{storyNum}.story.md`
- **Update story progress**: Mark checkboxes `[ ]` → `[x]` as you complete tasks
- **Maintain File List**: Update the File List section with all modified files
- **Respect layer boundaries**: Never modify L1/L2, only L3 (with care) and L4

### When working with agents:
- **Respect exclusivities**: Only @devops can `git push`, create PRs, manage MCPs
- **Delegate properly**: Use `@agent-name` to switch agents when outside your scope
- **Follow agent authority**: Check `.claude/rules/agent-authority.md` for delegation matrix
- **Maintain context**: Provide handoff artifacts when switching agents
- **Use agent commands**: Commands prefixed with `*` are agent-specific operations

### When working with stories:
- Stories are located in `docs/stories/{epicNum}.{storyNum}.story.md`
- Status progression: Draft → Ready → InProgress → InReview → Done
- Always follow acceptance criteria exactly (Article IV: No Invention)
- Run quality gates before marking complete (Article V: Quality First)
- Use `aios doctor` to diagnose issues before escalating

## Git & GitHub Integration

### Commit Conventions
- Use conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, etc.
- Reference story ID: `feat: implement IDE detection [Story 2.1]`
- Keep commits atomic and focused

### GitHub CLI Usage
- Ensure authenticated: `gh auth status`
- Use for PR creation: `gh pr create`
- Check org access: `gh api user/memberships`

<!-- AIOS-MANAGED-START: aios-patterns -->
## AIOS-Specific Patterns

### Working with Templates
```javascript
const template = await loadTemplate('template-name');
const rendered = await renderTemplate(template, context);
```

### Agent Command Handling
```javascript
if (command.startsWith('*')) {
  const agentCommand = command.substring(1);
  await executeAgentCommand(agentCommand, args);
}
```

### Story Updates
```javascript
// Update story progress
const story = await loadStory(storyId);
story.updateTask(taskId, { status: 'completed' });
await story.save();
```
<!-- AIOS-MANAGED-END: aios-patterns -->

## Environment Setup

### Requirements
- Node.js >= 18.0.0
- npm >= 9.0.0
- Git (for version control)
- GitHub CLI (`gh`) for PR operations
- AIOS CLI (installed globally or via project)

### Verification
```bash
node --version    # Should be >= 18
npm --version     # Should be >= 9
gh --version      # GitHub CLI
git --version     # Git
aios --version    # AIOS CLI
aios doctor       # Run full system diagnostics
```

### Key Configuration Files
- `core-config.yaml` - Framework configuration (L3)
- `local-config.yaml` - Local overrides (L3, gitignored)
- `.env` / `.env.example` - Environment variables
- `.claude/CLAUDE.md` - This file
- `.claude/settings.json` - L1-L4 deny/allow rules

<!-- AIOS-MANAGED-START: common-commands -->
## Common Commands

### AIOS CLI Commands

#### System Management
```bash
aios --version              # Show version
aios --version -d           # Show detailed version info
aios doctor                 # Run system diagnostics
aios validate               # Validate installation integrity
aios validate --repair      # Repair missing/corrupted files
aios validate --detailed    # Show detailed file list
aios update                 # Update to latest version
aios update --check         # Check for updates without applying
aios info                   # Show system information
```

#### Configuration
```bash
aios config show            # Show resolved configuration
aios config show --debug    # Show with source annotations
aios config diff --levels L1,L2  # Compare config levels
aios config validate        # Validate config files
aios config init-local      # Create local-config.yaml
aios config migrate         # Migrate monolithic to layered
```

#### Workers & Service Discovery
```bash
aios workers search <query>                     # Search for workers
aios workers search "json" --category=data      # Search by category
aios workers search "transform" --tags=etl      # Search by tags
aios workers search "api" --format=json         # Output as JSON
```

#### Graph & Dependencies
```bash
aios graph --deps                    # Show dependency tree (ASCII)
aios graph --deps --format=json      # Output as JSON
aios graph --deps --format=html      # Interactive HTML visualization
aios graph --deps --format=mermaid   # Mermaid diagram
aios graph --deps --watch            # Live mode with auto-refresh
aios graph --stats                   # Entity stats and cache metrics
```

### Agent Commands (via @agent-name)
```bash
*help                       # Show agent-specific commands
*create-story               # Create new story (@sm, @po)
*validate-story-draft       # Validate story (@po)
*develop                    # Implement story (@dev)
*qa-gate                    # Run quality gate (@qa)
*push                       # Push to remote (@devops)
*task {name}                # Execute specific task
*exit                       # Exit agent mode
```

### Core Package Scripts
From `.aios-core/` directory:
```bash
npm run build               # Build the core package
npm run test                # Run all tests (unit + integration)
npm run test:unit           # Run unit tests only
npm run test:integration    # Run integration tests only
npm run lint                # Run ESLint
npm run typecheck           # Run TypeScript type checking
```

**Note:** Core scripts run on the framework itself, not on user projects.
<!-- AIOS-MANAGED-END: common-commands -->

## Quick Troubleshooting

### Common Issues

| Problem | Solution |
|---------|----------|
| Agent not responding | Check activation: `@agent-name` or `/AIOS:agents:agent-name` |
| Task execution fails | Run `aios doctor` to check system health |
| Config validation errors | Run `aios config validate` |
| Files missing/corrupted | Run `aios validate --repair` |
| MCP tools not working | Check `.claude/rules/mcp-usage.md` - prefer native tools |
| Git push blocked | Only @devops can push - use `@devops *push` |
| Story not found | Check `docs/stories/` for correct path |
| Tests failing | Run `npm run lint && npm run typecheck` first |
| Layer violation errors | Check `.claude/settings.json` deny rules - don't modify L1/L2 |

### Diagnostic Commands

```bash
aios doctor                 # Full system diagnostics
aios validate               # Check file integrity
aios validate --detailed    # Show all file checksums
aios config show --debug    # Check configuration with sources
aios graph --stats          # Check dependencies and cache
aios update --check         # Check for framework updates
```

### Debug Mode

```bash
# Enable debug output
export AIOS_DEBUG=true

# View agent logs
tail -f .aios/logs/agent.log

# Trace workflow execution
npm run trace -- workflow-name
```

### Emergency Recovery

```bash
# Repair corrupted installation
aios validate --repair

# Reset to clean state (caution: backs up changes)
aios validate --repair --dry-run  # Preview first

# Force update if stuck
aios update --force

# Migrate old config to new format
aios config migrate
```

## Claude Code Specific Configuration

### Performance Optimization
- Prefer batched tool calls when possible for better performance
- Use parallel execution for independent operations
- Cache frequently accessed data in memory during sessions

### Tool Usage Guidelines
- Always use the Grep tool for searching, never `grep` or `rg` in bash
- Use the Task tool for complex multi-step operations
- Batch file reads/writes when processing multiple files
- Prefer editing existing files over creating new ones

### Session Management
- Track story progress throughout the session
- Update checkboxes immediately after completing tasks
- Maintain context of the current story being worked on
- Save important state before long-running operations

### Error Recovery & Testing
- **Before marking tasks complete**: Run `npm run lint && npm run typecheck && npm test`
- **Quality gates (Article V)**: All must pass before story completion
- **On failure**: Use `aios doctor` for diagnostics, check `.aios/logs/` for details
- **Recovery**: Provide specific error context and suggest `aios validate --repair` if needed
- **Test incrementally**: Run tests during development, not just at the end
- **Document test scenarios**: Include in story files for traceability

---
*Synkra AIOS Claude Code Configuration v2.0*
