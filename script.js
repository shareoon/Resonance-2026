// ============================================================
// RESONANCE 2026 — script.js (optimised & glitch-hardened)
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  // ── Inject flicker overlay (keeps flicker off <body> to avoid full recomposite) ──
  const flickerOverlay = document.createElement('div');
  flickerOverlay.id = 'flicker-overlay';
  document.body.insertBefore(flickerOverlay, document.body.firstChild);

  // ── DOM refs ─────────────────────────────────────────────
  const video     = document.getElementById('heroVideo');
  const soundBtn  = document.getElementById('soundToggle');
  const gate      = document.getElementById('entrance-gate');
  const enterBtn  = document.getElementById('enter-btn');

  // ── 1. Hero video: force muted autoplay (browser policy) ─
  video.muted = true;
  video.play().catch(() => {}); // silence the promise rejection — expected on mobile


  // ── 2. Entrance gate — door zoom animation ────────────────
  if (enterBtn) {
    enterBtn.addEventListener('click', () => {
      // Unmute hero video
      video.muted = false;
      video.play().catch(() => {});
      soundBtn.textContent = '🔊';
      localStorage.setItem('soundEnabled', 'true');

      // Step 1: button fades out
      enterBtn.style.transition = 'opacity 0.35s ease';
      enterBtn.style.opacity = '0';
      enterBtn.style.pointerEvents = 'none';

      // Step 2: image zooms in like walking through the door
      const doorImg = document.getElementById('entranceimage');
      setTimeout(() => {
        if (doorImg) {
          doorImg.style.transition = 'transform 1.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
          doorImg.style.transformOrigin = 'center center';
          doorImg.style.transform = 'scale(6)';
        }
        // Gate fades out as zoom reaches full
        gate.style.transition = 'opacity 0.75s ease';
        gate.style.opacity = '0';
      }, 300);

      // Step 3: hide gate entirely after animation
      setTimeout(() => {
        gate.style.display = 'none';
        if (doorImg) doorImg.style.transform = '';
        gate.style.opacity = '';
      }, 2100);
    });
  }




  // ── 3. Mute toggle ───────────────────────────────────────
  soundBtn.addEventListener('click', e => {
    e.stopPropagation();
    video.muted = !video.muted;
    soundBtn.textContent = video.muted ? '🔇' : '🔊';
    localStorage.setItem('soundEnabled', String(!video.muted));
  });

  // ── 4. Mobile wake-up fallback ───────────────────────────
  document.body.addEventListener('touchstart', () => {
    if (video.paused) video.play().catch(() => {});
  }, { once: true });

  // ── 5. Scroll reveal (IntersectionObserver) ──────────────
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revealObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  // ── 6. Video parallax (rAF-throttled) ───────────────────
  // GLITCH FIX: previously `ticking` was never reset to false inside the rAF
  // callback, so after the first scroll the flag stayed true and no further
  // frames were scheduled. Fixed below.
  const parallaxVideo = document.querySelector('.hero-video-wrap video');
  if (parallaxVideo) {
    parallaxVideo.style.transform = 'translateY(0px) scale(1.08)';
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          const shift = Math.min(window.scrollY * 0.35, 120);
          parallaxVideo.style.transform = `translateY(${shift}px) scale(1.08)`;
          ticking = false; // ← was missing; caused parallax to freeze after first frame
        });
      }
    }, { passive: true }); // passive: true = no jank on mobile
  }

  // ── 7. Scroll indicator ──────────────────────────────────
  (function buildScrollIndicator() {
    const header = document.querySelector('header');
    if (!header) return;

    const ind = document.createElement('div');
    ind.setAttribute('aria-label', 'Scroll down');
    ind.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 5v14M5 12l7 7 7-7"/>
    </svg>`;
    ind.style.cssText = `
      position:absolute;bottom:2.5rem;left:50%;transform:translateX(-50%);
      color:rgba(200,0,0,0.7);z-index:10;
      animation:scrollBounce 1.8s ease-in-out infinite;
      cursor:pointer;
      filter:drop-shadow(0 0 8px rgba(200,0,0,0.6));
      will-change:transform,opacity;
    `;

    // Inject keyframe only once
    if (!document.getElementById('kf-scrollBounce')) {
      const kf = document.createElement('style');
      kf.id = 'kf-scrollBounce';
      kf.textContent = `@keyframes scrollBounce{0%,100%{transform:translateX(-50%) translateY(0);}50%{transform:translateX(-50%) translateY(10px);}}`;
      document.head.appendChild(kf);
    }

    ind.addEventListener('click', () =>
      document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })
    );
    header.appendChild(ind);

    // Fade out on scroll (passive, no layout thrash)
    window.addEventListener('scroll', () => {
      ind.style.opacity = String(Math.max(0, 1 - window.scrollY / 200));
    }, { passive: true });
  })();

  // ── 8. Brochure overlays ─────────────────────────────────
  // FIX: pure class-based, no display toggling.
  // The overlay is always in the render tree (visibility:hidden in CSS base).
  // Adding .open triggers overlayOpen keyframe; adding .closing triggers
  // overlayClose. No reflow hack needed, animation always has a clean start.

  function _finishClose(el) {
    el.classList.remove('closing');
    if (!document.querySelector('.brochure-overlay.open')) {
      document.body.style.overflow = '';
    }
  }

  // ── 9. Registration screen ───────────────────────────────
  // Same visibility-based system — no display:none/block anywhere.

  function openRegistration() {
    const regScreen = document.getElementById('registration-screen');
    const regVideo  = document.getElementById('regVideo');
    if (!regScreen) return;

    regScreen.classList.remove('closing');
    history.pushState({ overlay: 'registration' }, '', '');
    regScreen.classList.add('open');
    document.body.style.overflow = 'hidden';

    if (regVideo) {
      regVideo.currentTime = 0;
      regVideo.play().catch(() => {});
    }
  }

  function closeRegistration() {
    const regScreen = document.getElementById('registration-screen');
    if (!regScreen || !regScreen.classList.contains('open')) return;

    regScreen.classList.remove('open');
    regScreen.classList.add('closing');

    const onDone = () => {
      regScreen.classList.remove('closing');
      document.body.style.overflow = '';
    };

    regScreen.addEventListener('animationend', onDone, { once: true });
    setTimeout(() => { if (regScreen.classList.contains('closing')) onDone(); }, 450);
  }

  window.openRegistration  = openRegistration;
  window.closeRegistration = closeRegistration;

  // ── 10. Schedule tabs ────────────────────────────────────
  function switchTab(idx) {
    document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', i === idx));
    document.querySelectorAll('.tab-content').forEach((c, i) => c.classList.toggle('active', i === idx));
  }
  window.switchTab = switchTab;

  (function() {
    const HOURS = [9,10,11,12,13,14,15,16,17,18,19,20,21];

    const day0 = [
      { name: 'Hardware Hackathon', name1:'The Gate Protocol',  start: 11, end: 21, color: 'tl-red' },
      { name: 'Robo Race', name1:'Escape from Camazotz',           start: 11, end: 17, color: 'tl-red' },
      { name: 'Robo Soccer', name1:'The Starcourt Battle',         start: 11, end: 19, color: 'tl-red' },
      { name: 'Tech Quiz', name1:'Mind Trial', start: 11, end: 15, color: 'tl-cyan' },
      { name: 'Project Presentation', name1:'The NINA Project', start: 11, end: 17, color: 'tl-red' },
      { name: 'FIFA 26', name1:'Eleven’s KickOff',             start: 10, end: 17, color: 'tl-cyan' },
      { name: 'Prompt Mania', name1:' Mindscape Protocol',        start: 11, end: 17, color: 'tl-red' },
    ];

    const day1 = [
      { name: 'Robo Race (cont.)',  name1:'Escape from Camazotz',       start: 9, end: 17, color: 'tl-red' },
      { name: 'Robo Sumo',         name1:'VECNA’S COLOSSEUM',        start: 10, end: 19, color: 'tl-red' },
      { name: 'Line Follower Robot',  name1:'The Rift Track',      start: 10, end: 17, color: 'tl-red' },
      { name: 'PCB Design',          name1:'Circuit Protocol',      start: 9, end: 21, color: 'tl-red' },
      { name: 'Ideathon (Shark Tank)', name1:'Dustin’s Cerebro',     start: 10, end: 17, color: 'tl-red' },
      { name: 'Treasure Hunt',        name1:'Crawl : Beneath Hawkins',     start: 9, end: 17, color: 'tl-cyan' },
    ];

    function buildTL(tbodyId, events) {
      const tbody = document.getElementById(tbodyId);
      if (!tbody) return;
      events.forEach(ev => {
        const tr = document.createElement('tr');
        const nameTd = document.createElement('td');
        nameTd.className = 'tl-name-cell';
        nameTd.textContent = ev.name;
        tr.appendChild(nameTd);
        for (let i = 0; i < HOURS.length; i++) {
          const h = HOURS[i];
          if (h === ev.start) {
            const span = ev.end - ev.start;
            const td = document.createElement('td');
            td.className = 'tl-cell';
            td.colSpan = span;
            const block = document.createElement('span');
            block.className = 'tl-block ' + ev.color;
            const fmt = h => `${h <= 12 ? h : h-12}${h < 12 ? 'am' : 'pm'}`;
            block.title = `${ev.name1}: ${fmt(ev.start)} – ${fmt(ev.end)}`;
            block.textContent = span > 1 ? ev.name1 : '';
            td.appendChild(block);
            tr.appendChild(td);
            i += span - 1;
          } else if (h < ev.start || h >= ev.end) {
            const td = document.createElement('td');
            td.className = 'tl-cell';
            tr.appendChild(td);
          }
        }
        tbody.appendChild(tr);
      });
    }

    buildTL('tl-tbody0', day0);
    buildTL('tl-tbody1', day1);

    // Override switchTab to also switch timeline days
    const origSwitch = window.switchTab;
    window.switchTab = function(n) {
      if (origSwitch) origSwitch(n);
      document.querySelectorAll('.tl-day').forEach((d,i) => d.classList.toggle('active', i===n));
    };
  })();  

  // ── 11. scrollToReg (used by brochure CTA buttons) ───────
  function scrollToReg() { openRegistration(); }
  window.scrollToReg = scrollToReg;

  // ── 12. Register Now links → open overlay ────────────────
  document.querySelectorAll('a[href="#register"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      e.preventDefault();
      openRegistration();
    });
  });

  // ── 13. Nav logo click ───────────────────────────────────
  document.querySelector('.nav-logo')?.addEventListener('click', () => {
    closeRegistration();
    closeBrochure();
    const g = document.getElementById('entrance-gate');
    if (g) g.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ── 14. Keyboard: Escape closes overlays ─────────────────
  // GLITCH FIX: two separate keydown listeners were registered (one here,
  // one later in the file) — merged into a single listener.
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeRegistration();
      closeBrochure();
    }
  });

  // ── 15. Browser back button ──────────────────────────────
  window.addEventListener('popstate', () => {
    const openBrochureEl = document.querySelector('.brochure-overlay.open:not(#registration-screen)');
    const regScreen      = document.getElementById('registration-screen');
    if (openBrochureEl) {
      closeBrochure();
    } else if (regScreen?.classList.contains('open')) {
      closeRegistration();
    }
  });

  // ── 16. Registration form submit ─────────────────────────
  const WA_LINKS = {
    'hardware-hackathon': { label: 'Hardware Hackathon',   url: 'https://chat.whatsapp.com/BvkZ9wo6qytBPr3U8kzlOM' },
    'robo-prix':          { label: 'Robo Prix',            url: 'https://chat.whatsapp.com/DpmGXBlQ6vDJ7BqZeptMW4?mode=gi_t' },
    'robo-soccer':        { label: 'Robo Soccer',          url: 'https://chat.whatsapp.com/G3Z9Rvvazm7I7s3UQNN1me?mode=gi_t' },
    'robo-sumo':          { label: 'Robo Sumo',            url: 'https://chat.whatsapp.com/DGA3qhNPDA1JeQq1eY9wKV?mode=gi_t' },
    'lfr':                { label: 'LFR',                   url: 'https://chat.whatsapp.com/HbqxTyeViHp1qRJbHaka8Q?mode=gi_t' },
    'pcb-design':         { label: 'PCB Design',           url:  'https://chat.whatsapp.com/LMCxOLSa5EIFuVdKqwLPpD?mode=gi_t' },
    'ideathon':           { label: 'Ideathon',             url: 'https://chat.whatsapp.com/CC8uW81BUIDLVe3btv1ClK?mode=gi_t' },
    'quizzards':          { label: 'Tech Quiz',            url: 'https://chat.whatsapp.com/GgyiQk1IrGX0S5vvjlWY6p?mode=gi_t' },
    'treasure-hunt':      { label: 'Treasure Hunt',        url: 'https://chat.whatsapp.com/H3OirCm1ft09CkNMSRkh5N?mode=gi_t' },
    'fifa26':             { label: 'FIFA 26',              url: 'https://chat.whatsapp.com/D6qg9H8H7vqJdSLNEEX4Yq?mode=gi_t' },
    'project':            { label: 'Project Presentation',  url: 'https://chat.whatsapp.com/FG7vPkLKwG197OefrsjMfc?mode=gi_t' },
    'photography':        { label: 'Photography',          url: 'https://chat.whatsapp.com/C8wpdm9MOg74N1vHh3ZF5w' },
    'reel':               { label: 'Reel',                 url: 'https://chat.whatsapp.com/D59dmYaI5azFAcmn2GykCu' },
    'prompt-mania':       { label: 'Prompt Mania',         url: 'https://chat.whatsapp.com/GYTy1eUHQXlKjTNwiGNNOR?mode=gi_t' },
    'meme':              { label: 'Meme',                 url: 'https://chat.whatsapp.com/FkNXLpHU6PQH2VXfvUmxMt?mode=gi_t'}
  };
 
  // UPI config — replace with actual UPI ID and deeplink base
  const UPI_ID = 'shibusharon181@okhdfcbank';
  // UPI deeplink will be built dynamically with the correct amount
 
  // Live fee total calculation
  document.querySelectorAll('.checkbox-group input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', updateFeeTotal);
  });
 
  function updateFeeTotal() {
    const checked = [...document.querySelectorAll('.checkbox-group input:checked')];
    const total   = checked.reduce((sum, cb) => sum + parseInt(cb.dataset.fee || 0, 10), 0);
    const summary = document.getElementById('fee-summary');
    const totalEl = document.getElementById('fee-total');
    if (checked.length > 0) {
      summary.style.display = 'block';
      totalEl.textContent = '₹' + total;
    } else {
      summary.style.display = 'none';
    }
    return total;
  }
 
  function goToPayment() {
    const fname  = document.getElementById('r-fname').value.trim();
    const email  = document.getElementById('r-email').value.trim();
    if (!fname || !email) { alert('Please enter your name and email.'); return; }
 
    const checked = [...document.querySelectorAll('.checkbox-group input:checked')];
    if (checked.length === 0) { alert('Please select at least one event.'); return; }
 
    const total = checked.reduce((sum, cb) => sum + parseInt(cb.dataset.fee || 0, 10), 0);
 
    // Populate payment screen
    document.getElementById('pay-display-amount').innerHTML = '&#8377;' + total;
 
    // Event list
    const eventList = document.getElementById('pay-events-list');
    eventList.innerHTML = checked.map(cb => {
      const label = cb.closest('label').querySelector('span').textContent;
      return `<span style="display:block">&#8250; ${label}</span>`;
    }).join('');
 
    // UPI deeplink — format: upi://pay?pa=ID&pn=NAME&am=AMOUNT&cu=INR
    const upiLink = `upi://pay?pa=${UPI_ID}&pn=Sharon+Shibu&am=${total}&cu=INR`;
    document.getElementById('upi-pay-link').href = upiLink;
    document.getElementById('upi-id-display').textContent = UPI_ID;

    const qrContainer = document.getElementById('qr-container');
    qrContainer.innerHTML = '';
    const img = document.createElement('img');
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiLink)}`;
    img.alt = 'Scan to Pay';
    img.style.width = '300px';
    img.style.height = '300px';
    img.style.display = 'block';

    qrContainer.appendChild(img);   
    
    // Show payment step
    document.getElementById('reg-form').style.display    = 'none';
    document.getElementById('reg-payment').style.display = 'block';
 
    // Scroll to top of panel
    const panel = document.getElementById('register');
    if (panel) panel.scrollTop = 0;
  }
 
  function backToForm() {
    document.getElementById('reg-payment').style.display = 'none';
    document.getElementById('reg-form').style.display    = 'block';
    const panel = document.getElementById('register');
    if (panel) panel.scrollTop = 0;
  }
 
  function handleScreenshotUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Max 5 MB.');
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      document.getElementById('screenshot-img').src = e.target.result;
      document.getElementById('screenshot-preview').style.display = 'block';
      document.getElementById('btn-confirm-payment').disabled = false;
    };
    reader.readAsDataURL(file);
  }
 
  function removeScreenshot() {
    document.getElementById('r-screenshot').value = '';
    document.getElementById('screenshot-preview').style.display = 'none';
    document.getElementById('screenshot-img').src = '';
    document.getElementById('btn-confirm-payment').disabled = true;
  }
 
function confirmPayment() {
  const btn = document.getElementById('btn-confirm-payment');
  if (btn.disabled) return;

  const fname   = document.getElementById('r-fname').value.trim();
  const lname   = document.getElementById('r-lname').value.trim();
  const email   = document.getElementById('r-email').value.trim();
  const phone   = document.getElementById('r-phone').value.trim();
  const college = document.getElementById('r-college').value.trim();
  const year    = document.getElementById('r-year').value;
  const team    = document.getElementById('r-team').value.trim();

  const checked = [...document.querySelectorAll('.checkbox-group input:checked')];

  if (!fname || !email || checked.length === 0) {
    alert('Fill required fields');
    return;
  }

  const events = checked.map(cb => cb.value).join(', ');
  const total  = checked.reduce((sum, cb) => sum + parseInt(cb.dataset.fee || 0, 10), 0);

  // Screenshot (base64 only)
  let screenshotData = '';
  const img = document.getElementById('screenshot-img');
  if (img && img.src.includes(',')) {
    screenshotData = img.src.split(',')[1];
  }

  btn.textContent = 'Submitting…';
  btn.disabled = true;

  const formData = new FormData();
  formData.append('fname', fname);
  formData.append('lname', lname);
  formData.append('email', email);
  formData.append('phone', phone);
  formData.append('college', college);
  formData.append('year', year);
  formData.append('team', team);
  formData.append('events', events);
  formData.append('total', total);
  formData.append('screenshotData', screenshotData);

  fetch('https://script.google.com/macros/s/AKfycby-A5HjTnc5kS6KvcNgxiOnSPb_5UVE6zWclSV5qlhU-QdXZMZlNE1QRAlkZfVRYnQp/exec', {
    method: 'POST',
    body: formData
  })
  .then(() => {
    // Apps Script won't return readable response reliably → assume success
    showSuccess(checked);
  })
  .catch(err => {
    console.error(err);
    alert('Submission failed');
    btn.textContent = 'Confirm Payment';
    btn.disabled = false;
  });
}


  function showSuccess(checkedBoxes) {
    document.getElementById('reg-payment').style.display = 'none';
 
    // Build WhatsApp group links for selected events
    const grid = document.getElementById('wa-links-grid');
    grid.innerHTML = '';
    checkedBoxes.forEach(cb => {
      const info = WA_LINKS[cb.value];
      if (!info) return;
      const a = document.createElement('a');
      a.href = info.url;
      a.className = 'wa-link-btn';
      a.target = '_blank';
      a.rel = 'noopener';
      a.innerHTML = `<span class="wa-icon">&#128172;</span> ${info.label} WhatsApp Group`;
      grid.appendChild(a);
    });
 
    document.getElementById('reg-success').style.display = 'block';
    const panel = document.getElementById('register');
    if (panel) panel.scrollTop = 0;
  }
 
  window.goToPayment          = goToPayment;
  window.backToForm           = backToForm;
  window.handleScreenshotUpload = handleScreenshotUpload;
  window.removeScreenshot     = removeScreenshot;
  window.confirmPayment       = confirmPayment;


    (function initMarquee() {
    const SPONSORS = [
      { img: 'src/sponsors/Adan_tech.jpeg'},
      { img: 'src/sponsors/Flair.png' },
      { img: 'src/sponsors/Konkan.png' },
      { img: 'src/sponsors/layerswrap.png' },
      { img: 'src/sponsors/marine.png'   },
      { img: 'src/sponsors/Mssunder.png'   },
      { img: 'src/sponsors/TPMlogo.png'    },
      { img: 'src/sponsors/GAURVED.jpeg'},
      { img: 'src/sponsors/Aerflo-Brand.png'},
      { img: 'src/sponsors/Polynova.jpeg'},
      { img: 'src/sponsors/Fishermans.jpeg'},
      { img: 'src/sponsors/Swagath.jpeg'}
    ];
 
    const TIER_LABELS = {
      title:    'Title Sponsor',
      platinum: 'Platinum',
      gold:     'Gold',
      silver:   'Silver',
    };
 
    const track = document.getElementById('marquee-track');
    if (!track) return;
 
    function buildItem(sp) {
      const item = document.createElement('div');
      item.className = 'sponsor-item';
      item.setAttribute('aria-label', sp.name + ' — ' + TIER_LABELS[sp.tier]);
 
      const logoBlock = document.createElement('div');
      logoBlock.className = 'sponsor-logo-block';
 
      if (sp.img) {
        const img = document.createElement('img');
        img.src = sp.img;
        img.alt = sp.name + ' logo';
        img.loading = 'lazy';
        img.decoding = 'async';
        logoBlock.appendChild(img);
      } else {
        logoBlock.textContent = sp.icon;
      }
 
      const textWrap = document.createElement('div');
 
      const nameEl = document.createElement('span');
      nameEl.className = 'sponsor-name';
      nameEl.textContent = sp.name;
 
      const tierEl = document.createElement('span');
      tierEl.className = 'sponsor-tier tier-' + sp.tier;
      tierEl.textContent = TIER_LABELS[sp.tier];
 
      textWrap.appendChild(nameEl);
      textWrap.appendChild(tierEl);
 
      item.appendChild(logoBlock);
      item.appendChild(textWrap);
      return item;
    }
 
    // Build one set, then duplicate it for seamless infinite loop
    // (CSS animation goes from 0 → -50%, so the second copy fills the gap)
    const frag = document.createDocumentFragment();
    [...SPONSORS, ...SPONSORS].forEach(sp => frag.appendChild(buildItem(sp)));
    track.appendChild(frag);
 
    // Slow down on mobile (fewer pixels to fill)
    if (window.innerWidth < 768) {
      track.style.animationDuration = '18s';
    }
  })();

 

}); // end DOMContentLoaded





