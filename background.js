// Outtask - Background Service Worker (MV3)
chrome.action.onClicked.addListener(async () => {
  const url = chrome.runtime.getURL("index.html");
  const tabs = await chrome.tabs.query({ url });
  if (tabs.length > 0) {
    await chrome.tabs.update(tabs[0].id, { active: true });
    await chrome.windows.update(tabs[0].windowId, { focused: true });
  } else {
    await chrome.tabs.create({ url });
  }
});

// --- Eye Care ---
const EYE_ALARM_NAME = 'outtask_eye_care';
const EYE_STORAGE_KEY = 'outtask_eye_care_enabled';

async function isEyeCareEnabled() {
  const res = await chrome.storage.local.get([EYE_STORAGE_KEY]);
  return !!res[EYE_STORAGE_KEY];
}

async function showEyeBreakOnAllTabs() {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (!tab.id) continue;
      if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://'))) continue;
      try {
        await chrome.tabs.sendMessage(tab.id, { type: 'SHOW_EYE_BREAK' });
      } catch (e) {
        try {
          await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content-eye-care.js'] });
          setTimeout(async () => { try { await chrome.tabs.sendMessage(tab.id, { type: 'SHOW_EYE_BREAK' }); } catch {} }, 500);
        } catch {}
      }
    }
    try {
      chrome.notifications.create('outtask-eye-break', {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'هشدار خستگی چشم 👁️',
        message: '۲۰ دقیقه گذشت! ۲۰ ثانیه به دور نگاه کن (قانون ۲۰-۲۰-۲۰)',
        priority: 2
      });
    } catch {}
  } catch (e) { console.error(e); }
}

// --- User Alarms (AI + manual, with repetition) ---
const ALARM_PREFIX = 'outtask_alarm_';

// Same algorithm as app.js nextAlarmTime()
function nextAlarmTime(alarm, fromMs) {
  const base = new Date(alarm.time);
  const h = base.getHours(), m = base.getMinutes();
  const at = d => { d.setHours(h, m, 0, 0); return d.getTime(); };
  const repeat = alarm.repeat || 'none';
  if (repeat === 'daily') {
    let d = new Date(fromMs); let t = at(d);
    if (t <= fromMs) { d = new Date(fromMs + 86400000); t = at(d); }
    return t;
  }
  if (repeat === 'weekly') {
    const wd = base.getDay();
    for (let i = 0; i < 9; i++) {
      const d = new Date(fromMs + i * 86400000);
      if (d.getDay() === wd) { const t = at(new Date(d)); if (t > fromMs) return t; }
    }
  }
  if (repeat === 'weekdays') { // every day except Friday (5)
    for (let i = 0; i < 9; i++) {
      const d0 = new Date(fromMs + i * 86400000);
      if (d0.getDay() !== 5) { const t = at(new Date(d0)); if (t > fromMs) return t; }
    }
  }
  if (repeat === 'custom' && Array.isArray(alarm.repeatDays)) {
    for (let i = 0; i < 9; i++) {
      const d0 = new Date(fromMs + i * 86400000);
      if (alarm.repeatDays.includes(d0.getDay())) { const t = at(new Date(d0)); if (t > fromMs) return t; }
    }
  }
  return 0;
}

async function hasOffscreenDocument() {
  if (!chrome.offscreen) return false;
  const contexts = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] });
  return contexts.length > 0;
}

async function playAlarmSound(soundSrc) {
  try {
    if (chrome.offscreen) {
      if (!(await hasOffscreenDocument())) {
        await chrome.offscreen.createDocument({
          url: 'offscreen-audio.html',
          reasons: ['AUDIO_PLAYBACK'],
          justification: 'Playing the user alarm notification sound'
        });
      }
      await chrome.runtime.sendMessage({ type: 'OFFSCREEN_PLAY', sound: soundSrc || 'sounds/notify.mp3' });
    }
  } catch (e) { console.log('[Alarm BG] sound error', e.message); }
}

async function stopAlarmSound() {
  try {
    if (chrome.offscreen && await hasOffscreenDocument()) {
      await chrome.runtime.sendMessage({ type: 'OFFSCREEN_STOP' });
    }
  } catch (e) {}
}

async function syncUserAlarms(alarms) {
  const existing = await chrome.alarms.getAll();
  for (const a of existing) {
    if (a.name && a.name.startsWith(ALARM_PREFIX)) await chrome.alarms.clear(a.name);
  }
  await chrome.storage.local.set({ outtask_alarms_meta: alarms || [] });
  if (!Array.isArray(alarms)) return;
  for (const a of alarms) {
    if (!a.enabled || a.fired) continue;
    if (!a.time || a.time < Date.now() - 60 * 1000) continue;
    await chrome.alarms.create(ALARM_PREFIX + a.id, { when: a.time });
  }
}

