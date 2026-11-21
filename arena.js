/* =====================================================================
   PET ARENA – lớp game (phong cách rank / esports cho học sinh ~16 tuổi)
   Âm thanh, pháo hoa, XP + Rank, sảnh chính (lobby), thành tựu, Word Rush,
   avatar, câu chọc / khen của cô.
   Nạp TRƯỚC app.js. Các hàm ở đây chỉ được GỌI sau khi app.js đã chạy
   (dùng chung $, lsGet, LESSONS, VOCAB, S, say… của app.js).
   ===================================================================== */
const SND_KEY = 'pet-sound', BADGE_KEY = 'pet-badges', RUSH_KEY = 'pet-rush', RANK_KEY = 'pet-rank', TEASE_KEY = 'pet-tease';

/* ---------- Âm thanh (WebAudio, không cần file) ---------- */
let AC = null;
const soundOn = () => lsGet(SND_KEY) !== false;
const TUNES = {
  tick: [[1046, .04]], pop: [[740, .05], [1110, .06]], ok: [[587, .07], [880, .07], [1175, .12]],
  bad: [[180, .18]], win: [[523, .09], [659, .09], [784, .09], [1047, .3]],
  badge: [[784, .08], [988, .08], [1175, .08], [1568, .3]], rank: [[392, .1], [523, .1], [659, .1], [784, .1], [1047, .4]],
};
function sfx(kind){
  if (!soundOn() || !TUNES[kind]) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
    let t = AC.currentTime + .01;
    TUNES[kind].forEach(([f, d]) => {
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = kind === 'bad' ? 'square' : kind === 'tick' ? 'sine' : 'sawtooth'; o.frequency.value = f;
      const vol = kind === 'bad' ? .04 : kind === 'tick' ? .06 : .07;
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .01);
      g.gain.exponentialRampToValueAtTime(.0001, t + d);
      o.connect(g).connect(AC.destination); o.start(t); o.stop(t + d + .03); t += d * .9;
    });
  } catch (e) {}
}
function paintSnd(){
  const b = $('#sndBtn'); if (!b) return;
  b.textContent = soundOn() ? '🔊' : '🔇';
  b.title = soundOn() ? 'Tắt âm thanh' : 'Bật âm thanh';
}
function initArena(){
  const b = $('#sndBtn');
  if (b){ b.addEventListener('click', () => { lsSet(SND_KEY, !soundOn()); paintSnd(); sfx('tick'); }); paintSnd(); }
}

/* ---------- Pháo hoa ---------- */
function confetti(n){
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  n = reduce ? 30 : (n || 140);
  const box = document.createElement('div'); box.className = 'confetti';
  const C = ['#22d3ee', '#e94bff', '#a3ff3c', '#ffd23f', '#ff4d6d', '#6fb6ff'];
  for (let i = 0; i < n; i++){
    const p = document.createElement('i');
    p.style.left = Math.random() * 100 + 'vw'; p.style.background = C[i % C.length];
    p.style.animationDelay = Math.random() * .7 + 's'; p.style.animationDuration = 2.2 + Math.random() * 1.8 + 's';
    p.style.setProperty('--dx', Math.round(Math.random() * 200 - 100) + 'px'); p.style.setProperty('--r', Math.round(Math.random() * 900) + 'deg');
    if (i % 4 === 0) p.style.width = '4px';
    box.appendChild(p);
  }
  document.body.appendChild(box); setTimeout(() => box.remove(), 5000);
}
// dòng nhắc nổi ở đầu màn hình, tự tắt
function toast(html, ms = 4200){
  let t = $('#toast');
  if (!t){ document.body.insertAdjacentHTML('beforeend', '<div class="toast" id="toast" role="status" hidden></div>'); t = $('#toast'); }
  t.innerHTML = html; t.hidden = false; t.classList.remove('show'); void t.offsetWidth; t.classList.add('show');
  clearTimeout(toast.tm); toast.tm = setTimeout(() => { t.hidden = true; }, ms);
}

