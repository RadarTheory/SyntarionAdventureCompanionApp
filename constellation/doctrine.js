// English-only reading of the Doctrine's named table entries.
// Glyphs are cut from the user's Syntarion-defined sheet (SYNTARION/Currency).
// Hope sits beyond the two groups: it is Psynth's aspect, revealed with Praethacy.
export const hopeAspect={name:'Hope',glyph:'assets/aspect-icons/hope.png',symbol:'◈',description:'Beyond what is known, explore what may yet be.'};
// These describe being and expression, not disciplines or unlock prerequisites.
export const doctrineSource={title:'The Syntarion Doctrine of Being',url:'https://docs.google.com/document/d/1DHM9Sn9W7yUIq5v_co_jeE0Yu-7tYaHy/edit'};
export const doctrineGroups=[
{id:'pillars',name:'Pillars of Being',question:'What are we made of?',description:'That which is given.',aspects:[
{name:'Spirit',glyph:'assets/aspect-icons/spirit.png',symbol:'♧',description:'The witnessing self: awareness and the memory of beginnings.'},
{name:'Soul',glyph:'assets/aspect-icons/soul.png',symbol:'☉',description:'Memory, continuity, and return; the bond between what was and what will be.'},
{name:'Body',glyph:'assets/aspect-icons/body.png',symbol:'⟐',description:'The physical vessel of the journey, shaped by lived choices.'},
{name:'Mind',glyph:'assets/aspect-icons/mind.png',symbol:'⌁',description:'The current of becoming that connects things and stirs life into motion.'}
]},
{id:'instruments',name:'Instruments of Expression',question:'How do we shape the world?',description:'That which moves within.',aspects:[
{name:'Affect',glyph:'assets/aspect-icons/affect.png',symbol:'♬',description:'Emotion, pattern, and meaning: the inner forge through which feeling takes shape.'},
{name:'Will',glyph:'assets/aspect-icons/will.png',symbol:'⌖',description:'Agency and choice: turning thought into action.'},
{name:'Whim',glyph:'assets/aspect-icons/whim.png',symbol:'✧',description:'Passion and the inner fire that moves the heart.'},
{name:'Dream',glyph:'assets/aspect-icons/dream.png',symbol:'☽',description:'Possibility beyond what is known; envisioning what may yet be.'}
]}
];
export function aspectForClass(cls){for(const group of doctrineGroups){const aspect=group.aspects.find(a=>a.name===cls.attribute);if(aspect)return {...aspect,groupId:group.id,groupName:group.name,kind:group.id==='pillars'?'Pillar of Being':'Instrument of Expression'};}return cls.attribute==='Hope'?{...hopeAspect,groupId:'beyond',groupName:'Beyond the known',kind:'Aspect of Hope'}:null;}
