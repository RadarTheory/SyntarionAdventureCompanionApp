// A single persistent canvas sits behind the interactive SVG. Never rebuilt on selection.
const map=document.querySelector('#map');
const canvas=document.createElement('canvas');
canvas.className='cosmic-particles';canvas.setAttribute('aria-hidden','true');
const atmosphere=document.createElement('div');
atmosphere.className='cosmic-atmosphere';atmosphere.setAttribute('aria-hidden','true');
map.prepend(atmosphere,canvas);
const ctx=canvas.getContext('2d');
const media=matchMedia('(prefers-reduced-motion: reduce)');
const control=document.createElement('button');
control.className='motion-toggle';control.type='button';control.title='Toggle ambient cosmic motion';
document.querySelector('.map-toolbar').append(control);
// The living sky: three depth layers drift at their own pace and slide by different amounts as the sky is panned or zoomed.
// The middle layer takes the base practice's colour (the selected calling's), subtly; a few "prism" stars twinkle through all four practices.
const PRACTICES=[[148,196,147],[128,184,216],[226,172,107],[179,154,221]];// Magicka green, Ingenium blue, Nihimence orange, Praethacy purple
const LAYERS=[{depth:.06,density:2600,r:[.3,.75],drift:[1,3],alpha:.62},{depth:.16,density:9000,r:[.6,1.25],drift:[2,5],alpha:.5,tinted:true},{depth:.32,density:42000,r:[1.15,1.8],drift:[3,7],alpha:.85,flare:true}];
let enabled=!media.matches,visible=true,width=0,height=0,particles=[],frame=0,last=0,time=0;
let tint=[...PRACTICES[0]],targetTint=[...tint],view={x:0,y:0,s:1},target={x:0,y:0,s:1};
// Shooting stars (user's "video game pass", 2026-11-15): one every 8–20 seconds streaks across the sky behind the constellation.
// Most are pale white; about one in four carries a practice's colour. They only fly while Motion is on.
let meteors=[],nextMeteor=3+Math.random()*5;
function spawnMeteor(){const fromLeft=Math.random()<.5,angle=(18+Math.random()*22)*Math.PI/180,speed=520+Math.random()*380;
meteors.push({x:fromLeft?Math.random()*width*.55:width*.45+Math.random()*width*.55,y:Math.random()*height*.35,vx:(fromLeft?1:-1)*Math.cos(angle)*speed,vy:Math.sin(angle)*speed,length:90+Math.random()*90,age:0,life:.75+Math.random()*.55,
rgb:Math.random()<.25?PRACTICES[Math.floor(Math.random()*4)].join(','):'236,242,238'});}
function drawMeteors(delta){for(const m of meteors){m.age+=delta;m.x+=m.vx*delta;m.y+=m.vy*delta;}meteors=meteors.filter(m=>m.age<m.life);
for(const m of meteors){const t=m.age/m.life,fade=Math.min(1,t*6)*(1-t*t),speed=Math.hypot(m.vx,m.vy),tx=m.x-m.vx/speed*m.length,ty=m.y-m.vy/speed*m.length;
const trail=ctx.createLinearGradient(m.x,m.y,tx,ty);trail.addColorStop(0,`rgba(${m.rgb},${.9*fade})`);trail.addColorStop(.25,`rgba(${m.rgb},${.35*fade})`);trail.addColorStop(1,`rgba(${m.rgb},0)`);
ctx.strokeStyle=trail;ctx.lineWidth=1.6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(m.x,m.y);ctx.lineTo(tx,ty);ctx.stroke();
const head=ctx.createRadialGradient(m.x,m.y,0,m.x,m.y,7);head.addColorStop(0,`rgba(255,255,255,${fade})`);head.addColorStop(.4,`rgba(${m.rgb},${.5*fade})`);head.addColorStop(1,`rgba(${m.rgb},0)`);ctx.fillStyle=head;ctx.fillRect(m.x-7,m.y-7,14,14);}}
function updateTint(){const hex=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();if(/^#[\da-f]{6}$/i.test(hex))targetTint=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));if(!enabled){tint=[...targetTint];draw();}}
new MutationObserver(updateTint).observe(document.documentElement,{attributes:true,attributeFilter:['style']});
// Read the sky's pan and zoom from the SVG camera, converted from sky units to screen pixels.
function readCamera(){const u=map.querySelector('#universe'),svg=map.querySelector('#stars');if(!u||!svg)return;const t=u.getAttribute('transform')||'',m=t.match(/translate\(([-\d.]+)[ ,]+([-\d.]+)\)/),z=t.match(/scale\(([-\d.]+)\)/),r=svg.getBoundingClientRect(),k=Math.min(r.width/1100,r.height/1000)||1;
target={x:m?+m[1]*k:0,y:m?+m[2]*k:0,s:z?+z[1]:1};if(!enabled){view={...target};draw();}}
new MutationObserver(readCamera).observe(map,{subtree:true,attributes:true,attributeFilter:['transform']});
const rand=([lo,hi])=>lo+Math.random()*(hi-lo);
function resize(){const bounds=map.getBoundingClientRect();width=bounds.width;height=bounds.height;const ratio=Math.min(devicePixelRatio||1,1.7);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx?.setTransform(ratio,0,0,ratio,0,0);
particles=LAYERS.flatMap((layer,l)=>Array.from({length:Math.max(l===2?8:30,Math.min(l===0?190:90,Math.floor(width*height/layer.density)))},(_,i)=>({layer,x:Math.random()*(width+80),y:Math.random()*(height+80),r:rand(layer.r),drift:rand(layer.drift),phase:Math.random()*Math.PI*2,speed:.3+Math.random()*.65,flare:layer.flare&&i%3===0,
prism:l===1&&i%9===0?{from:Math.floor(Math.random()*4),rate:.05+Math.random()*.06}:null})));readCamera();draw();}
const mix=(a,b,t)=>a.map((v,i)=>Math.round(v+(b[i]-v)*t));
function prismColor(p){const f=(p.prism.from+time*p.prism.rate)%4,i=Math.floor(f),t=f-i,e=t*t*(3-2*t);return mix(PRACTICES[i],PRACTICES[(i+1)%4],e);}
function draw(){if(!ctx||!width)return;ctx.clearRect(0,0,width,height);const base=tint.map(Math.round).join(','),W=width+80,H=height+80,cx=width/2,cy=height/2;
for(const p of particles){const {depth}=p.layer,zoom=1+(view.s-1)*depth;
let x=((p.x+time*p.drift+view.x*depth)%W+W)%W-40,y=((p.y-time*p.drift*.44+view.y*depth)%H+H)%H-40;x=cx+(x-cx)*zoom;y=cy+(y-cy)*zoom;
const twinkle=.35+.65*Math.pow((Math.sin(time*p.speed+p.phase)+1)/2,2);
// The tinted layer stays quiet: its colour is felt rather than seen. Prism stars carry the four practices in turn.
const rgb=p.prism?prismColor(p).join(','):p.layer.tinted?base:'219,230,224',alpha=twinkle*p.layer.alpha*(p.prism?1.15:1);
ctx.fillStyle=`rgba(${rgb},${alpha})`;ctx.beginPath();ctx.arc(x,y,p.r*(p.prism?1.25:1),0,Math.PI*2);ctx.fill();
if(p.prism||p.flare){const reach=p.prism?9:15,halo=ctx.createRadialGradient(x,y,0,x,y,reach);halo.addColorStop(0,`rgba(${p.prism?rgb:base},${twinkle*(p.prism?.38:.26)})`);halo.addColorStop(1,`rgba(${p.prism?rgb:base},0)`);ctx.fillStyle=halo;ctx.fillRect(x-reach,y-reach,reach*2,reach*2);}
if(p.flare){ctx.strokeStyle=`rgba(228,239,231,${twinkle*.3})`;ctx.lineWidth=.55;ctx.beginPath();ctx.moveTo(x-5,y);ctx.lineTo(x+5,y);ctx.moveTo(x,y-5);ctx.lineTo(x,y+5);ctx.stroke();}}}
function tick(now){frame=0;if(!enabled||!visible||document.hidden)return;if(now-last>=1000/40){const delta=last?Math.min((now-last)/1000,.08):0;time+=delta;last=now;tint=tint.map((v,i)=>v+(targetTint[i]-v)*.045);
// The layers ease after the camera, so a pan glides rather than snaps.
view={x:view.x+(target.x-view.x)*.12,y:view.y+(target.y-view.y)*.12,s:view.s+(target.s-view.s)*.12};draw();
if(time>=nextMeteor){spawnMeteor();nextMeteor=time+8+Math.random()*12;}drawMeteors(delta);}frame=requestAnimationFrame(tick);}
function run(){cancelAnimationFrame(frame);frame=0;last=0;document.documentElement.dataset.motion=enabled?'on':'off';control.textContent=enabled?'✧ Motion on':'✧ Motion off';control.setAttribute('aria-pressed',String(enabled));if(enabled&&visible&&!document.hidden)frame=requestAnimationFrame(tick);else{view={...target};draw();}}
control.onclick=()=>{enabled=!enabled;run();};media.addEventListener('change',()=>{enabled=!media.matches;run();});document.addEventListener('visibilitychange',run);
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;run();},{rootMargin:'100px'}).observe(map);
new ResizeObserver(resize).observe(map);
let bloomTimer;document.addEventListener('star-awakened',()=>{
// Awakening blooms from the selected star in its discipline color; Reveal keeps the wide central bloom.
const star=map.querySelector('.selected-node .node-border');
if(star){const s=star.getBoundingClientRect(),m=map.getBoundingClientRect();map.style.setProperty('--bloom-x',`${s.left+s.width/2-m.left}px`);map.style.setProperty('--bloom-y',`${s.top+s.height/2-m.top}px`);map.style.setProperty('--bloom-size','340px');map.style.setProperty('--bloom-color',star.closest('[data-cluster]').style.getPropertyValue('--node-color'));}
else['--bloom-x','--bloom-y','--bloom-size','--bloom-color'].forEach(v=>map.style.removeProperty(v));
map.classList.remove('cosmic-bloom');requestAnimationFrame(()=>{if(enabled)map.classList.add('cosmic-bloom');});clearTimeout(bloomTimer);bloomTimer=setTimeout(()=>map.classList.remove('cosmic-bloom'),2600);});
// Light runs along the threads you have walked: every few seconds a spark travels one awakened thread, from The Self outward
// or from a class to the class it opened, in that thread's colour. Only while Motion is on and the page is visible.
function sendSpark(){const threads=[...map.querySelectorAll('#stars .thread.committed')].filter(t=>t.getTotalLength&&t.getTotalLength()>40);if(!threads.length)return;
const thread=threads[Math.floor(Math.random()*threads.length)],total=thread.getTotalLength(),color=getComputedStyle(thread).color||'#fff',ns='http://www.w3.org/2000/svg';
const spark=document.createElementNS(ns,'circle');spark.setAttribute('r','2.6');spark.setAttribute('class','thread-spark');spark.style.color=color;thread.after(spark);
const duration=Math.min(2600,700+total*2.2),start=performance.now();
(function step(now){if(!spark.isConnected||!thread.isConnected){spark.remove();return;}const t=Math.min(1,(now-start)/duration),e=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2,p=thread.getPointAtLength(e*total);
spark.setAttribute('cx',p.x.toFixed(1));spark.setAttribute('cy',p.y.toFixed(1));spark.style.opacity=String(Math.sin(t*Math.PI));if(t<1)requestAnimationFrame(step);else spark.remove();})(start);}
(function scheduleSpark(){setTimeout(()=>{if(enabled&&visible&&!document.hidden)sendSpark();scheduleSpark();},2500+Math.random()*3500);})();
updateTint();resize();run();
