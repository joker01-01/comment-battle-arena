import { chromium } from 'playwright';
import { createServer } from 'vite';
import fs from 'fs';
import path from 'path';

async function run() {
  console.log('Starting Vite dev server...');
  const server = await createServer({
    server: { port: 5173 },
    root: process.cwd(),
  });
  await server.listen();
  server.printUrls();

  console.log('Launching browser...');
  const browser = await chromium.launch({ channel: 'chrome' }).catch(async () => {
    console.log('Falling back to msedge...');
    return await chromium.launch({ channel: 'msedge' });
  });
  const page = await browser.newPage();

  const port = (server.httpServer?.address() as any)?.port || 5173;
  console.log(`Navigating to http://localhost:${port} ...`);
  await page.goto(`http://localhost:${port}`);

  // Wait for the app to load and expose the function
  await page.waitForFunction(() => typeof (window as any).__CBA_EXPORT_ANIMATION_SHEET__ === 'function');

  const exports = [
    ["shield_cat", "move"],
    ["rush_dog", "move"],
    ["fire_wizard", "move"],
    ["heal_bot", "move"],
    ["split_slime", "move"],
    ["mirror_knight", "move"]
  ];

  const outDir = path.join(process.cwd(), 'assets', 'readme');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  for (const [spriteId, animName] of exports) {
    console.log(`Exporting ${spriteId} ${animName}...`);
    const dataUrl = await page.evaluate(({ id, anim }) => {
      return (window as any).__CBA_EXPORT_ANIMATION_SHEET__({ spriteId: id, animationName: anim });
    }, { id: spriteId, anim: animName });

    if (!dataUrl) {
      console.error(`Failed to export ${spriteId}`);
      continue;
    }

    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
    const filePath = path.join(outDir, `${spriteId}_${animName}_sheet.png`);
    fs.writeFileSync(filePath, base64Data, 'base64');
    console.log(`Saved to ${filePath}`);
  }

  console.log('Closing browser and server...');
  await browser.close();
  await server.close();
  console.log('Done!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
