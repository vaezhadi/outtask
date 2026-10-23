// Runs every suite sequentially; exits non-zero if any suite fails.
// Suites never hit the live Gemini API (fetch is stubbed inside each suite).
const {spawnSync}=require('child_process');
const path=require('path');

const SUITES=[
  'multistep.js',   // multi-step task flow (fake DOM / vm)
  'vibe3.js',       // vibe check-ins & stats (fake DOM / vm)
  'v26.js',         // sleep-as-habit, timer-only activities, daily AI review
  'dom-multistep.js', // multi-step UI in jsdom
  'dom-v3.js',      // time tab, timer, manual sessions UI in jsdom
  'dom-habits2.js',  // habits tab UI in jsdom
  'dom-v4.js',      // v2.6 dashboard/sleep-habit/review UI in jsdom
  'dom-export.js'   // day-image export (planning section) in jsdom
];

let failed=0;
for(const s of SUITES){
  process.stdout.write('== '+s+' ==\n');
  const r=spawnSync(process.execPath,[path.join(__dirname,s)],{stdio:'inherit'});
  if(r.status!==0){failed++;process.stdout.write('SUITE FAILED: '+s+'\n');}
}
process.stdout.write('\n'+(SUITES.length-failed)+'/'+SUITES.length+' suites green\n');
process.exit(failed?1:0);