/* ---------- Hình vẽ bằng ChatGPT (img/ai/<tên>.webp). Chưa có file → dùng giao diện cũ (emoji / CSS) ---------- */
const AI = 'img/ai/';
// <img> có dự phòng: lỗi tải → thay bằng chữ / emoji trong data-fb (rỗng = bỏ hình)
const aiImg = (name, cls, fb = '') => `<img class="${cls}" src="${AI}${name}.webp" alt="" data-fb="${esc(fb)}" onerror="imgFail(this)">`;
function imgFail(el){
  const fb = el.dataset.fb, box = el.closest('[data-hide-on-fail]');
  if (box){ box.remove(); return; }
  if (fb) el.replaceWith(Object.assign(document.createElement('span'), { className: el.className + ' fb', textContent: fb }));
  else el.remove();
}

/* ---------- Avatar: hình vẽ sẵn, emoji hoặc ảnh trong máy (chỉ lưu trên máy em, không gửi đi) ---------- */
const PIC_AVATARS = Array.from({ length: 16 }, (_, i) => 'pic:' + (i + 1)); // img/ai/av-1…16.webp
const AVATARS = ['🦊', '🐺', '🦅', '🐉', '🦈', '🐯', '🦁', '🐼', '🦉', '👾', '🤖', '🥷', '😎', '🎮', '🎧', '⚡', '🔥', '🌙', '🛸', '🏀'];
let AV = '';
const avHtml = (av, c = 'av') => /^data:image\//.test(av || '') ? `<img class="${c}" src="${av}" alt="">`
  : /^pic:\d+$/.test(av || '') ? aiImg('av-' + av.slice(4), c, '🎮')
  : `<span class="${c}">${esc(av || '🎮')}</span>`;
// ảnh trong máy → cắt vuông, thu nhỏ 160px
function loadAvatarFile(f, done){
  if (!f || !/^image\//.test(f.type)) return;
  const r = new FileReader();
  r.onload = () => { const im = new Image(); im.onload = () => {
    const s = Math.min(im.width, im.height), c = document.createElement('canvas'); c.width = c.height = 160;
    c.getContext('2d').drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, 160, 160);
    done(c.toDataURL('image/jpeg', 0.82)); }; im.src = r.result; };
  r.readAsDataURL(f);
}
const avPickerHtml = () => `<div class="field"><label>Choose your avatar</label>
  <div class="avrow"><div id="avPrev" class="avprev"></div><div class="avpick" id="avPick">${PIC_AVATARS.map(x => `<button type="button" class="avb pic" data-av="${x}" data-hide-on-fail>${aiImg('av-' + x.slice(4), 'avimg')}</button>`).join('')}${AVATARS.map(x => `<button type="button" class="avb" data-av="${x}">${x}</button>`).join('')}<button type="button" class="avb avup" id="avUp" title="Ảnh trong máy">📷</button><input type="file" id="avFile" accept="image/*" hidden></div></div>
  <div class="muted small">📷 = chọn ảnh trong máy của em (ảnh chỉ lưu trên máy này)</div></div>`;
function paintAvPick(){
  $$('#avPick .avb[data-av]').forEach(b => b.classList.toggle('on', b.dataset.av === AV));
  const up = $('#avUp'); if (up){ up.classList.toggle('on', /^data:/.test(AV)); up.innerHTML = /^data:/.test(AV) ? avHtml(AV, 'avimg') : '📷'; }
  const pv = $('#avPrev'); if (pv) pv.innerHTML = avHtml(AV, 'av big');
}
function bindAvPicker(me){
  AV = me.av || AVATARS[Math.floor(Math.random() * AVATARS.length)]; paintAvPick();
  $('#avPick').addEventListener('click', ev => { const b = ev.target.closest('.avb'); if (!b) return;
    if (b.id === 'avUp'){ $('#avFile').click(); return; } AV = b.dataset.av; paintAvPick(); sfx('tick'); });
  $('#avFile').addEventListener('change', ev => loadAvatarFile(ev.target.files[0], d => { AV = d; paintAvPick(); }));
}

