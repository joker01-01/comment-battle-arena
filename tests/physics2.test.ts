import { describe, it, expect } from 'vitest';
import { CharacterEntity } from '../src/entities/CharacterEntity';
import { BattleEngine } from '../src/core/BattleEngine';
import { Vector2 } from '../src/core/vector';
import { getCharacterConfig } from '../src/data/characters';
import { episodes } from '../src/data/episodes';

describe('Physics and Collision', () => {
  it('should not overlap deeply when pushing against each other', () => {
    const configA = getCharacterConfig('char_heal_bot'); // radius: 34, mass: 1.3, acc: 500
    const configB = getCharacterConfig('char_split_slime');   // radius: 40, mass: 0.8, acc: 400
    
    // Set them up so they are touching
    const charA = new CharacterEntity('A', new Vector2(100, 100), configA, 'left');
    const charB = new CharacterEntity('B', new Vector2(100 + 34 + 40, 100), configB, 'right');
    
    const engine = new BattleEngine(episodes[0]);
    engine.renderer = { shake: () => {} } as any;
    engine.characters.push(charA, charB);
    engine.entities.push(charA, charB);
    
    // Simulate 60 frames (1 second) of them accelerating towards each other
    const dt = 1 / 60;
    for (let i = 0; i < 60; i++) {
      charA.acceleration = new Vector2(-configA.physics.acceleration, 0); // Move left
      charB.acceleration = new Vector2(-configB.physics.acceleration, 0); // Move left
      
      charA.update(dt, engine);
      charB.update(dt, engine);
      
      for (let j = 0; j < 3; j++) {
        engine.handleCollisions();
        engine.constrainToArena();
      }
      
      const dist = charA.pos.distanceTo(charB.pos);
      const minDist = charA.radius + charB.radius;
      // console.log(`Frame ${i}: dist=${dist.toFixed(2)}, pen=${(minDist - dist).toFixed(2)}, xA=${charA.pos.x.toFixed(2)}, xB=${charB.pos.x.toFixed(2)}`);
    }
    
    const dist = charA.pos.distanceTo(charB.pos);
    const minDist = charA.radius + charB.radius;
    const penetration = minDist - dist;
    
    // Penetration should be small, e.g., less than 5 pixels
    expect(penetration).toBeLessThan(5);
  });
});
