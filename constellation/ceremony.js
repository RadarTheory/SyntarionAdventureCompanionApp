// Ceremonies for the core moments. Awakening draws the new thread in and ignites the star; mastery traces the calling's lines,
// raises the stars it reveals and sets the title on the sky. Glow only, never outline rings. With Motion off the result shows at once.
const NS='http://www.w3.org/2000/svg';
const motionOn=()=>document.documentElement.dataset.motion!=='off';
const geometry=el=>el.getAttribute('d')||['x1','y1','x2','y2'].map(a=>el.getAttribute(a)).join(',');
const center=star=>{const c=star.querySelector('.node-border');return {x:+c.getAttribute('cx'),y:+c.getAttribute('cy')};};
const colorOf=star=>star.style.getPropertyValue('--node-color')||'#d9d0ac';

// What the sky held before a purchase: which stars stood, which threads existed and which were committed.
export function snapshot(svg){return {stars:new Set([...svg.querySelectorAll('[data-star-class]')].map(el=>el.dataset.starClass)),threads:new Set([...svg.querySelectorAll('.thread')].map(geometry)),committed:new Set([...svg.querySelectorAll('.thread.committed')].map(geometry))};}

function drawThread(el,delay){
if(el.classList.contains('thread-hint')){el.animate([{opacity:0},{opacity:.35}],{duration:700,delay,easing:'ease-out',fill:'backwards'});return;}
const length=el.getTotalLength?.()||0;if(!length)return;el.style.strokeDasharray=length;
el.animate([{strokeDashoffset:length},{strokeDashoffset:0}],{duration:850,delay,easing:'cubic-bezier(.5,0,.2,1)',fill:'backwards'}).finished.then(()=>el.style.strokeDasharray='',()=>el.style.strokeDasharray='');}

function rise(star,delay){const {x,y}=center(star);star.style.transformBox='view-box';star.style.transformOrigin=`${x}px ${y}px`;
star.animate([{opacity:0,transform:'scale(.35)'},{opacity:1,transform:'scale(1.08)',offset:.7},{opacity:1,transform:'scale(1)'}],{duration:900,delay,easing:'ease-out',fill:'backwards'});}

// A soft bloom and a scatter of motes from the star's centre, removed once spent.
export function ignite(star,{scale=2.4,motes=10,delay=0}={}){if(!star||!motionOn())return;const {x,y}=center(star),color=colorOf(star),host=star.parentNode;
const fx=document.createElementNS(NS,'g');fx.setAttribute('class','ceremony-fx');fx.setAttribute('aria-hidden','true');fx.style.pointerEvents='none';
const bloom=document.createElementNS(NS,'circle');Object.entries({cx:x,cy:y,r:26,fill:color}).forEach(([k,v])=>bloom.setAttribute(k,v));Object.assign(bloom.style,{filter:'blur(9px)',transformBox:'fill-box',transformOrigin:'center'});fx.append(bloom);
const anims=[bloom.animate([{opacity:.85,transform:'scale(.2)'},{opacity:.5,transform:`scale(${scale*.6})`,offset:.35},{opacity:0,transform:`scale(${scale})`}],{duration:1100,delay,easing:'ease-out',fill:'both'})];
for(let i=0;i<motes;i++){const a=(i/motes)*Math.PI*2+Math.random()*.5,d=38+Math.random()*34*scale/2.4,m=document.createElementNS(NS,'circle');Object.entries({cx:x,cy:y,r:i%3?1.4:2.2,fill:i%2?'#f3ecd4':color}).forEach(([k,v])=>m.setAttribute(k,v));m.style.filter=`drop-shadow(0 0 3px ${color})`;fx.append(m);
anims.push(m.animate([{opacity:0,transform:'translate(0,0)'},{opacity:1,offset:.15},{opacity:0,transform:`translate(${(Math.cos(a)*d).toFixed(1)}px,${(Math.sin(a)*d).toFixed(1)}px)`}],{duration:900+Math.random()*500,delay:delay+60,easing:'cubic-bezier(.2,.7,.3,1)',fill:'both'}));}
host.append(fx);Promise.allSettled(anims.map(a=>a.finished)).then(()=>fx.remove());}

