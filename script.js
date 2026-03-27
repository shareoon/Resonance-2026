
document.addEventListener("DOMContentLoaded", () => {
const video = document.getElementById("heroVideo");
const btn = document.getElementById("soundToggle");
const gate = document.getElementById("entrance-gate");
const enterBtn = document.getElementById("enter-btn");

// 1. Initial State: Force Muted & Autoplay for Mobile Compatibility
video.muted = true;
video.play().catch(err => console.log("Autoplay waiting for interaction"));

// 2. Entrance Gate Logic (The "Big Click")
if (enterBtn) {
    enterBtn.addEventListener('click', () => {
        // Unmute the video
        video.muted = false;
        video.play();
        
        // Update Mute Button UI
        btn.innerText = "🔊";
        localStorage.setItem("soundEnabled", "true");

        // Hide the gate with a fade (optional)
        gate.style.opacity = '0';
        setTimeout(() => { gate.style.display = 'none'; }, 500);
    });
}

// 3. Independent Mute Toggle Logic
btn.addEventListener("click", (e) => {
    e.stopPropagation();
    video.muted = !video.muted;
    btn.innerText = video.muted ? "🔇" : "🔊";
    localStorage.setItem("soundEnabled", !video.muted);
});

// 4. Mobile "Wake Up" Fallback
document.body.addEventListener('touchstart', () => {
    if (video.paused) video.play();
}, { once: true });
});


const observer = new IntersectionObserver(entries => {
entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
}, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

function switchTab(idx) {
document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', i === idx));
document.querySelectorAll('.tab-content').forEach((c, i) => c.classList.toggle('active', i === idx));
}

function openBrochure(id) {
const el = document.getElementById('brochure-' + id);
if (el) { el.classList.add('open'); document.body.style.overflow = 'hidden'; el.scrollTop = 0; }
}

function closeBrochure() {
document.querySelectorAll('.brochure-overlay').forEach(el => el.classList.remove('open'));
document.body.style.overflow = '';
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeBrochure(); });

function scrollToReg() {
document.getElementById('register').scrollIntoView({ behavior: 'smooth' });
}

function submitReg() {
const fname = document.getElementById('r-fname').value.trim();
const lname = document.getElementById('r-lname').value.trim();
const email = document.getElementById('r-email').value.trim();
const phone = document.getElementById('r-phone').value.trim();
const college = document.getElementById('r-college').value.trim();
const year  = document.getElementById('r-year').value;
const pass  = document.getElementById('r-pass').value;
const team  = document.getElementById('r-team').value.trim();

if (!fname || !email) { alert('Please enter your name and email.'); return; }
if (!pass) { alert('Please select a pass type.'); return; }

const competitions = [...document.querySelectorAll('.checkbox-group input:checked')]
  .map(cb => cb.value).join(', ');

const btn = document.querySelector('.btn-submit');
btn.textContent = 'Submitting...';
btn.disabled = true;

fetch('https://script.google.com/macros/s/AKfycby0KxvuzvrViPiOVMzcIsBf5_0xkAFwKuYpWHk5iOy7_JtQqVoD-7EcAdvOiSkzx2I3/exec', {
  method: 'POST',
  mode: 'no-cors',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ fname, lname, email, phone, college, year, pass: pass, team, competitions })
}).then(() => {
  document.getElementById('reg-form').style.display = 'none';
  document.getElementById('reg-success').style.display = 'block';
}).catch(() => {
  btn.textContent = 'Submit Registration →';
  btn.disabled = false;
  alert('Something went wrong. Please try again.');
});
}


// ============================================================
// STRANGER THINGS ANIMATIONS
// ============================================================

