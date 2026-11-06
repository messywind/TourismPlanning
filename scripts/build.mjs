import { mkdtemp, rm, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT, loadPlans, copyTree } from './lib.mjs';
export async function build({ root = ROOT, includeDrafts = false } = {}) {
  const plans = await loadPlans(root, { includeDrafts });
  const staging = await mkdtemp(path.join(root, '.build-'));
  try {
    await copyTree(path.join(root, 'public'), staging);
    for (const p of plans) {
      await copyTree(path.join(root, 'plans', p.slug), path.join(staging, 'plans', p.slug), { exclude: new Set(['notes', 'plan.json', 'README.md']) });
    }
    await writeFile(path.join(staging, 'plans.json'), JSON.stringify({ includeDrafts, plans }, null, 2));
    await writeFile(path.join(staging, 'healthz'), 'ok\n');
    const out = path.join(root, 'dist');
    await rm(out, { recursive: true, force: true });
    await rename(staging, out);
    return { count: plans.length, out };
  } catch (error) { await rm(staging, { recursive: true, force: true }); throw error; }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { const r = await build(); console.log(`Built ${r.count} ready plan(s) → ${r.out}`); }
  catch (e) { console.error(e.message); process.exitCode = 1; }
}
