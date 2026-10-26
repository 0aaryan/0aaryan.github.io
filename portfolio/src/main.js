import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { createAvatar } from './avatar.js';
import { profile, work, independent, experience, capabilities } from './content.js';

gsap.registerPlugin(ScrollTrigger, SplitText);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const mq = gsap.matchMedia();
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>';

document.body.classList.add('is-loading');

// ---------------------------------------------------------------- content
$('[data-work]').innerHTML = work.map((w, i) => `
  <li class="row" data-row>
    <button class="row__btn" data-open="${w.id}" aria-haspopup="dialog">
      <span class="row__idx">${String(i + 1).padStart(2, '0')}</span>
      <span class="row__title">${w.title}</span>
      <span class="row__arrow">${arrow}</span>
      <span class="row__hook"><span>${esc(w.hook)}</span></span>
    </button>
  </li>`).join('');

const speaker = `<svg viewBox="0 0 24 24" aria-hidden="true"><path class="spk" d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path class="on" d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/><path class="off" d="m16 9.5 5 5m0-5-5 5"/></svg>`;
$('[data-independent]').innerHTML = independent.map((p, i) => {
  const cls = i === 0 ? 'card card--feature' : i === 1 ? 'card card--a' : 'card card--b';
  const link = p.href ? ` href="${p.href}" target="_blank" rel="noopener"` : '';
  if (p.video) {
    // a card with its own controls can't be one big <a> (a button inside a link is invalid and
    // its clicks would navigate); the title link is stretched over the card instead
    const copy = `<h3 class="card__title"><a class="card__link"${link}>${p.title}</a></h3><p class="card__body">${esc(p.body)}</p>${p.cta ? `<span class="card__cta" aria-hidden="true">${p.cta}</span>` : ''}`;
    return `<article class="${cls}" data-card><div class="card__copy">${copy}</div><div class="card__media">
      <video muted loop playsinline preload="none" poster="${p.poster}" data-src="${p.video}" aria-label="${p.title} demo"></video>
      <button class="card__sound" type="button" data-sound data-on="false" aria-label="Unmute video">${speaker}</button></div></article>`;
  }
  const tag = p.href ? 'a' : 'div';
  const copy = `<h3 class="card__title">${p.title}</h3><p class="card__body">${esc(p.body)}</p>${p.cta ? `<span class="card__cta">${p.cta}</span>` : ''}`;
  return `<${tag} class="${cls}" data-card${link}>${copy}</${tag}>`;
}).join('');

