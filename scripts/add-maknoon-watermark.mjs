// Finish an already retouched, text-free Maknoon Jamil garment photo.
// The sole wordmark source is the SVG, so every new batch uses the same
// italic serif face, fine rules and bow ornament in the same bottom-right spot.
import { mkdtemp, rm } from 'node:fs/promises';
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
  const plain = join(temporary, 'plain.png');
  const shaded = join(temporary, 'shaded.png');
  const { stdout } = await execFile('identify', ['-format', '%w %h', source]);
  const [width, height] = stdout.trim().split(' ').map(Number);
  if (!width || !height) throw new Error('Invalid source photograph');
  await execFile('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', vector, '-frames:v', '1', '-pix_fmt', 'rgba', plain]);
  await execFile('convert', [plain, '(', '+clone', '-background', '#292225', '-shadow', '45x1+1+1', ')',
    '+swap', '-background', 'none', '-layers', 'merge', '+repage', shaded]);
  await execFile('convert', [source, '(', shaded, '-resize', `${Math.round(width * .34)}x`, ')',
    '-gravity', 'southeast', '-geometry', `+${Math.round(width * .027)}+${Math.round(height * .026)}`,
    '-compose', 'over', '-composite', '-sampling-factor', '4:4:4', '-quality', '89', destination]);
  console.log(`Finished ${destination}: ${width} × ${height}`);
} finally {
  await rm(temporary, { recursive: true, force: true });
}
