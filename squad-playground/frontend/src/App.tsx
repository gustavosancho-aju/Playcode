import { ConnectionStatus } from './components/ConnectionStatus';
import { Dashboard } from './components/Dashboard';
import { useSocket } from './hooks/useSocket';
import { useConnectionStore } from './stores/useConnectionStore';

export default function App() {
  const { sendPing } = useSocket();
  const lastPong = useConnectionStore((s) => s.lastPong);

  return (
    <div className="min-h-screen bg-matrix-black text-white flex flex-col items-center gap-6 py-8">
      <header className="flex flex-col items-center gap-2">
        <h1 className="font-pixel text-matrix-green text-sm">SQUAD PLAYGROUND</h1>
        <p className="text-gray-500 font-mono text-sm">Matrix Pipeline v0.1.0</p>
      </header>

      <div className="flex items-center gap-4">
        <ConnectionStatus />
        <button
          onClick={sendPing}
          className="px-4 py-1.5 border border-matrix-green text-matrix-green font-mono text-xs rounded hover:bg-matrix-green hover:text-matrix-black transition-colors duration-200"
        >
          Send Ping
        </button>
        {lastPong && (
          <span className="text-matrix-neon font-mono text-xs">
            Pong at {new Date(lastPong).toISOString()}
          </span>
        )}
      </div>

      <Dashboard />
    </div>
  );
}
