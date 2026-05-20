import { PixelCharacterRenderer } from '../rendering/PixelCharacterRenderer';
import { sprites } from '../data/pixelSprites';
import { defaultAnimations } from '../rendering/pixelAnimations';
import { UI_FONT_FAMILY } from '../rendering/textStyles';
import { Vector2 } from '../core/vector';
import type { PixelAnimationName } from '../rendering/PixelCharacterRenderer';

export function generateAnimationSheetDataUrl(spriteId: string, animationName: PixelAnimationName): string {
  const sprite = sprites[spriteId];
  if (!sprite) throw new Error(`Sprite ${spriteId} not found`);

  const anim = defaultAnimations[animationName];
  if (!anim) throw new Error(`Animation ${animationName} not found`);

  const duration = anim.duration || 1;
  const fps = anim.fps || 8;
  
  let frameCount = Math.ceil(duration * fps);
  if (frameCount < 4) frameCount = 4;
  if (frameCount > 10) frameCount = 10;

  const frameSize = 96;
  const spacing = 12;
  const headerHeight = 40;
  
  const width = frameCount * frameSize + (frameCount - 1) * spacing + spacing * 2;
  const height = frameSize + headerHeight + spacing;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  // Background
  ctx.fillStyle = '#0f0f0f';
  ctx.fillRect(0, 0, width, height);

  // Header text
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 20px ${UI_FONT_FAMILY}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`${spriteId} / ${animationName}`, spacing, spacing);

  const renderer = new PixelCharacterRenderer();
  renderer.showColliders = false;

  // Force velocity for move animation to ensure facing is right and move animation triggers
  const velocity = animationName === 'move' ? new Vector2(200, 0) : new Vector2(0, 0);

  const mockChar = {
    pos: new Vector2(0, 0),
    velocity: velocity,
    radius: 10,
    facing: 1,
    isDead: animationName === 'death',
    stunTimer: animationName === 'hit' ? 1 : 0,
    isDashing: animationName === 'dash',
    attackTimer: animationName === 'attack' ? 999 : 0,
    shield: 0,
    config: {
      color: '#ffffff',
      spriteId: spriteId
    },
    stateData: {
      lastState: animationName,
      stateEntryTime: 0,
      isCharging: animationName === 'charge',
      isCasting: animationName === 'skill'
    }
  };

  for (let i = 0; i < frameCount; i++) {
    const time = (i / frameCount) * duration;
    
    const x = spacing + i * (frameSize + spacing) + frameSize / 2;
    const y = headerHeight + frameSize / 2;

    ctx.save();
    ctx.translate(x, y);
    renderer.drawCharacter(ctx, mockChar as any, time);
    ctx.restore();
  }

  return canvas.toDataURL('image/png');
}
