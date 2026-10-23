// v3 vibe logic: mood+fatigue check-ins, task linkage, snapshots, about, AI
require('./harness.js');
(async()=>{
await new Promise(r=>setTimeout(r,250));
let pass=0,fail=0;const ok=(n,c)=>{c?pass++:(fail++,console.log('❌',n));};
global.document.getElementById=id=>id==='aiPlanMode'?{checked:true}:null;

let e=normalizeVibe({mood:2,fatigue:4,note:'x',taskId:'t1',taskTitle:'مطالعه'});
ok('normal shape',e.mood===2&&e.fatigue===4&&e.note==='x'&&e.taskId==='t1'&&e.taskTitle==='مطالعه'&&e.id);
ok('defaults',normalizeVibe({}).mood===3&&normalizeVibe({}).fatigue===3);
ok('bad mood clamps to 3',normalizeVibe({mood:99}).mood===3);
ok('fatigue clamps',normalizeVibe({fatigue:9}).fatigue===3);
ok('legacy energy inverted to fatigue',normalizeVibe({mood:4,energy:5}).fatigue===1);
ok('legacy energy low -> high fatigue',normalizeVibe({mood:4,energy:1}).fatigue===5);
ok('note cap 1000',normalizeVibe({note:'x'.repeat(2000)}).note.length===1000);
ok('task title cap 120',normalizeVibe({taskTitle:'x'.repeat(200)}).taskTitle.length===120);

const day=off=>{const d=new Date();d.setDate(d.getDate()+off);return formatGregorian(d.getFullYear(),d.getMonth()+1,d.getDate());};
state.vibeEntries=[];
[[-3,2,4],[-2,3,3],[-1,5,2],[0,4,2]].forEach(([off,m,f])=>addVibeEntry({mood:m,fatigue:f,ts:new Date(day(off)+'T12:00').getTime()}));
let s=vibeSeries(7);
ok('series 7 len',s.length===7);
ok('series today mood 4',s.at(-1).mood===4);
ok('series today fatigue 2',s.at(-1).fatigue===2);
ok('empty day null',s[0].mood===null);
let st=vibeStats();
ok('avg mood7 rounded',Math.abs(st.avgMood7-3.5)<0.001);
ok('avg fatigue7',Math.abs(st.avgFatigue7-2.75)<0.001);
ok('streak 4',st.streak===4);
ok('total 4',st.total===4);
ok('latest today',st.latest.mood===4&&st.todayCount===1);
state.vibeEntries=state.vibeEntries.filter(x=>vibeDateOf(x.ts)!==day(0));
ok('streak tolerates no check-in today',vibeStats().streak===3);
state.vibeEntries=[];
addVibeEntry({mood:2,fatigue:4,ts:new Date(day(0)+'T09:00').getTime()});
addVibeEntry({mood:4,fatigue:2,ts:new Date(day(0)+'T20:00').getTime()});
ok('same-day avg mood 3',vibeSeries(1).at(-1).mood===3);

state.vibeEntries=[];
state.tasks=[{id:'t1',title:'گیتار'},{id:'t2',title:'ظرف'}];
addVibeEntry({mood:5,fatigue:1,taskId:'t1',taskTitle:'گیتار'});
ok('latest vibe by task id',taskLatestVibe(state.tasks[0]).mood===5);
addVibeEntry({mood:2,fatigue:4,taskId:null,taskTitle:'ظرف'});
ok('latest vibe falls back to title',taskLatestVibe(state.tasks[1]).mood===2);
ok('no vibe -> null',taskLatestVibe({id:'x',title:'ندارم'})===null);

state.vibeEntries=[];
addVibeEntry({mood:4,fatigue:2,taskTitle:'گیتار',note:'حال داد'});
const snap=vibeSnapshot();
ok('snapshot today',snap.checkedInToday&&snap.today.mood===4&&snap.today.fatigueLabel);
ok('snapshot taskFeelings agg',snap.taskFeelings.some(x=>x.title==='گیتار'&&x.count===1&&x.avgMood===4));
ok('snapshot series30 len',snap.series30.length===30);
ok('snapshot recentNotes',snap.recentNotes.some(n=>n.note==='حال داد'));

state.settings.aiCaps.vibe=true;
let r=executeAITool('get_vibe',{});
ok('get_vibe tool',r.ok&&r.today&&r.series30.length===30);
r=executeAITool('log_vibe',{mood:3});
ok('log_vibe default fatigue',r.ok&&r.saved&&r.mood===3);
ok('log_vibe total grew',state.vibeEntries.length===2);
r=executeAITool('log_vibe',{mood:5,fatigue:1,taskTitle:'گیتار',note:'عالی'});
ok('log_vibe resolves task title',r.ok&&r.task==='گیتار');
r=executeAITool('log_vibe',{mood:9});
ok('log_vibe rejects bad mood',!r.ok);
state.settings.aiCaps.vibe=false;
ok('get_vibe gated',!executeAITool('get_vibe',{}).ok);
ok('tools hidden when cap off',buildAITools(false).every(t=>!['get_vibe','log_vibe'].includes(t.name)));
state.settings.aiCaps.vibe=true;
ok('tools present when cap on',buildAITools(false).some(t=>t.name==='get_vibe')&&buildAITools(false).some(t=>t.name==='log_vibe'));
ok('TOOL_CAP vibe',TOOL_CAP.get_vibe==='vibe'&&TOOL_CAP.log_vibe==='vibe');

state.settings.aiCaps.vibe=true;state.settings.aiCaps.about=true;
state.aboutMe=[normalizeAbout({text:'صبح‌ها سرحالم'})];
let ctx=buildAIContext(false);
ok('ctx vibe when cap on',!!ctx.vibe);
ok('ctx aboutMe when cap on',Array.isArray(ctx.aboutMe)&&ctx.aboutMe[0].text==='صبح‌ها سرحالم');
state.settings.aiCaps.about=false;
ctx=buildAIContext(false);
ok('ctx aboutMe gated off',ctx.aboutMe===undefined);
state.settings.aiCaps.vibe=false;
ctx=buildAIContext(false);
ok('ctx vibe gated off',ctx.vibe===undefined);
state.settings.aiCaps.vibe=true;state.settings.aiCaps.about=true;

state.settings.aiMode='task';
const pTask=buildAISystemPrompt(false);
ok('task prompt persona',pTask.includes('برنامه‌ریزی روزانه'));
state.settings.aiMode='vibe';
const pVibe=buildAISystemPrompt(true);
ok('vibe prompt persona',pVibe.includes('خوش‌گذران')&&pVibe.includes('postpone_task'));
ok('vibe crisis numbers',pVibe.includes('۱۴۸۰')&&pVibe.includes('۱۱۵'));
ok('about memory injected',pVibe.includes('صبح‌ها سرحالم'));
state.settings.aiCaps.about=false;
ok('memory absent when cap off',!buildAISystemPrompt(true).includes('صبح‌ها سرحالم'));
state.settings.aiCaps.about=true;state.settings.aiMode='task';

const a=normalizeAbout({text:'  من شب‌کارم  '});
ok('about normalizes',a.text==='من شب‌کارم'&&a.id&&a.ts&&a.updatedAt);
ok('about text cap 4000',normalizeAbout({text:'ز'.repeat(5000)}).text.length===4000);

console.log(`\n${pass} passed, ${fail} failed`);process.exit(fail?1:0);
})().catch(e=>{console.error('FATAL',e.stack);process.exit(1);});
