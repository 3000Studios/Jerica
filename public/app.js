/* jerica.pro shared chrome — header + footer injected so every page matches.
   100% client-side. This site collects nothing and loads nothing from anywhere else. */
(function(){
  var path = location.pathname;
  function active(href){
    if(href === '/') return (path === '/' || path.endsWith('index.html')) ? ' aria-current="page"' : '';
    return path.indexOf(href.replace('.html','')) !== -1 ? ' aria-current="page"' : '';
  }
  var head = document.getElementById('site-head');
  if(head){
    head.innerHTML =
      '<div class="head-in">' +
      '<a class="logo" href="/">JERICA<b>.</b>PRO<i>★</i></a>' +
      '<button class="burger" id="burger" aria-label="Open menu">☰</button>' +
      '<nav class="nav" id="mainnav">' +
      '<a href="/"' + active('/') + '>Home</a>' +
      '<a href="/games.html"' + active('/games.html') + '>🎮 Games</a>' +
      '<a href="/studio.html"' + active('/studio.html') + '>🎨 Maker Studio</a>' +
      '<a href="/friends.html"' + active('/friends.html') + '>💛 Friends Zone</a>' +
      '<a class="cta" href="/#thunderdome">⚡ Dad\u2019s Game</a>' +
      '</nav></div>';
    var b = document.getElementById('burger'), n = document.getElementById('mainnav');
    b.addEventListener('click', function(){ n.classList.toggle('open'); });
  }
  var foot = document.getElementById('site-foot');
  if(foot){
    foot.innerHTML =
      '<div class="wrap">' +
      '<div class="fbrand">JERICA.PRO ★ MADE BY JERICA, FOR JERICA (AND HER CREW)</div>' +
      '<div><a href="/">Home</a> · <a href="/games.html">Games</a> · <a href="/studio.html">Maker Studio</a> · ' +
      '<a href="/friends.html">Friends Zone</a> · <a href="https://thunderdome.store">Thunderdome — my dad\u2019s game</a></div>' +
      '<div class="privacy-note">🔒 This site collects <b>nothing</b>. No accounts, no sign-ups, no ads, no trackers. ' +
      'Everything you make lives on your own device. Make it, download it, show it. 💛</div>' +
      '</div>';
  }
})();

/* tiny helpers shared by games + makers */
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
