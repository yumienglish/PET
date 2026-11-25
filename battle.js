/* =====================================================================
   BOSS FIGHT – PET Arena (chép bộ máy đối kháng 2D của B2 First, 25/11)
   Cứ 4 tuần 1 boss. Câu hỏi = các câu em đã SAI trong 4 tuần đó: Grammar (sai lần 1; vẫn sai lần 2 = ULTIMATE)
   + Vocab mission (từ sai; sai từ 2 vòng = ULTIMATE). Thiếu thì bù câu khác cùng 4 tuần cho đủ 15 câu.
   Nạp TRƯỚC app.js (app.js dựng Lobby ngay khi nạp; ở đây chỉ khai báo). Dùng chung: $, $$, esc, plain, unv, nrm, TOK, toks, parseTok, nounCheck, tokText, itemsOfEx,
   storeKey, lsGet/lsSet, ME_KEY, avHtml, AVATARS, confetti, sfx, soundOn, SND_KEY, paintSnd, shuffle, post (app.js / arena.js),
   vocabState, vsame (vocab.js).
   ===================================================================== */
const BAT_KEY = 'pet-battle';
const QP = new URLSearchParams(location.search);
const batState = () => Object.assign({ fights: 0, wins: 0, boss: {} }, lsGet(BAT_KEY) || {});
const batSave = s => lsSet(BAT_KEY, s);
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- Âm thanh trận đấu (WebAudio, không cần file) ---------- */
let NOISE = null;
function actx(){
  if (!soundOn()) return null;
  try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); return AC; } catch (e) { return null; }
}
function noiseBuf(a){
  if (NOISE) return NOISE;
  NOISE = a.createBuffer(1, a.sampleRate, a.sampleRate);
  const d = NOISE.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return NOISE;
}
function tone(a, { type = 'sine', f0, f1, t0 = 0, dur, vol = .2 }){
  const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + t0;
  o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + .05);
}
function noise(a, { t0 = 0, dur, vol = .3, freq = 1200, q = .7 }){
  const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(), t = a.currentTime + t0;
  s.buffer = noiseBuf(a); f.type = 'lowpass'; f.frequency.setValueAtTime(freq, t); f.frequency.exponentialRampToValueAtTime(80, t + dur); f.Q.value = q;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  s.connect(f).connect(g).connect(a.destination); s.start(t); s.stop(t + dur + .05);
}
function bsfx(kind){
  const a = actx(); if (!a) return;
  if (realSfx(kind)) return;
  if (kind === 'zap'){ tone(a, { type: 'square', f0: 1400, f1: 220, dur: .22, vol: .08 }); }
  else if (kind === 'hit'){ noise(a, { dur: .25, vol: .45, freq: 2500 }); tone(a, { f0: 160, f1: 50, dur: .25, vol: .35 }); }
  else if (kind === 'crit'){ noise(a, { dur: .35, vol: .5, freq: 4000 }); tone(a, { type: 'square', f0: 900, f1: 1800, dur: .12, vol: .07 }); tone(a, { f0: 120, f1: 40, dur: .35, vol: .4 }); }
  else if (kind === 'hurt'){ tone(a, { type: 'sawtooth', f0: 420, f1: 90, dur: .35, vol: .12 }); noise(a, { dur: .3, vol: .35, freq: 900 }); }
  else if (kind === 'charge'){ tone(a, { f0: 180, f1: 1400, dur: .85, vol: .14 }); tone(a, { type: 'triangle', f0: 90, f1: 700, dur: .85, vol: .1 }); }
  else if (kind === 'laser'){ tone(a, { type: 'sawtooth', f0: 2200, f1: 300, dur: .5, vol: .09 }); noise(a, { dur: .5, vol: .25, freq: 6000 }); }
  else if (kind === 'slash'){ noise(a, { dur: .12, vol: .4, freq: 7000, q: 2 }); }
  else if (kind === 'boom'){ noise(a, { dur: 1.1, vol: .7, freq: 1800 }); tone(a, { f0: 90, f1: 28, dur: 1, vol: .5 }); }
  else if (kind === 'win'){ [523, 659, 784, 1047, 1319].forEach((f, i) => tone(a, { type: 'triangle', f0: f, t0: i * .11, dur: .35, vol: .16 })); }
  else if (kind === 'lose'){ [392, 330, 262, 196].forEach((f, i) => tone(a, { type: 'sawtooth', f0: f, t0: i * .18, dur: .3, vol: .07 })); }
  else if (kind === 'punch'){ noise(a, { dur: .12, vol: .6, freq: 900 }); tone(a, { f0: 130, f1: 45, dur: .2, vol: .5 }); }
  else if (kind === 'kick'){ noise(a, { dur: .2, vol: .55, freq: 1700 }); tone(a, { f0: 95, f1: 38, dur: .24, vol: .45 }); }
  else if (kind === 'whoosh'){ noise(a, { dur: .22, vol: .28, freq: 3200, q: 1.6 }); }
  else if (kind === 'shield'){ tone(a, { type: 'triangle', f0: 1250, dur: .28, vol: .1 }); tone(a, { type: 'triangle', f0: 1870, t0: .03, dur: .32, vol: .08 }); noise(a, { dur: .15, vol: .2, freq: 5200 }); }
  else if (kind === 'ki'){ [660, 880, 1100, 1320].forEach((f, i) => tone(a, { type: 'square', f0: f, t0: i * .07, dur: .12, vol: .05 })); }
  else if (kind === 'super'){ tone(a, { f0: 120, f1: 1600, dur: 1.2, vol: .14 }); tone(a, { type: 'triangle', f0: 60, f1: 900, dur: 1.2, vol: .1 }); noise(a, { dur: 1.1, vol: .12, freq: 2400 }); }
  else if (kind === 'start'){ [262, 392, 523].forEach((f, i) => tone(a, { type: 'square', f0: f, t0: i * .09, dur: .14, vol: .06 })); }
}

/* ---------- Âm thanh thật (file CC0: Kenney + "Battle Theme A" cynicmusic, xem audio/*LICENSE*) ---------- */
// Mỗi đòn = nhiều lớp tiếng chồng nhau, cao độ lệch ngẫu nhiên ±6% để không lặp nhàm; có tiếng vang + bộ nén.
const SFX_FILES = ['punch1', 'punch2', 'punch3', 'heavy1', 'heavy2', 'heavy3', 'body', 'swish1', 'swish2', 'swish3', 'slash1', 'slash2',
  'laser1', 'laser2', 'beam', 'boom1', 'boom2', 'bigboom', 'field', 'clang', 'j-start', 'j-ready', 'j-ko', 'j-win', 'j-lose'];
