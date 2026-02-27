# Guia do Usuário — Squad Playground

## Iniciando uma Missão

1. Abra o app em `http://localhost:5173`
2. Aguarde a conexão WebSocket (indicador verde no rodapé)
3. O pipeline inicia quando o Master CEO recebe um prompt do usuário
4. Neo (personagem do jogo) caminha pela pipeline conforme os agentes trabalham

## Entendendo o Pipeline

O dashboard mostra 8 casas de agentes conectadas horizontalmente. Cada agente processa sua etapa e gera um artefato:

1. **Master CEO** 👑 — Recebe o prompt e orquestra a missão
2. **Pesquisa** 📚 — Investiga o mercado e gera um briefing prévio
3. **Organizador** 📋 — Organiza e estrutura as informações coletadas
4. **Soluções** 💡 — Propõe ideias e soluções criativas
5. **Estruturas** 🏗️ — Arquiteta produtos e serviços
6. **Financeiro** 💰 — Analisa viabilidade e precificação
7. **Closer** ✍️ — Gera a proposta comercial completa
8. **Apresentação** 🎨 — Cria a landing page do projeto

A barra de progresso mostra o avanço geral da missão.

## Aprovações

Quando um agente completa seu trabalho, um popup de aprovação aparece:

- **Aprovar** (`Enter`) — Aceita o artefato e avança para o próximo agente
- **Editar** (`E`) — Abre o editor inline para modificar o artefato
- **Voltar** (`Escape`) — Retorna para o agente anterior (rollback)

Você pode configurar quais agentes requerem aprovação em **Settings > Pipeline Approval**.

## Editando Artefatos

O editor inline desliza pela direita e oferece:

- Edição em Markdown com visualização ao vivo
- Números de linha e syntax highlighting
- Auto-save a cada 5 segundos
- `Ctrl+S` para salvar manualmente
- **Save & Continue** — Salva e avança
- **Cancel** — Descarta alterações

## Downloads

Ao final da missão, a tela de vitória oferece:

- **Download All** — Baixa todos os artefatos em um ZIP
- **Ver Proposta** — Visualiza a proposta comercial
- **Ver Landing Page** — Visualiza a landing page gerada
- **Nova Missão** — Reinicia o pipeline

## Configurações (Settings)

Acesse via ícone ⚙ no rodapé:

### Efeitos Visuais
| Toggle | Descrição |
|--------|-----------|
| Code Rain | Chuva de código Matrix no fundo |
| Neo Trail | Rastro luminoso do Neo |
| Glitch | Efeito glitch nos agentes |
| Particles | Partículas ambientais |
| Reduce Motion | Desativa animações (acessibilidade) |

### Velocidades
| Slider | Range | Padrão |
|--------|-------|--------|
| Neo Speed | 50-300 px/s | 150 |
| Typewriter | 10-100 chars/s | 30 |

### Reset
Clique em **Reset to Defaults** para restaurar todas as configurações ao padrão.

## Atalhos de Teclado

| Atalho | Contexto | Ação |
|--------|----------|------|
| `Enter` | Popup de aprovação | Aprovar artefato |
| `E` | Popup de aprovação | Abrir editor |
| `Escape` | Qualquer modal | Fechar / Voltar |
| `Ctrl+S` | Editor de artefato | Salvar |
| `?` | Qualquer tela | Abrir ajuda rápida |

## Solução de Problemas

| Problema | Solução |
|----------|---------|
| Indicador de conexão vermelho | Verifique se o backend está rodando (`npm run dev`) |
| Agente travado em "processing" | Aguarde o timeout ou recarregue a página |
| Efeitos visuais pesados | Ative "Reduce Motion" nas configurações |
| Artefatos não baixam | Verifique se todos os agentes completaram |
