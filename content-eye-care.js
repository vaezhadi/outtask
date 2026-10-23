// Outtask Eye Care - Content Script
// Shows eye fatigue warning popup every 20 minutes when enabled

(function() {
  if (window.__outtaskEyeCareInjected) return;
  window.__outtaskEyeCareInjected = true;

  const SOUND_URL = chrome.runtime.getURL('sounds/notify.wav');

  function playNotificationSound() {
    try {
      const audio = new Audio(SOUND_URL);
      audio.volume = 0.6;
      audio.play().catch(e => console.log('[Outtask EyeCare] Audio play failed', e));
    } catch (e) {
      console.log('[Outtask EyeCare] Audio error', e);
    }
  }

  function showEyeBreakPopup() {
    // Avoid duplicate popups
    if (document.getElementById('outtask-eye-break-overlay')) return;

    playNotificationSound();

    const overlay = document.createElement('div');
    overlay.id = 'outtask-eye-break-overlay';
    overlay.style.cssText = `
      position:fixed;inset:0;z-index:2147483647;
      background:rgba(8,9,10,0.85);backdrop-filter:blur(12px);
      display:grid;place-items:center;
      font-family:system-ui, sans-serif;
      animation:outtaskFadeIn 0.4s ease;
    `;

    const card = document.createElement('div');
    card.style.cssText = `
      background:#0f1011;border:0.5px solid #23252a;border-radius:20px;
      padding:32px 36px;max-width:420px;width:90%;
      text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.5);
      color:#d0d6e0;
    `;

    card.innerHTML = `
      <div style="width:64px;height:64px;border-radius:16px;background:#e4f222;display:grid;place-items:center;margin:0 auto 16px;font-size:32px">👁️</div>
      <div style="font-size:20px;font-weight:700;color:#fff;margin-bottom:8px">هشدار خستگی چشم</div>
      <div style="font-size:13px;color:#8a8f98;margin-bottom:20px;line-height:1.6">۲۰ دقیقه کار کردی، وقتشه ۲۰ ثانیه به دور نگاه کنی (قانون ۲۰-۲۰-۲۰)<br>چشمات رو استراحت بده</div>
      <div id="outtask-eye-countdown" style="font-size:56px;font-weight:300;letter-spacing:-0.05em;color:#fff;margin:12px 0">20</div>
      <div style="font-size:12px;color:#62666d">ثانیه تا بسته شدن خودکار</div>
      <button id="outtask-eye-close" style="margin-top:20px;background:rgba(255,255,255,0.06);border:0.5px solid #383b3f;color:#d0d6e0;border-radius:8px;padding:8px 16px;cursor:pointer;font-size:13px">بستن الان</button>
    `;

    overlay.appendChild(card);
    document.documentElement.appendChild(overlay);

    // Add style for animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes outtaskFadeIn{from{opacity:0}to{opacity:1}}
      @keyframes outtaskFadeOut{from{opacity:1}to{opacity:0}}
    `;
    document.head.appendChild(style);

    let count = 20;
    const countdownEl = card.querySelector('#outtask-eye-countdown');
    const closeBtn = card.querySelector('#outtask-eye-close');

    const interval = setInterval(() => {
      count--;
      if (countdownEl) countdownEl.textContent = count;
      if (count <= 0) {
        clearInterval(interval);
        closePopup();
      }
    }, 1000);

    function closePopup() {
      clearInterval(interval);
      overlay.style.animation = 'outtaskFadeOut 0.4s ease forwards';
      setTimeout(() => {
        overlay.remove();
        style.remove();
      }, 400);
    }

    closeBtn.addEventListener('click', closePopup);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closePopup();
    });

    // Auto-close after 22 sec just in case
    setTimeout(closePopup, 22000);
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === 'SHOW_EYE_BREAK') {
      showEyeBreakPopup();
      sendResponse({ok:true});
    }
    return true;
  });

  console.log('[Outtask] Eye care content script loaded');
})();