const SND = { buf: {}, loading: null, bus: null, wet: null, music: null, mGain: null, mBase: .22 };
function sndBus(a){
  if (SND.bus && SND.bus.context === a) return SND.bus;
  const comp = a.createDynamicsCompressor(); comp.threshold.value = -14; comp.knee.value = 8; comp.ratio.value = 4; comp.attack.value = .003; comp.release.value = .2;
  comp.connect(a.destination);
  const bus = a.createGain(); bus.gain.value = .9; bus.connect(comp);
  // tiếng vang: xung nhiễu tắt dần 1.4 s
  const len = a.sampleRate * 1.4, ir = a.createBuffer(2, len, a.sampleRate);
  for (let c = 0; c < 2; c++){ const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
  const conv = a.createConvolver(); conv.buffer = ir; const wet = a.createGain(); wet.gain.value = .35; conv.connect(wet); wet.connect(comp);
  SND.bus = bus; SND.wet = conv; return bus;
}
function loadSfx(){
  const a = actx(); if (!a || SND.loading) return SND.loading;
  sndBus(a);
  SND.loading = Promise.all(SFX_FILES.map(n => fetch('audio/sfx/' + n + '.mp3').then(r => r.arrayBuffer()).then(b => new Promise((ok, no) => a.decodeAudioData(b, ok, no))).then(buf => { SND.buf[n] = buf; }).catch(() => {})));
  return SND.loading;
}
// phát 1 lớp: tên (hoặc mảng tên để chọn ngẫu nhiên), âm lượng, trễ (giây), tốc độ, tiếng vang
function play(name, { vol = 1, delay = 0, rate = 1, rev = 0, jitter = .06 } = {}){
  const a = actx(); if (!a) return false;
  const n = Array.isArray(name) ? name[Math.floor(Math.random() * name.length)] : name, buf = SND.buf[n]; if (!buf) return false;
  const s = a.createBufferSource(), g = a.createGain(), bus = sndBus(a);
  s.buffer = buf; s.playbackRate.value = rate * (1 + (Math.random() * 2 - 1) * jitter); g.gain.value = vol;
  s.connect(g); g.connect(bus); if (rev){ const r = a.createGain(); r.gain.value = rev; g.connect(r); r.connect(SND.wet); }
  s.start(a.currentTime + delay); return true;
}
const PUNCH = ['punch1', 'punch2', 'punch3'], HEAVY = ['heavy1', 'heavy2', 'heavy3'], SWISH = ['swish1', 'swish2', 'swish3'], SLASH = ['slash1', 'slash2'], LASER = ['laser1', 'laser2'], BOOM = ['boom1', 'boom2'];
function realSfx(kind){
  if (!SND.buf.punch1) return false; // chưa tải xong → dùng âm thanh tự tạo
  switch (kind){
    case 'punch': play(PUNCH, { vol: 1 }); play('body', { vol: .55, rate: 1.1 }); return true;
    case 'kick': play(HEAVY, { vol: 1 }); play('body', { vol: .6, rate: .9 }); return true;
    case 'whoosh': play(SWISH, { vol: .55, rate: 1.15 }); return true;
    case 'hit': play(HEAVY, { vol: .9 }); return true;
    case 'crit': play(HEAVY, { vol: 1 }); play(BOOM, { vol: .45, rate: 1.3, rev: .25 }); return true;
    case 'zap': play(LASER, { vol: .75 }); return true;
    case 'laser': play('beam', { vol: .9, rate: .9, rev: .3 }); play(LASER, { vol: .6, rate: .7, delay: .05 }); return true;
    case 'slash': play(SLASH, { vol: .9, rev: .2 }); play('clang', { vol: .35, rate: 1.3 }); return true;
    case 'boom': play(BOOM, { vol: .9, rev: .5 }); play('bigboom', { vol: .9, rev: .4 }); return true;
    case 'hurt': play(HEAVY, { vol: 1, rate: .85 }); play('body', { vol: .8, rate: .8 }); duck(.4, .5); return true;
    case 'shield': play('field', { vol: .8, rate: 1.2 }); play('clang', { vol: .7, rev: .35 }); return true;
    case 'charge': play('field', { vol: .55, rate: 1.4 }); return true;
    case 'ki': play('j-ready', { vol: .7, jitter: 0 }); return true;
    case 'super': play('field', { vol: .7, rate: .75, rev: .4 }); play('beam', { vol: .4, rate: .6, delay: .5 }); duck(.35, 2.4); return false; // + tiếng nạp tự tạo
    case 'start': play('j-start', { vol: .8, jitter: 0 }); return true;
    case 'win': fadeMusic(); play('j-ko', { vol: .8, jitter: 0 }); play('j-win', { vol: .85, jitter: 0, delay: .7 }); return true;
    case 'lose': fadeMusic(); play('j-lose', { vol: .8, jitter: 0 }); return true;
  }
  return false;
}
/* nhạc nền trận đấu: <audio> lặp + GainNode (iPhone không cho chỉnh volume của <audio> trực tiếp) */
function startMusic(){
  stopMusic(); if (!soundOn()) return;
  const a = actx(); if (!a) return;
  const el = new Audio('audio/battle-music.mp3'); el.loop = true; el.preload = 'auto';
  try { const src = a.createMediaElementSource(el), g = a.createGain(); g.gain.value = .0001; src.connect(g); g.connect(a.destination);
    g.gain.exponentialRampToValueAtTime(SND.mBase, a.currentTime + 1.5); SND.mGain = g; } catch (e) { el.volume = .25; }
  SND.music = el; el.play().catch(() => {});
}
function duck(to = .4, secs = 1){ const a = actx(), g = SND.mGain; if (!a || !g) return; const t = a.currentTime; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(SND.mBase * to, t + .08); g.gain.linearRampToValueAtTime(SND.mBase, t + secs); }
function fadeMusic(){ const a = actx(), g = SND.mGain; if (a && g){ const t = a.currentTime; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(.0001, t + .6); } setTimeout(stopMusic, 700); }
function stopMusic(){ if (SND.music){ try { SND.music.pause(); } catch (e) {} SND.music.src = ''; SND.music = null; } SND.mGain = null; }

/* ---------- Câu hỏi boss: câu em đã sai trong 4 tuần ---------- */
const BOSS_N = 15, BOSS_XP = 150;
const BOSSES = [
  { id: 'boss1', after: 4, weeks: [1, 2, 3, 4], name: 'Tense Titan', img: 'boss-1', fx: 'b1', arena: 'arena-1' },
  { id: 'boss2', after: 8, weeks: [5, 6, 7, 8], name: 'Vocab Hydra', img: 'boss-2' },
  { id: 'boss3', after: 12, weeks: [9, 10, 11, 12], name: 'Clause Kraken', img: 'boss-3' },
  { id: 'boss4', after: 16, weeks: [13, 14, 15, 16], name: 'Exam Overlord', img: 'boss-4' }
];
// mọi câu chấm được của mission Grammar tuần w (bỏ bài nghe – cần audio – và bài nói); khoá câu giống app.js buildQS
function grammarQs(w){
  const L = LESSONS[w]; if (!L) return [];
  const out = [];
  L.ex.forEach((e, ei) => {
    if (e.track || e.type === 'speak') return;
    const grpImg = {}; if (e.type === 'label') e.groups.forEach(g => { grpImg[g.n] = g.img; });
    let c = 0;
    itemsOfEx(e).forEach(it => {
      const ts = toks(it.t);
      ts.forEach((tok, ti) => {
        const label = e.type === 'text' ? String(++c) : it.n + (ts.length > 1 ? 'abcdefgh'[ti] : '');
        out.push({ k: e.id + '-' + label, e, it, ti, tok, label, h: Array.isArray(it.h) ? it.h[ti] : it.h,
          pic: it.img || (it.grp && grpImg[it.grp]) || '', src: `Mission ${String(w).padStart(2, '0')} · ${L.code} · Exercise ${ei + 1}` });
      });
    });
  });
  return out;
}
// mission Vocab tuần w: mỗi từ = câu ngữ cảnh (gõ từ vào chỗ trống), gợi ý nghĩa tiếng Việt
function vocabQs(w){
  const V = typeof VOCAB_LESSONS !== 'undefined' && VOCAB_LESSONS[w]; if (!V) return [];
  return V.cards.map((c, j) => {
    const tok = toks(c.c)[0]; if (!tok || tok.kind !== 'gap') return null;
    return { k: 'v' + j, j, e: { type: 'list', how: 'Vocab · Complete the sentence with the right word or phrase.' }, it: { t: c.c, v: c.vi }, ti: 0, tok, label: String(j + 1),
      h: c.en ? 'Meaning: ' + esc(c.en) : '', vocab: true, src: `Mission ${String(w).padStart(2, '0')} · Vocab ${V.code}` };
  }).filter(Boolean);
}
// wrong = câu em đã sai · right = câu em đã làm đúng · fresh = câu chưa làm (bài chưa nộp)
function bossPool(B){
  const wrong = [], right = [], fresh = [];
  B.weeks.filter(w => w <= OPEN_WEEK || PREVIEW).forEach(w => {
    if (LESSONS[w]){
      const s = lsGet(storeKey(w)) || {};
      grammarQs(w).forEach(q => {
        const r1 = s.r1 && s.r1.items && s.r1.items[q.k], r2 = s.r2 && s.r2.items && s.r2.items[q.k];
        Object.assign(q, { id: `w${w}:${q.k}`, w, ult: !!(r1 && !r1.ok && r2 && !r2.ok) });
        (!r1 ? fresh : r1.ok ? right : wrong).push(q);
      });
    }
    if (typeof VOCAB_LESSONS !== 'undefined' && VOCAB_LESSONS[w]){
      const vs = typeof vocabState === 'function' ? vocabState(w) : {}, miss = {};
      Object.keys(vs.res || {}).forEach(r => (vs.res[r].wrong || []).forEach(x => { miss[x.j] = (miss[x.j] || 0) + 1; }));
      vocabQs(w).forEach(q => {
        const n = miss[q.j] || 0;
        Object.assign(q, { id: `w${w}:${q.k}`, w, ult: n >= 2 });
        (n ? wrong : vs.phase === 'done' ? right : fresh).push(q);
      });
    }
  });
  return { wrong, right, fresh };
}
function bossQuestions(B){
  const p = bossPool(B);
  let qs = shuffle(p.wrong.filter(q => q.ult)).concat(shuffle(p.wrong.filter(q => !q.ult))).slice(0, BOSS_N);
  if (qs.length < BOSS_N) qs = qs.concat(shuffle(p.right).slice(0, BOSS_N - qs.length));
  if (qs.length < BOSS_N) qs = qs.concat(shuffle(p.fresh).slice(0, BOSS_N - qs.length));
  return shuffle(qs);
}
const bossOpen = B => OPEN_WEEK >= B.after || (PREVIEW && QP.get('boss') === B.id);
const battleXP = () => { const b = batState().boss || {}; return Object.keys(b).reduce((a, k) => a + (b[k].xp || 0), 0); };

/* ---------- Hiển thị 1 câu trong trận ---------- */
function battleSentence(q){ const s = battleSentence0(q); return q.pic ? `<img class="bpic" src="img/${esc(q.pic)}" alt="">` + s : s; }
function battleSentence0(q){
  if (q.it.vi) return `<div class="tvi">${esc(q.it.vi)}</div>${q.it.ph ? `<div class="tph">💬 ${q.it.ph}</div>` : ''}<span class="bblank">_______</span>`;
  let i = -1;
  let s = String(q.it.t).replace(TOK, m0 => {
    i++; const tk = parseTok([...m0.matchAll(TOK)][0]);
    if (i === q.ti) return '\u0001';
    return tk.kind === 'ch' ? unv(tk.opts[tk.correct[0]]) : tk.kind === 'gap' ? tk.alts[0] : tk.sg;
  });
  s = plain(s);
  if (q.e.type === 'text'){
    const ss = s.split(/(?<=[.!?:’])\s+/), j = ss.findIndex(x => x.includes('\u0001'));
    if (j >= 0) s = (j > 0 && ss[j].trim().startsWith('\u0001') ? ss[j - 1] + ' ' : '') + ss[j];
  }
  const only = s.replace('\u0001', '').trim() === '';
  let html = only ? '' : esc(s).replace('\u0001', '<span class="bblank">_______</span>');
  if (q.it.v) html += ` <em class="bv">(${esc(plain(q.it.v))})</em>`;
  if (q.base) html += ` <b class="bbase">${esc(q.base)}</b>`;
  if (q.first) html = `<div class="bfirst">${esc(q.first)}</div><div class="bkey">${esc(q.key)}</div>` + html;
  return html;
}
function battleAnswers(q){
  const t = q.tok, e = q.e;
  if (q.vocab) return { type: 'type', check: v => typeof vsame === 'function' ? vsame(v, t.alts) : t.alts.some(a => nrm(a) === nrm(v)), answer: t.alts[0] };
  if (t.kind === 'ch') return { type: 'opt', opts: shuffle(t.opts.map((o, i) => ({ label: plain(unv(o)), ok: t.correct.includes(i) }))) };
  if (typeof chipsOf === 'function' && (e.drag && e.box || e.sents)){
    const chips = chipsOf(e), right = t.alts[0];
    const pick = shuffle(chips.filter(c => c.w === right).concat(shuffle(chips.filter(c => c.w !== right)).slice(0, 3)));
    return { type: 'opt', opts: pick.map(c => ({ label: e.sents ? c.w + '. ' + plain(c.s) : c.w, ok: c.w === right })) };
  }
  const f = nrm;
  return { type: 'type', check: v => t.kind === 'noun' ? nounCheck(v, t.sg, t.pl, t.cnt).ok : t.alts.some(a => f(a) === f(v)),
    answer: t.kind === 'noun' ? tokText(t) : t.alts[0] };
}
const correctOf = q => q.tok.kind === 'ch' ? q.tok.correct.map(i => plain(unv(q.tok.opts[i]))).join(' + ') : q.tok.kind === 'noun' ? tokText(q.tok) : q.tok.alts[0];

/* ---------- Khung hình nhân vật (tools/chatgpt/frames.mjs): [rộng, cao] tính theo % chiều cao tư thế đứng thủ ---------- */
const FIGHTER_FRAMES = {"p-idle":[78.2,101.3],"p-punch":[109.8,97.6],"p-kick":[105.8,112.2],"p-cast":[110.2,99.1],"p-hurt":[90.2,100.7],"p-win":[64.6,111.8],"b1-idle":[111.8,101.1],"b1-atk":[115.8,94.5],"b1-hurt":[105.5,102.9],"b1-ko":[112,100],"e1-idle":[84.3,101.1],"e2-idle":[83.3,101],"e3-idle":[96.3,101.2],"e1-atk":[128,91.5],"e2-atk":[93.9,91.1],"e3-atk":[127.9,91.5],"e1-hurt":[126,118.6],"e2-hurt":[92.7,86.1],"e3-hurt":[126.2,117.3]};
const hasFrames = p => !!(p && FIGHTER_FRAMES[p + '-idle']);
const FXIMG = {};
function loadFx(){ ['orb', 'fire', 'hit', 'slash', 'ring', 'dust'].forEach(n => { if (!FXIMG[n]){ const im = new Image(); im.src = 'img/fx/fx-' + n + '.webp'; FXIMG[n] = im; } }); }

/* ---------- Lớp hiệu ứng canvas (hạt, tia lửa, khói, sóng, hình hiệu ứng, tia chưởng, hào quang) ---------- */
const FX = {
  cv: null, ctx: null, w: 0, h: 0, list: [], raf: 0, last: 0, frozen: 0, low: false,
  init(cv){ this.cv = cv; this.ctx = cv.getContext('2d'); this.list = []; this.low = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); this.resize(); },
  resize(){ if (!this.cv) return; const r = this.cv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
    this.w = this.cv.offsetWidth || r.width; this.h = this.cv.offsetHeight || r.height; this.cv.width = this.w * d; this.cv.height = this.h * d; this.ctx.setTransform(d, 0, 0, d, 0, 0); },
  add(o){ if (!this.cv || this.list.length > (this.low ? 90 : 320)) return; o.t = 0; this.list.push(o); if (!this.raf) this.raf = requestAnimationFrame(t => this.tick(t)); },
  tick(ts){
    const dt = Math.min(48, this.last ? ts - this.last : 16), c = this.ctx; this.last = ts;
    c.clearRect(0, 0, this.w, this.h);
    const run = performance.now() > this.frozen;
    this.list = this.list.filter(o => { if (run) o.t += dt; const k = o.t / o.life; if (k >= 1) return false; this.draw(c, o, k, run ? dt / 16 : 0); return true; });
    if (this.list.length && this.cv) this.raf = requestAnimationFrame(t => this.tick(t)); else { this.raf = 0; this.last = 0; c.clearRect(0, 0, this.w, this.h); }
  },
  draw(c, o, k, s){
    c.save(); c.globalCompositeOperation = o.add === false ? 'source-over' : 'lighter';
    if (o.type === 'spark'){
      o.x += o.vx * s; o.y += o.vy * s; o.vy += (o.g || .25) * s; o.vx *= .97;
      c.strokeStyle = o.color; c.globalAlpha = 1 - k; c.lineWidth = o.w || 2.5; c.lineCap = 'round';
      c.beginPath(); c.moveTo(o.x, o.y); c.lineTo(o.x - o.vx * (o.len || 3), o.y - o.vy * (o.len || 3)); c.stroke();
    } else if (o.type === 'ember'){
      o.x += o.vx * s; o.y += o.vy * s; o.vy += (o.g || -.04) * s;
      const r = o.r * (1 - k * .7), g = c.createRadialGradient(o.x, o.y, 0, o.x, o.y, r);
      g.addColorStop(0, '#fff'); g.addColorStop(.35, o.color); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.globalAlpha = 1 - k; c.fillStyle = g; c.beginPath(); c.arc(o.x, o.y, r, 0, 7); c.fill();
    } else if (o.type === 'smoke'){
      o.x += o.vx * s; o.y += o.vy * s; const r = o.r0 + (o.r1 - o.r0) * k;
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = (o.a || .45) * (1 - k);
      const g = c.createRadialGradient(o.x, o.y, 0, o.x, o.y, r); g.addColorStop(0, o.color || 'rgba(170,160,190,1)'); g.addColorStop(1, 'rgba(120,110,140,0)');
      c.fillStyle = g; c.beginPath(); c.arc(o.x, o.y, r, 0, 7); c.fill();
    } else if (o.type === 'ring'){
      const e = 1 - Math.pow(1 - k, 3), r = o.r0 + (o.r1 - o.r0) * e;
      c.globalAlpha = 1 - k; c.strokeStyle = o.color; c.lineWidth = (o.w || 10) * (1 - k) + 1; c.shadowColor = o.color; c.shadowBlur = 20;
      c.beginPath(); c.ellipse(o.x, o.y, r, r * (o.flat || 1), 0, 0, 7); c.stroke();
    } else if (o.type === 'img'){
      const im = FXIMG[o.name]; if (im && im.complete && im.naturalWidth){
        o.x += (o.vx || 0) * s; o.y += (o.vy || 0) * s;
        const e = 1 - Math.pow(1 - k, 2), sc = o.s0 + (o.s1 - o.s0) * e, w = im.naturalWidth * sc, h = im.naturalHeight * sc;
        c.globalAlpha = o.fade === false ? 1 : Math.min(1, (1 - k) * (o.boost || 1.4));
        c.translate(o.x, o.y); c.rotate((o.rot || 0) + (o.spin || 0) * k); if (o.flip) c.scale(-1, 1);
        c.drawImage(im, -w / 2, -h / 2, w, h);
      }
    } else if (o.type === 'beam'){
      const p = Math.sin(Math.PI * Math.min(1, k * 1.15)), w = o.w * p * (0.85 + Math.random() * .3);
      const ang = Math.atan2(o.y2 - o.y1, o.x2 - o.x1), len = Math.hypot(o.x2 - o.x1, o.y2 - o.y1);
      c.translate(o.x1, o.y1); c.rotate(ang);
      const g = c.createLinearGradient(0, -w, 0, w); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.3, o.color); g.addColorStop(.5, '#fff'); g.addColorStop(.7, o.color); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.shadowColor = o.color; c.shadowBlur = 40; c.fillRect(0, -w, len, w * 2);
      c.beginPath(); c.arc(len, 0, w * 1.4, 0, 7); c.fill();
    } else if (o.type === 'rays'){
      const n = o.n || 14, a = Math.sin(Math.PI * k);
      c.translate(o.x, o.y); c.rotate((o.spin || 1.2) * k);
      for (let i = 0; i < n; i++){
        c.rotate(Math.PI * 2 / n); const L = o.L * (.7 + .3 * Math.sin(i * 7 + o.t / 90));
        const g = c.createLinearGradient(0, 0, L, 0); g.addColorStop(0, o.color); g.addColorStop(1, 'rgba(0,0,0,0)');
        c.globalAlpha = a * .8; c.fillStyle = g; c.beginPath(); c.moveTo(0, -4); c.lineTo(L, -o.wd); c.lineTo(L, o.wd); c.lineTo(0, 4); c.fill();
      }
    } else if (o.type === 'speed'){
      if (!o.lines) o.lines = Array.from({ length: o.n || 28 }, () => ({ a: Math.random() * 7, r: .35 + Math.random() * .4, l: .1 + Math.random() * .25 }));
      c.globalAlpha = (1 - k) * .8; c.strokeStyle = o.color || '#fff'; c.lineWidth = 2; const R = Math.hypot(this.w, this.h) / 2;
      o.lines.forEach(L => { const r1 = R * (L.r + k * .2), r2 = r1 + R * L.l; c.beginPath(); c.moveTo(o.x + Math.cos(L.a) * r1, o.y + Math.sin(L.a) * r1); c.lineTo(o.x + Math.cos(L.a) * r2, o.y + Math.sin(L.a) * r2); c.stroke(); });
    }
    c.restore();
  },
};
const rnd = (a, b) => a + Math.random() * (b - a);
function fxSparks(p, color, n = 18, spd = 9, dir = null, spread = Math.PI * 2){
  for (let i = 0; i < n; i++){ const a = dir === null ? Math.random() * 7 : dir + rnd(-spread / 2, spread / 2), v = rnd(spd * .4, spd);
    FX.add({ type: 'spark', x: p.x, y: p.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, color, life: rnd(300, 650), w: rnd(1.5, 3.5), len: rnd(2, 4) }); }
}
function fxEmbers(p, color, n = 12, up = true){ for (let i = 0; i < n; i++) FX.add({ type: 'ember', x: p.x + rnd(-30, 30), y: p.y + rnd(-20, 20), vx: rnd(-1, 1), vy: up ? rnd(-3, -.5) : rnd(-2, 2), r: rnd(6, 16), color, life: rnd(500, 1100) }); }
function fxSmoke(p, n = 6, big = 1){ for (let i = 0; i < n; i++) FX.add({ type: 'smoke', add: false, x: p.x + rnd(-25, 25) * big, y: p.y + rnd(-6, 6), vx: rnd(-1.5, 1.5) * big, vy: rnd(-1, -.2), r0: 12 * big, r1: rnd(40, 70) * big, life: rnd(700, 1200) }); }
const fxRing = (p, color, r1 = 120, life = 500, flat = 1) => FX.add({ type: 'ring', x: p.x, y: p.y, r0: 8, r1, color, life, flat, w: 12 });
const fxImg = (name, p, s0, s1, life, o = {}) => FX.add(Object.assign({ type: 'img', name, x: p.x, y: p.y, s0, s1, life }, o));
// toạ độ trong khung canvas (tính cả camera zoom)
function local(el, fx = .5, fy = .5){
  const r = el.getBoundingClientRect(), cr = FX.cv.getBoundingClientRect(), sc = cr.width / (FX.w || 1);
  return { x: (r.left + r.width * fx - cr.left) / sc, y: (r.top + r.height * fy - cr.top) / sc };
}