/* ---------- XP + Rank ---------- */
// XP 1 mission (chỉ tính khi đã xong): độ chính xác lần 1 (tối đa 100) + sửa đúng ở lần 2 (tối đa 50, theo tỉ lệ)
// + 20 nếu không rời trang lần nào + 50 nếu đúng hết ngay lần 1. Word Rush: 2 XP/câu đúng (3 lượt đầu mỗi ngày).
function missionXP(s){
  const z = { total: 0, acc: 0, fix: 0, focus: 0, flawless: 0 };
  if (!s || s.phase !== 'done' || !s.r1) return z;
  const r1 = s.r1;
  z.acc = r1.total ? Math.round(r1.score / r1.total * 100) : 100;
  // sửa đúng ở lần 2: theo tỉ lệ số câu, tối đa +50 (luôn thấp hơn đúng ngay từ đầu, để không ai cố tình làm ẩu lần 1)
  if (s.r2 && r1.total) z.fix = Math.round(Object.keys(r1.items || {}).filter(k => !r1.items[k].ok && s.r2.items[k] && s.r2.items[k].ok).length / r1.total * 50);
  if (!((s.r2 || r1).leaves)) z.focus = 20;
  if (r1.total && r1.score === r1.total) z.flawless = 50;
  z.total = z.acc + z.fix + z.focus + z.flawless;
  return z;
}
const RANKS = [
  { n: 'Bronze', x: 0, c: '#d08a4c' }, { n: 'Silver', x: 200, c: '#c3cddc' }, { n: 'Gold', x: 450, c: '#ffd23f' },
  { n: 'Platinum', x: 800, c: '#3ee0c8' }, { n: 'Diamond', x: 1250, c: '#6fb6ff' }, { n: 'Master', x: 1800, c: '#c86bff' },
  { n: 'Legend', x: 2500, c: '#ff4d8b' },
];
const ROMAN = ['III', 'II', 'I'];
function rankOf(xp){
  let i = 0; while (i < RANKS.length - 1 && xp >= RANKS[i + 1].x) i++;
  const R = RANKS[i], N = RANKS[i + 1];
  if (!N) return { i, tier: i * 3, name: R.n, div: '', label: R.n, c: R.c, next: null, pct: 100 };
  const span = (N.x - R.x) / 3, d = Math.min(2, Math.floor((xp - R.x) / span));
  return { i, tier: i * 3 + d, name: R.n, div: ROMAN[d], label: R.n + ' ' + ROMAN[d], c: R.c, next: N, pct: Math.round((xp - R.x) / (N.x - R.x) * 100) };
}
// huy hiệu hạng: hình img/ai/rank-1…7.webp (chưa có → khiên lục giác bằng CSS); bậc III/II/I in đè lên
const emblem = (rk, big) => `<div class="emb${big ? ' big' : ''}" style="--rc:${rk.c}">${aiImg('rank-' + (rk.i + 1), 'embi')}<b>${rk.div || '★'}</b></div>`;

/* ---------- Số liệu tổng ---------- */
function gameData(){
  const weeks = Object.keys(LESSONS).map(Number).filter(w => w <= OPEN_WEEK).sort((a, b) => a - b);
  const states = weeks.map(w => ({ w, L: LESSONS[w], s: lsGet(storeKey(w)) || {} }));
  const rush = Object.assign({ plays: 0, best: 0, xp: 0, days: {} }, lsGet(RUSH_KEY) || {});
  const done = states.filter(x => x.s.phase === 'done');
  const pool = [];
  done.forEach(x => (x.L.newWords || []).forEach(k => { if (VOCAB[k] && !pool.includes(k)) pool.push(k); }));
  const accs = done.map(x => x.s.r1 && x.s.r1.total ? x.s.r1.score / x.s.r1.total : 1);
  let run = 0, maxStreak = 0;
  states.forEach(x => { run = x.s.phase === 'done' ? run + 1 : 0; maxStreak = Math.max(maxStreak, run); });
  // chuỗi hiện tại: đếm lùi từ tuần mới nhất (tuần đang mở chưa làm thì chưa tính là đứt)
  let streak = 0;
  for (let i = states.length - 1; i >= 0; i--){
    if (states[i].s.phase === 'done') streak++;
    else if (i === states.length - 1) continue;
    else break;
  }
  const missionsXP = done.reduce((a, x) => a + missionXP(x.s).total, 0);
  const xp = missionsXP + (rush.xp || 0);
  return { weeks, states, done, rush, pool, words: pool.length, xp, rank: rankOf(xp), streak, maxStreak,
    acc: accs.length ? Math.round(accs.reduce((a, b) => a + b, 0) / accs.length * 100) : 0 };
}

