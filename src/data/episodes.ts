import type { EpisodeConfig } from '../core/types';

export const episodes: EpisodeConfig[] = [
  {
    episodeId: 'EP001',
    title: 'Shield Cat vs Fire Wizard',
    leftCharacterId: 'char_shield_cat',
    rightCharacterId: 'char_fire_wizard',
    arenaId: 'arena_1',
    seed: 20260520
  },
  {
    episodeId: 'EP002',
    title: 'Rush Dog vs Mirror Knight',
    leftCharacterId: 'char_rush_dog',
    rightCharacterId: 'char_mirror_knight',
    arenaId: 'arena_1',
    seed: 12345678
  },
  {
    episodeId: 'EP003',
    title: 'Heal Bot vs Split Slime',
    leftCharacterId: 'char_heal_bot',
    rightCharacterId: 'char_split_slime',
    arenaId: 'arena_1',
    seed: 87654321
  }
];
