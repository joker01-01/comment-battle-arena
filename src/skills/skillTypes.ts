import type { CharacterEntity } from '../entities/CharacterEntity';
import type { BattleEngine } from '../core/BattleEngine';

export interface Skill {
  id: string;
  name: string;
  description: string;
  
  onBattleStart?: (char: CharacterEntity, engine: BattleEngine) => void;
  onTick?: (char: CharacterEntity, engine: BattleEngine, dt: number) => void;
  onAttack?: (char: CharacterEntity, engine: BattleEngine, target: CharacterEntity) => void;
  onHit?: (char: CharacterEntity, engine: BattleEngine, target: CharacterEntity, damage: number) => void;
  onDamageTaken?: (char: CharacterEntity, engine: BattleEngine, damage: number, sourceId?: string) => number; // Returns modified damage
  onDeath?: (char: CharacterEntity, engine: BattleEngine) => void;
  onBattleEnd?: (char: CharacterEntity, engine: BattleEngine) => void;
}
