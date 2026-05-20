import { describe, it, expect } from 'vitest';
import { CharacterEntity } from '../src/entities/CharacterEntity';
import { BattleEngine } from '../src/core/BattleEngine';
import { Vector2 } from '../src/core/vector';
import { getCharacterConfig } from '../src/data/characters';
import { episodes } from '../src/data/episodes';

describe('Physics and Collision', () => {
  it('should separate overlapping characters (Positional Correction)', () => {
    const configA = getCharacterConfig('char_shield_cat'); // radius: 36
    const configB = getCharacterConfig('char_rush_dog');   // radius: 30
    
    const charA = new CharacterEntity('A', new Vector2(100, 100), configA, 'left');
    const charB = new CharacterEntity('B', new Vector2(100 + 36 + 30 - 10, 100), configB, 'right'); // Overlapping by 10 pixels on X axis
    
    // Initial distance is 56 (36 + 30 - 10)
    expect(charA.pos.distanceTo(charB.pos)).toBeCloseTo(56, 1);
    
    const engine = new BattleEngine(episodes[0]);
    engine.renderer = { shake: () => {} } as any;
    engine.characters.push(charA, charB);
    engine.entities.push(charA, charB);
    
    // Run collision resolution once
    engine.handleCollisions();
    
    // They should be pushed apart.
    // Penetration = 10. Slop = 0.5. Correction = (10 - 0.5) * 0.8 = 7.6 pixels total.
    // New distance should be 56 + 7.6 = 63.6
    const newDist = charA.pos.distanceTo(charB.pos);
    expect(newDist).toBeCloseTo(63.6, 1);
  });
});
