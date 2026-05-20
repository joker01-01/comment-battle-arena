import { PixelCharacterRenderer } from '../rendering/PixelCharacterRenderer';
import { sprites } from '../data/pixelSprites';
import { parsePixelMatrix } from '../utils/matrixParser';
import type { PixelAnimationName } from '../rendering/PixelCharacterRenderer';
import { Vector2 } from '../core/vector';
import { characterTemplates } from '../data/characterTemplates';
import { generateAnimationSheetDataUrl } from '../utils/animationSheetExporter';
import { processImageToMatrix } from '../utils/imageToMatrix';

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
            
            <div class="import-section">
              <h4>Import Image to Matrix v2</h4>
              <div class="import-controls">
                <input type="file" id="previewer-import-file" accept="image/png, image/jpeg, image/webp">
                
                <div class="import-preview-area" style="display: none;">
                  <div style="position: relative; display: inline-block;">
                    <canvas id="import-preview-canvas" style="max-width: 200px; max-height: 200px; border: 1px solid #444;"></canvas>
                    <div id="import-crop-box" style="position: absolute; border: 2px dashed #4aa3ff; pointer-events: none; box-sizing: border-box;"></div>
                  </div>
                  
                  <div class="crop-controls">
                    <label>Crop X: <input type="number" id="import-crop-x" value="0" style="width: 50px;"></label>
                    <label>Crop Y: <input type="number" id="import-crop-y" value="0" style="width: 50px;"></label>
                    <label>Size: <input type="number" id="import-crop-size" value="100" style="width: 50px;"></label>
                    <button id="import-center-crop">Center Crop</button>
                  </div>

                  <div class="bg-removal-controls" style="margin-top: 5px;">
                    <label><input type="checkbox" id="import-remove-bg" checked> Remove Background</label>
                    <label>Tolerance: <input type="number" id="import-bg-tol" value="50" min="0" max="255" style="width: 50px;"></label>
                    <div style="width: 100%; display: flex; align-items: center; gap: 10px; margin-top: 5px;">
                      <span style="font-size: 12px; color: #aaa;">Colors to remove (click image to pick):</span>
                      <div id="import-bg-color-badges" style="display: flex; gap: 5px; flex-wrap: wrap;"></div>
                      <button id="import-clear-bg-colors" style="font-size: 11px; padding: 2px 5px;">Clear</button>
                    </div>
                    <label style="width: 100%; margin-top: 5px;"><input type="checkbox" id="import-near-white" checked> Treat Near-White (RGB > 240) as Transparent</label>
                    <label style="width: 100%;">Alpha Thresh: <input type="number" id="import-alpha-thresh" value="128" min="0" max="255" style="width: 50px;"></label>
                  </div>

                  <div class="palette-controls" style="margin-top: 5px;">
                    <label>Colors: <input type="number" id="import-color-count" value="7" min="2" max="7" style="width: 40px;"></label>
                    <label><input type="checkbox" id="import-smooth"> Smooth</label>
                    <label title="TODO: Not implemented yet"><input type="checkbox" id="import-dither" disabled> Dither</label>
                  </div>

                  <div class="import-actions" style="margin-top: 10px;">
                    <button id="import-preview-btn">Preview Result</button>
                    <button id="import-apply-btn" style="background: #4aa3ff;">Apply to Matrix</button>
                  </div>
                  
                  <p style="font-size: 11px; color: #aaa; margin-top: 5px;">
                    Tip: Image import is for draft generation only. Crop tightly, remove background, then manually clean the 16x16 matrix.
                  </p>
                </div>
              </div>
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
              <canvas id="previewer-main-canvas"></canvas>
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

    this.canvas = this.overlay.querySelector('#previewer-main-canvas')!;
    
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

    let currentImportImage: HTMLImageElement | null = null;
    let importResultDraft: any = null;

    const fileInput = this.overlay.querySelector('#previewer-import-file') as HTMLInputElement;
    const previewArea = this.overlay.querySelector('.import-preview-area') as HTMLDivElement;
    const previewCanvas = this.overlay.querySelector('#import-preview-canvas') as HTMLCanvasElement;
    const cropBox = this.overlay.querySelector('#import-crop-box') as HTMLDivElement;
    
    const cropXInput = this.overlay.querySelector('#import-crop-x') as HTMLInputElement;
    const cropYInput = this.overlay.querySelector('#import-crop-y') as HTMLInputElement;
    const cropSizeInput = this.overlay.querySelector('#import-crop-size') as HTMLInputElement;
    
    let selectedBgColors: string[] = [];

    const renderBgColorBadges = () => {
      const container = this.overlay.querySelector('#import-bg-color-badges') as HTMLDivElement;
      container.innerHTML = selectedBgColors.map(hex => 
        `<div class="bg-color-badge" style="background-color: ${hex}; width: 16px; height: 16px; border: 1px solid #888; border-radius: 2px; cursor: pointer;" title="Click to remove" data-color="${hex}"></div>`
      ).join('');
      
      container.querySelectorAll('.bg-color-badge').forEach(badge => {
        badge.addEventListener('click', (e) => {
          const color = (e.target as HTMLDivElement).dataset.color!;
          selectedBgColors = selectedBgColors.filter(c => c !== color);
          renderBgColorBadges();
        });
      });
    };

    this.overlay.querySelector('#import-clear-bg-colors')!.addEventListener('click', () => {
      selectedBgColors = [];
      renderBgColorBadges();
    });

    previewCanvas.addEventListener('click', (e) => {
      if (!currentImportImage) return;
      const rect = previewCanvas.getBoundingClientRect();
      const scaleX = previewCanvas.width / rect.width;
      const scaleY = previewCanvas.height / rect.height;
      const x = Math.floor((e.clientX - rect.left) * scaleX);
      const y = Math.floor((e.clientY - rect.top) * scaleY);
      
      const ctx = previewCanvas.getContext('2d')!;
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const hex = '#' + [pixel[0], pixel[1], pixel[2]].map(c => c.toString(16).padStart(2, '0')).join('');
      
      if (!selectedBgColors.includes(hex)) {
        selectedBgColors.push(hex);
        renderBgColorBadges();
      }
    });

    const updateCropBox = () => {
      if (!currentImportImage) return;
      const scale = previewCanvas.clientWidth / previewCanvas.width;
      const x = parseInt(cropXInput.value) * scale;
      const y = parseInt(cropYInput.value) * scale;
      const size = parseInt(cropSizeInput.value) * scale;
      
      cropBox.style.left = `${x}px`;
      cropBox.style.top = `${y}px`;
      cropBox.style.width = `${size}px`;
      cropBox.style.height = `${size}px`;
    };

    fileInput.addEventListener('change', () => {
      if (!fileInput.files || fileInput.files.length === 0) return;
      const file = fileInput.files[0];
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          currentImportImage = img;
          previewArea.style.display = 'flex';
          
          // Setup preview canvas
          previewCanvas.width = img.width;
          previewCanvas.height = img.height;
          const ctx = previewCanvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0);
          
          // Default center crop
          const size = Math.min(img.width, img.height);
          cropXInput.value = Math.floor((img.width - size) / 2).toString();
          cropYInput.value = Math.floor((img.height - size) / 2).toString();
          cropSizeInput.value = size.toString();
          
          // Auto-pick top-left color
          const pixel = ctx.getImageData(0, 0, 1, 1).data;
          const hex = '#' + [pixel[0], pixel[1], pixel[2]].map(x => x.toString(16).padStart(2, '0')).join('');
          selectedBgColors = [hex];
          renderBgColorBadges();

          updateCropBox();
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });

    this.overlay.querySelector('#import-center-crop')!.addEventListener('click', () => {
      if (!currentImportImage) return;
      const size = Math.min(currentImportImage.width, currentImportImage.height);
      cropXInput.value = Math.floor((currentImportImage.width - size) / 2).toString();
      cropYInput.value = Math.floor((currentImportImage.height - size) / 2).toString();
      cropSizeInput.value = size.toString();
      updateCropBox();
    });

    [cropXInput, cropYInput, cropSizeInput].forEach(input => {
      input.addEventListener('input', updateCropBox);
    });

    const runImportProcess = async () => {
      if (!currentImportImage) return null;
      
      const options = {
        cropX: parseInt(cropXInput.value),
        cropY: parseInt(cropYInput.value),
        cropSize: parseInt(cropSizeInput.value),
        removeBackground: (this.overlay.querySelector('#import-remove-bg') as HTMLInputElement).checked,
        backgroundColors: selectedBgColors,
        bgTolerance: parseInt((this.overlay.querySelector('#import-bg-tol') as HTMLInputElement).value),
        treatNearWhiteAsTransparent: (this.overlay.querySelector('#import-near-white') as HTMLInputElement).checked,
        alphaThreshold: parseInt((this.overlay.querySelector('#import-alpha-thresh') as HTMLInputElement).value),
        colorCount: parseInt((this.overlay.querySelector('#import-color-count') as HTMLInputElement).value),
        smoothing: (this.overlay.querySelector('#import-smooth') as HTMLInputElement).checked
      };

      try {
        return await processImageToMatrix(currentImportImage, options);
      } catch (err: any) {
        this.errorDiv.textContent = `Import failed: ${err.message}`;
        return null;
      }
    };

    this.overlay.querySelector('#import-preview-btn')!.addEventListener('click', async () => {
      const result = await runImportProcess();
      if (result) {
        importResultDraft = result;
        
        // Temporarily show it in the previewer without overwriting textarea
        const tempMatrix = this.currentMatrix;
        const tempPalette = this.currentPalette;
        
        this.currentMatrix = result.matrix;
        this.currentPalette = result.palette;
        this.updateMockSprite();
        
        this.errorDiv.textContent = 'Previewing import result. Click "Apply to Matrix" to keep it.';
        setTimeout(() => this.errorDiv.textContent = '', 3000);
        
        // Restore state so it doesn't permanently overwrite until Applied
        this.currentMatrix = tempMatrix;
        this.currentPalette = tempPalette;
      }
    });

    this.overlay.querySelector('#import-apply-btn')!.addEventListener('click', async () => {
      const result = importResultDraft || await runImportProcess();
      if (result) {
        this.currentMatrix = result.matrix;
        this.currentPalette = result.palette;
        
        this.textarea.value = this.getMatrixString();
        
        this.paletteInputs.forEach(input => {
          const index = parseInt(input.dataset.index!);
          input.value = this.currentPalette[index] || '#000000';
        });

        this.updateMockSprite();
        this.errorDiv.textContent = 'Image applied to matrix successfully.';
        setTimeout(() => this.errorDiv.textContent = '', 3000);
        importResultDraft = null;
      }
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
    
    this.updateMockSprite(); // Ensure current edits are in the registry as 'preview_sprite'
    
    try {
      const dataUrl = generateAnimationSheetDataUrl('preview_sprite', animationName);
      
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${spriteId}_${animationName}_sheet.png`;
      a.click();
    } catch (e: any) {
      this.errorDiv.textContent = e.message;
    }
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
