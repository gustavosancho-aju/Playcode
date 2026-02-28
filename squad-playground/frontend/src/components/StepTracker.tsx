import { useAgentStore } from '../stores/useAgentStore';
import { AGENT_DEFINITIONS } from 'shared/types';

export function StepTracker() {
  const agents = useAgentStore((s) => s.agents);

  return (
    <div className="fixed left-0 top-0 h-full w-[200px] glass-heavy z-20 flex flex-col py-6 px-4 pointer-events-auto">
      <h3 className="font-display text-xs font-semibold text-gray-400 mb-5 tracking-[0.2em] uppercase text-center">
        Pipeline
      </h3>
      <div className="flex flex-col gap-1">
        {AGENT_DEFINITIONS.map((def, i) => {
          const agent = agents[i];
          const status = agent?.status ?? 'idle';
          const isActive = status === 'processing' || status === 'active';
          const isDone = status === 'done';
          const isError = status === 'error';

          return (
            <div
              key={def.id}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300
                ${isActive ? 'bg-white/[0.05]' : ''}
                ${isDone ? 'opacity-70' : ''}
              `}
            >
              {/* Status indicator */}
              <div className="relative flex-shrink-0">
                <div
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    isDone ? 'bg-green-400' :
                    isActive ? 'bg-yellow-400 animate-pulse' :
                    isError ? 'bg-red-400' :
                    'bg-gray-700'
                  }`}
                />
                {isActive && (
                  <div className="absolute inset-0 w-2 h-2 rounded-full bg-yellow-400/50 animate-ping" />
                )}
              </div>

              {/* Agent icon */}
              <span className="text-sm">{def.icon}</span>

              {/* Agent name */}
              <span
                className={`font-display text-[11px] font-medium truncate transition-colors duration-300 ${
                  isActive ? 'text-white' :
                  isDone ? 'text-gray-500' :
                  isError ? 'text-red-400' :
                  'text-gray-600'
                }`}
              >
                {def.name}
              </span>

              {/* Done check */}
              {isDone && (
                <span className="ml-auto text-green-400/60 text-[10px]">&#10003;</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
