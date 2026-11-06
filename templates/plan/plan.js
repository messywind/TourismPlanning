// Edit this data or replace the page structure freely. This template deliberately
// avoids a shared layout engine so each trip can have its own visual language.
const days=[
 {label:'DAY 01',title:'抵达与街区散步',route:'住处 → 附近街区 → 晚餐',note:'补充交通、时间、店名和照片。'},
 {label:'DAY 02',title:'核心景区',route:'入口 → 核心打卡点 → 出口',note:'补充景区内部顺序和官方导览来源。'},
 {label:'DAY 03',title:'自由活动与返程',route:'早餐 → 行李寄存 → 返程',note:'按实际航班或车次预留时间。'}
];
const host=document.querySelector('#itinerary');
for(const d of days){const article=document.createElement('article');article.className='day';const label=document.createElement('strong');label.textContent=d.label;const content=document.createElement('div');const title=document.createElement('h3');title.textContent=d.title;const route=document.createElement('p');route.textContent=d.route;const note=document.createElement('p');note.textContent=d.note;content.append(title,route,note);article.append(label,content);host.append(article);}
