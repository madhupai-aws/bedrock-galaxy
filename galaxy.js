/* Cinematic galaxy of Bedrock — Three.js scene */
/* globals THREE, BEDROCK_DATA */

const D = window.BEDROCK_DATA;

// ─── Renderer + scene setup ───────────────────────────────────────────────
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x05060e, 1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x05060e, 0.0024);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 4000);
camera.position.set(0, 60, 260);

// ─── Deep background — starfield + distant nebula ────────────────────────
function makeStarfield(count, radius, size, colorRange) {
  const geom = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // distribute on a sphere shell, with thickness
    const r = radius + (Math.random() - .5) * radius * 0.4;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta) * 0.5;
    positions[i*3+2] = r * Math.cos(phi);
    const c = new THREE.Color().setHSL(colorRange[0] + Math.random()*colorRange[1], 0.4 + Math.random()*0.3, 0.5 + Math.random()*0.5);
    colors[i*3] = c.r; colors[i*3+1] = c.g; colors[i*3+2] = c.b;
  }
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    size, vertexColors: true, transparent: true, opacity: 0.9,
    blending: THREE.AdditiveBlending, depthWrite: false,
    map: makeSoftCircleTexture()
  });
  return new THREE.Points(geom, mat);
}

function makeSoftCircleTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32,32,0,32,32,32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.4, 'rgba(255,255,255,0.5)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0,0,64,64);
  const t = new THREE.CanvasTexture(c);
  t.needsUpdate = true;
  return t;
}

scene.add(makeStarfield(4000, 1200, 1.8, [0.55, 0.2]));   // cool cyan-blue faraway
scene.add(makeStarfield(1500, 700, 1.2, [0.7, 0.15]));    // violet mid-field
scene.add(makeStarfield(800,  400, 0.9, [0.05, 0.1]));    // warm specks

// Subtle nebula clouds (sprite planes)
function addNebula(x, y, z, hue, scale) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(128,128,0,128,128,128);
  const col = new THREE.Color().setHSL(hue, 0.6, 0.55);
  grd.addColorStop(0, `rgba(${col.r*255|0},${col.g*255|0},${col.b*255|0},0.35)`);
  grd.addColorStop(0.5, `rgba(${col.r*255|0},${col.g*255|0},${col.b*255|0},0.1)`);
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0,0,256,256);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.6 });
  const sp = new THREE.Sprite(mat);
  sp.position.set(x, y, z);
  sp.scale.set(scale, scale, 1);
  scene.add(sp);
  return sp;
}
const nebulae = [];
nebulae.push(addNebula(-400, -80, -200, 0.62, 600));
nebulae.push(addNebula(350, 60, -300, 0.72, 520));
nebulae.push(addNebula(100, -150, 200, 0.55, 450));
nebulae.push(addNebula(-200, 120, 400, 0.05, 400));

// ─── Lights ───────────────────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0x6680aa, 0.35));
const coreLight = new THREE.PointLight(0x9ecbff, 4, 400, 2);
coreLight.position.set(0,0,0);
scene.add(coreLight);

// ─── Bedrock core ─────────────────────────────────────────────────────────
const coreGroup = new THREE.Group();
scene.add(coreGroup);

// Inner bright sphere
const coreSphere = new THREE.Mesh(
  new THREE.IcosahedronGeometry(8, 3),
  new THREE.MeshBasicMaterial({ color: 0xcfe4ff })
);
coreGroup.add(coreSphere);

// Glowing halo (sprite)
function haloSprite(color, scale, opacity) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(128,128,0,128,128,128);
  grd.addColorStop(0, `rgba(255,255,255,${opacity})`);
  grd.addColorStop(0.15, `rgba(${color.r*255|0},${color.g*255|0},${color.b*255|0},${opacity*0.9})`);
  grd.addColorStop(0.5, `rgba(${color.r*255|0},${color.g*255|0},${color.b*255|0},${opacity*0.2})`);
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0,0,256,256);
  const tex = new THREE.CanvasTexture(c);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map:tex, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false }));
  sp.scale.set(scale, scale, 1);
  return sp;
}
const coreHalo1 = haloSprite(new THREE.Color(0x88b8ff), 60, 0.85);
coreGroup.add(coreHalo1);
const coreHalo2 = haloSprite(new THREE.Color(0x6aa0ff), 140, 0.35);
coreGroup.add(coreHalo2);
const coreHalo3 = haloSprite(new THREE.Color(0x4080ff), 280, 0.18);
coreGroup.add(coreHalo3);

