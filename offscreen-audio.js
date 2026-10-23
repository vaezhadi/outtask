// Outtask - Offscreen audio player for alarms (service workers cannot play audio)
let audioEl = null;

function resolveSrc(src) {
  if (!src) src = 'sounds/notify.mp3';
  if (src.startsWith('data:') || src.startsWith('http') || src.startsWith('blob:')) return src;
  return chrome.runtime.getURL(src);
}

chrome.runtime.onMessage.addListener((msg) => {
  if (!msg || !msg.type) return;
  if (msg.type === 'OFFSCREEN_PLAY') {
    try {
      if (!audioEl) audioEl = document.getElementById('alarmAudio');
      audioEl.src = resolveSrc(msg.sound);
      audioEl.loop = true;
      audioEl.volume = 0.9;
      audioEl.play().catch(e => console.log('[Offscreen] play failed', e));
    } catch (e) { console.log('[Offscreen] play error', e); }
  }
  if (msg.type === 'OFFSCREEN_STOP') {
    try {
      if (!audioEl) audioEl = document.getElementById('alarmAudio');
      audioEl.pause();
      audioEl.currentTime = 0;
    } catch (e) {}
  }
});
