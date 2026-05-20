import { Vector2 } from './vector';

export type Team = 'left' | 'right';
export type BehaviorType = 'aggressive' | 'ranged' | 'defensive' | 'random' | 'charger' | 'summoner';

export interface PhysicsConfig {
  radius: number;
  mass: number;
  restitution: number;
  friction: number; // Used to damp high speeds back to baseSpeed
  baseSpeed: number; // The target speed the character maintains
  collisionDamage: number;
  knockbackResistance: number;
}

export interface CharacterConfig {
  id: string;
  name: string;
  maxHp: number;
  color: string;
  spriteId: string;
  physics: PhysicsConfig;
  attackRange: number;
  attackDamage: number;
  attackCooldown: number;
  behaviorType: BehaviorType;
  skills: string[];
  description: string;
  weakness: string;
}

export interface EpisodeConfig {
  episodeId: string;
  title: string;
  leftCharacterId: string;
  rightCharacterId: string;
  arenaId: string;
  seed: number;
}

export interface DamageEvent {
  amount: number;
  sourceId: string;
  targetId: string;
  isCrit?: boolean;
}

export interface FloatingText {
  id: string;
  text: string;
  pos: Vector2;
  color: string;
  life: number;
  maxLife: number;
  velocity: Vector2;
  size: number;
}
