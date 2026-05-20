import { Entity } from './Entity';
import { Vector2 } from '../core/vector';
import type { BattleEngine } from '../core/BattleEngine';
import { PIXEL_UNIT } from '../core/constants';

export class EffectEntity extends Entity {
  public lifeTimer: number;
  public maxLife: number;
  public color: string;
  public type: 'explosion' | 'slash' | 'heal' | 'spark' | 'reflect';
  private particles: { x: number, y: number, vx: number, vy: number, size: number }[] = [];

  constructor(id: string, pos: Vector2, radius: number, lifeTime: number, color: string, type: 'explosion' | 'slash' | 'heal' | 'spark' | 'reflect') {
    super(id, pos, radius);
    this.lifeTimer = lifeTime;
    this.maxLife = lifeTime;
    this.color = color;
    this.type = type;

    // Initialize particles based on type
    if (type === 'spark' || type === 'explosion') {
      const count = type === 'spark' ? 5 : 12;
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: 0, y: 0,
          vx: (Math.random() - 0.5) * 200,
          vy: (Math.random() - 0.5) * 200,
          size: Math.random() > 0.5 ? 4 : 8 // Pixel block sizes
        });
      }
    } else if (type === 'heal') {
      this.particles.push({ x: 0, y: 0, vx: 0, vy: -50, size: 8 });
    } else if (type === 'reflect') {
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        this.particles.push({
          x: Math.cos(angle) * 10, y: Math.sin(angle) * 10,
          vx: Math.cos(angle) * 100, vy: Math.sin(angle) * 100,
          size: 4
        });
      }
    }
  }

  update(dt: number, _engine: BattleEngine): void {
    if (this.isDead) return;
    this.lifeTimer -= dt;
    if (this.lifeTimer <= 0) {
      this.isDead = true;
    }

    // Update particles
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.isDead) return;
    const progress = 1 - (this.lifeTimer / this.maxLife);
    ctx.globalAlpha = 1 - progress;
    
    ctx.fillStyle = this.color;
    
    if (this.type === 'spark' || this.type === 'explosion' || this.type === 'reflect') {
      for (const p of this.particles) {
        // Snap to pixel grid
        const px = Math.round((this.pos.x + p.x) / PIXEL_UNIT) * PIXEL_UNIT;
        const py = Math.round((this.pos.y + p.y) / PIXEL_UNIT) * PIXEL_UNIT;
        ctx.fillRect(px, py, p.size, p.size);
      }
    } else if (this.type === 'heal') {
      for (const p of this.particles) {
        const px = Math.round((this.pos.x + p.x) / PIXEL_UNIT) * PIXEL_UNIT;
        const py = Math.round((this.pos.y + p.y) / PIXEL_UNIT) * PIXEL_UNIT;
        // Draw a pixel plus sign
        ctx.fillRect(px - PIXEL_UNIT, py, PIXEL_UNIT * 3, PIXEL_UNIT);
        ctx.fillRect(px, py - PIXEL_UNIT, PIXEL_UNIT, PIXEL_UNIT * 3);
      }
    } else if (this.type === 'slash') {
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 4 * (1 - progress);
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.radius, -Math.PI/4, Math.PI/4);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }
}
