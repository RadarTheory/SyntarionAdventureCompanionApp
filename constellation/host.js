// Host mode: Syntarion embeds the constellation in an iframe (index.html?host=syntarion) and owns the build.
// The parent sends {type:'init', learned, available, characterId, startingCalling} once the page says it is ready, and may send it
// again later (for example after the DM grants AP). The page reports each change to the build as
// {type:'save', learned, spentDelta, magicTechDelta}: the AP spent (positive) or refunded (negative) and the
// Magic | Tech shift since the last report, so the parent applies them to the character without overwriting grants
// or the lean the character already had from creation.
// When the host can use abilities (usable, with the trait pools in pools: {trait:{pool,max}}), the drawer opens on the
// character's abilities; a use posts {type:'use', classId, abilityKey, level, levelName} and the host answers {type:'used', ok, message}.
// Messages are only exchanged with the same origin.
export const HOSTED=typeof location!=='undefined'&&new URLSearchParams(location.search).get('host')==='syntarion';
// Pick mode (&pick=1): the character wizard shows the sky to choose a calling. Nothing is bought; choosing a calling
// (selecting its star or any class on its line) posts {type:'pick', classId} with the calling's id.
export const PICKING=HOSTED&&new URLSearchParams(location.search).get('pick')==='1';

const send=message=>{try{window.parent.postMessage(message,location.origin);}catch{}};

// Resolves with the first init message. Later init messages go to onUpdate.
export function hostInit(onUpdate){
  if(!HOSTED)return Promise.resolve(null);
  return new Promise(resolve=>{
    let first=true;
    window.addEventListener('message',e=>{
      if(e.origin!==location.origin||e.source!==window.parent||e.data?.type!=='init')return;
      const data={learned:Array.isArray(e.data.learned)?e.data.learned:[],available:Math.max(0,Number(e.data.available)||0),characterId:e.data.characterId??null,startingCalling:typeof e.data.startingCalling==='string'?e.data.startingCalling:null,usable:e.data.usable===true,pools:e.data.pools&&typeof e.data.pools==='object'?e.data.pools:{}};
      if(first){first=false;resolve(data);}else onUpdate?.(data);
    });
    send({type:'ready'});
  });
}

export function hostPick(classId){send({type:'pick',classId});}

export function hostSave({learned,spentDelta,magicTechDelta}){send({type:'save',learned:[...learned],spentDelta,magicTechDelta});}

export function hostUse({classId,abilityKey,level,levelName}){send({type:'use',classId,abilityKey,level,levelName});}

// The host's answer to a use.
export function onHostReply(callback){if(!HOSTED)return;window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==window.parent||e.data?.type!=='used')return;callback({ok:e.data.ok===true,message:String(e.data.message||'')});});}
