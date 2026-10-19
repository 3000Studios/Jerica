/* jerica.pro — "Chunk", the bouncy aquarium buddy (original character).
   Tilt your phone and he slides around the tank. Shake it and he bounces.
   Fling him hard and he SLAMS into the glass: squash, spin, dizzy stars,
   and his hat pops off and floats back. On a computer, grab and fling him.
   His voice is the browser's built-in speech, pitched up. Kid-safe lines. */
import * as THREE from '/vendor/three.module.js';

const canvas = document.getElementById('buddy');
const renderer = new THREE.WebGLRenderer({canvas, antialias: true, alpha: true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
let W = innerWidth, H = innerHeight;
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(0, W, 0, -H, -2000, 2000);
camera.position.z = 1000;
scene.add(new THREE.HemisphereLight(0xcfeeff, 0x1a3a4a, 1.25));
const key = new THREE.DirectionalLight(0xffffff, 2.1); key.position.set(-300, 500, 800); scene.add(key);
const rim = new THREE.DirectionalLight(0x6fe0ff, 1.4); rim.position.set(500, -200, -300); scene.add(rim);

/* ---------- build Chunk ---------- */
const R = () => Math.max(46, Math.min(W, H) * 0.085);
const M = (c, r = .55, m = 0) => new THREE.MeshStandardMaterial({color: c, roughness: r, metalness: m});
const root = new THREE.Group(); scene.add(root);
const squash = new THREE.Group(); root.add(squash);
const spin = new THREE.Group(); squash.add(spin);
const skin = M(0xf3c7a0, .6), suit = M(0x2563c9, .45), suit2 = M(0xffcc1a, .5), black = M(0x111318, .4), white = M(0xffffff, .3);
const body = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 32), suit); body.scale.set(1.12, 1, .95); spin.add(body);
const belt = new THREE.Mesh(new THREE.TorusGeometry(1.03, .09, 12, 48), suit2); belt.rotation.x = Math.PI / 2; belt.position.y = -.15; belt.scale.set(1.1, .95, 1); spin.add(belt);
const head = new THREE.Group(); head.position.y = 1.15; spin.add(head);
const headM = new THREE.Mesh(new THREE.SphereGeometry(.82, 40, 32), skin); headM.scale.set(1.12, .95, 1); head.add(headM);
[-1, 1].forEach(s => {
  const cheek = new THREE.Mesh(new THREE.SphereGeometry(.2, 16, 12), M(0xff8a8a, .7)); cheek.position.set(s * .52, -.2, .62); cheek.scale.set(1, .7, .4); head.add(cheek);
});
const eyes = [];
[-1, 1].forEach(s => {
  const e = new THREE.Group(); e.position.set(s * .3, .1, .7); head.add(e);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(.2, 20, 16), white); ball.scale.set(1, 1.15, .6); e.add(ball);
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(.09, 16, 12), black); pupil.position.z = .1; e.add(pupil);
  const brow = new THREE.Mesh(new THREE.BoxGeometry(.3, .06, .05), M(0x4a2a12, .8)); brow.position.set(0, .28, .05); e.add(brow);
  eyes.push({e, pupil, brow, s});
});
const mouth = new THREE.Mesh(new THREE.TorusGeometry(.2, .045, 10, 24, Math.PI), M(0x7a1020, .6));
mouth.position.set(0, -.3, .76); mouth.rotation.z = Math.PI; head.add(mouth);
const mouthO = new THREE.Mesh(new THREE.SphereGeometry(.13, 16, 12), M(0x5a0a14, .6)); mouthO.position.set(0, -.32, .74); mouthO.scale.set(1, 1.2, .4); mouthO.visible = false; head.add(mouthO);
const nose = new THREE.Mesh(new THREE.SphereGeometry(.09, 12, 10), skin); nose.position.set(0, -.08, .82); head.add(nose);
/* the hat: an original striped beanie with a pom */
const hat = new THREE.Group();
const capGeo = new THREE.SphereGeometry(.88, 36, 20, 0, Math.PI * 2, 0, Math.PI / 2);
const cap = new THREE.Mesh(capGeo, M(0xe8333f, .8)); cap.scale.set(1.08, .82, 1.02); hat.add(cap);
const band = new THREE.Mesh(new THREE.TorusGeometry(.9, .12, 12, 40), M(0xffffff, .85)); band.rotation.x = Math.PI / 2; band.scale.set(1.06, 1, 1); hat.add(band);
const stripe = new THREE.Mesh(new THREE.TorusGeometry(.72, .07, 10, 36), M(0x2a2a8a, .85)); stripe.rotation.x = Math.PI / 2; stripe.position.y = .38; hat.add(stripe);
const pom = new THREE.Mesh(new THREE.SphereGeometry(.24, 16, 12), M(0xffffff, .95)); pom.position.y = .78; hat.add(pom);
hat.position.y = .32; head.add(hat);
const arms = [], legs = [];
[-1, 1].forEach(s => {
  const sh = new THREE.Group(); sh.position.set(s * 1.0, .25, 0); spin.add(sh);
  const arm = new THREE.Mesh(new THREE.CapsuleGeometry(.17, .5, 6, 12), suit); arm.position.y = -.35; sh.add(arm);
  const mitt = new THREE.Mesh(new THREE.SphereGeometry(.22, 16, 12), suit2); mitt.position.y = -.72; sh.add(mitt);
  sh.rotation.z = s * .5; arms.push({sh, s});
  const hip = new THREE.Group(); hip.position.set(s * .45, -.85, 0); spin.add(hip);
  const leg = new THREE.Mesh(new THREE.CapsuleGeometry(.2, .3, 6, 12), suit); leg.position.y = -.25; hip.add(leg);
  const boot = new THREE.Mesh(new THREE.SphereGeometry(.26, 16, 12), black); boot.scale.set(1, .7, 1.3); boot.position.set(0, -.55, .08); hip.add(boot);
  legs.push({hip, s});
});
/* dizzy stars */
const stars = new THREE.Group(); spin.add(stars); stars.position.y = 2.35; stars.visible = false;
for(let i = 0; i < 4; i++){ const st = new THREE.Mesh(new THREE.OctahedronGeometry(.16, 0), new THREE.MeshBasicMaterial({color: 0xffe14a})); st.userData.a = i / 4 * Math.PI * 2; stars.add(st); }
/* bubbles he breathes out */
const bubbleMat = new THREE.MeshPhysicalMaterial({color: 0xdff6ff, roughness: .05, transmission: .6, transparent: true, opacity: .55});
const puffs = [];

