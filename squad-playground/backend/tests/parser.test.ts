import { parseAgentOutput } from '../src/parser/agent-parser';

describe('parseAgentOutput', () => {
  it('parses a full protocol message with all sections', () => {
    const raw = `[AGENT:Pesquisa][STATUS:processing]
Investigando mercado de SaaS
[TASKS]
- [x] Analisar concorrentes
- [~] Mapear público-alvo
- [ ] Consolidar dados
[/TASKS]
[OUTPUT:01-briefing-previo.md]
# Briefing
Conteúdo do relatório
[/OUTPUT]
[HANDOFF:Organizador]
Contexto para o próximo agente
[/HANDOFF]`;

    const result = parseAgentOutput(raw);

    expect(result.agent).toBe('pesquisa');
    expect(result.status).toBe('processing');
    expect(result.message).toBe('Investigando mercado de SaaS');
    expect(result.tasks).toHaveLength(3);
    expect(result.tasks[0]).toEqual({ text: 'Analisar concorrentes', status: 'completed' });
    expect(result.tasks[1]).toEqual({ text: 'Mapear público-alvo', status: 'in_progress' });
    expect(result.tasks[2]).toEqual({ text: 'Consolidar dados', status: 'pending' });
    expect(result.output).toEqual({
      filename: '01-briefing-previo.md',
      content: '# Briefing\nConteúdo do relatório',
    });
    expect(result.handoff).toBe('organizador');
  });

  it('parses message with only AGENT+STATUS (no TASKS/OUTPUT/HANDOFF)', () => {
    const raw = '[AGENT:Master][STATUS:active]\nOrquestrando pipeline';
    const result = parseAgentOutput(raw);

    expect(result.agent).toBe('master');
    expect(result.status).toBe('active');
    expect(result.message).toBe('Orquestrando pipeline');
    expect(result.tasks).toEqual([]);
    expect(result.output).toBeNull();
    expect(result.handoff).toBeNull();
  });

  it('parses message with TASKS but no OUTPUT', () => {
    const raw = `[AGENT:Solucoes][STATUS:processing]
Gerando ideias
[TASKS]
- [ ] Ideia 1
- [x] Ideia 2
[/TASKS]`;

    const result = parseAgentOutput(raw);

    expect(result.agent).toBe('solucoes');
    expect(result.tasks).toHaveLength(2);
    expect(result.output).toBeNull();
    expect(result.handoff).toBeNull();
  });

  it('returns fallback for malformed input (no tags)', () => {
    const raw = 'Just some random text without any protocol tags';
    const result = parseAgentOutput(raw);

    expect(result.agent).toBe('unknown');
    expect(result.status).toBe('idle');
    expect(result.message).toBe(raw);
    expect(result.tasks).toEqual([]);
    expect(result.output).toBeNull();
    expect(result.handoff).toBeNull();
  });

  it('returns fallback for empty string', () => {
    const result = parseAgentOutput('');

    expect(result.agent).toBe('unknown');
    expect(result.status).toBe('idle');
    expect(result.message).toBe('');
    expect(result.tasks).toEqual([]);
  });

  it('handles very long message (10,000+ chars)', () => {
    const longContent = 'A'.repeat(10000);
    const raw = `[AGENT:Financeiro][STATUS:done]\n${longContent}`;
    const result = parseAgentOutput(raw);

    expect(result.agent).toBe('financeiro');
    expect(result.status).toBe('done');
    expect(result.message).toBe(longContent);
  });

  it('handles multiple task markers correctly', () => {
    const raw = `[AGENT:Estruturas][STATUS:processing]
Trabalhando
[TASKS]
- [x] Done task
- [x] Another done
- [~] Working on this
- [ ] Not started
- [ ] Also not started
[/TASKS]`;

    const result = parseAgentOutput(raw);
    expect(result.tasks).toHaveLength(5);
    expect(result.tasks.filter((t) => t.status === 'completed')).toHaveLength(2);
    expect(result.tasks.filter((t) => t.status === 'in_progress')).toHaveLength(1);
    expect(result.tasks.filter((t) => t.status === 'pending')).toHaveLength(2);
  });

  it('handles special characters in message text', () => {
    const raw = '[AGENT:Closer][STATUS:active]\nPreço: R$ 1.500,00 — 50% desconto <tag> "quoted"';
    const result = parseAgentOutput(raw);

    expect(result.agent).toBe('closer');
    expect(result.message).toContain('R$ 1.500,00');
    expect(result.message).toContain('"quoted"');
  });

  it('handles whitespace-only input', () => {
    const result = parseAgentOutput('   \n\t  ');

    expect(result.agent).toBe('unknown');
    expect(result.status).toBe('idle');
  });

  it('handles OUTPUT without content', () => {
    const raw = '[AGENT:Apresentacao][STATUS:done]\nFinalizado\n[OUTPUT:spec.md]\n[/OUTPUT]';
    const result = parseAgentOutput(raw);

    expect(result.output).toEqual({ filename: 'spec.md', content: '' });
  });
});
