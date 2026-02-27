import { useEffect, useRef } from 'react';
import { useSettingsStore } from '../stores/useSettingsStore';

const CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const FONT_SIZE = 14;
const COLOR = '#22C55E';

export function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const codeRain = useSettingsStore((s) => s.effects.codeRain);

  useEffect(() => {
    if (!codeRain) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let columns: number;
    let drops: number[];

    const MAX_COLUMNS = 40;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      const rawCols = Math.floor(canvas!.width / FONT_SIZE);
      columns = Math.min(rawCols, MAX_COLUMNS);
      drops = Array.from({ length: columns }, () => Math.random() * -100);
    }

    resize();
    window.addEventListener('resize', resize);

    function draw() {
      ctx!.fillStyle = 'rgba(13, 13, 13, 0.05)';
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height);

      ctx!.fillStyle = COLOR;
      ctx!.font = `${FONT_SIZE}px "JetBrains Mono", monospace`;

      for (let i = 0; i < columns; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        const x = i * FONT_SIZE;
        const y = drops[i] * FONT_SIZE;

        ctx!.globalAlpha = 0.4 + Math.random() * 0.4;
        ctx!.fillText(char, x, y);

        if (y > canvas!.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += 0.5 + Math.random() * 0.5;
      }

      ctx!.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    }

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [codeRain]);

  if (!codeRain) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
