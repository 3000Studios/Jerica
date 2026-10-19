/* jerica.pro — the Vampire Announcer.
   Uses the browser's built-in speech (no recordings, nothing sent anywhere),
   tuned deep and slow. Says the word on every button you click, announces
   games, wins, losses and jokes. A toggle in the corner mutes him. */
(function(){
  'use strict';
  var synth = window.speechSynthesis;
  var on = true;
  try{ on = localStorage.getItem('jp:vamp') !== 'off'; }catch(e){}
  var voice = null;
  function pickVoice(){
    if(!synth) return;
    var vs = synth.getVoices() || [];
    var prefs = [/Daniel/i, /Google UK English Male/i, /Microsoft (George|Ryan|Guy|David)/i, /Fred/i, /Arthur/i, /Male/i, /en-GB/i, /en-US/i, /^en/i];
    for(var i = 0; i < prefs.length && !voice; i++){
      for(var j = 0; j < vs.length; j++){
        if(prefs[i].test(vs[j].name) || prefs[i].test(vs[j].lang)){ voice = vs[j]; break; }
      }
    }
  }
  if(synth){ pickVoice(); if(typeof synth.onvoiceschanged !== 'undefined') synth.onvoiceschanged = pickVoice; }

  /* a short low organ swell under the voice — WebAudio, original */
  var ac = null;
  function swell(){
    try{
      var AC = window.AudioContext || window.webkitAudioContext; if(!AC) return;
      ac = ac || new AC();
      if(ac.state === 'suspended') ac.resume();
      var t = ac.currentTime, g = ac.createGain();
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.05, t + .08); g.gain.exponentialRampToValueAtTime(.0001, t + .9);
      g.connect(ac.destination);
      [55, 82.4, 110.0, 130.8].forEach(function(f){
        var o = ac.createOscillator(); o.type = 'triangle'; o.frequency.value = f; o.detune.value = (Math.random() - .5) * 14;
        o.connect(g); o.start(t); o.stop(t + 1);
      });
    }catch(e){}
  }

  function clean(text){
    return String(text || '').replace(/[\u{1F000}-\u{1FFFF}☀-➿️‍]/gu, '').replace(/[▶⏮⏭⏸↺✝☾☠]/g, '').replace(/\s+/g, ' ').trim();
  }
  function speak(text, opts){
    if(!on || !synth) return;
    var t = clean(text); if(!t) return;
    opts = opts || {};
    try{
      if(!opts.queue) synth.cancel();
      var u = new SpeechSynthesisUtterance(opts.slow ? t.replace(/\b(\w)/g, '$1') : t);
      if(voice) u.voice = voice;
      u.pitch = opts.pitch != null ? opts.pitch : .1;
      u.rate = opts.rate != null ? opts.rate : .72;
      u.volume = 1;
      if(!opts.queue && opts.swell !== false) swell();
      synth.speak(u);
    }catch(e){}
  }
  function set(v){
    on = v;
    try{ localStorage.setItem('jp:vamp', v ? 'on' : 'off'); }catch(e){}
    if(!v && synth) synth.cancel();
    btn.setAttribute('aria-pressed', v ? 'true' : 'false');
    btn.textContent = v ? '🧛 VOICE ON' : '🧛 VOICE OFF';
  }

  var btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'vamp-toggle'; btn.setAttribute('data-nosay', '');
  btn.setAttribute('aria-label', 'Vampire announcer voice on or off');
  document.body.appendChild(btn);
  set(on);
  btn.addEventListener('click', function(){ set(!on); if(on) speak('I have risen'); });

  /* every button (and button-styled link) says its word */
  document.addEventListener('click', function(e){
    var el = e.target.closest ? e.target.closest('button, a.btn, [role="button"]') : null;
    if(!el || el.hasAttribute('data-nosay') || el.closest('[data-nosay]')) return;
    var word = el.getAttribute('data-say') || el.getAttribute('aria-label') || el.textContent;
    word = clean(word).split(' ').slice(0, 4).join(' ');
    if(word) speak(word);
  }, true);

  window.Vamp = { say: speak, isOn: function(){ return on; } };
})();
