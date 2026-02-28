import { useState } from 'react';
import { useAgentStore } from '../stores/useAgentStore';
import { AGENT_DEFINITIONS, AGENT_GROUPS } from 'shared/types';
import type { AgentId, AgentDefinition, AgentState } from 'shared/types';

interface AgentDetailModalProps {
  agent: AgentDefinition;
  state: AgentState;
  onClose: () => void;
}

function AgentDetailModal({ agent, state, onClose }: AgentDetailModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-[400px] glass rounded-2xl p-6 space-y-4 shadow-glass"
        style={{ borderColor: `${agent.color}30` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4">
          <span className="text-5xl">{agent.icon}</span>
          <div>
            <h2 className="font-display text-xl font-bold" style={{ color: agent.color }}>
              {agent.name}
            </h2>
            <p className="text-gray-400 font-display text-sm">{agent.role}</p>
          </div>
        </div>

        <div className="border-t border-white/[0.06] pt-4 space-y-3">
          <div>
            <span className="text-gray-500 font-display text-xs uppercase tracking-wider">Status</span>
            <div className="flex items-center gap-2 mt-1">
              <StatusDot status={state.status} />
              <span className="text-gray-300 font-display text-sm capitalize">{state.status}</span>
            </div>
          </div>

          <div>
            <span className="text-gray-500 font-display text-xs uppercase tracking-wider">Pipeline</span>
            <p className="text-gray-300 font-display text-sm mt-1">
              {agent.inputFrom === 'user' ? 'Recebe input do usuário' : `Recebe de ${agent.inputFrom}`}
              {' → '}
              {agent.handoffTo === 'complete' ? 'Entrega final' : `Passa para ${agent.handoffTo}`}
            </p>
          </div>

          <div>
            <span className="text-gray-500 font-display text-xs uppercase tracking-wider">Artefato</span>
            <p className="text-gray-300 font-display text-sm mt-1">
              {agent.outputFile || 'Nenhum (orquestrador)'}
            </p>
          </div>

          {state.artifactPath && (
            <div>
              <span className="text-gray-500 font-display text-xs uppercase tracking-wider">Último Artefato</span>
              <p className="text-green-400 font-mono text-xs mt-1 truncate">
                {state.artifactPath.split('/').pop()}
              </p>
            </div>
          )}

          {state.message && (
            <div>
              <span className="text-gray-500 font-display text-xs uppercase tracking-wider">Mensagem</span>
              <p className="text-yellow-300 font-mono text-xs mt-1">{state.message}</p>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-2.5 rounded-xl glass font-display text-xs font-medium text-gray-400 hover:text-white hover:bg-white/[0.05] transition-all duration-300"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  let color = 'bg-gray-600';
  let pulse = false;

  switch (status) {
    case 'processing':
    case 'active':
      color = 'bg-yellow-400';
      pulse = true;
      break;
    case 'done':
      color = 'bg-green-400';
      break;
    case 'error':
      color = 'bg-red-400';
      break;
    case 'paused':
      color = 'bg-cyan-400';
      break;
  }

  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full ${color} ${pulse ? 'animate-pulse' : ''}`} />
  );
}

export function TeamStructure() {
  const agents = useAgentStore((s) => s.agents);
  const [selectedAgent, setSelectedAgent] = useState<AgentId | null>(null);

  const getAgentDef = (id: AgentId) => AGENT_DEFINITIONS.find((a) => a.id === id)!;
  const getAgentState = (id: AgentId) => agents.find((a) => a.id === id)!;

  const selectedDef = selectedAgent ? getAgentDef(selectedAgent) : null;
  const selectedState = selectedAgent ? getAgentState(selectedAgent) : null;

  return (
    <div className="h-full overflow-y-auto px-6 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="font-display text-2xl font-bold text-gradient tracking-wide">
            ESTRUTURA DA EQUIPE
          </h1>
          <p className="text-gray-500 font-display text-sm">
            {agents.filter((a) => a.status === 'processing' || a.status === 'active').length} agente(s) ativo(s)
            {' · '}
            {agents.filter((a) => a.status === 'done').length} concluído(s)
          </p>
        </div>

        {/* Groups */}
        <div className="space-y-6">
          {AGENT_GROUPS.map((group) => (
            <div key={group.label} className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-lg">{group.icon}</span>
                <h2
                  className="font-display text-sm font-bold tracking-wider uppercase"
                  style={{ color: group.color }}
                >
                  {group.label}
                </h2>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-8">
                {group.agents.map((agentId) => {
                  const def = getAgentDef(agentId);
                  const state = getAgentState(agentId);
                  const isActive = state.status === 'processing' || state.status === 'active';

                  return (
                    <button
                      key={agentId}
                      onClick={() => setSelectedAgent(agentId)}
                      onMouseMove={(e) => {
                        const el = e.currentTarget;
                        const rect = el.getBoundingClientRect();
                        el.style.setProperty('--spotlight-x', `${e.clientX - rect.left}px`);
                        el.style.setProperty('--spotlight-y', `${e.clientY - rect.top}px`);
                      }}
                      className={`
                        relative flex items-center gap-4 p-4 rounded-xl spotlight-card text-left
                        transition-all duration-300
                        ${isActive ? 'shadow-lg' : ''}
                      `}
                      style={{
                        background: isActive ? `linear-gradient(135deg, ${def.color}08, ${def.color}04)` : '#1A1A1A',
                        border: `1px solid ${isActive ? `${def.color}40` : 'rgba(255,255,255,0.08)'}`,
                        boxShadow: isActive ? `0 0 30px ${def.color}15` : undefined,
                      }}
                    >
                      <div
                        className={`
                          flex items-center justify-center w-12 h-12 rounded-xl text-2xl
                          ${isActive ? 'animate-bounce' : ''}
                        `}
                        style={{ backgroundColor: `${def.color}15` }}
                      >
                        {def.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-display text-sm font-bold text-gray-200">
                            {def.name}
                          </span>
                          <StatusDot status={state.status} />
                        </div>
                        <p className="text-gray-500 font-display text-xs mt-0.5">{def.role}</p>
                        {state.message && (
                          <p className="text-yellow-300/80 font-mono text-[10px] mt-1 truncate">
                            {state.message}
                          </p>
                        )}
                      </div>

                      <span className="text-gray-600 text-sm">›</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedDef && selectedState && (
        <AgentDetailModal
          agent={selectedDef}
          state={selectedState}
          onClose={() => setSelectedAgent(null)}
        />
      )}
    </div>
  );
}
