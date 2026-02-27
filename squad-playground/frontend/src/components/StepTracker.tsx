import { useAgentStore } from '../stores/useAgentStore';
import { AGENT_DEFINITIONS } from 'shared/types';

export function StepTracker() {
  const agents = useAgentStore((s) => s.agents);

  return (
    <div className="fixed left-0 top-0 h-full w-[180px] bg-black/70 backdrop-blur-sm border-r border-matrix-green/20 z-20 flex flex-col py-4 px-3 pointer-events-auto">
      <h3 className="text-matrix-green font-mono text-xs font-bold mb-4 text-center tracking-wider">
        PIPELINE
      </h3>
      <div className="flex flex-col gap-2">
        {AGENT_DEFINITIONS.map((def, i) => {
          const agent = agents[i];
          const status = agent?.status ?? 'idle';

          let statusIcon = '⬜';
          let statusClass = 'text-gray-500';
          if (status === 'done') {
            statusIcon = '✅';
            statusClass = 'text-green-400';
          } else if (status === 'processing' || status === 'active') {
            statusIcon = '⚡';
            statusClass = 'text-yellow-400 animate-pulse';
          } else if (status === 'error') {
            statusIcon = '❌';
            statusClass = 'text-red-400';
          }

          return (
            <div
              key={def.id}
              className={`flex items-center gap-2 px-2 py-1.5 rounded ${
                status === 'processing' || status === 'active'
                  ? 'bg-white/5'
                  : ''
              }`}
            >
              <span className="text-sm">{statusIcon}</span>
              <span className="text-sm">{def.icon}</span>
              <span
                className={`font-mono text-[10px] truncate ${statusClass}`}
                style={{ color: status === 'idle' ? undefined : def.color }}
              >
                {def.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
