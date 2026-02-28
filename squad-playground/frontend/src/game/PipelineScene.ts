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

// Room size and layout constants
const ROOM_SIZE = 160;
const ROOM_GAP = 50;

// U-shaped layout: 2 left vertical, 4 bottom horizontal, 2 right vertical
// Pipeline order follows the U naturally:
//
//  [0 Master]                           [7 Apresentação]
//  [1 Pesquisa]                         [6 Closer]
//        [2 Organizador][3 Soluções][4 Estruturas][5 Financeiro]
//

// Map agent index → position in the U route (same as index for this layout)
const U_ROUTE_AGENT_ORDER = [0, 1, 2, 3, 4, 5, 6, 7];

function agentToUIndex(agentIndex: number): number {
  return U_ROUTE_AGENT_ORDER.indexOf(agentIndex);
}

export class PipelineScene extends Phaser.Scene {
  private houses: Phaser.GameObjects.Container[] = [];
  private agentLabels: Phaser.GameObjects.Text[] = [];
  private neo!: NeoCharacter;
  private isMoving = false;
  private moveQueue: number[] = [];
  private lastActiveAgent: AgentId | null = null;
  private ambientParticles!: AmbientParticles;
  private glitchEffect!: GlitchEffect;
  private neoTrail!: NeoTrail;
  private particleBurst!: ParticleBurst;
  private corridorGraphics!: Phaser.GameObjects.Graphics;

  // Positions for each of the 8 agents
  private roomPositions: { x: number; y: number }[] = [];
  private worldW = 0;
  private worldH = 0;

  // Waypoint-based movement
  private waypoints: { x: number; y: number }[] = [];
  private currentWaypointIdx = 0;
  private targetWaypointIdx = 0;
  private movingForward = true;

  constructor() {
    super({ key: 'PipelineScene' });
  }

  preload(): void {
    NeoCharacter.preload(this);
  }

  create(): void {
    this.computeLayout();

    this.cameras.main.setBounds(0, 0, this.worldW, this.worldH);
    this.physics.world.setBounds(0, 0, this.worldW, this.worldH);
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');

    this.drawBackground();
    this.drawCorridor();
    this.createHouses();
    this.buildWaypoints();

    // Neo starts at first waypoint (Master)
    const startWp = this.waypoints[0];
    this.neo = new NeoCharacter(this, startWp.x, startWp.y);
    this.neo.create();
    this.neo.setDirection('down');

    // Effects
    this.ambientParticles = new AmbientParticles(this);
    this.glitchEffect = new GlitchEffect(this);
    this.neoTrail = new NeoTrail(this);
    this.particleBurst = new ParticleBurst(this);

    this.setupStoreListener();
  }

  private computeLayout(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    this.worldW = w;
    this.worldH = h;

    const step = ROOM_SIZE + ROOM_GAP;

    // Bottom row: 4 rooms centered horizontally
    const bottomRowWidth = 4 * ROOM_SIZE + 3 * ROOM_GAP;
    const bottomStartX = Math.round((w - bottomRowWidth) / 2) + ROOM_SIZE / 2;
    const bottomY = h - 20 - ROOM_SIZE / 2; // 20px from bottom edge

    // Left column: 2 rooms, aligned with first bottom room
    const leftX = bottomStartX;
    const leftTopY = bottomY - 2 * (step + 20) + 80;

    // Right column: 2 rooms, aligned with last bottom room
    const rightX = bottomStartX + 3 * step;
    const rightTopY = bottomY - 2 * (step + 20) + 80;

    // Assign positions per agent index
    this.roomPositions = [
      { x: leftX, y: leftTopY },           // 0: Master (left top)
      { x: leftX, y: leftTopY + step },     // 1: Pesquisa (left bottom)
      { x: bottomStartX, y: bottomY + 20 },               // 2: Organizador
      { x: bottomStartX + step, y: bottomY + 20 },        // 3: Soluções
      { x: bottomStartX + 2 * step, y: bottomY + 20 },    // 4: Estruturas
      { x: bottomStartX + 3 * step, y: bottomY + 20 },    // 5: Financeiro
      { x: rightX, y: rightTopY + step },   // 6: Closer (right bottom)
      { x: rightX, y: rightTopY },          // 7: Apresentação (right top)
    ];
  }

