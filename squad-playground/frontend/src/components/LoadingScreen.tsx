import { useConnectionStore } from '../stores/useConnectionStore';

export function LoadingScreen() {
  const isConnected = useConnectionStore((s) => s.isConnected);

  if (isConnected) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-matrix-black">
      <p
        className="font-mono text-matrix-green text-lg animate-pulse"
        style={{
          textShadow: '0 0 10px rgba(34, 197, 94, 0.6)',
        }}
      >
        CONNECTING...
      </p>
    </div>
  );
}
