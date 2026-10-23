// v2.7: day image export from the planning section (عکس روز)
// - button in برنامه‌ریزی زمانی card
// - dayExportBlocks: sessions + plan/habit bands with tags & dedupe
// - placeExportLabels: pie-style label spread
// - buildDayImage/downloadDayImage: PNG with leader lines + task names outside
const {JSDOM,VirtualConsole}=require('jsdom');
const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.detail&&e.detail.stack||e.message));
const captured={download:[],toBlob:0,fillText:[],alert:''};
(async()=>{
 const dom=await JSDOM.fromFile(require('path').join(__dirname,'..','index.html'),{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,virtualConsole:vc,
  beforeParse(window){
   const noop=()=>{};
   const ctx=new Proxy({measureText:t=>({width:String(t).length*9}),createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop}),setLineDash:noop,canvas:{width:900,height:900}},
     {get(t,p){if(p==='fillText')return s=>captured.fillText.push(String(s));if(p in t)return t[p];return noop;},set(){return true;}});
   window.HTMLCanvasElement.prototype.getContext=()=>ctx;
   window.HTMLCanvasElement.prototype.toBlob=function(cb){captured.toBlob++;cb(new window.Blob(['img'],{type:'image/png'}));};
   window.HTMLCanvasElement.prototype.toDataURL=()=>'data:image/png;base64,x';
   window.HTMLAnchorElement.prototype.click=function(){captured.download.push({href:this.href,download:this.download});};
   window.URL.createObjectURL=()=>'blob:mock';window.URL.revokeObjectURL=noop;
   window.Audio=class{play(){return Promise.resolve();}pause(){}};
   window.confirm=()=>true;window.alert=m=>{captured.alert=String(m||'');};
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

 // ---- helpers ----
 const addDays=(str,delta)=>w.dateAddStr(str,delta);
 const today=w.getRealTodayStr();
 const tomorrow=addDays(today,1);
 const yesterday=addDays(today,-1);
 const dayObj=str=>{const start=w.dayStartOf(str);return {str,start,end:start+86400000,isToday:str===today};};

 // ---- button in the planning section ----
 ok('export button exists',!!$('#dayImgBtn'));
 ok('button is in the plans card',$('#dayImgBtn')&&$('#plansList')&&$('#dayImgBtn').closest('.card')===$('#plansList').closest('.card'));
 ok('button has label',$('#dayImgBtn').textContent.includes('عکس روز'));

 // ---- empty day -> honest alert, no download ----
 click($('#dayImgBtn'));await wait(30);
 ok('empty day alerts',captured.alert.includes('ثبت نشده'));
 ok('empty day no png',captured.toBlob===0&&captured.download.length===0);

 // ---- pure geometry helpers ----
 ok('expHM rounds',w.expHM(850)==='14:10'&&w.expHM(1439.6)==='24:00'&&w.expHM(0)==='00:00');
 ok('expDur strips hour zero',w.expDur(75)==='1:15'&&w.expDur(45)==='0:45'&&w.expDur(600)==='10:00');
 const segs=w.blockRingSegs(660,780);
 ok('ring split at noon',segs.length===2&&segs[0].pm===false&&segs[0].s===660&&segs[0].e===720&&segs[1].pm===true&&segs[1].s===0&&segs[1].e===60);
 const segs2=w.blockRingSegs(0,420);
 ok('single AM seg',segs2.length===1&&segs2[0].pm===false&&segs2[0].e===420);

 // ---- placeExportLabels ----
 const labs=[{side:1,y0:100},{side:1,y0:120},{side:1,y0:400},{side:-1,y0:300}];
 w.placeExportLabels(labs,58,168,1520);
 ok('labels shifted below minY',labs[0].y===168&&labs[1].y===226);
 ok('label gap kept',labs[1].y-labs[0].y>=58);
 ok('group shift moves whole side',labs[2].y===468);
 ok('other side independent',labs[3].y===300);
 const crowd=[0,1,2,3,4].map(i=>({side:-1,y0:305+i*2}));
 w.placeExportLabels(crowd,58,300,520);
 ok('crowded labels compressed evenly',
   crowd[0].y===300&&crowd[4].y===520&&Math.abs((crowd[1].y-crowd[0].y)-55)<0.01);

 // ---- seed a full day (tomorrow: everything is future/plan) ----
 const T=w.dayStartOf(tomorrow);
 s.tasks.push(
   {id:'tk1',title:'تمرین ریاضی',status:'todo',completed:false,color:'#e4f222',createdAt:Date.now(),timeSpent:0,date:tomorrow,lines:1},
   {id:'tk2',title:'گزارش',status:'todo',completed:false,color:'#02b8cc',createdAt:Date.now(),timeSpent:0,date:yesterday,lines:1}
 );
 s.sessions.push(
   {id:'s1',taskId:'act:sleep',start:T-6*3600000,end:T+7*3600000,duration:13*3600,manual:true,activity:true},      // 00:00–07:00 on tomorrow
   {id:'s2',taskId:'tk1',start:T+14*3600000+10*60000,end:T+15*3600000+25*60000,duration:75*60,manual:false},        // 14:10–15:25
   {id:'s3',taskId:'act:rest',start:T+15*3600000+30*60000,end:T+16*3600000,duration:1800,manual:true,activity:true} // 15:30–16:00
 );
 s.plans.push({id:'p1',title:'جلسه تیم',color:'#6366f1',date:tomorrow,startMin:540,endMin:660}); // 09:00–11:00 future
 s.habits.push({id:'h1',title:'مدیتیشن',icon:'check_circle',color:'#27a644',repeat:'daily',normal:false,timeOn:true,winStart:420,winEnd:480,createdAt:Date.now(),archived:false,lines:2});
 w.syncHabitOccurrences(); // materialize hb:h1:* tasks like the real app does

 const blocks=w.dayExportBlocks(dayObj(tomorrow));
 const kinds=blocks.map(b=>b.kind);
 ok('5 blocks on tomorrow',blocks.length===5);
 ok('sleep block clipped to morning',blocks.some(b=>b.title==='خواب'&&b.sleep&&Math.round(b.startMin)===0&&Math.round(b.endMin)===420));
 ok('work session block',blocks.some(b=>b.kind==='session'&&b.title==='تمرین ریاضی'&&Math.round(b.startMin)===850&&Math.round(b.endMin)===925));
 ok('rest activity block',blocks.some(b=>b.kind==='session'&&b.title==='استراحت'&&Math.round(b.startMin)===930));
 ok('plan block tagged',blocks.some(b=>b.kind==='plan'&&b.tag==='برنامه'&&b.title==='جلسه تیم'&&b.startMin===540&&b.endMin===660));
 ok('habit block tagged',blocks.some(b=>b.kind==='habit'&&b.tag==='عادت'&&b.title==='مدیتیشن'&&b.startMin===420&&b.endMin===480));
 const plan=blocks.find(b=>b.kind==='plan');
 ok('plan leader points at remaining hatch',plan.lead.length===1&&plan.lead[0].s===540&&plan.lead[0].e===660);

 // done-as-planned plan (yesterday, fully covered by its own session) -> no duplicate plan label
 const Y=w.dayStartOf(yesterday);
 s.sessions.push({id:'s4',taskId:'tk2',start:Y+600*60000,end:Y+720*60000,duration:7200,manual:false});
 s.plans.push({id:'p2',title:'گزارش',color:'#02b8cc',date:yesterday,startMin:600,endMin:720});
 const by=w.dayExportBlocks(dayObj(yesterday));
 ok('done-as-planned plan deduped',!by.some(b=>b.kind==='plan')&&by.some(b=>b.kind==='session'&&b.title==='گزارش'));

 // stub fully covered by same-title session -> habit label deduped
 s.sessions.push({id:'s5',taskId:'hb:h1:'+tomorrow,start:T+425*60000,end:T+475*60000,duration:3000,manual:false});
 const blocks2=w.dayExportBlocks(dayObj(tomorrow));
 ok('habit covered by session deduped',!blocks2.some(b=>b.kind==='habit'&&b.title==='مدیتیشن'));
 s.sessions=s.sessions.filter(x=>x.id!=='s5');

 // ---- render + download through the button ----
 s.viewDate=tomorrow;
 w.renderDayLabels();
 captured.fillText.length=0;captured.alert='';
 click($('#dayImgBtn'));await wait(60);
 ok('png downloaded',captured.download.length===1&&captured.download[0].download==='outtask-'+tomorrow+'.png');
 ok('png href is blob',/^blob:/.test(captured.download[0].href));
 ok('toBlob used',captured.toBlob===1);
 ok('no alert on full day',captured.alert==='');
 const texts=captured.fillText;
 ok('labels task names',texts.some(t=>t.includes('تمرین ریاضی'))&&texts.some(t=>t.includes('جلسه تیم'))&&texts.some(t=>t.includes('خواب')));
 ok('labels times done',texts.some(t=>t.includes('۱۴:۱۰–۱۵:۲۵'))&&texts.some(t=>t.includes('۰۰:۰۰–۰۷:۰۰')));
 ok('labels tags',texts.some(t=>t.includes('برنامه'))&&texts.some(t=>t.includes('عادت')));
 ok('header date',texts.some(t=>t.includes('۱۴۰'))); // jalali year
 ok('dial captions',texts.some(t=>t.includes('PM'))&&texts.some(t=>t.includes('AM')));

 // viewed day label follows state.viewDate
 ok('plans day label shows date',$('#plansDayLabel').textContent.includes(tomorrow));

 console.log(`\ndom-export: ${pass} passed, ${fail} failed`);
 process.exit(fail?1:0);
})().catch(e=>{console.log('❌ suite crashed:',e&&e.stack||e);process.exit(1);});
