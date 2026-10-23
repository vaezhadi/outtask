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

 // ABOUT panel
 ok('about panel exists',!!$('#about-panel'));
 ok('about list container',!!$('#aboutList'));
 ok('about textarea',!!$('#aboutInput'));
 ok('about save btn',!!$('#aboutSave'));
 click($('.nav-btn[data-tab="about"]'));await wait(60);
 ok('about empty state',!!$('#aboutList .about-empty'));
 const aboutItem={id:'a1',text:'من شب‌کارم، بین ساعت ۹ تا ۱۱ شب بهترینم',ts:Date.now()-2000,updatedAt:Date.now()-2000};
 s.aboutMe=[aboutItem];
 w.renderAbout();await wait(40);
 let cards=$$('#aboutList .about-card');
 ok('about card rendered',cards.length===1);
 ok('about text shown',cards[0]&&cards[0].textContent.includes('شب‌کارم'));
 $('#aboutInput').value='  صبح‌ها ۱۰ دقیقه مدیتیشن می‌کنم  ';
 click($('#aboutSave'));await wait(60);
 ok('about add creates item',s.aboutMe.length===2);
 ok('about text trimmed',s.aboutMe.some(a=>a.text.includes('مدیتیشن')));
 cards=$$('#aboutList .about-card');
 const del=cards[cards.length-1].querySelector('button.del');
 ok('about card has delete',!!del);
 click(del);await wait(60);
 ok('about delete works',s.aboutMe.length===1);

 // AI shield rows
 w.renderAIPermissions();await wait(40);
 const capRows=$$('#aiCapRows .ai-perm-row');
 ok('shield has 7 cap rows',capRows.length===7);
 const caps=capRows.map(r=>r.querySelector('[data-cap]').dataset.cap);
 ok('caps include about',caps.includes('about'));
 ok('caps include vibe',caps.includes('vibe'));
 const aboutSw=$('#aiCapRows [data-cap="about"]');
 const wasOn=aboutSw.classList.contains('on');
 click(aboutSw);await wait(20);
 ok('about cap toggled',aboutSw.classList.contains('on')===!wasOn);
 ok('about cap stored',s.settings.aiCaps.about===!wasOn);
 click(aboutSw);await wait(20);
 ok('about cap restored',aboutSw.classList.contains('on')===wasOn);

 // vibe popup
 click($('.nav-btn[data-tab="vibe"]'));await wait(120);
 $('#vibeModal').classList.remove('show');
 click($('#vibeAddBtn'));await wait(50);
 ok('vibe modal opens',$('#vibeModal').classList.contains('show'));
 ok('mood buttons 5',$$('#vmMoods .vm-mood').length===5);
 ok('fatigue range exists',!!$('#vmFatigue'));
 ok('vibe task select',!!$('#vmTask'));
 ok('vibe note',!!$('#vmNote'));
 ok('vibe save disabled until mood',$('#vmSave').disabled===true);
 click($$('#vmMoods .vm-mood')[3]);await wait(20);
 ok('mood selected',$$('#vmMoods .vm-mood')[3].classList.contains('sel'));
 ok('vibe save enabled after mood',$('#vmSave').disabled===false);
 const fr=$('#vmFatigue');fr.value='2';fr.dispatchEvent(new w.Event('input',{bubbles:true}));
 const note=$('#vmNote');note.value='حال امروز خوب بود';
 note.dispatchEvent(new w.Event('input',{bubbles:true}));
 const n0=s.vibeEntries.length;
 click($('#vmSave'));await wait(80);
 ok('vibe saved entry',s.vibeEntries.length===n0+1);
 const e0=s.vibeEntries[s.vibeEntries.length-1];
 ok('vibe values stored',e0.mood===4&&e0.fatigue===2);
 ok('vibe note stored',e0.note==='حال امروز خوب بود');
 ok('vibe modal closes after save',!$('#vibeModal').classList.contains('show'));

 // about injected into prompt
 s.aboutMe=[aboutItem];
 const p=w.buildAISystemPrompt(true);
 ok('about injected into vibe prompt',p.includes('شب‌کارم'));

 // regression
 ok('ai panel exists',!!$('#ai-panel'));
 ok('settings panel exists',!!$('#settings-panel'));
 ok('composer exists',!!$('#aiInput'));
 ok('no suggestion cards',$$('.sug-card,.sug-wrap,.ai-suggest').length===0);
 w.openTaskModal('task');await wait(40);
 ok('manual task modal opens',$('#taskModal').classList.contains('show'));
 ok('manual modal has no steps builder',!$('#taskStepsInput')&&$$('#taskModal [data-step]').length===0);
 click($('#taskModal'));
 await wait(20);
 ok('steps modal exists separately',!!$('#stepsModal'));
 ok('steps modal hidden initially',!$('#stepsModal').classList.contains('show'));

 console.log(`\n${pass} passed, ${fail} failed`);process.exit(fail?1:0);
})().catch(e=>{console.error('FATAL',e.stack);process.exit(1);});