// 1. VINE / TENDRIL CANVAS — Upside Down creeping vines
(function() {
const canvas = document.getElementById('vine-canvas');
const ctx = canvas.getContext('2d');

function resize() {
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

// Each vine is a branching tendril
class Vine {
constructor() { this.reset(); }
reset() {
  this.x = Math.random() * window.innerWidth;
  this.y = Math.random() < 0.5 ? 0 : window.innerHeight;
  this.angle = this.y === 0 ? (Math.PI * 0.3 + Math.random() * Math.PI * 0.4)
                            : (-Math.PI * 0.3 - Math.random() * Math.PI * 0.4);
  this.length = 0;
  this.maxLength = 120 + Math.random() * 200;
  this.speed = 0.6 + Math.random() * 1.2;
  this.thickness = 0.5 + Math.random() * 1.5;
  this.alpha = 0.3 + Math.random() * 0.5;
  this.points = [{x: this.x, y: this.y}];
  this.wobble = 0;
  this.wobbleSpeed = 0.03 + Math.random() * 0.04;
  this.branches = [];
  this.branchAt = 30 + Math.random() * 60;
  this.branched = false;
  this.dead = false;
}
update() {
  if (this.dead) return;
  this.wobble += this.wobbleSpeed;
  this.angle += Math.sin(this.wobble) * 0.04;
  const last = this.points[this.points.length - 1];
  const nx = last.x + Math.cos(this.angle) * this.speed;
  const ny = last.y + Math.sin(this.angle) * this.speed;
  this.points.push({x: nx, y: ny});
  this.length += this.speed;

  if (!this.branched && this.length > this.branchAt) {
    this.branched = true;
    const b = new Vine();
    b.x = nx; b.y = ny;
    b.points = [{x: nx, y: ny}];
    b.angle = this.angle + (Math.random() < 0.5 ? 0.5 : -0.5) + (Math.random() - 0.5) * 0.4;
    b.maxLength = this.maxLength * 0.55;
    b.thickness = this.thickness * 0.6;
    b.alpha = this.alpha * 0.7;
    this.branches.push(b);
  }
  this.branches.forEach(b => b.update());

  if (this.length >= this.maxLength) this.dead = true;
}
draw(ctx) {
  if (this.points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(this.points[0].x, this.points[0].y);
  for (let i = 1; i < this.points.length; i++) {
    ctx.lineTo(this.points[i].x, this.points[i].y);
  }
  ctx.strokeStyle = `rgba(160,0,0,${this.alpha})`;
  ctx.lineWidth = this.thickness;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Small nodes along the vine
  if (this.points.length % 15 === 0) {
    const p = this.points[this.points.length - 1];
    ctx.beginPath();
    ctx.arc(p.x, p.y, this.thickness * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200,0,0,${this.alpha * 0.7})`;
    ctx.fill();
  }

  this.branches.forEach(b => b.draw(ctx));
}
}

const vines = [];
for (let i = 0; i < 12; i++) {
const v = new Vine();
v.length = Math.random() * v.maxLength * 0.5; // stagger start
vines.push(v);
}

let frame = 0;
function animVines() {
frame++;
ctx.clearRect(0, 0, canvas.width, canvas.height);

// Replace dead vines
for (let i = 0; i < vines.length; i++) {
  if (vines[i].dead && Math.random() < 0.02) {
    vines[i] = new Vine();
  }
  vines[i].update();
  vines[i].draw(ctx);
}
requestAnimationFrame(animVines);
}
animVines();
})();

// 2. FLOATING SPORES — Upside Down particles
(function() {
const count = 30;
for (let i = 0; i < count; i++) {
const el = document.createElement('div');
el.className = 'spore';
const size = 1.5 + Math.random() * 3;
el.style.cssText = `
  left: ${Math.random() * 100}vw;
  width: ${size}px;
  height: ${size}px;
  --drift: ${(Math.random() - 0.5) * 120}px;
  animation-duration: ${5 + Math.random() * 12}s;
  animation-delay: ${-Math.random() * 15}s;
  opacity: ${0.4 + Math.random() * 0.5};
  background: hsl(${350 + Math.random() * 20}, 100%, ${40 + Math.random() * 20}%);
  box-shadow: 0 0 ${4 + Math.random() * 6}px rgba(220,0,0,0.8);
`;
document.body.appendChild(el);
}
})();

// 3. FLICKERING CHRISTMAS LIGHTS BANNER (hero section decoration)
(function() {
const header = document.querySelector('header');
const bar = document.createElement('div');
bar.style.cssText = `
position:absolute; top:0; left:0; right:0; height:4px; z-index:10;
display:flex; gap:0;
overflow:hidden;
`;
const colors = ['#ff0000','#ff6600','#ffff00','#00ff00','#0066ff','#ff00ff','#ff3333','#ff9900'];
const numLights = 60;
for (let i = 0; i < numLights; i++) {
const bulb = document.createElement('span');
const color = colors[i % colors.length];
const delay = Math.random() * 3;
const dur = 0.08 + Math.random() * 0.15;
bulb.style.cssText = `
  display:inline-block;
  flex:1; height:8px;
  background:${color};
  box-shadow: 0 0 6px ${color}, 0 0 12px ${color};
  border-radius:50% 50% 40% 40%;
  animation: bulbFlicker ${dur}s ${delay}s ease-in-out infinite alternate;
  opacity:1;
  margin:0 1px;
`;
bar.appendChild(bulb);
}

// Add keyframes for bulb flicker
const style = document.createElement('style');
style.textContent = `
@keyframes bulbFlicker {
  0% { opacity:1; }
  40% { opacity:1; }
  50% { opacity:0.1; }
  60% { opacity:0.9; }
  80% { opacity:0.05; }
  100% { opacity:1; }
}
@keyframes bulbOn {
  0%,100% { opacity:1; }
  50% { opacity:0.3; }
}
/* Upside Down fog at the bottom of hero */
header::after {
  content:'';
  position:absolute;
  bottom:0; left:0; right:0; height:120px;
  background: linear-gradient(to top, rgba(80,0,0,0.25) 0%, transparent 100%);
  pointer-events:none;
  z-index:0;
}
/* Nav red glow line */
nav::after {
  content:'';
  position:absolute;
  bottom:0; left:0; right:0; height:1px;
  background: linear-gradient(90deg, transparent, rgba(200,0,0,0.8), rgba(200,0,0,0.4), transparent);
  animation: navGlow 3s ease-in-out infinite alternate;
}
@keyframes navGlow {
  0% { opacity:0.4; }
  100% { opacity:1; box-shadow: 0 0 20px rgba(200,0,0,0.5); }
}
/* Section border glow */
section { box-shadow: inset 0 1px 0 rgba(150,0,0,0.2); }
/* Red tint on images / surface areas */
#competitions { background: linear-gradient(180deg, #0a0000 0%, #0f0000 100%); }
#register { background: linear-gradient(180deg, #0d0000 0%, #0a0000 100%); }
/* Glowing section borders */
section { border-top: 1px solid rgba(120,0,0,0.3); }
/* Hero title extra drip shadow */
h1 { filter: drop-shadow(0 4px 12px rgba(180,0,0,0.4)); }
/* Pulse on stat numbers */
.stat-num { animation: statPulse 3s ease-in-out infinite; }
@keyframes statPulse {
  0%,100% { text-shadow: 0 0 20px rgba(200,0,0,0.6); }
  50% { text-shadow: 0 0 35px rgba(220,0,0,0.9), 0 0 60px rgba(180,0,0,0.4); }
}
/* Vine-like border on comp cards */
.comp-card { border-left: 2px solid rgba(100,0,0,0); transition: border-left-color 0.3s; }
.comp-card:hover { border-left-color: rgba(200,0,0,0.7); }
/* Typewriter cursor blink on eyebrow */
.hero-eyebrow::after { content:'_'; animation: blink 1s step-end infinite; }
@keyframes blink { 0%,100%{opacity:1;} 50%{opacity:0;} }
`;
document.head.appendChild(style);
header.appendChild(bar);
})();

// 5. VIDEO PARALLAX — subtle downward parallax on scroll
(function() {
const video = document.querySelector('.hero-video-wrap video');
if (!video) return;
let ticking = false;
window.addEventListener('scroll', () => {
if (!ticking) {
  requestAnimationFrame(() => {
    const scrolled = window.scrollY;
    const maxShift = 120;
    const shift = Math.min(scrolled * 0.35, maxShift);
    video.style.transform = `translateY(${shift}px) scale(1.08)`;
    ticking = false;
  });
  ticking = true;
}
});
// Initial scale so parallax doesn't show edges
video.style.transform = 'translateY(0px) scale(1.08)';
})();

// 6. SCROLL INDICATOR — bouncing arrow at the bottom of hero
(function() {
const header = document.querySelector('header');
const ind = document.createElement('div');
ind.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>`;
ind.style.cssText = `
position:absolute; bottom:2.5rem; left:50%; transform:translateX(-50%);
color:rgba(200,0,0,0.7); z-index:10;
animation: scrollBounce 1.8s ease-in-out infinite;
cursor:pointer;
filter: drop-shadow(0 0 8px rgba(200,0,0,0.6));
`;
ind.addEventListener('click', () => document.getElementById('about').scrollIntoView({behavior:'smooth'}));
const style = document.createElement('style');
style.textContent = `@keyframes scrollBounce { 0%,100%{transform:translateX(-50%) translateY(0);} 50%{transform:translateX(-50%) translateY(10px);} }`;
document.head.appendChild(style);
header.appendChild(ind);

// Fade out scroll indicator on scroll
window.addEventListener('scroll', () => {
ind.style.opacity = Math.max(0, 1 - window.scrollY / 200);
});
})();
(function() {
const section = document.querySelector('#about');
if (!section) return;
const wall = document.createElement('div');
wall.style.cssText = `
position:absolute; top:0; left:0; right:0; bottom:0;
pointer-events:none; z-index:0; overflow:hidden;
`;

const letters = 'RUNAWAYJUSTRUN'.split('');
const cols = ['#ff0000','#ff6600','#ffff00','#00cc00','#0066ff','#cc00cc'];
letters.forEach((letter, i) => {
const bulb = document.createElement('div');
const col = cols[i % cols.length];
const delay = Math.random() * 8;
const dur = 0.6 + Math.random() * 2;
bulb.innerHTML = letter;
bulb.style.cssText = `
  position:absolute;
  right:${3 + i * 6.5}%;
  top:${15 + Math.sin(i * 0.8) * 20}%;
  font-family:'IBM Plex Mono',monospace;
  font-size:0.55rem;
  font-weight:700;
  letter-spacing:0.1em;
  color:${col};
  text-shadow: 0 0 8px ${col}, 0 0 20px ${col};
  animation: wallLight ${dur}s ${delay}s ease-in-out infinite alternate;
  opacity:0.15;
`;
wall.appendChild(bulb);
});

const style2 = document.createElement('style');
style2.textContent = `
@keyframes wallLight {
  0% { opacity:0.05; text-shadow:none; }
  60% { opacity:0.05; text-shadow:none; }
  70% { opacity:0.9; text-shadow:0 0 12px currentColor, 0 0 30px currentColor; }
  80% { opacity:0.1; }
  90% { opacity:0.8; text-shadow:0 0 12px currentColor; }
  100% { opacity:0.9; text-shadow:0 0 12px currentColor, 0 0 30px currentColor; }
}
`;
document.head.appendChild(style2);
section.appendChild(wall);
})();


// ============================================================
// REGISTRATION SCREEN LOGIC
// ============================================================

function openRegistration() {
    const regScreen = document.getElementById('registration-screen');
    const regVideo = document.getElementById('regVideo');
    
    if (regScreen) {
        // 1. Make it visible FIRST
        regScreen.style.display = 'block'; 
        regScreen.classList.add('open');
        document.body.style.overflow = 'hidden';
        
        // 2. Then trigger the video
        if (regVideo) {
            regVideo.currentTime = 0;
            // Catching the promise is best practice for modern browsers
            regVideo.play().catch(err => {
                console.error("Video playback failed:", err);
            });
        }
    }
}

function closeRegistration() {
    const regScreen = document.getElementById('registration-screen');
    if (regScreen) {
        regScreen.classList.remove('open');
        regScreen.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// Ensure the "Register Now" buttons use the new screen instead of scrolling
document.querySelectorAll('a[href="#register"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        openRegistration();
    });
});

// Update the old scroll function to point to the new overlay
function scrollToReg() {
    openRegistration();
}

// Close overlay on Escape key
document.addEventListener('keydown', e => { 
    if (e.key === 'Escape') {
        closeRegistration();
        closeBrochure();
    }
});