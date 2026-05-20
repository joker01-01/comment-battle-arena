import { CharacterEntity } from '../entities/CharacterEntity';
import { Entity } from '../entities/Entity';
import { Vector2 } from './vector';
import { Random } from './random';
import type { FloatingText, EpisodeConfig } from './types';
import { updateAI } from './ai';

import { resolveCircleCollision } from './collision';

import type { Renderer } from './Renderer';

export class BattleEngine {
  public characters: CharacterEntity[] = [];
  public entities: Entity[] = [];
  public floatingTexts: FloatingText[] = [];
  public random: Random;
  public time: number = 0;
  public maxTime: number = 60;
  public isFinished: boolean = false;
  public winner: string | null = null;
  public logs: string[] = [];
  public arenaWidth: number = 800;
  public arenaHeight: number = 450;
  public config: EpisodeConfig;

  public stats = {
    totalCollisions: 0,
    maxImpactSpeed: 0,
    collisionDamageDealt: { left: 0, right: 0 },
    skillDamageDealt: { left: 0, right: 0 }
  };
  public collisionCooldowns = new Map<string, number>();

  public renderer!: Renderer;

  constructor(config: EpisodeConfig) {
    this.config = config;
    this.random = new Random(config.seed);
  }

  init(leftChar: CharacterEntity, rightChar: CharacterEntity) {
    this.characters.push(leftChar, rightChar);
    this.entities.push(leftChar, rightChar);
    
    // Give initial random velocities
    const angleL = this.random.nextRange(-Math.PI/4, Math.PI/4); // point roughly right
    leftChar.velocity = new Vector2(Math.cos(angleL), Math.sin(angleL)).mul(leftChar.baseSpeed);
    
    const angleR = this.random.nextRange(Math.PI - Math.PI/4, Math.PI + Math.PI/4); // point roughly left
    rightChar.velocity = new Vector2(Math.cos(angleR), Math.sin(angleR)).mul(rightChar.baseSpeed);

    this.log(`Battle Start: ${leftChar.config.name} vs ${rightChar.config.name}`);
    
    for (const char of this.characters) {
      for (const skill of char.skills) {
        if (skill.onBattleStart) skill.onBattleStart(char, this);
      }
    }
  }

  update(dt: number) {
    if (this.isFinished) return;

    this.time += dt;

    // Update all entities
    for (const entity of this.entities) {
      entity.update(dt, this);
    }

    // Physics iterations for stability (solves wall + character overlap)
    for (let i = 0; i < 3; i++) {
      this.handleCollisions();
      this.constrainToArena();
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      ft.pos = ft.pos.add(ft.velocity.mul(dt));
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Remove dead entities
    this.entities = this.entities.filter(e => !e.isDead);

    this.checkWinCondition();
  }

  aiUpdate(char: CharacterEntity, dt: number) {
    updateAI(char, this, dt);
  }

  handleCollisions() {
    const chars = this.characters.filter(c => !c.isDead);
    for (let i = 0; i < chars.length; i++) {
      for (let j = i + 1; j < chars.length; j++) {
        resolveCircleCollision(chars[i], chars[j], this);
      }
    }
  }

  constrainToArena() {
    for (const entity of this.entities) {
      let hitWall = false;
      const r = entity.radius;
      
      // Use restitution for wall bounces
      const bounce = entity instanceof CharacterEntity ? entity.restitution : 0.8;
      
      if (entity.pos.x < r) {
        entity.pos.x = r;
        entity.velocity.x = Math.abs(entity.velocity.x) * bounce;
        hitWall = true;
      } else if (entity.pos.x > this.arenaWidth - r) {
        entity.pos.x = this.arenaWidth - r;
        entity.velocity.x = -Math.abs(entity.velocity.x) * bounce;
        hitWall = true;
      }
      
      if (entity.pos.y < r) {
        entity.pos.y = r;
        entity.velocity.y = Math.abs(entity.velocity.y) * bounce;
        hitWall = true;
      } else if (entity.pos.y > this.arenaHeight - r) {
        entity.pos.y = this.arenaHeight - r;
        entity.velocity.y = -Math.abs(entity.velocity.y) * bounce;
        hitWall = true;
      }

      if (hitWall && entity.velocity.mag() > 200) {
        this.renderer.shake(entity.velocity.mag() * 0.02, 0.1);
      }
    }
  }

  checkWinCondition() {
    const leftAlive = this.characters.filter(c => c.team === 'left' && !c.isDead);
    const rightAlive = this.characters.filter(c => c.team === 'right' && !c.isDead);

    if (leftAlive.length === 0 && rightAlive.length === 0) {
      this.finishBattle('Draw');
    } else if (leftAlive.length === 0) {
      this.finishBattle(rightAlive[0].config.name);
    } else if (rightAlive.length === 0) {
      this.finishBattle(leftAlive[0].config.name);
    } else if (this.time >= this.maxTime) {
      // Time out, check HP
      const leftHp = leftAlive.reduce((sum, c) => sum + c.hp, 0);
      const rightHp = rightAlive.reduce((sum, c) => sum + c.hp, 0);
      if (leftHp > rightHp) {
        this.finishBattle(leftAlive[0].config.name);
      } else if (rightHp > leftHp) {
        this.finishBattle(rightAlive[0].config.name);
      } else {
        this.finishBattle('Draw');
      }
    }
  }

  finishBattle(winnerName: string) {
    this.isFinished = true;
    this.winner = winnerName;
    this.log(`Battle Ended. Winner: ${winnerName}`);

    for (const char of this.characters) {
      for (const skill of char.skills) {
        if (skill.onBattleEnd) skill.onBattleEnd(char, this);
      }
    }
  }

  addEntity(entity: Entity) {
    this.entities.push(entity);
    if (entity instanceof CharacterEntity) {
      this.characters.push(entity);
    }
  }

  getCharacter(id: string): CharacterEntity | undefined {
    return this.characters.find(c => c.id === id);
  }

  getNearestEnemy(char: CharacterEntity): CharacterEntity | null {
    let nearest: CharacterEntity | null = null;
    let minDist = Infinity;
    for (const c of this.characters) {
      if (c.team !== char.team && !c.isDead) {
        const dist = c.pos.distanceTo(char.pos);
        if (dist < minDist) {
          minDist = dist;
          nearest = c;
        }
      }
    }
    return nearest;
  }

  addFloatingText(text: string, pos: Vector2, color: string) {
    this.floatingTexts.push({
      id: `ft_${this.random.next()}`,
      text,
      pos: pos.clone().add(new Vector2(this.random.nextRange(-10, 10), -20)),
      color,
      life: 1,
      maxLife: 1,
      velocity: new Vector2(0, -30),
      size: 16
    });
  }

  log(msg: string) {
    const timeStr = this.time.toFixed(1);
    this.logs.push(`[${timeStr}s] ${msg}`);
    // Dispatch event for UI
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('battleLog', { detail: `[${timeStr}s] ${msg}` }));
    }
  }
}
