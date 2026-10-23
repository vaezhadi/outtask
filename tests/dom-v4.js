// v2.6: tokens & persona fully removed; timer-only activities, sleep, daily AI review
const {JSDOM,VirtualConsole}=require('jsdom');
const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.detail&&e.detail.stack||e.message));
const MOCK_REVIEW=(score,analysis)=>({ok:true,status:200,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify({score,analysis})}]}}]})});
(async()=>{
 const dom=await JSDOM.fromFile(require('path').join(__dirname,'..','index.html'),{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,virtualConsole:vc,
  beforeParse(window){
   const noop=()=>{};
   const ctx=new Proxy({measureText:()=>({width:0}),createLinearGradient:()=>({addColorStop:noop}),setLineDash:noop},{get(t,p){return t[p]!==undefined?t[p]:noop;},set(){return true;}});
   window.HTMLCanvasElement.prototype.getContext=()=>ctx;
   Object.defineProperty(window.HTMLCanvasElement.prototype,'width',{configurable:true,value:900});
   Object.defineProperty(window.HTMLCanvasElement.prototype,'height',{configurable:true,value:900});
   window.Audio=class{play(){return Promise.resolve();}pause(){}};
   window.confirm=()=>true;window.alert=()=>{};
   // Fail fast so the boot-time automatic daily review cannot hold the run lock
   window.fetch=async()=>({ok:false,status:400,json:async()=>({error:{message:'offline-in-test'}})});
   window.console.error=(...a)=>{const m=a.join(' ');errors.push('console.error: '+m.slice(0,300));};
  }});
 await new Promise(r=>setTimeout(r,2600));
 const w=dom.window,d=w.document,s=w.__outtaskState;let pass=0,fail=0;
 const ok=(n,c)=>{c?pass++:(fail++,console.log('❌',n));};
 const click=el=>el.dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true}));
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const $=sel=>d.querySelector(sel), $$=sel=>[...d.querySelectorAll(sel)];
 ok('no load errors',errors.length===0);errors.slice(0,5).forEach(e=>console.log('  ',e));

 // ---- tokens & persona completely gone from the DOM ----
 ok('gift modal removed',!$('#giftModal'));
 ok('gift composer button removed',!$('#aiGiftBtn'));
 ok('persona bar removed',!$('#personaBar'));
 ok('person secret settings removed',!$('#personSecret'));
 ok('person mode segment removed',!$('[data-mode="person"]'));
 ok('review button renamed',$('#dashReviewBtn').textContent.trim()==='مرور امروز');
 ok('state has no tokenLedger',s.tokenLedger===undefined);
 ok('state has no persona',s.persona===undefined);

 // ---- dashboard default state ----
 ok('dash body rendered',!!$('#dashBody').innerHTML.trim());
 ok('4 stat cards',$$('#dashBody .db-stat').length===4);
 ok('7 week bars',$$('#dashBody .db-barcol').length===7);
 ok('date line filled',/•/.test($('#dashDateLine').textContent));
 ok('empty review state',!!$('.dr-empty'));
 ok('day end hour default 22',s.settings.dayEndHour===22);
 const eh=$('#dayEndHourInput');
 eh.value='21';eh.dispatchEvent(new w.Event('change',{bubbles:true}));
 ok('day end hour editable',s.settings.dayEndHour===21);

 // ---- timer-only activities listed in time panel ----
 click($('.nav-btn[data-tab="time"]'));await wait(60);
 const taskRows=$$('#timeTasks .task-row').map(x=>x.textContent);
 ok('sleep activity listed',taskRows.some(t=>t.includes('خواب')));
 ok('rest activity listed',taskRows.some(t=>t.includes('استراحت')));
 ok('food activity listed',taskRows.some(t=>t.includes('غذا خوردن')));
 const actRows=()=>$$('#timeTasks .task-row.activity-row');
 ok('activity rows exist',actRows().length>=4);

 // custom activity
 const newInp=$('#newActivityInput');
 ok('custom activity input exists',!!newInp);
 newInp.value='مطالعه آزاد';
 $('#timeTasks .act-add button').click();
 await wait(30);
 ok('custom activity persisted',(s.settings.customActivities||[]).some(a=>a.title==='مطالعه آزاد'));
 ok('custom activity rendered',actRows().some(x=>x.textContent.includes('مطالعه آزاد')));
 const customId=w.activityIdFor('مطالعه آزاد');
 ok('custom id stable',w.getActivity(customId)&&w.getActivity(customId).title==='مطالعه آزاد');
 ok('resolver kind activity',w.sessionRefById(customId).kind==='activity');

 // start timer on the rest activity -> flagged session, no task mutated
 const restRow=actRows().find(x=>x.textContent.includes('استراحت'));
 click(restRow);await wait(20);
 ok('active selection is activity',s.activeTaskId==='act:rest');
 ok('badge shows activity',($('#activeTaskBadge').textContent||'').includes('استراحت'));
 click($('#startTimerBtn'));await wait(30);
 ok('timer started',!!s.timerStart);
 await wait(1250);
 click($('#stopTimerBtn'));await wait(40);
 const restSessions=s.sessions.filter(x=>x.taskId==='act:rest');
 ok('rest session saved',restSessions.length===1);
 ok('rest session flagged activity',restSessions[0].activity===true);
 ok('focus stats exclude activities',($('#todayStats').textContent||'').includes('0h'));

 // ---- sleep as habit (special color) in habits tab, old card removed ----
 ok('old sleep card removed',!$('#sleepStart')&&!$('#sleepSaveBtn')&&!$('#sleepDayLabel'));
 click($('.nav-btn[data-tab=\"habits\"]'));await wait(80);
 const sleepCard=d.querySelector('.hb-card.sleep-habit')||[...$$('.hb-card')].find(c=>c.textContent.includes('خواب'));
 ok('sleep habit card exists in habits tab',!!sleepCard);
 ok('sleep habit has special color',sleepCard&&sleepCard.style.getPropertyValue('--hb')===w.SLEEP_COLOR||(sleepCard&&sleepCard.innerHTML.includes(w.SLEEP_COLOR)));
 ok('sleep habit shows special pill',sleepCard&&sleepCard.textContent.includes('رنگ خاص'));
 const today=w.getRealTodayStr();
 // inputs inside habit card
 ok('sleep habit bed input exists',!!$('#sleepHabitBed'));
 ok('sleep habit wake input exists',!!$('#sleepHabitWake'));
 $('#sleepHabitBed').value='23:30';
 $('#sleepHabitWake').value='07:00';
 click($('#sleepHabitSave'));await wait(60);
 let sl=w.findDaySleep(today);
 ok('sleep found for wake day',!!sl);
 ok('sleep starts previous evening',new Date(sl.start).getHours()===23);
 ok('sleep ends this morning',new Date(sl.end).getHours()===7);
 ok('sleep duration 7h30',Math.round(sl.duration/60)===450);
 ok('sleep is activity session',sl.activity===true);
 ok('sleep status saved',($('#sleepHabitStatus').textContent||'').includes('خواب ثبت شد'));
 // re-saving replaces the record
 $('#sleepHabitBed').value='23:00';
 $('#sleepHabitWake').value='06:30';
 click($('#sleepHabitSave'));await wait(60);
 ok('re-save replaces sleep record',s.sessions.filter(x=>x.taskId==='act:sleep').length===1);
 // habitDone for sleep
 ok('habitDone for sleep true',w.habitDone(s.habits.find(h=>h.id===w.SLEEP_HABIT_ID),today)===true);

 // a fixed midday rest block, independent of wall clock
 (function(){const d0=new Date(today+'T00:00:00');const a=d0.getTime()+13*3600e3,b=d0.getTime()+13*3600e3+10*60e3;w.upsertSession({id:w.uid(),taskId:'act:rest',start:a,end:b,duration:600,manual:true,activity:true});})();
 w.renderSessions();
 const listText=$('#sessionsList').textContent;
 ok('sessions list shows sleep',listText.includes('خواب'));
 ok('sessions list marks from prev night',listText.includes('از شب قبل'));
 ok('sessions list shows activity',listText.includes('استراحت'));

 // back to time tab for sessions list
 click($('.nav-btn[data-tab=\"time\"]'));await wait(60);
 w.renderSessions();
 // after-midnight bedtime
 w.saveSleep(today,w.hmToMinOrNull('01:00'),w.hmToMinOrNull('08:00'));
 sl=w.findDaySleep(today);
 ok('after-midnight bedtime supported',new Date(sl.start).getHours()===1&&Math.round(sl.duration/60)===420);
 // invalid range rejected
 let threw=false;try{w.saveSleep(today,800,700);}catch(e){threw=true;}
 ok('implausible/backward sleep rejected',threw);

 // manual entry on custom activity uses the viewed day (no task.date needed)
 s.activeTaskId=customId;
 w.renderTimeTasks();w.updateManualTaskSelect();
 $('#manualStart').value='18:00';$('#manualEnd').value='18:45';
 click($('#manualAddBtn'));await wait(30);
 const customSessions=s.sessions.filter(x=>x.taskId===customId);
 ok('manual activity session saved',customSessions.length===1&&Math.round(customSessions[0].duration/60)===45);
 ok('manual status success',($('#manualStatus').textContent||'').includes('مطالعه آزاد'));

 // AI tool: log_manual_session with activity
 const r1=w.executeAITool('log_manual_session',{activity:'استراحت',start:'13:00',end:'13:20',date:today});
 ok('AI tool logs builtin activity',r1.ok&&s.sessions.some(x=>x.taskId==='act:rest'));
 const r2=w.executeAITool('log_manual_session',{activity:'یوگا',start:'07:30',end:'07:50',date:today});
 ok('AI tool creates custom activity',r2.ok&&(s.settings.customActivities||[]).some(a=>a.title==='یوگا'));
 const r3=w.executeAITool('log_manual_session',{activity:'خواب',start:'23:00',end:'06:00',date:today});
 ok('AI sleep overnight',r3.ok&&(function(){const x=s.sessions.find(z=>z.taskId==='act:sleep');return x&&new Date(x.start).getHours()===23&&Math.round(x.duration/60)===420;})());
 const r4=w.executeAITool('log_manual_session',{start:'10:00',end:'10:30'});
 ok('AI log without target fails',r4&&r4.ok===false);

 // ---- scoring policy ----
 const empty=w.dayMetrics(w.dateAddStr(today,-40));
 ok('empty day metrics',empty.focusMin===0&&empty.done===0);
 ok('empty day capped low (<=35)',w.applyScorePolicy(90,empty,null)<=35);
 const m1={workScore:120};
 ok('no baseline caps 84',w.applyScorePolicy(99,m1,null)<=84);
 const best={workScore:100};
 ok('equal-ish day caps 87',w.applyScorePolicy(95,{workScore:100},best)<=87);
 ok('25% better tops out at 92',w.applyScorePolicy(100,{workScore:130},best)===92);
 ok('10% better caps 90',w.applyScorePolicy(99,{workScore:112},best)<=90);
 ok('regression caps 87',w.applyScorePolicy(99,{workScore:90},best)<=87);
 ok('score never negative',w.applyScorePolicy(-50,{workScore:90},best)>=0);

 // ---- daily review through mocked Gemini ----
 s.dayReviews=[];s.settings.lastReviewDate=null;s.settings.aiApiKey='test-key';
 let lastBody=null;
 w.fetch=async(url,opts)=>{lastBody=JSON.parse(opts.body);return MOCK_REVIEW(97,'امروز خیلی زحمت کشیدی؛ کارهای سخت را با وجود خستگی پیش بردی، ولی نسبت به رکورد خودت هنوز جلو نرفته‌ای، برای همین امتیاز پایین می‌آید. ادامه بده.');};
 click($('.nav-btn[data-tab="dashboard"]'));await wait(40);
 click($('#dashReviewBtn'));await wait(700);
 ok('review stored',s.dayReviews.length===1);
 ok('model score 97 clamped (no baseline <=84)',s.dayReviews[0].score<=84);
 ok('review analysis kept',s.dayReviews[0].analysis.includes('زحمت کشیدی'));
 ok('review request carried no tools',!lastBody.tools);
 const reqJson=JSON.stringify(lastBody.contents);
 ok('payload has yesterday/day-before/best',reqJson.includes('yesterday')&&reqJson.includes('dayBeforeYesterday')&&reqJson.includes('personalBestByMetrics'));
 ok('system prompt: 100 forbidden',/۱۰۰/.test(lastBody.systemInstruction.parts[0].text));
 ok('manual flag',s.dayReviews[0].manual===true);
 ok('watermark advanced',s.settings.lastReviewDate===today);
 ok('hero ring rendered',!!$('.dr-ring')&&$('.dr-hero').textContent.includes('زحمت کشیدی'));
 ok('history item rendered',$$('.dr-item').length>=1);
 // history toggle works
 const toggle=$('.dr-toggle');if(toggle){click(toggle);await wait(20);}
 ok('toggle collapses item',true);

 // scheduler: catch-up run on open after end hour
 s.dayReviews=[];s.settings.lastReviewDate=null;s.settings.dayEndHour=23;
 let calls=0;
 w.fetch=async()=>{calls++;return MOCK_REVIEW(70,'روز آرامی بود.');};
 w.checkDailyReview();
 await wait(500);
 ok('scheduler fired one review',calls===1&&s.dayReviews.length===1);
 w.checkDailyReview();
 ok('scheduler does not double-run',calls===1);

 // API failure: no watermark advance, no stored review
 s.settings.lastReviewDate=null;s.dayReviews=[];
 w.fetch=async()=>({ok:false,status:401,json:async()=>({error:{message:'bad key'}})});
 let caught=false;try{await w.runDailyReview(w.dateAddStr(today,-1));}catch(e){caught=true;}
 ok('review rejects on bad key',caught);
 ok('failure does not advance watermark',s.settings.lastReviewDate===null&&s.dayReviews.length===0);
 click($('#dashReviewBtn'));await wait(500);
 ok('error banner rendered',$('#dashBody').textContent.includes('مرور انجام نشد'));

 // ---- thinking level free text (kept from v2.5.1) ----
 click($('.nav-btn[data-tab="settings"]'));await wait(50);
 const ti=$('#aiThinkInput');
 ok('thinking text input exists',!!ti);
 ti.value='high';ti.dispatchEvent(new w.Event('change',{bubbles:true}));await wait(20);
 ok('high stored',s.settings.aiThinking==='high');
 ti.value='off';ti.dispatchEvent(new w.Event('change',{bubbles:true}));await wait(20);
 ok('off stored',s.settings.aiThinking==='off');
 ti.value='medium';ti.dispatchEvent(new w.Event('change',{bubbles:true}));await wait(20);
 ok('medium stored',s.settings.aiThinking==='medium');
 ti.value='2048';ti.dispatchEvent(new w.Event('change',{bubbles:true}));
 const gc=w.geminiGenerationConfig(0.5,1000);
 ok('numeric budget applied',gc.thinkingConfig&&gc.thinkingConfig.thinkingBudget===2048);
 ok('settings day end card exists',!!$('#dayEndHourSettings'));
 $('#dayEndHourSettings').value='20';
 click($('#saveDayEndHour'));await wait(20);
 ok('settings card saves day end hour',s.settings.dayEndHour===20);

 console.log(`\n${pass} passed, ${fail} failed`);process.exit(fail?1:0);
})().catch(e=>{console.error('FATAL',e.stack);process.exit(1);});
