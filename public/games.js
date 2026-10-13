/* jerica.pro — The Arcade. All games run 100% in the browser.
   Music is generated live with WebAudio (original tones only — no band audio, ever). */
(function(){
'use strict';
var $ = JP.$, store = JP.store;

/* ============ shared audio ============ */
var AC = null;
function audio(){
  if(!AC){ try{ AC = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ AC = null; } }
  if(AC && AC.state === 'suspended') AC.resume();
  return AC;
}
function tone(freq, t, dur, type, gain, slideTo){
  var ac = audio(); if(!ac) return;
  var o = ac.createOscillator(), g = ac.createGain();
  o.type = type || 'square'; o.frequency.setValueAtTime(freq, t);
  if(slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(gain || .12, t);
  g.gain.exponentialRampToValueAtTime(.001, t + dur);
  o.connect(g); g.connect(ac.destination);
  o.start(t); o.stop(t + dur + .02);
}
function noiseHit(t, dur, freq, gain){
  var ac = audio(); if(!ac) return;
  var len = Math.max(1, (dur * ac.sampleRate)|0);
  var buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
  for(var i=0;i<len;i++) d[i] = (Math.random()*2-1) * (1 - i/len);
  var src = ac.createBufferSource(); src.buffer = buf;
  var f = ac.createBiquadFilter(); f.type='highpass'; f.frequency.value = freq||6000;
  var g = ac.createGain(); g.gain.value = gain||.08;
  src.connect(f); f.connect(g); g.connect(ac.destination); src.start(t);
}
function kick(t){ tone(150, t, .14, 'sine', .30, 45); }
function snare(t){ noiseHit(t, .12, 1600, .16); tone(190, t, .08, 'triangle', .10); }
function hat(t){ noiseHit(t, .05, 7000, .06); }

/* Drum pattern scheduler shared by the two rhythm games.
   pattern(step16) decides kick/snare/hat. Returns a stop function. */
function startBeat(bpm, onStep, durSec){
  var ac = audio(); if(!ac) return function(){};
  var spb = 60/bpm/4; /* seconds per 16th */
  var startAt = ac.currentTime + .12;
  var step = 0, timer = null, stopped = false;
  function tick(){
    if(stopped) return;
    var now = ac.currentTime;
    while(startAt + step*spb < now + .18){
      var t = startAt + step*spb, s = step % 16;
      if(s % 4 === 0) kick(t);
      if(s === 4 || s === 12) snare(t);
      if(s % 2 === 0) hat(t); else if(s === 14) hat(t);
      if(onStep) onStep(step, t, startAt);
      step++;
    }
    if(ac.currentTime - startAt > durSec){ stop(); if(startBeat.onEnd) startBeat.onEnd(); }
  }
  timer = setInterval(tick, 40); tick();
  function stop(){ stopped = true; if(timer) clearInterval(timer); }
  return stop;
}

/* ================================================================
   1) SKATE DASH — endless rink dodger
================================================================ */
(function(){
  var cv = $('#skate-canvas'); if(!cv) return;
  var ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
  var scoreEl = $('#skate-score'), bestEl = $('#skate-best'), msg = $('#skate-msg');
  var best = store.get('skateBest', 0); bestEl.textContent = best;
  var running = false, raf = 0, last = 0;
  var px = 74, py = 0, vy = 0, GROUND = 238, GRAV = 2100, JUMP = -820;
  var dist = 0, speed = 260, obs = [], spawnIn = 0, tGlobal = 0;
  var TYPES = [
    {w:34,h:10,c:'#3a3a44',label:'CRACK'},
    {w:22,h:30,c:'#ff7b2f',label:'CONE'},
    {w:16,h:44,c:'#c9ff2f',label:'RAIL'}
  ];
  function reset(){ py = 0; vy = 0; dist = 0; speed = 260; obs = []; spawnIn = 240; }
  function jump(){ if(running && py >= 0){ vy = JUMP; } }
  function spawn(){
    var t = TYPES[(Math.random()*TYPES.length)|0];
    obs.push({x: W + 40, w: t.w, h: t.h, c: t.c, label: t.label});
    spawnIn = 260 + Math.random()*300 - Math.min(120, speed - 260);
    if(spawnIn < 170) spawnIn = 170;
  }
  function draw(){
    /* rink bg */
    var g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#17171f'); g.addColorStop(.78,'#23232e'); g.addColorStop(.781,'#31313f'); g.addColorStop(1,'#26262f');
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
    /* disco lights */
    for(var i=0;i<5;i++){
      var lx = ((i*140 - (tGlobal*30 % 140)) + W) % W;
      ctx.fillStyle = ['rgba(255,63,164,.20)','rgba(201,255,47,.16)','rgba(77,166,255,.18)','rgba(255,210,63,.16)','rgba(155,107,255,.2)'][i];
      ctx.beginPath(); ctx.moveTo(lx,0); ctx.lineTo(lx+26,0); ctx.lineTo(lx+60,GROUND); ctx.lineTo(lx-8,GROUND); ctx.fill();
    }
    /* floor stripes */
    ctx.fillStyle = 'rgba(201,255,47,.5)';
    for(var s=0;s<8;s++){ var sx = ((s*90 - (dist*1.4 % 90)) + W) % W; ctx.fillRect(sx, GROUND+34, 46, 5); }
    ctx.fillStyle = '#c9ff2f'; ctx.fillRect(0, GROUND+2, W, 3);
    /* obstacles */
    obs.forEach(function(o){
      ctx.fillStyle = o.c; ctx.fillRect(o.x, GROUND - o.h + 2, o.w, o.h);
      ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.font = 'bold 8px Courier New'; ctx.textAlign = 'center';
      if(o.h > 20) ctx.fillText(o.label, o.x + o.w/2, GROUND - o.h - 4);
    });
    /* skater */
    var y = GROUND + py, tilt = vy < 0 ? -.14 : (vy > 300 ? .12 : 0);
    ctx.save(); ctx.translate(px, y); ctx.rotate(tilt);
    ctx.fillStyle = '#141418'; ctx.fillRect(-26, -2, 54, 6);              /* board */
    ctx.fillStyle = '#ff3fa4'; ctx.fillRect(-26, 2, 54, 3);
    ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(-16, 8, 4.4, 0, 7); ctx.arc(18, 8, 4.4, 0, 7); ctx.fill();
    ctx.strokeStyle = '#f5efe2'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-12, -4); ctx.lineTo(-2, -26); ctx.lineTo(12, -4); ctx.stroke(); /* legs */
    ctx.beginPath(); ctx.moveTo(-2, -26); ctx.lineTo(2, -52); ctx.stroke();                     /* torso */
    ctx.beginPath(); ctx.moveTo(2, -48); ctx.lineTo(20, -38); ctx.moveTo(2, -48); ctx.lineTo(-16, -40); ctx.stroke(); /* arms */
    ctx.fillStyle = '#f2c89b'; ctx.beginPath(); ctx.arc(3, -62, 9, 0, 7); ctx.fill();          /* head */
    ctx.fillStyle = '#141418'; ctx.beginPath(); ctx.arc(3, -66, 9.5, Math.PI, 0); ctx.fill();   /* hair */
    ctx.fillStyle = '#c9ff2f'; ctx.fillRect(-7, -70, 20, 5);                                    /* cap brim */
    ctx.restore();
    if(!running){
      ctx.fillStyle = 'rgba(10,10,14,.55)'; ctx.fillRect(0,0,W,H);
      ctx.fillStyle = '#fff'; ctx.font = '900 26px Arial Black, Arial'; ctx.textAlign = 'center';
      ctx.fillText(dist > 0 ? 'WIPEOUT!' : 'SKATE DASH', W/2, H/2 - 8);
      ctx.font = '700 14px Trebuchet MS'; ctx.fillStyle = '#c9ff2f';
      ctx.fillText(dist > 0 ? 'You rolled ' + Math.floor(dist) + 'm — hit START to roll again' : 'Tap, click or SPACE to ollie the obstacles', W/2, H/2 + 22);
    }
  }
  function loop(ts){
    if(!running) return;
    var dt = Math.min(.033, (ts - last)/1000 || .016); last = ts; tGlobal += dt;
    vy += GRAV * dt; py += vy * dt;
    if(py >= 0){ py = 0; vy = 0; }
    speed += dt * 7; dist += speed * dt / 9;
    spawnIn -= speed * dt; if(spawnIn <= 0) spawn();
    for(var i = obs.length-1; i >= 0; i--){
      var o = obs[i]; o.x -= speed * dt;
      if(o.x + o.w < -20){ obs.splice(i,1); continue; }
      if(o.x < px + 18 && o.x + o.w > px - 20 && py > -o.h + 6){ gameOver(); return; }
    }
    scoreEl.textContent = Math.floor(dist);
    draw(); raf = requestAnimationFrame(loop);
  }
  function gameOver(){
    running = false; cancelAnimationFrame(raf);
    if(Math.floor(dist) > best){ best = Math.floor(dist); store.set('skateBest', best); bestEl.textContent = best; msg.textContent = 'NEW BEST! 🏆 ' + best + 'm — the rink is impressed.'; }
    else msg.textContent = 'Wipeout at ' + Math.floor(dist) + 'm. Best is ' + best + 'm. Shake it off, skater.';
    draw();
  }
  $('#skate-start').addEventListener('click', function(){
    audio(); reset(); running = true; last = performance.now();
    msg.textContent = 'Rolling! Tap / click / SPACE to ollie.';
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); draw();
  });
  cv.addEventListener('pointerdown', function(e){ e.preventDefault(); jump(); });
  document.addEventListener('keydown', function(e){
    if(e.code === 'Space' && running){ e.preventDefault(); jump(); }
  });
  draw();
})();

/* ================================================================
   2) BEAT TAP — tap the pads on the beat
================================================================ */
(function(){
  var cv = $('#beat-canvas'); if(!cv) return;
  var ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
  var scoreEl = $('#beat-score'), comboEl = $('#beat-combo'), bestEl = $('#beat-best'), msg = $('#beat-msg');
  var best = store.get('beatBest', 0); bestEl.textContent = best;
  var BPM = 104, DUR = 26; /* seconds */
  var pads = [
    {x:90,  y:110, c:'#c9ff2f', name:'KICK'},
    {x:230, y:230, c:'#ff3fa4', name:'SNARE'},
    {x:330, y:100, c:'#ffd23f', name:'HAT'},
    {x:470, y:225, c:'#4da6ff', name:'BASS'}
  ];
  var events = [], running = false, stopBeat = null, raf = 0, score = 0, combo = 0, startAt = 0, flashes = [];
  function buildChart(){
    events = [];
    var spb = 60/BPM;
    for(var beat = 2; beat < DUR/spb - 1; beat++){
      if(beat % 2 === 1) continue;                    /* hits on odd beats */
      var pad = (beat*7) % 4;
      events.push({t: beat*spb, pad: pad, hit: 0});
      if(beat % 8 === 6) events.push({t: (beat+.5)*spb, pad: (pad+2)%4, hit: 0});
    }
  }
  function draw(){
    ctx.fillStyle = '#0d0d11'; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle = 'rgba(255,255,255,.06)';
    for(var gy=0; gy<H; gy+=28){ ctx.beginPath(); ctx.moveTo(0,gy); ctx.lineTo(W,gy); ctx.stroke(); }
    var now = audio() ? AC.currentTime : 0, rel = now - startAt;
    pads.forEach(function(p, i){
      ctx.beginPath(); ctx.arc(p.x, p.y, 44, 0, 7); ctx.fillStyle = '#1d1d26'; ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = p.c; ctx.stroke();
      ctx.fillStyle = p.c; ctx.font = '900 13px Arial Black, Arial'; ctx.textAlign = 'center';
      ctx.fillText(p.name, p.x, p.y + 5);
      ctx.font = '700 11px Courier New'; ctx.fillStyle = '#8f8a9c';
      ctx.fillText('TAP ' + (i+1), p.x, p.y + 66);
    });
    flashes = flashes.filter(function(f){ return now - f.t < .25; });
    flashes.forEach(function(f){
      var p = pads[f.pad], a = 1 - (now - f.t)/.25;
      ctx.beginPath(); ctx.arc(p.x, p.y, 44 + (1-a)*26, 0, 7);
      ctx.strokeStyle = f.good ? 'rgba(201,255,47,'+a+')' : 'rgba(255,82,82,'+a+')'; ctx.lineWidth = 5; ctx.stroke();
      ctx.fillStyle = f.good ? '#c9ff2f' : '#ff5252'; ctx.font = '900 17px Arial Black, Arial'; ctx.textAlign = 'center';
      ctx.fillText(f.good, p.x, p.y - 58);
    });
    if(running){
      events.forEach(function(ev){
        if(ev.hit) return;
        var dt = ev.t - rel, p = pads[ev.pad];
        if(dt < .9 && dt > -.15){
          var r = 46 + Math.max(0, dt) * 120;
          ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 7);
          ctx.strokeStyle = p.c; ctx.globalAlpha = dt < 0 ? .35 : .9; ctx.lineWidth = 3; ctx.stroke(); ctx.globalAlpha = 1;
        }
        if(dt < -.18 && !ev.hit){ ev.hit = -1; combo = 0; comboEl.textContent = 0; }
      });
    } else {
      ctx.fillStyle = 'rgba(10,10,14,.5)'; ctx.fillRect(0,0,W,H);
      ctx.fillStyle = '#fff'; ctx.font = '900 24px Arial Black, Arial'; ctx.textAlign = 'center';
      ctx.fillText('BEAT TAP', W/2, H/2 - 6);
      ctx.font = '700 14px Trebuchet MS'; ctx.fillStyle = '#ffd23f';
      ctx.fillText('Rings close in on the pads — tap exactly when they land!', W/2, H/2 + 22);
    }
    if(running) raf = requestAnimationFrame(draw);
  }
  function tapPad(i){
    if(!running) return;
    var rel = AC.currentTime - startAt, bestEv = null, bestDt = 9;
    events.forEach(function(ev){
      if(ev.hit) return;
      if(ev.pad === i){ var d = Math.abs(ev.t - rel); if(d < bestDt){ bestDt = d; bestEv = ev; } }
    });
    if(bestEv && bestDt < .20){
      bestEv.hit = 1;
      var pts = bestDt < .07 ? 100 : bestDt < .13 ? 60 : 30;
      var label = bestDt < .07 ? 'PERFECT!' : bestDt < .13 ? 'GREAT' : 'OK';
      score += pts + Math.min(50, combo*2); combo++;
      flashes.push({pad: i, t: AC.currentTime, good: label});
      tone([196, 147, 262, 175][i], AC.currentTime, .18, 'square', .10);
    } else {
      combo = 0; flashes.push({pad: i, t: AC.currentTime, good: 'MISS'});
    }
    scoreEl.textContent = score; comboEl.textContent = combo;
  }
  function pos(e){
    var r = cv.getBoundingClientRect();
    return {x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height)};
  }
  cv.addEventListener('pointerdown', function(e){
    e.preventDefault(); if(!running) return;
    var p = pos(e), hitI = -1;
    pads.forEach(function(pd, i){ var dx = p.x-pd.x, dy = p.y-pd.y; if(dx*dx+dy*dy < 70*70) hitI = i; });
    if(hitI >= 0) tapPad(hitI);
  });
  document.addEventListener('keydown', function(e){
    if(!running) return;
    var map = {'1':0,'2':1,'3':2,'4':3}; if(e.key in map) tapPad(map[e.key]);
  });
  $('#beat-start').addEventListener('click', function(){
    var ac = audio(); if(!ac){ msg.textContent = 'Audio is not available in this browser — the beat cannot play.'; return; }
    if(stopBeat) stopBeat();
    buildChart(); score = 0; combo = 0; scoreEl.textContent = 0; comboEl.textContent = 0;
    running = true; startAt = ac.currentTime + .12;
    startBeat.onEnd = function(){
      running = false;
      if(score > best){ best = score; store.set('beatBest', best); bestEl.textContent = best; msg.textContent = 'FINISHED with ' + score + ' — NEW BEST! 🏆'; }
      else msg.textContent = 'Finished with ' + score + '. Best: ' + best + '. Run it back?';
      draw();
    };
    stopBeat = startBeat(BPM, null, DUR);
    msg.textContent = 'Beat is live! Tap the pads when the ring lands dead-center.';
    cancelAnimationFrame(raf); draw();
  });
  draw();
})();

