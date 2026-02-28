import { useSettingsStore } from '../stores/useSettingsStore';

export function MatrixRain() {
  const codeRain = useSettingsStore((s) => s.effects.codeRain);

  if (!codeRain) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* Base gradient — subtle ambient glow */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 20% 50%, rgba(0, 255, 65, 0.04) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(168, 85, 247, 0.04) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(6, 182, 212, 0.03) 0%, transparent 50%)',
        }}
      />

      {/* Floating orb 1 — green */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full animate-orb-float"
        style={{
          top: '10%',
          left: '15%',
          background: 'radial-gradient(circle, rgba(0, 255, 65, 0.06) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Floating orb 2 — purple */}
      <div
        className="absolute w-[400px] h-[400px] rounded-full animate-orb-float-delay"
        style={{
          top: '50%',
          right: '10%',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.06) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Floating orb 3 — cyan */}
      <div
        className="absolute w-[350px] h-[350px] rounded-full animate-orb-float"
        style={{
          bottom: '10%',
          left: '40%',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.04) 0%, transparent 70%)',
          filter: 'blur(80px)',
          animationDelay: '-7s',
        }}
      />

      {/* Matrix Grid with 3D Perspective — bottom section */}
      <div
        className="absolute left-0 right-0 bottom-0 h-[60vh] animate-grid-pulse"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 65, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 65, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          transform: 'perspective(1000px) rotateX(60deg)',
          transformOrigin: 'bottom center',
          maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.3) 30%, rgba(0,0,0,0.8) 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.3) 30%, rgba(0,0,0,0.8) 100%)',
        }}
      />

      {/* Strong vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(10, 10, 10, 0.7) 100%)',
        }}
      />
    </div>
  );
}
