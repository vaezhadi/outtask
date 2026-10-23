// Outtask v1.7.0 - Gemini AI + hatched time planning + repeating alarms + day-aware timer
// v1.4.0 - Secure DB + AM/PM circles + status dropdown + top date clickable
function div(a,b){return Math.floor(a/b)}
function toJalali(gy,gm,gd){
  var g_d_m=[0,31,59,90,120,151,181,212,243,273,304,334];
  var gy2=(gm>2)?(gy+1):gy;
  var days=355666+(365*gy)+div((gy2+3),4)-div((gy2+99),100)+div((gy2+399),400)+gd+g_d_m[gm-1];
  var jy=-1595+(33*div(days,12053));
  days%=12053; jy+=4*div(days,1461); days%=1461;
  if(days>365){jy+=div((days-1),365); days=(days-1)%365;}
  var jm,jd;
  if(days<186){jm=1+div(days,31); jd=1+(days%31);}else{jm=7+div((days-186),30); jd=1+((days-186)%30);}
  return {jy,jm,jd};
}
const jMonthNames=["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];
const gMonthNames=["January","February","March","April","May","June","July","August","September","October","November","December"];
const gMonthNamesFa=["ژانویه","فوریه","مارس","آوریل","می","ژوئن","ژوئیه","اوت","سپتامبر","اکتبر","نوامبر","دسامبر"];
function formatGregorian(y,m,d){return y+"-"+String(m).padStart(2,'0')+"-"+String(d).padStart(2,'0');}
function parseGregorian(str){const m=str.match(/(\d{4})-(\d{2})-(\d{2})/); if(!m) return null; return {y:parseInt(m[1]),m:parseInt(m[2]),d:parseInt(m[3])};}
function getRealTodayStr(){const now=new Date(); return formatGregorian(now.getFullYear(),now.getMonth()+1,now.getDate());}
function getDaysInGregorianMonth(y,m){return new Date(y,m,0).getDate();}
function getGregorianWeekday(y,m,d){return new Date(y,m-1,d).getDay();}
const PALETTE=["#e4f222","#6366f1","#02b8cc","#eb5757","#8b5cf6","#27a644","#f59e0b","#ec4899"];
const VERSION="2.8.0";
const SLEEP_HABIT_ID="builtin_sleep";
const SLEEP_COLOR="#5b6bb0";

// Occasion palette: one hue family in 3 saturation rows + one special official-holiday color
const HOLIDAY_COLOR="#ff2323"; // vivid official-holiday red (not part of the 3 rows)
function mixHex(hex,target,r){
  const a=parseInt(hex.slice(1),16), b=parseInt(target.slice(1),16);
  const ch=x=>Math.round(x).toString(16).padStart(2,'0');
  const ar=(a>>16)&255,ag=(a>>8)&255,ab=a&255, br=(b>>16)&255,bg=(b>>8)&255,bb=b&255;
  return '#'+ch(ar+(br-ar)*r)+ch(ag+(bg-ag)*r)+ch(ab+(bb-ab)*r);
}
const OCCASION_HUES=["#e4f222","#f59e0b","#eb5757","#ec4899","#8b5cf6","#6366f1","#02b8cc","#27a644"];
const OCCASION_ROWS=[
  OCCASION_HUES,
  OCCASION_HUES.map(c=>mixHex(c,'#73777e',0.38)),
  OCCASION_HUES.map(c=>mixHex(c,'#73777e',0.70))
];
// Canonical named palette — the ONLY colors AI tools and occasion JSON may reference.
const PALETTE_ROW_IDS=['important','normal','low']; // مهم / معمولی / کم‌اهمیت
const PALETTE_COLOR_NAMES=['lime','amber','red','pink','violet','indigo','cyan','green'];
const PALETTE_COLOR_FA={lime:'لیمویی',amber:'کهربایی',red:'قرمز',pink:'صورتی',violet:'بنفش',indigo:'نیلی',cyan:'فیروزه‌ای',green:'سبز'};
const PALETTE_ROW_FA={important:'مهم',normal:'معمولی',low:'کم‌اهمیت',holiday:'تعطیل رسمی'};
function paletteColorHex(row,name){
  if(row==='holiday') return HOLIDAY_COLOR;
  const ri=PALETTE_ROW_IDS.indexOf(row); if(ri<0) return null;
  const ni=PALETTE_COLOR_NAMES.indexOf(name); if(ni<0) return null;
  return OCCASION_ROWS[ri][ni];
}
function describePaletteHex(hex){
  if(!hex) return null;
  hex=String(hex).toLowerCase();
  if(hex===HOLIDAY_COLOR) return {row:'holiday',name:'red'};
  for(let ri=0;ri<PALETTE_ROW_IDS.length;ri++)
    for(let ni=0;ni<PALETTE_COLOR_NAMES.length;ni++)
      if(OCCASION_ROWS[ri][ni].toLowerCase()===hex) return {row:PALETTE_ROW_IDS[ri],name:PALETTE_COLOR_NAMES[ni]};
  return null;
}
// Accepts {row,name} (canonical), "row:name" string, or an exact palette hex (back-compat).
// Throws on anything outside the palette.
function resolvePaletteColor(input,{allowHoliday=true}={}){
  if(input==null||input==='') return null;
  let row=null,name=null;
  if(typeof input==='object'){row=input.row;name=input.name;}
  else if(typeof input==='string'){
    if(input.startsWith('#')){
      const d=describePaletteHex(input);
      if(!d) throw new Error('رنگ خارج از پالت مجاز نیست؛ فقط رنگ‌های پالت سه‌ردیفی یا قرمز تعطیل رسمی');
      if(d.row==='holiday'&&!allowHoliday) throw new Error('رنگ تعطیل رسمی فقط برای مناسبت‌ها قابل استفاده است');
      return d.row==='holiday'?HOLIDAY_COLOR:input.toLowerCase();
    }
    if(input.includes(':')){[row,name]=input.split(':');}
  }
  if(!row) throw new Error('فرمت رنگ باید {row,name} باشد؛ row یکی از '+PALETTE_ROW_IDS.join('/')+(allowHoliday?'/holiday':'')+' و name یکی از '+PALETTE_COLOR_NAMES.join('/'));
  if(row==='holiday'){ if(!allowHoliday) throw new Error('رنگ تعطیل رسمی فقط برای مناسبت‌ها قابل استفاده است'); return HOLIDAY_COLOR; }
  const hex=paletteColorHex(row,name);
  if(!hex) throw new Error('رنگ پالتی پیدا نشد: row='+row+' name='+name+'؛ نام‌های مجاز: '+PALETTE_COLOR_NAMES.join('/'));
  return hex;
}
function colorForAI(hex){ return describePaletteHex(hex)||hex; }
const DEFAULT_AI_KEY=""; // never embed API keys — each user sets their own key in Settings
const DEFAULT_AI_MODEL="gemini-3.8-flash";

// Secure DB - IndexedDB + chrome.storage
const IDB_NAME='outtask_secure_db';
const IDB_VERSION=8;
let idb=null;
function openIDB(){
  return new Promise((resolve,reject)=>{
    if(idb){resolve(idb); return;}
    const req=indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded=(e)=>{
      const db=e.target.result;
      if(!db.objectStoreNames.contains('tasks')) db.createObjectStore('tasks',{keyPath:'id'});
      if(!db.objectStoreNames.contains('folders')) db.createObjectStore('folders',{keyPath:'id'});
      if(!db.objectStoreNames.contains('sessions')) db.createObjectStore('sessions',{keyPath:'id'});
      if(!db.objectStoreNames.contains('occasions')) db.createObjectStore('occasions',{keyPath:'id'});
      if(!db.objectStoreNames.contains('notes')) db.createObjectStore('notes',{keyPath:'id'});
      if(!db.objectStoreNames.contains('plans')) db.createObjectStore('plans',{keyPath:'id'});
      if(!db.objectStoreNames.contains('alarms')) db.createObjectStore('alarms',{keyPath:'id'});
      if(!db.objectStoreNames.contains('habits')) db.createObjectStore('habits',{keyPath:'id'});
      if(!db.objectStoreNames.contains('habitLogs')) db.createObjectStore('habitLogs',{keyPath:'id'});
      if(!db.objectStoreNames.contains('vibeEntries')) db.createObjectStore('vibeEntries',{keyPath:'id'});
      if(!db.objectStoreNames.contains('aboutMe')) db.createObjectStore('aboutMe',{keyPath:'id'});
      if(!db.objectStoreNames.contains('dayReviews')) db.createObjectStore('dayReviews',{keyPath:'id'});
      if(db.objectStoreNames.contains('tokenLedger')) db.deleteObjectStore('tokenLedger');
      if(!db.objectStoreNames.contains('settings')) db.createObjectStore('settings',{keyPath:'key'});
      if(!db.objectStoreNames.contains('meta')) db.createObjectStore('meta',{keyPath:'key'});
    };
    req.onsuccess=(e)=>{idb=e.target.result; resolve(idb);};
    req.onerror=(e)=>reject(e);
  });
}
async function saveToIDB(storeName, items){
  if(typeof indexedDB==='undefined') return;
  try{
    const db=await openIDB();
    const tx=db.transaction(storeName,'readwrite');
    const store=tx.objectStore(storeName);
    // Clear and put all
    await new Promise((res,rej)=>{
      const clearReq=store.clear();
      clearReq.onsuccess=()=>res();
      clearReq.onerror=()=>rej();
    });
    for(const item of items){
      store.put(item);
    }
  }catch(e){console.warn('IDB save fail',e);}
}
async function saveMetaToIDB(key,value){
  try{
    const db=await openIDB();
    const tx=db.transaction('meta','readwrite');
    tx.objectStore('meta').put({key,value});
  }catch(e){}
}
async function loadMetaFromIDB(key){
  try{
    const db=await openIDB();
    if(!db.objectStoreNames.contains('meta'))return null;
    return await new Promise(resolve=>{
      const tx=db.transaction('meta','readonly');
      const req=tx.objectStore('meta').get(key);
      req.onsuccess=()=>resolve(req.result?req.result.value:null);
      req.onerror=()=>resolve(null);
    });
  }catch(e){return null;}
}
async function saveSettingsToIDB(settings){
  try{
    const db=await openIDB();
    const tx=db.transaction('settings','readwrite');
    const store=tx.objectStore('settings');
    store.put({key:'main',...settings});
  }catch(e){}
}
async function loadFromIDB(){
  if(typeof indexedDB==='undefined') return {tasks:[],folders:[],sessions:[],occasions:[],notes:[],plans:[],alarms:[],habits:[],habitLogs:[],vibeEntries:[],aboutMe:[],dayReviews:[],settings:null};
  try{
    const db=await openIDB();
    const readAll=(storeName)=>new Promise((resolve)=>{
      const tx=db.transaction(storeName,'readonly');
      const store=tx.objectStore(storeName);
      const req=store.getAll();
      req.onsuccess=()=>resolve(req.result||[]);
      req.onerror=()=>resolve([]);
    });
    const [tasks,folders,sessions,occasions,notes,plans,alarms,habits,habitLogs,vibeEntries,aboutMe,dayReviews,settingsArr]=await Promise.all([
      readAll('tasks'),readAll('folders'),readAll('sessions'),readAll('occasions'),readAll('notes'),readAll('plans'),readAll('alarms'),readAll('habits'),readAll('habitLogs'),
      db.objectStoreNames.contains('vibeEntries')?readAll('vibeEntries'):Promise.resolve([]),
      db.objectStoreNames.contains('aboutMe')?readAll('aboutMe'):Promise.resolve([]),
      db.objectStoreNames.contains('dayReviews')?readAll('dayReviews'):Promise.resolve([]),
      readAll('settings')
    ]);
    const settings=settingsArr[0]||null;
    return {tasks,folders,sessions,occasions,notes,plans,alarms,habits:habits||[],habitLogs:habitLogs||[],vibeEntries:vibeEntries||[],aboutMe:aboutMe||[],dayReviews:dayReviews||[],settings};
  }catch(e){return {tasks:[],folders:[],sessions:[],occasions:[],notes:[],plans:[],alarms:[],habits:[],habitLogs:[],vibeEntries:[],aboutMe:[],dayReviews:[],settings:null};}
}

let state={
  tasks: [],
  folders: [],
  sessions: [],
  occasions: [],
  notes: [],
  plans: [],
  alarms: [],
  habits: [],
  habitLogs: [],
  vibeEntries: [],
  aboutMe: [],
  dayReviews: [],
  aiChat: [],
  settings: {overdueHour:8, dayEndHour:22, aiThinking:'', aiApiKey:DEFAULT_AI_KEY, aiModel:DEFAULT_AI_MODEL, alarmSound:'sounds/notify.mp3', aiDataAccess:'all', aiMode:'task', aiCaps:{tasks:true,folders:true,calendar:true,time:true,scheduling:true,vibe:true,about:true}},
  selectedIds: new Set(),
  activeTaskId: null,
  timerStart: 0,
  timerAccum: 0,
  timerLastMinuteSave: 0,
  currentSessionId: null,
  timerInterval: null,
  timerMinuteInterval: null,
  quickColor: PALETTE[0],
  calYear: new Date().getFullYear(),
  calMonth: new Date().getMonth()+1,
  calSelected: null,
  viewDate: null,
  realToday: getRealTodayStr(),
  postponeTaskId: null,
  openDropdownId: null
};

async function loadInitial(){
  // Try chrome.storage first (most secure)
  let loaded=false;
  try{
    if(typeof chrome!=='undefined' && chrome.storage && chrome.storage.local){
      const res=await new Promise(r=>chrome.storage.local.get(['outtask_tasks','outtask_folders','outtask_sessions','outtask_occasions','outtask_notes','outtask_plans','outtask_alarms','outtask_aiChat','outtask_settings','outtask_viewDate','outtask_activeTask','outtask_timerStart','outtask_timerAccum','outtask_timerLastSave','outtask_currentSessionId','outtask_alarms_meta','outtask_habits','outtask_habitLogs','outtask_vibeEntries','outtask_aboutMe','outtask_dayReviews'],r));
      if(res.outtask_tasks){state.tasks=res.outtask_tasks; loaded=true;}
      if(res.outtask_folders) state.folders=res.outtask_folders;
      if(res.outtask_sessions) state.sessions=res.outtask_sessions;
      if(res.outtask_occasions) state.occasions=res.outtask_occasions;
      if(res.outtask_notes) state.notes=res.outtask_notes;
      if(res.outtask_plans) state.plans=res.outtask_plans;
      if(res.outtask_alarms) state.alarms=res.outtask_alarms;
      if(res.outtask_aiChat) state.aiChat=res.outtask_aiChat;
      if(res.outtask_habits) state.habits=res.outtask_habits;
      if(res.outtask_habitLogs) state.habitLogs=res.outtask_habitLogs;
      if(res.outtask_vibeEntries) state.vibeEntries=res.outtask_vibeEntries;
      if(res.outtask_aboutMe) state.aboutMe=res.outtask_aboutMe;
      if(res.outtask_dayReviews) state.dayReviews=res.outtask_dayReviews;
      if(res.outtask_settings) state.settings=res.outtask_settings;
      // Reconcile alarms the background worker fired/rescheduled while closed
      if(Array.isArray(res.outtask_alarms_meta)) reconcileAlarmsFromMeta(res.outtask_alarms_meta);
      if(res.outtask_viewDate) state.viewDate=res.outtask_viewDate;
      if(res.outtask_activeTask) state.activeTaskId=res.outtask_activeTask;
      if(res.outtask_timerStart) state.timerStart=res.outtask_timerStart;
      if(res.outtask_timerAccum) state.timerAccum=res.outtask_timerAccum;
      if(res.outtask_timerLastSave) state.timerLastMinuteSave=res.outtask_timerLastSave;
      if(res.outtask_currentSessionId) state.currentSessionId=res.outtask_currentSessionId;
    }
  }catch(e){}

  // Fallback to localStorage
  if(!loaded){
    try{
      state.tasks=JSON.parse(localStorage.getItem('outtask_tasks')||'[]');
      state.folders=JSON.parse(localStorage.getItem('outtask_folders')||'[]');
      state.sessions=JSON.parse(localStorage.getItem('outtask_sessions')||'[]');
      state.occasions=JSON.parse(localStorage.getItem('outtask_occasions')||'[]');
      state.notes=JSON.parse(localStorage.getItem('outtask_notes')||'[]');
      state.plans=JSON.parse(localStorage.getItem('outtask_plans')||'[]');
      state.alarms=JSON.parse(localStorage.getItem('outtask_alarms')||'[]');
      state.aiChat=JSON.parse(localStorage.getItem('outtask_aiChat')||'[]');
      state.habits=JSON.parse(localStorage.getItem('outtask_habits')||'[]');
      state.habitLogs=JSON.parse(localStorage.getItem('outtask_habitLogs')||'[]');
      state.vibeEntries=JSON.parse(localStorage.getItem('outtask_vibeEntries')||'[]');
      state.aboutMe=JSON.parse(localStorage.getItem('outtask_aboutMe')||'[]');
      state.dayReviews=JSON.parse(localStorage.getItem('outtask_dayReviews')||'[]');
      const s=JSON.parse(localStorage.getItem('outtask_settings')||'null');
      if(s) state.settings=s;
      state.viewDate=localStorage.getItem('outtask_viewDate')||null;
      state.activeTaskId=localStorage.getItem('outtask_activeTask')||null;
      state.timerStart=parseInt(localStorage.getItem('outtask_timerStart')||'0');
      state.timerAccum=parseInt(localStorage.getItem('outtask_timerAccum')||'0');
      state.timerLastMinuteSave=parseInt(localStorage.getItem('outtask_timerLastSave')||'0');
      state.currentSessionId=localStorage.getItem('outtask_currentSessionId')||null;
      if(state.tasks.length>0) loaded=true;
    }catch(e){}
  }

  // Fallback to IndexedDB
  if(!loaded){
    const idbData=await loadFromIDB();
    if(idbData.tasks.length>0){
      state.tasks=idbData.tasks;
      state.folders=idbData.folders;
      state.sessions=idbData.sessions;
      state.occasions=idbData.occasions;
      state.notes=idbData.notes||[];
      state.plans=idbData.plans||[];
      state.alarms=idbData.alarms||[];
      state.habits=idbData.habits||[];
      state.habitLogs=idbData.habitLogs||[];
      state.vibeEntries=idbData.vibeEntries||[];
      state.aboutMe=idbData.aboutMe||[];
      if(idbData.dayReviews) state.dayReviews=idbData.dayReviews;
      if(idbData.settings) state.settings=idbData.settings;
      loaded=true;
    }
  }

  // Migrate tasks
  state.tasks=state.tasks.map(t=>{
    if(!t.id) t.id=uid();
    if(!t.date){
      if(t.createdAt){const d=new Date(t.createdAt); t.date=formatGregorian(d.getFullYear(),d.getMonth()+1,d.getDate());}
      else t.date=state.realToday;
    }
    if(!t.status){
      if(t.completed) t.status='done'; else t.status='todo';
    }
    if(t.status==='done') t.completed=true; else t.completed=false;
    delete t.doneAt;
    if(!t.color) t.color=PALETTE[0];
    if(Array.isArray(t.steps)){
      const s=normalizeSteps(t.steps);
      if(s&&s.length>=2){t.steps=s;t.step=Math.max(0,Math.min(parseInt(t.step)||0,s.length));try{syncMultiStep(t);}catch(e){}}
      else{delete t.steps;delete t.step;}
    }
    return t;
  });
  state.occasions=state.occasions.map(o=>{if(!o.id) o.id=uid(); if(!o.repeat) o.repeat='none'; return o;});
  if(!Array.isArray(state.plans)) state.plans=[];
  if(!Array.isArray(state.alarms)) state.alarms=[];
  if(!Array.isArray(state.habits)) state.habits=[];
  if(!Array.isArray(state.habitLogs)) state.habitLogs=[];
  try{ensureSleepHabit();}catch(e){}
  state.habits=state.habits.map(normalizeHabit);
  try{ensureSleepHabit();}catch(e){}
  state.habitLogs=state.habitLogs.filter(l=>l&&l.habitId&&l.date);
  if(!Array.isArray(state.vibeEntries)) state.vibeEntries=[];
  state.vibeEntries=state.vibeEntries.map(normalizeVibe).filter(Boolean).sort((a,b)=>a.ts-b.ts);
  if(!Array.isArray(state.aboutMe)) state.aboutMe=[];
  state.aboutMe=state.aboutMe.map(normalizeAbout).filter(Boolean).sort((a,b)=>b.ts-a.ts);
  if(state.settings.aiMode!=='task'&&state.settings.aiMode!=='vibe') state.settings.aiMode='task';
  // v2.6: tokens & persona fully removed
  delete state.tokenLedger;delete state.tokenReview;delete state.persona;
  delete state.settings.personEnabled;delete state.settings.personUnlocked;
  // v2.8: YouTube channel monitor removed
  ['youtubeApiKey','youtubeVideoCount','youtubeLastCheck','youtubeChannelThumb'].forEach(k=>delete state.settings[k]);
  try{['outtask_youtube_video_count','outtask_youtube_thumb','outtask_youtube_last_check','outtask_youtube_api_key'].forEach(k=>localStorage.removeItem(k));}catch(e){}
  if(!Array.isArray(state.dayReviews))state.dayReviews=[];
  state.dayReviews=state.dayReviews.filter(r=>r&&typeof r.date==='string'&&Number.isFinite(r.score));
  // Legacy v2.4/v2.5 gift/sticker/persona chat bubbles no longer render: drop them
  state.aiChat=state.aiChat.filter(m=>m.kind!=='gift'&&m.kind!=='sticker'&&!m.persona);
  if(!Array.isArray(state.aiChat)) state.aiChat=[];
  state.plans=state.plans.map(p=>{if(!p.id)p.id=uid(); if(p.color==null)p.color=PALETTE[0]; return p;});
  state.alarms=state.alarms.map(a=>migrateAlarm(a));
  if(state.settings.overdueHour==null) state.settings.overdueHour=8;
  if(!(parseInt(state.settings.dayEndHour)>=0&&parseInt(state.settings.dayEndHour)<=23))state.settings.dayEndHour=22;
  if(!Array.isArray(state.settings.customActivities))state.settings.customActivities=[];
  state.settings.customActivities=state.settings.customActivities
    .map(a=>typeof a==='string'?{title:a}:a)
    .filter(a=>a&&typeof a.title==='string'&&a.title.trim());
  if(!state.settings.aiApiKey) state.settings.aiApiKey=DEFAULT_AI_KEY;
  if(!state.settings.aiModel) state.settings.aiModel=DEFAULT_AI_MODEL;
  if(!state.settings.alarmSound) state.settings.alarmSound='sounds/notify.mp3';
  if(state.settings.aiDataAccess!=='today' && state.settings.aiDataAccess!=='all') state.settings.aiDataAccess='all';
  if(!state.settings.aiCaps || typeof state.settings.aiCaps!=='object'){
    state.settings.aiCaps={tasks:true,folders:true,calendar:true,time:true,scheduling:true};
  }else{
    ['tasks','folders','calendar','time','scheduling'].forEach(k=>{if(typeof state.settings.aiCaps[k]!=='boolean')state.settings.aiCaps[k]=true;});
  }
  if(typeof state.settings.aiCaps.vibe!=='boolean') state.settings.aiCaps.vibe=true;
  if(typeof state.settings.aiCaps.about!=='boolean') state.settings.aiCaps.about=true;
  // thinking level is free text; migrate legacy enums
  if(state.settings.aiThinking==='default')state.settings.aiThinking='';
  else if(state.settings.aiThinking==='deep')state.settings.aiThinking='high';
  if(typeof state.settings.aiThinking!=='string')state.settings.aiThinking='';
  if(!Array.isArray(state.aiChat))state.aiChat=[];
  state.aiChat.forEach(m=>{if(!m.id)m.id=uid();if(!m.kind)m.kind='text';});
  if(state.settings.aiMode!=='task'&&state.settings.aiMode!=='vibe')state.settings.aiMode='task';

  // No default tasks - if empty, keep empty

  try{setAIMode(state.settings.aiMode||'task');}catch(e){}
  initApp();
}
function save(){
  // localStorage backup
  try{
    localStorage.setItem('outtask_tasks',JSON.stringify(state.tasks));
    localStorage.setItem('outtask_folders',JSON.stringify(state.folders));
    localStorage.setItem('outtask_sessions',JSON.stringify(state.sessions));
    localStorage.setItem('outtask_occasions',JSON.stringify(state.occasions));
    localStorage.setItem('outtask_notes',JSON.stringify(state.notes));
    localStorage.setItem('outtask_plans',JSON.stringify(state.plans));
    localStorage.setItem('outtask_alarms',JSON.stringify(state.alarms));
    localStorage.setItem('outtask_aiChat',JSON.stringify(state.aiChat));
    localStorage.setItem('outtask_habits',JSON.stringify(state.habits));
    localStorage.setItem('outtask_habitLogs',JSON.stringify(state.habitLogs));
    localStorage.setItem('outtask_vibeEntries',JSON.stringify(state.vibeEntries));
    localStorage.setItem('outtask_aboutMe',JSON.stringify(state.aboutMe));
    localStorage.setItem('outtask_dayReviews',JSON.stringify(state.dayReviews||[]));
    // Avoid 5MB localStorage quota blow-up with a custom alarm dataURL
    const lsSettings={...state.settings};
    if(typeof lsSettings.alarmSound==='string' && lsSettings.alarmSound.startsWith('data:')) lsSettings.alarmSound='custom';
    localStorage.setItem('outtask_settings',JSON.stringify(lsSettings));
    if(state.activeTaskId) localStorage.setItem('outtask_activeTask',state.activeTaskId); else localStorage.removeItem('outtask_activeTask');
    localStorage.setItem('outtask_timerStart',state.timerStart+'');
    localStorage.setItem('outtask_timerAccum',state.timerAccum+'');
    localStorage.setItem('outtask_timerLastSave',state.timerLastMinuteSave+'');
    if(state.currentSessionId) localStorage.setItem('outtask_currentSessionId',state.currentSessionId); else localStorage.removeItem('outtask_currentSessionId');
    if(state.viewDate) localStorage.setItem('outtask_viewDate',state.viewDate); else localStorage.removeItem('outtask_viewDate');
  }catch(e){}

  // chrome.storage - secure
  try{
    if(typeof chrome!=='undefined' && chrome.storage && chrome.storage.local){
      chrome.storage.local.set({
        outtask_tasks:state.tasks,
        outtask_folders:state.folders,
        outtask_sessions:state.sessions,
        outtask_occasions:state.occasions,
        outtask_notes:state.notes,
        outtask_plans:state.plans,
        outtask_alarms:state.alarms,
        outtask_aiChat:state.aiChat,
        outtask_habits:state.habits,
        outtask_habitLogs:state.habitLogs,
        outtask_vibeEntries:state.vibeEntries,
        outtask_aboutMe:state.aboutMe,
        outtask_dayReviews:state.dayReviews||[],
        outtask_settings:state.settings,
        outtask_viewDate:state.viewDate,
        outtask_activeTask:state.activeTaskId,
        outtask_timerStart:state.timerStart,
        outtask_timerAccum:state.timerAccum,
        outtask_timerLastSave:state.timerLastMinuteSave,
        outtask_currentSessionId:state.currentSessionId
      });
      const dbStatus=document.getElementById('dbStatus');
      if(dbStatus) dbStatus.textContent='✅ ذخیره امن در chrome.storage.local + IndexedDB — '+state.tasks.length+' تسک، '+state.occasions.length+' مناسبت';
    }
  }catch(e){}

  // IndexedDB - persistent
  saveToIDB('tasks',state.tasks);
  saveToIDB('folders',state.folders);
  saveToIDB('sessions',state.sessions);
  saveToIDB('occasions',state.occasions);
  saveToIDB('notes',state.notes);
  saveToIDB('plans',state.plans);
  saveToIDB('alarms',state.alarms);
  saveToIDB('habits',state.habits);
  saveToIDB('habitLogs',state.habitLogs);
  saveToIDB('vibeEntries',state.vibeEntries);
  saveToIDB('aboutMe',state.aboutMe);
  saveToIDB('dayReviews',state.dayReviews||[]);
  saveSettingsToIDB(state.settings);
  syncAlarmsToBackground();
}
function uid(){return Math.random().toString(36).slice(2,9)}
let lastAlarmSyncSig='';
function syncAlarmsToBackground(){
  try{
    if(typeof chrome!=='undefined' && chrome.runtime && chrome.runtime.sendMessage){
      const alarms=state.alarms.filter(a=>a.enabled && !a.fired).map(a=>({
        id:a.id,title:a.title,taskId:a.taskId||null,taskTitle:a.taskTitle||'',
        time:a.time,sound:a.sound||null,repeat:a.repeat||'none',repeatDays:a.repeatDays||[]
      }));
      const sig=JSON.stringify(alarms);
      if(sig===lastAlarmSyncSig) return;
      lastAlarmSyncSig=sig;
      chrome.runtime.sendMessage({type:'ALARM_SYNC',alarms},()=>{void chrome.runtime.lastError;});
    }
  }catch(e){}
}
function getCurrentViewDate(){return state.viewDate || state.realToday;}
function isViewingToday(){return !state.viewDate || state.viewDate===state.realToday;}
// Day range for the currently selected calendar day (drives the whole timer tab)
function getViewDayRange(){
  const str=getCurrentViewDate();
  const [y,m,d]=str.split('-').map(Number);
  const start=new Date(y,m-1,d,0,0,0,0).getTime();
  return {str,start,end:start+86400000,isToday:str===getRealTodayStr()};
}
function getTodayRange(){
  const n=new Date(); n.setHours(0,0,0,0);
  return {start:n.getTime(),end:n.getTime()+86400000,str:getRealTodayStr()};
}
function renderDayLabels(){
  const r=getViewDayRange();
  const j=toJalali(...r.str.split('-').map(Number));
  const label=(r.isToday?'امروز':r.str+' • '+j.jd+' '+jMonthNames[j.jm-1]);
  const l1=document.getElementById('plansDayLabel'); if(l1)l1.textContent=r.isToday?'امروز':r.str;
  const l2=document.getElementById('sessionsDayLabel'); if(l2)l2.textContent='('+label+')';
  const l3=document.getElementById('timeViewLabel'); if(l3)l3.textContent='بیرونی PM، داخلی AM — هاور جزئیات • '+label;
}

function updateTopDate(){
  const now=new Date(); const j=toJalali(now.getFullYear(),now.getMonth()+1,now.getDate());
  const el=document.getElementById('topDate');
  if(!el) return;
  el.textContent=state.realToday+" • "+j.jd+" "+jMonthNames[j.jm-1];
  if(!isViewingToday()){
    el.classList.add('not-today');
    el.title="در حال نمایش "+getCurrentViewDate()+" — کلیک برای بازگشت به امروز ("+state.realToday+")";
  }else{
    el.classList.remove('not-today');
    el.title="امروز - کلیک برای بازگشت";
  }
}
document.getElementById('topDate')?.addEventListener('click',()=>{
  if(!isViewingToday()){
    state.viewDate=null; save(); updateTopDate(); renderTasks(); renderCalendar(); renderTimeTasks();
  }
});
setInterval(()=>{state.realToday=getRealTodayStr(); updateTopDate(); checkOverdue();},60000);
updateTopDate();

document.querySelectorAll('.nav-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const tab=btn.dataset.tab;
    document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
    document.getElementById(tab+'-panel').classList.add('active');
    if(tab==='dashboard'){renderDashboard();}
    if(tab==='calendar'){renderCalendar(); renderAllEvents();}
    if(tab==='time'){renderTimeTasks(); drawClock(); renderSessions(); renderPlansList(true); renderAlarmsList(); populateAlarmTaskSelect(); renderDayLabels();}
    if(tab==='tasks'){renderTasks();}
    if(tab==='habits'){syncHabitOccurrences();renderHabits();}
    if(tab==='vibe'){renderVibePanel();if(!vibeStats().latest)openVibeModal();}
    if(tab==='about'){renderAbout();}
    if(tab==='ai'){renderAIChat(); renderAIPermissions(); setTimeout(()=>document.getElementById('aiInput')?.focus(),100);}
  });
});

// Tasks with status dropdown (creation happens via the task/habit popup)
const addTaskBtn=document.getElementById('addTaskBtn');
const tasksList=document.getElementById('tasksList');
const tasksEmpty=document.getElementById('tasksEmpty');
function renderQuickColors(){/* retained as a no-op for legacy call sites */}
// Terminal task states all sink to the bottom: done (تیک), not_done (ضربدر), postponed (تعویق)
const TERMINAL_STATUSES=['done','not_done','postponed'];
function isTaskClosed(t){return TERMINAL_STATUSES.includes(t.status);}
function getFolderTasks(folder,viewDate=getCurrentViewDate()){
  return state.tasks.filter(t=>t.folderId===folder.id && t.date===viewDate);
}
function getFolderProgress(folder){
  const ts=getFolderTasks(folder);
  if(!ts.length) return 0;
  return ts.filter(t=>t.status==='done').length/ts.length;
}
// Aggregate folder state: active until every task inside is terminal.
// 'done' = all completed; 'not_done' = all failed; 'postponed' = all postponed;
// 'closed' = all terminal but mixed; 'active' = at least one pending/in-progress task.
function getFolderState(folder){
  const ts=getFolderTasks(folder);
  if(!ts.length) return 'active';
  if(ts.every(t=>t.status==='done')) return 'done';
  if(ts.every(t=>t.status==='not_done')) return 'not_done';
  if(ts.every(t=>t.status==='postponed')) return 'postponed';
  if(ts.every(isTaskClosed)) return 'closed';
  return 'active';
}
function isFolderCompleted(folder){ return getFolderState(folder)==='done'; }
function isFolderClosed(folder){ const s=getFolderState(folder); return s!=='active'; }
function folderStateLabel(st){
  return st==='done'?'انجام شد':st==='not_done'?'انجام نشد':st==='postponed'?'به تعویق':st==='closed'?'بسته شد':'';
}
function tasksClosedVal(t){ return isTaskClosed(t)?1:0; }
function taskPriorityVal(t){
  const l=t.lines||1;
  if(l===3) return 0;
  if(l===2) return 1;
  if(l===1) return 2;
  if(l===4) return 3;
  return 2;
}
// Closed states (done/failed/postponed) sink below pending work, then priority, then creation time.
function sortTasksByPriority(arr){
  return [...arr].sort((a,b)=>{
    const ca=tasksClosedVal(a), cb=tasksClosedVal(b);
    if(ca!==cb) return ca-cb;
    const pa=taskPriorityVal(a), pb=taskPriorityVal(b);
    if(pa!==pb) return pa-pb;
    return (a.createdAt||0)-(b.createdAt||0);
  });
}
function getStatusBadge(status){
  const map={
    done:{label:'انجام شده',cls:'done'},
    doing:{label:'در حال انجام',cls:'doing'},
    not_done:{label:'انجام نشده',cls:'not_done'},
    postponed:{label:'به تعویق',cls:'postponed'},
    todo:{label:'در انتظار',cls:'todo'}
  };
  const m=map[status]||map.todo;
  return `<span class="status-badge ${m.cls}">${m.label}</span>`;
}
function closeAllDropdowns(){
  document.querySelectorAll('.status-dropdown').forEach(el=>el.remove());
  state.openDropdownId=null;
}
document.addEventListener('click',(e)=>{
  if(!e.target.closest('.task-check-wrap')){
    closeAllDropdowns();
  }
});
function openStatusDropdown(taskId, anchor){
  closeAllDropdowns();
  const task=state.tasks.find(t=>t.id===taskId);
  if(!task) return;
  const wrap=anchor.closest('.task-check-wrap');
  if(!wrap) return;
  const dd=document.createElement('div');
  dd.className='status-dropdown';
  dd.innerHTML=`
    <button class="status-opt done" data-action="done" title="انجام شده - تیک"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></button>
    <button class="status-opt not_done" data-action="not_done" title="انجام نشده - ضربدر"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>
    <button class="status-opt postponed" data-action="postponed" title="به تعویق افتاده"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg></button>
  `;
  wrap.appendChild(dd);
  state.openDropdownId=taskId;
  dd.querySelectorAll('[data-action]').forEach(btn=>{
    btn.addEventListener('click',(e)=>{
      e.stopPropagation();
      const action=btn.getAttribute('data-action');
      if(action==='done'){
        task.status='done'; task.completed=true;
      }else if(action==='not_done'){
        task.status='not_done'; task.completed=false;
      }else if(action==='postponed'){
        closeAllDropdowns();
        openPostponeModal(taskId);
        return;
      }
      // Habit occurrence status ↔ BuJo log sync
      if(task.isHabit && task.habitId){
        const hb=state.habits.find(x=>x.id===task.habitId);
        if(hb){
          let l=state.habitLogs.find(x=>x.habitId===hb.id&&x.date===task.date);
          if(action==='done'){
            if(!l){l={id:uid(),habitId:hb.id,date:task.date,count:1,minutes:0};state.habitLogs.push(l);}
            else{l.count=1;l.minutes=l.minutes||0;}
          }else if(action==='not_done'||action==='todo'){
            if(l){l.count=0;l.minutes=0;}
          }
        }
      }
      save(); closeAllDropdowns(); renderTasks(); renderTimeTasks(); renderHabits(); try{renderCalendar();renderPlansList(true);drawClock();}catch(e){}
    });
  });
}

function renderTasks(){
  if(!tasksList) return;
  tasksList.innerHTML='';
  const viewDate=getCurrentViewDate();
  const allForView=state.tasks.filter(t=>t.date===viewDate);
  const loose=allForView.filter(t=>!t.folderId);
  const folders=state.folders.filter(f=>state.tasks.some(t=>t.folderId===f.id && t.date===viewDate));

  const titleEl=document.getElementById('tasksTitle');
  if(titleEl){
    if(isViewingToday()) titleEl.textContent='وظایف امروز';
    else titleEl.textContent='وظایف '+viewDate;
  }

  if(allForView.length===0){tasksEmpty.style.display='block';}else tasksEmpty.style.display='none';

  // Closed folders (every task done / failed / postponed) sink after active folders
  const folderSortKey=f=>{
    const ts=getFolderTasks(f,viewDate);
    const earliest=ts.reduce((m,t)=>Math.min(m,t.createdAt||m),Infinity);
    return [isFolderClosed(f)?1:0, Number.isFinite(earliest)?earliest:(f.createdAt||0)];
  };
  folders.sort((a,b)=>{const [ca,ta]=folderSortKey(a),[cb,tb]=folderSortKey(b); if(ca!==cb) return ca-cb; return ta-tb;});

  const folderIconSVG={
    done:'<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
    not_done:'<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
    postponed:'<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>',
    closed:'<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M19 13H5v-2h14v2z"/></svg>'
  };
  folders.forEach(folder=>{
    const prog=getFolderProgress(folder);
    const fstate=getFolderState(folder);
    const closed=fstate!=='active';
    const inTasks=getFolderTasks(folder,viewDate);
    const doneCount=inTasks.filter(t=>t.status==='done').length;
    const checkCls=fstate==='done'?'checked':fstate==='not_done'?'not_done':fstate==='postponed'?'postponed':fstate==='closed'?'folder-closed':'';
    const checkIcon=closed?folderIconSVG[fstate]:folderIconSVG.done;
    const pill=closed?`${doneCount}/${inTasks.length} • ${folderStateLabel(fstate)}`:`${Math.round(prog*100)}% • ${doneCount}/${inTasks.length}`;
    const div=document.createElement('div'); div.className='folder-card'+(closed?' closed':'');
    div.innerHTML=`<div class="folder-head"><div class="task-check-wrap"><div class="task-check ${checkCls}" data-folder-check="${folder.id}" title="${closed?'بازگرداندن همه به در انتظار':'علامت‌گذاری همه به‌عنوان انجام شده'}">${checkIcon}</div></div><div style="width:28px;height:28px;border-radius:8px;background:rgba(255,255,255,0.06);display:grid;place-items:center"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M10.59 4.59C10.21 4.21 9.7 4 9.17 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-1.41-1.41z"/></svg></div><div style="flex:1"><div style="display:flex;gap:8px;align-items:center"><span style="font-weight:600;color:var(--paper)">${folder.title}</span><span class="pill">${pill}</span></div><div class="progress" style="margin-top:8px"><div class="progress-bar" style="width:${prog*100}%"></div></div></div><button class="btn-ghost" data-del-folder="${folder.id}">حذف پوشه</button></div><div class="folder-body" id="folder-${folder.id}"></div>`;
    tasksList.appendChild(div);
    const body=div.querySelector(`#folder-${folder.id}`);
    sortTasksByPriority(inTasks).forEach(t=>body.appendChild(createTaskRow(t)));
  });
  sortTasksByPriority(loose).forEach(t=>tasksList.appendChild(createTaskRow(t)));

  tasksList.querySelectorAll('[data-folder-check]').forEach(el=>{
    el.addEventListener('click',(e)=>{e.stopPropagation(); const fid=el.getAttribute('data-folder-check'); const folder=state.folders.find(f=>f.id===fid); if(!folder) return; const tasksIn=getFolderTasks(folder,viewDate); if(isFolderClosed(folder)){tasksIn.forEach(t=>{if(isMultiStep(t)){t.step=0;t.status='todo';t.completed=false;}else{t.status='todo'; t.completed=false;}});}else{tasksIn.forEach(t=>{if(isMultiStep(t)){msSetAllDone(t);}else{t.status='done'; t.completed=true;}});} save(); renderTasks(); renderTimeTasks();});
  });
  tasksList.querySelectorAll('[data-del-folder]').forEach(btn=>{
    btn.addEventListener('click',(e)=>{e.stopPropagation(); const fid=btn.getAttribute('data-del-folder'); if(!confirm('پوشه حذف شود؟')) return; state.tasks.forEach(t=>{if(t.folderId===fid && t.date===viewDate) t.folderId=null}); state.folders=state.folders.filter(f=>f.id!==fid); save(); renderTasks(); renderTimeTasks();});
  });
  updateBulkBar();
}

// ============================================================
// ================ MULTI-STEP TASKS (v2.3) ====================
// === AI-only tasks made of <=6 ordered steps; the user ======
// === ticks one square at a time; clicking the task opens ====
// === a popup with every step + its description ==============
// ============================================================
const MS_MAX_STEPS=6;
const MS_CHECK_SVG='<svg viewBox="0 0 24 24" width="9" height="9" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
const MS_LIST_SVG='<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M4 5h2v2H4V5zm4 0h12v2H8V5zM4 11h2v2H4v-2zm4 0h12v2H8v-2zM4 17h2v2H4v-2zm4 0h12v2H8v-2z"/></svg>';
function normalizeSteps(steps){
  if(!Array.isArray(steps))return null;
  if(steps.length===0)return []; // explicit removal
  const out=[];
  steps.slice(0,MS_MAX_STEPS).forEach((s,i)=>{
    if(s==null||typeof s!=='object')return;
    const title=String(s.title||'').trim().slice(0,200);
    if(!title)return;
    out.push({id:String(s.id||uid()),title,note:String(s.note||s.description||'').trim().slice(0,1000)});
  });
  if(out.length<2)return null; // a multi-step task needs at least 2 steps
  return out;
}
function isMultiStep(t){return !!(t&&Array.isArray(t.steps)&&t.steps.length>=2);}
function msIndex(t){const n=t.steps.length;const i=parseInt(t.step);return Math.max(0,Math.min(Number.isFinite(i)?i:0,n));}
function msTotal(t){return isMultiStep(t)?t.steps.length:0;}
// Keep task.status / completed / step consistent for multi-step tasks
function syncMultiStep(t){
  if(!isMultiStep(t))return t;
  const n=t.steps.length;
  const raw=parseInt(t.step);
  let step=Math.max(0,Math.min(Number.isFinite(raw)?raw:0,n));
  // an explicit "done" without progress means mark every step done; an explicit rollback (step<n) wins
  if(t.status==='done'&&(!Number.isFinite(raw)||raw===0))step=n;
  t.step=step;
  if(t.status==='postponed'||t.status==='not_done'){t.completed=false;}
  else{t.status=step===0?'todo':step>=n?'done':'doing';t.completed=t.status==='done';}
  
  return t;
}
function makeMultiStepTask(fields){
  const steps=normalizeSteps(fields.steps);
  const t=fields;
  if(steps&&steps.length>=2){
    t.steps=steps;
    t.step=(fields.status==='done')?steps.length:0;
    delete t.status;delete t.completed;
  }else{
    delete t.steps;delete t.step;
  }
  t.status=fields.status||'todo';
  t.completed=t.status==='done';
  if(t.steps)syncMultiStep(t);
  return t;
}
function msAdvance(t){
  if(!isMultiStep(t))return null;
  t.step=Math.min(msIndex(t)+1,t.steps.length);
  if(t.status!=='postponed'&&t.status!=='not_done')t.status='todo'; // re-derived by sync
  syncMultiStep(t);
  save();
  return t.step;
}
function msReset(t,silent){
  if(!isMultiStep(t))return;
  if(!silent&&!confirm('پیشرفت مراحل این تسک از نو شروع شود؟'))return;
  t.step=0;
  if(t.status!=='postponed'){t.status='todo';t.completed=false;}
  save();
}
function msSetStep(t,index){ // click on an earlier completed square -> roll back
  if(!isMultiStep(t))return;
  t.step=Math.max(0,Math.min(index,t.steps.length));
  if(t.status!=='postponed'&&t.status!=='not_done')t.status='todo';
  syncMultiStep(t);save();
}
function msSetAllDone(t){if(!isMultiStep(t))return;t.step=t.steps.length;t.status='done';t.completed=true;save();}

// ---------- mini square cluster for the task row ----------
function msCheckCluster(task){
  const n=task.steps.length,done=msIndex(task);
  const wrap=document.createElement('div');
  wrap.className='task-check-wrap ms-wrap';
  const btn=document.createElement('button');btn.type='button';btn.className='ms-check';
  btn.dataset.ms=task.id;
  btn.title=`تسک چندمرحله‌ای • ${done} از ${n} مرحله${done<n?' — کلیک برای انجام مرحله‌ی فعلی':' — تمام شد'}`;
  task.steps.forEach((st,i)=>{
    const sq=document.createElement('i');
    sq.className='ms-sq'+(i<done?' done':i===done&&done<n?' current':'');
    sq.style.setProperty('--msc',task.color);
    if(i<done)sq.innerHTML=MS_CHECK_SVG;
    else if(i===done&&done<n)sq.textContent=faNum(i+1);
    sq.title=`مرحله ${faNum(i+1)}: ${st.title}`;
    btn.appendChild(sq);
  });
  btn.addEventListener('click',e=>{
    e.stopPropagation();
    const live=state.tasks.find(x=>x.id===task.id);if(!live)return;
    if(msIndex(live)<msTotal(live)){
      msAdvance(live);
      renderTasks();renderTimeTasks();try{renderCalendar();drawClock();}catch(_){}
      if(document.getElementById('stepsModal').classList.contains('show'))openStepsModal(live.id);
    }
  });
  // right-click (or click a completed square cluster button when done) -> reopen modal
  btn.addEventListener('contextmenu',e=>{e.preventDefault();openStepsModal(task.id);});
  wrap.appendChild(btn);
  return wrap;
}

// ---------- steps modal ----------
let stepsModalTaskId=null;
function openStepsModal(taskId){
  const t=state.tasks.find(x=>x.id===taskId);if(!t||!isMultiStep(t))return;
  stepsModalTaskId=taskId;
  document.getElementById('stpTitle').textContent=t.title;
  document.getElementById('stepsModal').classList.add('show');
  renderStepsModal();
}
function closeStepsModal(){document.getElementById('stepsModal')?.classList.remove('show');stepsModalTaskId=null;}
function renderStepsModal(){
  const t=state.tasks.find(x=>x.id===stepsModalTaskId);const modal=document.getElementById('stepsModal');
  if(!t||!modal.classList.contains('show'))return;
  const n=t.steps.length,done=msIndex(t),finished=done>=n;
  document.getElementById('stpProg').textContent=`${faNum(done)} از ${faNum(n)} مرحله${finished?' • تمام شد':t.status==='postponed'?' • به تعویق افتاده':''}`;
  const fill=document.getElementById('stpProgFill');if(fill)fill.style.width=Math.round(done/n*100)+'%';
  const list=document.getElementById('stpList');list.innerHTML='';
  t.steps.forEach((st,i)=>{
    const state0=i<done?'done':i===done&&!finished?'current':'todo';
    const row=document.createElement('div');row.className='stp-item '+state0;
    const sq=document.createElement('button');sq.type='button';sq.className='stp-sq';
    sq.innerHTML=i<done?MS_CHECK_SVG:('<span>'+faNum(i+1)+'</span>');
    sq.title=i<done?'برای برگشتن به این مرحله بزن':'مرحله '+(i+1);
    sq.addEventListener('click',()=>{
      const live=state.tasks.find(x=>x.id===t.id);if(!live)return;
      if(i<msIndex(live)){msSetStep(live,i);renderTasks();renderStepsModal();}
      else if(i===msIndex(live)&&msIndex(live)<msTotal(live)){msAdvance(live);renderTasks();renderStepsModal();}
    });
    const body=document.createElement('div');body.className='stp-body';
    const tt=document.createElement('div');tt.className='stp-t';tt.textContent=st.title;
    body.appendChild(tt);
    if(st.note){const nn=document.createElement('div');nn.className='stp-n';nn.textContent=st.note;body.appendChild(nn);}
    row.appendChild(sq);row.appendChild(body);list.appendChild(row);
  });
  const foot=document.getElementById('stpFooter');foot.innerHTML='';
  const postpone=document.createElement('button');postpone.type='button';postpone.className='btn-ghost';postpone.textContent='به تعویق…';
  postpone.addEventListener('click',()=>{closeStepsModal();openPostponeModal(t.id);});
  const reset=document.createElement('button');reset.type='button';reset.className='btn-ghost';reset.textContent='بازنشانی پیشرفت';
  reset.addEventListener('click',()=>{msReset(t);renderTasks();renderStepsModal();});
  foot.appendChild(postpone);foot.appendChild(reset);
  const spacer=document.createElement('div');spacer.style.flex='1';foot.appendChild(spacer);
  if(!finished){
    const next=document.createElement('button');next.type='button';next.className='btn-primary';
    next.textContent=(done===n-1)?'انجام آخرین مرحله و اتمام تسک':'انجام مرحله‌ی '+faNum(done+1);
    next.addEventListener('click',()=>{
      const live=state.tasks.find(x=>x.id===t.id);if(!live)return;
      msAdvance(live);renderTasks();renderTimeTasks();try{renderCalendar();drawClock();}catch(_){}renderStepsModal();
    });
    foot.appendChild(next);
  }else{
    const done2=document.createElement('span');done2.className='stp-finished';done2.textContent='همه‌ی مراحل انجام شد';
    foot.appendChild(done2);
  }
}
document.getElementById('stpCloseX')?.addEventListener('click',closeStepsModal);
document.getElementById('stpClose')?.addEventListener('click',closeStepsModal);
document.getElementById('stepsModal')?.addEventListener('click',e=>{if(e.target.id==='stepsModal')closeStepsModal();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const m=document.getElementById('stepsModal');if(m&&m.classList.contains('show'))closeStepsModal();}});

function createTaskRow(task){
  const row=document.createElement('div'); row.className='task-row'+(task.status==='done'?' completed':'')+(state.selectedIds.has(task.id)?' selected':''); row.dataset.id=task.id;
  const h=Math.floor(task.timeSpent/3600); const m=Math.floor((task.timeSpent%3600)/60);
  const isPostponedInstance=task.postponedFrom;
  const isPostponedOriginal=task.status==='postponed';
  let postponeIcon='';
  if(isPostponedInstance){
    postponeIcon=`<div class="postpone-icon" title="تعویق از ${task.postponedFrom} — تاریخ اصلی">↻</div>`;
  }else if(isPostponedOriginal && task.postponedTo){
    postponeIcon=`<div class="postpone-icon" title="به تعویق افتاده به ${task.postponedTo}" style="background:var(--ash)">↻</div>`;
  }
  const statusBadge=getStatusBadge(task.status);
  const checkCls=task.status==='done'?'checked':task.status==='doing'?'doing':task.status==='not_done'?'not_done':task.status==='postponed'?'postponed':'';
  let checkIcon='<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
  if(task.status==='not_done') checkIcon='<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
  else if(task.status==='postponed') checkIcon='<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>';
  else if(task.status==='doing') checkIcon='<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';

  // vertical lines marker 1->2->3->dot->1 - priority: gray same color
  const lines=task.lines||1;
  let linesHtml='';
  if(lines===4){
    linesHtml=`<div class="dot"></div>`;
  }else{
    for(let i=0;i<lines;i++) linesHtml+=`<div class="vline"></div>`;
    for(let i=lines;i<3;i++) linesHtml+=`<div class="vline" style="opacity:0.15"></div>`;
  }
  const priorityTitles={
    1:'این میزان اولویت است: کم ( | ) — کار اجباری سطح پایین | اختیاری = • | کم=| تا بالا=|||',
    2:'این میزان اولویت است: متوسط ( || ) — کار اجباری سطح متوسط',
    3:'این میزان اولویت است: بالا ( ||| ) — از همه بالاتر',
    4:'این میزان اولویت است: اختیاری ( • ) — از همه پایین‌تر'
  };
  const titleText=priorityTitles[lines]||priorityTitles[1];

  const dotHtml=task.isHabit
    ?`<span title="عادت" style="--ic:${task.color};width:18px;height:18px;border-radius:50%;background:color-mix(in srgb,${task.color} 16%,transparent);color:${task.color};display:inline-grid;place-items:center;flex-shrink:0;line-height:0">${habitIconSvg(task.habitIcon,10)}</span>`
    :`<div class="task-dot" style="background:${task.color}"></div>`;
  const multi=isMultiStep(task);
  const tv=taskLatestVibe(task);
  const vibeBtn=`<button type="button" class="task-vibe${tv?' set':''}" data-vibe-mark="${task.id}" title="${tv?'آخرین حس این کار: '+vibeMood(tv.mood).fa:'ثبت حس برای این کار'}"${tv?` style="color:${vibeMood(tv.mood).color}"`:''}>${vibeFaceSvg(tv?tv.mood:null,15)}</button>`;
  const msPill=multi?`<span class="ms-pill" title="تسک چندمرحله‌ای — برای دیدن مراحل و توضیحات روی تسک بزن">${MS_LIST_SVG}<span>مرحله ${faNum(Math.min(msIndex(task)+1,msTotal(task)))} از ${faNum(msTotal(task))}${msIndex(task)>=msTotal(task)?' — تمام':''}</span></span>`:'';
  const titleInner=`${tv?`<span class="tv-inline" style="color:${vibeMood(tv.mood).color}" title="حست نسبت به این کار: ${vibeMood(tv.mood).fa}">${vibeFaceSvg(tv.mood,14)}</span>`:''}${task.title}`;
  const checkCell=multi?'':`<div class="task-check-wrap"><div class="task-check ${checkCls}" data-check="${task.id}">${checkIcon}</div></div>`;
  row.innerHTML=`${checkCell}<div class="select-check ${state.selectedIds.has(task.id)?'active':''}" data-select="${task.id}" title="انتخاب برای حذف/پوشه"><svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></div><div class="task-lines" data-lines="${lines}" data-task-lines="${task.id}" title="${titleText}">${linesHtml}</div>${dotHtml}<div class="task-title${multi?' ms-open':''}" data-ms-open="${multi?task.id:''}" title="${multi?'باز کردن مراحل تسک':''}">${titleInner}</div>${postponeIcon}<div class="task-meta">${msPill}${statusBadge}${task.timeSpent>0?`<span class="pill">${h>0?h+'h ':''}${m}m</span>`:''}${vibeBtn}<button class="btn-ghost" data-del="${task.id}" style="padding:4px 8px">✕</button></div>`;
  if(multi)row.classList.add('multi-step-row');
  row.querySelector('[data-vibe-mark]')?.addEventListener('click',(e)=>{
    e.stopPropagation();
    openVibeModal({taskId:task.id});
  });
  const msOpen=row.querySelector('[data-ms-open]');
  if(msOpen)msOpen.addEventListener('click',e=>{e.stopPropagation();openStepsModal(task.id);});
  if(multi){
    const cluster=msCheckCluster(task);
    row.querySelector('.select-check')?.before(cluster);
  }

  const checkWrap=row.querySelector('.task-check-wrap');
  const check=row.querySelector('[data-check]');
  if(check)check.addEventListener('click',(e)=>{
    e.stopPropagation();
    // Open dropdown instead of direct toggle
    if(state.openDropdownId===task.id){
      closeAllDropdowns();
    }else{
      openStatusDropdown(task.id, check);
    }
  });

  row.querySelector('[data-select]').addEventListener('click',(e)=>{e.stopPropagation(); if(state.selectedIds.has(task.id)) state.selectedIds.delete(task.id); else state.selectedIds.add(task.id); renderTasks();});
  row.querySelector('[data-del]').addEventListener('click',(e)=>{
    e.stopPropagation();
    // Habit occurrences are recurring: mark missed instead of removing (they are managed in the Habits tab)
    if(task.isHabit){
      if(!confirm('این رخداد عادت به‌عنوان «انجام‌نشده» ثبت شود؟'))return;
      if(state.activeTaskId===task.id){stopTimer();}
      task.status='not_done';task.completed=false;
      const hb=state.habits.find(x=>x.id===task.habitId);
      if(hb){let l=state.habitLogs.find(x=>x.habitId===hb.id&&x.date===task.date);if(l){l.count=0;l.minutes=0;}}
      save();renderTasks();renderTimeTasks();renderHabits();try{renderCalendar();renderPlansList(true);drawClock();}catch(e){}return;
    }
    if(!confirm('حذف؟')) return; if(state.activeTaskId===task.id){stopTimer();} state.tasks=state.tasks.filter(t=>t.id!==task.id); state.selectedIds.delete(task.id); save(); renderTasks(); renderTimeTasks(); renderSessions(); drawClock();});
  const linesEl=row.querySelector('[data-task-lines]');
  if(linesEl){
    linesEl.addEventListener('click',(e)=>{
      e.stopPropagation();
      let cur=task.lines||1;
      cur = cur>=4 ? 1 : cur+1;
      task.lines=cur;
      save();
      renderTasks();
    });
  }
  return row;
}
// New task/habit creation lives in the task modal (round + buttons)
if(addTaskBtn) addTaskBtn.addEventListener('click',()=>openTaskModal('task'));
document.getElementById('tasksEmpty')?.addEventListener('click',()=>openTaskModal('task'));
document.getElementById('addHabitBtn')?.addEventListener('click',()=>openTaskModal('habit'));
document.getElementById('hbEmptyAdd')?.addEventListener('click',e=>{e.stopPropagation();openTaskModal('habit');});
document.getElementById('hbEmpty')?.addEventListener('click',()=>openTaskModal('habit'));
// Task modal wiring
(function initTaskModal(){
  const seg=(segId,attr,cb)=>document.querySelectorAll('#'+segId+' button').forEach(b=>b.addEventListener('click',()=>{
    segSet(segId,attr,b.getAttribute(attr));cb&&cb(b.getAttribute(attr));
  }));
  seg('tmTypeSeg','data-type',v=>{tmState.mode=v;updateTmHabitUI();});
  seg('tmPrioSeg','data-prio',v=>{tmState.lines=parseInt(v);});
  seg('tmRepeatSeg','data-repeat',v=>{tmState.repeat=v;
    if(v==='weekly'&&!segGet('tmWeekModeSeg','data-wmode'))segSet('tmWeekModeSeg','data-wmode',tmState.weekMode||'workdays');
    updateTmHabitUI();});
  seg('tmWeekModeSeg','data-wmode',v=>{tmState.weekMode=v;updateTmHabitUI();});
  document.getElementById('tmNormal')?.addEventListener('change',e=>{tmState.normal=e.target.checked;updateTmHabitUI();});
  document.getElementById('tmTimeOn')?.addEventListener('change',e=>{tmState.timeOn=e.target.checked;updateTmHabitUI();});
  document.getElementById('tmWinStart')?.addEventListener('change',e=>tmState.winStart=e.target.value);
  document.getElementById('tmWinEnd')?.addEventListener('change',e=>tmState.winEnd=e.target.value);
  document.getElementById('tmTitle')?.addEventListener('input',()=>{if(tmState&&tmState.mode==='habit'&&!tmState.iconTouched)updateTmHabitUI();});
  document.getElementById('tmCancel')?.addEventListener('click',closeTaskModal);
  document.getElementById('tmSave')?.addEventListener('click',saveTaskModal);
  document.getElementById('taskModal')?.addEventListener('click',e=>{if(e.target.id==='taskModal')closeTaskModal();});
  document.addEventListener('keydown',e=>{const m=document.getElementById('taskModal');if(e.key==='Escape'&&m&&m.classList.contains('show'))closeTaskModal();});
  document.getElementById('tmTitle')?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();saveTaskModal();}});
  // period pill toggle on the habits page
  document.querySelectorAll('#hbPeriodSeg button').forEach(b=>b.addEventListener('click',()=>{
    document.querySelectorAll('#hbPeriodSeg button').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');hbPeriod=b.dataset.period;renderHabits();
  }));
})();
function updateBulkBar(){
  const count=state.selectedIds.size; const bar=document.getElementById('bulkBar'); if(!bar) return;
  const countEl=document.getElementById('bulkCount'); if(countEl) countEl.textContent=count+' انتخاب';
  if(count>=1) bar.classList.add('show'); else bar.classList.remove('show');
}
document.getElementById('bulkClearBtn')?.addEventListener('click',()=>{state.selectedIds.clear(); const bar=document.getElementById('bulkBar'); if(bar) bar.classList.remove('show'); renderTasks();});
document.getElementById('bulkFolderBtn')?.addEventListener('click',()=>{
  if(state.selectedIds.size<2){alert('حداقل ۲ تسک'); return;}
  const name=prompt('نام پوشه:','پروژه جدید'); if(!name) return;
  const folder={id:uid(),title:name,createdAt:Date.now()}; state.folders.push(folder);
  state.tasks.forEach(t=>{if(state.selectedIds.has(t.id)) t.folderId=folder.id});
  state.selectedIds.clear(); save(); renderTasks(); renderTimeTasks();
  const bar=document.getElementById('bulkBar'); if(bar) bar.classList.remove('show'); updateBulkBar();
});
document.getElementById('bulkDeleteBtn')?.addEventListener('click',()=>{
  if(state.selectedIds.size===0) return;
  if(!confirm(state.selectedIds.size+' تسک حذف شود؟')) return;
  if(state.activeTaskId && state.selectedIds.has(state.activeTaskId)){stopTimer();}
  state.tasks=state.tasks.filter(t=>!state.selectedIds.has(t.id));
  state.selectedIds.clear(); save(); renderTasks(); renderTimeTasks(); renderSessions(); drawClock();
  const bar=document.getElementById('bulkBar'); if(bar) bar.classList.remove('show'); updateBulkBar();
});

// Calendar
function getOccasionsForGregorianDate(gDateStr){
  const target=parseGregorian(gDateStr); if(!target) return [];
  return state.occasions.filter(o=>{
    if(!o.date) return false;
    if(o.date===gDateStr) return true;
    if(o.repeat==='yearly'){return o.date.slice(5)===gDateStr.slice(5);}
    return false;
  });
}
function renderCalendar(){
  const y=state.calYear, m=state.calMonth;
  const titleEl=document.getElementById('calTitleText');
  if(titleEl){const j=toJalali(y,m,15); titleEl.textContent=gMonthNames[m-1]+" "+y+" • "+gMonthNamesFa[m-1]+" "+j.jy;}
  const wdEl=document.getElementById('calWeekdays'); if(!wdEl) return;
  wdEl.innerHTML=''; ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].forEach(w=>{const d=document.createElement('div'); d.className='cal-weekday'; d.textContent=w; wdEl.appendChild(d);});
  const grid=document.getElementById('calGrid'); grid.innerHTML='';
  const daysIn=getDaysInGregorianMonth(y,m);
  const firstWeekday=getGregorianWeekday(y,m,1);
  const todayStr=getRealTodayStr();
  for(let i=0;i<firstWeekday;i++){const cell=document.createElement('div'); cell.className='cal-day other'; grid.appendChild(cell);}
  for(let d=1; d<=daysIn; d++){
    const gDateStr=formatGregorian(y,m,d);
    const j=toJalali(y,m,d);
    const isToday=gDateStr===todayStr;
    const isSelected=state.calSelected===gDateStr;
    const isViewDate=state.viewDate===gDateStr;
    const occasions=getOccasionsForGregorianDate(gDateStr);
    const tasksForDay=state.tasks.filter(t=>t.date===gDateStr&&!t.isHabit);
    const habitsForDay=state.habits.filter(h=>!h.archived&&!h.normal&&habitActiveOn(h,gDateStr));
    const notesForDay=state.notes.filter(n=>n.date===gDateStr);
    const cell=document.createElement('div');
    cell.className='cal-day'+(isToday?' today':'')+(isSelected?' selected':'')+(occasions.length?' has-event':'')+(isViewDate?' selected':'');
    // Only dot for occasions, not names - if multiple, just one dot
    let bottomHtml='';
    if(occasions.length>0){
      const col=occasions[0].color||'#e4f222';
      bottomHtml+=`<div class="cal-dot" style="background:${col};box-shadow:0 0 6px ${col}"></div>`;
    }
    if(notesForDay.length>0){
      bottomHtml+=`<div class="cal-note-icon" title="${notesForDay.length} یادداشت"><svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg></div>`;
    }
    if(habitsForDay.length>0){
      bottomHtml+='<div class="cal-hbs">'+habitsForDay.slice(0,4).map(h=>{
        const done=habitDone(h,gDateStr);
        const past=gDateStr<todayStr;
        const stateCls=done?'done':(past?'missed':'pending');
        const col=done?'var(--green)':(past?'var(--coral)':'var(--fog)');
        return `<span class="cal-hb ${stateCls}" style="--ic:${h.color};color:${col}" title="${h.title} • ${done?'انجام شد':(past?'انجام نشد':'')}">${habitIconSvg(h.icon,11)}</span>`;
      }).join('')+(habitsForDay.length>4?'<span class="cal-hb">+'+(habitsForDay.length-4)+'</span>':'')+'</div>';
    }
    if(tasksForDay.length>0){
      bottomHtml+=`<div class="pill" style="font-size:9px;padding:1px 5px">${tasksForDay.length}</div>`;
    }
    cell.innerHTML=`<div style="display:flex;justify-content:space-between"><div class="cal-day-num">${d}</div><div class="cal-day-jalali">${j.jd} ${jMonthNames[j.jm-1].slice(0,3)}</div></div><div class="cal-day-bottom">${bottomHtml}</div>`;
    // Right click for note
    cell.addEventListener('contextmenu',(e)=>{
      e.preventDefault();
      openContextMenu(e.clientX, e.clientY, gDateStr);
    });
    
    cell.addEventListener('click',()=>{
      state.calSelected=gDateStr;
      state.viewDate=gDateStr;
      save(); renderCalendar(); renderDayEvents(gDateStr); renderTasks(); updateTopDate();
    });
    grid.appendChild(cell);
  }
  const total=firstWeekday+daysIn; const rem=(7-(total%7))%7;
  for(let i=0;i<rem;i++){const cell=document.createElement('div'); cell.className='cal-day other'; grid.appendChild(cell);}
  if(!state.calSelected) state.calSelected=formatGregorian(y,m,1);
  renderDayEvents(state.calSelected);
}
function renderDayEvents(gDateStr){
  const container=document.getElementById('calEvents'); if(!container) return;
  const occasions=getOccasionsForGregorianDate(gDateStr);
  const j=toJalali(...gDateStr.split('-').map(Number));
  const tasksForDay=state.tasks.filter(t=>t.date===gDateStr&&!t.isHabit);
  const habitsForDay=state.habits.filter(h=>!h.archived&&!h.normal&&habitActiveOn(h,gDateStr));
  container.innerHTML=`<div class="muted" style="margin-bottom:8px">${gDateStr} • ${j.jd} ${jMonthNames[j.jm-1]} ${j.jy} • ${tasksForDay.length} تسک${habitsForDay.length?' • '+faNum(habitsForDay.length)+' عادت':''}</div>`;
  if(occasions.length===0 && tasksForDay.length===0 && habitsForDay.length===0){container.innerHTML+=`<div class="muted" style="font-size:12px">رویدادی نیست</div>`; return;}
  // habits: separate section with their own icons, click toggles done
  if(habitsForDay.length){
    const head=document.createElement('div');head.className='caption';head.style.margin='6px 0 4px';head.textContent='عادت‌ها';
    container.appendChild(head);
    const box=document.createElement('div');box.className='day-habits';
    habitsForDay.forEach(h=>{
      const done=habitDone(h,gDateStr),future=gDateStr>getRealTodayStr();
      const row=document.createElement('div');row.className='day-habit'+(done?' done':'');row.style.setProperty('--hb',h.color);
      row.innerHTML=`<div class="habit-ic" style="--hb:${h.color}">${habitIconSvg(h.icon,16)}</div>
        <div class="dt"><b>${aiEsc(h.title)}</b><span class="m">${repeatLabel(h)}${h.timeOn?' • '+faNum(minToHM(h.winStart))+'–'+faNum(minToHM(h.winEnd)):''}</span></div>
        <span class="st">${done?'✓ انجام شد':(future?'آینده':'ثبت‌نشده')}</span>`;
      if(!future)row.addEventListener('click',()=>{bumpHabitLog(h,gDateStr);});
      box.appendChild(row);
    });
    container.appendChild(box);
    const sep=document.createElement('div');sep.className='caption';sep.style.margin='8px 0 4px';sep.textContent='تسک‌ها و رویدادها';
    container.appendChild(sep);
  }
  occasions.forEach(o=>{
    const el=document.createElement('div'); el.className='event-list-item';
    el.innerHTML=`<div style="width:8px;height:8px;border-radius:50%;background:${o.color};margin-top:4px"></div><div style="flex:1"><div style="font-size:13px;color:var(--paper)">${o.title} ${o.repeat==='yearly'?'<span class="pill">↻ سالانه</span>':''}</div><div class="muted" style="font-size:11px">${o.date}</div></div><button class="btn-ghost" data-del-ev="${o.id}">✕</button>`;
    container.appendChild(el);
  });
  tasksForDay.forEach(t=>{
    const el=document.createElement('div'); el.className='event-list-item';
    el.innerHTML=`<div style="width:8px;height:8px;border-radius:50%;background:${t.color};margin-top:4px"></div><div style="flex:1"><div style="font-size:12.5px;color:var(--paper)">${t.title} <span class="status-badge ${t.status}">${t.status}</span></div><div class="muted" style="font-size:11px">${t.date}</div></div>`;
    container.appendChild(el);
  });
  const notesForDay=state.notes.filter(n=>n.date===gDateStr);
  notesForDay.forEach(n=>{
    const el=document.createElement('div'); el.className='event-list-item'; el.style.borderColor='rgba(2,184,204,0.3)';
    el.innerHTML=`<div style="width:20px;height:20px;background:rgba(2,184,204,0.15);color:var(--teal);border-radius:6px;display:grid;place-items:center;flex-shrink:0"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg></div><div style="flex:1"><div style="font-size:12.5px;color:var(--paper)">یادداشت</div><div style="font-size:12px;color:var(--mist);margin-top:4px;white-space:pre-wrap">${n.text}</div><div class="muted" style="font-size:11px;margin-top:4px">${n.date}</div></div><button class="btn-ghost" data-del-note="${n.id}">✕</button>`;
    container.appendChild(el);
  });
  container.querySelectorAll('[data-del-note]')?.forEach(btn=>{
    btn.addEventListener('click',()=>{const id=btn.getAttribute('data-del-note'); state.notes=state.notes.filter(n=>n.id!==id); save(); renderCalendar(); renderDayEvents(gDateStr); renderAllEvents();});
  });
  
  container.querySelectorAll('[data-del-ev]').forEach(btn=>{
    btn.addEventListener('click',()=>{const id=btn.getAttribute('data-del-ev'); state.occasions=state.occasions.filter(o=>o.id!==id); save(); renderCalendar(); renderAllEvents(); renderDayEvents(gDateStr);});
  });
}
function renderAllEvents(){
  const cont=document.getElementById('allEvents'); if(!cont) return; cont.innerHTML='';
  const sortedOcc=[...state.occasions].sort((a,b)=>a.date.localeCompare(b.date));
  const sortedNotes=[...state.notes].sort((a,b)=>a.date.localeCompare(b.date));
  if(sortedOcc.length===0 && sortedNotes.length===0){cont.innerHTML='<div class="muted" style="font-size:12px">هنوز مناسبتی یا یادداشتی نداری</div>'; return;}
  sortedOcc.forEach(o=>{
    const el=document.createElement('div'); el.className='event-list-item';
    el.innerHTML=`<div style="width:8px;height:8px;border-radius:50%;background:${o.color}"></div><div style="flex:1"><div style="font-size:12.5px;color:var(--paper)">${o.title} ${o.repeat==='yearly'?'<span class="pill">↻</span>':''}</div><div class="muted" style="font-size:11px">${o.date}</div></div><button class="btn-ghost" data-del-all="${o.id}">✕</button>`;
    cont.appendChild(el);
  });
  sortedNotes.forEach(n=>{
    const el=document.createElement('div'); el.className='event-list-item'; el.style.borderColor='rgba(2,184,204,0.2)';
    el.innerHTML=`<div style="width:20px;height:20px;background:rgba(2,184,204,0.15);color:var(--teal);border-radius:6px;display:grid;place-items:center;flex-shrink:0"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg></div><div style="flex:1"><div style="font-size:12px;color:var(--mist)">${n.text.slice(0,60)}${n.text.length>60?'...':''}</div><div class="muted" style="font-size:11px">${n.date}</div></div><button class="btn-ghost" data-del-note-all="${n.id}">✕</button>`;
    cont.appendChild(el);
  });
  cont.querySelectorAll('[data-del-all]').forEach(btn=>{btn.addEventListener('click',()=>{const id=btn.getAttribute('data-del-all'); state.occasions=state.occasions.filter(o=>o.id!==id); save(); renderCalendar(); renderAllEvents(); if(state.calSelected) renderDayEvents(state.calSelected);});});
  cont.querySelectorAll('[data-del-note-all]').forEach(btn=>{btn.addEventListener('click',()=>{const id=btn.getAttribute('data-del-note-all'); state.notes=state.notes.filter(n=>n.id!==id); save(); renderCalendar(); renderAllEvents(); if(state.calSelected) renderDayEvents(state.calSelected);});});
}
document.getElementById('evAddBtn')?.addEventListener('click',()=>{
  const title=document.getElementById('evTitle').value.trim();
  const date=document.getElementById('evDate').value;
  const color=document.getElementById('evColor').value;
  const repeat=document.getElementById('evRepeat').checked ? 'yearly' : 'none';
  if(!title || !date){alert('عنوان و تاریخ لازم است'); return;}
  const occ={id:uid(), date, title, color, repeat, type: repeat==='yearly'?'birthday':'custom'};
  state.occasions.push(occ); save();
  document.getElementById('evTitle').value='';
  renderCalendar(); renderAllEvents(); if(state.calSelected) renderDayEvents(state.calSelected);
  const p=parseGregorian(date); if(p){state.calYear=p.y; state.calMonth=p.m; state.calSelected=date; state.viewDate=date; save(); renderCalendar(); renderTasks(); updateTopDate();}
});
document.getElementById('calPrev')?.addEventListener('click',()=>{state.calMonth--; if(state.calMonth<1){state.calMonth=12; state.calYear--;} state.calSelected=formatGregorian(state.calYear,state.calMonth,1); renderCalendar();});
document.getElementById('calNext')?.addEventListener('click',()=>{state.calMonth++; if(state.calMonth>12){state.calMonth=1; state.calYear++;} state.calSelected=formatGregorian(state.calYear,state.calMonth,1); renderCalendar();});
document.getElementById('calToday')?.addEventListener('click',()=>{const now=new Date(); state.calYear=now.getFullYear(); state.calMonth=now.getMonth()+1; state.calSelected=formatGregorian(now.getFullYear(),now.getMonth()+1,now.getDate()); state.viewDate=null; save(); renderCalendar(); renderTasks(); updateTopDate();});

// Time - Two circles AM/PM
function renderTimeTasks(){
  const container=document.getElementById('timeTasks'); if(!container) return; container.innerHTML='';
  const viewDate=getCurrentViewDate();
  const list=sortTasksByPriority(state.tasks.filter(t=>t.date===viewDate));
  if(list.length===0){
    container.innerHTML='<div class="muted" style="font-size:11.5px;padding:8px 4px;line-height:1.7">تسکی برای این روز نیست؛ از تب وظایف یا تقویم تسک بساز یا از هوش مصنوعی بخواه.</div>';
  }
  list.forEach(task=>{
    const div=document.createElement('div'); div.className='task-row'+(state.activeTaskId===task.id?' selected':''); div.style.padding='10px 12px'; div.style.cursor='pointer';
    div.innerHTML=`<div class="task-dot" style="background:${task.color}"></div><div class="task-title" style="font-size:12.5px">${task.title} <span class="status-badge ${task.status}">${task.status}</span></div><div style="width:18px;height:18px;border-radius:50%;border:1.5px solid ${state.activeTaskId===task.id?'var(--acid)':'var(--graphite)'};display:grid;place-items:center">${state.activeTaskId===task.id?'<div style="width:8px;height:8px;border-radius:50%;background:var(--acid)"></div>':''}</div>`;
    div.addEventListener('click',()=>{
      if(state.timerStart && state.activeTaskId && state.activeTaskId!==task.id){
        if(!confirm('تایمر فعلی در حال اجراست. متوقف و به تسک جدید سوئیچ شود؟')) return;
        stopTimer();
      }
      state.activeTaskId=task.id; save(); renderTimeTasks(); updateActiveBadge(); updateManualTaskSelect();
    }); container.appendChild(div);
  });
  // Timer-only activities (rest, sleep, custom) — they never create tasks
  const divider=document.createElement('div');
  divider.className='act-divider'; divider.textContent='فعالیت‌های زمان‌سنجی (بدون تسک)';
  container.appendChild(divider);
  selectableActivities().forEach(act=>{
    const div=document.createElement('div');
    div.className='task-row activity-row'+(state.activeTaskId===act.id?' selected':'');
    div.style.padding='10px 12px'; div.style.cursor='pointer';
    const del=act.custom?`<button type="button" class="act-del" title="حذف فعالیت" style="background:none;border:none;color:var(--ash);cursor:pointer;padding:2px 4px;font-size:12px">✕</button>`:'';
    div.innerHTML=`<div class="act-ic">${act.icon||'•'}</div><div class="task-title" style="font-size:12.5px;flex:1">${act.title}</div>${del}<div style="width:18px;height:18px;border-radius:50%;border:1.5px solid ${state.activeTaskId===act.id?'var(--acid)':'var(--graphite)'};display:grid;place-items:center">${state.activeTaskId===act.id?'<div style="width:8px;height:8px;border-radius:50%;background:var(--acid)"></div>':''}</div>`;
    div.addEventListener('click',(e)=>{
      if(e.target.closest('.act-del'))return;
      if(state.timerStart && state.activeTaskId && state.activeTaskId!==act.id){
        if(!confirm('تایمر فعلی در حال اجراست. متوقف و به فعالیت جدید سوئیچ شود؟')) return;
        stopTimer();
      }
      state.activeTaskId=act.id; save(); renderTimeTasks(); updateActiveBadge(); updateManualTaskSelect();
    });
    div.querySelector('.act-del')?.addEventListener('click',(e)=>{
      e.stopPropagation();
      if(!confirm('فعالیت «'+act.title+'» از فهرست زمان‌سنج حذف شود؟ نشست‌های ثبت‌شده برای تاریخچه باقی می‌مانند.'))return;
      const rec=(state.settings.customActivities||[]).find(a=>a.title===act.title);
      if(rec)rec.archived=true;
      if(state.activeTaskId===act.id)state.activeTaskId=null;
      save();renderTimeTasks();updateActiveBadge();updateManualTaskSelect();drawClock();renderSessions();
    });
    container.appendChild(div);
  });
  const addWrap=document.createElement('div'); addWrap.className='act-add';
  addWrap.innerHTML=`<input id="newActivityInput" placeholder="فعالیت جدید (مثلاً مطالعه آزاد)" maxlength="40"/><button type="button" title="افزودن">+</button>`;
  addWrap.querySelector('button').addEventListener('click',()=>{
    const inp=addWrap.querySelector('input'); const title=(inp.value||'').trim();
    if(!title)return;
    if(selectableActivities().some(a=>a.title===title)){inp.value='';return;}
    if(!Array.isArray(state.settings.customActivities))state.settings.customActivities=[];
    if(!unarchiveActivity(title))state.settings.customActivities.push({title});
    save();inp.value='';renderTimeTasks();
  });
  addWrap.querySelector('input').addEventListener('keydown',e=>{if(e.key==='Enter')addWrap.querySelector('button').click();});
  container.appendChild(addWrap);
}
function updateActiveBadge(){
  const badge=document.getElementById('activeTaskBadge'); if(!badge) return;
  if(!state.activeTaskId){badge.style.display='none'; return;}
  const ref=sessionRefById(state.activeTaskId);
  if(!ref){badge.style.display='none'; return;}
  badge.style.display='flex';
  badge.innerHTML=`<span style="font-size:12px">${ref.icon||''}</span><div style="width:8px;height:8px;border-radius:50%;background:${ref.color}"></div><span>${ref.title}</span>`;
}
function formatHMS(sec){const h=String(Math.floor(sec/3600)).padStart(2,'0'); const m=String(Math.floor((sec%3600)/60)).padStart(2,'0'); const s=String(sec%60).padStart(2,'0'); return `${h}:${m}:${s}`;}
function getElapsed(){
  if(!state.timerStart) return state.timerAccum;
  return state.timerAccum + Math.floor((Date.now()-state.timerStart)/1000);
}
let clockArcs=[];
function tick(){
  const el=document.getElementById('timerDisplay');
  if(el) el.textContent=formatHMS(getElapsed());
  drawClock();
}

// --- NEW ROBUST TIMER ALGORITHM ---
// For each task only start time is written, every minute +1 to variable
// If system shuts down mid-task, data up to last minute is safe

function getCurrentSession(){
  if(!state.currentSessionId) return null;
  return state.sessions.find(s=>s.id===state.currentSessionId)||null;
}

function startTimer(){
  if(!state.activeTaskId){alert('یک وظیفه یا فعالیت انتخاب کن'); return;}
  const ref=sessionRefById(state.activeTaskId);
  if(!ref){alert('تسک پیدا نشد'); return;}
  // If already running, do nothing
  if(state.timerStart) return;

  const now=Date.now();

  if(!state.currentSessionId){
    // New session (timer-only activities are flagged activity:true)
    const sess={id:uid(),taskId:state.activeTaskId,start:now,end:now,duration:0};
    if(ref.kind==='activity')sess.activity=true;
    state.sessions.push(sess);
    state.currentSessionId=sess.id;
    state.timerAccum=0;
    state.timerStart=now;
    state.timerLastMinuteSave=now;
    console.log('[Timer] New session started', sess.id, 'for', task.title, 'at', new Date(now).toISOString());
  }else{
    // Resuming paused session
    state.timerStart=now;
    if(!state.timerLastMinuteSave) state.timerLastMinuteSave=now;
    console.log('[Timer] Resumed session', state.currentSessionId, 'accum', state.timerAccum, 'at', new Date(now).toISOString());
  }

  if(state.timerInterval) clearInterval(state.timerInterval);
  if(state.timerMinuteInterval) clearInterval(state.timerMinuteInterval);

  state.timerInterval=setInterval(tick,1000);
  state.timerMinuteInterval=setInterval(minuteTick,60000);

  if(ref.kind==='task'){ref.task.status='doing'; ref.task.completed=false;}
  save(); renderTasks(); renderTimeTasks(); updateActiveBadge(); tick();
}

function minuteTick(){
  if(!state.timerStart || !state.activeTaskId) return;
  const now=Date.now();
  const ref=sessionRefById(state.activeTaskId);
  const sess=getCurrentSession();
  if(!ref || !sess) return;

  const elapsedSinceLastSave = Math.floor((now - state.timerLastMinuteSave)/1000);
  if(elapsedSinceLastSave < 55) return;

  sess.duration = getElapsed();
  sess.end = now;
  state.timerLastMinuteSave = now;

  // Activities don't own tasks; task timeSpent stays the session sum
  if(ref.kind==='task'){
    ref.task.timeSpent = state.sessions.filter(s=>s.taskId===ref.task.id).reduce((a,b)=>a+b.duration,0);
  }

  console.log('[Timer] Minute tick for', task.title, 'elapsed', getElapsed(), 'totalForTask', totalForTask);
  save();
  renderTasks(); renderTimeTasks(); renderSessions(); drawClock();
}

function pauseTimer(){
  if(!state.timerStart) return;
  const now=Date.now();
  const ref=sessionRefById(state.activeTaskId);
  const sess=getCurrentSession();
  const elapsed = getElapsed();

  if(sess){
    sess.duration = elapsed;
    sess.end = now;
    if(ref&&ref.kind==='task')ref.task.timeSpent = state.sessions.filter(s=>s.taskId===ref.task.id).reduce((a,b)=>a+b.duration,0);
  }

  state.timerAccum = elapsed;
  state.timerStart = 0;
  state.timerLastMinuteSave = 0;

  if(state.timerInterval){clearInterval(state.timerInterval); state.timerInterval=null;}
  if(state.timerMinuteInterval){clearInterval(state.timerMinuteInterval); state.timerMinuteInterval=null;}

  if(ref&&ref.kind==='task'&&ref.task.status==='doing'){ref.task.status='todo';}

  console.log('[Timer] Paused at', elapsed, 's');
  save(); tick(); renderTasks(); renderTimeTasks(); renderSessions(); updateActiveBadge(); drawClock();
}

function stopTimer(){
  const elapsed = getElapsed();
  if(elapsed===0 && !state.currentSessionId) return;
  if(!state.activeTaskId) return;

  const now=Date.now();
  const ref=sessionRefById(state.activeTaskId);
  const sess=getCurrentSession();

  if(sess){
    sess.duration = elapsed;
    sess.end = now;
    if(ref&&ref.kind==='task'){
      ref.task.timeSpent = state.sessions.filter(s=>s.taskId===ref.task.id).reduce((a,b)=>a+b.duration,0);
      if(ref.task.status==='doing') ref.task.status='todo';
    }
  }

  state.timerStart=0;
  state.timerAccum=0;
  state.timerLastMinuteSave=0;
  state.currentSessionId=null;

  if(state.timerInterval){clearInterval(state.timerInterval); state.timerInterval=null;}
  if(state.timerMinuteInterval){clearInterval(state.timerMinuteInterval); state.timerMinuteInterval=null;}

  save(); tick(); renderTasks(); renderSessions(); drawClock(); renderTimeTasks(); updateActiveBadge();
}

document.getElementById('startTimerBtn')?.addEventListener('click',()=>{
  // If paused, resume
  if(state.timerAccum>0 && !state.timerStart && state.currentSessionId){
    startTimer();
    return;
  }
  startTimer();
});
document.getElementById('pauseTimerBtn')?.addEventListener('click',pauseTimer);
document.getElementById('stopTimerBtn')?.addEventListener('click',stopTimer);
document.getElementById('resetTodayBtn')?.addEventListener('click',()=>{
  const range=getViewDayRange();
  if(!confirm('ریست نشست‌های '+(range.isToday?'امروز':range.str)+'؟')) return;
  // Trim everything overlapping the viewed day (incl. overnight sleep from the evening before)
  state.sessions=state.sessions.flatMap(s=>{
    if(s.end<=range.start||s.start>=range.end)return [s];
    return trimSessionRange(s,range.start,range.end).filter(p=>p.duration>0);
  });
  recomputeAllTimeSpent();
  // also reset current timer only when viewing today
  if(range.isToday && state.timerStart){
    pauseTimer();
    stopTimer();
  }
  save(); renderSessions(); drawClock(); renderTasks(); renderTimeTasks(); renderPlansList(true);
});

// Recovery on load - if timer was running before crash/shutdown
function recoverTimerIfNeeded(){
  if(state.timerStart && state.activeTaskId){
    const now=Date.now();
    const elapsedSinceStart = Math.floor((now - state.timerStart)/1000);
    const totalElapsed = state.timerAccum + elapsedSinceStart;
    const ref=sessionRefById(state.activeTaskId);
    const sess=getCurrentSession();

    if(sess && totalElapsed>0){
      sess.duration = totalElapsed;
      sess.end = now;
      if(ref&&ref.kind==='activity')sess.activity=true;
      if(ref&&ref.kind==='task')ref.task.timeSpent = state.sessions.filter(s=>s.taskId===ref.task.id).reduce((a,b)=>a+b.duration,0);
    }

    // Pause after recovery - user can resume if wants
    state.timerAccum = totalElapsed;
    state.timerStart = 0;
    state.timerLastMinuteSave = 0;
    save();
    console.log('[Timer] Recovered and paused at', totalElapsed);
  }
}

recoverTimerIfNeeded();

if(state.timerStart){
  state.timerInterval=setInterval(tick,1000);
  state.timerMinuteInterval=setInterval(minuteTick,60000);
}
tick(); updateActiveBadge(); try{updateManualTaskSelect();}catch(e){}

// ===== AI time plans (hatched scheduling) - geometry & lifecycle =====
// plan = {id, title, color, date 'YYYY-MM-DD', startMin, endMin (minutes 0-1440), taskId?}
function splitPlanAMPM(s,e){
  const out=[];
  if(s<720) out.push({s,e:Math.min(e,720),pm:false});
  if(e>720) out.push({s:Math.max(s,720),e,pm:true});
  return out;
}
function planAngle(min){
  const ringMin=min%720;
  return (ringMin/60/12)*Math.PI*2 - Math.PI/2;
}
function getPlanTaskId(plan){
  if(plan.taskId && state.tasks.some(t=>t.id===plan.taskId)) return plan.taskId;
  const t=state.tasks.find(t=>t.title===plan.title && t.date===plan.date);
  return t?t.id:null;
}
function sessionCovers(sess,bs,be,now){
  let s=sess.start, e=sess.end||sess.start;
  if(state.currentSessionId && sess.id===state.currentSessionId && state.timerStart) e=now;
  return s<be && e>bs;
}
// Classify every 1-minute bucket of a plan: 'align' (planned task worked), 'miss' (idle/other), 'future'
function classifyPlan(plan){
  const midnight=new Date(plan.date+'T00:00:00').getTime();
  const now=Date.now();
  const tid=getPlanTaskId(plan);
  const runningMatch=!!(state.timerStart && tid && state.activeTaskId===tid);
  const alignRanges=[], futureRanges=[];
  let kind=null, rangeStart=plan.startMin, liveAlignEnd=null, liveRangeStart=null;
  const close=(k,s,e)=>{
    if(k==='align'){
      let end=e;
      if(liveAlignEnd!=null && s===liveRangeStart) end=Math.min(e,liveAlignEnd);
      alignRanges.push([s,end]);
    } else if(k==='future') futureRanges.push([s,e]);
  };
  for(let m=plan.startMin;m<plan.endMin;m++){
    const bs=midnight+m*60000, be=bs+60000;
    let cur;
    if(be<=now){
      let covered=false;
      if(tid) covered=state.sessions.some(sess=>sess.taskId===tid && sessionCovers(sess,bs,be,now));
      cur=covered?'align':'miss';
    }else if(bs<=now && be>now){
      if(runningMatch){ cur='align'; liveAlignEnd=m+(now-bs)/60000; liveRangeStart=(kind==='align'?rangeStart:m); }
      else cur='future'; // idle or another task active: hatch stays until this minute resolves
    }else cur='future';
    if(cur!==kind){
      if(kind) close(kind,rangeStart,m);
      kind=cur; rangeStart=m;
    }
  }
  if(kind) close(kind,rangeStart,plan.endMin);
  return {alignRanges,futureRanges};
}
function forEachPlanSeg(ranges,cb){
  ranges.forEach(([s,e])=>{ if(e<=s)return; splitPlanAMPM(s,e).forEach(cb); });
}
function drawHatchBand(ctx,cx,cy,rIn,rOut,a0,a1,color){
  if(a1<=a0) return;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx,cy,rOut,a0,a1,false);
  ctx.arc(cx,cy,rIn,a1,a0,true);
  ctx.closePath();
  ctx.clip();
  ctx.globalAlpha=0.10; ctx.fillStyle=color;
  ctx.beginPath(); ctx.arc(cx,cy,rOut,a0,a1,false); ctx.arc(cx,cy,rIn,a1,a0,true); ctx.closePath(); ctx.fill();
  ctx.globalAlpha=0.72; ctx.strokeStyle=color; ctx.lineWidth=2;
  const span=rOut*2+40;
  ctx.beginPath();
  for(let d=-span; d<span; d+=9){
    ctx.moveTo(cx-rOut+d, cy-rOut);
    ctx.lineTo(cx+rOut+d, cy+rOut);
  }
  ctx.stroke();
  ctx.globalAlpha=1;
  ctx.restore();
}
// Habit blocks (stubs) cover the whole window regardless of clock time and turn
// solid when the habit is done; explicit plans keep the past/future alignment logic.
function planDrawRanges(plan,dayStr,kind){
  if(plan.stub){
    const h=state.habits.find(x=>x.id===plan.habitId);
    const done=h&&habitDone(h,plan.date);
    if(kind==='hatch')return done?[]:[[plan.startMin,plan.endMin]];
    return done?[[plan.startMin,plan.endMin]]:[];
  }
  const c=classifyPlan(plan);
  return kind==='hatch'?c.futureRanges:c.alignRanges;
}
// Arc angles for a plan segment; a segment ending exactly at 12 (720 min) must
// continue ACROSS the seam instead of wrapping back to -90° (which dropped the whole AM band).
function planSegAngles(seg){
  let a0=planAngle(seg.s), a1=planAngle(seg.e);
  if(a1<=a0)a1+=2*Math.PI;
  return {a0,a1};
}
function drawPlansHatches(ctx,cx,cy,geo,dayStr){
  plansForDate(dayStr).forEach(plan=>{
    const color=plan.color||'#e4f222';
    forEachPlanSeg(planDrawRanges(plan,dayStr,'hatch'),seg=>{
      const r=seg.pm?geo.outer:geo.inner, th=seg.pm?geo.outerT:geo.innerT;
      const {a0,a1}=planSegAngles(seg);
      drawHatchBand(ctx,cx,cy,r-th/2,r+th/2,a0,a1,color);
    });
  });
}
function drawPlansAligned(ctx,cx,cy,geo,dayStr){
  plansForDate(dayStr).forEach(plan=>{
    const color=plan.color||'#e4f222';
    forEachPlanSeg(planDrawRanges(plan,dayStr,'align'),seg=>{
      const r=seg.pm?geo.outer:geo.inner, th=seg.pm?geo.outerT:geo.innerT;
      const {a0,a1}=planSegAngles(seg);
      if(a1<=a0) return;
      ctx.beginPath(); ctx.arc(cx,cy,r,a0,a1,false);
      ctx.strokeStyle=color; ctx.lineWidth=th-4; ctx.globalAlpha=0.95; ctx.lineCap='butt'; ctx.stroke(); ctx.globalAlpha=1;
      // Smaller black line on top = done according to plan
      ctx.beginPath(); ctx.arc(cx,cy,r,a0,a1,false);
      ctx.strokeStyle='rgba(0,0,0,0.78)'; ctx.lineWidth=Math.max(5,(th-4)*0.3); ctx.stroke();
    });
  });
}

// Clock - Two circles AM inner, PM outer
function drawClock(){
  const canvas=document.getElementById('clockCanvas'); if(!canvas) return;
  const ctx=canvas.getContext('2d');
  const W=canvas.width, H=canvas.height;
  const cx=W/2, cy=H/2;
  ctx.clearRect(0,0,W,H);
  // Background
  ctx.fillStyle='#0f1011'; ctx.beginPath(); ctx.arc(cx,cy,W/2-10,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#23252a'; ctx.lineWidth=1; ctx.stroke();

  const outerRadius=340; // PM
  const innerRadius=220; // AM
  const outerThickness=36;
  const innerThickness=36;
  clockArcs=[];

  // Draw base rings
  ctx.beginPath(); ctx.arc(cx,cy,outerRadius,0,Math.PI*2); ctx.strokeStyle='rgba(255,255,255,0.06)'; ctx.lineWidth=outerThickness; ctx.stroke();
  ctx.beginPath(); ctx.arc(cx,cy,innerRadius,0,Math.PI*2); ctx.strokeStyle='rgba(255,255,255,0.04)'; ctx.lineWidth=innerThickness; ctx.stroke();

  // Hour ticks for both rings
  for(let i=0;i<12;i++){
    const angle=(i/12)*Math.PI*2 - Math.PI/2;
    // Outer PM ticks
    const r1o=outerRadius+outerThickness/2+4, r2o=outerRadius+outerThickness/2+14;
    const x1o=cx+Math.cos(angle)*r1o, y1o=cy+Math.sin(angle)*r1o;
    const x2o=cx+Math.cos(angle)*r2o, y2o=cy+Math.sin(angle)*r2o;
    ctx.beginPath(); ctx.moveTo(x1o,y1o); ctx.lineTo(x2o,y2o); ctx.strokeStyle='#d0d6e0'; ctx.lineWidth=1.2; ctx.stroke();
    // Label PM
    const txo=cx+Math.cos(angle)*(outerRadius+outerThickness/2+28), tyo=cy+Math.sin(angle)*(outerRadius+outerThickness/2+28);
    ctx.fillStyle='#8a8f98'; ctx.font=`12px Morabba`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText((i===0?12:i)+'',txo,tyo);

    // Inner AM ticks
    const r1i=innerRadius-innerThickness/2-14, r2i=innerRadius-innerThickness/2-4;
    const x1i=cx+Math.cos(angle)*r1i, y1i=cy+Math.sin(angle)*r1i;
    const x2i=cx+Math.cos(angle)*r2i, y2i=cy+Math.sin(angle)*r2i;
    ctx.beginPath(); ctx.moveTo(x1i,y1i); ctx.lineTo(x2i,y2i); ctx.strokeStyle='#62666d'; ctx.lineWidth=1; ctx.stroke();
    const txi=cx+Math.cos(angle)*(innerRadius-innerThickness/2-28), tyi=cy+Math.sin(angle)*(innerRadius-innerThickness/2-28);
    ctx.fillStyle='#62666d'; ctx.font=`11px Morabba`; ctx.fillText((i===0?12:i)+'',txi,tyi);
  }

  // Center labels AM/PM
  ctx.fillStyle='#d0d6e0'; ctx.font=`bold 13px Morabba`; ctx.textAlign='center';
  ctx.fillText('PM - بیرونی (12-23)',cx,cy- innerRadius - 50);
  ctx.fillStyle='#8a8f98'; ctx.font=`12px Morabba`;
  ctx.fillText('AM - داخلی (0-11)',cx,cy+ outerRadius + 30);

  // Planned blocks (AI time planning) for the currently viewed day - future parts as hatches, behind real sessions
  const day=getViewDayRange();
  const clockGeo={outer:outerRadius,inner:innerRadius,outerT:outerThickness,innerT:innerThickness};
  drawPlansHatches(ctx,cx,cy,clockGeo,day.str);

  // Sessions overlapping the viewed day (a session starting the previous evening
  // still paints its post-midnight part on this day's AM ring)
  const todaySessions=state.sessions.filter(s=>s.end>day.start && s.start<day.end);
  const clippedSecOf=s=>{
    const a=Math.max(s.start,day.start), b=Math.min(s.end,day.end);
    return Math.max(0,Math.round((b-a)/1000));
  };
  const byTaskTotal={};
  todaySessions.forEach(s=>{
    byTaskTotal[s.taskId]=(byTaskTotal[s.taskId]||0)+clippedSecOf(s);
  });
  // Split a [h0,h1) interval (hours relative to day start, 0..24) into AM/PM ring arcs
  const ringSegs=(h0,h1)=>{const out=[];let t=h0;
    while(t<h1-0.0001){const pm=t>=12;const edge=pm?24:12;const e=Math.min(h1,edge);
      out.push({start:pm?t-12:t,end:pm?e-12:e,isPM:pm});t=e;}
    return out;};

  todaySessions.forEach(s=>{
    const ref=sessionRefById(s.taskId); if(!ref) return;
    const clipStart=Math.max(s.start,day.start), clipEnd=Math.min(s.end,day.end);
    const h0=(clipStart-day.start)/3600000, h1=(clipEnd-day.start)/3600000;
    if(h1-h0<0.01)return;
    const isSleep=s.taskId==='act:sleep';
    ringSegs(h0,h1).forEach(seg=>{
      const sa=(seg.start/12)*Math.PI*2 - Math.PI/2;
      const ea=(seg.end/12)*Math.PI*2 - Math.PI/2;
      const radius=seg.isPM?outerRadius:innerRadius;
      const thickness=seg.isPM?outerThickness:innerThickness;
      ctx.beginPath(); ctx.arc(cx,cy,radius,sa,ea,false);
      ctx.strokeStyle=ref.color; ctx.lineWidth=thickness-4; ctx.lineCap='butt';
      if(isSleep){ctx.globalAlpha=0.55;ctx.setLineDash([9,7]);}
      else {ctx.globalAlpha=ref.kind==='activity'?0.75:0.9;}
      ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha=1;

      clockArcs.push({
        ref, session:s,
        startAngle:sa, endAngle:ea,
        radius, thickness,
        isPM:seg.isPM,
        cx, cy,
        totalToday:byTaskTotal[s.taskId]||0
      });
    });
  });

  // Active session (live, today only)
  if(day.isToday && state.timerStart && state.activeTaskId){
    const ref=sessionRefById(state.activeTaskId);
    if(ref){
      const elapsed=getElapsed();
      const liveStart=Math.max(Date.now()-elapsed*1000,day.start);
      const h0=(liveStart-day.start)/3600000;
      const now=new Date();
      const h1=Math.min(24,now.getHours()+now.getMinutes()/60+now.getSeconds()/3600);
      ringSegs(h0,h1).forEach(seg=>{
        const sa=(seg.start/12)*Math.PI*2 - Math.PI/2, ea=(seg.end/12)*Math.PI*2 - Math.PI/2;
        const radius=seg.isPM?outerRadius:innerRadius;
        ctx.beginPath(); ctx.arc(cx,cy,radius,sa,ea,false);
        ctx.strokeStyle=ref.color; ctx.lineWidth=(seg.isPM?outerThickness:innerThickness)-4; ctx.setLineDash([6,6]); ctx.globalAlpha=0.6; ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha=1;
      });
    }
  }

  // Planned blocks actually done as planned: solid color + smaller black line
  drawPlansAligned(ctx,cx,cy,clockGeo,day.str);

  // Current time hand - only when viewing today; otherwise show which day is shown
  const now=new Date();
  if(day.isToday){
    const nowH=now.getHours()+now.getMinutes()/60;
    const isPM=nowH>=12; const nowHour12=isPM?nowH-12:nowH;
    const nowAngle=(nowHour12/12)*Math.PI*2 - Math.PI/2;
    const handRadius=isPM?outerRadius:innerRadius;
    const hx=cx+Math.cos(nowAngle)*(handRadius), hy=cy+Math.sin(nowAngle)*(handRadius);
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(hx,hy); ctx.strokeStyle='#ffffff'; ctx.lineWidth=1.2; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx,cy,5,0,Math.PI*2); ctx.fillStyle='#ffffff'; ctx.fill();
  }else{
    const j=toJalali(...day.str.split('-').map(Number));
    ctx.fillStyle='#8a8f98'; ctx.font='12px Morabba'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(day.str+' • '+j.jd+' '+jMonthNames[j.jm-1],cx,cy+6);
  }
}

// Tooltip for clock
const tooltip=document.getElementById('clockTooltip');
const canvasEl=document.getElementById('clockCanvas');
if(canvasEl){
  canvasEl.addEventListener('mousemove',(e)=>{
    const rect=canvasEl.getBoundingClientRect();
    const scaleX=canvasEl.width/rect.width;
    const scaleY=canvasEl.height/rect.height;
    const x=(e.clientX-rect.left)*scaleX;
    const y=(e.clientY-rect.top)*scaleY;
    const cx=canvasEl.width/2, cy=canvasEl.height/2;
    const dx=x-cx, dy=y-cy;
    const dist=Math.sqrt(dx*dx+dy*dy);
    const angle=Math.atan2(dy,dx);
    let normAngle=angle + Math.PI/2; if(normAngle<0) normAngle+=Math.PI*2;
    // Check arcs
    let found=null;
    for(const arc of clockArcs){
      const r=arc.radius, th=arc.thickness;
      if(Math.abs(dist - r) <= th/2){
        let sa=arc.startAngle, ea=arc.endAngle;
        // Normalize angles to 0-2pi
        let a=normAngle;
        // Handle wrap
        let s=sa + Math.PI/2; if(s<0) s+=Math.PI*2; if(s>=Math.PI*2) s-=Math.PI*2;
        let ee=ea + Math.PI/2; if(ee<0) ee+=Math.PI*2; if(ee>=Math.PI*2) ee-=Math.PI*2;
        // Check if angle between
        let between=false;
        if(s<=ee){between= a>=s && a<=ee;}
        else{between= a>=s || a<=ee;}
        if(between){found=arc; break;}
      }
    }
    if(found && tooltip){
      const st=new Date(found.session.start), en=new Date(found.session.end);
      const totalM=Math.round(found.totalToday/60);
      tooltip.innerHTML=`<b style="color:${found.ref.color}">${found.ref.icon?found.ref.icon+' ':''}● ${found.ref.title}</b><br>شروع: ${st.toLocaleTimeString('fa-IR')} - پایان: ${en.toLocaleTimeString('fa-IR')}<br>این بخش: ${Math.round(found.session.duration/60)} دقیقه<br>کل امروز: ${totalM} دقیقه<br>${found.isPM?'PM (بیرونی)':'AM (داخلی)'}`;
      tooltip.style.left=e.clientX - rect.left + 'px';
      tooltip.style.top=e.clientY - rect.top + 'px';
      tooltip.classList.add('show');
    }else if(tooltip){
      tooltip.classList.remove('show');
    }
  });
  canvasEl.addEventListener('mouseleave',()=>{if(tooltip) tooltip.classList.remove('show');});
}

// ===== Day image export (planning section) =====
// One-click PNG of the viewed day: the scheduling clock exactly as drawn in
// زمان‌سنجی, plus a leader line out of every band with the task name and the
// time it was done written outside the dial.
function expHM(min){const m=Math.max(0,Math.min(1440,Math.round(min)));return m>=1440?'24:00':minToHM(m);}
function expDur(min){const m=Math.max(0,Math.round(min));const h=Math.floor(m/60),mm=m%60;return (h?h:'0')+':'+String(mm).padStart(2,'0');}
function blockRingSegs(m0,m1){ // day-minutes -> ring segments {s,e,pm} in 0..720 ring-minutes
  const out=[];let t=m0;
  while(t<m1-1e-4){
    const pm=t>=720, edge=pm?1440:720, e=Math.min(m1,edge);
    out.push({s:pm?t-720:t,e:pm?e-720:e,pm}); t=e;
  }
  return out;
}
function dayExportBlocks(day){
  const blocks=[];
  const pushSession=(taskId,startMs,endMs,live)=>{
    const ref=sessionRefById(taskId); if(!ref)return;
    const startMin=(Math.max(startMs,day.start)-day.start)/60000;
    const endMin=(Math.min(endMs,day.end)-day.start)/60000;
    if(endMin-startMin<1)return;
    blocks.push({kind:'session',title:ref.title,color:ref.color,startMin,endMin,
      sleep:taskId==='act:sleep',live:!!live,tag:live?'در حال اجرا':null,lead:blockRingSegs(startMin,endMin)});
  };
  state.sessions.filter(s=>s.end>day.start&&s.start<day.end).forEach(s=>pushSession(s.taskId,s.start,s.end,false));
  if(day.isToday&&state.timerStart&&state.activeTaskId){
    const elapsed=getElapsed();
    if(elapsed>0)pushSession(state.activeTaskId,Math.max(Date.now()-elapsed*1000,day.start),Date.now(),true);
  }
  plansForDate(day.str).forEach(p=>{
    if(!(p.endMin>p.startMin))return;
    const color=p.color||'#e4f222';
    if(p.stub){ // habit window band - solid when done, hatch when not
      const win=p.endMin-p.startMin;
      const covered=blocks.some(b=>b.kind==='session'&&b.title===p.title&&(Math.min(b.endMin,p.endMin)-Math.max(b.startMin,p.startMin))>win*0.5);
      if(covered)return;
      blocks.push({kind:'habit',title:p.title,color,startMin:p.startMin,endMin:p.endMin,
        tag:p.normal?'روتین':'عادت',lead:blockRingSegs(p.startMin,p.endMin)});
      return;
    }
    const c=classifyPlan(p);
    let hatch=0,best=null;
    c.futureRanges.forEach(([a,b])=>{hatch+=Math.max(0,b-a);if(!best||b-a>best[1]-best[0])best=[a,b];});
    if(hatch<8||!best)return; // done as planned - the session labels already show the work
    blocks.push({kind:'plan',title:p.title,color,startMin:p.startMin,endMin:p.endMin,tag:'برنامه',lead:blockRingSegs(best[0],best[1])});
  });
  blocks.forEach(b=>{if(!b.lead||!b.lead.length)b.lead=blockRingSegs(b.startMin,b.endMin);});
  return blocks;
}
// Classic pie-chart label spread: keep each side ordered by angle, push apart by gap
function placeExportLabels(labels,gap,minY,maxY){
  [1,-1].forEach(side=>{
    const arr=labels.filter(l=>l.side===side).sort((a,b)=>a.y0-b.y0);
    const n=arr.length; if(!n)return;
    const ys=arr.map(l=>l.y0);
    for(let i=1;i<n;i++) if(ys[i]<ys[i-1]+gap) ys[i]=ys[i-1]+gap;
    if(ys[n-1]>maxY){
      ys[n-1]=maxY;
      for(let i=n-2;i>=0;i--) ys[i]=Math.min(ys[i],ys[i+1]-gap);
    }
    if(ys[0]<minY){
      const need=minY-ys[0];
      if(ys[n-1]+need<=maxY){for(let i=0;i<n;i++)ys[i]+=need;}
      else{
        const step=n>1?(maxY-minY)/(n-1):0;
        for(let i=0;i<n;i++)ys[i]=n>1?minY+i*step:(minY+maxY)/2;
      }
    }
    arr.forEach((l,i)=>{l.y=ys[i];});
  });
  return labels;
}
function buildDayImage(day){
  const blocks=dayExportBlocks(day);
  const W=1700,cx=850,cy=810;
  const R_PM=338,R_AM=218,TH=36,R_BEND=438,R_COL=464;
  const geo={outer:R_PM,inner:R_AM,outerT:TH,innerT:TH};
  const NAME='600 24px Morabba',SUB='400 16px Morabba';
  const meas=document.createElement('canvas');meas.width=meas.height=8;
  const mctx=meas.getContext('2d');
  const labels=blocks.map(b=>{
    const primary=b.lead.reduce((best,a)=>(a.e-a.s)>(best.e-best.s)?a:best,b.lead[0]);
    const ang=(((primary.s+primary.e)/2)/720)*Math.PI*2-Math.PI/2;
    const side=Math.cos(ang)>=0?1:-1;
    const sub=faNum(expHM(b.startMin))+'–'+faNum(expHM(b.endMin))
      +(b.kind==='session'?' • '+faNum(expDur(b.endMin-b.startMin)):'')
      +(b.tag?' • '+b.tag:'');
    return {b,ang,side,sub,y0:cy+Math.sin(ang)*R_BEND};
  });
  placeExportLabels(labels,60,170,1450);
  const maxLabelY=labels.reduce((a,l)=>Math.max(a,l.y+34),0);
  const H=Math.max(1240,Math.min(1560,Math.ceil(Math.max(maxLabelY+46,cy+R_PM+TH/2+80))));
  const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#08090a';ctx.fillRect(0,0,W,H);
  // header: date + what was logged
  const j=toJalali(...day.str.split('-').map(Number));
  const dow=new Date(day.start).getDay();
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillStyle='#ffffff';ctx.font='700 32px Morabba';
  ctx.fillText(faWeekdays[dow]+' • '+faNum(j.jd)+' '+jMonthNames[j.jm-1]+' '+faNum(j.jy),cx,64);
  const sess=blocks.filter(b=>b.kind==='session');
  const sessMin=sess.reduce((a,b)=>a+(b.endMin-b.startMin),0);
  ctx.fillStyle='#8a8f98';ctx.font='400 17px Morabba';
  ctx.fillText(sess.length?faNum(sess.length)+' بخش ثبت‌شده • مجموع '+faNum(expDur(sessMin)):'کاری ثبت نشده',cx,102);
  ctx.strokeStyle='#23252a';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(cx-240,134);ctx.lineTo(cx+240,134);ctx.stroke();
  // dial - same language as the in-app clock (AM inner, PM outer)
  ctx.fillStyle='#0f1011';ctx.beginPath();ctx.arc(cx,cy,414,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#23252a';ctx.stroke();
  ctx.beginPath();ctx.arc(cx,cy,R_PM,0,Math.PI*2);ctx.strokeStyle='rgba(255,255,255,0.06)';ctx.lineWidth=TH;ctx.stroke();
  ctx.beginPath();ctx.arc(cx,cy,R_AM,0,Math.PI*2);ctx.strokeStyle='rgba(255,255,255,0.04)';ctx.lineWidth=TH;ctx.stroke();
  for(let i=0;i<12;i++){
    const angle=(i/12)*Math.PI*2-Math.PI/2;
    const r1o=R_PM+TH/2+4,r2o=R_PM+TH/2+14;
    ctx.beginPath();
    ctx.moveTo(cx+Math.cos(angle)*r1o,cy+Math.sin(angle)*r1o);
    ctx.lineTo(cx+Math.cos(angle)*r2o,cy+Math.sin(angle)*r2o);
    ctx.strokeStyle='#d0d6e0';ctx.lineWidth=1.2;ctx.stroke();
    ctx.fillStyle='#8a8f98';ctx.font='15px Morabba';ctx.textAlign='center';
    ctx.fillText((i===0?12:i)+'',cx+Math.cos(angle)*(R_PM+TH/2+28),cy+Math.sin(angle)*(R_PM+TH/2+28));
    const r1i=R_AM-TH/2-14,r2i=R_AM-TH/2-4;
    ctx.beginPath();
    ctx.moveTo(cx+Math.cos(angle)*r1i,cy+Math.sin(angle)*r1i);
    ctx.lineTo(cx+Math.cos(angle)*r2i,cy+Math.sin(angle)*r2i);
    ctx.strokeStyle='#62666d';ctx.lineWidth=1;ctx.stroke();
    ctx.fillStyle='#62666d';ctx.font='13px Morabba';
    ctx.fillText((i===0?12:i)+'',cx+Math.cos(angle)*(R_AM-TH/2-28),cy+Math.sin(angle)*(R_AM-TH/2-28));
  }
  drawPlansHatches(ctx,cx,cy,geo,day.str);
  // real sessions, same styling as drawClock (sleep dashed)
  state.sessions.filter(s=>s.end>day.start&&s.start<day.end).forEach(s=>{
    const ref=sessionRefById(s.taskId); if(!ref)return;
    const startMin=(Math.max(s.start,day.start)-day.start)/60000;
    const endMin=(Math.min(s.end,day.end)-day.start)/60000;
    if(endMin-startMin<1)return;
    const isSleep=s.taskId==='act:sleep';
    blockRingSegs(startMin,endMin).forEach(seg=>{
      const a0=(seg.s/720)*Math.PI*2-Math.PI/2,a1=(seg.e/720)*Math.PI*2-Math.PI/2;
      ctx.beginPath();ctx.arc(cx,cy,seg.pm?R_PM:R_AM,a0,a1,false);
      ctx.strokeStyle=ref.color;ctx.lineWidth=TH-4;ctx.lineCap='butt';
      if(isSleep){ctx.globalAlpha=0.55;ctx.setLineDash([9,7]);}
      else{ctx.globalAlpha=ref.kind==='activity'?0.75:0.9;}
      ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
    });
  });
  // live session (today) - dashed like the in-app clock
  if(day.isToday&&state.timerStart&&state.activeTaskId){
    const ref=sessionRefById(state.activeTaskId);
    if(ref){
      const elapsed=getElapsed();
      const startMin=(Math.max(Date.now()-elapsed*1000,day.start)-day.start)/60000;
      const endMin=Math.min(1440,(Date.now()-day.start)/60000);
      if(endMin-startMin>=1)blockRingSegs(startMin,endMin).forEach(seg=>{
        const a0=(seg.s/720)*Math.PI*2-Math.PI/2,a1=(seg.e/720)*Math.PI*2-Math.PI/2;
        ctx.beginPath();ctx.arc(cx,cy,seg.pm?R_PM:R_AM,a0,a1,false);
        ctx.strokeStyle=ref.color;ctx.lineWidth=TH-4;ctx.setLineDash([6,6]);ctx.globalAlpha=0.6;ctx.stroke();
        ctx.setLineDash([]);ctx.globalAlpha=1;
      });
    }
  }
  drawPlansAligned(ctx,cx,cy,geo,day.str);
  // leader lines + labels: every band gets a line out with the task written outside
  labels.forEach(l=>{
    const b=l.b;
    const colX=l.side>0?cx+R_COL:cx-R_COL;
    const textX=l.side>0?colX+26:colX-26;
    b.lead.forEach(seg=>{
      const ang=(((seg.s+seg.e)/2)/720)*Math.PI*2-Math.PI/2;
      const rA=(seg.pm?R_PM:R_AM)+TH/2;
      const ax=cx+Math.cos(ang)*rA,ay=cy+Math.sin(ang)*rA;
      const bx=cx+Math.cos(ang)*R_BEND,by=cy+Math.sin(ang)*R_BEND;
      const path=()=>{ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.lineTo(colX,l.y);};
      path();ctx.strokeStyle='rgba(8,9,10,0.7)';ctx.lineWidth=3.2;ctx.stroke();
      path();ctx.strokeStyle=b.color||'#d6dce6';ctx.lineWidth=1.3;ctx.globalAlpha=0.85;ctx.stroke();ctx.globalAlpha=1;
      ctx.beginPath();ctx.arc(ax,ay,3,0,Math.PI*2);ctx.fillStyle=b.color||'#d6dce6';ctx.fill();
    });
    mctx.font=NAME;
    let name=String(b.title||'');
    if(mctx.measureText(name).width>300){
      while(name.length>1&&mctx.measureText(name+'…').width>300)name=name.slice(0,-1);
      name+='…';
    }
    ctx.textBaseline='middle';
    const swX=l.side>0?textX:textX-12;
    const nameX=l.side>0?textX+20:textX-20;
    ctx.fillStyle=b.color||'#d6dce6';
    ctx.beginPath();
    if(ctx.roundRect)ctx.roundRect(swX,l.y-15,12,12,3);else ctx.rect(swX,l.y-15,12,12);
    ctx.fill();
    ctx.font=NAME;ctx.fillStyle='#e6eaf2';ctx.textAlign=l.side>0?'left':'right';
    ctx.fillText(name,nameX,l.y-9);
    ctx.font=SUB;ctx.fillStyle='#8a8f98';
    ctx.fillText(l.sub,textX,l.y+17);
  });
  // ring captions last, with a chip so leader lines never cut through them
  const caption=(txt,x,y,font,color)=>{
    ctx.font=font;ctx.textAlign='center';ctx.textBaseline='middle';
    const w=ctx.measureText(txt).width;
    ctx.fillStyle='rgba(8,9,10,0.88)';
    ctx.beginPath();
    if(ctx.roundRect)ctx.roundRect(x-w/2-10,y-13,w+20,26,6);else ctx.rect(x-w/2-10,y-13,w+20,26);
    ctx.fill();
    ctx.fillStyle=color;ctx.fillText(txt,x,y);
  };
  caption('PM - بیرونی (12-23)',cx,cy-R_AM-46,'bold 15px Morabba','#d0d6e0');
  caption('AM - داخلی (0-11)',cx,cy+R_PM+32,'13px Morabba','#8a8f98');
  return canvas;
}
function downloadDayImage(){
  const day=getViewDayRange();
  if(!dayExportBlocks(day).length){alert('برای این روز کاری ثبت نشده که در عکس بیاید');return;}
  const go=()=>{
    try{
      const canvas=buildDayImage(day);
      const save=(url,revoke)=>{
        const a=document.createElement('a');
        a.href=url;a.download='outtask-'+day.str+'.png';a.click();
        if(revoke)URL.revokeObjectURL(url);
      };
      if(canvas.toBlob)canvas.toBlob(blob=>{
        if(!blob){save(canvas.toDataURL('image/png'),false);return;}
        save(URL.createObjectURL(blob),true);
      },'image/png');
      else save(canvas.toDataURL('image/png'),false);
    }catch(e){alert('ساخت عکس ممکن نشد');}
  };
  if(document.fonts&&document.fonts.load){
    Promise.all(['700 30px Morabba','600 22px Morabba','400 16px Morabba','400 15px Morabba'].map(f=>document.fonts.load(f,'۱۲۳ abc'))).then(go).catch(go);
  }else go();
}
document.getElementById('dayImgBtn')?.addEventListener('click',()=>downloadDayImage());

function renderSessions(){
  const list=document.getElementById('sessionsList'); if(!list) return;
  const day=getViewDayRange();
  // Listing rule: a session is shown on day D when it starts on D and does not
  // cross out of D, OR it starts before D and continues into D (incoming, e.g.
  // overnight sleep). Outgoing cross-midnight sessions are listed on the end day.
  const belongsToList=(s)=>{
    if(s.start>=day.start && s.start<day.end && s.end<=day.end) return true;
    if(s.start<day.start && s.end>day.start) return true;
    return false;
  };
  const daySessions=[...state.sessions].filter(belongsToList).sort((a,b)=>b.start-a.start);
  list.innerHTML='';
  if(daySessions.length===0){list.innerHTML='<div class="muted" style="font-size:12px">نشستی ثبت نشده</div>';}
  daySessions.forEach(s=>{
    const ref=sessionRefById(s.taskId); if(!ref) return;
    const div=document.createElement('div'); div.className='session-item';
    if(ref.kind==='activity')div.style.opacity='0.85';
    const mins=Math.round(s.duration/60);
    const cross= s.start<day.start?' title="از شب قبل">':'">';
    div.innerHTML=`<div style="width:8px;height:8px;border-radius:50%;background:${ref.color};flex:none"></div><div style="flex:1;min-width:0"><div style="font-size:12.5px;color:var(--paper)">${ref.icon?ref.icon+' ':''}${ref.title}${s.start<day.start?' <span class="pill" style="font-size:9px">از شب قبل</span>':''}</div><div class="muted" style="font-size:11px">${new Date(s.start).toLocaleTimeString('fa-IR')} → ${new Date(s.end).toLocaleTimeString('fa-IR')}</div></div><div style="font-size:11px;background:rgba(255,255,255,0.06);padding:4px 8px;border-radius:99px;flex:none">${mins}m</div>`;
    list.appendChild(div);
  });
  const statsEl=document.getElementById('todayStats'); if(!statsEl) return;
  // Focus stats: tasks only (sleep/rest/activities excluded); clipped to day;
  // live running session uses live elapsed.
  const secOf=(s)=>{
    let val=Math.round((Math.min(s.end,day.end)-Math.max(s.start,day.start))/1000);
    if(state.currentSessionId && s.id===state.currentSessionId && state.timerStart){
      val=Math.max(0,getElapsed()-Math.round((day.start-Math.min(s.start,day.start))/1000));
    }
    return Math.max(0,val);
  };
  const focus=daySessions.filter(s=>!isActivityId(s.taskId));
  let totalSec=0; const byTask={};
  focus.forEach(s=>{const d=secOf(s);totalSec+=d;byTask[s.taskId]=(byTask[s.taskId]||0)+d;});
  const liveRef=state.timerStart&&state.activeTaskId?sessionRefById(state.activeTaskId):null;
  if(liveRef&&liveRef.kind==='task'&&day.isToday){
    const liveStart=Date.now()-getElapsed()*1000;
    if(liveStart<day.end){const d=Math.round((Math.min(Date.now(),day.end)-Math.max(liveStart,day.start))/1000);totalSec+=d;byTask[state.activeTaskId]=(byTask[state.activeTaskId]||0)+d;}
  }
  let html=`<div style="font-size:26px;font-weight:700;color:var(--paper)">${Math.floor(totalSec/3600)}h ${Math.floor((totalSec%3600)/60)}m</div><div class="muted" style="margin-bottom:10px">فوکوس ${day.isToday?'امروز':'این روز'} (بدون خواب و استراحت)</div>`;
  Object.entries(byTask).filter(([,d])=>d>0).forEach(([tid,dur])=>{
    const task=state.tasks.find(t=>t.id===tid); if(!task) return;
    const pct=totalSec?Math.round((dur/totalSec)*100):0;
    html+=`<div style="display:flex;gap:8px;align-items:center;margin:8px 0"><div style="width:8px;height:8px;border-radius:50%;background:${task.color}"></div><div style="flex:1;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${task.title}</div><div style="font-size:11px;color:var(--fog)">${Math.round(dur/60)}m ${pct}%</div></div><div style="height:3px;background:rgba(255,255,255,0.06);border-radius:99px"><div style="height:100%;width:${pct}%;background:${task.color};border-radius:99px"></div></div>`;
  });
  statsEl.innerHTML=html;
}

function updateManualTaskSelect(){
  const activeEl=document.getElementById('manualActiveTask');
  if(!activeEl) return;
  if(!state.activeTaskId){
    activeEl.innerHTML='تسکی انتخاب نشده - از لیست سمت چپ یک تسک یا فعالیت انتخاب کن';
    activeEl.style.borderColor='var(--graphite)';
  }else{
    const ref=sessionRefById(state.activeTaskId);
    if(ref){
      const datePill=ref.kind==='task'?`<span class="pill">${ref.task.date}</span><span class="pill">${ref.task.timeSpent?Math.round(ref.task.timeSpent/60)+'m':''}</span>`:`<span class="pill">فقط زمان‌سنجی</span>`;
      activeEl.innerHTML=`<div style="display:flex;align-items:center;gap:8px">${ref.icon?`<span style="font-size:13px">${ref.icon}</span>`:`<div style="width:8px;height:8px;border-radius:50%;background:${ref.color}"></div>`}<span style="color:var(--paper);font-weight:600">${ref.title}</span>${datePill}</div>`;
      activeEl.style.borderColor=ref.color+'66';
      // Auto-fill time inputs if empty
      const startEl=document.getElementById('manualStart');
      const endEl=document.getElementById('manualEnd');
      const startDisp=document.getElementById('manualStartDisplay');
      const endDisp=document.getElementById('manualEndDisplay');
      if(startEl && !startEl.value){
        const now=new Date();
        const oneHourAgo=new Date(now.getTime()-60*60*1000);
        const fmt=(d)=>`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
        startEl.value=fmt(oneHourAgo);
        if(startDisp) startDisp.textContent=startEl.value;
        if(endEl){ endEl.value=fmt(now); if(endDisp) endDisp.textContent=endEl.value; }
      }
    }
  }
}

// ---------- Session overlap rules ----------
// Same task overlapping  -> merge into one session.
// Different task         -> the shared time is removed from the older session(s)
//                           (trim/split) and belongs to the newest one.
function sessionsOverlap(a,b){return a.start < b.end && b.start < a.end;}
function trimSessionRange(s,cutA,cutB){
  const out=[];
  if(cutA>s.start){ // surviving head
    out.push({...s,end:cutA,duration:Math.round((cutA-s.start)/1000)});
  }
  if(cutB<s.end){   // surviving tail
    const piece={...s,start:cutB,end:s.end,duration:Math.round((s.end-cutB)/1000)};
    if(cutA>s.start) piece.id=uid(); // a split tail needs its own id
    out.push(piece);
  }
  return out;
}
function recomputeAllTimeSpent(){
  const totals={};
  state.sessions.forEach(s=>{totals[s.taskId]=(totals[s.taskId]||0)+(s.duration||0);});
  state.tasks.forEach(t=>{t.timeSpent=totals[t.id]||0;});
}
function upsertSession(session){
  session.start=Math.min(session.start,session.end);
  session.end=Math.max(session.start,session.end);
  session.duration=Math.round((session.end-session.start)/1000);
  let others=state.sessions.filter(s=>s.id!==session.id);
  let changed=true, guard=0;
  while(changed && guard++<30){
    changed=false; const next=[];
    for(const o of others){
      if(!sessionsOverlap(o,session)){next.push(o);continue;}
      if(o.taskId===session.taskId){
        session.start=Math.min(session.start,o.start);
        session.end=Math.max(session.end,o.end);
        session.duration=Math.round((session.end-session.start)/1000);
        session.manual=!!(session.manual||o.manual);
        changed=true; // union grew - restart to catch further overlaps
      }else{
        const pieces=trimSessionRange(o,session.start,session.end).filter(p=>p.duration>0);
        next.push(...pieces);
        changed=true;
      }
    }
    others=next;
  }
  state.sessions=session.duration>0?[...others,session]:others;
  recomputeAllTimeSpent();
  return session;
}

function addManualSession(){
  const taskId=state.activeTaskId;
  const startTimeStr=document.getElementById('manualStart')?.value; // HH:MM
  const endTimeStr=document.getElementById('manualEnd')?.value;
  const statusEl=document.getElementById('manualStatus');
  if(!taskId){ if(statusEl){statusEl.textContent='لطفا از لیست سمت چپ یک تسک یا فعالیت انتخاب کن'; statusEl.style.color='var(--coral)';} return; }
  if(!startTimeStr || !endTimeStr){ if(statusEl){statusEl.textContent='ساعت شروع و پایان را وارد کن (فقط ساعت و دقیقه)'; statusEl.style.color='var(--coral)';} return; }

  const ref=sessionRefById(taskId);
  if(!ref){ if(statusEl) statusEl.textContent='تسک پیدا نشد'; return; }

  // Parse HH:MM and combine with the owning day
  try{
    const [sh, sm]=startTimeStr.split(':').map(Number);
    const [eh, em]=endTimeStr.split(':').map(Number);
    if(isNaN(sh)||isNaN(sm)||isNaN(eh)||isNaN(em)){ throw new Error('invalid time'); }
    if(sh<0||sh>23||eh<0||eh>23||sm<0||sm>59||em<0||em>59){ throw new Error('time out of range'); }

    // Tasks use their own date; timer-only activities use the viewed day
    const baseDate = ref.kind==='task'
      ? (ref.task.date || getCurrentViewDate() || new Date().toISOString().slice(0,10))
      : (getCurrentViewDate() || new Date().toISOString().slice(0,10));
    const [by,bm,bd]=baseDate.split('-').map(Number);
    const startDate=new Date(by, bm-1, bd, sh, sm, 0, 0);
    let endDate=new Date(by, bm-1, bd, eh, em, 0, 0);
    // If end < start, assume next day (e.g., 23:00 to 01:00)
    if(endDate.getTime()<=startDate.getTime()){
      endDate=new Date(endDate.getTime()+24*60*60*1000);
    }

    const start=startDate.getTime();
    const end=endDate.getTime();
    const duration=Math.floor((end-start)/1000);
    if(duration<=0){ if(statusEl) statusEl.textContent='مدت زمان باید بیشتر از 0 باشد'; return; }
    if(duration>24*3600){ if(statusEl) statusEl.textContent='مدت زمان بیشتر از 24 ساعت مجاز نیست'; return; }

    const session=upsertSession({id:uid(),taskId:taskId,start,end,duration,manual:true,activity:ref.kind==='activity'||undefined});
    save();
    renderSessions();
    drawClock();
    renderTasks();
    renderTimeTasks();
    updateManualTaskSelect();
    if(statusEl){
      const h=Math.floor(session.duration/3600); const m=Math.floor((session.duration%3600)/60);
      const totalForTask=state.sessions.filter(s=>s.taskId===taskId).reduce((a,b)=>a+b.duration,0);
      statusEl.textContent=`ثبت شد: ${h>0?h+' ساعت ':''}${m} دقیقه برای ${ref.title} • مجموع ${Math.round(totalForTask/60)} دقیقه`;
      statusEl.style.color='var(--green)';
      setTimeout(()=>{statusEl.textContent=''; statusEl.style.color='';}, 5000);
    }
  }catch(e){
    if(statusEl){statusEl.textContent='فرمت زمان نامعتبر: '+e.message; statusEl.style.color='var(--coral)';}
  }
}


// Settings + DB status + version
function renderSettingsColors(){
  const cont=document.getElementById('settingsColors'); if(!cont) return; cont.innerHTML='';
  PALETTE.forEach(c=>{const b=document.createElement('div'); b.className='color-opt'+(state.quickColor===c?' active':''); b.style.background=c; b.onclick=()=>{state.quickColor=c;cont.querySelectorAll('.color-opt').forEach(x=>x.classList.remove('active'));b.classList.add('active');}; cont.appendChild(b);});
}
renderSettingsColors();
try{updateManualTaskSelect();}catch(e){}
// Canonical JSON example shown when the occasions JSON box is empty.
// Doubles as the schema template users can hand to an external AI.
const OCCASIONS_JSON_SAMPLE=[
  {title:'عید نوروز',date:'2027-03-21',repeat:'yearly',type:'holiday',color:{row:'holiday',name:'red'}},
  {title:'جلسه مهم پروژه',date:'2026-09-15',repeat:'none',type:'meeting',color:{row:'important',name:'indigo'}},
  {title:'سالگرد تولد',date:'2026-11-04',repeat:'yearly',type:'birthday',color:{row:'normal',name:'pink'}},
  {title:'یادآوری کم‌اهمیت',date:'2026-09-20',repeat:'none',type:'reminder',color:{row:'low',name:'cyan'}}
];
const OCCASIONS_JSON_SAMPLE_TEXT=JSON.stringify(OCCASIONS_JSON_SAMPLE,null,2);
function occasionColorToJSON(hex){ const d=describePaletteHex(hex); return d||hex; }
function loadOccasionsToTextarea(){
  const ta=document.getElementById('occasionsJson');
  if(!ta) return;
  // Empty box (not "[]") so the visible sample/template takes its place.
  ta.value=state.occasions.length?JSON.stringify(state.occasions.map(o=>({
    id:o.id,title:o.title,date:o.date,repeat:o.repeat||'none',
    type:o.type||'custom',color:occasionColorToJSON(o.color)
  })),null,2):'';
  toggleOccasionsSample();
}
function toggleOccasionsSample(){
  const ta=document.getElementById('occasionsJson'); const box=document.getElementById('occasionsJsonSample');
  if(ta&&box) box.style.display=ta.value.trim()===''?'block':'none';
}
(function initOccasionsJsonSample(){
  const pre=document.getElementById('occasionsJsonSamplePre');
  if(pre) pre.textContent=OCCASIONS_JSON_SAMPLE_TEXT;
  const ta=document.getElementById('occasionsJson');
  if(ta) ta.addEventListener('input',toggleOccasionsSample);
  document.getElementById('copyOccasionsSample')?.addEventListener('click',async()=>{
    const btn=document.getElementById('copyOccasionsSample');
    try{
      await navigator.clipboard.writeText(OCCASIONS_JSON_SAMPLE_TEXT);
      if(btn){const old=btn.textContent;btn.textContent='کپی شد ✓';setTimeout(()=>btn.textContent=old,1500);}
    }catch(e){
      if(ta){ta.value=OCCASIONS_JSON_SAMPLE_TEXT;ta.focus();toggleOccasionsSample();}
    }
  });
})();
loadOccasionsToTextarea();
document.getElementById('saveOccasionsJson')?.addEventListener('click',()=>{
  const ta=document.getElementById('occasionsJson'); const status=document.getElementById('occasionsJsonStatus');
  try{
    const arr=JSON.parse(ta.value); if(!Array.isArray(arr)) throw new Error('باید آرایه باشد');
    arr.forEach(o=>{
      if(!o.date||!o.title) throw new Error('برای هر مناسبت date و title لازم است');
      if(!o.id) o.id=uid();
      if(!o.repeat||!['none','yearly'].includes(o.repeat)) o.repeat='none';
      // Color must reference the named palette; palette hex accepted for back-compat.
      o.color=o.color?resolvePaletteColor(o.color,{allowHoliday:true}):OCCASION_HUES[0];
    });
    state.occasions=arr; save();
    loadOccasionsToTextarea();
    if(status){status.textContent='✅ ذخیره شد — '+arr.length+' مناسبت';status.style.color='var(--green)';}
    renderCalendar(); renderAllEvents(); if(state.calSelected) renderDayEvents(state.calSelected);
  }catch(e){const s=document.getElementById('occasionsJsonStatus'); if(s){s.textContent='❌ '+e.message;s.style.color='var(--coral)';}}
});
document.getElementById('loadOccasionsJson')?.addEventListener('click',()=>{loadOccasionsToTextarea(); const s=document.getElementById('occasionsJsonStatus'); if(s){s.textContent='بارگذاری شد';s.style.color='var(--fog)';}});
const overdueInput=document.getElementById('overdueHour');
if(overdueInput) overdueInput.value=state.settings.overdueHour;
document.getElementById('saveOverdueHour')?.addEventListener('click',()=>{
  const v=parseInt(document.getElementById('overdueHour').value);
  if(isNaN(v) || v<0 || v>23){alert('۰ تا ۲۳'); return;}
  state.settings.overdueHour=v; save();
  const st=document.getElementById('overdueStatus'); if(st) st.textContent='✅ ذخیره شد - ساعت '+v+':00';
  checkOverdue();
});
function checkOverdue(){
  const now=new Date(); const currentHour=now.getHours(); const realToday=state.realToday; const overdueHour=state.settings.overdueHour;
  let changed=false;
  state.tasks.forEach(t=>{
    if(t.isHabit) return; // habit occurrences are driven by logs (syncOccurrenceStatus)
    if(t.status==='done' || t.status==='postponed' || t.status==='not_done') return;
    if(!t.date) return;
    if(t.date < realToday){
      const yesterday=new Date(); yesterday.setDate(yesterday.getDate()-1);
      const yStr=formatGregorian(yesterday.getFullYear(),yesterday.getMonth()+1,yesterday.getDate());
      if(t.date===yStr){if(currentHour>=overdueHour){t.status='not_done'; t.completed=false; changed=true;}}
      else if(t.date < yStr){t.status='not_done'; t.completed=false; changed=true;}
    }
  });
  if(changed){save(); renderTasks(); renderTimeTasks();}
}
checkOverdue(); setInterval(checkOverdue,60000);
function updateVersionDisplay(){
  let ver=VERSION;
  try{if(typeof chrome!=='undefined' && chrome.runtime && chrome.runtime.getManifest){ver=chrome.runtime.getManifest().version;}}catch(e){}
  const el=document.getElementById('versionDisplay'); if(el) el.textContent='v'+ver;
  const el2=document.getElementById('versionInline'); if(el2) el2.textContent=ver;
}
updateVersionDisplay();
function openPostponeModal(taskId){
  state.postponeTaskId=taskId;
  const task=state.tasks.find(t=>t.id===taskId);
  const modal=document.getElementById('postponeModal');
  const orig=document.getElementById('postponeOriginal');
  const dateInput=document.getElementById('postponeDate');
  if(orig) orig.textContent='تسک: '+task.title+' • تاریخ فعلی: '+task.date;
  const tomorrow=new Date(); tomorrow.setDate(tomorrow.getDate()+1);
  if(dateInput) dateInput.value=formatGregorian(tomorrow.getFullYear(),tomorrow.getMonth()+1,tomorrow.getDate());
  if(modal) modal.classList.add('show');
}
function closePostponeModal(){
  const modal=document.getElementById('postponeModal'); if(modal) modal.classList.remove('show'); state.postponeTaskId=null;
}
document.getElementById('postponeCancel')?.addEventListener('click',closePostponeModal);
document.getElementById('postponeModal')?.addEventListener('click',(e)=>{if(e.target.id==='postponeModal') closePostponeModal();});

// Context menu for calendar notes - with read option
let ctxDate=null;
function openContextMenu(x,y,dateStr){
  ctxDate=dateStr;
  const menu=document.getElementById('contextMenu');
  const readBtn=document.getElementById('ctxReadNoteBtn');
  if(!menu) return;
  // Show/hide read button based on existence of note
  const hasNote=state.notes.some(n=>n.date===dateStr);
  if(readBtn) readBtn.style.display=hasNote?'flex':'none';
  menu.style.left=x+'px';
  menu.style.top=y+'px';
  menu.classList.add('show');
}
function closeContextMenu(){
  const menu=document.getElementById('contextMenu');
  if(menu) menu.classList.remove('show');
  ctxDate=null;
}
document.addEventListener('click',(e)=>{
  if(!e.target.closest('#contextMenu')){
    closeContextMenu();
  }
});
document.getElementById('ctxNoteBtn')?.addEventListener('click',()=>{
  if(!ctxDate) return;
  openNoteModal(ctxDate);
  closeContextMenu();
});
document.getElementById('ctxReadNoteBtn')?.addEventListener('click',()=>{
  if(!ctxDate) return;
  openNoteModal(ctxDate);
  closeContextMenu();
});

// Note modal
function openNoteModal(dateStr){
  const modal=document.getElementById('noteModal');
  const label=document.getElementById('noteDateLabel');
  const textarea=document.getElementById('noteText');
  const existing=state.notes.find(n=>n.date===dateStr);
  if(label) label.textContent=dateStr;
  if(textarea) textarea.value=existing?existing.text:'';
  if(modal){
    modal.dataset.date=dateStr;
    modal.classList.add('show');
  }
}
function closeNoteModal(){
  const modal=document.getElementById('noteModal');
  if(modal) modal.classList.remove('show');
}
document.getElementById('noteCancel')?.addEventListener('click',closeNoteModal);
document.getElementById('noteModal')?.addEventListener('click',(e)=>{if(e.target.id==='noteModal') closeNoteModal();});
document.getElementById('noteSave')?.addEventListener('click',()=>{
  const modal=document.getElementById('noteModal');
  const textarea=document.getElementById('noteText');
  if(!modal || !textarea) return;
  const dateStr=modal.dataset.date;
  const text=textarea.value.trim();
  if(!text){
    // delete note if empty
    state.notes=state.notes.filter(n=>n.date!==dateStr);
  }else{
    const existing=state.notes.find(n=>n.date===dateStr);
    if(existing){existing.text=text; existing.updatedAt=Date.now();}
    else{state.notes.push({id:uid(),date:dateStr,text,createdAt:Date.now()});}
  }
  save();
  closeNoteModal();
  renderCalendar();
  if(state.calSelected) renderDayEvents(state.calSelected);
  renderAllEvents();
});

document.getElementById('postponeConfirm')?.addEventListener('click',()=>{
  const taskId=state.postponeTaskId; const dateInput=document.getElementById('postponeDate');
  if(!taskId || !dateInput || !dateInput.value){alert('تاریخ انتخاب کن'); return;}
  const targetDate=dateInput.value;
  const origTask=state.tasks.find(t=>t.id===taskId); if(!origTask) return;
  const newTask={id:uid(),title:origTask.title,status:'todo',completed:false,color:origTask.color,createdAt:Date.now(),folderId:origTask.folderId,timeSpent:0,date:targetDate,postponedFrom:origTask.date,isPostponedInstance:true,originalTaskId:origTask.id,lines:origTask.lines||1};
  if(isMultiStep(origTask)){newTask.steps=origTask.steps.map(s=>({...s}));newTask.step=origTask.step;}
  state.tasks.push(newTask);
  origTask.status='postponed'; origTask.postponedTo=targetDate; origTask.completed=false;
  if(isMultiStep(origTask))syncMultiStep(origTask);
  save(); closePostponeModal(); renderTasks(); renderCalendar(); renderTimeTasks();
});
document.getElementById('exportBtn')?.addEventListener('click',()=>{
  const data={tasks:state.tasks,folders:state.folders,sessions:state.sessions,occasions:state.occasions,notes:state.notes,plans:state.plans,alarms:state.alarms,habits:state.habits,habitLogs:state.habitLogs,vibeEntries:state.vibeEntries,aboutMe:state.aboutMe,dayReviews:state.dayReviews,settings:state.settings,version:VERSION};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='outtask-export-v'+VERSION+'.json'; a.click(); URL.revokeObjectURL(url);
});
document.getElementById('importBtn')?.addEventListener('click',()=>document.getElementById('importFile').click());
document.getElementById('importFile')?.addEventListener('change',e=>{
  const file=e.target.files[0]; if(!file) return; const r=new FileReader();
  r.onload=ev=>{try{const data=JSON.parse(ev.target.result); if(data.tasks) state.tasks=data.tasks; if(data.folders) state.folders=data.folders; if(data.sessions) state.sessions=data.sessions; if(data.occasions) state.occasions=data.occasions; if(data.notes) state.notes=data.notes; if(data.plans) state.plans=data.plans; if(data.alarms) state.alarms=data.alarms; if(data.habits) state.habits=data.habits; if(data.habitLogs) state.habitLogs=data.habitLogs; if(data.vibeEntries) state.vibeEntries=data.vibeEntries; if(data.aboutMe) state.aboutMe=data.aboutMe; if(Array.isArray(data.dayReviews)) state.dayReviews=data.dayReviews; if(data.settings) state.settings=data.settings; save(); location.reload();}catch(err){alert(err.message)}};
  r.readAsText(file);
});
document.getElementById('clearBtn')?.addEventListener('click',()=>{if(!confirm('پاک شود؟')) return; localStorage.clear(); if(typeof chrome!=='undefined' && chrome.storage) chrome.storage.local.clear(); indexedDB.deleteDatabase(IDB_NAME); location.reload();});

function initApp(){
  ensureSleepHabit();
  syncHabitOccurrences(); syncAllOccurrenceStatus();
  updateTopDate(); renderTasks(); renderCalendar(); renderAllEvents(); renderTimeTasks(); renderHabits(); drawClock(); renderSessions();
  renderPlansList(true); renderAlarmsList(); populateAlarmTaskSelect(); renderDayLabels();
  renderAIChat(); initAISettingsUI(); renderAIPermissions(); initAlarmSoundUI();
  initDashboard(); initDayEndHourSettings(); renderDashboard();
  syncAlarmsToBackground(); checkAlarms();
  // Automatic daily review at the user's end-of-day hour (runs once; catch-up on first open after)
  setTimeout(checkDailyReview,2500);
  setInterval(checkDailyReview,5*60*1000);
  loadOccasionsToTextarea();
  updateVersionDisplay();
  const ov=document.getElementById('overdueHour'); if(ov) ov.value=state.settings.overdueHour;
  const dbStatus=document.getElementById('dbStatus');
  if(dbStatus) dbStatus.textContent='همه‌ی داده‌ها روی همین مرورگر و به‌صورت محلی ذخیره می‌شوند.';
}

loadInitial();
// Always tick: clock, plan hatches resolving, alarms, day labels
setInterval(()=>{
  drawClock();
  if(typeof renderPlansList==='function') renderPlansList();
  checkAlarms();
  renderDayLabels();
},1000);
checkAlarms();

// --- Custom Pickers (Outtask Theme) ---
const CUSTOM_PALETTE = ['#e4f222','#02b8cc','#6366f1','#8b5cf6','#eb5757','#27a644','#f59e0b','#ec4899','#06b6d4','#10b981','#f97316','#a855f7'];

function initCustomColorPicker(triggerId, popupId, displayId, inputId, defaultColor, variant){
  const trigger=document.getElementById(triggerId);
  const popup=document.getElementById(popupId);
  const display=document.getElementById(displayId);
  const input=document.getElementById(inputId);
  if(!trigger || !popup || !input) return;

  function pick(c,rerender){
    input.value=c;
    if(display) display.style.background=c;
    if(rerender) renderColors(c);
    closePicker();
    input.dispatchEvent(new Event('change'));
  }
  function makeSwatch(c,selected,cls,title){
    const item=document.createElement('div');
    item.className=(cls||'color-grid-item')+(c===selected?' active':'');
    item.style.background=c;
    if(title) item.title=title;
    item.addEventListener('click',()=>pick(c,true));
    return item;
  }
  // Occasion variant: 3 saturation rows + special official-holiday red
  function renderOccasionColors(selected){
    popup.innerHTML='';
    const wrap=document.createElement('div'); wrap.className='color-rows';
    const captions=['مناسبت مهم (important)','معمولی (normal)','کم‌اهمیت (low)'];
    OCCASION_ROWS.forEach((row,ri)=>{
      const cap=document.createElement('div'); cap.className='color-row-caption'; cap.textContent=captions[ri];
      wrap.appendChild(cap);
      const rEl=document.createElement('div'); rEl.className='color-row';
      row.forEach((c,ni)=>rEl.appendChild(makeSwatch(c,selected,null,PALETTE_COLOR_FA[PALETTE_COLOR_NAMES[ni]]+' • '+PALETTE_COLOR_NAMES[ni])));
      wrap.appendChild(rEl);
    });
    const h=document.createElement('div'); h.className='color-holiday';
    const sw=document.createElement('div');
    sw.className='holiday-swatch'+(selected===HOLIDAY_COLOR?' active':'');
    sw.style.background=HOLIDAY_COLOR; sw.title='تعطیل رسمی • holiday / red';
    sw.addEventListener('click',()=>pick(HOLIDAY_COLOR,true));
    const lab=document.createElement('span'); lab.className='holiday-label'; lab.textContent='تعطیل رسمی';
    h.appendChild(sw); h.appendChild(lab);
    wrap.appendChild(h);
    popup.appendChild(wrap);
  }
  function renderColors(selected){
    popup.innerHTML='';
    if(variant==='occasion'){ renderOccasionColors(selected); return; }
    const grid=document.createElement('div');
    grid.className='color-grid';
    CUSTOM_PALETTE.forEach(c=>grid.appendChild(makeSwatch(c,selected)));
    popup.appendChild(grid);
  }

  function openPicker(){
    renderColors(input.value||defaultColor);
    popup.classList.add('show');
    trigger.classList.add('active');
  }
  function closePicker(){
    popup.classList.remove('show');
    trigger.classList.remove('active');
  }

  trigger.addEventListener('click',(e)=>{
    e.stopPropagation();
    if(popup.classList.contains('show')) closePicker();
    else {
      // Close other pickers
      document.querySelectorAll('.custom-picker-popup.show').forEach(p=>p.classList.remove('show'));
      document.querySelectorAll('.custom-picker-trigger.active').forEach(t=>t.classList.remove('active'));
      openPicker();
    }
  });

  // Set initial
  if(display) display.style.background=input.value||defaultColor;
}

function initCustomDatePicker(triggerId, popupId, displayId, inputId){
  const trigger=document.getElementById(triggerId);
  const popup=document.getElementById(popupId);
  const display=document.getElementById(displayId);
  const input=document.getElementById(inputId);
  if(!trigger || !popup || !input) return;

  let currentYear=new Date().getFullYear();
  let currentMonth=new Date().getMonth()+1;
  let selectedDate=input.value||'';

  function formatDisplay(dateStr){
    if(!dateStr) return 'انتخاب تاریخ';
    try{
      const d=new Date(dateStr);
      return d.toLocaleDateString('fa-IR');
    }catch{return dateStr;}
  }

  function renderCalendar(){
    popup.innerHTML='';
    const header=document.createElement('div');
    header.className='date-picker-header';
    header.innerHTML=`
      <button class="date-picker-nav" data-nav="prev">‹</button>
      <div class="date-picker-title">${currentYear} / ${String(currentMonth).padStart(2,'0')}</div>
      <button class="date-picker-nav" data-nav="next">›</button>
    `;
    popup.appendChild(header);

    const weekdays=document.createElement('div');
    weekdays.className='date-picker-weekdays';
    ['ش','ی','د','س','چ','پ','ج'].forEach(w=>{
      const el=document.createElement('div'); el.className='date-picker-weekday'; el.textContent=w; weekdays.appendChild(el);
    });
    popup.appendChild(weekdays);

    const daysGrid=document.createElement('div');
    daysGrid.className='date-picker-days';

    const firstDay=new Date(currentYear, currentMonth-1, 1).getDay();
    const daysInMonth=new Date(currentYear, currentMonth, 0).getDate();
    const today=new Date();
    const todayStr=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

    // Empty cells for first day (Saturday is 6 in JS? Adjust for Persian week starting Saturday)
    // JS getDay: 0=Sun, 6=Sat. Persian week starts Sat, so we need to shift
    let offset=(firstDay+1)%7; // Sat=0
    for(let i=0;i<offset;i++){
      const empty=document.createElement('div'); empty.className='date-picker-day other'; daysGrid.appendChild(empty);
    }

    for(let d=1;d<=daysInMonth;d++){
      const dateStr=`${currentYear}-${String(currentMonth).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const dayEl=document.createElement('div');
      dayEl.className='date-picker-day';
      if(dateStr===todayStr) dayEl.classList.add('today');
      if(dateStr===selectedDate) dayEl.classList.add('selected');
      dayEl.textContent=d;
      dayEl.addEventListener('click',()=>{
        selectedDate=dateStr;
        input.value=dateStr;
        if(display) display.textContent=formatDisplay(dateStr);
        closePicker();
        input.dispatchEvent(new Event('change'));
        renderCalendar();
      });
      daysGrid.appendChild(dayEl);
    }

    popup.appendChild(daysGrid);

    // Nav handlers
    popup.querySelectorAll('[data-nav]').forEach(btn=>{
      btn.addEventListener('click',(e)=>{
        e.stopPropagation();
        if(btn.dataset.nav==='prev'){
          currentMonth--; if(currentMonth<1){currentMonth=12; currentYear--;}
        }else{
          currentMonth++; if(currentMonth>12){currentMonth=1; currentYear++;}
        }
        renderCalendar();
      });
    });
  }

  function openPicker(){
    if(selectedDate){
      try{
        const p=selectedDate.split('-');
        currentYear=parseInt(p[0]); currentMonth=parseInt(p[1]);
      }catch{}
    }
    renderCalendar();
    popup.classList.add('show');
    trigger.classList.add('active');
  }
  function closePicker(){
    popup.classList.remove('show');
    trigger.classList.remove('active');
  }

  trigger.addEventListener('click',(e)=>{
    e.stopPropagation();
    if(popup.classList.contains('show')) closePicker();
    else{
      document.querySelectorAll('.custom-picker-popup.show').forEach(p=>p.classList.remove('show'));
      document.querySelectorAll('.custom-picker-trigger.active').forEach(t=>t.classList.remove('active'));
      openPicker();
    }
  });

  // Init display
  if(display) display.textContent=formatDisplay(selectedDate);
}

function initCustomTimePicker(triggerId, popupId, displayId, inputId){
  const trigger=document.getElementById(triggerId);
  const popup=document.getElementById(popupId);
  const display=document.getElementById(displayId);
  const input=document.getElementById(inputId);
  if(!trigger || !popup || !input) return;

  let selectedHour=9;
  let selectedMinute=0;

  // Parse existing value
  if(input.value){
    const parts=input.value.split(':');
    if(parts.length>=2){
      selectedHour=parseInt(parts[0])||0;
      selectedMinute=parseInt(parts[1])||0;
    }
  }

  function formatDisplay(h,m){
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  }

  function renderTime(){
    popup.innerHTML='';
    const container=document.createElement('div');
    container.className='time-picker';

    const hourCol=document.createElement('div');
    hourCol.className='time-picker-col';
    hourCol.innerHTML='<div class="time-picker-label">ساعت</div>';
    const hourWheel=document.createElement('div');
    hourWheel.className='time-picker-wheel';
    for(let h=0;h<24;h++){
      const item=document.createElement('div');
      item.className='time-picker-item'+(h===selectedHour?' active':'');
      item.textContent=String(h).padStart(2,'0');
      item.addEventListener('click',()=>{
        selectedHour=h;
        input.value=formatDisplay(selectedHour, selectedMinute);
        if(display) display.textContent=input.value;
        renderTime();
        input.dispatchEvent(new Event('change'));
      });
      hourWheel.appendChild(item);
    }
    hourCol.appendChild(hourWheel);

    const sep=document.createElement('div');
    sep.className='time-picker-sep';
    sep.textContent=':';

    const minCol=document.createElement('div');
    minCol.className='time-picker-col';
    minCol.innerHTML='<div class="time-picker-label">دقیقه</div>';
    const minWheel=document.createElement('div');
    minWheel.className='time-picker-wheel';
    for(let m=0;m<60;m+=5){
      const item=document.createElement('div');
      item.className='time-picker-item'+(m===selectedMinute?' active':'');
      item.textContent=String(m).padStart(2,'0');
      item.addEventListener('click',()=>{
        selectedMinute=m;
        input.value=formatDisplay(selectedHour, selectedMinute);
        if(display) display.textContent=input.value;
        renderTime();
        input.dispatchEvent(new Event('change'));
      });
      minWheel.appendChild(item);
    }
    // Also add all minutes 0-59 for precise? We show 5-step but allow custom via input? Keep 5-step for simplicity, but add 0-59 scroll if needed
    // For full 0-59, uncomment below, but 5-step is cleaner
    minCol.appendChild(minWheel);

    container.appendChild(hourCol);
    container.appendChild(sep);
    container.appendChild(minCol);

    // Quick actions
    const actions=document.createElement('div');
    actions.style.cssText='display:flex;gap:8px;margin-top:12px;justify-content:center';
    actions.innerHTML=`
      <button class="btn-ghost" style="padding:6px 12px;font-size:11px" data-action="now">الان</button>
      <button class="btn-primary" style="padding:6px 12px;font-size:11px" data-action="done">تایید</button>
    `;
    
    popup.appendChild(container);
    popup.appendChild(actions);

    actions.querySelector('[data-action="now"]')?.addEventListener('click',(e)=>{
      e.stopPropagation();
      const now=new Date();
      selectedHour=now.getHours();
      selectedMinute=now.getMinutes();
      input.value=formatDisplay(selectedHour, selectedMinute);
      if(display) display.textContent=input.value;
      renderTime();
    });
    actions.querySelector('[data-action="done"]')?.addEventListener('click',(e)=>{
      e.stopPropagation();
      closePicker();
    });

    // Scroll active into view
    setTimeout(()=>{
      const activeHour=hourWheel.querySelector('.active');
      const activeMin=minWheel.querySelector('.active');
      if(activeHour) activeHour.scrollIntoView({block:'center'});
      if(activeMin) activeMin.scrollIntoView({block:'center'});
    }, 50);
  }

  function openPicker(){
    renderTime();
    popup.classList.add('show');
    trigger.classList.add('active');
  }
  function closePicker(){
    popup.classList.remove('show');
    trigger.classList.remove('active');
  }

  trigger.addEventListener('click',(e)=>{
    e.stopPropagation();
    if(popup.classList.contains('show')) closePicker();
    else{
      document.querySelectorAll('.custom-picker-popup.show').forEach(p=>p.classList.remove('show'));
      document.querySelectorAll('.custom-picker-trigger.active').forEach(t=>t.classList.remove('active'));
      openPicker();
    }
  });

  if(display) display.textContent=input.value||'--:--';
}

// Global close on outside click
document.addEventListener('click',(e)=>{
  if(!e.target.closest('.custom-picker')){
    document.querySelectorAll('.custom-picker-popup.show').forEach(p=>p.classList.remove('show'));
    document.querySelectorAll('.custom-picker-trigger.active').forEach(t=>t.classList.remove('active'));
  }
});

// --- Eye Care 20min ---
// --- Custom Pickers (Outtask Theme) ---
// --- Eye Care 20min ---
const eyeBtn=document.getElementById('eyeCareToggleBtn');
const eyeLabel=document.getElementById('eyeCareLabel');
const eyeTestBtn=document.getElementById('eyeCareTestBtn');

function updateEyeCareUI(enabled){
  if(!eyeBtn || !eyeLabel) return;
  if(enabled){
    eyeLabel.textContent='چشم: روشن (20د)';
    eyeBtn.style.background='rgba(2,184,204,0.15)';
    eyeBtn.style.borderColor='var(--teal)';
    eyeBtn.style.color='var(--teal)';
  }else{
    eyeLabel.textContent='چشم: خاموش';
    eyeBtn.style.background='transparent';
    eyeBtn.style.borderColor='rgba(2,184,204,0.3)';
    eyeBtn.style.color='var(--teal)';
  }
}

async function checkEyeCareStatus(){
  try{
    if(typeof chrome!=='undefined' && chrome.runtime && chrome.runtime.sendMessage){
      chrome.runtime.sendMessage({type:'EYE_CARE_STATUS'}, (res)=>{
        if(chrome.runtime.lastError){return;}
        if(res && typeof res.enabled!=='undefined'){
          updateEyeCareUI(res.enabled);
        }
      });
    }else{
      // Fallback to storage
      const val=localStorage.getItem('outtask_eye_care_enabled')==='true';
      updateEyeCareUI(val);
    }
  }catch(e){}
}

if(eyeBtn){
  eyeBtn.addEventListener('click',()=>{
    const isEnabled = eyeLabel && eyeLabel.textContent.includes('روشن');
    const newEnabled = !isEnabled;
    try{
      if(typeof chrome!=='undefined' && chrome.runtime && chrome.runtime.sendMessage){
        const msgType = newEnabled ? 'EYE_CARE_START' : 'EYE_CARE_STOP';
        chrome.runtime.sendMessage({type:msgType}, (res)=>{
          if(chrome.runtime.lastError){
            // fallback
            localStorage.setItem('outtask_eye_care_enabled', newEnabled?'true':'false');
            updateEyeCareUI(newEnabled);
            return;
          }
          updateEyeCareUI(newEnabled);
        });
      }else{
        localStorage.setItem('outtask_eye_care_enabled', newEnabled?'true':'false');
        updateEyeCareUI(newEnabled);
      }
    }catch(e){
      localStorage.setItem('outtask_eye_care_enabled', newEnabled?'true':'false');
      updateEyeCareUI(newEnabled);
    }
  });
}

if(eyeTestBtn){
  eyeTestBtn.addEventListener('click',()=>{
    try{
      if(typeof chrome!=='undefined' && chrome.runtime && chrome.runtime.sendMessage){
        chrome.runtime.sendMessage({type:'TEST_EYE_BREAK'}, ()=>{});
      }else{
        // Fallback: show popup directly in this page if content script not available
        const ev=new CustomEvent('outtask-test-eye');
        window.dispatchEvent(ev);
        // Directly trigger content script function if injected
        if(window.__outtaskEyeCareInjected){
          // Try to manually show via injecting overlay here
          const overlay=document.createElement('div');
          overlay.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(8,9,10,0.85);display:grid;place-items:center;color:white;font-family:system-ui;padding:20px;text-align:center';
          overlay.innerHTML='<div><div style="font-size:48px">👁️</div><div style="font-size:20px;margin:12px 0">هشدار خستگی چشم - تست</div><div style="font-size:48px" id="eyeTestCount">20</div><button onclick="this.closest(\'div\').parentElement.remove()" style="margin-top:16px;padding:8px 16px">بستن</button></div>';
          document.body.appendChild(overlay);
          let c=20;
          const iv=setInterval(()=>{c--; const el=document.getElementById('eyeTestCount'); if(el) el.textContent=c; if(c<=0){clearInterval(iv); overlay.remove();}},1000);
        }
      }
    }catch(e){}
  });
}

// Manual time entry
document.getElementById('manualAddBtn')?.addEventListener('click', addManualSession);
document.getElementById('manualTaskSelect')?.addEventListener('change', ()=>{
  // Auto fill start/end with now-1h to now as suggestion if empty
  const startEl=document.getElementById('manualStart');
  const endEl=document.getElementById('manualEnd');
  if(startEl && !startEl.value){
    const now=new Date();
    const oneHourAgo=new Date(now.getTime()-60*60*1000);
    // Format for datetime-local: YYYY-MM-DDTHH:MM
    const fmt=(d)=>{const pad=(n)=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;};
    startEl.value=fmt(oneHourAgo);
    if(endEl) endEl.value=fmt(now);
  }
});

// Init custom pickers
try{
  setAlarmFormDefaults();
  initCustomColorPicker('evColorTrigger','evColorPopup','evColorDisplay','evColor','#e4f222','occasion');
  initCustomDatePicker('evDateTrigger','evDatePopup','evDateDisplay','evDate');
  initCustomDatePicker('postponeDateTrigger','postponeDatePopup','postponeDateDisplay','postponeDate');
  initCustomDatePicker('alarmDateTrigger','alarmDatePopup','alarmDateDisplay','alarmDate');
  initCustomTimePicker('manualStartTrigger','manualStartPopup','manualStartDisplay','manualStart');
  initCustomTimePicker('manualEndTrigger','manualEndPopup','manualEndDisplay','manualEnd');
  initCustomTimePicker('alarmTimeTrigger','alarmTimePopup','alarmTimeDisplay','alarmTime');
}catch(e){console.log('picker init error', e);}

// ============================================================
// ===== AI PLANS, REPEATING ALARMS & GEMINI CHAT (v1.7) =====
// ============================================================
const faWeekdays=['یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه','شنبه']; // index = JS getDay
// Saturday-first display order: ش گ‍? getDay 6,0,1,2,3,4,5
const WEEKDAY_CHIP_ORDER=[6,0,1,2,3,4,5];
const WEEKDAY_SHORT=['ی','د','س','چ','پ','ج','ش']; // index getDay: 0=ی ... 6=ش
function hmToMin(hhmm){const p=(hhmm||'').split(':');const h=parseInt(p[0]),m=parseInt(p[1]);if(isNaN(h)||isNaN(m))return null;return h*60+m;}
function minToHM(min){return String(Math.floor(min/60)).padStart(2,'0')+':'+String(min%60).padStart(2,'0');}
function combineDateMin(dateStr,min){const [y,m,d]=dateStr.split('-').map(Number);return new Date(y,m-1,d,Math.floor(min/60),min%60,0,0).getTime();}
function validDateStr(s){return /^\d{4}-\d{2}-\d{2}$/.test(s||'') && !!parseGregorian(s);}
function validHM(s){return /^([01]\d|2[0-3]):[0-5]\d$/.test(s||'');}
function rerenderAfterAI(){
  save(); renderTasks(); renderCalendar(); renderAllEvents();
  try{if(state.calSelected)renderDayEvents(state.calSelected);}catch(e){}
  renderTimeTasks(); renderSessions(); drawClock(); renderPlansList(true); renderAlarmsList();
  populateAlarmTaskSelect(); renderDayLabels();
  try{renderHabits();}catch(e){}
}

// ---------- Plans list (follows the viewed day) ----------
let plansListLastRender=0;
function planAlignedMinutes(plan,now){
  const midnight=new Date(plan.date+'T00:00:00').getTime();
  const nowMs=now||Date.now();
  const {alignRanges}=classifyPlan(plan);
  let aligned=0;
  alignRanges.forEach(([s,e])=>{aligned+=Math.max(0,e-s);});
  const total=plan.endMin-plan.startMin;
  const startMs=midnight+plan.startMin*60000, endMs=midnight+plan.endMin*60000;
  let phase='future';
  if(nowMs>=endMs) phase='past'; else if(nowMs>=startMs) phase='active';
  return {aligned:Math.round(aligned),total,phase};
}
function renderPlansList(force){
  const cont=document.getElementById('plansList'); if(!cont) return;
  if(!force && Date.now()-plansListLastRender<10000) return;
  plansListLastRender=Date.now();
  cont.innerHTML='';
  const viewStr=getCurrentViewDate();
  // Only the currently viewed day, exactly like the rest of the timer tab
  const list=plansForDate(viewStr)
    .sort((a,b)=>a.startMin-b.startMin);
  if(list.length===0){cont.innerHTML='<div class="muted" style="font-size:11.5px;padding:6px 2px">برنامه‌ای برای این روز نیست</div>';return;}
  list.forEach(p=>{
    const info=planAlignedMinutes(p);
    const hb=p.stub?state.habits.find(x=>x.id===p.habitId):null;
    const stubDone=hb&&habitDone(hb,p.date);
    const pct=p.stub?(stubDone?100:0):(info.total?Math.min(100,Math.round(info.aligned/info.total*100)):0);
    let status;
    if(p.stub){
      if(stubDone)status='✅ انجام شد';
      else if(p.date<getRealTodayStr())status='انجام نشد';
      else status='بازه‌ی عادت '+minToHM(p.startMin)+'–'+minToHM(p.endMin);
    }
    else if(info.phase==='future') status='شروع '+minToHM(p.startMin);
    else if(info.phase==='active') status='در حال اجرا • '+info.aligned+' دقیقه مطابق';
    else status=info.aligned>=info.total?'✅ مطابق برنامه':(info.aligned>0?info.aligned+'/'+info.total+' دقیقه مطابق':'انجام نشد');
    const el=document.createElement('div'); el.className='plan-item';
    const dot=p.stub
      ?`<span style="width:11px;height:11px;border-radius:50%;background:${p.color};display:inline-grid;place-items:center;align-self:center;color:var(--void);flex-shrink:0">${habitIconSvg(p.habitIcon,8)}</span>`
      :`<div class="task-dot" style="background:${p.color};align-self:center"></div>`;
    el.innerHTML=`${dot}
      <div style="flex:1;min-width:0">
        <div style="font-size:12.5px;color:var(--paper);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.title}${p.stub?' <span style="font-size:9.5px;color:var(--fog);border:0.5px solid var(--graphite);border-radius:99px;padding:0 6px;margin-right:5px">'+(p.normal?'روتین':'عادت')+'</span>':''}</div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:5px">
          <div class="plan-track"><div class="plan-fill" style="width:${pct}%;background:${p.color}"></div></div>
          <div class="plan-time" style="min-width:0">${minToHM(p.startMin)}–${minToHM(p.endMin)}</div>
        </div>
        <div class="plan-status" style="margin-top:3px">${status}</div>
      </div>
      ${p.stub?'':`<button class="btn-ghost" data-del-plan="${p.id}" style="padding:4px 8px;align-self:flex-start">✕</button>`}`;
    cont.appendChild(el);
  });
  cont.querySelectorAll('[data-del-plan]').forEach(b=>b.addEventListener('click',()=>{
    state.plans=state.plans.filter(p=>p.id!==b.getAttribute('data-del-plan'));
    save(); renderPlansList(true); drawClock();
  }));
}

// ---------- Repeating alarms ----------
function migrateAlarm(a){
  if(!a.id) a.id=uid();
  if(a.enabled==null) a.enabled=true;
  if(a.fired==null) a.fired=false;
  if(!a.repeat || !['none','daily','weekdays','weekly','custom'].includes(a.repeat)) a.repeat='none';
  if(a.repeat==='custom' && !Array.isArray(a.repeatDays)) a.repeatDays=[];
  return a;
}
// Next fire time for a (possibly repeating) alarm strictly after fromMs
function nextAlarmTime(alarm,fromMs){
  const base=new Date(alarm.time);
  const h=base.getHours(),m=base.getMinutes();
  const at=d=>{d.setHours(h,m,0,0);return d.getTime();};
  const repeat=alarm.repeat||'none';
  if(repeat==='none') return 0;
  if(repeat==='daily'){
    let d=new Date(fromMs); let t=at(d);
    if(t<=fromMs){d=new Date(fromMs+86400000);t=at(d);}
    return t;
  }
  let allowedDays=null;
  if(repeat==='weekly') allowedDays=[base.getDay()];
  else if(repeat==='weekdays') allowedDays=[6,0,1,2,3,4]; // every day except Friday(5)
  else if(repeat==='custom') allowedDays=alarm.repeatDays||[];
  if(!allowedDays || !allowedDays.length) return 0;
  for(let i=0;i<9;i++){
    const d0=new Date(fromMs+i*86400000);
    if(allowedDays.includes(d0.getDay())){const t=at(new Date(d0));if(t>fromMs)return t;}
  }
  return 0;
}
function repeatLabel(a){
  switch(a.repeat){
    case 'daily': return 'هر روز';
    case 'weekdays': return 'روزهای کاری';
    case 'weekly': return 'هفتگی ('+faWeekdays[new Date(a.time).getDay()]+')';
    case 'custom':{
      const days=(a.repeatDays||[]).slice().sort((x,y)=>WEEKDAY_CHIP_ORDER.indexOf(x)-WEEKDAY_CHIP_ORDER.indexOf(y));
      if(days.length===7) return 'هر روز';
      return days.map(d=>faWeekdays[d]).join('، ');
    }
    default: return '';
  }
}
function buildAlarmObject({title,taskId,dateStr,hhmm,repeat,repeatDays}){
  const min=hmToMin(hhmm);
  let time=combineDateMin(dateStr,min);
  if(repeat!=='none' && time<=Date.now()){
    const nx=nextAlarmTime({time,repeat,repeatDays},Date.now()+1000);
    if(nx) time=nx;
  }
  const task=taskId?state.tasks.find(t=>t.id===taskId):null;
  return migrateAlarm({
    id:uid(), title:(title||(task?task.title:'آلارم')).slice(0,200),
    taskId:task?task.id:null, taskTitle:task?task.title:'',
    time, enabled:true, fired:false,
    repeat:repeat||'none', repeatDays:repeatDays||[]
  });
}

let ringingAlarmId=null, alarmAudioEl=null;
function playAlarmAudio(){
  try{
    if(alarmAudioEl){try{alarmAudioEl.pause();}catch(e){}}
    alarmAudioEl=new Audio(state.settings.alarmSound||'sounds/notify.mp3');
    alarmAudioEl.loop=true; alarmAudioEl.volume=0.9;
    alarmAudioEl.play().catch(()=>{});
  }catch(e){}
}
function stopAlarmAudio(){
  try{if(alarmAudioEl){alarmAudioEl.pause();alarmAudioEl=null;}}catch(e){}
  try{if(typeof chrome!=='undefined'&&chrome.runtime&&chrome.runtime.sendMessage)chrome.runtime.sendMessage({type:'ALARM_STOP_SOUND'},()=>{void chrome.runtime.lastError;});}catch(e){}
}
function advanceOrMarkFired(a,now){
  if(a.repeat && a.repeat!=='none'){
    const nx=nextAlarmTime(a,(now||Date.now())+1000);
    if(nx){a.time=nx;a.fired=false;a.firedAt=null;}
    else {a.fired=true;a.firedAt=now||Date.now();}
  }else{
    a.fired=true; a.firedAt=now||Date.now();
  }
}
function fireAlarmUI(alarm){
  const ov=document.getElementById('alarmRingOverlay'); if(!ov) return;
  if(ringingAlarmId===alarm.id) return;
  ringingAlarmId=alarm.id;
  document.getElementById('alarmRingTitle').textContent=alarm.title||'آلارم';
  const t=new Date(alarm.time||Date.now());
  document.getElementById('alarmRingTime').textContent=t.toLocaleTimeString('fa-IR',{hour:'2-digit',minute:'2-digit'});
  const tw=document.getElementById('alarmRingTaskWrap');
  if(alarm.taskTitle){tw.style.display='inline-block';document.getElementById('alarmRingTask').textContent='تسک: '+alarm.taskTitle;}else tw.style.display='none';
  ov.classList.add('show');
  playAlarmAudio();
}
function checkAlarms(){
  const now=Date.now();
  let changed=false, ringObj=null;
  state.alarms.forEach(a=>{
    if(!a.enabled||a.fired) return;
    if(a.time<=now){
      const isStale=(a.repeat==='none') && (now-a.time>3600*1000);
      if(!isStale && ringingAlarmId!==a.id) ringObj={...a,time:now};
      advanceOrMarkFired(a,now);
      changed=true;
    }
  });
  if(ringObj) fireAlarmUI(ringObj);
  if(changed){save();renderAlarmsList();}
}
function renderAlarmsList(){
  const cont=document.getElementById('alarmsList'); if(!cont) return;
  cont.innerHTML='';
  const {start,end}=getTodayRange();
  const list=state.alarms
    .filter(a=>(a.time>=start && a.time<end)||(a.firedAt>=start && a.firedAt<end))
    .sort((a,b)=>{
      if(!!a.fired!==!!b.fired) return a.fired?1:-1;
      return a.time-b.time;
    });
  if(list.length===0){cont.innerHTML='<div class="muted" style="font-size:11.5px;padding:4px 2px">آلارمی برای امروز نیست — دستی یا با هوش مصنوعی بساز.</div>';return;}
  list.forEach(a=>{
    const d=new Date(a.fired?a.firedAt:a.time);
    const rl=repeatLabel(a);
    const el=document.createElement('div');
    el.className='alarm-item'+(a.fired?' fired':'');
    el.innerHTML=`<button class="alarm-toggle ${a.enabled&&!a.fired?'on':''}" data-toggle="${a.id}" title="روشن/خاموش"></button>
      <div class="alarm-time">${d.toLocaleTimeString('fa-IR',{hour:'2-digit',minute:'2-digit'})}</div>
      <div style="flex:1;min-width:0">
        <div class="alarm-title-t" style="font-size:12.5px;color:var(--paper);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.title||'آلارم'}${a.fired?' <span class="muted" style="font-size:10px">(زنگ خورد)</span>':''}</div>
        <div style="display:flex;gap:5px;align-items:center;margin-top:3px;flex-wrap:wrap">
          ${rl?'<span class="repeat-badge">↻ '+rl+'</span>':''}
          ${a.taskTitle?'<span class="muted" style="font-size:10px">'+a.taskTitle+'</span>':''}
        </div>
      </div>
      <button class="btn-ghost" data-del-alarm="${a.id}" style="padding:4px 8px">✕</button>`;
    cont.appendChild(el);
  });
  cont.querySelectorAll('[data-del-alarm]').forEach(b=>b.addEventListener('click',()=>{
    state.alarms=state.alarms.filter(a=>a.id!==b.getAttribute('data-del-alarm'));
    save(); renderAlarmsList();
  }));
  cont.querySelectorAll('[data-toggle]').forEach(b=>b.addEventListener('click',()=>{
    const a=state.alarms.find(x=>x.id===b.getAttribute('data-toggle')); if(!a||a.fired)return;
    a.enabled=!a.enabled;
    if(a.enabled && a.time<=Date.now()){
      if(a.repeat&&a.repeat!=='none') a.time=nextAlarmTime(a,Date.now()+1000)||a.time;
      else a.time=Date.now()+5*60000;
      a.fired=false;
    }
    save(); renderAlarmsList();
  }));
}
function reconcileAlarmsFromMeta(meta){
  if(!Array.isArray(meta)) return;
  meta.forEach(m=>{
    const a=state.alarms.find(x=>x.id===m.id); if(!a) return;
    if(m.fired && !a.fired){a.fired=true;a.firedAt=m.firedAt||m.time;a.enabled=false;}
    if(!m.fired && m.time && m.time>a.time){a.time=m.time;a.fired=false;a.enabled=true;}
    if(m.repeat){a.repeat=m.repeat; if(m.repeatDays)a.repeatDays=m.repeatDays;}
  });
}

// ---------- Alarm modal ----------
let alarmModalRepeat='none', alarmModalDays=new Set();
function setAlarmFormDefaults(){
  const d=new Date(Date.now()+30*60000);
  const dateStr=formatGregorian(d.getFullYear(),d.getMonth()+1,d.getDate());
  const rounded=d.getMinutes()<30?String(d.getHours()).padStart(2,'0')+':30':String((d.getHours()+1)%24).padStart(2,'0')+':00';
  const dateEl=document.getElementById('alarmDate'), timeEl=document.getElementById('alarmTime');
  const dateDisp=document.getElementById('alarmDateDisplay'), timeDisp=document.getElementById('alarmTimeDisplay');
  if(dateEl){dateEl.value=dateStr; if(dateDisp)dateDisp.textContent='امروز';}
  if(timeEl){timeEl.value=rounded; if(timeDisp)timeDisp.textContent=rounded;}
}
function populateAlarmTaskSelect(){
  const sel=document.getElementById('alarmTask'); if(!sel) return;
  const prev=sel.value;
  const viewDate=getCurrentViewDate();
  const tasks=state.tasks.filter(t=>t.date===viewDate);
  sel.innerHTML='<option value="">— بدون اتصال به تسک —</option>'+tasks.map(t=>`<option value="${t.id}">${t.title}</option>`).join('');
  if(prev && tasks.some(t=>t.id===prev)) sel.value=prev;
}
function buildWeekdayChips(){
  const wrap=document.getElementById('alarmDayChips'); if(!wrap || wrap.children.length) return;
  WEEKDAY_CHIP_ORDER.forEach(day=>{
    const b=document.createElement('button'); b.type='button'; b.className='weekday-chip';
    b.dataset.day=day; b.textContent=WEEKDAY_SHORT[day]; b.title=faWeekdays[day];
    b.addEventListener('click',()=>{
      if(alarmModalDays.has(day)){alarmModalDays.delete(day);b.classList.remove('active');}
      else{alarmModalDays.add(day);b.classList.add('active');}
    });
    wrap.appendChild(b);
  });
}
function openAlarmModal(){
  populateAlarmTaskSelect();
  setAlarmFormDefaults();
  document.getElementById('alarmTitle').value='';
  alarmModalRepeat='none'; alarmModalDays=new Set();
  document.querySelectorAll('#alarmRepeatSeg button').forEach(b=>b.classList.toggle('active',b.dataset.repeat==='none'));
  const chips=document.getElementById('alarmDayChips');
  chips.style.display='none'; chips.querySelectorAll('.weekday-chip').forEach(c=>c.classList.remove('active'));
  const st=document.getElementById('alarmModalStatus'); if(st){st.textContent='';st.style.color='';}
  document.getElementById('alarmModal').classList.add('show');
}
function saveAlarmFromModal(){
  const status=document.getElementById('alarmModalStatus');
  const setErr=msg=>{if(status){status.textContent=msg;status.style.color='var(--coral)';}};
  const title=document.getElementById('alarmTitle').value.trim();
  const taskId=document.getElementById('alarmTask').value;
  const date=document.getElementById('alarmDate').value;
  const hhmm=document.getElementById('alarmTime').value;
  if(!date||!validDateStr(date)){setErr('تاریخ را انتخاب کن');return;}
  if(!hhmm||!validHM(hhmm)){setErr('ساعت را انتخاب کن');return;}
  let repeatDays=[];
  if(alarmModalRepeat==='custom'){
    repeatDays=[...alarmModalDays];
    if(repeatDays.length===0){setErr('حداقل یک روز هفته انتخاب کن');return;}
  }
  const alarm=buildAlarmObject({title,taskId,dateStr:date,hhmm,repeat:alarmModalRepeat,repeatDays});
  if(alarm.repeat==='none' && alarm.time<=Date.now()-30000){setErr('زمان گذشته است');return;}
  state.alarms.push(alarm);
  save(); renderAlarmsList();
  document.getElementById('alarmModal').classList.remove('show');
}
document.getElementById('openAlarmModalBtn')?.addEventListener('click',openAlarmModal);
document.getElementById('alarmModalCancel')?.addEventListener('click',()=>document.getElementById('alarmModal').classList.remove('show'));
document.getElementById('alarmModal')?.addEventListener('click',e=>{if(e.target.id==='alarmModal')e.target.classList.remove('show');});
document.getElementById('alarmModalSave')?.addEventListener('click',saveAlarmFromModal);
document.querySelectorAll('#alarmRepeatSeg button').forEach(b=>b.addEventListener('click',()=>{
  alarmModalRepeat=b.dataset.repeat;
  document.querySelectorAll('#alarmRepeatSeg button').forEach(x=>x.classList.toggle('active',x===b));
  const chips=document.getElementById('alarmDayChips');
  chips.style.display=alarmModalRepeat==='custom'?'flex':'none';
}));

// ---------- Ringing overlay controls ----------
document.getElementById('alarmStopBtn')?.addEventListener('click',()=>{
  document.getElementById('alarmRingOverlay')?.classList.remove('show');
  stopAlarmAudio(); ringingAlarmId=null;
});
document.getElementById('alarmSnoozeBtn')?.addEventListener('click',()=>{
  const a=state.alarms.find(x=>x.id===ringingAlarmId);
  state.alarms.push(migrateAlarm({
    id:uid(), title:(a?a.title:'آلارم')+' (یادآوری ۵ دقیقه)',
    taskId:a?a.taskId||null:null, taskTitle:a?a.taskTitle||'':'',
    time:Date.now()+5*60000, enabled:true, fired:false, repeat:'none', snoozeOf:ringingAlarmId
  }));
  save(); renderAlarmsList();
  document.getElementById('alarmRingOverlay')?.classList.remove('show');
  stopAlarmAudio(); ringingAlarmId=null;
});
try{
  if(typeof chrome!=='undefined'&&chrome.runtime&&chrome.runtime.onMessage){
    chrome.runtime.onMessage.addListener((msg)=>{
      if(msg&&msg.type==='ALARM_FIRE'&&msg.alarm){
        const a=state.alarms.find(x=>x.id===msg.alarm.id);
        if(!a){fireAlarmUI(msg.alarm);return;}
        if(a.time>Date.now()) return; // page already handled & rescheduled it
        if(a.repeat&&a.repeat!=='none'){a.time=msg.nextTime||nextAlarmTime(a,Date.now()+1000);a.fired=false;}
        else{a.fired=true;a.firedAt=Date.now();a.enabled=false;}
        save();renderAlarmsList();
        fireAlarmUI({...a,time:Date.now()});
      }
    });
  }
}catch(e){}

// ---------- Alarm sound settings ----------
function initAlarmSoundUI(){
  const sel=document.getElementById('alarmSoundSelect'); if(!sel) return;
  const cur=state.settings.alarmSound||'sounds/notify.mp3';
  sel.value=cur.startsWith('data:')?'custom':cur;
  const st=document.getElementById('alarmSoundStatus');
  document.getElementById('alarmSoundTest')?.addEventListener('click',()=>{
    try{const a=new Audio(state.settings.alarmSound||'sounds/notify.mp3');a.volume=0.9;a.play().catch(e=>{if(st)st.textContent='پخش نشد: '+e.message;});}catch(e){}
  });
  document.getElementById('alarmSoundUpload')?.addEventListener('click',()=>document.getElementById('alarmSoundFile')?.click());
  document.getElementById('alarmSoundFile')?.addEventListener('change',e=>{
    const f=e.target.files[0]; if(!f) return;
    const r=new FileReader();
    r.onload=ev=>{
      state.settings.alarmSound=ev.target.result; save();
      sel.value='custom';
      if(st){st.textContent='✅ صدای سفارشی ذخیره شد ('+Math.round(f.size/1024)+'KB)';st.style.color='var(--green)';}
      try{const a=new Audio(ev.target.result);a.volume=0.9;a.play().catch(()=>{});}catch(e){}
    };
    r.readAsDataURL(f);
  });
  sel.addEventListener('change',()=>{
    if(sel.value==='custom'){
      const has=typeof state.settings.alarmSound==='string'&&state.settings.alarmSound.startsWith('data:');
      if(!has)document.getElementById('alarmSoundFile')?.click();
    }else{
      state.settings.alarmSound=sel.value; save();
      if(st){st.textContent='✅ ذخیره شد';st.style.color='var(--green)';}
    }
  });
}

// ============================================================
// ======================= VIBE v3 ============================
// === mood + fatigue check-in popup, trend chart, about-me ===
// ============================================================
const VIBE_MOODS=[
  {v:1,fa:'خیلی بد',color:'#eb5757',svg:'<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 6c.83 0 1.5.67 1.5 1.5S16.33 11 15.5 11 14 10.33 14 9.5 14.67 8 15.5 8zm-7 0c.83 0 1.5.67 1.5 1.5S9.33 11 8.5 11 7 10.33 7 9.5 7.67 8 8.5 8zm3.5 9.5c-2.33 0-4.32-1.45-5.12-3.5h1.61c.72.89 1.92 1.5 3.51 1.5s2.79-.61 3.5-1.5h1.61c-.8 2.05-2.79 3.5-5.12 3.5z"/>'},
  {v:2,fa:'بد',color:'#f59e0b',svg:'<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-6c-2.33 0-4.32 1.45-5.12 3.5h1.61c.72-.89 1.92-1.5 3.51-1.5s2.79.61 3.5 1.5h1.61c-.8-2.05-2.79-3.5-5.12-3.5zm3.5-2.5c.83 0 1.5-.67 1.5-1.5S16.33 9.5 15.5 9.5 14 10.17 14 11s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 9.5 8.5 9.5 7 10.17 7 11s.67 1.5 1.5 1.5z"/>'},
  {v:3,fa:'متوسط',color:'#8a8f98',svg:'<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zM8.5 11c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm7 0c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zM15.5 15h-7v1.5h7V15z"/>'},
  {v:4,fa:'خوب',color:'#02b8cc',svg:'<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-3.5c.73 0 1.39.27 1.92.74l.88-.88C14.11 15.66 13.1 15 12 15s-2.11.66-2.8 1.36l.88.88c.53-.47 1.19-.74 1.92-.74zm-3.5-3.5c.83 0 1.5-.67 1.5-1.5S9.33 9.5 8.5 9.5 7 10.17 7 11s.67 1.5 1.5 1.5zm7 0c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5z"/>'},
  {v:5,fa:'خیلی خوب',color:'#27a644',svg:'<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zM8.5 11c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm7 0c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-3.5 5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>'}
];
const VIBE_FATIGUE=[{v:1,fa:'سرحال',color:'#27a644'},{v:2,fa:'کمی خسته',color:'#7cc998'},{v:3,fa:'خسته',color:'#f0a35e'},{v:4,fa:'خیلی خسته',color:'#f5845b'},{v:5,fa:'تحلیل‌رفته',color:'#eb5757'}];
const VIBE_FACE_NULL='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-dasharray="2.6 2.4"><circle cx="12" cy="12" r="8.2"/><path d="M9 14.4c.8 1 1.8 1.5 3 1.5s2.2-.5 3-1.5" stroke-dasharray="0"/><path d="M9.2 9.6h.01M14.8 9.6h.01" stroke-dasharray="0"/></svg>';
function vibeMood(v){return VIBE_MOODS.find(m=>m.v===v)||VIBE_MOODS[2];}
function vibeFatigue(v){return VIBE_FATIGUE.find(f=>f.v===v)||VIBE_FATIGUE[2];}
function vibeFaceSvg(mood,size){
  if(mood==null)return VIBE_FACE_NULL.replace('<svg ','<svg width="'+(size||16)+'" height="'+(size||16)+'" ');
  return '<svg viewBox="0 0 24 24" width="'+(size||18)+'" height="'+(size||18)+'" fill="currentColor">'+vibeMood(mood).svg+'</svg>';
}
function normalizeVibe(e){
  e=e||{};const mood=parseInt(e.mood),fat=parseInt(e.fatigue!=null?e.fatigue:e.energy);
  return {
    id:e.id||uid(),
    ts:Number.isFinite(e.ts)?e.ts:Date.now(),
    mood:mood>=1&&mood<=5?mood:3,
    // legacy v2 stored "energy" (1..5); fatigue is its inverse
    fatigue:(fat>=1&&fat<=5)?(e.fatigue!=null?fat:6-fat):3,
    note:String(e.note||'').slice(0,1000),
    taskId:e.taskId?String(e.taskId):null,
    taskTitle:e.taskTitle?String(e.taskTitle).slice(0,120):null
  };
}
function vibeDateOf(ts){const d=new Date(ts);return formatGregorian(d.getFullYear(),d.getMonth()+1,d.getDate());}
function vibeHM(ts){const d=new Date(ts);return faNum(String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'));}
function addVibeEntry(input){
  const e=normalizeVibe(input);
  state.vibeEntries.push(e);
  state.vibeEntries.sort((a,b)=>a.ts-b.ts);
  if(state.vibeEntries.length>600)state.vibeEntries=state.vibeEntries.slice(-600);
  save();return e;
}
function deleteVibeEntry(id){state.vibeEntries=state.vibeEntries.filter(e=>e.id!==id);save();}
function vibeSeries(days){
  const out=[];const today=getRealTodayStr();
  const avg=(es,k)=>es.length?es.reduce((a,e)=>a+e[k],0)/es.length:null;
  for(let i=days-1;i>=0;i--){
    const ds=addDaysStr(today,-i);
    const es=state.vibeEntries.filter(e=>vibeDateOf(e.ts)===ds);
    out.push({date:ds,mood:avg(es,'mood'),fatigue:avg(es,'fatigue'),count:es.length});
  }
  return out;
}
function vibeStats(){
  const today=getRealTodayStr();
  const todayEntries=state.vibeEntries.filter(e=>vibeDateOf(e.ts)===today);
  const latest=todayEntries.at(-1)||null;
  const s30=vibeSeries(30),s7=s30.slice(-7);
  const avgOf=(a,k)=>{const v=a.filter(x=>x[k]!=null);return v.length?v.reduce((s,x)=>s+x[k],0)/v.length:null;};
  let streak=0;
  for(let i=0;i<400;i++){
    const ds=addDaysStr(today,-i);
    if(state.vibeEntries.some(e=>vibeDateOf(e.ts)===ds))streak++;
    else if(i===0)continue;else break;
  }
  return {today,latest,todayCount:todayEntries.length,avgMood7:avgOf(s7,'mood'),avgMood30:avgOf(s30,'mood'),avgFatigue7:avgOf(s7,'fatigue'),streak,total:state.vibeEntries.length};
}
function taskLatestVibe(task){
  if(!task)return null;
  let es=state.vibeEntries.filter(e=>e.taskId&&e.taskId===task.id);
  if(!es.length&&task.title)es=state.vibeEntries.filter(e=>!e.taskId&&e.taskTitle===task.title);
  return es.at(-1)||null;
}

// ---------- check-in modal ----------
let vibeDraft=null; // {mood,fatigue,note,taskId}
function openVibeModal(opts){
  opts=opts||{};
  const st=vibeStats();
  vibeDraft={mood:null,fatigue:st.latest?st.latest.fatigue:3,note:'',taskId:opts.taskId||null};
  const modal=document.getElementById('vibeModal');
  const moodBox=document.getElementById('vmMoods');moodBox.innerHTML='';
  VIBE_MOODS.forEach(m=>{
    const b=document.createElement('button');b.type='button';b.className='vm-mood';b.style.setProperty('--mc',m.color);
    b.innerHTML='<svg viewBox="0 0 24 24">'+m.svg+'</svg><span>'+m.fa+'</span>';
    b.addEventListener('click',()=>{vibeDraft.mood=m.v;updateVibeModal();});
    moodBox.appendChild(b);
  });
  const fatigue=document.getElementById('vmFatigue');fatigue.value=vibeDraft.fatigue;
  fatigue.oninput=()=>{vibeDraft.fatigue=parseInt(fatigue.value);updateVibeModal();};
  const note=document.getElementById('vmNote');note.value='';
  note.oninput=()=>{vibeDraft.note=note.value;};
  // task options: recent past + near future
  const sel=document.getElementById('vmTask');sel.innerHTML='';
  const none=document.createElement('option');none.value='';none.textContent='بدون تسک — فقط حال کلی‌م';sel.appendChild(none);
  const today=getRealTodayStr();
  const from=addDaysStr(today,-2),to=addDaysStr(today,+14);
  const tasks=state.tasks.filter(t=>!t.archived&&t.date>=from&&t.date<=to)
    .sort((a,b)=>(a.date<b.date?-1:1)||a.createdAt-b.createdAt);
  const seen=new Set();
  const wkFa={0:'یکشنبه',1:'دوشنبه',2:'سه‌شنبه',3:'چهارشنبه',4:'پنجشنبه',5:'جمعه',6:'شنبه'};
  tasks.forEach(t=>{
    if(seen.has(t.id))return;seen.add(t.id);
    const o=document.createElement('option');o.value=t.id;
    o.textContent=t.title+(t.date!==today?' ('+wkFa[new Date(t.date+'T12:00').getDay()]+')':'');
    sel.appendChild(o);
  });
  if(vibeDraft.taskId&&![...sel.options].some(o=>o.value===vibeDraft.taskId)){
    const t=state.tasks.find(x=>x.id===vibeDraft.taskId);
    if(t){const o=document.createElement('option');o.value=t.id;o.textContent=t.title;sel.appendChild(o);}
  }
  sel.value=vibeDraft.taskId||'';
  sel.onchange=()=>{vibeDraft.taskId=sel.value||null;};
  modal.classList.add('show');
  updateVibeModal();
}
function closeVibeModal(){document.getElementById('vibeModal')?.classList.remove('show');vibeDraft=null;}
function updateVibeModal(){
  if(!vibeDraft)return;
  document.querySelectorAll('#vmMoods .vm-mood').forEach((b,i)=>b.classList.toggle('sel',vibeDraft.mood===VIBE_MOODS[i].v));
  const f=vibeFatigue(vibeDraft.fatigue);
  const lab=document.getElementById('vmFatigueLab');lab.textContent=f.fa;lab.style.color=f.color;
  document.getElementById('vmSave').disabled=vibeDraft.mood==null;
}
function saveVibeModal(){
  if(!vibeDraft||vibeDraft.mood==null)return;
  const taskId=vibeDraft.taskId;
  const task=taskId?state.tasks.find(t=>t.id===taskId):null;
  addVibeEntry({mood:vibeDraft.mood,fatigue:vibeDraft.fatigue,note:vibeDraft.note,taskId:taskId||null,taskTitle:task?task.title:null});
  closeVibeModal();
  renderTasks();
  if(document.getElementById('vibe-panel')?.classList.contains('active'))renderVibePanel();
}
document.getElementById('vibeAddBtn')?.addEventListener('click',()=>openVibeModal());
document.getElementById('vmCancel')?.addEventListener('click',closeVibeModal);
document.getElementById('vmSave')?.addEventListener('click',saveVibeModal);
document.getElementById('vibeModal')?.addEventListener('click',e=>{if(e.target.id==='vibeModal')closeVibeModal();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const m=document.getElementById('vibeModal');if(m&&m.classList.contains('show'))closeVibeModal();}});
document.querySelectorAll('#vibeRangeSeg [data-range]').forEach(b=>b.addEventListener('click',()=>{
  vibeRange=parseInt(b.dataset.range);
  document.querySelectorAll('#vibeRangeSeg [data-range]').forEach(x=>x.classList.toggle('active',x===b));
  renderVibePanel();
}));
let vibeRange=7;

// ---------- trend chart (inline SVG) ----------
function vibeTrendChart(days){
  const W=600,H=210,L=40,R=14,T=16,B=30;
  const data=vibeSeries(days);
  const x=i=>L+(W-L-R)*(days===1?0:i/(days-1));
  const y=v=>T+(5-v)/4*(H-T-B);
  let grid='';
  VIBE_MOODS.slice().reverse().forEach(m=>{
    const yy=y(m.v);
    grid+=`<line class="grid-line" x1="${L}" y1="${yy}" x2="${W-R}" y2="${yy}"/>`;
    grid+=`<text x="${L-7}" y="${yy+3.5}" text-anchor="end" fill="${m.color}">${m.fa}</text>`;
  });
  const pts=(k)=>data.map((d,i)=>d[k]!=null?[x(i),y(k==='mood'?d[k]:6-d[k]),i,d]:null).filter(Boolean);
  const linePath=p=>p.map((q,i)=>(i?'L':'M')+q[0].toFixed(1)+' '+q[1].toFixed(1)).join(' ');
  const mp=pts('mood'),fp=pts('fatigue');
  let moodArea='',moodLine='';
  if(mp.length){
    moodArea=`<path class="mood-area" d="M${mp[0][0].toFixed(1)} ${H-B} ${mp.map(q=>'L'+q[0].toFixed(1)+' '+q[1].toFixed(1)).join(' ')} L${mp.at(-1)[0].toFixed(1)} ${H-B} Z"/>`;
    moodLine=`<path class="mood-line" d="${linePath(mp)}"/>`;
  }
  let dots='';
  mp.forEach(q=>{const today=q[3].date===getRealTodayStr();dots+=`<circle class="${today?'today':'dot-mood'}" cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="${today?4.5:3}"><title>${q[3].date} • ${vibeMood(Math.round(q[3].mood)).fa}</title></circle>`;});
  let fatLine='';
  if(fp.length)fatLine=`<path class="fatigue-line" d="${linePath(fp)}"/>`;
  let xlabels='';
  const wk={6:'ش',0:'ی',1:'د',2:'س',3:'چ',4:'پ',5:'ج'};
  data.forEach((d,i)=>{
    if(days<=7){xlabels+=`<text x="${x(i)}" y="${H-8}" text-anchor="middle">${wk[new Date(d.date+'T12:00').getDay()]}</text>`;}
    else if(i%5===0||i===days-1){const dd=new Date(d.date+'T12:00');xlabels+=`<text x="${x(i)}" y="${H-8}" text-anchor="middle">${faNum(dd.getDate())}</text>`;}
  });
  return `<svg class="v3-chart" viewBox="0 0 ${W} ${H}" dir="ltr">
    <defs><linearGradient id="v3MoodGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#7c83ff" stop-opacity=".35"/><stop offset="100%" stop-color="#7c83ff" stop-opacity="0"/>
    </linearGradient></defs>${grid}${moodArea}${fatLine}${moodLine}${dots}${xlabels}</svg>
  <div class="v3-legend"><span>حال<i style="background:#7c83ff"></i></span><span>خستگی (هرچه بالاتر یعنی سرحال‌تر)<i style="background:#f0a35e"></i></span></div>`;
}

// ---------- panel render ----------
function vibeJDate(ds){
  const p=ds.split('-').map(Number);const j=toJalali(p[0],p[1],p[2]);
  return faNum(j.jd)+' '+jMonthNames[j.jm-1]+' '+faNum(j.jy);
}
function renderVibePanel(){
  const root=document.getElementById('vibeHome');if(!root)return;
  const st=vibeStats();
  root.innerHTML='';
  if(!st.total){
    const empty=document.createElement('div');empty.className='v3-empty';
    empty.innerHTML=`<img src="doodles/Coffee.svg" alt="" draggable="false"/>
      <div class="t">هنوز چک‌اینی ثبت نشده</div>
      <div class="muted" style="font-size:11.5px;line-height:1.8">دکمه‌ی + بالا (یا چهره‌ی کنار هر تسک) را بزن؛ یک ثانیه طول می‌کشد: حالت، سطح خستگی و در صورت خواستن یک یادداشت.</div>
      <button class="btn-primary" style="margin:14px auto 0" data-vibe-open>+ ثبت حس‌وحال</button>`;
    empty.querySelector('[data-vibe-open]').addEventListener('click',()=>openVibeModal());
    root.appendChild(empty);return;
  }
  const grid=document.createElement('div');grid.className='v3-grid';
  // chart card
  const chartCard=document.createElement('div');chartCard.className='v3-card';
  chartCard.innerHTML='<h3>روند حال‌وهوا</h3>'+vibeTrendChart(vibeRange);
  // latest + stats card
  const e=st.latest,m=e?vibeMood(e.mood):null,f=e?vibeFatigue(e.fatigue):null;
  const stat=(v,k)=>`<div class="v3-stat"><div class="v">${v}</div><div class="k">${k}</div></div>`;
  const side=document.createElement('div');side.className='v3-card';
  side.innerHTML=`<h3>آخرین وضعیت</h3>
    ${e?`<div class="v3-mood-avg" style="--mc:${m.color}">
        <span class="face" style="color:${m.color}">${vibeFaceSvg(e.mood,28)}</span>
        <span class="lab"><b>${m.fa}</b>${faNum(vibeHM(e.ts))}${e.taskTitle?' • '+aiEsc(e.taskTitle):''}</span>
      </div>
      <div style="text-align:center;font-size:11px;color:${f.color};margin:-4px 0 12px">خستگی: ${f.fa}</div>`
      :'<div class="muted" style="font-size:11.5px;text-align:center;margin-bottom:12px">امروز چک‌این نداری</div>'}
    <div class="v3-stat-row">
      ${stat(st.avgMood7!=null?faNum((Math.round(st.avgMood7*10)/10).toLocaleString()):'–','میانگین حال ۷ روز')}
      ${stat(faNum(st.streak),'روز پیاپی')}
      ${stat(faNum(st.total),'همه‌ی چک‌این‌ها')}
    </div>
    <div style="text-align:center;font-size:10.5px;color:var(--ash)">میانگین خستگی هفته: ${st.avgFatigue7!=null?faNum(Math.round(st.avgFatigue7*10)/10)+' از ۵':'–'}</div>`;
  const left=document.createElement('div');left.appendChild(chartCard);
  const right=document.createElement('div');right.appendChild(side);
  grid.appendChild(left);grid.appendChild(right);root.appendChild(grid);
  // entries grouped by Jalali day (most recent first, last ~60)
  const listCard=document.createElement('div');listCard.className='v3-card';
  listCard.innerHTML='<h3>دفترچه‌ی کوتاه</h3>';
  let lastDay='';
  [...state.vibeEntries].reverse().slice(0,60).forEach(en=>{
    const ds=vibeDateOf(en.ts);
    if(ds!==lastDay){lastDay=ds;const h=document.createElement('div');h.className='v3-day-h';h.textContent=vibeJDate(ds);listCard.appendChild(h);}
    const mm=vibeMood(en.mood),ff=vibeFatigue(en.fatigue);
    const row=document.createElement('div');row.className='v3-entry';row.style.setProperty('--mc',mm.color);
    row.innerHTML=`<div class="ef" style="--mc:${mm.color};color:${mm.color}">${vibeFaceSvg(en.mood,20)}</div>
      <div class="eb">
        <b>${mm.fa}</b><span class="et">${faNum(vibeHM(en.ts))}</span>
        <div class="chips">
          <span class="v3-fat-chip" style="color:${ff.color};border-color:color-mix(in srgb,${ff.color} 35%,transparent);background:color-mix(in srgb,${ff.color} 12%,transparent)">خستگی: ${ff.fa}</span>
          ${en.taskTitle?'<span class="v3-task-chip">'+aiEsc(en.taskTitle)+'</span>':''}
        </div>
        ${en.note?'<div class="note">'+aiEsc(en.note)+'</div>':''}
      </div>
      <button class="del" title="حذف"><svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>`;
    row.querySelector('.del').addEventListener('click',()=>{if(confirm('این چک‌این حذف شود؟')){deleteVibeEntry(en.id);renderVibePanel();renderTasks();}});
    listCard.appendChild(row);
  });
  root.appendChild(listCard);
}

// ============================================================
// ====================== ABOUT ME ============================
// ============================================================
function normalizeAbout(a){
  a=a||{};const text=String(a.text||'').trim().slice(0,4000);
  return {id:a.id||uid(),text,ts:Number.isFinite(a.ts)?a.ts:Date.now(),updatedAt:Number.isFinite(a.updatedAt)?a.updatedAt:(Number.isFinite(a.ts)?a.ts:Date.now())};
}
let aboutEditId=null;
function renderAbout(){
  const root=document.getElementById('aboutList');if(!root)return;
  root.innerHTML='';
  const input=document.getElementById('aboutInput');
  const saveBtn=document.getElementById('aboutSave');
  const cancel=document.getElementById('aboutCancel');
  if(saveBtn)saveBtn.textContent=aboutEditId?'ذخیره ویرایش':'افزودن به حافظه';
  if(cancel)cancel.style.display=aboutEditId?'':'none';
  if(!state.aboutMe.length){
    const empty=document.createElement('div');empty.className='about-empty';
    empty.innerHTML=`<img src="doodles/Plant.svg" alt="" draggable="false"/>
      <div style="font-size:13px;color:var(--fog)">چیزی ثبت نشده؛ هر چه درباره‌ی خودت مهم است را بنویس.</div>
      <div class="muted" style="font-size:11px;margin-top:5px">ریتم خواب و انرژی، چیزهایی که حالت را خوب یا بد می‌کنند، اهداف، آدم‌ها، علاقه‌مندی‌ها…</div>`;
    root.appendChild(empty);return;
  }
  state.aboutMe.forEach(a=>{
    const card=document.createElement('div');card.className='about-card';
    const j=toJalali(...vibeDateOf(a.ts).split('-').map(Number));
    const dateLab=faNum(j.jd)+' '+jMonthNames[j.jm-1]+' '+faNum(j.jy)+(a.updatedAt&&a.updatedAt!==a.ts?' • ویرایش‌شده':'');
    card.innerHTML=`<div style="flex:1;min-width:0">
        <div class="ab-date">${dateLab}</div>
        <div class="ab-t">${aiEsc(a.text)}</div>
      </div>
      <div class="ab-actions">
        <button title="ویرایش"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg></button>
        <button class="del" title="حذف"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg></button>
      </div>`;
    const [editBtn,delBtn]=card.querySelectorAll('button');
    editBtn.addEventListener('click',()=>{
      aboutEditId=a.id;if(input){input.value=a.text;input.focus();}renderAbout();
    });
    delBtn.addEventListener('click',()=>{
      if(!confirm('این مورد از حافظه حذف شود؟'))return;
      state.aboutMe=state.aboutMe.filter(x=>x.id!==a.id);
      if(aboutEditId===a.id){aboutEditId=null;if(input)input.value='';}
      save();renderAbout();
    });
    root.appendChild(card);
  });
}
function saveAbout(){
  const input=document.getElementById('aboutInput');if(!input)return;
  const text=input.value.trim();if(!text){input.focus();return;}
  if(aboutEditId){
    const a=state.aboutMe.find(x=>x.id===aboutEditId);
    if(a){a.text=text;a.updatedAt=Date.now();}
    aboutEditId=null;
  }else{
    state.aboutMe.unshift(normalizeAbout({text}));
    state.aboutMe.sort((a,b)=>b.ts-a.ts);
    if(state.aboutMe.length>200)state.aboutMe=state.aboutMe.slice(0,200);
  }
  input.value='';save();renderAbout();
}
document.getElementById('aboutSave')?.addEventListener('click',saveAbout);
document.getElementById('aboutCancel')?.addEventListener('click',()=>{aboutEditId=null;const i=document.getElementById('aboutInput');if(i)i.value='';renderAbout();});

// ---------- AI-facing snapshots ----------
function vibeSnapshot(){
  const st=vibeStats();
  const taskMap={};
  state.vibeEntries.filter(e=>e.taskTitle&&e.ts>Date.now()-60*864e5).forEach(e=>{
    const k=e.taskTitle;(taskMap[k]=taskMap[k]||{title:k,sum:0,n:0,last:0,lastMood:null});
    taskMap[k].sum+=e.mood;taskMap[k].n++;if(e.ts>taskMap[k].last){taskMap[k].last=e.ts;taskMap[k].lastMood=e.mood;}
  });
  const taskFeelings=Object.values(taskMap).map(x=>({title:x.title,avgMood:Math.round(x.avgMood?x.avgMood:x.sum/x.n*10)/10,count:x.n,lastMood:x.lastMood}))
    .sort((a,b)=>b.count-a.count).slice(0,20);
  return {
    today:st.latest?{time:vibeHM(st.latest.ts),mood:st.latest.mood,moodLabel:vibeMood(st.latest.mood).fa,fatigue:st.latest.fatigue,fatigueLabel:vibeFatigue(st.latest.fatigue).fa,task:st.latest.taskTitle,note:st.latest.note}:null,
    checkedInToday:!!st.latest,
    checkinStreak:st.streak,
    avgMood7:st.avgMood7!=null?Math.round(st.avgMood7*10)/10:null,
    avgMood30:st.avgMood30!=null?Math.round(st.avgMood30*10)/10:null,
    avgFatigue7:st.avgFatigue7!=null?Math.round(st.avgFatigue7*10)/10:null,
    series30:vibeSeries(30).map(d=>({date:d.date,mood:d.mood!=null?Math.round(d.mood*10)/10:null,fatigue:d.fatigue!=null?Math.round(d.fatigue*10)/10:null})),
    taskFeelings,
    recentNotes:state.vibeEntries.slice(-8).map(e=>({date:vibeDateOf(e.ts),mood:e.mood,fatigue:e.fatigue,task:e.taskTitle,note:e.note})).filter(e=>e.note)
  };
}
function aboutMemoryLines(){
  return state.aboutMe.slice(0,80).map(a=>'• '+a.text.replace(/\s+/g,' ').trim());
}
function vibeLogFromAI(args){
  const mood=parseInt(args.mood);
  if(!(mood>=1&&mood<=5))return {ok:false,error:'mood باید عدد ۱ تا ۵ باشد'};
  let fatigue=parseInt(args.fatigue);if(!(fatigue>=1&&fatigue<=5))fatigue=3;
  let taskId=null,taskTitle=args.taskTitle?String(args.taskTitle).slice(0,120):null;
  if(taskTitle){
    const norm=s=>s.trim().toLowerCase();
    const t=state.tasks.find(x=>norm(x.title)===norm(taskTitle))||
      state.tasks.find(x=>norm(x.title).includes(norm(taskTitle))||norm(taskTitle).includes(norm(x.title)));
    if(t){taskId=t.id;taskTitle=t.title;}
  }
  const e=addVibeEntry({mood,fatigue,taskId,taskTitle,note:args.note||''});
  try{renderTasks();if(document.getElementById('vibe-panel')?.classList.contains('active'))renderVibePanel();}catch(_){}
  return {ok:true,saved:true,mood:e.mood,moodLabel:vibeMood(e.mood).fa,fatigue:e.fatigue,date:vibeDateOf(e.ts),task:e.taskTitle};
}

// ============================================================
// ====================== GEMINI AI ==========================
// ============================================================
const AI_CAP_META={
  tasks:{label:'مدیریت تسک‌ها',desc:'ساخت، ویرایش، حذف، تغییر وضعیت و تعویق تسک‌ها'},
  folders:{label:'مدیریت پوشه‌ها',desc:'ساخت پوشه، گروه‌بندی و حذف پوشه‌ها'},
  calendar:{label:'تقویم، مناسبت و یادداشت',desc:'مناسبت‌ها، تعطیلات رسمی، تکرار سالانه و تنظیم یادداشت روزها'},
  time:{label:'زمان‌ها و تایمر',desc:'ثبت دستی، ویرایش/حذف زمان‌های انجام‌شده و کنترل تایمر'},
  scheduling:{label:'آلارم و برنامه‌ریزی زمانی',desc:'ساخت و ویرایش پلن هاشوردار و آلارم روی دایره‌ی زمان‌سنجی'},
  vibe:{label:'دسترسی به وایب',desc:'خواندن و ثبت حس‌وحال، خستگی، حس نسبت به تسک‌ها و روند حال'},
  about:{label:'دسترسی به درباره‌ی من‌ها',desc:'یادداشت‌های شخصی کاربر که به‌عنوان حافظه به هوش مصنوعی داده می‌شود'}
};
const TOOL_CAP={
  create_task:'tasks',update_task:'tasks',delete_task:'tasks',postpone_task:'tasks',complete_task_step:'tasks',reset_task_steps:'tasks',
  create_folder:'folders',delete_folder:'folders',
  create_occasion:'calendar',delete_occasion:'calendar',save_note:'calendar',delete_note:'calendar',
  get_habits:'tasks',create_habit:'tasks',update_habit:'tasks',delete_habit:'tasks',log_habit:'tasks',
  log_manual_session:'time',update_session:'time',delete_session:'time',start_timer:'time',pause_timer:'time',stop_timer:'time',
  create_plan:'scheduling',update_plan:'scheduling',delete_plan:'scheduling',create_alarm:'scheduling',delete_alarm:'scheduling',
  get_vibe:'vibe',log_vibe:'vibe'
};
function aiCaps(){return state.settings.aiCaps||{};}
// Plan/alarm access follows the capability switches (no separate checkbox):
// scheduling capability enables plans+alarms; time capability exposes clock/timer data.
function aiPlanMode(){return !!(aiCaps().scheduling||aiCaps().time);}
function aiSchedulingOn(){return !!aiCaps().scheduling;}

// ---------- Context snapshot (respects data-access scope) ----------
function buildAIContext(includeTime){
  const now=new Date();
  const todayStr=getRealTodayStr();
  const scopeAll=state.settings.aiDataAccess!=='today';
  const j=toJalali(now.getFullYear(),now.getMonth()+1,now.getDate());
  const msInfo=t=>isMultiStep(t)?{multiStep:true,step:msIndex(t),totalSteps:msTotal(t),steps:t.steps.map((s,i)=>({n:i+1,title:s.title,description:s.note||null,done:i<msIndex(t)}))}:{multiStep:false};
  const taskShape=t=>({id:t.id,title:t.title,date:t.date,status:t.status,priority:t.lines||1,color:colorForAI(t.color),folderId:t.folderId||null,habitId:t.habitId||null,habitIcon:t.habitIcon||null,timeSpentMinutes:Math.round((t.timeSpent||0)/60),postponedTo:t.postponedTo||null,...msInfo(t)});
  const day=getViewDayRange();
  const ctx={
    currentDate:{
      gregorian:todayStr,
      weekday:faWeekdays[now.getDay()],
      jalali:j.jd+' '+jMonthNames[j.jm-1]+' '+j.jy,
      taskOverdueHour:state.settings.overdueHour+':00'
    },
    viewDate:getCurrentViewDate(),
    dataScope:scopeAll?'ALL_DATES':'TODAY_ONLY',
    tasks:scopeAll?state.tasks.map(taskShape):state.tasks.filter(t=>t.date===todayStr).map(taskShape),
    folders:state.folders.map(f=>({id:f.id,title:f.title})),
    habits:(aiCaps().tasks===false)?undefined:(state.habits||[]).filter(h=>!h.archived).map(h=>({
      id:h.id,title:h.title,icon:h.icon,priority:h.lines||2,color:colorForAI(h.color),
      repeat:h.repeat,weekMode:h.weekMode||'workdays',repeatDays:h.repeatDays||[],monthDays:h.monthDays||[],normal:!!h.normal,
      timeWindow:h.timeOn?{start:minToHM(h.winStart),end:minToHM(h.winEnd)}:null,
      todayDone:habitDone(h,todayStr),streak:habitStreak(h)
    })).filter(Boolean),
    sessionsToday:(()=>{
      const mid=new Date();mid.setHours(0,0,0,0);
      return state.sessions.filter(s=>s.start>=mid.getTime()).map(s=>{
        const t=state.tasks.find(x=>x.id===s.taskId);
        const sd=new Date(s.start),ed=new Date(s.end||s.start);
        const hh=d=>String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
        return {task:t?t.title:s.taskId,start:hh(sd),end:hh(ed),minutes:Math.round(s.duration/60),manual:!!s.manual};
      });
    })(),
    occasionsUpcoming:(()=>{
      const horizon=scopeAll?30:7;
      const out=[];
      for(let i=0;i<horizon;i++){const d=new Date();d.setDate(d.getDate()+i);const ds=formatGregorian(d.getFullYear(),d.getMonth()+1,d.getDate());getOccasionsForGregorianDate(ds).forEach(o=>out.push({date:ds,title:o.title,repeat:o.repeat||'none',type:o.type||'custom',color:colorForAI(o.color)}));}
      return out;
    })(),
    notes:(scopeAll?state.notes:state.notes.filter(n=>n.date===todayStr)).slice(-15).map(n=>({date:n.date,text:n.text.slice(0,300)}))
  };
  const caps0=aiCaps();
  if(caps0.vibe)ctx.vibe=vibeSnapshot();
  if(caps0.about)ctx.aboutMe=state.aboutMe.slice(0,60).map(a=>({text:a.text}));
  const clockOn=caps0.time||caps0.scheduling;
  if((includeTime||clockOn)&&clockOn){
    ctx.currentTime=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0')+':'+String(now.getSeconds()).padStart(2,'0');
    ctx.timer={active:!!state.timerStart,activeTarget:state.activeTaskId,elapsedSeconds:getElapsed()};
    ctx.viewedDay={date:day.str,isToday:day.isToday};
    // Full-day timeline for the viewed day: every recorded block, tasks + timer-only activities
    const hm=ts=>{const d=new Date(ts);return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');};
    const timelineOf=ds=>{
      const s0=dayStartOf(ds);
      return state.sessions.filter(s=>s.end>s0&&s.start<s0+86400000).slice().sort((a,b)=>a.start-b.start).map(s=>{
        const ref=sessionRefById(s.taskId);
        return {from:hm(Math.max(s.start,s0)),to:hm(Math.min(s.end,s0+86400000)),
          title:ref?ref.title:s.taskId, kind:ref?ref.kind:'unknown',
          minutes:Math.round(Math.max(0,(Math.min(s.end,s0+86400000)-Math.max(s.start,s0))/60000))};
      });
    };
    ctx.dayTimeline=timelineOf(day.str);
    ctx.availableActivities=allActivities().map(a=>({id:a.id,name:a.title}));
  }
  if((includeTime||clockOn)&&caps0.scheduling){
    {
      const src=scopeAll?[...state.plans.filter(p=>p.date>=todayStr),...habitPlanStubs(todayStr)]:plansForDate(todayStr);
      ctx.plans=src.map(p=>({id:p.id,title:p.title,date:p.date,start:minToHM(p.startMin),end:minToHM(p.endMin),taskId:p.taskId||null,color:colorForAI(p.color),habit:p.stub?(p.habitIcon||'check_circle'):undefined}));
    }
    ctx.alarms=state.alarms.filter(a=>!a.fired).map(a=>({id:a.id,title:a.title,date:formatGregorian(new Date(a.time).getFullYear(),new Date(a.time).getMonth()+1,new Date(a.time).getDate()),time:minToHM(new Date(a.time).getHours()*60+new Date(a.time).getMinutes()),taskTitle:a.taskTitle||'',repeat:a.repeat||'none',enabled:a.enabled}));
  }
  return ctx;
}


// ===================== v2.6 TIMER-ONLY ACTIVITIES, SLEEP & DAILY AI REVIEW =====================

// ---------- Timer-only activity registry ----------
// Activities exist only inside زمان‌سنجی: they have sessions but no task card.
const DEFAULT_ACTIVITIES=[
  {id:'act:sleep',  title:'خواب',       icon:'😴', color:'#5b6bb0'},
  {id:'act:rest',   title:'استراحت',    icon:'☕', color:'#8593ad'},
  {id:'act:food',   title:'غذا خوردن',  icon:'🍽️', color:'#b08968'},
  {id:'act:commute',title:'رفت‌وآمد',    icon:'🚌', color:'#6d8b9e'}
];
const CUSTOM_ACT_COLORS=['#7a9e7e','#9e7ab0','#b07a8a','#8a9eb5','#a8a06b','#c08a5e','#7eb0a8','#b08a9e'];
const CUSTOM_ACT_ICONS=['🔹','🧘','📖','🚶','🎧','🧩','🌿','🎯','🛁','📱'];
function activityIdFor(title){
  const slug=String(title||'').trim().toLowerCase()
    .replace(/[\s‌‍]+/g,'_').replace(/[^؀-ۿ\w]+/g,'').slice(0,28);
  return 'act:c_'+(slug||uid().slice(-6));
}
function customActivities(){
  const arr=Array.isArray(state.settings.customActivities)?state.settings.customActivities:[];
  return arr.map((a,i)=>({
    id:activityIdFor(a.title), title:a.title,
    icon:CUSTOM_ACT_ICONS[i%CUSTOM_ACT_ICONS.length],
    color:CUSTOM_ACT_COLORS[i%CUSTOM_ACT_COLORS.length], custom:true,
    archived:!!a.archived
  }));
}
// Activities that can own new timer sessions (archived ones only stay for history)
function selectableActivities(){return allActivities().filter(a=>!a.archived);}
function unarchiveActivity(title){
  const a=(state.settings.customActivities||[]).find(x=>x.title===title);
  if(a){a.archived=false;return true;}
  return false;
}
function allActivities(){
  const seen=new Set(), out=[];
  DEFAULT_ACTIVITIES.concat(customActivities()).forEach(a=>{
    if(seen.has(a.id)||seen.has(a.title))return;
    seen.add(a.id);seen.add(a.title);out.push(a);
  });
  return out;
}
function getActivity(id){return allActivities().find(a=>a.id===id)||null;}
function isActivityId(id){return typeof id==='string'&&id.indexOf('act:')===0;}
// Universal resolver for anything that can own sessions: real tasks first, then activities
function sessionRefById(id){
  const t=state.tasks.find(x=>x.id===id);
  if(t)return {kind:'task',id:t.id,title:t.title,color:t.color,icon:'',task:t};
  const a=getActivity(id);
  if(a)return {kind:'activity',id:a.id,title:a.title,color:a.color,icon:a.icon||'',activity:a};
  return null;
}
// Find or create a custom activity from an AI-provided name; built-ins match by id or title
function resolveActivityRef(name){
  const raw=String(name||'').trim(); if(!raw)return null;
  if(raw.indexOf('act:')===0){const byId=getActivity(raw); if(byId)return byId;}
  const byTitle=allActivities().find(a=>a.title===raw||a.id===raw);
  if(byTitle)return byTitle;
  // known aliases
  const aliases={'sleep':'act:sleep','خواب':'act:sleep','rest':'act:rest','استراحت':'act:rest','غذا':'act:food','food':'act:food','meal':'act:food','commute':'act:commute','رفت‌وآمد':'act:commute','رفت و آمد':'act:commute','مسیر':'act:commute'};
  if(aliases[raw]){const a=getActivity(aliases[raw]); if(a)return a;}
  if(!Array.isArray(state.settings.customActivities))state.settings.customActivities=[];
  if(state.settings.customActivities.some(a=>a.title===raw))return getActivity(activityIdFor(raw));
  state.settings.customActivities.push({title:raw});
  return getActivity(activityIdFor(raw));
}

// ---------- Sleep ----------
function dayStartOf(str){const [y,m,d]=String(str).split('-').map(Number);return new Date(y,m-1,d,0,0,0,0).getTime();}
function dateAddStr(str,delta){
  const t=dayStartOf(str)+delta*86400000, d=new Date(t);
  return formatGregorian(d.getFullYear(),d.getMonth()+1,d.getDate());
}
// Bedtime/wake for wake-day D: bedtime >= noon means the previous evening; < noon means after midnight
function sleepRangeForDay(dayStr,bedMin,wakeMin){
  const s0=dayStartOf(dayStr);
  const bed = bedMin>=720 ? s0-(1440-bedMin)*60000 : s0+bedMin*60000;
  const wake= s0+wakeMin*60000;
  return {start:bed,end:wake};
}
// The sleep covering the early morning of the given day (started the evening before or after midnight)
function findDaySleep(dayStr){
  const s0=dayStartOf(dayStr);
  return state.sessions.find(s=>s.taskId==='act:sleep' && s.end>s0 && s.start<s0+12*3600000 && s.start>=s0-16*3600000)||null;
}
function hmToMinOrNull(v){
  if(typeof v!=='string')return null;
  const m=v.trim().match(/^(\d{1,2}):(\d{2})$/); if(!m)return null;
  const h=+m[1],mn=+m[2]; if(h>23||mn>59)return null;
  return h*60+mn;
}
function saveSleep(dayStr,bedMin,wakeMin){
  const {start,end}=sleepRangeForDay(dayStr,bedMin,wakeMin);
  if(end<=start)throw new Error('ساعت بیدار شدن باید بعد از ساعت خوابیدن باشد');
  if(end-start>16*3600000)throw new Error('بازه‌ی خواب بیش از ۱۶ ساعت است؛ ساعت‌ها را چک کن');
  const s0=dayStartOf(dayStr);
  // Replace any previous sleep record for this night
  state.sessions=state.sessions.filter(s=>!(s.taskId==='act:sleep'&&s.start>=s0-16*3600000&&s.start<s0+12*3600000));
  const sess=upsertSession({id:uid(),taskId:'act:sleep',start,end,duration:Math.round((end-start)/1000),manual:true,activity:true});
  return sess;
}

// ---------- Raw JSON chat (for the daily review) ----------
function parseLooseJson(raw){
  if(!raw)throw new Error('پاسخ خالی هوش مصنوعی');
  let txt=String(raw).trim();
  const fence=txt.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if(fence)txt=fence[1].trim();
  const first=txt.indexOf('{'), last=txt.lastIndexOf('}');
  if(first>=0&&last>first)txt=txt.slice(first,last+1);
  return JSON.parse(txt);
}
async function geminiRawChat(systemText,userText,opts){
  opts=opts||{};
  const key=(state.settings.aiApiKey||'').trim();
  const model=(state.settings.aiModel||DEFAULT_AI_MODEL).trim();
  if(!key)throw new Error('کلید API در تنظیمات وارد نشده است.');
  const body={
    systemInstruction:{parts:[{text:systemText}]},
    contents:[{role:'user',parts:[{text:userText}]}],
    generationConfig:geminiGenerationConfig(opts.temperature==null?0.5:opts.temperature,opts.maxOutputTokens||1600)
  };
  const url='https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent?key='+encodeURIComponent(key);
  let res=null,data=null,lastErr='';
  for(let attempt=0;attempt<2;attempt++){
    try{
      res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      try{data=await res.json();}catch(e){data=null;}
      if(res.ok)break;
      lastErr=data?.error?.message||('HTTP '+res.status);
      if([503,500,504,429].includes(res.status)){await new Promise(r=>setTimeout(r,800*(attempt+1)));continue;}
      break;
    }catch(e){lastErr=e.message;await new Promise(r=>setTimeout(r,800*(attempt+1)));}
  }
  if(!res||!res.ok)throw new Error('خطای Gemini: '+(lastErr||'بدون پاسخ'));
  const cand=data?.candidates?.[0];
  const text=(cand?.content?.parts||[]).map(p=>p.text||'').join('').trim();
  if(!text)throw new Error('پاسخ متنی از مدل دریافت نشد ('+(cand?.finishReason||'?')+')');
  return text;
}

// ---------- Reply/quote helpers ----------
function msgPreview(m){
  if(m&&typeof m.text==='string')return m.text.replace(/\s+/g,' ').trim().slice(0,80);
  return '...';
}
function quoteHtml(m){
  if(!m||!m.quote)return '';
  const who=m.quote.role==='user'?'شما':'هوش مصنوعی';
  return `<div class="ai2-quote"><span class="q-who">${who}:</span><span class="q-tx">${aiEsc(m.quote.preview||'')}</span></div>`;
}

// ---------- Day metrics (the factual basis for review + dashboard) ----------
function dayMetrics(dateStr){
  const s0=dayStartOf(dateStr), s1=s0+86400000;
  const secByTask={}, secByAct={};
  state.sessions.forEach(s=>{
    if(s.end<=s0||s.start>=s1)return;
    const d=Math.max(0,Math.round((Math.min(s.end,s1)-Math.max(s.start,s0))/1000));
    if(d<=0)return;
    if(isActivityId(s.taskId))secByAct[s.taskId]=(secByAct[s.taskId]||0)+d;
    else secByTask[s.taskId]=(secByTask[s.taskId]||0)+d;
  });
  const dayTasks=state.tasks.filter(t=>t.date===dateStr);
  const tasks=dayTasks.map(t=>{
    const tv=taskLatestVibe(t);
    return {
      title:t.title, status:t.status,
      minutes:Math.round((secByTask[t.id]||0)/60),
      steps:isMultiStep(t)?(t.steps||[]).length:null,
      stepsDone:isMultiStep(t)?Math.min(t.step||0,(t.steps||[]).length):null,
      mood:tv?tv.mood:null, moodLabel:tv?vibeMood(tv.mood).fa:null,
      liked:tv?tv.mood>=4:null, disliked:tv?tv.mood<=2:null
    };
  }).filter(x=>x.status==='done'||x.minutes>0||x.status==='not_done'||x.status==='doing');
  const activities=Object.entries(secByAct).map(([id,sec])=>{
    const ref=sessionRefById(id);
    return {id,title:ref?ref.title:id,icon:ref?ref.icon:'',minutes:Math.round(sec/60)};
  }).sort((a,b)=>b.minutes-a.minutes);
  const vibeOfDay=state.vibeEntries.filter(e=>e.ts>=s0&&e.ts<s1);
  const avg=k=>vibeOfDay.length?Math.round(vibeOfDay.reduce((a,e)=>a+(e[k]||3),0)/vibeOfDay.length*10)/10:null;
  const done=dayTasks.filter(t=>t.status==='done').length;
  const notDone=dayTasks.filter(t=>t.status==='not_done').length;
  const focusMin=Object.values(secByTask).reduce((a,b)=>a+b,0)/60;
  const sleepMin=(secByAct['act:sleep']||0)/60;
  const dislikedMin=tasks.filter(t=>t.disliked).reduce((a,t)=>a+t.minutes,0);
  const likedMin=tasks.filter(t=>t.liked).reduce((a,t)=>a+t.minutes,0);
  // Composite "output" used for relative-to-self comparison
  const workScore=Math.round(focusMin + done*15);
  return {
    date:dateStr, focusMin:Math.round(focusMin), done, notDone, workScore,
    sleepMin:Math.round(sleepMin), dislikedMin, likedMin,
    habitsDone:state.habitLogs.filter(l=>l.date===dateStr).length,
    tasks, activities,
    vibe:{mood:avg('mood'),fatigue:avg('fatigue'),count:vibeOfDay.length,
      notes:vibeOfDay.filter(e=>e.note).map(e=>({mood:e.mood,moodLabel:vibeMood(e.mood).fa,fatigue:e.fatigue,task:e.taskTitle||null,note:e.note}))}
  };
}

// ---------- Deterministic score policy ----------
// Guarantees the user's rules, independent of model generosity:
//  - 100 is impossible (hard ceiling 92).
//  - Above 90 only when the day clearly beats the personal best (>25%).
//  - Equal/below the user's own trend locks the high bands even if the model
//    liked the day; the model text is still asked to encourage hard work.
//  - Empty/near-empty days stay low (low scores are easy to get).
function bestMetricsBefore(dateStr,lookbackDays){
  let best=null;
  for(let i=1;i<=(lookbackDays||120);i++){
    const m=dayMetrics(dateAddStr(dateStr,-i));
    if(m.workScore>0 && (!best||m.workScore>best.workScore))best=m;
  }
  return best;
}
function applyScorePolicy(rawScore,m,best){
  let score=Math.round(Number(rawScore));
  if(!Number.isFinite(score))score=0;
  score=Math.max(0,Math.min(99,score)); // 100 impossible at the very first clamp
  if(m.workScore<=2 && m.done===0)score=Math.min(score,35);
  else if(m.workScore<25)score=Math.min(score,55);
  if(!best||best.workScore<=0){
    score=Math.min(score,84); // no personal baseline yet -> exceptional band closed
  }else{
    const ratio=m.workScore/best.workScore;
    let cap;
    if(ratio>=1.25)cap=92;        // clearly beyond own best: still max 92, never 100
    else if(ratio>=1.10)cap=90;
    else if(ratio>1.0)cap=89;
    else cap=87;                  // equal or regression vs yourself: high scores locked
    score=Math.min(score,cap);
  }
  return score;
}

// ---------- Daily review lifecycle ----------
let reviewRunning=false;
const REVIEW_SYS=`تو داور منصف و مهربان «مرور روزانه» در اپلیکیشن برنامه‌ریزی Outtask هستی. هر شب یک روز کاربر را با تاریخچه‌ی خودش مقایسه می‌کنی و یک تحلیل کوتاه فارسی به‌همراه یک امتیاز می‌دهی.

قوانین امتیازدهی (خیلی مهم):
- معیار، پیشرفت کاربر نسبت به خودش است، نه یک استاندارد مطلق. امتیاز پایین گرفتن آسان است؛ امتیازهای بالا فقط وقتی‌اند که کاربر از رکورد شخصی خودش جلوتر رفته باشد.
- عدد ۱۰۰ اصلاً وجود ندارد و نباید پیشنهاد شود. امتیاز بالای ۹۰ به‌شدت کمیاب است و فقط برای روزی که به‌وضوح از بهترین روز قبلی بهتر بوده (حدود ۲۵٪ کار بیشتر).
- اگر کاربر زیاد کار کرده ولی نسبت به روزهای اوج خودش کمتر کار کرده، امتیاز باید پایین‌تر بیاید؛ اما در تحلیل حتماً اول قدردانی و تشویق کن: «زیاد زحمت کشیدی، ولی امتیاز فقط وقتی بالا می‌رود که نسبت به خودت جلوتر بروی».
- شرایط انسانی را در نظر بگیر: خستگی، حال بد، خواب کم، کارهای دوست‌نداشتنی (حس بد ثبت‌شده) فشار روز را سنگین‌تر می‌کنند و باید در تحلیل منعکس شوند؛ کارهای موردعلاقه (حس خوب) امتیاز کیفی دارند.
- لحن: صمیمی، صادق، کوتاه و امیدوارکننده؛ یک پاراگراف ۳ تا ۶ جمله‌ای. از ایموجی خیلی کم استفاده کن.

فقط و فقط یک JSON خالص برگردان، بدون هیچ متن اضافه و بدون کدبلاک:
{"score": <عدد صحیح ۰ تا ۹۹>, "analysis": "متن تحلیل فارسی"}`;
async function runDailyReview(dateStr,opts){
  opts=opts||{};
  if(reviewRunning)return null;
  reviewRunning=true;
  try{renderDashboard();}catch(e){}
  try{
    const m=dayMetrics(dateStr);
    const y=dayMetrics(dateAddStr(dateStr,-1));
    const yy=dayMetrics(dateAddStr(dateStr,-2));
    const best=bestMetricsBefore(dateStr,120);
    const bestReview=state.dayReviews.filter(r=>r.date<dateStr).sort((a,b)=>b.score-a.score)[0]||null;
    const payload={
      reviewedDay:m,
      yesterday:y,
      dayBeforeYesterday:yy,
      personalBestByMetrics:best,
      highestScoredDaySoFar:bestReview?{date:bestReview.date,score:bestReview.score,metrics:bestReview.metrics||null}:null,
      scoringNotes:'score relative to the user\'s own history; 100 forbidden; 90+ only when reviewedDay.workScore beats personalBestByMetrics.workScore by roughly 25%; regression vs own trend lowers the score even on a hard-working day; always acknowledge effort in analysis.'
    };
    const raw=await geminiRawChat(REVIEW_SYS,JSON.stringify(payload,null,1),{temperature:0.5,maxOutputTokens:1400});
    let parsed; try{parsed=parseLooseJson(raw);}catch(e){parsed={score:m.workScore>0?70:40,analysis:raw.replace(/[{}"]/g,' ').trim()};}
    const score=applyScorePolicy(parsed.score,m,best);
    const analysis=String(parsed.analysis||parsed.text||'تحلیل دریافت نشد.').trim().slice(0,1200);
    const review={id:uid(),date:dateStr,score,analysis,ts:Date.now(),manual:!!opts.manual,
      metrics:{focusMin:m.focusMin,done:m.done,workScore:m.workScore,sleepMin:m.sleepMin,
        bestWorkScore:best?best.workScore:null,bestDate:best?best.date:null}};
    state.dayReviews=state.dayReviews.filter(r=>r.date!==dateStr);
    state.dayReviews.push(review);
    state.dayReviews.sort((a,b)=>a.date<b.date?1:-1);
    state.settings.lastReviewDate=dateStr;
    save();
    return review;
  }finally{
    reviewRunning=false;
    try{renderDashboard();}catch(e){}
  }
}
// Due day = latest day whose end hour has passed. Catch-up runs once at the next open.
function checkDailyReview(){
  try{
    let h=parseInt(state.settings.dayEndHour,10);
    if(!(h>=0&&h<=23))h=22;
    const now=new Date();
    const today=formatGregorian(now.getFullYear(),now.getMonth()+1,now.getDate());
    const nowMin=now.getHours()*60+now.getMinutes();
    const due=(nowMin>=h*60)?today:dateAddStr(today,-1);
    const wm=state.settings.lastReviewDate;
    if((!wm||wm<due)&&!reviewRunning){
      runDailyReview(due).catch(e=>console.warn('[daily review]',e&&e.message?e.message:e));
    }
  }catch(e){console.warn('[daily review] check failed',e);}
}

// ---------- Dashboard ----------
function scoreColor(s){
  if(s>=85)return '#7c83ff';
  if(s>=70)return '#27a644';
  if(s>=50)return '#f0a35e';
  return '#eb5757';
}
function scoreRingSvg(score,size){
  const r=(size||96)/2-9, c=2*Math.PI*r, pct=Math.max(0,Math.min(99,score))/100;
  return `<svg width="${size||96}" height="${size||96}" viewBox="0 0 ${size||96} ${size||96}">
    <circle cx="${(size||96)/2}" cy="${(size||96)/2}" r="${r}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="7"/>
    <circle cx="${(size||96)/2}" cy="${(size||96)/2}" r="${r}" fill="none" stroke="${scoreColor(score)}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${(c*pct).toFixed(1)} ${c.toFixed(1)}"/>
  </svg>`;
}
function renderDashboard(){
  const body=document.getElementById('dashBody'); if(!body)return;
  const todayStr=getRealTodayStr();
  const line=document.getElementById('dashDateLine');
  if(line){const j=toJalali(...todayStr.split('-').map(Number));line.textContent=todayStr+' • '+j.jd+' '+jMonthNames[j.jm-1];}
  const eh=document.getElementById('dayEndHourInput');
  if(eh)eh.value=(state.settings.dayEndHour==null?22:state.settings.dayEndHour);
  const m=dayMetrics(todayStr);
  const sleepH=(m.sleepMin/60);
  const reviews=state.dayReviews.slice().sort((a,b)=>a.date<b.date?1:-1);
  const avg=reviews.length?Math.round(reviews.slice(0,14).reduce((a,r)=>a+r.score,0)/Math.min(14,reviews.length)):null;
  const last=reviews[0]||null;
  let html=`<div class="dash-grid">
    <div class="db-card db-stat"><div class="db-stat-k">⏱ فوکوس امروز</div><div class="db-stat-v">${faNum(Math.floor(m.focusMin/60))}<small>h </small>${faNum(m.focusMin%60)}<small>m</small></div><div class="db-stat-s">فقط کارها؛ خواب و استراحت جدا است</div></div>
    <div class="db-card db-stat"><div class="db-stat-k">✅ کارهای انجام‌شده</div><div class="db-stat-v">${faNum(m.done)}</div><div class="db-stat-s">${faNum(m.notDone)} کار انجام‌نشده</div></div>
    <div class="db-card db-stat"><div class="db-stat-k">😴 خواب امروز</div><div class="db-stat-v">${faNum(sleepH.toFixed(1))}<small>h</small></div><div class="db-stat-s">از شب تا صبح ثبت‌شده</div></div>
    <div class="db-card db-stat"><div class="db-stat-k">📊 میانگین مرور (۱۴ روز)</div><div class="db-stat-v" ${avg!=null?'style="color:'+scoreColor(avg)+'"':''}>${avg==null?'—':faNum(avg)}</div><div class="db-stat-s">${reviews.length?faNum(reviews.length)+' مرور ثبت شده':'هنوز مروری انجام نشده'}</div></div>
  </div>`;

  if(reviewRunning){
    html+=`<div class="dr-hero"><div class="dr-running"><span class="db-spin"></span> در حال فرستادن روز به داور هوش مصنوعی… (کارهای امروز + دو روز قبل + درخشان‌ترین روزت)</div></div>`;
  }else if(last){
    const lj=toJalali(...last.date.split('-').map(Number));
    html+=`<div class="dr-hero">
      <div class="dr-ring">${scoreRingSvg(last.score)}<div class="dr-num" style="color:${scoreColor(last.score)}">${faNum(last.score)}<small>/۱۰۰</small></div></div>
      <div class="dr-meta">
        <div class="dr-date">مرور ${last.date===todayStr?'امروز':last.date+' • '+lj.jd+' '+jMonthNames[lj.jm-1]} ${last.manual?'<span class="pill" style="font-size:9px">دستی</span>':'<span class="pill" style="font-size:9px">خودکار</span>'}</div>
        <div class="dr-text">${aiEsc(last.analysis)}</div>
      </div>
    </div>`;
  }else{
    html+=`<div class="dr-empty">مرور خودکار روزانه هنوز اجرا نشده.<br>هر شب در «ساعت پایان روز» (تنظیم بالای همین صفحه یا تنظیمات ← ساعت مرور خودکار)، کارهای آن روز + دیروز + پریروز + درخشان‌ترین روزت برای هوش مصنوعی فرستاده می‌شود.<br>اگر برنامه بسته باشد، در اولین باز شدن بعد از آن ساعت به‌صورت خودکار اجرا می‌شود.<br><b>امتیاز نسبت به خودت سنجیده می‌شود؛ ۱۰۰ وجود ندارد و بالای ۹۰ خیلی کمیاب است.</b></div>`;
  }

  // 7-day work bars (best day highlighted)
  const days=[]; for(let i=6;i>=0;i--){const d=dateAddStr(todayStr,-i);days.push({d,mm:dayMetrics(d),rv:reviews.find(r=>r.date===d)});}
  const maxWork=Math.max(1,...days.map(x=>x.mm.workScore));
  const bestEver=reviews.slice().sort((a,b)=>b.score-a.score)[0]||null;
  html+=`<div class="dash-cols">
    <div class="db-card">
      <div class="db-card-h">هفت روز اخیر — حجم کار (فوکوس + کارهای تمام‌شده)</div>
      <div class="db-bars">${days.map(x=>{
        const h=Math.max(3,Math.round(90*x.mm.workScore/maxWork));
        const j=toJalali(...x.d.split('-').map(Number));
        return `<div class="db-barcol" title="${x.d}: ${faNum(x.mm.focusMin)} دقیقه فوکوس، ${faNum(x.mm.done)} کار تمام‌شده${x.rv?' • امتیاز '+faNum(x.rv.score):''}"><div class="db-barval">${x.rv?faNum(x.rv.score):''}</div><div class="db-bar${bestEver&&x.d===bestEver.date?' best':''}" style="height:${h}px"></div><div class="db-barlab">${faNum(j.jd)}</div></div>`;
      }).join('')}</div>
      ${bestEver?`<div class="db-note" style="margin-top:8px;font-size:10.5px;color:var(--fog)">درخشان‌ترین روز: ${bestEver.date} با امتیاز ${faNum(bestEver.score)}</div>`:''}
    </div>
    <div class="db-card">
      <div class="db-card-h">تاریخچه‌ی مرورها</div>
      <div id="reviewHistory" style="max-height:300px;overflow:auto">${reviews.length?reviews.slice(0,30).map((r,i)=>{
        const j=toJalali(...r.date.split('-').map(Number));
        return `<div class="dr-item${i===0?' open':''}">
          <div class="dr-item-top">
            <div class="dr-score" style="color:${scoreColor(r.score)};background:${scoreColor(r.score)}22">${faNum(r.score)}</div>
            <div class="dr-when">${r.date} • ${j.jd+' '+jMonthNames[j.jm-1]}</div>
            <button class="dr-toggle" type="button">${i===0?'بستن':'خواندن'}</button>
          </div>
          <div class="dr-body">${aiEsc(r.analysis)}</div>
        </div>`;
      }).join(''):'<div class="muted" style="font-size:11.5px;padding:8px 2px">مروری ثبت نشده است.</div>'}</div>
    </div>
  </div>`;
  body.innerHTML=html;
  body.querySelectorAll('.dr-toggle').forEach(btn=>btn.addEventListener('click',()=>{
    const item=btn.closest('.dr-item'); const open=item.classList.toggle('open');
    btn.textContent=open?'بستن':'خواندن';
  }));
}
function initDashboard(){
  const renderOrWarn=()=>{try{renderDashboard();}catch(e){}};
  document.getElementById('dayEndHourInput')?.addEventListener('change',(e)=>{
    let v=parseInt(e.target.value,10); if(!(v>=0&&v<=23))v=22;
    state.settings.dayEndHour=v;save();e.target.value=v;renderOrWarn();
  });
  document.getElementById('dashReviewBtn')?.addEventListener('click',async()=>{
    if(reviewRunning)return;
    try{
      const today=getRealTodayStr();
      await runDailyReview(today,{manual:true});
    }catch(e){
      renderDashboard();
      const body=document.getElementById('dashBody');
      if(body)body.insertAdjacentHTML('afterbegin',`<div class="dr-empty" style="border-color:rgba(235,87,87,.4);color:#ff8f8f;margin-bottom:10px">مرور انجام نشد: ${aiEsc(e.message)}</div>`);
    }
  });
  renderOrWarn();
}
function initDayEndHourSettings(){
  const inp=document.getElementById('dayEndHourSettings');
  if(!inp)return;
  inp.value=(state.settings.dayEndHour==null?22:state.settings.dayEndHour);
  document.getElementById('saveDayEndHour')?.addEventListener('click',()=>{
    let v=parseInt(inp.value,10); if(!(v>=0&&v<=23))v=22;
    state.settings.dayEndHour=v;save();inp.value=v;
    const st=document.getElementById('dayEndHourStatus');
    if(st){st.textContent='✅ ذخیره شد؛ مرور خودکار ساعت '+faNum(String(v).padStart(2,'0'))+':۰۰ اجرا می‌شود.';st.style.color='var(--green)';}
    renderDashboard();
  });
}

// ---------- AI tool extensions (activities in time tools) ----------
function aiResolveActivityArg(args){
  const name=(args&&(args.activity||args.activityName)||'').toString().trim();
  return name?resolveActivityRef(name):null;
}
function aiLogSessionForTarget(targetId,dateStr,startHM,endHM){
  const ref=sessionRefById(targetId); if(!ref)throw new Error('تسک یا فعالیت پیدا نشد');
  if(!validHM(startHM)||!validHM(endHM))throw new Error('فرمت ساعت باید HH:MM باشد');
  if(targetId==='act:sleep'){
    // saveSleep applies the wake-day convention and replaces the night's previous record
    return {sess:saveSleep(dateStr,hmToMin(startHM),hmToMin(endHM)),ref};
  }
  const st=combineDateMin(dateStr,hmToMin(startHM)); let en=combineDateMin(dateStr,hmToMin(endHM));
  if(en<=st)en+=24*3600*1000;
  const dur=Math.round((en-st)/1000);
  if(dur<=0)throw new Error('مدت نامعتبر');
  if(dur>24*3600)throw new Error('بیشتر از ۲۴ ساعت');
  const sess=upsertSession({id:uid(),taskId:targetId,start:st,end:en,duration:dur,manual:true,activity:ref.kind==='activity'||undefined});
  recomputeAllTimeSpent();
  return {sess,ref};
}

// ===================== HABITS (recurring tasks, bullet-journal tracker) =====================
// Icon catalog — Material/Flutter-style single SVGs; users pick icons only via AI.
const HABIT_ICONS={
  check_circle:{fa:'تیک',cat:'عمومی',svg:'<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>'},
  repeat:{fa:'تکرار',cat:'عمومی',svg:'<path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>'},
  star:{fa:'ستاره',cat:'عمومی',svg:'<path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>'},
  book:{fa:'کتاب',cat:'یادگیری',svg:'<path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>'},
  language:{fa:'زبان',cat:'یادگیری',svg:'<path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"/>'},
  school:{fa:'تحصیل',cat:'یادگیری',svg:'<path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>'},
  write:{fa:'نوشتن',cat:'یادگیری',svg:'<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.996.996 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>'},
  code:{fa:'برنامه‌نویسی',cat:'یادگیری',svg:'<path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4 1.4z"/>'},
  music:{fa:'موسیقی',cat:'ذهن',svg:'<path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>'},
  headphones:{fa:'پادکست',cat:'ذهن',svg:'<path d="M12 3c-4.97 0-9 4.03-9 9v7c0 1.1.9 2 2 2h4v-8H5v-1c0-3.87 3.13-7 7-7s7 3.13 7 7v1h-4v8h4c1.1 0 2-.9 2-2v-7c0-4.97-4.03-9-9-9z"/>'},
  paint:{fa:'نقاشی',cat:'ذهن',svg:'<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.1 0 2-.9 2-2 0-.51-.2-.97-.52-1.33-.33-.36-.52-.84-.52-1.33 0-1.1.9-2 2-2h2.36c3.01 0 5.68-2.05 5.68-5.14C23.52 5.44 18.26 2 12 2zm0 11c-.83 0-1.5-.67-1.5-1.5S11.17 10 12 10s1.5.67 1.5 1.5S12.83 13 12 13zm-3-4c-.83 0-1.5-.67-1.5-1.5S8.17 6 9 6s1.5.67 1.5 1.5S9.83 9 9 9zm6 0c-.83 0-1.5-.67-1.5-1.5S14.17 6 15 6s1.5.67 1.5 1.5S15.83 9 15 9zM17.5 9c-.83 0-1.5-.67-1.5-1.5S16.67 6 17.5 6s1.5.67 1.5 1.5S18.33 9 17.5 9z"/>'},
  meditation:{fa:'مدیتیشن',cat:'ذهن',svg:'<path d="M12 2C8.9 2 6 4.9 6 8c0 .3.02.6.07.89C6.03 8.91 6 8.96 6 9c-2.21 0-4 1.79-4 4 0 1.66 1 3.1 2.53 3.71C5.34 19.05 8.48 21 12 21s6.66-1.95 7.47-4.29C21 16.1 22 14.66 22 13c0-2.21-1.79-4-4-4 0-.04-.03-.09-.07-.11.05-.29.07-.59.07-.89 0-3.1-2.9-6-6-6zm-5 8.5c0-.17 0-.33.03-.5.34-2 2.04-3.5 4.06-3.33C13.13 6.84 14.5 8.34 14.5 10v.5h-7.5z"/>'},
  heart:{fa:'سلامت',cat:'سلامتی',svg:'<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>'},
  water:{fa:'آب',cat:'سلامتی',svg:'<path d="M12 2c-3.7 4.6-7 8.3-7 11.7C5 17.8 8.1 21 12 21s7-3.2 7-7.3c0-3.4-3.3-7.1-7-11.7zm0 17c-2.2 0-4-1.5-4-3.8 0-.6.1-1 .2-1l.8.1c0 .8.3 1.5.7 2l.7-.7c-.3-.4-.4-.9-.4-1.4 0-1.4 1.1-2.5 2-3.7.8 1.2 2 2.4 2 3.7 0 2.5-1.1 4.8-2 4.8z"/>'},
  run:{fa:'دویدن',cat:'سلامتی',svg:'<path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z"/>'},
  fitness:{fa:'تمرین',cat:'سلامتی',svg:'<path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"/>'},
  food:{fa:'غذا',cat:'سلامتی',svg:'<path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/>'},
  coffee:{fa:'قهوه',cat:'سلامتی',svg:'<path d="M2 21h18v-2H2v2zm16-8c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2H4v6c0 2.21 1.79 4 4 4h6c1.1 0 2-.9 2-2zM4 5V3H2v2h2zm16 6c0 .55-.45 1-1 1h-1V7h1c.55 0 1 .45 1 1v3zM18 3h2v2h-2V3z"/>'},
  sleep:{fa:'خواب',cat:'سلامتی',svg:'<path d="M12.34 2c-.44 0-.88.03-1.31.08C5.04 2.95.83 7.75 1.94 13.74c.71 3.86 3.77 6.92 7.63 7.63 5.99 1.11 10.79-3.1 11.66-9.09.22-1.55.05-3.02-.45-4.35-.82.9-2.06 1.49-3.45 1.49-2.49 0-4.5-2.01-4.5-4.5 0-1.39.59-2.63 1.49-3.45-.62-.32-1.27-.47-1.98-.47z"/>'},
  pill:{fa:'دارو',cat:'سلامتی',svg:'<path d="M4.22 11.29l7.07-7.07c1.56-1.56 4.1-1.56 5.66 0 1.56 1.56 1.56 4.1 0 5.66l-7.07 7.07c-1.56 1.56-4.1 1.56-5.66 0-1.57-1.56-1.57-4.09 0-5.66zm12.73 1.41l1.41-1.41c.78.78.78 2.05 0 2.83-.39.39-1.02.39-1.41 0l-1.42-1.41 1.42-1.41zM6.34 13.41l4.25 4.24-1.42 1.42c-.78.78-2.04.78-2.82 0-.79-.78-.79-2.05 0-2.83l-.01-.83z"/>'},
  bolt:{fa:'انرژی',cat:'سلامتی',svg:'<path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34.05-.08.07-.12C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C12.96 17.55 11 21 11 21z"/>'},
  work:{fa:'کار',cat:'زندگی',svg:'<path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.1 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>'},
  wallet:{fa:'پس‌انداز',cat:'زندگی',svg:'<path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>'},
  people:{fa:'خانواده',cat:'زندگی',svg:'<path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>'},
  pet:{fa:'حیوان',cat:'زندگی',svg:'<path d="M4.5 9.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5S6 11.83 6 11s-.67-1.5-1.5-1.5zm15 0c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zM12 10c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm-7.5-1C3.12 9 2 10.12 2 11.5S3.12 14 4.5 14c.21 0 .42-.03.62-.07C5.66 15.39 7.68 17.5 12 17.5s6.34-2.11 6.88-3.57c.2.04.41.07.62.07 1.38 0 2.5-1.12 2.5-2.5S20.88 9 19.5 9c-1.55 0-2.46.88-2.61 1.02-.64.58-1.86 1.98-4.89 1.98s-4.25-1.4-4.89-1.98C6.96 9.88 6.05 9 4.5 9z"/>'},
  sun:{fa:'صبح',cat:'زندگی',svg:'<path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0a.996.996 0 000-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>'},
  home:{fa:'خانه',cat:'زندگی',svg:'<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>'}
};
const HABIT_ICON_KEYS=Object.keys(HABIT_ICONS);
function habitIconSvg(key,size){return `<svg viewBox="0 0 24 24" width="${size||18}" height="${size||18}" fill="currentColor">${(HABIT_ICONS[key]||HABIT_ICONS.check_circle).svg}</svg>`;}

const HABIT_REPEAT_FA={daily:'هر روز',weekly:'هفتگی',monthly:'ماهانه'};
const HABIT_WEEKMODE_FA={workdays:'روزهای کاری',weekend:'آخر هفته',custom:'انتخابی'};
// Keyword-based icon suggestion (used for habits created without an AI-chosen icon)
const HABIT_ICON_RULES=[
  ['water',['آب','water','hydrat','نوشیدن']],
  ['coffee',['قهوه','coffee','کافه']],
  ['food',['غذا','صبحانه','ناهار','شام','میوه','food','meal','eat','ناشتا']],
  ['sleep',['خواب','sleep','بیدار']],
  ['run',['دویدن','پیاده','راه رفتن','run','walk','jog']],
  ['fitness',['ورزش','تمرین','باشگاه','بدنسازی','fitness','gym','workout','اسکات','شنا']],
  ['meditation',['مدیتیشن','یوگا','مدیتیشن','آرامش','تنفس','meditat','yoga','mindful']],
  ['pill',['دارو','قرص','ویتامین','medicin','pill','drug']],
  ['school',['مدرسه','کلاس','آموزش','درس','تکلیف','school','class','lesson','homework']],
  ['write',['نوشتن','خاطرات','دفترچه','یادداشت روزانه','write','journal','diary']],
  ['book',['مطالعه','کتاب','دانشگاه','read','book','study']],
  ['language',['زبان','انگلیسی','language','english']],
  ['code',['کد','برنامه‌نویسی','برنامه نویسی','code','program']],
  ['music',['موسیقی','ساز','گیتار','پیانو','music']],
  ['headphones',['پادکست','هدفون','podcast']],
  ['paint',['نقاشی','طراحی','رنگ','paint','draw','art']],
  ['heart',['قلب','عشق','محبت','heart','love']],
  ['work',['کار','work','شغل']],
  ['wallet',['پس‌انداز','پس انداز','پول','هزینه','مالی','money','savings','wallet']],
  ['people',['خانواده','دوست','people','family','friend']],
  ['pet',['حیوان','گربه','سگ','pet','cat','dog']],
  ['sun',['صبح','sun','morning']],
  ['home',['خانه','نظافت','home','clean']],
  ['bolt',['عادت','stop','bolt']]
];
function suggestHabitIcon(title){
  const t=String(title||'').toLowerCase();
  for(const [icon,words] of HABIT_ICON_RULES){if(words.some(w=>t.includes(w.toLowerCase())))return icon;}
  return 'check_circle';
}
function ensureSleepHabit(){
  if(!Array.isArray(state.habits)) state.habits=[];
  // Remove duplicate legacy خواب habits that are not builtin
  const hasBuiltin=state.habits.some(h=>h.id===SLEEP_HABIT_ID);
  if(!hasBuiltin){
    // If there is a legacy habit titled خواب, convert its id
    const legacy=state.habits.find(h=>h.title&&String(h.title).trim()==='خواب');
    if(legacy){
      legacy.id=SLEEP_HABIT_ID;
    }else{
      state.habits.push({id:SLEEP_HABIT_ID,title:'خواب',icon:'sleep',color:SLEEP_COLOR,repeat:'daily',normal:true,createdAt:0});
    }
  }
  // Normalize builtin to canonical values
  state.habits=state.habits.map(h=>{
    if(h.id===SLEEP_HABIT_ID){
      h.title='خواب';h.icon='sleep';h.color=SLEEP_COLOR;h.repeat='daily';h.weekMode='workdays';h.repeatDays=[];h.monthDays=[];h.normal=true;h.timeOn=false;h.archived=false;h.lines=2;
      if(!Number.isFinite(h.createdAt)||h.createdAt>1) h.createdAt=0;
    }
    return h;
  });
}
function normalizeHabit(h){
  h=h||{};
  if(h.id===SLEEP_HABIT_ID){
    return {
      id:SLEEP_HABIT_ID,
      title:'خواب',
      icon:'sleep',
      color:SLEEP_COLOR,
      lines:2,
      repeat:'daily',
      weekMode:'workdays',
      repeatDays:[],
      monthDays:[],
      normal:true,
      timeOn:false,
      winStart:Number.isFinite(h.winStart)?h.winStart:7*60,
      winEnd:Number.isFinite(h.winEnd)?h.winEnd:14*60,
      createdAt:Number.isFinite(h.createdAt)?h.createdAt:0,
      archived:false
    };
  }
  // Migrate v1.8.4 schedule: daily / weekdays / weekly(creation dow) / custom(days)
  let repeat=h.repeat,weekMode=h.weekMode,repeatDays=Array.isArray(h.repeatDays)?h.repeatDays:[];
  if(!['daily','weekly','monthly'].includes(repeat)){
    if(repeat==='weekdays'){repeat='weekly';weekMode='workdays';repeatDays=[];}
    else if(repeat==='custom'){repeat='weekly';weekMode='custom';}
    else repeat='daily';
  }
  // legacy weekly = "same weekday as creation"; keep via custom + creation dow
  if(repeat==='weekly'&&!['workdays','weekend','custom'].includes(weekMode)&&!(Array.isArray(h.repeatDays)&&h.repeatDays.length)){
    weekMode='custom';
    const cd=h.createdAt?new Date(h.createdAt).getDay():new Date().getDay();
    repeatDays=[cd];
  }
  if(repeat==='weekly'){
    if(!['workdays','weekend','custom'].includes(weekMode))weekMode=repeatDays&&repeatDays.length?'custom':'workdays';
  } else weekMode='workdays';
  const monthDays=[...new Set((Array.isArray(h.monthDays)?h.monthDays:[]).map(Number).filter(d=>d>=1&&d<=31))].sort((a,b)=>a-b);
  return {
    id:h.id||uid(),
    title:String(h.title||'عادت جدید').slice(0,200),
    icon:HABIT_ICONS[h.icon]?h.icon:suggestHabitIcon(h.title),
    color:PALETTE.includes(h.color)||h.color===SLEEP_COLOR?h.color:'#6fc3d3',
    lines:[1,2,3,4].includes(h.lines)?h.lines:2,
    repeat,                       // daily | weekly | monthly
    weekMode,                     // workdays | weekend | custom (weekly only)
    repeatDays:repeatDays.map(Number).filter(d=>d>=0&&d<=6), // JS getDay, weekly custom
    monthDays,                    // 1..31, monthly
    normal:!!h.normal,            // عادت عادی: hidden from calendar/tasks, but still hatched on the clock
    timeOn:!!h.timeOn,
    winStart:Number.isFinite(h.winStart)?h.winStart:7*60,
    winEnd:Number.isFinite(h.winEnd)?h.winEnd:14*60,
    createdAt:Number.isFinite(h.createdAt)?h.createdAt:Date.now(),
    archived:!!h.archived
  };
}
function hashStr(str){let h=0;for(let i=0;i<str.length;i++)h=(h*31+str.charCodeAt(i))>>>0;return h;}
function addDaysStr(dateStr,delta){const p=parseGregorian(dateStr);const d=new Date(p.y,p.m-1,p.d+delta);return formatGregorian(d.getFullYear(),d.getMonth()+1,d.getDate());}
function forEachDateStr(center,before,after,fn){for(let i=before;i<=after;i++)fn(addDaysStr(center,i));}
function habitActiveOn(h,dateStr){
  if(h.archived)return false;
  const p=parseGregorian(dateStr);if(!p)return false;
  if(h.id===SLEEP_HABIT_ID) return true;
  const cd=new Date(h.createdAt||0),cds=formatGregorian(cd.getFullYear(),cd.getMonth()+1,cd.getDate());
  if(dateStr<cds)return false;
  if(h.repeat==='daily')return true;
  if(h.repeat==='monthly')return Array.isArray(h.monthDays)&&h.monthDays.includes(p.d);
  // weekly + week mode
  const dow=new Date(p.y,p.m-1,p.d).getDay();
  if(h.weekMode==='workdays')return dow!==5;          // Sat–Thu, Friday off
  if(h.weekMode==='weekend')return dow===5;           // Friday weekend
  return (h.repeatDays||[]).includes(dow);            // custom weekdays
}
const habitTaskId=(h,dateStr)=>'hb:'+h.id+':'+dateStr;

// Materialize habit occurrence tasks (recurring copies) over a rolling window
function syncHabitOccurrences(){
  const today=getRealTodayStr();let changed=0;
  const inWindow=ds=>{const p=parseGregorian(ds),t=parseGregorian(today);const diff=Math.round((new Date(p.y,p.m-1,p.d)-new Date(t.y,t.m-1,t.d))/864e5);return diff>=-42&&diff<=21;};
  forEachDateStr(today,-42,21,dateStr=>{
    state.habits.filter(h=>!h.normal&&habitActiveOn(h,dateStr)).forEach(h=>{
      const id=habitTaskId(h,dateStr);
      let t=state.tasks.find(x=>x.id===id);
      if(!t){
        t={id,title:h.title,date:dateStr,status:'todo',completed:false,color:h.color,lines:h.lines,createdAt:h.createdAt,folderId:null,timeSpent:0,habitId:h.id,habitIcon:h.icon,isHabit:true};
        state.tasks.push(t);changed++;
      }else{
        if(t.title!==h.title||t.color!==h.color||t.lines!==h.lines||t.habitIcon!==h.icon||!t.isHabit){t.title=h.title;t.color=h.color;t.lines=h.lines;t.habitIcon=h.icon;t.isHabit=true;changed++;}
      }
      syncOccurrenceStatus(h,dateStr);
    });
  });
  // remove occurrences that no longer fit (deleted/normal habit / changed schedule)
  state.tasks=state.tasks.filter(t=>{
    if(!t.isHabit)return true;
    const h=state.habits.find(x=>x.id===t.habitId);
    if(!h||h.normal||h.archived||!inWindow(t.date)||!habitActiveOn(h,t.date)){changed++;return false;}
    return true;
  });
  return changed;
}

// ---------- logs / progress ----------
function habitLogRaw(h,dateStr){return state.habitLogs.find(l=>l.habitId===h.id&&l.date===dateStr);}
function habitSessionsMinutes(h,dateStr){
  const tid=habitTaskId(h,dateStr);
  return Math.round(state.sessions.filter(s=>s.taskId===tid).reduce((a,s)=>a+(s.duration||0)/60,0));
}
function habitMinutes(h,dateStr){
  if(h.id===SLEEP_HABIT_ID){
    const sl=findDaySleep(dateStr);
    return sl?Math.round((sl.duration||0)/60):0;
  }
  const l=habitLogRaw(h,dateStr);return (l?.minutes||0)+habitSessionsMinutes(h,dateStr);
}
function habitDone(h,dateStr){
  if(h.id===SLEEP_HABIT_ID){
    try{return !!findDaySleep(dateStr);}catch(e){return false;}
  }
  const l=habitLogRaw(h,dateStr);return !!(l&&(l.count>0||(l.minutes||0)>0));
}
function habitProgress(h,dateStr){return habitDone(h,dateStr)?1:0;} // 0/1 per day
function habitGoalForDay(h){return 1;} // goals removed; a day is either done or not
function habitDayState(h,dateStr){return habitDone(h,dateStr)?'done':'';}
function periodDates(period,ref){
  ref=ref||getRealTodayStr();const p=parseGregorian(ref);const d0=new Date(p.y,p.m-1,p.d);
  const dates=[];
  if(period==='day')return [ref];
  if(period==='week'){ // Saturday..Friday (Iran work week)
    const dow=d0.getDay();const off=dow===6?0:dow+1;
    const sat=new Date(d0);sat.setDate(d0.getDate()-off);
    for(let i=0;i<7;i++){const d=new Date(sat);d.setDate(sat.getDate()+i);dates.push(formatGregorian(d.getFullYear(),d.getMonth()+1,d.getDate()));}
    return dates;
  }
  // month: current Gregorian month
  const days=getDaysInGregorianMonth(p.y,p.m);
  for(let i=1;i<=days;i++)dates.push(formatGregorian(p.y,p.m,i));
  return dates;
}
function periodActiveCount(h,period,ref){return periodDates(period,ref).filter(d=>habitActiveOn(h,d)).length;}
function periodDoneCount(h,period,ref){return periodDates(period,ref).filter(d=>habitActiveOn(h,d)&&habitDone(h,d)).length;}
function periodProgress(h,period,ref){return periodDoneCount(h,period,ref);}
function periodGoal(h,period,ref){ // active cells in the period (the new "target")
  return Math.max(1,periodActiveCount(h,period,ref));
}
function habitStreak(h){
  const today=getRealTodayStr();let n=0;
  for(let i=0;i<365;i++){
    const ds=addDaysStr(today,-i);
    if(habitActiveOn(h,ds)){
      if(habitDone(h,ds))n++;
      else if(i>0)break; // today not done yet does not break streak
    }
  }
  return n;
}
function deleteDaySleep(dayStr){
  const s0=dayStartOf(dayStr);
  state.sessions=state.sessions.filter(s=>!(s.taskId==='act:sleep'&&s.start>=s0-16*3600000&&s.start<s0+12*3600000));
}
function setHabitDone(h,dateStr,done){
  if(dateStr>getRealTodayStr())return;
  if(h.id===SLEEP_HABIT_ID){
    if(!done){
      deleteDaySleep(dateStr);
      save();renderHabits();try{renderCalendar();}catch(e){}try{renderPlansList(true);drawClock();renderSessions();}catch(e){}renderTasks();
    }
    return;
  }
  let l=habitLogRaw(h,dateStr);
  if(done){
    if(!l){l={id:uid(),habitId:h.id,date:dateStr,count:1,minutes:0};state.habitLogs.push(l);}
    else{l.count=Math.max(1,l.count||0);l.minutes=l.minutes||0;}
  }else{
    if(l){l.count=0;l.minutes=0;}
  }
  syncOccurrenceStatus(h,dateStr);
  save();renderHabits();renderTasks();try{renderCalendar();}catch(e){}try{renderPlansList(true);drawClock();}catch(e){}
}
function bumpHabitLog(h,dateStr){
  if(h.id===SLEEP_HABIT_ID){
    if(habitDone(h,dateStr)) setHabitDone(h,dateStr,false);
    return;
  }
  setHabitDone(h,dateStr,!habitDone(h,dateStr));
}
function syncOccurrenceStatus(h,dateStr){
  const t=state.tasks.find(x=>x.id===habitTaskId(h,dateStr));if(!t)return;
  if(habitDone(h,dateStr)){t.status='done';t.completed=true;}
  else if(t.status==='done'||t.status==='doing'){t.status='todo';t.completed=false;}
}
function syncAllOccurrenceStatus(){
  state.habits.filter(h=>!h.normal).forEach(h=>forEachDateStr(getRealTodayStr(),-42,0,ds=>{if(habitActiveOn(h,ds))syncOccurrenceStatus(h,ds);}));
}

// ---------- derived (virtual) plans on the clock ----------
function habitPlanStubs(dateStr){
  const stubs=[];
  // shortest windows are most constrained — place them first, long flexible windows shrink around.
  // Normal (routine) habits also hatch on the clock — they are hidden only from calendar/tasks.
  const active=state.habits.filter(h=>!h.archived&&h.timeOn&&habitActiveOn(h,dateStr))
    .sort((a,b)=>(a.winEnd-a.winStart)-(b.winEnd-b.winStart)||(a.winStart-b.winStart)||(a.createdAt-b.createdAt));
  // explicit (AI/user) plans always win the space
  const occupied=state.plans.filter(p=>p.date===dateStr).map(p=>[p.startMin,p.endMin]);
  active.forEach(h=>{
    if(!(h.winEnd>h.winStart))return;
    // the scheduled block covers the WHOLE window (e.g. school 07:00–14:00)
    let start=h.winStart,end=h.winEnd;
    for(let guard=0;guard<12;guard++){
      const clash=occupied.find(([a,b])=>start<b&&end>a);
      if(!clash)break;
      start=Math.max(start,clash[1]); // shrink from the left around earlier blocks
      if(start>=end){start=h.winStart;end=h.winEnd;break;} // unavoidable overlap: show honestly
    }
    occupied.push([start,end]);
    stubs.push({id:'hbp:'+h.id+':'+dateStr,title:h.title,date:dateStr,startMin:start,endMin:end,color:h.color,taskId:habitTaskId(h,dateStr),habitId:h.id,habitIcon:h.icon,normal:!!h.normal,stub:true});
  });
  return stubs;
}
function plansForDate(dateStr){return [...state.plans.filter(p=>p.date===dateStr),...habitPlanStubs(dateStr)];}

// ---------- task/habit modal ----------
let tmState=null;
function defaultTmState(){return {mode:'task',color:state.quickColor||PALETTE[2],lines:2,
  repeat:'daily',weekMode:'workdays',repeatDays:[6,0,1,2,3,4],monthDays:[],
  normal:false,timeOn:false,winStart:'07:00',winEnd:'14:00',
  icon:null,iconTouched:false,editHabitId:null};}
function openTaskModal(mode,habit){
  tmState=defaultTmState();
  if(habit){tmState.mode='habit';Object.assign(tmState,{
    editHabitId:habit.id,title:habit.title,color:habit.color,lines:habit.lines,icon:habit.icon,iconTouched:true,
    repeat:habit.repeat,weekMode:habit.weekMode||'workdays',repeatDays:[...(habit.repeatDays||[])],monthDays:[...(habit.monthDays||[])],
    normal:!!habit.normal,timeOn:!!habit.timeOn,
    winStart:minToHM(habit.winStart),winEnd:minToHM(habit.winEnd)
  });}
  else if(mode==='habit')tmState.mode='habit';
  document.getElementById('tmTitle').value=tmState.title||'';
  drawTmColors();
  segSet('tmTypeSeg','data-type',tmState.mode);
  segSet('tmPrioSeg','data-prio',String(tmState.lines));
  segSet('tmRepeatSeg','data-repeat',tmState.repeat);
  segSet('tmWeekModeSeg','data-wmode',tmState.weekMode);
  buildTmDayChips();
  buildTmMonthChips();
  document.getElementById('tmNormal').checked=tmState.normal;
  document.getElementById('tmTimeOn').checked=tmState.timeOn;
  document.getElementById('tmWinStart').value=tmState.winStart;
  document.getElementById('tmWinEnd').value=tmState.winEnd;
  updateTmHabitUI();
  document.getElementById('taskModal').classList.add('show');
  setTimeout(()=>document.getElementById('tmTitle').focus(),60);
}
function closeTaskModal(){document.getElementById('taskModal')?.classList.remove('show');}
function segSet(segId,attr,val){
  document.querySelectorAll('#'+segId+' button').forEach(b=>b.classList.toggle('active',b.getAttribute(attr)===String(val)));
}
function segGet(segId,attr){const b=document.querySelector('#'+segId+' button.active');return b?b.getAttribute(attr):null;}
function drawTmColors(){
  const box=document.getElementById('tmColors');if(!box)return;box.innerHTML='';
  PALETTE.forEach(c=>{
    const b=document.createElement('button');b.type='button';b.className='tm-dot'+(c===tmState.color?' active':'');
    b.style.background=c;b.title=c;
    b.addEventListener('click',()=>{tmState.color=c;drawTmColors();});
    box.appendChild(b);
  });
}
function buildTmDayChips(){
  const box=document.getElementById('tmDayChips');if(!box)return;box.innerHTML='';
  const days=[{d:6,n:'شنبه'},{d:0,n:'یک'},{d:1,n:'دو'},{d:2,n:'سه'},{d:3,n:'چهار'},{d:4,n:'پنج'},{d:5,n:'جمعه'}];
  days.forEach(({d,n})=>{
    const b=document.createElement('button');b.type='button';
    b.className='weekday-chip'+(tmState.repeatDays.includes(d)?' active':'');
    b.textContent=n;b.dataset.day=d;
    b.addEventListener('click',()=>{
      const i=tmState.repeatDays.indexOf(d);
      if(i>=0)tmState.repeatDays.splice(i,1);else tmState.repeatDays.push(d);
      b.classList.toggle('active');
    });
    box.appendChild(b);
  });
}
function buildTmMonthChips(){
  const box=document.getElementById('tmMonthChips');if(!box)return;box.innerHTML='';
  for(let d=1;d<=31;d++){
    const b=document.createElement('button');b.type='button';
    b.className='monthday-chip'+(tmState.monthDays.includes(d)?' active':'');
    b.textContent=faNum(d);b.dataset.day=d;
    b.addEventListener('click',()=>{
      const i=tmState.monthDays.indexOf(d);
      if(i>=0)tmState.monthDays.splice(i,1);else tmState.monthDays.push(d);
      b.classList.toggle('active');
    });
    box.appendChild(b);
  }
}
function tmPreviewIcon(){
  if(tmState.iconTouched&&tmState.icon)return tmState.icon;
  return suggestHabitIcon(document.getElementById('tmTitle')?.value||'');
}
function updateTmHabitUI(){
  const block=document.getElementById('tmHabitBlock');
  block.classList.toggle('show',tmState.mode==='habit');
  const repeat=segGet('tmRepeatSeg','data-repeat');
  const wmSeg=document.getElementById('tmWeekModeSeg');
  const wmode=segGet('tmWeekModeSeg','data-wmode')||'workdays';
  wmSeg.style.display=repeat==='weekly'?'flex':'none';
  document.getElementById('tmDayChips').style.display=(repeat==='weekly'&&wmode==='custom')?'flex':'none';
  document.getElementById('tmMonthChips').style.display=repeat==='monthly'?'grid':'none';
  // normal habits still get clock blocks; only calendar/tasks are hidden
  document.getElementById('tmScheduleBox').style.display='block';
  document.getElementById('tmTimeBox').style.display=tmState.timeOn?'block':'none';
  // icon preview (auto-suggested from title unless AI set it)
  const ic=document.getElementById('tmIcon');
  ic.style.setProperty('--hb',tmState.color);
  ic.innerHTML=habitIconSvg(tmPreviewIcon(),17);
}
function saveTaskModal(){
  const title=document.getElementById('tmTitle').value.trim();
  if(!title){document.getElementById('tmTitle').focus();return;}
  tmState.title=title;tmState.lines=parseInt(segGet('tmPrioSeg','data-prio'))||2;
  if(tmState.mode==='task'){
    const viewDate=getCurrentViewDate();
    const task={id:uid(),title,status:'todo',completed:false,color:tmState.color,createdAt:Date.now(),folderId:null,timeSpent:0,lines:tmState.lines,date:viewDate};
    state.tasks.unshift(task);
    state.quickColor=tmState.color;
    save();renderTasks();renderTimeTasks();drawClock();
  }else{
    tmState.repeat=segGet('tmRepeatSeg','data-repeat');
    tmState.weekMode=segGet('tmWeekModeSeg','data-wmode')||'workdays';
    tmState.normal=document.getElementById('tmNormal').checked;
    tmState.timeOn=document.getElementById('tmTimeOn').checked;
    tmState.winStart=hmToMin(document.getElementById('tmWinStart').value)??420;
    tmState.winEnd=hmToMin(document.getElementById('tmWinEnd').value)??840;
    if(tmState.repeat==='weekly'&&tmState.weekMode==='custom'&&!tmState.repeatDays.length){alert('برای حالت انتخابی حداقل یک روز هفته انتخاب کن');return;}
    if(tmState.repeat==='monthly'&&!tmState.monthDays.length){alert('حداقل یک روز از ماه انتخاب کن');return;}
    if(tmState.timeOn&&tmState.winEnd<=tmState.winStart){alert('پایان بازه باید بعد از شروع باشد');return;}
    const icon=tmState.iconTouched&&tmState.icon?tmState.icon:suggestHabitIcon(tmState.title);
    const data={
      title:tmState.title,icon,color:tmState.color,lines:tmState.lines,
      repeat:tmState.repeat,weekMode:tmState.weekMode,repeatDays:tmState.repeatDays,monthDays:tmState.monthDays,
      normal:tmState.normal,timeOn:tmState.timeOn,winStart:tmState.winStart,winEnd:tmState.winEnd
    };
    if(tmState.editHabitId){
      const h=state.habits.find(x=>x.id===tmState.editHabitId);
      Object.assign(h,normalizeHabit({...h,...data}));
    }else{
      state.habits.push(normalizeHabit({...data,createdAt:Date.now()}));
    }
    syncHabitOccurrences();syncAllOccurrenceStatus();
    save();renderHabits();renderTasks();renderCalendar();renderPlansList(true);drawClock();
  }
  closeTaskModal();
}
function deleteHabit(h){
  if(h.id===SLEEP_HABIT_ID){alert('عادت خواب قابل حذف نیست');return;}
  if(!confirm('عادت «'+h.title+'» و رخدادهایش حذف شود؟'))return;
  state.habits=state.habits.filter(x=>x.id!==h.id);
  state.habitLogs=state.habitLogs.filter(l=>l.habitId!==h.id);
  state.tasks=state.tasks.filter(t=>t.habitId!==h.id);
  save();renderHabits();renderTasks();renderPlansList(true);drawClock();
}

// ---------- habits panel (bullet journal) ----------
let hbPeriod='day';
let hbMonthRef=null; // Gregorian YYYY-MM date anchor for the unified month calendar
function repeatLabel(h){
  if(h.repeat==='monthly'){
    if(!h.monthDays.length)return 'ماهانه';
    return 'روز '+h.monthDays.map(d=>faNum(d)).join('، ')+' ماه';
  }
  if(h.repeat==='weekly'){
    if(h.weekMode==='workdays')return 'هفتگی • روزهای کاری (شنبه تا پنجشنبه)';
    if(h.weekMode==='weekend')return 'هفتگی • آخر هفته (جمعه)';
    const fa={6:'شنبه',0:'یکشنبه',1:'دوشنبه',2:'سه‌شنبه',3:'چهارشنبه',4:'پنجشنبه',5:'جمعه'};
    const order=[6,0,1,2,3,4,5];
    return 'هفتگی • '+(h.repeatDays||[]).slice().sort((a,b)=>order.indexOf(a)-order.indexOf(b)).map(d=>fa[d]).join('، ');
  }
  return 'هر روز';
}
const HABIT_CHECK_SVG='<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
function renderHabits(){
  const list=document.getElementById('hbList'),empty=document.getElementById('hbEmpty');
  if(!list)return;list.innerHTML='';
  const hs=state.habits.filter(h=>!h.archived);
  if(empty)empty.style.display=hs.length?'none':'block';
  if(hbPeriod==='month'){list.appendChild(buildHabitMonthCalendar(hs));return;}
  hs.forEach(h=>list.appendChild(habitCard(h)));
}
function habitIconBtn(h,dateStr,size){
  const b=document.createElement('button');b.type='button';b.className='hb-icbtn';
  b.style.setProperty('--ic',h.color);
  const done=habitDone(h,dateStr);const future=dateStr>getRealTodayStr();const active=habitActiveOn(h,dateStr);
  b.innerHTML=done?HABIT_CHECK_SVG:habitIconSvg(h.icon,size||12);
  if(done){b.classList.add('done','state-ok');}
  else if(future){b.classList.add('future');}
  else if(dateStr<getRealTodayStr()&&active){b.classList.add('missed','state-miss');}
  b.title=h.title+' • '+(done?'انجام شد':(future?'آینده':(active?'ثبت انجام (انجام‌نشده)':'برنامه ندارد')));
  if(active&&!future)b.addEventListener('click',e=>{e.stopPropagation();bumpHabitLog(h,dateStr);});
  return b;
}
function buildHabitMonthCalendar(hs){
  const wrap=document.createElement('div');wrap.className='hb-month';
  if(!hbMonthRef)hbMonthRef=getRealTodayStr();
  const p=parseGregorian(hbMonthRef);
  const shift=n=>{const d=new Date(p.y,p.m-1+n,1);hbMonthRef=formatGregorian(d.getFullYear(),d.getMonth()+1,1);renderHabits();};
  const jMid=toJalali(p.y,p.m,15);
  const nav=document.createElement('div');nav.className='hb-month-nav';
  nav.innerHTML=`<button class="btn-ghost" type="button" data-mprev style="padding:6px 12px">ماه قبل</button>
    <div class="t">${gMonthNamesFa[p.m-1]} ${faNum(jMid.jy)} • ${gMonthNames[p.m-1]} ${faNum(p.y)}</div>
    <button class="btn-primary" type="button" data-mtoday style="padding:6px 12px">امروز</button>
    <button class="btn-ghost" type="button" data-mnext style="padding:6px 12px">ماه بعد</button>`;
  nav.querySelector('[data-mprev]').addEventListener('click',()=>shift(-1));
  nav.querySelector('[data-mnext]').addEventListener('click',()=>shift(1));
  nav.querySelector('[data-mtoday]').addEventListener('click',()=>{hbMonthRef=getRealTodayStr();renderHabits();});
  wrap.appendChild(nav);

  const grid=document.createElement('div');grid.className='hb-month-grid';
  ['ش','ی','د','س','چ','پ','ج'].forEach(n=>{const m=document.createElement('div');m.className='mh';m.textContent=n;grid.appendChild(m);});
  const days=getDaysInGregorianMonth(p.y,p.m);
  const lead=(new Date(p.y,p.m-1,1).getDay()+1)%7; // Saturday first
  for(let i=0;i<lead;i++){const b=document.createElement('div');b.className='mh';grid.appendChild(b);}
  const todayStr=getRealTodayStr();
  for(let d=1;d<=days;d++){
    const ds=formatGregorian(p.y,p.m,d);const j=toJalali(p.y,p.m,d);
    const cell=document.createElement('div');
    cell.className='hb-mday'+(ds===todayStr?' today':'')+(ds>todayStr?' future':'');
    const active=hs.filter(h=>habitActiveOn(h,ds));
    const head=document.createElement('div');head.className='dn';
    head.innerHTML=`<span>${faNum(d)}</span><span class="jd">${faNum(j.jd)}</span>`;
    cell.appendChild(head);
    const ics=document.createElement('div');ics.className='ics';
    active.slice(0,6).forEach(h=>ics.appendChild(habitIconBtn(h,ds,12)));
    if(active.length>6){
      const more=document.createElement('span');more.className='cal-hb';more.textContent='+'+faNum(active.length-6);more.title=active.slice(6).map(h=>h.title).join('، ');
      ics.appendChild(more);
    }
    cell.appendChild(ics);
    grid.appendChild(cell);
  }
  wrap.appendChild(grid);

  // legend: every habit with its own icon/color so tiny chips are identifiable
  const legend=document.createElement('div');legend.className='hb-legend';
  hs.forEach(h=>{
    const s=document.createElement('span');s.style.cursor=h.id===SLEEP_HABIT_ID?'default':'pointer';s.title=h.id===SLEEP_HABIT_ID?'عادت خواب (غیرقابل ویرایش)':'ویرایش عادت';
    const ic=document.createElement('span');ic.className='hb-icbtn done';ic.style.setProperty('--ic',h.color);ic.innerHTML=habitIconSvg(h.icon,11);
    s.appendChild(ic);s.appendChild(document.createTextNode(h.title+(h.normal&&h.id!==SLEEP_HABIT_ID?' (عادی)':'')));
    if(h.id!==SLEEP_HABIT_ID) s.addEventListener('click',()=>openTaskModal('habit',h));
    legend.appendChild(s);
  });
  wrap.appendChild(legend);
  return wrap;
}
function habitCard(h){
  const isSleep=h.id===SLEEP_HABIT_ID;
  const card=document.createElement('div');card.className='hb-card'+(isSleep?' sleep-habit':'');card.style.setProperty('--hb',h.color);
  const win=h.timeOn?`ساعت ${faNum(minToHM(h.winStart))} تا ${faNum(minToHM(h.winEnd))} روی دایره`:'';
  const tagNormal=isSleep?'<span class="pill" style="font-size:9.5px;background:'+SLEEP_COLOR+'22;color:'+SLEEP_COLOR+';border-color:'+SLEEP_COLOR+'55">خواب • رنگ خاص</span>':(h.normal?'<span class="pill" style="font-size:9.5px">عادت عادی</span>':'');
  const head=document.createElement('div');head.className='hb-top';
  head.innerHTML=`
    <div class="habit-ic" style="${isSleep?'background:'+SLEEP_COLOR+'22':''}">${habitIconSvg(h.icon,19)}</div>
    <div class="hb-t">
      <div class="hb-title">${aiEsc(h.title)} ${tagNormal}</div>
      <div class="hb-sub"><span>${isSleep?'هر روز • ثبت خواب مثل عادت':repeatLabel(h)}</span>${win?'<span>•</span><span>'+win+'</span>':''}</div>
    </div>
    <div class="hb-actions">
      ${isSleep?'':`<button class="hb-mini" data-edit title="ویرایش"><svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c-.39-.39-.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg></button>
      <button class="hb-mini del" data-del title="حذف"><svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg></button>`}
    </div>`;
  card.appendChild(head);
  if(!isSleep){
    head.querySelector('[data-edit]')?.addEventListener('click',()=>openTaskModal('habit',h));
    head.querySelector('[data-del]')?.addEventListener('click',()=>deleteHabit(h));
  }

  const track=document.createElement('div');track.className='hb-track';
  card.appendChild(track);
  const today=getRealTodayStr();
  const viewDay=getCurrentViewDate();
  const mkCell=(ds,nm)=>{
    const active=habitActiveOn(h,ds);const done=habitDone(h,ds);const future=ds>today;const past=ds<today;
    const st=!active?'offday':(done?'done':(future?'future':(past?'missed':'')));
    const w=document.createElement('div');w.className='hb-day '+(st||'')+(ds===today?' today':'');
    let inner;
    if(isSleep){
      if(done){
        const sl=findDaySleep(ds);
        const dur=sl?Math.round((sl.duration||0)/60):0;
        const hh=Math.floor(dur/60),mm=dur%60;
        inner=HABIT_CHECK_SVG;
        w.title=`${ds} • ${hh}h ${mm}m خواب`;
      }else{
        inner=active?habitIconSvg(h.icon,13):'–';
      }
    }else{
      inner=done?HABIT_CHECK_SVG:(active?habitIconSvg(h.icon,13):'–');
    }
    w.innerHTML=`<div class="cell">${inner}</div><div class="nm">${nm}</div>`;
    if(active&&!future)w.addEventListener('click',()=>bumpHabitLog(h,ds));
    return w;
  };

  if(isSleep){
    // Special UI for sleep habit
    const targetDay=hbPeriod==='day'?viewDay:today;
    const cur=findDaySleep(targetDay);
    const fmt=t=>{const d=new Date(t);return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');};
    const curBed=cur?fmt(cur.start):''; const curWake=cur?fmt(cur.end):'';
    const durMin=cur?Math.round((cur.duration||0)/60):0;
    const durTxt=cur?`${faNum(Math.floor(durMin/60))} ساعت و ${faNum(durMin%60)} دقیقه`:'ثبت نشده';

    if(hbPeriod==='day'){
      const info=document.createElement('div');info.className='muted';info.style.fontSize='11.5px';info.style.lineHeight='1.7';
      info.innerHTML=`روز بیدار شدن: <b style="color:var(--paper)">${targetDay===today?'امروز':targetDay}</b> • مدت: <b style="color:${SLEEP_COLOR}">${durTxt}</b>`;
      track.appendChild(info);

      const row=document.createElement('div');row.className='sleep-row';row.style.marginTop='10px';
      row.innerHTML=`
        <div class="sleep-field" id="sleepHabitBedPicker">
          <div class="caption" style="margin-bottom:4px">ساعت خوابیدن</div>
          <div class="custom-picker-trigger" id="sleepHabitBedTrigger" style="padding:9px 10px;display:flex;align-items:center;gap:7px">
            <span class="icon sm"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.39 5.39 0 0 1-4.4 2.26 5.4 5.4 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/></svg></span>
            <span id="sleepHabitBedDisplay">${curBed||'--:--'}</span>
          </div>
          <div class="custom-picker-popup" id="sleepHabitBedPopup"></div>
          <input type="hidden" id="sleepHabitBed" value="${curBed}"/>
        </div>
        <div class="sleep-field" id="sleepHabitWakePicker">
          <div class="caption" style="margin-bottom:4px">ساعت بیدار شدن</div>
          <div class="custom-picker-trigger" id="sleepHabitWakeTrigger" style="padding:9px 10px;display:flex;align-items:center;gap:7px">
            <span class="icon sm"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0-5L9.5 4.5 12 7l2.5-2.5L12 2zm0 20l-2.5-2.5L12 17l2.5 2.5L12 22zM2 12l2.5-2.5L7 12l-2.5 2.5L2 12zm15 0l2.5-2.5L22 12l-2.5 2.5L17 12z"/></svg></span>
            <span id="sleepHabitWakeDisplay">${curWake||'--:--'}</span>
          </div>
          <div class="custom-picker-popup left" id="sleepHabitWakePopup"></div>
          <input type="hidden" id="sleepHabitWake" value="${curWake}"/>
        </div>`;
      track.appendChild(row);

      const saveRow=document.createElement('div');saveRow.style.display='flex';saveRow.style.gap='8px';saveRow.style.marginTop='10px';
      saveRow.innerHTML=`<button class="btn-primary" id="sleepHabitSave" type="button" style="flex:1;justify-content:center;background:${SLEEP_COLOR};color:white;border:none">ثبت خواب</button>
        ${cur?`<button class="btn-ghost" id="sleepHabitDel" type="button">حذف</button>`:''}`;
      track.appendChild(saveRow);

      const status=document.createElement('div');status.id='sleepHabitStatus';status.className='muted sleep-status';status.style.marginTop='8px';
      track.appendChild(status);

      const help=document.createElement('div');help.className='muted';help.style.fontSize='10.5px';help.style.lineHeight='1.6';help.style.marginTop='6px';
      help.textContent='ساعت خوابیدن معمولاً شبِ قبل است (مثلاً ۲۳:۳۰) و بیدار شدن صبحِ همین روز؛ بازه‌های هم‌پوشان خودکار اصلاح می‌شوند. روی دایره با خط‌چین نمایش داده می‌شود.';
      track.appendChild(help);

      // Wire up pickers after DOM insertion (next tick)
      setTimeout(()=>{
        try{
          initCustomTimePicker('sleepHabitBedTrigger','sleepHabitBedPopup','sleepHabitBedDisplay','sleepHabitBed');
          initCustomTimePicker('sleepHabitWakeTrigger','sleepHabitWakePopup','sleepHabitWakeDisplay','sleepHabitWake');
        }catch(e){}
        const bedInput=document.getElementById('sleepHabitBed');
        const wakeInput=document.getElementById('sleepHabitWake');
        const btn=document.getElementById('sleepHabitSave');
        const delBtn=document.getElementById('sleepHabitDel');
        const st=document.getElementById('sleepHabitStatus');
        const show=(msg,color)=>{if(!st)return;st.textContent=msg;st.style.color=color||'';};
        if(btn){
          btn.addEventListener('click',()=>{
            const bed=hmToMinOrNull(bedInput?.value||'');
            const wake=hmToMinOrNull(wakeInput?.value||'');
            if(bed==null||wake==null){show('هر دو ساعت را وارد کن','var(--coral)');return;}
            try{
              const sess=saveSleep(targetDay,bed,wake);
              const hh=Math.floor(sess.duration/3600),mm=Math.round((sess.duration%3600)/60);
              show('😴 خواب ثبت شد: '+faNum(hh)+' ساعت و '+faNum(mm)+' دقیقه','var(--green)');
              save();drawClock();renderSessions();renderDashboard();
              // re-render habits after a short delay so status remains visible for a moment
              setTimeout(()=>{try{renderHabits();}catch(e){}},120);
              setTimeout(()=>{const ns=document.getElementById('sleepHabitStatus'); if(ns){ns.textContent='';ns.style.color='';}},5500);
            }catch(e){show(e.message,'var(--coral)');}
          });
        }
        if(delBtn){
          delBtn.addEventListener('click',()=>{
            if(!confirm('خواب '+targetDay+' حذف شود؟'))return;
            deleteDaySleep(targetDay);save();drawClock();renderSessions();renderHabits();renderDashboard();
          });
        }
      },0);
    }else if(hbPeriod==='week'){
      const dots=document.createElement('div');dots.className='hb-dots';
      const days=periodDates('week',viewDay);const names=['ش','ی','د','س','چ','پ','ج'];
      days.forEach((ds,i)=>dots.appendChild(mkCell(ds,names[i])));
      track.appendChild(dots);
      // Week summary list
      const sumBox=document.createElement('div');sumBox.style.marginTop='10px';sumBox.style.display='flex';sumBox.style.flexDirection='column';sumBox.style.gap='6px';
      days.forEach(ds=>{
        const sl=findDaySleep(ds);
        if(sl){
          const dur=Math.round((sl.duration||0)/60);
          const fmt=t=>{const d=new Date(t);return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');};
          const row=document.createElement('div');row.style.fontSize='11px';row.style.color='var(--mist)';row.style.display='flex';row.style.justifyContent='space-between';
          row.innerHTML=`<span>${ds}</span><span style="color:${SLEEP_COLOR}">${fmt(sl.start)}→${fmt(sl.end)} • ${faNum(Math.floor(dur/60))}h${faNum(dur%60)}m</span>`;
          sumBox.appendChild(row);
        }
      });
      if(sumBox.children.length) track.appendChild(sumBox);
    }
  }else{
    if(hbPeriod==='day'){
      const dots=document.createElement('div');dots.className='hb-dots';
      dots.appendChild(mkCell(today,'امروز'));track.appendChild(dots);
      const btn=document.createElement('button');btn.className='hb-nowbtn';
      btn.innerHTML=(habitDone(h,today)?(HABIT_CHECK_SVG+' انجام شد — برای بازگرداندن بزن'):('<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg> ثبت انجام امروز'));
      btn.addEventListener('click',()=>bumpHabitLog(h,today));
      track.appendChild(btn);
    }else if(hbPeriod==='week'){
      const dots=document.createElement('div');dots.className='hb-dots';
      const days=periodDates('week');const names=['ش','ی','د','س','چ','پ','ج'];
      days.forEach((ds,i)=>dots.appendChild(mkCell(ds,names[i])));
      track.appendChild(dots);
    }
  }

  // stats
  const prog=periodProgress(h,hbPeriod),target=periodGoal(h,hbPeriod);
  const pct=Math.min(100,Math.round(prog/Math.max(1,target)*100));
  const stat=document.createElement('div');stat.className='hb-stat';
  if(isSleep){
    const periodFa=hbPeriod==='day'?'امروز':(hbPeriod==='week'?'این هفته':'این ماه');
    const totalMin=periodDates(hbPeriod,hbPeriod==='day'?viewDay:undefined).reduce((a,ds)=>a+(habitMinutes(h,ds)||0),0);
    const avg=prog?Math.round(totalMin/prog):0;
    stat.innerHTML=`<span>${periodFa}: <b>${faNum(prog)} روز</b> خواب ثبت شده</span><span>مجموع: <b>${faNum(Math.floor(totalMin/60))}h ${faNum(totalMin%60)}m</b></span>${avg?`<span>میانگین: <b>${faNum(Math.floor(avg/60))}h${faNum(avg%60)}m</b></span>`:''}<span>زنجیره: <b>${faNum(habitStreak(h))} روز</b></span>`;
  }else{
    const periodFa=hbPeriod==='day'?'امروز':'این هفته';
    stat.innerHTML=`<span>انجام‌شده ${periodFa}: <b>${faNum(prog)}${hbPeriod==='week'?'/'+faNum(target):''}</b></span><span>زنجیره: <b>${faNum(habitStreak(h))} روز</b></span>`;
  }
  card.appendChild(stat);
  const bar=document.createElement('div');bar.className='hb-bar';bar.innerHTML=`<i style="width:${pct}%;background:${h.color}"></i>`;
  card.appendChild(bar);
  return card;
}

// Expose for AI + tests
globalThis.habitIconSvg=habitIconSvg;
globalThis.SLEEP_COLOR=SLEEP_COLOR;
globalThis.SLEEP_HABIT_ID=SLEEP_HABIT_ID;

// ---------- Tools (filtered by capability toggles + plan mode) ----------
const AI_ENUM_STATUS={type:'string',enum:['todo','doing','done','not_done','postponed']};
const AI_ENUM_PRIO={type:'string',enum:['1','2','3','4'],description:'1=low (|), 2=medium (||), 3=high (|||), 4=optional (dot)'};
const AI_COLOR_ROW_ENUM={type:'string',enum:['important','normal','low'],description:'important=vivid (مهم), normal=slightly grayed (معمولی), low=mostly gray (کم‌اهمیت)'};
const AI_COLOR_NAME_ENUM={type:'string',enum:PALETTE_COLOR_NAMES,description:'lime لیمویی، amber کهربایی، red قرمز، pink صورتی، violet بنفش، indigo نیلی، cyan فیروزه‌ای، green سبز'};
// Palette color object for tasks and plans (official-holiday red is not allowed here)
const AI_COLOR_DEF={type:'object',description:'Color from the app palette ONLY, never a hex code. Example {"row":"important","name":"green"}.',properties:{row:AI_COLOR_ROW_ENUM,name:AI_COLOR_NAME_ENUM},required:['row','name']};
// Occasions may additionally use the special holiday row
const AI_OCC_COLOR_DEF={type:'object',description:'Color from the app palette ONLY, never a hex code. Rows: important/normal/low with a name; official holidays use {"row":"holiday","name":"red"}.',properties:{row:{type:'string',enum:['important','normal','low','holiday']},name:AI_COLOR_NAME_ENUM},required:['row','name']};
const AI_ENUM_REPEAT={type:'string',enum:['none','daily','weekdays','weekly','custom'],description:'none=one time, daily=every day, weekdays=Sat-Thu (except Friday), weekly=same weekday, custom=use repeatDays'};
function buildAITools(planMode){
  const caps=aiCaps();
  const T=[
    {name:'get_context',description:'Get the current app snapshot: date, tasks, folders, today sessions, occasions, notes. Also includes current time, plans, alarms and timer according to the enabled capabilities.'},
    {name:'get_tasks',description:'List tasks, optionally for a specific Gregorian date YYYY-MM-DD.',parameters:{type:'object',properties:{date:{type:'string',description:'YYYY-MM-DD, or omit for visible scope'}}}}
  ];
  const add=(cap,def)=>{if(caps[cap])T.push(def);};
  add('tasks',{name:'create_task',description:'Create a task. Date Gregorian YYYY-MM-DD (default today). To create a MULTI-STEP task, pass steps: an ordered array of 2 to 6 objects {title, description?}; the user then ticks one square per step in the UI, and the task is only finished after the final step. Use multi-step for non-trivial work that benefits from an ordered breakdown (e.g. cooking, studying a chapter, multi-part errands).',parameters:{type:'object',properties:{title:{type:'string'},date:{type:'string'},color:AI_COLOR_DEF,priority:AI_ENUM_PRIO,status:AI_ENUM_STATUS,folderId:{type:'string'},steps:{type:'array',maxItems:6,items:{type:'object',properties:{title:{type:'string'},description:{type:'string'}},required:['title']}}},required:['title']}});
  add('tasks',{name:'complete_task_step',description:'Mark the next unfinished step of a multi-step task as complete (advances one square). When the last step completes, the task becomes done. Use instead of setting a multi-step task status directly.',parameters:{type:'object',properties:{taskId:{type:'string'}},required:['taskId']}});
  add('tasks',{name:'reset_task_steps',description:'Restart a multi-step task from the first step (rolls all squares back).',parameters:{type:'object',properties:{taskId:{type:'string'}},required:['taskId']}});
  add('tasks',{name:'update_task',description:'Update any field of a task. Send folderId null to remove from folder. To turn a task into a MULTI-STEP task (or to rewrite its breakdown), pass steps: an ordered array of 2 to 6 objects {title, description?}; send an EMPTY array [] to strip the breakdown and make the task plain again.',parameters:{type:'object',properties:{taskId:{type:'string'},title:{type:'string'},status:AI_ENUM_STATUS,color:AI_COLOR_DEF,priority:AI_ENUM_PRIO,folderId:{type:'string'},steps:{type:'array',maxItems:6,items:{type:'object',properties:{title:{type:'string'},description:{type:'string'}},required:['title']}}},required:['taskId']}});
  add('tasks',{name:'delete_task',description:'Permanently delete a task.',parameters:{type:'object',properties:{taskId:{type:'string'}},required:['taskId']}});
  add('tasks',{name:'postpone_task',description:'Postpone a task to another date (creates a copy there, marks original postponed).',parameters:{type:'object',properties:{taskId:{type:'string'},targetDate:{type:'string',description:'YYYY-MM-DD'}},required:['taskId','targetDate']}});
  add('folders',{name:'create_folder',description:'Create a folder and optionally put existing tasks in it.',parameters:{type:'object',properties:{title:{type:'string'},taskIds:{type:'array',items:{type:'string'}}},required:['title']}});
  add('folders',{name:'delete_folder',description:'Delete a folder; tasks are kept loose unless deleteTasks is true.',parameters:{type:'object',properties:{folderId:{type:'string'},deleteTasks:{type:'boolean'}},required:['folderId']}});
  // Habits (recurring tasks with BuJo tracker)
  add('tasks',{name:'get_habits',description:'List habits with schedule (daily/weekly/monthly), time window, icon, normal flag and done state.'});
  add('tasks',{name:'create_habit',description:'Create a recurring habit. repeat: daily, weekly, or monthly. For weekly set weekMode: workdays (Sat-Thu), weekend (Friday), or custom with repeatDays (JS getDay: 0 Sunday..6 Saturday). For monthly set monthDays (1..31). normal=true makes it tracker-only (not shown in calendar/tasks/clock). Optional timeWindow {start,end HH:MM} hatches the whole window on the timer clock each active day (e.g. school 07:00-14:00). icon MUST be one of the catalog keys listed in your instructions.',parameters:{type:'object',properties:{
    title:{type:'string'},color:AI_COLOR_DEF,priority:AI_ENUM_PRIO,icon:{type:'string',enum:HABIT_ICON_KEYS},
    repeat:{type:'string',enum:['daily','weekly','monthly']},
    weekMode:{type:'string',enum:['workdays','weekend','custom'],description:'use with repeat=weekly'},
    repeatDays:{type:'array',items:{type:'integer',description:'JS getDay: 0 Sunday .. 6 Saturday'},description:'required for weekly custom'},
    monthDays:{type:'array',items:{type:'integer',description:'day of month 1..31'},description:'required for monthly'},
    normal:{type:'boolean',description:'true = routine habit (school/work): hidden from calendar and task lists, still hatched on the clock when timeWindow is set'},
    timeWindow:{type:'object',description:'optional; the whole window is hatched on the clock',properties:{start:{type:'string',description:'HH:MM'},end:{type:'string',description:'HH:MM'}}}
  },required:['title']}});
  add('tasks',{name:'update_habit',description:'Update a habit (title, color, priority, icon, repeat, weekMode, repeatDays, monthDays, normal, timeWindow). Send timeWindow null to remove scheduled blocks.',parameters:{type:'object',properties:{habitId:{type:'string'},title:{type:'string'},color:AI_COLOR_DEF,priority:AI_ENUM_PRIO,icon:{type:'string',enum:HABIT_ICON_KEYS},repeat:{type:'string',enum:['daily','weekly','monthly']},weekMode:{type:'string',enum:['workdays','weekend','custom']},repeatDays:{type:'array',items:{type:'integer'}},monthDays:{type:'array',items:{type:'integer'}},normal:{type:'boolean'},timeWindow:{type:'object',description:'null removes the window',properties:{start:{type:'string'},end:{type:'string'}}}},required:['habitId']}});
  add('tasks',{name:'delete_habit',description:'Delete a habit, its tracker logs and recurring task copies.',parameters:{type:'object',properties:{habitId:{type:'string'}},required:['habitId']}});
  add('tasks',{name:'log_habit',description:'Mark a habit done for a date (default today). done:false or reset:true unmarks it. Future dates are rejected.',parameters:{type:'object',properties:{habitId:{type:'string'},date:{type:'string',description:'YYYY-MM-DD'},done:{type:'boolean',description:'default true'},reset:{type:'boolean'}},required:['habitId']}});
  add('calendar',{name:'create_occasion',description:'Add a calendar occasion. yearly=true repeats each year on same month-day (birthdays).',parameters:{type:'object',properties:{title:{type:'string'},date:{type:'string'},color:AI_OCC_COLOR_DEF,yearly:{type:'boolean'},type:{type:'string',enum:['birthday','meeting','holiday','deadline','reminder','custom']}},required:['title','date']}});
  add('calendar',{name:'delete_occasion',description:'Delete an occasion by id.',parameters:{type:'object',properties:{occasionId:{type:'string'}},required:['occasionId']}});
  add('calendar',{name:'save_note',description:'Create or overwrite the note of a date.',parameters:{type:'object',properties:{date:{type:'string'},text:{type:'string'}},required:['date','text']}});
  add('calendar',{name:'delete_note',description:'Delete the note of a date.',parameters:{type:'object',properties:{date:{type:'string'}},required:['date']}});
  add('time',{name:'log_manual_session',description:'Record a tracked time block. Use taskId for a real task, OR activity for a timer-only activity such as: استراحت/rest, غذا خوردن/food, رفت‌وآمد/commute (or any custom Persian activity name). Times are 24h HH:MM; end earlier than start = next day. Sleep is NOT an activity any more — it is a built-in habit (id builtin_sleep) with special color; log it via log_habit or via activity=خواب/sleep still works for backward compat (date is wake day, start >=12 means previous evening). Time never overlaps: for the SAME target overlapping blocks merge; for DIFFERENT targets shared minutes are removed from the older block and assigned to this new one.',parameters:{type:'object',properties:{taskId:{type:'string',description:'id of the task; omit when using activity'},activity:{type:'string',description:'timer-only activity name (Persian): استراحت، غذا خوردن، رفت‌وآمد، یا هر نام فعالیت دیگری مثل مطالعه آزاد (خواب اکنون عادت است)'},start:{type:'string'},end:{type:'string'},date:{type:'string',description:'YYYY-MM-DD (for sleep habit: the wake day)'}},required:['start','end']}});
  add('time',{name:'update_session',description:'Edit a recorded (completed) work block date/time. Pass only fields that change. No-overlap rules reapply on save.',parameters:{type:'object',properties:{sessionId:{type:'string'},date:{type:'string',description:'YYYY-MM-DD'},start:{type:'string',description:'HH:MM'},end:{type:'string',description:'HH:MM'}},required:['sessionId']}});
  add('time',{name:'delete_session',description:'Delete a recorded work block by id.',parameters:{type:'object',properties:{sessionId:{type:'string'}},required:['sessionId']}});
  add('time',{name:'start_timer',description:'Start the live timer on a task, or on a timer-only activity (خواب، استراحت، غذا خوردن، رفت‌وآمد یا نام دلخواه).',parameters:{type:'object',properties:{taskId:{type:'string'},activity:{type:'string',description:'activity name instead of taskId, e.g. استراحت or خواب'}}} });
  add('time',{name:'pause_timer',description:'Pause the running timer.'});
  add('time',{name:'stop_timer',description:'Stop and save the current timer session.'});
  add('vibe',{name:'get_vibe',description:'Get the mood/fatigue check-in snapshot: today state, 7/30-day averages, 30-day trend series, streak, per-task feelings and recent mood notes.'});
  add('vibe',{name:'log_vibe',description:'Save a mood check-in for the user. mood 1 (very bad) to 5 (great); fatigue 1 (fresh) to 5 (exhausted); optional short note and taskTitle when the feeling is about a task.',parameters:{type:'object',properties:{
    mood:{type:'integer'},fatigue:{type:'integer'},note:{type:'string'},taskTitle:{type:'string'}
  },required:['mood']}});
  if(caps.scheduling){
    add('scheduling',{name:'create_plan',description:'Schedule a planned work block on a future time (hatched on the timer clock). Omit taskId to auto-create the task. Times 24h HH:MM. No overlap with existing plans on that date.',parameters:{type:'object',properties:{title:{type:'string'},date:{type:'string',description:'YYYY-MM-DD'},start:{type:'string',description:'HH:MM'},end:{type:'string',description:'HH:MM'},color:AI_COLOR_DEF,taskId:{type:'string'}},required:['title','date','start','end']}});
    add('scheduling',{name:'update_plan',description:'Edit a scheduled plan (title, date, start/end HH:MM, color, taskId). Pass only fields that change. Overlap is rejected.',parameters:{type:'object',properties:{planId:{type:'string'},title:{type:'string'},date:{type:'string',description:'YYYY-MM-DD'},start:{type:'string',description:'HH:MM'},end:{type:'string',description:'HH:MM'},color:AI_COLOR_DEF,taskId:{type:'string'}},required:['planId']}});
    add('scheduling',{name:'delete_plan',description:'Delete a scheduled plan.',parameters:{type:'object',properties:{planId:{type:'string'}},required:['planId']}});
    add('scheduling',{name:'create_alarm',description:'Set an alarm at date/time with optional linked task and repeat. Time must be future.',parameters:{type:'object',properties:{title:{type:'string'},date:{type:'string',description:'YYYY-MM-DD'},time:{type:'string',description:'HH:MM'},taskId:{type:'string'},repeat:AI_ENUM_REPEAT,repeatDays:{type:'array',items:{type:'integer',description:'JS getDay: 0 Sunday .. 6 Saturday'},description:'required when repeat=custom'}},required:['title','date','time']}});
    add('scheduling',{name:'delete_alarm',description:'Delete an alarm by id.',parameters:{type:'object',properties:{alarmId:{type:'string'}},required:['alarmId']}});
  }
  return T.map(d=>({name:d.name,description:d.description,parameters:d.parameters||{type:'object',properties:{}}}));
}
function executeAITool(name,args){
  try{
    const ok=o=>({ok:true,...o}); const fail=error=>({ok:false,error:String(error)});
    // Capability guard
    const cap=TOOL_CAP[name];
    if(cap && !aiCaps()[cap]) return fail('این قابلیت توسط کاربر غیرفعال شده است: '+AI_CAP_META[cap].label);
    switch(name){
      case 'get_context': return ok({context:buildAIContext(aiPlanMode())});
      case 'get_vibe': return ok(vibeSnapshot());
      case 'log_vibe': return vibeLogFromAI(args);
      case 'get_tasks':{
        const list=args.date?state.tasks.filter(t=>t.date===args.date):state.tasks;
        return ok({tasks:list.map(t=>({id:t.id,title:t.title,date:t.date,status:t.status,priority:t.lines||1,color:colorForAI(t.color),folderId:t.folderId||null,habitId:t.habitId||null,timeSpentMinutes:Math.round((t.timeSpent||0)/60),...(isMultiStep(t)?{multiStep:true,step:msIndex(t),totalSteps:msTotal(t),steps:t.steps.map((s,i)=>({n:i+1,title:s.title,description:s.note||null,done:i<msIndex(t)}))}:{multiStep:false})}))});
      }
      case 'create_task':{
        if(args.date&&!validDateStr(args.date))return fail('تاریخ نامعتبر: '+args.date);
        const date=args.date||getRealTodayStr();
        const color=args.color?resolvePaletteColor(args.color,{allowHoliday:false}):OCCASION_HUES[Math.floor(Math.random()*OCCASION_HUES.length)];
        let steps=null;
        if(Array.isArray(args.steps)&&args.steps.length>0){
          if(args.steps.length>MS_MAX_STEPS)return fail('تسک چندمرحله‌ای حداکثر '+MS_MAX_STEPS+' مرحله دارد');
          steps=normalizeSteps(args.steps);
          if(!steps||steps.length<2)return fail('تسک چندمرحله‌ای به حداقل ۲ مرحله با عنوان نیاز دارد');
        }
        const t={id:uid(),title:String(args.title).slice(0,200),status:args.status||'todo',completed:args.status==='done',color,createdAt:Date.now(),folderId:args.folderId||null,timeSpent:0,lines:parseInt(args.priority)||1,date};
        if(steps&&steps.length>=2){t.steps=steps;t.step=args.status==='done'?steps.length:0;}
                syncMultiStep(t);
        state.tasks.unshift(t); rerenderAfterAI();
        return ok({taskId:t.id,title:t.title,date,steps:t.steps?t.steps.length:0,step:t.step||0});
      }
      case 'complete_task_step':{
        const t=state.tasks.find(x=>x.id===args.taskId);if(!t)return fail('تسک پیدا نشد: '+args.taskId);
        if(!isMultiStep(t))return fail('این تسک چندمرحله‌ای نیست؛ با update_task وضعیتش را عوض کن');
        const step=msAdvance(t);rerenderAfterAI();
        return ok({taskId:t.id,step,totalSteps:t.steps.length,status:t.status});
      }
      case 'reset_task_steps':{
        const t=state.tasks.find(x=>x.id===args.taskId);if(!t)return fail('تسک پیدا نشد: '+args.taskId);
        if(!isMultiStep(t))return fail('این تسک چندمرحله‌ای نیست');
        msReset(t,true);rerenderAfterAI();
        return ok({taskId:t.id,step:0,status:t.status});
      }
      case 'update_task':{
        const t=state.tasks.find(x=>x.id===args.taskId); if(!t)return fail('تسک پیدا نشد: '+args.taskId);
        if(args.title)t.title=String(args.title).slice(0,200);
        if(args.color)t.color=resolvePaletteColor(args.color,{allowHoliday:false});
        if(args.priority){const p=parseInt(args.priority);if([1,2,3,4].includes(p))t.lines=p;}
        if(args.status){if(!['todo','doing','done','not_done','postponed'].includes(args.status))return fail('وضعیت نامعتبر');t.status=args.status;t.completed=args.status==='done';}
        if('steps' in args){
          if(args.steps==null||(Array.isArray(args.steps)&&args.steps.length===0)){delete t.steps;delete t.step;}
          else{
            if(args.steps.length>MS_MAX_STEPS)return fail('تسک چندمرحله‌ای حداکثر '+MS_MAX_STEPS+' مرحله دارد');
            const steps=normalizeSteps(args.steps);
            if(!steps||steps.length<2)return fail('مراحل باید حداقل ۲ عنوان معتبر داشته باشند');
            t.steps=steps;t.step=Math.min(isNaN(parseInt(t.step))?0:parseInt(t.step),steps.length);
          }
        }
        if('folderId' in args)t.folderId=args.folderId||null;
        if(isMultiStep(t))syncMultiStep(t);
        rerenderAfterAI(); return ok({taskId:t.id,status:t.status,steps:t.steps?t.steps.length:0,step:t.step||0});
      }
      case 'delete_task':{
        const t=state.tasks.find(x=>x.id===args.taskId); if(!t)return fail('تسک پیدا نشد');
        if(state.activeTaskId===t.id)stopTimer();
        state.tasks=state.tasks.filter(x=>x.id!==args.taskId); rerenderAfterAI(); return ok({deleted:args.taskId});
      }
      case 'postpone_task':{
        if(!validDateStr(args.targetDate))return fail('تاریخ مقصد نامعتبر');
        const o=state.tasks.find(x=>x.id===args.taskId); if(!o)return fail('تسک پیدا نشد');
        const n={id:uid(),title:o.title,status:'todo',completed:false,color:o.color,createdAt:Date.now(),folderId:o.folderId,timeSpent:0,date:args.targetDate,postponedFrom:o.date,isPostponedInstance:true,originalTaskId:o.id,lines:o.lines||1};
        if(isMultiStep(o)){n.steps=o.steps.map(s=>({...s}));n.step=o.step;}
        state.tasks.push(n); o.status='postponed';o.postponedTo=args.targetDate;o.completed=false;
        if(isMultiStep(o))syncMultiStep(o);
        rerenderAfterAI(); return ok({newTaskId:n.id,date:args.targetDate});
      }
      case 'create_folder':{
        const f={id:uid(),title:String(args.title).slice(0,120),createdAt:Date.now()}; state.folders.push(f);
        (args.taskIds||[]).forEach(id=>{const t=state.tasks.find(x=>x.id===id);if(t)t.folderId=f.id;});
        rerenderAfterAI(); return ok({folderId:f.id});
      }
      case 'delete_folder':{
        if(!state.folders.some(f=>f.id===args.folderId))return fail('پوشه پیدا نشد');
        if(args.deleteTasks) state.tasks=state.tasks.filter(t=>t.folderId!==args.folderId);
        else state.tasks.forEach(t=>{if(t.folderId===args.folderId)t.folderId=null;});
        state.folders=state.folders.filter(f=>f.id!==args.folderId);
        rerenderAfterAI(); return ok({deleted:args.folderId});
      }
      case 'get_habits':{
        const today=getRealTodayStr();
        return ok({habits:state.habits.map(h=>({id:h.id,title:h.title,icon:h.icon,color:colorForAI(h.color),priority:h.lines,
          repeat:h.repeat,weekMode:h.weekMode||'workdays',repeatDays:h.repeatDays||[],monthDays:h.monthDays||[],normal:!!h.normal,
          timeWindow:h.timeOn?{start:minToHM(h.winStart),end:minToHM(h.winEnd)}:null,
          todayDone:habitDone(h,today),streak:habitStreak(h)}))});
      }
      case 'create_habit':
      case 'update_habit':{
        const isNew=name==='create_habit';
        let h;
        if(isNew){h=normalizeHabit({});}
        else{h=state.habits.find(x=>x.id===args.habitId);if(!h)return fail('عادت پیدا نشد: '+args.habitId);}
        if(args.title)h.title=String(args.title).slice(0,200);
        if(args.color)h.color=resolvePaletteColor(args.color,{allowHoliday:false});
        if(args.priority){const p=parseInt(args.priority);if([1,2,3,4].includes(p))h.lines=p;}
        if(args.icon){if(!HABIT_ICONS[args.icon])return fail('آیکون مجاز نیست؛ یکی از کلیدهای کاتالوگ را بفرست');h.icon=args.icon;}
        else if(isNew)h.icon=null; // let normalizeHabit auto-suggest from the title
        if(args.repeat){if(!['daily','weekly','monthly'].includes(args.repeat))return fail('نوع تکرار باید daily، weekly یا monthly باشد');h.repeat=args.repeat;}
        if(args.weekMode){if(!['workdays','weekend','custom'].includes(args.weekMode))return fail('حالت هفته نامعتبر');h.weekMode=args.weekMode;}
        if(Array.isArray(args.repeatDays))h.repeatDays=[...new Set(args.repeatDays.map(Number).filter(d=>d>=0&&d<=6))];
        if(Array.isArray(args.monthDays))h.monthDays=[...new Set(args.monthDays.map(Number).filter(d=>d>=1&&d<=31))].sort((a,b)=>a-b);
        if(h.repeat==='weekly'&&h.weekMode==='custom'&&!h.repeatDays.length)return fail('برای هفتگیِ انتخابی، repeatDays لازم است');
        if(h.repeat==='monthly'&&!h.monthDays.length)return fail('برای تکرار ماهانه، monthDays لازم است (مثلاً [1,15])');
        if(typeof args.normal==='boolean')h.normal=args.normal;
        if('timeWindow' in args){
          if(args.timeWindow===null){h.timeOn=false;}
          else{const w=args.timeWindow||{};if(w.start&&!validHM(w.start))return fail('فرمت شروع بازه باید HH:MM باشد');if(w.end&&!validHM(w.end))return fail('فرمت پایان بازه باید HH:MM باشد');
            h.timeOn=!!(w.start&&w.end);if(w.start)h.winStart=hmToMin(w.start);if(w.end)h.winEnd=hmToMin(w.end);
            if(h.winEnd<=h.winStart)return fail('پایان بازه باید بعد از شروع باشد');}
        }
        if(isNew){h=normalizeHabit(h);state.habits.push(h);}
        syncHabitOccurrences();syncAllOccurrenceStatus();
        rerenderAfterAI(); renderHabits();
        return ok({habitId:h.id,...(isNew?{}:{updated:true})});
      }
      case 'delete_habit':{
        if(args.habitId===SLEEP_HABIT_ID) return fail('عادت خواب قابل حذف نیست');
        if(!state.habits.some(h=>h.id===args.habitId))return fail('عادت پیدا نشد');
        state.habits=state.habits.filter(h=>h.id!==args.habitId);
        state.habitLogs=state.habitLogs.filter(l=>l.habitId!==args.habitId);
        state.tasks=state.tasks.filter(t=>t.habitId!==args.habitId);
        syncHabitOccurrences();
        rerenderAfterAI();renderHabits();
        return ok({deleted:args.habitId});
      }
      case 'log_habit':{
        const h=state.habits.find(x=>x.id===args.habitId);if(!h)return fail('عادت پیدا نشد: '+args.habitId);
        if(h.id===SLEEP_HABIT_ID){
          const date=args.date&&validDateStr(args.date)?args.date:getRealTodayStr();
          if(date>getRealTodayStr())return fail('ثبت برای آینده ممکن نیست');
          const markDone=args.reset?false:(args.done===false?false:true);
          if(!markDone){
            deleteDaySleep(date);
            rerenderAfterAI();renderHabits();
            return ok({habitId:h.id,date,done:false,note:'خواب حذف شد'});
          }
          return fail('برای عادت خواب باید ساعت خوابیدن و بیدار شدن بدهی؛ از log_manual_session با activity=خواب و start/end استفاده کن یا از بخش عادت‌ها زمان را وارد کن');
        }
        const date=args.date&&validDateStr(args.date)?args.date:getRealTodayStr();
        if(!habitActiveOn(h,date))return fail('این عادت در آن روز برنامه ندارد');
        if(date>getRealTodayStr())return fail('ثبت برای آینده ممکن نیست');
        let l=state.habitLogs.find(x=>x.habitId===h.id&&x.date===date);
        const markDone=args.reset?false:(args.done===false?false:true);
        if(markDone){
          if(!l){l={id:uid(),habitId:h.id,date,count:1,minutes:parseInt(args.minutes)||0};state.habitLogs.push(l);}
          else{l.count=Math.max(1,l.count||(parseInt(args.count)||1));if(args.minutes)l.minutes=(l.minutes||0)+parseInt(args.minutes);}
        }else{
          if(l){l.count=0;l.minutes=0;}
        }
        syncOccurrenceStatus(h,date);
        rerenderAfterAI();renderHabits();
        return ok({habitId:h.id,date,done:habitDone(h,date)});
      }
      case 'create_occasion':{
        if(!validDateStr(args.date))return fail('تاریخ نامعتبر');
        const occColor=args.color?resolvePaletteColor(args.color,{allowHoliday:true}):(args.type==='holiday'?HOLIDAY_COLOR:OCCASION_HUES[0]);
        const o={id:uid(),date:args.date,title:String(args.title).slice(0,200),color:occColor,repeat:args.yearly?'yearly':'none',type:args.type||'custom'};
        state.occasions.push(o); rerenderAfterAI(); return ok({occasionId:o.id});
      }
      case 'delete_occasion':{
        state.occasions=state.occasions.filter(o=>o.id!==args.occasionId); rerenderAfterAI(); return ok({deleted:args.occasionId});
      }
      case 'save_note':{
        if(!validDateStr(args.date))return fail('تاریخ نامعتبر');
        const ex=state.notes.find(n=>n.date===args.date);
        if(ex){ex.text=args.text;ex.updatedAt=Date.now();}else state.notes.push({id:uid(),date:args.date,text:args.text,createdAt:Date.now()});
        rerenderAfterAI(); return ok({date:args.date});
      }
      case 'delete_note':{
        state.notes=state.notes.filter(n=>n.date!==args.date); rerenderAfterAI(); return ok({date:args.date});
      }
      case 'log_manual_session':{
        if(!validHM(args.start)||!validHM(args.end))return fail('فرمت ساعت باید HH:MM باشد');
        let target=null;
        if(args.activity){
          target=resolveActivityRef(args.activity);
          if(!target)return fail('فعالیت شناخته نشد: '+String(args.activity).slice(0,40));
        }else if(args.taskId){
          const t=state.tasks.find(x=>x.id===args.taskId);
          if(!t)return fail('تسک پیدا نشد');
          target={id:t.id,kind:'task'};
        }else return fail('taskId یا activity لازم است');
        const date=args.date&&validDateStr(args.date)?args.date:(target.kind==='task'?state.tasks.find(x=>x.id===target.id).date:state.realToday);
        let sess;
        try{ sess=aiLogSessionForTarget(target.id,date,args.start,args.end).sess; }
        catch(e){return fail(e.message);}
        rerenderAfterAI();
        const total=state.sessions.filter(x=>x.taskId===target.id).reduce((a,b)=>a+b.duration,0);
        return ok({target:target.title||target.id,minutes:Math.round(sess.duration/60),totalMinutes:Math.round(total/60),overlapPolicy:'same target merged; different target overlap moved from earlier sessions to this one'});
      }
      case 'start_timer':{
        let t=args.taskId?state.tasks.find(x=>x.id===args.taskId):null;
        if(!t&&args.activity){
          const act=resolveActivityRef(args.activity);
          if(!act)return fail('فعالیت شناخته نشد: '+String(args.activity).slice(0,40));
          state.activeTaskId=act.id; startTimer();
          rerenderAfterAI();
          return ok({started:act.title});
        }
        if(!t&&args.planId){ // allow starting a habit plan stub (hbp:...)
          const p=plansForDate(state.realToday).find(x=>x.id===args.planId);
          if(p&&p.taskId)t=state.tasks.find(x=>x.id===p.taskId);
          if(p&&!t)return fail('این عادت از نوع عادی/روتین است و تسک زمان‌سنجی ندارد');
        }
        if(!t)return fail('تسک پیدا نشد');
        state.activeTaskId=t.id; startTimer();
        return ok({started:t.title});
      }
      case 'pause_timer':{ pauseTimer(); return ok({paused:true,elapsedSeconds:getElapsed()}); }
      case 'stop_timer':{ const sec=getElapsed(); stopTimer(); return ok({stopped:true,elapsedSeconds:sec}); }
      case 'update_session':{
        const s=state.sessions.find(x=>x.id===args.sessionId); if(!s)return fail('نشست پیدا نشد: '+args.sessionId);
        if(state.currentSessionId===s.id)return fail('این نشست الان در حال ضبط است؛ اول تایمر را متوقف کن');
        if(args.start && !validHM(args.start))return fail('فرمت شروع باید HH:MM باشد');
        if(args.end && !validHM(args.end))return fail('فرمت پایان باید HH:MM باشد');
        if(args.date && !validDateStr(args.date))return fail('تاریخ نامعتبر');
        const old=state.sessions.find(x=>x.id===s.id);
        const oldD=new Date(old.start);
        const dateStr=args.date||formatGregorian(oldD.getFullYear(),oldD.getMonth()+1,oldD.getDate());
        const startHM=args.start||minToHM(oldD.getHours()*60+oldD.getMinutes());
        let endD=new Date(old.end);
        const endHM=args.end||minToHM(endD.getHours()*60+endD.getMinutes());
        const st=combineDateMin(dateStr,hmToMin(startHM)); let en=combineDateMin(dateStr,hmToMin(endHM));
        if(en<=st)en+=24*3600*1000;
        const dur=Math.round((en-st)/1000);
        if(dur<=0)return fail('مدت نامعتبر'); if(dur>24*3600)return fail('بیشتر از ۲۴ ساعت');
        state.sessions=state.sessions.filter(x=>x.id!==s.id);
        const re=upsertSession({...s,start:st,end:en,duration:dur});
        recomputeAllTimeSpent();
        rerenderAfterAI();
        return ok({sessionId:re.id,date:dateStr,start:startHM,end:endHM,minutes:Math.round(re.duration/60)});
      }
      case 'delete_session':{
        const s=state.sessions.find(x=>x.id===args.sessionId); if(!s)return fail('نشست پیدا نشد');
        if(state.currentSessionId===s.id)return fail('نشست در حال ضبط را نمی‌توان حذف کرد؛ اول تایمر را متوقف کن');
        state.sessions=state.sessions.filter(x=>x.id!==args.sessionId);
        recomputeAllTimeSpent();
        rerenderAfterAI(); return ok({deleted:args.sessionId});
      }
      case 'create_plan':{
        if(!validDateStr(args.date))return fail('تاریخ نامعتبر');
        if(!validHM(args.start)||!validHM(args.end))return fail('فرمت ساعت باید HH:MM باشد');
        const sM=hmToMin(args.start),eM=hmToMin(args.end);
        if(eM<=sM)return fail('زمان پایان باید بعد از شروع باشد');
        if(combineDateMin(args.date,sM)<Date.now()-60000)return fail('برنامه‌ریزی برای زمان گذشته ممکن نیست');
        const clash=plansForDate(args.date).find(p=>p.date===args.date && sM<p.endMin && eM>p.startMin);
        if(clash)return fail('تداخل با برنامه «'+clash.title+'» ('+minToHM(clash.startMin)+'-'+minToHM(clash.endMin)+')');
        const color=args.color?resolvePaletteColor(args.color,{allowHoliday:false}):paletteColorHex('important','cyan');
        let taskId=args.taskId||null;
        if(!taskId){
          const t={id:uid(),title:String(args.title).slice(0,200),status:'todo',completed:false,color,createdAt:Date.now(),folderId:null,timeSpent:0,lines:2,date:args.date};
          state.tasks.unshift(t); taskId=t.id;
        }
        const p={id:uid(),title:String(args.title).slice(0,200),date:args.date,startMin:sM,endMin:eM,color,taskId,createdAt:Date.now()};
        state.plans.push(p); rerenderAfterAI();
        return ok({planId:p.id,date:args.date,start:args.start,end:args.end,taskId});
      }
      case 'update_plan':{
        const p=state.plans.find(x=>x.id===args.planId); if(!p)return fail('برنامه پیدا نشد: '+args.planId);
        const date=args.date||p.date;
        if(args.date && !validDateStr(args.date))return fail('تاریخ نامعتبر');
        if(args.start && !validHM(args.start))return fail('فرمت شروع باید HH:MM باشد');
        if(args.end && !validHM(args.end))return fail('فرمت پایان باید HH:MM باشد');
        const sM=args.start?hmToMin(args.start):p.startMin;
        const eM=args.end?hmToMin(args.end):p.endMin;
        if(eM<=sM)return fail('زمان پایان باید بعد از شروع باشد');
        const clash=plansForDate(date).find(q=>!q.stub&&q.id!==p.id && q.date===date && sM<q.endMin && eM>q.startMin);
        if(clash)return fail('تداخل با برنامه «'+clash.title+'» ('+minToHM(clash.startMin)+'-'+minToHM(clash.endMin)+')');
        p.date=date; p.startMin=sM; p.endMin=eM;
        if(args.title)p.title=String(args.title).slice(0,200);
        if(args.color)p.color=resolvePaletteColor(args.color,{allowHoliday:false});
        if(args.taskId!==undefined){
          if(args.taskId && !state.tasks.some(t=>t.id===args.taskId))return fail('تسک پیدا نشد');
          p.taskId=args.taskId||null;
        }
        rerenderAfterAI();
        return ok({planId:p.id,date:p.date,start:minToHM(p.startMin),end:minToHM(p.endMin)});
      }
      case 'delete_plan':{
        state.plans=state.plans.filter(q=>q.id!==args.planId); rerenderAfterAI(); return ok({deleted:args.planId});
      }
      case 'create_alarm':{
        if(!validDateStr(args.date))return fail('تاریخ نامعتبر');
        if(!validHM(args.time))return fail('فرمت ساعت باید HH:MM باشد');
        const repeat=['none','daily','weekdays','weekly','custom'].includes(args.repeat)?args.repeat:'none';
        let repeatDays=[];
        if(repeat==='custom'){
          repeatDays=(args.repeatDays||[]).map(Number).filter(d=>d>=0&&d<=6);
          if(!repeatDays.length)return fail('برای تکرار سفارشی باید روزهای هفته بدهی (0 یکشنبه تا 6 شنبه)');
        }
        const alarm=buildAlarmObject({title:args.title||'آلارم',taskId:args.taskId||'',dateStr:args.date,hhmm:args.time,repeat,repeatDays});
        if(repeat==='none' && alarm.time<Date.now()+30000)return fail('زمان آلارم باید در آینده باشد');
        state.alarms.push(alarm); rerenderAfterAI();
        return ok({alarmId:alarm.id,date:args.date,time:args.time,repeat:repeat,nextFire:new Date(alarm.time).toISOString()});
      }
      case 'delete_alarm':{
        state.alarms=state.alarms.filter(a=>a.id!==args.alarmId); rerenderAfterAI(); return ok({deleted:args.alarmId});
      }
      default:return {ok:false,error:'ابزار ناشناخته: '+name};
    }
  }catch(e){return {ok:false,error:e&&e.message?e.message:String(e)};}
}

// ---------- System prompt ----------
function buildAISystemPrompt(planModeArg){
  const caps=aiCaps();
  const planMode=!!(caps.time||caps.scheduling); // driven by capability switches
  const aiMode=state.settings.aiMode==='vibe'?'vibe':'task';
  const ctx=buildAIContext(planMode);
  const enabledNames=Object.keys(AI_CAP_META).filter(k=>caps[k]).map(k=>'• '+AI_CAP_META[k].label+' — '+AI_CAP_META[k].desc).join('\n');
  const disabledNames=Object.keys(AI_CAP_META).filter(k=>!caps[k]).map(k=>AI_CAP_META[k].label).join('، ')||'ندارد';
  const intro=aiMode==='vibe'
    ?`تو «وایب» هستی؛ روح خوش‌گذرانِ اپلیکیشن «Outtask (اوت‌سک)». شخصیتت بازیگوش، باحال، فارسی‌محاوره‌ای و کوتاه‌گو است؛ انگار خودت هم از کارِ اداری و کارهای کسل‌کننده بدت می‌آید.
هدف اولت خوشحال نگه‌داشتن کاربر و خوش گذراندن وقت اوست؛ هدف دومی (که با بی‌میلی قبولش داری) این است که کارها روی زمین نمانند.`
    :`تو دستیار هوش مصنوعی داخلی اپلیکیشن مدیریت وظایف و برنامه‌ریزی روزانه‌ی «Outtask (اوت‌سک)» هستی.
همین الان داخل فضای خود برنامه با کاربر حرف می‌زنی؛ هدف کمک به برنامه‌ریزی روزانه، اولویت‌بندی، مدیریت تسک‌ها/تقویم/زمان‌سنجی و آرامش ذهنی کاربر است.`;
  const aboutBlock=caps.about&&state.aboutMe&&state.aboutMe.length
    ?`\n\nحافظه‌ی «درباره‌ی من» کاربر (همه‌ی پیشنهادها و لحنت را با این‌ها هماهنگ کن؛ این‌ها واقعی و محرمانه‌اند):\n${aboutMemoryLines().join('\n')}`
    :'';
  let p=`${intro}

داده‌ی زنده‌ی برنامه (تقویم اصلی میلادی YYYY-MM-DD و جلالی فرعی است):
${JSON.stringify(ctx,null,1)}${aboutBlock}

قوانین:
- فقط فارسی بنویس، کوتاه، عملی و خوش‌لحن؛ از ایموجی خیلی کم استفاده کن.
- ابزارها واقعی‌اند و مستقیم داده‌ی برنامه را تغییر می‌دهند. برای هر خواسته‌ای که تغییری می‌سازد حتماً ابزار مناسب را صدا بزن، بعد در یک یا دو جمله گزارش بده چه کردی.
- وضعیت‌های تسک: todo (در انتظار)، doing (در حال انجام)، done (انجام شده)، not_done (انجام نشده/گذشته)، postponed (به تعویق).
- تسک‌های چندمرحله‌ای: فقط تو می‌توانی بسازی؛ با create_task و آرایه‌ی steps (۲ تا ۶ مرحله، هرکدام title کوتاه و description اختیاری با توضیح واضحِ همان مرحله). این‌ها را برای کارهای چندبخشی بساز (مثل «آمادگی امتحان» یا «پختن غذا»). کاربر خودش مرحله‌به‌مرحله تیک می‌زند؛ به‌جای عوض‌کردن مستقیم وضعیت این تسک‌ها از complete_task_step استفاده کن (هر بار فقط یک مرحله جلو می‌رود؛ مرحله‌ی آخر خودش تسک را done می‌کند). اگر کاربر بخواهد از نو شروع کند reset_task_steps بزن.
- اولویت: ۳ بالا (|||)، ۲ متوسط (||)، ۱ کم (|)، ۴ اختیاری (•).
- درخواست حذف را بدون پرسش اضافی انجام بده و فقط گزارش کوتاه بده.
- تاریخ‌ها میلادی YYYY-MM-DD هستند؛ تاریخ امروز در کانتکست است. در پاسخ به کاربر می‌توانی معادل جلالی را هم بنویسی.
- بعد از ساخت تسک/پلن/آلارم، زمان‌ها را با ساعت ۲۴ساعته واضح بنویس.
- رنگ‌ها فقط از پالت رسمی برنامه و فقط به‌شکل یک object با دو کلید row و name (هرگز هگزادسیمال نده):
  • row: «important» رنگ زنده برای کارهای مهم، «normal» کمی خاکستری‌شده برای کارهای معمولی، «low» عمدتاً خاکستری برای موارد کم‌اهمیت.
  • name یکی از: lime (لیمویی)، amber (کهربایی)، red (قرمز)، pink (صورتی)، violet (بنفش)، indigo (نیلی)، cyan (فیروزه‌ای)، green (سبز).
  • نمونه: {"row":"important","name":"green"}. رنگ تسک‌ها و پلن‌ها فقط از سه ردیف بالا؛ رنگ قرمز تعطیل رسمی {"row":"holiday","name":"red"} مخصوص مناسبت‌های تقویم است و هرگاه مناسبت تعطیل رسمی ساختی type را holiday بگذار.
- عادت‌ها کارهای تکرارشونده‌اند و در بخش «عادت‌ها» (بولت‌ژورنال) دنبال می‌شوند؛ هر عادت یا انجام می‌شود یا نه (هدف عددی ندارد). با create_habit می‌سازی: repeat یکی از daily (هر روز)، weekly یا monthly. برای weekly فیلد weekMode یکی از workdays (شنبه تا پنجشنبه)، weekend (جمعه) یا custom (آرایه repeatDays با 0=یکشنبه تا 6=شنبه)؛ برای monthly آرایه monthDays با عددهای ۱ تا ۳۱ روزهای ماه. normal=true یعنی «عادت عادی/روتین روزمره» مثل مدرسه یا کار: در تقویم و فهرست وظایف با آیکون نشان داده نمی‌شود، ولی اگر timeWindow بدهی کل آن بازه روی دایره‌ی زمان‌سنجی هاشور می‌خورد. timeWindow اختیاری {start,end} مثل {"start":"07:00","end":"14:00"} که کل آن بازه در روزهای فعال روی دایره هاشور می‌خورد (بخش ۷ تا ۱۲ روی حلقه داخلی AM و ۱۲ به بعد روی حلقه بیرونی PM). عادت‌ها حتماً باید آیکون داشته باشند و کاربر خودش نمی‌تواند آیکون انتخاب کند؛ تو آیکون را از این کاتالوگ انتخاب می‌کنی:
${HABIT_ICON_KEYS.map(k=>k+' ('+(HABIT_ICONS[k].fa)+')').join('، ')}.
  هنگام ساخت عادت حتماً آیکونِ هم‌معنی با موضوع آن بده؛ با update_habit می‌توانی آیکون/زمان/تکرار را عوض کنی و با log_habit انجام عادت را ثبت یا لغو کنی.

- خواب یک عادت داخلی با رنگ خاص (#5b6bb0) است که دقیقاً در بخش «عادت‌ها» نمایش داده می‌شود؛ با log_habit یا ثبت دستی خواب (شروع شب قبل، بیدار شدن صبح همان روز) ثبت می‌شود و روی دایره با خط‌چین دیده می‌شود. فعالیت‌های غیرکاری دیگر (استراحت، غذا خوردن، رفت‌وآمد یا هر نام دلخواه مثل مطالعه آزاد) فقط در زمان‌سنجی ثبت می‌شوند: در log_manual_session به‌جای taskId فیلد activity را با نام فارسی بده. فیلد dayTimeline در کانتکست جدول کامل کارها، عادت خواب و فعالیت‌های روز در حال نمایش است.
محدوده‌ی دسترسی به اطلاعات کاربر: ${ctx.dataScope==='TODAY_ONLY'?'فقط داده‌های امروز':'همه‌ی تاریخ‌ها'}. فقط بر همین مبنا تحلیل کن.

قابلیت‌های فعال تو:
${enabledNames}
قابلیت‌های غیرفعال (هرگز ابزارشان را صدا نزن و اگر کاربر خواست، بگو باید از باکس دسترسی‌ها فعال کند): ${disabledNames}.`;
  if(planMode){
    let extra=`\n\n- به ساعت و داده‌های زمان‌سنجی دسترسی داری.`;
    if(caps.scheduling){
      extra+=`
- می‌توانی create_plan و create_alarm را صدا بزنی.
- پلن: بازه‌ای روی دایره‌ی زمان‌سنجی به‌شکل هاشور رنگ تسک. اگر کاربر در آن بازه واقعاً همان تسک را انجام دهد (تایمر یا ثبت دستی)، هاشور دقیقه‌به‌دقیقه به خط توپُر با یک خط مشکی باریک روی آن تبدیل می‌شود؛ اگر انجام ندهد یا کار دیگری بکند هاشور محو می‌شود.
- پلن‌ها نباید تداخل داشته باشند. برای فعالیت جدید create_plan خودش تسک می‌سازد.
- برای برنامه‌ی یک روز، همه‌ی بازه‌ها را با create_plan ثبت کن و در پاسخ فهرست زمانی خلاصه بده؛ بین کارها استراحت و واقع‌گرایی رعایت شود.
- آلارم تیتر دارد و می‌تواند به تسک وصل شود؛ repeat: none یکبار، daily هر روز، weekdays روزهای کاری (به‌جز جمعه)، weekly همان روز هفته، custom با repeatDays.
- آلارم یادآور شروع پلن‌ها را هم خودت تنظیم کن مگر کاربر نخواهد.`;
    }
    if(caps.time){
      extra+=`
- می‌توانی کارهای انجام‌شده (نشست‌ها) را ثبت، ویرایش یا حذف کنی و تایمر را کنترل کنی؛ موقع ثبت زمان جدید، هم‌پوشانی خودکار مدیریت می‌شود (تسک مشابه ادغام، تسک متفاوت: دقایق مشترک از نشست قبلی کسر و به جدیدی منتقل می‌شود).`;
    }
    p+=extra;
  }else{
    p+=`\n\n- به ساعت، زمان‌سنجی، پلن و آلارم دسترسی نداری. اگر کاربر زمان‌بندی، ثبت زمان یا آلارم خواست، بگو از دکمه‌ی سپر بالای چت، قابلیت مربوطه را فعال کند.`;
  }
  if(aiMode==='vibe'){
    p+=`\n\n## حالت وایب:
- اولویت اول خوش گذراندن و حال خوب کاربر است؛ لحنت شاد، بازیگوش و کوتاه است؛ نصیحت و شعارزدگی ممنوع.
- وقتی خسته یا بی‌حال است، استراحت و فعالیت خوشحال‌کننده پیشنهاد بده؛ برای کارهای سنگینِ غیرضروری از postpone_task استفاده کن و عقب‌انداختنشان را بی‌دردسر جلوه بده.
- تفریح‌ها و کارهای حال‌خوب‌کن را می‌توانی با create_task و اولویت ۴ (اختیاری) بسازی؛ از داده‌ی get_vibe (روند حال، خستگی و حس کاربر نسبت به تسک‌ها) و حافظه‌ی درباره‌ی من ایده بگیر.
- با این حال بی‌مسئولیت نیستی: کارهای ضروری و ددلاین‌دار را به تکه‌های خیلی کوچک و راحت بشکن و به زور هم که شده چند قدم اول را جلو ببر؛ هیچ کاری نباید کامل رها شود.
- صبح‌ها یا وقتی انرژی بالاست از پنجره استفاده کن تا کار سخت را تمام کند؛ شب‌ها استراحت را جدی بگیر.
- اگر کاربر از حال خیلی بد، آسیب به خود یا خودکشی حرف زد: کاملاً جدی، آرام و مهربان بمان؛ شماره اورژانس اجتماعی ایران ۱۴۸۰ و اورژانس ۱۱۵ را بده و بخواه همین حالا با یک فرد مورد اعتماد حرف بزند؛ این‌جا شوخی نکن.
- پاسخ‌ها کوتاه و دوستانه بمانند؛ یکی دو ایموجی سبک آزاد است.`;
  }
  return p;
}

// ---------- Chat UI ----------
let aiBusy=false;
function aiEsc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function aiFormat(t){
  let h=aiEsc(t);
  h=h.replace(/\*\*([^*]+)\*\*/g,'<b style="font-weight:700">$1</b>');
  h=h.replace(/`([^`]+)`/g,'<code>$1</code>');
  h=h.split('\n').map(line=>{
    const b=line.match(/^\s*[-•*]\s+(.*)$/);
    if(b)return '<span class="ai2-li">•</span> '+b[1];
    return line;
  }).join('<br>');
  return h;
}

// ---------- AI chat: formatting helpers ----------
const FA_DIGITS='۰۱۲۳۴۵۶۷۸۹';
function faNum(v){return String(v).replace(/\d/g,d=>FA_DIGITS[d]);}
function aiClock(ts){const d=new Date(ts||Date.now());return faNum(String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'));}
function aiDateLabel(str){
  if(!str)return '';
  const today=getRealTodayStr();
  if(str===today)return 'امروز';
  const d=new Date();d.setDate(d.getDate()+1);
  if(str===formatGregorian(d.getFullYear(),d.getMonth()+1,d.getDate()))return 'فردا';
  d.setDate(d.getDate()-2);
  if(str===formatGregorian(d.getFullYear(),d.getMonth()+1,d.getDate()))return 'دیروز';
  const p=parseGregorian(str);if(!p)return str;
  const j=toJalali(p.y,p.m,p.d);
  const wk=['یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه','شنبه'][new Date(p.y,p.m-1,p.d).getDay()];
  return wk+' '+faNum(j.jd)+' '+jMonthNames[j.jm-1];
}
const AI_STATUS_FA={todo:'در انتظار',doing:'در حال انجام',done:'انجام شده',not_done:'انجام نشده',postponed:'به تعویق'};
const AI_PRIO_FA={1:'کم',2:'متوسط',3:'بالا',4:'اختیاری'};
const AI_REPEAT_FA={none:'یک‌بار',daily:'هر روز',weekdays:'روزهای کاری',weekly:'هفتگی',custom:'روزهای انتخابی'};

// ---------- Action (tool call) presentation ----------
const AI_ICONS={
  task:'<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>',
  folder:'<path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>',
  cal:'<path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5z"/><circle cx="12" cy="15" r="1.7"/>',
  note:'<path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>',
  time:'<path d="M12 2a10 10 0 100 20 10 10 0 000-20zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z"/>',
  plan:'<path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V9h14v10zM5 8V6h14v2H5z"/><path d="M9.7 16.4l1.9-1.2v-4.1H10.1v3.3l-1.6 1z"/>',
  alarm:'<path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>',
  habit:'<path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>',
  read:'<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17a5 5 0 110-10 5 5 0 010 10zm0-8a3 3 0 100 6 3 3 0 000-6z"/>',
  check:'<path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-1.2 14.6L6.2 12l1.4-1.4 3.2 3.2 5.6-5.6L17.8 9.6l-7 7z"/>',
  x:'<path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>',
  wand:'<path d="M12 2l1.8 5.6L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.4L12 2zM19 15l.8 2.4L22 18l-2.2.6L19 21l-.8-2.4L16 18l2.2-.6L19 15z"/>'
};
const AI_TOOL_UI={
  get_context:{cat:'read'},get_tasks:{cat:'read'},
  get_vibe:{cat:'read'},log_vibe:{cat:'note',verb:'حس‌وحال ثبت شد'},
  create_task:{cat:'task',verb:'تسک ساخته شد'},update_task:{cat:'task',verb:'تسک به‌روزرسانی شد'},delete_task:{cat:'task',verb:'تسک حذف شد'},postpone_task:{cat:'task',verb:'تسک به تعویق افتاد'},
  complete_task_step:{cat:'task',verb:'مرحله انجام شد'},reset_task_steps:{cat:'task',verb:'مراحل بازنشانی شد'},
  create_folder:{cat:'folder',verb:'پوشه ساخته شد'},delete_folder:{cat:'folder',verb:'پوشه حذف شد'},
  get_habits:{cat:'read'},
  create_habit:{cat:'habit',verb:'عادت ساخته شد'},update_habit:{cat:'habit',verb:'عادت ویرایش شد'},delete_habit:{cat:'habit',verb:'عادت حذف شد'},log_habit:{cat:'habit',verb:'انجام عادت ثبت شد'},
  create_occasion:{cat:'cal',verb:'مناسبت ثبت شد'},delete_occasion:{cat:'cal',verb:'مناسبت حذف شد'},
  save_note:{cat:'note',verb:'یادداشت ثبت شد'},delete_note:{cat:'note',verb:'یادداشت حذف شد'},
  log_manual_session:{cat:'time',verb:'زمان کار ثبت شد'},update_session:{cat:'time',verb:'زمان کار ویرایش شد'},delete_session:{cat:'time',verb:'زمان کار حذف شد'},
  start_timer:{cat:'time',verb:'تایمر شروع شد'},pause_timer:{cat:'time',verb:'تایمر متوقف شد'},stop_timer:{cat:'time',verb:'تایمر ذخیره و متوقف شد'},
  create_plan:{cat:'plan',verb:'برنامه‌ی زمانی ثبت شد'},update_plan:{cat:'plan',verb:'برنامه ویرایش شد'},delete_plan:{cat:'plan',verb:'برنامه حذف شد'},
  create_alarm:{cat:'alarm',verb:'آلارم تنظیم شد'},delete_alarm:{cat:'alarm',verb:'آلارم حذف شد'}
};
function aiIconSvg(name,size){return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor">${AI_ICONS[name]||''}</svg>`;}
function aiSnap(name,args){
  const s={};
  if(args.taskId)s.task=state.tasks.find(t=>t.id===args.taskId);
  if(args.folderId)s.folder=state.folders.find(f=>f.id===args.folderId);
  if(args.planId)s.plan=state.plans.find(p=>p.id===args.planId);
  if(args.sessionId)s.session=state.sessions.find(x=>x.id===args.sessionId);
  if(args.occasionId)s.occasion=state.occasions.find(o=>o.id===args.occasionId);
  if(args.alarmId)s.alarm=state.alarms.find(a=>a.id===args.alarmId);
  if(args.habitId)s.habit=state.habits.find(h=>h.id===args.habitId);
  if(args.activity){try{s.activity=resolveActivityRef(args.activity);}catch(e){}}
  return s;
}
function aiTaskTitle(id,snap){
  const t=(snap&&snap.task)||state.tasks.find(x=>x.id===id);
  return t?{title:t.title,color:t.color}:null;
}
function hmRange(a,b){return (a||'')+'–'+(b||'');}
// Turns an executed tool call into a presentable action descriptor (persisted in chat)
function describeAIToolAction(name,args,res,snap){
  const meta=AI_TOOL_UI[name];
  if(!meta)return null;
  if(meta.cat==='read')return {read:true,label:name==='get_tasks'?'مرور فهرست تسک‌ها':'مرور وضعیت و داده‌ها'};
  if(!res.ok)return {cat:meta.cat,title:meta.verb,detail:aiEsc(res.error||'انجام نشد'),err:true};
  const dot=c=>`<span class="ai2-dot" style="background:${c}"></span>`;
  let title=meta.verb, detail='', tag='';
  const tagJoin=arr=>arr.filter(Boolean).join(' • ');
  switch(name){
    case 'create_task':{
      const t=state.tasks.find(x=>x.id===res.taskId);
      if(t){detail=dot(t.color)+aiEsc(t.title);tag=tagJoin([aiDateLabel(t.date),AI_STATUS_FA[t.status]]);}
      break;
    }
    case 'update_task':{
      const t=state.tasks.find(x=>x.id===args.taskId);
      if(t){detail=dot(t.color)+aiEsc(t.title);
        const ch=[];
        if(args.status)ch.push('وضعیت: '+AI_STATUS_FA[args.status]);
        if(args.priority)ch.push('اولویت: '+AI_PRIO_FA[parseInt(args.priority)]);
        if(args.title)ch.push('عنوان تازه');
        if('folderId' in args)ch.push(args.folderId?'منتقل شد به پوشه':'از پوشه خارج شد');
        tag=ch.join(' • ');}
      break;
    }
    case 'delete_task':{
      const info=aiTaskTitle(args.taskId,snap);
      if(info)detail=dot(info.color)+aiEsc(info.title);
      break;
    }
    case 'postpone_task':{
      const info=aiTaskTitle(args.taskId,snap);
      if(info)detail=dot(info.color)+aiEsc(info.title);
      tag='به '+aiDateLabel(args.targetDate)+' موکول شد';
      break;
    }
    case 'complete_task_step':{
      const t=state.tasks.find(x=>x.id===args.taskId);
      if(t){detail=dot(t.color)+aiEsc(t.title);tag=isMultiStep(t)?faNum(res.step)+' از '+faNum(t.steps.length)+' مرحله'+(t.status==='done'?' • تمام شد':''):'';}
      break;
    }
    case 'reset_task_steps':{
      const info=aiTaskTitle(args.taskId,snap);
      if(info)detail=dot(info.color)+aiEsc(info.title);
      tag='شروع از مرحله‌ی اول';
      break;
    }
    case 'create_folder':{
      detail=aiEsc(args.title||'');
      tag=(args.taskIds&&args.taskIds.length)?faNum(args.taskIds.length)+' تسک داخل پوشه':'';
      break;
    }
    case 'delete_folder':{
      if(snap.folder)detail=aiEsc(snap.folder.title);
      break;
    }
    case 'create_habit':{
      const h=state.habits.find(x=>x.id===res.habitId);
      if(h){detail=dot(h.color)+habitIconSvg(h.icon,12)+' '+aiEsc(h.title);tag=tagJoin([repeatLabel(h),h.normal?'عادت عادی':null,h.timeOn?faNum(minToHM(h.winStart))+'–'+faNum(minToHM(h.winEnd)):null]);}
      break;
    }
    case 'update_habit':{
      const h=state.habits.find(x=>x.id===args.habitId);
      if(h)detail=dot(h.color)+habitIconSvg(h.icon,12)+' '+aiEsc(h.title);
      break;
    }
    case 'delete_habit':{
      if(snap.habit)detail=habitIconSvg(snap.habit.icon,12)+' '+aiEsc(snap.habit.title);
      break;
    }
    case 'log_habit':{
      const h=state.habits.find(x=>x.id===args.habitId);
      if(h){detail=dot(h.color)+habitIconSvg(h.icon,12)+' '+aiEsc(h.title);
        tag=(args.date&&args.date!==getRealTodayStr()?aiDateLabel(args.date)+' • ':'')+(res.done?'انجام شد':'علامت برداشته شد');}
      break;
    }
    case 'create_occasion':{
      const o=state.occasions.find(x=>x.id===res.occasionId);
      if(o){detail=dot(o.color)+aiEsc(o.title);tag=tagJoin([aiDateLabel(o.date),o.type==='holiday'?'تعطیل رسمی':null]);}
      break;
    }
    case 'delete_occasion':{
      if(snap.occasion){detail=dot(snap.occasion.color)+aiEsc(snap.occasion.title);tag=aiDateLabel(snap.occasion.date);}
      break;
    }
    case 'save_note':{
      detail='«'+aiEsc((args.text||'').slice(0,70))+'»';
      tag=aiDateLabel(args.date);
      break;
    }
    case 'delete_note': tag=aiDateLabel(args.date); break;
    case 'log_vibe':{
      tag=res.moodLabel||'';
      if(args.taskTitle)detail='«'+aiEsc(String(args.taskTitle).slice(0,60))+'»';
      else if(args.note)detail='«'+aiEsc(String(args.note).slice(0,60))+'»';
      break;
    }
    case 'log_manual_session':{
      let info=aiTaskTitle(args.taskId,snap);
      if(!info&&snap.activity)info={title:(snap.activity.icon?snap.activity.icon+' ':'')+snap.activity.title,color:snap.activity.color};
      if(info)detail=dot(info.color)+aiEsc(info.title);
      tag=hmRange(args.start,args.end)+' • '+faNum(res.minutes||0)+' دقیقه';
      break;
    }
    case 'update_session':{
      const sid=args.sessionId;
      const ss=state.sessions.find(x=>x.id===sid)||snap.session;
      const info=aiTaskTitle(ss?ss.taskId:null,snap);
      if(info)detail=dot(info.color)+aiEsc(info.title);
      tag=hmRange(res.start,args.end||res.end)+' • '+faNum(res.minutes||0)+' دقیقه';
      break;
    }
    case 'delete_session':{
      if(snap.session){
        const info=aiTaskTitle(snap.session.taskId,{task:state.tasks.find(t=>t.id===snap.session.taskId)});
        if(info)detail=dot(info.color)+aiEsc(info.title);
        const sd=new Date(snap.session.start),ed=new Date(snap.session.end||snap.session.start);
        tag=hmRange(minToHM(sd.getHours()*60+sd.getMinutes()),minToHM(ed.getHours()*60+ed.getMinutes()));
      }
      break;
    }
    case 'start_timer':{ if(res.started)detail=dot(snap.task?snap.task.color:'#6fc3d3')+aiEsc(res.started); break; }
    case 'pause_timer':{ tag=faNum(Math.round((res.elapsedSeconds||0)/60))+' دقیقه تا الان'; break; }
    case 'stop_timer':{ tag=faNum(Math.round((res.elapsedSeconds||0)/60))+' دقیقه ذخیره شد'; break; }
    case 'create_plan':{
      const p=state.plans.find(x=>x.id===res.planId);
      if(p){detail=dot(p.color)+aiEsc(p.title);tag=aiDateLabel(p.date)+' • '+hmRange(res.start,res.end);}
      break;
    }
    case 'update_plan':{
      const p=state.plans.find(x=>x.id===args.planId);
      if(p){detail=dot(p.color)+aiEsc(p.title);tag=aiDateLabel(p.date)+' • '+hmRange(minToHM(p.startMin),minToHM(p.endMin));}
      break;
    }
    case 'delete_plan':{
      if(snap.plan){detail=dot(snap.plan.color)+aiEsc(snap.plan.title);tag=aiDateLabel(snap.plan.date);}
      break;
    }
    case 'create_alarm':{
      const a=state.alarms.find(x=>x.id===res.alarmId);
      const tt=a?titleOfAlarm(a):(args.title||'آلارم');
      detail=aiEsc(tt);
      tag=tagJoin([aiDateLabel(args.date),faNum(args.time||''),args.repeat&&args.repeat!=='none'?AI_REPEAT_FA[args.repeat]:null]);
      break;
    }
    case 'delete_alarm':{
      if(snap.alarm)detail=aiEsc(titleOfAlarm(snap.alarm));
      break;
    }
  }
  return {cat:meta.cat,title,detail,tag};
}
function titleOfAlarm(a){return a.title||a.taskTitle||'آلارم';}

// ---------- Chat DOM ----------
const AI_AVATAR_BOT='<div class="ai2-av"><svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/></svg></div>';
const AI_AVATAR_USER='<div class="ai2-av"><svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4-4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg></div>';
function actionRowEl(d,mode){
  const row=document.createElement('div');
  row.className='ai2-act'+(mode==='pending'?' pending':'')+(d.err?' err':'');
  const st=mode==='pending'?'<div class="ai2-spin"></div>'
    :`<span class="ai2-act-st">${aiIconSvg(d.err?'x':'check',16)}</span>`;
  const tag=d.tag?` • <span style="color:var(--teal)">${d.tag}</span>`:'';
  row.innerHTML=`<div class="ai2-act-ic ic-${d.cat}">${aiIconSvg(d.cat,15)}</div>
    <div class="ai2-act-main">
      <div class="ai2-act-t">${aiEsc(d.title)}</div>
      ${d.detail?`<div class="ai2-act-d">${d.detail}${tag}</div>`:(tag?`<div class="ai2-act-d"><span style="color:var(--teal)">${d.tag}</span></div>`:'')}
    </div>${st}`;
  return row;
}
function actionsCardEl(actions){
  const card=document.createElement('div');card.className='ai2-acts';
  card.innerHTML=`<div class="ai2-acts-head"><span class="wand">${aiIconSvg('wand',13)}</span> تغییرات اعمال‌شده • ${faNum(actions.length)}</div>`;
  const list=document.createElement('div');
  actions.forEach(d=>list.appendChild(actionRowEl(d,'done')));
  card.appendChild(list);
  return card;
}
function chatId(m){ if(m && !m.id) m.id=uid(); }
let replyDraft=null;
function replyBtnHtml(m){
  return `<button type="button" class="ai2-reply" data-reply-id="${m.id}" title="پاسخ"><svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/></svg></button>`;
}
function userTurnEl(m){
  chatId(m);
  const wrap=document.createElement('div');wrap.className='ai2-turn user';
  const bub=`<div class="ai2-bub">${quoteHtml(m)}<div class="ai2-bub-tx">${aiFormat(m.text||'')}</div></div>`;
  wrap.innerHTML=AI_AVATAR_USER+`<div class="ai2-col">${bub}${replyBtnHtml(m)}${m.ts?`<div class="ai2-meta">${aiClock(m.ts)}</div>`:''}</div>`;
  wrap.querySelector('[data-reply-id]')?.addEventListener('click',()=>setReplyDraft(m));
  return wrap;
}
function botTurnEl(m){
  chatId(m);
  const wrap=document.createElement('div');
  wrap.className='ai2-turn bot'+(m.error?' error':'');
  if(m.kind==='system'){
    wrap.className='ai2-syswrap';
    wrap.innerHTML=`<div class="ai2-sys">${aiEsc(m.text||'')}</div>`;
    return wrap;
  }
  const col=document.createElement('div');col.className='ai2-col';
  if(m.text){
    const b=document.createElement('div');b.className='ai2-bub';
    b.innerHTML=quoteHtml(m)+`<div class="ai2-bub-tx">${aiFormat(m.text)}</div>`;col.appendChild(b);
  }
  if(Array.isArray(m.actions)&&m.actions.length)col.appendChild(actionsCardEl(m.actions));
  if(m.ts){const t=document.createElement('div');t.className='ai2-meta';t.textContent=aiClock(m.ts);col.appendChild(t);}
  col.insertAdjacentHTML('beforeend',replyBtnHtml(m));
  wrap.innerHTML=AI_AVATAR_BOT;wrap.appendChild(col);
  wrap.querySelector('[data-reply-id]')?.addEventListener('click',()=>setReplyDraft(m));
  return wrap;
}
function welcomeEl(){
  const w=document.createElement('div');w.className='ai2-empty';
  const mode=state.settings.aiMode;
  const ico=mode==='vibe'
    ?'<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>'
    :'<path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/>';
  const txt=mode==='vibe'
    ?'در حالت وایبی: بگو چی خوشحالت می‌کنه یا چه کاری خسته‌ات کرده؛ کارهای سخت را عقب می‌اندازد و تفریح جور می‌کند.'
    :'گفتگویی نیست؛ پایین پیام بنویس تا شروع کنیم.<br>می‌تواند تسک بسازد، زمان ثبت کند، تقویم و برنامه بچیند.';
  w.innerHTML=`
    <div class="ai2-empty-ic"><svg viewBox="0 0 24 24" width="23" height="23" fill="currentColor">${ico}</svg></div>
    <div class="ai2-empty-t">${txt}</div>`;
  return w;
}
// Composer reply draft bar
function setReplyDraft(m){
  replyDraft={id:m.id,role:m.role==='user'?'user':'assistant',preview:msgPreview(m)};
  renderReplyBar();
  document.getElementById('aiInput')?.focus();
}
function renderReplyBar(){
  const bar=document.getElementById('aiReplyBar');if(!bar)return;
  if(!replyDraft){bar.hidden=true;bar.innerHTML='';return;}
  bar.hidden=false;
  const who=replyDraft.role==='user'?'شما':'هوش مصنوعی';
  bar.innerHTML=`<span class="rb-ic"><svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/></svg></span>
    <span class="rb-tx"><b>پاسخ به ${who}:</b> ${aiEsc(replyDraft.preview)}</span>
    <button type="button" class="rb-x" id="rbCancel">✕</button>`;
  document.getElementById('rbCancel')?.addEventListener('click',()=>{replyDraft=null;renderReplyBar();});
}
function updateAIStatus(){ /* status elements removed; kept as a safe no-op hook */ }
function renderAIChat(){
  const box=document.getElementById('aiMessages'); if(!box) return;
  box.innerHTML='';
  updateAIStatus();
  try{renderReplyBar();}catch(e){}
  if(state.aiChat.length===0){box.appendChild(welcomeEl());aiScroll();return;}
  state.aiChat.forEach(m=>{
    box.appendChild(m.role==='user'?userTurnEl(m):botTurnEl(m));
  });
  aiScroll();
}
function aiScroll(){const b=document.getElementById('aiMessages');if(b)b.scrollTop=b.scrollHeight;}
// Live (streaming) assistant turn: typing bubble + read chips + action cards filling in
function aiLiveTurn(){
  const root=document.createElement('div');root.className='ai2-turn bot';
  root.innerHTML=AI_AVATAR_BOT+`<div class="ai2-col">
    <div class="ai2-bub" data-typing><span class="ai2-typing"><span class="dots"><span></span><span></span><span></span></span><span data-label style="font-size:11px;color:var(--ash);margin-right:8px">در حال فکر…</span></span></div>
    <div class="ai2-reads" data-reads hidden></div>
    <div class="ai2-acts" data-acts hidden><div class="ai2-acts-head"><span class="wand">${aiIconSvg('wand',13)}</span> در حال اعمال تغییرات…</div><div class="ai2-acts-list"></div></div>
  </div>`;
  document.getElementById('aiMessages')?.appendChild(root);aiScroll();
  const typing=root.querySelector('[data-typing]'),label=root.querySelector('[data-label]');
  const reads=root.querySelector('[data-reads]'),acts=root.querySelector('[data-acts]'),list=root.querySelector('.ai2-acts-list');
  return {
    root,
    setLabel(t){typing.style.display='';label.textContent=t;aiScroll();},
    read(lab){
      reads.hidden=false;
      const c=document.createElement('span');c.className='ai2-read';
      c.innerHTML=aiIconSvg('read',12)+'<span>'+aiEsc(lab)+'</span>';
      reads.appendChild(c);aiScroll();
    },
    addPending(d){acts.hidden=false;const r=actionRowEl(d,'pending');list.appendChild(r);aiScroll();return r;},
    finish(row,d){row.replaceWith(actionRowEl(d,'done'));aiScroll();}
  };
}
// Free-text thinking level (e.g. off / low / medium / high, or a token-budget number)
function parseThinkingBudget(raw){
  const s=String(raw==null?'':raw).trim().toLowerCase();
  if(s===''||s==='default'||s==='پیش‌فرض')return null;
  if(/^(0|off|none|disabled|خاموش|بدون تفکر)/.test(s))return 0;
  if(/^(low|minimal|کم|پایین|سبک)/.test(s))return 128;
  if(/^(med|medium|normal|متوسط|معمولی)/.test(s))return 1024;
  if(/^(high|deep|max|maximum|بالا|زیاد|عمیق|زیاد)/.test(s))return -1;
  if(/^\d+$/.test(s))return Math.max(0,parseInt(s));
  return null; // unknown text -> model default
}
function geminiGenerationConfig(temperature,maxOutputTokens){
  const gc={temperature:temperature==null?0.75:temperature,maxOutputTokens:maxOutputTokens||1400};
  const budget=parseThinkingBudget(state.settings.aiThinking);
  if(budget===0)gc.thinkingConfig={thinkingBudget:0};
  else if(budget===-1){gc.thinkingConfig={thinkingBudget:-1};gc.maxOutputTokens=Math.max(gc.maxOutputTokens,2048);}
  else if(budget>0)gc.thinkingConfig={thinkingBudget:budget};
  return gc;
}
async function geminiGenerate(contents,planMode,systemOverride){
  const key=(state.settings.aiApiKey||'').trim();
  const model=(state.settings.aiModel||DEFAULT_AI_MODEL).trim();
  if(!key) throw new Error('کلید API در تنظیمات ← هوش مصنوعی وارد نشده است.');
  const body={
    systemInstruction:{parts:[{text:systemOverride||buildAISystemPrompt(planMode)}]},
    contents,
    tools:[{functionDeclarations:buildAITools(planMode)}],
    toolConfig:{functionCallingConfig:{mode:'AUTO'}},
    generationConfig:geminiGenerationConfig(0.75,1400)
  };
  const url='https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent?key='+encodeURIComponent(key);
  const opts={method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)};
  let res=null,data=null,lastErr='';
  for(let attempt=0;attempt<3;attempt++){
    try{
      res=await fetch(url,opts);
      try{data=await res.json();}catch(e){data=null;}
      if(res.ok)return data;
      lastErr=data?.error?.message||('HTTP '+res.status);
      if([503,500,504,429].includes(res.status)){await new Promise(r=>setTimeout(r,700*(attempt+1)*(attempt+1)));continue;}
      break;
    }catch(netErr){lastErr=netErr.message;await new Promise(r=>setTimeout(r,700*(attempt+1)*(attempt+1)));}
  }
  const status=res?res.status:0;
  if(status===400) throw new Error('درخواست نامعتبر (اغلب نام مدل اشتباه است): '+lastErr.slice(0,180));
  if(status===403||status===401) throw new Error('کلید API نامعتبر است یا دسترسی ندارد. ('+status+')');
  if(status===429) throw new Error('سهمیه/محدودیت کلید API تمام شد (429). کمی بعد دوباره تلاش کن.');
  if([503,500,504].includes(status)) throw new Error('مدل فعلاً شلوغ است (503). چند لحظه دیگر دوباره پیام بده.');
  throw new Error('خطای Gemini: '+lastErr.slice(0,200));
}
async function sendAIMessage(rawText){
  const text=(rawText||'').trim();
  if(!text||aiBusy)return;
  aiBusy=true; updateSendBtn();
  const quote=replyDraft?{role:replyDraft.role,preview:replyDraft.preview}:null;
  replyDraft=null;
  state.aiChat.push({role:'user',text,ts:Date.now(),quote});
  if(state.aiChat.length>60) state.aiChat=state.aiChat.slice(-60);
  save(); renderAIChat();
  const planMode=aiPlanMode();
  const contents=state.aiChat.slice(-20).map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.quote?`(در پاسخ به ${m.quote.role==='user'?'پیام قبلی کاربر':'پیام قبلی هوش مصنوعی'}: «${m.quote.preview}»)\n${m.text}`:m.text}]}));
  const actions=[];
  const live=aiLiveTurn();
  try{
    let finalText='';
    for(let iter=0;iter<8;iter++){
      live.setLabel(iter===0?(planMode?'در حال برنامه‌ریزی…':'در حال فکر…'):'در حال فکر…');
      const data=await geminiGenerate(contents,planMode);
      const cand=data?.candidates?.[0];
      if(!cand||!cand.content||!Array.isArray(cand.content.parts)){
        const reason=cand?.finishReason||'UNKNOWN';
        if(reason==='SAFETY'||reason==='PROHIBITED_CONTENT') throw new Error('پاسخ توسط فیلتر ایمنی Gemini متوقف شد.');
        throw new Error('پاسخی از مدل دریافت نشد ('+reason+').');
      }
      contents.push({role:'model',parts:cand.content.parts.map(p=>({...p}))});
      const calls=cand.content.parts.filter(p=>p.functionCall);
      const txt=cand.content.parts.filter(p=>typeof p.text==='string').map(p=>p.text).join('').trim();
      if(txt) finalText+=(finalText?'\n':'')+txt;
      if(calls.length===0) break;
      for(const c of calls){
        const fc=c.functionCall,name=fc.name,args=fc.args||{};
        const meta=AI_TOOL_UI[name];
        const respPart={role:'user',parts:[{functionResponse:{name,response:(()=>{const r=executeAITool(name,args);return r;})()}}]};
        if(meta&&meta.cat==='read'){
          live.read(name==='get_tasks'?'مرور فهرست تسک‌ها':'مرور وضعیت و داده‌ها');
        }else{
          const snap=aiSnap(name,args);
          const row=live.addPending({cat:meta?meta.cat:'task',title:meta?meta.verb:'اقدام'});
          live.setLabel('در حال اعمال تغییرات…');
          const result=respPart.parts[0].functionResponse.response;
          const d=describeAIToolAction(name,args,result,snap)||{cat:'task',title:'اقدام',detail:'',err:!result.ok};
          actions.push(d); live.finish(row,d);
        }
        contents.push(respPart);
      }
      // Tool-call candidates also arrive with finishReason STOP; only stop when the
      // model came back without calls (i.e. its actual final text), or max iters.
    }
    if(!finalText.trim()) finalText=actions.length?'همه‌ی تغییرات درخواستی اعمال شد.':'انجام شد.';
    state.aiChat.push({role:'assistant',text:finalText,ts:Date.now(),actions:actions.length?actions:undefined}); save();
  }catch(e){
    state.aiChat.push({role:'assistant',text:'❌ '+e.message,error:true,ts:Date.now(),actions:actions.length?actions:undefined}); save();
  }finally{
    live.root.remove();
    renderAIChat();
    aiBusy=false; updateSendBtn();
  }
}
function updateSendBtn(){const b=document.getElementById('aiSendBtn');if(b)b.disabled=aiBusy;}

// ---------- Permissions / capabilities box ----------
function renderAIPermissions(){
  const capsBox=document.getElementById('aiCapRows'); if(!capsBox)return;
  capsBox.innerHTML='';
  Object.entries(AI_CAP_META).forEach(([key,meta])=>{
    const row=document.createElement('div'); row.className='ai-perm-row';
    row.innerHTML=`<span class="perm-text">${meta.label}<span class="perm-desc">${meta.desc}</span></span><button class="switch ${state.settings.aiCaps[key]?'on':''}" data-cap="${key}" type="button"></button>`;
    capsBox.appendChild(row);
  });
  capsBox.querySelectorAll('[data-cap]').forEach(b=>b.addEventListener('click',()=>{
    const k=b.dataset.cap; state.settings.aiCaps[k]=!state.settings.aiCaps[k];
    b.classList.toggle('on',state.settings.aiCaps[k]);
    save(); updatePermsSummary();
  }));
  document.querySelectorAll('#aiScopePills [data-scope]').forEach(b=>{
    b.onclick=()=>{
      state.settings.aiDataAccess=b.dataset.scope; save();
      document.querySelectorAll('#aiScopePills [data-scope]').forEach(x=>x.classList.toggle('active',x===b));
      updatePermsSummary();
    };
  });
  document.querySelectorAll('#aiScopePills [data-scope]').forEach(b=>b.classList.toggle('active',b.dataset.scope===(state.settings.aiDataAccess||'all')));
  updatePermsSummary();
}
function updatePermsSummary(){
  const el=document.getElementById('aiPermsSummary'); if(!el)return;
  const caps=aiCaps();
  const total=Object.keys(AI_CAP_META).length;
  const n=Object.keys(AI_CAP_META).filter(k=>caps[k]).length;
  el.textContent=faNum(n)+'/'+faNum(total)+' قابلیت • '+(state.settings.aiDataAccess==='today'?'فقط امروز':'همه زمان‌ها');
  const ntf=document.getElementById('aiPermsNtf');
  if(ntf){const off=Object.keys(AI_CAP_META).length-n;ntf.textContent=faNum(off);ntf.style.display=off>0?'flex':'none';}
}

// ---------- Settings tab AI key/model ----------
function initAISettingsUI(){
  const pill=document.getElementById('aiModelPill');
  const keyEl=document.getElementById('aiApiKey'), modelEl=document.getElementById('aiModel');
  if(keyEl)keyEl.value=state.settings.aiApiKey||'';
  if(modelEl)modelEl.value=state.settings.aiModel||DEFAULT_AI_MODEL;
  if(pill)pill.textContent=(state.settings.aiModel||DEFAULT_AI_MODEL).replace('models/','');
  // Free-text thinking level
  const thinkInp=document.getElementById('aiThinkInput');
  if(thinkInp)thinkInp.value=state.settings.aiThinking||'';
  thinkInp?.addEventListener('change',()=>{
    state.settings.aiThinking=(thinkInp.value||'').trim();save();
    const st=document.getElementById('aiSettingsStatus');
    const b=parseThinkingBudget(state.settings.aiThinking);
    if(st){st.textContent='✅ سطح تفکر ذخیره شد'+(b===null&&state.settings.aiThinking?' (متن ناشناخته → پیش‌فرض مدل)':'');st.style.color='var(--green)';}
  });
  document.getElementById('saveAiSettings')?.addEventListener('click',()=>{
    const st=document.getElementById('aiSettingsStatus');
    state.settings.aiApiKey=keyEl?keyEl.value.trim():'';
    state.settings.aiModel=(modelEl?modelEl.value.trim():'')||DEFAULT_AI_MODEL;
    save();
    if(pill)pill.textContent=state.settings.aiModel;
    if(st){st.textContent='✅ ذخیره شد';st.style.color='var(--green)';}
  });
  document.getElementById('testAiBtn')?.addEventListener('click',async()=>{
    const st=document.getElementById('aiSettingsStatus');
    if(keyEl)state.settings.aiApiKey=keyEl.value.trim();
    if(modelEl)state.settings.aiModel=modelEl.value.trim()||DEFAULT_AI_MODEL;
    if(st){st.textContent='در حال تست...';st.style.color='var(--fog)';}
    try{
      const data=await geminiGenerate([{role:'user',parts:[{text:'فقط بنویس: سلام'}]}],false);
      const t=data?.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('')||'';
      if(st){st.textContent='✅ اتصال برقرار است — پاسخ: '+t.trim().slice(0,40);st.style.color='var(--green)';}
    }catch(e){if(st){st.textContent='❌ '+e.message;st.style.color='var(--coral)';}}
  });
}
function dispatchSend(text){
  return sendAIMessage(text);
}
document.getElementById('aiSendBtn')?.addEventListener('click',()=>{
  const inp=document.getElementById('aiInput'); dispatchSend(inp?inp.value:''); if(inp){inp.value='';inp.style.height='auto';}
});
document.getElementById('aiInput')?.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();dispatchSend(e.target.value);e.target.value='';e.target.style.height='auto';}
});
document.getElementById('aiInput')?.addEventListener('input',e=>{
  const t=e.target; t.style.height='auto'; t.style.height=Math.min(t.scrollHeight,130)+'px';
});
document.getElementById('aiClearBtn')?.addEventListener('click',()=>{state.aiChat=[];save();renderAIChat();closeAIPerms();});
// AI mode toggle (task / vibe): only the system prompt changes
function setAIMode(mode){
  if(mode!=='task'&&mode!=='vibe')mode='task';
  state.settings.aiMode=mode;save();
  document.querySelectorAll('#aiModeSeg [data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
  const inp=document.getElementById('aiInput');
  if(inp)inp.placeholder=mode==='vibe'?'با وایب حرف بزن؛ بگو چی خوشحالت می‌کنه، چی خسته‌ات کرده…':'از هوش مصنوعی بپرس، تسک بساز، برنامه‌ریزی کن…';
  renderAIChat();
}
document.querySelectorAll('#aiModeSeg [data-mode]').forEach(b=>b.addEventListener('click',()=>setAIMode(b.dataset.mode)));
setAIMode(state.settings.aiMode||'task');
// Capabilities live in a modal opened from the shield icon
function openAIPerms(){document.getElementById('aiPermsModal')?.classList.add('show');}
function closeAIPerms(){document.getElementById('aiPermsModal')?.classList.remove('show');}
document.getElementById('aiPermsBtn')?.addEventListener('click',openAIPerms);
document.getElementById('aiPermsClose')?.addEventListener('click',closeAIPerms);
document.getElementById('aiPermsModal')?.addEventListener('click',e=>{if(e.target.id==='aiPermsModal')closeAIPerms();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeAIPerms();});
// Manual session listeners already wired in the timer section above
// Build weekday chips once DOM is ready
buildWeekdayChips();

// Debug/test bridge (read-only-ish access to live state; harmless in production)
try{ globalThis.__outtaskState=state; }catch(e){}

// Initial check
setTimeout(checkEyeCareStatus, 500);