  private buildWaypoints(): void {
    // Waypoints follow the U: down left → across bottom → up right
    // Each agent room is a waypoint, plus corners for smooth turns
    this.waypoints = [];

    const p = this.roomPositions;

    // Agent 0 (Master - left top)
    this.waypoints.push(p[0]);
    // Agent 1 (Pesquisa - left bottom)
    this.waypoints.push(p[1]);
    // Corner: go from left column to bottom row (same x as agent 1, y of bottom)
    // Only add corner if agent 1 and agent 2 aren't aligned
    if (p[1].y !== p[2].y) {
      this.waypoints.push({ x: p[1].x, y: p[2].y });
    }
    // Agents 2-5 (bottom row)
    this.waypoints.push(p[2]);
    this.waypoints.push(p[3]);
    this.waypoints.push(p[4]);
    this.waypoints.push(p[5]);
    // Corner: go from bottom row to right column
    if (p[5].y !== p[6].y) {
      this.waypoints.push({ x: p[5].x, y: p[6].y });
    }
    // Agent 6 (Closer - right bottom)
    this.waypoints.push(p[6]);
    // Agent 7 (Apresentação - right top)
    this.waypoints.push(p[7]);
  }

  // Map agent index to its waypoint index (accounting for corner waypoints)
  private agentToWaypointIdx(agentIndex: number): number {
    const p = this.roomPositions;
    const hasLeftCorner = p[1].y !== p[2].y;
    const hasRightCorner = p[5].y !== p[6].y;

    // 0→wp0, 1→wp1, corner?, 2→, 3→, 4→, 5→, corner?, 6→, 7→
    if (agentIndex <= 1) return agentIndex;
    let idx = agentIndex;
    if (hasLeftCorner) idx += 1; // shift for left corner
    if (agentIndex >= 6 && hasRightCorner) idx += 1; // shift for right corner
    return idx;
  }

  update(_time: number, delta: number): void {
    if (!this.neo) return;

    const settings = useSettingsStore.getState();
    const neoSpeed = settings.animation.neoSpeed;

    this.neoTrail.setEnabled(settings.effects.neoTrail);
    this.ambientParticles.setEnabled(settings.effects.particles);
    this.glitchEffect.setEnabled(!settings.effects.reduceMotion && settings.effects.glitch);

    // Neo animation update
    this.neo.update(delta);

    if (this.isMoving) {
      this.moveAlongWaypoints(neoSpeed, delta);
    }

    this.neoTrail.update(this.neo.x, this.neo.y, this.isMoving);
  }

  private moveAlongWaypoints(speed: number, delta: number): void {
    const target = this.waypoints[this.currentWaypointIdx];
    if (!target) {
      this.isMoving = false;
      return;
    }

    const dx = target.x - this.neo.x;
    const dy = target.y - this.neo.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const step = (speed * delta) / 1000;

    if (dist <= step) {
      // Reached this waypoint
      this.neo.setPosition(target.x, target.y);

      if (this.currentWaypointIdx === this.targetWaypointIdx) {
        // Arrived at final target
        this.isMoving = false;
        this.neo.play('idle');

        // Find which agent is at this waypoint (if any)
        for (let i = 0; i < 8; i++) {
          if (this.agentToWaypointIdx(i) === this.currentWaypointIdx) {
            this.onArriveAtHouse(i);
            break;
          }
        }

        // Process queue
        if (this.moveQueue.length > 0) {
          const next = this.moveQueue.shift()!;
          this.moveToHouse(next);
        }
      } else {
        // Move to next intermediate waypoint
        if (this.movingForward) {
          this.currentWaypointIdx++;
        } else {
          this.currentWaypointIdx--;
        }
        this.updateNeoDirection();
      }
    } else {
      // Move toward current waypoint
      const nx = dx / dist;
      const ny = dy / dist;
      this.neo.setPosition(
        this.neo.x + nx * step,
        this.neo.y + ny * step
      );
    }
  }