// Wireframe geodesic around core
const coreWire = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(14, 1)),
  new THREE.LineBasicMaterial({ color: 0x7aaeff, transparent: true, opacity: 0.55 })
);
coreGroup.add(coreWire);

const coreWire2 = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.OctahedronGeometry(20, 0)),
  new THREE.LineBasicMaterial({ color: 0xaed0ff, transparent: true, opacity: 0.3 })
);
coreGroup.add(coreWire2);

// ─── Provider star systems ────────────────────────────────────────────────
// Arrange 18 providers on an elliptical "galactic disc" with some Y-variation.
const providerGroups = [];
const providerObjects = {}; // id -> { group, sunMesh, modelPoints, ring, data }
const modelMeshes = []; // for hit testing: { mesh, provider, model }

const N = D.providers.length;
const discRadius = 130;

D.providers.forEach((prov, i) => {
  // distribute on a spiral disc
  const angle = (i / N) * Math.PI * 2 + (Math.random()*0.1);
  // two-arm spiral feel: alternate radial offsets
  const radius = discRadius + (i % 3) * 18 - 12;
  const y = (Math.sin(i*2.3) * 14) + (Math.random()-.5)*6;

  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;

  const g = new THREE.Group();
  g.position.set(x, y, z);
  scene.add(g);

  const baseColor = new THREE.Color(prov.color);

  // central sun
  const sunSize = 2.4 + Math.min(D.models[prov.id].length, 15) * 0.15;
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(sunSize, 24, 24),
    new THREE.MeshBasicMaterial({ color: baseColor })
  );
  g.add(sun);

  // sun halo
  const halo = haloSprite(baseColor, sunSize * 10, 0.7);
  g.add(halo);
  const halo2 = haloSprite(baseColor, sunSize * 22, 0.25);
  g.add(halo2);

  // Local provider light
  const pl = new THREE.PointLight(baseColor.getHex(), 1.2, 80, 2);
  g.add(pl);

  // Models as orbiting stars
  const models = D.models[prov.id];
  const mGroup = new THREE.Group();
  g.add(mGroup);

  const orbitTilt = new THREE.Euler((Math.random()-.5)*0.4, Math.random()*Math.PI, (Math.random()-.5)*0.4);
  mGroup.rotation.copy(orbitTilt);

  const modelRec = [];
  models.forEach((m, mi) => {
    // distribute on 2-3 orbital shells
    const shell = mi % 3;
    const orbitR = sunSize + 4 + shell * 3 + Math.random()*1.2;
    const theta = (mi / models.length) * Math.PI * 2 + Math.random()*0.3;
    const yOff = (Math.random() - .5) * 2;

    const kind = m.k;
    const mx = Math.cos(theta) * orbitR;
    const mz = Math.sin(theta) * orbitR;

    // Size by kind
    const sz = (kind === 'reason') ? 0.55
             : (kind === 'chat')   ? 0.5
             : (kind === 'speech') ? 0.5
             : (kind === 'embed')  ? 0.4
             : (kind === 'rerank') ? 0.4
             : (kind === 'image')  ? 0.45
             : (kind === 'video')  ? 0.55 : 0.5;

    // Color: slight variation on provider hue
    const col = baseColor.clone();
    if (kind === 'image' || kind === 'video') col.offsetHSL(0, -0.05, 0.05);
    if (kind === 'embed' || kind === 'rerank') col.offsetHSL(0, -0.1, -0.1);
    if (kind === 'reason') col.offsetHSL(0, 0.05, 0.1);

    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(sz, 12, 12),
      new THREE.MeshBasicMaterial({ color: col })
    );
    mesh.position.set(mx, yOff, mz);
    mGroup.add(mesh);

    // tiny halo sprite
    const sp = haloSprite(col, sz*8, 0.5);
    sp.position.copy(mesh.position);
    mGroup.add(sp);

    modelRec.push({ mesh, halo: sp, orbitR, theta, yOff, speed: 0.04 + Math.random()*0.05, kind, model: m });
    modelMeshes.push({ mesh, provider: prov, model: m });
  });

  // Orbit disc (flat ring)
  const ringGeom = new THREE.RingGeometry(sunSize + 2.5, sunSize + (models.length%3===0?10:13), 64);
  const ringMat = new THREE.MeshBasicMaterial({ color: baseColor, transparent: true, opacity: 0.05, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
  const ring = new THREE.Mesh(ringGeom, ringMat);
  ring.rotation.copy(orbitTilt);
  ring.rotation.x += Math.PI/2;
  g.add(ring);

  providerGroups.push(g);
  providerObjects[prov.id] = { group: g, sun, modelRec, data: prov, systemScale: sunSize };
});

