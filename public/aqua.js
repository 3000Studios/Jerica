/* jerica.pro — the Liquid Aquarium.
   Layer 1: a hand-drawn living aquarium (canvas 2D).
   Layer 2: WebGL liquid on top of it — a ripple height-field that refracts the
            aquarium, plus a color-blooming fluid simulation. Nothing happens
            until you touch. Your finger's motion keeps flowing after you lift
            it, then fades. Double-tap changes the flow style.
   Sound: water ambience, touch splashes and swirls (all synthesized), and a
          CC0 jazz loop by Alex McCulloch playing quietly.
   Everything runs on the device. Nothing is collected. */
(function(){
  'use strict';
  var TAU = Math.PI * 2;
  var rand = function(a, b){ return a + Math.random() * (b - a); };
  var RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var glCanvas = document.getElementById('gl'), sceneCanvas = document.getElementById('scene');
  var hint = document.getElementById('hint'), toast = document.getElementById('toast');
  var W = 0, H = 0, DPR = 1;

  /* =====================================================================
     THE AQUARIUM (2D)
     ===================================================================== */
  var sc = sceneCanvas.getContext('2d'), SW = 0, SH = 0, SS = 1;
  var fish = [], plants = [], bubbles = [], rocks = [], scare = null, sandSeed = [];
  var SPECIES = [
    {n: 'clown', len: 46, h: .5, body: ['#ff7a1a', '#ff9a3c'], stripes: '#fff', fin: '#ff6a00', edge: '#111', count: 3, speed: 55},
    {n: 'tang', len: 58, h: .55, body: ['#1e5bff', '#2f8cff'], stripes: null, fin: '#ffd21a', edge: '#0a1a55', count: 2, speed: 65, mark: '#08124a'},
    {n: 'angel', len: 44, h: 1.05, body: ['#d9d9d9', '#f4f1e8'], stripes: '#222', fin: '#e8e0c8', edge: '#555', count: 2, speed: 35},
    {n: 'gold', len: 50, h: .62, body: ['#ff9d00', '#ffbf3a'], stripes: null, fin: '#ffcf6a', edge: '#b25a00', count: 2, speed: 45, fancy: true},
    {n: 'tetra', len: 20, h: .38, body: ['#a8b8c8', '#c8d6e2'], stripes: null, fin: '#c8d6e2', edge: '#3a4a5a', count: 12, speed: 90, neon: true}
  ];
  function buildTank(){
    fish = []; plants = []; bubbles = []; rocks = []; sandSeed = [];
    SPECIES.forEach(function(sp){
      var school = sp.n === 'tetra' ? {x: rand(.2, .8) * SW, y: rand(.3, .6) * SH} : null;
      for(var i = 0; i < sp.count; i++){
        var s = sp.len * SS * rand(.85, 1.15);
        fish.push({sp: sp, len: s, x: school ? school.x + rand(-60, 60) * SS : rand(.1, .9) * SW, y: school ? school.y + rand(-40, 40) * SS : rand(.15, .75) * SH,
          vx: rand(-1, 1), vy: rand(-.3, .3), tx: rand(.1, .9) * SW, ty: rand(.15, .75) * SH, ph: rand(0, TAU), face: 1, z: rand(.75, 1.15), school: !!school});
      }
    });
    fish.sort(function(a, b){ return a.z - b.z; });
    var n = Math.max(7, SW / (70 * SS) | 0);
    for(var i = 0; i < n; i++) plants.push({x: rand(0, SW), h: rand(.25, .55) * SH, w: rand(10, 22) * SS, ph: rand(0, TAU),
      col: ['#1f7a3a', '#2a9a4a', '#16602e', '#3cae5a', '#2d6b1f'][i % 5], blades: 2 + (Math.random() * 3 | 0), back: Math.random() < .45});
    for(i = 0; i < 6; i++) rocks.push({x: rand(0, SW), w: rand(60, 160) * SS, h: rand(30, 90) * SS, c: ['#3d3a44', '#4a4552', '#35313b'][i % 3]});
    for(i = 0; i < 80; i++) sandSeed.push([rand(0, SW), rand(0, 1), rand(1, 3) * SS]);
  }
  function sizeScene(){
    var q = Math.min(1, 1280 / Math.max(W, H));
    SW = Math.round(W * q); SH = Math.round(H * q); SS = Math.max(.55, Math.min(SW, SH) / 700);
    sceneCanvas.width = SW; sceneCanvas.height = SH;
    buildTank();
  }
  function drawFish(c, f, t){
    var sp = f.sp, L = f.len * f.z, Hh = L * sp.h, wag = Math.sin(t * (6 + Math.hypot(f.vx, f.vy) * 4) + f.ph) * .35;
    c.save(); c.translate(f.x, f.y); c.scale(f.face, 1);
    c.rotate(Math.atan2(f.vy, Math.abs(f.vx) + .001) * .5 * f.face * f.face);
    c.globalAlpha = .55 + .45 * Math.min(1, f.z);
    c.fillStyle = sp.fin;
    c.save(); c.translate(-L * .45, 0); c.rotate(wag);
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-L * .25, -Hh * .9, -L * (sp.fancy ? .55 : .35), -Hh * (sp.fancy ? .9 : .6));
    c.quadraticCurveTo(-L * .2, 0, -L * (sp.fancy ? .55 : .35), Hh * (sp.fancy ? .9 : .6)); c.quadraticCurveTo(-L * .25, Hh * .9, 0, 0); c.fill(); c.restore();
    if(sp.n === 'angel'){ c.beginPath(); c.moveTo(-L * .1, -Hh * .4); c.quadraticCurveTo(L * .05, -Hh * 1.3, -L * .45, -Hh * 1.2); c.lineTo(-L * .3, -Hh * .3); c.fill();
      c.beginPath(); c.moveTo(-L * .1, Hh * .4); c.quadraticCurveTo(L * .05, Hh * 1.3, -L * .45, Hh * 1.2); c.lineTo(-L * .3, Hh * .3); c.fill(); }
    var g = c.createLinearGradient(0, -Hh / 2, 0, Hh / 2); g.addColorStop(0, sp.body[0]); g.addColorStop(1, sp.body[1]);
    c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, L * .5, Hh / 2, 0, 0, TAU); c.fill();
    if(sp.stripes){ c.save(); c.clip(); c.fillStyle = sp.stripes;
      (sp.n === 'clown' ? [.22, -.05, -.32] : [.2, -.02, -.24]).forEach(function(k){ c.fillRect(L * k - L * .045, -Hh, L * .09, Hh * 2); }); c.restore(); }
    if(sp.mark){ c.fillStyle = sp.mark; c.beginPath(); c.ellipse(-L * .05, -Hh * .12, L * .28, Hh * .16, -.2, 0, TAU); c.fill(); }
    if(sp.neon){ c.fillStyle = '#29e6ff'; c.fillRect(-L * .35, -Hh * .12, L * .7, Hh * .18); c.fillStyle = '#ff2a4a'; c.fillRect(-L * .4, Hh * .06, L * .4, Hh * .2); }
    c.fillStyle = sp.fin; c.globalAlpha *= .8;
    c.beginPath(); c.ellipse(L * .02, Hh * .12, L * .12, Hh * .12, .6 + wag * .5, 0, TAU); c.fill();
    c.globalAlpha = 1;
    c.fillStyle = '#fff'; c.beginPath(); c.arc(L * .3, -Hh * .1, Math.max(1.5, L * .07), 0, TAU); c.fill();
    c.fillStyle = '#000'; c.beginPath(); c.arc(L * .32, -Hh * .1, Math.max(1, L * .04), 0, TAU); c.fill();
    c.restore();
  }
  function stepFish(dt, t){
    fish.forEach(function(f){
      var sp = f.sp, maxV = sp.speed * SS * (f.flee > 0 ? 3.2 : 1);
      if(Math.hypot(f.tx - f.x, f.ty - f.y) < 30 * SS || Math.random() < dt * .08){ f.tx = rand(.06, .94) * SW; f.ty = rand(.12, .78) * SH; }
      var ax = (f.tx - f.x), ay = (f.ty - f.y), d = Math.hypot(ax, ay) || 1;
      f.vx += ax / d * maxV * dt * 1.4; f.vy += ay / d * maxV * dt * .9;
      if(scare && scare.t > 0){ var sx = f.x - scare.x, sy = f.y - scare.y, sd = Math.hypot(sx, sy);
        if(sd < 220 * SS){ f.vx += sx / (sd + 1) * maxV * 8 * dt; f.vy += sy / (sd + 1) * maxV * 8 * dt; f.flee = 1.2; } }
      f.flee = Math.max(0, (f.flee || 0) - dt);
      var v = Math.hypot(f.vx, f.vy); if(v > maxV){ f.vx *= maxV / v; f.vy *= maxV / v; }
      f.x += f.vx * dt; f.y += f.vy * dt;
      f.y = Math.max(SH * .08, Math.min(SH * .82, f.y)); f.x = Math.max(-40, Math.min(SW + 40, f.x));
      if(Math.abs(f.vx) > 4 * SS) f.face += ((f.vx > 0 ? 1 : -1) - f.face) * Math.min(1, dt * 6);
    });
    if(scare) scare.t -= dt;
  }
  function drawScene(t, dt){
    var c = sc;
    var g = c.createLinearGradient(0, 0, 0, SH);
    g.addColorStop(0, '#0e6f8f'); g.addColorStop(.45, '#0a4d6e'); g.addColorStop(1, '#06243a');
    c.fillStyle = g; c.fillRect(0, 0, SW, SH);
    c.save(); c.globalCompositeOperation = 'lighter';
    for(var i = 0; i < 6; i++){
      var x = (i + .5) * SW / 6 + Math.sin(t * .23 + i) * 40 * SS, w = (40 + 30 * Math.sin(t * .4 + i * 2)) * SS;
      var lg = c.createLinearGradient(0, 0, 0, SH * .9); lg.addColorStop(0, 'rgba(180,240,255,.16)'); lg.addColorStop(1, 'rgba(180,240,255,0)');
      c.fillStyle = lg; c.beginPath(); c.moveTo(x - w * .3, 0); c.lineTo(x + w * .3, 0); c.lineTo(x + w * 1.6, SH * .9); c.lineTo(x - w * .6, SH * .9); c.fill();
    }
    c.restore();
    rocks.forEach(function(r){ c.fillStyle = r.c; c.beginPath(); c.ellipse(r.x, SH * .86, r.w / 2, r.h, 0, Math.PI, 0); c.fill(); });
    plants.forEach(function(p){ if(p.back) plant(c, p, t, .55); });
    var sg = c.createLinearGradient(0, SH * .82, 0, SH); sg.addColorStop(0, '#c9b07a'); sg.addColorStop(1, '#8a7348');
    c.fillStyle = sg; c.beginPath(); c.moveTo(0, SH);
    for(var sx = 0; sx <= SW; sx += 24) c.lineTo(sx, SH * .85 + Math.sin(sx * .02) * 5 * SS + Math.sin(sx * .007 + 1) * 9 * SS);
    c.lineTo(SW, SH); c.fill();
    c.save(); c.globalCompositeOperation = 'lighter';
    for(i = 0; i < 26; i++){
      var cx = ((i * 97.3) % SW) + Math.sin(t * .8 + i) * 20 * SS, cy = SH * (.87 + ((i * 37) % 11) / 100);
      var cr = (10 + (i % 5) * 4) * SS * (1 + .3 * Math.sin(t * 1.7 + i));
      c.strokeStyle = 'rgba(255,255,220,.22)'; c.lineWidth = 2 * SS;
      c.beginPath(); c.ellipse(cx, cy, cr, cr * .35, Math.sin(t + i) * .3, 0, TAU); c.stroke();
    }
    c.restore();
    sandSeed.forEach(function(s){ c.fillStyle = 'rgba(90,70,40,.45)'; c.fillRect(s[0], SH * (.88 + s[1] * .11), s[2], s[2]); });
    stepFish(dt, t);
    fish.forEach(function(f){ if(f.z < .95) drawFish(c, f, t); });
    plants.forEach(function(p){ if(!p.back) plant(c, p, t, 1); });
    fish.forEach(function(f){ if(f.z >= .95) drawFish(c, f, t); });
    if(Math.random() < dt * 6) bubbles.push({x: SW * .12 + rand(-6, 6) * SS, y: SH * .86, r: rand(2, 6) * SS, v: rand(40, 80) * SS, ph: rand(0, TAU)});
    if(Math.random() < dt * 2) bubbles.push({x: rand(0, SW), y: SH * .9, r: rand(1.5, 3.5) * SS, v: rand(30, 60) * SS, ph: rand(0, TAU)});
    c.strokeStyle = 'rgba(220,250,255,.7)'; c.lineWidth = 1.2 * SS;
    for(i = bubbles.length - 1; i >= 0; i--){ var b = bubbles[i]; b.y -= b.v * dt; b.x += Math.sin(t * 3 + b.ph) * .5 * SS;
      if(b.y < -10){ bubbles.splice(i, 1); continue; }
      c.beginPath(); c.arc(b.x, b.y, b.r, 0, TAU); c.stroke(); c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(b.x - b.r * .3, b.y - b.r * .3, b.r * .3, 0, TAU); c.fill(); }
    c.fillStyle = '#2b2e36'; c.fillRect(SW * .12 - 8 * SS, SH * .84, 16 * SS, 10 * SS);
    var vg = c.createRadialGradient(SW / 2, SH / 2, Math.min(SW, SH) * .35, SW / 2, SH / 2, Math.max(SW, SH) * .75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,10,20,.55)'); c.fillStyle = vg; c.fillRect(0, 0, SW, SH);
  }
  function plant(c, p, t, a){
    c.globalAlpha = a;
    for(var k = 0; k < p.blades; k++){
      var x0 = p.x + (k - p.blades / 2) * p.w * .6, base = SH * .87, sway = Math.sin(t * .9 + p.ph + k) * 26 * SS;
      c.fillStyle = p.col; c.beginPath(); c.moveTo(x0 - p.w / 2, base);
      c.bezierCurveTo(x0 - p.w / 2 + sway * .3, base - p.h * .35, x0 + sway * .8 - p.w * .3, base - p.h * .7, x0 + sway, base - p.h * (1 - k * .08));
      c.bezierCurveTo(x0 + sway * .8 + p.w * .3, base - p.h * .7, x0 + p.w / 2 + sway * .3, base - p.h * .35, x0 + p.w / 2, base); c.fill();
    }
    c.globalAlpha = 1;
  }

  /* =====================================================================
     WEBGL LIQUID: ripple refraction + color-bloom fluid
     ===================================================================== */
  var gl = null, ok = false;
  try{ gl = glCanvas.getContext('webgl2', {alpha: false, antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: false}); }catch(e){}
  if(gl && gl.getExtension('EXT_color_buffer_float')){ gl.getExtension('OES_texture_float_linear'); ok = true; }
  if(!ok){ glCanvas.style.display = 'none'; sceneCanvas.classList.add('fallback'); }

  var VS = 'precision highp float;attribute vec2 aPos;varying vec2 vUv;varying vec2 vL;varying vec2 vR;varying vec2 vT;varying vec2 vB;uniform vec2 texel;' +
    'void main(){vUv=aPos*.5+.5;vL=vUv-vec2(texel.x,0.);vR=vUv+vec2(texel.x,0.);vT=vUv+vec2(0.,texel.y);vB=vUv-vec2(0.,texel.y);gl_Position=vec4(aPos,0.,1.);}';
  var FS = {
    splat: 'precision highp float;varying vec2 vUv;uniform sampler2D uTarget;uniform float aspect;uniform vec3 color;uniform vec2 point;uniform float radius;' +
      'void main(){vec2 p=vUv-point;p.x*=aspect;vec3 s=exp(-dot(p,p)/radius)*color;gl_FragColor=vec4(texture2D(uTarget,vUv).xyz+s,1.);}',
    advect: 'precision highp float;varying vec2 vUv;uniform sampler2D uVelocity;uniform sampler2D uSource;uniform vec2 texel;uniform float dt;uniform float dissipation;' +
      'void main(){vec2 c=vUv-dt*texture2D(uVelocity,vUv).xy*texel;gl_FragColor=texture2D(uSource,c)/(1.+dissipation*dt);}',
    divergence: 'precision highp float;varying vec2 vUv;varying vec2 vL;varying vec2 vR;varying vec2 vT;varying vec2 vB;uniform sampler2D uVelocity;' +
      'void main(){float L=texture2D(uVelocity,vL).x;float R=texture2D(uVelocity,vR).x;float T=texture2D(uVelocity,vT).y;float B=texture2D(uVelocity,vB).y;vec2 C=texture2D(uVelocity,vUv).xy;' +
      'if(vL.x<0.)L=-C.x;if(vR.x>1.)R=-C.x;if(vT.y>1.)T=-C.y;if(vB.y<0.)B=-C.y;gl_FragColor=vec4(.5*(R-L+T-B),0.,0.,1.);}',
    curl: 'precision highp float;varying vec2 vUv;varying vec2 vL;varying vec2 vR;varying vec2 vT;varying vec2 vB;uniform sampler2D uVelocity;' +
      'void main(){float L=texture2D(uVelocity,vL).y;float R=texture2D(uVelocity,vR).y;float T=texture2D(uVelocity,vT).x;float B=texture2D(uVelocity,vB).x;gl_FragColor=vec4(.5*(R-L-T+B),0.,0.,1.);}',
    vorticity: 'precision highp float;varying vec2 vUv;varying vec2 vL;varying vec2 vR;varying vec2 vT;varying vec2 vB;uniform sampler2D uVelocity;uniform sampler2D uCurl;uniform float curl;uniform float dt;' +
      'void main(){float L=texture2D(uCurl,vL).x;float R=texture2D(uCurl,vR).x;float T=texture2D(uCurl,vT).x;float B=texture2D(uCurl,vB).x;float C=texture2D(uCurl,vUv).x;' +
      'vec2 f=.5*vec2(abs(T)-abs(B),abs(R)-abs(L));f/=length(f)+.0001;f*=curl*C;f.y*=-1.;vec2 v=texture2D(uVelocity,vUv).xy+f*dt;gl_FragColor=vec4(clamp(v,-1000.,1000.),0.,1.);}',
    pressure: 'precision highp float;varying vec2 vUv;varying vec2 vL;varying vec2 vR;varying vec2 vT;varying vec2 vB;uniform sampler2D uPressure;uniform sampler2D uDivergence;' +
      'void main(){float L=texture2D(uPressure,vL).x;float R=texture2D(uPressure,vR).x;float T=texture2D(uPressure,vT).x;float B=texture2D(uPressure,vB).x;float d=texture2D(uDivergence,vUv).x;gl_FragColor=vec4((L+R+B+T-d)*.25,0.,0.,1.);}',
    gradient: 'precision highp float;varying vec2 vUv;varying vec2 vL;varying vec2 vR;varying vec2 vT;varying vec2 vB;uniform sampler2D uPressure;uniform sampler2D uVelocity;' +
      'void main(){float L=texture2D(uPressure,vL).x;float R=texture2D(uPressure,vR).x;float T=texture2D(uPressure,vT).x;float B=texture2D(uPressure,vB).x;vec2 v=texture2D(uVelocity,vUv).xy-vec2(R-L,T-B);gl_FragColor=vec4(v,0.,1.);}',
    scale: 'precision highp float;varying vec2 vUv;uniform sampler2D uTexture;uniform float value;void main(){gl_FragColor=value*texture2D(uTexture,vUv);}',
    ripple: 'precision highp float;varying vec2 vUv;uniform sampler2D uState;uniform vec2 texel;' +
      'void main(){vec4 s=texture2D(uState,vUv);float avg=(texture2D(uState,vUv+vec2(texel.x,0.)).r+texture2D(uState,vUv-vec2(texel.x,0.)).r+texture2D(uState,vUv+vec2(0.,texel.y)).r+texture2D(uState,vUv-vec2(0.,texel.y)).r)*.25;' +
      's.g+=(avg-s.r)*2.;s.g*=.986;s.r+=s.g;s.r*=.997;gl_FragColor=s;}',
    drop: 'precision highp float;varying vec2 vUv;uniform sampler2D uState;uniform vec2 point;uniform float radius;uniform float strength;uniform float aspect;' +
      'void main(){vec4 s=texture2D(uState,vUv);vec2 p=vUv-point;p.x*=aspect;float d=max(0.,1.-length(p)/radius);d=.5-cos(d*3.14159265)*.5;s.r+=d*strength;gl_FragColor=s;}',
    display: 'precision highp float;varying vec2 vUv;uniform sampler2D uScene;uniform sampler2D uRipple;uniform sampler2D uDye;uniform vec2 rTexel;uniform float time;uniform float glow;' +
      'vec3 hue(float h){return clamp(abs(mod(h*6.+vec3(0.,4.,2.),6.)-3.)-1.,0.,1.);}' +
      'void main(){float hL=texture2D(uRipple,vUv-vec2(rTexel.x,0.)).r;float hR=texture2D(uRipple,vUv+vec2(rTexel.x,0.)).r;float hB=texture2D(uRipple,vUv-vec2(0.,rTexel.y)).r;float hT=texture2D(uRipple,vUv+vec2(0.,rTexel.y)).r;' +
      'vec2 n=vec2(hL-hR,hB-hT);vec2 uv=clamp(vUv+n*.6,0.,1.);vec3 col=texture2D(uScene,uv).rgb;' +
      'float sl=length(n);vec3 N=normalize(vec3(n*6.,1.));float spec=pow(max(dot(N,normalize(vec3(-.35,.5,1.))),0.),60.);' +
      'col+=spec*.55*vec3(.9,.97,1.);col+=hue(time*.05+vUv.x*.4+vUv.y*.3)*clamp(sl*7.,0.,1.)*.45*glow;' +
      'vec3 dye=texture2D(uDye,uv).rgb;float a=clamp(max(dye.r,max(dye.g,dye.b)),0.,1.);' +
      'col=col*(1.-a*.45)+dye*.95;gl_FragColor=vec4(col,1.);}'
  };

  var progs = {}, quadBuf, simW, simH, dyeW, dyeH, rippleW, rippleH, vel, dye, prs, div, crl, rip, sceneTex;
  function compile(type, src){ var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
  function program(fs){
    var p = gl.createProgram(); gl.attachShader(p, compile(gl.VERTEX_SHADER, VS)); gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, 'aPos'); gl.linkProgram(p);
    if(!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    var u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for(var i = 0; i < n; i++){ var nm = gl.getActiveUniform(p, i).name; u[nm] = gl.getUniformLocation(p, nm); }
    return {p: p, u: u};
  }
  function fbo(w, h, filter){
    var tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    var fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    return {tex: tex, fb: fb, w: w, h: h};
  }
  function dbl(w, h, filter){ var a = fbo(w, h, filter), b = fbo(w, h, filter); return {r: a, w: b, swap: function(){ var t = this.r; this.r = this.w; this.w = t; }, tw: 1 / w, th: 1 / h}; }
  function bindTex(unit, tex){ gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); return unit; }
  function blit(target){
    if(target){ gl.bindFramebuffer(gl.FRAMEBUFFER, target.fb); gl.viewport(0, 0, target.w, target.h); }
    else { gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight); }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  function use(name){ var pr = progs[name]; gl.useProgram(pr.p); return pr.u; }
  function initGL(){
    for(var k in FS) progs[k] = program(FS[k]);
    quadBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    sceneTex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, sceneTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }
  function res(base){ var a = W / H; return a > 1 ? [Math.round(base * a), base] : [base, Math.round(base / a)]; }
  function initTargets(){
    var s = res(128), d = res(Math.min(720, Math.max(512, Math.round(Math.max(W, H) * DPR * .5)))), r = res(256);
    simW = s[0]; simH = s[1]; dyeW = d[0]; dyeH = d[1]; rippleW = r[0]; rippleH = r[1];
    vel = dbl(simW, simH, gl.LINEAR); dye = dbl(dyeW, dyeH, gl.LINEAR); prs = dbl(simW, simH, gl.NEAREST);
    div = fbo(simW, simH, gl.NEAREST); crl = fbo(simW, simH, gl.NEAREST); rip = dbl(rippleW, rippleH, gl.LINEAR);
  }

  /* ---------- flow styles (double-tap to change) ---------- */
  var MODES = [
    {name: 'Rainbow Bloom',  curl: 22, dyeFade: .9, velFade: .25, radius: .22, force: 5200, burst: 0, col: function(t){ return hsv(t * .3 % 1, .85, 1); }},
    {name: 'Neon Jellyfish', curl: 38, dyeFade: .6, velFade: .2,  radius: .16, force: 6000, burst: 0, col: function(t){ return Math.sin(t * 2) > 0 ? [0, 1, 1] : [1, 0, .8]; }},
    {name: 'Lava Lamp',      curl: 6,  dyeFade: .35, velFade: .6, radius: .45, force: 2600, burst: 0, col: function(t){ return hsv(.02 + Math.sin(t) * .05, .95, 1); }},
    {name: 'Galaxy Swirl',   curl: 60, dyeFade: .7, velFade: .15, radius: .14, force: 6500, burst: 6, col: function(t){ return hsv(.62 + Math.sin(t * .7) * .12, .8, 1); }},
    {name: 'Ocean Ink',      curl: 14, dyeFade: 1.2, velFade: .3, radius: .3,  force: 4200, burst: 0, col: function(t){ return hsv(.48 + Math.sin(t * .5) * .06, .9, .9); }},
    {name: 'Firework Bloom', curl: 30, dyeFade: 1.0, velFade: .2, radius: .12, force: 7000, burst: 12, col: function(){ return hsv(Math.random(), 1, 1); }}
  ];
  var mode = 0;
  function hsv(h, s, v){ var i = Math.floor(h * 6), f = h * 6 - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s), r, g, b;
    switch(((i % 6) + 6) % 6){ case 0: r = v; g = t; b = p; break; case 1: r = q; g = v; b = p; break; case 2: r = p; g = v; b = t; break; case 3: r = p; g = q; b = v; break; case 4: r = t; g = p; b = v; break; default: r = v; g = p; b = q; }
    return [r, g, b]; }

  function splat(x, y, dx, dy, color, radiusScale){
    var u = use('splat'), m = MODES[mode];
    gl.uniform1f(u.aspect, W / H); gl.uniform2f(u.point, x, y); gl.uniform1f(u.radius, (m.radius / 100) * (radiusScale || 1) * (W > H ? W / H : 1));
    gl.uniform1i(u.uTarget, bindTex(0, vel.r.tex)); gl.uniform3f(u.color, dx, dy, 0); gl.uniform2f(u.texel, vel.tw, vel.th); blit(vel.w); vel.swap();
    gl.uniform1i(u.uTarget, bindTex(0, dye.r.tex)); gl.uniform3f(u.color, color[0] * .28, color[1] * .28, color[2] * .28); blit(dye.w); dye.swap();
  }
  function drop(x, y, radius, strength){
    if(!ok) return;
    var u = use('drop'); gl.uniform1f(u.aspect, W / H); gl.uniform2f(u.point, x, y); gl.uniform1f(u.radius, radius); gl.uniform1f(u.strength, strength);
    gl.uniform2f(u.texel, rip.tw, rip.th); gl.uniform1i(u.uState, bindTex(0, rip.r.tex)); blit(rip.w); rip.swap();
  }
  function stepFluid(dt){
    var m = MODES[mode], u;
    u = use('curl'); gl.uniform2f(u.texel, vel.tw, vel.th); gl.uniform1i(u.uVelocity, bindTex(0, vel.r.tex)); blit(crl);
    u = use('vorticity'); gl.uniform2f(u.texel, vel.tw, vel.th); gl.uniform1i(u.uVelocity, bindTex(0, vel.r.tex)); gl.uniform1i(u.uCurl, bindTex(1, crl.tex)); gl.uniform1f(u.curl, m.curl); gl.uniform1f(u.dt, dt); blit(vel.w); vel.swap();
    u = use('divergence'); gl.uniform2f(u.texel, vel.tw, vel.th); gl.uniform1i(u.uVelocity, bindTex(0, vel.r.tex)); blit(div);
    u = use('scale'); gl.uniform2f(u.texel, prs.tw, prs.th); gl.uniform1i(u.uTexture, bindTex(0, prs.r.tex)); gl.uniform1f(u.value, .8); blit(prs.w); prs.swap();
    u = use('pressure'); gl.uniform2f(u.texel, prs.tw, prs.th); gl.uniform1i(u.uDivergence, bindTex(0, div.tex));
    for(var i = 0; i < 20; i++){ gl.uniform1i(u.uPressure, bindTex(1, prs.r.tex)); blit(prs.w); prs.swap(); }
    u = use('gradient'); gl.uniform2f(u.texel, vel.tw, vel.th); gl.uniform1i(u.uPressure, bindTex(0, prs.r.tex)); gl.uniform1i(u.uVelocity, bindTex(1, vel.r.tex)); blit(vel.w); vel.swap();
    u = use('advect'); gl.uniform2f(u.texel, vel.tw, vel.th); gl.uniform1f(u.dt, dt);
    gl.uniform1i(u.uVelocity, bindTex(0, vel.r.tex)); gl.uniform1i(u.uSource, bindTex(0, vel.r.tex)); gl.uniform1f(u.dissipation, m.velFade); blit(vel.w); vel.swap();
    gl.uniform1i(u.uVelocity, bindTex(0, vel.r.tex)); gl.uniform1i(u.uSource, bindTex(1, dye.r.tex)); gl.uniform1f(u.dissipation, m.dyeFade); blit(dye.w); dye.swap();
    u = use('ripple'); gl.uniform2f(u.texel, rip.tw, rip.th);
    for(i = 0; i < 2; i++){ gl.uniform1i(u.uState, bindTex(0, rip.r.tex)); blit(rip.w); rip.swap(); }
  }
  var glow = 0;
  function render(t){
    gl.bindTexture(gl.TEXTURE_2D, sceneTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sceneCanvas);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    var u = use('display');
    gl.uniform2f(u.texel, 1 / W, 1 / H); gl.uniform2f(u.rTexel, rip.tw, rip.th); gl.uniform1f(u.time, t); gl.uniform1f(u.glow, glow);
    gl.uniform1i(u.uScene, bindTex(0, sceneTex)); gl.uniform1i(u.uRipple, bindTex(1, rip.r.tex)); gl.uniform1i(u.uDye, bindTex(2, dye.r.tex));
    blit(null);
  }

  /* =====================================================================
     SOUND: water ambience + touch splashes/swirls + CC0 jazz
     ===================================================================== */
  var ac = null, master = null, swishGain = null, swishFilter = null, jazz = null, audioOn = false;
  function noiseBuffer(sec, brown){
    var b = ac.createBuffer(1, ac.sampleRate * sec, ac.sampleRate), d = b.getChannelData(0), last = 0;
    for(var i = 0; i < d.length; i++){ var w = Math.random() * 2 - 1; if(brown){ last = (last + .02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; }
    return b;
  }
  function startAudio(){
    if(audioOn) return; audioOn = true;
    try{
      var AC = window.AudioContext || window.webkitAudioContext; ac = new AC();
      master = ac.createGain(); master.gain.value = .9; master.connect(ac.destination);
      var amb = ac.createBufferSource(); amb.buffer = noiseBuffer(6, true); amb.loop = true;
      var lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520;
      var ag = ac.createGain(); ag.gain.value = .0001; ag.gain.exponentialRampToValueAtTime(.32, ac.currentTime + 2.5);
      var lfo = ac.createOscillator(), lfoG = ac.createGain(); lfo.frequency.value = .12; lfoG.gain.value = 180; lfo.connect(lfoG); lfoG.connect(lp.frequency); lfo.start();
      amb.connect(lp); lp.connect(ag); ag.connect(master); amb.start();
      var sw = ac.createBufferSource(); sw.buffer = noiseBuffer(3, false); sw.loop = true;
      swishFilter = ac.createBiquadFilter(); swishFilter.type = 'bandpass'; swishFilter.frequency.value = 700; swishFilter.Q.value = .8;
      swishGain = ac.createGain(); swishGain.gain.value = 0;
      sw.connect(swishFilter); swishFilter.connect(swishGain); swishGain.connect(master); sw.start();
      (function bubbleLoop(){ if(!document.hidden) blip(rand(500, 1400), .03); setTimeout(bubbleLoop, rand(700, 2600)); })();
    }catch(e){}
    jazz = new Audio('/audio/jazz-loop.mp3'); jazz.loop = true; jazz.volume = .16; jazz.preload = 'auto';
    jazz.play().catch(function(){});
  }
  function blip(f, vol){
    if(!ac) return;
    var t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 2.6, t + .07);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + .12);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + .15);
  }
  function splashSound(power){
    if(!ac) return;
    var t = ac.currentTime;
    blip(rand(220, 380), .18 * power + .05);
    var s = ac.createBufferSource(); s.buffer = noiseBuffer(.5, false);
    var f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(2200, t); f.frequency.exponentialRampToValueAtTime(500, t + .35); f.Q.value = 1.2;
    var g = ac.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.22 * power + .04, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + .45);
    s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + .5);
    for(var i = 0; i < 3; i++) setTimeout(function(){ blip(rand(700, 1600), .05); }, 60 + i * rand(40, 90));
  }
  function chime(){
    if(!ac) return;
    var t = ac.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach(function(f, i){
      var o = ac.createOscillator(), g = ac.createGain(); o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(.0001, t + i * .07); g.gain.exponentialRampToValueAtTime(.08, t + i * .07 + .02); g.gain.exponentialRampToValueAtTime(.0001, t + i * .07 + .9);
      o.connect(g); g.connect(master); o.start(t + i * .07); o.stop(t + i * .07 + 1);
    });
  }
  function swish(speed){
    if(!swishGain) return;
    var t = ac.currentTime, v = Math.min(.28, speed * .00012);
    swishGain.gain.setTargetAtTime(v, t, .05); swishFilter.frequency.setTargetAtTime(400 + Math.min(2400, speed * .6), t, .08);
  }

  /* =====================================================================
     INPUT: touch / mouse
     ===================================================================== */
  var started = false, pointers = {}, ghosts = [], lastTap = {t: 0, x: 0, y: 0}, T = 0;
  function begin(){
    if(started) return; started = true;
    hint.classList.add('gone');
    startAudio();
    if(window.Buddy && Buddy.wake) Buddy.wake();
  }
  function showToast(text){ toast.textContent = text; toast.classList.remove('show'); void toast.offsetWidth; toast.classList.add('show'); }
  function nextMode(x, y){
    mode = (mode + 1) % MODES.length;
    showToast(MODES[mode].name);
    chime();
    burst(x, y, 10);
  }
  function burst(x, y, n){
    if(!ok) return;
    var m = MODES[mode];
    for(var i = 0; i < n; i++){
      var a = i / n * TAU + rand(-.2, .2), sp = m.force * .0012 * rand(.6, 1.2);
      splat(x / W, 1 - y / H, Math.cos(a) * sp * 600, -Math.sin(a) * sp * 600, scaleC(m.col(T + i * .1), .7), .8);
    }
  }
  function scaleC(c, k){ return [c[0] * k, c[1] * k, c[2] * k]; }
  function down(e){
    if(window.Buddy && Buddy.tryGrab && Buddy.tryGrab(e)) { begin(); return; }
    begin();
    var p = {id: e.pointerId, x: e.clientX, y: e.clientY, vx: 0, vy: 0, t: performance.now()};
    pointers[e.pointerId] = p;
    var now = performance.now();
    if(now - lastTap.t < 320 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 60){ nextMode(e.clientX, e.clientY); lastTap.t = 0; }
    else lastTap = {t: now, x: e.clientX, y: e.clientY};
    scare = {x: e.clientX * SW / W, y: e.clientY * SH / H, t: 1.2};
    drop(e.clientX / W, 1 - e.clientY / H, .05, .9);
    if(ok){ var m = MODES[mode]; splat(e.clientX / W, 1 - e.clientY / H, 0, 0, scaleC(m.col(T), 1), 1.4); if(m.burst) burst(e.clientX, e.clientY, m.burst); }
    splashSound(.7);
  }
  function move(e){
    var p = pointers[e.pointerId]; if(!p) return;
    var now = performance.now(), dtm = Math.max(1, now - p.t) / 1000;
    var dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.vx = p.vx * .6 + (dx / dtm) * .4; p.vy = p.vy * .6 + (dy / dtm) * .4;
    p.x = e.clientX; p.y = e.clientY; p.t = now;
    if(ok){ var m = MODES[mode];
      splat(p.x / W, 1 - p.y / H, dx * m.force / W, -dy * m.force / H, scaleC(m.col(T), .55), 1); }
    if(Math.random() < .5) drop(p.x / W, 1 - p.y / H, .025, .35);
    scare = {x: p.x * SW / W, y: p.y * SH / H, t: .6};
    swish(Math.hypot(p.vx, p.vy));
  }
  function up(e){
    var p = pointers[e.pointerId]; if(!p) return;
    delete pointers[e.pointerId];
    var sp = Math.hypot(p.vx, p.vy);
    if(sp > 120) ghosts.push({x: p.x, y: p.y, vx: p.vx, vy: p.vy, life: 1});
    if(!Object.keys(pointers).length) swish(0);
  }
  glCanvas.addEventListener('pointerdown', down);
  sceneCanvas.addEventListener('pointerdown', down);
  window.addEventListener('pointermove', function(e){ if(window.Buddy && Buddy.isGrabbing && Buddy.isGrabbing(e)) return; move(e); }, {passive: true});
  window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  window.addEventListener('keydown', function(e){ if(e.code === 'Space'){ begin(); nextMode(W / 2, H / 2); } });

  function stepGhosts(dt){
    for(var i = ghosts.length - 1; i >= 0; i--){
      var g = ghosts[i], ox = g.x, oy = g.y;
      g.x += g.vx * dt; g.y += g.vy * dt; g.vx *= Math.pow(.25, dt); g.vy *= Math.pow(.25, dt); g.life -= dt * 1.1;
      if(g.x < 0 || g.x > W){ g.vx *= -.6; g.x = Math.max(0, Math.min(W, g.x)); }
      if(g.y < 0 || g.y > H){ g.vy *= -.6; g.y = Math.max(0, Math.min(H, g.y)); }
      if(g.life <= 0){ ghosts.splice(i, 1); continue; }
      if(ok){ var m = MODES[mode];
        splat(g.x / W, 1 - g.y / H, (g.x - ox) * m.force / W, -(g.y - oy) * m.force / H, scaleC(m.col(T), .5 * g.life), .9); }
      if(Math.random() < .3) drop(g.x / W, 1 - g.y / H, .02, .25 * g.life);
      if(ac && swishGain && !Object.keys(pointers).length) swish(Math.hypot(g.vx, g.vy) * g.life);
    }
  }

  /* public hooks for the 3D buddy */
  window.Aqua = {
    splash: function(x, y, power){
      if(!started) return;
      drop(x / W, 1 - y / H, .06 + power * .05, .9 + power * 1.2);
      if(ok){ var m = MODES[mode]; splat(x / W, 1 - y / H, 0, 0, scaleC(m.col(T), .6 + power), 1.2 + power); burst(x, y, Math.round(4 + power * 8)); }
      scare = {x: x * SW / W, y: y * SH / H, t: 1.5};
      splashSound(Math.min(1, .4 + power));
    },
    started: function(){ return started; },
    audio: function(){ return ac; }
  };

  /* =====================================================================
     LOOP + RESIZE
     ===================================================================== */
  function resize(){
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    W = window.innerWidth; H = window.innerHeight;
    glCanvas.width = Math.round(W * DPR); glCanvas.height = Math.round(H * DPR);
    sizeScene();
    if(ok) initTargets();
  }
  if(ok){ try{ initGL(); }catch(err){ ok = false; glCanvas.style.display = 'none'; sceneCanvas.classList.add('fallback'); } }
  resize();
  var rz; window.addEventListener('resize', function(){ clearTimeout(rz); rz = setTimeout(resize, 160); });
  var last = performance.now();
  function frame(now){
    var dt = Math.min(.033, (now - last) / 1000); last = now;
    if(!document.hidden){
      T += dt;
      drawScene(T, RM ? dt * .3 : dt);
      if(ok){
        stepGhosts(dt);
        glow += ((started ? 1 : 0) - glow) * Math.min(1, dt * 2);
        stepFluid(dt);
        render(T);
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  document.addEventListener('visibilitychange', function(){
    if(!jazz) return;
    if(document.hidden){ jazz.pause(); if(ac) ac.suspend(); } else { jazz.play().catch(function(){}); if(ac) ac.resume(); }
  });
})();
