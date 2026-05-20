import { Entity } from './Entity';
import { Vector2 } from '../core/vector';
import type { BattleEngine } from '../core/BattleEngine';
import type { Team } from '../core/types';

export class TrapEntity extends Entity {
  public ownerId: string;
  public team: Team;
  public damage: number;
  public lifeTimer: number;

  constructor(id: string, pos: Vector2, radius: number, ownerId: string, team: Team, damage: number, lifeTime: number) {
    super(id, pos, radius);
    this.ownerId = ownerId;
    this.team = team;
    this.damage = damage;
    this.lifeTimer = lifeTime;
  }

  update(dt: number, engine: BattleEngine): void {
    if (this.isDead) return;

    this.lifeTimer -= dt;
    if (this.lifeTimer <= 0) {
      this.isDead = true;
      return;
    }

    for (const char of engine.characters) {
      if (char.team !== this.team && !char.isDead) {
        const dist = this.pos.distanceTo(char.pos);
        if (dist < this.radius + char.radius) {
          char.takeDamage(this.damage, engine, this.ownerId);
          this.isDead = true;
          break;
        }
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.isDead) return;
    ctx.fillStyle = '#ffaa00';
    ctx.beginPath();
    ctx.moveTo(this.pos.x, this.pos.y - this.radius);
    ctx.lineTo(this.pos.x + this.radius, this.pos.y + this.radius);
    ctx.lineTo(this.pos.x - this.radius, this.pos.y + this.radius);
    ctx.closePath();
    ctx.fill();
  }
}
