const cards=document.querySelector('#cards'), search=document.querySelector('#search'), filters=document.querySelector('#filters');
let plans=[],city='全部';
const make=(tag,text,className)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;};
function render(){
 const query=search.value.trim().toLocaleLowerCase();
 const shown=plans.filter(p=>(city==='全部'||p.destination===city)&&[p.title,p.destination,p.summary,...p.tags].join(' ').toLocaleLowerCase().includes(query));
 cards.replaceChildren(...shown.map(p=>{
  const a=make('a',undefined,'trip');a.href=`./plans/${encodeURIComponent(p.slug)}/`;
  const cover=make('div',undefined,'cover');const image=make('img');image.src=`./plans/${p.slug}/${p.cover}`;image.alt=p.title;image.loading='lazy';cover.append(image,make('span',p.destination,'city'));
  const body=make('div',undefined,'body');body.append(make('div',`${p.startDate} — ${p.endDate}`,'date'),make('h3',p.title),make('p',p.summary));
  const tags=make('div',undefined,'tags');for(const tag of p.tags)tags.append(make('span',tag));if(p.status==='draft')tags.append(make('span','草稿'));
  const arrow=make('div',undefined,'arrow');arrow.append(make('span',`${p.travelers} 人同行 · 打开计划`),make('b','↗'));body.append(tags,arrow);a.append(cover,body);return a;
 }));
 document.querySelector('#empty').hidden=shown.length>0;
 for(const b of filters.children){const selected=b.textContent===city;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));}
}
search.addEventListener('input',render);
fetch('./plans.json').then(r=>{if(!r.ok)throw new Error(r.status);return r.json();}).then(data=>{
 plans=data.plans;document.querySelector('#trip-count').textContent=String(plans.length).padStart(2,'0');
 document.querySelector('#dev-notice').hidden=!data.includeDrafts;
 for(const name of ['全部',...new Set(plans.map(p=>p.destination))]){const b=make('button',name);b.type='button';b.addEventListener('click',()=>{city=name;render();});filters.append(b);}
 render();
}).catch(()=>{cards.replaceChildren();document.querySelector('#error').hidden=false;});
