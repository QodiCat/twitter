import { build, context } from 'esbuild';
import { rmSync, mkdirSync, copyFileSync, readdirSync, statSync, writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = join(__dirname, '..');
const dist = join(root, 'dist');
const publicDir = join(root, 'public');

const isWatch = process.argv.includes('--watch');

function copyRecursive(srcDir, destDir) {
  mkdirSync(destDir, { recursive: true });
  for (const entry of readdirSync(srcDir)) {
    const sp = join(srcDir, entry);
    const dp = join(destDir, entry);
    const st = statSync(sp);
    if (st.isDirectory()) copyRecursive(sp, dp); else copyFileSync(sp, dp);
  }
}

function patchManifest() {
  const manifestPath = join(dist, 'manifest.json');
  const raw = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  writeFileSync(manifestPath, JSON.stringify(raw, null, 2));
}

async function buildAll() {
  rmSync(dist, { recursive: true, force: true });
  mkdirSync(dist, { recursive: true });
  copyRecursive(publicDir, dist);
  const common = {
    entryPoints: {
      'content/index': join(root, 'src/content/index.ts'),
      'background/index': join(root, 'src/background/index.ts'),
      'popup/index': join(root, 'src/popup/index.ts')
    },
    outdir: dist,
    bundle: true,
    sourcemap: true,
    target: 'chrome120',
    format: 'esm',
    logLevel: 'info',
    platform: 'browser'
  };

  if (isWatch) {
    const ctx = await context(common);
    await ctx.watch();
    patchManifest();
    console.log('Watching for changes...');
  } else {
    await build(common);
    patchManifest();
    console.log('Build complete');
  }
}

buildAll().catch(e => { console.error(e); process.exit(1); });