/* ---------- Thành tựu ---------- */
const BADGES = [
  { id: 'first', icon: '🎯', name: 'First Clear', vi: 'Hoàn thành mission đầu tiên', test: d => d.done.length >= 1 },
  { id: 'flawless', icon: '💎', name: 'Flawless', vi: 'Đúng hết ngay lần nộp đầu', test: d => d.done.some(x => x.s.r1 && x.s.r1.total && x.s.r1.score === x.s.r1.total) },
  { id: 'comeback', icon: '🔁', name: 'Comeback', vi: 'Lần 2 sửa đúng hết câu sai', test: d => d.done.some(x => x.s.r2 && x.s.r2.score === x.s.r2.total) },
  { id: 'locked', icon: '🎧', name: 'Locked In', vi: 'Xong 1 mission mà không rời trang lần nào', test: d => d.done.some(x => !((x.s.r2 || x.s.r1 || {}).leaves)) },
  { id: 'fire', icon: '🔥', name: 'On Fire', vi: 'Hoàn thành 3 tuần liên tiếp', test: d => d.maxStreak >= 3 },
  { id: 'rush', icon: '⚡', name: 'Word Rush 10/10', vi: 'Đúng 10/10 trong Word Rush', test: d => d.rush.best >= 10 },
  { id: 'vocab', icon: '📚', name: 'Vocab Hoarder', vi: 'Học được 50 từ mới', test: d => d.words >= 50 },
  { id: 'gold', icon: '🥇', name: 'Gold Rank', vi: 'Lên hạng Gold', test: d => d.rank.i >= 2 },
];
const earnedBadges = d => BADGES.filter(b => b.test(d)).map(b => b.id);
// hình huy chương img/ai/badge-1…8.webp theo thứ tự BADGES (chưa có → emoji)
const badgeIcon = b => aiImg('badge-' + (BADGES.indexOf(b) + 1), 'bimg', b.icon);
const coachImg = () => aiImg('coach', 'coach');
function badgesHtml(d){
  const got = earnedBadges(d);
  return `<section class="card ach"><h2 class="sech">🏅 Achievements <span class="cnt">${got.length}/${BADGES.length}</span></h2>
    <div class="bgrid">${BADGES.map(b => { const on = got.includes(b.id);
      return `<div class="bdg${on ? ' on' : ''}"><span class="bic">${badgeIcon(b)}${on ? '' : '<i class="blk">🔒</i>'}</span><b>${b.name}</b><small>${b.vi}</small></div>`; }).join('')}</div></section>`;
}
function overlay(html){
  const ov = document.createElement('div'); ov.className = 'fxov';
  ov.innerHTML = `<div class="fxcard">${html}<button class="btn" type="button">GG 🎉</button></div>`;
  ov.addEventListener('click', ev => { if (ev.target === ov || ev.target.closest('button')) ov.remove(); });
  document.body.appendChild(ov);
}
function checkBadges(){
  const d = gameData(), got = earnedBadges(d), seen = lsGet(BADGE_KEY) || [];
  const fresh = got.filter(id => !seen.includes(id));
  if (!fresh.length) return false;
  lsSet(BADGE_KEY, seen.concat(fresh));
  overlay(`${coachImg()}<div class="fxt">ACHIEVEMENT UNLOCKED</div>
    ${fresh.map(id => { const b = BADGES.find(x => x.id === id); return `<div class="fxb"><span class="bic">${badgeIcon(b)}</span><div><b>${b.name}</b><small>${b.vi}</small></div></div>`; }).join('')}`);
  confetti(100); sfx('badge'); return true;
}
// Lên hạng / lên bậc → màn chúc mừng
function checkRank(){
  const d = gameData(), last = lsGet(RANK_KEY);
  if (last === null || last === undefined){ lsSet(RANK_KEY, d.rank.tier); if (d.rank.tier === 0) return false; }
  else if (d.rank.tier <= last){ if (d.rank.tier < last) lsSet(RANK_KEY, d.rank.tier); return false; }
  lsSet(RANK_KEY, d.rank.tier);
  overlay(`${coachImg()}<div class="fxt">RANK UP</div>${emblem(d.rank, true)}<div class="fxr" style="color:${d.rank.c}">${d.rank.label}</div>
    <p class="muted">${d.xp} XP${d.rank.next ? ` · còn ${d.rank.next.x - d.xp} XP nữa lên ${d.rank.next.n}` : ' · hạng cao nhất!'}</p>`);
  confetti(160); sfx('rank'); return true;
}

