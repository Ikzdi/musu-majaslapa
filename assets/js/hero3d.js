/* =========================================================
   FORMA — 3D molten hero object (Three.js, classic/UMD build)
   Loaded as a normal <script> using the global THREE, so it works
   when opened directly from disk (file://) — unlike ES modules.
   Progressive enhancement: only runs when THREE loaded + WebGL +
   motion allowed. Any failure leaves the hero background untouched.
   ========================================================= */
(function () {
  "use strict";

  var canvas = document.getElementById("hero3d");
  if (!canvas) return;

  function fallback() {
    canvas.style.display = "none";
    if (typeof window.__formaHeroGLFallback === "function") {
      try { window.__formaHeroGLFallback(); } catch (e) {}
    }
  }

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function start3d() {
    if (window.__hero3dActive) return;
    canvas.style.display = "";
    if (typeof THREE === "undefined") { fallback(); return; } // CDN blocked -> raw shader fallback
    try { init(); } catch (e) { fallback(); }
  }

  // The Veo molten video (#heroVideo) owns the hero background when present; the
  // WebGL object stays a fallback that only spins up if the video genuinely
  // can't play (load error or muted-autoplay blocked — main.js calls
  // window.__formaStart3D in that case). Avoids running two GPU backgrounds.
  var heroVideo = document.getElementById("heroVideo");
  if (heroVideo) {
    canvas.style.display = "none";          // video / poster owns the bg
    window.__formaStart3D = start3d;        // main.js triggers this on video failure
  } else {
    start3d();
  }

  function init() {
    var host = canvas.parentElement; // .hero__bg
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 5.2);

    // Faceted molten crystal + wireframe shell (no custom shaders → reliable)
    var group = new THREE.Group();
    scene.add(group);

    var core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.5, 1),
      new THREE.MeshStandardMaterial({
        color: 0x140a06, emissive: 0xff4a1c, emissiveIntensity: 0.75,
        metalness: 0.6, roughness: 0.25, flatShading: true
      })
    );
    group.add(core);

    var shell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.95, 1),
      new THREE.MeshBasicMaterial({ color: 0xff8a2b, wireframe: true, transparent: true, opacity: 0.13 })
    );
    group.add(shell);

    // Lighting — warm key + orange rim + cool fill
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    var key = new THREE.DirectionalLight(0xffd9c2, 2.4); key.position.set(4, 5, 6); scene.add(key);
    var rim = new THREE.DirectionalLight(0xff5a2a, 2.2); rim.position.set(-6, -2, -4); scene.add(rim);
    var fill = new THREE.PointLight(0x88aaff, 0.6, 40); fill.position.set(-4, 3, 5); scene.add(fill);

    function resize() {
      var w = host.clientWidth || window.innerWidth;
      var h = host.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      group.position.x = w < 760 ? 0 : 1.15;
      group.scale.setScalar(w < 760 ? 0.78 : 1);
    }
    resize();
    window.addEventListener("resize", resize);

    var tmx = 0, tmy = 0, mx = 0, my = 0;
    window.addEventListener("mousemove", function (e) {
      tmx = e.clientX / window.innerWidth - 0.5;
      tmy = e.clientY / window.innerHeight - 0.5;
    });

    var visible = true, onscreen = true, running = false;
    var t = 0, last = performance.now();
    document.addEventListener("visibilitychange", function () { visible = !document.hidden; start(); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { onscreen = es[0].isIntersecting; start(); }, { threshold: 0 }).observe(host);
    }

    function start() { if (running || !visible || !onscreen) return; running = true; last = performance.now(); requestAnimationFrame(frame); }
    function frame(now) {
      if (!visible || !onscreen) { running = false; return; }
      var dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
      group.rotation.y += dt * (reduced ? 0.08 : 0.35);
      if (!reduced) {
        mx += (tmx - mx) * 0.05;
        my += (tmy - my) * 0.05;
        group.rotation.x = my * 0.6;
        group.rotation.z = mx * 0.25;
        core.scale.setScalar(1 + Math.sin(t * 1.2) * 0.04); // gentle "breathing"
      }
      core.rotation.y += dt * (reduced ? 0.04 : 0.12);
      shell.rotation.y -= dt * (reduced ? 0.07 : 0.22);
      shell.rotation.x += dt * (reduced ? 0.03 : 0.1);
      renderer.render(scene, camera);
      requestAnimationFrame(frame);
    }
    window.__hero3dActive = true;
    start();
  }
})();
