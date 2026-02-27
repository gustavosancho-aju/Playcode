import { useEffect, useRef } from 'react';
import { useChatStore } from '../stores/useChatStore';

export function AgentChat() {
  const messages = useChatStore((s) => s.messages);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <div className="fixed right-0 top-0 h-full w-[260px] bg-black/70 backdrop-blur-sm border-l border-matrix-green/20 z-20 flex flex-col py-4 px-3 pointer-events-auto">
      <h3 className="text-matrix-green font-mono text-xs font-bold mb-4 text-center tracking-wider">
        AGENT LOG
      </h3>
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 scrollbar-thin scrollbar-thumb-matrix-green/30">
        {messages.length === 0 && (
          <p className="text-gray-600 font-mono text-[10px] text-center mt-8">
            Aguardando mensagens...
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className="flex gap-2 items-start">
            <span className="text-sm shrink-0">{msg.icon}</span>
            <div className="min-w-0">
              <span
                className="font-mono text-[10px] font-bold"
                style={{ color: msg.color }}
              >
                {msg.name}
              </span>
              <p className="font-mono text-[10px] text-gray-300 leading-relaxed">
                {msg.text}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
