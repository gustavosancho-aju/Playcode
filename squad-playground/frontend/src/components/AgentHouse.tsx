import type { AgentState } from 'shared/types';
import { StatusBadge } from './atoms/StatusBadge';

interface AgentHouseProps {
  agent: AgentState;
}

export function AgentHouse({ agent }: AgentHouseProps) {
  const isIdle = agent.status === 'idle';
  const isProcessing = agent.status === 'processing';
  const isError = agent.status === 'error';

  return (
    <div
      className={`
        flex-shrink-0 w-[200px] h-[250px] xl:w-[200px] lg:w-[160px] md:w-[128px]
        xl:h-[250px] lg:h-[200px] md:h-[160px]
        rounded-xl border-2 p-4
        flex flex-col items-center justify-between
        transition-all duration-300
        ${isIdle ? 'opacity-60 grayscale-[50%]' : ''}
        ${isProcessing ? 'animate-pulse-glow' : ''}
        ${isError ? 'animate-[shake_0.3s_ease-in-out]' : ''}
      `}
      style={{
        borderColor: agent.color,
        boxShadow: !isIdle ? `0 0 15px ${agent.color}40, 0 0 30px ${agent.color}20` : 'none',
        backgroundColor: 'rgba(26, 26, 46, 0.8)',
      }}
      aria-label={`${agent.name}, status: ${agent.status}`}
    >
      <div className="text-4xl xl:text-4xl lg:text-3xl md:text-2xl">{agent.icon}</div>

      <div className="text-center">
        <h3
          className="font-mono text-sm font-semibold mb-1"
          style={{ color: agent.color }}
        >
          {agent.name}
        </h3>
        <StatusBadge status={agent.status} />
      </div>

      {agent.message && (
        <p className="text-xs text-gray-500 font-mono text-center truncate w-full">
          {agent.message}
        </p>
      )}

      {!agent.message && <div />}
    </div>
  );
}
