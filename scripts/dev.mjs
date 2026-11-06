import { watch } from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib.mjs';
import { build } from './build.mjs';
import { startServer } from './serve.mjs';
await build({ includeDrafts: true });
startServer();
let dirty=false, running=false, timer;
async function rebuild() {
  if (running) { dirty=true; return; }
  running=true;
  try { await build({ includeDrafts:true }); console.log('Rebuilt. Refresh the browser to view changes.'); }
  catch (e) { console.error('Build failed; keeping last successful output:', e.message); }
  finally { running=false; if(dirty){dirty=false;await rebuild();} }
}
for (const dir of ['plans','public']) watch(path.join(ROOT, dir), {recursive:true}, () => { clearTimeout(timer); timer=setTimeout(rebuild,150); });
console.log('Watching plans/ and public/ · drafts included · refresh after edits.');
