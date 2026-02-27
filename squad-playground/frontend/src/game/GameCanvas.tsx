import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { PipelineScene } from './PipelineScene';

const BOTTOM_BAR_HEIGHT = 100;

function getGameHeight() {
  return window.innerHeight - BOTTOM_BAR_HEIGHT;
}

export function GameCanvas() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const game = new Phaser.Game({
      type: Phaser.CANVAS,
      transparent: true,
      width: window.innerWidth,
      height: getGameHeight(),
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
      game.scale.resize(window.innerWidth, getGameHeight());
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
      className="w-full absolute inset-0"
      style={{ height: `${getGameHeight()}px`, zIndex: 0 }}
    />
  );
}
