import type { PixelAnimationName, PixelAnimation } from './PixelCharacterRenderer';

export const defaultAnimations: Record<PixelAnimationName, PixelAnimation> = {
  idle: {
    name: 'idle', duration: 1.0, loop: true, fps: 4,
    keyframes: [
      { time: 0.0, offsetY: 0 },
      { time: 0.5, offsetY: 1 },
      { time: 1.0, offsetY: 0 }
    ]
  },
  move: {
    name: 'move', duration: 0.5, loop: true, fps: 8,
    keyframes: [
      { time: 0.0, offsetX: 0, offsetY: 0, scaleX: 1.0, scaleY: 1.0 },
      { time: 0.25, offsetX: 0, offsetY: -1, scaleX: 0.95, scaleY: 1.05 },
      { time: 0.5, offsetX: 0, offsetY: 0, scaleX: 1.0, scaleY: 1.0 },
      { time: 0.75, offsetX: 0, offsetY: -1, scaleX: 0.95, scaleY: 1.05 },
      { time: 1.0, offsetX: 0, offsetY: 0, scaleX: 1.0, scaleY: 1.0 }
    ]
  },
  attack: {
    name: 'attack', duration: 0.3, loop: false, fps: 10,
    keyframes: [
      { time: 0.0, offsetX: 0, scaleX: 1.0 },
      { time: 0.1, offsetX: 4, scaleX: 1.1 },
      { time: 0.3, offsetX: 0, scaleX: 1.0 }
    ]
  },
  charge: {
    name: 'charge', duration: 0.5, loop: true, fps: 12,
    keyframes: [
      { time: 0.0, offsetX: 0, scaleX: 1.0, scaleY: 1.0 },
      { time: 0.5, offsetX: -2, scaleX: 0.8, scaleY: 1.2 },
      { time: 1.0, offsetX: 0, scaleX: 1.0, scaleY: 1.0 }
    ]
  },
  dash: {
    name: 'dash', duration: 0.5, loop: true, fps: 12,
    keyframes: [
      { time: 0.0, offsetX: 0, scaleX: 1.3, scaleY: 0.7 },
      { time: 0.5, offsetX: 2, scaleX: 1.2, scaleY: 0.8 },
      { time: 1.0, offsetX: 0, scaleX: 1.0, scaleY: 1.0 }
    ]
  },
  hit: {
    name: 'hit', duration: 0.4, loop: false, fps: 12,
    keyframes: [
      { time: 0.0, offsetX: -2, flashColor: '#ffffff' },
      { time: 0.2, offsetX: 2, flashColor: '#ffffff' },
      { time: 0.4, offsetX: 0 }
    ]
  },
  skill: {
    name: 'skill', duration: 0.5, loop: false, fps: 8,
    keyframes: [
      { time: 0.0, offsetY: 0, scaleX: 1.0, scaleY: 1.0 },
      { time: 0.25, offsetY: -4, scaleX: 0.9, scaleY: 1.1 },
      { time: 0.5, offsetY: 0, scaleX: 1.0, scaleY: 1.0 }
    ]
  },
  death: {
    name: 'death', duration: 1.0, loop: false, fps: 8,
    keyframes: [
      { time: 0.0, scaleX: 1.0, scaleY: 1.0, alpha: 1.0 },
      { time: 0.5, scaleX: 1.2, scaleY: 0.5, alpha: 0.5 },
      { time: 1.0, scaleX: 0.0, scaleY: 0.0, alpha: 0.0 }
    ]
  }
};