/* ---------- Sảnh chính (trang chủ) ---------- */
const two = n => String(n).padStart(2, '0');
function lobbyHtml(){
  const d = gameData(), me = lsGet(ME_KEY) || {}, rk = d.rank;
  const first = (typeof YA !== 'undefined' && YA && YA.me()) ? YA.me().name : String(me.name || '').trim().split(/\s+/).pop(); // đăng nhập → nguyên nickname
  const next = LESSONS[OPEN_WEEK + 1];
  const missions = d.states.slice().reverse().map(({ w, L, s }) => {
    const r = s.r2 || s.r1, x = missionXP(s).total;
    const st = s.phase === 'done' ? `<span class="tag ok">${starRow(starsOf(s))} ${r ? r.score + '/' + r.total : ''}</span><span class="tag xp">+${x} XP</span>`
      : s.phase === 'retry' || s.phase === 'review' ? '<span class="tag warn">✏️ Làm lại câu sai</span>'
      : s.startedAt ? '<span class="tag">⏳ In progress</span>' : '<span class="tag new">NEW</span>';
    const btn = s.phase === 'done' ? 'REVIEW' : s.phase === 'retry' || s.phase === 'review' ? 'FIX ✏️' : s.startedAt ? 'CONTINUE ▶' : 'PLAY ▶';
    return `<a class="card lesson mission${s.phase === 'done' ? ' done' : ''}${w === OPEN_WEEK ? ' now' : ''}" href="?w=${w}">
      ${aiImg('mission-' + String(L.code).toLowerCase().replace(/\s+/g, ''), 'mthumb')}<div class="lnum">${two(w)}</div>
      <div class="linfo"><div class="lt">MISSION ${two(w)} · ${esc(L.code)}${w === OPEN_WEEK ? ' · <b class="nowtag">THIS WEEK</b>' : ''}</div>
        <div class="ln">${esc(L.title)}</div><div class="ls">${st}</div></div>
      <span class="play">${btn}</span></a>`;
  }).join('');
  return `<section class="card player">
      <div class="pl-top">
        <div class="pl-av">${avHtml(me.av, 'av big')}</div>
        <div class="pl-id"><div class="pl-tag">PLAYER</div><h2>${first ? esc(first) : 'New player'}</h2>${me.cls ? `<div class="pl-cls">Class ${esc(me.cls)}</div>` : ''}</div>
        <div class="pl-rank">${emblem(rk)}<div class="rk-n" style="color:${rk.c}">${rk.label}</div></div>
      </div>
      <div class="xpbox"><div class="xp-t"><span><b>${d.xp}</b> XP</span><span>${rk.next ? `${rk.next.x - d.xp} XP → ${rk.next.n}` : 'MAX RANK'}</span></div>
        <div class="xp-bar"><i style="width:${rk.pct}%;--rc:${rk.c}"></i></div></div>
      <div class="stats">
        <div class="stat"><b>🎯 ${d.done.length ? d.acc + '%' : '–'}</b><span>accuracy</span></div>
        <div class="stat"><b>🔥 ${d.streak}</b><span>week streak</span></div>
        <div class="stat"><b>📒 ${d.words}</b><span>new words</span></div>
        <div class="stat"><b>🏁 ${d.done.length}/${d.states.length}</b><span>missions</span></div>
      </div>
      <p class="hiline">${hiLine()}</p>
    </section>
    <h2 class="sech">🎮 Missions</h2>
    ${missions}
    ${next ? `<div class="card lesson mission locked"><div class="lnum">🔒</div><div class="linfo"><div class="lt">MISSION ${two(OPEN_WEEK + 1)}</div><div class="ln">Unlocks next week</div></div></div>` : ''}
    ${rushCard(d)}
    ${badgesHtml(d)}
    <p class="muted small xpnote">⚡ XP = độ chính xác lần nộp đầu (tối đa 100) · sửa đúng ở lần 2: tối đa +50 · +20 nếu không rời trang · +50 nếu đúng hết ngay lần đầu · Word Rush +2/câu đúng.</p>`;
}
function afterHome(){
  const b = $('#rushBtn'); if (b) b.onclick = () => { sfx('tick'); startRush(); };
  setTimeout(() => { if (!checkRank()) checkBadges(); }, 500);
}

