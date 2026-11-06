import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';

const name = process.env.MJ_WORKER_NAME?.trim();
const database = process.env.MJ_CATALOG_DATABASE_ID?.trim();
const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(name ?? '') || !database) {
  console.error('Set MJ_WORKER_NAME to the existing Worker name and MJ_CATALOG_DATABASE_ID to the existing D1 database UUID or exact name.');
  process.exit(1);
}
const args = process.argv.slice(2);
if (args.length && (args.length !== 1 || args[0] !== '--dry-run')) {
  console.error('The only supported option is --dry-run.');
  process.exit(1);
}

let databaseId = database;
if (!uuid.test(databaseId)) {
  const result = spawnSync('npx', ['--yes', 'wrangler', 'd1', 'list', '--json'], { encoding: 'utf8' });
  if (result.error || result.status !== 0) {
    console.error('Could not list D1 databases. Check the build token’s D1 access or use the database UUID.');
    process.exit(1);
  }
  let matches;
  try {
    const databases = JSON.parse(result.stdout);
    matches = databases.filter(({ name }) => name === database);
  } catch {
    console.error('Wrangler did not return a D1 database list. Use the database UUID.');
    process.exit(1);
  }
  if (matches.length !== 1 || !uuid.test(matches[0].uuid ?? '')) {
    console.error('Could not identify one existing D1 database with that exact name. Use the database UUID.');
    process.exit(1);
  }
  databaseId = matches[0].uuid;
}

const base = JSON.parse(readFileSync('wrangler.worker.jsonc', 'utf8'));
const config = {
  ...base,
  name,
  d1_databases: [{ binding: 'CATALOG_DB', database_id: databaseId }]
};
const temporary = `.wrangler-admin-${process.pid}.json`;
writeFileSync(temporary, JSON.stringify(config), { flag: 'wx' });
try {
  const child = spawnSync('npx', ['--yes', 'wrangler', 'deploy', '--config', temporary, ...args], { stdio: 'inherit' });
  if (child.error) throw child.error;
  process.exitCode = child.status ?? 1;
} finally {
  unlinkSync(temporary);
}
