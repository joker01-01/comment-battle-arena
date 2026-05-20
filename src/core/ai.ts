import type { CharacterEntity } from '../entities/CharacterEntity';
import type { BattleEngine } from './BattleEngine';
export function updateAI(char: CharacterEntity, engine: BattleEngine, _dt: number) {
  const target = engine.getNearestEnemy(char);
  if (!target) {
    return;
  }

  const dist = char.pos.distanceTo(target.pos);
  const edgeDist = Math.max(0, dist - char.radius - target.radius);

  // AI no longer controls acceleration/movement. Movement is pure momentum.
  // AI only decides when to trigger attacks/skills based on distance and behavior type.

  switch (char.config.behaviorType) {
    case 'aggressive':
    case 'charger':
      if (edgeDist <= char.config.attackRange) {
        tryAttack(char, target, engine);
      }
      break;

    case 'ranged':
    case 'summoner':
      if (edgeDist <= char.config.attackRange) {
        tryAttack(char, target, engine);
      }
      break;

    case 'defensive':
      if (edgeDist <= char.config.attackRange) {
        tryAttack(char, target, engine);
      }
      break;

    case 'random':
      if (edgeDist <= char.config.attackRange) {
        tryAttack(char, target, engine);
      }
      break;
  }
}

function tryAttack(char: CharacterEntity, target: CharacterEntity, engine: BattleEngine) {
  if (char.attackTimer <= 0) {
    char.attackTimer = char.config.attackCooldown;
    
    let handledBySkill = false;
    for (const skill of char.skills) {
      if (skill.onAttack) {
        skill.onAttack(char, engine, target);
        handledBySkill = true;
      }
    }

    if (!handledBySkill) {
      // Default melee attack (if no specific attack skill)
      // Note: In this physics version, melee damage is mostly done via collision.
      // But we can keep a small base attack damage here if they are in range.
      target.takeDamage(char.config.attackDamage, engine, char.id);
      engine.stats.skillDamageDealt[char.team] += char.config.attackDamage;
      
      for (const skill of char.skills) {
        if (skill.onHit) skill.onHit(char, engine, target, char.config.attackDamage);
      }
    }
  }
}
