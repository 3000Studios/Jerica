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
  function navLinks(cls){
    return NAV.map(function(n){
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
      '<nav class="main-nav" aria-label="Main pages">' + navLinks() + '</nav>' +
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
  /* ----- footer clip: one official Nirvana video per page (YouTube embed, privacy-enhanced) ----- */
  var CLIPS = {
    home:    {id:'hTWKbfoikeg', t:'Smells Like Teen Spirit'},
    study:   {id:'vabnZ9-ex7o', t:'Come As You Are'},
    music:   {id:'pkcJEvMcnEg', t:'Lithium'},
    videos:  {id:'PbgKEjNBHqM', t:'In Bloom'},
    about:   {id:'fregObNcHC8', t:'The Man Who Sold The World (MTV Unplugged)'},
    games:   {id:'aWmkuH1k7uA', t:'All Apologies (MTV Unplugged)'},
    studio:  {id:'AhcttcXcRYY', t:'About A Girl (MTV Unplugged)'},
    friends: {id:'hEMm7gxBYSc', t:'Where Did You Sleep Last Night (MTV Unplugged)'}
  };
  function pageKey(){
    var m = path.match(/\/(study|music|videos|about|games|studio|friends)(\.html)?$/);
    return m ? m[1] : 'home';
  }
  function clipHTML(){
    var c = CLIPS[pageKey()];
    if(!c) return '';
    return '<div class="clip reveal"><div class="clip-txt"><span class="tag">FOOTER CLIP · NIRVANA</span>' +
      '<h3>' + c.t + '</h3><p class="dim">Official video from Nirvana\u2019s YouTube channel. Tap to play — the site music pauses.</p></div>' +
      '<div class="clip-frame" id="clipFrame"><button class="clip-play" type="button" data-id="' + c.id + '" data-t="' + c.t + '" aria-label="Play Nirvana: ' + c.t + '"' +
      ' style="background-image:url(https://i.ytimg.com/vi/' + c.id + '/hqdefault.jpg)"><span aria-hidden="true">▶</span></button></div></div>';
  }


  /* ----- footer ----- */
  var foot = document.getElementById('site-foot');
  if(foot){
    foot.innerHTML = clipHTML() + '<div class="foot-in">' +
      '<div><h3>JERICA.PRO</h3><p class="dim">Games, makers, study tools and loud music.</p></div>' +
      '<div><h3>THIS SITE</h3><ul>' +
      '<li><a href="/">Home</a></li><li><a href="/study.html">Study Hive</a></li>' +
      '<li><a href="/music.html">Music</a></li><li><a href="/videos.html">Videos</a></li>' +
      '<li><a href="/about.html">About</a></li><li><a href="/games.html">The Arcade</a></li>' +
      '<li><a href="/studio.html">Maker Studio</a></li><li><a href="/friends.html">Friends Zone</a></li></ul></div>' +
      '</div>' +
      '<p class="foot-fine">🔒 No public accounts, no sign-ups, no uploads. The Friends Message Board is invite-only and text-only, and its messages auto-delete after 30 days. ' +
      'Everything you make lives on your own device. Ads, when shown, are set to child-directed / non-personalized mode. ' +
      'Songs: “Entertain Us” &amp; “Motel Television.”</p>';
  }
  /* footer clip: swap the thumbnail for the real player only when tapped */
  document.addEventListener('click', function(e){
    var b = e.target.closest ? e.target.closest('.clip-play') : null;
    if(!b) return;
    var id = b.getAttribute('data-id'), t = b.getAttribute('data-t');
    var f = document.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1&playsinline=1';
    f.title = 'Nirvana: ' + t;
    f.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen');
    f.setAttribute('allowfullscreen', '');
    f.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    b.parentNode.replaceChild(f, b);
    var a = document.getElementById('plAudio'); if(a) a.pause();
  });


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

  /* ----- MUSIC PLAYER ----- */
  var TRACKS = [
    {title:'Entertain Us',    src:'/audio/entertain-us.mp3'},
    {title:'Motel Television',src:'/audio/motel-television.mp3'}
  ];
  var player = document.createElement('div');
  player.className='player'; player.id='player';
  player.setAttribute('role','region');
  player.setAttribute('aria-label','Music player');
  player.innerHTML =
    '<div class="player-in">' +
    '<div class="disc" aria-hidden="true">🎵</div>' +
    '<div class="now"><div class="t" id="plTitle" aria-live="polite">Entertain Us</div>' +
    '<div class="a">Plays on every page</div>' +
    '<progress id="plProg" value="0" max="100" aria-label="Song progress"></progress></div>' +
    '<button class="pbtn" id="plPrev" type="button" aria-label="Previous song">⏮</button>' +
    '<button class="pbtn main" id="plPlay" type="button" aria-label="Play or pause the music">▶</button>' +
    '<button class="pbtn" id="plNext" type="button" aria-label="Next song">⏭</button>' +
    '<button class="sound-cta" id="plSound" type="button" aria-pressed="false">🔊 TAP FOR SOUND</button>' +
    '</div>';
  document.body.appendChild(player);
  var audio = document.createElement('audio');
  audio.id='plAudio'; audio.preload='metadata'; audio.setAttribute('playsinline','');
  document.body.appendChild(audio);

  var idx = 0, soundOn = false;
  var elTitle = document.getElementById('plTitle'),
      elProg  = document.getElementById('plProg'),
      elPlay  = document.getElementById('plPlay'),
      elSound = document.getElementById('plSound');

  function load(i, autoplay){
    idx = (i + TRACKS.length) % TRACKS.length;
    audio.src = TRACKS[idx].src;
    elTitle.textContent = TRACKS[idx].title;
    elProg.value = 0;
    if(autoplay) audio.play().catch(function(){});
  }
  function setSound(on){
    soundOn = on;
    audio.muted = !on;
    elSound.setAttribute('aria-pressed', on ? 'true' : 'false');
    elSound.textContent = on ? '🔊 SOUND ON!' : '🔊 TAP FOR SOUND';
    elSound.classList.toggle('off', on);
  }
  audio.muted = true;               /* starts muted — browsers block autoplay sound */
  load(0, true);                    /* starts playing (muted) on load */
  audio.addEventListener('playing', function(){ player.classList.add('playing'); elPlay.textContent='⏸'; });
  audio.addEventListener('pause',   function(){ player.classList.remove('playing'); elPlay.textContent='▶'; });
  audio.addEventListener('ended',   function(){ load(idx+1, true); });
  audio.addEventListener('timeupdate', function(){
    if(audio.duration) elProg.value = Math.round(audio.currentTime / audio.duration * 100);
  });
  elPlay.addEventListener('click', function(){
    if(audio.paused){ if(!soundOn) setSound(true); audio.play().catch(function(){}); }
    else audio.pause();
  });
  document.getElementById('plPrev').addEventListener('click', function(){ load(idx-1, true); });
  document.getElementById('plNext').addEventListener('click', function(){ load(idx+1, true); });
  elSound.addEventListener('click', function(){
    setSound(!soundOn);
    if(soundOn && audio.paused) audio.play().catch(function(){});
  });
  /* first tap/click anywhere turns the sound on (once) */
  document.addEventListener('pointerdown', function firstTap(){
    if(!soundOn){ setSound(true); if(audio.paused) audio.play().catch(function(){}); }
    document.removeEventListener('pointerdown', firstTap);
  });
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
