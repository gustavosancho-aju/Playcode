import Phaser from 'phaser';

const FRAME_SIZE = 32;
const SCALE = 2;

export const NEO_ANIMATIONS = {
  idle: { start: 0, end: 1, frameRate: 2, repeat: -1 },
  walk: { start: 2, end: 7, frameRate: 10, repeat: -1 },
  run: { start: 8, end: 11, frameRate: 12, repeat: -1 },
  processing: { start: 12, end: 15, frameRate: 6, repeat: -1 },
  success: { start: 16, end: 18, frameRate: 8, repeat: 0 },
  enter: { start: 19, end: 21, frameRate: 8, repeat: 0 },
  exit: { start: 22, end: 24, frameRate: 8, repeat: 0 },
};

export class NeoCharacter {
  private scene: Phaser.Scene;
  private sprite: Phaser.GameObjects.Sprite | null = null;
  private fallback: Phaser.GameObjects.Rectangle | null = null;
  private useFallback = false;
  public x: number;
  public y: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.x = x;
    this.y = y;
  }

  static preload(scene: Phaser.Scene): void {
    scene.load.atlas(
      'neo',
      '/assets/sprites/neo-spritesheet.png',
      '/assets/sprites/neo-atlas.json'
    );
  }

  create(): void {
    // Check if atlas loaded successfully
    if (this.scene.textures.exists('neo') && this.scene.textures.get('neo').key !== '__MISSING') {
      this.createSprite();
    } else {
      this.createFallback();
    }
  }

  private createSprite(): void {
    this.sprite = this.scene.add.sprite(this.x, this.y, 'neo');
    this.sprite.setScale(SCALE);

    // Create animations
    for (const [key, config] of Object.entries(NEO_ANIMATIONS)) {
      if (this.scene.anims.exists(`neo-${key}`)) continue;

      const frames = [];
      for (let i = config.start; i <= config.end; i++) {
        const frameName = `${key}_${i - config.start}`;
        frames.push({ key: 'neo', frame: frameName });
      }

      this.scene.anims.create({
        key: `neo-${key}`,
        frames,
        frameRate: config.frameRate,
        repeat: config.repeat,
      });
    }

    this.play('idle');
  }

  private createFallback(): void {
    this.useFallback = true;
    this.fallback = this.scene.add.rectangle(
      this.x, this.y,
      FRAME_SIZE * SCALE, FRAME_SIZE * SCALE,
      0x22c55e, 0.8
    );
    this.fallback.setStrokeStyle(2, 0x16a34a);
  }

  play(animation: keyof typeof NEO_ANIMATIONS): void {
    if (this.sprite && !this.useFallback) {
      this.sprite.play(`neo-${animation}`);
    }
    // Fallback has no animations — just stays as rectangle
  }

  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
    if (this.sprite) this.sprite.setPosition(x, y);
    if (this.fallback) this.fallback.setPosition(x, y);
  }

  setFlipX(flip: boolean): void {
    if (this.sprite) this.sprite.setFlipX(flip);
  }

  setAlpha(alpha: number): void {
    if (this.sprite) this.sprite.setAlpha(alpha);
    if (this.fallback) this.fallback.setAlpha(alpha);
  }

  setVisible(visible: boolean): void {
    if (this.sprite) this.sprite.setVisible(visible);
    if (this.fallback) this.fallback.setVisible(visible);
  }

  getDisplayObject(): Phaser.GameObjects.GameObject | null {
    return this.sprite || this.fallback || null;
  }

  destroy(): void {
    this.sprite?.destroy();
    this.fallback?.destroy();
  }
}
