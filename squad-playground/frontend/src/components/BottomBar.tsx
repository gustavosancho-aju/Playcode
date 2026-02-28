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
      <div className="fixed bottom-0 left-0 right-0 h-12 glass-heavy flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-xs font-display font-medium text-gray-500 rounded-lg border border-white/[0.06] hover:border-white/[0.12] hover:text-gray-300 hover:bg-white/[0.03] transition-all duration-200">
            Pause
          </button>
          <button className="px-3 py-1.5 text-xs font-display font-medium text-gray-500 rounded-lg border border-white/[0.06] hover:border-white/[0.12] hover:text-gray-300 hover:bg-white/[0.03] transition-all duration-200">
            Download
          </button>
        </div>

        <ConnectionStatus />

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSettingsOpen(true)}
            className="px-3 py-1.5 text-xs font-display font-medium text-gray-500 rounded-lg border border-white/[0.06] hover:border-white/[0.12] hover:text-gray-300 hover:bg-white/[0.03] transition-all duration-200"
          >
            Settings
          </button>
          <button
            onClick={() => setHelpOpen(true)}
            className="px-3 py-1.5 text-xs font-display font-medium text-gray-500 rounded-lg border border-white/[0.06] hover:border-white/[0.12] hover:text-gray-300 hover:bg-white/[0.03] transition-all duration-200"
          >
            Help
          </button>
        </div>
      </div>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}
