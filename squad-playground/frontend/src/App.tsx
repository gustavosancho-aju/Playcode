import { ConnectionStatus } from './components/ConnectionStatus';
import { useSocket } from './hooks/useSocket';
import { useConnectionStore } from './stores/useConnectionStore';

export default function App() {
  const { sendPing } = useSocket();
  const lastPong = useConnectionStore((s) => s.lastPong);

  return (
    <div className="min-h-screen bg-matrix-black text-white flex flex-col items-center justify-center gap-8">
      <h1 className="font-pixel text-matrix-green text-sm">SQUAD PLAYGROUND</h1>
      <p className="text-gray-500 font-mono text-sm">Matrix Pipeline v0.1.0</p>

      <ConnectionStatus />

      <button
        onClick={sendPing}
        className="px-6 py-2 border border-matrix-green text-matrix-green font-mono text-sm rounded hover:bg-matrix-green hover:text-matrix-black transition-colors duration-200"
      >
        Send Ping
      </button>

      {lastPong && (
        <p className="text-matrix-neon font-mono text-sm">
          Pong received at {new Date(lastPong).toISOString()}
        </p>
      )}
    </div>
  );
}