// ─── API capability ring — 8 API surfaces as orbital nodes around core ───
// They sit on a tilted ring at radius ~50
const apiGroup = new THREE.Group();
scene.add(apiGroup);

const apiRingRadius = 55;
const apiObjects = []; // { mesh, group, data, angle, beams:[], textSprite }

D.apis.forEach((api, i) => {
  const angle = (i / D.apis.length) * Math.PI * 2;
  const x = Math.cos(angle) * apiRingRadius;
  const z = Math.sin(angle) * apiRingRadius;
  const y = Math.sin(angle * 2) * 6; // gentle wave

  const g = new THREE.Group();
  g.position.set(x, y, z);
  apiGroup.add(g);

  const col = new THREE.Color(api.color);

  // crystalline octahedron node
  const node = new THREE.Mesh(
    new THREE.OctahedronGeometry(2.2, 0),
    new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.9 })
  );
  g.add(node);
  const nodeWire = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.OctahedronGeometry(2.7, 0)),
    new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.6 })
  );
  g.add(nodeWire);
  const h = haloSprite(col, 28, 0.5);
  g.add(h);

  apiObjects.push({ group: g, node, nodeWire, halo: h, data: api, angle, color: col, baseY: y });
});

// Ring visualization of api ring
const apiRingGeom = new THREE.RingGeometry(apiRingRadius - 0.4, apiRingRadius + 0.4, 128);
const apiRingMat = new THREE.MeshBasicMaterial({ color: 0x7aaeff, transparent: true, opacity: 0.15, side: THREE.DoubleSide, depthWrite: false });
const apiRing = new THREE.Mesh(apiRingGeom, apiRingMat);
apiRing.rotation.x = Math.PI/2;
apiGroup.add(apiRing);

// ─── API beams: from each API node outward to supported providers ────────
// Draw curved beams. We store them grouped per api for hovering.
const beamsByApi = {};
const allBeams = [];

D.apis.forEach((api, i) => {
  const apiObj = apiObjects[i];
  const beams = [];
  const supported = D.apiProviders[api.id] || [];
  supported.forEach(pid => {
    const po = providerObjects[pid];
    if (!po) return;
    const start = apiObj.group.position.clone();
    const end = po.group.position.clone();
    // curved control point (lift upward slightly)
    const mid = start.clone().lerp(end, 0.5);
    mid.y += 18 + Math.random()*10;
    mid.x += (Math.random()-.5)*8;
    mid.z += (Math.random()-.5)*8;
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const pts = curve.getPoints(40);
    const geom = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color: apiObj.color, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false });
    const line = new THREE.Line(geom, mat);
    scene.add(line);
    beams.push({ line, mat, apiId: api.id, providerId: pid, curve });
    allBeams.push({ line, mat, apiId: api.id, providerId: pid, curve });
  });
  beamsByApi[api.id] = beams;
});

// ─── Pulses on beams: moving dots ────────────────────────────────────────
const pulseCount = 120;
const pulsePool = [];
const pulseTex = makeSoftCircleTexture();

for (let i = 0; i < pulseCount; i++) {
  const beam = allBeams[Math.floor(Math.random()*allBeams.length)];
  if (!beam) break;
  const apiObj = apiObjects.find(a => a.data.id === beam.apiId);
  const mat = new THREE.SpriteMaterial({ map: pulseTex, color: apiObj.color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.9 });
  const sp = new THREE.Sprite(mat);
  sp.scale.set(2.2, 2.2, 1);
  scene.add(sp);
  pulsePool.push({ sprite: sp, beam, t: Math.random(), speed: 0.002 + Math.random()*0.004, apiColor: apiObj.color });
}

// ─── Connect core → API ring with subtle tendrils ────────────────────────
apiObjects.forEach(ao => {
  const pts = [new THREE.Vector3(0,0,0), ao.group.position.clone()];
  const geom = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({ color: ao.color, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false });
  scene.add(new THREE.Line(geom, mat));
});

// ─── Controls: orbit by drag, zoom by wheel (custom, no OrbitControls dep) ─
const cam = {
  // spherical around origin
  r: 260,
  theta: 0.0,      // azimuth
  phi: 1.15,       // polar (from +Y)
  targetR: 260,
  targetTheta: 0.0,
  targetPhi: 1.15,
  targetY: 10,     // look-at y offset
  lookY: 10,
};