/* ---------- Word Rush: 10 từ / 60 giây ---------- */
function rushCard(d){
  const ok = d.pool.length >= 4;
  return `<section class="card rush${ok ? '' : ' off'}"><div class="rush-ic">${aiImg('word-rush', 'rimg', '⚡')}</div>
    <div class="rush-t"><b>WORD RUSH</b><span>${ok ? `${Math.min(10, d.pool.length)} words · 60 seconds · +2 XP mỗi câu đúng` : 'Hoàn thành 1 mission để mở khoá Word Rush.'}</span>
    ${d.rush.plays ? `<small>Best ${d.rush.best}/10 · Played ${d.rush.plays}×</small>` : ''}</div>
    <button class="btn" id="rushBtn" type="button"${ok ? '' : ' disabled'}>PLAY ▶</button></section>`;
}
const todayStr = () => new Date().toLocaleDateString('en-CA');
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const viShort = v => (v.vi.replace(/\s*\([^)]*\)/g, '').trim() || v.vi);
function startRush(){
  const d = gameData(); if (d.pool.length < 4) return;
  const keys = shuffle(d.pool).slice(0, 10);
  const others = shuffle(Object.keys(VOCAB).filter(k => !keys.includes(k)));
  const Q = keys.map((k, i) => {
    const mode = i % 2 ? 'vi' : 'en';
    const wrong = shuffle(d.pool.filter(x => x !== k)).concat(others).filter(x => viShort(VOCAB[x]) !== viShort(VOCAB[k]) && VOCAB[x].w !== VOCAB[k].w);
    return { k, mode, opts: shuffle([k].concat(wrong.slice(0, 3))) };
  });
  const G = { i: 0, score: 0, left: 60, lock: false, timer: null, over: false };
  const ov = document.createElement('div'); ov.className = 'fxov game';
  ov.innerHTML = `<div class="gcard"><div class="ghead"><b>⚡ WORD RUSH</b><span class="gsc" id="gSc">0</span><button class="gx" type="button" aria-label="Close">✕</button></div>
    <div class="gtime"><i id="gT"></i></div><div id="gBody"></div></div>`;
  document.body.appendChild(ov);
  const body = ov.querySelector('#gBody');
  const onKey = ev => { if (ev.key === 'Escape') close(); };
  const close = () => { clearInterval(G.timer); ov.remove(); document.removeEventListener('keydown', onKey); renderHome(); };
  document.addEventListener('keydown', onKey);
  ov.querySelector('.gx').onclick = close;
  function show(){
    const q = Q[G.i], v = VOCAB[q.k];
    body.innerHTML = `<div class="gno">${G.i + 1} / ${Q.length}</div>
      ${q.mode === 'en' ? `<div class="gq"><button class="gsay" type="button" aria-label="Listen">🔊</button> ${esc(v.w)}</div><div class="gh">What does it mean?</div>`
        : `<div class="gq vi">${esc(viShort(v))}</div><div class="gh">Which English word?</div>`}
      <div class="gopts">${q.opts.map(o => `<button class="gopt" type="button" data-k="${esc(o)}">${esc(q.mode === 'en' ? viShort(VOCAB[o]) : VOCAB[o].w)}</button>`).join('')}</div>`;
    if (q.mode === 'en') say(v.w);
    const s = body.querySelector('.gsay'); if (s) s.onclick = () => say(v.w);
    G.lock = false;
  }
  body.addEventListener('click', ev => {
    const b = ev.target.closest('.gopt'); if (!b || G.lock) return;
    G.lock = true;
    const q = Q[G.i], right = b.dataset.k === q.k;
    body.querySelectorAll('.gopt').forEach(x => { if (x.dataset.k === q.k) x.classList.add('ok'); });
    if (right){ G.score++; sfx('ok'); ov.querySelector('#gSc').textContent = G.score; }
    else { b.classList.add('bad'); sfx('bad'); }
    if (q.mode === 'vi') say(VOCAB[q.k].w);
    setTimeout(() => { if (G.over) return; G.i++; G.i < Q.length ? show() : end(); }, right ? 700 : 1400);
  });
  function end(){
    if (G.over) return; G.over = true; clearInterval(G.timer);
    const r = Object.assign({ plays: 0, best: 0, xp: 0, days: {} }, lsGet(RUSH_KEY) || {});
    const t = todayStr(), n = r.days[t] || 0, gain = n < 3 ? G.score * 2 : 0; // mỗi ngày tính XP 3 lượt đầu
    r.plays++; r.best = Math.max(r.best, Q.length >= 10 ? G.score : 0); r.xp = (r.xp || 0) + gain; r.days = { [t]: n + 1 };
    lsSet(RUSH_KEY, r);
    const pct = G.score / Q.length;
    body.innerHTML = `<div class="gend">${pct >= .7 ? coachImg() : ''}<div class="gbig">${G.score} / ${Q.length}</div>
      <p class="gmsg">${pct === 1 ? 'Flawless run! 💎' : pct >= .7 ? 'Nice run, keep grinding! 💪' : 'GG. Chơi lại để nhớ từ lâu hơn 🔁'}</p>
      <p class="muted small">${gain ? `+${gain} XP` : 'Hôm nay em đã nhận đủ XP Word Rush (3 lượt). Vẫn chơi tiếp để nhớ từ nhé!'}</p>
      <div class="gbtns"><button class="btn" type="button" id="gAgain">PLAY AGAIN 🔁</button><button class="btn ghost" type="button" id="gClose">LOBBY</button></div></div>`;
    if (pct === 1){ confetti(); sfx('win'); } else sfx('ok');
    body.querySelector('#gAgain').onclick = () => { clearInterval(G.timer); ov.remove(); document.removeEventListener('keydown', onKey); startRush(); };
    body.querySelector('#gClose').onclick = close;
  }
  const bar = ov.querySelector('#gT');
  G.timer = setInterval(() => {
    G.left -= .25; bar.style.width = Math.max(0, G.left / 60 * 100) + '%';
    bar.classList.toggle('low', G.left <= 10);
    if (G.left <= 0){ G.lock = true; end(); }
  }, 250);
  show();
}

