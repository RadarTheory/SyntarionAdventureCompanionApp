import {classes} from './data.js';
// The user's official class symbols (SYNTARION/Symbols/C L A S S/O F F I C I A L, imported 2026-11-15): one per class; a class without one borrows its line's symbol.
const available=new Set(['alchemist','arcani','archivist','archon','artificer','augur','axion','barbarian','bard','baron','biomancer','bokor','bombardier','caelyn','cantor','cartographer','castor','cleric','codexer','detective','devout','druid','dryad','dryte','dyreon','eikon','eldritch','emissary','evoke','fatebinder','fighter','gallant','ghrimm','glyphsage','gunslinger','gunsmith','harrow','hemoclast','herald','inquisitor','inspector','inventor','iridesce','knight','laureate','loaite','machinist','magus','makemark','marauder','merchant','minstrel','monk','mutagenist','mystagogue','mystic','naught','necromancer','negotiator','nil','nix','null','oneir','ovate','paladin','poet','primalist','provocateur','psynth','ranger','rhapsodist','rogue','runesiph','saboteur','sage','scholar','scientist','scribe','sentinaut','sentine','shaman','sleuth','sorcerer','stalwart','strategist','strider','swashbuckler','tactician','tinkerer','tribune','tycoon','vanguard','vizier','warden','warlock','weaver','whyth','wild','wishwright','witch','wizard','wreicht','zealot']);
export function classIconFor(cls){const owner=available.has(cls.id)?cls:classes.find(c=>c.id===cls.rootId&&available.has(c.id));return owner?{id:owner.id,name:owner.name,src:`assets/class-icons/${owner.id}.png`,family:owner.id!==cls.id}:null;}
const cache=new Map();
function tintedPng(icon,color){const key=`${icon.id}:${color}`;if(cache.has(key))return cache.get(key);
const pending=new Promise(resolve=>{const img=new Image();img.onload=()=>{try{
const canvas=document.createElement('canvas');const ratio=Math.min(1,384/Math.max(img.naturalWidth,img.naturalHeight));canvas.width=Math.round(img.naturalWidth*ratio);canvas.height=Math.round(img.naturalHeight*ratio);const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,canvas.width,canvas.height);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);const rgb=[1,3,5].map(i=>Math.round(parseInt(color.slice(i,i+2),16)*.7+255*.3));
// Same luminance-to-alpha silhouette rendering used by Syntarion's VTT.
// Imported symbols are greyscale PNGs (converted from the originals, at most 512px), black ink on white.
for(let i=0;i<pixels.data.length;i+=4){const alpha=pixels.data[i+3],luma=(pixels.data[i]+pixels.data[i+1]+pixels.data[i+2])/3;pixels.data[i]=rgb[0];pixels.data[i+1]=rgb[1];pixels.data[i+2]=rgb[2];pixels.data[i+3]=Math.round(alpha*(255-luma)/255);}
ctx.putImageData(pixels,0,0);resolve(canvas.toDataURL('image/png'));
}catch{resolve(null);}};img.onerror=()=>resolve(null);img.src=icon.src;});cache.set(key,pending);return pending;
}
export function hydrateClassIcons(container){for(const element of container.querySelectorAll('[data-class-icon]')){
const cls=classes.find(c=>c.id===element.dataset.classIcon),icon=cls&&classIconFor(cls);if(!icon)continue;
const label=icon.family?`${icon.name} class-family symbol`:`${cls.name} class symbol`;
tintedPng(icon,element.dataset.iconColor).then(url=>{if(!url||!element.isConnected)return;if(element.tagName.toLowerCase()==='image')element.setAttribute('href',url);else{element.src=url;element.alt=label;element.title=label;}
element.classList.add('class-png-ready');element.closest('.star-node,.class-portrait')?.classList.add('has-class-icon');});
}}
export function classPortrait(cls,color,fallback){const icon=classIconFor(cls);return `<div class="class-portrait"><span class="portrait-fallback" aria-hidden="true">${fallback}</span>${icon?`<img class="class-portrait-png" data-class-icon="${cls.id}" data-icon-color="${color}" alt="" width="60" height="60">`:''}</div>`;}



