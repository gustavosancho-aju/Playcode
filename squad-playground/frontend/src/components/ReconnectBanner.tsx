import { useConnectionStore } from '../stores/useConnectionStore';

export function ReconnectBanner() {
  const isConnected = useConnectionStore((s) => s.isConnected);
  const attempts = useConnectionStore((s) => s.reconnectAttempts);

  if (isConnected) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-900/95 border-b border-yellow-500 px-4 py-2 text-center">
      <span className="font-mono text-xs text-yellow-200">
        ⚡ Reconectando ao servidor...
        {attempts > 0 && (
          <span className="text-yellow-400 ml-2">Tentativa {attempts}</span>
        )}
      </span>
    </div>
  );
}
