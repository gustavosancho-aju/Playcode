# Guia dos Agentes — Squad Playground

## Os 8 Agentes do Pipeline

### 👑 Master CEO — Orquestrador
- **ID:** `master`
- **Cor:** Roxo (#8B5CF6)
- **Função:** Recebe o prompt do usuário e orquestra toda a missão. Define o contexto e passa instruções para o primeiro agente do pipeline.
- **Artefato:** Nenhum (orquestração)
- **Entrada:** Prompt do usuário
- **Saída para:** Pesquisa

### 📚 Pesquisa — Investigador
- **ID:** `pesquisa`
- **Cor:** Azul (#2563EB)
- **Função:** Investiga o mercado, concorrentes e contexto do problema. Gera um briefing prévio com dados relevantes.
- **Artefato:** `01-briefing-previo.md`
- **Entrada de:** Master CEO
- **Saída para:** Organizador

### 📋 Organizador — Curador
- **ID:** `organizador`
- **Cor:** Verde (#059669)
- **Função:** Organiza, categoriza e prioriza as informações do briefing. Cria uma estrutura clara para as próximas etapas.
- **Artefato:** `02-briefing-organizado.md`
- **Entrada de:** Pesquisa
- **Saída para:** Soluções

### 💡 Soluções — Visionário
- **ID:** `solucoes`
- **Cor:** Amarelo (#F59E0B)
- **Função:** Propõe ideias criativas, soluções inovadoras e abordagens estratégicas baseadas no briefing organizado.
- **Artefato:** `03-ideias-solucoes.md`
- **Entrada de:** Organizador
- **Saída para:** Estruturas

### 🏗️ Estruturas — Arquiteto
- **ID:** `estruturas`
- **Cor:** Cinza (#374151)
- **Função:** Transforma ideias em produtos e serviços concretos com escopo, features e arquitetura definidos.
- **Artefato:** `04-estruturas-produtos.md`
- **Entrada de:** Soluções
- **Saída para:** Financeiro

### 💰 Financeiro — Analista
- **ID:** `financeiro`
- **Cor:** Esmeralda (#10B981)
- **Função:** Analisa viabilidade financeira, define precificação, ROI e modelos de receita.
- **Artefato:** `05-analise-financeira.md`
- **Entrada de:** Estruturas
- **Saída para:** Closer

### ✍️ Closer — Persuasor
- **ID:** `closer`
- **Cor:** Vermelho (#DC2626)
- **Função:** Gera a proposta comercial completa usando frameworks AIDA e PAS, com tabelas financeiras em BRL.
- **Artefato:** `06-proposta-comercial.md`
- **Entrada de:** Financeiro
- **Saída para:** Apresentação

### 🎨 Apresentação — Designer
- **ID:** `apresentacao`
- **Cor:** Rosa (#EC4899)
- **Função:** Cria a landing page HTML/CSS responsiva com hero, problema, soluções, pricing, timeline e CTA.
- **Artefato:** `07-landing-spec.md`
- **Entrada de:** Closer
- **Saída para:** Completo (fim do pipeline)

## Fluxo do Pipeline

```mermaid
graph LR
    U[👤 Usuário] -->|prompt| M[👑 Master]
    M -->|orquestra| P[📚 Pesquisa]
    P -->|briefing| O[📋 Organizador]
    O -->|estrutura| S[💡 Soluções]
    S -->|ideias| E[🏗️ Estruturas]
    E -->|produtos| F[💰 Financeiro]
    F -->|análise| C[✍️ Closer]
    C -->|proposta| A[🎨 Apresentação]
    A -->|landing page| V[🏆 Vitória]

    style M fill:#8B5CF6,color:#fff
    style P fill:#2563EB,color:#fff
    style O fill:#059669,color:#fff
    style S fill:#F59E0B,color:#000
    style E fill:#374151,color:#fff
    style F fill:#10B981,color:#fff
    style C fill:#DC2626,color:#fff
    style A fill:#EC4899,color:#fff
```

## Formato do Protocolo

Os agentes se comunicam usando um protocolo de texto estruturado:

```
[AGENT:pesquisa]
[STATUS:processing]
Analisando o mercado de consultoria em IA...

[TASKS]
- Pesquisar concorrentes diretos
- Identificar tendências do mercado
- Coletar dados de precificação

[OUTPUT:01-briefing-previo.md]
# Briefing Prévio
...conteúdo do artefato...

[HANDOFF:organizador]
```

### Tags do Protocolo

| Tag | Descrição |
|-----|-----------|
| `[AGENT:id]` | Identifica o agente ativo |
| `[STATUS:status]` | Status atual (processing, done, error) |
| `[TASKS]` | Lista de tarefas em execução |
| `[OUTPUT:filename]` | Artefato gerado |
| `[HANDOFF:id]` | Próximo agente no pipeline |