// After the sky re-renders: draw newly committed (and newly shown) threads, raise new stars, ignite the bought star.
export function play(svg,before,{starId,rootId,mastered=false}){if(!motionOn())return;
const star=svg.querySelector(`[data-star-class="${starId}"]`)||svg.querySelector(`[data-star-class="${rootId}"]`);
const drawn=[...svg.querySelectorAll('.thread')].filter(el=>!before.threads.has(geometry(el))||(el.classList.contains('committed')&&!before.committed.has(geometry(el))));
drawn.forEach((el,i)=>drawThread(el,(mastered?260:0)+i*(mastered?150:90)));
const step=mastered?drawn.length*150+500:500;
[...svg.querySelectorAll('[data-star-class]')].filter(el=>!before.stars.has(el.dataset.starClass)).forEach((el,i)=>{rise(el,step+i*220);ignite(el,{scale:1.6,motes:6,delay:step+i*220+300});});
[...svg.querySelectorAll('.unknown-star')].forEach((el,i)=>{if(mastered)el.animate([{opacity:0},{opacity:1}],{duration:600,delay:step+i*120,fill:'backwards'});});
ignite(star,mastered?{scale:3.6,motes:18}:{});document.dispatchEvent(new CustomEvent('star-awakened'));}

// The AP figure counts down rather than jumping, and a small "−n" drifts off it.
export function tickPoints(el,from,to){el.textContent=to;if(!motionOn()||from===to)return;const start=performance.now(),span=Math.min(900,260+Math.abs(from-to)*120);
const step=now=>{const t=Math.min(1,(now-start)/span),v=Math.round(from+(to-from)*(1-Math.pow(1-t,3)));el.textContent=v;if(t<1)requestAnimationFrame(step);};requestAnimationFrame(step);
const float=document.createElement('span');float.className='points-float';float.textContent=`${to<from?'−':'+'}${Math.abs(from-to)}`;float.setAttribute('aria-hidden','true');el.parentElement.append(float);
float.animate([{opacity:0,transform:'translateY(4px)'},{opacity:1,transform:'translateY(-6px)',offset:.25},{opacity:0,transform:'translateY(-26px)'}],{duration:1400,easing:'ease-out'}).finished.then(()=>float.remove(),()=>float.remove());}

// A class's big moments (unlocked, new paths open, mastered): its symbol flashes on the sky with the name for a few seconds.
export function masteryTitle(map,{name,color,sub,icon='',hydrate,eyebrow='✦ Discipline unlocked ✦'}){map.querySelector('.mastery-title')?.remove();const el=document.createElement('div');el.className='mastery-title';el.style.setProperty('--title-color',color);el.setAttribute('role','status');
el.innerHTML=`<div class="mastery-symbol">${icon}</div><span class="mastery-eyebrow">${eyebrow}</span><strong></strong><small></small>`;el.querySelector('strong').textContent=name;el.querySelector('small').textContent=sub;map.append(el);hydrate?.(el);setTimeout(()=>{el.classList.add('leaving');setTimeout(()=>el.remove(),900);},motionOn()?3600:3000);}

// Press-and-hold to buy: the button fills while held and buys when full. Keyboard activation (Enter/Space) buys at once.
// onStart/onCancel let the sky follow the hold (a light running along the star's thread).
export function holdToConfirm(button,run,{ms=650,onEarly,onStart,onCancel}={}){if(!button||button.disabled)return;let timer=null;button.classList.add('hold-button');button.style.setProperty('--hold-ms',`${ms}ms`);
const stop=()=>{if(!timer)return;clearTimeout(timer);timer=null;button.classList.remove('holding');onCancel?.();};
button.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();try{button.setPointerCapture(e.pointerId);}catch{}button.classList.add('holding');onStart?.(ms);timer=setTimeout(()=>{timer=null;button.classList.remove('holding');run();},ms);});
button.addEventListener('pointerup',()=>{if(timer){stop();onEarly?.();}});button.addEventListener('pointercancel',stop);button.addEventListener('lostpointercapture',stop);
button.addEventListener('contextmenu',e=>e.preventDefault());button.addEventListener('click',e=>{if(e.detail===0)run();});}

