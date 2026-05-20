import { BattleEngine } from './BattleEngine';
import { PixelCharacterRenderer } from '../rendering/PixelCharacterRenderer';
import { CharacterEntity } from '../entities/CharacterEntity';

import { TextStyles } from '../rendering/textStyles';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private shakeTimer: number = 0;
  private shakeIntensity: number = 0;
  private pixelRenderer: PixelCharacterRenderer;

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.pixelRenderer = new PixelCharacterRenderer();
  }

  setDebugMode(showColliders: boolean) {
    this.pixelRenderer.showColliders = showColliders;
  }

  shake(intensity: number, duration: number) {
    this.shakeIntensity = intensity;
    this.shakeTimer = duration;
  }

  render(engine: BattleEngine, dt: number) {
    this.ctx.save();
    this.ctx.clearRect(0, 0, 800, 450);

    // Draw arena background
    this.ctx.fillStyle = '#222';
    this.ctx.fillRect(0, 0, 800, 450);

    // Grid pattern
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1;
    for (let x = 0; x < 800; x += 50) {
      this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, 450); this.ctx.stroke();
    }
    for (let y = 0; y < 450; y += 50) {
      this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(800, y); this.ctx.stroke();
    }

    // Camera shake
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const dx = (Math.random() - 0.5) * this.shakeIntensity;
      const dy = (Math.random() - 0.5) * this.shakeIntensity;
      this.ctx.translate(dx, dy);
    }

    // Sort entities by Y position for fake 3D depth
    const sortedEntities = [...engine.entities].sort((a, b) => a.pos.y - b.pos.y);

    for (const entity of sortedEntities) {
      if (entity instanceof CharacterEntity) {
        this.pixelRenderer.drawCharacter(this.ctx, entity, engine.time);
      } else {
        entity.draw(this.ctx);
      }
    }

    // Draw floating texts
    for (const ft of engine.floatingTexts) {
      this.ctx.save();
      this.ctx.globalAlpha = ft.life / ft.maxLife;
      this.ctx.fillStyle = ft.color;
      this.ctx.font = `bold ${ft.size}px ${TextStyles.fontFamily}`;
      this.ctx.textAlign = 'center';
      this.ctx.strokeStyle = '#000';
      this.ctx.lineWidth = 2;
      this.ctx.strokeText(ft.text, ft.pos.x, ft.pos.y);
      this.ctx.fillText(ft.text, ft.pos.x, ft.pos.y);
      this.ctx.restore();
    }

    this.ctx.restore();

    // Draw UI overlay (HP bars)
    this.drawUI(engine);
  }

  private drawUI(engine: BattleEngine) {
    const leftChar = engine.characters.find(c => c.team === 'left' && !c.id.startsWith('mini_'));
    const rightChar = engine.characters.find(c => c.team === 'right' && !c.id.startsWith('mini_'));

    if (leftChar) {
      this.drawHpBar(20, 20, 300, 20, leftChar.hp, leftChar.maxHp, leftChar.config.name, '#4444ff');
    }
    if (rightChar) {
      this.drawHpBar(800 - 320, 20, 300, 20, rightChar.hp, rightChar.maxHp, rightChar.config.name, '#ff4444', true);
    }

    // Draw Timer
    this.ctx.fillStyle = '#fff';
    this.ctx.font = TextStyles.resultTitle;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${Math.max(0, engine.maxTime - engine.time).toFixed(1)}s`, 800 / 2, 35);
  }

  private drawHpBar(x: number, y: number, w: number, h: number, hp: number, maxHp: number, name: string, color: string, rightAlign: boolean = false) {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(x, y, w, h);
    
    const hpPct = Math.max(0, hp / maxHp);
    this.ctx.fillStyle = color;
    if (rightAlign) {
      this.ctx.fillRect(x + w * (1 - hpPct), y, w * hpPct, h);
    } else {
      this.ctx.fillRect(x, y, w * hpPct, h);
    }

    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, w, h);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = TextStyles.characterName;
    this.ctx.textAlign = rightAlign ? 'right' : 'left';
    this.ctx.fillText(`${name} (${Math.ceil(hp)}/${maxHp})`, rightAlign ? x + w : x, y - 5);
  }
}
