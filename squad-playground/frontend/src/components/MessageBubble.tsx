import { useEffect, useState } from 'react';
import { usePipelineStore } from '../stores/usePipelineStore';
import { useAgentStore } from '../stores/useAgentStore';
import { useSettingsStore } from '../stores/useSettingsStore';

const AUTO_DISMISS_MS = 5000;

export function MessageBubble() {
  const { currentAgent, message, status } = usePipelineStore();
  const agents = useAgentStore((s) => s.agents);
  const typewriterCharsPerSec = useSettingsStore((s) => s.animation.typewriterSpeed);
  const [displayText, setDisplayText] = useState('');
  const [visible, setVisible] = useState(false);

  const agent = agents.find((a) => a.id === currentAgent);

  // Typewriter effect
  useEffect(() => {
    if (!message) {
      setDisplayText('');
      setVisible(false);
      return;
    }

    setVisible(true);
    setDisplayText('');
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayText(message.slice(0, i));
      if (i >= message.length) clearInterval(timer);
    }, Math.round(1000 / typewriterCharsPerSec));

    return () => clearInterval(timer);
  }, [message, typewriterCharsPerSec]);

  // Auto-dismiss after completion
  useEffect(() => {
    if (status === 'completed' || status === 'idle') {
      const timer = setTimeout(() => setVisible(false), AUTO_DISMISS_MS);
      return () => clearTimeout(timer);
    }
  }, [status]);

  if (!visible || !agent || !message) return null;

  return (
    <div className="flex justify-center w-full max-w-3xl px-4">
      <div
        className="relative px-4 py-2 rounded-lg border font-mono text-sm max-w-md"
        style={{
          borderColor: agent.color,
          backgroundColor: 'rgba(26, 26, 46, 0.9)',
          boxShadow: `0 0 10px ${agent.color}30`,
        }}
      >
        <span className="text-xs font-bold mr-2" style={{ color: agent.color }}>
          {agent.icon} {agent.name}:
        </span>
        <span className="text-gray-300">{displayText}</span>
        <span className="animate-pulse text-matrix-green">▌</span>
      </div>
    </div>
  );
}
