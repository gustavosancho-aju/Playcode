import { useState, useMemo } from 'react';
import { usePipelineStore } from '../stores/usePipelineStore';
import { AGENT_DEFINITIONS } from 'shared/types';
import type { AgentId, Task } from 'shared/types';

type StatusFilter = 'all' | 'pending' | 'in_progress' | 'completed';

interface AgentTask extends Task {
  agentId: AgentId;
}

export function TaskBoard() {
  const allTasks = usePipelineStore((s) => s.allTasks);
  const status = usePipelineStore((s) => s.status);
  const [agentFilter, setAgentFilter] = useState<AgentId | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const flatTasks = useMemo(() => {
    const tasks: AgentTask[] = [];
    for (const [agentId, agentTasks] of Object.entries(allTasks)) {
      if (agentTasks) {
        for (const task of agentTasks) {
          tasks.push({ ...task, agentId: agentId as AgentId });
        }
      }
    }
    return tasks;
  }, [allTasks]);

  const filteredTasks = useMemo(() => {
    return flatTasks.filter((t) => {
      if (agentFilter !== 'all' && t.agentId !== agentFilter) return false;
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      return true;
    });
  }, [flatTasks, agentFilter, statusFilter]);

  const completedCount = flatTasks.filter((t) => t.status === 'completed').length;
  const totalCount = flatTasks.length;
  const activeAgents = Object.keys(allTasks) as AgentId[];

  const getAgentDef = (id: AgentId) => AGENT_DEFINITIONS.find((a) => a.id === id);

  const statusIcon = (s: Task['status']) => {
    switch (s) {
      case 'completed': return '✅';
      case 'in_progress': return '⏳';
      default: return '⬜';
    }
  };

  const statusColor = (s: Task['status']) => {
    switch (s) {
      case 'completed': return 'text-green-400/80';
      case 'in_progress': return 'text-yellow-300';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="h-full overflow-y-auto px-6 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="font-mono text-2xl font-bold text-matrix-green tracking-wider">
            TASK BOARD
          </h1>
          {totalCount > 0 ? (
            <div className="flex items-center justify-center gap-3">
              <span className="text-gray-400 font-mono text-sm">
                {completedCount}/{totalCount} tarefas concluídas
              </span>
              <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-matrix-green transition-all duration-500 rounded-full"
                  style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="text-gray-500 font-mono text-sm">
              {status === 'idle' ? 'Inicie um pipeline para ver as tarefas dos agentes' : 'Aguardando tarefas...'}
            </p>
          )}
        </div>

        {/* Filters */}
        {totalCount > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Agent filter chips */}
            <button
              onClick={() => setAgentFilter('all')}
              className={`px-3 py-1 rounded-full font-mono text-[10px] border transition-colors ${
                agentFilter === 'all'
                  ? 'border-matrix-green text-matrix-green bg-matrix-green/10'
                  : 'border-gray-700 text-gray-500 hover:border-gray-500'
              }`}
            >
              Todos
            </button>
            {activeAgents.map((id) => {
              const def = getAgentDef(id);
              if (!def) return null;
              const isActive = agentFilter === id;
              return (
                <button
                  key={id}
                  onClick={() => setAgentFilter(isActive ? 'all' : id)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full font-mono text-[10px] border transition-colors ${
                    isActive
                      ? 'bg-opacity-20'
                      : 'border-gray-700 text-gray-500 hover:border-gray-500'
                  }`}
                  style={isActive ? { borderColor: def.color, color: def.color, backgroundColor: `${def.color}15` } : undefined}
                >
                  <span>{def.icon}</span>
                  <span>{def.name}</span>
                </button>
              );
            })}

            {/* Divider */}
            <div className="w-px h-5 bg-gray-700 mx-1" />

            {/* Status filter */}
            {(['all', 'pending', 'in_progress', 'completed'] as const).map((sf) => {
              const labels: Record<StatusFilter, string> = {
                all: 'Todos',
                pending: '⬜ Pendente',
                in_progress: '⏳ Em progresso',
                completed: '✅ Concluída',
              };
              return (
                <button
                  key={sf}
                  onClick={() => setStatusFilter(sf === statusFilter ? 'all' : sf)}
                  className={`px-2 py-1 rounded font-mono text-[10px] border transition-colors ${
                    statusFilter === sf
                      ? 'border-matrix-green/50 text-matrix-green bg-matrix-green/10'
                      : 'border-gray-800 text-gray-600 hover:text-gray-400'
                  }`}
                >
                  {labels[sf]}
                </button>
              );
            })}
          </div>
        )}

        {/* Tasks grouped by agent */}
        {totalCount > 0 && (
          <div className="space-y-4">
            {activeAgents
              .filter((id) => agentFilter === 'all' || agentFilter === id)
              .map((agentId) => {
                const def = getAgentDef(agentId);
                const tasks = (allTasks[agentId] || []).filter(
                  (t) => statusFilter === 'all' || t.status === statusFilter
                );
                if (tasks.length === 0) return null;
                const agentCompleted = tasks.filter((t) => t.status === 'completed').length;

                return (
                  <div key={agentId} className="space-y-2">
                    {/* Agent header */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{def?.icon}</span>
                      <span className="font-mono text-xs font-bold" style={{ color: def?.color }}>
                        {def?.name}
                      </span>
                      <span className="text-gray-600 font-mono text-[10px]">
                        {agentCompleted}/{tasks.length}
                      </span>
                      <div className="flex-1 h-px bg-gray-800" />
                    </div>

                    {/* Task items */}
                    <div className="space-y-1 pl-6">
                      {tasks.map((task, i) => (
                        <div
                          key={i}
                          className={`flex items-start gap-2 px-3 py-2 rounded-lg transition-colors ${
                            task.status === 'in_progress' ? 'bg-yellow-400/5 border border-yellow-400/20' : 'bg-black/30'
                          }`}
                        >
                          <span className={`text-xs flex-shrink-0 mt-0.5 ${task.status === 'in_progress' ? 'animate-pulse' : ''}`}>
                            {statusIcon(task.status)}
                          </span>
                          <span className={`font-mono text-[11px] leading-tight ${statusColor(task.status)}`}>
                            {task.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
