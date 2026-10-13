/* jerica.pro — Maker Studio. Everything is drawn on canvas in the browser.
   Downloads go straight to the device. Nothing is sent anywhere. */
(function(){
'use strict';
var $ = JP.$, $$ = JP.$$;

function swatchRow(el, colors, cur, cb){
  if(!el) return;
  el.innerHTML = '';
  colors.forEach(function(c){
    var b = document.createElement('button');
    b.className = 'sw' + (c === cur ? ' sel' : '');
    b.style.background = c; b.setAttribute('aria-label', 'Color ' + c);
    b.addEventListener('click', function(){ cur = c; mark(el, b); cb(c); });
    el.appendChild(b);
  });
  function mark(row, btn){ $$('.sw', row).forEach(function(x){ x.classList.remove('sel'); }); btn.classList.add('sel'); }
}
function chipRow(el, items, cur, cb){
  if(!el) return;
  el.innerHTML = '';
  items.forEach(function(it){
    var b = document.createElement('button');
    b.className = 'chip' + (it === cur ? ' sel' : '');
    b.textContent = it;
    b.addEventListener('click', function(){
      $$('.chip', el).forEach(function(x){ x.classList.remove('sel'); });
      b.classList.add('sel'); cb(it);
    });
    el.appendChild(b);
  });
}
function star(ctx, cx, cy, r, color){
  ctx.save(); ctx.translate(cx, cy); ctx.fillStyle = color; ctx.beginPath();
  for(var i = 0; i < 10; i++){
    var rad = i % 2 ? r * .45 : r, a = i * Math.PI / 5 - Math.PI / 2;
    ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rad, Math.sin(a) * rad);
  }
  ctx.closePath(); ctx.fill(); ctx.restore();
}
function bolt(ctx, cx, cy, s, color){
  ctx.save(); ctx.translate(cx, cy); ctx.fillStyle = color; ctx.beginPath();
  ctx.moveTo(.15*s, -s); ctx.lineTo(-.45*s, .12*s); ctx.lineTo(-.05*s, .12*s);
  ctx.lineTo(-.15*s, s); ctx.lineTo(.45*s, -.12*s); ctx.lineTo(.05*s, -.12*s);
  ctx.closePath(); ctx.fill(); ctx.restore();
}
function roundRect(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x+r, y); ctx.arcTo(x+w, y, x+w, y+h, r); ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r); ctx.arcTo(x, y, x+w, y, r); ctx.closePath();
}

