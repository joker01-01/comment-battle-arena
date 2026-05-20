import type { Skill } from './skillTypes';
import { registerSkill } from './skillRegistry';

export const shieldSkill: Skill = {
  id: 'shield_8s',
  name: 'Auto Shield',
  description: 'Gains a shield every 8 seconds that blocks 1 instance of damage.',
  onTick: (char, engine, dt) => {
    if (!char.stateData.shieldTimer) char.stateData.shieldTimer = 0;
    char.stateData.shieldTimer += dt;
    
    if (char.stateData.shieldTimer >= 8) {
      char.stateData.shieldTimer = 0;
      if (char.shield === 0) {
        char.shield = 9999; // Block any 1 instance
        engine.addFloatingText('Shield!', char.pos, '#44aaff');
      }
    }
  }
};

registerSkill(shieldSkill);
