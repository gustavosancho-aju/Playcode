import Phaser from 'phaser';
import { useAgentStore } from '../stores/useAgentStore';
import { usePipelineStore } from '../stores/usePipelineStore';
import { AGENT_DEFINITIONS } from 'shared/types';
import { NeoCharacter } from './NeoCharacter';
import { AmbientParticles } from './effects/AmbientParticles';
import { GlitchEffect } from './effects/GlitchEffect';
import { NeoTrail } from './effects/NeoTrail';
import { ParticleBurst } from './effects/ParticleBurst';
import { RoomGlow } from './effects/RoomGlow';
import { DataStream } from './effects/DataStream';
import { NeoShadow } from './effects/NeoShadow';
import type { AgentId } from 'shared/types';
import { useSettingsStore } from '../stores/useSettingsStore';

const ROOM_SIZE = 160;
const ROOM_GAP = 50;

// Themed furniture drawers per agent (scaled for 160x160 rooms, half=80)
const ROOM_THEMES: Record<number, (g: Phaser.GameObjects.Graphics, color: number) => void> = {
  // 0: Master CEO — Centro de comando holográfico
  0: (g, color) => {
    // Holo-mesa central circular com radar girante
    g.lineStyle(2, color, 0.5);
    g.strokeCircle(0, 10, 22);
    g.lineStyle(1, color, 0.3);
    g.strokeCircle(0, 10, 16);
    g.strokeCircle(0, 10, 10);
    g.fillStyle(color, 0.15);
    g.fillCircle(0, 10, 22);
    // Radar sweep line
    g.lineStyle(2, color, 0.7);
    g.lineBetween(0, 10, 14, -2);
    // Radar blips
    g.fillStyle(color, 0.8);
    g.fillCircle(8, 4, 2);
    g.fillCircle(-6, 16, 2);
    g.fillCircle(4, 20, 1.5);

    // 3 monitores flutuantes (topo)
    for (let m = 0; m < 3; m++) {
      const mx = -40 + m * 28;
      g.fillStyle(0x222244, 0.95);
      g.fillRect(mx, -56, 24, 16);
      g.fillStyle(0x0a0a18, 0.95);
      g.fillRect(mx + 2, -54, 20, 12);
      // Screen content
      g.fillStyle(color, 0.4);
      g.fillRect(mx + 4, -52, 8, 2);
      g.fillStyle(color, 0.25);
      g.fillRect(mx + 4, -48, 16, 1);
      g.fillRect(mx + 4, -46, 12, 1);
      // Stand
      g.fillStyle(0x333355, 0.8);
      g.fillRect(mx + 10, -40, 4, 4);
    }

    // Cadeira de capitão (abaixo da mesa)
    g.fillStyle(0x333355, 0.8);
    g.fillRect(-8, 36, 16, 12);
    g.fillStyle(0x444466, 0.6);
    g.fillRect(-6, 34, 12, 4);

    // Mapa-mundi estilizado na parede esquerda
    g.lineStyle(1, color, 0.2);
    g.strokeRect(-56, -36, 24, 14);
    g.fillStyle(color, 0.1);
    g.fillRect(-54, -34, 6, 4);
    g.fillRect(-46, -32, 8, 6);
    g.fillRect(-42, -34, 4, 3);
    g.fillRect(-52, -28, 10, 3);
  },
  // 1: Pesquisa — Laboratório de dados
  1: (g, color) => {
    // Microscópio (canto esquerdo)
    g.fillStyle(0x666688, 0.9);
    g.fillRect(-48, -48, 6, 28);
    g.fillStyle(0x444466, 0.9);
    g.fillRect(-52, -20, 14, 5);
    g.fillStyle(color, 0.6);
    g.fillCircle(-45, -48, 5);
    g.fillStyle(0x555577, 0.8);
    g.fillRect(-50, -38, 10, 3);
    // Eyepiece
    g.fillStyle(0x888899, 0.9);
    g.fillRect(-47, -54, 4, 6);

    // Tubos de ensaio com líquidos coloridos
    const tubeColors = [0xff6b6b, 0x6bff6b, 0xffff6b, 0x6bbbff, color];
    tubeColors.forEach((c, i) => {
      const tx = 20 + i * 8;
      g.fillStyle(0xaaaacc, 0.4);
      g.fillRect(tx, -52, 4, 20);
      g.fillStyle(c, 0.6);
      const fillH = 6 + (i % 3) * 4;
      g.fillRect(tx, -52 + (20 - fillH), 4, fillH);
      // Tube top
      g.fillStyle(0x888899, 0.7);
      g.fillRect(tx - 1, -54, 6, 3);
    });
    // Tube rack
    g.fillStyle(0x555566, 0.8);
    g.fillRect(18, -32, 44, 3);

    // Quadro de evidências (cork board com pins)
    g.fillStyle(0x8B6914, 0.6);
    g.fillRect(24, 16, 36, 28);
    g.lineStyle(1, 0x6B4914, 0.8);
    g.strokeRect(24, 16, 36, 28);
    // Pins e notas
    g.fillStyle(0xeeeeee, 0.7);
    g.fillRect(28, 20, 12, 8);
    g.fillRect(44, 24, 10, 10);
    g.fillStyle(0xff4444, 0.8);
    g.fillCircle(34, 20, 2);
    g.fillStyle(0x44ff44, 0.8);
    g.fillCircle(49, 24, 2);
    // String connections
    g.lineStyle(1, 0xff4444, 0.4);
    g.lineBetween(34, 20, 49, 24);

    // Lupa grande
    g.lineStyle(2, 0xaaaacc, 0.7);
    g.strokeCircle(-36, 34, 8);
    g.lineStyle(3, 0x777788, 0.8);
    g.lineBetween(-30, 40, -24, 46);

    // Estante de livros
    g.fillStyle(0x2a2a3e, 0.9);
    g.fillRect(-56, 14, 16, 36);
    const bookColors = [0x4444aa, 0xaa4444, color, 0x44aa44, 0xaa44aa];
    bookColors.forEach((c, i) => {
      g.fillStyle(c, 0.6);
      g.fillRect(-54, 16 + i * 7, 12, 5);
    });
  },
  // 2: Organizador — Escritório executivo
  2: (g, color) => {
    // Mesa em L grande
    g.fillStyle(0x2a2a3e, 0.9);
    g.fillRect(-54, -44, 44, 12);
    g.fillRect(-54, -32, 14, 28);
    // Legs
    g.fillStyle(0x222233, 0.8);
    g.fillRect(-52, -4, 3, 6);
    g.fillRect(-12, -34, 3, 6);

    // 2 monitores na mesa
    g.fillStyle(0x333355, 0.95);
    g.fillRect(-48, -58, 16, 12);
    g.fillRect(-28, -58, 16, 12);
    g.fillStyle(color, 0.4);
    g.fillRect(-46, -56, 12, 8);
    g.fillRect(-26, -56, 12, 8);
    // Screen content
    g.fillStyle(0x22c55e, 0.3);
    g.fillRect(-44, -54, 8, 2);
    g.fillStyle(0x06b6d4, 0.3);
    g.fillRect(-24, -54, 8, 2);

    // Estante de arquivos (filing cabinet)
    g.fillStyle(0x1e1e30, 0.9);
    g.fillRect(36, -52, 22, 40);
    g.lineStyle(1, 0x333355, 0.6);
    for (let d = 0; d < 4; d++) {
      g.strokeRect(38, -50 + d * 10, 18, 8);
      g.fillStyle(0x666688, 0.7);
      g.fillRect(44, -47 + d * 10, 6, 2);
      g.fillStyle(0x1e1e30, 0.9);
    }

    // Quadro kanban na parede
    g.fillStyle(0x1a1a2e, 0.8);
    g.fillRect(16, -52, 16, 24);
    g.lineStyle(1, color, 0.3);
    g.strokeRect(16, -52, 16, 24);
    g.lineBetween(21, -52, 21, -28);
    g.lineBetween(27, -52, 27, -28);
    // Kanban cards
    g.fillStyle(0x22c55e, 0.5);
    g.fillRect(17, -48, 3, 4);
    g.fillStyle(0xeab308, 0.5);
    g.fillRect(22, -46, 4, 4);
    g.fillStyle(0x06b6d4, 0.5);
    g.fillRect(28, -50, 4, 4);
    g.fillRect(28, -44, 4, 3);

    // Relógio analógico
    g.lineStyle(1, 0x888899, 0.7);
    g.strokeCircle(46, 20, 8);
    g.fillStyle(0x1a1a2e, 0.8);
    g.fillCircle(46, 20, 7);
    g.lineStyle(1, color, 0.6);
    g.lineBetween(46, 20, 46, 14);
    g.lineBetween(46, 20, 50, 18);

    // Planta decorativa
    g.fillStyle(0x22c55e, 0.6);
    g.fillCircle(-44, 38, 6);
    g.fillCircle(-48, 34, 4);
    g.fillCircle(-40, 34, 4);
    g.fillStyle(0x8B6914, 0.7);
    g.fillRect(-46, 42, 5, 8);
  },
  // 3: Soluções — Sala criativa / brainstorm
  3: (g, color) => {
    // Whiteboard grande com rabiscos
    g.fillStyle(0xeeeeee, 0.85);
    g.fillRect(-54, -56, 50, 30);
    g.lineStyle(1, 0x999999, 0.6);
    g.strokeRect(-54, -56, 50, 30);
    // Rabiscos no whiteboard
    g.lineStyle(2, color, 0.5);
    g.lineBetween(-46, -46, -26, -46);
    g.lineBetween(-26, -46, -26, -34);
    g.strokeCircle(-38, -38, 5);
    g.lineStyle(1, 0xef4444, 0.5);
    g.lineBetween(-44, -36, -32, -42);
    g.lineStyle(1, 0x3b82f6, 0.4);
    g.lineBetween(-20, -50, -10, -40);
    g.lineBetween(-10, -40, -18, -34);

    // Post-its coloridos espalhados
    const postits = [
      { x: 24, y: -50, c: 0xff6bff }, { x: 36, y: -46, c: 0xffff6b },
      { x: 28, y: -36, c: 0x6bffff }, { x: 42, y: -38, c: 0xff6b6b },
      { x: 48, y: -50, c: 0x6bff6b }, { x: 38, y: -28, c: 0xffaa6b },
    ];
    postits.forEach(p => {
      g.fillStyle(p.c, 0.6);
      g.fillRect(p.x, p.y, 10, 10);
      g.fillStyle(0x333333, 0.3);
      g.fillRect(p.x + 2, p.y + 3, 6, 1);
      g.fillRect(p.x + 2, p.y + 5, 5, 1);
    });

    // Lâmpada de ideia (bulb icon)
    g.fillStyle(0xfde68a, 0.8);
    g.fillCircle(-44, 32, 7);
    g.fillStyle(0xfbbf24, 0.5);
    g.fillCircle(-44, 32, 5);
    g.fillStyle(0x666666, 0.8);
    g.fillRect(-46, 39, 5, 4);
    g.fillRect(-47, 43, 7, 2);
    // Light rays
    g.lineStyle(1, 0xfbbf24, 0.3);
    g.lineBetween(-44, 24, -44, 20);
    g.lineBetween(-37, 27, -33, 24);
    g.lineBetween(-51, 27, -55, 24);

    // Mesa redonda com cadeiras
    g.fillStyle(0x2a2a3e, 0.8);
    g.fillCircle(10, 28, 16);
    g.fillStyle(0x1e1e30, 0.7);
    g.fillCircle(10, 28, 13);
    for (let ci = 0; ci < 4; ci++) {
      const angle = (ci / 4) * Math.PI * 2 - Math.PI / 4;
      const cx = 10 + Math.cos(angle) * 22;
      const cy = 28 + Math.sin(angle) * 22;
      g.fillStyle(0x333355, 0.7);
      g.fillCircle(cx, cy, 4);
    }

    // Mood board (canto superior direito, pequeno)
    g.fillStyle(0x2a2a3e, 0.7);
    g.fillRect(44, 14, 16, 20);
    g.fillStyle(color, 0.3);
    g.fillRect(46, 16, 5, 5);
    g.fillStyle(0x8b5cf6, 0.3);
    g.fillRect(53, 16, 5, 5);
    g.fillStyle(0xef4444, 0.3);
    g.fillRect(46, 23, 5, 5);
    g.fillStyle(0x06b6d4, 0.3);
    g.fillRect(53, 23, 5, 5);
  },
  // 4: Estruturas — Oficina de engenharia
  4: (g, color) => {
    // Blueprint na parede (grid azul)
    g.fillStyle(0x1e3a5f, 0.7);
    g.fillRect(-54, -56, 40, 28);
    g.lineStyle(1, 0x4488cc, 0.35);
    for (let bx = -50; bx < -14; bx += 6) g.lineBetween(bx, -52, bx, -30);
    for (let by = -52; by < -28; by += 6) g.lineBetween(-50, by, -17, by);
    // Blueprint shapes
    g.lineStyle(1, 0x88bbee, 0.5);
    g.strokeRect(-46, -48, 16, 10);
    g.lineBetween(-46, -43, -30, -43);
    g.strokeCircle(-26, -42, 5);
    // Dimension arrows
    g.lineStyle(1, 0xaaddff, 0.3);
    g.lineBetween(-46, -36, -30, -36);

    // Mesa de desenho técnico com régua T
    g.fillStyle(0x2a2a3e, 0.9);
    g.fillRect(-54, -16, 36, 24);
    g.fillStyle(color, 0.15);
    g.fillRect(-52, -14, 32, 20);
    // Régua T
    g.fillStyle(0xcccccc, 0.7);
    g.fillRect(-50, -6, 28, 2);
    g.fillRect(-50, -14, 2, 18);

    // Maquete 3D (canto direito)
    g.fillStyle(0x444466, 0.8);
    g.fillRect(22, -48, 28, 20);
    g.fillStyle(0x555577, 0.7);
    // 3D blocks
    g.fillRect(26, -44, 8, 8);
    g.fillRect(36, -46, 10, 12);
    g.fillStyle(color, 0.3);
    g.fillRect(28, -42, 4, 4);
    g.fillStyle(0x6688aa, 0.5);
    g.fillRect(38, -44, 6, 6);

    // Ferramentas (chave, martelo)
    g.fillStyle(0xaaaaaa, 0.8);
    g.fillRect(-50, 28, 20, 3);
    g.fillStyle(0xffaa44, 0.8);
    g.fillRect(-50, 32, 6, 14);
    g.fillStyle(0x888888, 0.8);
    g.fillRect(-40, 34, 4, 12);
    g.fillRect(-44, 34, 12, 3);

    // Impressora 3D
    g.fillStyle(0x333355, 0.9);
    g.fillRect(26, 18, 26, 22);
    g.fillStyle(0x222244, 0.8);
    g.fillRect(28, 20, 22, 18);
    g.fillStyle(color, 0.4);
    // Print bed
    g.fillRect(32, 30, 14, 6);
    // Nozzle
    g.fillStyle(0xcccccc, 0.7);
    g.fillRect(38, 22, 2, 8);
  },
  // 5: Financeiro — Trading floor
  5: (g, color) => {
    // 3 monitores com gráficos candlestick
    for (let m = 0; m < 3; m++) {
      const mx = -52 + m * 30;
      g.fillStyle(0x333355, 0.95);
      g.fillRect(mx, -58, 26, 18);
      g.fillStyle(0x0a0a15, 0.95);
      g.fillRect(mx + 2, -56, 22, 14);
      // Candlestick chart
      const isRed = m === 1;
      for (let px = 0; px < 5; px++) {
        const cx = mx + 5 + px * 4;
        const up = Math.sin(px * 1.5 + m * 2) > 0;
        const bodyH = 3 + Math.abs(Math.sin(px + m)) * 4;
        g.fillStyle(up ? 0x22c55e : 0xef4444, 0.8);
        g.fillRect(cx, -52, 2, bodyH);
        g.lineStyle(1, up ? 0x22c55e : 0xef4444, 0.5);
        g.lineBetween(cx + 1, -54, cx + 1, -52 + bodyH + 2);
      }
      // Stand
      g.fillStyle(0x333355, 0.8);
      g.fillRect(mx + 10, -40, 5, 4);
      g.fillRect(mx + 7, -36, 12, 2);
    }

    // Cofre no canto
    g.fillStyle(0x444466, 0.95);
    g.fillRect(-54, 22, 24, 26);
    g.lineStyle(2, 0x666688, 0.7);
    g.strokeCircle(-42, 35, 7);
    g.fillStyle(color, 0.6);
    g.fillCircle(-42, 35, 2);
    // Handle
    g.fillStyle(0x888899, 0.8);
    g.fillRect(-36, 32, 4, 2);

    // Calculadora
    g.fillStyle(0x222233, 0.9);
    g.fillRect(-20, 24, 16, 22);
    g.fillStyle(0x88ffaa, 0.5);
    g.fillRect(-18, 26, 12, 6);
    for (let br = 0; br < 3; br++) {
      for (let bc = 0; bc < 3; bc++) {
        g.fillStyle(0x444455, 0.8);
        g.fillRect(-18 + bc * 4, 34 + br * 4, 3, 3);
      }
    }

    // Pilha de moedas/barras douradas
    g.fillStyle(0xfbbf24, 0.8);
    g.fillRect(22, 36, 18, 4);
    g.fillRect(24, 32, 14, 4);
    g.fillRect(26, 28, 10, 4);
    g.fillStyle(0xeab308, 0.6);
    g.fillRect(23, 37, 16, 2);

    // Ticker tape (bottom)
    g.fillStyle(0x1a1a2e, 0.8);
    g.fillRect(14, 46, 46, 8);
    g.fillStyle(0x22c55e, 0.5);
    const tickers = ['▲', '▼', '▲', '▲'];
    tickers.forEach((_, i) => {
      g.fillStyle(i === 1 ? 0xef4444 : 0x22c55e, 0.5);
      g.fillRect(16 + i * 11, 48, 8, 4);
    });
  },
  // 6: Closer — Sala de reunião VIP
  6: (g, color) => {
    // Mesa oval de conferência
    g.fillStyle(0x2a2a3e, 0.9);
    g.beginPath();
    g.arc(0, -4, 26, 0, Math.PI * 2);
    g.fillPath();
    g.fillStyle(0x1e1e30, 0.85);
    g.beginPath();
    g.arc(0, -4, 22, 0, Math.PI * 2);
    g.fillPath();
    // Table highlight
    g.lineStyle(1, color, 0.2);
    g.strokeCircle(0, -4, 22);

    // 6 cadeiras ao redor
    for (let ci = 0; ci < 6; ci++) {
      const angle = (ci / 6) * Math.PI * 2 - Math.PI / 2;
      const cx = Math.cos(angle) * 34;
      const cy = -4 + Math.sin(angle) * 34;
      g.fillStyle(0x333355, 0.8);
      g.fillCircle(cx, cy, 5);
      g.fillStyle(0x444466, 0.5);
      g.fillCircle(cx, cy, 3);
    }

    // Contrato + caneta no centro
    g.fillStyle(0xeeeeee, 0.75);
    g.fillRect(-8, -12, 16, 20);
    g.lineStyle(1, 0xaaaaaa, 0.4);
    g.lineBetween(-5, -8, 5, -8);
    g.lineBetween(-5, -4, 5, -4);
    g.lineBetween(-5, 0, 5, 0);
    g.lineBetween(-5, 4, 3, 4);
    // Caneta
    g.fillStyle(0x1a1a2e, 0.9);
    g.fillRect(10, -8, 2, 14);
    g.fillStyle(color, 0.8);
    g.fillRect(10, 6, 2, 3);

    // Tela de projeção (topo)
    g.fillStyle(0x222244, 0.9);
    g.fillRect(-36, -56, 30, 18);
    g.fillStyle(0x0a0a15, 0.9);
    g.fillRect(-34, -54, 26, 14);
    g.fillStyle(color, 0.3);
    g.fillRect(-30, -52, 10, 3);
    g.fillStyle(0x888888, 0.2);
    g.fillRect(-30, -47, 18, 1);
    g.fillRect(-30, -44, 14, 1);

    // Troféu dourado (canto direito)
    g.fillStyle(0xfbbf24, 0.8);
    g.fillRect(38, -50, 4, 3);
    g.fillRect(34, -54, 12, 5);
    g.fillStyle(0xeab308, 0.7);
    g.fillCircle(40, -56, 6);
    g.fillStyle(0xfbbf24, 0.9);
    g.fillCircle(40, -56, 4);
    g.fillStyle(0xfde68a, 0.5);
    g.fillCircle(40, -56, 2);
  },
  // 7: Apresentação — Estúdio de design
  7: (g, color) => {
    // Telão widescreen
    g.fillStyle(0x222244, 0.95);
    g.fillRect(-50, -58, 52, 30);
    g.fillStyle(0x0a0a15, 0.95);
    g.fillRect(-47, -55, 46, 24);
    // Screen content - presentation slide
    g.fillStyle(color, 0.35);
    g.fillRect(-43, -52, 20, 4);
    g.fillStyle(0x888888, 0.2);
    g.fillRect(-43, -46, 38, 2);
    g.fillRect(-43, -42, 34, 2);
    g.fillRect(-43, -38, 36, 2);
    // Stand
    g.fillStyle(0x333355, 0.9);
    g.fillRect(-26, -28, 4, 6);
    g.fillRect(-32, -22, 16, 3);

    // Paleta de cores
    g.fillStyle(0xeeeeee, 0.6);
    g.fillCircle(44, -40, 12);
    const palColors = [0xff4444, 0x44ff44, 0x4444ff, 0xffff44, 0xff44ff, color];
    palColors.forEach((c, i) => {
      const pa = (i / 6) * Math.PI * 2;
      g.fillStyle(c, 0.7);
      g.fillCircle(44 + Math.cos(pa) * 7, -40 + Math.sin(pa) * 7, 3);
    });

    // Cavalete com tela
    g.fillStyle(0x8B6914, 0.7);
    g.fillRect(30, 14, 2, 36);
    g.fillRect(40, 14, 2, 36);
    g.lineBetween(31, 50, 35, 34);
    g.lineBetween(41, 50, 37, 34);
    g.fillStyle(0xeeeeee, 0.65);
    g.fillRect(26, 14, 20, 22);
    g.fillStyle(color, 0.3);
    g.fillCircle(36, 24, 6);
    g.fillStyle(0x8b5cf6, 0.3);
    g.fillRect(28, 28, 14, 4);

    // Câmera/tripé
    g.fillStyle(0x222222, 0.9);
    g.fillRect(-50, 24, 16, 10);
    g.fillStyle(0x333344, 0.8);
    g.fillRect(-46, 22, 8, 4);
    // Lens
    g.fillStyle(color, 0.5);
    g.fillCircle(-42, 29, 3);
    // Tripod legs
    g.fillStyle(0x555566, 0.8);
    g.fillRect(-43, 34, 2, 16);
    g.lineBetween(-48, 50, -42, 34);
    g.lineBetween(-36, 50, -42, 34);

    // Spotlight no chão
    g.fillStyle(0xfde68a, 0.15);
    g.fillCircle(0, 40, 14);
    g.fillStyle(0xfde68a, 0.08);
    g.fillCircle(0, 40, 20);

    // Microfone
    g.fillStyle(0x555566, 0.9);
    g.fillRect(-18, 26, 2, 22);
    g.fillStyle(0x333344, 0.9);
    g.fillCircle(-17, 24, 4);
    g.fillStyle(color, 0.4);
    g.fillCircle(-17, 24, 2);
  },
};

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
  private roomGlow!: RoomGlow;
  private dataStream!: DataStream;
  private neoShadow!: NeoShadow;
  private corridorGraphics!: Phaser.GameObjects.Graphics;

  private roomPositions: { x: number; y: number }[] = [];
  private roomColors: number[] = [];
  private worldW = 0;
  private worldH = 0;

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

    // Neo starts at first waypoint
    const startWp = this.waypoints[0];
    this.neo = new NeoCharacter(this, startWp.x, startWp.y);
    this.neo.create();
    this.neo.setDirection('down');

    // Effects
    this.ambientParticles = new AmbientParticles(this);
    this.glitchEffect = new GlitchEffect(this);
    this.neoTrail = new NeoTrail(this);
    this.particleBurst = new ParticleBurst(this);
    this.roomGlow = new RoomGlow(this);
    this.dataStream = new DataStream(this);
    this.neoShadow = new NeoShadow(this, startWp.x, startWp.y);

    // Set data stream path along the waypoints
    this.dataStream.setPath(this.waypoints);

    this.setupStoreListener();
  }

  private computeLayout(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    this.worldW = w;
    this.worldH = h;

    const step = ROOM_SIZE + ROOM_GAP;

    const bottomRowWidth = 4 * ROOM_SIZE + 3 * ROOM_GAP;
    const bottomStartX = Math.round((w - bottomRowWidth) / 2) + ROOM_SIZE / 2;
    const bottomY = h - 20 - ROOM_SIZE / 2;

    const leftX = bottomStartX;
    const leftTopY = bottomY - 2 * (step + 20) + 80;

    const rightX = bottomStartX + 3 * step;
    const rightTopY = bottomY - 2 * (step + 20) + 80;

    this.roomPositions = [
      { x: leftX, y: leftTopY },
      { x: leftX, y: leftTopY + step },
      { x: bottomStartX, y: bottomY + 20 },
      { x: bottomStartX + step, y: bottomY + 20 },
      { x: bottomStartX + 2 * step, y: bottomY + 20 },
      { x: bottomStartX + 3 * step, y: bottomY + 20 },
      { x: rightX, y: rightTopY + step },
      { x: rightX, y: rightTopY },
    ];
  }

  private buildWaypoints(): void {
    this.waypoints = [];
    const p = this.roomPositions;

    this.waypoints.push(p[0]);
    this.waypoints.push(p[1]);
    if (p[1].y !== p[2].y) {
      this.waypoints.push({ x: p[1].x, y: p[2].y });
    }
    this.waypoints.push(p[2]);
    this.waypoints.push(p[3]);
    this.waypoints.push(p[4]);
    this.waypoints.push(p[5]);
    if (p[5].y !== p[6].y) {
      this.waypoints.push({ x: p[5].x, y: p[6].y });
    }
    this.waypoints.push(p[6]);
    this.waypoints.push(p[7]);
  }

  private agentToWaypointIdx(agentIndex: number): number {
    const p = this.roomPositions;
    const hasLeftCorner = p[1].y !== p[2].y;
    const hasRightCorner = p[5].y !== p[6].y;

    if (agentIndex <= 1) return agentIndex;
    let idx = agentIndex;
    if (hasLeftCorner) idx += 1;
    if (agentIndex >= 6 && hasRightCorner) idx += 1;
    return idx;
  }

  update(_time: number, delta: number): void {
    if (!this.neo) return;

    const settings = useSettingsStore.getState();
    const neoSpeed = settings.animation.neoSpeed;

    this.neoTrail.setEnabled(settings.effects.neoTrail);
    this.ambientParticles.setEnabled(settings.effects.particles);
    this.glitchEffect.setEnabled(!settings.effects.reduceMotion && settings.effects.glitch);

    this.neo.update(delta);

    if (this.isMoving) {
      this.moveAlongWaypoints(neoSpeed, delta);
    }

    this.neoTrail.update(this.neo.x, this.neo.y, this.isMoving);
    this.neoShadow?.update(this.neo.x, this.neo.y, this.isMoving);
    this.dataStream?.update(delta);
    this.roomGlow?.update(delta, this.roomPositions, this.roomColors);
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
      this.neo.setPosition(target.x, target.y);

      if (this.currentWaypointIdx === this.targetWaypointIdx) {
        this.isMoving = false;
        this.neo.play('idle');

        for (let i = 0; i < 8; i++) {
          if (this.agentToWaypointIdx(i) === this.currentWaypointIdx) {
            this.onArriveAtHouse(i);
            break;
          }
        }

        if (this.moveQueue.length > 0) {
          const next = this.moveQueue.shift()!;
          this.moveToHouse(next);
        }
      } else {
        if (this.movingForward) {
          this.currentWaypointIdx++;
        } else {
          this.currentWaypointIdx--;
        }
        this.updateNeoDirection();
      }
    } else {
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
    this.neo.play('enter');
    this.time.delayedCall(500, () => {
      if (!this.isMoving) this.neo.play('idle');
    });

    const pos = this.roomPositions[index];
    if (!pos) return;

    const agent = AGENT_DEFINITIONS[index];
    const color = agent
      ? Phaser.Display.Color.HexStringToColor(agent.color).color
      : 0x22c55e;
    this.particleBurst.emit(pos.x, pos.y, color, 40);
    this.glitchEffect.trigger();

    // Flash the house
    const house = this.houses[index];
    if (house) {
      const rect = house.getAt(1) as Phaser.GameObjects.Rectangle;
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
    const cx = this.worldW / 2;
    const cy = this.worldH / 2;
    const maxR = Math.sqrt(cx * cx + cy * cy);

    // Radial gradient background — brighter center, darker edges
    const steps = 8;
    for (let i = steps; i >= 0; i--) {
      const r = (maxR * (i + 1)) / steps;
      const alpha = 0.01 + (steps - i) * 0.004;
      bg.fillStyle(0x22c55e, alpha);
      bg.fillCircle(cx, cy, r);
    }

    // Grid lines
    bg.lineStyle(1, 0x22c55e, 0.04);
    for (let x = 0; x < this.worldW; x += 40) {
      bg.lineBetween(x, 0, x, this.worldH);
    }
    for (let y = 0; y < this.worldH; y += 40) {
      bg.lineBetween(0, y, this.worldW, y);
    }

    // Nebula spots in corners
    const nebulaSpots = [
      { x: 60, y: 60, color: 0x8b5cf6 },
      { x: this.worldW - 60, y: 60, color: 0x06b6d4 },
      { x: 60, y: this.worldH - 60, color: 0x06b6d4 },
      { x: this.worldW - 60, y: this.worldH - 60, color: 0x8b5cf6 },
    ];
    nebulaSpots.forEach((s) => {
      bg.fillStyle(s.color, 0.015);
      bg.fillCircle(s.x, s.y, 120);
      bg.fillStyle(s.color, 0.008);
      bg.fillCircle(s.x, s.y, 200);
    });
  }

  private drawCorridor(): void {
    this.corridorGraphics = this.add.graphics();
    const g = this.corridorGraphics;
    const p = this.roomPositions;

    // Helper: draw double line with glow
    const drawSegment = (x1: number, y1: number, x2: number, y2: number) => {
      // Outer glow
      g.lineStyle(6, 0x22c55e, 0.06);
      g.lineBetween(x1, y1, x2, y2);
      // Main double lines
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      const nx = -dy / len * 3;
      const ny = dx / len * 3;
      g.lineStyle(1, 0x22c55e, 0.25);
      g.lineBetween(x1 + nx, y1 + ny, x2 + nx, y2 + ny);
      g.lineBetween(x1 - nx, y1 - ny, x2 - nx, y2 - ny);
    };

    // Draw corridor segments
    drawSegment(p[0].x, p[0].y, p[1].x, p[1].y);
    drawSegment(p[1].x, p[1].y, p[1].x, p[2].y);
    drawSegment(p[1].x, p[2].y, p[2].x, p[2].y);
    drawSegment(p[2].x, p[2].y, p[5].x, p[5].y);
    drawSegment(p[5].x, p[5].y, p[5].x, p[6].y);
    drawSegment(p[5].x, p[6].y, p[6].x, p[6].y);
    drawSegment(p[6].x, p[6].y, p[7].x, p[7].y);

    // Direction arrows along bottom row
    g.fillStyle(0x22c55e, 0.2);
    const arrowY = p[2].y;
    for (let ax = p[2].x + 40; ax < p[5].x - 20; ax += 60) {
      // Small right-pointing triangle
      g.fillTriangle(ax, arrowY - 4, ax, arrowY + 4, ax + 8, arrowY);
    }

    // Down arrows on left column
    for (let ay = p[0].y + 40; ay < p[1].y - 20; ay += 60) {
      g.fillTriangle(p[0].x - 4, ay, p[0].x + 4, ay, p[0].x, ay + 8);
    }

    // Up arrows on right column
    for (let ay = p[6].y - 40; ay > p[7].y + 20; ay -= 60) {
      g.fillTriangle(p[7].x - 4, ay, p[7].x + 4, ay, p[7].x, ay - 8);
    }

    // Junction nodes with glow
    g.fillStyle(0x22c55e, 0.5);
    for (let i = 0; i < 8; i++) {
      g.fillCircle(p[i].x, p[i].y, 5);
      g.fillStyle(0x22c55e, 0.15);
      g.fillCircle(p[i].x, p[i].y, 10);
      g.fillStyle(0x22c55e, 0.5);
    }
  }

  private createHouses(): void {
    const agents = AGENT_DEFINITIONS;
    const half = ROOM_SIZE / 2;

    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      const pos = this.roomPositions[i];

      const house = this.add.container(pos.x, pos.y);
      const agentColor = Phaser.Display.Color.HexStringToColor(agent.color).color;
      this.roomColors.push(agentColor);

      // Drop shadow beneath the room
      const shadowG = this.add.graphics();
      shadowG.fillStyle(0x000000, 0.25);
      shadowG.fillRoundedRect(-half + 4, -half + 4, ROOM_SIZE, ROOM_SIZE, 8);
      shadowG.fillStyle(0x000000, 0.12);
      shadowG.fillRoundedRect(-half + 8, -half + 8, ROOM_SIZE, ROOM_SIZE, 10);
      house.add(shadowG);

      // Room floor with rounded corners
      const rect = this.add.rectangle(0, 0, ROOM_SIZE, ROOM_SIZE, 0x1a1a2e, 0.9);
      rect.setStrokeStyle(2, agentColor);
      house.add(rect);

      // Wall depth gradient — darker top to lighter bottom
      const wallG = this.add.graphics();
      for (let wy = 0; wy < 12; wy++) {
        const a = 0.3 - wy * 0.02;
        wallG.fillStyle(0x2a2a4e, a);
        wallG.fillRect(-half + 1, -half + 1 + wy, ROOM_SIZE - 2, 1);
      }
      house.add(wallG);

      // Hexagonal floor pattern
      const floorG = this.add.graphics();
      const hexR = 8;
      const hexW = hexR * 2;
      const hexH = Math.sqrt(3) * hexR;
      for (let row = -6; row <= 6; row++) {
        for (let col = -6; col <= 6; col++) {
          const hx = col * hexW * 0.75;
          const hy = row * hexH + (col % 2 === 0 ? 0 : hexH / 2);
          if (Math.abs(hx) > half - 4 || Math.abs(hy) > half - 4) continue;
          const isEven = (row + col) % 2 === 0;
          floorG.fillStyle(agentColor, isEven ? 0.04 : 0.015);
          floorG.beginPath();
          for (let s = 0; s < 6; s++) {
            const angle = (Math.PI / 3) * s - Math.PI / 6;
            const px = hx + hexR * Math.cos(angle);
            const py = hy + hexR * Math.sin(angle);
            if (s === 0) floorG.moveTo(px, py);
            else floorG.lineTo(px, py);
          }
          floorG.closePath();
          floorG.fillPath();
        }
      }
      house.add(floorG);

      // Scanline effect (cyberpunk horizontal lines)
      const scanG = this.add.graphics();
      scanG.fillStyle(0x000000, 0.04);
      for (let sy = -half + 2; sy < half; sy += 4) {
        scanG.fillRect(-half + 1, sy, ROOM_SIZE - 2, 1);
      }
      house.add(scanG);

      // Central radial light — 3 camadas de gradiente
      const lightG = this.add.graphics();
      lightG.fillStyle(agentColor, 0.08);
      lightG.fillCircle(0, 0, 50);
      lightG.fillStyle(agentColor, 0.05);
      lightG.fillCircle(0, 0, 70);
      lightG.fillStyle(agentColor, 0.02);
      lightG.fillCircle(0, 0, 85);
      house.add(lightG);

      // Inner border neon glow (moldura pulsante)
      const borderGlowG = this.add.graphics();
      borderGlowG.lineStyle(3, agentColor, 0.15);
      borderGlowG.strokeRect(-half + 3, -half + 3, ROOM_SIZE - 6, ROOM_SIZE - 6);
      borderGlowG.lineStyle(1, agentColor, 0.3);
      borderGlowG.strokeRect(-half + 5, -half + 5, ROOM_SIZE - 10, ROOM_SIZE - 10);
      house.add(borderGlowG);

      // Corner accents — neon details nos cantos
      const cornerG = this.add.graphics();
      cornerG.lineStyle(2, agentColor, 0.5);
      const cLen = 12;
      // Top-left
      cornerG.lineBetween(-half + 2, -half + 2, -half + 2 + cLen, -half + 2);
      cornerG.lineBetween(-half + 2, -half + 2, -half + 2, -half + 2 + cLen);
      // Top-right
      cornerG.lineBetween(half - 2, -half + 2, half - 2 - cLen, -half + 2);
      cornerG.lineBetween(half - 2, -half + 2, half - 2, -half + 2 + cLen);
      // Bottom-left
      cornerG.lineBetween(-half + 2, half - 2, -half + 2 + cLen, half - 2);
      cornerG.lineBetween(-half + 2, half - 2, -half + 2, half - 2 - cLen);
      // Bottom-right
      cornerG.lineBetween(half - 2, half - 2, half - 2 - cLen, half - 2);
      cornerG.lineBetween(half - 2, half - 2, half - 2, half - 2 - cLen);
      house.add(cornerG);

      // Themed furniture
      const furnitureG = this.add.graphics();
      const themeDraw = ROOM_THEMES[i];
      if (themeDraw) {
        themeDraw(furnitureG, agentColor);
      }
      house.add(furnitureG);

      // Status LED indicator near door (bottom-center)
      const led = this.add.circle(0, ROOM_SIZE / 2 - 6, 3, 0x666666, 0.6);
      house.add(led);

      // Agent name — prominent neon label centered in room
      const labelBg = this.add.graphics();
      const nameWidth = agent.name.length * 6 + 18;
      labelBg.fillStyle(0x0a0a0a, 0.75);
      labelBg.fillRoundedRect(-nameWidth / 2, -8, nameWidth, 18, 5);
      labelBg.lineStyle(1, agentColor, 0.4);
      labelBg.strokeRoundedRect(-nameWidth / 2, -8, nameWidth, 18, 5);
      house.add(labelBg);

      const label = this.add.text(0, 1, agent.name.toUpperCase(), {
        fontFamily: '"Geist", system-ui, sans-serif',
        fontSize: '10px',
        color: agent.color,
        align: 'center',
        fontStyle: 'bold',
        shadow: { offsetX: 0, offsetY: 0, color: agent.color, blur: 6, fill: true, stroke: false },
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

          const rect = this.houses[i].getAt(1) as Phaser.GameObjects.Rectangle;
          const color = Phaser.Display.Color.HexStringToColor(agent.color).color;

          // LED indicator (second to last child before label elements)
          const ledIndex = this.houses[i].length - 3; // led is before labelBg and label
          const led = this.houses[i].getAt(ledIndex) as Phaser.GameObjects.Arc;

          if (agent.status === 'processing' || agent.status === 'active') {
            rect.setStrokeStyle(3, color);
            rect.setAlpha(1);
            if (led) led.setFillStyle(0x22c55e, 1); // green LED
            this.roomGlow.activate(i, this.roomPositions[i].x, this.roomPositions[i].y, color);
          } else if (agent.status === 'done') {
            rect.setStrokeStyle(2, 0x22c55e);
            rect.setAlpha(1);
            if (led) led.setFillStyle(0x22c55e, 0.6);
            this.roomGlow.deactivate(i);
          } else if (agent.status === 'error') {
            rect.setStrokeStyle(3, 0xdc2626);
            rect.setAlpha(1);
            if (led) led.setFillStyle(0xdc2626, 1); // red LED
            this.roomGlow.deactivate(i);
          } else {
            rect.setStrokeStyle(2, color);
            rect.setAlpha(0.5);
            if (led) led.setFillStyle(0x666666, 0.6);
            this.roomGlow.deactivate(i);
          }
        });

        if (pipeline.currentAgent && pipeline.currentAgent !== this.lastActiveAgent) {
          this.lastActiveAgent = pipeline.currentAgent;
          const agentIndex = AGENT_DEFINITIONS.findIndex((a) => a.id === pipeline.currentAgent);
          if (agentIndex >= 0) {
            this.moveToHouse(agentIndex);
          }
        }

        // Update Neo status indicator
        const isActive = pipeline.status !== 'idle';
        this.neo.setPipelineActive(isActive);

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
    this.roomGlow?.destroy();
    this.dataStream?.destroy();
    this.neoShadow?.destroy();
    this.houses.forEach((h) => h.destroy());
    this.agentLabels.forEach((l) => l.destroy());
    this.corridorGraphics?.destroy();
    this.tweens.killAll();
    this.time.removeAllEvents();
  }
}
