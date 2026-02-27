import Phaser from 'phaser';

export class ParticleBurst {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  emit(x: number, y: number, color: number = 0x22c55e, count: number = 25): void {
    for (let i = 0; i < count; i++) {
      const particle = this.scene.add.rectangle(
        x, y,
        Phaser.Math.Between(2, 6),
        Phaser.Math.Between(2, 6),
        color, 1
      );

      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.Between(50, 200);
      const targetX = x + Math.cos(angle) * speed;
      const targetY = y + Math.sin(angle) * speed;

      this.scene.tweens.add({
        targets: particle,
        x: targetX,
        y: targetY,
        alpha: 0,
        duration: Phaser.Math.Between(400, 800),
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }
  }
}
