import type { CharacterEntity } from '../entities/CharacterEntity';
import type { BattleEngine } from './BattleEngine';

const IMPACT_THRESHOLD = 50;

import { EffectEntity } from '../entities/EffectEntity';

export function resolveCircleCollision(a: CharacterEntity, b: CharacterEntity, engine: BattleEngine) {
  const dist = a.pos.distanceTo(b.pos);
  const minDist = a.radius + b.radius;

  if (dist >= minDist || dist === 0) return;

  const normal = b.pos.sub(a.pos).normalize();
  const relativeVelocity = b.velocity.sub(a.velocity);
  const velocityAlongNormal = relativeVelocity.x * normal.x + relativeVelocity.y * normal.y;

  // 1. Positional Correction (always apply to prevent sinking)
  const penetration = minDist - dist;
  const slop = 0.5; // allowance
  const percent = 0.8; // correction percentage
  
  const invMassA = 1 / a.mass;
  const invMassB = 1 / b.mass;
  const totalInvMass = invMassA + invMassB;

  const correctionMagnitude = (Math.max(penetration - slop, 0) / totalInvMass) * percent;
  const correction = normal.mul(correctionMagnitude);

  a.pos = a.pos.sub(correction.mul(invMassA));
  b.pos = b.pos.add(correction.mul(invMassB));

  // 2. Impulse & Damage (only if approaching)
  if (velocityAlongNormal >= 0) return;

  const restitution = Math.min(a.restitution, b.restitution);
  const j = -(1 + restitution) * velocityAlongNormal / totalInvMass;
  const impulse = normal.mul(j);

  a.velocity = a.velocity.sub(impulse.mul(invMassA));
  b.velocity = b.velocity.add(impulse.mul(invMassB));

  // 3. Collision Damage
  const relativeSpeed = -velocityAlongNormal;
  
  engine.stats.totalCollisions++;
  if (relativeSpeed > engine.stats.maxImpactSpeed) {
    engine.stats.maxImpactSpeed = relativeSpeed;
  }

  if (relativeSpeed > IMPACT_THRESHOLD) {
    const pairKey = [a.id, b.id].sort().join(':');
    const lastTime = engine.collisionCooldowns.get(pairKey) ?? -Infinity;

    if (engine.time - lastTime >= 0.25) {
      engine.collisionCooldowns.set(pairKey, engine.time);

      const aMult = a.isDashing ? 2.5 : 1.0;
      const bMult = b.isDashing ? 2.5 : 1.0;

      const impactSpeed = relativeSpeed - IMPACT_THRESHOLD;
      
      const damageToA = impactSpeed * b.config.physics.collisionDamage * bMult * 0.01;
      const damageToB = impactSpeed * a.config.physics.collisionDamage * aMult * 0.01;

      if (damageToA > 0) {
        a.takeDamage(damageToA, engine, b.id);
        engine.stats.collisionDamageDealt[b.team] += damageToA;
      }
      if (damageToB > 0) {
        b.takeDamage(damageToB, engine, a.id);
        engine.stats.collisionDamageDealt[a.team] += damageToB;
      }

      // Visuals
      engine.renderer.shake(relativeSpeed * 0.05, 0.2);
      
      // Spark effect at collision point
      const collisionPoint = a.pos.add(b.pos).mul(0.5);
      engine.addEntity(new EffectEntity(`spark_${engine.random.next()}`, collisionPoint, 10, 0.3, '#ffcc00', 'spark'));
    }
  }
}