function applyCam() {
  const x = cam.r * Math.sin(cam.phi) * Math.cos(cam.theta);
  const y = cam.r * Math.cos(cam.phi);
  const z = cam.r * Math.sin(cam.phi) * Math.sin(cam.theta);
  camera.position.set(x, y, z);
  camera.lookAt(0, cam.lookY, 0);
}

let isDragging = false;
let lastX = 0, lastY = 0;
let autoRotate = true;
canvas.addEventListener('pointerdown', e => {
  isDragging = true; lastX = e.clientX; lastY = e.clientY;
  autoRotate = false;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointerup', e => { isDragging = false; });
canvas.addEventListener('pointercancel', e => { isDragging = false; });
canvas.addEventListener('pointermove', e => {
  if (!isDragging) return;
  const dx = e.clientX - lastX;
  const dy = e.clientY - lastY;
  lastX = e.clientX; lastY = e.clientY;
  cam.targetTheta -= dx * 0.005;
  cam.targetPhi -= dy * 0.005;
  cam.targetPhi = Math.max(0.25, Math.min(Math.PI - 0.25, cam.targetPhi));
});
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  cam.targetR *= (1 + e.deltaY * 0.001);
  cam.targetR = Math.max(60, Math.min(700, cam.targetR));
  autoRotate = false;
}, { passive: false });

// ─── Hover / click: raycasting against API nodes + provider suns ─────────
const raycaster = new THREE.Raycaster();
raycaster.params.Points = { threshold: 2 };
const mouse = new THREE.Vector2(0,0);
let hovered = null; // { kind: 'api'|'provider'|'model', obj }

const hoverables = [
  ...apiObjects.map(a => ({ kind:'api', mesh: a.node, data: a.data, ref: a })),
  ...Object.values(providerObjects).map(p => ({ kind:'provider', mesh: p.sun, data: p.data, ref: p })),
];
const hoverMeshes = hoverables.map(h => h.mesh);

canvas.addEventListener('pointermove', e => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

const infoEl = document.getElementById('info');
const infoTitle = document.getElementById('info-title');
const infoSub = document.getElementById('info-sub');
const infoBody = document.getElementById('info-body');

function showInfoForApi(api) {
  infoEl.classList.add('show');
  infoEl.style.borderColor = api.color;
  infoTitle.textContent = api.name;
  infoTitle.style.color = api.color;
  infoSub.textContent = api.sub;
  const provs = (D.apiProviders[api.id] || []).map(pid => D.providers.find(p=>p.id===pid));
  infoBody.innerHTML = `
    <div class="info-label">Supported providers · ${provs.length}</div>
    <div class="info-prov">${provs.map(p => `<span class="ib" style="--c:${p.color}">${p.name}</span>`).join('')}</div>
  `;
}

function showInfoForProvider(prov) {
  infoEl.classList.add('show');
  infoEl.style.borderColor = prov.color;
  infoTitle.textContent = prov.name;
  infoTitle.style.color = prov.color;
  infoSub.textContent = prov.sub;
  const models = D.models[prov.id] || [];
  const apis = D.apis.filter(a => (D.apiProviders[a.id] || []).includes(prov.id));
  infoBody.innerHTML = `
    <div class="info-label">${models.length} models</div>
    <div class="info-models">${models.map(m => {
      const badge = m.flag ? `<span class="flag">${m.flag}</span>` : '';
      const caps = (m.caps||[]).map(c => `<span class="cap cap-${c==='★'?'star':c}">${c}</span>`).join('');
      return `<span class="im"><span class="k k-${m.k}"></span>${m.n}${badge}${caps}</span>`;
    }).join('')}</div>
    <div class="info-label" style="margin-top:10px">Available via ${apis.length} APIs</div>
    <div class="info-apis">${apis.map(a => `<span class="ia" style="--c:${a.color}">${a.name}</span>`).join('')}</div>
  `;
}

function clearInfo() {
  infoEl.classList.remove('show');
}

let focusState = null; // { kind, data, id }

canvas.addEventListener('click', e => {
  if (Math.abs(e.clientX - lastX) > 4 || Math.abs(e.clientY - lastY) > 4) return; // drag, not click
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(hoverMeshes, false);
  if (hits.length) {
    const hit = hoverables.find(h => h.mesh === hits[0].object);
    if (hit) {
      focusState = { kind: hit.kind, data: hit.data };
      if (hit.kind === 'api') showInfoForApi(hit.data);
      else showInfoForProvider(hit.data);
      return;
    }
  }
  focusState = null;
  clearInfo();
});

// ─── Label sprites (2D canvas) for providers + APIs ─────────────────────
function makeLabelSprite(text, color, sub) {
  const pad = 14;
  const fontMain = 'bold 28px -apple-system, "Inter", "Helvetica Neue", sans-serif';
  const fontSub = '18px -apple-system, "Inter", "Helvetica Neue", sans-serif';
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  ctx.font = fontMain;
  const w1 = ctx.measureText(text).width;
  ctx.font = fontSub;
  const w2 = sub ? ctx.measureText(sub).width : 0;
  const w = Math.max(w1, w2) + pad*2;
  const h = sub ? 70 : 48;
  c.width = w * 2; c.height = h * 2;
  ctx.scale(2,2);
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0,0,w,h);
  ctx.font = fontMain;
  ctx.fillStyle = color;
  ctx.textBaseline = 'top';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 8;
  ctx.fillText(text, pad, 4);
  if (sub) {
    ctx.font = fontSub;
    ctx.fillStyle = 'rgba(220,230,250,0.75)';
    ctx.fillText(sub, pad, 36);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false });
  const sp = new THREE.Sprite(mat);
  sp.scale.set(w * 0.18, h * 0.18, 1);
  return sp;
}

