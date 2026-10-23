const {JSDOM,VirtualConsole}=require('jsdom');
const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.detail&&e.detail.stack||e.message));
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
   window.console.error=(...a)=>{const m=a.join(' ');errors.push('console.error: '+m.slice(0,300));};
  }});
 await new Promise(r=>setTimeout(r,2600));
 const w=dom.window,d=w.document,s=w.__outtaskState;let pass=0,fail=0;
 const ok=(n,c)=>{c?pass++:(fail++,console.log('❌',n));};
 const click=el=>el.dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true}));
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const $=sel=>d.querySelector(sel), $$=sel=>[...d.querySelectorAll(sel)];
 ok('no load errors',errors.length===0);errors.slice(0,5).forEach(e=>console.log('  ',e));

 // daily habit, created in the past; log yesterday as done
 const today=w.getRealTodayStr();
 const off=n=>{const x=new Date();x.setDate(x.getDate()+n);return w.formatGregorian(x.getFullYear(),x.getMonth()+1,x.getDate());};
 s.habits=[{id:'h1',title:'مدیتیشن',icon:'meditation',color:'#7c83ff',repeat:'daily',weekMode:'workdays',repeatDays:[],monthDays:[],normal:false,timeOn:false,lines:2,createdAt:new Date(off(-10)).getTime(),archived:false}];
 // 3 days ago done (green in month view); Saturday (yesterday, week start) left undone -> red
 s.habitLogs=[{id:'l1',habitId:'h1',date:off(-3),count:1,minutes:0}];

 // ---- week card ----
 click($('.nav-btn[data-tab="habits"]'));await wait(40);
 click($('#hbPeriodSeg [data-period="week"]'));await wait(60);
 let days=$$('.hb-day');
 ok('7 week cells',days.length===7);
 const byClass=(cls,arr)=>arr.filter(x=>x.classList.contains(cls));
 let doneCell=byClass('done',days);
 let missCell=byClass('missed',days);
 let offdayCell=byClass('offday',days);
 // Persian week starts Saturday; derive how many past days the current week has
 const pastCount=(new Date().getDay()+1)%7;
 const logInWeek=3<=pastCount; // the off(-3) log falls inside the current week
 ok('done cells equal the in-week log',doneCell.length===(logInWeek?1:0),'done='+doneCell.length);
 ok('all past scheduled undone days are missed red',missCell.length===pastCount-(logInWeek?1:0),'missed='+missCell.length+' past='+pastCount);
 ok('missed cell shows habit icon',!!missCell[0]?.querySelector('svg')&&missCell[0].querySelector('.cell').textContent==='');
 const todayCell=days.find(x=>x.classList.contains('today'));
 ok('today not red while still open',!!todayCell&&!todayCell.classList.contains('missed'));
 ok('no inactive offdays for a daily habit',offdayCell.length===0);

 // workdays weekly habit -> friday offday neutral
 s.habits[0].repeat='weekly';s.habits[0].weekMode='workdays';
 w.renderHabits();await wait(40);
 days=$$('.hb-day');
 const fri=days.find(x=>x.querySelector('.nm')?.textContent==='ج');
 ok('friday exists',!!fri);
 ok('friday is offday (neutral dashed)',fri.classList.contains('offday')&&!fri.classList.contains('missed'));
 ok('friday shows dash',fri.querySelector('.cell').textContent==='–');
 s.habits[0].repeat='daily';

 // clicking a missed past day turns it green (done)
 w.renderHabits();await wait(40);
 days=$$('.hb-day');
 const target=days.find(x=>x.classList.contains('missed'));
 const targetNm=target.querySelector('.nm').textContent;
 click(target);await wait(40);
 days=$$('.hb-day');
 const same=days.find(x=>x.querySelector('.nm')?.textContent===targetNm);
 ok('click logs completion -> green done',same.classList.contains('done'));

 // ---- month calendar icons ----
 click($('#hbPeriodSeg [data-period="month"]'));await wait(80);
 const btns=$$('.hb-mday .hb-icbtn');
 ok('month rendered icons',btns.length>0);
 const green=btns.filter(b=>b.classList.contains('state-ok'));
 const red=btns.filter(b=>b.classList.contains('state-miss'));
 ok('green done icons exist',green.length>=1);
 ok('red missed icons exist',red.length>=1,'red='+red.length);
 ok('state-ok is not plain missed',green.every(b=>!b.classList.contains('state-miss')));
 ok('state-miss has no done class',red.every(b=>!b.classList.contains('done')));
 const legendIcons=$$('.hb-legend .hb-icbtn');
 ok('legend keeps habit color (done w/o state-ok)',legendIcons.length===1&&legendIcons[0].classList.contains('done')&&!legendIcons[0].classList.contains('state-ok'));
 const futureBtns=btns.filter(b=>b.classList.contains('future'));
 ok('future icons neutral',futureBtns.every(b=>!b.classList.contains('state-miss')&&!b.classList.contains('state-ok')));

 // CSS rules shipped
 const html=d.documentElement.innerHTML;
 ok('css green done rule',/\.hb-day\.done \.cell\{[^}]*var\(--green\)/.test(html));
 ok('css red missed rule',/\.hb-day\.missed \.cell\{[^}]*var\(--coral\)/.test(html));
 ok('css state-miss rule',html.includes('.hb-icbtn.state-miss'));
 ok('css state-ok rule',html.includes('.hb-icbtn.state-ok'));
 ok('offday dashed neutral rule',/\.hb-day\.offday \.cell\{[^}]*dashed/.test(html));

 // ---- main calendar panel chips: red/green ----
 s.habitLogs=[]; // clean slate: no completions yet
 click($('.nav-btn[data-tab="calendar"]'));await wait(80);
 const chips=$$('.cal-hb.done,.cal-hb.missed,.cal-hb.pending');
 ok('calendar rendered habit chips',chips.length>0);
 const greenCh=chips.filter(c=>c.classList.contains('done'));
 const redCh=chips.filter(c=>c.classList.contains('missed'));
 const pendCh=chips.filter(c=>c.classList.contains('pending'));
 ok('past undone chip is red missed',redCh.length>0,'red='+redCh.length);
 ok('no green before logging',greenCh.length===0);
 ok('future/today chip neutral pending',pendCh.length>=1);
 // yesterday chip color inline style uses coral
 ok('red chip coral colored',redCh.some(c=>(c.getAttribute('style')||'').includes('coral')));
 // log yesterday -> its chip becomes green
 const yd=off(-1);
 s.habitLogs.push({id:'lY',habitId:'h1',date:yd,count:1,minutes:0});
 w.renderCalendar();await wait(40);
 const chips2=$$('.cal-hb.done,.cal-hb.missed,.cal-hb.pending');
 const green2=chips2.filter(c=>c.classList.contains('done'));
 ok('yesterday turns green after log',green2.length===1);
 ok('green chip uses green var',green2[0]&&(green2[0].getAttribute('style')||'').includes('--green'));

 console.log(`\n${pass} passed, ${fail} failed`);process.exit(fail?1:0);
})().catch(e=>{console.error('FATAL',e.stack);process.exit(1);});
