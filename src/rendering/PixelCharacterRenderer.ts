import type { CharacterEntity } from '../entities/CharacterEntity';
import { sprites } from '../data/pixelSprites';
import { getRuntimeSprite } from '../data/runtimeCharacters';

export type PixelMatrix = number[][];

export type PixelPalette = {
  0: "transparent";
  1: string; // outline
  2: string; // shadow
  3: string; // main
  4: string; // light
  5: string; // accent
  6: string; // weapon
  7: string; // effect
};

export type PixelAnimationName =
  | "idle"
  | "move"
  | "attack"
  | "charge"
  | "dash"
  | "hit"
  | "skill"
  | "death";

export type PixelKeyframe = {
  time: number; // 0.0 to 1.0
  offsetX?: number;
  offsetY?: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  alpha?: number;
  flashColor?: string;
};

export type PixelAnimation = {
  name: PixelAnimationName;
  duration: number; // in seconds
  loop: boolean;
  fps: number;
  keyframes: PixelKeyframe[];
};

export type PixelSpriteDefinition = {
  id: string;
  width: number;
  height: number;
  scale: number;
  matrix: number[][];
  palette: Record<number, string>;
  animations: Record<PixelAnimationName, PixelAnimation>;
};

export class PixelCharacterRenderer {
  public showColliders: boolean = false;

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private lerpNumber(a: number | undefined, b: number | undefined, t: number, fallback: number): number {
    return this.lerp(a ?? fallback, b ?? fallback, t);
  }

  private interpolateKeyframes(keyframes: PixelKeyframe[], t: number): PixelKeyframe {
    if (keyframes.length === 0) return { time: 0 };
    if (keyframes.length === 1) return keyframes[0];

    const sorted = [...keyframes].sort((a, b) => a.time - b.time);

    let prev = sorted[0];
    let next = sorted[sorted.length - 1];

    for (let i = 0; i < sorted.length - 1; i++) {
      if (t >= sorted[i].time && t <= sorted[i + 1].time) {
        prev = sorted[i];
        next = sorted[i + 1];
        break;
      }
    }

    const span = next.time - prev.time;
    const localT = span === 0 ? 0 : (t - prev.time) / span;

    return {
      time: t,
      offsetX: this.lerpNumber(prev.offsetX, next.offsetX, localT, 0),
      offsetY: this.lerpNumber(prev.offsetY, next.offsetY, localT, 0),
      scaleX: this.lerpNumber(prev.scaleX, next.scaleX, localT, 1),
      scaleY: this.lerpNumber(prev.scaleY, next.scaleY, localT, 1),
      rotation: this.lerpNumber(prev.rotation, next.rotation, localT, 0),
      alpha: this.lerpNumber(prev.alpha, next.alpha, localT, 1),
      flashColor: prev.flashColor ?? next.flashColor
    };
  }

  private sampleAnimation(animation: PixelAnimation, elapsed: number): PixelKeyframe {
    const duration = animation.duration;
    const fps = animation.fps || 8;

    const localElapsed = animation.loop
      ? elapsed % duration
      : Math.min(elapsed, duration);

    const frameDuration = 1 / fps;
    const steppedElapsed = Math.floor(localElapsed / frameDuration) * frameDuration;
    const normalizedTime = Math.min(steppedElapsed / duration, 1);

    return this.interpolateKeyframes(animation.keyframes, normalizedTime);
  }

  private determineAnimationState(character: CharacterEntity): PixelAnimationName {
    if (character.isDead) return 'death';
    if (character.stunTimer > 0) return 'hit';
    if (character.isDashing) return 'dash';
    if (character.stateData.isCharging) return 'charge';
    if (character.stateData.isCasting) return 'skill';
    if (character.attackTimer > character.config.attackCooldown - 0.3) return 'attack';
    if (character.velocity.magSq() > 100) return 'move';
    return 'idle';
  }

  drawCharacter(ctx: CanvasRenderingContext2D, character: CharacterEntity, engineTime: number) {
    const spriteId = character.config.spriteId || 'shield_cat';
    const sprite = getRuntimeSprite(spriteId) || sprites[spriteId] || sprites.shield_cat;
    const state = this.determineAnimationState(character);
    const animation = sprite.animations[state] || sprite.animations.idle;
    
    // We need a way to track when an animation started for non-looping animations.
    // For MVP, we'll just use engineTime directly which might cause non-looping animations
    // to start midway, but it's acceptable for now. Ideally, CharacterEntity should track state entry times.
    const stateEntryTime = character.stateData.lastState === state ? (character.stateData.stateEntryTime || engineTime) : engineTime;
    character.stateData.lastState = state;
    character.stateData.stateEntryTime = stateEntryTime;
    
    const elapsed = engineTime - stateEntryTime;
    const keyframe = this.sampleAnimation(animation, elapsed);

    // Use the sprite's own palette, don't override with config.color anymore since we have custom palettes
    const palette = { ...sprite.palette };
    if (keyframe.flashColor) {
      palette[3] = keyframe.flashColor;
      palette[4] = keyframe.flashColor;
      palette[5] = keyframe.flashColor;
    }

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    const scale = sprite.scale;
    const w = sprite.width * scale;
    const h = sprite.height * scale;

    // Apply pixel-snapped offsets
    let x = character.pos.x - w / 2 + Math.round(keyframe.offsetX || 0) * scale;
    let y = character.pos.y - h / 2 + Math.round(keyframe.offsetY || 0) * scale;

    // Apply facing and squash/stretch
    const scaleX = (keyframe.scaleX || 1) * character.facing;
    const scaleY = keyframe.scaleY || 1;

    // Dash trail effect (pixel afterimage)
    if (character.isDashing) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      // Draw the same matrix slightly behind the current position
      const trailX = x - character.velocity.x * 0.05;
      const trailY = y - character.velocity.y * 0.05;
      ctx.translate(trailX + w / 2, trailY + h / 2);
      ctx.scale(scaleX, scaleY); // apply facing
      this.drawMatrix(ctx, sprite.matrix, -w / 2, -h / 2, scale, palette);
      ctx.restore();
    }

    // Draw Shield
    if (character.shield > 0) {
      ctx.strokeStyle = '#44aaff';
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.arc(character.pos.x, character.pos.y, character.radius + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.translate(x + w / 2, y + h / 2);
    
    if (keyframe.rotation) {
      ctx.rotate(keyframe.rotation);
    }
    
    ctx.scale(scaleX, scaleY);
    ctx.scale(scaleX, scaleY);
    
    if (keyframe.alpha !== undefined) {
      ctx.globalAlpha = keyframe.alpha;
    }

    this.drawMatrix(ctx, sprite.matrix, -w / 2, -h / 2, scale, palette);

    ctx.restore();

    if (this.showColliders) {
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(character.pos.x, character.pos.y, character.radius, 0, Math.PI * 2);
      ctx.stroke();
      
      // Draw velocity vector
      ctx.strokeStyle = '#ff0000';
      ctx.beginPath();
      ctx.moveTo(character.pos.x, character.pos.y);
      ctx.lineTo(character.pos.x + character.velocity.x * 0.5, character.pos.y + character.velocity.y * 0.5);
      ctx.stroke();
    }
  }

  private drawMatrix(ctx: CanvasRenderingContext2D, matrix: PixelMatrix, x: number, y: number, scale: number, palette: Record<number, string>) {
    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix[row].length; col++) {
        const colorIndex = matrix[row][col];
        if (colorIndex !== 0) {
          ctx.fillStyle = palette[colorIndex];
          ctx.fillRect(x + col * scale, y + row * scale, scale, scale);
        }
      }
    }
  }
}