/* ---------- state ---------- */
const pos = new THREE.Vector2(W * .5, H * .62), vel = new THREE.Vector2(0, 0);
let grav = new THREE.Vector2(0, 1), sensor = false, grabbing = null, grabOff = new THREE.Vector2(), grabHist = [];
let sq = 0, sqN = new THREE.Vector2(0, 1), spinV = 0, angle = 0, dizzy = 0, hatOff = false, hatT = 0, awake = false, lastLine = 0, lastShake = 0;
const hatPos = new THREE.Vector2(), hatVel = new THREE.Vector2(); let hatRot = 0;

/* ---------- voice (built-in speech, pitched up; kid-safe original lines) ---------- */
const LINES = {
  bump: ['Whoa!', 'Hey!', 'Easy, easy!', 'Wheee!', 'Boing!', 'Watch it!', 'Ooh, bubbles!'],
  shake: ['Stop shaking me!', 'I am gonna barf!', 'Earthquake!', 'Not cool, dude!', 'My brain is jiggling!', 'Aaaah!'],
  slam: ['MY HAT! Not cool!', 'Ow, my butt!', 'That is it, I am telling my mom!', 'Rude!', 'I saw stars! Actual stars!', 'Who put a wall there?!'],
  hatBack: ['Got my hat back.', 'Much better.', 'Hat: secured.'],
  hello: ['Hey! Tilt the phone!', 'I live here now.', 'Touch the water!']
};
let voice = null;
function pickVoice(){ const vs = speechSynthesis.getVoices(); voice = vs.find(v => /en[-_]US/i.test(v.lang) && /male|guy|david|alex|fred|daniel/i.test(v.name)) || vs.find(v => /^en/i.test(v.lang)) || null; }
if('speechSynthesis' in window){ pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
function say(kind, force){
  const now = performance.now();
  if(!awake || (!force && now - lastLine < 1400) || !('speechSynthesis' in window)) return;
  lastLine = now;
  const list = LINES[kind]; const text = list[Math.random() * list.length | 0];
  try{
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if(voice) u.voice = voice;
    u.pitch = 1.85; u.rate = 1.12; u.volume = 1;
    speechSynthesis.speak(u);
  }catch(e){}
}
function thud(power){
  const ac = window.Aqua && Aqua.audio && Aqua.audio(); if(!ac) return;
  const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(160 + power * 40, t); o.frequency.exponentialRampToValueAtTime(45, t + .25);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.35 * Math.min(1, power), t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + .35);
  o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + .4);
  if(power > .2){ const b = ac.createOscillator(), bg = ac.createGain(); b.type = 'triangle';
    b.frequency.setValueAtTime(220, t); b.frequency.exponentialRampToValueAtTime(660, t + .18);
    bg.gain.setValueAtTime(.0001, t); bg.gain.exponentialRampToValueAtTime(.08, t + .02); bg.gain.exponentialRampToValueAtTime(.0001, t + .25);
    b.connect(bg); bg.connect(ac.destination); b.start(t); b.stop(t + .3); }
}

