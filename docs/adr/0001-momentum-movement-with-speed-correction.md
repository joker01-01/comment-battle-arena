# 0001: Momentum-Based Movement with Constant Speed Correction

## Context
The game requires characters to constantly move around the arena, bouncing off walls and each other, rather than stopping or being directly steered by AI. If we use pure physics with friction and restitution < 1, characters will eventually stop. If we use perfectly elastic physics (restitution = 1, friction = 0), floating-point errors can cause speeds to spiral out of control.

## Decision
We will use **Constant Speed Correction**. 
1. AI will no longer apply acceleration to steer characters.
2. Characters will be given an initial random velocity.
3. We will introduce a `baseSpeed` property for each character.
4. Every frame, if a character's current speed deviates from `baseSpeed`, we will smoothly interpolate (lerp) their speed back to `baseSpeed`.

## Consequences
- **Pros**: Characters will never stop moving. High-speed impacts (like Dashes) will still feel impactful because the speed spike will decay smoothly back to normal, rather than instantly snapping. It prevents the chaotic infinite-acceleration issues of perfectly elastic physics.
- **Cons**: It slightly breaks pure Newtonian physics, as energy is artificially injected or removed to maintain the base speed, but this is acceptable and desirable for gameplay feel.
