import { MatrixRain } from './components/MatrixRain';
import { LoadingScreen } from './components/LoadingScreen';
import { Title } from './components/Title';
import { GameCanvas } from './game/GameCanvas';
import { ProgressBar } from './components/ProgressBar';
import { MessageBubble } from './components/MessageBubble';
import { ErrorToast } from './components/ErrorToast';
import { ToastSystem } from './components/ToastSystem';
import { ReconnectBanner } from './components/ReconnectBanner';
import { GameHUD } from './components/GameHUD';
import { ApprovalPopup } from './components/ApprovalPopup';
import { VictoryScreen } from './components/VictoryScreen';
import { BottomBar } from './components/BottomBar';
import { useSocket } from './hooks/useSocket';
import { useConnectionStore } from './stores/useConnectionStore';

export default function App() {
  const { sendPing } = useSocket();
  const lastPong = useConnectionStore((s) => s.lastPong);

  return (
    <>
      <MatrixRain />
      <LoadingScreen />
      <ReconnectBanner />
      <ToastSystem />
      <ErrorToast />
      <GameHUD />
      <ApprovalPopup />
      <VictoryScreen />

      <div className="relative z-10 min-h-screen bg-transparent text-white flex flex-col items-center gap-6 py-8 pb-16">
        <Title />
        <p className="text-gray-500 font-mono text-sm">Matrix Pipeline v0.3.0</p>

        <div className="flex items-center gap-4">
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

        <ProgressBar />
        <MessageBubble />
        <GameCanvas />
      </div>

      <BottomBar />
    </>
  );
}
