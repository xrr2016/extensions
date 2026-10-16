// Chrome Web Store promo tiles for RepoWays.
//   small promo tile  440x280
//   marquee tile     1400x560
// Store wants JPEG or 24-bit PNG with no alpha, so every buffer is flattened
// onto the canvas colour before writing. SVG -> sharp keeps the type crisp and
// the geometry exact; regenerate after any brand change by running:
//   node apps/repoways/scripts/gen-store.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from '../../../node_modules/.pnpm/node_modules/sharp/dist/index.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'assets', 'store');
mkdirSync(outDir, { recursive: true });

// Brand palette (GitHub Primer dark + RepoWays accent blue).
const CANVAS_TOP = '#0d1117';
const CANVAS_BOTTOM = '#161b22';
const ACCENT = '#2f81f0';
const INK = '#e6edf3';
const MUTED = '#9198a1';
const FONT = "'Segoe UI', system-ui, -apple-system, sans-serif";

// The logo's white branch mark, reused inline so the tiles never depend on a
// raster. Kept identical to assets/logo.svg (one origin, spokes, hollow rings).
function mark(scale, tx, ty, stroke, ring) {
  return `<g transform="translate(${tx},${ty}) scale(${scale})" fill="none" stroke="${stroke}" stroke-width="64" stroke-linecap="round" stroke-linejoin="round">
    <path d="M319.8 480.7 L644.2 299.3"/>
    <path d="M328.0 512.0 L708.0 512.0"/>
    <path d="M319.8 543.3 L644.2 724.7"/>
    <circle cx="264.0" cy="512.0" r="64.0"/>
    <circle cx="700.0" cy="268.0" r="64.0"/>
    <circle cx="772.0" cy="512.0" r="64.0"/>
    <circle cx="700.0" cy="756.0" r="64.0"/>
  </g>`;
}

function logoTile(size, x, y) {
  const r = size * 0.28125; // 288 / 1024 of the master's corner radius
  return `<g>
    <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${r}" fill="#0969da"/>
    ${mark(size / 1024, x, y, '#ffffff')}
  </g>`;
}

function bg(w, h, id) {
  return `<defs>
    <linearGradient id="bg${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${CANVAS_TOP}"/>
      <stop offset="1" stop-color="${CANVAS_BOTTOM}"/>
    </linearGradient>
    <radialGradient id="glow${id}" cx="0.82" cy="0.2" r="0.7">
      <stop offset="0" stop-color="${ACCENT}" stop-opacity="0.22"/>
      <stop offset="1" stop-color="${ACCENT}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg${id})"/>
  <rect width="${w}" height="${h}" fill="url(#glow${id})"/>`;
}

function pill(x, y, text, fontPx) {
  const w = text.length * fontPx * 0.6 + 44;
  const h = fontPx * 2.05;
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="none" stroke="#30363d" stroke-width="1.5"/>
    <circle cx="${x + 26}" cy="${y + h / 2}" r="4.5" fill="${ACCENT}"/>
    <text x="${x + 40}" y="${y + h / 2}" fill="${MUTED}" font-family="${FONT}" font-size="${fontPx}" dominant-baseline="central">${text}</text>
  </g>`;
  // returns width via closure-free recompute at call site
}

function pillWidth(text, fontPx) {
  return text.length * fontPx * 0.6 + 44;
}

// ---- Marquee 1400x560 -------------------------------------------------------
function marquee() {
  const W = 1400, H = 560;
  const badges = ['Free', 'Open source', 'Zero permissions'];
  let bx = 92;
  const badgeY = 392;
  let badgeSvg = '';
  for (const b of badges) {
    badgeSvg += pill(bx, badgeY, b, 22);
    bx += pillWidth(b, 22) + 16;
  }

  // Right-side fan: one origin node, four spokes to labelled tool rings.
  const fan = `
    <g stroke="${ACCENT}" stroke-width="3" opacity="0.9">
      <line x1="1010" y1="280" x2="1180" y2="150"/>
      <line x1="1010" y1="280" x2="1230" y2="235"/>
      <line x1="1010" y1="280" x2="1230" y2="330"/>
      <line x1="1010" y1="280" x2="1180" y2="415"/>
    </g>
    <circle cx="1010" cy="280" r="20" fill="${ACCENT}"/>
    ${[
      [1180, 150, 'GitDiagram'],
      [1230, 235, 'DeepWiki'],
      [1230, 330, 'Codespaces'],
      [1180, 415, 'Gitingest'],
    ].map(([cx, cy, label]) => `
      <circle cx="${cx}" cy="${cy}" r="11" fill="${CANVAS_BOTTOM}" stroke="${INK}" stroke-width="3"/>
      <text x="${cx + 22}" y="${cy}" fill="${MUTED}" font-family="${FONT}" font-size="21" dominant-baseline="central">${label}</text>
    `).join('')}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    ${bg(W, H, 'm')}
    ${logoTile(60, 92, 150)}
    <text x="170" y="196" fill="${INK}" font-family="${FONT}" font-size="58" font-weight="700" dominant-baseline="central">RepoWays</text>
    <text x="92" y="286" fill="${INK}" font-family="${FONT}" font-size="46" font-weight="600">12 ways to open</text>
    <text x="92" y="346" fill="${ACCENT}" font-family="${FONT}" font-size="46" font-weight="600">any GitHub repo</text>
    ${badgeSvg}
    ${fan}
  </svg>`;
}

// ---- Small tile 440x280 -----------------------------------------------------
function small() {
  const W = 440, H = 280;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    ${bg(W, H, 's')}
    ${logoTile(76, 74, 62)}
    <text x="166" y="100" fill="${INK}" font-family="${FONT}" font-size="40" font-weight="700" dominant-baseline="central">RepoWays</text>
    <text x="74" y="188" fill="${MUTED}" font-family="${FONT}" font-size="21">12 ways to open</text>
    <text x="74" y="218" fill="${ACCENT}" font-family="${FONT}" font-size="21" font-weight="600">any GitHub repo</text>
  </svg>`;
}

async function render(name, svg, w, h) {
  const info = await sharp(Buffer.from(svg), { density: 96 })
    .resize(w, h, { fit: 'contain', background: CANVAS_TOP })
    .flatten({ background: CANVAS_TOP })
    .png()
    .toFile(join(outDir, name));
  console.log(name, info.width + 'x' + info.height, 'channels=' + info.channels);
}

await render('repoways-marquee-1400x560.png', marquee(), 1400, 560);
await render('repoways-small-440x280.png', small(), 440, 280);
