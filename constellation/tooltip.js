// One themed tooltip for the whole explorer, replacing the browser's native ones (which cannot be styled).
// It reads an element's `title` attribute, or an SVG star's <title> child, at hover time, so re-rendered text is always current.
const tip=document.createElement('div');tip.id='ui-tip';tip.setAttribute('role','tooltip');tip.hidden=true;document.body.append(tip);
let target=null,timer=0;
function textOf(el){if(el.hasAttribute('title')){const t=el.getAttribute('title');el.removeAttribute('title');if(t){el.dataset.tip=t;if(!el.hasAttribute('aria-label')&&!el.textContent.trim())el.setAttribute('aria-label',t);}}
const svgTitle=el.querySelector(':scope>title');if(svgTitle?.textContent.trim()){el.dataset.tip=svgTitle.textContent.trim();svgTitle.textContent='';}return el.dataset.tip||'';}
function owner(node){for(let el=node;el&&el!==document;el=el.parentNode){if(el.nodeType!==1)continue;if(el.hasAttribute('title')||el.dataset?.tip||el.querySelector?.(':scope>title'))return el;}return null;}
function place(){if(!target?.isConnected)return hide();const r=target.getBoundingClientRect(),w=tip.offsetWidth,h=tip.offsetHeight;let x=r.left+r.width/2-w/2,y=r.top-h-10;
if(y<8){y=r.bottom+10;tip.dataset.side='below';}else tip.dataset.side='above';tip.style.left=`${Math.max(8,Math.min(innerWidth-w-8,x))}px`;tip.style.top=`${y}px`;}
function show(el){const text=textOf(el);if(!text)return;target=el;clearTimeout(timer);timer=setTimeout(()=>{if(target!==el)return;tip.textContent=text;tip.hidden=false;place();requestAnimationFrame(()=>tip.classList.add('show'));},320);}
function hide(){clearTimeout(timer);target=null;tip.classList.remove('show');tip.hidden=true;}
document.addEventListener('pointerover',e=>{if(e.pointerType==='touch')return;const el=owner(e.target);if(el===target)return;hide();if(el)show(el);});
document.addEventListener('pointerout',e=>{if(target&&!target.contains(e.relatedTarget))hide();});
document.addEventListener('focusin',e=>{const el=owner(e.target);if(el&&e.target.matches(':focus-visible'))show(el);});
document.addEventListener('focusout',hide);document.addEventListener('pointerdown',hide,true);window.addEventListener('scroll',hide,true);window.addEventListener('wheel',hide,{passive:true});
document.addEventListener('keydown',e=>{if(e.key==='Escape')hide();});
