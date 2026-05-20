import type { Skill } from './skillTypes';
import { registerSkill } from './skillRegistry';
import { SummonEntity } from '../entities/SummonEntity';
import { Vector2 } from '../core/vector';

export const splitSummonSkill: Skill = {
  id: 'split_on_damage',
  name: 'Split Summon',
  description: 'Summons a mini slime when taking more than 15 damage.',
  onDamageTaken: (char, engine, damage, _sourceId) => {
    if (damage >= 15) {
      const miniConfig = {
        ...char.config,
        id: `mini_${engine.random.next()}`,
        name: 'Mini Slime',
        maxHp: 20,
        spriteId: 'split_slime',
        physics: {
          ...char.config.physics,
          radius: char.config.physics.radius * 0.5,
          mass: char.config.physics.mass * 0.5
        },
        attackDamage: 5,
        skills: [],
        behaviorType: 'aggressive' as const
      };
      
      const summon = new SummonEntity(
        miniConfig.id,
        char.pos.clone().add(new Vector2(engine.random.nextBoolean() ? 20 : -20, engine.random.nextBoolean() ? 20 : -20)),
        miniConfig,
        char.team,
        char.id,
        10 // 10 seconds lifetime
      );
      
      // Give mini slime initial velocity
      const angle = engine.random.nextRange(0, Math.PI * 2);
      summon.velocity = new Vector2(Math.cos(angle), Math.sin(angle)).mul(miniConfig.physics.baseSpeed);
      
      engine.addEntity(summon);
      engine.addFloatingText('Split!', char.pos, '#00ff00');
    }
    return damage;
  }
};

registerSkill(splitSummonSkill);
