import { useEffect, useRef, useState } from 'react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { AGENT_DEFINITIONS, PIPELINE_ORDER } from 'shared/types';
import type { AgentId } from 'shared/types';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const {
    effects,
    animation,
    pipeline,
    toggleEffect,
    setReduceMotion,
    setNeoSpeed,
    setTypewriterSpeed,
    setAgentApproval,
    resetDefaults,
  } = useSettingsStore();

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const agents = PIPELINE_ORDER.map((id) => AGENT_DEFINITIONS.find((a) => a.id === id)!);

  function handleReset() {
    resetDefaults();
    setShowResetConfirm(false);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50">
      <div
        ref={panelRef}
        className="fixed top-0 right-0 h-full w-80 bg-[#0D0D0D] border-l border-matrix-green/30 overflow-y-auto animate-slide-in-right"
        style={{ fontFamily: '"JetBrains Mono", monospace' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-matrix-green/20">
          <h2 className="text-matrix-green text-sm font-bold tracking-wider">
            ⚙ SETTINGS
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-matrix-green transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        {/* Visual Effects */}
        <Section title="Visual Effects">
          <Toggle
            label="Code Rain"
            checked={effects.codeRain}
            onChange={() => toggleEffect('codeRain')}
            disabled={effects.reduceMotion}
          />
          <Toggle
            label="Neo Trail"
            checked={effects.neoTrail}
            onChange={() => toggleEffect('neoTrail')}
            disabled={effects.reduceMotion}
          />
          <Toggle
            label="Glitch Effect"
            checked={effects.glitch}
            onChange={() => toggleEffect('glitch')}
            disabled={effects.reduceMotion}
          />
          <Toggle
            label="Particles"
            checked={effects.particles}
            onChange={() => toggleEffect('particles')}
            disabled={effects.reduceMotion}
          />
          <div className="mt-2 pt-2 border-t border-matrix-green/10">
            <Toggle
              label="Reduce Motion"
              checked={effects.reduceMotion}
              onChange={() => setReduceMotion(!effects.reduceMotion)}
              accent
            />
          </div>
        </Section>

        {/* Pipeline Approval */}
        <Section title="Pipeline Approval">
          {agents.map((agent) => (
            <div key={agent.id} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: agent.color }}
                />
                <span className="text-gray-300 text-xs">{agent.icon} {agent.name}</span>
              </div>
              <input
                type="checkbox"
                checked={pipeline.approvalPerAgent[agent.id as AgentId] ?? false}
                onChange={(e) => setAgentApproval(agent.id as AgentId, e.target.checked)}
                className="accent-[#22C55E] w-3.5 h-3.5 cursor-pointer"
              />
            </div>
          ))}
        </Section>

        {/* Animation */}
        <Section title="Animation">
          <Slider
            label="Neo Speed"
            value={animation.neoSpeed}
            min={50}
            max={300}
            unit="px/s"
            onChange={setNeoSpeed}
          />
          <Slider
            label="Typewriter Speed"
            value={animation.typewriterSpeed}
            min={10}
            max={100}
            unit="chars/s"
            onChange={setTypewriterSpeed}
          />
        </Section>

        {/* Reset */}
        <div className="p-4 border-t border-matrix-green/20">
          {showResetConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-yellow-400">Confirm?</span>
              <button
                onClick={handleReset}
                className="px-3 py-1 text-xs bg-red-900/50 border border-red-500 text-red-400 rounded hover:bg-red-900 transition-colors"
              >
                Yes, Reset
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1 text-xs border border-gray-600 text-gray-400 rounded hover:border-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full px-4 py-2 text-xs border border-gray-600 text-gray-400 rounded hover:border-matrix-green hover:text-matrix-green transition-colors"
            >
              Reset to Defaults
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* --- Sub-components --- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 border-b border-matrix-green/10">
      <h3 className="text-matrix-green/70 text-[10px] uppercase tracking-widest mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  disabled,
  accent,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-xs ${accent ? 'text-yellow-400' : 'text-gray-300'} ${disabled ? 'opacity-40' : ''}`}>
        {label}
      </span>
      <button
        onClick={onChange}
        disabled={disabled}
        className={`w-9 h-5 rounded-full relative transition-colors duration-200 ${
          disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
        } ${checked ? 'bg-matrix-green/80' : 'bg-gray-700'}`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
            checked ? 'translate-x-[18px]' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-300">{label}</span>
        <span className="text-xs text-matrix-green">{value} {unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 bg-gray-700 rounded-full appearance-none cursor-pointer accent-[#22C55E]"
      />
    </div>
  );
}
