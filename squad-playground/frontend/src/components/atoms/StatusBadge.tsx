import type { AgentStatus } from 'shared/types';

const STATUS_CONFIG: Record<AgentStatus, { color: string; label: string; pulse?: boolean }> = {
  idle: { color: 'bg-gray-500', label: 'Idle' },
  active: { color: 'bg-blue-500', label: 'Active' },
  processing: { color: 'bg-yellow-500', label: 'Processing', pulse: true },
  done: { color: 'bg-green-500', label: 'Done' },
  error: { color: 'bg-red-500', label: 'Error' },
  paused: { color: 'bg-purple-500', label: 'Paused' },
};

interface StatusBadgeProps {
  status: AgentStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`inline-block w-2 h-2 rounded-full ${config.color} ${
          config.pulse ? 'animate-pulse' : ''
        }`}
      />
      <span className="text-xs font-mono text-gray-400">{config.label}</span>
    </div>
  );
}
