import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { PipelineScene } from './PipelineScene';

const GAME_HEIGHT = 600;

export function GameCanvas() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const game = new Phaser.Game({
      type: Phaser.CANVAS,
      transparent: true,
      width: window.innerWidth,
      height: GAME_HEIGHT,
      parent: containerRef.current,
      physics: {
        default: 'arcade',
        arcade: { gravity: { x: 0, y: 0 }, debug: false },
      },
      scene: [PipelineScene],
      pixelArt: true,
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_HORIZONTALLY,
      },
    });
    gameRef.current = game;

    const handleResize = () => {
      game.scale.resize(window.innerWidth, GAME_HEIGHT);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="phaser-container"
      className="w-full"
      style={{ height: `${GAME_HEIGHT}px` }}
    />
  );
}
