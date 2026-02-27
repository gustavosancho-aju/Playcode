import Phaser from 'phaser';

export class GlitchEffect {
  private scene: Phaser.Scene;
  private enabled = true;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  trigger(): void {
    if (!this.enabled) return;

    const cam = this.scene.cameras.main;

    // RGB split effect — quick flash
    const flash1 = this.scene.add.rectangle(
      cam.scrollX + cam.width / 2,
      cam.height / 2,
      cam.width, cam.height,
      0xff0000, 0.08
    );
    const flash2 = this.scene.add.rectangle(
      cam.scrollX + cam.width / 2 + 3,
      cam.height / 2,
      cam.width, cam.height,
      0x0000ff, 0.06
    );

    this.scene.time.delayedCall(100, () => {
      flash1.destroy();
      flash2.destroy();
    });

    // Camera shake
    cam.shake(100, 0.005);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}