/* ================================================================
   3) MEMORY MATCH — DOM cards
================================================================ */
(function(){
  var grid = $('#mem-grid'); if(!grid) return;
  var ICONS = ['🛹','🎸','⚡','💀','🎧','🍒','🌟','🖤'];
  var movesEl = $('#mem-moves'), pairsEl = $('#mem-pairs'), bestEl = $('#mem-best'), msg = $('#mem-msg');
  var best = store.get('memBest', null); bestEl.textContent = best === null ? '—' : best + ' moves';
  var first = null, lock = false, moves = 0, pairs = 0;
  function newGame(){
    moves = 0; pairs = 0; first = null; lock = false;
    movesEl.textContent = 0; pairsEl.textContent = 0;
    msg.textContent = 'Flip two cards. Match the icons!';
    var deck = ICONS.concat(ICONS).map(function(ic, i){ return {ic: ic, k: i}; });
    for(var i = deck.length-1; i > 0; i--){ var j = (Math.random()*(i+1))|0, tmp = deck[i]; deck[i] = deck[j]; deck[j] = tmp; }
    grid.innerHTML = '';
    deck.forEach(function(card){
      var b = document.createElement('button');
      b.className = 'mem-card'; b.textContent = card.ic; b.setAttribute('aria-label','Hidden card');
      b.addEventListener('click', function(){
        if(lock || b.classList.contains('flip') || b.classList.contains('done')) return;
        b.classList.add('flip');
        if(!first){ first = b; return; }
        moves++; movesEl.textContent = moves;
        if(first.textContent === b.textContent){
          first.classList.add('done'); b.classList.add('done'); first = null;
          pairs++; pairsEl.textContent = pairs;
          if(pairs === 8){
            msg.textContent = 'ALL 8 PAIRS in ' + moves + ' moves! 🧠⚡';
            if(best === null || moves < best){ best = moves; store.set('memBest', best); bestEl.textContent = best + ' moves'; msg.textContent += ' That is a NEW BEST!'; }
          } else msg.textContent = 'Match! ' + (8 - pairs) + ' to go.';
        } else {
          lock = true; var f = first; first = null;
          setTimeout(function(){ f.classList.remove('flip'); b.classList.remove('flip'); lock = false; }, 650);
        }
      });
      grid.appendChild(b);
    });
  }
  $('#mem-start').addEventListener('click', newGame);
  newGame();
})();

