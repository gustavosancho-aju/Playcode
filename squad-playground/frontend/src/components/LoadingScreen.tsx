import { useConnectionStore } from '../stores/useConnectionStore';

export function LoadingScreen() {
  const isConnected = useConnectionStore((s) => s.isConnected);

  if (isConnected) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-matrix-black">
      {/* Animated ring */}
      <div className="relative w-16 h-16 mb-6">
        <div
          className="absolute inset-0 rounded-full animate-spin-slow"
          style={{
            background: 'conic-gradient(from 0deg, transparent, #22C55E, transparent)',
            mask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))',
            WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))',
          }}
        />
        <div className="absolute inset-2 rounded-full bg-matrix-black flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-matrix-green animate-pulse" />
        </div>
      </div>
      <p className="font-display text-sm text-gray-400 tracking-widest uppercase">
        Connecting
      </p>
    </div>
  );
}
