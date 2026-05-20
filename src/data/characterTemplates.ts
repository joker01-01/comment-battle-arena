import type { CharacterConfig } from '../core/types';

export type BattleStyleTemplate = Omit<CharacterConfig, 'id' | 'name' | 'color' | 'spriteId' | 'skills' | 'description' | 'weakness'>;

export const characterTemplates: Record<string, BattleStyleTemplate> = {
  aggressive_light: {
    maxHp: 90,
    behaviorType: 'aggressive',
    attackRange: 35,
    attackDamage: 18,
    attackCooldown: 0.8,
    physics: {
      radius: 28,
      mass: 0.8,
      restitution: 0.9,
      friction: 0.5,
      baseSpeed: 280,
      collisionDamage: 15,
      knockbackResistance: 0.8
    }
  },
  aggressive_heavy: {
    maxHp: 160,
    behaviorType: 'aggressive',
    attackRange: 45,
    attackDamage: 25,
    attackCooldown: 1.8,
    physics: {
      radius: 38,
      mass: 1.8,
      restitution: 0.7,
      friction: 0.5,
      baseSpeed: 140,
      collisionDamage: 30,
      knockbackResistance: 1.8
    }
  },
  charger_fast: {
    maxHp: 110,
    behaviorType: 'charger',
    attackRange: 40,
    attackDamage: 15,
    attackCooldown: 1.2,
    physics: {
      radius: 30,
      mass: 1.0,
      restitution: 0.9,
      friction: 0.5,
      baseSpeed: 220,
      collisionDamage: 25,
      knockbackResistance: 1.0
    }
  },
  ranged_glass_cannon: {
    maxHp: 70,
    behaviorType: 'ranged',
    attackRange: 250,
    attackDamage: 30,
    attackCooldown: 2.0,
    physics: {
      radius: 26,
      mass: 0.6,
      restitution: 0.95,
      friction: 0.5,
      baseSpeed: 260,
      collisionDamage: 5,
      knockbackResistance: 0.6
    }
  },
  defensive_tank: {
    maxHp: 200,
    behaviorType: 'defensive',
    attackRange: 45,
    attackDamage: 12,
    attackCooldown: 1.5,
    physics: {
      radius: 42,
      mass: 2.0,
      restitution: 0.6,
      friction: 0.5,
      baseSpeed: 100,
      collisionDamage: 15,
      knockbackResistance: 2.0
    }
  },
  healer_sustain: {
    maxHp: 130,
    behaviorType: 'defensive',
    attackRange: 40,
    attackDamage: 10,
    attackCooldown: 1.2,
    physics: {
      radius: 34,
      mass: 1.2,
      restitution: 0.8,
      friction: 0.5,
      baseSpeed: 160,
      collisionDamage: 10,
      knockbackResistance: 1.2
    }
  },
  summoner_swarm: {
    maxHp: 140,
    behaviorType: 'summoner',
    attackRange: 45,
    attackDamage: 12,
    attackCooldown: 1.5,
    physics: {
      radius: 36,
      mass: 1.0,
      restitution: 0.85,
      friction: 0.5,
      baseSpeed: 180,
      collisionDamage: 12,
      knockbackResistance: 1.0
    }
  },
  bouncy_slime: {
    maxHp: 120,
    behaviorType: 'random',
    attackRange: 40,
    attackDamage: 10,
    attackCooldown: 1.0,
    physics: {
      radius: 45,
      mass: 0.7,
      restitution: 1.2, // Extremely bouncy
      friction: 0.5,
      baseSpeed: 240,
      collisionDamage: 15,
      knockbackResistance: 0.5
    }
  },
  reflect_counter: {
    maxHp: 150,
    behaviorType: 'aggressive',
    attackRange: 45,
    attackDamage: 15,
    attackCooldown: 1.2,
    physics: {
      radius: 34,
      mass: 1.4,
      restitution: 0.8,
      friction: 0.5,
      baseSpeed: 180,
      collisionDamage: 20,
      knockbackResistance: 1.4
    }
  }
};
