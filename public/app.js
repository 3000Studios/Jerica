(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const store = {
    get(key, fallback) {
      try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
    },
    set(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  };

  const ui = {
    lock: $('#home'), dashboard: $('#dashboard'), warp: $('#warpScreen'), bottomNav: $('#bottomNav'),
    dials: $$('.dial'), code: $('#codeReadout'), hive: $('#hiveShell'), toast: $('#toast'),
    audio: $('#themeAudio'), musicCard: $('#musicCard'), playBtn: $('#playBtn'), musicStatus: $('#musicStatus'),
    musicToggle: $('#musicToggle'), sfxToggle: $('#sfxToggle'), tapForMusic: $('#tapForMusic')
  };

  let audioCtx = null;
  let sfxEnabled = store.get('jerica.sfx', true);
  let musicEnabled = store.get('jerica.music', true);
  let hiveUnlocked = false;
  let toastTimer = null;
  let timerSeconds = 25 * 60;
  let timerInterval = null;
  let entryMode = 'schedule';

  ui.musicToggle.setAttribute('aria-pressed', String(musicEnabled));
  ui.sfxToggle.setAttribute('aria-pressed', String(sfxEnabled));

  function showToast(message) {
    clearTimeout(toastTimer);
    ui.toast.textContent = message;
    ui.toast.classList.add('is-visible');
    toastTimer = setTimeout(() => ui.toast.classList.remove('is-visible'), 2200);
  }

  function ensureAudioContext() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    return audioCtx;
  }

  function playSfx(kind = 'tap') {
    if (!sfxEnabled) return;
    const ctx = ensureAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const tones = {
      tap: [420, 520, .045], dial: [170, 235, .06], success: [440, 880, .22], reward: [660, 990, .13], nav: [260, 360, .05]
    };
    const [start, end, duration] = tones[kind] || tones.tap;
    osc.type = kind === 'dial' ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(start, now);
    osc.frequency.exponentialRampToValueAtTime(end, now + duration);
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(kind === 'success' ? .16 : .07, now + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now); osc.stop(now + duration + .02);
  }

  async function startMusic({ userGesture = false } = {}) {
    if (!musicEnabled || !ui.audio) return false;
    try {
      ui.audio.volume = .34;
      await ui.audio.play();
      ui.musicCard.classList.add('is-playing');
      ui.playBtn.textContent = '❚❚';
      ui.musicStatus.textContent = 'Playing on Study Hive';
      ui.tapForMusic.hidden = true;
      return true;
    } catch {
      ui.musicCard.classList.remove('is-playing');
      ui.playBtn.textContent = '▶';
      ui.musicStatus.textContent = userGesture ? 'Song file unavailable' : 'Tap once for music';
      if (!userGesture) ui.tapForMusic.hidden = false;
      return false;
    }
  }

  function stopMusic() {
    ui.audio.pause();
    ui.musicCard.classList.remove('is-playing');
    ui.playBtn.textContent = '▶';
    ui.musicStatus.textContent = 'Paused';
  }

  ui.audio.addEventListener('error', () => {
    ui.musicStatus.textContent = 'Song asset pending local sync';
    ui.tapForMusic.hidden = true;
  });

  ui.playBtn.addEventListener('click', async () => {
    playSfx('tap');
    if (ui.audio.paused) await startMusic({ userGesture: true }); else stopMusic();
  });

  ui.musicToggle.addEventListener('click', async () => {
    musicEnabled = !musicEnabled;
    store.set('jerica.music', musicEnabled);
    ui.musicToggle.setAttribute('aria-pressed', String(musicEnabled));
    if (musicEnabled) await startMusic({ userGesture: true }); else stopMusic();
    playSfx('tap');
  });

  ui.sfxToggle.addEventListener('click', () => {
    sfxEnabled = !sfxEnabled;
    store.set('jerica.sfx', sfxEnabled);
    ui.sfxToggle.setAttribute('aria-pressed', String(sfxEnabled));
    if (sfxEnabled) playSfx('tap');
  });

  const firstGesture = async () => {
    ensureAudioContext();
    if (musicEnabled && ui.audio.paused) await startMusic({ userGesture: true });
    window.removeEventListener('pointerdown', firstGesture);
    window.removeEventListener('touchstart', firstGesture);
  };
  window.addEventListener('pointerdown', firstGesture, { once: true, passive: true });
  window.addEventListener('touchstart', firstGesture, { once: true, passive: true });

  function dialNumber(dial) { return Number(dial.dataset.value || 0); }
  function setDial(dial, nextValue) {
    const value = (nextValue + 10) % 10;
    dial.dataset.value = String(value);
    dial.querySelector('strong').textContent = value;
    dial.querySelector('.dial-prev').textContent = (value + 9) % 10;
    dial.querySelector('.dial-next').textContent = (value + 1) % 10;
    dial.setAttribute('aria-label', `${['First','Second','Third','Fourth'][Number(dial.dataset.index)]} digit ${value}`);
    dial.classList.add('is-spinning');
    setTimeout(() => dial.classList.remove('is-spinning'), 150);
    playSfx('dial');
    checkCode();
  }

  function stepDial(dial, step) { setDial(dial, dialNumber(dial) + step); }

  ui.dials.forEach(dial => {
    let startY = 0;
    let moved = false;
    dial.addEventListener('pointerdown', e => {
      startY = e.clientY;
      moved = false;
      dial.setPointerCapture?.(e.pointerId);
    });
    dial.addEventListener('pointermove', e => { if (Math.abs(e.clientY - startY) > 8) moved = true; });
    dial.addEventListener('pointerup', e => {
      const delta = e.clientY - startY;
      if (Math.abs(delta) > 14) stepDial(dial, delta < 0 ? 1 : -1);
      else if (!moved) stepDial(dial, 1);
    });
    dial.addEventListener('wheel', e => {
      e.preventDefault();
      stepDial(dial, e.deltaY > 0 ? -1 : 1);
    }, { passive: false });
    dial.addEventListener('keydown', e => {
      if (['ArrowUp','ArrowRight'].includes(e.key)) { e.preventDefault(); stepDial(dial, 1); }
      if (['ArrowDown','ArrowLeft'].includes(e.key)) { e.preventDefault(); stepDial(dial, -1); }
      if (/^[0-9]$/.test(e.key)) { e.preventDefault(); setDial(dial, Number(e.key)); }
    });
  });

  function checkCode() {
    const code = ui.dials.map(dialNumber).join('');
    ui.code.textContent = code;
    if (code === '3000' && !hiveUnlocked) unlockHive();
  }

  function unlockHive() {
    hiveUnlocked = true;
    ui.hive.classList.add('is-correct');
    playSfx('success');
    if (navigator.vibrate) navigator.vibrate([35, 40, 70]);
    showToast('Code accepted — the hive is opening');
    setTimeout(() => {
      ui.warp.classList.add('is-active');
      ui.warp.setAttribute('aria-hidden', 'false');
    }, 520);
    setTimeout(() => {
      ui.lock.classList.remove('is-active');
      ui.dashboard.classList.add('is-active');
      ui.warp.classList.remove('is-active');
      ui.warp.setAttribute('aria-hidden', 'true');
      ui.bottomNav.hidden = false;
      window.scrollTo({ top: 0, behavior: 'instant' });
      revealNow(ui.dashboard);
      loadWeather();
    }, 1760);
  }

  function revealNow(root = document) {
    $$('.reveal', root).forEach((el, i) => setTimeout(() => el.classList.add('is-visible'), Math.min(i * 70, 450)));
  }

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
    }), { threshold: .08, rootMargin: '0px 0px -20px' });
    $$('.reveal').forEach(el => io.observe(el));
  } else revealNow();

  function updateClock() {
    const now = new Date();
    $('#clock').textContent = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    $('#dateLabel').textContent = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    $('#calendarDay').textContent = now.getDate();
    $('#calendarMonth').textContent = now.toLocaleDateString([], { month: 'long', year: 'numeric' });
  }
  updateClock(); setInterval(updateClock, 20_000);

  const weatherLabels = new Map([
    [0,['☀','Clear sky']], [1,['🌤','Mostly clear']], [2,['⛅','Partly cloudy']], [3,['☁','Cloudy']],
    [45,['🌫','Foggy']], [48,['🌫','Foggy']], [51,['🌦','Light drizzle']], [53,['🌦','Drizzle']], [55,['🌧','Heavy drizzle']],
    [61,['🌦','Light rain']], [63,['🌧','Rain']], [65,['🌧','Heavy rain']], [71,['🌨','Light snow']], [73,['🌨','Snow']], [75,['❄','Heavy snow']],
    [80,['🌦','Rain showers']], [81,['🌧','Rain showers']], [82,['⛈','Heavy showers']], [95,['⛈','Thunderstorms']], [96,['⛈','Storms + hail']], [99,['⛈','Storms + hail']]
  ]);

  async function fetchWeather(lat, lon) {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.search = new URLSearchParams({ latitude: String(lat), longitude: String(lon), current: 'temperature_2m,weather_code', temperature_unit: 'fahrenheit', timezone: 'auto' });
    const response = await fetch(url, { signal: AbortSignal.timeout?.(6000) });
    if (!response.ok) throw new Error('Weather request failed');
    const data = await response.json();
    const [icon, label] = weatherLabels.get(data.current.weather_code) || ['◌','Current conditions'];
    $('#weatherIcon').textContent = icon;
    $('#temperature').textContent = `${Math.round(data.current.temperature_2m)}°`;
    $('#weatherText').textContent = label;
  }

  function loadWeather() {
    const fallback = () => fetchWeather(33.749, -84.388).catch(() => { $('#weatherText').textContent = 'Weather unavailable'; });
    if (!navigator.geolocation) return fallback();
    navigator.geolocation.getCurrentPosition(
      pos => fetchWeather(pos.coords.latitude, pos.coords.longitude).catch(fallback),
      fallback,
      { enableHighAccuracy: false, timeout: 4500, maximumAge: 30 * 60 * 1000 }
    );
  }

  const defaultSchedule = [
    { time:'8:00', title:'Math practice' }, { time:'9:30', title:'Reading' }, { time:'11:00', title:'Science' },
    { time:'1:00', title:'Lunch / reset' }, { time:'2:00', title:'Writing workshop' }, { time:'3:30', title:'Homework time' }
  ];
  const defaultAssignments = [
    { title:'Math — practice set', meta:'This week', done:false }, { title:'Reading — 20 minutes', meta:'Today', done:false },
    { title:'Science — review notes', meta:'This week', done:false }, { title:'Writing — revise one paragraph', meta:'This week', done:false }
  ];
  let schedule = store.get('jerica.schedule', defaultSchedule);
  let assignments = store.get('jerica.assignments', defaultAssignments);

  function renderSchedule() {
    const list = $('#scheduleList'); list.replaceChildren();
    schedule.forEach((item, index) => {
      const li = document.createElement('li');
      const time = document.createElement('time'); time.textContent = item.time;
      const dot = document.createElement('span'); dot.className = 'schedule-dot';
      const title = document.createElement('span'); title.textContent = item.title;
      const del = document.createElement('button'); del.type='button'; del.className='row-delete'; del.textContent='×'; del.setAttribute('aria-label',`Remove ${item.title}`);
      del.addEventListener('click', () => { schedule.splice(index,1); store.set('jerica.schedule',schedule); renderSchedule(); playSfx('tap'); });
      li.append(time,dot,title,del); list.append(li);
    });
  }

  function renderAssignments() {
    const list = $('#assignmentList'); list.replaceChildren();
    assignments.forEach((item, index) => {
      const row = document.createElement('div'); row.className='assignment';
      const check = document.createElement('input'); check.type='checkbox'; check.checked=!!item.done; check.setAttribute('aria-label',`Mark ${item.title} complete`);
      const copy = document.createElement('div'); const title=document.createElement('strong'); title.textContent=item.title; const meta=document.createElement('small'); meta.textContent=item.meta; copy.append(title,meta);
      const del=document.createElement('button');del.type='button';del.className='row-delete';del.textContent='×';del.setAttribute('aria-label',`Remove ${item.title}`);
      check.addEventListener('change',()=>{ item.done=check.checked; store.set('jerica.assignments',assignments); if(item.done){playSfx('reward');showToast('Nice — one thing handled');} });
      del.addEventListener('click',()=>{assignments.splice(index,1);store.set('jerica.assignments',assignments);renderAssignments();playSfx('tap');});
      row.append(check,copy,del);list.append(row);
    });
  }
  renderSchedule(); renderAssignments();

  const entryDialog=$('#entryDialog'), entryForm=$('#entryForm'), entryName=$('#entryName'), entryMeta=$('#entryMeta');
  function openEntry(mode){
    entryMode=mode; entryForm.reset();
    $('#entryEyebrow').textContent=mode==='schedule'?'PLAN THE DAY':'TRACK THE WORK';
    $('#entryTitle').textContent=mode==='schedule'?'Add schedule item':'Add assignment';
    $('#entryMetaLabel').firstChild.textContent=mode==='schedule'?'Time':'Due / timing';
    entryMeta.placeholder=mode==='schedule'?'3:30':'Friday / This week';
    entryDialog.showModal(); setTimeout(()=>entryName.focus(),60); playSfx('tap');
  }
  $('#addSchedule').addEventListener('click',()=>openEntry('schedule'));
  $('#addAssignment').addEventListener('click',()=>openEntry('assignment'));
  entryForm.addEventListener('submit',e=>{
    e.preventDefault();
    if(e.submitter?.value==='cancel'){entryDialog.close();return;}
    if(!entryForm.reportValidity()) return;
    if(entryMode==='schedule'){ schedule.push({time:entryMeta.value.trim(),title:entryName.value.trim()});store.set('jerica.schedule',schedule);renderSchedule(); }
    else { assignments.push({title:entryName.value.trim(),meta:entryMeta.value.trim(),done:false});store.set('jerica.assignments',assignments);renderAssignments(); }
    entryDialog.close();playSfx('reward');showToast('Added to your hive');
  });

  const note=$('#quickNote'); note.value=store.get('jerica.note',''); note.addEventListener('input',()=>store.set('jerica.note',note.value));

  const habitDate=new Date().toISOString().slice(0,10), habitKey=`jerica.habits.${habitDate}`, habitState=store.get(habitKey,{});
  $$('[data-habit]').forEach(box=>{ box.checked=!!habitState[box.dataset.habit]; box.addEventListener('change',()=>{habitState[box.dataset.habit]=box.checked;store.set(habitKey,habitState);if(box.checked)playSfx('reward');}); });

  function updateTimer(){ const m=Math.floor(timerSeconds/60).toString().padStart(2,'0'),s=(timerSeconds%60).toString().padStart(2,'0');$('#timerDisplay').textContent=`${m}:${s}`; }
  $('#timerToggle').addEventListener('click',()=>{
    if(timerInterval){clearInterval(timerInterval);timerInterval=null;$('#timerToggle').textContent='Start';showToast('Focus timer paused');return;}
    $('#timerToggle').textContent='Pause';playSfx('tap');
    timerInterval=setInterval(()=>{timerSeconds=Math.max(0,timerSeconds-1);updateTimer();if(timerSeconds===0){clearInterval(timerInterval);timerInterval=null;$('#timerToggle').textContent='Start';playSfx('success');showToast('Focus round complete — take a short reset');}},1000);
  });
  $('#timerReset').addEventListener('click',()=>{clearInterval(timerInterval);timerInterval=null;timerSeconds=25*60;updateTimer();$('#timerToggle').textContent='Start';playSfx('tap');});

  const helpResponses={
    explain:'Try this: write what the problem is asking, list what you already know, then solve only the first step. If you can explain that step out loud, you are moving.',
    paragraph:'Build it in 4 pieces: topic sentence → strongest detail → evidence/example → closing sentence. Get the ideas down first; polish second.',
    quiz:'Pick a subject card above, read one lesson goal, close your notes, and explain it from memory. Then check what you missed. That is a powerful self-quiz.',
    stuck:'Shrink the job. Set the timer for 10 minutes and do only the easiest useful step. Momentum beats waiting to feel ready.'
  };
  $$('[data-help]').forEach(btn=>btn.addEventListener('click',()=>{$('#helperReply').textContent=helpResponses[btn.dataset.help];playSfx('tap');}));

  $$('.moods button').forEach(btn=>btn.addEventListener('click',()=>{
    $$('.moods button').forEach(b=>b.classList.remove('is-selected'));btn.classList.add('is-selected');store.set('jerica.mood',{mood:btn.dataset.mood,at:new Date().toISOString()});
    const messages={Great:'Use that energy on the hardest thing first.',Okay:'Okay is enough. Pick one small win and start there.',Stuck:'Ask for help early. Being stuck is information, not failure.',Tired:'Choose a short task, drink some water, then take a real reset.'};
    $('#moodMessage').textContent=messages[btn.dataset.mood];playSfx('tap');
  }));

  $('#pingDad').addEventListener('click',async()=>{
    playSfx('tap');
    const text='Dad, I need some help with schoolwork. Can you check in with me when you can? — sent from my Study Hive';
    try {
      if(navigator.share){await navigator.share({title:'Study Hive help',text,url:location.origin});showToast('Help request ready');}
      else {await navigator.clipboard.writeText(text);showToast('Help message copied — paste it in Messages');}
    } catch(err){ if(err?.name!=='AbortError') showToast('Use Messages to ping Dad'); }
  });

  $$('#rewardJars button').forEach(btn=>btn.addEventListener('click',()=>{playSfx('reward');showToast(`${btn.dataset.reward}: keep filling the jar`);}));

  const subjects={
    math:{title:'Math Hive',intro:'Build fluency by understanding why a method works, then practice it until it feels automatic.',lessons:[['Number sense','Multi-digit operations, place value, fractions, decimals.'],['Problem solving','Underline the question, identify information, choose an operation, check reasonableness.'],['Geometry + measurement','Classify shapes, work with volume, convert measurements, read graphs.']],links:[['Georgia Inspire','https://inspire.gadoe.org/'],['Khan Academy','https://www.khanacademy.org/math/cc-fifth-grade-math']]},
    reading:{title:'ELA / Reading Hive',intro:'Read for meaning, evidence, vocabulary, structure, and the author’s choices.',lessons:[['Main idea + evidence','State the big idea and point to details that prove it.'],['Inference','Combine what the text says with what you already know.'],['Compare texts','Notice how two sources treat the same topic differently.']],links:[['Georgia ELA','https://gadoe.org/learning/english-language-arts/'],['ReadWorks','https://www.readworks.org/'],['Core Knowledge','https://www.coreknowledge.org/curriculum/']]},
    writing:{title:'Writing Hive',intro:'Good writing starts messy. Plan the idea, draft it, then revise for clarity and evidence.',lessons:[['Opinion','Claim → reasons → evidence → conclusion.'],['Informative','Introduce the topic, organize facts, use transitions, explain clearly.'],['Narrative','Set the scene, use sequence and details, give the story a clear ending.']],links:[['Georgia ELA','https://gadoe.org/learning/english-language-arts/'],['Core Knowledge ELA','https://www.coreknowledge.org/curriculum/']]},
    science:{title:'Science Hive',intro:'Ask questions, make a prediction, look for evidence, and explain what the evidence means.',lessons:[['Matter','Properties, mixtures, physical and chemical changes.'],['Life science','Structures, ecosystems, traits, and how organisms interact.'],['Earth + space','Patterns, cycles, weather, landforms, and Earth systems.']],links:[['Georgia Science','https://gadoe.org/learning/science/'],['CK-12','https://www.ck12.org/student/'],['PBS LearningMedia','https://www.pbslearningmedia.org/']]},
    social:{title:'Social Studies Hive',intro:'Connect people, events, geography, government, and economics instead of memorizing isolated dates.',lessons:[['U.S. history','Cause and effect across major events and changes.'],['Civics','Rights, responsibilities, government structure, Constitution.'],['Economics + geography','Resources, trade, regions, movement, opportunity cost.']],links:[['Georgia Social Studies','https://gadoe.org/learning/social-studies/'],['Georgia Inspire','https://inspire.gadoe.org/'],['Core Knowledge','https://www.coreknowledge.org/curriculum/']]},
    vocab:{title:'Vocabulary Hive',intro:'Learn words in context, not as a random list. Meaning + roots + examples makes them stick.',lessons:[['Roots + affixes','Use prefixes, suffixes, and roots to unlock unfamiliar words.'],['Context clues','Look at nearby definitions, examples, contrasts, and tone.'],['Spelling patterns','Group words by sound and pattern, then practice from memory.']],links:[['ReadWorks','https://www.readworks.org/'],['Khan Academy','https://www.khanacademy.org/ela']]}
  };
  const subjectDialog=$('#subjectDialog');
  $$('.subject-card').forEach(card=>card.addEventListener('click',()=>{
    const data=subjects[card.dataset.subject]; if(!data)return;
    $('#dialogTitle').textContent=data.title;$('#dialogIntro').textContent=data.intro;$('#lessonStack').replaceChildren();$('#dialogLinks').replaceChildren();
    data.lessons.forEach(([title,desc])=>{const el=document.createElement('div');el.className='lesson';const b=document.createElement('b');b.textContent=title;const small=document.createElement('small');small.textContent=desc;el.append(b,small);$('#lessonStack').append(el);});
    data.links.forEach(([label,url])=>{const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=`${label} ↗`;$('#dialogLinks').append(a);});
    subjectDialog.showModal();playSfx('tap');
  }));
  $('#dialogClose').addEventListener('click',()=>subjectDialog.close());

  const navTargets=['dashboard','studyHall','planner','resourcesTitle'];
  function goToTarget(target){
    const el=document.getElementById(target);if(!el)return;el.scrollIntoView({behavior:'smooth',block:'start'});playSfx('nav');
    $$('#bottomNav button').forEach(b=>b.classList.toggle('is-current',b.dataset.target===target));
  }
  $$('#bottomNav button').forEach(btn=>btn.addEventListener('click',()=>goToTarget(btn.dataset.target)));
  $('#calendarJump').addEventListener('click',()=>goToTarget('planner'));

  let swipeX=0,swipeY=0;
  ui.dashboard.addEventListener('touchstart',e=>{const t=e.changedTouches[0];swipeX=t.clientX;swipeY=t.clientY;},{passive:true});
  ui.dashboard.addEventListener('touchend',e=>{
    const t=e.changedTouches[0],dx=t.clientX-swipeX,dy=t.clientY-swipeY;
    if(Math.abs(dx)<75||Math.abs(dx)<Math.abs(dy)*1.35)return;
    const centerY=window.scrollY+innerHeight*.42;
    let current=0,best=Infinity;
    navTargets.forEach((id,i)=>{const el=document.getElementById(id);const d=Math.abs(el.getBoundingClientRect().top+scrollY-centerY);if(d<best){best=d;current=i;}});
    const next=Math.max(0,Math.min(navTargets.length-1,current+(dx<0?1:-1)));
    if(next!==current){goToTarget(navTargets[next]);showToast(dx<0?'Swipe → next zone':'Swipe → previous zone');}
  },{passive:true});

  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&subjectDialog.open)subjectDialog.close();});

  if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));}

  revealNow(ui.lock);
  setTimeout(()=>startMusic(),260);
})();