// While the player holds, light runs along the thread toward the star at the hold's pace.
export function chargeThread(thread,ms){const none={cancel(){},finish(){}};if(!thread||!motionOn())return none;
const d=thread.getAttribute('d')||`M${thread.getAttribute('x1')} ${thread.getAttribute('y1')} L${thread.getAttribute('x2')} ${thread.getAttribute('y2')}`,color=thread.style.color||thread.getAttribute('stroke');
const g=document.createElementNS(NS,'g');g.setAttribute('class','ceremony-fx thread-charge');g.setAttribute('aria-hidden','true');g.style.pointerEvents='none';g.style.color=color;
const trail=document.createElementNS(NS,'path');trail.setAttribute('d',d);trail.setAttribute('class','charge-trail');const head=document.createElementNS(NS,'circle');head.setAttribute('r','3.6');head.setAttribute('class','charge-head');g.append(trail,head);thread.after(g);
const len=trail.getTotalLength();if(!len){g.remove();return none;}trail.style.strokeDasharray=`${len} ${len}`;
let p=0,frame=0,mode='fill',from=0,start=performance.now();
const draw=()=>{trail.style.strokeDashoffset=len*(1-p);const pt=trail.getPointAtLength(len*p);head.setAttribute('cx',pt.x);head.setAttribute('cy',pt.y);head.style.opacity=p>0.01?1:0;};
const tick=now=>{if(mode==='fill')p=Math.min(1,(now-start)/ms);else if(mode==='back'){p=Math.max(0,from*(1-(now-start)/260));if(!p)return g.remove();}draw();frame=requestAnimationFrame(tick);};
draw();frame=requestAnimationFrame(tick);
// Letting go early: the light never makes it. The head sputters and sheds a few sparks where it stopped, and the trail goes dark.
return {cancel(){cancelAnimationFrame(frame);const x=+head.getAttribute('cx'),y=+head.getAttribute('cy'),anims=[];
anims.push(trail.animate([{opacity:1},{opacity:.35,offset:.2},{opacity:0}],{duration:240,easing:'ease-out',fill:'forwards'}));
head.style.transformBox='fill-box';head.style.transformOrigin='center';anims.push(head.animate([{opacity:1,transform:'scale(1)'},{opacity:.25,offset:.2},{opacity:.9,transform:'scale(.8)',offset:.35},{opacity:.15,offset:.55},{opacity:.6,transform:'scale(.5)',offset:.7},{opacity:0,transform:'scale(.2)'}],{duration:340,easing:'linear',fill:'forwards'}));
if(p>.02)for(let i=0;i<5;i++){const a=Math.random()*Math.PI*2,d=6+Math.random()*10,m=document.createElementNS(NS,'circle');m.setAttribute('cx',x);m.setAttribute('cy',y);m.setAttribute('r',i%2?.9:1.3);m.setAttribute('class','charge-head');g.append(m);
anims.push(m.animate([{opacity:.9,transform:'translate(0,0)'},{opacity:0,transform:`translate(${(Math.cos(a)*d).toFixed(1)}px,${(Math.sin(a)*d+4).toFixed(1)}px)`}],{duration:260+Math.random()*160,easing:'cubic-bezier(.2,.6,.4,1)',fill:'forwards'}));}
Promise.allSettled(anims.map(a=>a.finished)).then(()=>g.remove());},finish(){cancelAnimationFrame(frame);p=1;draw();g.animate([{opacity:1},{opacity:0}],{duration:500,easing:'ease-out',fill:'forwards'}).finished.then(()=>g.remove(),()=>g.remove());}};}

// The camera dives into a calling (or pulls back out to the atlas): the sky rushes toward the star and fades,
// `change` swaps the sky, and the new one settles in. With Motion off the swap is instant.
export async function dive(svg,star,change,{out=false}={}){if(!motionOn()){change();return;}
const r=svg.getBoundingClientRect(),s=star?.getBoundingClientRect(),ox=s?s.left+s.width/2-r.left:r.width/2,oy=s?s.top+s.height/2-r.top:r.height/2;
svg.style.transformOrigin=`${ox}px ${oy}px`;
const away=svg.animate([{transform:'scale(1)',opacity:1,filter:'blur(0)'},{transform:`scale(${out?.62:2.8})`,opacity:0,filter:'blur(4px)'}],{duration:440,easing:'cubic-bezier(.55,0,.85,.35)',fill:'forwards'});
await away.finished.catch(()=>{});svg.style.opacity='0';away.cancel();change();svg.style.transformOrigin='50% 55%';svg.style.opacity='';
await svg.animate([{transform:`scale(${out?1.5:.72})`,opacity:0,filter:'blur(4px)'},{transform:'scale(1)',opacity:1,filter:'blur(0)'}],{duration:560,easing:'cubic-bezier(.2,.7,.3,1)'}).finished.catch(()=>{});svg.style.transformOrigin='';}