  private updateNeoDirection(): void {
    const target = this.waypoints[this.currentWaypointIdx];
    if (!target) return;

    const dx = target.x - this.neo.x;
    const dy = target.y - this.neo.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      this.neo.setDirection(dx > 0 ? 'right' : 'left');
    } else {
      this.neo.setDirection(dy > 0 ? 'down' : 'up');
    }
  }

  moveToHouse(houseIndex: number): void {
    if (this.isMoving) {
      this.moveQueue.push(houseIndex);
      return;
    }

    const targetWpIdx = this.agentToWaypointIdx(houseIndex);
    if (targetWpIdx < 0) return;
    if (targetWpIdx === this.currentWaypointIdx) return;

    this.targetWaypointIdx = targetWpIdx;
    this.movingForward = targetWpIdx > this.currentWaypointIdx;

    // Start moving to next intermediate waypoint
    if (this.movingForward) {
      this.currentWaypointIdx++;
    } else {
      this.currentWaypointIdx--;
    }

    this.isMoving = true;
    this.neo.play('walk');
    this.updateNeoDirection();
  }

  private onArriveAtHouse(index: number): void {
    this.neo.play('idle');

    const pos = this.roomPositions[index];
    if (!pos) return;

    const agent = AGENT_DEFINITIONS[index];
    const color = agent
      ? Phaser.Display.Color.HexStringToColor(agent.color).color
      : 0x22c55e;
    this.particleBurst.emit(pos.x, pos.y, color, 20);
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

  private drawRoomFurniture(container: Phaser.GameObjects.Container, color: number): void {
    const g = this.add.graphics();
    const dim = Phaser.Display.Color.IntegerToColor(color);
    const baseR = dim.red, baseG = dim.green, baseB = dim.blue;
    const darkColor = Phaser.Display.Color.GetColor(
      Math.floor(baseR * 0.4), Math.floor(baseG * 0.4), Math.floor(baseB * 0.4)
    );
    const midColor = Phaser.Display.Color.GetColor(
      Math.floor(baseR * 0.6), Math.floor(baseG * 0.6), Math.floor(baseB * 0.6)
    );

    // Desk (top-left) — pixel table
    g.fillStyle(darkColor, 0.9);
    g.fillRect(-50, -48, 28, 14); // table top
    g.fillStyle(midColor, 0.7);
    g.fillRect(-48, -34, 4, 8);   // left leg
    g.fillRect(-26, -34, 4, 8);   // right leg

    // Monitor on desk
    g.fillStyle(0x333355, 0.9);
    g.fillRect(-44, -56, 16, 10); // screen
    g.fillStyle(color, 0.5);
    g.fillRect(-42, -54, 12, 6);  // screen glow
    g.fillStyle(0x333355, 0.9);
    g.fillRect(-38, -46, 4, 4);   // stand

    // Chair (below desk) — pixel chair
    g.fillStyle(darkColor, 0.8);
    g.fillRect(-46, -20, 16, 10); // seat
    g.fillRect(-46, -28, 4, 8);   // backrest
    g.fillStyle(midColor, 0.6);
    g.fillRect(-44, -10, 3, 6);   // leg
    g.fillRect(-34, -10, 3, 6);   // leg

    // Server rack (bottom-right) — pixel server
    g.fillStyle(0x222244, 0.9);
    g.fillRect(24, 10, 22, 34);   // rack body
    g.fillStyle(color, 0.4);
    g.fillRect(27, 14, 16, 3);    // slot 1
    g.fillRect(27, 20, 16, 3);    // slot 2
    g.fillRect(27, 26, 16, 3);    // slot 3
    g.fillStyle(0x00ff00, 0.8);
    g.fillRect(40, 14, 2, 2);     // LED 1
    g.fillStyle(color, 0.8);
    g.fillRect(40, 20, 2, 2);     // LED 2
    g.fillStyle(0x00ff00, 0.6);
    g.fillRect(40, 26, 2, 2);     // LED 3

    // Small table (top-right) — coffee table
    g.fillStyle(darkColor, 0.7);
    g.fillRect(20, -44, 20, 12);  // top
    g.fillStyle(midColor, 0.5);
    g.fillRect(22, -32, 3, 6);    // leg
    g.fillRect(35, -32, 3, 6);    // leg

    // Coffee mug on table
    g.fillStyle(0xcccccc, 0.8);
    g.fillRect(28, -48, 6, 6);    // mug
    g.fillStyle(0x886644, 0.6);
    g.fillRect(29, -47, 4, 4);    // coffee

    // Bookshelf (bottom-left)
    g.fillStyle(darkColor, 0.8);
    g.fillRect(-52, 16, 24, 28);  // shelf frame
    g.fillStyle(0x4444aa, 0.6);
    g.fillRect(-50, 18, 6, 10);   // book 1
    g.fillStyle(0xaa4444, 0.6);
    g.fillRect(-42, 18, 5, 10);   // book 2
    g.fillStyle(0x44aa44, 0.6);
    g.fillRect(-35, 18, 6, 10);   // book 3
    g.fillStyle(0xaaaa44, 0.6);
    g.fillRect(-50, 30, 8, 10);   // book 4
    g.fillStyle(color, 0.5);
    g.fillRect(-40, 30, 7, 10);   // book 5

    container.add(g);
  }

  private drawBackground(): void {
    const bg = this.add.graphics();
    bg.lineStyle(1, 0x22c55e, 0.03);
    for (let x = 0; x < this.worldW; x += 40) {
      bg.lineBetween(x, 0, x, this.worldH);
    }
    for (let y = 0; y < this.worldH; y += 40) {
      bg.lineBetween(0, y, this.worldW, y);
    }
  }

  private drawCorridor(): void {
    this.corridorGraphics = this.add.graphics();
    const g = this.corridorGraphics;
    g.lineStyle(2, 0x22c55e, 0.2);

    const p = this.roomPositions;

    // Left column: agent 0 → agent 1
    g.lineBetween(p[0].x, p[0].y, p[1].x, p[1].y);

    // Left corner: agent 1 down to bottom row Y
    g.lineBetween(p[1].x, p[1].y, p[1].x, p[2].y);

    // Bottom row: agent 2 → 3 → 4 → 5
    g.lineBetween(p[2].x, p[2].y, p[5].x, p[5].y);

    // Right corner: bottom row up to agent 6
    g.lineBetween(p[5].x, p[5].y, p[6].x, p[6].y);

    // Right column: agent 6 → agent 7
    g.lineBetween(p[6].x, p[6].y, p[7].x, p[7].y);

    // Dots at each room
    g.fillStyle(0x22c55e, 0.3);
    for (let i = 0; i < 8; i++) {
      g.fillCircle(p[i].x, p[i].y, 4);
    }
  }

  private createHouses(): void {
    const agents = AGENT_DEFINITIONS;

    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      const pos = this.roomPositions[i];

      const house = this.add.container(pos.x, pos.y);
      const agentColor = Phaser.Display.Color.HexStringToColor(agent.color).color;

      // Room floor
      const rect = this.add.rectangle(0, 0, ROOM_SIZE, ROOM_SIZE, 0x1a1a2e, 0.8);
      rect.setStrokeStyle(2, agentColor);
      house.add(rect);

      // Floor tiles (pixel grid)
      const floorG = this.add.graphics();
      floorG.lineStyle(1, agentColor, 0.06);
      const half = ROOM_SIZE / 2;
      for (let fx = -half; fx <= half; fx += 12) {
        floorG.lineBetween(fx, -half, fx, half);
      }
      for (let fy = -half; fy <= half; fy += 12) {
        floorG.lineBetween(-half, fy, half, fy);
      }
      house.add(floorG);

      // Pixel furniture
      this.drawRoomFurniture(house, agentColor);

      // Agent icon (centered, bigger)
      const icon = this.add.text(0, -14, agent.icon, {
        fontSize: '28px',
      }).setOrigin(0.5);
      house.add(icon);

      // Name label inside the room, at the bottom
      const label = this.add.text(0, ROOM_SIZE / 2 - 16, agent.name, {
        fontFamily: '"Geist", system-ui, sans-serif',
        fontSize: '8px',
        color: agent.color,
        align: 'center',
      }).setOrigin(0.5);
      house.add(label);
      this.agentLabels.push(label);

      this.houses.push(house);
    }
  }

  private setupStoreListener(): void {
    this.time.addEvent({
      delay: 200,
      loop: true,
      callback: () => {
        const agents = useAgentStore.getState().agents;
        const pipeline = usePipelineStore.getState();

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

        if (pipeline.currentAgent && pipeline.currentAgent !== this.lastActiveAgent) {
          this.lastActiveAgent = pipeline.currentAgent;
          const agentIndex = AGENT_DEFINITIONS.findIndex((a) => a.id === pipeline.currentAgent);
          if (agentIndex >= 0) {
            this.moveToHouse(agentIndex);
          }
        }

        if (pipeline.status === 'approval_required' && !this.isMoving) {
          this.neo.play('processing');
        }
      },
    });
  }

  getHousePosition(index: number): { x: number; y: number } {
    return this.roomPositions[index];
  }

  shutdown(): void {
    this.neo?.destroy();
    this.ambientParticles?.destroy();
    this.neoTrail?.destroy();
    this.houses.forEach((h) => h.destroy());
    this.agentLabels.forEach((l) => l.destroy());
    this.corridorGraphics?.destroy();
    this.tweens.killAll();
    this.time.removeAllEvents();
  }
}
