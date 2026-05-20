import { Entity } from './Entity';
import { Vector2 } from '../core/vector';
import type { BattleEngine } from '../core/BattleEngine';
import type { Team } from '../core/types';
import { PIXEL_UNIT } from '../core/constants';

export class ProjectileEntity extends Entity {
  public ownerId: string;
  public team: Team;
  public damage: number;
  public lifeTimer: number;
  public color: string;

  constructor(id: string, pos: Vector2, velocity: Vector2, radius: number, ownerId: string, team: Team, damage: number, lifeTime: number, color: string) {
    super(id, pos, radius);
    this.velocity = velocity;
    this.ownerId = ownerId;
    this.team = team;
    this.damage = damage;
    this.lifeTimer = lifeTime;
    this.color = color;
  }

  update(dt: number, engine: BattleEngine): void {
    if (this.isDead) return;

    this.pos = this.pos.add(this.velocity.mul(dt));
    this.lifeTimer -= dt;

    if (this.lifeTimer <= 0) {
      this.isDead = true;
      return;
    }

    // Check collision with enemies
    for (const char of engine.characters) {
      if (char.team !== this.team && !char.isDead) {
        const dist = this.pos.distanceTo(char.pos);
        if (dist < this.radius + char.radius) {
          // Hit!
          char.takeDamage(this.damage, engine, this.ownerId);
          
          // Trigger onHit for owner
          const owner = engine.getCharacter(this.ownerId);
          if (owner) {
            for (const skill of owner.skills) {
              if (skill.onHit) skill.onHit(owner, engine, char, this.damage);
            }
          }

          this.isDead = true;
          break;
        }
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.isDead) return;
    
    // Draw as a blocky pixel projectile
    const size = this.radius * 1.5; // Make it a bit square
    const px = Math.round((this.pos.x - size / 2) / PIXEL_UNIT) * PIXEL_UNIT;
    const py = Math.round((this.pos.y - size / 2) / PIXEL_UNIT) * PIXEL_UNIT;
    const pSize = Math.round(size / PIXEL_UNIT) * PIXEL_UNIT;
    
    ctx.fillStyle = this.color;
    ctx.fillRect(px, py, pSize, pSize);
    
    // Inner bright core
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(px + PIXEL_UNIT, py + PIXEL_UNIT, pSize - PIXEL_UNIT * 2, pSize - PIXEL_UNIT * 2);
  }
}
