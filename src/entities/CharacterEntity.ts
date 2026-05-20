import { Entity } from './Entity';
import { Vector2 } from '../core/vector';
import type { CharacterConfig, Team } from '../core/types';
import type { BattleEngine } from '../core/BattleEngine';
import type { Skill } from '../skills/skillTypes';
import { getSkill } from '../skills/skillRegistry';

export class CharacterEntity extends Entity {
  public config: CharacterConfig;
  public team: Team;
  public hp: number;
  public maxHp: number;
  public attackTimer: number = 0;
  public skills: Skill[] = [];
  
  // Physics properties
  public acceleration: Vector2 = new Vector2(0, 0);
  public mass: number;
  public restitution: number;
  public friction: number;
  public baseSpeed: number;
  public facing: 1 | -1 = 1;
  
  // States
  public shield: number = 0;
  public isDashing: boolean = false;
  public dashTimer: number = 0;
  public stunTimer: number = 0;
  public stateData: {
    lastState?: string;
    stateEntryTime?: number;
    healTimer?: number;
    isCharging?: boolean;
    chargeTimer?: number;
    chargeDuration?: number;
    isCasting?: boolean;
    skillCastTimer?: number;
    skillCastDuration?: number;
    currentCastingSkillId?: string;
    [key: string]: any;
  } = {};

  constructor(id: string, pos: Vector2, config: CharacterConfig, team: Team) {
    super(id, pos, config.physics.radius);
    this.config = config;
    this.team = team;
    this.maxHp = config.maxHp;
    this.hp = this.maxHp;
    
    this.mass = config.physics.mass;
    this.restitution = config.physics.restitution;
    this.friction = config.physics.friction;
    this.baseSpeed = config.physics.baseSpeed;

    for (const skillId of config.skills) {
      const skill = getSkill(skillId);
      if (skill) {
        this.skills.push(skill);
      }
    }
  }

  update(dt: number, engine: BattleEngine): void {
    if (this.isDead) return;

    if (this.stunTimer > 0) {
      this.stunTimer -= dt;
    }

    for (const skill of this.skills) {
      if (skill.onTick) {
        skill.onTick(this, engine, dt);
      }
    }

    if (this.isDashing) {
      this.dashTimer -= dt;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }
    }

    this.attackTimer -= dt;

    if (this.stunTimer <= 0) {
      engine.aiUpdate(this, dt);
    }

    // Apply physics (momentum based)
    // We no longer use acceleration for basic movement.
    
    // Smoothly correct speed towards baseSpeed
    const currentSpeed = this.velocity.mag();
    if (currentSpeed > 0) {
      // If moving faster than baseSpeed, apply friction to slow down
      if (currentSpeed > this.baseSpeed) {
        const drop = currentSpeed * this.friction * dt;
        const newSpeed = Math.max(this.baseSpeed, currentSpeed - drop);
        this.velocity = this.velocity.normalize().mul(newSpeed);
      } 
      // If moving slower than baseSpeed, smoothly accelerate back up
      else if (currentSpeed < this.baseSpeed && this.stunTimer <= 0) {
        // Recover speed at a rate determined by friction/responsiveness
        const recoveryRate = this.baseSpeed * 2.0 * dt; 
        const newSpeed = Math.min(this.baseSpeed, currentSpeed + recoveryRate);
        this.velocity = this.velocity.normalize().mul(newSpeed);
      }
    } else if (this.stunTimer <= 0) {
      // If completely stopped (e.g. at start), give a random direction at baseSpeed
      const angle = engine.random.nextRange(0, Math.PI * 2);
      this.velocity = new Vector2(Math.cos(angle), Math.sin(angle)).mul(this.baseSpeed);
    }

    // Update facing
    if (this.velocity.x > 0.1) this.facing = 1;
    else if (this.velocity.x < -0.1) this.facing = -1;

    this.pos = this.pos.add(this.velocity.mul(dt));
  }

  takeDamage(amount: number, engine: BattleEngine, sourceId?: string): void {
    if (this.isDead) return;

    let finalDamage = amount;

    // Trigger onDamageTaken skills
    for (const skill of this.skills) {
      if (skill.onDamageTaken) {
        finalDamage = skill.onDamageTaken(this, engine, finalDamage, sourceId);
      }
    }

    if (this.shield > 0) {
      if (this.shield >= finalDamage) {
        this.shield -= finalDamage;
        finalDamage = 0;
        engine.addFloatingText('Blocked!', this.pos, '#aaaaaa');
      } else {
        finalDamage -= this.shield;
        this.shield = 0;
      }
    }

    if (finalDamage > 0) {
      this.hp -= finalDamage;
      engine.addFloatingText(`-${Math.round(finalDamage)}`, this.pos, '#ff4444');
      engine.log(`${this.config.name} took ${Math.round(finalDamage)} damage.`);
      
      if (this.hp <= 0) {
        this.hp = 0;
        this.isDead = true;
        engine.log(`${this.config.name} died.`);
        
        for (const skill of this.skills) {
          if (skill.onDeath) skill.onDeath(this, engine);
        }
      }
    }
  }

  heal(amount: number, engine: BattleEngine): void {
    if (this.isDead) return;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    engine.addFloatingText(`+${Math.round(amount)}`, this.pos, '#44ff44');
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.isDead) return;

    // Draw shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(this.pos.x, this.pos.y + this.radius * 0.8, this.radius, this.radius * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw body
    ctx.fillStyle = this.config.color;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000';
    ctx.stroke();

    // Draw shield
    if (this.shield > 0) {
      ctx.strokeStyle = '#44aaff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.radius + 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw team indicator
    ctx.fillStyle = this.team === 'left' ? '#4444ff' : '#ff4444';
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y - this.radius - 10, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}
