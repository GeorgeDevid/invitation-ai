/* George & Tess — invitation interactions */
(() => {
  "use strict";

  const W = window.WEDDING || {};
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (t) => t * t * (3 - 2 * t);
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(pointer: fine)").matches;

  document.documentElement.classList.add("js");
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  /* ---------- config → page ---------- */
  const get = (path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), W);
  $$("[data-field]").forEach((el) => {
    const v = get(el.dataset.field);
    if (typeof v === "string" && v) el.textContent = v;
  });

  /* ---------- toast ---------- */
  const toastEl = $("#toast");
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-on"), 3200);
  }

  /* ---------- personalised greeting: ?to=Anna%20%26%20Family ---------- */
  const params = new URLSearchParams(location.search);
  const guest = (params.get("to") || params.get("guest") || "").trim().slice(0, 60);
  if (guest) {
    const g = $("#intro-guest");
    g.textContent = `Dear ${guest}`;
    g.hidden = false;
  }

  /* ==========================================================
     MUSIC
     ========================================================== */
  const audio = $("#bg-music");
  const musicBtn = $("#music-btn");
  const music = W.music || {};
  let wantMusic = false;
  let fadeRaf;

  function fadeTo(target, ms, done) {
    cancelAnimationFrame(fadeRaf);
    const from = audio.volume;
    const t0 = performance.now();
    const step = (now) => {
      const t = clamp((now - t0) / ms, 0, 1);
      audio.volume = clamp(lerp(from, target, t), 0, 1);
      if (t < 1) fadeRaf = requestAnimationFrame(step);
      else if (done) done();
    };
    fadeRaf = requestAnimationFrame(step);
  }

  function setMusicUI(on) {
    musicBtn.classList.toggle("is-playing", on);
    musicBtn.setAttribute("aria-pressed", String(on));
    musicBtn.setAttribute("aria-label", on ? "Pause music" : "Play music");
  }

  function playMusic() {
    if (!audio.src) audio.src = music.src || "assets/audio/my-love-from-36s.mp3";
    wantMusic = true;
    audio.volume = 0;
    const p = audio.play();
    setMusicUI(true);
    fadeTo(music.volume ?? 0.6, 2500);
    if (p && p.catch) p.catch(() => { setMusicUI(false); wantMusic = false; });
  }

  function pauseMusic(remember = true) {
    if (remember) wantMusic = false;
    setMusicUI(false);
    fadeTo(0, 600, () => audio.pause());
  }

  musicBtn.addEventListener("click", () => (audio.paused || !wantMusic ? playMusic() : pauseMusic()));
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && !audio.paused) { audio.pause(); }
    else if (!document.hidden && wantMusic) { audio.play().catch(() => {}); }
  });

  /* ==========================================================
     HERO VIDEO
     ========================================================== */
  const video = $("#hero-video");
  const portrait = () => innerHeight > innerWidth;
  let videoMode = "";
  function setVideoSource() {
    const mode = portrait() ? "mobile" : "desktop";
    if (mode === videoMode) return;
    videoMode = mode;
    video.poster = mode === "mobile" ? video.dataset.posterMobile : "assets/img/lavender-desktop-poster.webp";
    const saveData = navigator.connection && navigator.connection.saveData;
    if (saveData) return;
    let src = mode === "mobile" ? video.dataset.srcMobile : video.dataset.srcDesktop;
    if (!video.canPlayType('video/mp4; codecs="avc1.640028"')) src = src.replace(/\.mp4$/, ".webm");
    video.src = src;
    video.load();
    if (document.body.classList.contains("is-open")) video.play().catch(() => {});
  }
  setVideoSource();
  addEventListener("orientationchange", () => setTimeout(setVideoSource, 300));
  new IntersectionObserver(([e]) => {
    if (!document.body.classList.contains("is-open")) return;
    if (e.isIntersecting) video.play().catch(() => {});
    else video.pause();
  }).observe($("#home"));

  /* ==========================================================
     OPENING FILM / OPEN INVITATION
     ========================================================== */
  const intro = $("#intro");
  const introVideo = $("#intro-video");
  const startHash = location.hash && document.querySelector(location.hash) ? location.hash : "";
  if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  scrollTo(0, 0);
  let opened = false;

  let revealed = false;
  function reveal() {
    if (revealed) return;
    revealed = true;
    intro.classList.add("is-leaving");
    document.body.classList.remove("is-locked");
    document.body.classList.add("is-open");
    requestAnimationFrame(render); // page is scrollable now: size the right-side scroll bar
    video.play().catch(() => {});
    musicBtn.classList.add("show-label");
    setTimeout(() => musicBtn.classList.remove("show-label"), 3500);
    setTimeout(() => {
      intro.hidden = true;
      introVideo.pause();
      if (startHash) document.querySelector(startHash).scrollIntoView({ behavior: "smooth" });
    }, 1300);
  }

  function openInvitation() {
    if (opened) return;
    opened = true;
    playMusic(); // inside the tap gesture so mobile browsers allow audio
    intro.classList.add("is-playing");
    if (reduceMotion) { reveal(); return; }
    // The film ends on a white frame: start fading the site in just before it finishes.
    introVideo.addEventListener("timeupdate", () => {
      if (introVideo.duration && introVideo.currentTime >= introVideo.duration - 0.3) reveal();
    });
    introVideo.addEventListener("ended", reveal);
    introVideo.addEventListener("error", reveal);
    const p = introVideo.play();
    if (p && p.catch) p.catch(reveal);
    setTimeout(reveal, 6000); // safety net if the film stalls on a slow connection
  }
  intro.addEventListener("click", openInvitation); // tap anywhere — the button also handles Enter/Space

  /* ==========================================================
     REVEAL ON SCROLL
     ========================================================== */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("is-in"); revealIO.unobserve(e.target); }
    });
  }, { threshold: 0.14, rootMargin: "0px 0px -6% 0px" });
  $$("[data-reveal]").forEach((el) => revealIO.observe(el));

  /* ==========================================================
     SCROLL ENGINE — parallax, scene, progress
     ========================================================== */
  const progressBar = $("#progress-bar");
  const scrollThumb = $("#scroll-thumb");
  const hero = $("#home");
  const heroContent = $("[data-hero-content]");
  const heroMedia = $("[data-hero-media]");
  const parallaxEls = $$("[data-parallax]");
  const parallaxBgs = $$("[data-parallax-bg]");
  const parallaxInner = $$("[data-parallax-inner]");
  const scene = $("#journey");
  const sceneEls = Object.fromEntries($$("[data-scene]", scene).map((el) => [el.dataset.scene, el]));

  // keyframes: [progress, {x: vw, y: vh, r: deg, s: scale, o: opacity}]
  const SCENE = {
    a: [[-0.2, { x: -52, y: 42, r: -14, s: 0.84, o: 0 }], [0.14, { x: -21, y: -2, r: -7, s: 1, o: 1 }], [0.4, { x: -25, y: -14, r: -9, s: 1, o: 1 }], [0.58, { x: -38, y: -64, r: -15, s: 0.94, o: 0 }]],
    b: [[0.1, { x: 52, y: 46, r: 14, s: 0.84, o: 0 }], [0.3, { x: 21, y: -4, r: 6, s: 1, o: 1 }], [0.53, { x: 25, y: -16, r: 8, s: 1, o: 1 }], [0.72, { x: 38, y: -66, r: 14, s: 0.94, o: 0 }]],
    c: [[0.36, { x: 0, y: 72, r: -4, s: 0.8, o: 0 }], [0.58, { x: 0, y: -4, r: -2, s: 1, o: 1 }], [0.8, { x: 0, y: -10, r: 1, s: 1.04, o: 1 }], [0.99, { x: 0, y: -74, r: 4, s: 1, o: 0 }]],
    d: [[0.5, { x: -36, y: 74, r: -12, s: 0.8, o: 0 }], [0.68, { x: -27, y: 18, r: -6, s: 1, o: 1 }], [0.92, { x: -33, y: -46, r: -11, s: 1, o: 0 }]],
    e: [[0.56, { x: 34, y: 76, r: 9, s: 0.8, o: 0 }], [0.74, { x: 25, y: 22, r: 5, s: 1, o: 1 }], [0.98, { x: 31, y: -44, r: 10, s: 1, o: 0 }]],
    t1: [[-0.04, { y: 5, o: 0, s: 0.96 }], [0.06, { y: 0, o: 1, s: 1 }], [0.29, { y: 0, o: 1, s: 1 }], [0.35, { y: -5, o: 0, s: 1 }]],
    t2: [[0.37, { y: 5, o: 0, s: 0.96 }], [0.44, { y: 0, o: 1, s: 1 }], [0.62, { y: 0, o: 1, s: 1 }], [0.68, { y: -5, o: 0, s: 1 }]],
    t3: [[0.7, { y: 5, o: 0, s: 0.96 }], [0.77, { y: 0, o: 1, s: 1 }], [0.93, { y: 0, o: 1, s: 1 }], [0.99, { y: -5, o: 0, s: 1 }]],
  };
  const DEF = { x: 0, y: 0, r: 0, s: 1, o: 0 };

  function sample(frames, p) {
    if (p <= frames[0][0]) return { ...DEF, ...frames[0][1] };
    const last = frames[frames.length - 1];
    if (p >= last[0]) return { ...DEF, ...last[1] };
    for (let i = 0; i < frames.length - 1; i++) {
      const [p0, a] = frames[i];
      const [p1, b] = frames[i + 1];
      if (p >= p0 && p <= p1) {
        const t = smooth((p - p0) / (p1 - p0));
        const A = { ...DEF, ...a }, B = { ...DEF, ...b };
        return { x: lerp(A.x, B.x, t), y: lerp(A.y, B.y, t), r: lerp(A.r, B.r, t), s: lerp(A.s, B.s, t), o: lerp(A.o, B.o, t) };
      }
    }
    return DEF;
  }

  function render() {
    const vh = innerHeight;
    const y = scrollY;
    const max = document.documentElement.scrollHeight - vh;
    progressBar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    // slim scroll bar on the right: thumb size = share of the page on screen, position = how far down we are
    const track = scrollThumb.parentElement.clientHeight;
    const thumb = Math.max(18, track * Math.min(1, vh / (max + vh)));
    scrollThumb.style.height = `${thumb}px`;
    scrollThumb.style.transform = `translateY(${max > 0 ? (track - thumb) * (y / max) : 0}px)`;
    // only show it where the browser hides its own scroll bar (phones, macOS overlay scroll bars)
    document.body.classList.toggle("has-overlay-scrollbar", innerWidth - document.documentElement.clientWidth === 0);
    document.body.classList.toggle("is-reading", y > vh * 0.85);

    // hero: content drifts up & fades, film slowly zooms
    if (y < vh * 1.2) {
      const t = y / vh;
      heroContent.style.transform = `translate3d(0, ${y * 0.38}px, 0)`;
      heroContent.style.opacity = String(clamp(1 - t * 1.25, 0, 1));
      heroMedia.style.transform = `translate3d(0, ${y * 0.22}px, 0) scale(${1 + t * 0.12})`;
    }

    if (reduceMotion) return;

    parallaxEls.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const d = r.top + r.height / 2 - vh / 2;
      el.style.transform = `translate3d(0, ${d * parseFloat(el.dataset.parallax)}px, 0)`;
    });

    parallaxBgs.forEach((el) => {
      const box = el.parentElement.getBoundingClientRect();
      if (box.bottom < 0 || box.top > vh) return;
      const d = box.top + box.height / 2 - vh / 2;
      const lim = box.height * 0.16;
      el.style.transform = `translate3d(0, ${clamp(d * -0.22, -lim, lim)}px, 0)`;
    });

    parallaxInner.forEach((img) => {
      const box = img.parentElement.getBoundingClientRect();
      if (box.bottom < 0 || box.top > vh) return;
      const p = clamp((box.top + box.height / 2 - vh / 2) / (vh / 2 + box.height / 2), -1, 1);
      img.style.transform = `translate3d(0, ${p * box.height * parseFloat(img.dataset.parallaxInner) * -0.9}px, 0)`;
    });

    // pinned couple scene
    const sr = scene.getBoundingClientRect();
    if (sr.bottom > 0 && sr.top < vh) {
      const p = clamp(-sr.top / (sr.height - vh), -0.4, 1); // negative while the scene slides into view
      for (const [key, frames] of Object.entries(SCENE)) {
        const el = sceneEls[key];
        if (!el) continue;
        const v = sample(frames, p);
        el.style.opacity = v.o.toFixed(3);
        el.style.transform = key.startsWith("t")
          ? `translate3d(0, ${v.y}vh, 0) scale(${v.s})`
          : `translate(-50%, -50%) translate3d(${v.x}vw, ${v.y}vh, 0) rotate(${v.r}deg) scale(${v.s})`;
      }
    }
  }

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; render(); updateDock(); });
  };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  render();

  /* ---------- dock highlight ---------- */
  const dockLinks = $$("#dock a");
  const groups = [
    ["home", ["home"]],
    ["journey", ["verse", "journey"]],
    ["events", ["countdown", "events"]],
    ["location", ["location"]],
    ["rsvp", ["rsvp", "thanks"]],
  ];
  const sectionOrder = groups.flatMap(([g, ids]) => ids.map((id) => [g, document.getElementById(id)])).filter(([, el]) => el);
  let activeGroup = "home";
  function updateDock() {
    const line = innerHeight * 0.42;
    let g = "home";
    for (const [group, el] of sectionOrder) if (el.getBoundingClientRect().top <= line) g = group;
    if (g === activeGroup) return;
    activeGroup = g;
    dockLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${g}`));
  }

  /* ==========================================================
     COUNTDOWN
     ========================================================== */
  const target = new Date(W.date || "2026-12-31T16:00:00+05:30").getTime();
  const units = Object.fromEntries($$("[data-unit]").map((el) => [el.dataset.unit, el]));
  function tick() {
    const diff = target - Date.now();
    if (diff <= 0) {
      ["days", "hours", "minutes", "seconds"].forEach((u) => (units[u].textContent = "00"));
      $("#countdown-done").hidden = false;
      return false;
    }
    const vals = {
      days: Math.floor(diff / 864e5),
      hours: Math.floor(diff / 36e5) % 24,
      minutes: Math.floor(diff / 6e4) % 60,
      seconds: Math.floor(diff / 1e3) % 60,
    };
    for (const [u, v] of Object.entries(vals)) {
      const s = String(v).padStart(2, "0");
      const el = units[u];
      if (el.textContent !== s) {
        el.textContent = s;
        el.classList.remove("tick");
        void el.offsetWidth;
        el.classList.add("tick");
      }
    }
    return true;
  }
  if (tick()) { const iv = setInterval(() => { if (!tick()) clearInterval(iv); }, 1000); }

  /* ==========================================================
     CALENDAR + DIRECTIONS
     ========================================================== */
  const events = W.events || {};
  const couple = `${W.groom || "George"} & ${W.bride || "Tess"}`;
  const utc = (iso) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const icsEsc = (s) => String(s).replace(/\\/g, "\\\\").replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");
  const mapsDir = (q) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`;
  const mapsEmbed = (q) => `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=15&output=embed`;

  function vevent(id, ev) {
    return [
      "BEGIN:VEVENT",
      `UID:${id}-20261231@george-and-tess`,
      `DTSTAMP:${utc(new Date().toISOString())}`,
      `DTSTART:${utc(ev.start)}`,
      `DTEND:${utc(ev.end)}`,
      `SUMMARY:${icsEsc(`${couple} — ${ev.title}`)}`,
      `LOCATION:${icsEsc(`${ev.venue}, ${ev.address}`)}`,
      `DESCRIPTION:${icsEsc(`${ev.note || ""}\nDirections: ${mapsDir(ev.mapQuery)}`)}`,
      "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", `DESCRIPTION:${icsEsc(`${couple} — ${ev.title} tomorrow`)}`, "END:VALARM",
      "END:VEVENT",
    ];
  }

  function downloadICS(which) {
    const ids = which === "all" ? Object.keys(events) : [which];
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//George & Tess//Wedding Invitation//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
    ids.forEach((id) => events[id] && lines.push(...vevent(id, events[id])));
    lines.push("END:VCALENDAR");
    // RFC 5545: fold lines longer than 75 octets
    const enc = new TextEncoder();
    const fold = (line) => {
      const out = [];
      let cur = "";
      for (const ch of line) { // by UTF-8 octets, never splitting a character
        if (enc.encode(cur + ch).length > 74) { out.push(cur); cur = " "; }
        cur += ch;
      }
      out.push(cur);
      return out.join("\r\n");
    };
    const blob = new Blob([lines.map(fold).join("\r\n") + "\r\n"], { type: "text/calendar;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = which === "all" ? "george-and-tess-wedding.ics" : `george-and-tess-${which}.ics`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    toast("Saved to your calendar file 💜");
  }
  $$("[data-ics]").forEach((b) => b.addEventListener("click", () => downloadICS(b.dataset.ics)));

  $$("[data-gcal]").forEach((a) => {
    const ev = events[a.dataset.gcal];
    if (!ev) return;
    const q = new URLSearchParams({
      action: "TEMPLATE",
      text: `${couple} — ${ev.title}`,
      dates: `${utc(ev.start)}/${utc(ev.end)}`,
      details: ev.note || "",
      location: `${ev.venue}, ${ev.address}`,
    });
    a.href = `https://calendar.google.com/calendar/render?${q}`;
  });
  $$("[data-directions]").forEach((a) => { const ev = events[a.dataset.directions]; if (ev) a.href = mapsDir(ev.mapQuery); });

  /* ---------- map tabs (iframe loads only when near view) ---------- */
  const tabs = $(".tabs");
  const iframe = $("#map-iframe");
  let mapKey = "mass";
  let mapReady = false;
  function showMap(key) {
    const ev = events[key];
    if (!ev) return;
    mapKey = key;
    tabs.dataset.active = key;
    $$(".tab", tabs).forEach((t) => { const on = t.dataset.map === key; t.classList.toggle("is-active", on); t.setAttribute("aria-selected", String(on)); });
    $("#map-venue").textContent = ev.venue;
    $("#map-addr").textContent = ev.address;
    $("#map-directions").href = mapsDir(ev.mapQuery);
    if (mapReady) iframe.src = mapsEmbed(ev.mapQuery);
  }
  $$(".tab", tabs).forEach((t) => t.addEventListener("click", () => showMap(t.dataset.map)));
  new IntersectionObserver(([e], io) => {
    if (!e.isIntersecting) return;
    mapReady = true;
    showMap(mapKey);
    io.disconnect();
  }, { rootMargin: "600px 0px" }).observe($("#location"));
  showMap("mass");

  /* ==========================================================
     RSVP
     ========================================================== */
  const form = $("#rsvp-form");
  const done = $("#rsvp-done");
  const countEl = $("#guest-count");
  const errEl = $("#form-error");
  const submitBtn = $("#rsvp-submit");
  const STORE = "gt-rsvp-2026";
  const STORE_IDS = "gt-rsvp-ids";
  const memIds = {};
  let guests = 1;

  if (guest) $("#f-name").value = guest;

  form.addEventListener("focusin", () => document.body.classList.add("is-typing"));
  form.addEventListener("focusout", () => document.body.classList.remove("is-typing"));
  function setGuests(n) {
    guests = clamp(Number(n) || 1, 1, 20);
    countEl.textContent = guests;
  }
  $$("[data-step]", form).forEach((b) => b.addEventListener("click", () => setGuests(guests + Number(b.dataset.step))));

  const guestText = (n) => `${n} guest${n > 1 ? "s" : ""}`;

  function collect() {
    return {
      name: String(new FormData(form).get("name") || "").trim(),
      guests,
      submittedAt: new Date().toISOString(),
    };
  }

  // One id per guest name on this browser: a guest who changes their reply updates their own row in the sheet,
  // while someone else replying from the same phone (a different name) gets a row of their own.
  function replyId(name) {
    const key = name.toLowerCase().replace(/\s+/g, " ").trim();
    let ids = memIds;
    try { ids = Object.assign(memIds, JSON.parse(localStorage.getItem(STORE_IDS) || "{}")); } catch (_) { /* storage may be blocked */ }
    if (!ids[key]) {
      ids[key] = (crypto.randomUUID && crypto.randomUUID()) || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      try { localStorage.setItem(STORE_IDS, JSON.stringify(ids)); } catch (_) { /* kept in memory for this visit */ }
    }
    return ids[key];
  }

  function asText(d) {
    return [`RSVP — ${couple} · 31 Dec 2026`, `Name: ${d.name}`, `Guests: ${d.guests}`].join("\n");
  }

  async function deliver(d) {
    const cfg = W.rsvp || {};
    if (cfg.endpoint) {
      if (/formspree\.io/.test(cfg.endpoint)) {
        const r = await fetch(cfg.endpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(d) });
        if (!r.ok) throw new Error("Formspree error");
      } else {
        // Google Apps Script web app (docs/rsvp-google-sheets.gs). A form-encoded POST needs no CORS preflight, and
        // Apps Script answers with CORS headers, so we can read its reply and only say "thank you" once the row is saved.
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 20000);
        try {
          const r = await fetch(cfg.endpoint, {
            method: "POST",
            body: new URLSearchParams({ name: d.name, guests: String(d.guests), replyId: replyId(d.name) }),
            signal: ctrl.signal,
          });
          const res = await r.json().catch(() => ({}));
          if (!r.ok || !res.ok) throw new Error(res.error || "RSVP not saved");
        } finally {
          clearTimeout(timer);
        }
      }
      return "sent";
    }
    if (cfg.email && !cfg.whatsapp) { location.href = `mailto:${cfg.email}?subject=${encodeURIComponent(`RSVP — ${d.name}`)}&body=${encodeURIComponent(asText(d))}`; return "email"; }
    // WhatsApp: straight to the couple's number if configured, otherwise let the guest pick George or Tess
    const num = (cfg.whatsapp || "").replace(/\D/g, "");
    const wa = `https://wa.me/${num}?text=${encodeURIComponent(asText(d))}`;
    if (!window.open(wa, "_blank")) location.href = wa;
    return num ? "whatsapp" : "whatsapp-pick";
  }

  const SEND_STEP = {
    whatsapp: "One last step: tap send in WhatsApp so your reply reaches us.",
    "whatsapp-pick": "One last step: in WhatsApp, choose George or Tess and tap send so your reply reaches us.",
    email: "One last step: send the email that just opened so your reply reaches us.",
  };

  function showDone(d, again) {
    form.hidden = true;
    done.hidden = false;
    const first = String(d.name).split(" ")[0];
    const count = clamp(Number(d.guests) || 1, 1, 20);
    // Only an endpoint delivery is confirmed; anything else (incl. older saved replies) may not have been sent.
    const pending = d.delivery === "sent" ? null : SEND_STEP[d.delivery] || SEND_STEP["whatsapp-pick"];
    $("#rsvp-done-title").textContent = pending ? (again ? `Welcome back, ${first}` : `Almost there, ${first}!`) : `Thank you, ${first}!`;
    $("#rsvp-again").textContent = pending ? "Review & send again" : "Change my reply";
    $("#rsvp-done-text").textContent = again
      ? pending
        ? `You prepared your reply for ${guestText(count)}. If it wasn't sent, tap below to send it again.`
        : `We have your RSVP for ${guestText(count)}. You can change it below.`
      : pending || `Your RSVP for ${guestText(count)} has been received. We can't wait to celebrate with you under the lavender sky.`;
  }

  function burst(x, y) {
    if (reduceMotion) return;
    for (let i = 0; i < 26; i++) {
      const h = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      h.setAttribute("class", "heart-pop");
      h.innerHTML = '<use href="#i-heart-fill"/>';
      const a = Math.random() * Math.PI * 2;
      const dist = 90 + Math.random() * 180;
      h.style.left = `${x}px`;
      h.style.top = `${y}px`;
      h.style.setProperty("--dx", `${Math.cos(a) * dist}px`);
      h.style.setProperty("--dy", `${Math.sin(a) * dist - 120}px`);
      h.style.setProperty("--r", `${Math.random() * 120 - 60}deg`);
      h.style.color = ["#c7b0ec", "#fff", "#e6cf9f", "#aa8ddf"][i % 4];
      document.body.appendChild(h);
      h.addEventListener("animationend", () => h.remove());
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errEl.hidden = true;
    const d = collect();
    $("#f-name").parentElement.classList.remove("is-invalid");
    if (!d.name) { $("#f-name").parentElement.classList.add("is-invalid"); errEl.textContent = "Please tell us your full name."; errEl.hidden = false; $("#f-name").focus(); return; }
    submitBtn.classList.add("is-loading");
    $(".btn__text", submitBtn).textContent = "Sending…";
    try {
      d.delivery = await deliver(d);
      try { localStorage.setItem(STORE, JSON.stringify(d)); } catch (_) { /* storage may be blocked */ }
      const r = submitBtn.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2);
      showDone(d, false);
      if (d.delivery === "sent") toast("Thank you! Your RSVP has been saved 💜");
      else if (d.delivery === "email") toast("Opening your mail app…");
      else toast("Opening WhatsApp…");
    } catch (err) {
      errEl.textContent = "Sorry, we couldn't save your reply just now. Please check your connection and try again.";
      errEl.hidden = false;
    } finally {
      submitBtn.classList.remove("is-loading");
      $(".btn__text", submitBtn).textContent = "Send my RSVP";
    }
  });

  $("#rsvp-again").addEventListener("click", () => { done.hidden = true; form.hidden = false; form.classList.add("is-in"); });

  // A returning guest gets their name and guest count back, so "send again" resends the same reply.
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || "null");
    if (saved && saved.name) {
      $("#f-name").value = saved.name;
      setGuests(saved.guests);
      showDone(saved, true);
    }
  } catch (_) { /* ignore */ }

  /* ==========================================================
     SHARE
     ========================================================== */
  $("#share-btn").addEventListener("click", async () => {
    // always share the main address (og:url), even when this copy was opened from an older link
    const url = ($('meta[property="og:url"]') || {}).content || location.origin + location.pathname;
    const data = { title: `${couple} — Wedding Invitation`, text: `You're invited to the wedding of ${couple} · 31 December 2026`, url };
    try {
      if (navigator.share) { await navigator.share(data); return; }
      await navigator.clipboard.writeText(url);
      toast("Invitation link copied ✨");
    } catch (_) { /* cancelled */ }
  });

  /* ==========================================================
     FALLING PETALS
     ========================================================== */
  const canvas = $("#petals");
  if (!reduceMotion && canvas.getContext) {
    const ctx = canvas.getContext("2d");
    const COLORS = ["#c7b0ec", "#ddcdf5", "#aa8ddf", "#f4dde6", "#ffffff", "#b9a2e3"];
    let w, h, dpr, petals = [];
    const make = (init) => ({
      x: Math.random() * w,
      y: init ? Math.random() * h : -30 - Math.random() * 80,
      s: 7 + Math.random() * 9,
      vy: 0.35 + Math.random() * 0.75,
      vx: -0.25 + Math.random() * 0.5,
      sw: 0.6 + Math.random() * 1.4,
      ph: Math.random() * Math.PI * 2,
      rot: Math.random() * Math.PI * 2,
      vr: (-0.5 + Math.random()) * 0.03,
      flip: Math.random() * Math.PI * 2,
      c: COLORS[(Math.random() * COLORS.length) | 0],
      a: 0.55 + Math.random() * 0.35,
    });
    function size() {
      dpr = Math.min(2, devicePixelRatio || 1);
      w = innerWidth; h = innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = clamp(Math.round((w * h) / 42000), 12, 34);
      while (petals.length < n) petals.push(make(true));
      petals.length = n;
    }
    function petal(p) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, 0.35 + 0.65 * Math.abs(Math.cos(p.flip)));
      ctx.globalAlpha = p.a;
      const g = ctx.createLinearGradient(0, -p.s, 0, p.s);
      g.addColorStop(0, "#fff");
      g.addColorStop(1, p.c);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, -p.s);
      ctx.bezierCurveTo(p.s * 0.9, -p.s * 0.5, p.s * 0.7, p.s * 0.7, 0, p.s);
      ctx.bezierCurveTo(-p.s * 0.7, p.s * 0.7, -p.s * 0.9, -p.s * 0.5, 0, -p.s);
      ctx.fill();
      ctx.restore();
    }
    let last = performance.now();
    function frame(now) {
      const dt = Math.min(3, (now - last) / 16.7);
      last = now;
      ctx.clearRect(0, 0, w, h);
      for (const p of petals) {
        p.ph += 0.02 * dt;
        p.flip += 0.03 * dt;
        p.rot += p.vr * dt;
        p.y += p.vy * dt;
        p.x += (p.vx + Math.sin(p.ph) * p.sw * 0.5) * dt;
        if (p.y > h + 30 || p.x < -40 || p.x > w + 40) Object.assign(p, make(false));
        petal(p);
      }
      if (!document.hidden) requestAnimationFrame(frame);
    }
    size();
    addEventListener("resize", size);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) { last = performance.now(); requestAnimationFrame(frame); } });
    requestAnimationFrame(frame);
  }

  /* ==========================================================
     CURSOR SPARKLES (desktop)
     ========================================================== */
  if (finePointer && !reduceMotion) {
    let lastSpark = 0;
    addEventListener("pointermove", (e) => {
      const now = performance.now();
      if (now - lastSpark < 45 || e.pointerType !== "mouse") return;
      lastSpark = now;
      const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      s.setAttribute("class", "sparkle");
      s.innerHTML = '<use href="#i-sparkle"/>';
      const size = 6 + Math.random() * 10;
      s.style.width = s.style.height = `${size}px`;
      s.style.left = `${e.clientX - size / 2}px`;
      s.style.top = `${e.clientY - size / 2}px`;
      s.style.setProperty("--dx", `${(Math.random() - 0.5) * 40}px`);
      s.style.setProperty("--dy", `${10 + Math.random() * 30}px`);
      s.style.color = Math.random() > 0.5 ? "#fff" : "#e6cf9f";
      document.body.appendChild(s);
      s.addEventListener("animationend", () => s.remove());
    }, { passive: true });
  }
})();
