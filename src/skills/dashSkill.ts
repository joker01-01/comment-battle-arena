import type { Skill } from './skillTypes';
import { registerSkill } from './skillRegistry';

export const dashSkill: Skill = {
  id: 'dash_attack',
  name: 'Dash Attack',
  description: 'Charges up and dashes towards the enemy with high impulse.',
  onTick: (char, engine, dt) => {
    if (char.isDashing) return;

    // Handle charging state
    if (char.stateData.isCharging && char.stateData.currentCastingSkillId === 'dash_attack') {
      char.stateData.chargeTimer = (char.stateData.chargeTimer || 0) + dt;
      
      // Slow down while charging
      char.velocity = char.velocity.mul(0.9);

      if (char.stateData.chargeTimer >= (char.stateData.chargeDuration || 0.5)) {
        // Execute Dash
        char.stateData.isCharging = false;
        char.stateData.chargeTimer = 0;
        char.isDashing = true;
        char.dashTimer = 0.5; // dash duration
        
        const target = engine.getNearestEnemy(char);
        let dir = char.velocity.magSq() > 0 ? char.velocity.normalize() : { x: char.facing, y: 0 } as any;
        if (target) {
          dir = target.pos.sub(char.pos).normalize();
        }
        
        // Apply a massive impulse for the dash
        const dashImpulse = 800; 
        char.velocity = char.velocity.add(dir.mul(dashImpulse));
        
        engine.addFloatingText('Dash!', char.pos, '#ffffff');
      }
      return; // Skip cooldown logic while charging
    }

    if (!char.stateData.dashCooldown) char.stateData.dashCooldown = 5;
    char.stateData.dashCooldown -= dt;

    if (char.stateData.dashCooldown <= 0) {
      const target = engine.getNearestEnemy(char);
      if (target) {
        char.stateData.dashCooldown = 5;
        
        // Start charging
        char.stateData.isCharging = true;
        char.stateData.currentCastingSkillId = 'dash_attack';
        char.stateData.chargeTimer = 0;
        char.stateData.chargeDuration = 0.5; // 0.5s wind-up
      }
    }
  }
};

registerSkill(dashSkill);
