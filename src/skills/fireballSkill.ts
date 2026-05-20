import type { Skill } from './skillTypes';
import { registerSkill } from './skillRegistry';
import { ProjectileEntity } from '../entities/ProjectileEntity';

export const fireballSkill: Skill = {
  id: 'fireball_attack',
  name: 'Fireball',
  description: 'Replaces basic attack with a fireball projectile.',
  onAttack: (char, engine, target) => {
    const dir = target.pos.sub(char.pos).normalize();
    const proj = new ProjectileEntity(
      `proj_${engine.random.next()}`,
      char.pos.clone(),
      dir.mul(300),
      8,
      char.id,
      char.team,
      char.config.attackDamage,
      3,
      '#ff6600'
    );
    engine.addEntity(proj);
    engine.addFloatingText('Fire!', char.pos, '#ff6600');
  }
};

registerSkill(fireballSkill);
