import { PixelCharacterRenderer } from '../rendering/PixelCharacterRenderer';
import { sprites } from '../data/pixelSprites';
import { parsePixelMatrix } from '../utils/matrixParser';
import type { PixelAnimationName } from '../rendering/PixelCharacterRenderer';
import { Vector2 } from '../core/vector';
import { characterTemplates } from '../data/characterTemplates';
import { defaultAnimations } from '../rendering/pixelAnimations';
import { UI_FONT_FAMILY } from '../rendering/textStyles';

export class PixelSpritePreviewer {
  private overlay!: HTMLDivElement;
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private textarea!: HTMLTextAreaElement;
  private errorDiv!: HTMLDivElement;
  private animSelect!: HTMLSelectElement;
  private spriteSelect!: HTMLSelectElement;
  private paletteInputs: HTMLInputElement[] = [];
  
  private renderer: PixelCharacterRenderer;
  private mockCharacter: any;
  private animationFrameId: number = 0;
  private isVisible: boolean = false;

  // State
  private currentMatrix: number[][] = [];
  private currentPalette: Record<number, string> = {};

  constructor() {
    this.renderer = new PixelCharacterRenderer();
    this.renderer.showColliders = false;

    // Create a mock character to pass to the renderer
    this.mockCharacter = {
      pos: new Vector2(0, 0),
      velocity: new Vector2(0, 0),
      radius: 10,
      facing: 1,
      isDead: false,
      stunTimer: 0,
      isDashing: false,
      attackTimer: 0,
      shield: 0,
      config: {
        color: '#ffffff',
        spriteId: 'preview_sprite'
      },
      stateData: {
        lastState: 'idle',
        stateEntryTime: 0,
        isCharging: false,
        isCasting: false
      }
    };

    this.buildUI();
    this.loadSprite('example_custom_character');
  }

  private buildUI() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'previewer-overlay';
    this.overlay.style.display = 'none';

