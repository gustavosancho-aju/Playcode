import { useState, useEffect, useRef } from 'react';
import type { AgentState } from 'shared/types';
import { AGENT_DEFINITIONS } from 'shared/types';
import { StatusBadge } from './atoms/StatusBadge';

interface AgentHouseProps {
  agent: AgentState;
}

export function AgentHouse({ agent }: AgentHouseProps) {
  const isIdle = agent.status === 'idle';
  const isProcessing = agent.status === 'processing';
  const isActive = agent.status === 'active';
  const isDone = agent.status === 'done';
  const isError = agent.status === 'error';
  const isWorking = isProcessing || isActive;

  const [showTooltip, setShowTooltip] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startTimeRef = useRef<number | null>(null);

  const def = AGENT_DEFINITIONS.find((a) => a.id === agent.id);

  // Track execution time
  useEffect(() => {
    if (isWorking) {
      startTimeRef.current = Date.now();
      const timer = setInterval(() => {
        if (startTimeRef.current) {
          setElapsedMs(Date.now() - startTimeRef.current);
        }
      }, 1000);
      return () => clearInterval(timer);
    } else {
      startTimeRef.current = null;
      setElapsedMs(0);
    }
  }, [isWorking]);

  const formatTime = (ms: number) => {
    const secs = Math.floor(ms / 1000);
    if (secs < 60) return `${secs}s`;
    return `${Math.floor(secs / 60)}m${secs % 60}s`;
  };

  return (
    <div
      className={`
        relative flex-shrink-0 w-[200px] h-[250px] xl:w-[200px] lg:w-[160px] md:w-[128px]
        xl:h-[250px] lg:h-[200px] md:h-[160px]
        rounded-xl border-2 p-4
        flex flex-col items-center justify-between
        transition-all duration-500
        ${isIdle ? 'opacity-60 grayscale-[50%]' : ''}
        ${isError ? 'animate-[shake_0.3s_ease-in-out]' : ''}
      `}
      style={{
        borderColor: isIdle ? `${agent.color}40` : agent.color,
        boxShadow: isWorking
          ? `0 0 20px ${agent.color}50, 0 0 40px ${agent.color}25, inset 0 0 15px ${agent.color}10`
          : isDone
          ? `0 0 10px ${agent.color}30`
          : 'none',
        backgroundColor: 'rgba(26, 26, 46, 0.8)',
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      aria-label={`${agent.name}, status: ${agent.status}`}
    >
      {/* Speech bubble — shows message when working */}
      {agent.message && isWorking && (
        <div
          className="absolute -top-10 left-1/2 -translate-x-1/2 max-w-[180px] px-3 py-1.5 rounded-lg border text-center animate-fade-in"
          style={{
            backgroundColor: 'rgba(0,0,0,0.9)',
            borderColor: `${agent.color}60`,
          }}
        >
          <p className="text-[10px] font-mono text-gray-300 truncate">{agent.message}</p>
          <div
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border-b border-r"
            style={{
              backgroundColor: 'rgba(0,0,0,0.9)',
              borderColor: `${agent.color}60`,
            }}
          />
        </div>
      )}

      {/* Glow ring for active agent */}
      {isWorking && (
        <div
          className="absolute inset-0 rounded-xl animate-pulse pointer-events-none"
          style={{
            boxShadow: `0 0 30px ${agent.color}40`,
          }}
        />
      )}

      {/* Agent icon with status-dependent animation */}
      <div className={`text-4xl xl:text-4xl lg:text-3xl md:text-2xl transition-transform duration-300 ${
        isWorking ? 'animate-bounce' : isDone ? 'scale-110' : ''
      }`}>
        {agent.icon}
      </div>

      {/* Done checkmark overlay */}
      {isDone && (
        <div className="absolute top-3 right-3 text-green-400 text-lg animate-fade-in">
          ✓
        </div>
      )}

      <div className="text-center">
        <h3
          className="font-mono text-sm font-semibold mb-1 transition-colors duration-300"
          style={{ color: agent.color }}
        >
          {agent.name}
        </h3>
        <StatusBadge status={agent.status} />
      </div>

      {/* Execution timer */}
      {isWorking && elapsedMs > 0 && (
        <p className="text-[10px] text-yellow-300/70 font-mono animate-pulse">
          {formatTime(elapsedMs)}
        </p>
      )}

      {agent.message && !isWorking && (
        <p className="text-xs text-gray-500 font-mono text-center truncate w-full">
          {agent.message}
        </p>
      )}

      {!agent.message && !isWorking && <div />}

      {/* Tooltip on hover */}
      {showTooltip && (
        <div
          className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[220px] p-3 rounded-lg border z-30 animate-fade-in"
          style={{
            backgroundColor: 'rgba(0,0,0,0.95)',
            borderColor: `${agent.color}60`,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">{agent.icon}</span>
            <span className="font-mono text-xs font-bold" style={{ color: agent.color }}>
              {agent.name}
            </span>
          </div>
          <p className="text-gray-400 font-mono text-[10px]">{def?.role}</p>
          <p className="text-gray-500 font-mono text-[10px] mt-1">
            {def?.outputFile ? `Artefato: ${def.outputFile}` : 'Orquestrador'}
          </p>
          {agent.artifactPath && (
            <p className="text-green-400/70 font-mono text-[10px] mt-1 truncate">
              Último: {agent.artifactPath.split('/').pop()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
