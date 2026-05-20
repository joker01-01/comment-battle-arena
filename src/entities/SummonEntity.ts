import { CharacterEntity } from './CharacterEntity';
import { Vector2 } from '../core/vector';
import type { CharacterConfig, Team } from '../core/types';
import type { BattleEngine } from '../core/BattleEngine';

export class SummonEntity extends CharacterEntity {
  public ownerId: string;
  public lifeTimer: number;

  constructor(id: string, pos: Vector2, config: CharacterConfig, team: Team, ownerId: string, lifeTime: number) {
    super(id, pos, config, team);
    this.ownerId = ownerId;
    this.lifeTimer = lifeTime;
  }

  update(dt: number, engine: BattleEngine): void {
    super.update(dt, engine);
    if (this.isDead) return;

    this.lifeTimer -= dt;
    if (this.lifeTimer <= 0) {
      this.hp = 0;
      this.isDead = true;
    }
  }
}
