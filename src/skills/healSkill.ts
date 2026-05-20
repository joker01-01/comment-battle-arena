import type { Skill } from './skillTypes';
import { registerSkill } from './skillRegistry';

import { EffectEntity } from '../entities/EffectEntity';

export const healSkill: Skill = {
  id: 'auto_heal_5s',
  name: 'Auto Heal',
  description: 'Heals for 10 HP every 5 seconds.',
  onTick: (char, engine, dt) => {
    if (!char.stateData.healTimer) char.stateData.healTimer = 0;
    char.stateData.healTimer += dt;

    if (char.stateData.healTimer >= 5) {
      char.stateData.healTimer = 0;
      char.heal(10, engine);
      engine.addEntity(new EffectEntity(`heal_${engine.random.next()}`, char.pos.clone(), 10, 0.5, '#44ff44', 'heal'));
      engine.addFloatingText('Heal!', char.pos, '#44ff44');
    }
  }
};

registerSkill(healSkill);
