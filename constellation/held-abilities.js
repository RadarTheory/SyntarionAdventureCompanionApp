// "Your abilities": the drawer's default view when Syntarion hosts the constellation and the character can use abilities
// (user, 2026-11-16). It lists every ability the character holds, grouped by class, ready to use; choosing one held at more
// than one level asks which level to use, with the practice's own verb (Cast, Deploy, Enact, Engage).
// Selecting a star on the sky switches the drawer to that class (buying); "Your abilities" in its head comes back here.
// The host pays and rolls: a use posts {type:'use', classId, abilityKey, level, levelName}; Syntarion spends the trait pool
// (half the level, rounded up) and answers {type:'used', ok, message}.
import {classes,abilityEntries,setupForClass,traitFor} from './data.js';
import {classPortrait,hydrateClassIcons} from './class-icons.js';
import {practiceSymbol} from './practice-icons.js';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Mirrors Syntarion's costOfUse (src/constellationAbilities.js): 1 at the first two levels, 2 at the next two, 3 at the top.
export const useCost=level=>Math.max(1,Math.ceil((Number(level)||1)/2));

// Every held ability, grouped by class, at the levels the character holds.
export function heldAbilities(learned){const held=new Set(learned);const groups=[];
for(const cls of classes){const entries=abilityEntries(cls,'abilities').map(e=>({...e,owned:e.nodes.filter(n=>held.has(n.id))})).filter(e=>e.owned.length);
if(entries.length)groups.push({cls,setup:setupForClass(cls),trait:traitFor(cls),entries});}
return groups;}

// open: the ability key whose level choice is showing. pools: {traitKey:{pool,max}} from the host.
export function renderHeld(el,{learned,pools={},open=null,busy=null,onOpen,onUse,onClose}){
const groups=heldAbilities(learned);
el.style.setProperty('--accent','#c4b389');el.classList.remove('long-text');
const poolLine=g=>{const key=g.trait?.trait.toLowerCase(),p=key&&pools[key];return p?`<small class="held-pool" style="color:${g.setup.color}">${esc(g.trait.trait.toUpperCase())} ${p.pool} / ${p.max}</small>`:'';};
const body=groups.length?groups.map(g=>`<section class="held-group" style="--accent:${g.setup.color}"><header><span class="held-symbol">${classPortrait(g.cls,g.setup.color,practiceSymbol(g.setup))}</span><span><b>${esc(g.cls.name.toUpperCase())}</b><small>${esc(g.setup.name)} · ${esc(g.cls.attribute)}</small></span>${poolLine(g)}</header>
${g.entries.map(e=>{const key=g.trait?.trait.toLowerCase(),pool=key&&pools[key]?pools[key].pool:Infinity,verb=g.setup.action||'Use',top=e.owned.length,single=top===1,isOpen=open===e.key,isBusy=busy===e.key;
const ladder=`<span class="held-ladder" aria-label="${top} of ${e.nodes.length} levels held">${e.nodes.map(n=>`<i class="${e.owned.includes(n)?'held':''}"></i>`).join('')}</span>`;
const levels=isOpen&&!single?`<div class="held-levels" role="group" aria-label="${esc(verb)} ${esc(e.name)} at which level?"><p>${esc(verb)} ${esc(e.name)} at which level?</p>${e.owned.map((n,i)=>{const lv=i+1,cost=useCost(lv),short=pool<cost;return `<button type="button" data-use-level="${lv}" data-use-name="${esc(n.levelName)}" ${short||busy?'disabled':''} title="${esc(n.description||'')}"><b>${esc(n.levelName.toUpperCase())}</b><small>${cost} ${esc(g.trait?.trait||'')}${short?' · not enough':''}</small></button>`;}).join('')}</div>`:'';
const firstCost=useCost(1),short=single&&pool<firstCost;
return `<div class="held-item ${isOpen?'is-open':''}" data-held="${esc(e.key)}" data-held-class="${g.cls.id}"><div class="held-row"><span class="held-name"><b>${esc(e.name.toUpperCase())}</b>${ladder}<small>${esc(e.owned.at(-1).levelName.toUpperCase())}</small></span>
<button type="button" class="held-use" data-held-use ${short||isBusy?'disabled':''}>${isBusy?'…':single?`${esc(verb)} <small>${firstCost}</small>`:isOpen?'Close':`${esc(verb)} ▾`}</button></div>
<p class="held-desc">${esc(e.owned.at(-1).description||e.description||'')}</p>${levels}</div>`;}).join('')}</section>`).join('')
:`<p class="empty held-empty">No abilities held yet. Select a star on the sky to awaken its first abilities.</p>`;
el.innerHTML=`<div class="panel-title drawer-head held-head"><div class="drawer-titles"><p class="eyebrow colored">READY TO USE</p><h2>Your abilities</h2><p class="doctrine-kind">Choose an ability to use it · pools refill on a long rest</p></div><button type="button" class="drawer-close" id="drawer-close" aria-label="Close the panel">×</button></div><div class="held-list">${body}</div>`;
hydrateClassIcons(el);
el.querySelector('#drawer-close').onclick=onClose;
for(const item of el.querySelectorAll('[data-held]')){const key=item.dataset.held,cls=item.dataset.heldClass,g=groups.find(x=>x.cls.id===cls),e=g?.entries.find(x=>x.key===key);if(!e)continue;
item.querySelector('[data-held-use]').onclick=()=>{if(e.owned.length===1)onUse({classId:cls,abilityKey:key,level:1,levelName:e.owned[0].levelName,name:e.name});else onOpen(open===key?null:key);};
for(const b of item.querySelectorAll('[data-use-level]'))b.onclick=()=>onUse({classId:cls,abilityKey:key,level:+b.dataset.useLevel,levelName:b.dataset.useName,name:e.name});}
}