/* ================================================================
   4) NOTE HIGHWAY — falling notes shred game
================================================================ */
(function(){
  var cv = $('#hw-canvas'); if(!cv) return;
  var ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
  var scoreEl = $('#hw-score'), comboEl = $('#hw-combo'), bestEl = $('#hw-best'), msg = $('#hw-msg');
  var best = store.get('hwBest', 0); bestEl.textContent = best;
  var LANES = 4, laneW = W / LANES, HIT_Y = H - 56;
  var COLORS = ['#c9ff2f','#ff3fa4','#ffd23f','#4da6ff'];
  var FREQS = [82.4, 98, 110, 130.8]; /* low power-chord-ish roots */
  var KEYS = ['D','F','J','K'];
  var BPM = 112, DUR = 34;
  var notes = [], running = false, stopBeat = null, raf = 0, score = 0, combo = 0, startAt = 0, judge = '';
  function chart(){
    notes = [];
    var spb = 60/BPM, total = Math.floor(DUR/spb);
    var lane = 0;
    for(var b = 2; b < total - 1; b++){
      lane = (lane + [1,2,-1,3][b % 4] + LANES*2) % LANES;
      notes.push({t: b*spb, lane: lane, hit: 0});
      if(b % 8 === 5) notes.push({t: (b+.5)*spb, lane: (lane+2)%LANES, hit: 0});
    }
  }
  function yFor(t, rel){ var travel = 2.1; return HIT_Y - ((t - rel) / travel) * HIT_Y; }
  function draw(){
    ctx.fillStyle = '#0d0d11'; ctx.fillRect(0,0,W,H);
    for(var l = 0; l < LANES; l++){
      ctx.fillStyle = l % 2 ? '#121219' : '#15151d'; ctx.fillRect(l*laneW, 0, laneW, H);
      ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.strokeRect(l*laneW+.5, -.5, laneW, H);
      /* target */
      ctx.beginPath(); ctx.arc(l*laneW + laneW/2, HIT_Y, 26, 0, 7);
      ctx.strokeStyle = COLORS[l]; ctx.lineWidth = 4; ctx.stroke();
      ctx.fillStyle = COLORS[l]; ctx.font = '900 15px Arial Black, Arial'; ctx.textAlign = 'center';
      ctx.fillText(KEYS[l], l*laneW + laneW/2, HIT_Y + 52);
    }
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.moveTo(0, HIT_Y); ctx.lineTo(W, HIT_Y); ctx.stroke();
    if(running && audio()){
      var rel = AC.currentTime - startAt;
      notes.forEach(function(n){
        if(n.hit) return;
        var y = yFor(n.t, rel);
        if(y < -30 || y > H + 30) return;
        ctx.beginPath(); ctx.arc(n.lane*laneW + laneW/2, y, 21, 0, 7);
        ctx.fillStyle = COLORS[n.lane]; ctx.fill();
        ctx.fillStyle = '#141418'; ctx.font = '900 15px Arial'; ctx.textAlign = 'center';
        ctx.fillText('♪', n.lane*laneW + laneW/2, y + 6);
        if(n.t - rel < -.14){ n.hit = -1; combo = 0; comboEl.textContent = 0; if(!n.judged){ n.judged = 1; judge = 'MISS'; } }
      });
      if(judge){
        ctx.fillStyle = judge === 'MISS' ? '#ff5252' : '#c9ff2f';
        ctx.font = '900 22px Arial Black, Arial'; ctx.textAlign = 'center';
        ctx.fillText(judge, W/2, 44);
      }
    }
    if(!running){
      ctx.fillStyle = 'rgba(10,10,14,.55)'; ctx.fillRect(0,0,W,H);
      ctx.fillStyle = '#fff'; ctx.font = '900 24px Arial Black, Arial'; ctx.textAlign = 'center';
      ctx.fillText('NOTE HIGHWAY', W/2, H/2 - 8);
      ctx.font = '700 14px Trebuchet MS'; ctx.fillStyle = '#c9ff2f';
      ctx.fillText('Hit ' + 'D F J K' + ' (or tap a lane) as each note crosses the line!', W/2, H/2 + 20);
    }
    if(running) raf = requestAnimationFrame(draw);
  }
  function hitLane(l){
    if(!running || !audio()) return;
    var rel = AC.currentTime - startAt, bestN = null, bestDt = 9;
    notes.forEach(function(n){
      if(n.hit || n.lane !== l) return;
      var d = Math.abs(n.t - rel); if(d < bestDt){ bestDt = d; bestN = n; }
    });
    if(bestN && bestDt < .17){
      bestN.hit = 1;
      var pts = bestDt < .06 ? 100 : bestDt < .11 ? 60 : 30;
      judge = bestDt < .06 ? 'PERFECT!' : bestDt < .11 ? 'GREAT' : 'OK';
      score += pts + Math.min(50, combo * 2); combo++;
      tone(FREQS[l]*2, AC.currentTime, .22, 'sawtooth', .07);
      tone(FREQS[l]*3, AC.currentTime, .18, 'square', .04);
    } else { combo = 0; judge = 'MISS'; }
    scoreEl.textContent = score; comboEl.textContent = combo;
  }
  document.addEventListener('keydown', function(e){
    var idx = KEYS.indexOf((e.key || '').toUpperCase());
    if(idx >= 0 && running){ e.preventDefault(); hitLane(idx); }
  });
  cv.addEventListener('pointerdown', function(e){
    e.preventDefault(); if(!running) return;
    var r = cv.getBoundingClientRect();
    var x = (e.clientX - r.left) * (W / r.width);
    hitLane(Math.min(LANES-1, Math.max(0, (x / laneW)|0)));
  });
  $('#hw-start').addEventListener('click', function(){
    var ac = audio(); if(!ac){ msg.textContent = 'Audio is not available in this browser — the riff cannot play.'; return; }
    if(stopBeat) stopBeat();
    chart(); score = 0; combo = 0; judge = ''; scoreEl.textContent = 0; comboEl.textContent = 0;
    running = true; startAt = ac.currentTime + .12;
    startBeat.onEnd = function(){
      running = false;
      if(score > best){ best = score; store.set('hwBest', best); bestEl.textContent = best; msg.textContent = 'SET COMPLETE: ' + score + ' — NEW BEST! 🎸🏆'; }
      else msg.textContent = 'Set complete: ' + score + '. Best: ' + best + '. Encore?';
      draw();
    };
    stopBeat = startBeat(BPM, function(step, t, start){
      /* bass riff synced to the chart: low root on each beat */
      var beat = (step/4)|0;
      if(step % 4 === 0) tone(FREQS[beat % 4], t, .24, 'sawtooth', .06);
    }, DUR);
    msg.textContent = 'You are LIVE. Shred the notes as they cross the line!';
    cancelAnimationFrame(raf); draw();
  });
  draw();
})();
})();
