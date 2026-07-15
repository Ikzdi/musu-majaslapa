/* =========================================================
   2KWeb — 3D hero object (Three.js, classic/UMD build)
   Primary: a Higgsfield-generated molten-chrome "F" (GLB) rendered
   on a transparent canvas ABOVE the hero video — it "assembles"
   from scattered shards after the intro, then floats with mouse
   parallax. If the GLB or GLTFLoader is missing the canvas stays
   hidden while the video plays; if the video ALSO fails, the old
   faceted icosahedron takes over as the background (unchanged
   progressive-enhancement contract). Loaded as a normal <script>
   using the global THREE so it works from disk (file://).
   ========================================================= */
(function () {
  "use strict";

  var canvas = document.getElementById("hero3d");
  if (!canvas) return;

  var GLB_URL = "assets/models/forma-hero.glb";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function rawShaderFallback() {
    canvas.style.display = "none";
    if (typeof window.__formaHeroGLFallback === "function") {
      try { window.__formaHeroGLFallback(); } catch (e) {}
    }
  }

  if (typeof THREE === "undefined") {
    // CDN blocked: video still owns the hero; raw shader only if it fails too.
    window.__formaStart3D = rawShaderFallback;
    return;
  }

  var heroVideo = document.getElementById("heroVideo");
  var videoFailed = !heroVideo; // no video at all -> canvas is the background

  var st;
  try { st = init(); } catch (e) { st = null; }
  if (!st) { window.__formaStart3D = rawShaderFallback; return; }

  // main.js calls this if the hero video can't play.
  window.__formaStart3D = function () {
    videoFailed = true;
    st.onVideoFailed();
  };

  function init() {
    var host = canvas.parentElement; // .hero__bg
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 5.2);

    /* Fake studio HDRI: a PMREM capture of a few emissive planes gives the
       chrome GLB real reflections without shipping an .hdr file. */
    try {
      var pmrem = new THREE.PMREMGenerator(renderer);
      var env = new THREE.Scene();
      env.background = new THREE.Color(0x120c0a);
      var mkPlane = function (color, intensity, w, h, x, y, z, ry, rx) {
        var m = new THREE.Mesh(
          new THREE.PlaneGeometry(w, h),
          new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity) })
        );
        m.position.set(x, y, z);
        if (ry) m.rotation.y = ry;
        if (rx) m.rotation.x = rx;
        env.add(m);
      };
      mkPlane(0xfff2e2, 5.0, 6, 2, 0, 4, 0, 0, Math.PI / 2);   // white softbox above
      mkPlane(0xff4a1c, 3.4, 4, 6, -5, 0, 0, Math.PI / 2, 0);  // warm ember wall left
      mkPlane(0x6a86c8, 1.1, 4, 6, 5, 0, 0, -Math.PI / 2, 0);  // cool fill right
      var envTex = pmrem.fromScene(env, 0.03).texture;
      scene.environment = envTex;
      pmrem.dispose();
    } catch (e) { /* no env -> lights below still carry the look */ }

    // Lighting — warm key + orange rim + cool fill (also lights the fallback).
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    var key = new THREE.DirectionalLight(0xffd9c2, 2.0); key.position.set(4, 5, 6); scene.add(key);
    var rim = new THREE.DirectionalLight(0xff5a2a, 1.9); rim.position.set(-6, -2, -4); scene.add(rim);
    var fill = new THREE.PointLight(0x88aaff, 0.5, 40); fill.position.set(-4, 3, 5); scene.add(fill);
    var ember = new THREE.PointLight(0xff4a1c, 0.0, 14); ember.position.set(1.1, -0.4, 1.6); scene.add(ember);

    var group = new THREE.Group();       // parallax wrapper
    scene.add(group);
    var model = null;                    // GLB (or icosahedron fallback)
    var glbLoaded = false, glbFailed = false;

    /* ---------- Ember shards: the "assembles itself" material ---------- */
    var shardMat = new THREE.MeshStandardMaterial({
      color: 0x1a0e08, emissive: 0xff4a1c, emissiveIntensity: 1.4,
      metalness: 0.7, roughness: 0.3, flatShading: true
    });
    var shards = [];
    var SHARDS = reduced ? 0 : 18;
    for (var i = 0; i < SHARDS; i++) {
      var size = 0.03 + Math.random() * 0.09;
      var m = new THREE.Mesh(new THREE.TetrahedronGeometry(size, 0), shardMat);
      var a = Math.random() * Math.PI * 2;
      var incl = (Math.random() - 0.5) * 1.4;
      m.userData = {
        // scattered start (far, random) -> orbit slot (close ring)
        sx: (Math.random() - 0.5) * 9, sy: (Math.random() - 0.5) * 7, sz: -3 - Math.random() * 4,
        angle: a, incl: incl,
        radius: 1.55 + Math.random() * 0.8,
        speed: (0.12 + Math.random() * 0.22) * (Math.random() > 0.5 ? 1 : -1),
        spin: Math.random() * 4,
        delay: Math.random() * 0.45
      };
      m.position.set(m.userData.sx, m.userData.sy, m.userData.sz);
      group.add(m);
      shards.push(m);
    }

    function makeIcosaFallback() {
      var g = new THREE.Group();
      g.add(new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.5, 1),
        new THREE.MeshStandardMaterial({
          color: 0x140a06, emissive: 0xff4a1c, emissiveIntensity: 0.75,
          metalness: 0.6, roughness: 0.25, flatShading: true
        })
      ));
      var shell = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.95, 1),
        new THREE.MeshBasicMaterial({ color: 0xff8a2b, wireframe: true, transparent: true, opacity: 0.13 })
      );
      shell.userData.isShell = true;
      g.add(shell);
      return g;
    }

    function adoptModel(obj) {
      model = obj;
      group.add(model);
      if (!reduced) model.scale.setScalar(0.001); // entrance grows it in
      syncCanvas();
      resize();
    }

    /* ---------- Load the Higgsfield GLB ---------- */
    if (THREE.GLTFLoader) {
      new THREE.GLTFLoader().load(
        GLB_URL,
        function (gltf) {
          var obj = gltf.scene;
          // Normalize: center on origin, scale to ~2.6 units tall.
          var box = new THREE.Box3().setFromObject(obj);
          var size = box.getSize(new THREE.Vector3());
          var center = box.getCenter(new THREE.Vector3());
          var s = 2.6 / Math.max(size.x, size.y, size.z || 1);
          obj.position.sub(center);
          var wrap = new THREE.Group();
          wrap.add(obj);
          wrap.scale.setScalar(s);
          obj.traverse(function (n) {
            if (n.isMesh && n.material) {
              n.material.envMapIntensity = 1.35;
              if (n.material.emissive) n.material.emissiveIntensity = 1.2;
            }
          });
          var outer = new THREE.Group(); // wrap again so entrance scale doesn't fight normalize scale
          outer.add(wrap);
          glbLoaded = true;
          ember.intensity = 1.1;
          adoptModel(outer);
        },
        undefined,
        function () { glbFailed = true; onGlbFailed(); }
      );
    } else {
      glbFailed = true;
      onGlbFailed();
    }

    function onGlbFailed() {
      if (videoFailed) {
        // No video AND no GLB -> classic icosahedron background.
        if (!model) adoptModel(makeIcosaFallback());
        syncCanvas();
      } else {
        canvas.style.display = "none"; // video alone owns the hero
      }
    }

    function onVideoFailed() {
      if (glbFailed && !model) adoptModel(makeIcosaFallback());
      syncCanvas();
    }

    /* Canvas is visible when we actually have something to draw:
       the GLB overlay (over video) or any model as the background. */
    function syncCanvas() {
      var show = !!model && (glbLoaded || videoFailed);
      canvas.style.display = show ? "" : "none";
      canvas.classList.toggle("is-overlay", glbLoaded && !videoFailed);
      window.__formaHeroOverlay = glbLoaded; // main.js: don't hide us on video "playing"
      if (show) start();
    }

    function resize() {
      var w = host.clientWidth || window.innerWidth;
      var h = host.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      group.position.x = w < 760 ? 0 : 1.15;
      group.position.y = w < 760 ? 0.55 : 0;
      group.scale.setScalar(w < 760 ? 0.62 : 1);
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

    /* Entrance clock starts once the intro shutter has handed off. */
    var entrance = reduced ? 1 : 0;   // 0..1 assembly progress
    var entranceT0 = -1;
    var ENTRANCE_DUR = 1.9;
    function introDone() {
      return !document.documentElement.classList.contains("intro-active");
    }
    var easeOutExpo = function (x) { return x >= 1 ? 1 : 1 - Math.pow(2, -10 * x); };
    var backOut = function (x) {
      var s = 1.70158;
      x = Math.min(1, x);
      return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
    };

    function start() {
      if (running || !visible || !onscreen) return;
      if (canvas.style.display === "none") return;
      running = true; last = performance.now();
      requestAnimationFrame(frame);
    }

    /* Perf bail: on devices that can't sustain the render (software GL,
       very old GPUs) the decorative overlay removes itself and the video
       keeps the hero; in background mode we just drop the pixel ratio. */
    var perfFrames = 0, perfTime = 0, perfChecked = false;
    function degrade() {
      if (glbLoaded && !videoFailed) {
        canvas.style.display = "none";
        canvas.classList.remove("is-overlay");
        window.__formaHeroOverlay = false;
      } else {
        renderer.setPixelRatio(1);
      }
    }

    function frame(now) {
      if (!visible || !onscreen || canvas.style.display === "none") { running = false; return; }
      // Decorative scene: cap near 72fps so 144Hz monitors don't pay double
      // GPU cost (and jank the main-thread scroll). No-op at 60Hz.
      if (now - last < 12) { requestAnimationFrame(frame); return; }
      var rawDt = (now - last) / 1000;
      var dt = Math.min(0.05, rawDt); last = now; t += dt;
      if (!perfChecked) {
        perfFrames++; perfTime += rawDt;
        if (perfFrames >= 40 || perfTime > 4) {
          perfChecked = true;
          if (perfTime / perfFrames > 0.09) { degrade(); return; }
        }
      }

      // Assembly entrance (skipped under reduced motion).
      if (!reduced && entrance < 1) {
        if (entranceT0 < 0 && introDone()) entranceT0 = t;
        if (entranceT0 >= 0) entrance = Math.min(1, (t - entranceT0) / ENTRANCE_DUR);
      }
      var eAll = easeOutExpo(entrance);

      if (model) {
        var targetScale = reduced ? 1 : Math.max(0.001, backOut(entrance));
        model.scale.setScalar(targetScale);
        model.rotation.y = (1 - eAll) * -1.4 + t * (reduced ? 0.05 : 0.16);
        if (!reduced) model.position.y = Math.sin(t * 0.8) * 0.07 * eAll;
        model.traverse && model.traverse(function (n) {
          if (n.userData && n.userData.isShell) {
            n.rotation.y -= dt * 0.22; n.rotation.x += dt * 0.1;
          }
        });
      }

      // Shards: scattered -> orbit ring, then perpetual slow orbit.
      for (var i = 0; i < shards.length; i++) {
        var sh = shards[i], u = sh.userData;
        var le = easeOutExpo(Math.max(0, Math.min(1, (entrance - u.delay) / (1 - u.delay || 1))));
        u.angle += u.speed * dt * (0.4 + 0.6 * le);
        var ox = Math.cos(u.angle) * u.radius;
        var oy = Math.sin(u.angle * 0.9 + u.incl) * u.radius * 0.45 + Math.sin(t * 0.9 + i) * 0.05;
        var oz = Math.sin(u.angle) * u.radius * 0.7;
        sh.position.set(
          u.sx + (ox - u.sx) * le,
          u.sy + (oy - u.sy) * le,
          u.sz + (oz - u.sz) * le
        );
        sh.rotation.x += dt * u.spin * 0.4;
        sh.rotation.y += dt * u.spin * 0.3;
        var sc = 0.4 + 0.6 * le;
        sh.scale.setScalar(sc);
      }
      if (shardMat) shardMat.emissiveIntensity = 1.1 + Math.sin(t * 2.1) * 0.35;
      if (ember.intensity > 0) ember.intensity = 0.9 + Math.sin(t * 1.7) * 0.3;

      // Mouse parallax (group-level so shards ride along).
      if (!reduced) {
        mx += (tmx - mx) * 0.05;
        my += (tmy - my) * 0.05;
        group.rotation.x = my * 0.5;
        group.rotation.y = mx * 0.4;
        group.rotation.z = mx * 0.08;
      }

      renderer.render(scene, camera);
      requestAnimationFrame(frame);
    }

    window.__hero3dActive = true;
    window.__formaHero3D = { renderer: renderer, scene: scene, camera: camera, group: group }; // debug handle
    // Until we know what we're drawing, stay hidden if the video is healthy.
    if (!videoFailed) canvas.style.display = "none";
    else syncCanvas();

    return { onVideoFailed: onVideoFailed };
  }
})();
