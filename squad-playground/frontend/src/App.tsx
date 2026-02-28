import { lazy, Suspense, useCallback, useRef, useState } from 'react';
import { MatrixRain } from './components/MatrixRain';
import { LoadingScreen } from './components/LoadingScreen';
import { Title } from './components/Title';
import { GameCanvas } from './game/GameCanvas';
import { ProgressBar } from './components/ProgressBar';
import { ErrorToast } from './components/ErrorToast';
import { ToastSystem } from './components/ToastSystem';
import { ReconnectBanner } from './components/ReconnectBanner';
import { GameHUD } from './components/GameHUD';
import { BottomBar } from './components/BottomBar';
import { PipelineStarter } from './components/PipelineStarter';
import { StepTracker } from './components/StepTracker';
import { AgentChat } from './components/AgentChat';
import { MicroTasks } from './components/MicroTasks';
import { TeamStructure } from './components/TeamStructure';
import { TaskBoard } from './components/TaskBoard';
import { ProjectHistory } from './components/ProjectHistory';
import { useSocket } from './hooks/useSocket';
import { useConnectionStore } from './stores/useConnectionStore';
import { useAgentStore } from './stores/useAgentStore';
import { usePipelineStore } from './stores/usePipelineStore';
import { useChatStore } from './stores/useChatStore';
import { AGENT_DEFINITIONS } from 'shared/types';
import type { AgentId } from 'shared/types';

type AppTab = 'pipeline' | 'equipe' | 'tarefas' | 'projetos';

// Lazy load heavy overlays (AC: 8 — bundle optimization)
const ApprovalPopup = lazy(() => import('./components/ApprovalPopup').then((m) => ({ default: m.ApprovalPopup })));
const VictoryScreen = lazy(() => import('./components/VictoryScreen').then((m) => ({ default: m.VictoryScreen })));

const DEMO_MESSAGES: Record<string, string> = {
  master: 'Iniciando orquestração do pipeline...',
  pesquisa: 'Pesquisando dados e referências do mercado...',
  organizador: 'Organizando informações coletadas...',
  solucoes: 'Gerando soluções criativas...',
  estruturas: 'Definindo estrutura dos produtos...',
  financeiro: 'Analisando viabilidade financeira...',
  closer: 'Elaborando proposta comercial...',
  apresentacao: 'Montando apresentação final!',
};

const TAB_ITEMS: { id: AppTab; label: string; icon: string }[] = [
  { id: 'pipeline', label: 'Pipeline', icon: '⚡' },
  { id: 'tarefas', label: 'Tarefas', icon: '📋' },
  { id: 'equipe', label: 'Equipe', icon: '👥' },
  { id: 'projetos', label: 'Projetos', icon: '📁' },
];

export default function App() {
  const { sendPing } = useSocket();
  const lastPong = useConnectionStore((s) => s.lastPong);
  const demoRunning = useRef(false);
  const [activeTab, setActiveTab] = useState<AppTab>('pipeline');

  const runDemo = useCallback(async () => {
    if (demoRunning.current) return;
    demoRunning.current = true;

    // Reset
    useAgentStore.getState().resetAll();
    usePipelineStore.getState().reset();
    useChatStore.getState().clear();

    const agents = AGENT_DEFINITIONS;

    for (let i = 0; i < agents.length; i++) {
      const def = agents[i];
      const id = def.id as AgentId;

      // Set processing
      useAgentStore.getState().updateAgent(id, { status: 'processing', message: DEMO_MESSAGES[id] || 'Processando...' });
      usePipelineStore.getState().updateProgress({
        agent: id,
        status: 'processing',
        step: i + 1,
        totalSteps: agents.length,
        message: DEMO_MESSAGES[id],
      });
      useChatStore.getState().addMessage({
        agentId: id,
        icon: def.icon,
        name: def.name,
        color: def.color,
        text: DEMO_MESSAGES[id] || 'Processando...',
      });

      // Wait processing time
      await new Promise((r) => setTimeout(r, 1500));

      // Set done
      useAgentStore.getState().updateAgent(id, { status: 'done', message: null });

      // Delay before next agent
      if (i < agents.length - 1) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    usePipelineStore.getState().setCompleted([]);
    useChatStore.getState().addMessage({
      agentId: 'master',
      icon: '🎉',
      name: 'Sistema',
      color: '#22c55e',
      text: 'Pipeline completa! Todos os agentes finalizaram.',
    });

    // Neo volta pro Master após 1.5s
    await new Promise((r) => setTimeout(r, 1500));
    usePipelineStore.getState().updateProgress({
      agent: 'master',
      status: 'done',
      step: 0,
      totalSteps: agents.length,
    });

    demoRunning.current = false;
  }, []);

  return (
    <>
      <MatrixRain />
      <LoadingScreen />
      <ReconnectBanner />
      <ToastSystem />
      <ErrorToast />
      <GameHUD />
      <Suspense fallback={null}>
        <ApprovalPopup />
        <VictoryScreen />
      </Suspense>

      {/* Tab Navigation — top center */}
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-black/80 backdrop-blur-sm border border-matrix-green/30 rounded-lg p-1 pointer-events-auto">
        {TAB_ITEMS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-1.5 px-4 py-1.5 rounded font-mono text-xs transition-all duration-200
              ${activeTab === tab.id
                ? 'bg-matrix-green/20 text-matrix-green border border-matrix-green/50'
                : 'text-gray-500 hover:text-gray-300 border border-transparent'}
            `}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Pipeline Tab */}
      {activeTab === 'pipeline' && (
        <>
          {/* Side panels */}
          <StepTracker />
          <AgentChat />
          <MicroTasks />

          {/* Game canvas as full background */}
          <GameCanvas />

          {/* Overlay UI elements — centered between panels */}
          <div className="relative z-10 pointer-events-none flex flex-col items-center gap-4 py-14 ml-[180px] mr-[260px]">
            <div className="pointer-events-auto">
              <Title />
            </div>
            <p className="text-gray-500 font-mono text-sm">Matrix Pipeline v0.3.0</p>

            <PipelineStarter />

            <div className="flex items-center gap-4 pointer-events-auto">
              <button
                onClick={runDemo}
                className="px-4 py-1.5 border border-yellow-400/50 text-yellow-400/50 font-mono text-[10px] rounded hover:bg-yellow-400 hover:text-black transition-colors duration-200"
              >
                ▶ Demo
              </button>
              <button
                onClick={sendPing}
                className="px-4 py-1.5 border border-gray-700 text-gray-600 font-mono text-[10px] rounded hover:text-gray-300 transition-colors duration-200"
              >
                Ping
              </button>
            </div>

            <div className="pointer-events-auto w-full max-w-sm px-4">
              <ProgressBar />
            </div>
          </div>
        </>
      )}

      {/* Task Board Tab */}
      {activeTab === 'tarefas' && (
        <div className="fixed inset-0 z-10 pt-14 pb-12">
          <TaskBoard />
        </div>
      )}

      {/* Team Structure Tab */}
      {activeTab === 'equipe' && (
        <div className="fixed inset-0 z-10 pt-14 pb-12">
          <TeamStructure />
        </div>
      )}

      {/* Projects Tab — placeholder until 5.3 */}
      {activeTab === 'projetos' && (
        <div className="fixed inset-0 z-10 pt-14 pb-12">
          <ProjectHistory />
        </div>
      )}

      <BottomBar />
    </>
  );
}
