import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';

const name = process.env.MJ_WORKER_NAME;
const databaseId = process.env.MJ_CATALOG_DATABASE_ID;
if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(name ?? '') ||
    !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(databaseId ?? '')) {
  console.error('Set MJ_WORKER_NAME to the existing Worker name and MJ_CATALOG_DATABASE_ID to the D1 database ID.');
  process.exit(1);
}
const args = process.argv.slice(2);
if (args.length && (args.length !== 1 || args[0] !== '--dry-run')) {
  console.error('The only supported option is --dry-run.');
  process.exit(1);
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