async function fireUserAlarm(alarmId) {
  try {
    const res = await chrome.storage.local.get(['outtask_alarms_meta', 'outtask_settings']);
    const list = res.outtask_alarms_meta || [];
    const alarm = list.find(a => a.id === alarmId);
    if (!alarm) return;
    const settings = res.outtask_settings || {};
    const sound = alarm.sound || settings.alarmSound || 'sounds/notify.mp3';
    const taskTitle = alarm.taskTitle || '';

    // Reschedule repeating alarms BEFORE notifying so message carries nextTime
    let nextTime = 0;
    if (alarm.repeat && alarm.repeat !== 'none') {
      nextTime = nextAlarmTime(alarm, Date.now() + 1000);
      if (nextTime) {
        alarm.time = nextTime;
        alarm.fired = false;
        await chrome.alarms.create(ALARM_PREFIX + alarm.id, { when: nextTime });
      }
    } else {
      alarm.fired = true;
      alarm.firedAt = Date.now();
    }
    await chrome.storage.local.set({ outtask_alarms_meta: list });

    // If an Outtask tab is open, let the page ring in-page (avoids doubled audio)
    const outtaskUrl = chrome.runtime.getURL('index.html');
    const tabs = await chrome.tabs.query({ url: outtaskUrl + '*' });
    let pageRang = false;
    for (const tab of tabs) {
      try { await chrome.tabs.sendMessage(tab.id, { type: 'ALARM_FIRE', alarm, nextTime }); pageRang = true; } catch (e) {}
    }
    if (!pageRang) await playAlarmSound(sound);
    chrome.notifications.create('outtask-user-alarm-' + alarm.id + '-' + Date.now(), {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: '⏰ ' + (alarm.title || 'آلارم Outtask'),
      message: taskTitle ? 'تسک: ' + taskTitle : 'زمان تعیین‌شده فرا رسید',
      priority: 2,
      requireInteraction: true
    });
  } catch (e) { console.error('[Alarm BG] fire error', e); }
}

chrome.notifications.onClicked.addListener(async (notifId) => {
  if (notifId && notifId.startsWith('outtask-user-alarm-')) {
    await stopAlarmSound();
    const url = chrome.runtime.getURL('index.html');
    const tabs = await chrome.tabs.query({ url: url + '*' });
    if (tabs.length > 0) {
      await chrome.tabs.update(tabs[0].id, { active: true });
      await chrome.windows.update(tabs[0].windowId, { focused: true });
    } else {
      await chrome.tabs.create({ url });
    }
    chrome.notifications.clear(notifId);
  }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === EYE_ALARM_NAME) {
    const enabled = await isEyeCareEnabled();
    if (enabled) await showEyeBreakOnAllTabs();
    else await chrome.alarms.clear(EYE_ALARM_NAME);
  } else if (alarm.name && alarm.name.startsWith(ALARM_PREFIX)) {
    await fireUserAlarm(alarm.name.slice(ALARM_PREFIX.length));
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || !msg.type) return;
  if (msg.type === 'EYE_CARE_START') {
    (async () => {
      await chrome.storage.local.set({ [EYE_STORAGE_KEY]: true });
      await chrome.alarms.clear(EYE_ALARM_NAME);
      await chrome.alarms.create(EYE_ALARM_NAME, { periodInMinutes: 20, delayInMinutes: 20 });
      sendResponse({ ok: true, enabled: true });
    })(); return true;
  }
  if (msg.type === 'EYE_CARE_STOP') {
    (async () => {
      await chrome.storage.local.set({ [EYE_STORAGE_KEY]: false });
      await chrome.alarms.clear(EYE_ALARM_NAME);
      sendResponse({ ok: true, enabled: false });
    })(); return true;
  }
  if (msg.type === 'EYE_CARE_STATUS') {
    (async () => { sendResponse({ enabled: await isEyeCareEnabled() }); })(); return true;
  }
  if (msg.type === 'TEST_EYE_BREAK') {
    (async () => { await showEyeBreakOnAllTabs(); sendResponse({ ok: true }); })(); return true;
  }
  if (msg.type === 'ALARM_SYNC') {
    (async () => { await syncUserAlarms(msg.alarms || []); sendResponse({ ok: true }); })(); return true;
  }
  if (msg.type === 'ALARM_STOP_SOUND') {
    (async () => { await stopAlarmSound(); sendResponse({ ok: true }); })(); return true;
  }
});

async function restoreAlarmsOnStartup() {
  try {
    const res = await chrome.storage.local.get(['outtask_alarms_meta']);
    if (Array.isArray(res.outtask_alarms_meta)) await syncUserAlarms(res.outtask_alarms_meta);
  } catch (e) {}
}

chrome.runtime.onStartup.addListener(async () => {
  const enabled = await isEyeCareEnabled();
  if (enabled) await chrome.alarms.create(EYE_ALARM_NAME, { periodInMinutes: 20, delayInMinutes: 20 });
  await chrome.alarms.clear('outtask_youtube_check'); // legacy v2.7 YouTube monitor
  await restoreAlarmsOnStartup();
});

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
  await chrome.alarms.clear('outtask_youtube_check'); // legacy v2.7 YouTube monitor
  await restoreAlarmsOnStartup();
});
