# 0002: Transform Keyframes for Pixel Animation

## Context
We need to animate pixel-art characters. Hand-drawing full Sprite Sheets (frame-by-frame matrices) for every state of every character is too labor-intensive, especially since we plan to add many characters from user comments. We need a scalable way to make characters feel alive and responsive.

## Decision
We will use a **Transform Keyframe** system.
1. Each character is defined by a single static 16x16 `PixelMatrix`.
2. Animations (idle, move, attack, hit, etc.) are defined as an array of `PixelKeyframe` objects.
3. A keyframe defines procedural transformations: `offsetX`, `offsetY`, `scaleX` (squash), `scaleY` (stretch), `flashColor`, `alpha`, etc.
4. The renderer interpolates between these keyframes based on the animation's progress. We will use "stepped" interpolation (e.g., updating only 8 or 12 times a second) to maintain a choppy, retro pixel-art feel rather than smooth vector-like tweening.

## Consequences
- **Pros**: Extremely fast to add new characters (just draw one 16x16 matrix). Animations can be shared across all characters. Procedural squash/stretch adds a lot of "juice" cheaply.
- **Cons**: Characters cannot have complex, topology-changing animations (like a character turning around 3D-style or pulling a sword out of a scabbard). For our MVP top-down bumper-car style game, this limitation is perfectly acceptable.
