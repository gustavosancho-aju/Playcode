# Guia de Customização — Squad Playground

## Modificando Prompts dos Agentes

Os prompts ficam em `agents/*.md`. Cada arquivo define as instruções do agente:

```
agents/
├── master.md        # Orquestrador
├── pesquisa.md      # Investigador
├── organizador.md   # Curador
├── solucoes.md      # Visionário
├── estruturas.md    # Arquiteto
├── financeiro.md    # Analista
├── closer.md        # Persuasor
└── apresentacao.md  # Designer
```

Para modificar o comportamento de um agente, edite seu arquivo `.md`. O prompt é enviado integralmente para a IA.

### Dicas para Prompts
- Seja específico sobre o formato de saída esperado
- Inclua exemplos quando possível
- Defina o tom e estilo desejado
- Especifique o idioma (pt-BR recomendado)

## Configurando Pontos de Aprovação

### Via Interface (Settings)
1. Clique em ⚙ **Settings** no rodapé
2. Na seção **Pipeline Approval**, marque/desmarque agentes
3. Agentes marcados pausam o pipeline para aprovação manual
4. A configuração é salva automaticamente no localStorage

### Via Código
Edite `backend/config/pipeline.json`:

```json
{
  "approvalRequired": {
    "pesquisa": true,
    "organizador": false,
    "solucoes": true,
    "estruturas": false,
    "financeiro": false,
    "closer": true,
    "apresentacao": true
  }
}
```

## Ajustando Efeitos Visuais

### Via Interface (Settings)
Use os toggles e sliders em ⚙ **Settings**:
- **Code Rain** — Chuva de código Matrix
- **Neo Trail** — Rastro luminoso do personagem
- **Glitch** — Efeito glitch nos agentes
- **Particles** — Partículas ambientais
- **Neo Speed** — Velocidade do personagem (50-300 px/s)
- **Typewriter Speed** — Velocidade do texto (10-100 chars/s)

### Via Código

Modifique os defaults em `frontend/src/stores/useSettingsStore.ts`:

```typescript
const defaultEffects: EffectsSettings = {
  codeRain: true,
  neoTrail: true,
  glitch: false,      // desativado por padrão
  particles: true,
  reduceMotion: false,
};

const defaultAnimation: AnimationSettings = {
  neoSpeed: 150,       // px/s
  typewriterSpeed: 30,  // chars/s
};
```

## Adicionando um Novo Agente

### 1. Defina o tipo em `shared/types.ts`

Adicione o novo ID ao tipo `AgentId`:

```typescript
export type AgentId =
  | 'master'
  | 'pesquisa'
  // ... existentes
  | 'novo-agente';  // adicione aqui
```

### 2. Adicione a definição em `AGENT_DEFINITIONS`

```typescript
{
  id: 'novo-agente',
  name: 'Novo Agente',
  role: 'Especialista',
  color: '#FF6B6B',
  icon: '🔧',
  promptFile: 'novo-agente.md',
  outputFile: '08-novo-artefato.md',
  inputFrom: 'apresentacao',  // agente anterior
  handoffTo: 'complete',       // ou próximo agente
},
```

### 3. Crie o prompt

Crie `agents/novo-agente.md` com as instruções do agente.

### 4. Atualize o pipeline

Adicione o ID em `PIPELINE_ORDER` no `shared/types.ts`:

```typescript
export const PIPELINE_ORDER: AgentId[] = [
  'pesquisa',
  // ... existentes
  'novo-agente',  // adicione na posição desejada
];
```

### 5. Adicione a cor no Tailwind

Em `frontend/tailwind.config.js`, adicione a cor do agente:

```javascript
agent: {
  // ... existentes
  'novo-agente': '#FF6B6B',
},
```

### 6. Teste

Reinicie o servidor e verifique que o novo agente aparece no dashboard e participa do pipeline.
