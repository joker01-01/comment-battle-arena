import { BattleEngine } from './core/BattleEngine';
import { Renderer } from './core/Renderer';
import { CharacterEntity } from './entities/CharacterEntity';
import { getCharacterConfig, getAllCharacterConfigs } from './data/characters';
import { episodes } from './data/episodes';
import type { EpisodeConfig } from './core/types';
import { Vector2 } from './core/vector';

import { PixelSpritePreviewer } from './ui/PixelSpritePreviewer';

export class App {
  private engine: BattleEngine | null = null;
  private renderer: Renderer;
  private canvas: HTMLCanvasElement;
  private previewer: PixelSpritePreviewer;
  
  private currentEpisodeIndex: number = 0;
  private isCustomMatch: boolean = false;
  private customEpisodeConfig: EpisodeConfig | null = null;
  private isPaused: boolean = false;
  private lastTime: number = 0;
  private reqId: number = 0;

  // UI Elements
  private titleEl: HTMLElement;
  private seedEl: HTMLElement;
  private logEl: HTMLElement;
  private resultOverlay: HTMLElement;
  
  private debugEl: HTMLElement;
  private showDebug: boolean = false;
  private frameCount: number = 0;
  private lastFpsTime: number = 0;
  private currentFps: number = 0;
  
  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.renderer = new Renderer(this.canvas);
    
    this.titleEl = document.getElementById('epTitle')!;
    this.seedEl = document.getElementById('epSeed')!;
    this.logEl = document.getElementById('battleLog')!;
    this.resultOverlay = document.getElementById('resultOverlay')!;
    this.debugEl = document.getElementById('debugPanel')!;

    this.previewer = new PixelSpritePreviewer();

