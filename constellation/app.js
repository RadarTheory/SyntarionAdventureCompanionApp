import {renderSharedMap,homePan} from './shared-map.js';
import {renderCallingMap} from './calling-layout.js';
import {classPortrait,hydrateClassIcons} from './class-icons.js';
import {practiceSymbol} from './practice-icons.js';
import {disciplines,classes,roots,attributes,abilityEntries,classLevelNodes,buyVerb,visibleClasses,restoreSelection,setupForClass,praethacyEligibility,nullRevealed,canLearn,classById,classKnown,isMastered,isComplete,reachableNodes,awakenedCount,masteredClasses,unlockRequirement,repairLearned,spentPoints,nodeCost,blockReason,nextParent,magicTechAxis,AXIS_LIMIT,MASTERY,STARTING_POINTS,CALLING_LORE,ASPECT_LORE,traitFor} from './data.js';
import {DEV_MODE,setStartingPoints} from './config.js';
import {HOSTED,PICKING,hostInit,hostSave,hostPick,hostUse,onHostReply} from './host.js';
import {renderHeld} from './held-abilities.js';
import {aspectForClass,doctrineGroups,hopeAspect} from './doctrine.js';
import {snapshot,play,tickPoints,masteryTitle,holdToConfirm,dive,chargeThread,unveil} from './ceremony.js';
const $=s=>document.querySelector(s);
const motion=()=>document.documentElement.dataset.motion!=='off';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Inside Syntarion the character's build and AP come from the parent page; only view state (open sky, selection) stays on the device.
// The class declared at character creation: highlighted on the sky, and where a fresh build opens. Opening it is the player's purchase like any other.
let declared=null;const declare=id=>{declared=roots.find(r=>r.id===id&&!r.secret&&!r.hidden)?.id||null;let style=document.getElementById('declared-style');if(!style){style=document.createElement('style');style.id='declared-style';document.head.append(style);}
style.textContent=declared?`[data-star-class="${declared}"] .node-corona{visibility:visible!important;opacity:.34;animation:psynth-breathe 5.5s ease-in-out infinite}[data-motion="off"] [data-star-class="${declared}"] .node-corona{animation:none}`:'';};
const hosted=await hostInit(update=>{hostState.usable=update.usable;hostState.pools=update.pools;declare(update.startingCalling);setStartingPoints(update.available+spentPoints(learned));render();});
if(HOSTED)document.documentElement.classList.add('hosted');if(PICKING)document.documentElement.classList.add('picking');
const storageKey=hosted?`syntarion-atlas-host-${hosted.characterId??'character'}`:'syntarion-atlas-v1';
let saved={};try{if(!PICKING)saved=JSON.parse(localStorage.getItem(storageKey)||'{}')||{};}catch{}
if(hosted){declare(hosted.startingCalling);const held=repairLearned(hosted.learned,Infinity);saved.learned=held;setStartingPoints(hosted.available+spentPoints(held));
if(declared&&!saved.classId){saved.classId=declared;if(!PICKING)saved.calling=declared;}}
let learned=repairLearned(saved.learned);
let reported={spent:spentPoints(learned),axis:magicTechAxis(learned).value,key:JSON.stringify(learned)};
let {revealed,selectedClass,disciplineId}=restoreSelection(saved,learned);
// Null's seal is opened by the player once its gate holds, like Praethacy's veil.
let nullOpen=saved.nullOpen===true&&nullRevealed(learned);
// The open calling's own constellation, or null for the atlas of every calling.
let calling=visibleClasses(revealed,true,learned,nullOpen).find(r=>r.id===saved.calling)?.id||null;
if(!classKnown(selectedClass,learned))selectedClass=classById(selectedClass.rootId);
// The drawer's view: 'held' (the character's abilities, ready to use; the default when the host can use them) or 'class' (the selected star, for buying).
const hostState={usable:!!hosted?.usable&&!PICKING,pools:hosted?.pools||{}};const heldOn=()=>!!hosted&&!PICKING&&hostState.usable;
let drawerView=heldOn()?'held':'class',heldOpen=null,heldBusy=null;
let category='levels',selectedAbility=null,scale=1,pan={...homePan},drag=null,moved=false;
const d=()=>disciplines.find(x=>x.id===disciplineId);
const revealedDescription='Beyond what is known, explore what may yet be.';
function save(){if(PICKING)return;if(hosted){const key=JSON.stringify(learned);if(key!==reported.key){const spent=spentPoints(learned),axis=magicTechAxis(learned).value;hostSave({learned,spentDelta:spent-reported.spent,magicTechDelta:axis-reported.axis});reported={spent,axis,key};}}
try{localStorage.setItem(storageKey,JSON.stringify({...(hosted?{}:{learned}),revealed,nullOpen,classId:selectedClass.id,disciplineId,calling}));}catch{if(!hosted)notify('Device storage is unavailable. This build will last for this session.');}}
// A toast can carry one action (Undo); it then stays a little longer.
let toastTimer;function notify(message,action){const t=$('#toast');t.textContent=message;if(action){const b=document.createElement('button');b.type='button';b.className='toast-action';b.textContent=action.label;b.onclick=()=>{t.classList.remove('show');action.run();};t.append(b);}t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),action?6000:3000);}
// The last purchase can be taken back (toast Undo or Ctrl+Z) while it is still held.
let lastBuy=null;const apLeft=()=>STARTING_POINTS-spentPoints(learned);
const nextPaths=cls=>classes.filter(c=>c.parentIds?.includes(cls.id));
// The drawer opens only for a class the player has awakened; until then the sky's corner offers its first purchase.
const awakened=cls=>learned.some(id=>id.startsWith(`${cls.id}:`));
function undo(){if(!lastBuy||!learned.includes(lastBuy.id))return;const {id,name,cost}=lastBuy,ap=apLeft();lastBuy=null;learned=repairLearned(learned.filter(x=>x!==id));save();render();tickPoints($('#points'),ap,apLeft());notify(`${name} returned · ${cost} AP refunded`);}
// In pick mode, choosing any class on a line picks that line's calling; it then glows as the declared one.
function pick(cls){if(!PICKING||!cls)return;const root=cls.rootId?classById(cls.rootId):cls;if(!root||root.secret||root.hidden)return;declare(root.id);hostPick(root.id);}
function setClass(cls){if(!cls||!visibleClasses(revealed,false,learned,nullOpen).includes(cls)||!classKnown(cls,learned))return;selectedClass=cls;drawerView='class';pick(cls);drawerOpen=awakened(cls);if(!drawerOpen)category='levels';disciplineId=cls.discipline;selectedAbility=null;if(cls.rootId||calling)openCalling(cls.rootId||cls.id);save();render();}
// Opening or leaving a calling recentres the camera; selecting within a sky never moves it.
function openCalling(id){if(calling!==id){calling=id;scale=1;pan={...homePan};}}
// Entering a calling dives the camera into its star; leaving pulls back out to the atlas. `then` runs once the new sky has settled.
let diving=false;
// The wizard's sky dives into a calling just as the campaign's does (user, 2026-11-16); go() still picks it for the wizard.
function enterCalling(id,then){if(diving)return;const go=()=>{const root=classById(id);openCalling(id);pick(root);if((selectedClass.rootId||selectedClass.id)!==id){selectedClass=root;disciplineId=root.discipline;selectedAbility=null;}drawerOpen=awakened(selectedClass);if(!drawerOpen)category='levels';save();render();};if(calling===id){go();return then?.();}diving=true;dive($('#stars'),$(`#stars [data-star-class="${id}"]`),go).finally(()=>{diving=false;then?.();});}
function leaveCalling(){if(diving)return;diving=true;dive($('#stars'),null,()=>{calling=null;scale=1;pan={...homePan};save();render();},{out:true}).finally(()=>diving=false);}
// Praethacy's reveal lives on the sky: the sealed veil star reveals it once the gate is met; afterwards the map toolbar offers Close the veil.
function openSeal(id){if(id==='veil')return revealPraethacy();if(!nullRevealed(learned)){const n=masteredClasses(learned).filter(c=>c.discipline==='nihimence'&&!c.parentIds&&!c.secret).length;return notify(`The void holds · ${Math.min(n,2)}/2 Nihimence classes have opened their paths`);}nullOpen=true;revealCeremony('null','void','✦ The void opens ✦','The hidden Nihimence class reveals itself');}
// Seals stay off the sky until their gate holds (user: they shouldn't appear before the conditions are met).
function sealProgress(){const gate=praethacyEligibility(learned),n=masteredClasses(learned).filter(c=>c.discipline==='nihimence'&&!c.parentIds&&!c.secret).length;return [...(revealed?[]:[{id:'veil',ready:gate.eligible,progress:`${Math.min(gate.combined,3)}/3 + ${Math.min(gate.magicka,3)}/3`,hint:`${Math.min(gate.combined,3)}/3 Ingenium + Nihimence unlocks · ${Math.min(gate.magicka,3)}/3 Magicka unlocks`}]),...(nullOpen?[]:[{id:'null',ready:nullRevealed(learned),progress:`${Math.min(n,2)}/2`,hint:`${Math.min(n,2)}/2 Nihimence classes have opened their paths`}])].filter(s=>s.ready);}
function revealPraethacy(){const gate=praethacyEligibility(learned);if(!gate.eligible)return notify(`The veil holds · ${Math.min(gate.combined,3)}/3 Ingenium + Nihimence · ${Math.min(gate.magicka,3)}/3 Magicka`);revealed=true;revealCeremony('warden','veil','✦ The veil parts ✦','Praethacy, the hidden practice, is revealed');}
// A hidden calling's reveal: the seal tears open (or collapses), the star rises through, and its symbol is set on the sky.
function revealCeremony(id,kind,eyebrow,sub){const svg=$('#stars'),seal=svg.querySelector(`[data-seal="${kind==='veil'?'veil':'null'}"] .seal-glyph`),before=snapshot(svg),cls=classById(id),color=setupForClass(cls).color;
const at=seal?.closest('[data-seal]')?.querySelector('circle');const x=+(at?.getAttribute('cx')||0),y=+(at?.getAttribute('cy')||0);
setClass(cls);if(!at)return;const wait=unveil($('#stars'),{x,y,color,kind});const star=$(`#stars [data-star-class="${id}"]`);
if(star&&motion()){star.style.opacity='0';setTimeout(()=>{star.style.opacity='';play($('#stars'),before,{starId:id,rootId:id,mastered:true});},wait);}
masteryTitle($('#map'),{eyebrow,name:cls.name,color,sub,icon:classPortrait(cls,color,practiceSymbol(setupForClass(cls))),hydrate:hydrateClassIcons});}
function renderVeil(){const close=$('#veil-toggle');close.hidden=!revealed;close.onclick=()=>{revealed=false;if(calling==='warden')calling=null;setClass(selectedClass.hidden?classById('weaver'):selectedClass);};}
// The selected constellation is a drawer: it slides in from the right when a star is chosen and recedes when closed.
let drawerOpen=false;function setDrawer(open){drawerOpen=open;$('.workspace').classList.toggle('drawer-open',open);$('#drawer-tab').setAttribute('aria-expanded',String(open));$('#drawer-tab').textContent=`‹ ${drawerView==='held'&&heldOn()?'Your abilities':selectedClass.name}`;if(open)$('#details').scrollTop=0;}
const line=(a,b,color,bright=false)=>`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${color}" style="color:${color}" class="thread ${bright?'bright':''}"/>`;
function star(x,y,r,color){return `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;}
function glyph(x,y,color,size=14){return `<path d="M ${x} ${y-size} L ${x+size*.38} ${y-size*.38} L ${x+size} ${y} L ${x+size*.38} ${y+size*.38} L ${x} ${y+size} L ${x-size*.38} ${y+size*.38} L ${x-size} ${y} L ${x-size*.38} ${y-size*.38} Z" fill="${color}"/>`;}
function backgroundStars(){let s='';for(let i=0;i<175;i++){const x=(Math.sin(i*127.1)*43758.5453)%1*1100;const y=(Math.cos(i*311.7)*19642.349)%1*1000;s+=`<circle class="cosmic-star" cx="${Math.abs(x)}" cy="${Math.abs(y)}" r="${i%13===0?1.5:.75}" fill="${i%13===0?'#d9e4d8':'#899d96'}" style="--twinkle-duration:${4+i%9}s;--twinkle-delay:-${i%17}s"/>`;}return s;}
function renderMap(){
$('#map-count').textContent='ONE SKY. EVERY DISCIPLINE';
$('#overview').classList.toggle('active',!calling);$('#focus').classList.toggle('active',!!calling);
$('#map').style.setProperty('--map-color','#96b7bc');$('#to-atlas').hidden=!calling;
const legend=calling?[['available','Available'],['awakened','Awakened'],['mastered','Mastered'],['sealed','Sealed']]:[['available','Available'],['awakened','Awakened'],['mastered','Mastered'],['','Unexplored']];$('.map-legend').innerHTML=legend.map(([c,label])=>`<span><i class="${c}"></i> ${label}</span>`).join('');
if(calling){const root=classById(calling),family=classes.filter(c=>c.id===root.id||c.rootId===root.id);$('#map-title').textContent=`${root.name}'s constellation`;$('.map-caption').classList.remove('atlas-caption');$('#map-count').textContent=`${family.filter(c=>classKnown(c,learned)).length} OF ${family.length} STARS KNOWN`;renderCallingMap({svg:$('#stars'),root,selectedClass,learned,scale,pan,onSelect:id=>setClass(classById(id)),canSelect:()=>!moved,backgroundStars,glyph});}
else{// On the atlas the heading is just THE CELESTIAL ATLAS, set larger; a calling's sky names its constellation beneath it.
$('#map-title').textContent='';$('.map-caption').classList.add('atlas-caption');renderSharedMap({svg:$('#stars'),revealed,selectedClass,disciplineId,learned,scale,pan,onSelect:id=>setClass(classById(id)),onEnter:enterCalling,onReveal:openSeal,seals:sealProgress(),nullOpen,canSelect:()=>!moved,backgroundStars,glyph});}
// Re-rendering replaces the Saga tiles (so a focused tile never blurs) and may rebuild the stars: only a pinned aspect survives a render.
highlightAspect(sagaPinned);$('#zoom-value').textContent=`${Math.round(scale*100)}%`;
}
// "Class abilities" opens the selected calling's own constellation and moves focus to its abilities.
function inspectAbilities(){enterCalling(selectedClass.rootId||selectedClass.id,()=>{const list=$('#details .ability-list');list.tabIndex=-1;list.focus({preventScroll:true});});}
// The class's own discipline levels come first; each ability is one row that is bought again at every level the class holds (Mote Vehem, then Charm Vehem…).
function panelRows(cls,disc){if(category==='levels')return classLevelNodes(cls).map(n=>({key:n.id,name:n.name,nodes:[n],next:learned.includes(n.id)?null:n,owned:learned.includes(n.id)?[n]:[],level:true}));
return abilityEntries(cls,category).map(e=>{const owned=e.nodes.filter(n=>learned.includes(n.id));return {key:e.key,name:e.name,nodes:e.nodes,next:e.nodes.find(n=>!learned.includes(n.id))||null,owned};});}
function renderHeldDrawer(){renderHeld($('#details'),{learned,pools:hostState.pools,open:heldOpen,busy:heldBusy,onOpen:key=>{heldOpen=key;renderDetails();},onUse:use=>{if(heldBusy)return;heldBusy=use.abilityKey;hostUse(use);renderDetails();},onClose:()=>setDrawer(false)});
$('#hud-awaken').hidden=true;$('#drawer-tab').hidden=false;$('#dock').innerHTML=`<button type="button" class="dock-info" id="dock-info"><small>READY TO USE</small><b>YOUR ABILITIES</b></button>`;$('#dock-info').onclick=()=>setDrawer(true);setDrawer(drawerOpen);}
function renderDetails(){if(drawerView==='held'&&heldOn())return renderHeldDrawer();const disc=setupForClass(selectedClass),rows=panelRows(selectedClass,disc);// What can be bought right now is highlighted, and unless the player picked a row, the first of those is selected.
const buyable=r=>!!r.next&&canLearn(r.next,learned);const row=rows.find(r=>r.key===selectedAbility)||rows.find(buyable)||rows[0]||null;selectedAbility=row?.key||null;const node=row?(row.next||row.nodes.at(-1)):null;
const complete=!!row&&!row.next,available=!!node&&canLearn(node,learned),blocked=node&&!complete?blockReason(node,learned):null,sealed=unlockRequirement(selectedClass,learned),count=awakenedCount(selectedClass,learned);
const parent=nextParent(selectedClass,learned),reachNodes=reachableNodes(selectedClass),reach=reachNodes.length,reachHeld=reachNodes.filter(n=>learned.includes(n.id)).length,done=isComplete(selectedClass,learned),paths=nextPaths(selectedClass).length>0;
// One line per row, names in capitals: the tab already says what kind of thing it is, so a row only states what the player holds.
const rowState=r=>r.level?(r.owned.length?'LEARNED':''):r.owned.length?r.owned.at(-1).levelName.toUpperCase():'';
const rowHtml=r=>`<button data-detail-ability="${r.key}" class="ability-item ${r.key===row.key?'selected-ability':''} ${buyable(r)?'can-buy':r.owned.length?'is-learned':'is-locked'}"><span class="ability-icon">${r.owned.length?'✦':'✧'}</span><span class="row-name">${esc(r.name.toUpperCase())}</span><small class="row-state">${esc(rowState(r))}</small><b>${r.next?`${nodeCost(r.next,learned)} AP`:'✦'}</b></button>`;
const empty='No class abilities are recorded for this class yet.';
// What an ability draws on: its line's row of the character sheet's Magic | Tech table. Amounts are not decided yet.
const trait=traitFor(selectedClass),consumes=row&&!row.level&&trait?`<p class="consumes" title="${esc(trait.column)} · ${esc(trait.discipline)}"><span>Consumes</span> <b>${esc(trait.trait.toUpperCase())}</b> <small>${esc(trait.column)} · ${esc(trait.discipline)}</small></p>`:'';
const ladder=row&&!row.level?`<p class="level-ladder" role="img" aria-label="${row.owned.length} of ${row.nodes.length} levels of ${esc(row.name)} learned">${row.nodes.map(n=>`<span class="${learned.includes(n.id)?'held':''}" title="${esc(n.levelName.toUpperCase())}"></span>`).join('')}</p>`:'';
const description=node?`<div class="ability-description">${node.archive?'<span class="eyebrow">FROM THE SYNTARION ARCHIVE</span>':''}<div class="description-head"><h3>${esc((complete&&!row.level?row.name:node.name).toUpperCase())}</h3>${ladder}</div><p class="description-text">${esc(node.description)}</p>${consumes}${complete?`<button class="awaken" id="awaken" disabled>✦ Learned</button>`:blocked?`<button class="awaken blocked" id="awaken" disabled>${esc(blocked.message)}</button>`:`<button class="awaken" id="awaken" ${!available?'disabled':''}>${buyVerb(selectedClass)} ${esc(node.name.toUpperCase())} <span>${nodeCost(node,learned)} AP${nodeCost(node,learned)>node.cost?' · first in class':''} ↗</span></button>`}${parent?`<button id="go-parent" class="explore go-parent">Go to ${esc(parent.name)} · ${Math.min(awakenedCount(parent,learned),MASTERY)} / ${MASTERY} toward new paths <span>↗</span></button>`:''}</div>`:`<p class="empty-list">${empty}</p>`;
$('#details').style.setProperty('--accent',disc.color);// The drawer fits one screen: who this is, how far along, what to buy, what it does.
$('#details').classList.toggle('long-text',(node?.description?.length||0)>320);
$('#details').innerHTML=`<div class="panel-title drawer-head"><div class="detail-emblem">${classPortrait(selectedClass,disc.color,practiceSymbol(disc))}</div><div class="drawer-titles"><p class="eyebrow colored">${disc.name.toUpperCase()} / ${selectedClass.attribute.toUpperCase()}</p><h2>${selectedClass.name}</h2><p class="doctrine-kind">${aspectForClass(selectedClass)?.glyph?`<span class="aspect-glyph colored" style="--glyph:url('${aspectForClass(selectedClass).glyph}')" aria-hidden="true"></span>`:''}${aspectForClass(selectedClass)?.kind||(selectedClass.secret?'Hidden class':disc.title)}</p></div></div><p class="detail-summary">${esc(aspectForClass(selectedClass)?.description||selectedClass.summary||revealedDescription)}</p><div class="mastery ${done?'is-mastered':''}"><span>${done?`✦ ${esc(selectedClass.name)} · Discipline Mastered`:`Mastery ${reachHeld} / ${reach}`}</span><small>${done?'':paths&&count<MASTERY?`${MASTERY-count} more to open new paths`:paths?'New paths opened':'Learn everything to master'}</small><i style="--fill:${reach?reachHeld/reach:0}"></i></div>${sealed&&!node?`<p class="requirement sealed-note">Sealed · ${esc(sealed)}</p>`:''}<div class="category-tabs" role="group" aria-label="Drawer section">${[['levels','Levels'],['abilities','Abilities']].map(([id,title])=>`<button data-category="${id}" class="${category===id?'active':''}" aria-pressed="${category===id}">${title}</button>`).join('')}</div><div class="ability-list">${rows.map(rowHtml).join('')}</div>${description}`;
// The purchase button is pinned to the drawer's foot so it is never scrolled out of reach or cut off.
if($('#awaken')){const foot=document.createElement('div');foot.className='drawer-action';foot.append($('#awaken'));$('#details').append(foot);}
hydrateClassIcons($("#details"));document.querySelectorAll('[data-category]').forEach(b=>b.onclick=()=>{category=b.dataset.category;selectedAbility=null;renderDetails();renderMap();});document.querySelectorAll('[data-detail-ability]').forEach(b=>b.onclick=()=>{selectedAbility=b.dataset.detailAbility;renderDetails();renderMap();});// Buying is a ceremony: the thread draws in, the star ignites, AP counts down. Three moments also set a title on the sky:
// the first purchase (Discipline unlocked), the third when it opens subclasses (NEW PATH, with the symbols of the classes it opens), and the last (Discipline Mastered).
const buy=()=>{if(!node||!canLearn(node,learned)||diving)return;const home=selectedClass.rootId||selectedClass.id;if(calling!==home)return enterCalling(home,()=>setTimeout(purchase,motion()?180:0));purchase();};
const purchase=()=>{if(!canLearn(node,learned))return;const cls=selectedClass,wasFirst=awakenedCount(cls,learned)===0,wasMastered=isMastered(cls,learned),wasComplete=isComplete(cls,learned),hadNull=nullRevealed(learned),cost=nodeCost(node,learned),before=snapshot($('#stars')),ap=apLeft();learned.push(node.id);lastBuy={id:node.id,name:node.name,cost};selectedAbility=null;save();render();
const completed=!wasComplete&&isComplete(cls,learned),next=nextPaths(cls),opened=!wasMastered&&isMastered(cls,learned)&&next.length>0,root=classById(cls.rootId||cls.id);tickPoints($('#points'),ap,apLeft());play($('#stars'),before,{starId:cls.id,rootId:root.id,mastered:completed||opened});
const moment=completed?{eyebrow:'✦ Discipline Mastered ✦',sub:cls.tier===4&&cls.item?`${cls.item} claimed · every ability learned`:'Every ability learned'}:opened?{eyebrow:'',name:'New Path',color:setupForClass(next[0]).color,sub:next.map(c=>c.name).join(' · '),icon:`<div class="mastery-symbols">${next.map(c=>{const col=setupForClass(c).color;return `<span style="--title-color:${col}">${classPortrait(c,col,practiceSymbol(setupForClass(c)))}</span>`;}).join('')}</div>`}:wasFirst?{eyebrow:'✦ Discipline unlocked ✦',sub:`${node.name.toUpperCase()} learned`}:null;
// A new path names no class: the title is NEW PATH and the symbols are those of the classes it opens.
if(moment)masteryTitle($('#map'),{name:cls.name,color:setupForClass(cls).color,icon:classPortrait(cls,setupForClass(cls).color,practiceSymbol(setupForClass(cls))),...moment,hydrate:hydrateClassIcons});
// A class's first purchase opens its drawer, once the ceremony has had a moment.
if(!drawerOpen)setTimeout(()=>setDrawer(true),motion()?1100:0);
const undoAction={label:'Undo',run:undo};if(!hadNull&&nullRevealed(learned)&&!nullOpen)return notify('Two Nihimence classes have opened their paths · something stirs in Nihimence’s sky',undoAction);notify(row.level?`${node.name.toUpperCase()} unlocked · ${cls.name}’s discipline level ${node.level} · ${cost} AP spent`:`${node.name.toUpperCase()} awakened · ${cost} AP spent`,undoAction);};
// The hold matches the commitment: longer for dearer purchases, with light running along the star's thread on the sky meanwhile.
const awaken=$('#awaken'),early=()=>notify(`Hold to ${buyVerb(selectedClass).toLowerCase()}`),holdMs=node?450+nodeCost(node,learned)*200:650;let charge=null;
const thread=()=>{const svg=$('#stars'),home=selectedClass.rootId||selectedClass.id;// A class with several parents has a thread from each: the light comes along the one the player actually invested in most.
if(!calling||!selectedClass.rootId)return svg.querySelector(`[data-self-thread="${home}"]`);return [...svg.querySelectorAll(`[data-link-class="${selectedClass.id}"]`)].sort((a,b)=>awakenedCount(classById(b.dataset.linkFrom),learned)-awakenedCount(classById(a.dataset.linkFrom),learned))[0]||null;};
const hold={ms:holdMs,onEarly:early,onStart:ms=>{charge?.cancel();charge=chargeThread(thread(),ms);},onCancel:()=>{charge?.cancel();charge=null;}},held=()=>{charge?.finish();charge=null;buy();};
holdToConfirm(awaken,held,hold);$('#go-parent')?.addEventListener('click',()=>setClass(parent));
// Phones: a dock pinned to the bottom always shows the selected purchase and its Awaken button.
const dockLabel=complete?'✦ Learned':blocked?'Locked':`${buyVerb(selectedClass)} · ${node?nodeCost(node,learned):0} AP`;
$('#dock').innerHTML=`<button type="button" class="dock-info" id="dock-info"><small>${esc(selectedClass.name.toUpperCase())}${row?` · ${esc(row.level?'LEVEL':'ABILITY')}`:''} · ${STARTING_POINTS-spentPoints(learned)} AP LEFT</small><b>${node?esc((complete&&!row.level?row.name:node.name).toUpperCase()):'Nothing to buy here yet'}</b>${blocked?`<em>${esc(blocked.message)}</em>`:''}</button>${node?`<button type="button" class="dock-awaken" id="dock-awaken" ${complete||blocked||!available?'disabled':''}>${dockLabel}</button>`:''}`;
holdToConfirm($('#dock-awaken'),held,hold);
// In the wizard's pick mode the chosen calling's card stays up once its first star is awakened, settled and showing the calling's
// symbol and description, so choosing reads the same as browsing (user, 2026-11-16). Elsewhere an awakened calling's card gives way to the drawer.
const fresh=!awakened(selectedClass),settled=PICKING&&!fresh,hud=$('#hud-awaken');hud.hidden=settled?drawerOpen:(!fresh||!node||drawerOpen);$('#drawer-tab').hidden=fresh&&!drawerOpen;
if(!hud.hidden){if(settled){hud.innerHTML=`<button type="button" class="hud-awaken-btn" disabled><small>${esc(selectedClass.name.toUpperCase())} · AWAKENED</small><b>Your first star</b></button>`;}else{const cost=nodeCost(node,learned);hud.innerHTML=`<button type="button" class="hud-awaken-btn" id="hud-awaken-btn" ${blocked||!available?'disabled':''}><small>${esc(selectedClass.name.toUpperCase())}${blocked?'':` · ${cost} AP`}</small><b>${blocked?esc(blocked.message):`${buyVerb(selectedClass)} ${esc(node.name.toUpperCase())}`}</b></button>`;holdToConfirm($('#hud-awaken-btn'),held,hold);}
// The class's symbol stands above the button, glowing in its practice colour.
hud.insertAdjacentHTML('afterbegin',`<div class="hud-symbol" aria-hidden="true">${classPortrait(selectedClass,disc.color,practiceSymbol(disc))}</div>`);hydrateClassIcons(hud);
// The calling's description drifts in beside the button a beat later.
const lore=CALLING_LORE[selectedClass.id];if(lore){hud.insertAdjacentHTML('beforeend',`<aside class="hud-lore"><span>${esc(disc.name.toUpperCase())} · ${esc(selectedClass.attribute.toUpperCase())}</span><p>${esc(lore)}</p></aside>`);fitLore(hud.querySelector('.hud-lore'));}}$('#dock-info').onclick=()=>setDrawer(true);
$('#details .panel-title').insertAdjacentHTML('beforeend',`${heldOn()?'<button type="button" class="held-back" id="held-back">✦ Your abilities</button>':''}<button type="button" class="drawer-close" id="drawer-close" aria-label="Close the panel">×</button>`);$('#drawer-close').onclick=()=>setDrawer(false);
if($('#held-back'))$('#held-back').onclick=()=>{drawerView='held';heldOpen=null;drawerOpen=true;renderDetails();};setDrawer(drawerOpen);}
// Syntarion's Magic | Tech slider: the needle sits at the axis value, the fill runs from neutral to it, and the color carries the mix.
function renderAxis(){const a=magicTechAxis(learned),pct=v=>(v+AXIS_LIMIT)/(2*AXIS_LIMIT)*100,at=pct(a.value),from=Math.min(at,50),width=Math.abs(at-50);
$('#axis-meter').style.setProperty('--axis',a.color);$('#axis-meter').dataset.mode=a.mode;$('#axis-meter').toggleAttribute('data-centered',a.value===0);const counts=['magicka','ingenium','praethacy','nihimence'].filter(k=>a[k]).map(k=>`${disciplines.find(d=>d.id===k).name} ${a[k]}`).join(' · ')||'No purchases yet';
$('#axis-meter').title=counts;$('#axis-meter').innerHTML=`<div class="axis-head"><span>MAGIC</span><b>${esc(a.label.toUpperCase())} · ${a.value>0?'+':''}${a.value}</b><span>TECH</span></div><div class="axis-track" role="meter" aria-valuemin="-${AXIS_LIMIT}" aria-valuemax="${AXIS_LIMIT}" aria-valuenow="${a.value}" aria-label="Magic to tech axis: ${esc(a.label)}, ${a.value}. ${esc(counts)}"><i class="axis-fill" style="left:${from}%;width:${width}%"></i>${[-3,0,3].map(v=>`<span class="axis-tick" style="left:${pct(v)}%"></span>`).join('')}<b class="axis-needle" style="left:${at}%"></b></div>`;}
// The Saga of Soteria: the nine aspect glyphs (Hope included), always open in the sky's corner.
// A glyph lights its callings on the sky and dims the rest; Hope stays quiet until Psynth is revealed.
// Order matches The Lockcaste's cover (user: this order matters), read across each row; all nine stay equally bright here.
const SAGA=['Will','Mind','Dream','Spirit','Hope','Soul','Affect','Body','Whim'];let sagaPinned=null;
const aspectNamed=name=>name==='Hope'?hopeAspect:doctrineGroups.flatMap(g=>g.aspects).find(a=>a.name===name);
// An aspect's description drifts in beside the Saga card while it is highlighted, set like the calling's (user, 2026-11-16).
// It stays put while the same aspect stays highlighted, so moving between hover and pin does not replay the smoke.
function showAspectLore(name){const saga=$('#saga');if(!saga)return;const card=saga.querySelector('.aspect-lore'),lore=name&&ASPECT_LORE[name];if(card&&card.dataset.aspect===(name||''))return;card?.remove();if(!lore)return;
saga.insertAdjacentHTML('beforeend',`<aside class="hud-lore aspect-lore" data-aspect="${esc(name)}"><span>${esc(name.toUpperCase())} · ${esc(lore.term.toUpperCase())}</span><p>${esc(lore.text)}</p></aside>`);}
function highlightAspect(name){showAspectLore(name);const svg=$('#stars');svg.classList.toggle('aspect-focus',!!name);const has=id=>!!name&&classById(id)?.attribute===name;svg.querySelectorAll('[data-star-class]').forEach(el=>el.classList.toggle('aspect-lit',has(el.dataset.starClass)));
// Only threads that belong to the highlighted aspect stay lit: a Self thread to one of its callings, or a link whose two ends both carry it.
svg.querySelectorAll('.thread').forEach(el=>el.classList.toggle('aspect-lit',el.dataset.selfThread?has(el.dataset.selfThread):!!el.dataset.linkClass&&has(el.dataset.linkClass)&&has(el.dataset.linkFrom)));}
function renderSaga(){const saga=$('#saga'),shown=visibleClasses(revealed,true,learned,nullOpen);
saga.innerHTML=`<div class="saga-grid">${SAGA.map(name=>{const a=aspectNamed(name),callings=shown.filter(c=>c.attribute===name).map(c=>c.name),hidden=name==='Hope'&&!callings.length;return `<button type="button" class="saga-tile${sagaPinned===name?' pinned':''}" data-aspect="${name}" style="--glyph:url('${a.glyph}')" title="${name}" aria-label="${name}"><span class="saga-glyph" aria-hidden="true"></span></button>`;}).join('')}</div>`;
saga.querySelectorAll('.saga-tile').forEach(tile=>{const name=tile.dataset.aspect;tile.onmouseenter=tile.onfocus=()=>highlightAspect(name);tile.onmouseleave=tile.onblur=()=>highlightAspect(sagaPinned);tile.onclick=()=>{sagaPinned=sagaPinned===name?null:name;renderSaga();highlightAspect(sagaPinned);};});}
// The description card takes only the sky that is free beside the corner stack: as wide as it can be (up to 260px) without
// covering a star or label at its height; if under 200px is free, it sits above the Awaken button instead.
// The card is first placed before the stars are drawn, so it is fitted again once they are, and whenever the sky's size
// changes; otherwise a narrow window leaves it lying over the stars (user, 2026-11-17).
function refitLore(){requestAnimationFrame(()=>fitLore($('#map-hud .hud-lore:not(.aspect-lore)')));}
window.addEventListener('resize',refitLore);
function fitLore(card){if(!card||phone.matches)return;card.classList.remove('above','boxed');card.style.top='';card.style.width='';const hud=$('#map-hud').getBoundingClientRect(),sky=$('#map').getBoundingClientRect(),marks=[...$('#stars').querySelectorAll('.node-label,.node-border,image.class-star-png,.cluster-label,.cluster-sub,.seal-label,.seal-progress')].map(n=>n.getBoundingClientRect()).filter(r=>r.width&&r.left>hud.right);const fit=()=>{let room=0;for(let i=0;i<3;i++){const c=card.getBoundingClientRect(),near=marks.filter(r=>r.bottom>c.top-8&&r.top<c.bottom+8);room=Math.floor((near.length?Math.min(...near.map(r=>r.left)):innerWidth)-hud.right-14-16);if(room<170)return false;card.style.width=`${Math.min(260,room)}px`;}return true;};const span=Math.max(0,hud.height-card.getBoundingClientRect().height);for(let y=0;y<=span;y+=24){card.style.top=`${y}px`;card.style.width='';if(fit())return;}card.style.top='';card.style.width='';card.classList.add('above');if(card.getBoundingClientRect().top>=sky.top+64)return;card.classList.remove('above');card.classList.add('boxed');const h=card.getBoundingClientRect().height,last=Math.max(0,Math.min(hud.height-h,sky.bottom-8-hud.top-h));let best=0,least=Infinity;for(let y=0;y<=last;y+=12){card.style.top=`${y}px`;const c=card.getBoundingClientRect(),hit=marks.filter(r=>r.left<c.right&&r.right>c.left&&r.top<c.bottom&&r.bottom>c.top).length;if(hit<least){least=hit;best=y;}}card.style.top=`${best}px`;}
// The points and the Saga card share a corner of the sky; phones have no empty corner, so there they sit just below the sky.
const phone=matchMedia('(max-width:650px)');function placeSaga(){const hud=$('#map-hud');if(phone.matches){if(hud.parentElement!==$('.map-panel'))$('.map-panel').insertBefore(hud,$('.map-footer'));}else if(hud.parentElement!==$('#map'))$('#map').append(hud);}
phone.addEventListener('change',placeSaga);
function render(){if(nullOpen&&!nullRevealed(learned)){nullOpen=false;if(calling==='null')calling=null;if(selectedClass.secret){selectedClass=classById('fighter');disciplineId=selectedClass.discipline;selectedAbility=null;}save();}if(revealed&&!praethacyEligibility(learned).eligible){revealed=false;if(calling==='warden')calling=null;if(selectedClass.hidden)selectedClass=classes.find(c=>c.id==='weaver');disciplineId=selectedClass.discipline;selectedAbility=null;save();}if(!classKnown(selectedClass,learned)){selectedClass=classById(selectedClass.rootId);disciplineId=selectedClass.discipline;selectedAbility=null;}document.documentElement.style.setProperty('--accent',d().color);placeSaga();renderVeil();renderAxis();renderSaga();renderDetails();renderMap();refitLore();$('#points').textContent=STARTING_POINTS-spentPoints(learned);$('#points-note').innerHTML=`AP AVAILABLE<br>${spentPoints(learned)} SPENT${DEV_MODE&&!HOSTED?' · DEV':''}`;$('#learned-count').textContent=`${learned.length} STARS AWAKENED`;}
$('#to-atlas').onclick=leaveCalling;$('#drawer-tab').onclick=()=>setDrawer(true);window.addEventListener('keydown',e=>{if(e.key==='Escape'&&drawerOpen)setDrawer(false);if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&lastBuy&&!e.target.closest?.('input,textarea')){e.preventDefault();undo();}});$('#overview').onclick=()=>{if(calling)leaveCalling();};$('#focus').onclick=inspectAbilities;$('#reset').onclick=()=>{const refund=spentPoints(learned);learned=[];lastBuy=null;save();render();notify(`Build reset · ${refund} AP refunded`);};
function zoom(delta){scale=Math.min(1.8,Math.max(.65,scale+delta));renderMap();}$('#zoom-in').onclick=()=>zoom(.1);$('#zoom-out').onclick=()=>zoom(-.1);$('#recenter').onclick=()=>{scale=1;pan={...homePan};renderMap();};
$('#map').addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY>0?-.05:.05);},{passive:false});
$('#stars').addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={x:e.clientX,y:e.clientY,pan:{...pan}};moved=false;});
window.addEventListener('pointermove',e=>{if(!drag)return;const rect=$('#stars').getBoundingClientRect();const units=Math.max(1100/rect.width,1000/rect.height);const dx=(e.clientX-drag.x)*units,dy=(e.clientY-drag.y)*units;if(Math.abs(dx)+Math.abs(dy)>5){moved=true;pan={x:Math.max(-650,Math.min(650,drag.pan.x+dx)),y:Math.max(-450,Math.min(450,drag.pan.y+dy))};$('#universe')?.setAttribute('transform',`translate(${pan.x} ${pan.y}) translate(550 500) scale(${scale}) translate(-550 -500)`);}});
window.addEventListener('pointerup',()=>{drag=null;setTimeout(()=>moved=false,0);});window.addEventListener('pointercancel',()=>{drag=null;});
$('#map').onkeydown=e=>{if(e.target!==$('#map'))return;if(e.key==='+'||e.key==='=')zoom(.1);if(e.key==='-')zoom(-.1);const delta={ArrowLeft:[35,0],ArrowRight:[-35,0],ArrowUp:[0,35],ArrowDown:[0,-35]}[e.key];if(delta){e.preventDefault();pan.x+=delta[0];pan.y+=delta[1];renderMap();}};
// With abilities to use, the drawer opens on them; the host's answer to a use is shown as a toast.
if(heldOn()&&learned.length)drawerOpen=true;
onHostReply(({ok,message})=>{heldBusy=null;if(ok)heldOpen=null;if(message)notify(message);renderDetails();});
save();render();