/* ---------- sensors ---------- */
function orient(e){
  if(e.beta == null || e.gamma == null) return;
  sensor = true;
  let gx = Math.sin(e.gamma * Math.PI / 180), gy = Math.sin(e.beta * Math.PI / 180);
  const ang = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
  if(ang === 90){ [gx, gy] = [gy, -gx]; } else if(ang === -90 || ang === 270){ [gx, gy] = [-gy, gx]; } else if(ang === 180){ gx = -gx; gy = -gy; }
  grav.set(gx, gy);
}
function motion(e){
  const a = e.acceleration; if(!a || a.x == null) return;
  const mag = Math.hypot(a.x, a.y, a.z || 0);
  if(mag > 11){
    const ang = (screen.orientation && screen.orientation.angle) || 0;
    let ix = -a.x, iy = a.y;
    if(ang === 90){ [ix, iy] = [iy, -ix]; } else if(ang === 270 || ang === -90){ [ix, iy] = [-iy, ix]; }
    const k = Math.min(3200, mag * 95);
    const n = Math.hypot(ix, iy) || 1;
    vel.x += ix / n * k * (.6 + Math.random() * .4); vel.y += iy / n * k * (.6 + Math.random() * .4);
    spinV += (Math.random() - .5) * 18;
    const now = performance.now(); if(now - lastShake > 1600){ lastShake = now; say('shake'); }
  }
}
async function enableSensors(){
  try{
    if(typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') await DeviceOrientationEvent.requestPermission();
    if(typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') await DeviceMotionEvent.requestPermission();
  }catch(e){}
  window.addEventListener('deviceorientation', orient);
  window.addEventListener('devicemotion', motion);
}

/* ---------- grab + fling ---------- */
function hit(x, y){ return Math.hypot(x - pos.x, y - (pos.y - R() * .4)) < R() * 1.45; }
window.Buddy = {
  wake(){ if(awake) return; awake = true; enableSensors(); setTimeout(() => say('hello', true), 900); },
  tryGrab(e){
    if(!hit(e.clientX, e.clientY)) return false;
    if(!awake) this.wake();
    grabbing = e.pointerId; grabOff.set(pos.x - e.clientX, pos.y - e.clientY); grabHist = [{x: e.clientX, y: e.clientY, t: performance.now()}];
    vel.set(0, 0); say('bump'); return true;
  },
  isGrabbing(e){ return grabbing !== null && e.pointerId === grabbing; }
};
window.addEventListener('pointermove', e => {
  if(grabbing === null || e.pointerId !== grabbing) return;
  pos.set(e.clientX + grabOff.x, e.clientY + grabOff.y);
  grabHist.push({x: e.clientX, y: e.clientY, t: performance.now()}); if(grabHist.length > 6) grabHist.shift();
});
function release(e){
  if(grabbing === null || e.pointerId !== grabbing) return;
  grabbing = null;
  const a = grabHist[0], b = grabHist[grabHist.length - 1], dt = Math.max(16, b.t - a.t) / 1000;
  vel.set((b.x - a.x) / dt, (b.y - a.y) / dt); vel.clampLength(0, 5200);
  spinV += vel.x * .004;
}
window.addEventListener('pointerup', release); window.addEventListener('pointercancel', release);

/* ---------- physics ---------- */
function collide(){
  const r = R(), top = r * 2.3, bottom = r * 1.8, side = r * 1.25;
  const walls = [
    {cond: pos.x < side, n: new THREE.Vector2(1, 0), fix: () => { pos.x = side; }},
    {cond: pos.x > W - side, n: new THREE.Vector2(-1, 0), fix: () => { pos.x = W - side; }},
    {cond: pos.y < top, n: new THREE.Vector2(0, 1), fix: () => { pos.y = top; }},
    {cond: pos.y > H - bottom, n: new THREE.Vector2(0, -1), fix: () => { pos.y = H - bottom; }}
  ];
  walls.forEach(w => {
    if(!w.cond) return;
    w.fix();
    const vn = -vel.dot(w.n);
    if(vn <= 0) return;
    vel.addScaledVector(w.n, vn * 1.55);
    spinV += (w.n.x !== 0 ? vel.y : -vel.x) * .0025 * (w.n.x + w.n.y);
    if(vn > 160){
      sq = Math.min(.5, vn / 2600); sqN.copy(w.n);
      const p = Math.min(1.6, vn / 1800);
      if(window.Aqua) Aqua.splash(pos.x - w.n.x * side, pos.y - w.n.y * (w.n.y > 0 ? top : bottom), p * .8);
      thud(p);
      if(vn > 1500) slam(w.n, vn); else if(vn > 520) say('bump');
    }
  });
}
function slam(n, vn){
  dizzy = 2.8; spinV += (Math.random() < .5 ? -1 : 1) * 14;
  if(!hatOff){
    hatOff = true; hatT = 0;
    const wp = new THREE.Vector3(); hat.getWorldPosition(wp);
    hatPos.set(wp.x, -wp.y); hatVel.set(n.x * 400 + (Math.random() - .5) * 500, -Math.min(900, vn * .35)); hatRot = 0;
    head.remove(hat); scene.add(hat); hat.scale.setScalar(R()); hat.rotation.set(0, 0, 0);
  }
  say('slam', true);
}
function step(dt, t){
  if(grabbing === null){
    const g = sensor ? grav : new THREE.Vector2(0, 1);
    const G = 1100 * .55;
    vel.x += g.x * G * dt; vel.y += g.y * G * dt;
    vel.multiplyScalar(Math.pow(.62, dt));
    if(!sensor) vel.y -= Math.sin(t * 1.3) * 18 * dt;
    pos.addScaledVector(vel, dt);
    collide();
  } else {
    const r = R(); pos.x = Math.max(r * 1.25, Math.min(W - r * 1.25, pos.x)); pos.y = Math.max(r * 2.3, Math.min(H - r * 1.8, pos.y));
  }
  spinV *= Math.pow(.25, dt); angle += spinV * dt;
  angle *= Math.pow(.35, dt);
  sq *= Math.pow(.0005, dt);
  dizzy = Math.max(0, dizzy - dt);
  if(hatOff){
    hatT += dt;
    if(hatT < 3.2){
      hatVel.y += 260 * dt; hatVel.multiplyScalar(Math.pow(.5, dt)); hatPos.addScaledVector(hatVel, dt); hatRot += hatVel.x * .004 * dt + dt * 2;
      hatPos.x = Math.max(40, Math.min(W - 40, hatPos.x)); if(hatPos.y > H - 30){ hatPos.y = H - 30; hatVel.y *= -.3; }
    } else {
      const wp = new THREE.Vector3(); head.getWorldPosition(wp);
      const target = new THREE.Vector2(wp.x, -wp.y - R() * .3);
      hatPos.lerp(target, Math.min(1, dt * 4)); hatRot *= Math.pow(.05, dt);
      if(hatPos.distanceTo(target) < 6 || hatT > 6){
        scene.remove(hat); head.add(hat); hat.position.set(0, .32, 0); hat.rotation.set(0, 0, 0); hat.scale.setScalar(1); hatOff = false; say('hatBack', true);
      }
    }
    if(hatOff){ hat.position.set(hatPos.x, -hatPos.y, 50); hat.rotation.set(.3, 0, hatRot); }
  }
}

/* ---------- animate the look ---------- */
function pose(t){
  const r = R();
  root.position.set(pos.x, -pos.y, 0);
  root.scale.setScalar(r);
  const a = Math.atan2(-sqN.y, sqN.x);
  squash.rotation.z = a; spin.rotation.z = -a + angle;
  squash.scale.set(1 - sq, 1 + sq * .7, 1 + sq * .3);
  const sp = vel.length();
  spin.rotation.y = Math.max(-.6, Math.min(.6, vel.x * .0006)) + Math.sin(t * .8) * .12;
  spin.rotation.x = Math.max(-.4, Math.min(.4, -vel.y * .0004));
  const fast = sp > 700 || grabbing !== null || dizzy > 0;
  mouth.visible = !fast; mouthO.visible = fast;
  eyes.forEach(o => {
    const px = dizzy > 0 ? Math.cos(t * 12 + o.s) * .06 : Math.max(-.07, Math.min(.07, vel.x * .00008));
    const py = dizzy > 0 ? Math.sin(t * 12 + o.s) * .06 : Math.max(-.06, Math.min(.06, -vel.y * .00008));
    o.pupil.position.set(px, py, .1);
    o.brow.position.y = fast ? .36 : .28; o.brow.rotation.z = (fast ? .25 : -.05) * o.s;
  });
  arms.forEach(o => { o.sh.rotation.z = o.s * (.5 + (fast ? .9 : .15) + Math.sin(t * (fast ? 22 : 2.2) + o.s) * (fast ? .5 : .12)); });
  legs.forEach(o => { o.hip.rotation.x = Math.sin(t * (fast ? 20 : 2) + o.s * 1.5) * (fast ? .6 : .15); });
  stars.visible = dizzy > 0;
  stars.children.forEach(s => { const aa = s.userData.a + t * 5; s.position.set(Math.cos(aa) * .9, Math.sin(aa * 2) * .1, Math.sin(aa) * .9); s.rotation.y = t * 4; });
  if(Math.random() < .02 + (fast ? .05 : 0)){
    const b = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), bubbleMat);
    const wp = new THREE.Vector3(); mouth.getWorldPosition(wp);
    b.position.set(wp.x, wp.y, 60); b.userData = {v: 40 + Math.random() * 50, s: 3 + Math.random() * 5, life: 3};
    b.scale.setScalar(b.userData.s); scene.add(b); puffs.push(b);
  }
}
function stepPuffs(dt, t){
  for(let i = puffs.length - 1; i >= 0; i--){
    const b = puffs[i]; b.position.y += b.userData.v * dt; b.position.x += Math.sin(t * 3 + i) * .4; b.userData.life -= dt;
    if(b.userData.life <= 0 || b.position.y > 0){ scene.remove(b); b.geometry.dispose(); puffs.splice(i, 1); }
  }
}

/* ---------- loop ---------- */
function resize(){
  W = innerWidth; H = innerHeight; renderer.setSize(W, H, false);
  camera.left = 0; camera.right = W; camera.top = 0; camera.bottom = -H; camera.updateProjectionMatrix();
  pos.x = Math.min(pos.x, W - 60); pos.y = Math.min(pos.y, H - 60);
}
resize(); addEventListener('resize', resize);
let last = performance.now(), T = 0;
function frame(now){
  const dt = Math.min(.033, (now - last) / 1000); last = now;
  if(!document.hidden){ T += dt; step(dt, T); pose(T); stepPuffs(dt, T); renderer.render(scene, camera); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