// Provider labels
Object.values(providerObjects).forEach(po => {
  const lbl = makeLabelSprite(po.data.name, po.data.color, po.data.sub);
  lbl.position.set(0, po.systemScale + 6, 0);
  po.group.add(lbl);
  po.label = lbl;
});
// API labels
apiObjects.forEach(ao => {
  const lbl = makeLabelSprite(ao.data.name, ao.data.color, ao.data.sub);
  lbl.position.set(0, 5.5, 0);
  ao.group.add(lbl);
  ao.label = lbl;
});

// Bedrock core label
{
  const c = document.createElement('canvas');
  c.width = 900; c.height = 240;
  const g = c.getContext('2d');
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.shadowColor = 'rgba(0,0,0,0.7)'; g.shadowBlur = 16;
  g.font = 'bold 78px -apple-system, "Inter", "Helvetica Neue", sans-serif';
  g.fillStyle = '#ffffff';
  g.fillText('AMAZON BEDROCK', 450, 100);
  g.font = '30px -apple-system, "Inter", "Helvetica Neue", sans-serif';
  g.fillStyle = 'rgba(160,200,255,0.85)';
  g.fillText('19 providers · 100+ models · 8 inference APIs', 450, 170);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const sp = new THREE.Sprite(mat);
  sp.scale.set(80, 22, 1);
  sp.position.set(0, 32, 0);
  coreGroup.add(sp);
  coreGroup.userData.label = sp;
}

// ─── Cinematic intro ─────────────────────────────────────────────────────
let introT = 0;
const introDuration = 6.0; // seconds
let introDone = false;

