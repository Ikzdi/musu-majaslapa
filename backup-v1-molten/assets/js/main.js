/* =========================================================
   FORMA — interaction layer
   Progressive enhancement: every effect degrades gracefully,
   and all motion respects prefers-reduced-motion.
   ========================================================= */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(hover: hover)").matches;
  const lerp = (a, b, n) => (1 - n) * a + n * b;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ---------- Footer year ---------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Page transition: reveal on load ---------- */
  const overlay = $(".page-transition");
  const html = document.documentElement;

  function revealPage() {
    animateHero();
    runScramble();
  }
  function finishReveal() {
    html.classList.remove("pt-entering");
    if (overlay) overlay.setAttribute("data-state", "idle");
  }

  const introEl = document.getElementById("intro");
  const introOwns = !!introEl && html.classList.contains("intro-active");

  if (introOwns) {
    // The "Molten Latch" intro controller owns the first-paint timeline and
    // calls revealPage() + finishReveal() at the handoff. Do not reveal yet.
    startIntro(introEl);
  } else if (overlay && html.classList.contains("pt-entering") && !reduceMotion) {
    overlay.addEventListener("animationend", finishReveal, { once: true });
    setTimeout(finishReveal, 1500); // safety fallback
    revealPage();
  } else {
    finishReveal();
    revealPage();
  }

  // Reset overlay + intro when navigating back via bfcache.
  window.addEventListener("pageshow", (e) => {
    if (!e.persisted) return;
    const introBack = document.getElementById("intro");
    if (introBack && introBack.parentNode) introBack.parentNode.removeChild(introBack);
    html.classList.remove("intro-active");
    if (overlay) {
      html.classList.remove("pt-entering");
      overlay.setAttribute("data-state", "idle");
    }
    document.body.style.overflow = "";
  });

  /* ---------- Hero word reveal ---------- */
  function animateHero() {
    const words = $$(".hero__title .w");
    if (reduceMotion) {
      words.forEach((w) => (w.style.transform = "none"));
      return;
    }
    words.forEach((w, i) => {
      w.style.transition = "transform 0.95s cubic-bezier(0.16,1,0.3,1)";
      w.style.transitionDelay = i * 0.07 + "s";
      requestAnimationFrame(() => (w.style.transform = "translateY(0)"));
    });
  }

  /* ---------- Scroll reveal ---------- */
  const revealEls = $$("[data-reveal]");
  revealEls.forEach((el) => {
    const d = el.getAttribute("data-delay");
    if (d) el.style.setProperty("--d", d);
  });
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-inview");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-inview"));
  }

  /* ---------- Step progress bars ---------- */
  if ("IntersectionObserver" in window) {
    const stepIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-inview");
            stepIo.unobserve(e.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    $$(".step").forEach((el) => stepIo.observe(el));
  }

  /* ---------- Counters ----------
     Real values are already in the HTML, so they show even if JS or the
     observer never runs. The count-up is pure enhancement: when motion is
     allowed we reset to 0 and animate up as each enters the viewport. */
  const counterEls = $$("[data-count]");
  const finalText = (el) =>
    el.getAttribute("data-count") + (el.getAttribute("data-suffix") || "");

  function animateCounter(el) {
    const target = parseFloat(el.getAttribute("data-count")) || 0;
    const suffix = el.getAttribute("data-suffix") || "";
    const dur = 1500;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = clamp((ts - start) / dur, 0, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = finalText(el);
    };
    requestAnimationFrame(step);
  }

  if (!reduceMotion && "IntersectionObserver" in window && counterEls.length) {
    counterEls.forEach((el) => (el.textContent = "0" + (el.getAttribute("data-suffix") || "")));
    const cIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            animateCounter(e.target);
            cIo.unobserve(e.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counterEls.forEach((el) => cIo.observe(el));
  }
  // else: leave the real values already present in the markup.

  /* ---------- Header: scrolled + hide on scroll down ---------- */
  const header = $("#header");
  let lastY = window.scrollY;
  let ticking = false;
  function onScroll() {
    const y = window.scrollY;
    if (header) {
      header.classList.toggle("is-scrolled", y > 30);
      if (y > lastY && y > 400) header.classList.add("is-hidden");
      else header.classList.remove("is-hidden");
    }
    // blob parallax
    if (!reduceMotion) {
      const b1 = $(".blob--1");
      const b2 = $(".blob--2");
      if (b1) b1.style.transform = `translateY(${y * 0.12}px)`;
      if (b2) b2.style.transform = `translateY(${y * -0.08}px)`;
    }
    lastY = y;
    ticking = false;
  }
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(onScroll);
        ticking = true;
      }
    },
    { passive: true }
  );

  /* ---------- Active nav link ---------- */
  const navLinks = $$(".nav__link");
  const sectionMap = navLinks
    .map((l) => {
      const id = l.getAttribute("href");
      return id && id.startsWith("#") ? { link: l, sec: $(id) } : null;
    })
    .filter((x) => x && x.sec);
  if ("IntersectionObserver" in window && sectionMap.length) {
    const navIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            navLinks.forEach((l) => l.classList.remove("is-active"));
            const m = sectionMap.find((x) => x.sec === e.target);
            if (m) m.link.classList.add("is-active");
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sectionMap.forEach((x) => navIo.observe(x.sec));
  }

  /* ---------- Mobile menu ---------- */
  const burger = $("#burger");
  const mobileMenu = $("#mobileMenu");
  function setMenu(open) {
    if (!burger || !mobileMenu) return;
    burger.setAttribute("aria-expanded", String(open));
    mobileMenu.classList.toggle("is-open", open);
    mobileMenu.setAttribute("aria-hidden", String(!open));
    burger.setAttribute("aria-label", open ? "Aizvērt izvēlni" : "Atvērt izvēlni");
    document.body.style.overflow = open ? "hidden" : "";
  }
  if (burger) {
    burger.addEventListener("click", () =>
      setMenu(burger.getAttribute("aria-expanded") !== "true")
    );
    $$(".mobile-menu__nav a, .mobile-menu__foot a").forEach((a) =>
      a.addEventListener("click", () => setMenu(false))
    );
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setMenu(false);
    });
  }

  /* ---------- FAQ: single open accordion ---------- */
  const faqItems = $$(".faq-item");
  faqItems.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (item.open) faqItems.forEach((o) => o !== item && (o.open = false));
    });
  });

  /* ---------- Smooth inertia scroll (self-contained, no CDN) ----------
     Eases window.scrollY toward a target on wheel input. Keeps native
     layout, sticky/fixed elements, scrollbar and keyboard scrolling
     intact. Desktop + fine-pointer only; off for reduced motion / touch. */
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const smoothEnabled = !reduceMotion && canHover && finePointer;
  let targetY = window.scrollY;
  let currentY = window.scrollY;
  let smoothing = false;

  function maxScroll() {
    return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  }
  function smoothLoop() {
    currentY = lerp(currentY, targetY, 0.12);
    if (Math.abs(targetY - currentY) < 0.5) {
      currentY = targetY;
      smoothing = false;
    }
    window.scrollTo(0, currentY);
    if (smoothing) requestAnimationFrame(smoothLoop);
  }
  function startSmooth() {
    if (!smoothing) {
      smoothing = true;
      requestAnimationFrame(smoothLoop);
    }
  }
  if (smoothEnabled) {
    window.addEventListener(
      "wheel",
      (e) => {
        if (e.ctrlKey || e.defaultPrevented) return; // pinch-zoom etc.
        // Ignore inside scrollable panels (e.g. open mobile menu)
        if (mobileMenu && mobileMenu.classList.contains("is-open")) return;
        e.preventDefault();
        const delta = e.deltaMode === 1 ? e.deltaY * 22 : e.deltaY;
        targetY = clamp(targetY + delta, 0, maxScroll());
        startSmooth();
      },
      { passive: false }
    );
    // Keep target in sync with non-wheel scrolling (keyboard, drag, anchor).
    window.addEventListener(
      "scroll",
      () => {
        if (!smoothing) {
          targetY = window.scrollY;
          currentY = window.scrollY;
        }
      },
      { passive: true }
    );
    window.addEventListener("resize", () => {
      targetY = clamp(targetY, 0, maxScroll());
    });
  }

  function scrollToY(top) {
    top = clamp(top, 0, maxScroll());
    if (smoothEnabled) {
      targetY = top;
      startSmooth();
    } else {
      window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
    }
  }

  /* ---------- Anchor scrolling with header offset ---------- */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (!href || href === "#") return;
      const target = $(href);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 70;
      scrollToY(top);
    });
  });

  /* ---------- Scroll progress bar ---------- */
  (function () {
    const bar = document.createElement("div");
    bar.className = "scroll-progress";
    bar.setAttribute("aria-hidden", "true");
    bar.innerHTML = "<span></span>";
    document.body.appendChild(bar);
    const fill = bar.firstChild;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      fill.style.transform = "scaleX(" + clamp(p, 0, 1) + ")";
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  })();

  /* ---------- Text scramble (decode effect) ---------- */
  const scrambleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/(){}[]<>=+*";
  function scrambleOne(el) {
    const finalStr = el.getAttribute("data-scramble") || el.textContent;
    if (!el.getAttribute("data-scramble")) el.setAttribute("data-scramble", finalStr);
    if (reduceMotion) {
      el.textContent = finalStr;
      return;
    }
    const len = finalStr.length;
    let frame = 0;
    const totalFrames = Math.max(18, len * 1.6);
    const tick = () => {
      let out = "";
      for (let i = 0; i < len; i++) {
        const ch = finalStr[i];
        if (ch === " ") { out += " "; continue; }
        const revealAt = (i / len) * (totalFrames * 0.7);
        if (frame >= revealAt) out += ch;
        else out += scrambleChars[(Math.floor(frame * 1.7) + i * 7) % scrambleChars.length];
      }
      el.textContent = out;
      frame++;
      if (frame <= totalFrames) requestAnimationFrame(tick);
      else el.textContent = finalStr;
    };
    requestAnimationFrame(tick);
  }
  function runScramble() {
    $$("[data-scramble]").forEach((el, i) => {
      if (reduceMotion) { el.textContent = el.getAttribute("data-scramble") || el.textContent; return; }
      setTimeout(() => scrambleOne(el), 120 + i * 90);
    });
  }

  /* ---------- WebGL flowing hero background ---------- */
  function initHeroGL() {
    if (reduceMotion) return;
    const host = $(".hero__bg");
    if (!host) return;
    const canvas = document.createElement("canvas");
    canvas.className = "hero__canvas";
    canvas.setAttribute("aria-hidden", "true");
    const gl =
      canvas.getContext("webgl", { antialias: false, alpha: false }) ||
      canvas.getContext("experimental-webgl");
    if (!gl) return; // fallback: CSS blobs stay visible

    const vsrc = "attribute vec2 a;void main(){gl_Position=vec4(a,0.0,1.0);}";
    const fsrc = [
      "precision mediump float;",
      "uniform vec2 u_res;uniform float u_time;uniform vec2 u_mouse;uniform float u_intro;",
      "vec2 hash(vec2 p){p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));return -1.0+2.0*fract(sin(p)*43758.5453123);}",
      "float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.0-2.0*f);",
      "return mix(mix(dot(hash(i+vec2(0.0,0.0)),f-vec2(0.0,0.0)),dot(hash(i+vec2(1.0,0.0)),f-vec2(1.0,0.0)),u.x),",
      "mix(dot(hash(i+vec2(0.0,1.0)),f-vec2(0.0,1.0)),dot(hash(i+vec2(1.0,1.0)),f-vec2(1.0,1.0)),u.x),u.y);}",
      "float fbm(vec2 p){float v=0.0,a=0.5;for(int i=0;i<5;i++){v+=a*noise(p);p*=2.0;a*=0.5;}return v;}",
      "void main(){vec2 uv=gl_FragCoord.xy/u_res.xy;vec2 p=uv*3.0;p.x*=u_res.x/u_res.y;",
      "float t=u_time*(0.05+0.06*u_intro);p+=u_mouse*0.4;",
      "vec2 q=vec2(fbm(p+t),fbm(p+vec2(5.2,1.3)-t));",
      "vec2 r=vec2(fbm(p+4.0*q+vec2(1.7,9.2)+t),fbm(p+4.0*q+vec2(8.3,2.8)-t));",
      "float f=fbm(p+4.0*r);",
      "vec3 ink=vec3(0.04,0.04,0.05);vec3 deep=vec3(0.13,0.05,0.03);vec3 acc=vec3(1.0,0.29,0.11);",
      "vec3 col=mix(ink,deep,clamp(f*f*1.6,0.0,1.0));",
      "col=mix(col,acc,clamp(pow(max(f,0.0)*1.1,3.0)*(0.45+0.3*sin(t+r.x*4.0))*(1.0+1.6*u_intro),0.0,0.95));",
      "col+=acc*0.06*u_intro;",
      "float vig=smoothstep(1.15,0.25,length(uv-0.5));col*=mix(0.45,1.1,vig);",
      "gl_FragColor=vec4(col,1.0);}",
    ].join("\n");

    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
      return s;
    }
    const vs = compile(gl.VERTEX_SHADER, vsrc);
    const fs = compile(gl.FRAGMENT_SHADER, fsrc);
    if (!vs || !fs) return; // compile failure -> fallback to CSS blobs

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aLoc = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(aLoc);
    gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");
    const uIntro = gl.getUniformLocation(prog, "u_intro");
    if (uIntro) gl.uniform1f(uIntro, 0.0); // default = today's calm look

    // Expose a guarded setter so the intro controller can ramp the molten flare.
    window.__formaSetIntro = function (v) {
      if (uIntro) { gl.useProgram(prog); gl.uniform1f(uIntro, v); }
    };

    // Shader is sound — attach canvas and hide CSS blob fallback.
    host.insertBefore(canvas, host.firstChild);
    host.classList.add("has-gl");

    const dpr = Math.min(1.3, window.devicePixelRatio || 1);
    let mx = 0, my = 0, tmx = 0, tmy = 0;
    function resize() {
      const w = host.clientWidth, h = host.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr * 0.85));
      canvas.height = Math.max(1, Math.floor(h * dpr * 0.85));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    }
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", (e) => {
      tmx = (e.clientX / window.innerWidth - 0.5);
      tmy = (0.5 - e.clientY / window.innerHeight);
    });

    const start = performance.now();
    let running = true;
    document.addEventListener("visibilitychange", () => {
      running = !document.hidden;
      if (running) requestAnimationFrame(frame);
    });
    function frame(now) {
      if (!running) return;
      mx = lerp(mx, tmx, 0.04);
      my = lerp(my, tmy, 0.04);
      gl.uniform1f(uTime, (now - start) / 1000);
      gl.uniform2f(uMouse, mx, my);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  initHeroGL();

  /* ---------- Homepage intro: "Molten Latch" shutter ----------
     Opaque columns hold with a 00→100 counter while the hero's own WebGL
     shader flares hotter behind them; the columns then part on a choreographed
     stagger and hand the headline up. Transform/opacity only. Fully guarded:
     content can never be trapped behind it. */
  function startIntro(intro) {
    const meterCount = $(".intro__count", intro);
    const meterBar = $(".intro__bar i", intro);

    // Motion-safe variant for reduced-motion users (and motion-reduced preview
    // environments): static cover, brief hold, then a gentle JS opacity fade.
    // (CSS transitions are globally neutralised under reduced motion, so the fade
    // is driven via rAF on inline opacity, which is unaffected.) Guarantees the
    // intro is still SEEN — accessibly — instead of being skipped entirely.
    if (reduceMotion) {
      if (meterCount) meterCount.textContent = "100";
      if (meterBar) meterBar.style.setProperty("--p", 1);
      let done = false;
      const reveal = () => { if (done) return; done = true; revealPage(); finishReveal(); };
      const wipe = () => {
        if (intro && intro.parentNode) intro.parentNode.removeChild(intro);
        html.classList.remove("intro-active");
      };
      const rt0 = performance.now();
      const HOLD = 520, FADE = 480;
      const fade = (now) => {
        const t = now - rt0;
        if (t < HOLD) { requestAnimationFrame(fade); return; }
        reveal(); // content sits behind the fading cover
        const p = Math.min((t - HOLD) / FADE, 1);
        intro.style.opacity = String(1 - p);
        if (p < 1) requestAnimationFrame(fade);
        else wipe();
      };
      requestAnimationFrame(fade);
      setTimeout(() => { reveal(); wipe(); }, HOLD + FADE + 800); // backstop
      return;
    }

    let handedOff = false, cleaned = false, exitFired = false;

    const COUNT_DUR = 1320;   // count 00→100
    const EXIT_AT = 1430;     // columns begin to part
    const HANDOFF_AFTER_EXIT = 170;
    const t0 = performance.now();

    // Shader flare peaks AS the columns part, then settles so it never fights text.
    function rampShader(t) {
      let v;
      if (t < 1150) v = (t / 1150) * 0.7;            // prime (mostly hidden)
      else if (t < 1500) v = 0.7 + ((t - 1150) / 350) * 0.3; // peak ~1.0 at the reveal
      else v = 1 - (t - 1500) / 750;                 // settle to 0 as headline rises
      v = Math.max(0, Math.min(1, v));
      if (typeof window.__formaSetIntro === "function") {
        try { window.__formaSetIntro(v); } catch (e) {}
      }
    }
    function handoff() {
      if (handedOff) return;
      handedOff = true;
      revealPage();   // animateHero() raises the H1 lines + runScramble()
      finishReveal(); // clears legacy state, idles the page-transition overlay
    }
    function cleanup() {
      if (cleaned) return;
      cleaned = true;
      if (typeof window.__formaSetIntro === "function") {
        try { window.__formaSetIntro(0); } catch (e) {}
      }
      if (intro && intro.parentNode) intro.parentNode.removeChild(intro);
      html.classList.remove("intro-active");
    }
    function beginExit() {
      if (exitFired) return;
      exitFired = true;
      intro.classList.add("is-latch");
      setTimeout(() => {
        intro.classList.add("is-exit");
        setTimeout(handoff, HANDOFF_AFTER_EXIT);
        const lastCol = intro.querySelector(".intro__col:nth-child(5)");
        if (lastCol) lastCol.addEventListener("transitionend", cleanup, { once: true });
      }, 70);
    }
    function loop(now) {
      const t = now - t0;
      const pc = Math.min(t / COUNT_DUR, 1);
      const eased = 1 - Math.pow(1 - pc, 3); // easeOutCubic, matches counters
      if (meterCount) meterCount.textContent = String(Math.round(eased * 100)).padStart(2, "0");
      if (meterBar) meterBar.style.setProperty("--p", eased);
      rampShader(t);
      if (t >= EXIT_AT) beginExit();
      if (t < 2400 && !cleaned) requestAnimationFrame(loop);
    }

    // Safety nets — the hero can never stay hidden.
    setTimeout(() => { if (!exitFired) beginExit(); }, EXIT_AT + 300); // rAF throttled
    setTimeout(() => { handoff(); cleanup(); }, 2700);                  // absolute backstop
    try { requestAnimationFrame(loop); }
    catch (e) { handoff(); cleanup(); }
  }

  /* ---------- Modals (native <dialog>) ---------- */
  const dialogs = $$("dialog.modal");
  const supportsDialog = dialogs.length && typeof dialogs[0].showModal === "function";
  const projectModal = $("#projectModal");
  const quoteModal = $("#quoteModal");

  function populateProject(trigger) {
    if (!projectModal) return;
    const set = (sel, val) => { const n = $(sel, projectModal); if (n && val != null) n.textContent = val; };
    set(".modal__title", trigger.getAttribute("data-title"));
    set(".modal__meta", trigger.getAttribute("data-meta"));
    const body = $(".modal__body", projectModal);
    if (body) body.innerHTML = "<p>" + (trigger.getAttribute("data-desc") || "") + "</p>";
    const art = $(".modal__art", projectModal);
    if (art) art.className = "modal__art art " + (trigger.getAttribute("data-art") || "art--1");
    const tagsWrap = $(".modal__tags", projectModal);
    if (tagsWrap) {
      const tags = (trigger.getAttribute("data-tags") || "").split(",").filter(Boolean);
      tagsWrap.innerHTML = tags.map((t) => "<span>" + t.trim() + "</span>").join("");
    }
  }

  function openModal(name, trigger) {
    const dlg = name === "project" ? projectModal : quoteModal;
    if (!dlg || typeof dlg.showModal !== "function") return false;
    if (name === "project") populateProject(trigger);
    dlg.showModal();
    document.body.style.overflow = "hidden";
    return true;
  }

  if (supportsDialog) {
    document.addEventListener("click", (e) => {
      const opener = e.target.closest("[data-modal-open]");
      if (opener) {
        if (openModal(opener.getAttribute("data-modal-open"), opener)) e.preventDefault();
        return;
      }
      const closer = e.target.closest("[data-modal-close]");
      if (closer) {
        const dlg = closer.closest("dialog");
        if (dlg) dlg.close();
      }
    });
    dialogs.forEach((d) => {
      // backdrop click (dialog fills viewport; clicks outside the panel hit the dialog)
      d.addEventListener("click", (e) => { if (e.target === d) d.close(); });
      d.addEventListener("close", () => {
        document.body.style.overflow = "";
        const form = $(".form", d);
        const success = $(".form__success", d);
        if (form) form.classList.remove("is-sent");
        if (success) success.classList.remove("is-shown");
      });
    });
  }

  /* ---------- Forms (quote + contact) ---------- */
  $$("form[data-success]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const success = $("#" + form.getAttribute("data-success"));
      form.classList.add("is-sent");
      if (success) success.classList.add("is-shown");
      form.reset();
    });
  });

  /* ---------- Work filter (Darbi page) ---------- */
  const filterBar = $(".filter");
  if (filterBar) {
    const cards = $$(".work__grid--all .work-card");
    filterBar.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-filter]");
      if (!btn) return;
      $$("button", filterBar).forEach((b) =>
        b.classList.toggle("is-active", b === btn)
      );
      const f = btn.getAttribute("data-filter");
      cards.forEach((c) => {
        const show = f === "all" || c.getAttribute("data-category") === f;
        c.classList.toggle("is-hidden", !show);
      });
    });
  }

  /* ---------- Page transition on internal links ---------- */
  function coverAndGo(href) {
    if (reduceMotion || !overlay) { window.location.href = href; return; }
    overlay.setAttribute("data-state", "cover");
    setTimeout(() => { window.location.href = href; }, 560);
  }
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    const href = a.getAttribute("href");
    if (!href) return;
    if (a.target === "_blank" || a.hasAttribute("download") || a.dataset.modalOpen) return;
    if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    let url;
    try { url = new URL(href, window.location.href); } catch (err) { return; }
    if (url.origin !== window.location.origin) return;
    if (url.pathname === window.location.pathname && url.search === window.location.search) return;
    e.preventDefault();
    coverAndGo(url.href);
  });

  /* ===================================================
     Pointer-driven effects (skip on touch / reduced motion)
     =================================================== */
  if (canHover && !reduceMotion) {
    /* Custom cursor */
    const cursor = $(".cursor");
    const dot = $(".cursor__dot");
    const ring = $(".cursor__ring");
    let mx = window.innerWidth / 2,
      my = window.innerHeight / 2;
    let rx = mx,
      ry = my;

    window.addEventListener("mousemove", (e) => {
      mx = e.clientX;
      my = e.clientY;
      if (cursor && cursor.style.opacity !== "1") cursor.style.opacity = "1";
      if (dot) {
        dot.style.left = mx + "px";
        dot.style.top = my + "px";
      }
    });
    function ringRaf() {
      rx = lerp(rx, mx, 0.18);
      ry = lerp(ry, my, 0.18);
      if (ring) {
        ring.style.left = rx + "px";
        ring.style.top = ry + "px";
      }
      requestAnimationFrame(ringRaf);
    }
    requestAnimationFrame(ringRaf);

    const hoverTargets = "a, button, [data-cursor], summary, .card, .work-card, .plan, .quote";
    document.addEventListener("mouseover", (e) => {
      if (e.target.closest(hoverTargets)) cursor && cursor.classList.add("is-hover");
    });
    document.addEventListener("mouseout", (e) => {
      if (e.target.closest(hoverTargets)) cursor && cursor.classList.remove("is-hover");
    });
    window.addEventListener("mousedown", () => cursor && cursor.classList.add("is-down"));
    window.addEventListener("mouseup", () => cursor && cursor.classList.remove("is-down"));
    document.addEventListener("mouseleave", () => cursor && (cursor.style.opacity = "0"));

    /* Magnetic buttons */
    $$("[data-magnetic]").forEach((el) => {
      const strength = 0.32;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
      });
      el.addEventListener("mouseleave", () => (el.style.transform = ""));
    });

    /* Card spotlight follow */
    $$(".card").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
        card.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
      });
    });

    /* 3D tilt */
    $$("[data-tilt]").forEach((el) => {
      const max = 7;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(800px) rotateX(${-py * max}deg) rotateY(${px * max}deg) translateY(-4px)`;
      });
      el.addEventListener("mouseleave", () => (el.style.transform = ""));
    });
  }
})();
