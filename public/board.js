/* jerica.pro — Haunted Message Board (invite-only, text-only, kid-safe). */
(function(){
  'use strict';
  var root = document.getElementById('board');
  if(!root) return;
  var $ = function(id){ return document.getElementById(id); };
  var signin = $('bdSignin'), main = $('bdMain'), codeIn = $('bdCode'), signBtn = $('bdSignBtn'), signMsg = $('bdSignMsg');
  var meEl = $('bdMe'), outBtn = $('bdOut'), stickRow = $('bdStickers'), txt = $('bdText'), count = $('bdCount'),
      postBtn = $('bdPost'), postMsg = $('bdPostMsg'), feed = $('bdFeed');
  var sticker = '🦇', timer = null, stickersBuilt = false;

  function api(path, opts){
    opts = opts || {};
    opts.credentials = 'same-origin';
    opts.headers = Object.assign({'content-type':'application/json'}, opts.headers || {});
    return fetch('/api/board' + path, opts).then(function(r){
      return r.json().catch(function(){ return {}; }).then(function(d){ d._status = r.status; return d; });
    });
  }
  function ago(ts){
    var s = Math.max(1, Math.round((Date.now() - ts) / 1000));
    if(s < 60) return 'just now';
    var m = Math.round(s / 60); if(m < 60) return m + ' min ago';
    var h = Math.round(m / 60); if(h < 24) return h + ' hr ago';
    var d = Math.round(h / 24); return d + (d === 1 ? ' day ago' : ' days ago');
  }
  function render(list){
    feed.innerHTML = '';
    if(!list.length){
      var e = document.createElement('p'); e.className = 'bd-empty'; e.textContent = 'The board is empty… for now. Be the first to say hey. 🦇';
      feed.appendChild(e); return;
    }
    list.forEach(function(m){
      var li = document.createElement('li'); li.className = 'bd-msg';
      var st = document.createElement('span'); st.className = 'bd-stick'; st.setAttribute('aria-hidden', 'true'); st.textContent = m.sticker;
      var bx = document.createElement('div');
      var hd = document.createElement('div'); hd.className = 'bd-head';
      var nm = document.createElement('b'); nm.textContent = m.name;
      var tm = document.createElement('time'); tm.dateTime = new Date(m.ts).toISOString(); tm.textContent = ago(m.ts);
      hd.appendChild(nm); hd.appendChild(tm);
      var bd = document.createElement('p'); bd.className = 'bd-body'; bd.textContent = m.body;
      bx.appendChild(hd); bx.appendChild(bd);
      li.appendChild(st); li.appendChild(bx); feed.appendChild(li);
    });
  }
  function buildStickers(list){
    if(stickersBuilt) return; stickersBuilt = true;
    list.forEach(function(s, i){
      var b = document.createElement('button'); b.type = 'button'; b.className = 'bd-sbtn'; b.textContent = s;
      b.setAttribute('aria-label', 'Use sticker ' + s); b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      b.addEventListener('click', function(){
        sticker = s;
        Array.prototype.forEach.call(stickRow.children, function(x){ x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      });
      stickRow.appendChild(b);
    });
    sticker = list[0];
  }
  function showMain(d){
    signin.hidden = true; main.hidden = false;
    meEl.textContent = d.me;
    buildStickers(d.stickers || ['🦇']);
    render(d.messages || []);
    clearInterval(timer);
    timer = setInterval(function(){ if(!document.hidden) load(true); }, 20000);
  }
  function showSignin(){
    clearInterval(timer);
    main.hidden = true; signin.hidden = false;
  }
  function load(quiet){
    return api('/messages').then(function(d){
      if(d._status === 401) return showSignin();
      if(d._status === 503){ signMsg.textContent = 'The board is resting right now. Check back soon.'; return showSignin(); }
      if(d.messages) showMain(d);
    }).catch(function(){ if(!quiet) signMsg.textContent = 'Could not reach the board. Try again in a bit.'; });
  }

  signBtn.addEventListener('click', function(){
    var code = codeIn.value.trim();
    if(!code){ signMsg.textContent = 'Type the friend code you were given.'; return; }
    signBtn.disabled = true; signMsg.textContent = 'Unlocking the crypt…';
    api('/login', {method:'POST', body: JSON.stringify({code: code})}).then(function(d){
      signBtn.disabled = false;
      if(d._status !== 200){ signMsg.textContent = d.error || 'That did not work.'; return; }
      codeIn.value = ''; signMsg.textContent = '';
      load();
    }).catch(function(){ signBtn.disabled = false; signMsg.textContent = 'Could not reach the board. Try again in a bit.'; });
  });
  codeIn.addEventListener('keydown', function(e){ if(e.key === 'Enter') signBtn.click(); });
  outBtn.addEventListener('click', function(){ api('/logout', {method:'POST'}).then(showSignin); });

  txt.addEventListener('input', function(){ count.textContent = txt.value.length + ' / 200'; });
  postBtn.addEventListener('click', function(){
    var t = txt.value.trim();
    if(!t){ postMsg.textContent = 'Write something first.'; return; }
    postBtn.disabled = true; postMsg.textContent = 'Posting…';
    api('/messages', {method:'POST', body: JSON.stringify({text: t, sticker: sticker})}).then(function(d){
      postBtn.disabled = false;
      if(d._status === 401) return showSignin();
      if(d._status !== 200){ postMsg.textContent = d.error || 'That did not post.'; return; }
      txt.value = ''; count.textContent = '0 / 200'; postMsg.textContent = 'Posted! 🦇';
      render(d.messages || []);
      setTimeout(function(){ postMsg.textContent = ''; }, 2500);
    }).catch(function(){ postBtn.disabled = false; postMsg.textContent = 'Could not reach the board. Try again in a bit.'; });
  });

  load(true);
})();
