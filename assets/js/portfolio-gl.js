/* =========================================================
   2KWeb — WebGL portfolio hover distortion
   Progressive enhancement for .work-card__media thumbnails:
   on hover the image is rendered on a GL plane with a liquid
   ripple around the cursor + subtle chromatic (RGB) shift.
   ONE shared WebGL context is re-parented to the hovered card
   (only one card is hovered at a time) — avoids context limits.
   Any missing capability (no THREE / no WebGL / touch /
   reduced-motion) leaves the existing CSS hover untouched.
   ========================================================= */
(function () {
  "use strict";
  if (typeof THREE === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!window.matchMedia("(hover: hover)").matches) return;

  // WebGL support probe.
  try {
    var probe = document.createElement("canvas");
    if (!(probe.getContext("webgl") || probe.getContext("experimental-webgl"))) return;
  } catch (e) { return; }

  var medias = Array.prototype.slice.call(document.querySelectorAll(".work-card__media"));
  if (!medias.length) return;

  var VERT = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }";
  var FRAG = [
    "precision highp float;",
    "varying vec2 vUv;",
    "uniform sampler2D uTex;",
    "uniform float uHover;",
    "uniform float uTime;",
    "uniform vec2 uMouse;",
    "uniform float uCanvasAspect;",
    "uniform float uImageAspect;",
    "void main(){",
    "  float ratio = uCanvasAspect / uImageAspect;",
    "  vec2 cuv = vUv;",
    "  if (ratio > 1.0) { cuv.y = (cuv.y - 0.5) / ratio + 0.5; }",
    "  else { cuv.x = (cuv.x - 0.5) * ratio + 0.5; }",
    "  float d = distance(vUv, uMouse);",
    "  float ripple = sin(d * 22.0 - uTime * 4.0) * exp(-d * 7.0);",
    "  vec2 dir = normalize(vUv - uMouse + 1e-4);",
    "  vec2 off = dir * ripple * 0.06 * uHover;",
    "  vec2 duv = cuv + off;",
    "  float s = 0.004 * uHover;",
    "  float r = texture2D(uTex, duv + vec2(s, 0.0)).r;",
    "  float g = texture2D(uTex, duv).g;",
    "  float b = texture2D(uTex, duv - vec2(s, 0.0)).b;",
    "  vec3 col = vec3(r, g, b) + 0.045 * uHover;",
    "  gl_FragColor = vec4(col, 1.0);",
    "}"
  ].join("\n");

  var renderer, canvas, scene, camera, mat;
  var uniforms = {
    uTex: { value: null }, uHover: { value: 0 }, uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uCanvasAspect: { value: 1 }, uImageAspect: { value: 1 }
  };

  function build() {
    if (renderer) return true;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    } catch (e) { return false; }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    canvas = renderer.domElement;
    canvas.className = "work-card__gl";
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    mat = new THREE.ShaderMaterial({ uniforms: uniforms, vertexShader: VERT, fragmentShader: FRAG });
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
    return true;
  }

  var active = null, hover = 0, target = 0, raf = 0, last = 0;
  var mouse = { x: 0.5, y: 0.5 };

  function detach() {
    if (!active) return;
    active.classList.remove("gl-on");
    if (canvas && canvas.parentNode === active) active.removeChild(canvas);
    if (uniforms.uTex.value) { uniforms.uTex.value.dispose(); uniforms.uTex.value = null; }
    active = null;
  }

  function attach(media, img) {
    if (active === media) return;
    if (active) detach();
    active = media;
    var w = media.clientWidth || 1, h = media.clientHeight || 1;
    renderer.setSize(w, h, false);
    var tex = new THREE.Texture(img);
    tex.needsUpdate = true;
    tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter;
    if ("colorSpace" in tex) tex.colorSpace = THREE.SRGBColorSpace;
    uniforms.uTex.value = tex;
    uniforms.uCanvasAspect.value = w / h;
    uniforms.uImageAspect.value = (img.naturalWidth || w) / (img.naturalHeight || h);
    media.appendChild(canvas);
    media.classList.add("gl-on");
  }

  function loop(now) {
    // Cap near 72fps: hover effect only — no need to render at 144Hz.
    if (now - last < 12) { raf = requestAnimationFrame(loop); return; }
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    hover += (target - hover) * (1 - Math.pow(0.88, dt * 60));
    uniforms.uHover.value = hover;
    uniforms.uTime.value += dt;
    uniforms.uMouse.value.set(mouse.x, mouse.y);
    if (uniforms.uTex.value) renderer.render(scene, camera);
    if (target === 0 && hover < 0.01) { raf = 0; hover = 0; detach(); return; }
    raf = requestAnimationFrame(loop);
  }
  function start() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } }

  function setMouse(media, e) {
    var r = media.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) / r.width;
    mouse.y = 1 - (e.clientY - r.top) / r.height; // GL y-up
  }

  medias.forEach(function (media) {
    var img = media.querySelector("img");
    if (!img) return;
    media.addEventListener("mouseenter", function (e) {
      if (!img.complete || !img.naturalWidth) return;   // not loaded -> keep CSS hover
      if (!build()) return;
      setMouse(media, e);
      attach(media, img);
      target = 1; start();
    });
    media.addEventListener("mousemove", function (e) { if (active === media) setMouse(media, e); });
    media.addEventListener("mouseleave", function () { if (active === media) target = 0; });
  });

  // Pause when tab hidden (the loop self-stops when idle anyway).
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { target = 0; }
  });
})();
