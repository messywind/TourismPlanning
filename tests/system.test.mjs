import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, cp, mkdir, writeFile, readFile, access, rm, symlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { ROOT, validatePlan } from '../scripts/lib.mjs';
import { build } from '../scripts/build.mjs';
import { createPlan } from '../scripts/create-plan.mjs';
import { createServer } from '../scripts/serve.mjs';
const args={slug:'hangzhou-2027',title:'杭州春游',destination:'杭州',start:'2027-04-02',end:'2027-04-05',travelers:'4'};
async function fixture(t){
 const dir=await mkdtemp(path.join(os.tmpdir(),'tourism-test-'));
 t.after(()=>rm(dir,{recursive:true,force:true}));
 for(const name of ['public','templates'])await cp(path.join(ROOT,name),path.join(dir,name),{recursive:true});
 await mkdir(path.join(dir,'plans'));return dir;
}
test('create a draft without overwriting another trip',async t=>{
 const root=await fixture(t);const p=await createPlan(args,root);
 assert.equal(p.status,'draft');assert.equal(p.travelers,4);
 assert.match(await readFile(path.join(root,'plans',p.slug,'index.html'),'utf8'),/杭州春游/);
 await assert.rejects(createPlan(args,root),/already exists/);
});
test('production omits drafts and private notes, development includes drafts',async t=>{
 const root=await fixture(t);await createPlan(args,root);
 assert.equal((await build({root})).count,0);
 await assert.rejects(access(path.join(root,'dist','plans',args.slug,'index.html')));
 assert.equal((await build({root,includeDrafts:true})).count,1);
 await access(path.join(root,'dist','plans',args.slug,'index.html'));
 await assert.rejects(access(path.join(root,'dist','plans',args.slug,'notes','brief.md')));
 const json=path.join(root,'plans',args.slug,'plan.json');const p=JSON.parse(await readFile(json));p.status='ready';await writeFile(json,JSON.stringify(p));
 assert.equal((await build({root})).count,1);
 assert.equal(JSON.parse(await readFile(path.join(root,'dist','plans.json'))).includeDrafts,false);
});
test('cloning preserves assets but creates a new draft',async t=>{
 const root=await fixture(t);await createPlan(args,root);
 const p=await createPlan({...args,slug:'hangzhou-copy',from:args.slug},root);
 assert.equal(p.status,'draft');await access(path.join(root,'plans',p.slug,p.cover));
});
test('invalid dates and path traversal are rejected',async t=>{
 const root=await fixture(t);
 await assert.rejects(createPlan({...args,slug:'../escape'},root),/slug/);
 await assert.rejects(createPlan({...args,start:'2027-02-30'},root),/date/);
 await assert.rejects(createPlan({...args,end:'2027-01-01'},root),/date/);
 await assert.rejects(createPlan({...args,travelers:'0'},root),/travelers/);
});
test('symlink content is rejected before export',async t=>{
 const root=await fixture(t);await createPlan(args,root);
 await symlink(path.join(root,'package.json'),path.join(root,'plans',args.slug,'leak'));
 await assert.rejects(build({root,includeDrafts:true}),/Symlinks/);
});
test('failed validation keeps prior build intact',async t=>{
 const root=await fixture(t);await createPlan(args,root);await build({root,includeDrafts:true});
 await writeFile(path.join(root,'plans',args.slug,'plan.json'),'broken json');
 await assert.rejects(build({root}));await access(path.join(root,'dist','healthz'));
});
test('preview serves pages, redirects directories, and returns real 404s',async t=>{
 const root=await fixture(t);await createPlan(args,root);await build({root,includeDrafts:true});
 const server=createServer({directory:path.join(root,'dist')});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));
 const base=`http://127.0.0.1:${server.address().port}`;
 assert.equal((await fetch(base+'/')).status,200);
 assert.equal((await fetch(base+'/healthz')).status,200);
 assert.equal((await fetch(base+'/plans/'+args.slug,{redirect:'manual'})).status,302);
 assert.equal((await fetch(base+'/missing')).status,404);
 assert.equal((await fetch(base+'/.env')).status,404);
 assert.equal((await fetch(base+'/plans/'+args.slug+'/notes/brief.md')).status,404);
 assert.equal((await fetch(base+'/',{method:'POST'})).status,405);
});
test('the migrated Chengdu page has no embedded or missing local assets',async()=>{
 const dir=path.join(ROOT,'plans','chengdu-2026-11-11');
 const html=await readFile(path.join(dir,'index.html'),'utf8');
 assert.doesNotMatch(html,/data:(?:image|font)\/[^;]+;base64,/);
 const assets=new Set(html.match(/assets\/[a-f0-9]{16}\.(?:png|jpg|webp|ttf)/g));
 assert.ok(assets.size>=8);
 for(const asset of assets)await access(path.join(dir,asset));
});
