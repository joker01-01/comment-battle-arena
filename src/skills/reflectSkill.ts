import type { Skill } from './skillTypes';
import { registerSkill } from './skillRegistry';

import { EffectEntity } from '../entities/EffectEntity';

export const reflectSkill: Skill = {
  id: 'reflect_damage',
  name: 'Reflect',
  description: 'Has a 30% chance to reflect 50% of taken damage back to the attacker.',
  onDamageTaken: (char, engine, damage, sourceId) => {
    if (sourceId && engine.random.next() < 0.3) {
      const attacker = engine.getCharacter(sourceId);
      if (attacker && !attacker.isDead) {
        const reflectDmg = damage * 0.5;
        attacker.takeDamage(reflectDmg, engine, char.id);
        engine.addEntity(new EffectEntity(`reflect_${engine.random.next()}`, char.pos.clone(), 15, 0.4, '#cc00cc', 'reflect'));
        engine.addFloatingText('Reflect!', char.pos, '#cc00cc');
      }
    }
    return damage;
  }
};

registerSkill(reflectSkill);
