/* jerica.pro — Blockyard Crypt Run: an original 3D block obby.
   Three.js is self-hosted (/vendor). Runs entirely in the browser. */
import * as THREE from '/vendor/three.module.js';

export function startObby(holder, api){
  const W = () => Math.max(1, holder.clientWidth), H = () => Math.max(1, holder.clientHeight);
  const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setSize(W(), H());
  holder.appendChild(renderer.domElement);
  renderer.domElement.className = 'obby-canvas';

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x05060f, 16, 60);
  const camera = new THREE.PerspectiveCamera(62, W() / H(), 0.1, 200);
  scene.add(new THREE.HemisphereLight(0x8fa6ff, 0x1a0010, 0.85));
  const sun = new THREE.DirectionalLight(0xc0ccff, 0.9); sun.position.set(6, 14, 8); scene.add(sun);
  const glowA = new THREE.PointLight(0x9b5cff, 18, 22, 1.6); scene.add(glowA);
  const glowGoal = new THREE.PointLight(0xff2050, 40, 26, 1.4); scene.add(glowGoal);

  /* ---------- course ---------- */
  const L = [
    [0, 0, 0, 6, 1, 6, 'start'],
    [0, 0, -6, 2.5, 1, 2.5],
    [2.5, 0.6, -10, 2.5, 1, 2.5],
    [0, 1.2, -14, 2.5, 1, 2.5],
    [-2.5, 1.8, -18, 2.5, 1, 2.5],
    [0, 1.8, -23, 4, 1, 4, 'cp'],
    [0, 1.8, -28, 2.2, 1, 2.2, 'mx', 0],
    [0, 1.8, -33, 2.2, 1, 2.2, 'mx', Math.PI],
    [0, 1.8, -38, 4, 1, 4, 'cp'],
    [0, 1.8, -44, 1.1, 1, 7],
    [0, 2.4, -50, 2, 1, 2],
    [0, 3.0, -54, 2, 1, 2],
    [0, 3.0, -58.5, 2.2, 1, 2.2, 'my', 0],
    [0, 3.6, -63.5, 4, 1, 4, 'cp'],
    [-2, 4.2, -67.5, 1.7, 1, 1.7],
    [2, 4.8, -70.5, 1.7, 1, 1.7],
    [-2, 5.4, -73.5, 1.7, 1, 1.7],
    [2, 6.0, -76.5, 1.7, 1, 1.7],
    [0, 6.0, -82, 5, 1, 5, 'goal']
  ];
  const mats = {
    stone: new THREE.MeshStandardMaterial({color: 0x1b2347, roughness: 0.85, metalness: 0.05}),
    cp: new THREE.MeshStandardMaterial({color: 0x3b1a6b, roughness: 0.6, emissive: 0x22054a, emissiveIntensity: 0.9}),
    move: new THREE.MeshStandardMaterial({color: 0x123a5a, roughness: 0.5, emissive: 0x06223a, emissiveIntensity: 0.9}),
    goal: new THREE.MeshStandardMaterial({color: 0x3a0a16, roughness: 0.5, emissive: 0x40061a, emissiveIntensity: 1}),
    start: new THREE.MeshStandardMaterial({color: 0x232a4a, roughness: 0.9})
  };
  const edgeMat = new THREE.LineBasicMaterial({color: 0x8fc6ff, transparent: true, opacity: 0.55});
  const plats = [];
  L.forEach((p, i) => {
    const [x, y, z, w, h, d, type, phase] = p;
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = type === 'cp' ? mats.cp : type === 'goal' ? mats.goal : type === 'start' ? mats.start : (type === 'mx' || type === 'my') ? mats.move : mats.stone;
    const mesh = new THREE.Mesh(geo, mat); mesh.position.set(x, y, z); scene.add(mesh);
    mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat));
    plats.push({mesh, w, h, d, type: type || 'stone', base: new THREE.Vector3(x, y, z), phase: phase || 0, delta: new THREE.Vector3(), idx: i});
  });
  const checkpoints = plats.filter(p => p.type === 'cp');

  /* decorations: torches, floating skull-lanterns */
  const torchMat = new THREE.MeshStandardMaterial({color: 0x111111});
  const flameMat = new THREE.MeshBasicMaterial({color: 0xffa040});
  const flames = [];
  checkpoints.concat(plats.filter(p => p.type === 'start' || p.type === 'goal')).forEach(p => {
    [-1, 1].forEach(s => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.2, 0.18), torchMat);
      post.position.set(p.base.x + s * (p.w / 2 - 0.25), p.base.y + 1.1, p.base.z + p.d / 2 - 0.25); scene.add(post);
      const fl = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.3, 0.22), flameMat);
      fl.position.copy(post.position).y += 0.75; scene.add(fl); flames.push(fl);
    });
  });
  /* the coffin goal */
  const goalP = plats[plats.length - 1];
  const coffin = new THREE.Group();
  const lidMat = new THREE.MeshStandardMaterial({color: 0x2a1408, roughness: 0.7, emissive: 0x220000});
  const cBody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 2.4), lidMat); coffin.add(cBody);
  const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 1.0), new THREE.MeshBasicMaterial({color: 0xff3355}));
  crossV.position.set(0, 0.38, -0.2); coffin.add(crossV);
  const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.16), new THREE.MeshBasicMaterial({color: 0xff3355}));
  crossH.position.set(0, 0.38, -0.4); coffin.add(crossH);
  coffin.position.set(goalP.base.x, goalP.base.y + 0.9, goalP.base.z - 0.5); scene.add(coffin);
  glowGoal.position.set(coffin.position.x, coffin.position.y + 2.5, coffin.position.z);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.9, 14, 16, 1, true),
    new THREE.MeshBasicMaterial({color: 0xff2050, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false}));
  beam.position.set(coffin.position.x, coffin.position.y + 7, coffin.position.z); scene.add(beam);

  /* ---------- the player (original blocky goth kid) ---------- */
  const player = new THREE.Group();
  const bodyM = new THREE.MeshStandardMaterial({color: 0x241238, roughness: 0.7});
  const skinM = new THREE.MeshStandardMaterial({color: 0xe9e2cc, roughness: 0.8});
  const eyeM = new THREE.MeshBasicMaterial({color: 0xff2050});
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.5), bodyM); body.position.y = 0.4; player.add(body);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.62, 0.62), skinM); head.position.y = 1.12; player.add(head);
  const hair = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.22, 0.68), new THREE.MeshStandardMaterial({color: 0x050508})); hair.position.y = 1.47; player.add(hair);
  [-0.14, 0.14].forEach(x => { const e = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.04), eyeM); e.position.set(x, 1.16, -0.32); player.add(e); });
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.45, 0.3), bodyM); legL.position.set(-0.2, -0.2, 0); player.add(legL);
  const legR = legL.clone(); legR.position.x = 0.2; player.add(legR);
  scene.add(player);
  const blob = new THREE.Mesh(new THREE.CircleGeometry(0.5, 20), new THREE.MeshBasicMaterial({color: 0x000000, transparent: true, opacity: 0.45, depthWrite: false}));
  blob.rotation.x = -Math.PI / 2; scene.add(blob);

  const HALF = {x: 0.38, y: 0.85, z: 0.38};
  const pos = new THREE.Vector3(), vel = new THREE.Vector3();
  let spawn = new THREE.Vector3(0, 1.5, 0), grounded = false, standing = null, falls = 0, cpIdx = 0, coyote = 0, jumpBuf = 0;
  const MAXF = 5;
  function respawn(){ pos.copy(spawn); vel.set(0, 0, 0); }
  respawn();

  /* ---------- input ---------- */
  const keys = {};
  const kd = e => { keys[e.code] = true; if(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault(); if(e.code === 'Space') jumpBuf = 0.15; };
  const ku = e => { keys[e.code] = false; };
  window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);

  const ui = document.createElement('div'); ui.className = 'obby-ui';
  ui.innerHTML = '<div class="stick" aria-label="Move" role="application"><div class="knob"></div></div><button class="jump" type="button" data-say="jump">JUMP</button>';
  holder.appendChild(ui);
  const stickEl = ui.querySelector('.stick'), knob = ui.querySelector('.knob'), jumpBtn = ui.querySelector('.jump');
  const stick = {x: 0, y: 0, id: null, cx: 0, cy: 0};
  stickEl.addEventListener('pointerdown', e => { stick.id = e.pointerId; const r = stickEl.getBoundingClientRect(); stick.cx = r.left + r.width / 2; stick.cy = r.top + r.height / 2; stickEl.setPointerCapture(e.pointerId); moveStick(e); });
  stickEl.addEventListener('pointermove', e => { if(e.pointerId === stick.id) moveStick(e); });
  const endStick = e => { if(e.pointerId === stick.id){ stick.id = null; stick.x = stick.y = 0; knob.style.transform = ''; } };
  stickEl.addEventListener('pointerup', endStick); stickEl.addEventListener('pointercancel', endStick);
  function moveStick(e){
    let dx = e.clientX - stick.cx, dy = e.clientY - stick.cy; const m = Math.hypot(dx, dy), R = 46;
    if(m > R){ dx *= R / m; dy *= R / m; }
    stick.x = dx / R; stick.y = dy / R; knob.style.transform = `translate(${dx}px, ${dy}px)`;
  }
  jumpBtn.addEventListener('pointerdown', e => { e.preventDefault(); jumpBuf = 0.15; });

  /* ---------- physics ---------- */
  const G = -30, JUMP = 11.2, SPEED = 6.2;
  function overlaps(p, px, py, pz){
    const m = p.mesh.position;
    return Math.abs(px - m.x) < HALF.x + p.w / 2 && Math.abs(py + HALF.y - m.y) < HALF.y + p.h / 2 && Math.abs(pz - m.z) < HALF.z + p.d / 2;
  }
  function step(dt, t){
    plats.forEach(p => {
      const old = p.mesh.position.clone();
      if(p.type === 'mx') p.mesh.position.x = p.base.x + Math.sin(t * 1.1 + p.phase) * 3;
      if(p.type === 'my') p.mesh.position.y = p.base.y + Math.sin(t * 1.2 + p.phase) * 1.3;
      p.delta.subVectors(p.mesh.position, old);
    });
    if(standing && grounded) pos.add(standing.delta);

    let ix = 0, iz = 0;
    if(keys.ArrowLeft || keys.KeyA) ix -= 1; if(keys.ArrowRight || keys.KeyD) ix += 1;
    if(keys.ArrowUp || keys.KeyW) iz -= 1; if(keys.ArrowDown || keys.KeyS) iz += 1;
    ix += stick.x; iz += stick.y;
    const mag = Math.hypot(ix, iz); if(mag > 1){ ix /= mag; iz /= mag; }
    const accel = grounded ? 14 : 7;
    vel.x += (ix * SPEED - vel.x) * Math.min(1, accel * dt);
    vel.z += (iz * SPEED - vel.z) * Math.min(1, accel * dt);
    if(mag > 0.15) player.rotation.y = Math.atan2(-ix, -iz);

    coyote = grounded ? 0.1 : Math.max(0, coyote - dt);
    jumpBuf = Math.max(0, jumpBuf - dt);
    if(jumpBuf > 0 && (grounded || coyote > 0)){ vel.y = JUMP; grounded = false; coyote = 0; jumpBuf = 0; }
    vel.y += G * dt;

    pos.x += vel.x * dt;
    plats.forEach(p => { if(overlaps(p, pos.x, pos.y, pos.z)){ const m = p.mesh.position; pos.x = pos.x > m.x ? m.x + p.w / 2 + HALF.x + 0.001 : m.x - p.w / 2 - HALF.x - 0.001; vel.x = 0; } });
    pos.z += vel.z * dt;
    plats.forEach(p => { if(overlaps(p, pos.x, pos.y, pos.z)){ const m = p.mesh.position; pos.z = pos.z > m.z ? m.z + p.d / 2 + HALF.z + 0.001 : m.z - p.d / 2 - HALF.z - 0.001; vel.z = 0; } });
    pos.y += vel.y * dt; grounded = false; standing = null;
    plats.forEach(p => {
      if(overlaps(p, pos.x, pos.y, pos.z)){
        const m = p.mesh.position;
        if(vel.y <= 0){ pos.y = m.y + p.h / 2; vel.y = 0; grounded = true; standing = p; }
        else { pos.y = m.y - p.h / 2 - HALF.y * 2 - 0.001; vel.y = 0; }
      }
    });

    if(standing && standing.type === 'cp'){
      const i = checkpoints.indexOf(standing);
      if(i + 1 > cpIdx){ cpIdx = i + 1; spawn.set(standing.mesh.position.x, standing.mesh.position.y + 1, standing.mesh.position.z); if(window.Vamp) window.Vamp.say('checkpoint'); }
    }
    if(pos.y < -14){
      falls++;
      if(window.Vamp) window.Vamp.say(falls >= MAXF ? 'doomed' : 'oops');
      if(falls >= MAXF){ api.end(false, 'You fell into the void ' + MAXF + ' times.'); return; }
      respawn();
    }
    if(pos.distanceTo(coffin.position) < 1.8){ api.end(true, 'You reached the coffin! Falls: ' + falls + '.'); return; }
    api.hud('Checkpoint ' + cpIdx + ' / ' + checkpoints.length + '  ·  Falls ' + falls + ' / ' + MAXF);
  }

  /* ---------- render loop ---------- */
  let raf = 0, last = performance.now(), t = 0, alive = true;
  const camPos = new THREE.Vector3(0, 6, 9), look = new THREE.Vector3();
  function frame(now){
    if(!alive) return;
    const dt = Math.min(0.033, (now - last) / 1000); last = now; t += dt;
    if(!document.hidden && !api.isEnded()) step(dt, t);
    player.position.copy(pos);
    const walk = grounded && Math.hypot(vel.x, vel.z) > 0.5 ? Math.sin(t * 14) * 0.35 : 0;
    legL.rotation.x = walk; legR.rotation.x = -walk;
    let top = -99;
    plats.forEach(p => { const m = p.mesh.position; if(Math.abs(pos.x - m.x) < p.w / 2 && Math.abs(pos.z - m.z) < p.d / 2){ const ty = m.y + p.h / 2; if(ty <= pos.y + 0.05 && ty > top) top = ty; } });
    blob.visible = top > -99; if(blob.visible){ blob.position.set(pos.x, top + 0.02, pos.z); const s = Math.max(0.35, 1 - (pos.y - top) * 0.12); blob.scale.set(s, s, s); }
    flames.forEach((f, i) => { const k = 0.8 + Math.sin(t * 12 + i) * 0.2; f.scale.set(k, 1 + Math.sin(t * 9 + i * 2) * 0.3, k); });
    coffin.rotation.y = Math.sin(t * 0.8) * 0.15; beam.material.opacity = 0.14 + Math.sin(t * 2) * 0.06;
    glowA.position.set(pos.x, pos.y + 3, pos.z + 1);
    camPos.lerp(new THREE.Vector3(pos.x * 0.6, pos.y + 5.2, pos.z + 8.5), Math.min(1, dt * 4));
    camera.position.copy(camPos);
    look.set(pos.x * 0.8, pos.y + 1, pos.z - 3); camera.lookAt(look);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  if(window.Vamp) window.Vamp.say('Reach the coffin', {queue: true});

  return {
    resize(){ renderer.setSize(W(), H()); camera.aspect = W() / H(); camera.updateProjectionMatrix(); },
    stop(){
      alive = false; cancelAnimationFrame(raf);
      window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
      scene.traverse(o => { if(o.geometry) o.geometry.dispose(); if(o.material){ (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose()); } });
      renderer.dispose(); renderer.forceContextLoss && renderer.forceContextLoss();
    }
  };
}
