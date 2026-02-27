import Phaser from 'phaser';

const PARTICLE_COUNT = 15;

export class AmbientParticles {
  private scene: Phaser.Scene;
  private particles: Phaser.GameObjects.Rectangle[] = [];
  private enabled = true;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const w = scene.scale.width;
    const h = scene.scale.height;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const x = Phaser.Math.Between(0, w);
      const y = Phaser.Math.Between(50, h - 50);
      const size = Phaser.Math.Between(2, 4);
      const alpha = Phaser.Math.FloatBetween(0.1, 0.4);

      const dot = scene.add.rectangle(x, y, size, size, 0x22c55e, alpha);
      this.particles.push(dot);

      scene.tweens.add({
        targets: dot,
        y: y + Phaser.Math.Between(-30, 30),
        x: x + Phaser.Math.Between(-20, 20),
        alpha: { from: alpha, to: alpha * 0.5 },
        duration: Phaser.Math.Between(3000, 6000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.particles.forEach((p) => p.setVisible(enabled));
  }

  destroy(): void {
    this.particles.forEach((p) => p.destroy());
  }
}
