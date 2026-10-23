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
 s.settings.aiApiKey='';
 ok('no load errors',errors.length===0);errors.slice(0,5).forEach(e=>console.log('  ',e));

 const today=w.getRealTodayStr();
 const mkSteps=n=>Array.from({length:n},(_,i)=>({id:'ms'+i,title:'گام '+(i+1),note:i===1?'توضیح مرحله‌ی دوم':''}));
 s.tasks.push({id:'mt1',title:'نوشتن گزارش بزرگ',status:'todo',completed:false,color:'#7c83ff',createdAt:Date.now(),folderId:null,timeSpent:0,lines:2,date:today,steps:mkSteps(4),step:0});
 s.tasks.push({id:'plain1',title:'تسک ساده',status:'todo',completed:false,color:'#e4f222',createdAt:Date.now(),folderId:null,timeSpent:0,lines:1,date:today});
 w.renderTasks();await new Promise(r=>setTimeout(r,60));
 const findRow=title=>[...d.querySelectorAll('.task-row')].find(r=>r.textContent.includes(title));
 const row=findRow('گزارش بزرگ'),plain=findRow('تسک ساده');
 ok('multistep row class',row.classList.contains('multi-step-row'));
 ok('plain row not multistep',!plain.classList.contains('multi-step-row'));
 ok('plain row still has status dropdown',!!plain.querySelector('[data-check]'));
 ok('multistep row has no status dropdown',!row.querySelector('[data-check]'));
 ok('4 squares',row.querySelectorAll('.ms-sq').length===4);
 ok('first square is current',row.querySelector('.ms-sq').classList.contains('current'));
 ok('current square numbered ۱',row.querySelector('.ms-sq').textContent.trim()==='۱');
 ok('ms pill text',row.querySelector('.ms-pill').textContent.replace(/\s/g,'').includes('مرحله۱از۴'));
 ok('title clickable marker',!!row.querySelector('[data-ms-open="mt1"]'));

 click(row.querySelector('.ms-check'));await new Promise(r=>setTimeout(r,40));
 let r2=findRow('گزارش بزرگ');
 ok('one square done after click',r2.querySelectorAll('.ms-sq.done').length===1);
 ok('second square current',r2.querySelectorAll('.ms-sq')[1].classList.contains('current'));
 ok('step stored',s.tasks.find(t=>t.id==='mt1').step===1);
 ok('pill moves to step ۲',r2.querySelector('.ms-pill').textContent.includes('۲'));
 ok('status doing while mid-steps',s.tasks.find(t=>t.id==='mt1').status==='doing');

 click(r2.querySelector('[data-ms-open]'));await new Promise(r=>setTimeout(r,50));
 const modal=d.getElementById('stepsModal');
 ok('steps modal opens',modal.classList.contains('show'));
 ok('modal title',d.getElementById('stpTitle').textContent.includes('گزارش بزرگ'));
 ok('modal progress text',d.getElementById('stpProg').textContent.includes('۱ از ۴'));
 ok('4 items in modal',modal.querySelectorAll('.stp-item').length===4);
 const items=modal.querySelectorAll('.stp-item');
 ok('first item done',items[0].classList.contains('done'));
 ok('second item current',items[1].classList.contains('current'));
 ok('description rendered',items[1].textContent.includes('توضیح مرحله‌ی دوم'));
 ok('progress bar fill width',d.getElementById('stpProgFill').style.width==='25%');
 ok('next button label step 2',modal.querySelector('#stpFooter .btn-primary').textContent.includes('مرحله‌ی ۲'));
 ok('reset button exists',[...modal.querySelectorAll('#stpFooter button')].some(b=>b.textContent.includes('بازنشانی')));
 ok('postpone button exists',[...modal.querySelectorAll('#stpFooter button')].some(b=>b.textContent.includes('به تعویق')));

 // advance inside modal via footer next (3 more clicks to finish)
 const nextBtn=()=>modal.querySelector('#stpFooter .btn-primary');
 click(nextBtn());await new Promise(r=>setTimeout(r,40));
 ok('after footer click 2 done',modal.querySelectorAll('.stp-item.done').length===2);
 click(nextBtn());await new Promise(r=>setTimeout(r,40));
 ok('after footer click 3 done',modal.querySelectorAll('.stp-item.done').length===3);
 ok('last-step button label',nextBtn().textContent.includes('آخرین مرحله'));
 click(nextBtn());await new Promise(r=>setTimeout(r,40));
 ok('all items done',modal.querySelectorAll('.stp-item.done').length===4);
 ok('task status done',s.tasks.find(t=>t.id==='mt1').status==='done');
 ok('finished label shown',!!modal.querySelector('.stp-finished')&&modal.querySelector('.stp-finished').textContent.includes('انجام شد'));
 ok('progress full',d.getElementById('stpProgFill').style.width==='100%');
 ok('no next button when finished',!modal.querySelector('#stpFooter .btn-primary'));
 const rr=findRow('گزارش بزرگ');
 ok('row completed class',rr.classList.contains('completed'));
 ok('pill finished text',rr.querySelector('.ms-pill').textContent.includes('تمام'));

 // rollback via clicking first square in modal -> step 0
 click(modal.querySelectorAll('.stp-sq')[0]);await new Promise(r=>setTimeout(r,50));
 ok('rollback to step 0',s.tasks.find(t=>t.id==='mt1').step===0);
 ok('status todo after rollback',s.tasks.find(t=>t.id==='mt1').status==='todo');
 ok('first item current again',modal.querySelectorAll('.stp-item')[0].classList.contains('current'));

 // reset button
 click([...modal.querySelectorAll('#stpFooter button')].find(b=>b.textContent.includes('بازنشانی')));
 await new Promise(r=>setTimeout(r,40));
 ok('reset keeps step 0',s.tasks.find(t=>t.id==='mt1').step===0);

 // click current square in modal advances
 click(modal.querySelectorAll('.stp-sq')[0]);await new Promise(r=>setTimeout(r,40));
 ok('modal square click advances',s.tasks.find(t=>t.id==='mt1').step===1);

 // close path: X
 click(d.getElementById('stpCloseX'));await new Promise(r=>setTimeout(r,30));
 ok('modal closes via X',!modal.classList.contains('show'));

 // reopen, overlay click closes
 click(findRow('گزارش بزرگ').querySelector('[data-ms-open]'));await new Promise(r=>setTimeout(r,40));
 ok('modal reopens',modal.classList.contains('show'));
 click(modal);await new Promise(r=>setTimeout(r,30));
 ok('overlay click closes',!modal.classList.contains('show'));

 // manual task modal has no steps builder
 w.openTaskModal('task');await new Promise(r=>setTimeout(r,40));
 ok('manual modal exists',d.getElementById('taskModal').classList.contains('show'));
 ok('no steps UI in manual modal',d.getElementById('taskModal').querySelectorAll('[data-step]').length===0);
 click(d.getElementById('taskModal'));

 console.log(`\n${pass} passed, ${fail} failed`);process.exit(fail?1:0);
})().catch(e=>{console.error('FATAL',e.stack);process.exit(1);});
