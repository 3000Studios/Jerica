/* jerica.pro — THE HAUNTED ARCADE (home page)
   Full-page spooky mini-games, a different animated gothic wallpaper behind
   each one, a 3D vortex that follows your mouse or finger, a NEXT button that
   picks a random game, and a yo-mama joke in big 3D letters after every game
   (win or lose), read out by the Vampire Announcer (vamp.js).
   100% in the browser. Best scores stay on this device only. */
(function(){
  'use strict';
  var arcade = document.getElementById('arcade');
  if(!arcade) return;
  var RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var store = (window.JP && JP.store) || { get:function(k,d){return d;}, set:function(){} };
  var say = function(t, o){ if(window.Vamp) Vamp.say(t, o); };
  var $ = function(id){ return document.getElementById(id); };
  var stage = $('stage'), titleEl = $('gTitle'), hudEl = $('gHud'), helpEl = $('gHelp'),
      result = $('result'), rBig = $('rBig'), rJoke = $('rJoke');
  var TAU = Math.PI * 2;
  var rand = function(a, b){ return a + Math.random() * (b - a); };
  var pick = function(a){ return a[Math.random() * a.length | 0]; };

  /* ---------------- sizing ---------------- */
  function fit(){
    var head = document.querySelector('.site-head'), pl = document.getElementById('vbar');
    var h = window.innerHeight - (head ? head.offsetHeight : 64) - (pl ? pl.offsetHeight + 16 : 72);
    arcade.style.setProperty('--ah', Math.max(360, h) + 'px');
    var top = document.querySelector('.a-top');
    arcade.style.setProperty('--top', (top ? top.offsetHeight : 64) + 'px');
    sizeWall();
    if(cur && cur.resize) cur.resize();
  }

  /* =====================================================================
     YO MAMA JOKES — clean, spooky, original
     ===================================================================== */
  var JOKES = [
    "Yo mama's so pale, vampires ask HER for sunscreen tips.",
    "Yo mama's so slow, the zombies lapped her.",
    "Yo mama's so scary, the haunted house asked her to leave.",
    "Yo mama's so old, she knew Dracula when he was just Drac.",
    "Yo mama's so loud, she woke up the whole graveyard and they filed a noise complaint.",
    "Yo mama's so spooky, ghosts check under their beds for HER.",
    "Yo mama's so goth, her rainbow only comes in black.",
    "Yo mama's so forgetful, she left her broom at the drive-thru.",
    "Yo mama's so tall, bats use her as a hangout spot.",
    "Yo mama's so bad at cooking, the witch's cauldron filed a complaint.",
    "Yo mama's so lazy, she hired a ghost to do her haunting.",
    "Yo mama's so sleepy, the mummies told HER to wake up.",
    "Yo mama's so scary, Frankenstein sleeps with a night-light.",
    "Yo mama's so old, her diary is written in hieroglyphics.",
    "Yo mama's so slow at texting, her messages arrive by owl.",
    "Yo mama's so cheap, she trick-or-treats at her own house.",
    "Yo mama's so pale, the full moon is jealous.",
    "Yo mama's so extra, she brought a fog machine to the library.",
    "Yo mama's so scary, spiders run away screaming.",
    "Yo mama's so clumsy, she tripped over a ghost.",
    "Yo mama's so goth, she paints her nails with midnight.",
    "Yo mama's so dramatic, she hisses at the sunrise.",
    "Yo mama's so bad at hide-and-seek, the skeletons found her first.",
    "Yo mama's so cold, snowmen ask her to turn the heat up.",
    "Yo mama's so spooky, the jack-o'-lantern carved itself to look like her.",
    "Yo mama's so loud, the banshee told her to keep it down.",
    "Yo mama's so bad with directions, she got lost in a one-room crypt.",
    "Yo mama's so old, her candles came with a warranty from the Middle Ages.",
    "Yo mama's so creepy, the cobwebs moved out.",
    "Yo mama's so slow, a snail gave her a ride to the haunted hayride."
  ];
  var jokeBag = [];
  function nextJoke(){
    if(!jokeBag.length){ jokeBag = JOKES.slice(); for(var i = jokeBag.length - 1; i > 0; i--){ var j = Math.random() * (i + 1) | 0, t = jokeBag[i]; jokeBag[i] = jokeBag[j]; jokeBag[j] = t; } }
    return jokeBag.pop();
  }
  function letters3d(el, text, delay0){
    el.innerHTML = '';
    var d = delay0 || 0;
    text.split(' ').forEach(function(word){
      var w = document.createElement('span'); w.className = 'w';
      Array.prototype.forEach.call(word, function(ch){
        var s = document.createElement('span'); s.className = 'l'; s.textContent = ch;
        s.style.animationDelay = d.toFixed(2) + 's, ' + (d + .8).toFixed(2) + 's';
        d += .028; w.appendChild(s);
      });
      el.appendChild(w); el.appendChild(document.createTextNode(' '));
    });
  }
  function showResult(won, detail){
    var joke = nextJoke();
    rBig.className = 'r-big ' + (won ? 'win' : 'lose');
    letters3d(rBig, won ? 'YOU WIN!' : 'YOU LOSE!', 0);
    rJoke.className = 'r-joke ' + (won ? 'win' : 'lose');
    letters3d(rJoke, joke, .5);
    $('rDetail').textContent = detail || '';
    result.hidden = false;
    setTimeout(function(){ result.classList.add('in'); }, 10);
    say((won ? 'You win. ' : 'You lose. ') + joke, {rate: .78});
    try{ $('rNext').focus({preventScroll:true}); }catch(e){}
  }
  function hideResult(){ result.classList.remove('in'); result.hidden = true; }

  /* =====================================================================
     GOTHIC LIVE WALLPAPERS (one per game)
     ===================================================================== */
  var wall = $('wall'), wctx = wall.getContext('2d'), WW = 0, WH = 0, wallKind = 'web', wallState = null, wallT = 0;
  function sizeWall(){
    var r = Math.min(window.devicePixelRatio || 1, 1.5);
    WW = wall.clientWidth || arcade.clientWidth; WH = wall.clientHeight || arcade.clientHeight;
    wall.width = Math.round(WW * r); wall.height = Math.round(WH * r);
    wctx.setTransform(r, 0, 0, r, 0, 0);
    wallState = WALLS[wallKind].init(WW, WH);
  }
  function bg(c, a, b){ var g = wctx.createLinearGradient(0, 0, 0, WH); g.addColorStop(0, a); g.addColorStop(1, b); wctx.fillStyle = g; wctx.fillRect(0, 0, WW, WH); }
  function moon(x, y, r, col, glow){
    var g = wctx.createRadialGradient(x, y, r * .2, x, y, r * 3.2);
    g.addColorStop(0, glow); g.addColorStop(1, 'rgba(0,0,0,0)');
    wctx.fillStyle = g; wctx.beginPath(); wctx.arc(x, y, r * 3.2, 0, TAU); wctx.fill();
    wctx.fillStyle = col; wctx.beginPath(); wctx.arc(x, y, r, 0, TAU); wctx.fill();
  }
  function batShape(c, x, y, s, flap, face){
    c.save(); c.translate(x, y); c.scale(face || 1, 1); c.beginPath();
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
    c.ellipse(0, s * .05, s * .22, s * .3, 0, 0, TAU);
    c.restore();
  }
  function tree(c, x, y, len, ang, depth){
    if(depth <= 0) return;
    var x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
    c.lineWidth = depth * 1.6; c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke();
    tree(c, x2, y2, len * .72, ang - rand(.25, .55), depth - 1);
    tree(c, x2, y2, len * .7, ang + rand(.2, .5), depth - 1);
  }
  var WALLS = {
    batcave: {
      init: function(W, H){
        var st = []; for(var x = -20; x < W + 40; x += rand(26, 60)) st.push([x, rand(H * .06, H * .22), rand(14, 30)]);
        var bats = []; for(var i = 0; i < 40; i++) bats.push({x: rand(0, W), y: rand(H * .15, H * .8), s: rand(3, 8), v: rand(10, 40) * (Math.random() < .5 ? -1 : 1), p: rand(0, TAU)});
        var drops = []; for(i = 0; i < 18; i++) drops.push({x: rand(0, W), y: rand(0, H), v: rand(60, 160)});
        return {st: st, bats: bats, drops: drops};
      },
      draw: function(t, dt, s){
        bg(wctx, '#05030c', '#120a24');
        var g = wctx.createRadialGradient(WW * .5, WH * 1.1, 10, WW * .5, WH * 1.1, WH * .9);
        g.addColorStop(0, 'rgba(110,60,200,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)'); wctx.fillStyle = g; wctx.fillRect(0, 0, WW, WH);
        s.bats.forEach(function(b){
          b.x += b.v * dt; b.p += dt * 14; if(b.x < -20) b.x = WW + 20; if(b.x > WW + 20) b.x = -20;
          batShape(wctx, b.x, b.y + Math.sin(t * 2 + b.p) * 6, b.s, .3 + .7 * (Math.sin(b.p) * .5 + .5), b.v > 0 ? 1 : -1);
          wctx.fillStyle = 'rgba(10,6,20,.9)'; wctx.fill();
        });
        wctx.fillStyle = '#020105';
        s.st.forEach(function(p){ wctx.beginPath(); wctx.moveTo(p[0] - p[2], 0); wctx.lineTo(p[0], p[1]); wctx.lineTo(p[0] + p[2], 0); wctx.fill(); });
        wctx.fillStyle = 'rgba(140,170,255,.5)';
        s.drops.forEach(function(d){ d.y += d.v * dt; if(d.y > WH) { d.y = rand(WH * .05, WH * .2); d.x = rand(0, WW); } wctx.fillRect(d.x, d.y, 1.5, 6); });
      }
    },
    crypt: {
      init: function(W, H){
        var off = document.createElement('canvas'); off.width = Math.max(1, W | 0); off.height = Math.max(1, H | 0);
        var c = off.getContext('2d'); c.fillStyle = '#0b0c14'; c.fillRect(0, 0, W, H);
        for(var y = 0, row = 0; y < H; y += 34, row++){
          for(var x = (row % 2) * -40; x < W; x += 80){
            var v = 18 + Math.random() * 14 | 0;
            c.fillStyle = 'rgb(' + v + ',' + (v + 2) + ',' + (v + 12) + ')'; c.fillRect(x + 2, y + 2, 76, 30);
          }
        }
        var candles = []; var n = Math.max(4, W / 160 | 0);
        for(var i = 0; i < n; i++) candles.push({x: (i + .5) * W / n + rand(-20, 20), h: rand(30, 70), p: rand(0, TAU)});
        return {off: off, candles: candles};
      },
      draw: function(t, dt, s){
        wctx.drawImage(s.off, 0, 0, WW, WH);
        wctx.fillStyle = 'rgba(0,0,0,.45)'; wctx.fillRect(0, 0, WW, WH);
        s.candles.forEach(function(c){
          var fl = .75 + .25 * Math.sin(t * 9 + c.p) * Math.sin(t * 13.7 + c.p * 2);
          var by = WH - 8, ty = by - c.h;
          var g = wctx.createRadialGradient(c.x, ty - 10, 2, c.x, ty - 10, 170 * fl);
          g.addColorStop(0, 'rgba(255,170,80,.42)'); g.addColorStop(1, 'rgba(0,0,0,0)');
          wctx.fillStyle = g; wctx.fillRect(c.x - 180, ty - 190, 360, 360);
          wctx.fillStyle = '#e9e2cc'; wctx.fillRect(c.x - 7, ty, 14, c.h);
          wctx.fillStyle = 'rgba(255,200,110,' + (.85 * fl) + ')';
          wctx.beginPath(); wctx.ellipse(c.x, ty - 10, 5 * fl, 12 * fl, 0, 0, TAU); wctx.fill();
        });
      }
    },
    graveyard: {
      init: function(W, H){
        var stones = []; for(var x = 10; x < W; x += rand(50, 110)) stones.push({x: x, w: rand(22, 38), h: rand(30, 60), cross: Math.random() < .3});
        var fog = []; for(var i = 0; i < 9; i++) fog.push({x: rand(0, W), y: rand(H * .6, H), r: rand(120, 260), v: rand(8, 22)});
        return {stones: stones, fog: fog};
      },
      draw: function(t, dt, s){
        bg(wctx, '#050a1c', '#0b1430');
        moon(WW * .8, WH * .22, Math.min(WW, WH) * .08, '#e9e2cc', 'rgba(200,215,255,.35)');
        wctx.fillStyle = '#03050c';
        wctx.beginPath(); wctx.moveTo(0, WH);
        for(var x = 0; x <= WW; x += 20) wctx.lineTo(x, WH * .82 + Math.sin(x * .01) * 14);
        wctx.lineTo(WW, WH); wctx.fill();
        s.stones.forEach(function(st){
          var by = WH * .84 + Math.sin(st.x * .01) * 14;
          if(st.cross){ wctx.fillRect(st.x + st.w * .4, by - st.h, st.w * .2, st.h); wctx.fillRect(st.x + st.w * .15, by - st.h * .75, st.w * .7, st.w * .2); }
          else { wctx.beginPath(); wctx.moveTo(st.x, by); wctx.lineTo(st.x, by - st.h + st.w / 2); wctx.arc(st.x + st.w / 2, by - st.h + st.w / 2, st.w / 2, Math.PI, 0); wctx.lineTo(st.x + st.w, by); wctx.fill(); }
        });
        s.fog.forEach(function(f){
          f.x += f.v * dt; if(f.x - f.r > WW) f.x = -f.r;
          var g = wctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
          g.addColorStop(0, 'rgba(170,190,230,.16)'); g.addColorStop(1, 'rgba(170,190,230,0)');
          wctx.fillStyle = g; wctx.beginPath(); wctx.ellipse(f.x, f.y, f.r, f.r * .4, 0, 0, TAU); wctx.fill();
        });
      }
    },
    bloodmoon: {
      init: function(W, H){
        var off = document.createElement('canvas'); off.width = Math.max(1, W | 0); off.height = Math.max(1, H | 0);
        var c = off.getContext('2d'); c.strokeStyle = '#030104'; c.lineCap = 'round';
        tree(c, W * .12, H, H * .22, -Math.PI / 2 - .1, 8);
        tree(c, W * .9, H, H * .2, -Math.PI / 2 + .12, 8);
        var mist = []; for(var i = 0; i < 60; i++) mist.push({x: rand(0, W), y: rand(0, H), v: rand(4, 16), r: rand(1, 3)});
        return {off: off, mist: mist};
      },
      draw: function(t, dt, s){
        bg(wctx, '#16030a', '#050106');
        moon(WW * .5, WH * .38, Math.min(WW, WH) * .17, '#9e1430', 'rgba(220,30,60,.32)');
        wctx.drawImage(s.off, 0, 0, WW, WH);
        wctx.fillStyle = 'rgba(255,80,110,.35)';
        s.mist.forEach(function(m){ m.y -= m.v * dt; m.x += Math.sin(t + m.y * .02) * .3; if(m.y < 0){ m.y = WH; m.x = rand(0, WW); } wctx.fillRect(m.x, m.y, m.r, m.r); });
      }
    },
    stars: {
      init: function(W, H){
        var st = []; for(var i = 0; i < 160; i++) st.push({x: rand(0, W), y: rand(0, H * .85), p: rand(0, TAU), s: rand(.6, 1.8)});
        return {st: st, shoot: null, next: 2};
      },
      draw: function(t, dt, s){
        bg(wctx, '#07041a', '#1a0d33');
        [[.25, .3, 'rgba(120,60,200,.25)'], [.75, .55, 'rgba(40,80,200,.22)']].forEach(function(n){
          var g = wctx.createRadialGradient(WW * n[0], WH * n[1], 0, WW * n[0], WH * n[1], WW * .5);
          g.addColorStop(0, n[2]); g.addColorStop(1, 'rgba(0,0,0,0)'); wctx.fillStyle = g; wctx.fillRect(0, 0, WW, WH);
        });
        s.st.forEach(function(x){ wctx.globalAlpha = .4 + .6 * (Math.sin(t * 2 + x.p) * .5 + .5); wctx.fillStyle = '#dfe7ff'; wctx.fillRect(x.x, x.y, x.s, x.s); });
        wctx.globalAlpha = 1;
        s.next -= dt;
        if(s.next <= 0 && !s.shoot){ s.shoot = {x: rand(WW * .2, WW), y: rand(0, WH * .3), l: 0}; s.next = rand(2.5, 6); }
        if(s.shoot){
          var sh = s.shoot; sh.l += dt * 2.2; var k = sh.l * 260;
          wctx.strokeStyle = 'rgba(220,230,255,' + Math.max(0, 1 - sh.l) + ')'; wctx.lineWidth = 2;
          wctx.beginPath(); wctx.moveTo(sh.x - k, sh.y + k * .4); wctx.lineTo(sh.x - k + 60, sh.y + k * .4 - 24); wctx.stroke();
          if(sh.l > 1) s.shoot = null;
        }
        wctx.fillStyle = '#030208';
        var bx = WW * .62, by = WH;
        wctx.fillRect(bx, by - WH * .2, WW * .3, WH * .2);
        [[0, .32], [.12, .26], [.24, .38]].forEach(function(tw){
          var x = bx + WW * tw[0], w = WW * .05, h = WH * tw[1];
          wctx.fillRect(x, by - h, w, h);
          wctx.beginPath(); wctx.moveTo(x - 4, by - h); wctx.lineTo(x + w / 2, by - h - w * 1.3); wctx.lineTo(x + w + 4, by - h); wctx.fill();
        });
        wctx.fillStyle = 'rgba(255,200,120,.7)';
        wctx.fillRect(bx + WW * .135, by - WH * .2, 5, 9); wctx.fillRect(bx + WW * .255, by - WH * .3, 5, 9);
      }
    },
    void: {
      init: function(){ return {}; },
      draw: function(t, dt){
        bg(wctx, '#05020c', '#0c0420');
        var cx = WW / 2, cy = WH / 2;
        for(var i = 0; i < 22; i++){
          var z = ((i / 22) + t * .08) % 1, r = Math.pow(z, 2.2) * Math.max(WW, WH) * .9;
          wctx.strokeStyle = 'hsla(' + (270 + Math.sin(t + i) * 40) + ',80%,' + (40 + z * 30) + '%,' + (z * .6) + ')';
          wctx.lineWidth = 1 + z * 4;
          wctx.beginPath(); wctx.ellipse(cx, cy, r, r * .62, t * .3 + i * .2, 0, TAU); wctx.stroke();
        }
      }
    },
    storm: {
      init: function(W, H){
        var rain = []; for(var i = 0; i < 140; i++) rain.push({x: rand(0, W), y: rand(0, H), v: rand(500, 800)});
        var clouds = []; for(i = 0; i < 8; i++) clouds.push({x: rand(0, W), y: rand(0, H * .25), r: rand(90, 190), v: rand(6, 18)});
        return {rain: rain, clouds: clouds, glow: 0, next: 4};
      },
      draw: function(t, dt, s){
        bg(wctx, '#04060d', '#0d1424');
        s.next -= dt;
        if(s.next <= 0){ s.glow = 1; s.next = rand(3.5, 7); }
        s.glow = Math.max(0, s.glow - dt * 1.4);
        if(s.glow > 0 && !RM){
          var g = wctx.createRadialGradient(WW * .3, 0, 0, WW * .3, 0, WH);
          g.addColorStop(0, 'rgba(170,190,255,' + (s.glow * .28) + ')'); g.addColorStop(1, 'rgba(0,0,0,0)');
          wctx.fillStyle = g; wctx.fillRect(0, 0, WW, WH);
        }
        s.clouds.forEach(function(c){
          c.x += c.v * dt; if(c.x - c.r > WW) c.x = -c.r;
          var g = wctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
          g.addColorStop(0, 'rgba(25,30,50,.9)'); g.addColorStop(1, 'rgba(25,30,50,0)');
          wctx.fillStyle = g; wctx.beginPath(); wctx.ellipse(c.x, c.y, c.r * 1.6, c.r * .7, 0, 0, TAU); wctx.fill();
        });
        wctx.strokeStyle = 'rgba(150,175,230,.35)'; wctx.lineWidth = 1; wctx.beginPath();
        s.rain.forEach(function(r){ r.y += r.v * dt; r.x -= r.v * dt * .15; if(r.y > WH){ r.y = -10; r.x = rand(0, WW * 1.2); } wctx.moveTo(r.x, r.y); wctx.lineTo(r.x + 3, r.y - 14); });
        wctx.stroke();
      }
    },
    web: {
      init: function(W, H){
        var cx = W * .5, cy = H * .45, R = Math.max(W, H) * .6, S = 20, K = 16, nodes = [];
        for(var i = 0; i < S; i++){ var a = TAU * i / S + rand(-.04, .04), col = []; for(var k = 1; k <= K; k++){ var r = R * Math.pow(k / K, .85); col.push([a, r]); } nodes.push(col); }
        return {cx: cx, cy: cy, nodes: nodes};
      },
      draw: function(t, dt, s){
        bg(wctx, '#03040a', '#0a1530');
        wctx.strokeStyle = 'rgba(165,190,255,.28)'; wctx.lineWidth = 1; wctx.beginPath();
        var sw = Math.sin(t * .6) * .015, S = s.nodes.length;
        function P(i, k){ var n = s.nodes[i][k]; var a = n[0] + sw * (k / 10); return [s.cx + Math.cos(a) * n[1], s.cy + Math.sin(a) * n[1] * .9]; }
        for(var i = 0; i < S; i++){ wctx.moveTo(s.cx, s.cy); for(var k = 0; k < s.nodes[i].length; k++){ var p = P(i, k); wctx.lineTo(p[0], p[1]); } }
        for(k = 0; k < s.nodes[0].length; k++) for(i = 0; i < S; i++){ var a = P(i, k), b = P((i + 1) % S, k); wctx.moveTo(a[0], a[1]); wctx.quadraticCurveTo((a[0] + b[0]) / 2 * .93 + s.cx * .07, (a[1] + b[1]) / 2 * .93 + s.cy * .07, b[0], b[1]); }
        wctx.stroke();
      }
    }
  };
  var wallLast = 0;
  function wallLoop(ts){
    var dt = Math.min(.05, (ts - wallLast) / 1000 || .016); wallLast = ts;
    if(!document.hidden){ wallT += dt; WALLS[wallKind].draw(wallT, RM ? 0 : dt, wallState); drawVortex(dt); }
    requestAnimationFrame(wallLoop);
  }
  function setWall(kind){ wallKind = WALLS[kind] ? kind : 'web'; wallState = WALLS[wallKind].init(WW, WH); }

  /* =====================================================================
     3D VORTEX that follows the mouse / finger
     ===================================================================== */
  var vx = $('vortex'), vctx = vx.getContext('2d'), VW = 0, VH = 0, parts = [], vp = {x: -999, y: -999, cx: -999, cy: -999, on: false, energy: 0};
  function sizeVortex(){
    var r = Math.min(window.devicePixelRatio || 1, 1.5);
    VW = window.innerWidth; VH = window.innerHeight;
    vx.width = Math.round(VW * r); vx.height = Math.round(VH * r); vctx.setTransform(r, 0, 0, r, 0, 0);
  }
  function feed(x, y, speed){
    vp.x = x; vp.y = y; vp.on = true;
    if(vp.cx < -500){ vp.cx = x; vp.cy = y; }
    vp.energy = Math.min(1, vp.energy + speed * .004);
    if(RM) return;
    var n = Math.min(8, 1 + speed * .05 | 0);
    for(var i = 0; i < n && parts.length < 520; i++){
      parts.push({a: rand(0, TAU), r: rand(40, 110), z: rand(0, .3), va: rand(2.2, 4.2) * (Math.random() < .85 ? 1 : -1), life: 1,
        hue: pick([350, 210, 275, 330])});
    }
  }
  var lastPX = null, lastPY = null;
  window.addEventListener('pointermove', function(e){
    var sp = lastPX == null ? 0 : Math.hypot(e.clientX - lastPX, e.clientY - lastPY);
    lastPX = e.clientX; lastPY = e.clientY;
    feed(e.clientX, e.clientY, sp);
  }, {passive: true});
  window.addEventListener('pointerdown', function(e){ lastPX = e.clientX; lastPY = e.clientY; feed(e.clientX, e.clientY, 140); }, {passive: true});
  function drawVortex(dt){
    vctx.clearRect(0, 0, VW, VH);
    if(!parts.length && vp.energy <= 0) return;
    vp.cx += (vp.x - vp.cx) * Math.min(1, dt * 7); vp.cy += (vp.y - vp.cy) * Math.min(1, dt * 7);
    vp.energy = Math.max(0, vp.energy - dt * .5);
    vctx.globalCompositeOperation = 'lighter';
    var tilt = .42;
    for(var r = 0; r < 4; r++){
      var rr = (30 + r * 26) * (.6 + vp.energy * .6);
      vctx.strokeStyle = 'rgba(160,120,255,' + (.10 * vp.energy) + ')'; vctx.lineWidth = 1.2;
      vctx.beginPath(); vctx.ellipse(vp.cx, vp.cy + r * 6, rr, rr * tilt, 0, 0, TAU); vctx.stroke();
    }
    for(var i = parts.length - 1; i >= 0; i--){
      var p = parts[i];
      p.a += p.va * dt * (1.4 - p.z); p.r *= Math.pow(.32, dt); p.z += dt * .55; p.life -= dt * .75;
      if(p.life <= 0 || p.r < 2){ parts.splice(i, 1); continue; }
      var sc = 1 / (1 + p.z * 1.6);
      var x = vp.cx + Math.cos(p.a) * p.r * sc, y = vp.cy + Math.sin(p.a) * p.r * tilt * sc + p.z * 26;
      var sz = (2.4 + p.r * .03) * sc;
      vctx.fillStyle = 'hsla(' + p.hue + ',90%,62%,' + (p.life * .8) + ')';
      vctx.beginPath(); vctx.arc(x, y, sz, 0, TAU); vctx.fill();
    }
    vctx.globalCompositeOperation = 'source-over';
  }

  /* =====================================================================
     GAME SHELL
     ===================================================================== */
  var cur = null, curKey = null, gCanvas = null, gctx = null, GW = 0, GH = 0, loopOn = false, gLast = 0, ended = false;
  function makeCanvas(){
    gCanvas = document.createElement('canvas'); gCanvas.className = 'g-canvas';
    stage.appendChild(gCanvas); gctx = gCanvas.getContext('2d'); sizeCanvas();
    gCanvas.addEventListener('pointerdown', function(e){ if(cur && cur.down && !ended){ var p = pt(e); cur.down(p.x, p.y); } });
    gCanvas.addEventListener('pointermove', function(e){ if(cur && cur.move && !ended){ var p = pt(e); cur.move(p.x, p.y); } });
    return gctx;
  }
  function sizeCanvas(){
    if(!gCanvas) return;
    var r = Math.min(window.devicePixelRatio || 1, 2);
    GW = stage.clientWidth; GH = stage.clientHeight;
    gCanvas.width = Math.round(GW * r); gCanvas.height = Math.round(GH * r); gctx.setTransform(r, 0, 0, r, 0, 0);
  }
  function pt(e){ var b = gCanvas.getBoundingClientRect(); return {x: e.clientX - b.left, y: e.clientY - b.top}; }
  function hud(t){ hudEl.textContent = t; }
  function end(won, detail){
    if(ended) return; ended = true; loopOn = false;
    if(won){ var k = 'arcadeWins'; store.set(k, store.get(k, 0) + 1); }
    setTimeout(function(){ showResult(won, detail); }, 450);
  }
  function gameLoop(ts){
    if(!loopOn) return;
    var dt = Math.min(.05, (ts - gLast) / 1000 || .016); gLast = ts;
    if(!document.hidden && cur && cur.tick){ cur.tick(dt); if(cur.draw) cur.draw(gctx); }
    requestAnimationFrame(gameLoop);
  }
  function startLoop(){ loopOn = true; gLast = performance.now(); requestAnimationFrame(gameLoop); }
  function clearStage(){
    loopOn = false;
    if(cur && cur.stop) try{ cur.stop(); }catch(e){}
    stage.innerHTML = ''; gCanvas = null; gctx = null; cur = null;
  }
  function txt(c, s, x, y, size, col, font, align){
    c.font = size + 'px ' + (font || '"Pirata One",serif'); c.textAlign = align || 'center'; c.fillStyle = '#000';
    c.fillText(s, x + 2, y + 2); c.fillStyle = col || '#e9e2cc'; c.fillText(s, x, y);
  }

  /* =====================================================================
     THE GAMES
     ===================================================================== */
  var GAMES = {
    /* ---------- 1. BAT SWAT ---------- */
    bats: {name: 'Bat Swat', wall: 'batcave', help: 'Tap the bats! Blue ghost bats are worth 3. Swat 20 in 30 seconds to win.',
      make: function(){
        var bats = [], pops = [], left = 30, score = 0, spawn = 0, goal = 20;
        makeCanvas();
        return {
          tick: function(dt){
            left -= dt; spawn -= dt;
            if(spawn <= 0){ var d = Math.random() < .5 ? 1 : -1, gh = Math.random() < .15;
              bats.push({x: d > 0 ? -40 : GW + 40, y: rand(GH * .12, GH * .78), vx: d * GW * rand(.16, .34) * (1 + (30 - left) * .02), ph: rand(0, TAU), s: Math.max(18, GW * .028), gh: gh, amp: rand(20, 60), t: 0});
              spawn = Math.max(.25, .7 - (30 - left) * .014); }
            bats.forEach(function(b){ b.t += dt; b.ph += dt * 18; b.x += b.vx * dt; b.cy = b.y + Math.sin(b.t * 3) * b.amp; });
            bats = bats.filter(function(b){ return b.x > -80 && b.x < GW + 80; });
            pops.forEach(function(p){ p.t += dt; }); pops = pops.filter(function(p){ return p.t < .7; });
            hud('Swatted ' + score + ' / ' + goal + '  ·  ' + Math.max(0, Math.ceil(left)) + 's');
            if(left <= 0) end(score >= goal, 'You swatted ' + score + ' bats.');
          },
          draw: function(c){
            c.clearRect(0, 0, GW, GH);
            bats.forEach(function(b){
              batShape(c, b.x, b.cy, b.s, .25 + .95 * (Math.sin(b.ph) * .5 + .5), b.vx > 0 ? 1 : -1);
              c.fillStyle = b.gh ? 'rgba(120,180,255,.9)' : '#000'; c.fill();
              c.strokeStyle = b.gh ? '#e6f2ff' : 'rgba(200,20,60,.8)'; c.lineWidth = 2; c.stroke();
            });
            pops.forEach(function(p){ c.globalAlpha = 1 - p.t / .7; txt(c, p.s, p.x, p.y - p.t * 70, 34, p.c); c.globalAlpha = 1; });
          },
          down: function(x, y){
            for(var i = bats.length - 1; i >= 0; i--){ var b = bats[i];
              if(Math.hypot(b.x - x, b.cy - y) < b.s * 2.1){ var v = b.gh ? 3 : 1; score += v; pops.push({x: b.x, y: b.cy, t: 0, s: '+' + v, c: b.gh ? '#8fc6ff' : '#ff5577'}); bats.splice(i, 1); return; } }
          }
        };
      }},

    /* ---------- 2. CRYPT MEMORY ---------- */
    crypt: {name: 'Crypt Memory', wall: 'crypt', help: 'Flip two coffins at a time and match all 8 pairs in 24 moves or less.',
      make: function(){
        var ICONS = [['💀', 'skull'], ['🦇', 'bat'], ['🕷️', 'spider'], ['🕸️', 'web'], ['⚰️', 'coffin'], ['🌙', 'moon'], ['🔮', 'crystal ball'], ['🖤', 'black heart']];
        var deck = ICONS.concat(ICONS); for(var i = deck.length - 1; i > 0; i--){ var j = Math.random() * (i + 1) | 0, t = deck[i]; deck[i] = deck[j]; deck[j] = t; }
        var wrap = document.createElement('div'); wrap.className = 'a-crypt';
        var grid = document.createElement('div'); grid.className = 'crypt'; wrap.appendChild(grid); stage.appendChild(wrap);
        var first = null, lock = false, moves = 0, pairs = 0, limit = 24;
        function upd(){ hud('Moves ' + moves + ' / ' + limit + '  ·  Pairs ' + pairs + ' / 8'); }
        deck.forEach(function(ic, n){
          var b = document.createElement('button'); b.type = 'button'; b.setAttribute('data-say', 'creak');
          b.setAttribute('aria-label', 'Coffin ' + (n + 1));
          b.innerHTML = '<span aria-hidden="true">' + ic[0] + '</span>';
          b.addEventListener('click', function(){
            if(lock || ended || b.classList.contains('up') || b.classList.contains('done')) return;
            b.classList.add('up'); b.setAttribute('data-say', ic[1]);
            if(!first){ first = b; return; }
            moves++;
            if(first.innerHTML === b.innerHTML){
              first.classList.add('done'); b.classList.add('done'); first = null; pairs++; upd();
              if(pairs === 8) end(moves <= limit, 'Crypt cleared in ' + moves + ' moves.');
            } else {
              lock = true; var a = first; first = null; upd();
              setTimeout(function(){ a.classList.remove('up'); b.classList.remove('up'); a.setAttribute('data-say', 'creak'); b.setAttribute('data-say', 'creak'); lock = false;
                if(moves >= limit + 6 && pairs < 8) end(false, 'The crypt stayed locked after ' + moves + ' moves.'); }, 700);
            }
            upd();
          });
          grid.appendChild(b);
        });
        upd();
        return {resize: function(){}, stop: function(){}};
      }},

    /* ---------- 3. GHOST CATCHER ---------- */
    ghosts: {name: 'Ghost Catcher', wall: 'graveyard', help: 'Move to catch ghosts in the cauldron. Dodge the skulls! Catch 15 to win, 3 skulls and you lose.',
      make: function(){
        var px = GW / 2, items = [], spawn = 0, caught = 0, lives = 3, goal = 15, keys = {};
        makeCanvas(); px = GW / 2;
        function kd(e){ keys[e.key] = true; } function ku(e){ keys[e.key] = false; }
        window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
        return {
          stop: function(){ window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); },
          move: function(x){ px = x; }, down: function(x){ px = x; },
          tick: function(dt){
            if(keys.ArrowLeft || keys.a) px -= GW * dt; if(keys.ArrowRight || keys.d) px += GW * dt;
            px = Math.max(40, Math.min(GW - 40, px));
            spawn -= dt;
            if(spawn <= 0){ items.push({x: rand(40, GW - 40), y: -40, v: rand(GH * .22, GH * .36) * (1 + caught * .03), sk: Math.random() < .28, p: rand(0, TAU)}); spawn = rand(.45, .9); }
            var cy = GH - 70;
            for(var i = items.length - 1; i >= 0; i--){ var it = items[i]; it.y += it.v * dt; it.p += dt * 3;
              var ix = it.x + Math.sin(it.p) * 18;
              if(it.y > cy - 26 && it.y < cy + 10 && Math.abs(ix - px) < 58){ if(it.sk){ lives--; } else caught++; items.splice(i, 1); continue; }
              if(it.y > GH + 40) items.splice(i, 1); }
            hud('Ghosts ' + caught + ' / ' + goal + '  ·  Lives ' + '🖤'.repeat(Math.max(0, lives)));
            if(caught >= goal) end(true, 'You bottled ' + caught + ' ghosts.');
            else if(lives <= 0) end(false, 'Too many skulls in the soup.');
          },
          draw: function(c){
            c.clearRect(0, 0, GW, GH);
            items.forEach(function(it){
              var x = it.x + Math.sin(it.p) * 18;
              if(it.sk){ c.font = '40px serif'; c.textAlign = 'center'; c.fillText('💀', x, it.y + 14); return; }
              c.fillStyle = 'rgba(230,240,255,.92)';
              c.beginPath(); c.arc(x, it.y, 20, Math.PI, 0); c.lineTo(x + 20, it.y + 24);
              for(var k = 0; k < 4; k++) c.lineTo(x + 20 - (k + .5) * 10, it.y + (k % 2 ? 24 : 16));
              c.lineTo(x - 20, it.y + 24); c.closePath(); c.fill();
              c.fillStyle = '#000'; c.beginPath(); c.arc(x - 7, it.y - 2, 3.5, 0, TAU); c.arc(x + 7, it.y - 2, 3.5, 0, TAU); c.fill();
              c.beginPath(); c.ellipse(x, it.y + 9, 4, 5, 0, 0, TAU); c.fill();
            });
            var cy = GH - 70;
            var g = c.createRadialGradient(px, cy - 6, 4, px, cy - 6, 70); g.addColorStop(0, 'rgba(120,255,140,.45)'); g.addColorStop(1, 'rgba(0,0,0,0)');
            c.fillStyle = g; c.fillRect(px - 80, cy - 80, 160, 120);
            c.fillStyle = '#0b0b10'; c.strokeStyle = '#3a4156'; c.lineWidth = 3;
            c.beginPath(); c.ellipse(px, cy + 18, 58, 40, 0, 0, Math.PI); c.lineTo(px - 58, cy); c.ellipse(px, cy, 58, 12, 0, Math.PI, 0, true); c.closePath(); c.fill(); c.stroke();
            c.fillStyle = '#3cff6b'; c.beginPath(); c.ellipse(px, cy, 52, 9, 0, 0, TAU); c.fill();
          }
        };
      }},

    /* ---------- 4. ZOMBIE BONK ---------- */
    zombies: {name: 'Zombie Bonk', wall: 'bloodmoon', help: 'Bonk the zombies when they pop out of their graves. NOT the cat! Bonk 16 in 30 seconds.',
      make: function(){
        var holes = [], left = 30, score = 0, goal = 16, spawn = .5, bonks = [];
        makeCanvas();
        function layout(){ holes.length ? holes.forEach(function(h, i){ pos(h, i); }) : null; }
        function pos(h, i){ var col = i % 3, row = i / 3 | 0, cw = GW / 3, rh = (GH - 40) / 3; h.x = cw * (col + .5); h.y = 40 + rh * (row + .72); h.r = Math.min(cw, rh) * .32; }
        for(var i = 0; i < 9; i++){ var h = {who: null, t: 0, up: 0}; pos(h, i); holes.push(h); }
        return {
          resize: function(){ sizeCanvas(); layout(); },
          tick: function(dt){
            left -= dt; spawn -= dt;
            if(spawn <= 0){ var free = holes.filter(function(h){ return !h.who; }); if(free.length){ var h = pick(free); h.who = Math.random() < .2 ? 'cat' : 'zom'; h.t = rand(.75, 1.15) * (1 - (30 - left) * .012); h.up = 0; } spawn = rand(.3, .65); }
            holes.forEach(function(h){ if(h.who){ h.t -= dt; h.up = Math.min(1, h.up + dt * 6); if(h.t <= 0) h.who = null; } });
            bonks.forEach(function(b){ b.t += dt; }); bonks = bonks.filter(function(b){ return b.t < .5; });
            hud('Bonked ' + score + ' / ' + goal + '  ·  ' + Math.max(0, Math.ceil(left)) + 's');
            if(left <= 0) end(score >= goal, 'You bonked ' + score + ' zombies.');
          },
          draw: function(c){
            c.clearRect(0, 0, GW, GH);
            holes.forEach(function(h){
              c.fillStyle = '#16080c'; c.beginPath(); c.ellipse(h.x, h.y + h.r * .5, h.r * 1.2, h.r * .42, 0, 0, TAU); c.fill();
              c.fillStyle = '#2a2730'; c.fillRect(h.x - h.r * .55, h.y - h.r * 1.6, h.r * 1.1, h.r * .9);
              c.beginPath(); c.arc(h.x, h.y - h.r * 1.6, h.r * .55, Math.PI, 0); c.fill();
              txt(c, 'RIP', h.x, h.y - h.r * 1.15, Math.max(12, h.r * .4), '#9aa6c8');
              if(h.who){
                c.save(); c.beginPath(); c.rect(h.x - h.r * 1.5, h.y - h.r * 2.2, h.r * 3, h.r * 2.7); c.clip();
                var yy = h.y + h.r * .3 - h.up * h.r * 1.1;
                c.font = (h.r * 1.6 | 0) + 'px serif'; c.textAlign = 'center'; c.fillText(h.who === 'cat' ? '🐈‍⬛' : '🧟', h.x, yy + h.r * .5);
                c.restore();
              }
            });
            bonks.forEach(function(b){ c.globalAlpha = 1 - b.t * 2; txt(c, b.s, b.x, b.y - b.t * 60, 38, b.c, '"Metal Mania",serif'); c.globalAlpha = 1; });
          },
          down: function(x, y){
            holes.forEach(function(h){
              if(h.who && Math.hypot(x - h.x, y - (h.y - h.r * .5)) < h.r * 1.3){
                if(h.who === 'cat'){ score = Math.max(0, score - 2); bonks.push({x: h.x, y: h.y - h.r, t: 0, s: 'MEOW! -2', c: '#8fc6ff'}); }
                else { score++; bonks.push({x: h.x, y: h.y - h.r, t: 0, s: 'BONK!', c: '#ff5577'}); }
                h.who = null;
              }
            });
          }
        };
      }},

    /* ---------- 5. VAMPIRE FLAP ---------- */
    flap: {name: 'Vampire Flap', wall: 'stars', help: 'Tap (or press space) to flap. Fly the vampire bat through 10 gaps between the spires.',
      make: function(){
        makeCanvas();
        var b = {x: GW * .25, y: GH * .45, v: 0}, cols = [], dist = 0, passed = 0, goal = 10, started = false, ph = 0;
        function flap(){ started = true; b.v = -GH * .62; }
        function kd(e){ if(e.code === 'Space' || e.key === 'ArrowUp'){ e.preventDefault(); if(!ended) flap(); } }
        window.addEventListener('keydown', kd);
        return {
          stop: function(){ window.removeEventListener('keydown', kd); },
          down: function(){ flap(); },
          tick: function(dt){
            ph += dt * 16;
            if(!started){ b.y = GH * .45 + Math.sin(ph * .2) * 10; hud('Tap to start flapping  ·  0 / ' + goal); return; }
            b.v += GH * 1.7 * dt; b.y += b.v * dt;
            var sp = GW * .28; dist += sp * dt;
            if(!cols.length || cols[cols.length - 1].x < GW - GW * .42){ var gap = Math.max(GH * .28, 150); cols.push({x: GW + 40, gy: rand(GH * .18, GH * .82 - gap), gap: gap, w: Math.max(54, GW * .07), done: false}); }
            cols.forEach(function(cl){ cl.x -= sp * dt; if(!cl.done && cl.x + cl.w < b.x){ cl.done = true; passed++; } });
            cols = cols.filter(function(cl){ return cl.x > -cl.w - 20; });
            var r = 16, hit = b.y < r || b.y > GH - r;
            cols.forEach(function(cl){ if(b.x + r > cl.x && b.x - r < cl.x + cl.w && (b.y - r < cl.gy || b.y + r > cl.gy + cl.gap)) hit = true; });
            hud('Gaps ' + passed + ' / ' + goal);
            if(passed >= goal) end(true, 'You flew through all ' + goal + ' gaps.');
            else if(hit) end(false, 'Splat! You made it through ' + passed + '.');
          },
          draw: function(c){
            c.clearRect(0, 0, GW, GH);
            cols.forEach(function(cl){
              c.fillStyle = '#05040c'; c.strokeStyle = 'rgba(140,110,255,.6)'; c.lineWidth = 2;
              c.fillRect(cl.x, 0, cl.w, cl.gy); c.strokeRect(cl.x, -2, cl.w, cl.gy + 2);
              c.beginPath(); c.moveTo(cl.x - 6, cl.gy); c.lineTo(cl.x + cl.w / 2, cl.gy + cl.w * .6); c.lineTo(cl.x + cl.w + 6, cl.gy); c.closePath(); c.fill(); c.stroke();
              var by = cl.gy + cl.gap;
              c.fillRect(cl.x, by, cl.w, GH - by); c.strokeRect(cl.x, by, cl.w, GH - by + 2);
              c.beginPath(); c.moveTo(cl.x - 6, by); c.lineTo(cl.x + cl.w / 2, by - cl.w * .6); c.lineTo(cl.x + cl.w + 6, by); c.closePath(); c.fill(); c.stroke();
            });
            batShape(c, b.x, b.y, 22, .25 + .95 * (Math.sin(ph) * .5 + .5), 1);
            c.fillStyle = '#000'; c.fill(); c.strokeStyle = '#c8143c'; c.lineWidth = 2.5; c.stroke();
            c.fillStyle = '#ff2050'; c.fillRect(b.x - 6, b.y - 4, 3, 3); c.fillRect(b.x + 3, b.y - 4, 3, 3);
          }
        };
      }},

    /* ---------- 6. POTION SIMON ---------- */
    potion: {name: 'Potion Panic', wall: 'void', help: 'Watch the potions glow, then tap them in the same order. Survive 7 rounds to win.',
      make: function(){
        makeCanvas();
        var P = [{c: '#c8143c', n: 'blood', f: 196}, {c: '#5aa2ff', n: 'frost', f: 262}, {c: '#9b5cff', n: 'shadow', f: 330}, {c: '#3cff6b', n: 'slime', f: 392}];
        var seq = [], idx = 0, state = 'show', showI = 0, timer = .8, lit = -1, litT = 0, round = 0, goal = 7, ac = null;
        function tone(f){ try{ var AC = window.AudioContext || window.webkitAudioContext; ac = ac || new AC(); var t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(); o.type = 'square'; o.frequency.value = f; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.07, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + .35); o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + .4); }catch(e){} }
        function geo(i){ var cw = GW / 2, rh = (GH - 20) / 2, x = cw * ((i % 2) + .5), y = 20 + rh * ((i / 2 | 0) + .5), r = Math.min(cw, rh) * .34; return {x: x, y: y, r: r}; }
        function next(){ round++; seq.push(Math.random() * 4 | 0); idx = 0; state = 'show'; showI = 0; timer = .9; }
        next();
        return {
          resize: function(){ sizeCanvas(); },
          tick: function(dt){
            litT -= dt; if(litT <= 0) lit = -1;
            if(state === 'show'){ timer -= dt; if(timer <= 0){ if(showI < seq.length){ lit = seq[showI]; litT = .45; tone(P[lit].f); showI++; timer = Math.max(.35, .65 - round * .03); } else { state = 'play'; } } }
            hud('Round ' + round + ' / ' + goal + '  ·  ' + (state === 'show' ? 'Watch…' : 'Your turn!'));
          },
          draw: function(c){
            c.clearRect(0, 0, GW, GH);
            P.forEach(function(p, i){
              var g = geo(i), on = lit === i;
              if(on){ var gl = c.createRadialGradient(g.x, g.y, g.r * .3, g.x, g.y, g.r * 2); gl.addColorStop(0, p.c); gl.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gl; c.fillRect(g.x - g.r * 2, g.y - g.r * 2, g.r * 4, g.r * 4); }
              c.fillStyle = 'rgba(10,10,20,.85)'; c.strokeStyle = on ? '#fff' : 'rgba(200,210,255,.4)'; c.lineWidth = 3;
              c.beginPath(); c.arc(g.x, g.y + g.r * .2, g.r, 0, TAU); c.fill(); c.stroke();
              c.fillRect(g.x - g.r * .25, g.y - g.r * 1.2, g.r * .5, g.r * .5); c.strokeRect(g.x - g.r * .25, g.y - g.r * 1.2, g.r * .5, g.r * .5);
              c.globalAlpha = on ? 1 : .55; c.fillStyle = p.c;
              c.beginPath(); c.arc(g.x, g.y + g.r * .2, g.r * .85, .15, Math.PI - .15); c.fill(); c.globalAlpha = 1;
              txt(c, p.n.toUpperCase(), g.x, g.y + g.r * 1.45, Math.max(14, g.r * .3), '#e9e2cc');
            });
          },
          down: function(x, y){
            if(state !== 'play') return;
            for(var i = 0; i < 4; i++){ var g = geo(i); if(Math.hypot(x - g.x, y - g.y) < g.r * 1.2){
              lit = i; litT = .25; tone(P[i].f);
              if(seq[idx] !== i){ end(false, 'Wrong potion on round ' + round + '. KABOOM.'); return; }
              idx++;
              if(idx >= seq.length){ if(round >= goal) end(true, 'You brewed all ' + goal + ' rounds.'); else { state = 'wait'; setTimeout(next, 650); } }
              return; } }
          },
          stop: function(){ try{ if(ac) ac.close(); }catch(e){} }
        };
      }},

    /* ---------- 7. SKELETON STACK ---------- */
    stack: {name: 'Skeleton Stack', wall: 'storm', help: 'Tap to drop each bone slab onto the tower. Overhangs get chopped. Stack 12 to win.',
      make: function(){
        makeCanvas();
        var bh = 0, tower = [], moving = null, dir = 1, cam = 0, goal = 12, chips = [];
        function base(){ bh = Math.max(26, GH * .055); tower = [{x: GW * .5 - GW * .2, w: GW * .4}]; spawnBlock(); }
        function spawnBlock(){ var top = tower[tower.length - 1]; moving = {x: dir > 0 ? -top.w : GW, w: top.w, v: GW * (.38 + tower.length * .03) * dir}; }
        base();
        return {
          resize: function(){ sizeCanvas(); },
          tick: function(dt){
            if(moving){ moving.x += moving.v * dt; if(moving.x < -moving.w * .5 && moving.v < 0) moving.v *= -1; if(moving.x + moving.w * .5 > GW && moving.v > 0) moving.v *= -1; }
            var want = Math.max(0, tower.length * bh - GH * .55); cam += (want - cam) * Math.min(1, dt * 4);
            chips.forEach(function(ch){ ch.vy += 900 * dt; ch.y += ch.vy * dt; ch.r += dt * 3; }); chips = chips.filter(function(ch){ return ch.y < GH + 300; });
            hud('Stacked ' + (tower.length - 1) + ' / ' + goal);
          },
          draw: function(c){
            c.clearRect(0, 0, GW, GH);
            function slab(x, w, level, col){
              var y = GH - (level + 1) * bh + cam;
              c.fillStyle = col || '#e9e2cc'; c.strokeStyle = '#000'; c.lineWidth = 2;
              c.fillRect(x, y, w, bh - 2); c.strokeRect(x, y, w, bh - 2);
              c.fillStyle = 'rgba(0,0,0,.25)';
              for(var k = x + 14; k < x + w - 10; k += 28){ c.beginPath(); c.arc(k, y + bh * .5 - 1, bh * .18, 0, TAU); c.fill(); }
            }
            tower.forEach(function(t, i){ slab(t.x, t.w, i, i === 0 ? '#3a4156' : null); });
            if(moving) slab(moving.x, moving.w, tower.length, '#ffe9b0');
            chips.forEach(function(ch){ c.save(); c.translate(ch.x + ch.w / 2, ch.y); c.rotate(ch.r); c.fillStyle = '#cfc6ad'; c.fillRect(-ch.w / 2, -bh / 2, ch.w, bh - 2); c.restore(); });
            var top = tower[tower.length - 1];
            c.font = (bh * 1.4 | 0) + 'px serif'; c.textAlign = 'center'; c.fillText('💀', top.x + top.w / 2, GH - tower.length * bh + cam - 4);
          },
          down: function(){
            if(!moving) return;
            var top = tower[tower.length - 1], l = Math.max(moving.x, top.x), r = Math.min(moving.x + moving.w, top.x + top.w), w = r - l;
            if(w <= 4){ chips.push({x: moving.x, y: GH - (tower.length + .5) * bh + cam, w: moving.w, vy: 0, r: 0}); moving = null; end(false, 'The tower crumbled at ' + (tower.length - 1) + '.'); return; }
            if(moving.x < l) chips.push({x: moving.x, y: GH - (tower.length + .5) * bh + cam, w: l - moving.x, vy: 0, r: 0});
            if(moving.x + moving.w > r) chips.push({x: r, y: GH - (tower.length + .5) * bh + cam, w: moving.x + moving.w - r, vy: 0, r: 0});
            tower.push({x: l, w: w}); dir *= -1;
            if(tower.length - 1 >= goal){ moving = null; end(true, 'A ' + goal + '-bone tower of doom!'); return; }
            spawnBlock();
          }
        };
      }},

    /* ---------- 8. BLOCKYARD CRYPT RUN (3D, original) ---------- */
    obby: {name: 'Blockyard Crypt Run', wall: 'web', help: 'A 3D block obby! Arrows / WASD to move, Space to jump. On a phone: drag the left stick, tap JUMP. Reach the glowing coffin before you fall 5 times.',
      make: function(){
        var holder = document.createElement('div'); holder.className = 'obby-wrap'; stage.appendChild(holder);
        hud('Summoning the blockyard…');
        var game = null, dead = false;
        import('/obby3d.js?v=1').then(function(m){
          if(dead) return;
          game = m.startObby(holder, {hud: hud, end: end, isEnded: function(){ return ended; }});
        }).catch(function(){ hud('The 3D game could not load on this device.'); });
        return {stop: function(){ dead = true; if(game) game.stop(); }, resize: function(){ if(game) game.resize(); }};
      }}
  };
  var ORDER = Object.keys(GAMES);

  function load(key){
    hideResult();
    clearStage();
    ended = false; curKey = key;
    var g = GAMES[key];
    titleEl.textContent = g.name; helpEl.textContent = g.help;
    setWall(g.wall);
    cur = g.make();
    if(cur.tick) startLoop();
    try{ store.set('arcadeLast', key); }catch(e){}
  }
  function randomNext(){
    var opts = ORDER.filter(function(k){ return k !== curKey; });
    load(pick(opts));
    say(GAMES[curKey].name, {queue: true});
  }

  $('btnNext').addEventListener('click', randomNext);
  $('btnRestart').addEventListener('click', function(){ load(curKey); });
  $('rAgain').addEventListener('click', function(){ load(curKey); });
  $('rNext').addEventListener('click', randomNext);
  window.addEventListener('resize', function(){ sizeVortex(); fit(); if(gCanvas) sizeCanvas(); });

  sizeVortex(); fit();
  load(pick(ORDER));
  requestAnimationFrame(wallLoop);
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  setTimeout(fit, 400);
})();
