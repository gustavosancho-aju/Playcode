import { usePipelineStore } from '../stores/usePipelineStore';
import { AGENT_DEFINITIONS } from 'shared/types';

export function MicroTasks() {
  const currentAgent = usePipelineStore((s) => s.currentAgent);
  const currentTasks = usePipelineStore((s) => s.currentTasks);
  const status = usePipelineStore((s) => s.status);

  if (!currentAgent || currentTasks.length === 0 || status === 'idle' || status === 'completed') {
    return null;
  }

  const def = AGENT_DEFINITIONS.find((a) => a.id === currentAgent);

  return (
    <div className="fixed right-[260px] bottom-[60px] w-[280px] bg-black/80 backdrop-blur-sm border border-matrix-green/30 rounded-lg z-20 pointer-events-auto overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b border-matrix-green/20"
        style={{ borderBottomColor: def?.color ? `${def.color}40` : undefined }}
      >
        <span className="text-sm">{def?.icon}</span>
        <span
          className="font-mono text-xs font-bold tracking-wider"
          style={{ color: def?.color }}
        >
          {def?.name?.toUpperCase()}
        </span>
        <span className="text-gray-500 font-mono text-[10px] ml-auto">
          {currentTasks.filter((t) => t.status === 'completed').length}/{currentTasks.length}
        </span>
      </div>

      {/* Task list */}
      <div className="flex flex-col gap-0.5 p-2 max-h-[240px] overflow-y-auto">
        {currentTasks.map((task, i) => {
          let icon = '⬜';
          let textClass = 'text-gray-500';

          if (task.status === 'completed') {
            icon = '✅';
            textClass = 'text-green-400/80';
          } else if (task.status === 'in_progress') {
            icon = '⏳';
            textClass = 'text-yellow-300';
          }

          return (
            <div
              key={i}
              className={`flex items-start gap-2 px-2 py-1 rounded ${
                task.status === 'in_progress' ? 'bg-yellow-400/5' : ''
              }`}
            >
              <span
                className={`text-xs flex-shrink-0 mt-0.5 ${
                  task.status === 'in_progress' ? 'animate-pulse' : ''
                }`}
              >
                {icon}
              </span>
              <span className={`font-mono text-[11px] leading-tight ${textClass}`}>
                {task.text}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-800">
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{
            width: `${(currentTasks.filter((t) => t.status === 'completed').length / currentTasks.length) * 100}%`,
            backgroundColor: def?.color || '#22c55e',
          }}
        />
      </div>
    </div>
  );
}