/* ================================================================
   AVATAR MAKER
================================================================ */
(function(){
  var cv = $('#av-canvas'); if(!cv) return;
  var ctx = cv.getContext('2d');
  var S = {
    bg: '#1e1e24', skin: '#f2c89b', hair: 'Spiky', hairc: '#141418',
    hat: 'Beanie', glasses: 'Shades', shirt: '#ff3fa4', sticker: '⚡ Bolt'
  };
  function draw(){
    ctx.fillStyle = S.bg; ctx.fillRect(0,0,380,380);
    /* polka dots deco */
    ctx.fillStyle = 'rgba(255,255,255,.10)';
    for(var x=20; x<380; x+=52) for(var y=20; y<380; y+=52){ ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fill(); }
    /* shoulders / shirt */
    ctx.fillStyle = S.shirt; roundRect(ctx, 95, 288, 190, 110, 46); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.18)'; roundRect(ctx, 95, 288, 190, 22, 11); ctx.fill();
    /* neck + head */
    ctx.fillStyle = S.skin; ctx.fillRect(172, 252, 36, 44);
    ctx.beginPath(); ctx.arc(190, 178, 84, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(106, 182, 13, 0, 7); ctx.arc(274, 182, 13, 0, 7); ctx.fill(); /* ears */
    /* hair styles */
    ctx.fillStyle = S.hairc;
    if(S.hair === 'Spiky'){
      ctx.beginPath(); ctx.moveTo(108, 168);
      [122,148,168,192,216,240,262].forEach(function(x, i){ ctx.lineTo(x - 10, 96 - (i%2)*14); ctx.lineTo(x + 6, 128); });
      ctx.lineTo(272, 168); ctx.arc(190, 168, 82, 0, Math.PI, true); ctx.fill();
    } else if(S.hair === 'Long'){
      roundRect(ctx, 100, 92, 180, 210, 60); ctx.fill();
      ctx.fillStyle = S.skin; ctx.beginPath(); ctx.arc(190, 182, 74, 0, 7); ctx.fill();
      ctx.fillStyle = S.hairc; ctx.beginPath(); ctx.arc(190, 128, 76, Math.PI, 0); ctx.fill();
      roundRect(ctx, 100, 92, 26, 210, 12); ctx.fill(); roundRect(ctx, 254, 92, 26, 210, 12); ctx.fill();
    } else if(S.hair === 'Curls'){
      for(var i = 0; i < 9; i++){ ctx.beginPath(); ctx.arc(122 + i*17, 108 + (i%2)*10, 17, 0, 7); ctx.fill(); }
      ctx.beginPath(); ctx.arc(190, 116, 78, Math.PI, 0); ctx.fill();
    } else if(S.hair === 'Mohawk'){
      roundRect(ctx, 172, 26, 36, 108, 16); ctx.fill();
    }
    /* face */
    if(S.glasses === 'Shades'){
      ctx.fillStyle = '#101014'; roundRect(ctx, 118, 160, 56, 32, 9); ctx.fill(); roundRect(ctx, 206, 160, 56, 32, 9); ctx.fill();
      ctx.fillRect(170, 168, 40, 8);
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(126, 166, 18, 8); ctx.fillRect(214, 166, 18, 8);
    } else if(S.glasses === 'Star frames'){
      star(ctx, 146, 176, 26, '#ffd23f'); star(ctx, 234, 176, 26, '#ffd23f');
      ctx.fillStyle = '#141418'; ctx.beginPath(); ctx.arc(146, 176, 5, 0, 7); ctx.arc(234, 176, 5, 0, 7); ctx.fill();
    } else {
      ctx.fillStyle = '#141418'; ctx.beginPath(); ctx.arc(152, 176, 7, 0, 7); ctx.arc(228, 176, 7, 0, 7); ctx.fill();
    }
    /* brows + smile */
    ctx.strokeStyle = '#141418'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(140, 152); ctx.lineTo(164, 148); ctx.moveTo(216, 148); ctx.lineTo(240, 152); ctx.stroke();
    ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(190, 210, 26, .25*Math.PI, .75*Math.PI); ctx.stroke();
    ctx.fillStyle = 'rgba(255,110,150,.5)'; ctx.beginPath(); ctx.arc(122, 214, 11, 0, 7); ctx.arc(258, 214, 11, 0, 7); ctx.fill();
    /* hat */
    if(S.hat === 'Beanie'){
      ctx.fillStyle = '#c9ff2f'; ctx.beginPath(); ctx.arc(190, 118, 86, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#a8e01e'; roundRect(ctx, 100, 104, 180, 22, 10); ctx.fill();
      ctx.fillStyle = '#ff3fa4'; ctx.beginPath(); ctx.arc(190, 30, 13, 0, 7); ctx.fill();
    } else if(S.hat === 'Cap'){
      ctx.fillStyle = '#4da6ff'; ctx.beginPath(); ctx.arc(190, 122, 84, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#2f7fd1'; roundRect(ctx, 168, 108, 130, 16, 8); ctx.fill();
    } else if(S.hat === 'Headphones'){
      ctx.strokeStyle = '#141418'; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(190, 168, 96, Math.PI*1.05, Math.PI*1.95); ctx.stroke();
      ctx.fillStyle = '#ff3fa4'; roundRect(ctx, 84, 168, 26, 52, 10); ctx.fill(); roundRect(ctx, 270, 168, 26, 52, 10); ctx.fill();
    }
    /* sticker */
    if(S.sticker === '⚡ Bolt') bolt(ctx, 322, 58, 30, '#ffd23f');
    else if(S.sticker === '★ Star') star(ctx, 322, 58, 30, '#c9ff2f');
    else if(S.sticker === '💀 Skull'){
      ctx.fillStyle = '#f5efe2'; ctx.beginPath(); ctx.arc(322, 54, 24, 0, 7); ctx.fill();
      ctx.fillRect(308, 66, 28, 14);
      ctx.fillStyle = '#141418'; ctx.beginPath(); ctx.arc(313, 52, 6, 0, 7); ctx.arc(331, 52, 6, 0, 7); ctx.fill();
      ctx.fillRect(319, 68, 6, 8);
    } else if(S.sticker === '🍒 Cherry'){
      ctx.strokeStyle = '#2e9e4f'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(310, 74); ctx.quadraticCurveTo(322, 44, 338, 36); ctx.moveTo(334, 78); ctx.quadraticCurveTo(330, 52, 338, 36); ctx.stroke();
      ctx.fillStyle = '#ff2f4f'; ctx.beginPath(); ctx.arc(308, 82, 13, 0, 7); ctx.arc(336, 86, 13, 0, 7); ctx.fill();
    }
  }
  swatchRow($('#av-bg'), ['#1e1e24','#2a0f3f','#0f2f3a','#ff3fa4','#ffd23f','#2dd4bf'], S.bg, function(c){ S.bg = c; draw(); });
  swatchRow($('#av-skin'), ['#ffe3c2','#f2c89b','#d99e63','#a66a35','#71421f'], S.skin, function(c){ S.skin = c; draw(); });
  chipRow($('#av-hair'), ['Spiky','Long','Curls','Mohawk'], S.hair, function(v){ S.hair = v; draw(); });
  swatchRow($('#av-hairc'), ['#141418','#5b3a1e','#b5651d','#e84f83','#4da6ff','#c9ff2f','#f5efe2'], S.hairc, function(c){ S.hairc = c; draw(); });
  chipRow($('#av-hat'), ['Beanie','Cap','Headphones','None'], S.hat, function(v){ S.hat = v; draw(); });
  chipRow($('#av-glasses'), ['Shades','Star frames','None'], S.glasses, function(v){ S.glasses = v; draw(); });
  swatchRow($('#av-shirt'), ['#ff3fa4','#c9ff2f','#4da6ff','#ffd23f','#9b6bff','#141418'], S.shirt, function(c){ S.shirt = c; draw(); });
  chipRow($('#av-sticker'), ['⚡ Bolt','★ Star','💀 Skull','🍒 Cherry','None'], S.sticker, function(v){ S.sticker = v; draw(); });
  $('#av-download').addEventListener('click', function(){ JP.download(cv, 'jerica-avatar.png'); });
  draw();
})();

/* ================================================================
   POSTER MAKER
================================================================ */
(function(){
  var cv = $('#po-canvas'); if(!cv) return;
  var ctx = cv.getContext('2d');
  var VIBES = {
    'Grunge':   {main:'#c9ff2f', second:'#f5efe2', deco:'scribble'},
    'Pop-Punk': {main:'#ff3fa4', second:'#ffd23f', deco:'stars'},
    'Thrash':   {main:'#ff5252', second:'#f5efe2', deco:'bolts'},
    'Checker':  {main:'#f5efe2', second:'#c9ff2f', deco:'checker'}
  };
  var S = { title: 'LOUD & PROUD', sub: 'one night only · my room · bring snacks',
            vibe: 'Pop-Punk', bands: 'All three', bg: '#141418' };
  function draw(){
    var V = VIBES[S.vibe];
    ctx.fillStyle = S.bg; ctx.fillRect(0,0,380,500);
    /* deco */
    if(V.deco === 'checker'){
      ctx.fillStyle = 'rgba(255,255,255,.16)';
      for(var x=0; x<380; x+=38) for(var y=0; y<500; y+=38) if(((x+y)/38) % 2 === 0) ctx.fillRect(x, y, 38, 38);
    } else if(V.deco === 'stars'){
      star(ctx, 44, 60, 20, V.main); star(ctx, 336, 96, 15, V.second); star(ctx, 322, 420, 22, V.main); star(ctx, 52, 396, 13, V.second);
    } else if(V.deco === 'bolts'){
      bolt(ctx, 46, 70, 26, V.main); bolt(ctx, 334, 420, 30, V.second); bolt(ctx, 330, 70, 18, V.main);
    } else {
      ctx.strokeStyle = V.main; ctx.lineWidth = 3;
      for(var i = 0; i < 5; i++){
        ctx.beginPath();
        ctx.moveTo(20, 40 + i*96);
        ctx.bezierCurveTo(120, 10 + i*96, 260, 76 + i*96, 360, 40 + i*96); ctx.stroke();
      }
    }
    /* tape corners */
    ctx.fillStyle = 'rgba(255,210,63,.85)';
    ctx.save(); ctx.translate(30, 22); ctx.rotate(-.6); ctx.fillRect(-34, -10, 68, 20); ctx.restore();
    ctx.save(); ctx.translate(350, 22); ctx.rotate(.6); ctx.fillRect(-34, -10, 68, 20); ctx.restore();
    /* frame */
    ctx.strokeStyle = V.main; ctx.lineWidth = 6; ctx.strokeRect(16, 16, 348, 468);
    /* headline */
    ctx.textAlign = 'center'; ctx.fillStyle = V.main;
    var words = (S.title || 'MY POSTER').toUpperCase().split(' '), lines = [''], li = 0;
    words.forEach(function(w){
      if((lines[li] + ' ' + w).trim().length > 11){ lines.push(w); li++; } else lines[li] = (lines[li] + ' ' + w).trim();
    });
    ctx.font = '900 44px "Arial Black", Arial';
    lines.slice(0, 3).forEach(function(ln, i){ ctx.fillText(ln, 190, 130 + i*50); });
    var yAfter = 130 + Math.min(3, lines.length)*50;
    /* guitar doodle */
    ctx.save(); ctx.translate(190, yAfter + 58); ctx.rotate(-.5);
    ctx.fillStyle = V.second; ctx.beginPath(); ctx.ellipse(0, 16, 34, 26, 0, 0, 7); ctx.ellipse(20, -4, 24, 19, 0, 0, 7); ctx.fill();
    ctx.fillStyle = S.bg; ctx.beginPath(); ctx.arc(8, 6, 10, 0, 7); ctx.fill();
    ctx.strokeStyle = V.second; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(30, -12); ctx.lineTo(66, -44); ctx.stroke();
    ctx.fillStyle = V.main; ctx.fillRect(58, -56, 22, 16);
    ctx.restore();
    /* bands line */
    ctx.fillStyle = '#f5efe2'; ctx.font = '800 17px "Trebuchet MS", sans-serif';
    var bandLine = S.bands === 'All three' ? 'NIRVANA ★ GREEN DAY ★ METALLICA' : S.bands.toUpperCase();
    ctx.fillText('ON REPEAT:', 190, yAfter + 138);
    ctx.fillStyle = V.second;
    var bfs = 19;
    ctx.font = '900 ' + bfs + 'px "Arial Black", Arial';
    while(ctx.measureText(bandLine).width > 322 && bfs > 11){ bfs -= 2; ctx.font = '900 ' + bfs + 'px "Arial Black", Arial'; }
    ctx.fillText(bandLine, 190, yAfter + 166);
    /* sub line */
    ctx.fillStyle = '#d8d4c8'; ctx.font = 'italic 700 15px "Trebuchet MS", sans-serif';
    ctx.fillText(S.sub || '', 190, 448);
    ctx.fillStyle = V.main; ctx.font = '900 13px "Courier New", monospace';
    ctx.fillText('★ JERICA.PRO ★ NO BORING ALLOWED ★', 190, 472);
  }
  $('#po-title').addEventListener('input', function(e){ S.title = e.target.value; draw(); });
  $('#po-sub').addEventListener('input', function(e){ S.sub = e.target.value; draw(); });
  chipRow($('#po-vibe'), Object.keys(VIBES), S.vibe, function(v){ S.vibe = v; draw(); });
  chipRow($('#po-bands'), ['All three','Nirvana','Green Day','Metallica'], S.bands, function(v){ S.bands = v; draw(); });
  swatchRow($('#po-bg'), ['#141418','#2a0f3f','#3a0d24','#0d2b26','#f5efe2'], S.bg, function(c){ S.bg = c; draw(); });
  $('#po-download').addEventListener('click', function(){ JP.download(cv, 'jerica-poster.png'); });
  draw();
})();

/* ================================================================
   SKATEBOARD DECK DESIGNER
================================================================ */
(function(){
  var cv = $('#dk-canvas'); if(!cv) return;
  var ctx = cv.getContext('2d');
  var S = { color: '#ff3fa4', pattern: 'Checker', sticker: '⚡ Bolt', text: 'JERICA' };
  function deckPath(){
    ctx.beginPath();
    ctx.moveTo(86, 18); ctx.lineTo(214, 18);
    ctx.quadraticCurveTo(238, 18, 238, 60); ctx.lineTo(238, 452);
    ctx.quadraticCurveTo(238, 502, 188, 502); ctx.lineTo(112, 502);
    ctx.quadraticCurveTo(62, 502, 62, 452); ctx.lineTo(62, 60);
    ctx.quadraticCurveTo(62, 18, 86, 18); ctx.closePath();
  }
  function draw(){
    ctx.fillStyle = '#f5efe2'; ctx.fillRect(0,0,300,520);
    ctx.fillStyle = 'rgba(20,20,24,.06)';
    for(var x=0; x<300; x+=26) ctx.fillRect(x, 0, 2, 520);
    deckPath(); ctx.fillStyle = S.color; ctx.fill();
    ctx.save(); deckPath(); ctx.clip();
    if(S.pattern === 'Checker'){
      ctx.fillStyle = 'rgba(0,0,0,.85)';
      for(var cx=62; cx<238; cx+=22) for(var cy=18; cy<502; cy+=22) if((((cx-62)/22) + ((cy-18)/22)) % 2 === 0) ctx.fillRect(cx, cy, 22, 22);
    } else if(S.pattern === 'Stripes'){
      ctx.fillStyle = 'rgba(255,255,255,.5)';
      for(var sy=-40; sy<540; sy+=44){ ctx.save(); ctx.translate(150, sy); ctx.rotate(-.35); ctx.fillRect(-160, 0, 320, 16); ctx.restore(); }
    } else if(S.pattern === 'Stars'){
      var pts = [[100,90],[200,140],[130,230],[205,300],[105,380],[170,440]];
      pts.forEach(function(p, i){ star(ctx, p[0], p[1], 17, i % 2 ? '#ffd23f' : '#f5efe2'); });
    } else if(S.pattern === 'Lightning'){
      bolt(ctx, 118, 130, 44, '#ffd23f'); bolt(ctx, 196, 300, 52, '#f5efe2'); bolt(ctx, 122, 428, 38, '#ffd23f');
    }
    /* grip shine */
    var g = ctx.createLinearGradient(62, 0, 238, 0);
    g.addColorStop(0, 'rgba(255,255,255,.20)'); g.addColorStop(.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,.18)');
    ctx.fillStyle = g; ctx.fillRect(62, 18, 176, 484);
    ctx.restore();
    deckPath(); ctx.strokeStyle = '#141418'; ctx.lineWidth = 5; ctx.stroke();
    /* bolt holes */
    ctx.fillStyle = '#141418';
    [[110,44],[190,44],[110,476],[190,476]].forEach(function(p){ ctx.beginPath(); ctx.arc(p[0], p[1], 5, 0, 7); ctx.fill(); });
    /* big sticker */
    if(S.sticker === '⚡ Bolt') bolt(ctx, 150, 262, 56, '#ffd23f');
    else if(S.sticker === '★ Star') star(ctx, 150, 262, 56, '#c9ff2f');
    else if(S.sticker === '💀 Skull'){
      ctx.fillStyle = '#f5efe2'; ctx.beginPath(); ctx.arc(150, 256, 40, 0, 7); ctx.fill();
      ctx.fillRect(128, 276, 44, 22);
      ctx.fillStyle = '#141418'; ctx.beginPath(); ctx.arc(134, 252, 10, 0, 7); ctx.arc(166, 252, 10, 0, 7); ctx.fill();
      ctx.fillRect(146, 278, 8, 12);
    } else if(S.sticker === '🍒 Cherry'){
      ctx.strokeStyle = '#14532d'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(128, 292); ctx.quadraticCurveTo(148, 226, 178, 210); ctx.moveTo(172, 296); ctx.quadraticCurveTo(164, 244, 178, 210); ctx.stroke();
      ctx.fillStyle = '#e11d48'; ctx.beginPath(); ctx.arc(124, 300, 24, 0, 7); ctx.arc(176, 304, 24, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(116, 292, 7, 0, 7); ctx.arc(168, 296, 7, 0, 7); ctx.fill();
    } else if(S.sticker === '🎸 Guitar'){
      ctx.save(); ctx.translate(150, 262); ctx.rotate(-.5);
      ctx.fillStyle = '#f5efe2'; ctx.beginPath(); ctx.ellipse(0, 20, 42, 32, 0, 0, 7); ctx.ellipse(24, -6, 30, 23, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#141418'; ctx.beginPath(); ctx.arc(10, 8, 12, 0, 7); ctx.fill();
      ctx.strokeStyle = '#f5efe2'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(38, -16); ctx.lineTo(82, -56); ctx.stroke();
      ctx.restore();
    }
    /* deck name */
    if(S.text){
      ctx.save(); ctx.translate(150, 262); ctx.rotate(Math.PI/2);
      ctx.font = '900 30px "Arial Black", Arial'; ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillText(S.text.toUpperCase(), 2, -52);
      ctx.fillStyle = '#fff'; ctx.fillText(S.text.toUpperCase(), 0, -54);
      ctx.restore();
    }
  }
  swatchRow($('#dk-color'), ['#ff3fa4','#c9ff2f','#4da6ff','#ffd23f','#9b6bff','#141418','#e11d48','#2dd4bf'], S.color, function(c){ S.color = c; draw(); });
  chipRow($('#dk-pattern'), ['Checker','Stripes','Stars','Lightning','None'], S.pattern, function(v){ S.pattern = v; draw(); });
  chipRow($('#dk-sticker'), ['⚡ Bolt','★ Star','💀 Skull','🍒 Cherry','🎸 Guitar','None'], S.sticker, function(v){ S.sticker = v; draw(); });
  $('#dk-text').addEventListener('input', function(e){ S.text = e.target.value; draw(); });
  $('#dk-download').addEventListener('click', function(){ JP.download(cv, 'jerica-deck.png'); });
  draw();
})();
})();
