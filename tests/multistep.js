// v2.3 multistep tasks: normalization, derivation, AI tools, postpone (logic)
require('./harness.js');
(async()=>{
await new Promise(r=>setTimeout(r,250));
let pass=0,fail=0;const ok=(n,c)=>{c?pass++:(fail++,console.log('❌',n));};
const today=getRealTodayStr();

// ---- normalizeSteps ----
ok('non-array -> null',normalizeSteps('x')===null);
ok('object -> null',normalizeSteps({})===null);
ok('empty array literal -> []',Array.isArray(normalizeSteps([]))&&normalizeSteps([]).length===0);
ok('single valid -> null',normalizeSteps([{title:'تنها'}])===null);
ok('two valid -> 2',normalizeSteps([{title:'الف'},{title:'ب'}]).length===2);
ok('blank titles dropped below min -> null',normalizeSteps([{title:''},{title:'  '}])===null);
ok('one valid among blanks -> null',normalizeSteps([{title:'تنها'},{title:'  '}])===null);
const six=normalizeSteps([1,2,3,4,5,6].map(i=>({title:'گام '+i})));
ok('six accepted',six.length===6);
ok('seven capped to 6',normalizeSteps([1,2,3,4,5,6,7].map(i=>({title:'گام '+i}))).length===6);
const norm=normalizeSteps([{title:'  الف  ',description:'توضیح'},{title:'ب',note:'یادداشت'}]);
ok('title trimmed',norm[0].title==='الف');
ok('description aliased to note',norm[0].note==='توضیح');
ok('note kept',norm[1].note==='یادداشت');
ok('ids generated',!!norm[0].id&&!!norm[1].id);
ok('title capped 200',normalizeSteps([{title:'x'.repeat(300)},{title:'ب'}])[0].title.length===200);
ok('note capped 1000',normalizeSteps([{title:'الف',note:'x'.repeat(2000)},{title:'ب'}])[0].note.length===1000);

// ---- task shape + derivation ----
const mk=(step,status)=>{const t={id:'m',title:'چندمرحله‌ای',steps:norm,step,date:today,status:status||'todo'};syncMultiStep(t);return t;};
ok('isMultiStep true',isMultiStep({steps:norm,step:0})===true);
ok('isMultiStep false plain',isMultiStep({})===false);
ok('msTotal',msTotal(mk(0))===2);
ok('step0 -> todo',mk(0).status==='todo');
ok('step1 -> doing',mk(1).status==='doing');
ok('step2 -> done',mk(2).status==='done');
ok('step2 completed flag',mk(2).completed===true);
ok('step0 completed false',mk(0).completed===false);
ok('msIndex done count',msIndex(mk(1))===1);

// msAdvance
let t=mk(0);
ok('advance returns new step',msAdvance(t)===1);
ok('advance status doing',t.status==='doing');
msAdvance(t);
ok('advance to end done',t.status==='done'&&t.step===2);
msAdvance(t);
ok('advance clamps at end',t.step===2&&t.status==='done');

// rollback
msSetStep(t,0);
ok('explicit rollback to 0 wins over done',t.step===0&&t.status==='todo');
msSetStep(t,1);
ok('rollback midpoint doing',t.step===1&&t.status==='doing');
msReset(t,true);
ok('reset to 0',t.step===0&&t.status==='todo');

// legacy done + raw step 0 -> all done
const legacy={steps:norm,step:0,status:'done',date:today};syncMultiStep(legacy);
ok('legacy done expands all steps',legacy.step===2&&legacy.status==='done');
// postponed preserves progress/status
const p0={steps:norm,step:1,status:'postponed',date:today};syncMultiStep(p0);
ok('postponed keeps status',p0.status==='postponed'&&p0.step===1);

// ---- AI: create_task ----
state.tasks=[];state.folders=[];
let r=executeAITool('create_task',{title:'تک‌مرحله‌ای رد می‌شود',steps:[{title:'فقط یکی'}]});
ok('create with 1 step fails',!r.ok&&/۲/.test(r.error));
ok('nothing created on failure',state.tasks.length===0);
r=executeAITool('create_task',{title:'هفت مرحله',steps:[1,2,3,4,5,6,7].map(i=>({title:'گام '+i}))});
ok('create with 7 fails',!r.ok);
r=executeAITool('create_task',{title:'پروژه',steps:[{title:'الف'},{title:'ب'},{title:'توضیح‌دار',description:'جزئیات مرحله سوم'}]});
ok('create 3 steps ok',r.ok&&r.steps===3&&r.step===0);
const id=r.taskId||state.tasks[0].id;
let task=state.tasks.find(x=>x.id===id);
ok('created task multistep',isMultiStep(task)&&task.steps.length===3);

// complete_task_step
r=executeAITool('complete_task_step',{taskId:id});
ok('step tool returns step 1 doing',r.ok&&r.step===1&&r.status==='doing');
r=executeAITool('complete_task_step',{taskId:id});
ok('step 2',r.step===2&&r.status==='doing');
r=executeAITool('complete_task_step',{taskId:id});
ok('last step -> done',r.step===3&&r.status==='done');
r=executeAITool('complete_task_step',{taskId:id});
ok('beyond end stays done',r.status==='done'&&r.step===3);
r=executeAITool('complete_task_step',{taskId:'nope'});
ok('missing task fails',!r.ok);
const plain=executeAITool('create_task',{title:'ساده'});
r=executeAITool('complete_task_step',{taskId:plain.taskId});
ok('step tool rejects plain task',!r.ok);

// reset_task_steps
r=executeAITool('reset_task_steps',{taskId:id});
ok('reset via AI',r.ok&&r.step===0&&r.status==='todo');

// update_task steps
r=executeAITool('update_task',{taskId:id,steps:null});
ok('strip steps',r.ok&&r.steps===0&&!isMultiStep(state.tasks.find(x=>x.id===id)));
r=executeAITool('update_task',{taskId:id,steps:[{title:'جدید ۱'},{title:'جدید ۲'}]});
ok('re-add steps via update',r.ok&&r.steps===2);
r=executeAITool('update_task',{taskId:id,steps:[{title:'تنها'}]});
ok('update with 1 fails',!r.ok);

// ---- context shape ----
const c=executeAITool('get_tasks',{});
const multi=c.tasks.find(x=>x.id===id);
ok('context multiStep true',multi.multiStep===true&&multi.totalSteps===2);
ok('context steps list',multi.steps.length===2&&multi.steps[0].title==='جدید ۱'&&multi.steps[0].done===false);
ok('plain context says false',c.tasks.find(x=>x.id===plain.taskId).multiStep===false);
executeAITool('complete_task_step',{taskId:id});
const c2=executeAITool('get_tasks',{}).tasks.find(x=>x.id===id);
ok('context step done flags',c2.step===1&&c2.steps[0].done===true&&c2.steps[1].done===false);

// ---- postpone copies steps ----
const target=(()=>{const d=new Date();d.setDate(d.getDate()+2);return formatGregorian(d.getFullYear(),d.getMonth()+1,d.getDate());})();
r=executeAITool('postpone_task',{taskId:id,targetDate:target});
ok('postpone ok',r.ok);
const copy=state.tasks.find(x=>x.id===r.newTaskId);
ok('copy has steps',isMultiStep(copy)&&copy.steps.length===2);
ok('copy carries progress',copy.step===1);
const orig=state.tasks.find(x=>x.id===id);
ok('orig marked postponed',orig.status==='postponed');

// ---- tool declarations + caps + prompt ----
const decls=buildAITools(false);
const names=decls.flatMap(g=>g.functionDeclarations?g.functionDeclarations.map(f=>f.name):(g.name?[g.name]:[]));
ok('complete_task_step declared',names.includes('complete_task_step'));
ok('reset_task_steps declared',names.includes('reset_task_steps'));
ok('steps in create_task schema',JSON.stringify(decls).includes('steps'));
ok('cap under tasks',TOOL_CAP.complete_task_step==='tasks'&&TOOL_CAP.reset_task_steps==='tasks');
ok('prompt mentions multistep rule',buildAISystemPrompt(false).includes('چندمرحله‌ای'));
state.settings.aiCaps.tasks=false;
ok('tools gated when tasks cap off',executeAITool('complete_task_step',{taskId:id}).ok===false);
state.settings.aiCaps.tasks=true;

console.log(`\n${pass} passed, ${fail} failed`);process.exit(fail?1:0);
})().catch(e=>{console.error('FATAL',e.stack);process.exit(1);});