    this.setupCanvas();
    this.setupCustomMatchUI();
    this.bindEvents();
    this.startMatchFromSetupUI();
  }

  private setupCustomMatchUI() {
    const leftSelect = document.getElementById('setupLeftChar') as HTMLSelectElement;
    const rightSelect = document.getElementById('setupRightChar') as HTMLSelectElement;
    
    // Save current selection if any
    const currentLeft = leftSelect.value;
    const currentRight = rightSelect.value;
    
    const chars = getAllCharacterConfigs();
    let optionsHtml = '';
    for (const c of chars) {
      const isTemp = c.id.startsWith('char_') && !c.id.match(/shield_cat|rush_dog|fire_wizard|heal_bot|split_slime|mirror_knight/);
      const prefix = isTemp ? '[Temp] ' : '';
      optionsHtml += `<option value="${c.id}">${prefix}${c.name}</option>`;
    }
    
    leftSelect.innerHTML = optionsHtml;
    rightSelect.innerHTML = optionsHtml;

    // Restore selection or set defaults
    if (currentLeft && Array.from(leftSelect.options).some(o => o.value === currentLeft)) {
      leftSelect.value = currentLeft;
    } else if (chars.length >= 2) {
      leftSelect.value = chars[0].id;
    }
    
    if (currentRight && Array.from(rightSelect.options).some(o => o.value === currentRight)) {
      rightSelect.value = currentRight;
    } else if (chars.length >= 2) {
      rightSelect.value = chars[1].id;
    }

    const titleInput = document.getElementById('setupTitle') as HTMLInputElement;
    const updateTitle = () => {
      const leftName = leftSelect.options[leftSelect.selectedIndex]?.text || 'Left';
      const rightName = rightSelect.options[rightSelect.selectedIndex]?.text || 'Right';
      titleInput.value = `${leftName} vs ${rightName}`;
    };

    leftSelect.addEventListener('change', updateTitle);
    rightSelect.addEventListener('change', updateTitle);
    updateTitle();
  }

  private setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = 800; // Match the CSS width
    const cssHeight = 450; // Match the CSS height
    
    this.canvas.width = Math.floor(cssWidth * dpr);
    this.canvas.height = Math.floor(cssHeight * dpr);
    this.canvas.style.width = `${cssWidth}px`;
    this.canvas.style.height = `${cssHeight}px`;
    
    const ctx = this.canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }

  private bindEvents() {
    document.getElementById('btnStart')!.addEventListener('click', () => this.togglePause());
    document.getElementById('btnRestart')!.addEventListener('click', () => this.restart());
    document.getElementById('btnPrev')!.addEventListener('click', () => this.loadEpisode(this.currentEpisodeIndex - 1));
    document.getElementById('btnNext')!.addEventListener('click', () => this.loadEpisode(this.currentEpisodeIndex + 1));
    document.getElementById('btnCopyResult')!.addEventListener('click', () => this.copyResult());
    document.getElementById('btnExportJson')!.addEventListener('click', () => this.exportJson());
    document.getElementById('btnToggleDebug')!.addEventListener('click', () => this.toggleDebug());
    document.getElementById('btnOpenPreviewer')!.addEventListener('click', () => this.previewer.open());

    document.getElementById('btnSwapChars')!.addEventListener('click', () => {
      const leftSelect = document.getElementById('setupLeftChar') as HTMLSelectElement;
      const rightSelect = document.getElementById('setupRightChar') as HTMLSelectElement;
      const temp = leftSelect.value;
      leftSelect.value = rightSelect.value;
      rightSelect.value = temp;
      
      // trigger change to update title
      leftSelect.dispatchEvent(new Event('change'));
    });

    document.getElementById('btnStartCustomMatch')!.addEventListener('click', () => this.startMatchFromSetupUI());

    document.getElementById('btnCopyDraft')!.addEventListener('click', () => {
      const leftId = (document.getElementById('setupLeftChar') as HTMLSelectElement).value;
      const rightId = (document.getElementById('setupRightChar') as HTMLSelectElement).value;
      const seedInput = (document.getElementById('setupSeed') as HTMLInputElement).value;
      const titleInput = (document.getElementById('setupTitle') as HTMLInputElement).value;

      let seed = parseInt(seedInput);
      if (isNaN(seed)) seed = Math.floor(Math.random() * 1000000);

      const draft = `{
  episodeId: "EP_CUSTOM",
  title: "${titleInput || 'Custom Match'}",
  leftCharacterId: "${leftId}",
  rightCharacterId: "${rightId}",
  arenaId: "arena_1",
  seed: ${seed}
}`;
      navigator.clipboard.writeText(draft).then(() => {
        alert('Episode draft copied.');
      });
    });

    window.addEventListener('tempCharacterRegistered', (e: any) => {
      this.setupCustomMatchUI();
      const leftSelect = document.getElementById('setupLeftChar') as HTMLSelectElement;
      leftSelect.value = e.detail.characterId;
      leftSelect.dispatchEvent(new Event('change'));
    });

    window.addEventListener('battleLog', (e: any) => {
      const div = document.createElement('div');
      div.className = 'log-entry';
      div.textContent = e.detail;
      this.logEl.appendChild(div);
      this.logEl.scrollTop = this.logEl.scrollHeight;
    });
  }

  private startMatchFromSetupUI() {
    const leftId = (document.getElementById('setupLeftChar') as HTMLSelectElement).value;
    const rightId = (document.getElementById('setupRightChar') as HTMLSelectElement).value;
    const seedInput = (document.getElementById('setupSeed') as HTMLInputElement).value;
    const titleInput = (document.getElementById('setupTitle') as HTMLInputElement).value;

    let seed = parseInt(seedInput);
    if (isNaN(seed)) {
      seed = Math.floor(Math.random() * 1000000);
      (document.getElementById('setupSeed') as HTMLInputElement).value = seed.toString();
    }

    const customEp: EpisodeConfig = {
      episodeId: 'CUSTOM',
      title: titleInput || 'Custom Match',
      leftCharacterId: leftId,
      rightCharacterId: rightId,
      arenaId: 'arena_1',
      seed: seed
    };

    this.startCustomEpisode(customEp);
  }

  private loadEpisode(index: number) {
    if (index < 0 || index >= episodes.length) return;
    this.currentEpisodeIndex = index;
    this.isCustomMatch = false;
    this.customEpisodeConfig = null;
    document.getElementById('setupModeDisplay')!.textContent = 'Mode: Fixed Episode';
    this.restart();
  }

  private startCustomEpisode(customEp: EpisodeConfig) {
    this.isCustomMatch = true;
    this.customEpisodeConfig = customEp;
    document.getElementById('setupModeDisplay')!.textContent = 'Mode: Custom Match';
    this.restart();
  }

  private restart() {
    cancelAnimationFrame(this.reqId);
    this.logEl.innerHTML = '';
    this.resultOverlay.classList.add('hidden');
    
    let ep: EpisodeConfig;
    if (this.isCustomMatch && this.customEpisodeConfig) {
      ep = this.customEpisodeConfig;
    } else {
      ep = episodes[this.currentEpisodeIndex];
    }

    this.titleEl.textContent = `${ep.episodeId}: ${ep.title}`;
    this.seedEl.textContent = `Seed: ${ep.seed}`;

    this.engine = new BattleEngine(ep);
    this.engine.renderer = this.renderer;
    
    try {
      const leftConfig = getCharacterConfig(ep.leftCharacterId);
      const rightConfig = getCharacterConfig(ep.rightCharacterId);

      const leftChar = new CharacterEntity(leftConfig.id + '_L', new Vector2(150, 450 / 2), leftConfig, 'left');
      const rightChar = new CharacterEntity(rightConfig.id + '_R', new Vector2(800 - 150, 450 / 2), rightConfig, 'right');

      this.updateCharInfo('leftInfo', leftConfig);
      this.updateCharInfo('rightInfo', rightConfig);

      this.engine.init(leftChar, rightChar);
    } catch (e: any) {
      alert(`Error initializing battle: ${e.message}`);
      return;
    }
    
    this.isPaused = false;
    document.getElementById('btnStart')!.textContent = 'Pause';
    
    this.lastTime = performance.now();
    this.reqId = requestAnimationFrame((t) => this.loop(t));
  }

  private updateCharInfo(elementId: string, config: any) {
    const el = document.getElementById(elementId)!;
    el.innerHTML = `
      <h3>${config.name}</h3>
      <p><strong>Type:</strong> ${config.behaviorType}</p>
      <p><strong>HP:</strong> ${config.maxHp} | <strong>ATK:</strong> ${config.attackDamage}</p>
      <p><strong>Skills:</strong> ${config.skills.join(', ') || 'None'}</p>
      <p><strong>Desc:</strong> ${config.description}</p>
      <p><strong>Weakness:</strong> ${config.weakness}</p>
    `;
  }

  private togglePause() {
    this.isPaused = !this.isPaused;
    document.getElementById('btnStart')!.textContent = this.isPaused ? 'Resume' : 'Pause';
    if (!this.isPaused) {
      this.lastTime = performance.now();
      this.reqId = requestAnimationFrame((t) => this.loop(t));
    }
  }

  private toggleDebug() {
    this.showDebug = !this.showDebug;
    this.renderer.setDebugMode(this.showDebug);
    if (this.showDebug) {
      this.debugEl.classList.remove('hidden');
    } else {
      this.debugEl.classList.add('hidden');
    }
  }

  private updateDebugPanel() {
    if (!this.showDebug || !this.engine) return;
    
    let html = `<strong>Debug Stats:</strong> FPS: ${this.currentFps} | Time: ${this.engine.time.toFixed(1)}s | Entities: ${this.engine.entities.length}<br>`;
    html += `Collisions: ${this.engine.stats.totalCollisions} | Max Impact: ${this.engine.stats.maxImpactSpeed.toFixed(1)}<br>`;
    
    for (const char of this.engine.characters) {
      if (!char.isDead) {
        html += `[${char.config.name}] Spd: ${char.velocity.mag().toFixed(1)} | Mass: ${char.mass} | Rad: ${char.radius}<br>`;
      }
    }
    this.debugEl.innerHTML = html;
  }

  private loop(time: number) {
    if (this.isPaused) return;

    this.frameCount++;
    if (time - this.lastFpsTime >= 1000) {
      this.currentFps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsTime = time;
    }

    let dt = (time - this.lastTime) / 1000;
    this.lastTime = time;

    // Cap dt to prevent huge jumps if tab was inactive
    if (dt > 0.1) dt = 0.1;

    if (this.engine) {
      // Slow motion if any char HP < 10%
      // let timeScale = 1.0;
      // const lowHp = this.engine.characters.some(c => !c.isDead && !c.id.startsWith('mini_') && c.hp / c.maxHp < 0.1);
      // if (lowHp) timeScale = 0.3;

      this.engine.update(dt);
      this.renderer.render(this.engine, dt);
      
      this.updateDebugPanel();

      if (this.engine.isFinished) {
        this.showResult();
        return;
      }
    }

    this.reqId = requestAnimationFrame((t) => this.loop(t));
  }

  private showResult() {
    if (!this.engine) return;
    this.resultOverlay.classList.remove('hidden');
    
    const leftChar = this.engine.characters.find(c => c.team === 'left' && !c.id.startsWith('mini_'));
    const rightChar = this.engine.characters.find(c => c.team === 'right' && !c.id.startsWith('mini_'));

    document.getElementById('resWinner')!.textContent = `Winner: ${this.engine.winner}`;
    document.getElementById('resTime')!.textContent = `Duration: ${this.engine.time.toFixed(1)}s`;
    document.getElementById('resHp')!.textContent = `Left HP: ${Math.ceil(leftChar?.hp || 0)} | Right HP: ${Math.ceil(rightChar?.hp || 0)}`;
  }

  private copyResult() {
    if (!this.engine) return;
    const ep = this.engine.config;
    const leftChar = this.engine.characters.find(c => c.team === 'left' && !c.id.startsWith('mini_'));
    const rightChar = this.engine.characters.find(c => c.team === 'right' && !c.id.startsWith('mini_'));

    const text = `Episode: ${ep.episodeId}
Title: ${ep.title}
Seed: ${ep.seed}
Winner: ${this.engine.winner}
Duration: ${this.engine.time.toFixed(1)}s
Left HP: ${Math.ceil(leftChar?.hp || 0)}
Right HP: ${Math.ceil(rightChar?.hp || 0)}
Total Collisions: ${this.engine.stats.totalCollisions}
Max Impact Speed: ${Math.round(this.engine.stats.maxImpactSpeed)}
Left Collision Damage: ${Math.round(this.engine.stats.collisionDamageDealt.left)}
Right Collision Damage: ${Math.round(this.engine.stats.collisionDamageDealt.right)}
Left Skill Damage: ${Math.round(this.engine.stats.skillDamageDealt.left)}
Right Skill Damage: ${Math.round(this.engine.stats.skillDamageDealt.right)}`;

    navigator.clipboard.writeText(text).then(() => {
      alert('Result copied to clipboard!');
    });
  }

  private exportJson() {
    if (!this.engine) return;
    const data = {
      episode: this.engine.config,
      winner: this.engine.winner,
      duration: this.engine.time,
      logs: this.engine.logs
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.engine.config.episodeId}_result.json`;
    a.click();
  }
}
