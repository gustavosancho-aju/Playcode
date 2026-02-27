import Phaser from 'phaser';

const TRAIL_COUNT = 3;
const TRAIL_FADE_MS = 500;

export class NeoTrail {
  private scene: Phaser.Scene;
  private trails: Phaser.GameObjects.Rectangle[] = [];
  private positions: { x: number; y: number }[] = [];
  private enabled = true;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    for (let i = 0; i < TRAIL_COUNT; i++) {
      const rect = scene.add.rectangle(0, 0, 32, 32, 0x22c55e, 0.3 - i * 0.1);
      rect.setVisible(false);
      this.trails.push(rect);
    }
  }

  update(neoX: number, neoY: number, isMoving: boolean): void {
    if (!this.enabled || !isMoving) {
      this.trails.forEach((t) => t.setVisible(false));
      return;
    }

    this.positions.unshift({ x: neoX, y: neoY });
    if (this.positions.length > TRAIL_COUNT * 3) {
      this.positions.length = TRAIL_COUNT * 3;
    }

    this.trails.forEach((trail, i) => {
      const posIdx = (i + 1) * 3;
      if (this.positions[posIdx]) {
        trail.setPosition(this.positions[posIdx].x, this.positions[posIdx].y);
        trail.setVisible(true);
        trail.setAlpha(0.3 - i * 0.1);
      }
    });
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.trails.forEach((t) => t.setVisible(false));
  }

  destroy(): void {
    this.trails.forEach((t) => t.destroy());
  }
}