    this.overlay.innerHTML = `
      <div class="previewer-panel">
        <div class="previewer-header">
          <h2>Pixel Sprite Previewer</h2>
          <button class="previewer-close">Close</button>
        </div>
        <div class="previewer-content">
          <div class="previewer-left">
            <div class="previewer-controls">
              <select id="previewer-sprite-select">
                ${Object.keys(sprites).map(id => `<option value="${id}">${id}</option>`).join('')}
              </select>
              <button id="previewer-copy-matrix">Copy Matrix</button>
              <button id="previewer-copy-def">Copy Definition</button>
            </div>
            <textarea id="previewer-matrix-input" spellcheck="false"></textarea>
            <div class="previewer-error" id="previewer-error"></div>
          </div>
          <div class="previewer-middle">
            <div class="generator-section">
              <h3>CharacterConfig Generator</h3>
              <div class="config-form">
                <label>Character ID (snake_case)
                  <input type="text" id="gen-char-id" value="example_custom_character">
                </label>
                <label>Display Name
                  <input type="text" id="gen-char-name" value="Example Custom Character">
                </label>
                <label>Description
                  <input type="text" id="gen-char-desc" value="A community-created character.">
                </label>
                <label>Weakness
                  <input type="text" id="gen-char-weak" value="Not configured yet.">
                </label>
                <label>Battle Style Template
                  <select id="gen-char-style">
                    ${Object.keys(characterTemplates).map(id => `<option value="${id}">${id}</option>`).join('')}
                  </select>
                </label>
                <label>Skill Preset
                  <select id="gen-char-skill">
                    <option value="none">None</option>
                    <option value="dash_attack">Dash Attack</option>
                    <option value="fireball_attack">Fireball</option>
                    <option value="auto_heal_5s">Auto Heal</option>
                    <option value="split_on_damage">Split Summon</option>
                    <option value="reflect_damage">Reflect</option>
                    <option value="shield_8s">Shield</option>
                  </select>
                </label>
                <button id="previewer-copy-char-config" style="margin-top: 10px; background: #4aa3ff;">Copy CharacterConfig Draft</button>
              </div>
            </div>
            <div class="generator-section">
              <h3>Episode Draft Generator</h3>
              <div class="config-form">
                <label>Episode ID
                  <input type="text" id="gen-ep-id" value="EP_CUSTOM_001">
                </label>
                <label>Opponent Character
                  <select id="gen-ep-opponent">
                    ${Object.keys(sprites).map(id => `<option value="char_${id}">char_${id}</option>`).join('')}
                  </select>
                </label>
                <label>Side
                  <select id="gen-ep-side">
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                  </select>
                </label>
                <button id="previewer-copy-ep-config" style="margin-top: 10px; background: #4aa3ff;">Copy Episode Draft</button>
              </div>
            </div>
          </div>
          <div class="previewer-right">
            <div class="previewer-controls">
              <select id="previewer-anim-select">
                <option value="idle">idle</option>
                <option value="move">move</option>
                <option value="attack">attack</option>
                <option value="charge">charge</option>
                <option value="dash">dash</option>
                <option value="hit">hit</option>
                <option value="skill">skill</option>
                <option value="death">death</option>
              </select>
              <button id="previewer-export-sheet" style="background: #4aa3ff; margin-left: 10px;">Export Animation Sheet</button>
            </div>
            <div class="previewer-canvas-container">
              <canvas></canvas>
            </div>
            <div class="palette-editor" id="previewer-palette">
              ${[1, 2, 3, 4, 5, 6, 7].map(i => `
                <div class="palette-item">
                  <span>${i}:</span>
                  <input type="color" data-index="${i}" value="#ffffff">
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);

    this.canvas = this.overlay.querySelector('canvas')!;
    
    // Setup High-DPI Canvas
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = 200;
    const cssHeight = 200;
    this.canvas.width = Math.floor(cssWidth * dpr);
    this.canvas.height = Math.floor(cssHeight * dpr);
    this.canvas.style.width = `${cssWidth}px`;
    this.canvas.style.height = `${cssHeight}px`;
    
    this.ctx = this.canvas.getContext('2d')!;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = false;

    this.textarea = this.overlay.querySelector('#previewer-matrix-input')!;
    this.errorDiv = this.overlay.querySelector('#previewer-error')!;
    this.animSelect = this.overlay.querySelector('#previewer-anim-select')!;
    this.spriteSelect = this.overlay.querySelector('#previewer-sprite-select')!;
    
    const paletteContainer = this.overlay.querySelector('#previewer-palette')!;
    this.paletteInputs = Array.from(paletteContainer.querySelectorAll('input[type="color"]'));

    this.bindEvents();
  }

  private bindEvents() {
    this.overlay.querySelector('.previewer-close')!.addEventListener('click', () => this.close());
    
    this.textarea.addEventListener('input', () => {
      try {
        this.currentMatrix = parsePixelMatrix(this.textarea.value);
        this.errorDiv.textContent = '';
        this.updateMockSprite();
      } catch (e: any) {
        this.errorDiv.textContent = e.message;
      }
    });

    this.paletteInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        const index = parseInt((e.target as HTMLInputElement).dataset.index!);
        this.currentPalette[index] = (e.target as HTMLInputElement).value;
        this.updateMockSprite();
      });
    });

    this.spriteSelect.addEventListener('change', () => {
      this.loadSprite(this.spriteSelect.value);
    });

    this.animSelect.addEventListener('change', () => {
      this.setAnimationState(this.animSelect.value as PixelAnimationName);
    });

    this.overlay.querySelector('#previewer-copy-matrix')!.addEventListener('click', () => {
      navigator.clipboard.writeText(this.getMatrixString());
      this.errorDiv.textContent = 'Matrix copied to clipboard!';
      setTimeout(() => this.errorDiv.textContent = '', 2000);
    });

    this.overlay.querySelector('#previewer-copy-def')!.addEventListener('click', () => {
      navigator.clipboard.writeText(this.getDefinitionString());
      this.errorDiv.textContent = 'Definition copied to clipboard!';
      setTimeout(() => this.errorDiv.textContent = '', 2000);
    });

    this.overlay.querySelector('#previewer-copy-char-config')!.addEventListener('click', () => {
      navigator.clipboard.writeText(this.getCharacterConfigString());
      this.errorDiv.textContent = 'CharacterConfig copied to clipboard!';
      setTimeout(() => this.errorDiv.textContent = '', 2000);
    });

    this.overlay.querySelector('#previewer-copy-ep-config')!.addEventListener('click', () => {
      navigator.clipboard.writeText(this.getEpisodeConfigString());
      this.errorDiv.textContent = 'Episode Draft copied to clipboard!';
      setTimeout(() => this.errorDiv.textContent = '', 2000);
    });

    this.overlay.querySelector('#previewer-export-sheet')!.addEventListener('click', () => {
      this.exportAnimationSheet();
    });
  }

  private setAnimationState(state: PixelAnimationName) {
    this.mockCharacter.isDead = state === 'death';
    this.mockCharacter.stunTimer = state === 'hit' ? 1 : 0;
    this.mockCharacter.isDashing = state === 'dash';
    this.mockCharacter.stateData.isCharging = state === 'charge';
    this.mockCharacter.stateData.isCasting = state === 'skill';
    this.mockCharacter.attackTimer = state === 'attack' ? 999 : 0; // force attack state
    this.mockCharacter.velocity.x = state === 'move' ? 200 : 0; // force move state
    
    // Reset entry time to restart animation
    this.mockCharacter.stateData.stateEntryTime = performance.now() / 1000;
    this.mockCharacter.stateData.lastState = state;
  }

  private loadSprite(id: string) {
    const sprite = sprites[id];
    if (!sprite) return;

    this.currentMatrix = JSON.parse(JSON.stringify(sprite.matrix));
    this.currentPalette = { ...sprite.palette };
    
    this.textarea.value = this.getMatrixString();
    
    this.paletteInputs.forEach(input => {
      const index = parseInt(input.dataset.index!);
      input.value = this.currentPalette[index] || '#000000';
    });

    this.updateMockSprite();
  }

  private updateMockSprite() {
    // Inject our preview sprite into the global sprites registry temporarily
    sprites['preview_sprite'] = {
      id: 'preview_sprite',
      width: 16,
      height: 16,
      scale: 4, // Will be scaled up more by canvas transform
      matrix: this.currentMatrix,
      palette: this.currentPalette,
      animations: sprites['shield_cat'].animations // borrow default animations
    };
  }

  private getMatrixString(): string {
    let str = '[\n';
    for (let i = 0; i < 16; i++) {
      str += '  [' + this.currentMatrix[i].join(',') + '],\n';
    }
    str += ']';
    return str;
  }

  private getDefinitionString(): string {
    let paletteStr = '{\n    0: "transparent",\n';
    for (let i = 1; i <= 7; i++) {
      paletteStr += `    ${i}: "${this.currentPalette[i] || '#000000'}",\n`;
    }
    paletteStr += '  }';

    return `export const newSprite: PixelSpriteDefinition = {
  id: 'new_sprite',
  width: 16,
  height: 16,
  scale: 4,
  matrix: ${this.getMatrixString().replace(/\n/g, '\n  ')},
  palette: ${paletteStr},
  animations: defaultAnimations
};`;
  }

  private getCharacterConfigString(): string {
    const id = (this.overlay.querySelector('#gen-char-id') as HTMLInputElement).value || 'custom_char';
    const name = (this.overlay.querySelector('#gen-char-name') as HTMLInputElement).value || 'Custom Character';
    const desc = (this.overlay.querySelector('#gen-char-desc') as HTMLInputElement).value || '';
    const weak = (this.overlay.querySelector('#gen-char-weak') as HTMLInputElement).value || '';
    const styleId = (this.overlay.querySelector('#gen-char-style') as HTMLSelectElement).value;
    const skillId = (this.overlay.querySelector('#gen-char-skill') as HTMLSelectElement).value;

    const template = characterTemplates[styleId];
    const skills = skillId === 'none' ? [] : [skillId];

    // Convert snake_case to camelCase for the variable name
    const varName = id.replace(/_([a-z])/g, (g) => g[1].toUpperCase());

    return `export const ${varName}Config: CharacterConfig = {
  id: "char_${id}",
  name: "${name}",
  spriteId: "${id}",
  maxHp: ${template.maxHp},
  behaviorType: "${template.behaviorType}",
  attackDamage: ${template.attackDamage},
  attackRange: ${template.attackRange},
  attackCooldown: ${template.attackCooldown},
  physics: {
    radius: ${template.physics.radius},
    mass: ${template.physics.mass},
    restitution: ${template.physics.restitution},
    friction: ${template.physics.friction},
    baseSpeed: ${template.physics.baseSpeed},
    collisionDamage: ${template.physics.collisionDamage},
    knockbackResistance: ${template.physics.knockbackResistance}
  },
  skills: ${JSON.stringify(skills)},
  description: "${desc}",
  weakness: "${weak}"
};`;
  }

  private getEpisodeConfigString(): string {
    const charId = (this.overlay.querySelector('#gen-char-id') as HTMLInputElement).value || 'custom_char';
    const epId = (this.overlay.querySelector('#gen-ep-id') as HTMLInputElement).value || 'EP_CUSTOM_001';
    const opponent = (this.overlay.querySelector('#gen-ep-opponent') as HTMLSelectElement).value;
    const side = (this.overlay.querySelector('#gen-ep-side') as HTMLSelectElement).value;

    const leftId = side === 'left' ? `char_${charId}` : opponent;
    const rightId = side === 'right' ? `char_${charId}` : opponent;

    return `{
  episodeId: "${epId}",
  title: "Custom Match: ${leftId} vs ${rightId}",
  leftCharacterId: "${leftId}",
  rightCharacterId: "${rightId}",
  arenaId: "arena_01",
  seed: Math.floor(Math.random() * 1000000)
}`;
  }

  private exportAnimationSheet() {
    const spriteId = this.spriteSelect.value;
    const animationName = this.animSelect.value as PixelAnimationName;
    
    const anim = defaultAnimations[animationName];
    if (!anim) return;

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

    this.updateMockSprite();

    for (let i = 0; i < frameCount; i++) {
      const time = (i / frameCount) * duration;
      
      const x = spacing + i * (frameSize + spacing) + frameSize / 2;
      const y = headerHeight + frameSize / 2;

      ctx.save();
      ctx.translate(x, y);
      
      // Clone mock character to override stateEntryTime without affecting preview
      const exportChar = {
        ...this.mockCharacter,
        stateData: {
          ...this.mockCharacter.stateData,
          stateEntryTime: 0
        }
      };
      
      this.renderer.drawCharacter(ctx, exportChar as any, time);
      ctx.restore();
    }

    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${spriteId}_${animationName}_sheet.png`;
    a.click();
  }

  public open() {
    this.isVisible = true;
    this.overlay.style.display = 'flex';
    this.mockCharacter.stateData.stateEntryTime = performance.now() / 1000;
    this.loop();
  }

  public close() {
    this.isVisible = false;
    this.overlay.style.display = 'none';
    cancelAnimationFrame(this.animationFrameId);
  }

  private loop = () => {
    if (!this.isVisible) return;

    const time = performance.now() / 1000;

    const dpr = window.devicePixelRatio || 1;
    const cssWidth = 200;
    const cssHeight = 200;

    // Reset transform before clearing
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.fillStyle = '#111';
    this.ctx.fillRect(0, 0, cssWidth, cssHeight);

    // Center and scale up
    this.ctx.save();
    this.ctx.translate(cssWidth / 2, cssHeight / 2);
    this.ctx.scale(2, 2); // Double the normal scale for preview
    this.ctx.imageSmoothingEnabled = false;

    // Draw
    this.renderer.drawCharacter(this.ctx, this.mockCharacter as any, time);

    this.ctx.restore();

    this.animationFrameId = requestAnimationFrame(this.loop);
  }
}