/* ---------- Sau khi nộp bài ---------- */
function afterSubmit(){
  const r = S.r2 || S.r1;
  if (S.phase === 'done' && r && r.score === r.total){ confetti(); sfx('win'); } else sfx('ok');
  if (S.phase === 'done') setTimeout(() => { if (!checkRank()) checkBadges(); }, 2200);
}
// thẻ XP trong ô kết quả (khi đã xong)
function xpLine(){
  const z = missionXP(S); if (!z.total) return '';
  const parts = [['Accuracy', z.acc], ['Fix', z.fix], ['Focus', z.focus], ['Flawless', z.flawless]].filter(p => p[1]);
  return `<div class="xpgain"><b>+${z.total} XP</b><span>${parts.map(p => `${p[0]} +${p[1]}`).join(' · ')}</span></div>`;
}

/* ---------- Câu chọc / khen của cô (tiếng Việt, chọn ngẫu nhiên, không lặp câu vừa dùng) ---------- */
const TEASE = {
  empty: [ // nộp khi còn trống > 25%
    'Mới clear <b>{x}/{n}</b> câu đã đòi về base? Còn <b>{e} câu</b> đang chờ kìa 😏',
    'Bỏ trống <b>{e} câu</b> mà đòi nộp, em tính AFK giữa trận à? 🎮',
    'Nộp kiểu này chắc cô phải chấm bằng tâm linh 🔮 Làm nốt đi em!',
    'Chưa đi hết map mà đã muốn end game? Còn <b>{e} câu</b> nha 🗺️'],
  early: [ // nộp khi chưa đủ 3 phút
    '<b>{m} phút</b> clear {n} câu? Bật hack tốc độ à em? 🚩 Soát lại thêm <b>{r} phút</b> nhé.',
    'Đây là bài tập chứ có phải speedrun đâu 😌 Còn <b>{r} phút</b> nữa mới nộp được.',
    'Nhanh vậy chắc có buff hả? 🤨 Đọc lại đề thêm <b>{r} phút</b> đi.',
    'Tốc độ này cô hơi nghi đó nha 🕵️ Kiểm tra lại thêm <b>{r} phút</b> rồi tính.'],
  away: [ // quay lại trang sau hơn 5 lần rời trang
    'Tab nào hấp dẫn hơn bài của cô vậy? 👀',
    'Alt-tab hơi nhiều rồi đó nha 😏',
    'Cô thấy hết đó, đừng tưởng cô không biết 🕵️',
    'Đang chat với crush hay đang tra Google vậy? 🤭',
    'Rời trận nhiều quá là bị report đó nha 🚩'],
  low1: [ // điểm lần 1 dưới 70%
    '{s}/{t}… Trận này hơi feed rồi đó em 😬 Vào làm lại câu sai gỡ lại đi!',
    'Sai {w} câu, đánh vậy là rớt hạng đó nha 📉 Comeback cho cô xem nào!',
    '{s}/{t}? Cô biết em không chỉ có vậy. Bật mode nghiêm túc lên! 😤',
    'Hơi toang nhẹ rồi 😅 Mở ô Grammar ra đọc lại rồi phục thù!'],
  fixAll: [ // lần 2: sửa đúng hết
    'Comeback quá đỉnh, sửa sạch không trượt câu nào! MVP tuần này 🏆',
    'Clear 100%! Gọi em là main character được rồi đó 😎',
    'Flawless comeback, cô duyệt! 🔥',
    'Sửa hết luôn, đúng kiểu ăn trọn điểm. Respect! 🫡'],
  fixSome: [ // lần 2: sửa đúng một phần
    'Gỡ lại được {f} câu, không tệ chút nào! Mấy câu còn lại lên lớp cô cân 💪',
    '{f} câu đã được hồi sinh ✨ Cố thêm chút là lên hạng rồi!',
    'Tiến bộ thật sự, {f} câu xanh rồi đó. Keep grinding! 📈',
    'Không bỏ cuộc là có điểm. +{f} câu, cô ghi nhận 👏'],
  fixNone: [ // lần 2: chưa sửa đúng câu nào
    'Lần này chưa ăn được câu nào, nhưng thua keo này ta bày keo khác. Xem đáp án bên dưới nha 👇',
    'Hơi xui xíu thôi. Đọc kĩ đáp án rồi tuần sau gỡ lại cho cô 💪'],
  nofix: [ // bấm Nộp lần 2 khi chưa sửa câu nào
    'Nộp lại y chang bản cũ? Cô không cần bản copy đâu 😑',
    'Chưa sửa gì mà đòi nộp lần 2, em đang test cô à? 🙄',
    'Hai bản giống nhau như sinh đôi vậy, sửa đi rồi nộp! 👯'],
  flawless: [ // đúng hết ngay lần 1
    'Flawless! Không một vết xước 💎',
    'Ace luôn! Trận này em gánh team rồi 🏆',
    'Perfect run, cô không có gì để chê 😎'],
};
function tease(kind, vars = {}){
  const list = TEASE[kind], last = lsGet(TEASE_KEY) || {};
  let i; do { i = Math.floor(Math.random() * list.length); } while (list.length > 1 && i === last[kind]);
  last[kind] = i; lsSet(TEASE_KEY, last);
  return list[i].replace(/\{(\w)\}/g, (_, k) => vars[k] !== undefined ? vars[k] : '');
}
// Lần 1 dưới 70% → câu chọc; đúng hết → câu khen; lần 2 → câu khen theo số câu đã sửa đúng. Giữ cố định khi mở lại trang.
function teaseLine1(){
  const R = S.r1; if (!R || !R.total) return '';
  if (R.score === R.total){ if (!S.tease1) { S.tease1 = tease('flawless'); save(); } return `<div class="tease good">${S.tease1}</div>`; }
  if (R.score / R.total >= .7) return '';
  if (!S.tease1){ S.tease1 = tease('low1', { s: R.score, t: R.total, w: R.total - R.score }); save(); }
  return `<div class="tease">${S.tease1}</div>`;
}
function praiseLine2(){
  if (!S.r2) return '';
  if (!S.tease2){
    const ks = Object.keys(S.r1.items).filter(k => !S.r1.items[k].ok);
    const f = ks.filter(k => S.r2.items[k] && S.r2.items[k].ok).length;
    S.tease2 = tease(f === ks.length ? 'fixAll' : f ? 'fixSome' : 'fixNone', { f }); save();
  }
  return `<div class="tease good">${S.tease2}</div>`;
}
