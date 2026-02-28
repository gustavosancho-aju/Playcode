import { useState, useEffect, useRef, useCallback } from 'react';
import type { AgentState } from 'shared/types';
import { AGENT_DEFINITIONS } from 'shared/types';
import { StatusBadge } from './atoms/StatusBadge';
import { useSettingsStore } from '../stores/useSettingsStore';

function playCompletionSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
    setTimeout(() => ctx.close(), 500);
  } catch { /* ignore audio errors */ }
}

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
  const soundEnabled = useSettingsStore((s) => s.effects.soundEnabled);
  const prevStatusRef = useRef(agent.status);

  // Play sound on completion
  useEffect(() => {
    if (prevStatusRef.current !== 'done' && agent.status === 'done' && soundEnabled) {
      playCompletionSound();
    }
    prevStatusRef.current = agent.status;
  }, [agent.status, soundEnabled]);

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

  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--spotlight-x', `${e.clientX - rect.left}px`);
    el.style.setProperty('--spotlight-y', `${e.clientY - rect.top}px`);
  }, []);

  return (
    <div
      ref={cardRef}
      className={`
        card-3d spotlight-card relative flex-shrink-0
        w-[200px] h-[250px] xl:w-[200px] lg:w-[160px] md:w-[128px]
        xl:h-[250px] lg:h-[200px] md:h-[160px]
        rounded-2xl p-4
        flex flex-col items-center justify-between
        transition-all duration-500
        ${isIdle ? 'opacity-50' : ''}
        ${isError ? 'animate-[shake_0.3s_ease-in-out]' : ''}
      `}
      style={{
        background: isWorking
          ? `linear-gradient(135deg, ${agent.color}08, ${agent.color}04)`
          : '#1A1A1A',
        border: `1px solid ${isIdle ? 'rgba(255,255,255,0.06)' : `${agent.color}30`}`,
        boxShadow: isWorking
          ? `0 20px 40px rgba(0,0,0,0.5), 0 0 30px ${agent.color}15, inset 0 1px 0 rgba(255,255,255,0.04)`
          : isDone
          ? `0 10px 30px rgba(0,0,0,0.4), 0 0 20px ${agent.color}10`
          : '0 4px 20px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      aria-label={`${agent.name}, status: ${agent.status}`}
    >
      {/* Speech bubble — shows message when working */}
      {agent.message && isWorking && (
        <div
          className="absolute -top-10 left-1/2 -translate-x-1/2 max-w-[180px] px-3 py-1.5 rounded-xl glass animate-fade-in"
        >
          <p className="text-[10px] font-mono text-gray-300 truncate">{agent.message}</p>
          <div
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45"
            style={{
              background: 'rgba(255,255,255,0.03)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              borderRight: '1px solid rgba(255,255,255,0.06)',
            }}
          />
        </div>
      )}

      {/* Glow ring for active agent */}
      {isWorking && (
        <div
          className="absolute inset-0 rounded-2xl animate-pulse pointer-events-none"
          style={{
            boxShadow: `0 0 40px ${agent.color}20`,
          }}
        />
      )}

      {/* Agent icon with status-dependent animation */}
      <div className={`text-4xl xl:text-4xl lg:text-3xl md:text-2xl transition-transform duration-500 ${
        isWorking ? 'animate-bounce' : isDone ? 'scale-110' : ''
      }`}>
        {agent.icon}
      </div>

      {/* Done checkmark overlay */}
      {isDone && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center animate-fade-in">
          <span className="text-green-400 text-xs">&#10003;</span>
        </div>
      )}

      {/* Mini-preview monitor — shows first lines of output when working or done */}
      {(isWorking || isDone) && agent.message && (
        <div
          className="w-full h-12 rounded-lg overflow-hidden px-2 py-1.5"
          style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <div className={`font-mono text-[8px] leading-[11px] overflow-hidden h-full ${isWorking ? 'animate-pulse' : ''}`}>
            {agent.message.slice(0, 120).split('\n').slice(0, 4).map((line, i) => (
              <div key={i} className="truncate" style={{ color: `${agent.color}60` }}>{line || '\u00A0'}</div>
            ))}
          </div>
        </div>
      )}

      <div className="text-center">
        <h3 className="font-display text-sm font-semibold mb-1 transition-colors duration-300" style={{ color: agent.color }}>
          {agent.name}
        </h3>
        <StatusBadge status={agent.status} />
      </div>

      {/* Execution timer */}
      {isWorking && elapsedMs > 0 && (
        <p className="text-[10px] text-gray-500 font-mono tabular-nums">
          {formatTime(elapsedMs)}
        </p>
      )}

      {agent.message && !isWorking && (
        <p className="text-xs text-gray-600 font-mono text-center truncate w-full">
          {agent.message}
        </p>
      )}

      {!agent.message && !isWorking && <div />}

      {/* Tooltip on hover */}
      {showTooltip && (
        <div
          className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[220px] p-3 rounded-xl glass z-30 animate-fade-in shadow-glass"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">{agent.icon}</span>
            <span className="font-display text-xs font-bold" style={{ color: agent.color }}>
              {agent.name}
            </span>
          </div>
          <p className="text-gray-500 text-[10px]">{def?.role}</p>
          <p className="text-gray-600 text-[10px] mt-1">
            {def?.outputFile ? `Artefato: ${def.outputFile}` : 'Orquestrador'}
          </p>
          {agent.artifactPath && (
            <p className="text-green-400/50 text-[10px] mt-1 truncate">
              {agent.artifactPath.split('/').pop()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
