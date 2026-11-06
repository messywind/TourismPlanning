import { parseArgs } from 'node:util';
import { access, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT, copyTree, validatePlan, htmlEscape, slugPattern, assertPlainTree } from './lib.mjs';
export async function createPlan(opts, root=ROOT) {
  const p = validatePlan({slug:opts.slug,title:opts.title,destination:opts.destination,summary:opts.summary || `${opts.destination}旅行计划，继续一起完善路线、美食和住处。`,startDate:opts.start,endDate:opts.end,travelers:Number(opts.travelers || 4),status:'draft',tags:['待完善'],cover:'assets/cover.svg'},opts.slug || '');
  const target=path.join(root,'plans',p.slug);
  try { await access(target); throw new Error(`Plan already exists: ${p.slug}`); }
  catch(e){if(e.code!=='ENOENT')throw e;}
  let source=path.join(root,'templates','plan');
  if(opts.from){
    if(!slugPattern.test(opts.from))throw new Error('Invalid source slug');
    source=path.join(root,'plans',opts.from);
    await assertPlainTree(source);
    const original=JSON.parse(await readFile(path.join(source,'plan.json'),'utf8'));
    p.cover=original.cover; p.tags=['待完善',...original.tags.filter(t=>t!=='待完善')];
    validatePlan(p,p.slug);
  }
  await mkdir(target); // Exclusive creation: never overwrite an existing trip.
  try {
    await copyTree(source,target,{exclude:new Set(['plan.json'])});
    await writeFile(path.join(target,'plan.json'),JSON.stringify(p,null,2)+'\n');
    if(!opts.from){
      const file=path.join(target,'index.html');let html=await readFile(file,'utf8');
      const values={TITLE:p.title,DESTINATION:p.destination,START:p.startDate,END:p.endDate,TRAVELERS:p.travelers};
      html=html.replace(/\{\{(TITLE|DESTINATION|START|END|TRAVELERS)\}\}/g,(_,key)=>htmlEscape(values[key]));
      await writeFile(file,html);
    }
    return p;
  } catch(e){await rm(target,{recursive:true,force:true});throw e;}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const {values}=parseArgs({options:Object.fromEntries(['slug','title','destination','start','end','travelers','summary','from'].map(k=>[k,{type:'string'}]))});
    const p=await createPlan(values);console.log(`Created plans/${p.slug}/ (draft). Run npm run dev to preview.\n${values.from?'Copied page content still contains the original trip; replace dates, place names and sources before marking ready.':'Edit index.html, assets/, and notes/brief.md. Mark plan.json status ready when reviewed.'}`);
  }catch(e){console.error(e.message);console.error('Example: npm run plan:create -- --slug hangzhou-2027-04 --title "杭州春日游" --destination 杭州 --start 2027-04-02 --end 2027-04-05 --travelers 4');process.exitCode=1;}
}
