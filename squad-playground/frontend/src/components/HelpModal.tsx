import { useEffect, useRef } from 'react';

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

export function HelpModal({ open, onClose }: HelpModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div
        ref={panelRef}
        className="w-full max-w-lg max-h-[80vh] overflow-y-auto bg-[#0D0D0D] border border-matrix-green/30 rounded-lg p-6 font-mono text-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-matrix-green font-bold text-base">? Ajuda Rápida</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-lg">✕</button>
        </div>

        <section className="mb-4">
          <h3 className="text-matrix-green/80 font-bold mb-2">Atalhos de Teclado</h3>
          <table className="w-full text-xs">
            <tbody className="text-gray-300">
              <tr className="border-b border-gray-800"><td className="py-1 text-matrix-neon">Enter</td><td>Aprovar artefato</td></tr>
              <tr className="border-b border-gray-800"><td className="py-1 text-matrix-neon">E</td><td>Editar artefato</td></tr>
              <tr className="border-b border-gray-800"><td className="py-1 text-matrix-neon">Escape</td><td>Fechar / Voltar</td></tr>
              <tr className="border-b border-gray-800"><td className="py-1 text-matrix-neon">Ctrl+S</td><td>Salvar edição</td></tr>
              <tr><td className="py-1 text-matrix-neon">?</td><td>Abrir esta ajuda</td></tr>
            </tbody>
          </table>
        </section>

        <section className="mb-4">
          <h3 className="text-matrix-green/80 font-bold mb-2">Etapas do Pipeline</h3>
          <div className="grid grid-cols-2 gap-1 text-xs text-gray-300">
            <span>👑 Master CEO</span><span className="text-gray-500">Orquestrador</span>
            <span>📚 Pesquisa</span><span className="text-gray-500">Investigador</span>
            <span>📋 Organizador</span><span className="text-gray-500">Curador</span>
            <span>💡 Soluções</span><span className="text-gray-500">Visionário</span>
            <span>🏗️ Estruturas</span><span className="text-gray-500">Arquiteto</span>
            <span>💰 Financeiro</span><span className="text-gray-500">Analista</span>
            <span>✍️ Closer</span><span className="text-gray-500">Persuasor</span>
            <span>🎨 Apresentação</span><span className="text-gray-500">Designer</span>
          </div>
        </section>

        <section>
          <h3 className="text-matrix-green/80 font-bold mb-2">Dicas</h3>
          <ul className="text-xs text-gray-300 space-y-1">
            <li>• Use ⚙ Settings para ajustar efeitos visuais e velocidades</li>
            <li>• Ative "Reduce Motion" se as animações estiverem pesadas</li>
            <li>• Edite artefatos antes de aprovar para customizar a saída</li>
            <li>• Na tela de vitória, baixe todos os artefatos em ZIP</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
