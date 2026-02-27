import Phaser from 'phaser';
import { useAgentStore } from '../stores/useAgentStore';
import { usePipelineStore } from '../stores/usePipelineStore';
import { AGENT_DEFINITIONS } from 'shared/types';
import { NeoCharacter } from './NeoCharacter';
import { AmbientParticles } from './effects/AmbientParticles';
import { GlitchEffect } from './effects/GlitchEffect';
import { NeoTrail } from './effects/NeoTrail';
import { ParticleBurst } from './effects/ParticleBurst';
import type { AgentId } from 'shared/types';
import { useSettingsStore } from '../stores/useSettingsStore';

const WORLD_WIDTH = 4000;
const WORLD_HEIGHT = 600;
const HOUSE_SPACING = 400;
const HOUSE_START_X = 200;
const GROUND_Y = 450;
const DEFAULT_NEO_SPEED = 150; // px/sec
const CAMERA_LERP = 0.1;

export class PipelineScene extends Phaser.Scene {
  private houses: Phaser.GameObjects.Container[] = [];
  private groundLine!: Phaser.GameObjects.Graphics;
  private agentLabels: Phaser.GameObjects.Text[] = [];
  private neo!: NeoCharacter;
  private targetX: number | null = null;
  private targetHouseIndex: number | null = null;
  private isMoving = false;
  private moveQueue: number[] = [];
  private lastActiveAgent: AgentId | null = null;
  private ambientParticles!: AmbientParticles;
  private glitchEffect!: GlitchEffect;
  private neoTrail!: NeoTrail;
  private particleBurst!: ParticleBurst;

  constructor() {
    super({ key: 'PipelineScene' });
  }

  preload(): void {
    NeoCharacter.preload(this);
  }

  create(): void {
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    this.drawBackground();

    this.groundLine = this.add.graphics();
    this.groundLine.lineStyle(2, 0x22c55e, 0.6);
    this.groundLine.lineBetween(0, GROUND_Y, WORLD_WIDTH, GROUND_Y);

    this.createHouses();

    // Neo character at MASTER house (index 0)
    const neoX = HOUSE_START_X;
    const neoY = GROUND_Y - 16;
    this.neo = new NeoCharacter(this, neoX, neoY);
    this.neo.create();

    this.cameras.main.scrollX = 0;
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');

    // Effects
    this.ambientParticles = new AmbientParticles(this);
    this.glitchEffect = new GlitchEffect(this);
    this.neoTrail = new NeoTrail(this);
    this.particleBurst = new ParticleBurst(this);

    this.setupStoreListener();
  }

  update(_time: number, delta: number): void {
    if (!this.neo) return;

    // Read live settings
    const settings = useSettingsStore.getState();
    const neoSpeed = settings.animation.neoSpeed;

    // Sync effect toggles
    this.neoTrail.setEnabled(settings.effects.neoTrail);
    this.ambientParticles.setEnabled(settings.effects.particles);
    this.glitchEffect.setEnabled(!settings.effects.reduceMotion && settings.effects.glitch);

    if (this.isMoving && this.targetX !== null) {
      const dx = this.targetX - this.neo.x;
      const dist = Math.abs(dx);
      const step = (neoSpeed * delta) / 1000;

      if (dist <= step) {
        // Arrived at target
        this.neo.setPosition(this.targetX, this.neo.y);
        this.isMoving = false;
        this.targetX = null;
        this.neo.play('idle');

        // Process arrival at house
        if (this.targetHouseIndex !== null) {
          this.onArriveAtHouse(this.targetHouseIndex);
          this.targetHouseIndex = null;
        }

        // Process next in queue
        if (this.moveQueue.length > 0) {
          const next = this.moveQueue.shift()!;
          this.moveToHouse(next);
        }
      } else {
        // Move toward target
        const dir = dx > 0 ? 1 : -1;
        this.neo.setPosition(this.neo.x + dir * step, this.neo.y);
        this.neo.setFlipX(dir < 0);
      }
    }

    // Update trail effect
    this.neoTrail.update(this.neo.x, this.neo.y, this.isMoving);

    // Camera smooth follow
    const cam = this.cameras.main;
    const targetCamX = this.neo.x - cam.width / 2;
    const clampedX = Phaser.Math.Clamp(targetCamX, 0, WORLD_WIDTH - cam.width);
    cam.scrollX += (clampedX - cam.scrollX) * CAMERA_LERP;
  }

  moveToHouse(houseIndex: number): void {
    if (this.isMoving) {
      this.moveQueue.push(houseIndex);
      return;
    }

    const pos = this.getHousePosition(houseIndex);
    this.targetX = pos.x;
    this.targetHouseIndex = houseIndex;
    this.isMoving = true;
    this.neo.play('walk');
  }

