// Each calling's own constellation: the calling at the base, its branches rising, converging on the endpoint class, then the item.
// Only stars you are aware of are named; the next unknown star on each awakened path shows as faint dust.
import {classes,disciplines,classState,classKnown,isComplete,threadWalked,setupForClass} from './data.js';
import {hydrateClassIcons} from './class-icons.js';
import {connector,starMarkup,paintUnlockStars,threadHoles} from './atlas-layout.js';
import {aspectStars} from './aspect-stars.js';
// The calling's aspect glyph (Pillar or Instrument) is traced in faint stars behind its constellation.
// The traced points are unordered, so chain them nearest-neighbour from the top-left: a light then runs along that chain,
// flaring each star in turn so the glyph seems to be traced in light, every seven seconds.
function traceOrder(points){const left=points.map((p,i)=>i),order=[];let at=left.reduce((b,i)=>points[i][0]+points[i][1]<points[b][0]+points[b][1]?i:b,0);
while(left.length){left.splice(left.indexOf(at),1);order.push(at);if(!left.length)break;const [ax,ay]=points[at];at=left.reduce((b,i)=>Math.hypot(points[i][0]-ax,points[i][1]-ay)<Math.hypot(points[b][0]-ax,points[b][1]-ay)?i:b,left[0]);}
const rank=new Map(order.map((i,k)=>[i,k]));return i=>rank.get(i)/points.length;}
function aspectFigure(root,d){const points=aspectStars[root.attribute.toLowerCase()];if(!points)return '';const size=660,x0=550-size/2,y0=470-size/2,along=traceOrder(points);
return `<g class="aspect-figure" data-aspect-figure="${root.attribute.toLowerCase()}" aria-hidden="true">${points.map(([x,y],i)=>`<circle cx="${(x0+x*size).toFixed(1)}" cy="${(y0+y*size).toFixed(1)}" r="${i%5===0?3.2:i%2?2:2.5}" fill="${d.color}" class="aspect-star" style="color:${d.color};--twinkle-delay:-${(i*0.53)%6}s;--trace-delay:${(along(i)*5.6).toFixed(2)}s"/>`).join('')}</g>`;}
const SELF={x:550,y:930},BASE={x:550,y:800},ENDPOINT={x:550,y:235},ITEM={x:550,y:135};// the item sits low enough to clear the Magic | Tech meter across the top
const branchXs={1:[550],2:[380,720],3:[290,550,810]};
const side=x=>x<550?[-44,6,'end']:[44,6,'start'];
export function callingLayout(root){
const family=classes.filter(c=>c.id===root.id||c.rootId===root.id),find=name=>family.find(c=>c.name===name);
const place=(cls,x,y,[dx,dy,anchor])=>({cls,x,y,labelX:x+dx,labelY:y+dy,anchor});
const stars=[place(root,BASE.x,BASE.y,[36,6,'start'])],edges=[];
if(root.members){const tierY={2:620,3:420,4:ENDPOINT.y},items=[];
for(const tier of [2,3,4]){const row=family.filter(c=>c.id!==root.id&&c.tier===tier);// A row of several master classes spreads wider and names each star below it, so no label sits between two glows (user, 2026-11-15).
row.forEach((cls,i)=>{const wide=tier===4&&row.length>1,x=wide?{2:[330,770],3:[230,550,870]}[row.length][i]:branchXs[row.length][i],y=tierY[tier];
stars.push(place(cls,x,y,tier===4?(wide?[0,78,'middle']:[60,9,'start']):side(x)));for(const p of cls.parentIds)edges.push([p,cls.id]);if(cls.item)items.push({name:cls.item,x,y:ITEM.y,from:{x,y},cls});});}
return {stars,edges,items};}
root.branches.forEach(([second,third],i)=>{const x=branchXs[root.branches.length][i],outward=x<550?-70:x>550?70:0;
stars.push(place(find(second),x,620,side(x)),place(find(third),x+outward,420,side(x+outward)));edges.push([root.id,find(second).id],[find(second).id,find(third).id],[find(third).id,find(root.endpoint).id]);});
if(root.endpoint)stars.push(place(find(root.endpoint),ENDPOINT.x,ENDPOINT.y,[76,9,'start']));
// A lone star (Null) stands at the centre of its own sky as its monument.
else stars[0]=place(root,ENDPOINT.x,470,[76,9,'start']);
const endpoint=stars.at(-1).cls;return {stars,edges,items:root.item?[{name:root.item,...ITEM,from:ENDPOINT,cls:endpoint}]:[]};}
export function renderCallingMap({svg,root,selectedClass,learned,scale,pan,onSelect,canSelect,backgroundStars,glyph}){
// Stars keep their own practice's color (Caelyn and Dyreon are Ingenium inside Magicka skies, Eikon is Magicka inside an Ingenium sky); lines that cross practices blend between the two.
const practice=cls=>setupForClass(cls),d=practice(root),layout=callingLayout(root),at=new Map(layout.stars.map(p=>[p.cls.id,p]));
const known=new Set(layout.stars.filter(p=>classKnown(p.cls,learned)).map(p=>p.cls.id));
const relics=layout.items.filter(r=>known.has(r.cls.id)),key=`calling:${root.id}:${[...known].join(',')}:${relics.map(r=>r.cls.id).join(',')}`;
if(svg.dataset.structure!==key){
let s=`<defs><radialGradient id="core"><stop stop-color="#d8d7ae" stop-opacity=".1"/><stop offset="1" stop-color="#d8d7ae" stop-opacity="0"/></radialGradient><radialGradient id="mist-${d.id}"><stop stop-color="${d.color}" stop-opacity=".09"/><stop offset=".6" stop-color="${d.color}" stop-opacity=".025"/><stop offset="1" stop-color="${d.color}" stop-opacity="0"/></radialGradient></defs>${backgroundStars()}<g id="universe">`;
s+=`<circle cx="${SELF.x}" cy="${SELF.y}" r="55" fill="url(#core)"/><circle cx="${SELF.x}" cy="${SELF.y}" r="18" class="orbit"/><g class="focus-origin">${glyph(SELF.x,SELF.y,'#b9bea9',10)}</g><text x="${SELF.x}" y="${SELF.y+42}" class="origin-label" text-anchor="middle">THE SELF</text>`;
s+=`<g class="cluster cluster-selected calling-sky" data-cluster="${d.id}" style="--node-color:${d.color}"><ellipse cx="550" cy="470" rx="430" ry="470" fill="url(#mist-${d.id})" class="region-mist" aria-hidden="true"/>${aspectFigure(root,d)}`;
s+=`<path d="M${SELF.x} ${SELF.y} L${layout.stars[0].x} ${layout.stars[0].y}" fill="none" stroke="${d.color}" style="color:${d.color}" class="thread self-thread" data-self-thread="${root.id}"/>`;
for(const [from,to] of layout.edges){if(!known.has(from))continue;const a=at.get(from),b=at.get(to);
if(known.has(to)){const ca=practice(a.cls).color,cb=practice(b.cls).color,link=`data-link-class="${to}" data-link-from="${from}"`;
s+=ca===cb?connector(a,b,ca,link):`<defs><linearGradient id="cross-${from}-${to}" gradientUnits="userSpaceOnUse" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"><stop offset=".25" stop-color="${ca}"/><stop offset=".85" stop-color="${cb}"/></linearGradient></defs><line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="url(#cross-${from}-${to})" style="color:${cb}" class="thread cross-thread" ${link}/>`;}
// Hint only the first stretch toward a star you are not yet aware of.
else s+=`<line x1="${a.x}" y1="${a.y}" x2="${a.x+(b.x-a.x)*.42}" y2="${a.y+(b.y-a.y)*.42}" stroke="${d.color}" class="thread thread-hint" aria-hidden="true"/><circle cx="${b.x}" cy="${b.y}" r="2.4" fill="${d.color}" class="unknown-star" aria-hidden="true"/>`;}
for(const {name,x,y,from,cls:endpoint} of relics){const ec=practice(endpoint).color;s+=`<line x1="${from.x}" y1="${from.y}" x2="${x}" y2="${y}" stroke="${ec}" class="thread thread-hint relic-thread" aria-hidden="true"/><g class="relic" data-relic="${endpoint.id}" style="--node-color:${ec}" role="img" aria-label="Associated item: ${name}"><title>${name} · associated item · claimed when ${endpoint.name} is mastered</title><circle cx="${x}" cy="${y}" r="22" class="awakened-ring"/>${glyph(x,y,ec,11)}${relics.length>1?`<text x="${x}" y="${y-44}" text-anchor="middle" class="node-label">${name.toUpperCase()}</text><text x="${x}" y="${y-29}" text-anchor="middle" class="relic-sub">ASSOCIATED ITEM</text>`:`<text x="${x+34}" y="${y-2}" class="node-label">${name.toUpperCase()}</text><text x="${x+34}" y="${y+14}" class="relic-sub">ASSOCIATED ITEM</text>`}</g>`;}
for(const p of layout.stars)if(known.has(p.cls.id))s+=starMarkup(p,practice(p.cls),glyph,'Select to inspect',p.cls.tier===4);
// Several items in one sky (Warden's) name themselves centred above their markers so neighbours never collide.
// Threads also fade behind names set below a star (a wide row of master classes), so no thread runs through a name.
s+=threadHoles(layout.stars.filter(p=>known.has(p.cls.id)).flatMap(p=>[{x:p.x,y:p.y,r:p.cls.tier===4?48:34},...(p.anchor==='middle'&&p.labelY>p.y?[{x:p.labelX,y:p.labelY-7,r:44}]:[])]));svg.innerHTML=s+'</g></g>';svg.dataset.structure=key;hydrateClassIcons(svg);}
svg.querySelectorAll('[data-star-class]').forEach(el=>{const activate=()=>onSelect(el.dataset.starClass);el.onclick=()=>{if(canSelect())activate();};el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();}};});
svg.querySelector('#universe').setAttribute('transform',`translate(${pan.x} ${pan.y}) translate(550 500) scale(${scale}) translate(-550 -500)`);
const states=new Map(layout.stars.map(p=>[p.cls.id,classState(p.cls,learned)])),lit=id=>['awakened','mastered'].includes(states.get(id));
svg.querySelectorAll('[data-star-class]').forEach(el=>{const state=states.get(el.dataset.starClass),selected=el.dataset.starClass===selectedClass.id;
el.classList.toggle('selected-node',selected);el.setAttribute('aria-pressed',String(selected));el.querySelector('.node-label').classList.toggle('label-active',selected);
for(const [name,on] of [['committed-node',lit(el.dataset.starClass)],['mastered-node',state==='mastered'],['available-node',state==='available'],['sealed-node',state==='sealed'],['unexplored-node',state==='unexplored']])el.classList.toggle(name,on);
el.setAttribute('aria-label',`${el.dataset.starName}, ${state}`);});
svg.querySelectorAll('[data-link-class]').forEach(el=>{el.classList.toggle('committed',threadWalked(el.dataset.linkFrom,el.dataset.linkClass,learned));el.classList.toggle('bright',el.dataset.linkClass===selectedClass.id);});
svg.querySelector('[data-self-thread]').classList.toggle('committed',lit(root.id));
// The aspect glyph behind the sky only twinkles and traces once the player has awakened a class in this calling.
svg.querySelector('.aspect-figure')?.classList.toggle('figure-lit',layout.stars.some(p=>lit(p.cls.id)));
svg.querySelectorAll('.relic').forEach(el=>el.classList.toggle('relic-claimed',isComplete(classes.find(c=>c.id===el.dataset.relic),learned)));
paintUnlockStars(svg,learned,id=>new Set([id]));}
