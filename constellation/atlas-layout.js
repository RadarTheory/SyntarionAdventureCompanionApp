// One astronomical composition. Selection never changes coordinates or the camera.
import {classes,disciplines,visibleClasses,starState,isComplete,classById,setupForClass,CLASS_COLORS} from './data.js';
import {classIconFor,hydrateClassIcons} from './class-icons.js';
import {practiceBadge} from './practice-icons.js';
export const homePan={x:0,y:0};
// Labels sit centred on one side of their star (level beside it, or centred above/below), 38 units out so they clear the awakened glow and every thread.
// Re-placed October 29 for the larger 21-unit star names; lines from The Self were then re-routed around them.
const regions={
magicka:{origin:{x:225,y:145},positions:[[135,440,0,-45,'middle'],[275,365,38,8,'start'],[205,270,0,-45,'middle'],[355,285,38,8,'start'],[100,220,-38,8,'end'],[330,510,38,8,'start'],[105,620,0,60,'middle'],[255,665,0,60,'middle']],edges:[[0,1],[1,2],[2,4],[2,3],[1,5],[0,6],[6,7],[5,7]]},
ingenium:{origin:{x:825,y:145},positions:[[740,450,-38,8,'end'],[900,390,38,8,'start'],[725,300,-38,8,'end'],[925,250,0,-45,'middle']],edges:[[0,1],[0,2],[2,3],[1,3]]},
// The fifth Nihimence slot is Null, the hidden star; it is drawn only once revealed.
nihimence:{origin:{x:875,y:538},positions:[[755,810,0,60,'middle'],[960,755,0,60,'middle'],[850,665,-38,8,'end'],[975,610,38,8,'start'],[1050,680,0,60,'middle']],edges:[[0,2],[2,1],[2,3]]},
praethacy:{origin:{x:525,y:205},positions:[[525,395,0,-45,'middle']],edges:[]}
};
export function sharedLayout(revealed,learned=[],nullOpen=true){return disciplines.filter(d=>revealed||d.id!=='praethacy').map(d=>{const region=regions[d.id];return {discipline:d,origin:region.origin,edges:region.edges,stars:visibleClasses(revealed,true,learned,nullOpen).filter(c=>c.discipline===d.id).map((cls,i)=>{const [x,y,dx,dy,anchor]=region.positions[i];return {cls,x,y,labelX:x+Math.sign(dx)*(Math.abs(dx)+8),labelY:y+(dy<-10?dy-7:dy>10?dy+8:dy),anchor};})};});}
export function connector(a,b,color,attributes=''){return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${color}" style="color:${color}" class="thread" ${attributes}/>`;}
// Shared star markup for the atlas and every calling's own constellation.
// `monument` draws an endpoint class: a larger symbol, standing glow and slow rays of light, with its unlock stars orbiting wider.
export function threadHoles(points){const big=7000;return `<defs><radialGradient id="thread-hole-fade"><stop offset="0" stop-color="#000"/><stop offset=".62" stop-color="#000"/><stop offset="1" stop-color="#fff"/></radialGradient>` +
`<mask id="thread-holes" maskUnits="userSpaceOnUse" x="-${big/2}" y="-${big/2}" width="${big}" height="${big}"><rect x="-${big/2}" y="-${big/2}" width="${big}" height="${big}" fill="#fff"/>${points.map(({x,y,r})=>`<circle cx="${x}" cy="${y}" r="${r}" fill="url(#thread-hole-fade)"/>`).join('')}</mask></defs>`;}
export function starMarkup(p,d,glyph,hint='Select to inspect',monument=false){const cls=p.cls,big=d.id==='praethacy'&&cls.tier===1,icon=monument?84:big?66:54;
const rays=monument?`<g class="endpoint-rays" aria-hidden="true">${Array.from({length:12},(_,i)=>{const a=i*Math.PI/6,r0=i%2?50:46,r1=i%2?62:74;return `<line x1="${(p.x+r0*Math.cos(a)).toFixed(1)}" y1="${(p.y+r0*Math.sin(a)).toFixed(1)}" x2="${(p.x+r1*Math.cos(a)).toFixed(1)}" y2="${(p.y+r1*Math.sin(a)).toFixed(1)}"/>`;}).join('')}</g>`:'';
return `<g class="star-node${monument?' endpoint-node':''}" data-star-class="${cls.id}" data-star-disc="${d.id}" style="--node-color:${d.color}"${monument?' data-ring="1.55"':''} role="button" tabindex="0" data-star-name="${cls.name}, ${d.name}" aria-label="${cls.name}, ${d.name}"><title>${cls.name} · ${cls.attribute} · ${hint}</title><circle cx="${p.x}" cy="${p.y}" r="${monument?48:32}" fill="transparent"/><circle cx="${p.x}" cy="${p.y}" r="31" class="selection-ring"/><circle cx="${p.x}" cy="${p.y}" r="${monument?60:37}" class="node-corona"/>${rays}<circle cx="${p.x}" cy="${p.y}" r="35" class="mastery-ring"/><circle cx="${p.x}" cy="${p.y}" r="30" class="awakened-ring"/><circle cx="${p.x}" cy="${p.y}" r="${big?10:7}" class="node-border"/><g class="stellar-core">${glyph(p.x,p.y,d.color,big?7:4)}</g>${classIconFor(cls)?`<image class="class-star-png" x="${p.x-icon/2}" y="${p.y-icon/2}" width="${icon}" height="${icon}" data-class-icon="${cls.id}" data-icon-color="${d.color}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"/>`:String()}<text x="${p.labelX}" y="${p.labelY}" text-anchor="${p.anchor}" class="node-label">${cls.name.toUpperCase()}</text></g>`;}
// One discipline-colored star per awakened node, orbiting its calling's star inside the glow (labels sit 36+ units out).
// Each kind has its own shape: a discipline level is an eight-ray star, a class ability a long four-ray sparkle, an ability type a six-point star;
// every one is turned to its own angle and carries a white core, so a player's abilities read at a glance.
const UNLOCK_SHAPES={levels:{points:8,size:5,inner:.42},abilities:{points:4,size:5.2,inner:.2},types:{points:6,size:4.2,inner:.5}};
const spin=id=>[...id].reduce((h,c)=>(h*31+c.charCodeAt(0))%360,7);
function rayStar(x,y,{points,size,inner},turn){let d='';for(let i=0;i<points*2;i++){const r=i%2?size*inner:size,a=(turn+i*180/points-90)*Math.PI/180;d+=`${i?'L':'M'}${(x+r*Math.cos(a)).toFixed(2)} ${(y+r*Math.sin(a)).toFixed(2)}`;}return d+'Z';}
// Stars already shown stay put; only nodes awakened since the page loaded pop in, once, in whichever view shows them first.
// `owners(starId)` says which classes feed a star.
let seenUnlocks=null;
export function paintUnlockStars(svg,learned,owners){seenUnlocks??=new Set(learned);for(const id of [...seenUnlocks])if(!learned.includes(id))seenUnlocks.delete(id);const popped=new Set();for(const g of svg.querySelectorAll('[data-star-class]')){const border=g.querySelector('.node-border'),cx=+border.getAttribute('cx'),cy=+border.getAttribute('cy'),feeds=owners(g.dataset.starClass),ring=+(g.dataset.ring||1);
const ids=learned.filter(id=>feeds.has(id.split(':')[0]));let group=g.querySelector('.unlock-stars');
if(!group){group=document.createElementNS('http://www.w3.org/2000/svg','g');group.setAttribute('class','unlock-stars');group.setAttribute('aria-hidden','true');group.style.transformOrigin=`${cx}px ${cy}px`;border.before(group);}
const shown=new Map([...group.children].map(el=>[el.dataset.node,el]));for(const [id,el] of shown)if(!ids.includes(id))el.remove();
ids.forEach((id,k)=>{if(shown.has(id))return;const angle=(-90+k*137.508)*Math.PI/180,r=(k%2?38:33)*ring,x=cx+r*Math.cos(angle),y=cy+r*Math.sin(angle),shape=UNLOCK_SHAPES[id.split(':')[2]]||UNLOCK_SHAPES.abilities;
const el=document.createElementNS('http://www.w3.org/2000/svg','g'),ray=document.createElementNS('http://www.w3.org/2000/svg','path'),core=document.createElementNS('http://www.w3.org/2000/svg','circle');ray.setAttribute('d',rayStar(x,y,shape,spin(id)));Object.entries({cx:x,cy:y,r:(shape.size*.24).toFixed(2),class:'unlock-core'}).forEach(([a,v])=>core.setAttribute(a,v));el.append(ray,core);el.dataset.kind=id.split(':')[2];
el.setAttribute('class',`unlock-star${seenUnlocks.has(id)?'':' pop'}`);popped.add(id);el.dataset.node=id;el.style.setProperty('--twinkle-delay',`-${(k*0.7)%3.5}s`);group.append(el);});}for(const id of popped)seenUnlocks.add(id);}
// The atlas sits a little lower than its coordinates so the Magic | Tech meter (top right) clears the Ingenium heading.
const ATLAS_DROP=60;
const SELF={x:515,y:835};
// Control points bend each Self→calling thread around other stars and labels; it lights once that calling holds an awakened star.
// Two numbers make a quadratic bend; four make a cubic one (Sage needs two bends to clear Magicka). Re-routed October 29 around the larger labels.
const selfBends={inquisitor:[325,638],zealot:[288,655],weaver:[280,580],druid:[540,520],sage:[420,735,235,400],mystic:[423,673],bard:[360,600],oneir:[385,750],scholar:[628,643],vanguard:[665,585],artificer:[560,480,520,460],alchemist:[720,543],rogue:[635,823],merchant:[732,765],fighter:[700,760],poet:[780,780],warden:[520,615],null:[790,750]};
function selfThread(p,d){const bend=selfBends[p.cls.id]||[(SELF.x+p.x)/2,(SELF.y+p.y)/2];return `<path d="M${SELF.x} ${SELF.y} ${bend.length===4?'C':'Q'}${bend.join(' ')} ${p.x} ${p.y}" fill="none" stroke="${d.color}" style="color:${d.color}" class="thread self-thread" data-self-thread="${p.cls.id}"/>`;}
function dust(d){const points=d.id==='praethacy'?[[445,335],[482,292],[570,312],[612,362],[578,478],[468,477]]:d.id==='magicka'?[[91,322],[367,415],[180,565],[360,611]]:d.id==='ingenium'?[[805,232],[841,325],[979,453]]:[[901,594],[1000,689],[817,768]];return `<g class="celestial-dust" aria-hidden="true">${points.map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="${i%3===0?2.1:1.3}" fill="${d.color}" opacity="${i%2?.45:.7}"/>`).join('')}</g>`;}
// Sealed stars stand where a hidden calling will appear (the veil at Psynth's spot, the Void at Null's); they appear only once their gate holds and open on click.
// Label offsets follow the audited labels of the stars they stand in for (Psynth's above, clearing a path for Artificer's thread; Null's below).
const SEALS={veil:{x:525,y:395,disc:'praethacy',label:'THE VEIL',dx:0,anchor:'middle',above:true},null:{x:1046,y:680,disc:'nihimence',label:'THE VOID',dx:0,anchor:'middle'}};
function sealMarkup(id,glyph){const {x,y,disc,label,dx,anchor,above}=SEALS[id],ly=above?y-70:anchor==='start'?y+8:y+60,py=above?y-44:ly+22,color=CLASS_COLORS[id]||disciplines.find(d=>d.id===disc).color;return `<g class="seal-node" data-seal="${id}" role="button" tabindex="0" style="--node-color:${color}"><title>${label} · sealed</title><circle cx="${x}" cy="${y}" r="30" fill="transparent"/><circle cx="${x}" cy="${y}" r="34" class="seal-glow"/><g class="seal-glyph">${glyph(x,y,color,10)}</g><text x="${x+dx}" y="${ly}" text-anchor="${anchor}" class="node-label seal-label">${label}</text><text x="${x+dx}" y="${py}" text-anchor="${anchor}" class="seal-progress"></text></g>`;}
export function renderSharedMap({svg,revealed,selectedClass,disciplineId,learned,scale,pan,onSelect,onEnter,onReveal=()=>{},seals=[],nullOpen=true,canSelect,backgroundStars,glyph}){
const layout=sharedLayout(revealed,learned,nullOpen),key=layout.map(c=>`${c.discipline.id}:${c.stars.length}`).join('|')+'|'+seals.map(x=>x.id).join(',');
if(svg.dataset.structure!==key){
let s=`<defs><filter id="glow"><feGaussianBlur stdDeviation="5"/></filter><radialGradient id="core"><stop stop-color="#d8d7ae" stop-opacity=".1"/><stop offset="1" stop-color="#d8d7ae" stop-opacity="0"/></radialGradient>${disciplines.map(d=>`<radialGradient id="mist-${d.id}"><stop stop-color="${d.color}" stop-opacity=".09"/><stop offset=".6" stop-color="${d.color}" stop-opacity=".025"/><stop offset="1" stop-color="${d.color}" stop-opacity="0"/></radialGradient>`).join('')}</defs>${backgroundStars()}<g class="atlas-drop" transform="translate(0 ${ATLAS_DROP})"><g id="universe">`;
s+=`<circle cx="515" cy="835" r="75" fill="url(#core)"/><circle cx="515" cy="835" r="24" class="orbit"/><circle cx="515" cy="835" r="31" class="orbit"/><g class="focus-origin">${glyph(515,835,'#b9bea9',13)}</g><text x="515" y="886" class="origin-label" text-anchor="middle">THE SELF</text>`;
for(const {discipline:d,origin:o,edges,stars} of layout){
s+=`<g class="cluster" data-cluster="${d.id}" style="--node-color:${d.color}"><ellipse cx="${d.id==='praethacy'?525:o.x}" cy="${d.id==='praethacy'?395:o.y+200}" rx="${d.id==='magicka'?230:180}" ry="${d.id==='magicka'?300:210}" fill="url(#mist-${d.id})" class="region-mist" aria-hidden="true"/>`;
for(const [a,b] of edges)s+=connector(stars[a],stars[b],d.color,`data-link-class="${stars[b].cls.id}" data-link-from="${stars[a].cls.id}"`);
s+=dust(d);
// Unnamed dust and orbital traces are atmosphere, never new classes or abilities.
if(d.id==='praethacy')s+=`<g aria-hidden="true" class="praethacy-halo"><ellipse cx="525" cy="395" rx="67" ry="88" transform="rotate(28 525 395)"/><path d="M445 335L482 292L570 312M612 362L578 478L468 477"/></g>`;
s+=practiceBadge(d,o);s+=`<text x="${o.x}" y="${o.y}" text-anchor="middle" class="cluster-label" fill="${d.color}">${d.name.toUpperCase()}</text><text x="${o.x}" y="${o.y+28}" text-anchor="middle" class="cluster-sub">${d.action.toUpperCase()} · ${d.principle.toUpperCase()}</text>`;
for(const p of stars)s+=starMarkup(p,setupForClass(p.cls),glyph,'Select to inspect · select again to enter its constellation');
s+='</g>';}
for(const seal of seals)s+=sealMarkup(seal.id,glyph);
// Self threads sit beneath every cluster so stars and labels always draw over them.
s=s.replace('<g class="cluster"',`${layout.flatMap(({discipline:d,stars})=>stars.map(p=>selfThread(p,setupForClass(p.cls)))).join('')}<g class="cluster"`);
s+=threadHoles(layout.flatMap(({discipline:d,stars})=>stars.map(p=>({x:p.x,y:p.y,r:d.id==='praethacy'&&p.cls.tier===1?40:34}))));
svg.innerHTML=s+'</g></g>';svg.dataset.structure=key;hydrateClassIcons(svg);
}
svg.querySelectorAll('[data-star-class]').forEach(el=>{const activate=()=>{const id=el.dataset.starClass;if(id===(selectedClass.rootId||selectedClass.id))onEnter(id);else onSelect(id);};el.onclick=()=>{if(canSelect())activate();};el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();}};});
svg.querySelector('#universe').setAttribute('transform',`translate(${pan.x} ${pan.y}) translate(550 500) scale(${scale}) translate(-550 -500)`);
svg.querySelectorAll('[data-cluster]').forEach(el=>el.classList.toggle('cluster-selected',el.dataset.cluster===disciplineId));
const selectedId=selectedClass.rootId||selectedClass.id;
svg.querySelectorAll('[data-star-class]').forEach(el=>{const selected=el.dataset.starClass===selectedId;el.classList.toggle('selected-node',selected);el.setAttribute('aria-pressed',String(selected));el.querySelector('.node-label').classList.toggle('label-active',selected);});
svg.querySelectorAll('[data-link-class]').forEach(el=>el.classList.toggle('bright',el.dataset.linkClass===selectedId));
// Committed stars keep their glow and threads regardless of the current selection; advanced-class unlocks light their root star.
const states=new Map([...svg.querySelectorAll('[data-star-class]')].map(el=>[el.dataset.starClass,starState(el.dataset.starClass,learned)]));
const committed=new Set([...states].filter(([,state])=>state==='awakened').map(([id])=>id));
svg.querySelectorAll('[data-star-class]').forEach(el=>{const state=states.get(el.dataset.starClass);el.classList.toggle('committed-node',state==='awakened');el.classList.toggle('mastered-node',isComplete(classById(el.dataset.starClass),learned));el.classList.toggle('available-node',state==='available');el.classList.toggle('unexplored-node',state==='unexplored');el.setAttribute('aria-label',`${el.dataset.starName}, ${state}`);});
svg.querySelectorAll('[data-link-class]').forEach(el=>el.classList.toggle('committed',committed.has(el.dataset.linkClass)&&committed.has(el.dataset.linkFrom)));
svg.querySelectorAll('[data-self-thread]').forEach(el=>el.classList.toggle('committed',committed.has(el.dataset.selfThread)));
// On the atlas a calling's star gathers every unlock made anywhere in its family.
for(const seal of seals){const el=svg.querySelector(`[data-seal="${seal.id}"]`);if(!el)continue;el.classList.toggle('seal-ready',seal.ready);el.querySelector('.seal-progress').textContent=seal.ready?'REVEAL':seal.progress;el.setAttribute('aria-label',`${SEALS[seal.id].label}, ${seal.ready?'ready to reveal':`sealed, ${seal.hint||seal.progress}`}`);el.querySelector('title').textContent=`${SEALS[seal.id].label} · ${seal.ready?'select to reveal':seal.hint||seal.progress}`;el.onclick=()=>{if(canSelect())onReveal(seal.id);};el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onReveal(seal.id);}};}
paintUnlockStars(svg,learned,rootId=>new Set(classes.filter(c=>(c.rootId||c.id)===rootId).map(c=>c.id)));
}


