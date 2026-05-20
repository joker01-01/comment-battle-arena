import type { CharacterConfig } from '../core/types';
import { getRuntimeCharacterConfigs, runtimeCharacters } from './runtimeCharacters';

export const characters: CharacterConfig[] = [
  {
    id: 'char_shield_cat',
    name: 'Shield Cat',
    maxHp: 150,
    color: '#4aa3ff',
    spriteId: 'shield_cat',
    physics: {
      radius: 36,
      mass: 1.5,
      restitution: 0.8, // Increased to bounce more
      friction: 0.5, // Reduced friction
      baseSpeed: 150, // Replaced maxSpeed/accel with baseSpeed
      collisionDamage: 10,
      knockbackResistance: 1.5
    },
    attackRange: 40,
    attackDamage: 10,
    attackCooldown: 1.5,
    behaviorType: 'defensive',
    skills: ['shield_8s'],
    description: 'A defensive cat that gains a shield every 8 seconds.',
    weakness: 'Slow movement and low attack damage.'
  },
  {
    id: 'char_rush_dog',
    name: 'Rush Dog',
    maxHp: 120,
    color: '#cc8844',
    spriteId: 'rush_dog',
    physics: {
      radius: 30,
      mass: 1.0,
      restitution: 0.9,
      friction: 0.5,
      baseSpeed: 200,
      collisionDamage: 25,
      knockbackResistance: 1.0
    },
    attackRange: 45,
    attackDamage: 15,
    attackCooldown: 1.0,
    behaviorType: 'charger',
    skills: ['dash_attack'],
    description: 'An aggressive dog that dashes towards enemies.',
    weakness: 'Vulnerable if the dash misses.'
  },
  {
    id: 'char_fire_wizard',
    name: 'Fire Wizard',
    maxHp: 80,
    color: '#ff4444',
    spriteId: 'fire_wizard',
    physics: {
      radius: 28,
      mass: 0.7,
      restitution: 0.9,
      friction: 0.5,
      baseSpeed: 250,
      collisionDamage: 5,
      knockbackResistance: 0.8
    },
    attackRange: 250,
    attackDamage: 25,
    attackCooldown: 2.0,
    behaviorType: 'ranged',
    skills: ['fireball_attack'],
    description: 'A wizard that shoots fireballs from a distance.',
    weakness: 'Very low HP, dangerous if engaged in melee.'
  },
  {
    id: 'char_heal_bot',
    name: 'Heal Bot',
    maxHp: 130,
    color: '#44ff44',
    spriteId: 'heal_bot',
    physics: {
      radius: 34,
      mass: 1.3,
      restitution: 0.7,
      friction: 0.5,
      baseSpeed: 120,
      collisionDamage: 8,
      knockbackResistance: 1.2
    },
    attackRange: 40,
    attackDamage: 8,
    attackCooldown: 1.0,
    behaviorType: 'defensive',
    skills: ['auto_heal_5s'],
    description: 'A robot that heals itself over time.',
    weakness: 'Low burst damage, struggles against high DPS.'
  },
  {
    id: 'char_split_slime',
    name: 'Split Slime',
    maxHp: 140,
    color: '#00ffcc',
    spriteId: 'split_slime',
    physics: {
      radius: 40,
      mass: 0.8,
      restitution: 1.0,
      friction: 0.5,
      baseSpeed: 180,
      collisionDamage: 12,
      knockbackResistance: 0.5
    },
    attackRange: 45,
    attackDamage: 12,
    attackCooldown: 1.5,
    behaviorType: 'summoner',
    skills: ['split_on_damage'],
    description: 'A slime that splits into smaller slimes when taking heavy damage.',
    weakness: 'Slow movement speed.'
  },
  {
    id: 'char_mirror_knight',
    name: 'Mirror Knight',
    maxHp: 110,
    color: '#dddddd',
    spriteId: 'mirror_knight',
    physics: {
      radius: 32,
      mass: 1.2,
      restitution: 0.8,
      friction: 0.5,
      baseSpeed: 220,
      collisionDamage: 18,
      knockbackResistance: 1.1
    },
    attackRange: 45,
    attackDamage: 18,
    attackCooldown: 1.2,
    behaviorType: 'aggressive',
    skills: ['reflect_damage'],
    description: 'A knight with a chance to reflect damage back to the attacker.',
    weakness: 'Inconsistent defense against ranged kiters.'
  }
];

export function getCharacterConfig(id: string): CharacterConfig {
  if (runtimeCharacters[id]) return runtimeCharacters[id];
  const char = characters.find(c => c.id === id);
  if (!char) throw new Error(`Character ${id} not found`);
  return char;
}

export function getAllCharacterConfigs(): CharacterConfig[] {
  return [...characters, ...getRuntimeCharacterConfigs()];
}