// A hidden calling's reveal. The Veil: a seam of light splits open where the seal stood, its two halves part like curtains
// and dissolve, and the star rises through. The Void: light is drawn inward to a point, a beat of dark, then the star.
export function unveil(svg,{x,y,color,kind='veil'}){if(!motionOn())return;const host=svg.querySelector('#universe')||svg;
const fx=document.createElementNS(NS,'g');fx.setAttribute('class','ceremony-fx unveil');fx.setAttribute('aria-hidden','true');fx.style.pointerEvents='none';host.append(fx);
const make=(tag,attrs,style={})=>{const el=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));Object.assign(el.style,{transformBox:'fill-box',transformOrigin:'center',...style});fx.append(el);return el;};
const anims=[];
if(kind==='veil'){
const seam=make('ellipse',{cx:x,cy:y,rx:3,ry:150,fill:'#fff'},{filter:`blur(1.5px) drop-shadow(0 0 6px ${color}) drop-shadow(0 0 18px ${color})`});
anims.push(seam.animate([{transform:'scale(1,0)',opacity:0},{transform:'scale(1,1)',opacity:1,offset:.3},{transform:'scale(6,1.05)',opacity:.9,offset:.55},{transform:'scale(18,1.1)',opacity:0}],{duration:1500,easing:'cubic-bezier(.4,0,.2,1)',fill:'both'}));
for(const side of [-1,1])for(let i=0;i<3;i++){const c=make('ellipse',{cx:x+side*(6+i*5),cy:y,rx:5+i*3,ry:130-i*22,fill:color},{filter:'blur(5px)',opacity:0});
anims.push(c.animate([{opacity:0,transform:'translateX(0)'},{opacity:.75-i*.15,transform:'translateX(0)',offset:.32},{opacity:0,transform:`translateX(${side*(90+i*45)}px)`}],{duration:1700+i*200,delay:120,easing:'cubic-bezier(.3,0,.2,1)',fill:'both'}));}
const bloom=make('circle',{cx:x,cy:y,r:40,fill:color},{filter:'blur(14px)'});anims.push(bloom.animate([{opacity:0,transform:'scale(.2)'},{opacity:0,offset:.3},{opacity:.8,transform:'scale(1.4)',offset:.5},{opacity:0,transform:'scale(4)'}],{duration:1900,easing:'ease-out',fill:'both'}));}
else{
const dark=make('circle',{cx:x,cy:y,r:70,fill:'#020504'},{filter:'blur(10px)'});anims.push(dark.animate([{opacity:0,transform:'scale(2.4)'},{opacity:.9,transform:'scale(1)',offset:.45},{opacity:.95,transform:'scale(.15)',offset:.7},{opacity:0,transform:'scale(.05)'}],{duration:1700,easing:'cubic-bezier(.6,0,.4,1)',fill:'both'}));
for(let i=0;i<22;i++){const a=i/22*Math.PI*2,d=90+Math.random()*70,m=make('circle',{cx:x,cy:y,r:i%3?1.4:2.2,fill:i%2?'#f3ecd4':color},{filter:`drop-shadow(0 0 3px ${color})`,transformBox:'view-box',transformOrigin:'0 0'});
anims.push(m.animate([{opacity:0,transform:`translate(${(Math.cos(a)*d).toFixed(1)}px,${(Math.sin(a)*d).toFixed(1)}px)`},{opacity:1,offset:.2},{opacity:.9,transform:'translate(0,0)',offset:.75},{opacity:0,transform:'translate(0,0)'}],{duration:1300+Math.random()*300,easing:'cubic-bezier(.55,0,.9,.5)',fill:'both'}));}
const flash=make('circle',{cx:x,cy:y,r:36,fill:color},{filter:'blur(10px)'});anims.push(flash.animate([{opacity:0,transform:'scale(.1)'},{opacity:0,offset:.72},{opacity:.85,transform:'scale(1.5)',offset:.8},{opacity:0,transform:'scale(3.5)'}],{duration:2000,easing:'ease-out',fill:'both'}));}
Promise.allSettled(anims.map(a=>a.finished)).then(()=>fx.remove());return kind==='veil'?700:1300;}
