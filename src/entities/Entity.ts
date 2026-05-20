import { Vector2 } from '../core/vector';
import type { BattleEngine } from '../core/BattleEngine';

export abstract class Entity {
  public id: string;
  public pos: Vector2;
  public velocity: Vector2;
  public radius: number;
  public isDead: boolean = false;

  constructor(id: string, pos: Vector2, radius: number) {
    this.id = id;
    this.pos = pos;
    this.radius = radius;
    this.velocity = new Vector2(0, 0);
  }

  abstract update(dt: number, engine: BattleEngine): void;
  abstract draw(ctx: CanvasRenderingContext2D): void;
}