/* ---------- Nhân vật: đổi tư thế, lướt tới, bị đẩy lùi ---------- */
class Fighter {
  constructor(el, prefix, legacy){ this.el = el; this.img = el.querySelector('img'); this.prefix = hasFrames(prefix) ? prefix : null; this.legacy = legacy; this.H = 200; this.x = 0; this.tm = 0; this.cur = 'idle'; }
  size(H){ this.H = H; this.pose(this.cur); }
  pose(name, ms){
    clearTimeout(this.tm); this.cur = name; this.el.dataset.pose = name;
    const key = this.prefix && (FIGHTER_FRAMES[this.prefix + '-' + name] ? this.prefix + '-' + name : this.prefix + '-idle');
    if (key){ const [w, h] = FIGHTER_FRAMES[key]; const src = 'img/fx/' + key + '.webp'; if (!this.img.src.endsWith(src)) this.img.src = src; this.img.style.width = (w / 100 * this.H) + 'px'; this.img.style.height = (h / 100 * this.H) + 'px'; }
    else { if (!this.img.src.endsWith(this.legacy)) this.img.src = this.legacy; this.img.style.height = this.H + 'px'; this.img.style.width = 'auto'; }
    if (ms) this.tm = setTimeout(() => this.pose('idle'), ms);
  }
  move(dx, ms = 170, ease = 'cubic-bezier(.2,.9,.25,1)'){
    const from = this.x; this.x = dx;
    if (this.mv) this.mv.cancel();
    this.mv = this.el.animate([{ transform: `translateX(${from}px)` }, { transform: `translateX(${dx}px)` }], { duration: ms, easing: ease, fill: 'forwards' });
    return this.mv.finished.catch(() => {});
  }
  knock(dx, big){
    this.img.animate([{ transform: 'translateX(0) rotate(0)' }, { transform: `translateX(${dx}px) rotate(${dx > 0 ? 4 : -4}deg)`, offset: .25 }, { transform: 'translateX(0) rotate(0)' }], { duration: big ? 620 : 420, easing: 'ease-out' });
    this.img.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(2.6) saturate(0)', offset: .12 }, { filter: 'brightness(1)' }], { duration: 260 });
  }
}

