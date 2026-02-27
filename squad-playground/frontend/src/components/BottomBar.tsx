import { ConnectionStatus } from './ConnectionStatus';

export function BottomBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-12 bg-matrix-black-soft/95 border-t border-matrix-green/20 flex items-center justify-between px-4 z-20">
      <div className="flex items-center gap-2">
        <button className="px-3 py-1 text-xs font-mono text-gray-400 border border-gray-700 rounded hover:border-matrix-green hover:text-matrix-green transition-colors">
          Pause
        </button>
        <button className="px-3 py-1 text-xs font-mono text-gray-400 border border-gray-700 rounded hover:border-matrix-green hover:text-matrix-green transition-colors">
          Download
        </button>
      </div>

      <ConnectionStatus />

      <div className="flex items-center gap-2">
        <button className="px-3 py-1 text-xs font-mono text-gray-400 border border-gray-700 rounded hover:border-matrix-green hover:text-matrix-green transition-colors">
          Settings
        </button>
        <button className="px-3 py-1 text-xs font-mono text-gray-400 border border-gray-700 rounded hover:border-matrix-green hover:text-matrix-green transition-colors">
          Help
        </button>
      </div>
    </div>
  );
}