// ─── Animation loop ──────────────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
  const dt = clock.getDelta();
  const t = clock.getElapsedTime();

  // Intro animation
  if (!introDone) {
    introT += dt;
    const p = Math.min(1, introT / introDuration);
    const ease = 1 - Math.pow(1 - p, 3);
    cam.targetR = 520 + (220 - 520) * ease;
    cam.targetTheta = -0.6 + (0.35) * ease;
    cam.targetPhi = 0.45 + (1.1 - 0.45) * ease;
    if (p >= 1) {
      introDone = true;
      autoRotate = true;
    }
  } else if (autoRotate) {
    cam.targetTheta += 0.0008;
  }

  // Smooth lerp
  cam.r += (cam.targetR - cam.r) * 0.05;
  cam.theta += (cam.targetTheta - cam.theta) * 0.05;
  cam.phi += (cam.targetPhi - cam.phi) * 0.05;
  applyCam();

  // Core pulse
  const pulse = 1 + Math.sin(t * 1.3) * 0.05;
  coreSphere.scale.setScalar(pulse);
  coreHalo1.scale.setScalar(60 * (1 + Math.sin(t*1.2)*0.08));
  coreHalo2.scale.setScalar(140 * (1 + Math.sin(t*0.8 + 1)*0.05));
  coreWire.rotation.y += 0.002;
  coreWire.rotation.x += 0.0008;
  coreWire2.rotation.y -= 0.0015;
  coreWire2.rotation.z += 0.0006;

  // Provider systems: orbit slowly around core
  D.providers.forEach((prov, i) => {
    const po = providerObjects[prov.id];
    const ang = (i / N) * Math.PI * 2 + t * 0.015;
    const radius = discRadius + (i % 3) * 18 - 12;
    const y = Math.sin(i*2.3) * 14 + Math.sin(t*0.3 + i) * 1.2;
    po.group.position.x = Math.cos(ang) * radius;
    po.group.position.z = Math.sin(ang) * radius;
    po.group.position.y = y;
    // model orbits
    po.modelRec.forEach((m) => {
      m.theta += m.speed * dt;
      m.mesh.position.x = Math.cos(m.theta) * m.orbitR;
      m.mesh.position.z = Math.sin(m.theta) * m.orbitR;
      m.halo.position.copy(m.mesh.position);
    });
    po.sun.rotation.y += 0.003;
  });

  // API ring: slow rotation
  apiGroup.rotation.y += 0.0015;
  apiObjects.forEach((ao, i) => {
    ao.node.rotation.y += 0.01;
    ao.node.rotation.x += 0.006;
    ao.nodeWire.rotation.copy(ao.node.rotation);
    ao.group.position.y = ao.baseY + Math.sin(t*0.7 + i) * 0.8;
  });

  // Update beams to follow moving provider positions (cheap — rebuild point 2)
  allBeams.forEach(b => {
    const apiObj = apiObjects.find(a => a.data.id === b.apiId);
    const provObj = providerObjects[b.providerId];
    if (!apiObj || !provObj) return;
    // Get world position of api node (since apiGroup rotates)
    const apiPos = new THREE.Vector3();
    apiObj.group.getWorldPosition(apiPos);
    const provPos = provObj.group.position;
    const start = apiPos;
    const end = provPos.clone();
    const mid = start.clone().lerp(end, 0.5);
    mid.y += 22;
    b.curve.v0.copy(start); b.curve.v1.copy(mid); b.curve.v2.copy(end);
    const pts = b.curve.getPoints(30);
    b.line.geometry.setFromPoints(pts);
  });

  // Pulses along beams
  pulsePool.forEach(p => {
    p.t += p.speed;
    if (p.t > 1) p.t -= 1;
    const pos = p.beam.curve.getPoint(p.t);
    p.sprite.position.copy(pos);
    // pulse opacity
    p.sprite.material.opacity = 0.3 + Math.sin(p.t * Math.PI) * 0.7;
  });

  // Hover raycasting — highlight, change cursor
  if (!isDragging) {
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(hoverMeshes, false);
    if (hits.length) {
      const hit = hoverables.find(h => h.mesh === hits[0].object);
      if (hit !== hovered) {
        // reset previous
        if (hovered) {
          hovered.mesh.scale.setScalar(1);
        }
        hovered = hit;
        if (hovered) hovered.mesh.scale.setScalar(1.3);
      }
      canvas.style.cursor = 'pointer';
    } else {
      if (hovered) hovered.mesh.scale.setScalar(1);
      hovered = null;
      canvas.style.cursor = isDragging ? 'grabbing' : 'grab';
    }
  }

  // Highlight: if focusState is an API, brighten its beams; dim others.
  allBeams.forEach(b => {
    const apiObj = apiObjects.find(a => a.data.id === b.apiId);
    const hoveredApi = (hovered && hovered.kind === 'api') ? hovered.data.id : null;
    const focusApi = (focusState && focusState.kind === 'api') ? focusState.data.id : null;
    const focusProv = (focusState && focusState.kind === 'provider') ? focusState.data.id : null;
    const hoveredProv = (hovered && hovered.kind === 'provider') ? hovered.data.id : null;
    let target = 0.09;
    if (focusApi === b.apiId || hoveredApi === b.apiId) target = 0.7;
    else if (focusProv === b.providerId || hoveredProv === b.providerId) target = 0.55;
    else if (focusApi || hoveredApi || focusProv || hoveredProv) target = 0.025;
    b.mat.opacity += (target - b.mat.opacity) * 0.1;
  });

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Hide loading, start
document.getElementById('loader').style.opacity = 0;
setTimeout(() => document.getElementById('loader').style.display = 'none', 800);
animate();

// Expose reset / re-play intro
document.getElementById('replay').addEventListener('click', () => {
  introT = 0;
  introDone = false;
  autoRotate = false;
  focusState = null;
  clearInfo();
});
document.getElementById('close-info').addEventListener('click', () => {
  focusState = null;
  clearInfo();
});
