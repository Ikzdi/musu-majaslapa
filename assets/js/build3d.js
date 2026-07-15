/* =========================================================
   2KWeb — WebGL "website assembles itself" (Three.js UMD)
   Upgrades the CSS build-track scene to a true 3D assembly:
   dark-glass slabs fly in from scattered positions and dock
   into a floating browser window (top bar, hero banner with
   the real site poster, three portfolio cards and a glowing CTA).
   Scroll-scrubbed: main.js publishes the
   smoothed progress via window.__formaBuildState and this scene
   consumes it, so the progress bar + LIVE badge stay in sync.
   Progressive enhancement: any missing capability (no THREE,
   no WebGL, reduced motion, weak GPU) leaves the CSS scene.
   ========================================================= */
(function () {
  "use strict";

  if (typeof THREE === "undefined") return;
  // ?force3d — dev escape hatch to exercise the WebGL path in motion-reduced
  // preview environments. Real reduced-motion users keep the CSS scene.
  var force3d = /[?&]force3d/.test(window.location.search);
  if (!force3d && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var stage = document.querySelector(".build-stage");
  var track = document.querySelector(".build-track");
  if (!stage || !track) return;

  try {
    var probe = document.createElement("canvas");
    if (!(probe.getContext("webgl") || probe.getContext("experimental-webgl"))) return;
  } catch (e) { return; }

  var canvas = document.createElement("canvas");
  canvas.className = "build3d-canvas";
  canvas.setAttribute("aria-hidden", "true");

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  } catch (e) { return; }
  renderer.setPixelRatio(Math.min(1.75, window.devicePixelRatio || 1));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  stage.appendChild(canvas);
  stage.classList.add("gl-build");

  function teardown() {
    stage.classList.remove("gl-build");
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    try { renderer.dispose(); } catch (e) {}
  }

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(38, 16 / 10, 0.1, 60);

  /* Fake studio env (same trick as the hero) so glass + chrome reflect. */
  try {
    var pmrem = new THREE.PMREMGenerator(renderer);
    var env = new THREE.Scene();
    env.background = new THREE.Color(0x0e0a09);
    var lightPlane = function (color, intensity, w, h, x, y, z, ry, rx) {
      var m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity) })
      );
      m.position.set(x, y, z);
      if (ry) m.rotation.y = ry;
      if (rx) m.rotation.x = rx;
      env.add(m);
    };
    lightPlane(0xfff2e2, 4.2, 6, 2, 0, 4, 0, 0, Math.PI / 2);
    lightPlane(0xff4a1c, 3.0, 4, 6, -5, 0, 0, Math.PI / 2, 0);
    lightPlane(0x6a86c8, 1.0, 4, 6, 5, 0, 0, -Math.PI / 2, 0);
    scene.environment = pmrem.fromScene(env, 0.03).texture;
    pmrem.dispose();
  } catch (e) {}

  scene.add(new THREE.AmbientLight(0xffffff, 0.4));
  var key = new THREE.DirectionalLight(0xffd9c2, 1.7); key.position.set(3, 5, 6); scene.add(key);
  var rim = new THREE.DirectionalLight(0xff5a2a, 1.5); rim.position.set(-5, -2, -3); scene.add(rim);
  var ctaGlow = new THREE.PointLight(0xff4a1c, 0.0, 6); ctaGlow.position.set(0, -1.32, 0.9); scene.add(ctaGlow);

  var world = new THREE.Group();   // camera-orbit substitute (we rotate the world)
  scene.add(world);
  var site = new THREE.Group();    // the assembling browser window
  world.add(site);

  /* ---------- Materials ---------- */
  var glassMat = new THREE.MeshStandardMaterial({
    color: 0x15100d, metalness: 0.55, roughness: 0.32,
    transparent: true, opacity: 0, envMapIntensity: 1.1
  });
  var barMat = glassMat.clone(); barMat.color.setHex(0x1c1512);
  var sideMat = new THREE.MeshStandardMaterial({
    color: 0x0d0908, metalness: 0.5, roughness: 0.5, transparent: true, opacity: 0
  });
  var accentMat = new THREE.MeshStandardMaterial({
    color: 0x2a130a, emissive: 0xff4a1c, emissiveIntensity: 1.1,
    metalness: 0.4, roughness: 0.35, transparent: true, opacity: 0
  });
  var pillMat = new THREE.MeshStandardMaterial({
    color: 0x241a15, metalness: 0.3, roughness: 0.55, transparent: true, opacity: 0
  });

  /* Rounded slab: extruded rounded-rect, front face UV-mapped for textures. */
  function roundedSlab(w, h, d, r, faceMat, edgeMat) {
    r = Math.min(r, w / 2, h / 2);
    var s = new THREE.Shape();
    var x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    var g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2, curveSegments: 6 });
    g.translate(0, 0, -d / 2);
    return new THREE.Mesh(g, [faceMat, edgeMat || sideMat]);
  }

  function imageMat(url) {
    var mat = new THREE.MeshBasicMaterial({ color: 0x8c8c8c, transparent: true, opacity: 0 });
    new THREE.TextureLoader().load(url, function (tex) {
      tex.colorSpace ? (tex.colorSpace = THREE.SRGBColorSpace) : (tex.encoding = THREE.sRGBEncoding);
      tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
      mat.map = tex; mat.color.setScalar(0.62); mat.needsUpdate = true;
    });
    mat.userData.isScreen = true; // brightness ramps at power-on
    return mat;
  }
  /* ExtrudeGeometry UVs are in shape units — normalize so the image fills the face. */
  function fitUV(mesh, w, h) {
    var uv = mesh.geometry.attributes.uv, pos = mesh.geometry.attributes.position;
    for (var i = 0; i < uv.count; i++) {
      uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5);
    }
    uv.needsUpdate = true;
  }

  /* ---------- Pieces (scatter -> dock choreography) ---------- */
  var pieces = [];
  /* addPiece(mesh, target{x,y,z}, scatter{x,y,z,rx,ry,rz}, window[s,e], opts) */
  function addPiece(mesh, tp, sp, win, opts) {
    opts = opts || {};
    mesh.userData.pc = {
      tp: tp, sp: sp, s: win[0], e: win[1],
      arc: opts.arc || 0, spin: opts.spin || 0,
      mats: collectMats(mesh)
    };
    mesh.position.set(sp.x, sp.y, sp.z);
    site.add(mesh);
    pieces.push(mesh);
    return mesh;
  }
  function collectMats(obj) {
    var out = [];
    obj.traverse(function (n) {
      if (n.isMesh) {
        (Array.isArray(n.material) ? n.material : [n.material]).forEach(function (m) {
          if (out.indexOf(m) === -1) out.push(m);
        });
      }
    });
    return out;
  }

  // NB: pieces animate material opacity in their own scroll windows, so any
  // material shared between two pieces must be cloned per piece.
  // 1. Back screen panel
  addPiece(roundedSlab(4.9, 3.05, 0.1, 0.12, glassMat, sideMat.clone()),
    { x: 0, y: 0, z: -0.1 },
    { x: 0, y: -3.4, z: -3.5, rx: -1.1, ry: 0.3, rz: 0.15 },
    [0.02, 0.30]);

  // 2. Browser top bar
  var bar = new THREE.Group();
  bar.add(roundedSlab(4.9, 0.36, 0.08, 0.1, barMat, sideMat.clone()));
  var dotGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.05, 16);
  [0xff4a1c, 0x3a2e28, 0x3a2e28].forEach(function (c, i) {
    var dm = new THREE.MeshStandardMaterial({
      color: c, emissive: i === 0 ? 0xff4a1c : 0x000000,
      emissiveIntensity: 0.9, roughness: 0.4, transparent: true, opacity: 0
    });
    var dot = new THREE.Mesh(dotGeo, dm);
    dot.rotation.x = Math.PI / 2;
    dot.position.set(-2.22 + i * 0.17, 0, 0.06);
    bar.add(dot);
  });
  var urlPill = roundedSlab(1.9, 0.16, 0.03, 0.08, pillMat, pillMat);
  urlPill.position.set(-0.35, 0, 0.06);
  bar.add(urlPill);
  addPiece(bar,
    { x: 0, y: 1.36, z: 0.04 },
    { x: 0, y: 3.6, z: 1.2, rx: 0.9, ry: 0, rz: -0.2 },
    [0.12, 0.40]);

  // 3. Hero banner — the real homepage poster
  var bannerMat = imageMat("assets/img/forma-hero-poster.jpg");
  var banner = roundedSlab(4.5, 1.15, 0.08, 0.08, bannerMat, sideMat.clone());
  fitUV(banner, 4.5, 1.15);
  addPiece(banner,
    { x: 0, y: 0.62, z: 0.12 },
    { x: -4.6, y: 0.7, z: 1.6, rx: 0.2, ry: -1.2, rz: 0.25 },
    [0.28, 0.55]);

  // 4. Portfolio cards — real work thumbnails
  [["assets/img/work/lumen.jpg", -1.54, -0.9, 0.55],
   ["assets/img/work/baltic.jpg", 0, -1.3, 0.62],
   ["assets/img/work/pulse.jpg", 1.54, -0.9, 0.69]].forEach(function (c, i) {
    var cm = imageMat(c[0]);
    var card = roundedSlab(1.42, 0.98, 0.08, 0.08, cm, sideMat.clone());
    fitUV(card, 1.42, 0.98);
    addPiece(card,
      { x: c[1], y: -0.62, z: 0.18 },
      { x: c[1] * 2.4, y: c[2] * -3.4, z: 2.2 + i * 0.5, rx: -0.7, ry: c[1] * 0.35, rz: (i - 1) * 0.4 },
      [0.42 + i * 0.07, 0.62 + i * 0.07]);
  });

  // 5. CTA pill
  var cta = roundedSlab(1.6, 0.3, 0.09, 0.15, accentMat, accentMat);
  addPiece(cta,
    { x: 0, y: -1.32, z: 0.26 },
    { x: 3.8, y: -2.6, z: 2.6, rx: 0.5, ry: 1.0, rz: -0.5 },
    [0.60, 0.80]);

  /* Ambient ember particle field. */
  var pGeo = new THREE.BufferGeometry();
  var P = 110, pPos = new Float32Array(P * 3);
  for (var pi = 0; pi < P; pi++) {
    pPos[pi * 3] = (Math.random() - 0.5) * 9;
    pPos[pi * 3 + 1] = (Math.random() - 0.5) * 6;
    pPos[pi * 3 + 2] = -0.6 - Math.random() * 3;
  }
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  var pMat = new THREE.PointsMaterial({
    color: 0xff7a3b, size: 0.035, transparent: true, opacity: 0.55,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  world.add(new THREE.Points(pGeo, pMat));

  /* ---------- Sizing ---------- */
  function resize() {
    var w = stage.clientWidth || 1;
    var h = Math.round(w * 10 / 16);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  /* ---------- Easing ---------- */
  var ezOut = function (x) { return 1 - Math.pow(1 - x, 3); };
  var backOut = function (x) {
    var s = 1.4;
    return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
  };
  var clamp01 = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };

  /* ---------- Render loop (consumes main.js scrub state) ---------- */
  var onscreen = false, visible = true, running = false;
  var t = 0, last = performance.now();
  var perfFrames = 0, perfTime = 0, perfChecked = false;

  function applyPieces(p) {
    for (var i = 0; i < pieces.length; i++) {
      var m = pieces[i], c = m.userData.pc;
      var le = ezOut(clamp01((p - c.s) / (c.e - c.s)));
      var x = c.sp.x + (c.tp.x - c.sp.x) * le;
      var y = c.sp.y + (c.tp.y - c.sp.y) * le + (c.arc ? Math.sin(le * Math.PI) * c.arc : 0);
      var z = c.sp.z + (c.tp.z - c.sp.z) * le;
      m.position.set(x, y, z);
      m.rotation.set(
        (c.sp.rx || 0) * (1 - le),
        (c.sp.ry || 0) * (1 - le) + (c.spin ? (1 - le) * c.spin : 0),
        (c.sp.rz || 0) * (1 - le)
      );
      var dock = le >= 1 ? 1 : le;
      m.scale.setScalar(0.86 + 0.14 * backOut(dock));
      for (var j = 0; j < c.mats.length; j++) {
        c.mats[j].opacity = Math.min(1, le * 1.5);
      }
    }
    // Power-on finale
    var power = clamp01((p - 0.82) / 0.14);
    for (var pi2 = 0; pi2 < pieces.length; pi2++) {
      var mats = pieces[pi2].userData.pc.mats;
      for (var mj = 0; mj < mats.length; mj++) {
        if (mats[mj].userData && mats[mj].userData.isScreen) {
          mats[mj].color.setScalar(0.62 + 0.38 * power);
        }
      }
    }
    accentMat.emissiveIntensity = 1.1 + power * (0.7 + Math.sin(t * 3.2) * 0.35);
    ctaGlow.intensity = power * (1.4 + Math.sin(t * 3.2) * 0.5);
    // Camera orbit + settle, gentle float once assembled
    var cp = ezOut(p);
    world.rotation.y = -0.5 + 0.42 * cp;
    world.rotation.x = 0.2 - 0.14 * cp;
    camera.position.set(0, 0.1, 8.3 - 1.7 * cp);
    camera.lookAt(0, 0, 0);
    site.position.y = Math.sin(t * 0.9) * 0.05 * cp;
    site.rotation.z = Math.sin(t * 0.6) * 0.012 * cp;
  }

  var lastP = -1;
  function frame(now) {
    if (!visible || !onscreen) { running = false; return; }
    // Cap near 72fps: halves GPU load on 144Hz monitors, no-op at 60Hz.
    if (now - last < 12) { requestAnimationFrame(frame); return; }
    var rawDt = (now - last) / 1000;
    var dt = Math.min(0.05, rawDt); last = now; t += dt;

    if (!perfChecked) {
      perfFrames++; perfTime += rawDt;
      if (perfFrames >= 40 || perfTime > 4) {
        perfChecked = true;
        if (perfTime / perfFrames > 0.09) { teardown(); return; }
      }
    }

    var st2 = window.__formaBuildState;
    var p = st2 ? st2.p : 1;
    var tx = st2 ? st2.tx : 0, ty = st2 ? st2.ty : 0;
    applyPieces(p);
    world.rotation.y += tx * -0.14;
    world.rotation.x += ty * 0.1;

    // Ember drift
    var arr = pGeo.attributes.position.array;
    for (var i = 1; i < arr.length; i += 3) {
      arr[i] += dt * 0.12;
      if (arr[i] > 3) arr[i] = -3;
    }
    pGeo.attributes.position.needsUpdate = true;

    lastP = p;
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  function start() {
    if (running || !visible || !onscreen) return;
    running = true; last = performance.now();
    requestAnimationFrame(frame);
  }

  window.__formaBuild3D = { apply: applyPieces, render: function () { renderer.render(scene, camera); }, pieces: pieces }; // debug handle

  document.addEventListener("visibilitychange", function () { visible = !document.hidden; start(); });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) {
      onscreen = es[0].isIntersecting; start();
    }, { threshold: 0, rootMargin: "10% 0px 10% 0px" }).observe(track);
  } else {
    onscreen = true; start();
  }
})();