  private onArriveAtHouse(index: number): void {
    // Enter animation
    this.neo.play('enter');

    const pos = this.getHousePosition(index);

    // Particle burst at house entrance
    const agent = AGENT_DEFINITIONS[index];
    const color = agent
      ? Phaser.Display.Color.HexStringToColor(agent.color).color
      : 0x22c55e;
    this.particleBurst.emit(pos.x, GROUND_Y - 16, color, 20);

    // Glitch on arrival
    this.glitchEffect.trigger();

    // Flash the house
    const house = this.houses[index];
    if (house) {
      const rect = house.getAt(0) as Phaser.GameObjects.Rectangle;
      this.tweens.add({
        targets: rect,
        alpha: { from: 0.5, to: 1 },
        duration: 300,
        yoyo: true,
      });
    }
  }

  private drawBackground(): void {
    const bg = this.add.graphics();
    bg.lineStyle(1, 0x22c55e, 0.05);
    for (let x = 0; x < WORLD_WIDTH; x += 50) {
      bg.lineBetween(x, 0, x, WORLD_HEIGHT);
    }
    for (let y = 0; y < WORLD_HEIGHT; y += 50) {
      bg.lineBetween(0, y, WORLD_WIDTH, y);
    }
  }

  private createHouses(): void {
    const agents = AGENT_DEFINITIONS;

    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      const x = HOUSE_START_X + i * HOUSE_SPACING;
      const y = GROUND_Y - 80;

      const house = this.add.container(x, y);

      const rect = this.add.rectangle(0, 0, 128, 128, 0x1a1a2e, 0.8);
      rect.setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(agent.color).color);
      house.add(rect);

      const icon = this.add.text(0, -15, agent.icon, {
        fontSize: '32px',
      }).setOrigin(0.5);
      house.add(icon);

      // Door (small rect at bottom of house)
      const door = this.add.rectangle(0, 50, 24, 32, 0x374151, 0.9);
      door.setStrokeStyle(1, 0x22c55e);
      house.add(door);

      const label = this.add.text(x, GROUND_Y + 15, agent.name, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '8px',
        color: agent.color,
        align: 'center',
      }).setOrigin(0.5);
      this.agentLabels.push(label);

      this.houses.push(house);

      if (i < agents.length - 1) {
        const nextX = HOUSE_START_X + (i + 1) * HOUSE_SPACING;
        const connectorG = this.add.graphics();
        connectorG.lineStyle(2, 0x22c55e, 0.3);
        connectorG.lineBetween(x + 70, y, nextX - 70, y);
      }
    }
  }

  private setupStoreListener(): void {
    this.time.addEvent({
      delay: 200,
      loop: true,
      callback: () => {
        const agents = useAgentStore.getState().agents;
        const pipeline = usePipelineStore.getState();

        // Update house visuals
        agents.forEach((agent, i) => {
          if (!this.houses[i]) return;

          const rect = this.houses[i].getAt(0) as Phaser.GameObjects.Rectangle;
          const color = Phaser.Display.Color.HexStringToColor(agent.color).color;

          if (agent.status === 'processing' || agent.status === 'active') {
            rect.setStrokeStyle(3, color);
            rect.setAlpha(1);
          } else if (agent.status === 'done') {
            rect.setStrokeStyle(2, 0x22c55e);
            rect.setAlpha(1);
          } else if (agent.status === 'error') {
            rect.setStrokeStyle(3, 0xdc2626);
            rect.setAlpha(1);
          } else {
            rect.setStrokeStyle(2, color);
            rect.setAlpha(0.5);
          }
        });

        // Move Neo to active agent
        if (pipeline.currentAgent && pipeline.currentAgent !== this.lastActiveAgent) {
          this.lastActiveAgent = pipeline.currentAgent;
          const agentIndex = AGENT_DEFINITIONS.findIndex((a) => a.id === pipeline.currentAgent);
          if (agentIndex >= 0) {
            this.moveToHouse(agentIndex);
          }
        }

        // Pipeline paused — processing animation
        if (pipeline.status === 'approval_required' && !this.isMoving) {
          this.neo.play('processing');
        }
      },
    });
  }

  getHousePosition(index: number): { x: number; y: number } {
    return {
      x: HOUSE_START_X + index * HOUSE_SPACING,
      y: GROUND_Y - 80,
    };
  }

  shutdown(): void {
    // Cleanup to prevent memory leaks (AC: 3)
    this.neo?.destroy();
    this.ambientParticles?.destroy();
    this.neoTrail?.destroy();
    this.houses.forEach((h) => h.destroy());
    this.agentLabels.forEach((l) => l.destroy());
    this.groundLine?.destroy();
    this.tweens.killAll();
    this.time.removeAllEvents();
  }
}