$('[data-experience]').innerHTML = experience.map(j => `
  <article class="job" data-reveal-block>
    <p class="job__when">${j.when}</p>
    <div>
      <h3 class="job__role">${j.role}</h3>
      <p class="job__org">${j.org}</p>
      ${j.points.length ? `<ul>${j.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}
    </div>
  </article>`).join('');

$('[data-caps]').innerHTML = capabilities.map(c => `
  <div data-reveal-block><h3 class="label">${c.group}</h3><ul>${c.items.map(i => `<li>${i}</li>`).join('')}</ul></div>`).join('');

$('[data-links]').innerHTML = profile.links.map(l => `<li><a href="${l.href}" target="_blank" rel="noopener">${l.label}</a></li>`).join('');
// assembled at runtime so the address isn't sitting in the HTML for scrapers
const mail = $('[data-mail]');
mail.href = `mailto:${profile.email}`;
$('[data-mail-text]').textContent = profile.email;
$('[data-year]').textContent = new Date().getFullYear();

// local time in Kochi
const clock = $('[data-clock]');
const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: profile.tz });
const tickClock = () => { clock.textContent = fmt.format(new Date()); };
tickClock(); setInterval(tickClock, 15000);

// ---------------------------------------------------------------- smooth scroll + one ticker
const lenis = reduced ? null : new Lenis({ lerp: 0.09, wheelMultiplier: 1, touchMultiplier: 1.4 });
if (lenis) { lenis.stop(); lenis.on('scroll', ScrollTrigger.update); }

const avatar = createAvatar($('.stage'), { reduced, onProgress: p => { loadP = p; } });
if (import.meta.env.DEV) { window.__avatar = avatar; window.__ST = ScrollTrigger; }
let loadP = 0;

gsap.ticker.lagSmoothing(0);
gsap.ticker.add(time => {
  lenis?.raf(time * 1000);
  avatar.frame(performance.now());
});

// in-page anchors go through Lenis so they glide instead of jumping
$$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const id = a.getAttribute('href'); const el = id === '#top' ? 0 : $(id);
  if (el === null) return;
  e.preventDefault();
  // Lenis honours the section's CSS scroll-margin-top, so the label isn't jammed under the nav
  if (lenis) lenis.scrollTo(el, { duration: 1.4, easing: t => 1 - Math.pow(1 - t, 4) });
  else (el === 0 ? scrollTo(0, 0) : el.scrollIntoView());
}));

// ---------------------------------------------------------------- loader
const counter = $('[data-count]');
const bar = $('.loader__bar i');
const shown = { p: 0 };
const minTime = reduced ? 0 : 1.1;
const t0 = performance.now();
let loaded = false;
avatar.ready.then(() => { loaded = true; }).catch(err => { console.error('avatar failed to load', err); loaded = true; });

function loaderTick() {
  // ease the visible number toward real progress, capped by a minimum duration
  const elapsed = (performance.now() - t0) / 1000;
  const target = Math.min(loaded ? 1 : loadP * 0.96, minTime ? elapsed / minTime : 1);
  shown.p += (target - shown.p) * 0.12;
  if (loaded && target >= 1 && shown.p > 0.995) shown.p = 1;
  counter.textContent = String(Math.round(shown.p * 100)).padStart(3, '0');
  bar.style.transform = `scaleX(${shown.p})`;
  if (shown.p >= 1) { gsap.ticker.remove(loaderTick); intro(); }
}
gsap.ticker.add(loaderTick);

// ---------------------------------------------------------------- intro
let heroChars = [];
function intro() {
  document.body.classList.remove('is-loading');
  const name = new SplitText('[data-split]', { type: 'chars', charsClass: 'ch' });
  heroChars = name.chars;
  const lines = $$('[data-hero-line]');
  const stage = $('.stage');
  if (reduced) {
    gsap.set('.loader', { autoAlpha: 0 });
    avatar.state.introOp = 1; avatar.state.intro = 1;
    lenis?.start(); setupScroll(); return;
  }
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.to('.loader__count, .loader__name', { yPercent: -40, autoAlpha: 0, duration: .6, ease: 'power3.in' })
    .to('.loader', { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, '-=.15')
    // hand scrolling back as soon as the loader has lifted, not when the last flourish ends:
    // the nav is already clickable by then and a dead wheel feels broken
    .add(() => { lenis.start(); }, '-=.3')
    .from(heroChars, { yPercent: 110, duration: 1.4, stagger: 0.035 }, '-=.55')
    .to(avatar.state, { introOp: 1, duration: 1.2, ease: 'power2.out' }, '<.1')
    .to(avatar.state, { intro: 1, duration: 2.0, ease: 'power3.out' }, '<')
    .from(lines, { y: 18, autoAlpha: 0, duration: 1, stagger: 0.07 }, '<.35')
    .from('.nav > *', { y: -24, autoAlpha: 0, duration: 1, stagger: 0.08 }, '<')
    .add(() => { avatar.curious(true); }, '-=.6')
    .add(() => { avatar.curious(false); }, '+=.9');
  tl.set('.loader', { display: 'none' });
  setupScroll();
}

// ---------------------------------------------------------------- scroll choreography
function setupScroll() {
  const st = avatar.state;
  const stage = $('.stage');

  // One function owns the avatar's dock and the canvas opacity. Each section only
  // reports its scroll progress; progress is damped here (the "scrub") and the poses
  // are blended in a fixed order, so overlapping triggers can never fight.
  const P = { m: 0, w: 0, c: 0 }, Pt = { m: 0, w: 0, c: 0 };
  const track = (key, trigger, start, end) => ScrollTrigger.create({ trigger, start, end, onUpdate: t => { Pt[key] = t.progress; }, onRefresh: t => { Pt[key] = t.progress; } });
  track('m', '.manifesto', 'top bottom', 'center center');
  // the head lifts away and fades out as the Work list comes up, so no row ever runs under it
  track('w', '.work', 'top 95%', 'top 35%');
  track('c', '.contact', 'top 65%', 'top 5%');
  const desktopMQ = matchMedia('(min-width: 761px)');
  // c0 starts the head below the Contact section's top edge, so it rises into the
  // section's empty upper half instead of fading in over the list above it
  const POSE = {
    d: { hero: [0, -0.04, 1, 0], m: [0.73, 0.02, 0.72, -0.5], w: [0.8, 0.42, 0.6, -0.3], c0: [0.5, -0.6, 0.8, -0.7], c1: [0.5, 0.02, 0.95, -0.3], mOp: 1 },
    m: { hero: [0, 0.16, 0.7, 0], m: [0, 0.35, 0.55, 0], w: [0, 0.5, 0.5, 0], c0: [0, -0.7, 0.6, -0.5], c1: [0, 0.42, 0.6, 0], mOp: 0.22 },
  };
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const smooth = t => t * t * (3 - 2 * t);
  let lastOp = -1;
  gsap.ticker.add((_, dtMs) => {
    const k = reduced ? 1 : 1 - Math.exp(-(dtMs / 1000) * 6);
    for (const key in P) P[key] += (Pt[key] - P[key]) * k;
    const Q = POSE[desktopMQ.matches ? 'd' : 'm'];
    let pose = mix(Q.hero, Q.m, smooth(P.m));
    pose = mix(pose, Q.w, smooth(P.w));
    let op = (1 + (Q.mOp - 1) * smooth(P.m)) * (1 - smooth(P.w));
    if (P.c > 0.001) { pose = mix(Q.c0, Q.c1, smooth(P.c)); op = Math.max(op, smooth(Math.min(1, Math.max(0, P.c - 0.12) * 1.8))); }
    // the desktop poses are framed for landscape; on a portrait tablet the same scale fills the width
    if (Q === POSE.d) pose[2] *= Math.min(1, Math.max(0.62, innerWidth / innerHeight / 1.25));
    [st.dock.x, st.dock.y, st.dock.s, st.dock.ry] = pose;
    op *= st.introOp;
    if (op < 0.004) op = 0;
    if (Math.abs(op - lastOp) > 0.002) { stage.style.opacity = op.toFixed(3); lastOp = op; }
  });

  ScrollTrigger.create({
    trigger: '.contact', start: 'top 35%',
    onEnter: () => { avatar.curious(true); gsap.delayedCall(1.4, () => avatar.curious(false)); },
  });

  // hide the nav while reading downward, bring it back on any upward scroll
  const nav = $('.nav');
  ScrollTrigger.create({
    start: 'top -120', end: 'max',
    onUpdate: s => nav.classList.toggle('is-hidden', s.direction === 1 && !dialog.open),
    onToggle: s => nav.classList.toggle('is-scrolled', s.isActive),   // backing so links stay legible over content
    onLeaveBack: () => nav.classList.remove('is-hidden'),
  });
  // mark the link for the section in view
  $$('.nav nav a:not(.nav__cta)').forEach(a => {
    const sec = $(a.getAttribute('href')); if (!sec) return;
    ScrollTrigger.create({ trigger: sec, start: 'top 45%', end: 'bottom 45%', onToggle: s => {
      if (s.isActive) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
    } });
  });

  if (reduced) { $$('.manifesto__text .w').forEach(w => (w.style.opacity = 1)); return; }

  // manifesto: words brighten as you read
  const words = new SplitText('[data-words]', { type: 'words', wordsClass: 'w' }).words;
  gsap.to(words, { opacity: 1, ease: 'none', stagger: 0.1,
    scrollTrigger: { trigger: '.manifesto__text', start: 'top 78%', end: 'bottom 45%', scrub: 0.6 } });

  // headings: masked line reveal
  $$('[data-reveal]').forEach(el => {
    SplitText.create(el, {
      type: 'lines', mask: 'lines', autoSplit: true,
      onSplit: self => gsap.from(self.lines, { yPercent: 105, duration: 1.2, ease: 'expo.out', stagger: 0.08,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true } }),
    });
  });
  $$('[data-split-lines]').forEach((el, i) => {
    gsap.from(el, { yPercent: 40, autoAlpha: 0, duration: 1.3, ease: 'expo.out', delay: i * 0.08,
      scrollTrigger: { trigger: '.contact__title', start: 'top 85%', once: true } });
  });
  gsap.from('.contact__mail, .contact__links li', { y: 24, autoAlpha: 0, duration: 1, ease: 'expo.out', stagger: 0.06,
    scrollTrigger: { trigger: '.contact__mail', start: 'top 92%', once: true } });

  // blocks: hide them up front and tween *to* visible on enter. A from() inside onEnter
  // would show each item fully, then snap it to transparent as it crosses the trigger line.
  const reveal = (sel, start, y, duration, stagger) => {
    // opacity, not autoAlpha: unrevealed rows and cards must stay reachable by Tab
    gsap.set(sel, { y, opacity: 0 });
    ScrollTrigger.batch(sel, { start, once: true, onEnter: b => gsap.to(b, { y: 0, opacity: 1, duration, ease: 'expo.out', stagger, overwrite: true }) });
  };
  reveal('[data-reveal-block]', 'top 92%', 30, 1, 0.08);
  reveal('[data-row]', 'top 95%', 40, 1.1, 0.07);
  reveal('[data-card]', 'top 94%', 50, 1.2, 0.1);

  // the hero type drifts apart as the page scrolls away
  mq.add('(min-width: 761px)', () => {
    gsap.to('.hero__name > span:first-child', { xPercent: -8, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero__name > span:last-child', { xPercent: 8, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  });
}

// ---------------------------------------------------------------- case study dialog
const dialog = $('.case');
const caseBody = $('[data-case]');
const caseInner = $('.case__inner');
const caseCount = $('[data-case-count]');
let lastTrigger = null;
// the custom cursor hooks in below; a modal dialog paints in the top layer above
// everything else, so the cursor has to move into it while it is open
const cursorHooks = { into() {}, sync() {} };

function renderCase(w) {
  const i = work.indexOf(w), next = work[(i + 1) % work.length];
  caseCount.textContent = `${String(i + 1).padStart(2, '0')} / ${String(work.length).padStart(2, '0')}`;
  caseBody.innerHTML = `
    <h2 id="case-title" tabindex="-1" style="--i:1">${w.title}</h2>
    <p class="case__lead" style="--i:2">${esc(w.hook)}</p>
    <div class="case__meta" style="--i:3">
      <div><p class="label">Role</p><p>${w.role}</p></div>
      <div><p class="label">Year</p><p>${w.year}</p></div>
    </div>
    <h3 class="label" style="--i:4">The problem</h3><p class="case__p" style="--i:5">${esc(w.problem)}</p>
    <h3 class="label" style="--i:6">The approach</h3><p class="case__p" style="--i:7">${esc(w.approach)}</p>
    <h3 class="label" style="--i:8">What came out of it</h3>
    <ul class="case__impact" style="--i:9">${w.impact.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
    <h3 class="label" style="--i:10">Stack</h3>
    <ul class="case__stack" style="--i:11">${w.stack.map(x => `<li>${x}</li>`).join('')}</ul>
    <button class="case__next" data-open="${next.id}" style="--i:12"><span class="label">Next project</span><span class="case__next-title">${next.title} <span aria-hidden="true">→</span></span></button>`;
}

function openCase(id, from) {
  const w = work.find(x => x.id === id); if (!w) return;
  if (dialog.open) {
    if (dialog.classList.contains('is-closing')) return;
    // swap content in place: fade out, re-render, fade in
    // opacity, not autoAlpha: a visibility:hidden body would refuse the focus below
    gsap.to([caseBody, caseCount], { opacity: 0, y: -16, duration: reduced ? 0 : .35, ease: 'power2.in', onComplete: () => {
      renderCase(w); caseInner.scrollTop = 0;
      // the button that had focus is gone; land on the new title so keyboard and screen-reader users follow along
      $('#case-title').focus({ preventScroll: true });
      gsap.fromTo([caseBody, caseCount], { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: reduced ? 0 : .8, ease: 'expo.out' });
      cursorHooks.sync();
    } });
    return;
  }
  lastTrigger = from;
  renderCase(w);
  gsap.set([caseBody, caseCount], { clearProps: 'all' });
  caseInner.scrollTop = 0;
  dialog.showModal();
  cursorHooks.into(dialog);
  lenis?.stop();
  requestAnimationFrame(() => requestAnimationFrame(() => dialog.classList.add('is-open')));
}
function closeCase() {
  if (!dialog.open || dialog.classList.contains('is-closing')) return;
  dialog.classList.add('is-closing');
  dialog.classList.remove('is-open');
  setTimeout(() => {
    dialog.close(); dialog.classList.remove('is-closing');
    cursorHooks.into(document.body);
    lenis?.start(); lastTrigger?.focus({ preventScroll: true });
    cursorHooks.sync();
  }, reduced ? 0 : 750);
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-open]');
  if (b) openCase(b.dataset.open, b.closest('.case') ? lastTrigger : b);
});
$('.case__close').addEventListener('click', closeCase);
dialog.addEventListener('cancel', e => { e.preventDefault(); closeCase(); });
dialog.addEventListener('click', e => { if (e.target === dialog) closeCase(); });

// ---------------------------------------------------------------- micro-interactions
// the avatar reacts to what you point at
$$('.nav__cta, [data-mail]').forEach(el => {
  el.addEventListener('pointerenter', () => avatar.curious(true));
  el.addEventListener('pointerleave', () => avatar.curious(false));
});

// pointer glow on cards
$$('[data-card]').forEach(c => c.addEventListener('pointermove', e => {
  const r = c.getBoundingClientRect();
  c.style.setProperty('--mx', `${e.clientX - r.left}px`); c.style.setProperty('--my', `${e.clientY - r.top}px`);
}));

// demo video: load and play only while visible
const vio = new IntersectionObserver(es => es.forEach(({ target: v, isIntersecting }) => {
  if (isIntersecting) { if (!v.src) v.src = v.dataset.src; if (!reduced) v.play().catch(() => {}); }
  else v.pause();
}), { threshold: 0.25 });
$$('video[data-src]').forEach(v => vio.observe(v));

// sound toggle: muted by default; unmuting happens inside the click, so it counts as a user
// gesture. Leaving view pauses the video (above), which silences it but keeps the choice.
$$('[data-sound]').forEach(btn => {
  const v = btn.parentElement.querySelector('video');
  btn.addEventListener('click', e => {
    e.preventDefault(); e.stopPropagation();
    const unmute = v.muted;
    v.muted = !unmute;
    if (unmute) { if (!v.src) v.src = v.dataset.src; v.play().catch(() => {}); }
    btn.dataset.on = String(unmute);
    btn.setAttribute('aria-label', unmute ? 'Mute video' : 'Unmute video');
  });
});

if (finePointer && !reduced) {
  document.documentElement.classList.add('has-cursor');
  const cur = $('.cursor');
  const HOVER = 'a[href], button, [role="button"]';
  const xTo = gsap.quickTo(cur, 'x', { duration: 0.35, ease: 'power3' });
  const yTo = gsap.quickTo(cur, 'y', { duration: 0.35, ease: 'power3' });
  let shown = false, px = -1, py = -1;
  const show = on => {
    if (on === shown) return;
    shown = on; gsap.to(cur, { autoAlpha: on ? 1 : 0, duration: .25, overwrite: 'auto' });
  };
  // pointerover doesn't fire when the page changes under a still pointer (dialog open/close, re-render)
  const sync = () => {
    if (px < 0) return;
    const t = document.elementFromPoint(px, py);
    cur.classList.toggle('is-hover', !!t?.closest(HOVER));
  };
  cursorHooks.into = host => { host.append(cur); };
  cursorHooks.sync = sync;
  gsap.set(cur, { autoAlpha: 0 });   // hidden until the pointer is actually on the page
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    if (!shown) { xTo(e.clientX, e.clientX); yTo(e.clientY, e.clientY); show(true); }   // appear in place, no glide from a stale spot
    else { xTo(e.clientX); yTo(e.clientY); }
    px = e.clientX; py = e.clientY;
  }, { passive: true });
  addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') cur.classList.add('is-down'); });
  addEventListener('pointerup', () => cur.classList.remove('is-down'));
  document.addEventListener('pointerover', e => cur.classList.toggle('is-hover', !!e.target.closest(HOVER)));
  // leaving the window: mouseout with no relatedTarget is the one signal every browser sends
  document.addEventListener('mouseout', e => { if (!e.relatedTarget) show(false); });
  addEventListener('blur', () => show(false));

  // magnetic buttons: measure against the element's resting position, not its
  // already-pulled box, otherwise it chases the pointer and jitters
  $$('[data-magnetic]').forEach(el => {
    el.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const r = el.getBoundingClientRect();
      const cx = r.left - gsap.getProperty(el, 'x') + r.width / 2, cy = r.top - gsap.getProperty(el, 'y') + r.height / 2;
      gsap.to(el, { x: (e.clientX - cx) * 0.3, y: (e.clientY - cy) * 0.35, duration: .5, ease: 'power3.out', overwrite: true });
    });
    el.addEventListener('pointerleave', () => gsap.to(el, { x: 0, y: 0, duration: .9, ease: 'elastic.out(1, 0.4)', overwrite: true }));
  });
}

// fonts change line breaks: re-measure once they are in
document.fonts?.ready.then(() => ScrollTrigger.refresh());
