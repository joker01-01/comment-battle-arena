import './styles.css';
import './ui/pixelSpritePreviewer.css';
import './skills/shieldSkill';
import './skills/dashSkill';
import './skills/fireballSkill';
import './skills/healSkill';
import './skills/splitSummonSkill';
import './skills/reflectSkill';
import { App } from './app';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="header">
    <h1 id="epTitle">Loading...</h1>
    <p id="epSeed">Seed: ---</p>
  </div>
  
  <div class="arena-container">
    <canvas id="gameCanvas" width="800" height="450"></canvas>
    <div id="resultOverlay" class="result-overlay hidden">
      <div class="result-box">
        <h2 id="resWinner">Winner: ---</h2>
        <p id="resTime">Duration: ---</p>
        <p id="resHp">Left HP: --- | Right HP: ---</p>
        <div class="result-actions">
          <button id="btnCopyResult">Copy Result</button>
          <button id="btnExportJson">Export JSON</button>
        </div>
      </div>
    </div>
  </div>

  <div class="controls">
    <button id="btnPrev">Prev Preset Episode</button>
    <button id="btnStart">Start</button>
    <button id="btnRestart">Restart</button>
    <button id="btnNext">Next Preset Episode</button>
    <button id="btnToggleDebug">Toggle Debug Colliders</button>
    <button id="btnOpenPreviewer" style="background-color: #4aa3ff; color: #fff;">Open Pixel Sprite Previewer</button>
  </div>

  <div class="custom-setup-panel">
    <h3>Custom Match Setup</h3>
    <div class="setup-row">
      <label>Left Character:
        <select id="setupLeftChar"></select>
      </label>
      <button id="btnSwapChars">Swap</button>
      <label>Right Character:
        <select id="setupRightChar"></select>
      </label>
    </div>
    <div class="setup-row">
      <label>Seed:
        <input type="number" id="setupSeed" placeholder="Random if empty">
      </label>
      <label>Title:
        <input type="text" id="setupTitle" placeholder="Custom Match">
      </label>
    </div>
    <div class="setup-actions">
      <button id="btnStartCustomMatch" style="background-color: #ff4a4a; color: #fff;">Start Custom Match</button>
      <button id="btnCopyDraft">Copy Episode Draft</button>
      <span id="setupModeDisplay">Mode: Custom Match</span>
    </div>
  </div>

  <div id="debugPanel" class="log-panel hidden" style="height: auto; border-color: #00ff00; color: #00ff00;"></div>

  <div class="info-panel">
    <div id="leftInfo" class="char-info"></div>
    <div id="rightInfo" class="char-info"></div>
  </div>

  <div id="battleLog" class="log-panel"></div>
`;

// Initialize app
new App();
