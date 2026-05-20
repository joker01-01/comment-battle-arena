import type { CharacterConfig } from '../core/types';
import type { PixelSpriteDefinition } from '../rendering/PixelCharacterRenderer';

export const runtimeCharacters: Record<string, CharacterConfig> = {};
export const runtimeSprites: Record<string, PixelSpriteDefinition> = {};

export function registerRuntimeCharacter(config: CharacterConfig, sprite: PixelSpriteDefinition) {
  runtimeCharacters[config.id] = config;
  runtimeSprites[sprite.id] = sprite;
}

export function getRuntimeCharacterConfigs(): CharacterConfig[] {
  return Object.values(runtimeCharacters);
}

export function getRuntimeSprite(id: string): PixelSpriteDefinition | undefined {
  return runtimeSprites[id];
}
