import { describe, it, expect } from 'vitest';
import { CharacterEntity } from '../src/entities/CharacterEntity';
import { BattleEngine } from '../src/core/BattleEngine';
import { Vector2 } from '../src/core/vector';
import { getCharacterConfig } from '../src/data/characters';
import { episodes } from '../src/data/episodes';
import { resolveCircleCollision } from '../src/core/collision';

describe('Physics Damage and Impulse', () => {
  it('should apply damage on high-speed impact', () => {
    const configA = getCharacterConfig('char_shield_cat');
    const configB = getCharacterConfig('char_rush_dog');
    
    const charA = new CharacterEntity('A', new Vector2(100, 100), configA, 'left');
    const charB = new CharacterEntity('B', new Vector2(150, 100), configB, 'right');
    
    // Set high velocities towards each other
    charA.velocity = new Vector2(200, 0);
    charB.velocity = new Vector2(-200, 0);
    
    const engine = new BattleEngine(episodes[0]);
    engine.renderer = { shake: () => {} } as any;
    engine.characters.push(charA, charB);
    engine.entities.push(charA, charB);
    
    const initialHpA = charA.hp;
    const initialHpB = charB.hp;
    
    resolveCircleCollision(charA, charB, engine);
    
    // They should have taken damage
    expect(charA.hp).toBeLessThan(initialHpA);
    expect(charB.hp).toBeLessThan(initialHpB);
    
    // They should have their velocities changed
    expect(charA.velocity.x).toBeLessThan(200);
    expect(charB.velocity.x).toBeGreaterThan(-200);
  });

  it('should not apply damage on low-speed impact', () => {
    const configA = getCharacterConfig('char_shield_cat');
    const configB = getCharacterConfig('char_rush_dog');
    
    const charA = new CharacterEntity('A', new Vector2(100, 100), configA, 'left');
    const charB = new CharacterEntity('B', new Vector2(150, 100), configB, 'right');
    
    // Set low velocities towards each other (relative speed = 40 < 50 threshold)
    charA.velocity = new Vector2(20, 0);
    charB.velocity = new Vector2(-20, 0);
    
    const engine = new BattleEngine(episodes[0]);
    engine.renderer = { shake: () => {} } as any;
    // We don't call engine.init here because init() now sets a random initial velocity based on baseSpeed!
    // We want to test a specific low-speed collision.
    engine.characters.push(charA, charB);
    engine.entities.push(charA, charB);
    
    const initialHpA = charA.hp;
    const initialHpB = charB.hp;
    
    resolveCircleCollision(charA, charB, engine);
    
    // They should NOT have taken damage
    expect(charA.hp).toBe(initialHpA);
    expect(charB.hp).toBe(initialHpB);
    
    // But they should still have their velocities changed
    expect(charA.velocity.x).toBeLessThan(20);
    expect(charB.velocity.x).toBeGreaterThan(-20);
  });

  it('should respect collision damage cooldown', () => {
    const configA = getCharacterConfig('char_shield_cat');
    const configB = getCharacterConfig('char_rush_dog');
    
    const charA = new CharacterEntity('A', new Vector2(100, 100), configA, 'left');
    const charB = new CharacterEntity('B', new Vector2(150, 100), configB, 'right');
    
    charA.velocity = new Vector2(200, 0);
    charB.velocity = new Vector2(-200, 0);
    
    const engine = new BattleEngine(episodes[0]);
    engine.renderer = { shake: () => {} } as any;
    engine.characters.push(charA, charB);
    engine.entities.push(charA, charB);
    
    // First collision
    resolveCircleCollision(charA, charB, engine);
    const hpAfterFirst = charA.hp;
    expect(hpAfterFirst).toBeLessThan(configA.maxHp);
    
    // Reset velocities to force another collision immediately
    charA.velocity = new Vector2(200, 0);
    charB.velocity = new Vector2(-200, 0);
    
    // Second collision (time hasn't advanced)
    resolveCircleCollision(charA, charB, engine);
    
    // HP should not change because of cooldown
    expect(charA.hp).toBe(hpAfterFirst);
    
    // Advance time by 0.3s (cooldown is 0.25s)
    engine.time = 0.3;
    
    // Reset velocities to force a third collision
    charA.velocity = new Vector2(200, 0);
    charB.velocity = new Vector2(-200, 0);
    
    // Third collision
    resolveCircleCollision(charA, charB, engine);
    
    // HP should decrease again
    expect(charA.hp).toBeLessThan(hpAfterFirst);
  });
});