// ============================================================
// STRANGER THINGS ANIMATIONS
// (These run independently — no DOMContentLoaded dependency
//  because they are at the bottom of <body> and the DOM is ready)
// ============================================================

// ── A. VINE / TENDRIL CANVAS ─────────────────────────────────
(function initVines() {
  const canvas = document.getElementById('vine-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();

  // Debounce resize to avoid hammering layout on every pixel change
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });

  class Vine {
    constructor() { this.reset(); }

    reset() {
      this.x = Math.random() * window.innerWidth;
      this.y = Math.random() < 0.5 ? 0 : window.innerHeight;
      this.angle = this.y === 0
        ? (Math.PI * 0.3  + Math.random() * Math.PI * 0.4)
        : (-Math.PI * 0.3 - Math.random() * Math.PI * 0.4);
      this.length    = 0;
      this.maxLength = 120 + Math.random() * 200;
      this.speed     = 0.6 + Math.random() * 1.2;
      this.thickness = 0.5 + Math.random() * 1.5;
      this.alpha     = 0.3 + Math.random() * 0.5;
      this.points    = [{ x: this.x, y: this.y }];
      this.wobble      = 0;
      this.wobbleSpeed = 0.03 + Math.random() * 0.04;
      this.branches  = [];
      this.branchAt  = 30 + Math.random() * 60;
      this.branched  = false;
      this.dead      = false;
    }

    update() {
      if (this.dead) return;
      this.wobble += this.wobbleSpeed;
      this.angle  += Math.sin(this.wobble) * 0.04;

      const last = this.points[this.points.length - 1];
      const nx = last.x + Math.cos(this.angle) * this.speed;
      const ny = last.y + Math.sin(this.angle) * this.speed;
      this.points.push({ x: nx, y: ny });
      this.length += this.speed;

      if (!this.branched && this.length > this.branchAt) {
        this.branched = true;
        const b = new Vine();
        b.x = nx; b.y = ny;
        b.points    = [{ x: nx, y: ny }];
        b.angle     = this.angle + (Math.random() < 0.5 ? 0.5 : -0.5) + (Math.random() - 0.5) * 0.4;
        b.maxLength = this.maxLength * 0.55;
        b.thickness = this.thickness * 0.6;
        b.alpha     = this.alpha * 0.7;
        this.branches.push(b);
      }

      this.branches.forEach(b => b.update());
      if (this.length >= this.maxLength) this.dead = true;
    }

    draw() {
      if (this.points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(this.points[0].x, this.points[0].y);
      for (let i = 1; i < this.points.length; i++) {
        ctx.lineTo(this.points[i].x, this.points[i].y);
      }
      ctx.strokeStyle = `rgba(160,0,0,${this.alpha})`;
      ctx.lineWidth   = this.thickness;
      ctx.lineCap     = 'round';
      ctx.stroke();

      // Small node every 15 points
      if (this.points.length % 15 === 0) {
        const p = this.points[this.points.length - 1];
        ctx.beginPath();
        ctx.arc(p.x, p.y, this.thickness * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,0,0,${this.alpha * 0.7})`;
        ctx.fill();
      }

      this.branches.forEach(b => b.draw());
    }
  }

  // Pre-stagger vines so they don't all start from zero simultaneously
  const vines = Array.from({ length: 12 }, () => {
    const v = new Vine();
    v.length = Math.random() * v.maxLength * 0.5;
    return v;
  });

  // GLITCH FIX: use a document visibility check so the canvas loop
  // pauses when the tab is hidden — prevents accumulated state drift
  // that can cause visual glitching when the tab regains focus.
  // PERF FIX: also pause when the hero/canvas is scrolled out of view.
  // CRITICAL FIX: previous version called rAF even when paused — this caused
  // scroll events to pile up and produced the reverse-scroll glitch.
  // Now we track the rAF id and cancel it properly.
  let vinesPaused = false;
  let vineRafId = null;
  const heroEl = document.querySelector('header');
  if (heroEl) {
    const vineObserver = new IntersectionObserver(entries => {
      const wasVisible = !vinesPaused;
      vinesPaused = !entries[0].isIntersecting;
      // Re-start the loop if transitioning from paused → visible
      if (wasVisible !== !vinesPaused && !vinesPaused && vineRafId === null) {
        vineRafId = requestAnimationFrame(animVines);
      }
    }, { threshold: 0 });
    vineObserver.observe(heroEl);
  }

  function animVines() {
    vineRafId = null; // clear before scheduling next
    if (document.hidden || vinesPaused) {
      // Don't schedule another frame while paused — wait for visibility change
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < vines.length; i++) {
      if (vines[i].dead && Math.random() < 0.02) {
        vines[i] = new Vine();
      }
      vines[i].update();
      vines[i].draw();
    }
    vineRafId = requestAnimationFrame(animVines);
  }

  // Resume when tab becomes visible again
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !vinesPaused && vineRafId === null) {
      vineRafId = requestAnimationFrame(animVines);
    }
  });

  vineRafId = requestAnimationFrame(animVines);
})();


// ── B. FLOATING SPORES ───────────────────────────────────────
(function initSpores() {
  // PERF FIX: significantly fewer spores on mobile — 30 fixed animated divs causes jank.
  // Each spore is its own composited layer (will-change + fixed position).
  // Reduced to 20 desktop / 6 mobile.
  const sporeCount = window.innerWidth < 768 ? 6 : 20;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < sporeCount; i++) {
    const el   = document.createElement('div');
    const size = 1.5 + Math.random() * 3;
    el.className = 'spore';
    el.style.cssText = `
      left:${Math.random() * 100}vw;
      width:${size}px;
      height:${size}px;
      --drift:${(Math.random() - 0.5) * 120}px;
      animation-duration:${5 + Math.random() * 12}s;
      animation-delay:${-Math.random() * 15}s;
      opacity:${0.4 + Math.random() * 0.5};
      background:hsl(${350 + Math.random() * 20},100%,${40 + Math.random() * 20}%);
      box-shadow:0 0 ${4 + Math.random() * 6}px rgba(220,0,0,0.8);
    `;
    frag.appendChild(el);
  }
  document.body.appendChild(frag);
})();


// ── C. FLICKERING CHRISTMAS LIGHTS BANNER ────────────────────
(function initLights() {
  const header = document.querySelector('header');
  if (!header) return;

  // Inject keyframes only once (guard against hot-reloads / double-init)
  if (!document.getElementById('kf-bulbFlicker')) {
    const style = document.createElement('style');
    style.id = 'kf-bulbFlicker';
    style.textContent = `
      @keyframes bulbFlicker  { 0%{opacity:1} 40%{opacity:1} 50%{opacity:0.1} 60%{opacity:0.9} 80%{opacity:0.05} 100%{opacity:1} }
      @keyframes bulbOn       { 0%,100%{opacity:1} 50%{opacity:0.3} }
    `;
    document.head.appendChild(style);
  }

  const bar = document.createElement('div');
  bar.style.cssText = 'position:absolute;top:0;left:0;right:0;height:4px;z-index:10;display:flex;overflow:hidden;';

  const colors = ['#ff0000','#ff6600','#ffff00','#00ff00','#0066ff','#ff00ff','#ff3333','#ff9900'];
  const frag   = document.createDocumentFragment();

  // PERF FIX: reduced from 60 to 36 bulbs. Each bulb with a unique animation-duration
  // is a separate browser animation timeline — 60 timelines is excessive.
  // Now we use only 4 CSS classes (cycling bulb-group-0 through 3) so the browser
  // can share animation state across groups.
  if (!document.getElementById('kf-bulbGroups')) {
    const gs = document.createElement('style');
    gs.id = 'kf-bulbGroups';
    gs.textContent = `
      .bg0{animation:bulbFlicker 0.08s 0s   ease-in-out infinite alternate;}
      .bg1{animation:bulbFlicker 0.11s 0.7s ease-in-out infinite alternate;}
      .bg2{animation:bulbOn      0.18s 1.4s ease-in-out infinite alternate;}
      .bg3{animation:bulbOn      0.14s 2.1s ease-in-out infinite alternate;}
    `;
    document.head.appendChild(gs);
  }

  for (let i = 0; i < 36; i++) {
    const bulb  = document.createElement('span');
    const color = colors[i % colors.length];
    bulb.className = 'bg' + (i % 4);
    bulb.style.cssText = `
      display:inline-block;flex:1;height:8px;
      background:${color};
      box-shadow:0 0 6px ${color},0 0 12px ${color};
      border-radius:50% 50% 40% 40%;
      margin:0 1px;
    `;
    frag.appendChild(bulb);
  }
  bar.appendChild(frag);
  header.appendChild(bar);
})();


// ── D. NAV / SECTION ENHANCEMENTS (injected styles) ──────────
(function initThemeExtras() {
  if (document.getElementById('kf-themeExtras')) return; // idempotent

  const style = document.createElement('style');
  style.id    = 'kf-themeExtras';
  style.textContent = `
    /* hero fog */
    header::after{content:'';position:absolute;bottom:0;left:0;right:0;height:120px;
      background:linear-gradient(to top,rgba(80,0,0,0.25) 0%,transparent 100%);
      pointer-events:none;z-index:0;}

    /* nav glow line */
    nav::after{content:'';position:absolute;bottom:0;left:0;right:0;height:1px;
      background:linear-gradient(90deg,transparent,rgba(200,0,0,0.8),rgba(200,0,0,0.4),transparent);
      animation:navGlow 3s ease-in-out infinite alternate;}
    @keyframes navGlow{0%{opacity:0.4;}100%{opacity:1;box-shadow:0 0 20px rgba(200,0,0,0.5);}}

    /* section borders */
    section{box-shadow:inset 0 1px 0 rgba(150,0,0,0.2);}
    #competitions{background:linear-gradient(180deg,#0a0000 0%,#0f0000 100%);}
    #register{background:linear-gradient(180deg,#0d0000 0%,#0a0000 100%);}
    section{border-top:1px solid rgba(120,0,0,0.3);}

    /* h1 shadow */
    h1{filter:drop-shadow(0 4px 12px rgba(180,0,0,0.4));}

    /* stat pulse */
    .stat-num{animation:statPulse 3s ease-in-out infinite;}
    @keyframes statPulse{0%,100%{text-shadow:0 0 20px rgba(200,0,0,0.6);}
      50%{text-shadow:0 0 35px rgba(220,0,0,0.9),0 0 60px rgba(180,0,0,0.4);}}

    /* card vine border */
    .comp-card{border-left:2px solid rgba(100,0,0,0);transition:border-left-color 0.3s;}
    .comp-card:hover{border-left-color:rgba(200,0,0,0.7);}

    /* eyebrow cursor */
    .hero-eyebrow::after{content:'_';animation:blink 1s step-end infinite;}
    @keyframes blink{0%,100%{opacity:1;}50%{opacity:0;}}
  `;
  document.head.appendChild(style);
})();


// ── E. ALPHABET WALL LIGHTS (about section) ──────────────────
(function initWallLights() {
  const section = document.querySelector('#about');
  if (!section) return;

  const wall = document.createElement('div');
  wall.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:0;overflow:hidden;';

  const letters = 'RUNAWAYJUSTRUN'.split('');
  const cols    = ['#ff0000','#ff6600','#ffff00','#00cc00','#0066ff','#cc00cc'];

  if (!document.getElementById('kf-wallLight')) {
    const kf = document.createElement('style');
    kf.id = 'kf-wallLight';
    kf.textContent = `
      @keyframes wallLight{
        0%{opacity:0.05;text-shadow:none;}
        60%{opacity:0.05;text-shadow:none;}
        70%{opacity:0.9;text-shadow:0 0 12px currentColor,0 0 30px currentColor;}
        80%{opacity:0.1;}
        90%{opacity:0.8;text-shadow:0 0 12px currentColor;}
        100%{opacity:0.9;text-shadow:0 0 12px currentColor,0 0 30px currentColor;}
      }
    `;
    document.head.appendChild(kf);
  }

  const frag = document.createDocumentFragment();
  letters.forEach((letter, i) => {
    const bulb = document.createElement('div');
    const col  = cols[i % cols.length];
    bulb.textContent = letter;
    bulb.style.cssText = `
      position:absolute;
      right:${3 + i * 6.5}%;
      top:${15 + Math.sin(i * 0.8) * 20}%;
      font-family:'IBM Plex Mono',monospace;
      font-size:0.55rem;font-weight:700;letter-spacing:0.1em;
      color:${col};
      text-shadow:0 0 8px ${col},0 0 20px ${col};
      animation:wallLight ${0.6 + Math.random() * 2}s ${Math.random() * 8}s ease-in-out infinite alternate;
      opacity:0.15;
    `;
    frag.appendChild(bulb);
  });
  wall.appendChild(frag);
  section.appendChild(wall);
})();

// ── F. MOBILE NAV OVERLAY ────────────────────────────────────
(function initMobileNav() {
  const toggle  = document.getElementById('nav-toggle');
  const overlay = document.querySelector('.mobile-nav-overlay');
  if (!toggle || !overlay) return;

  // Lock / unlock body scroll to match the registration screen pattern
  function lockScroll()   { document.body.style.overflow = 'hidden'; }
  function unlockScroll() { document.body.style.overflow = '';       }

  // Open / close helpers
  function openNav()  { toggle.checked = true;  lockScroll();   }
  function closeNav() { toggle.checked = false; unlockScroll(); }

  // Sync scroll lock whenever the checkbox state changes
  // (covers both the hamburger label click and the ✕ label click)
  toggle.addEventListener('change', () => {
    toggle.checked ? lockScroll() : unlockScroll();
  });

  // Auto-close when any overlay link is tapped
  overlay.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      // Small delay so the smooth-scroll starts before overlay hides
      setTimeout(closeNav, 80);
    });
  });

  // Close on Escape key (accessibility)
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && toggle.checked) closeNav();
  });

  // Close if user somehow scrolls (e.g. two-finger trackpad on a touch laptop)
  window.addEventListener('scroll', () => {
    if (toggle.checked) closeNav();
  }, { passive: true });
})();
