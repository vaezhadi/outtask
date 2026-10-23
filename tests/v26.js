// v2.6 logic: timer-only activities, sleep, day metrics, relative scoring, daily review scheduler
require('./harness.js');
(async()=>{
 await new Promise(r=>setTimeout(r,300));
 let pass=0,fail=0;const ok=(n,c)=>{c?pass++:(fail++,console.log('❌',n));};
 const today=getRealTodayStr();
 const mkDate=(d,h,m)=>dayStartOf(d)+(h*60+(m||0))*60000;

 // ---- registry ----
 ok('four default activities',allActivities().length===4);
 ok('sleep builtin',getActivity('act:sleep')&&getActivity('act:sleep').title==='خواب');
 ok('rest builtin',getActivity('act:rest').title==='استراحت');
 ok('isActivityId',isActivityId('act:rest')&&!isActivityId('t123'));
 const cid=activityIdFor('مطالعه آزاد');
 ok('custom id stable',cid===activityIdFor('مطالعه آزاد')&&cid.indexOf('act:c_')===0);
 state.settings.customActivities=[{title:'مطالعه آزاد'},{title:'یوگا'}];
 ok('custom activities listed',allActivities().filter(a=>a.custom).length===2);
 ok('resolver finds custom',sessionRefById(activityIdFor('یوگا')).kind==='activity');
 ok('duplicate custom title deduped',(function(){state.settings.customActivities.push({title:'یوگا'});return allActivities().filter(a=>a.title==='یوگا').length;})()===1);
 state.settings.customActivities=[{title:'مطالعه آزاد'},{title:'یوگا'}];
 ok('alias resolution builtin',resolveActivityRef('استراحت').id==='act:rest');
 ok('alias resolution english sleep',resolveActivityRef('sleep').id==='act:sleep');
 const made=resolveActivityRef('نقاشی');
 ok('alias resolution creates custom',made&&made.custom&&state.settings.customActivities.some(a=>a.title==='نقاشی'));

 // archived activities stay resolvable for history but disappear from the picker
 state.settings.customActivities=[{title:'نقاشی',archived:true},{title:'یوگا'}];
 ok('archived excluded from selectable',!selectableActivities().some(a=>a.title==='نقاشی'));
 ok('archived still resolvable (history intact)',sessionRefById(activityIdFor('نقاشی'))&&sessionRefById(activityIdFor('نقاشی')).title==='نقاشی');
 unarchiveActivity('نقاشی');
 ok('un-archive works',selectableActivities().some(a=>a.title==='نقاشی'));

 // tasks vs activities
 state.tasks=[{id:'t1',title:'کار اصلی',status:'done',completed:true,date:today,color:'#fff',lines:2,createdAt:Date.now(),timeSpent:0,folderId:null}];
 ok('task resolver',sessionRefById('t1').kind==='task');
 ok('missing resolver null',sessionRefById('nope')===null);

 // ---- sleep ranges ----
 const r1=sleepRangeForDay(today,23*60,6*60);
 ok('evening bed -> previous day',new Date(r1.start).getHours()===23&&new Date(r1.end).getHours()===6&&r1.start<r1.end);
 ok('sleep duration 7h',Math.round((r1.end-r1.start)/3600000)===7);
 const r2=sleepRangeForDay(today,60,8*60);
 ok('after midnight bed -> same day',new Date(r2.start).getHours()===1&&new Date(r2.start).getDate()===new Date(dayStartOf(today)).getDate());
 let bad=false;try{saveSleep(today,800,700);}catch(e){bad=true;}
 ok('implausible sleep rejected',bad);

 // saveSleep trims overlapping task work (you cannot work while asleep)
 state.sessions=[];
 upsertSession({id:uid(),taskId:'t1',start:mkDate(today,2,0),end:mkDate(today,5,0),duration:3*3600});
 const sl=saveSleep(today,23*60,6*60);
 ok('sleep saved',sl.taskId==='act:sleep'&&sl.activity===true);
 const t1left=state.sessions.find(s=>s.taskId==='t1');
 ok('overlap with sleep removed from task',!t1left);
 ok('findDaySleep finds it',!!findDaySleep(today));
 // replace, not duplicate
 saveSleep(today,23*60+30,6*60+30);
 ok('re-save replaces',state.sessions.filter(s=>s.taskId==='act:sleep').length===1);
 const sl2=findDaySleep(today);
 ok('re-save new times',new Date(sl2.start).getHours()===23&&new Date(sl2.start).getMinutes()===30);

 // ---- non-sleep activity logging ----
 const {sess:rs}=aiLogSessionForTarget('act:rest',today,'13:00','13:20');
 ok('rest block logged',rs.taskId==='act:rest'&&Math.round(rs.duration/60)===20&&rs.activity===true);
 recomputeAllTimeSpent();
 const t1=state.tasks.find(t=>t.id==='t1');
 ok('task timeSpent unaffected by activities',t1.timeSpent===0);

 // task block
 const {sess:ws}=aiLogSessionForTarget('t1',today,'10:00','11:30');
 ok('work block logged',Math.round(ws.duration/60)===90);
 recomputeAllTimeSpent();
 ok('task timeSpent sums work only',Math.round(t1.timeSpent/60)===90);

 // ---- day metrics ----
 const m=dayMetrics(today);
 ok('focus excludes activities',m.focusMin===90);
 ok('sleep metric 6h30 morning part (clipped to wake day)',m.sleepMin===390);
 ok('activities breakdown includes rest',m.activities.some(a=>a.title==='استراحت'&&a.minutes===20));
 ok('done counted',m.done===1);
 ok('workScore composite',m.workScore===90+15);
 ok('tasks list includes done',m.tasks.some(t=>t.title==='کار اصلی'&&t.status==='done'));

 // clipping: incoming overnight session contributes to wake-day metrics, not start day
 state.sessions=[];
 saveSleep(today,23*60,7*60);
 const mt=dayMetrics(today);
 const yest=dayMetrics(dateAddStr(today,-1));
 ok('wake day gets 7h morning sleep',mt.sleepMin===420);
 ok('start day keeps the pre-midnight hour (60m)',yest.sleepMin===60);

 // ---- scoring policy ----
 ok('empty day low',applyScorePolicy(80,{workScore:0,done:0},null)<=35);
 ok('near-empty day cap 55',applyScorePolicy(90,{workScore:10,done:0},{workScore:200})<=55);
 ok('no baseline cap 84',applyScorePolicy(99,{workScore:300,done:3},null)<=84);
 ok('100 impossible even huge improvement',applyScorePolicy(100,{workScore:500,done:5},{workScore:100})===92);
 ok('91+ only beyond 25% (1.25x -> 92)',applyScorePolicy(99,{workScore:125,done:1},{workScore:100})===92);
 ok('exact 25% hits 92',applyScorePolicy(99,{workScore:125},{workScore:100})===92);
 ok('10% better caps 90',applyScorePolicy(99,{workScore:111},{workScore:100})<=90&&applyScorePolicy(99,{workScore:111},{workScore:100})>=90);
 ok('tiny better caps 89',applyScorePolicy(99,{workScore:105},{workScore:100})===89);
 ok('equal caps 87',applyScorePolicy(99,{workScore:100},{workScore:100})===87);
 ok('regression caps 87',applyScorePolicy(99,{workScore:60},{workScore:100})===87);
 ok('negative score clamped 0',applyScorePolicy(-5,{workScore:100},{workScore:100})===0);
 ok('garbage score numeric',Number.isFinite(applyScorePolicy('abc',{workScore:100},{workScore:100})));

 // ---- personal best across history ----
 state.sessions=[];state.tasks=[];
 const dPeak=dateAddStr(today,-10);
 state.tasks.push({id:'pk',title:'روز اوج',status:'done',completed:true,date:dPeak,color:'#fff',lines:2,timeSpent:0,folderId:null});
 aiLogSessionForTarget('pk',dPeak,'09:00','13:00'); // 240 min + 15 done = 255
 const dMid=dateAddStr(today,-5);
 state.tasks.push({id:'md',title:'روز معمولی',status:'done',completed:true,date:dMid,color:'#fff',lines:2,timeSpent:0,folderId:null});
 aiLogSessionForTarget('md',dMid,'09:00','11:00'); // 120+15=135
 const best=bestMetricsBefore(today,120);
 ok('best day detected',best.date===dPeak&&best.workScore===255);

 // ---- scheduler with mocked network ----
 state.dayReviews=[];state.settings.lastReviewDate=null;state.settings.aiApiKey='test-key';
 let bodies=[];
globalThis.fetch=async(url,opts)=>{bodies.push(JSON.parse(opts.body));
  const bodyText=JSON.stringify({score:88,analysis:'تلاش خوب بود'});
  const payload={candidates:[{content:{parts:[{text:bodyText}]}}]};
  return {ok:true,status:200,json:async()=>payload};
};
 state.settings.dayEndHour=23;
 checkDailyReview();
 await new Promise(r=>setTimeout(r,700));
 ok('auto review created',state.dayReviews.length===1);
 const autoReview=state.dayReviews[0];
 ok('payload includes all three contexts',JSON.stringify(bodies[0].contents).includes('dayBeforeYesterday')&&JSON.stringify(bodies[0].contents).includes('highestScoredDaySoFar'));
 ok('request has no tools',!bodies[0].tools);
 ok('first day no-baseline score <=84',autoReview.score<=84);
 ok('watermark set',state.settings.lastReviewDate!=null);
 const wm=state.settings.lastReviewDate;
 checkDailyReview();await new Promise(r=>setTimeout(r,200));
 ok('no duplicate run',state.dayReviews.length===1&&bodies.length===1);
 // API failure must not move watermark
 state.settings.lastReviewDate=null;state.dayReviews=[];bodies=[];
 globalThis.fetch=async()=>({ok:false,status:429,json:async()=>({error:{message:'rate'}})});
 let err=null;try{await runDailyReview(dateAddStr(today,-1));}catch(e){err=e;}
 ok('failure rejects',!!err);
 ok('failure stores nothing',state.dayReviews.length===0&&state.settings.lastReviewDate===null);
 // parse fallback: prose instead of JSON
 globalThis.fetch=async()=>({ok:true,status:200,json:async()=>({candidates:[{content:{parts:[{text:'امروز خوب کار کردی ولی خسته بودی.'}]}}]})});
 const rev2=await runDailyReview(dateAddStr(today,-2));
 ok('prose fallback keeps text',rev2.analysis.includes('خسته بودی'));
 ok('parse fallback score capped',rev2.score<=55);

 console.log(`\n${pass} passed, ${fail} failed`);process.exit(fail?1:0);
})().catch(e=>{console.error('FATAL',e.stack);process.exit(1);});
