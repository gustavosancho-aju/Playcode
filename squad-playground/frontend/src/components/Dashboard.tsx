import { useAgentStore } from '../stores/useAgentStore';
import { AgentHouse } from './AgentHouse';

export function Dashboard() {
  const agents = useAgentStore((s) => s.agents);

  return (
    <div className="w-full px-4">
      <div
        className="flex items-center gap-0 overflow-x-auto scroll-smooth py-6 px-8"
        style={{ scrollbarWidth: 'thin' }}
      >
        {agents.map((agent, i) => (
          <div key={agent.id} className="flex items-center">
            <AgentHouse agent={agent} />
            {i < agents.length - 1 && (
              <div className="flex-shrink-0 w-12 h-0.5 bg-matrix-green opacity-40 shadow-glow" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
