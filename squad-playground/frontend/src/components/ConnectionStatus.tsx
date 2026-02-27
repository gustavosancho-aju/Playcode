import { useConnectionStore } from '../stores/useConnectionStore';

export function ConnectionStatus() {
  const isConnected = useConnectionStore((s) => s.isConnected);
  const reconnectAttempts = useConnectionStore((s) => s.reconnectAttempts);

  return (
    <div className="flex items-center gap-2 font-mono text-sm">
      <span
        className={`inline-block w-2.5 h-2.5 rounded-full ${
          isConnected ? 'bg-matrix-green shadow-glow' : 'bg-red-500'
        }`}
      />
      <span className={isConnected ? 'text-matrix-green' : 'text-red-500'}>
        {isConnected ? 'Connected' : 'Disconnected'}
      </span>
      {!isConnected && reconnectAttempts > 0 && (
        <span className="text-yellow-500 text-xs">
          (reconnecting... {reconnectAttempts})
        </span>
      )}
    </div>
  );
}