/* ---------- Camera, khựng hình, chữ lớn ---------- */
function shake(el, px = 10, ms = 380){ el.animate([{ transform: 'translate(0,0)' }, { transform: `translate(${-px}px,${px / 2}px)` }, { transform: `translate(${px}px,${-px / 2}px)` }, { transform: `translate(${-px / 2}px,${-px / 3}px)` }, { transform: 'translate(0,0)' }], { duration: ms, composite: 'add' }); }
function flash(color, ms = 260, op = .55){ const f = fxEl('bt-flash', { background: color }); f.animate([{ opacity: op }, { opacity: 0 }], { duration: ms, easing: 'ease-out' }).onfinish = () => f.remove(); }
function fxEl(cls, css, parent){ const d = document.createElement('div'); d.className = cls; Object.assign(d.style, css || {}); (parent || $('#bt')).appendChild(d); return d; }
const center = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
function dmgNum(el, text, cls){
  const c = center(el), d = fxEl('bt-dmg ' + (cls || ''), { left: c.x + 'px', top: (c.y - 40) + 'px' }); d.textContent = text;
  d.animate([{ transform: 'translate(-50%,-50%) scale(.4)', opacity: 0 }, { transform: 'translate(-50%,-120%) scale(1.25)', opacity: 1, offset: .25 }, { transform: 'translate(-50%,-230%) scale(1)', opacity: 0 }], { duration: 1100, easing: 'ease-out' }).onfinish = () => d.remove();
}
function banner(text, cls, ms = 1000){
  const w = fxEl('bt-ban ' + (cls || ''), null, $('#btAr')); w.innerHTML = text;
  w.animate([{ transform: 'translate(-50%,-50%) scale(2.6)', opacity: 0 }, { transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: .3 }, { transform: 'translate(-50%,-50%) scale(1.04)', opacity: 1, offset: .8 }, { transform: 'translate(-50%,-50%) scale(1.3)', opacity: 0 }], { duration: ms }).onfinish = () => w.remove();
}
const BT = {}; // nhân vật + camera của trận đang diễn ra
function hitStop(ms){
  FX.frozen = performance.now() + ms;
  const an = [BT.P, BT.E].flatMap(f => f ? [f.el, f.img] : []).flatMap(e => e.getAnimations());
  an.forEach(a => { try { a.pause(); } catch (e) {} });
  return sleep(ms).then(() => an.forEach(a => { try { a.play(); } catch (e) {} }));
}
function zoom(to, origin, ms = 380){
  const cam = $('#btCam'); if (!cam) return;
  if (origin) cam.style.transformOrigin = origin;
  cam.animate([{ transform: `scale(${BT.zoom || 1})` }, { transform: `scale(${to})` }], { duration: ms, easing: 'cubic-bezier(.3,.8,.3,1)', fill: 'forwards' });
  BT.zoom = to;
}
const gapPx = () => { const a = BT.P.img.getBoundingClientRect(), b = BT.E.img.getBoundingClientRect(); return Math.max(0, b.left - a.right); };
const pHand = () => local(BT.P.img, .92, .38), eChest = () => local(BT.E.img, .3, .42), pChest = () => local(BT.P.img, .6, .4), eFeet = () => local(BT.E.img, .5, .98), pFeet = () => local(BT.P.img, .5, .98);

