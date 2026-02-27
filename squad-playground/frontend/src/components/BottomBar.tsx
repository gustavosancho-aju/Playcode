import { useState, useEffect } from 'react';
import { ConnectionStatus } from './ConnectionStatus';
import { SettingsPanel } from './SettingsPanel';
import { HelpModal } from './HelpModal';

export function BottomBar() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '?' && !settingsOpen) {
        setHelpOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [settingsOpen]);

  return (
    <>
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
          <button
            onClick={() => setSettingsOpen(true)}
            className="px-3 py-1 text-xs font-mono text-gray-400 border border-gray-700 rounded hover:border-matrix-green hover:text-matrix-green transition-colors"
          >
            ⚙ Settings
          </button>
          <button
            onClick={() => setHelpOpen(true)}
            className="px-3 py-1 text-xs font-mono text-gray-400 border border-gray-700 rounded hover:border-matrix-green hover:text-matrix-green transition-colors"
          >
            ? Help
          </button>
        </div>
      </div>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}
