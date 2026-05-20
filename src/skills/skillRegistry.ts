import type { Skill } from './skillTypes';

const registry = new Map<string, Skill>();

export function registerSkill(skill: Skill) {
  registry.set(skill.id, skill);
}

export function getSkill(id: string): Skill | undefined {
  return registry.get(id);
}