/* ---------- Các đòn đánh ---------- */
async function strikeMove(kind){ // đấm / đá thường
  const P = BT.P, E = BT.E, cam = $('#btCam');
  bsfx('whoosh'); P.pose(kind);
  fxSmoke(pFeet(), 3, .7);
  await P.move(gapPx() * .82, 150);
  await hitStop(70);
  const p = eChest();
  bsfx(kind); fxImg('hit', p, .25, .75, 300); fxSparks(p, '#ffd24a', 16, 10, Math.PI, 1.6); fxSparks(p, '#22e3ff', 8, 8, Math.PI, 1.2);
  E.pose('hurt', 420); E.knock(26); shake(cam, 7, 260);
  await sleep(160); P.pose('idle'); await P.move(0, 240, 'ease-out');
}
async function blastMove(){ // bắn chưởng (combo ≥ 3)
  const P = BT.P, E = BT.E, cam = $('#btCam');
  P.pose('cast', 900); bsfx('charge');
  const h = pHand(); fxEmbers(h, '#22e3ff', 10, false); fxRing(h, '#22e3ff', 40, 380);
  await sleep(380);
  const a = pHand(), b = eChest(), life = 340;
  bsfx('zap'); fxImg('orb', a, .45, .6, life, { vx: (b.x - a.x) / (life / 16), vy: (b.y - a.y) / (life / 16), fade: false });
  for (let i = 0; i < 8; i++) setTimeout(() => { const t = i / 8; fxEmbers({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }, '#22e3ff', 2, false); }, i * 40);
  await sleep(life);
  await hitStop(80);
  bsfx('crit'); fxImg('hit', b, .3, 1, 380); fxRing(b, '#22e3ff', 140, 480); fxSparks(b, '#9ff3ff', 26, 12); fxSmoke(eFeet(), 4, 1);
  E.pose('hurt', 520); E.knock(40, true); shake(cam, 12, 380); flash('#22e3ff', 220, .25);
}
async function superMove(label){ // câu ULTIMATE đúng hoặc nút SUPER
  const P = BT.P, E = BT.E, bt = $('#bt'), cam = $('#btCam');
  bt.classList.add('ult'); bsfx('super');
  zoom(1.18, `${local(P.img, .5, .5).x / FX.w * 100}% 70%`, 420);
  banner(label === 'SUPER' ? '⚡ SUPER MOVE ⚡' : '⚡ ULTIMATE ⚡', 'ult', 1300);
  P.pose('cast', 2200);
  const pc = pChest();
  FX.add({ type: 'rays', x: pc.x, y: pc.y, L: Math.max(FX.h, 260) * .9, wd: 26, n: 16, color: 'rgba(255,200,61,.9)', life: 1500, spin: 1.6 });
  FX.add({ type: 'speed', x: pc.x, y: pc.y, color: '#ffe9a8', life: 900, n: 34 });
  fxEmbers(pFeet(), '#ffc83d', FX.low ? 6 : 22); fxSmoke(pFeet(), 5, 1.2);
  await sleep(950);
  zoom(1, '50% 70%', 300);
  const a = pHand(), b = eChest();
  bsfx('laser'); FX.add({ type: 'beam', x1: a.x, y1: a.y, x2: b.x + 30, y2: b.y, w: Math.max(18, FX.h * .07), color: '#ffc83d', life: 900 });
  fxImg('fire', { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, .5, .9, 600, { vx: 4 });
  await sleep(260);
  for (let i = 0; i < 3; i++){
    const p = { x: b.x + rnd(-18, 18), y: b.y + rnd(-30, 30) };
    bsfx('slash'); fxImg('slash', p, .5, 1.05, 380, { rot: [-.6, .5, 1.5][i] }); fxSparks(p, ['#ffc83d', '#ff2e88', '#22e3ff'][i], 18, 12);
    await hitStop(60); E.pose('hurt', 900); E.knock(34, true); shake(cam, 14, 240); await sleep(110);
  }
  bsfx('boom'); flash('#fff', 460, .9); fxImg('hit', b, .4, 1.5, 520); fxRing(b, '#ff2e88', 220, 620); fxRing(b, '#22e3ff', 170, 520); fxSparks(b, '#fff', 40, 15); fxSmoke(eFeet(), 8, 1.4);
  shake(cam, 22, 600); await hitStop(110);
  bt.classList.remove('ult'); await sleep(300);
}
async function enemyMove(big){ // trả lời sai → bị đánh
  const P = BT.P, E = BT.E, bt = $('#bt'), cam = $('#btCam');
  E.pose('atk'); bsfx('whoosh');
  await E.move(-gapPx() * .8, 170);
  await hitStop(big ? 110 : 80);
  const p = pChest();
  bsfx('hurt'); fxImg('hit', p, .25, big ? 1 : .7, 340); fxSparks(p, '#ff1744', big ? 30 : 18, 11, 0, 1.6);
  P.pose('hurt', 650); P.knock(-34, big); shake(cam, big ? 18 : 11, big ? 560 : 380); flash('#ff1744', big ? 420 : 300, big ? .5 : .35);
  const c = center(P.img);
  for (let i = 0; i < 3; i++){ const cl = fxEl('bt-claw', { left: (c.x - 30 + i * 22) + 'px', top: (c.y - 70) + 'px' }); cl.animate([{ clipPath: 'inset(0 0 100% 0)', opacity: 1 }, { clipPath: 'inset(0 0 0 0)', opacity: 1, offset: .35 }, { clipPath: 'inset(0 0 0 0)', opacity: 0 }], { duration: 650, delay: i * 50 }).onfinish = () => cl.remove(); }
  bt.classList.add('hurt'); setTimeout(() => bt.classList.remove('hurt'), 700);
  if (big){ const cr = fxEl('bt-crack'); cr.animate([{ opacity: .9 }, { opacity: 0 }], { duration: 1200, easing: 'ease-in' }).onfinish = () => cr.remove(); }
  await sleep(150); E.pose('idle'); await E.move(0, 260, 'ease-out');
}
async function blockMove(){ // khiên chặn đòn
  const P = BT.P, E = BT.E, cam = $('#btCam');
  E.pose('atk'); bsfx('whoosh');
  await E.move(-gapPx() * .7, 170);
  const p = pChest();
  bsfx('shield'); fxRing({ x: p.x, y: p.y }, '#22e3ff', 110, 650, 1.25); fxRing({ x: p.x, y: p.y }, '#ffffff', 80, 450, 1.25);
  fxSparks({ x: p.x + 50, y: p.y }, '#9ff3ff', 22, 10, 0, 1.4); await hitStop(70);
  banner('🛡 BLOCKED!', 'blk', 900); E.knock(30); shake(cam, 6, 220);
  await sleep(150); E.pose('idle'); await E.move(0, 260, 'ease-out');
}

/* ---------- Trận đấu ---------- */
// cfg: { mode, title, enemy: { name, prefix, legacy, arena, size }, qs, ko: % máu địch còn lại tối đa để thắng, canKO (em có thể bị hạ gục) }
function startBattle(cfg){
  loadFx(); loadSfx(); startMusic();
  const me = lsGet(ME_KEY) || {}, qs = cfg.qs;
  const totalW = qs.reduce((s, q) => s + (q.ult ? 2 : 1), 0);
  const B = { i: 0, ehp: 100, php: 100, combo: 0, maxCombo: 0, res: [], lost: 0, ki: 0, shield: false, supers: 0, blocks: 0, busy: false, startedAt: new Date().toISOString(), over: false };
  window.__BT = B; // để kiểm thử tự động
  const pname = String(me.name || 'You').trim().split(/\s+/).pop(), title = typeof activeTitle === 'function' && activeTitle() ? activeTitle().n : '';
  const ov = document.createElement('div'); ov.className = 'bt'; ov.id = 'bt';
  ov.innerHTML = `
    <div class="ar" id="btAr">
      <div class="ar-cam" id="btCam">
        <div class="ar-bg" style="background-image:url('${cfg.enemy.arena || 'img/ui/hero-teen.webp'}')"></div>
        <div class="ar-dark"></div>
        <div class="ftr p" id="btPlayer"><img alt=""></div>
        <div class="ftr e" id="btEnemy"><img alt=""></div>
        <canvas class="bt-cv" id="btCv"></canvas>
      </div>
      <div class="bth">
        <div class="bth-side">
          <div class="bth-name">${avHtml(me.av || AVATARS[0], 'av')}<span>${esc(pname)}${title ? `<small>${esc(title)}</small>` : ''}</span></div>
          <div class="hp"><i class="trail" id="pTrail"></i><i class="fill p" id="pFill"></i></div>
          <div class="ki" id="kiBar" title="Energy"><i id="kiFill"></i></div>
        </div>
        <div class="bth-mid"><b>VS</b><span id="btCount"></span><span class="bt-btns"><button class="bt-snd" id="btSnd" type="button" aria-label="Sound">${soundOn() ? "🔊" : "🔇"}</button><button class="bt-x" type="button" aria-label="Thoát">✕</button></span></div>
        <div class="bth-side r">
          <div class="bth-name"><span>${esc(cfg.enemy.name)}<small>${esc(cfg.title)}</small></span></div>
          <div class="hp r big"><i class="trail" id="eTrail"></i><i class="fill" id="eFill"></i><span class="ko" style="right:${cfg.ko}%" title="KO line"></span></div>
          <div class="bt-hint">Push HP past the <b>KO</b> line to win!</div>
        </div>
      </div>
      <div class="bt-combo" id="btCombo"></div>
      <div class="bsk">
        <button class="shd" id="skShield" type="button" disabled title="3 correct in a row = shield">🛡<small>SHIELD</small></button>
        <button class="sup" id="skSuper" type="button" disabled title="Full energy = super move">⚡<small>SUPER</small></button>
      </div>
    </div>
    <div class="bt-q" id="btQ"></div>`;
  document.body.appendChild(ov); document.body.classList.add('noscroll');
  FX.init($('#btCv'));
  BT.P = new Fighter($('#btPlayer'), 'p', 'img/ui/mascot-1.webp');
  BT.E = new Fighter($('#btEnemy'), cfg.enemy.prefix, cfg.enemy.legacy);
  BT.zoom = 1;
  const layout = () => {
    FX.resize();
    const ar = $('#btAr'); if (!ar) return;
    const H = Math.min(ar.clientHeight * .52, ar.clientWidth * .36);
    BT.P.size(H); BT.E.size(H * (cfg.enemy.size || 1.15));
  };
  layout(); window.addEventListener('resize', layout);
  const setHP = () => {
    $('#eFill').style.width = B.ehp + '%'; setTimeout(() => { const t = $('#eTrail'); if (t) t.style.width = B.ehp + '%'; }, 450);
    $('#pFill').style.width = B.php + '%'; setTimeout(() => { const t = $('#pTrail'); if (t) t.style.width = B.php + '%'; }, 450);
    $('#eFill').classList.toggle('low', B.ehp <= cfg.ko);
    $('#pFill').classList.toggle('low', B.php <= 30);
  };
  const paintSkills = () => {
    $('#kiFill').style.width = B.ki + '%'; $('#kiBar').classList.toggle('full', B.ki >= 100);
    const sup = $('#skSuper'), ok = B.ki >= 100 && B.cur && !B.cur.lock && !B.busy && !B.done;
    sup.disabled = !ok; sup.classList.toggle('ready', B.ki >= 100 && !B.done);
    $('#skShield').classList.toggle('on', B.shield);
  };
  const close = () => { B.over = true; FX.cv = null; stopMusic(); window.removeEventListener('resize', layout); ov.remove(); document.body.classList.remove('noscroll'); document.removeEventListener('keydown', onKey); if (!LESSON) renderHome(); };
  const onKey = ev => { if (ev.key === 'Escape' && B.done) close(); };
  document.addEventListener('keydown', onKey);
  $('#btSnd').onclick = () => { lsSet(SND_KEY, !soundOn()); $('#btSnd').textContent = soundOn() ? '🔊' : '🔇'; if (soundOn()){ loadSfx(); if (!B.done) startMusic(); } else stopMusic(); paintSnd(); };
  ov.querySelector('.bt-x').onclick = () => { if (B.done || confirmQuit()) close(); };
  function confirmQuit(){ return window.confirm('Leave the fight? This fight won’t count.\n(Thoát trận? Kết quả trận này sẽ không được tính.)'); }
  const lockUI = on => $$('#btQ .bt-opt, #btQ .bt-in, #btQ button').forEach(x => { if (on) x.disabled = true; else if (!B.cur.lock) x.disabled = false; });

  function show(){
    const q = qs[B.i], A = battleAnswers(q); B.cur = { q, A, lock: false };
    $('#btCount').textContent = `${B.i + 1} / ${qs.length}`;
    $('#btQ').innerHTML = `
      ${q.ult ? '<div class="bt-ulttag">⚡ ULTIMATE QUESTION · ×2 damage</div>' : ''}
      <div class="bt-how">${esc(plain(q.e.how || ''))}${q.src ? ` <span class="bt-src">· ${esc(q.src)}</span>` : ''}</div>
      ${q.e.box && !q.e.drag ? `<div class="bt-box">${q.e.box.map(w => w.startsWith('~') ? '' : `<span>${esc(plain(unv(w)))}</span>`).join('')}</div>` : ''}
      <div class="bt-sent">${battleSentence(q)}</div>
      ${A.type === 'opt'
        ? `<div class="bt-opts${A.opts.some(o => o.label.length > 40) ? ' long' : ''}">${A.opts.map((o, i) => `<button class="bt-opt" type="button" data-i="${i}">${esc(o.label)}</button>`).join('')}</div>`
        : `<form class="bt-type" autocomplete="off"><input class="bt-in" type="text" autocapitalize="off" spellcheck="false" placeholder="Type your answer…"><button class="btn orange" type="submit">ATTACK ⚔️</button></form>`}
      <div class="bt-fb" id="btFb"></div>`;
    $('#btQ').classList.toggle('ultq', !!q.ult);
    $('#btQ').scrollTop = 0;
    const inp = $('#btQ .bt-in'); if (inp) setTimeout(() => inp.focus({ preventScroll: true }), 50);
    paintSkills();
  }
  ov.addEventListener('click', ev => { const b = ev.target.closest('.bt-opt'); if (b && B.cur && !B.cur.lock && !B.busy) answer(B.cur.A.opts[+b.dataset.i].ok, b.textContent, b); });
  ov.addEventListener('submit', ev => { ev.preventDefault(); const inp = $('#btQ .bt-in'); if (!B.cur || B.cur.lock || B.busy || !inp.value.trim()) return; answer(B.cur.A.check(inp.value), inp.value.trim(), inp); });
  $('#skSuper').onclick = async () => {
    if (B.ki < 100 || !B.cur || B.cur.lock || B.busy || B.done) return;
    B.busy = true; lockUI(true); paintSkills();
    await superMove('SUPER');
    const dmg = 6; B.ehp = Math.max(0, B.ehp - dmg); setHP(); dmgNum(BT.E.img, 'SUPER -' + dmg, 'ult');
    B.ki = 0; B.supers++; B.busy = false; lockUI(false); paintSkills();
  };

  async function answer(ok, ans, el){
    const { q, A } = B.cur; B.cur.lock = true;
    $$('#btQ .bt-opt, #btQ .bt-in, #btQ button').forEach(x => x.disabled = true);
    paintSkills();
    const w = q.ult ? 2 : 1;
    B.res.push({ q, ans, ok });
    if (ok){
      el.classList.add('ok'); B.combo++; B.maxCombo = Math.max(B.maxCombo, B.combo);
      const before = B.ki; B.ki = Math.min(100, B.ki + (q.ult ? 40 : 20));
      const dmg = Math.round(w / totalW * 100);
      if (q.ult) await superMove('ULTIMATE');
      else if (B.combo >= 3) await blastMove();
      else await strikeMove(B.i % 2 ? 'kick' : 'punch');
      B.ehp = Math.max(0, B.ehp - w / totalW * 100); setHP();
      dmgNum(BT.E.img, (B.combo >= 3 && !q.ult ? 'CRIT ' : '') + '-' + dmg, q.ult ? 'ult' : B.combo >= 3 ? 'crit' : '');
      if (B.combo >= 2){ const c = $('#btCombo'); c.textContent = `COMBO ×${B.combo}`; c.animate([{ transform: 'translateX(-50%) scale(1.8)', opacity: 0 }, { transform: 'translateX(-50%) scale(1)', opacity: 1 }], { duration: 300 }); }
      if (before < 100 && B.ki >= 100){ bsfx('ki'); banner('⚡ SUPER READY', 'ki', 1100); }
      if (B.combo % 3 === 0 && !B.shield){ B.shield = true; bsfx('shield'); banner('🛡 SHIELD UP', 'blk', 1000); }
      paintSkills();
      $('#btFb').innerHTML = `<span class="good">${q.ult ? '💥 ULTIMATE HIT!' : ['✔ Nice hit!', '✔ Boom!', '✔ Clean shot!', '✔ Direct hit!'][B.i % 4]}</span>`;
      await sleep(q.ult ? 500 : 450); next();
    } else {
      if (el) el.classList.add('bad');
      if (A.type === 'opt') $$('#btQ .bt-opt').forEach((b, i) => { if (A.opts[i].ok) b.classList.add('ok'); });
      B.combo = 0; $('#btCombo').textContent = '';
      let blocked = false;
      if (B.shield){ B.shield = false; B.blocks++; blocked = true; paintSkills(); await blockMove(); }
      else {
        await enemyMove(q.ult);
        const hurt = (q.ult ? 28 : 16) * (cfg.canKO ? 1 : .8);
        B.php = cfg.canKO ? Math.max(0, B.php - hurt) : Math.max(8, B.php - hurt); B.lost += hurt; setHP();
        dmgNum(BT.P.img, '-' + Math.round(hurt), 'me');
      }
      $('#btFb').innerHTML = `<div class="bad">${blocked ? '🛡 Blocked – no damage! But the answer is' : '✖ Ouch! Answer:'} <b>${esc(correctOf(q))}</b></div>${q.h ? `<div class="bt-tip">💡 ${esc(plain(q.h))}</div>` : ''}<button class="btn" type="button" id="btNext">${B.php <= 0 ? 'Continue' : 'Next ▶'}</button>`;
      $('#btNext').disabled = false; $('#btNext').onclick = next; $('#btNext').focus({ preventScroll: true });
    }
  }
  function next(){
    if (B.over || B.done) return;
    if (cfg.canKO && B.php <= 0) return end(false, true);
    B.i++; if (B.i < qs.length) show(); else end(B.ehp <= cfg.ko + .01, false);
  }
  async function end(win, ko){
    B.done = true; paintSkills(); $("#btCombo").textContent = "";
    const right = B.res.filter(r => r.ok).length, total = qs.length, P = BT.P, E = BT.E, cam = $('#btCam');
    if (win){
      banner('K.O.!', 'ko', 1200);
      E.pose('ko'); const b = eChest(); bsfx('boom'); flash('#fff', 600, .9); await hitStop(160);
      fxImg('hit', b, .5, 1.8, 700); fxRing(b, '#ffc83d', 260, 800); fxRing(b, '#ff2e88', 200, 700); fxSparks(b, '#ffc83d', 50, 16); fxSmoke(eFeet(), 10, 1.6);
      shake(cam, 20, 600);
      await E.img.animate([{ opacity: 1, filter: 'brightness(1)' }, { opacity: 1, filter: 'brightness(2.5)', offset: .5 }, { opacity: 0, filter: 'brightness(4) blur(4px)' }], { duration: 1100, delay: 500, fill: 'forwards' }).finished;
      P.pose('win'); fxEmbers(pFeet(), '#ffc83d', 16); bsfx('win'); confetti(160);
    } else {
      banner(ko ? 'K.O.' : 'DEFEATED', 'lose', 1300); bsfx('lose');
      P.pose('hurt'); P.img.animate([{ transform: 'rotate(0)', filter: 'none' }, { transform: 'rotate(-14deg) translateY(6%)', filter: 'grayscale(1) brightness(.55)' }], { duration: 700, fill: 'forwards' });
    }
    const r = cfg.onEnd ? cfg.onEnd({ win, ko, right, total, res: B.res, flawless: B.lost === 0, startedAt: B.startedAt, maxCombo: B.maxCombo, supers: B.supers, blocks: B.blocks }) : {};
    $('#btQ').classList.remove('ultq');
    $('#btQ').innerHTML = `<div class="bt-end ${win ? 'win' : 'lose'}">
      <img class="bt-endmas" src="${win ? 'img/fx/p-win.webp' : 'img/fx/p-hurt.webp'}" alt="" onerror="this.src='img/ui/mascot-${win ? 2 : 3}.webp'">
      <div class="bt-endt">${win ? 'VICTORY!' : ko ? 'K.O.' : 'DEFEATED'}</div>
      <div class="bt-ends">${right}/${total} correct · best combo ×${B.maxCombo}${B.lost === 0 && win ? ' · <b>FLAWLESS</b>' : ''}</div>
      <div class="bt-ends sk">⚡ Super moves: ${B.supers} · 🛡 Hits blocked: ${B.blocks}</div>
      ${r.msg ? `<div class="bt-endm">${r.msg}</div>` : ''}
      <div class="gbtns">${r.again ? '<button class="btn orange" type="button" id="btAgain">Fight again 🔁</button>' : ''}<button class="btn lite" type="button" id="btClose">Close</button></div></div>`;
    $('#btClose').onclick = close;
    const ag = $('#btAgain'); if (ag) ag.onclick = () => { B.over = true; FX.cv = null; stopMusic(); window.removeEventListener('resize', layout); ov.remove(); document.body.classList.remove('noscroll'); document.removeEventListener('keydown', onKey); r.again(); };
  }
  setHP(); show();
  // mở màn: hai bên bước vào sân, chữ FIGHT!
  BT.P.el.animate([{ transform: 'translateX(-120%)' }, { transform: 'translateX(0)' }], { duration: 520, easing: 'cubic-bezier(.2,.9,.3,1.1)' });
  BT.E.el.animate([{ transform: 'translateX(120%)' }, { transform: 'translateX(0)' }], { duration: 520, easing: 'cubic-bezier(.2,.9,.3,1.1)' });
  setTimeout(() => { bsfx('start'); banner(cfg.mode === 'boss' ? 'BOSS FIGHT!' : 'FIGHT!', 'start', 1100); fxSmoke(pFeet(), 4, 1); fxSmoke(eFeet(), 4, 1.2); }, 450);
}

/* ---------- Gửi kết quả cho cô (mail + XP) ---------- */
function sendBattle(title, unit, out){
  const me = lsGet(ME_KEY) || {};
  // câu cho mail: kèm nguồn (mission, bài); câu Grammar ghi như mail bài tập (qText: "Picture 2 – topic: ___"…)
  const qLine = q => (q.src ? '[' + q.src + '] ' : '') + (!q.vocab && typeof qText === 'function' ? qText(q) : plain(battleSentence(q).replace(/<span class="bblank">_______<\/span>/, '___')));
  const items = out.res.map((r, i) => ({ sec: '1', n: String(i + 1), q: qLine(r.q) + (r.q.ult ? ' ⚡' : ''), ans: r.ans, correct: correctOf(r.q), ok: r.ok }));
  const now = new Date().toISOString();
  const p = { app: 'btvn', unit, title, name: me.name || 'Unknown', cls: me.cls || '', sid: 'bt' + Date.now().toString(36), redo: 0,
    attempt: 1, canRetry: false, startedAt: out.startedAt, submittedAt: now, timeTakenSec: Math.round((Date.parse(now) - Date.parse(out.startedAt)) / 1000), leaves: 0,
    score: out.right, total: out.total, sections: [{ id: '1', title: `${title} · ${out.win ? 'VICTORY' : 'DEFEATED'}`, score: out.right, total: out.total }],
    items, extras: [], audios: [], wantsAudio: false, audio: null };
  post(p).catch(() => {});
}

/* ---------- Boss fight ---------- */
function startBoss(B){
  const qs = bossQuestions(B); if (!qs.length) return;
  startBattle({ mode: 'boss', title: `BOSS ${BOSSES.indexOf(B) + 1}`, enemy: { name: B.name, prefix: B.fx, legacy: 'img/ui/' + B.img + '.webp', arena: B.arena ? 'img/fx/' + B.arena + '.webp' : '', size: 1.2 }, qs, ko: 40, canKO: false,
    onEnd: out => {
      const st = batState(), rec = st.boss[B.id] || {};
      const first = !rec.done;
      st.fights = (st.fights || 0) + 1; if (out.win) st.wins = (st.wins || 0) + 1;
      rec.done = true; rec.best = Math.max(rec.best || 0, out.right); rec.total = out.total; rec.win = rec.win || out.win; rec.at = rec.at || new Date().toISOString();
      let gain = 0; if (out.win && !rec.xp && !PREVIEW){ rec.xp = BOSS_XP; gain = BOSS_XP; }
      st.boss[B.id] = rec; batSave(st);
      if (first && !PREVIEW) sendBattle(`PET Boss – ${B.name}`, 'PET Boss', out);
      return { msg: `${PREVIEW ? '👀 Preview – nothing sent. ' : first ? '📩 Your teacher got the result of your first fight. ' : 'Practice fight (not sent to your teacher). '}${gain ? `+${gain} XP · ` : ''}Best: ${rec.best}/${out.total}`, again: () => startBoss(B) };
    } });
}
// thẻ Boss ở Lobby: boss đã mở + boss kế tiếp (khoá, đếm câu sai đang dồn lại)
function bossCards(){
  const st = batState().boss || {};
  const open = BOSSES.filter(bossOpen), next = BOSSES.find(B => !bossOpen(B));
  const show = open.slice(-2).concat(next && OPEN_WEEK >= next.after - 3 ? [next] : []);
  if (!show.length) return '';
  return '<h2 class="sech">👹 Boss</h2>' + show.map(B => {
    const p = bossPool(B), ok = bossOpen(B), rec = st[B.id], n = p.wrong.length, wk = `weeks ${B.weeks[0]}–${B.weeks[B.weeks.length - 1]}`;
    const s = n === 1 ? '' : 's';
    const line = !ok ? `Unlocks after week ${B.after}. Every mistake you make in ${wk} comes back here 👀${n ? ` · <b>${n}</b> collected so far` : ''}`
      : n ? `<b>${n}</b> mistake${s} from ${wk} ${n === 1 ? 'is' : 'are'} back for revenge ⚔️`
      : p.right.length ? `No mistakes in ${wk}? Wow! The boss will ask other questions 😎`
      : `Finish your missions first – the boss uses the questions you got wrong 😉`;
    const res = rec ? `<small>${rec.win ? '🏆 Defeated' : '💀 Not defeated yet'} · Best ${rec.best}/${rec.total || BOSS_N}${rec.xp ? ' · +' + rec.xp + ' XP' : ''}</small>` : `<small>First win: +${BOSS_XP} XP</small>`;
    return `<section class="card bossc${ok ? '' : ' lock'}${rec && rec.win ? ' won' : ''}"><img class="bimgb" src="img/ui/${B.img}.webp" alt="👹" onerror="this.replaceWith(Object.assign(document.createElement('span'),{style:'font-size:56px',textContent:'👹'}))">
      <div class="bq"><div class="pl-tag">${ok ? '' : '🔒 '}BOSS ${BOSSES.indexOf(B) + 1} · ${wk.toUpperCase()}</div><b>${esc(B.name)}</b><span>${line}</span>${ok ? res : ''}</div>
      ${ok ? `<button class="btn" type="button" data-boss="${B.id}">${rec ? 'REMATCH ⚔️' : 'FIGHT ⚔️'}</button>` : ''}</section>`;
  }).join('');
}

/* ---------- Gắn vào Lobby ---------- */
function afterHomeBattle(){
  $$('[data-boss]').forEach(x => x.onclick = ev => { ev.preventDefault(); const B = BOSSES.find(y => y.id === x.dataset.boss); if (B && bossOpen(B)) startBoss(B); });
  // ?boss=boss1&preview → mở thẳng trận (cô xem trước)
  const bid = QP.get('boss'); if (bid && PREVIEW && !afterHomeBattle.done){ afterHomeBattle.done = true; const B = BOSSES.find(y => y.id === bid); if (B) startBoss(B); }
}
