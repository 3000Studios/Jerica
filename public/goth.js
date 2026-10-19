/* jerica.pro — NIGHT MODE engine
   Spider-web live wallpaper (reacts to touch/mouse), bats, the iron-gate
   intro with an original heavy riff (home only), Dark Facts, and two goth
   mini-games. 100% client-side — nothing is collected or sent anywhere. */
(function(){
  'use strict';
  var RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var isHome = location.pathname === '/' || /\/index\.html$/.test(location.pathname);
  var store = (window.JP && JP.store) || { get:function(k,d){return d;}, set:function(){} };

  /* ---------- floaties become bats, webs and skulls ---------- */
  var fl = document.querySelector('.floaties');
  if(fl){
    var gl = ['🦇','🕸️','💀','🕷️','🌙','🖤','🦇'];
    Array.prototype.forEach.call(fl.children, function(s, i){ s.textContent = gl[i % gl.length]; });
  }

  /* =====================================================================
     SPIDER-WEB LIVE WALLPAPER
     ===================================================================== */
  var cv = document.createElement('canvas');
  cv.id = 'webCanvas'; cv.setAttribute('aria-hidden', 'true');
  var wp = document.querySelector('.wallpaper');
  if(wp && wp.parentNode) wp.parentNode.insertBefore(cv, wp.nextSibling);
  else document.body.insertBefore(cv, document.body.firstChild);
  var ctx = cv.getContext('2d');
  var W = 0, H = 0, DPR = 1, T = 0, webs = [], bats = [], ptr = {x:-9999, y:-9999, on:false};
  var spider = {x:0, len:0};
  var nextBat = 3;

  function makeWeb(cx, cy, R, spokes, rings, a0, a1, closed, alpha){
    var w = {cx:cx, cy:cy, S:spokes, K:rings, closed:closed, alpha:alpha, cols:[]};
    for(var i = 0; i < spokes; i++){
      var a = closed ? a0 + (Math.PI * 2) * (i / spokes) : a0 + (a1 - a0) * (i / (spokes - 1));
      a += (Math.random() - .5) * .06;
      var col = [];
      for(var k = 1; k <= rings; k++){
        var r = R * Math.pow(k / rings, .82) * (1 + (Math.random() - .5) * .05);
        var x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
        col.push({rx:x, ry:y, x:x, y:y, vx:0, vy:0, ph:Math.random() * 6.28});
      }
      w.cols.push(col);
    }
    return w;
  }
  function buildWebs(){
    var M = Math.max(W, H);
    webs = [
      makeWeb(W * 1.01, -H * .02, M * .62, 15, 15, Math.PI * .44, Math.PI * 1.06, false, .30),
      makeWeb(-W * .01, H * 1.02, M * .48, 13, 12, -Math.PI * .56, Math.PI * .06, false, .26),
      makeWeb(W * .5, H * .44, Math.min(W, H) * .44, 18, 13, 0, 0, true, .11)
    ];
    spider.x = W * .72; spider.len = H * .18;
  }
  function resize(){
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    buildWebs();
    if(RM) draw();
  }

  function physics(){
    var R = 140, R2 = R * R;
    for(var w = 0; w < webs.length; w++){
      var cols = webs[w].cols;
      for(var i = 0; i < cols.length; i++){
        for(var k = 0; k < cols[i].length; k++){
          var n = cols[i][k];
          if(ptr.on){
            var dx = n.x - ptr.x, dy = n.y - ptr.y, d2 = dx * dx + dy * dy;
            if(d2 < R2){ var d = Math.sqrt(d2) || 1, f = (1 - d / R) * 2.2; n.vx += dx / d * f; n.vy += dy / d * f; }
          }
          var sway = Math.sin(T * .7 + n.ph) * .9;
          n.vx += (n.rx + sway - n.x) * .045;
          n.vy += (n.ry + sway * .5 - n.y) * .045;
          n.vx *= .87; n.vy *= .87;
          n.x += n.vx; n.y += n.vy;
        }
      }
    }
  }
  function pluck(x, y, power){
    for(var w = 0; w < webs.length; w++){
      webs[w].cols.forEach(function(col){ col.forEach(function(n){
        var dx = n.x - x, dy = n.y - y, d = Math.sqrt(dx * dx + dy * dy);
        if(d < 220){ var f = (1 - d / 220) * power; n.vx += (dx / (d || 1)) * f; n.vy += (dy / (d || 1)) * f; }
      }); });
    }
  }

  function drawWeb(w){
    var cols = w.cols, S = cols.length, K = w.K, i, k;
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(165,190,255,' + w.alpha + ')';
    ctx.beginPath();
    for(i = 0; i < S; i++){
      ctx.moveTo(w.cx, w.cy);
      for(k = 0; k < K; k++) ctx.lineTo(cols[i][k].x, cols[i][k].y);
    }
    var last = w.closed ? S : S - 1;
    for(k = 0; k < K; k++){
      for(i = 0; i < last; i++){
        var a = cols[i][k], b = cols[(i + 1) % S][k];
        var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        var qx = mx + (w.cx - mx) * .07, qy = my + (w.cy - my) * .07;
        ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(qx, qy, b.x, b.y);
      }
    }
    ctx.stroke();
    /* dew drops that shimmer */
    for(i = 0; i < S; i++){
      for(k = 2; k < K; k++){
        if((i * 7 + k * 3) % 9) continue;
        var n = cols[i][k], s = .35 + .35 * Math.sin(T * 2 + n.ph);
        ctx.fillStyle = 'rgba(200,220,255,' + (w.alpha * 1.6 * s).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(n.x, n.y, 1.6, 0, 6.283); ctx.fill();
      }
    }
  }

  function drawSpider(){
    var target = ptr.on ? ptr.x : W * .72 + Math.sin(T * .18) * W * .12;
    spider.x += (target - spider.x) * .012;
    var len = H * .16 + Math.sin(T * .6) * H * .06 + (ptr.on ? Math.max(0, Math.min(H * .25, ptr.y * .3)) : 0);
    spider.len += (len - spider.len) * .03;
    var x = spider.x, y = spider.len;
    ctx.strokeStyle = 'rgba(190,210,255,.45)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, y - 8); ctx.stroke();
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2.2;
    for(var s = -1; s <= 1; s += 2){
      for(var l = 0; l < 4; l++){
        var wig = Math.sin(T * 6 + l) * 1.6;
        var ax = x + s * 4, ay = y + 2 + l * 2.2;
        var kx = x + s * (12 + l * 1.5), ky = y - 6 + l * 5 + wig;
        var fx = x + s * (17 + l * 1.2), fy = y + 4 + l * 6 + wig;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy); ctx.stroke();
      }
    }
    ctx.fillStyle = '#05060c';
    ctx.strokeStyle = 'rgba(143,198,255,.55)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(x, y + 11, 8, 10, 0, 0, 6.283); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, 5.5, 0, 6.283); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c8143c';
    ctx.beginPath(); ctx.moveTo(x, y + 7); ctx.lineTo(x + 3, y + 11); ctx.lineTo(x, y + 15); ctx.lineTo(x - 3, y + 11); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,60,90,.9)';
    ctx.fillRect(x - 2.5, y - 2, 1.6, 1.6); ctx.fillRect(x + 1, y - 2, 1.6, 1.6);
  }

  function spawnBat(x, y, dir, big){
    var d = dir || (Math.random() < .5 ? 1 : -1);
    bats.push({
      x: x != null ? x : (d > 0 ? -40 : W + 40),
      y: y != null ? y : H * (.12 + Math.random() * .5),
      vx: d * (110 + Math.random() * 120), vy: (Math.random() - .5) * 40,
      ph: Math.random() * 6.28, sz: (big ? 16 : 9) + Math.random() * 10, amp: 14 + Math.random() * 26, life: 0
    });
  }
  function batPath(c, x, y, s, flap, face){
    c.save(); c.translate(x, y); c.scale(face, 1);
    c.beginPath();
    for(var side = -1; side <= 1; side += 2){
      c.moveTo(0, 0);
      c.quadraticCurveTo(side * s * .6, -s * .75 * flap, side * s * 1.7, -s * .25 * flap);
      c.quadraticCurveTo(side * s * 1.35, s * .05, side * s * 1.2, s * .3);
      c.quadraticCurveTo(side * s * .95, s * .08, side * s * .78, s * .25);
      c.quadraticCurveTo(side * s * .55, s * .05, side * s * .38, s * .3);
      c.quadraticCurveTo(side * s * .2, s * .1, 0, s * .2);
    }
    c.moveTo(-s * .22, -s * .1); c.lineTo(-s * .16, -s * .42); c.lineTo(-s * .04, -s * .16);
    c.lineTo(s * .04, -s * .16); c.lineTo(s * .16, -s * .42); c.lineTo(s * .22, -s * .1);
    c.ellipse(0, s * .05, s * .22, s * .3, 0, 0, 6.283);
    c.restore();
  }
  function drawBats(dt){
    for(var i = bats.length - 1; i >= 0; i--){
      var b = bats[i];
      b.life += dt; b.ph += dt * 16;
      b.x += b.vx * dt; b.y += b.vy * dt + Math.sin(b.life * 3) * b.amp * dt;
      if(b.x < -80 || b.x > W + 80 || b.y < -80 || b.y > H + 80){ bats.splice(i, 1); continue; }
      var flap = Math.sin(b.ph);
      batPath(ctx, b.x, b.y, b.sz, .25 + .95 * (flap * .5 + .5), b.vx > 0 ? 1 : -1);
      ctx.fillStyle = '#020306'; ctx.fill();
      ctx.strokeStyle = 'rgba(120,160,255,.55)'; ctx.lineWidth = 1; ctx.stroke();
    }
  }

  function draw(dt){
    ctx.clearRect(0, 0, W, H);
    for(var w = 0; w < webs.length; w++) drawWeb(webs[w]);
    drawSpider();
    if(!RM) drawBats(dt || 0);
  }

  var lastT = 0;
  function loop(ts){
    var dt = Math.min(.05, (ts - lastT) / 1000 || .016); lastT = ts;
    if(!document.hidden){
      T += dt;
      nextBat -= dt;
      if(nextBat <= 0){
        var n = 1 + (Math.random() * 3 | 0), dir = Math.random() < .5 ? 1 : -1, y0 = H * (.1 + Math.random() * .45);
        for(var j = 0; j < n; j++) spawnBat(null, y0 + j * 26, dir);
        nextBat = 6 + Math.random() * 7;
      }
      physics(); draw(dt);
    }
    requestAnimationFrame(loop);
  }

  var rz;
  window.addEventListener('resize', function(){ clearTimeout(rz); rz = setTimeout(resize, 150); });
  window.addEventListener('pointermove', function(e){ ptr.x = e.clientX; ptr.y = e.clientY; ptr.on = true; }, {passive:true});
  window.addEventListener('pointerleave', function(){ ptr.on = false; });
  window.addEventListener('blur', function(){ ptr.on = false; });
  document.addEventListener('pointerdown', function(e){
    if(RM) return;
    var t = e.target;
    if(t.closest && t.closest('a,button,input,select,textarea,canvas,.player,.gate,label,video,summary')) return;
    pluck(e.clientX, e.clientY, 9);
    for(var k = 0; k < 3; k++) spawnBat(e.clientX, e.clientY - k * 12, Math.random() < .5 ? 1 : -1, true);
  }, {passive:true});
  resize();
  if(!RM) requestAnimationFrame(loop);

  /* =====================================================================
     THE GATE — home-page intro: black doors, lightning, original riff
     ===================================================================== */
  var riff = null;
  function distCurve(k){
    var n = 2048, c = new Float32Array(n), deg = Math.PI / 180;
    for(var i = 0; i < n; i++){ var x = i * 2 / n - 1; c[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x)); }
    return c;
  }
  /* "Night Gate" — an ORIGINAL 8-bar heavy riff (gallop chugs + power-chord
     stabs + drums), synthesized live with Web Audio. No recordings used. */
  function startRiff(){
    var AC = window.AudioContext || window.webkitAudioContext;
    if(!AC) return 0;
    var ac; try{ ac = new AC(); }catch(e){ return 0; }
    var now = ac.currentTime, t0 = now + .12;
    var master = ac.createGain(); master.gain.setValueAtTime(.0001, now);
    master.gain.exponentialRampToValueAtTime(.6, now + .3); master.connect(ac.destination);
    var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 75;
    var sh = ac.createWaveShaper(); sh.curve = distCurve(380); sh.oversample = '4x';
    var cab = ac.createBiquadFilter(); cab.type = 'lowpass'; cab.frequency.value = 3400; cab.Q.value = .8;
    var mid = ac.createBiquadFilter(); mid.type = 'peaking'; mid.frequency.value = 750; mid.gain.value = -6;
    var gtr = ac.createGain(); gtr.gain.value = .3;
    hp.connect(sh); sh.connect(mid); mid.connect(cab); cab.connect(gtr); gtr.connect(master);
    var dl = ac.createDelay(); dl.delayTime.value = .29; var fb = ac.createGain(); fb.gain.value = .25; var wet = ac.createGain(); wet.gain.value = .16;
    cab.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(master);
    var drums = ac.createGain(); drums.gain.value = .8; drums.connect(master);
    var nb = ac.createBuffer(1, ac.sampleRate, ac.sampleRate), nd = nb.getChannelData(0);
    for(var i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

    function hz(m){ return 440 * Math.pow(2, (m - 69) / 12); }
    function chord(t, root, dur, mute){
      var ivs = mute ? [0, 7] : [0, 7, 12];
      ivs.forEach(function(iv){
        [-7, 7].forEach(function(ct){
          var o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(root + iv); o.detune.value = ct;
          var g = ac.createGain(), pk = mute ? .15 : .19, rel = mute ? dur * .55 : dur;
          g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(pk, t + .006);
          g.gain.exponentialRampToValueAtTime(.0001, t + rel);
          o.connect(g); g.connect(hp); o.start(t); o.stop(t + rel + .05);
        });
      });
    }
    function noise(t, dur, type, f, vol){
      var s = ac.createBufferSource(); s.buffer = nb;
      var fl2 = ac.createBiquadFilter(); fl2.type = type; fl2.frequency.value = f;
      var g = ac.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      s.connect(fl2); fl2.connect(g); g.connect(drums); s.start(t); s.stop(t + dur + .02);
    }
    function kick(t){
      var o = ac.createOscillator(), g = ac.createGain();
      o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + .12);
      g.gain.setValueAtTime(1, t); g.gain.exponentialRampToValueAtTime(.0001, t + .28);
      o.connect(g); g.connect(drums); o.start(t); o.stop(t + .3);
    }
    function snare(t, v){
      noise(t, .2, 'highpass', 1400, .5 * (v || 1));
      var o = ac.createOscillator(), g = ac.createGain(); o.type = 'triangle'; o.frequency.value = 190;
      g.gain.setValueAtTime(.35 * (v || 1), t); g.gain.exponentialRampToValueAtTime(.0001, t + .1);
      o.connect(g); g.connect(drums); o.start(t); o.stop(t + .12);
    }
    function hat(t){ noise(t, .045, 'highpass', 8000, .13); }
    function crash(t){ noise(t, 1.8, 'highpass', 5200, .32); }

    var beat = 60 / 138, bar = beat * 4, s16 = beat / 4, E = 40;
    /* bars 1-2: the doors creak — ringing low chords + snare roll */
    chord(t0, E, bar * .95, false); kick(t0); crash(t0);
    chord(t0 + bar, E + 1, beat * 2, false); kick(t0 + bar);
    chord(t0 + bar + beat * 2, E, beat * 2, false);
    for(var r = 0; r < 8; r++) snare(t0 + bar + beat * 2 + r * s16, .35 + r * .08);
    /* bars 3-6: the gallop */
    var stabs = [E + 3, E + 6, E + 5, E + 8];
    for(var b = 0; b < 4; b++){
      var bt = t0 + bar * (2 + b);
      if(b === 0) crash(bt);
      for(var q = 0; q < 3; q++){
        var qt = bt + q * beat;
        [0, 2, 3].forEach(function(p){ chord(qt + p * s16, E, s16 * 1.4, true); });
        kick(qt); kick(qt + s16 * 2);
        if(q === 1) snare(qt);
        hat(qt); hat(qt + s16 * 2);
      }
      var st = bt + beat * 3;
      chord(st, stabs[b], beat * .9, false); snare(st); kick(st); hat(st + s16 * 2);
    }
    /* bars 7-8: the slam */
    var et = t0 + bar * 6;
    crash(et); chord(et, E, beat * .9, false); kick(et);
    chord(et + beat, E + 3, beat * .45, false); kick(et + beat); snare(et + beat);
    chord(et + beat * 1.5, E + 5, beat * .45, false);
    chord(et + beat * 2, E + 6, beat * .9, false); kick(et + beat * 2); snare(et + beat * 2);
    for(var f = 0; f < 4; f++){ snare(et + beat * 3 + f * s16, .6 + f * .1); kick(et + beat * 3 + f * s16); }
    var endT = t0 + bar * 7;
    crash(endT); kick(endT); chord(endT, E, bar * 1.6, false);
    var total = (endT - now) + bar * 1.4;
    master.gain.setValueAtTime(.6, now + total - 1.2);
    master.gain.exponentialRampToValueAtTime(.0001, now + total);
    riff = {ac:ac, master:master, stopped:false};
    setTimeout(function(){ try{ ac.close(); }catch(e){} }, (total + .4) * 1000);
    return total;
  }
  function stopRiff(){
    if(!riff || riff.stopped) return;
    riff.stopped = true;
    try{
      var t = riff.ac.currentTime;
      riff.master.gain.cancelScheduledValues(t);
      riff.master.gain.setValueAtTime(riff.master.gain.value || .3, t);
      riff.master.gain.exponentialRampToValueAtTime(.0001, t + .3);
      setTimeout(function(){ try{ riff.ac.close(); }catch(e){} }, 450);
    }catch(e){}
  }

  function buildGate(){
    var doorHTML = function(side){
      return '<div class="door ' + side + '" aria-hidden="true"><div class="panel top"></div><div class="panel bot"></div>' +
             '<div class="ring"></div><div class="skull">💀</div></div>';
    };
    var g = document.createElement('div');
    g.className = 'gate'; g.setAttribute('role', 'dialog'); g.setAttribute('aria-modal', 'true'); g.setAttribute('aria-label', 'Entrance to jerica.pro');
    g.innerHTML = '<div class="light" aria-hidden="true"></div>' + doorHTML('l') + doorHTML('r') +
      '<div class="flash" aria-hidden="true"></div>' +
      '<div class="center"><div class="g-title">JER<span>I</span>CA.PRO</div>' +
      '<p class="g-sub">the gate is locked from the inside</p>' +
      '<button class="enter" type="button">☠ ENTER ☠</button>' +
      '<p class="g-hint">turn your sound up · contains brief lightning flashes</p></div>' +
      '<button class="skip" type="button">skip intro</button>';
    document.body.appendChild(g);
    document.documentElement.classList.add('gate-lock');
    var flashEl = g.querySelector('.flash'), enterBtn = g.querySelector('.enter'), opened = false, timers = [];
    try{ enterBtn.focus({preventScroll:true}); }catch(e){}

    /* lightning: max ~2.7 flashes per second (photosensitivity-safe pacing) */
    function flash(n){
      if(RM) return;
      var i = 0;
      (function one(){
        flashEl.classList.add('on');
        timers.push(setTimeout(function(){
          flashEl.classList.remove('on');
          if(++i < n) timers.push(setTimeout(one, 300));
        }, 70));
      })();
    }
    (function storm(){
      if(opened) return;
      flash(Math.random() < .5 ? 1 : 2);
      timers.push(setTimeout(storm, 2600 + Math.random() * 2600));
    })();

    function open(withSound){
      if(opened) return;
      opened = true;
      timers.forEach(clearTimeout);
      try{ sessionStorage.setItem('jp:gate', '1'); }catch(e){}
      var pa = document.getElementById('plAudio');
      if(withSound){
        var len = startRiff();
        if(len && pa){
          pa.pause();
          var plPlay = document.getElementById('plPlay');
          var resume = setTimeout(function(){ if(riff && !riff.stopped) pa.play().catch(function(){}); }, len * 1000);
          if(plPlay) plPlay.addEventListener('click', function(){ clearTimeout(resume); stopRiff(); }, {once:true});
        }
      }
      flash(3);
      setTimeout(function(){ g.classList.add('open'); }, RM ? 0 : 420);
      setTimeout(function(){ g.classList.add('gone'); document.documentElement.classList.remove('gate-lock'); }, RM ? 200 : 2500);
      setTimeout(function(){ g.remove(); var m = document.getElementById('main'); if(m){ m.setAttribute('tabindex', '-1'); try{ m.focus({preventScroll:true}); }catch(e){} } }, RM ? 900 : 3400);
    }
    enterBtn.addEventListener('click', function(){ open(true); });
    g.querySelector('.skip').addEventListener('click', function(){ open(false); });
    g.addEventListener('keydown', function(e){ if(e.key === 'Escape') open(false); });
  }
  if(isHome){
    var seen = false;
    try{ seen = sessionStorage.getItem('jp:gate') === '1'; }catch(e){}
    if(!seen) buildGate();
  }

  /* =====================================================================
     DARK FACTS
     ===================================================================== */
  var FACTS = [
    'Vampire bats are real. They live in Central and South America, mostly drink the blood of cattle and birds — and they share meals with roost-mates who came home hungry.',
    'Bats are the only mammals that can truly fly. Flying squirrels? Just very committed gliders.',
    'Ounce for ounce, spider silk is stronger than steel — and it can stretch way more before it snaps.',
    'A group of crows is called a “murder.” A group of ravens is an “unkindness.”',
    'The Catacombs of Paris hold the remains of more than six million people, moved underground in the late 1700s when the city’s cemeteries overflowed.',
    'Owls can’t move their eyes in their sockets, so they turn their whole head instead — up to about 270 degrees.',
    'The deep-sea anglerfish hunts in total darkness with a glowing lure on its head, lit up by bacteria living inside it.',
    'The vampire squid lives deep in the ocean and, despite the name, eats drifting “marine snow” — not blood.',
    'Halloween traces back to Samhain, an ancient Celtic festival that marked the end of harvest and the start of the dark half of the year.',
    'Mary Shelley started writing Frankenstein at 18, during a ghost-story contest with friends in the summer of 1816.',
    'Edgar Allan Poe’s poem “The Raven” came out in 1845 and made him famous almost overnight.',
    'Gargoyles were originally rain spouts — those carved monsters are there to spit water away from the walls.',
    'More than 100 kinds of mushrooms glow in the dark. The eerie light in rotting forest logs is called “foxfire.”',
    'Some female tarantulas can live for over 20 years.',
    'Día de los Muertos (Day of the Dead) in Mexico is a celebration honoring loved ones who have died, with marigolds, candles and sugar skulls.',
    'The full moon looks huge near the horizon, but it isn’t any bigger — it’s an optical trick called the Moon illusion.',
    'In Scotland and Japan, a black cat crossing your path has long been considered good luck.',
    'Goth music grew out of the UK post-punk scene around 1979–1982, with bands like Siouxsie and the Banshees, The Cure and Bauhaus.',
    'A bat can eat hundreds of insects in a single night — a free, flying bug zapper.',
    'Ravens can solve puzzles, remember faces and even plan ahead. Some scientists rank them with great apes for brainpower.'
  ];
  var factEl = document.getElementById('darkFact');
  if(factEl){
    var order = FACTS.map(function(_, i){ return i; });
    for(var s = order.length - 1; s > 0; s--){ var j = Math.random() * (s + 1) | 0, tmp = order[s]; order[s] = order[j]; order[j] = tmp; }
    var fi = 0, numEl = document.getElementById('factNum'), totEl = document.getElementById('factTotal');
    if(totEl) totEl.textContent = FACTS.length;
    var showFact = function(){
      factEl.classList.add('fade');
      setTimeout(function(){
        factEl.textContent = FACTS[order[fi]];
        if(numEl) numEl.textContent = (fi + 1);
        factEl.classList.remove('fade');
      }, RM ? 0 : 330);
    };
    factEl.textContent = FACTS[order[0]]; if(numEl) numEl.textContent = 1;
    var nf = document.getElementById('nextFact');
    if(nf) nf.addEventListener('click', function(){ fi = (fi + 1) % FACTS.length; showFact(); });
  }

  /* =====================================================================
     GOTH GAME 1 — BAT SWAT
     ===================================================================== */
  var bsCv = document.getElementById('batSwat');
  if(bsCv){
    var bc = bsCv.getContext('2d'), BW = 640, BH = 400;
    var bsScoreEl = document.getElementById('bsScore'), bsTimeEl = document.getElementById('bsTime'),
        bsBestEl = document.getElementById('bsBest'), bsBtn = document.getElementById('bsStart');
    var bsBest = store.get('batSwatBest', 0); bsBestEl.textContent = bsBest;
    var bsBats = [], puffs = [], bsRun = false, bsLeft = 30, bsScore = 0, bsSpawn = 0, bsLast = 0, bsT = 0;
    var fitBS = function(){
      var r = Math.min(window.devicePixelRatio || 1, 2), w = bsCv.clientWidth || 640;
      BW = w; BH = w * 10 / 16;
      bsCv.width = Math.round(BW * r); bsCv.height = Math.round(BH * r);
      bc.setTransform(r, 0, 0, r, 0, 0);
    };
    var bsBg = function(){
      var gr = bc.createLinearGradient(0, 0, 0, BH);
      gr.addColorStop(0, '#060b1f'); gr.addColorStop(1, '#020309');
      bc.fillStyle = gr; bc.fillRect(0, 0, BW, BH);
      bc.fillStyle = 'rgba(233,226,204,.92)'; bc.beginPath(); bc.arc(BW * .82, BH * .22, BH * .1, 0, 6.283); bc.fill();
      bc.fillStyle = '#060b1f'; bc.beginPath(); bc.arc(BW * .82 + BH * .04, BH * .2, BH * .095, 0, 6.283); bc.fill();
      bc.fillStyle = '#000';
      bc.beginPath(); bc.moveTo(0, BH);
      for(var x = 0; x <= BW; x += BW / 14){ bc.lineTo(x, BH * (.86 - (x / BW * 7 % 1 < .5 ? .04 : 0))); }
      bc.lineTo(BW, BH); bc.closePath(); bc.fill();
      bc.fillRect(BW * .08, BH * .55, BW * .07, BH * .4);
      bc.beginPath(); bc.moveTo(BW * .065, BH * .55); bc.lineTo(BW * .115, BH * .42); bc.lineTo(BW * .165, BH * .55); bc.fill();
    };
    var bsSpawnBat = function(){
      var d = Math.random() < .5 ? 1 : -1, ghost = Math.random() < .14;
      bsBats.push({x: d > 0 ? -30 : BW + 30, y: BH * (.12 + Math.random() * .6), vx: d * BW * (.18 + Math.random() * .22 + (30 - bsLeft) * .006),
        ph: Math.random() * 6.28, sz: BW * (ghost ? .026 : .03), ghost: ghost, amp: 20 + Math.random() * 40, t: 0});
    };
    var bsDraw = function(dt){
      bsBg();
      for(var i = bsBats.length - 1; i >= 0; i--){
        var b = bsBats[i]; b.t += dt; b.ph += dt * 18; b.x += b.vx * dt;
        var y = b.y + Math.sin(b.t * 3) * b.amp;
        b.cy = y;
        if(b.x < -60 || b.x > BW + 60){ bsBats.splice(i, 1); continue; }
        batPath(bc, b.x, y, b.sz, .25 + .95 * (Math.sin(b.ph) * .5 + .5), b.vx > 0 ? 1 : -1);
        bc.fillStyle = b.ghost ? 'rgba(120,180,255,.85)' : '#000'; bc.fill();
        bc.strokeStyle = b.ghost ? 'rgba(220,240,255,.9)' : 'rgba(200,20,60,.7)'; bc.lineWidth = 1.5; bc.stroke();
      }
      for(var p = puffs.length - 1; p >= 0; p--){
        var pf = puffs[p]; pf.t += dt;
        if(pf.t > .6){ puffs.splice(p, 1); continue; }
        bc.globalAlpha = 1 - pf.t / .6;
        bc.fillStyle = pf.c; bc.font = 'bold ' + Math.round(BW * .04) + 'px "Pirata One",serif'; bc.textAlign = 'center';
        bc.fillText(pf.txt, pf.x, pf.y - pf.t * 60);
        bc.globalAlpha = 1;
      }
      if(!bsRun){
        bc.fillStyle = 'rgba(0,0,0,.45)'; bc.fillRect(0, 0, BW, BH);
        bc.fillStyle = '#e9e2cc'; bc.textAlign = 'center';
        bc.font = Math.round(BW * .07) + 'px "Metal Mania","Pirata One",serif';
        bc.fillText(bsT > 0 ? 'TIME!  ' + bsScore + ' BATS' : 'BAT SWAT', BW / 2, BH * .46);
        bc.font = Math.round(BW * .035) + 'px "Pirata One",serif';
        bc.fillText('press START, then tap the bats', BW / 2, BH * .6);
      }
    };
    var bsLoop = function(ts){
      if(!bsRun) return;
      var dt = Math.min(.05, (ts - bsLast) / 1000 || .016); bsLast = ts;
      bsLeft -= dt; bsSpawn -= dt; bsT += dt;
      if(bsSpawn <= 0){ bsSpawnBat(); bsSpawn = Math.max(.28, .75 - (30 - bsLeft) * .015); }
      bsTimeEl.textContent = Math.max(0, Math.ceil(bsLeft));
      if(bsLeft <= 0){
        bsRun = false;
        if(bsScore > bsBest){ bsBest = bsScore; store.set('batSwatBest', bsBest); bsBestEl.textContent = bsBest; }
        bsBtn.textContent = '🦇 AGAIN';
        bsBats = [];
      }
      bsDraw(dt);
      if(bsRun) requestAnimationFrame(bsLoop);
    };
    bsBtn.addEventListener('click', function(){
      bsBats = []; puffs = []; bsScore = 0; bsLeft = 30; bsSpawn = 0; bsT = 0; bsRun = true;
      bsScoreEl.textContent = 0; bsTimeEl.textContent = 30; bsBtn.textContent = '🦇 SWATTING…';
      bsLast = performance.now(); requestAnimationFrame(bsLoop);
    });
    bsCv.addEventListener('pointerdown', function(e){
      if(!bsRun) return;
      var r = bsCv.getBoundingClientRect(), x = (e.clientX - r.left) * BW / r.width, y = (e.clientY - r.top) * BH / r.height;
      for(var i = bsBats.length - 1; i >= 0; i--){
        var b = bsBats[i], dx = b.x - x, dy = (b.cy || b.y) - y, rad = b.sz * 2.1;
        if(dx * dx + dy * dy < rad * rad){
          var pts = b.ghost ? 3 : 1; bsScore += pts; bsScoreEl.textContent = bsScore;
          puffs.push({x: b.x, y: b.cy || b.y, t: 0, txt: '+' + pts, c: b.ghost ? '#8fc6ff' : '#c8143c'});
          bsBats.splice(i, 1); return;
        }
      }
    });
    fitBS(); bsDraw(0);
    window.addEventListener('resize', function(){ fitBS(); if(!bsRun) bsDraw(0); });
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ if(!bsRun) bsDraw(0); });
  }

  /* =====================================================================
     GOTH GAME 2 — CRYPT MEMORY
     ===================================================================== */
  var crypt = document.getElementById('crypt');
  if(crypt){
    var ICONS = ['💀','🦇','🕷️','🕸️','⚰️','🌙','🔮','🖤'];
    var NAMES = {'💀':'skull','🦇':'bat','🕷️':'spider','🕸️':'web','⚰️':'coffin','🌙':'moon','🔮':'crystal ball','🖤':'black heart'};
    var cmMoves = document.getElementById('cmMoves'), cmPairs = document.getElementById('cmPairs'),
        cmBestEl = document.getElementById('cmBest'), cmMsg = document.getElementById('cmMsg');
    var cmBest = store.get('cryptBest', 0);
    cmBestEl.textContent = cmBest || '—';
    var first = null, lock = false, moves = 0, pairs = 0;
    var deal = function(){
      var deck = ICONS.concat(ICONS);
      for(var i = deck.length - 1; i > 0; i--){ var j = Math.random() * (i + 1) | 0, t = deck[i]; deck[i] = deck[j]; deck[j] = t; }
      crypt.innerHTML = '';
      first = null; lock = false; moves = 0; pairs = 0;
      cmMoves.textContent = 0; cmPairs.textContent = 0; cmMsg.textContent = '';
      deck.forEach(function(ic, n){
        var b = document.createElement('button');
        b.type = 'button'; b.setAttribute('data-ic', ic);
        b.setAttribute('aria-label', 'Coffin ' + (n + 1) + ', closed');
        b.innerHTML = '<span aria-hidden="true">' + ic + '</span>';
        b.addEventListener('click', function(){ flip(b, n); });
        crypt.appendChild(b);
      });
    };
    var flip = function(b, n){
      if(lock || b.classList.contains('up') || b.classList.contains('done')) return;
      b.classList.add('up'); b.setAttribute('aria-label', 'Coffin ' + (n + 1) + ': ' + NAMES[b.getAttribute('data-ic')]);
      if(!first){ first = b; return; }
      moves++; cmMoves.textContent = moves;
      if(first.getAttribute('data-ic') === b.getAttribute('data-ic')){
        first.classList.add('done'); b.classList.add('done');
        first.classList.remove('up'); b.classList.remove('up');
        first = null; pairs++; cmPairs.textContent = pairs;
        if(pairs === ICONS.length){
          var rec = !cmBest || moves < cmBest;
          if(rec){ cmBest = moves; store.set('cryptBest', moves); cmBestEl.textContent = moves; }
          cmMsg.textContent = rec ? '⚰️ Crypt cleared in ' + moves + ' moves — new record!' : '⚰️ Crypt cleared in ' + moves + ' moves.';
        }
      } else {
        lock = true;
        var a = first; first = null;
        setTimeout(function(){
          [a, b].forEach(function(x){ x.classList.remove('up'); x.setAttribute('aria-label', 'Coffin ' + (Array.prototype.indexOf.call(crypt.children, x) + 1) + ', closed'); });
          lock = false;
        }, 750);
      }
    };
    document.getElementById('cmReset').addEventListener('click', deal);
    deal();
  }
})();
