/* jerica.pro — shared chrome + music player (2026 Site Standard rebuild)
   Header, footer, live wallpaper and the music player are injected here so
   every page matches. 100% client-side: this site collects nothing.
   Music behavior (browser law, implemented honestly): the playlist starts
   on page load MUTED — browsers block autoplay with sound. The first tap
   anywhere (or the big TAP FOR SOUND button) turns the sound on. */
(function(){
  var path = location.pathname;
  var NAV = [
    {href:'/',          label:'Home',       match:function(p){return p==='/'||p.endsWith('/index.html');}},
    {href:'/study.html',label:'Study Hive', match:function(p){return p.indexOf('study')>-1||p.indexOf('games')>-1||p.indexOf('studio')>-1||p.indexOf('friends')>-1;}},
    {href:'/music.html',label:'Music',      match:function(p){return p.indexOf('music')>-1;}},
    {href:'/videos.html',label:'Videos',    match:function(p){return p.indexOf('videos')>-1;}},
    {href:'/about.html',label:'About',      match:function(p){return p.indexOf('about')>-1;}}
  ];
  function navLinks(homeOnly){
    return NAV.filter(function(n){ return !homeOnly || n.href === '/'; }).map(function(n){
      var cur = n.match(path) ? ' aria-current="page"' : '';
      return '<a href="'+n.href+'"'+cur+'>'+n.label+'</a>';
    }).join('');
  }

  /* ----- live wallpaper + floaties ----- */
  if(!document.querySelector('.wallpaper')){
    var wp = document.createElement('div'); wp.className='wallpaper'; wp.setAttribute('aria-hidden','true');
    document.body.insertBefore(wp, document.body.firstChild);
    var fl = document.createElement('div'); fl.className='floaties'; fl.setAttribute('aria-hidden','true');
    var glyphs=['★','♪','⚡','✦','♫','✿'];
    var spots=[[6,12],[88,18],[14,72],[76,82],[48,8],[94,55],[30,90]];
    fl.innerHTML = spots.map(function(s,i){
      return '<span style="left:'+s[0]+'%;top:'+s[1]+'%;animation-delay:'+(i*1.3)+'s">'+glyphs[i%glyphs.length]+'</span>';
    }).join('');
    document.body.insertBefore(fl, wp.nextSibling);
  }

  /* ----- header ----- */
  var head = document.getElementById('site-head');
  if(head){
    head.innerHTML =
      '<div class="head-in">' +
      '<a class="logo" href="/" aria-label="jerica.pro — home">JER<span class="alt">I</span>CA.PRO 🦇</a>' +
      '<nav class="main-nav" aria-label="Main pages">' + navLinks(true) + '</nav>' +
      '<button class="burger" id="burger" aria-label="Open menu" aria-expanded="false" aria-controls="popout">' +
        '<span class="bars" aria-hidden="true"><i></i><i></i><i></i></span></button>' +
      '</div>';
    var pop = document.createElement('div');
    pop.className='popout'; pop.id='popout';
    pop.innerHTML = '<div class="scrim" data-close></div>' +
      '<div class="panel" role="dialog" aria-modal="true" aria-label="Site menu">' +
      '<nav aria-label="All pages">' + navLinks() +
      '<a href="/games.html">🎮 The Arcade</a>' +
      '<a href="/studio.html">🎨 Maker Studio</a>' +
      '<a href="/friends.html">💛 Friends Zone</a></nav>' +
      '<p class="pop-note">stay spooky — no boring allowed 🦇</p></div>';
    document.body.appendChild(pop);
    var burger = document.getElementById('burger');
    function setPop(open){
      pop.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }
    burger.addEventListener('click', function(){ setPop(!pop.classList.contains('open')); });
    pop.addEventListener('click', function(e){ if(e.target.hasAttribute('data-close')) setPop(false); });
    document.addEventListener('keydown', function(e){ if(e.key==='Escape') setPop(false); });
  }


  /* ----- footer ----- */
  var foot = document.getElementById('site-foot');
  if(foot){
    foot.innerHTML = '<div class="foot-in">' +
      '<div><h3>JERICA.PRO</h3><p class="dim">Games, makers, study tools and loud music.</p></div>' +
      '<div><h3>THIS SITE</h3><ul>' +
      '<li><a href="/">Home</a></li><li><a href="/study.html">Study Hive</a></li>' +
      '<li><a href="/music.html">Music</a></li><li><a href="/videos.html">Videos</a></li>' +
      '<li><a href="/about.html">About</a></li><li><a href="/games.html">The Arcade</a></li>' +
      '<li><a href="/studio.html">Maker Studio</a></li><li><a href="/friends.html">Friends Zone</a></li></ul></div>' +
      '</div>' +
      '<p class="foot-fine">🔒 No public accounts, no sign-ups, no uploads. The Friends Message Board is invite-only and text-only, and its messages auto-delete after 30 days. ' +
      'Everything you make lives on your own device. Ads, when shown, are set to child-directed / non-personalized mode. ' +
      'Background videos: official Nirvana music videos, played from YouTube.</p>';
  }


  /* ----- scroll reveal ----- */
  var revealEls = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window && revealEls.length){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
    }, {threshold:.12});
    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('in'); });
  }

  /* ----- button ripple / click effect ----- */
  document.addEventListener('click', function(e){
    var btn = e.target.closest ? e.target.closest('.btn') : null;
    if(!btn) return;
    var r = btn.getBoundingClientRect();
    var rip = document.createElement('span'); rip.className='ripple';
    var size = Math.max(r.width, r.height);
    rip.style.width = rip.style.height = size + 'px';
    rip.style.left = (e.clientX - r.left - size/2) + 'px';
    rip.style.top = (e.clientY - r.top - size/2) + 'px';
    btn.appendChild(rip);
    setTimeout(function(){ rip.remove(); }, 600);
  });
  /* ----- NIRVANA BACKGROUND VIDEOS (every page) -----
     Official videos from Nirvana's YouTube channel fill the whole background
     in random order. Browsers only allow autoplay when muted, so they start
     muted and the first tap anywhere turns the sound on. */
  var VIDS = [
    {id:'hTWKbfoikeg', t:'Smells Like Teen Spirit'},
    {id:'vabnZ9-ex7o', t:'Come As You Are'},
    {id:'pkcJEvMcnEg', t:'Lithium'},
    {id:'PbgKEjNBHqM', t:'In Bloom'},
    {id:'fregObNcHC8', t:'The Man Who Sold The World (MTV Unplugged)'},
    {id:'aWmkuH1k7uA', t:'All Apologies (MTV Unplugged)'},
    {id:'AhcttcXcRYY', t:'About A Girl (MTV Unplugged)'},
    {id:'hEMm7gxBYSc', t:'Where Did You Sleep Last Night (MTV Unplugged)'}
  ];
  var bag = [], vidIdx = -1, soundOn = false, ytReady = false, held = false;
  function shuffled(){ var a = VIDS.slice(); for(var i = a.length - 1; i > 0; i--){ var j = Math.random() * (i + 1) | 0, t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function nextVid(){ if(!bag.length){ bag = shuffled(); if(cur && bag[0].id === cur.id) bag.push(bag.shift()); } return bag.shift(); }
  var cur = nextVid();
  document.body.classList.add('has-vbg');
  document.body.setAttribute('data-noweb', '');
  var vbg = document.createElement('div'); vbg.className = 'vbg'; vbg.setAttribute('aria-hidden', 'true');
  var ifr = document.createElement('iframe');
  ifr.title = 'Background video'; ifr.tabIndex = -1;
  ifr.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
  ifr.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
  ifr.src = 'https://www.youtube-nocookie.com/embed/' + cur.id + '?autoplay=1&mute=1&controls=0&disablekb=1&modestbranding=1&playsinline=1&rel=0&iv_load_policy=3&fs=0&enablejsapi=1&origin=' + encodeURIComponent(location.origin);
  vbg.appendChild(ifr);
  var shade = document.createElement('div'); shade.className = 'vbg-shade'; shade.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(shade, document.body.firstChild);
  document.body.insertBefore(vbg, document.body.firstChild);
  function cmd(func, args){ try{ ifr.contentWindow.postMessage(JSON.stringify({event:'command', func:func, args:args || []}), '*'); }catch(e){} }
  ifr.addEventListener('load', function(){
    try{ ifr.contentWindow.postMessage(JSON.stringify({event:'listening', id:1, channel:'widget'}), '*'); }catch(e){}
    cmd('addEventListener', ['onStateChange']);
    if(soundOn && !held){ cmd('unMute'); cmd('setVolume', [85]); }
  });

  var bar = document.createElement('div');
  bar.className = 'vbar'; bar.id = 'vbar'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Background music videos');
  bar.innerHTML = '<span class="vb-disc" aria-hidden="true">🎸</span>' +
    '<span class="vb-now"><b>NIRVANA</b><span id="vbTitle" aria-live="polite"></span></span>' +
    '<button class="vb-btn" id="vbSound" type="button" data-say="sound">🔇 TAP FOR SOUND</button>' +
    '<button class="vb-btn" id="vbNext" type="button" data-say="next song" aria-label="Next song">⏭</button>';
  document.body.appendChild(bar);
  var elT = document.getElementById('vbTitle'), elS = document.getElementById('vbSound');
  elT.textContent = cur.t;
  function setSound(on){
    soundOn = on;
    elS.textContent = on ? '🔊 SOUND ON' : '🔇 TAP FOR SOUND';
    elS.setAttribute('aria-pressed', on ? 'true' : 'false');
    if(on && !held){ cmd('unMute'); cmd('setVolume', [85]); cmd('playVideo'); } else cmd('mute');
  }
  function play(v){ cur = v; elT.textContent = v.t; cmd('loadVideoById', [{videoId: v.id}]); if(soundOn && !held){ cmd('unMute'); } }
  window.addEventListener('message', function(e){
    if(!/youtube(-nocookie)?\.com$/.test((e.origin || '').replace(/^https?:\/\//, ''))) return;
    var d; try{ d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; }catch(err){ return; }
    if(!d) return;
    var state = d.event === 'onStateChange' ? d.info : (d.info && typeof d.info.playerState === 'number' ? d.info.playerState : null);
    if(state === 0) play(nextVid());
    if(state === 1 && !ytReady){ ytReady = true; if(soundOn && !held){ cmd('unMute'); cmd('setVolume', [85]); } }
  });
  elS.addEventListener('click', function(){ setSound(!soundOn); });
  document.getElementById('vbNext').addEventListener('click', function(){ play(nextVid()); });
  /* first tap anywhere = sound on (the home gate handles its own entrance) */
  document.addEventListener('pointerdown', function firstTap(e){
    if(document.querySelector('.gate')) return;
    if(e.target.closest && e.target.closest('#vbSound')) { document.removeEventListener('pointerdown', firstTap); return; }
    if(!soundOn) setSound(true);
    document.removeEventListener('pointerdown', firstTap);
  });
  window.JPBG = {
    hold: function(on){ held = !!on; if(held) cmd('mute'); else if(soundOn){ cmd('unMute'); cmd('setVolume', [85]); cmd('playVideo'); } },
    soundOn: function(){ setSound(true); },
    playId: function(id){ for(var i = 0; i < VIDS.length; i++) if(VIDS[i].id === id){ play(VIDS[i]); setSound(true); return; } },
    list: VIDS
  };
})();

/* tiny helpers shared by games + makers (kept from the original build) */
window.JP = {
  $: function(sel, el){ return (el||document).querySelector(sel); },
  $$: function(sel, el){ return Array.prototype.slice.call((el||document).querySelectorAll(sel)); },
  download: function(canvas, name){
    var a = document.createElement('a');
    a.download = name; a.href = canvas.toDataURL('image/png'); a.click();
  },
  store: {
    get: function(k, d){ try{ var v = localStorage.getItem('jp:'+k); return v === null ? d : JSON.parse(v); }catch(e){ return d; } },
    set: function(k, v){ try{ localStorage.setItem('jp:'+k, JSON.stringify(v)); }catch(e){} }
  }
};
