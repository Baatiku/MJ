// Finish an already retouched, text-free Maknoon Jamil garment photo.
// The sole wordmark source is the SVG, so every new batch uses the same
// italic serif face, double filigree rules and arabesque rosette in the same
// bottom-right spot on every garment portrait.
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile as run } from 'node:child_process';
import { promisify } from 'node:util';

const execFile = promisify(run);
const source = process.argv[2];
const destination = process.argv[3];
if (!source || !destination || source === destination || !/\.(jpe?g)$/i.test(destination)) {
  console.error('Usage: node scripts/add-maknoon-watermark.mjs cleaned-photo.png output-photo.jpg');
  process.exit(2);
}

const vector = fileURLToPath(new URL('../public/brand/maknoon-photo-watermark.svg', import.meta.url));
const temporary = await mkdtemp(join(tmpdir(), 'mj-photo-watermark-'));
try {
  const workingVector = join(temporary, 'signature.svg');
  const plain = join(temporary, 'plain.png');
  const shaded = join(temporary, 'shaded.png');
  const { stdout } = await execFile('identify', ['-format', '%w %h', source]);
  const [width, height] = stdout.trim().split(' ').map(Number);
  if (!width || !height) throw new Error('Invalid source photograph');

  // A cream signature stays legible over dark fabric; muted cocoa is much more
  // legible over light limestone backdrops. The shape and position never vary.
  const markWidth = Math.round(width * .42);
  const markHeight = Math.round(markWidth * 208 / 760);
  const insetX = Math.round(width * .03);
  const insetY = Math.round(height * .028);
  const cropX = Math.max(0, width - markWidth - insetX);
  const cropY = Math.max(0, height - markHeight - insetY);
  const { stdout: luminance } = await execFile('convert', [source,
    '-crop', `${Math.min(markWidth, width)}x${Math.min(markHeight, height)}+${cropX}+${cropY}`,
    '+repage', '-colorspace', 'gray', '-format', '%[fx:mean]', 'info:']);
  const onLightGround = Number(luminance.trim()) > .58;
  const ink = onLightGround ? '#684638' : '#fff9ed';
  const shadow = onLightGround ? '#fff9ed' : '#352622';
  await writeFile(workingVector, (await readFile(vector, 'utf8')).replaceAll('#fff9ed', ink));
  await execFile('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', workingVector, '-frames:v', '1', '-pix_fmt', 'rgba', plain]);
  await execFile('convert', [plain, '(', '+clone', '-background', shadow, '-shadow', '70x1.6+1+2', ')',
    '+swap', '-background', 'none', '-layers', 'merge', '+repage', shaded]);
  await execFile('convert', [source, '(', shaded, '-resize', `${markWidth}x`, ')',
    '-gravity', 'southeast', '-geometry', `+${insetX}+${insetY}`,
    '-compose', 'over', '-composite', '-sampling-factor', '4:4:4', '-quality', '92', destination]);
  console.log(`Finished ${destination}: ${width} × ${height}; ${onLightGround ? 'cocoa' : 'ivory'} signature`);
} finally {
  await rm(temporary, { recursive: true, force: true });
}
