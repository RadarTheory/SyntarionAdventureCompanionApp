// Host mode: Syntarion embeds the constellation in an iframe (index.html?host=syntarion) and owns the build.
// The parent sends {type:'init', learned, available, characterId} once the page says it is ready, and may send it
// again later (for example after the DM grants AP). The page reports each change to the build as
// {type:'save', learned, spentDelta, magicTechDelta}: the AP spent (positive) or refunded (negative) and the
// Magic | Tech shift since the last report, so the parent applies them to the character without overwriting grants
// or the lean the character already had from creation.
// Messages are only exchanged with the same origin.
export const HOSTED=typeof location!=='undefined'&&new URLSearchParams(location.search).get('host')==='syntarion';

const send=message=>{try{window.parent.postMessage(message,location.origin);}catch{}};

// Resolves with the first init message. Later init messages go to onUpdate.
export function hostInit(onUpdate){
  if(!HOSTED)return Promise.resolve(null);
  return new Promise(resolve=>{
    let first=true;
    window.addEventListener('message',e=>{
      if(e.origin!==location.origin||e.source!==window.parent||e.data?.type!=='init')return;
      const data={learned:Array.isArray(e.data.learned)?e.data.learned:[],available:Math.max(0,Number(e.data.available)||0),characterId:e.data.characterId??null};
      if(first){first=false;resolve(data);}else onUpdate?.(data);
    });
    send({type:'ready'});
  });
}

export function hostSave({learned,spentDelta,magicTechDelta}){send({type:'save',learned:[...learned],spentDelta,magicTechDelta});}
