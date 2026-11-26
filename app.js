/* PET Arena – giao diện, chấm điểm, làm lại câu sai, gửi bài (phần game ở arena.js) */
'use strict';

/* ============ TIỆN ÍCH ============ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ia = 'autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false"';
const lsGet = k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

// Từ mới: {{khoá}} hoặc {{khoá|chữ hiển thị}} → nút bấm xem nghĩa
const VRE = /\{\{([^}|]+)(?:\|([^}]+))?\}\}/g;
const vt = s => String(s || '').replace(VRE, (_, k, shown) =>
  VOCAB[k] ? `<button type="button" class="vw" data-v="${esc(k)}">${esc(shown || k)}</button>` : esc(shown || k));
const unv = s => String(s || '').replace(VRE, (_, k, shown) => shown || k);
const plain = s => unv(s).replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

/* ============ TỪ MỚI: bong bóng nghĩa + phát âm ============ */
let VOICE = null;
function pickVoice(){
  try {
    const vs = speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang));
    VOICE = vs.find(v => /^en[-_]GB/i.test(v.lang) && /female|libby|sonia|serena|kate|hazel|google uk english female/i.test(v.name)) ||
      vs.find(v => /^en[-_]GB/i.test(v.lang)) || vs.find(v => /^en[-_]US/i.test(v.lang)) || vs[0] || null;
  } catch (e) {}
}
if ('speechSynthesis' in window){ pickVoice(); try { speechSynthesis.onvoiceschanged = pickVoice; } catch (e) {} }
function say(text){
  try {
    if (!('speechSynthesis' in window) || !text) return;
    speechSynthesis.cancel(); try { speechSynthesis.resume(); } catch (e) {}
    const u = new SpeechSynthesisUtterance(text);
    u.lang = VOICE ? VOICE.lang : 'en-GB'; if (VOICE) u.voice = VOICE; u.rate = .85;
    speechSynthesis.speak(u);
  } catch (e) {}
}
function showPop(btn){
  const v = VOCAB[btn.dataset.v]; if (!v) return;
  const p = $('#pop');
  p.innerHTML = `<div class="pw"><b>${esc(v.w)}</b> <button type="button" class="say" aria-label="Nghe lại">🔊</button></div>
    <div class="pi">${esc(v.ipa || '')}</div><div class="pv">${esc(v.vi)}</div>`;
  p.hidden = false;
  const r = btn.getBoundingClientRect(), pw = Math.min(280, window.innerWidth - 24);
  p.style.width = pw + 'px';
  let left = r.left + r.width / 2 - pw / 2 + window.scrollX;
  left = Math.max(12 + window.scrollX, Math.min(left, window.scrollX + window.innerWidth - pw - 12));
  p.style.left = left + 'px';
  const h = p.offsetHeight;
  const below = r.bottom + 8 + h < window.innerHeight || r.top < h + 16;
  p.style.top = (below ? r.bottom + 8 : r.top - h - 8) + window.scrollY + 'px';
  $('.say', p).onclick = () => say(v.w);
  say(v.w);
}
const hidePop = () => { const p = $('#pop'); if (p) p.hidden = true; };
document.addEventListener('click', e => {
  const b = e.target.closest('.vw');
  if (b){ e.preventDefault(); e.stopPropagation(); showPop(b); return; }
  if (!e.target.closest('#pop')) hidePop();
}, true);
window.addEventListener('resize', hidePop);

/* ============ CHỖ LÀM BÀI TRONG CÂU ============ */
// ((a/*b)) chọn · [[x|y]] gõ chữ · [[N:sg/pl]] gõ "a/an + số ít" hoặc "số + số nhiều"
const TOK = /\(\(([^)]*)\)\)|\[\[([^\]]*)\]\]/g;
function parseTok(m){
  if (m[1] != null){
    const raw = m[1].split('/').map(x => x.trim());
    const opts = raw.map(x => x.replace(/^\*/, '')), correct = raw.map((x, i) => x.startsWith('*') ? i : -1).filter(i => i >= 0);
    return { kind: 'ch', opts, correct, need: correct.length };
  }
  const g = m[2].trim();
  // [[N:shelf/shelves]] = a/an + số ít hoặc số + số nhiều · [[N:shelf/shelves=3]] = phải đúng số lượng trong tranh (=2|3: nhiều số đều đúng)
  if (g.startsWith('N:')){
    const [form, cnt] = g.slice(2).split('=');
    const [sg, pl] = form.split('/').map(x => x.trim());
    return { kind: 'noun', sg, pl, cnt: cnt ? cnt.split('|').map(Number) : null };
  }
  return { kind: 'gap', alts: g.split('|').map(x => x.trim()).filter(Boolean) };
}
const toks = t => Array.from(String(t || '').matchAll(TOK)).map(parseTok);

const NUMW = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 };
const nrm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’‘`]/g, "'")
  .replace(/[–—−]/g, '-').replace(/[.,!?;:"]+/g, ' ').replace(/\s+/g, ' ').trim();
const vowelStart = w => /^[aeiou]/i.test(w) && !/^(uni|use|eu|one)/i.test(w);
function lev(a, b){
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
// Ô ghi tên tranh (bài 2): "a lorry" / "an umbrella" / "three lorries" / "3 lorries"
// Đáp án hiển thị của ô danh từ: có số lượng → "three shelves" / "a sofa"; không có → "a shelf / (số đếm) shelves"
const NUMWORD = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const aAn = sg => (vowelStart(sg) ? 'an ' : 'a ') + sg;
const nounAns = (tok, full) => !tok.cnt ? (full ? `${aAn(tok.sg)} / (số đếm) ${tok.pl}` : aAn(tok.sg))
  : tok.cnt.map(n => n === 1 ? aAn(tok.sg) : (NUMWORD[n] || n) + ' ' + tok.pl).join(' / ');
function nounCheck(ans, sg, pl, cnt){
  const s = nrm(ans); if (!s) return { ok: false, why: 'empty' };
  const m = s.match(/^(a|an|one|\d+|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(.+)$/);
  const det = m ? m[1] : '', noun = m ? m[2] : s;
  const n = !det ? 0 : /^\d+$/.test(det) ? Number(det) : det === 'a' || det === 'an' ? 1 : NUMW[det];
  const isSg = noun === sg, isPl = noun === pl;
  if (!isSg && !isPl){
    const close = [sg, pl].some(w => lev(w, noun) <= Math.max(1, Math.floor(w.length / 4)));
    return { ok: false, why: close ? 'spell' : 'word' };
  }
  if (!det) return { ok: false, why: 'noart' };
  if (cnt && !cnt.includes(n)) return { ok: false, why: 'count' };
  if (isSg){
    if (n !== 1) return { ok: false, why: 'needpl' };
    if (det === 'a' && vowelStart(sg)) return { ok: false, why: 'aan' };
    if (det === 'an' && !vowelStart(sg)) return { ok: false, why: 'aan' };
    return { ok: true };
  }
  if (n === 1) return { ok: false, why: 'sgpl' };
  return { ok: true };
}
const NOUN_HINT = {
  empty: 'Em chưa làm câu này.',
  noart: 'Danh từ đếm được cần có <b>a / an</b> hoặc <b>số đếm</b> (two, three…) đứng trước.',
  aan: 'Xem lại <b>a</b> hay <b>an</b>: “an” đứng trước từ bắt đầu bằng âm nguyên âm (a, e, i, o, u).',
  needpl: 'Có số đếm từ 2 trở lên thì danh từ phải ở <b>số nhiều</b>. Nhớ số nhiều đặc biệt (man → ?, woman → ?, shelf → ?).',
  sgpl: '<b>a / an</b> chỉ đi với danh từ <b>số ít</b>. Muốn dùng số nhiều thì đếm xem có mấy cái.',
  count: 'Đếm lại trong tranh xem có <b>mấy</b> cái (chữ cái chỉ vào nhóm đồ vật đó).',
  spell: 'Gần đúng rồi! So lại chính tả với từ trong khung.',
  word: 'Nhìn kỹ chữ cái trong tranh rồi chọn lại từ trong khung.',
};

/* ============ ĐIỀU HƯỚNG ============ */
const WEEK_NO = parseInt(new URLSearchParams(location.search).get('w'), 10);
// ?w=2&preview: cô xem trước bài chưa mở (học sinh không thấy link này trên trang chủ)
const PREVIEW = new URLSearchParams(location.search).has('preview');
const LESSON = WEEK_NO && (WEEK_NO <= OPEN_WEEK || PREVIEW) ? LESSONS[WEEK_NO] : null;
const ME_KEY = 'pet-me';
// Bài làm lưu theo Unit (không theo số tuần) để đổi thứ tự tuần không lẫn bài: pet-unit5, pet-unit1…
const storeKey = w => 'pet-' + String(LESSONS[w].code).toLowerCase().replace(/\s+/g, '');
// 18/11: Unit 5 chen vào tuần 1 → chuyển bài cũ đã lưu theo tuần (pet-w1 = Unit 1, pet-w2 = Unit 8) sang khoá theo Unit
[['pet-w1', 'pet-unit1'], ['pet-w2', 'pet-unit8']].forEach(([a, b]) => {
  const v = lsGet(a); if (!v) return;
  if (!lsGet(b)) lsSet(b, v);
  try { localStorage.removeItem(a); } catch (e) {}
});

// Câu chào trang chủ: mỗi lần mở đổi 1 câu (không lặp lại câu lần trước)
const HI_LINES = [
  'New week, new mission. Lock in. 🎧',
  'Every mission = more XP. Keep grinding. ⚡',
  'Ranks are earned, not given. 🏆',
  'Mistakes are just practice rounds. 🔁',
  'One mission a week. Consistency wins. 📈',
  'Your future self says thanks. 😎',
  'Main character energy only. ✨',
  'Grammar is the cheat code. Use it. 🎮',
  'Small wins every week = big rank later. 💎',
  'Next stop: PET. Let’s go. 🚀',
];
function hiLine(){
  let last = lsGet('pet-hi'), i;
  do { i = Math.floor(Math.random() * HI_LINES.length); } while (HI_LINES.length > 1 && i === last);
  lsSet('pet-hi', i);
  return HI_LINES[i];
}
// Sao thành tích của 1 bài đã xong: ≥90% → 3 sao, ≥70% → 2 sao, còn lại 1 sao
function starsOf(s){
  if (!s || s.phase !== 'done') return 0;
  const r = s.r2 || s.r1; if (!r || !r.total) return 3;
  const p = r.score / r.total;
  return p >= .9 ? 3 : p >= .7 ? 2 : 1;
}
const starRow = n => [1, 2, 3].map(i => `<span class="${i <= n ? '' : 'off'}">⭐</span>`).join('');

/* ============ TÀI KHOẢN YUMI (đăng nhập + bảng xếp hạng, script chung /yumi-auth.js) ============ */
// YA = null khi công tắc chung chưa bật (hoặc script chung không tải được) → trang chạy như cũ, gõ tên.
const YA = window.YumiAuth && YumiAuth.ready() ? YumiAuth : null;
const YA_OPTS = { mascot: 'img/ai/coach.webp', title: 'PET Arena ⚡', sub: 'Log in to enter the Arena 🎮',
  theme: { bg: 'linear-gradient(160deg,#121a3a 0%,#0b1024 55%,#1b0f33 100%)', card: 'linear-gradient(180deg,#19213d,#131a30)',
    text: '#e8ecf8', acc: '#0891b2', acc2: '#c026d3', dark: true,
    font: '"Be Vietnam Pro",system-ui,sans-serif', head: '"Chakra Petch","Be Vietnam Pro",system-ui,sans-serif' } };
const yaChar = () => { const m = YA && YA.me(); return !!(m && /^teen:\{/.test(m.avatar || '')); }; // đã có nhân vật tủ đồ
function yaSync(){ // tên + lớp lấy theo tài khoản; có nhân vật thì avatar = nhân vật
  const m = YA && YA.me(); if (!m) return;
  lsSet(ME_KEY, Object.assign(lsGet(ME_KEY) || {}, { name: m.fullName || m.name, cls: m.cls }, yaChar() ? { av: 'char' } : {}));
}
function yaAvatar(){ // gửi avatar lên bảng xếp hạng (ảnh tự chụp thì không gửi)
  const a = AV || (lsGet(ME_KEY) || {}).av; if (!YA || !a || /^data:/.test(a) || a === 'char') return;
  YA.setAvatar(/^pic:\d+$/.test(a) ? new URL(`img/ai/av-${a.slice(4)}.webp`, location.href).pathname : a);
}
function yaHome(){
  if (!YA) return;
  const card = $('#app .player'); if (!card) return;
  const row = document.createElement('div'); row.className = 'yarow';
  row.appendChild(YA.trophy({ theme: YA_OPTS.theme }));
  const out = document.createElement('button'); out.type = 'button'; out.className = 'linkbtn'; out.textContent = 'Log out';
  out.onclick = async () => { if (await modal('Log out of PET Arena?<br><small class="muted">Đăng xuất? Lần sau em phải nhập lại nickname + PIN.</small>', 'Log out', 'Stay')) YA.logout(); };
  if (window.YumiAvatar) row.appendChild(YumiAvatar.button({ style: 'teen', theme: YA_OPTS.theme, onSave: () => { yaSync(); renderHome(); } }));
  row.appendChild(out); card.appendChild(row);
  yaAvatar();
  // lần đầu: tạo nhân vật (chỉ đồ miễn phí) → vẽ lại sảnh với nhân vật, rồi mới hiện bảng xếp hạng
  const done = () => YA.autoBoard({ theme: YA_OPTS.theme });
  if (window.YumiAvatar) YumiAvatar.ensure({ style: 'teen', theme: YA_OPTS.theme }).then(v => { if (v) { yaSync(); renderHome(); } else done(); }).catch(done);
  else done();
}

// Trang chủ = sảnh chính kiểu game (arena.js): thẻ người chơi + rank, missions, Word Rush, thành tựu
function renderHome(){
  document.title = 'PET Arena ⚡';
  $('#heroSub').textContent = 'Season 1 · Cambridge B1 Preliminary';
  document.body.classList.add('home');
  $('#app').innerHTML = lobbyHtml();
  afterHome();
  yaHome();
}

/* ============ DANH SÁCH CÂU HỎI ============ */
// Mỗi chỗ trống = 1 câu chấm điểm. k = "<bài>-<câu><a,b…>"
let QS = [];
function itemsOfEx(e){
  if (e.type === 'speak') return [];
  if (e.type === 'text') return e.paras.map((p, j) => Object.assign({ n: 'p' + (j + 1) }, p));
  if (e.type !== 'label') return e.items.map((it, j) => Object.assign({ n: String(j + 1) }, it));
  const out = [];
  e.groups.forEach(g => {
    if (/\[\[/.test(g.head)) out.push({ n: g.n, t: g.head, h: g.h, head: true, grp: g.n });
    g.rows.forEach(r => { if (r.t) out.push({ n: g.n + r.l, t: r.t, h: r.h, grp: g.n }); });
  });
  return out;
}
function buildQS(){
  QS = [];
  LESSON.ex.forEach(e => { let c = 0; itemsOfEx(e).forEach(it => {
    const ts = toks(it.t);
    ts.forEach((tok, ti) => {
      // bài đoạn văn: đánh số chỗ trống liên tục 1, 2, 3…
      const label = e.type === 'text' ? String(++c) : it.n + (ts.length > 1 ? 'abcdefgh'[ti] : '');
      QS.push({ k: e.id + '-' + label, e, it, ti, tok, label, h: Array.isArray(it.h) ? it.h[ti] : it.h });
    });
  }); });
}
const qOf = k => QS.find(q => q.k === k);
const tokText = tok => tok.kind === 'ch' ? tok.correct.map(i => tok.opts[i]).join(' + ')
  : tok.kind === 'noun' ? nounAns(tok, true) : tok.alts[0];
const correctText = q => { const c = tokText(q.tok); return q.tok.kind === 'ch' ? unv(c).replace(/^–$/, '– (không mạo từ)') : c; };
// Câu hỏi dạng chữ (cho mail): chỗ đang hỏi = ___ hoặc (lựa chọn), chỗ khác = …
function qText(q){
  const e = q.e, lines = String(q.it.t).split(/<br\s*\/?>/i);
  let i = -1, pick = '';
  const marked = lines.map(line => line.replace(TOK, m0 => {
    i++;
    if (i !== q.ti) return '…';
    const m = [...m0.matchAll(TOK)][0], tk = parseTok(m);
    return tk.kind === 'ch' ? '[' + tk.opts.map(unv).join(' / ') + ']' : '___';
  }));
  pick = marked.find(l => /___|\[/.test(l)) || marked.join(' ');
  // đoạn văn dài: chỉ lấy câu có chỗ trống
  if (e.type === 'text'){ const ss = plain(pick).split(/(?<=[.!?:])\s+/); pick = ss.find(x => /___/.test(x)) || pick; }
  const pre = e.type === 'label' ? `Picture ${q.it.grp}${q.it.head ? ' – topic' : ' – ' + q.it.n.slice(-1)}: ` : e.type === 'pics' ? 'Picture: ' : '';
  return pre + plain(pick) + (q.it.v ? ' (' + plain(q.it.v) + ')' : '');
}

/* ============ TRẠNG THÁI BÀI ============ */
let S = null;
// phase: work → (Submit) review: xem đúng/sai, khoá hết → (Làm lại câu sai) retry: chỉ hiện câu sai + gợi ý → (Nộp lần 2) done
const blank = () => ({ name: '', cls: '', startedAt: null, leaves: 0, a: {}, tick: {}, rec: {}, phase: 'work', r1: null, r2: null, sid: '', sent1: false, sent2: false, retryAt: null });
const save = () => lsSet(storeKey(WEEK_NO), S);

/* ============ GHI ÂM (giống KET; lưu IndexedDB để không mất khi đóng trang) ============ */
// RECS = các ô ghi âm của bài: đọc to (1 file/bài) và bài nói (1 file/câu)
let RECS = [];
function buildRecs(){
  RECS = [];
  LESSON.ex.forEach(e => {
    if (e.readAloud) RECS.push({ qk: e.id + '-ra', e, kind: 'ra', max: 150, code: 'Ex' + exNo(e), label: `Exercise ${exNo(e)} – Read aloud` });
    if (e.type === 'speak') e.prompts.forEach((p, j) => RECS.push({ qk: e.id + '-' + (j + 1), e, j, kind: 'sp', max: 60,
      code: 'Ex' + exNo(e) + '-' + (j + 1), label: `Exercise ${exNo(e)} – ${j + 1}. ${plain(p.lead)}` }));
  });
}
const fmtSec = s => { s = Math.max(0, Math.round(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
let IDBP = null;
function idb(){
  if (!IDBP) IDBP = new Promise((res, rej) => {
    if (!window.indexedDB) return rej(new Error('no indexedDB'));
    const r = indexedDB.open('pet-adventure', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('rec');
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
  return IDBP;
}
const within = (p, ms = 4000) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
async function idbPut(k, v){ const d = await idb(); return new Promise((res, rej) => { const t = d.transaction('rec', 'readwrite'); t.objectStore('rec').put(v, k); t.oncomplete = () => res(); t.onerror = () => rej(t.error); }); }
async function idbGet(k){ const d = await idb(); return new Promise((res, rej) => { const q = d.transaction('rec').objectStore('rec').get(k); q.onsuccess = () => res(q.result || null); q.onerror = () => rej(q.error); }); }
const RECBLOB = {};
const recId = qk => String(LESSON.code).toLowerCase().replace(/\s+/g, '') + '-' + qk;
async function storeRec(qk, blob){ RECBLOB[qk] = blob; try { await within(blob.arrayBuffer().then(buf => idbPut(recId(qk), { buf, type: blob.type }))); } catch (e) {} }
async function loadRec(qk){
  if (RECBLOB[qk]) return RECBLOB[qk];
  try { const v = await within(idbGet(recId(qk))); if (v && v.buf) return (RECBLOB[qk] = new Blob([v.buf], { type: v.type || 'audio/webm' })); } catch (e) {}
  return null;
}
const extOf = t => /mp4|aac|m4a/.test(t) ? 'm4a' : /ogg/.test(t) ? 'ogg' : /wav/.test(t) ? 'wav' : 'webm';
function pickMime(){
  const c = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/ogg'];
  if (!window.MediaRecorder || !MediaRecorder.isTypeSupported) return '';
  return c.find(m => MediaRecorder.isTypeSupported(m)) || '';
}
function stopAllAudio(){ $$('audio').forEach(a => { try { a.pause(); } catch (e) {} }); try { speechSynthesis.cancel(); } catch (e) {} }
document.addEventListener('play', ev => $$('audio').forEach(a => { if (a !== ev.target) a.pause(); }), true);
let REC = null, recMsg = {};
async function recStart(qk){
  if (REC || S.phase !== 'work') return;
  const sl = RECS.find(x => x.qk === qk); if (!sl) return;
  stopAllAudio(); recMsg[qk] = '';
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder){
    recMsg[qk] = 'Trình duyệt này không ghi âm được. Hãy mở trang bằng Chrome (Android, máy tính) hoặc Safari (iPhone, iPad).'; paintRec(); return;
  }
  let stream;
  muteAway = true; // hộp xin quyền micro không tính là rời trang
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); }
  catch (e){
    releaseAway();
    const denied = e && (e.name === 'NotAllowedError' || e.name === 'SecurityError');
    recMsg[qk] = denied ? 'Micro đang bị chặn. Bấm biểu tượng 🔒 cạnh địa chỉ trang, cho phép Micro rồi thử lại.' : 'Không tìm thấy micro. Kiểm tra micro hoặc tai nghe rồi thử lại.';
    paintRec(); return;
  }
  releaseAway();
  if (REC){ stream.getTracks().forEach(t => t.stop()); return; }
  const mime = pickMime(); let mr;
  try { mr = new MediaRecorder(stream, Object.assign({ audioBitsPerSecond: 48000 }, mime ? { mimeType: mime } : {})); } catch (e){ mr = new MediaRecorder(stream); }
  const r = { qk, mr, stream, chunks: [], t0: Date.now(), max: sl.max };
  REC = r;
  mr.ondataavailable = e => { if (e.data && e.data.size) r.chunks.push(e.data); };
  mr.onstop = () => recDone(r);
  mr.start(1000);
  r.timer = setInterval(() => {
    const s = (Date.now() - r.t0) / 1000, tm = $('#rt-' + qk);
    if (tm) tm.textContent = fmtSec(s);
    if (s >= r.max) recStop();
  }, 250);
  paintRec();
}
function recStop(){ if (REC && REC.mr.state !== 'inactive') REC.mr.stop(); }
async function recDone(r){
  clearInterval(r.timer);
  try { r.stream.getTracks().forEach(t => t.stop()); } catch (e) {}
  if (REC === r) REC = null;
  const type = r.mr.mimeType || (r.chunks[0] && r.chunks[0].type) || 'audio/webm';
  const dur = Math.min(r.max, (Date.now() - r.t0) / 1000);
  const blob = new Blob(r.chunks, { type });
  if (blob.size < 500 || dur < 1){ recMsg[r.qk] = 'Bản ghi ngắn quá. Em ghi lại nhé.'; paintRec(); return; }
  S.rec[r.qk] = { mime: type.split(';')[0], ext: extOf(type), dur: Math.round(dur), size: blob.size, at: Date.now() };
  save();
  await storeRec(r.qk, blob);
  paintRec(); progress();
}
function paintRec(){
  RECS.forEach(sl => {
    const box = $('#sq-' + sl.qk); if (!box) return;
    const r = S.rec[sl.qk], recording = REC && REC.qk === sl.qk, lock = S.phase !== 'work';
    box.className = 'sq' + (r ? ' done' : '') + (recording ? ' live' : '');
    box.innerHTML = `<div class="sqr">
        ${recording ? `<span class="dot"></span><b id="rt-${sl.qk}">0:00</b><span class="muted small">/ ${fmtSec(sl.max)}</span><button type="button" class="btn sm red" data-stop="1">⏹ Stop</button>`
          : lock ? '' : `<button type="button" class="btn sm ${r ? 'ghost' : 'orange'}" data-rec="${sl.qk}" ${REC ? 'disabled' : ''}>🎙 ${r ? 'Record again' : 'Record'}</button>`}
        ${r && !recording ? `<audio controls preload="none" id="pb-${sl.qk}"></audio>` : ''}
        <span class="sqs-st">${r && !recording ? '✅ ' + fmtSec(r.dur) : recording ? '' : '<span class="muted small">🎙 not recorded yet</span>'}</span>
      </div>${recMsg[sl.qk] ? `<div class="err">${esc(recMsg[sl.qk])}</div>` : ''}`;
    if (r && !recording) loadRec(sl.qk).then(b => {
      const a = $('#pb-' + sl.qk);
      if (a && b){ a.src = URL.createObjectURL(b); }
      else if (a && !b){ a.replaceWith(Object.assign(document.createElement('span'), { className: 'err', textContent: '⚠️ Máy không còn bản ghi này, em ghi lại nhé.' })); if (S.phase === 'work'){ delete S.rec[sl.qk]; save(); progress(); } }
    });
  });
}
function paintTicks(){
  $$('.tk').forEach(t => {
    const v = S.tick[t.dataset.tk];
    $$('.tkb', t).forEach(b => { b.classList.toggle('on', b.dataset.v === v); b.disabled = S.phase !== 'work'; });
  });
}

/* ============ DỰNG BÀI ============ */
const exVocab = {}; // từ mới nằm trong các lựa chọn (không bấm được trong nút) → hiện thành dòng riêng
function renderT(t, keys, example){
  const parts = []; let i = 0;
  const s = String(t || '').replace(TOK, m0 => { parts.push(m0); return '\u0000' + (parts.length - 1) + '\u0000'; });
  return vt(s).replace(/\u0000(\d+)\u0000/g, (_, n) => {
    const m = [...parts[n].matchAll(TOK)][0], tok = parseTok(m), k = keys ? keys[i++] : null;
    if (tok.kind === 'ch'){
      return `<span class="ch${example ? ' exm' : ''}"${k ? ` data-k="${k}"` : ''}>${tok.opts.map((o, oi) =>
        `<button type="button" class="opt${example && tok.correct.includes(oi) ? ' on' : ''}" data-i="${oi}"${example ? ' disabled' : ''}>${esc(unv(o))}</button>`).join('<span class="sl">/</span>')}</span>`;
    }
    if (example) return `<span class="exv">${esc(tok.kind === 'gap' ? tok.alts[0] : tok.sg)}</span>`;
    const q = qOf(k), num = q && q.e.type === 'text' ? `<sup class="bnum">${q.label}</sup>` : '';
    // ô trống giãn theo đáp án dài nhất (không để chữ bị che)
    const w = tok.kind === 'gap' ? Math.max(...tok.alts.map(a => a.length)) : 0;
    const st = w > 7 ? ` style="width:${Math.min(13, w * .62 + 2).toFixed(1)}em"` : '';
    return `${num}<span class="gw"><input class="txt ${tok.kind === 'noun' ? 'noun' : 'gap'}" data-k="${k}" ${ia}${st} aria-label="Answer ${esc(k)}"></span>`;
  });
}
const keysOf = (e, it) => QS.filter(q => q.e === e && q.it.n === it.n).map(q => q.k);
const fixBox = (e, it) => `<div class="fix" data-fix="${e.id}-${it.n}"></div>`;

const exNo = e => LESSON.ex.indexOf(e) + 1;
function exHead(e){
  const ws = [];
  JSON.stringify(e.examples || []).concat(JSON.stringify(e.items || [])).replace(/\(\(([^)]*)\)\)/g, (_, inner) => {
    inner.replace(/\{\{([^}|]+)/g, (__, k) => { if (VOCAB[k] && !ws.includes(k)) ws.push(k); });
  });
  return `<div class="ex-head"><span class="badge">Exercise ${exNo(e)}</span><h2>${e.title}</h2></div>
    ${e.track ? `<div class="listen"><audio controls preload="none" src="audio/${e.track}.mp3"></audio></div>` : ''}
    <p class="how">${unv(e.how)}</p>
    ${ws.length ? `<div class="words"><span class="wl">📒 New words:</span> ${ws.map(w => vt(`{{${w}}}`)).join(' ')}</div>` : ''}
    ${e.box && e.type !== 'label' ? `<div class="wordbox">${e.box.map(w => w.startsWith('~') ? `<span><s>${vt(w.slice(1))}</s></span>` : `<span>${vt(w)}</span>`).join('')}</div>` : ''}
    ${e.img ? `<img class="eximg" src="img/${e.img}" alt="" loading="lazy">` : ''}`;
}
// nút ✓/✗ (ý kiến riêng, không chấm điểm)
const tickBtns = k => `<span class="tk" data-tk="${k}"><button type="button" class="tkb" data-v="y" aria-label="Important">✓</button><button type="button" class="tkb" data-v="n" aria-label="Not important">✗</button></span>`;
function exList(e){
  const ex = (e.examples || []).map((t, j) => `<div class="it example${e.conv ? ' conv' : ''}"><span class="cn">▶</span><div class="itb">${renderT(t, null, true)}${e.tick ? tickBtns(e.id + '-ex' + (j || '')) : ''}</div></div>`).join('');
  return `<div class="items">${ex}${itemsOfEx(e).map(it => `<div class="it${e.conv ? ' conv' : ''}" data-item="${e.id}-${it.n}">
      <span class="cn">${it.n}</span><div class="itb">${renderT(it.t, keysOf(e, it))}${it.v ? ` <span class="vb">(${vt(it.v)})</span>` : ''}${e.tick ? tickBtns(e.id + '-' + it.n) : ''}${fixBox(e, it)}</div></div>`).join('')}</div>
    ${e.readAloud ? `<div class="recbox"><h3>🎙 Read aloud</h3><p class="how">Now read all the sentences above aloud (with your answers) and record yourself.</p>
      <div class="sq" id="sq-${e.id}-ra"></div></div>` : ''}`;
}
// đoạn văn có chỗ trống đánh số
function exText(e){
  return `<div class="ptext">${itemsOfEx(e).map(it => `<p class="para" data-item="${e.id}-${it.n}">${renderT(it.t, keysOf(e, it))}</p>${fixBox(e, it)}`).join('')}</div>`;
}
// nói về bản thân: mỗi câu 1 ô ghi âm
function exSpeak(e){
  return `<div class="sqs">${e.prompts.map((p, j) => `<div class="spq"><div class="spl"><span class="cn">${j + 1}</span> <b>${vt(p.lead)}</b></div>
      <div class="spm">💬 e.g. <i>${vt(p.ex)}</i></div><div class="sq" id="sq-${e.id}-${j + 1}"></div></div>`).join('')}</div>`;
}
function exPics(e){
  const card = (it, ex) => `<div class="pc${ex ? ' example' : ''}"${ex ? '' : ` data-item="${e.id}-${it.n}"`}>
      <img src="img/${it.img}" alt="" loading="lazy">
      <div class="pct"><span class="cn">${ex ? '▶' : it.n}</span> ${renderT(it.t, ex ? null : keysOf(e, it), ex)}</div>${ex ? '' : fixBox(e, it)}</div>`;
  return `<div class="picgrid">${(e.examples || []).map(it => card(it, true)).join('')}${itemsOfEx(e).map(it => card(it)).join('')}</div>`;
}
function exLabel(e){
  const its = itemsOfEx(e);
  return `<div class="wordbox">${e.box.map(w => w.startsWith('~') ? `<s>${vt(w.slice(1))}</s>` : `<span>${vt(w)}</span>`).join('')}</div>
    <div class="lgroups">${e.groups.map(g => {
      const head = its.find(it => it.grp === g.n && it.head);
      return `<div class="lg" data-grp="${e.id}-${g.n}"><img src="img/${g.img}" alt="Picture ${g.n}" loading="lazy">
        <div class="lrows">
          <div class="lr lhead"${head ? ` data-item="${e.id}-${head.n}"` : ''}><span class="cn">${g.n}</span>${head ? renderT(head.t, keysOf(e, head)) : `<span class="exv">${esc(g.head)}</span>`}${head ? fixBox(e, head) : ''}</div>
          ${g.rows.map(r => {
            const it = its.find(x => x.n === g.n + r.l);
            return `<div class="lr"${it ? ` data-item="${e.id}-${it.n}"` : ''}><span class="ll">${r.l}</span>${it ? renderT(it.t, keysOf(e, it)) + fixBox(e, it) : `<span class="exv">${esc(r.ex)}</span>`}</div>`;
          }).join('')}
        </div></div>`;
    }).join('')}</div>`;
}

function buildLesson(){
  document.title = `Mission ${String(WEEK_NO).padStart(2, '0')} · ${LESSON.title} – PET Arena`;
  $('#heroSub').textContent = `MISSION ${String(WEEK_NO).padStart(2, '0')} · ${LESSON.code}: ${LESSON.title}`;
  buildQS(); buildRecs();
  const allWords = (LESSON.newWords || []).filter(k => VOCAB[k]);
  $('#app').innerHTML = `
    <section class="card start" id="start">
      <div class="pl-tag">PLAYER SETUP</div>
      <h2>Who’s playing? 🎮</h2>
      <p class="muted" style="margin:0">Điền tên, lớp, chọn avatar rồi bấm <b>Start</b>.</p>
      <div class="field"><label for="inName">Full name</label><input id="inName" autocomplete="name" placeholder="e.g. Nguyễn Minh Anh"></div>
      <div class="field"><label for="inCls">Class</label><input id="inCls" placeholder="e.g. PET01"></div>
      ${avPickerHtml()}
      <div class="err" id="startErr"></div>
      <button class="btn" id="startBtn" type="button">START MISSION ▶</button>
    </section>
    <div id="work" hidden>
      <div class="topbar" id="topbar" hidden></div>
      <div id="summaryBox"></div>
      <div class="card who" id="whoBar"></div>
      <section class="card guide">
        <h2>📒 New words</h2>
        <div class="note">✍️ Chép từ mới vào vở nha! Chạm vào từ màu vàng để xem nghĩa.</div>
        <div class="vgrid">${allWords.map(k => `<div class="vi">${vt('{{' + k + '}}')}<span class="vipa">${esc(VOCAB[k].ipa)}</span><span class="vmean">${esc(VOCAB[k].vi)}</span></div>`).join('')}</div>
        ${LESSON.grammar ? `<details class="gram"><summary>📘 Grammar: ${esc(LESSON.title)}</summary><div class="gbody">${LESSON.grammar}</div></details>` : ''}
      </section>
      ${LESSON.ex.map(e => `<section class="card ex" id="ex${e.id}">${exHead(e)}${
        e.type === 'label' ? exLabel(e) : e.type === 'pics' ? exPics(e) : e.type === 'text' ? exText(e) : e.type === 'speak' ? exSpeak(e) : exList(e)}</section>`).join('')}
    </div>`;

  // gõ chữ
  $$('input.txt').forEach(el => {
    el.value = S.a[el.dataset.k] || '';
    el.addEventListener('input', () => {
      if (el.disabled || S.phase === 'done' || S.phase === 'review') return;
      S.a[el.dataset.k] = el.value; if (S.phase === 'retry'){ el.classList.remove('bad'); topProgress(); }
      save(); progress();
    });
    // Enter → nhảy sang ô tiếp theo
    el.addEventListener('keydown', ev => {
      if (ev.key !== 'Enter') return; ev.preventDefault();
      const all = $$('input.txt').filter(x => !x.disabled && x.offsetParent !== null), i = all.indexOf(el);
      if (all[i + 1]) all[i + 1].focus(); else el.blur();
    });
  });
  // chạm lựa chọn
  $('#app').addEventListener('click', ev => {
    // ✓/✗ (không chấm điểm)
    const tb = ev.target.closest('.tkb');
    if (tb && !tb.disabled && S.phase === 'work'){
      const k = tb.closest('.tk').dataset.tk;
      S.tick[k] = S.tick[k] === tb.dataset.v ? undefined : tb.dataset.v; save(); paintTicks(); progress(); return;
    }
    // ghi âm
    const rc = ev.target.closest('[data-rec]'); if (rc){ recStart(rc.dataset.rec); return; }
    if (ev.target.closest('[data-stop]')){ recStop(); return; }
    const b = ev.target.closest('.ch[data-k] .opt'); if (!b || b.disabled) return;
    const k = b.closest('.ch').dataset.k, q = qOf(k), i = Number(b.dataset.i);
    if (!(S.phase === 'work' || (S.phase === 'retry' && !S.r1.items[k].ok))) return;
    let cur = Array.isArray(S.a[k]) ? S.a[k].slice() : [];
    if (q.tok.need <= 1){ if (cur[0] === i) return; cur = [i]; }
    else if (cur.includes(i)) cur = cur.filter(x => x !== i);
    else { cur.push(i); if (cur.length > q.tok.need) cur.shift(); }
    S.a[k] = cur; save(); paintChoices(); sfx('tick'); progress(); if (S.phase === 'retry') topProgress();
  });
  const me = lsGet(ME_KEY) || {};
  $('#inName').value = S.name || me.name || ''; $('#inCls').value = S.cls || me.cls || '';
  bindAvPicker(me);
  $('#avPick').addEventListener('click', () => yaAvatar()); // chạy sau bộ chọn của arena.js → AV đã đổi
  if (YA && YA.me()){ // đã đăng nhập: tên + lớp theo tài khoản, ẩn 2 ô gõ
    const m = YA.me();
    $('#inName').value = m.fullName || m.name; $('#inCls').value = m.cls || '-';
    ['inName', 'inCls'].forEach(id => { $('#' + id).closest('.field').hidden = true; });
    $('#start h2').textContent = `👋 Hi ${m.name}!`;
    $('#start p.muted').innerHTML = 'Choose your avatar and tap <b>START MISSION</b>.';
    if (yaChar()){ AV = 'char'; const f = $('#avPick') && $('#avPick').closest('.field'); if (f) f.hidden = true; $('#start p.muted').innerHTML = 'Tap <b>START MISSION</b> to begin.'; }
  }
  $('#startBtn').addEventListener('click', onStart);
  ['inName', 'inCls'].forEach(id => $('#' + id).addEventListener('keydown', e => { if (e.key === 'Enter') onStart(); }));
}

/* ============ TÊN HỌC SINH ============ */
function onStart(){
  const n = $('#inName').value.trim(), c = $('#inCls').value.trim();
  if (n.length < 2){ $('#startErr').textContent = 'Em hãy nhập họ và tên.'; return; }
  if (!c){ $('#startErr').textContent = 'Em hãy nhập lớp.'; return; }
  $('#startErr').textContent = '';
  S.name = n.slice(0, 80); S.cls = c.slice(0, 30);
  if (!S.startedAt) S.startedAt = new Date().toISOString();
  save(); lsSet(ME_KEY, { name: S.name, cls: S.cls, av: AV });
  sfx('pop'); showWork(); window.scrollTo({ top: 0 });
}
function renderWho(){
  const when = S.phase === 'done' ? (S.r2 || S.r1).at : null;
  $('#whoBar').innerHTML = `<span class="whoname">${avHtml(AV || (lsGet(ME_KEY) || {}).av)} <b>${esc(S.name)}</b> · Class <b>${esc(S.cls)}</b></span>` +
    (when ? `<span class="muted small">Submitted ${new Date(when).toLocaleString('vi-VN')}</span>`
      : S.phase === 'work' && !YA ? '<button class="linkbtn" type="button" id="editName">Sửa tên / lớp</button>' : '');
  const b = $('#editName'); if (b) b.onclick = () => { $('#work').hidden = true; $('#bar').hidden = true; $('#start').hidden = false; $('#inName').focus(); };
}
function showWork(){ $('#start').hidden = true; $('#work').hidden = false; $('#bar').hidden = false; renderWho(); progress(); }

/* ============ TIẾN ĐỘ ============ */
const answered = q => q.tok.kind === 'ch' ? (S.a[q.k] || []).length === q.tok.need : !!String(S.a[q.k] || '').trim();
function progress(){
  const bar = $('#bar'); if (!bar) return;
  bar.hidden = S.phase === 'review' || S.phase === 'retry' || $('#work').hidden; // sau lần 1: nút ở thanh ghim đầu màn hình
  if (S.phase === 'done'){
    const R = S.r2 || S.r1;
    $('#progT').textContent = `Done · ${R.score}/${R.total} correct`;
    $('#progF').style.width = (R.total ? R.score / R.total * 100 : 100) + '%';
    $('#submitBtn').hidden = true;
  } else if (S.phase === 'work'){
    const ticks = $$('.tk').map(t => t.dataset.tk);
    const all = QS.length + RECS.length + ticks.length;
    const d = QS.filter(answered).length + RECS.filter(sl => S.rec[sl.qk]).length + ticks.filter(k => S.tick[k]).length;
    $('#progT').textContent = `Done ${d}/${all}`;
    $('#progF').style.width = (all ? d / all * 100 : 0) + '%';
    $('#submitBtn').textContent = 'Submit ✔'; $('#submitBtn').hidden = false;
  }
}

/* ============ CHẤM ĐIỂM ============ */
const ansText = q => {
  const v = S.a[q.k];
  if (q.tok.kind === 'ch') return (Array.isArray(v) ? v.slice().sort((a, b) => a - b) : []).map(i => unv(q.tok.opts[i])).join(' + ');
  return String(v || '').trim();
};
function isOk(q){
  const v = S.a[q.k];
  if (q.tok.kind === 'ch'){ const a = (Array.isArray(v) ? v : []).slice().sort((x, y) => x - y); return a.length === q.tok.need && a.every((x, i) => x === q.tok.correct[i]); }
  if (q.tok.kind === 'noun') return nounCheck(v, q.tok.sg, q.tok.pl, q.tok.cnt).ok;
  const y = nrm(v); return !!y && q.tok.alts.some(a => nrm(a) === y);
}
function gradeNow(){
  const items = {};
  QS.forEach(q => { items[q.k] = { ans: ansText(q), v: S.a[q.k] == null ? null : JSON.parse(JSON.stringify(S.a[q.k])), ok: isOk(q) }; });
  const ks = Object.keys(items);
  return { items, score: ks.filter(k => items[k].ok).length, total: ks.length };
}

/* ============ SAU LẦN 1: thanh ghim, chỉ hiện câu sai, gợi ý ============ */
const wrongKeys = () => S.r1 ? Object.keys(S.r1.items).filter(k => !S.r1.items[k].ok) : [];
const sameAns = (k) => JSON.stringify(S.a[k] ?? null) === JSON.stringify(S.r1.items[k].v ?? null) || (!S.r1.items[k].v && !ansText(qOf(k)));
// Gợi ý ngữ pháp, không có đáp án (chỉ hiện lúc làm lại)
function hintFor(k){
  const q = qOf(k), r = S.r1.items[k];
  if (!r.ans) return 'Em chưa làm câu này.';
  if (q.tok.kind === 'noun') return NOUN_HINT[nounCheck(r.ans, q.tok.sg, q.tok.pl, q.tok.cnt).why] || NOUN_HINT.word;
  if (q.tok.kind === 'ch' && q.tok.need > 1 && (r.v || []).length !== q.tok.need) return `Nhớ chọn đủ <b>${q.tok.need}</b> từ. ` + (q.h || '');
  if (q.tok.kind === 'gap' && q.e.only && !q.e.only.includes(nrm(r.ans))) return 'Chỉ gõ 1 trong các từ: <b>' + q.e.only.join(', ') + '</b>. ' + (q.h || '');
  return q.h || 'Đọc lại ô Grammar ở đầu bài rồi thử lại.';
}
function focusWrong(on){
  document.body.classList.toggle('retrying', !!on);
  $$('.rt-hide').forEach(x => x.classList.remove('rt-hide'));
  if (!on) return;
  const wrongItems = new Set(wrongKeys().map(k => { const q = qOf(k); return q.e.id + '-' + q.it.n; }));
  $$('section.card.ex').forEach(sec => {
    const its = $$('[data-item]', sec);
    if (!its.some(x => wrongItems.has(x.dataset.item))){ sec.classList.add('rt-hide'); return; }
    its.forEach(x => { if (!wrongItems.has(x.dataset.item)) x.classList.add('rt-hide'); });
    $$('.example', sec).forEach(x => x.classList.add('rt-hide'));
    $$('.lg', sec).forEach(g => { if (!$$('[data-item]', g).some(x => wrongItems.has(x.dataset.item))) g.classList.add('rt-hide'); });
  });
}
function renderTop(){
  const tb = $('#topbar'); if (!tb) return;
  if (S.phase !== 'review' && S.phase !== 'retry'){ tb.hidden = true; return; }
  tb.hidden = false;
  if (S.phase === 'review'){
    tb.innerHTML = `<div class="tt">Lần 1: ${S.r1.score}/${S.r1.total} · ❌ Sai ${wrongKeys().length} câu</div><button class="btn orange" type="button" id="retryBtn">✏️ Làm lại câu sai</button>`;
    $('#retryBtn').onclick = startRetry;
  } else {
    // nút nộp lần 2 đặt bên TRÁI (khác chỗ nút "Làm lại câu sai" vừa bấm bên phải)
    tb.innerHTML = `<button class="btn orange" type="button" id="submit2Btn">Nộp lần 2 ✔</button><div class="tt" id="topT"></div>`;
    $('#submit2Btn').onclick = onSubmit;
    topProgress();
  }
}
function topProgress(){
  const el = $('#topT'); if (!el) return;
  const w = wrongKeys(), fixed = fixedCount();
  el.textContent = `✏️ Đã sửa ${fixed}/${w.length} câu`;
  const b = $('#submit2Btn'); if (b) b.classList.toggle('dim', !fixed); // chưa sửa câu nào: nút mờ
}
// số câu sai em đã sửa (khác câu trả lời lần 1)
function fixedCount(){ return wrongKeys().filter(k => !sameAns(k)).length; }
function startRetry(){
  S.phase = 'retry'; S.retryAt = new Date().toISOString(); save();
  paintAll(); window.scrollTo({ top: 0 });
}

/* ============ HIỂN THỊ KẾT QUẢ ============ */
function paintChoices(){
  QS.filter(q => q.tok.kind === 'ch').forEach(q => {
    const box = $(`.ch[data-k="${q.k}"]`); if (!box) return;
    const sel = Array.isArray(S.a[q.k]) ? S.a[q.k] : [];
    const R = S.phase === 'done' ? (S.r2 || S.r1).items[q.k] : S.r1 ? S.r1.items[q.k] : null;
    const open = S.phase === 'work' || (S.phase === 'retry' && !R.ok);
    const showMark = S.phase !== 'work' && (S.phase !== 'retry' || R.ok || sameAns(q.k));
    box.classList.toggle('open', open);
    $$('.opt', box).forEach(b => {
      const i = Number(b.dataset.i), on = sel.includes(i);
      b.disabled = !open;
      b.classList.toggle('on', on);
      b.classList.toggle('ok', showMark && on && (S.phase === 'done' ? R.ok || q.tok.correct.includes(i) : R.ok));
      b.classList.toggle('bad', showMark && on && !(S.phase === 'done' ? R.ok || q.tok.correct.includes(i) : R.ok));
      b.classList.toggle('right', S.phase === 'done' && !R.ok && q.tok.correct.includes(i) && !on);
    });
  });
}
function paintMarks(){
  QS.filter(q => q.tok.kind !== 'ch').forEach(q => {
    const el = $(`input.txt[data-k="${q.k}"]`); if (!el) return;
    el.classList.remove('ok', 'bad');
    const sol = el.parentNode.querySelector('.sol'); if (sol) sol.remove();
    if (S.phase === 'work'){ el.disabled = false; el.value = S.a[q.k] || ''; return; }
    if (S.phase === 'review' || S.phase === 'retry'){
      const r1 = S.r1.items[q.k];
      el.disabled = r1.ok || S.phase === 'review';
      if (r1.ok || sameAns(q.k)) el.classList.add(r1.ok ? 'ok' : 'bad');
      return;
    }
    const R = (S.r2 || S.r1).items[q.k];
    el.value = R.ans || ''; el.disabled = true; el.classList.add(R.ok ? 'ok' : 'bad');
    if (!R.ok) el.insertAdjacentHTML('afterend', `<span class="sol">→ ${esc(q.tok.kind === 'noun' ? nounAns(q.tok) : q.tok.alts[0])}</span>`);
  });
  // gợi ý (chỉ lúc làm lại) gom theo câu
  $$('[data-fix]').forEach(f => { f.innerHTML = ''; });
  if (S.phase === 'retry'){
    const by = {};
    wrongKeys().forEach(k => { const q = qOf(k), id = q.e.id + '-' + q.it.n; (by[id] = by[id] || []).push(q); });
    Object.entries(by).forEach(([id, qs]) => {
      const f = $(`[data-fix="${id}"]`); if (!f) return;
      f.innerHTML = qs.map(q => `<div class="again">💡 ${qs.length > 1 || toks(q.it.t).length > 1 ? `<b>(${q.e.type === 'text' ? q.label : q.ti + 1})</b> ` : ''}${hintFor(q.k)}</div>`).join('');
    });
  }
  // đánh số chỗ trống khi câu có nhiều chỗ và đang làm lại
  $$('.gw, .ch[data-k]').forEach(w => w.removeAttribute('data-n'));
  if (S.phase === 'retry') wrongKeys().forEach(k => {
    const q = qOf(k); if (toks(q.it.t).length < 2 || q.e.type === 'text') return;
    const el = $(`input.txt[data-k="${k}"]`), w = el ? el.parentNode : $(`.ch[data-k="${k}"]`);
    if (w) w.setAttribute('data-n', q.ti + 1);
  });
}
// Meme cảm xúc của cô sau lần nộp 1: img/meme/<mức>-<số>.gif. MEMES = số ảnh mỗi mức (thêm ảnh thì tăng số).
// Chọn ngẫu nhiên, ưu tiên ảnh em chưa gặp ở các bài trước; giữ cố định khi mở lại trang.
const MEMES = { wow: 7, good: 8, ok: 8, oops: 6 };
const SEEN_KEY = 'pet-memes-seen';
function memeOf(R){
  const pct = R.total ? R.score / R.total : 1;
  const tier = pct === 1 ? 'wow' : pct >= .8 ? 'good' : pct >= .5 ? 'ok' : 'oops';
  if (!S.meme || !S.meme.startsWith(tier + '-')){
    const all = Array.from({ length: MEMES[tier] }, (_, i) => tier + '-' + (i + 1));
    let seen = lsGet(SEEN_KEY); if (!Array.isArray(seen)) seen = [];
    let pool = all.filter(m => !seen.includes(m));
    if (!pool.length){ seen = seen.filter(m => !m.startsWith(tier + '-')); pool = all; }
    S.meme = pool[Math.floor(Math.random() * pool.length)];
    seen.push(S.meme); lsSet(SEEN_KEY, seen); save();
  }
  return `<img class="meme" src="img/meme/${S.meme}.gif" alt="">`;
}
function renderSummary(){
  const box = $('#summaryBox');
  if (S.phase === 'work'){ box.innerHTML = ''; return; }
  if (S.phase === 'review' || S.phase === 'retry'){
    // sau lần 1: chỉ meme + điểm
    box.innerHTML = `<div class="card summary retry">${memeOf(S.r1)}
      <div class="sumr"><div class="score">${S.r1.score}<span>/${S.r1.total}</span></div>
      ${teaseLine1()}
      <div class="status" id="sendStatus"></div></div></div>`;
    updateStatus();
    return;
  }
  // xong: điểm + XP + câu khen + cô đã nhận bài + Let's review (đúng hết ngay lần 1 thì vẫn có meme)
  const R = S.r2 || S.r1;
  box.innerHTML = `<div class="card summary">${S.r2 ? '' : memeOf(S.r1)}
    <div class="sumr"><div class="score">${R.score}<span>/${R.total}</span></div>
    ${S.r2 ? praiseLine2() : teaseLine1()}
    ${xpLine()}
    <div class="status" id="sendStatus"></div>
    ${R.score < R.total ? '<div class="big">Let’s review the answers below 👇</div>' : ''}</div></div>`;
  updateStatus();
}
function paintAll(){ paintMarks(); paintChoices(); paintTicks(); paintRec(); focusWrong(S.phase === 'retry'); renderTop(); renderSummary(); renderWho(); progress(); }

/* ============ CHỐNG NỘP NHẦM + LINK LÀM LẠI CỦA CÔ ============ */
// Còn trống quá tỉ lệ này thì không cho nộp lần 1; làm chưa đủ số phút này thì chưa cho nộp.
const MAX_EMPTY = 0.25;
const MIN_MINUTES = 3;
// Link cho em làm lại 1 bài đã nộp: link bài đó + &lamlai=yumi-lamlai (mở trên đúng máy em đã làm).
// Mỗi mã chỉ dùng 1 lần trên mỗi máy; cần làm lại lần nữa thì thêm số: yumi-lamlai2, yumi-lamlai3…
const RESET_CODE = 'yumi-lamlai';
const modalOpen = () => { const m = $('#modal'); return !!m && !m.hidden; };
// Hộp xác nhận trên trang (thay confirm của trình duyệt). yes = nút phụ (Nộp), no = nút chính (Làm tiếp). Không có yes = chỉ thông báo.
function modal(msg, yes, no){
  if (!$('#modal')) document.body.insertAdjacentHTML('beforeend', '<div class="modal" id="modal" hidden><div class="mbox" role="dialog" aria-modal="true"><div class="mmsg" id="mMsg"></div><div class="mbtns"><button class="btn ghost" type="button" id="mYes"></button><button class="btn" type="button" id="mNo"></button></div></div></div>');
  return new Promise(res => {
    const m = $('#modal'), y = $('#mYes'), n = $('#mNo');
    $('#mMsg').innerHTML = msg;
    y.hidden = !yes; y.textContent = yes || ''; n.textContent = no;
    y.disabled = true; setTimeout(() => { y.disabled = false; }, 900); // chạm 2 lần liên tiếp không nộp được
    const done = v => { m.hidden = true; y.onclick = n.onclick = null; res(v); };
    y.onclick = () => done(true); n.onclick = () => done(false);
    m.hidden = false; n.focus();
  });
}
// Lần 1: chặn khi làm quá ít / quá nhanh, rồi hỏi lại
async function guard1(left, total){
  if (modalOpen()) return false;
  if (left > total * MAX_EMPTY){
    sfx('bad');
    await modal(`📝 ${tease('empty', { x: total - left, n: total, e: left })}`, '', 'Dạ, em làm tiếp 😅');
    return false;
  }
  const mins = S.startedAt ? (Date.now() - new Date(S.startedAt)) / 60000 : MIN_MINUTES;
  if (mins < MIN_MINUTES){
    sfx('bad');
    await modal(`⏱️ ${tease('early', { m: Math.max(1, Math.floor(mins)), n: total, r: Math.ceil(MIN_MINUTES - mins) })}`, '', 'Dạ, em soát lại 🧐');
    return false;
  }
  const go = await modal(left ? `Em còn <b>${left} câu</b> chưa làm.<br>Em chắc chắn muốn nộp bài cho cô?` : 'Em đã kiểm tra kĩ chưa?<br>Nộp bài cho cô nhé?', 'Nộp bài', 'Làm tiếp ✏️');
  return go && S.phase === 'work';
}
// Lần 2: phải sửa ít nhất 1 câu sai
async function guard2(){
  if (modalOpen()) return false;
  const w = wrongKeys().length, c = fixedCount();
  if (!c){ sfx('bad'); await modal(`✏️ ${tease('nofix')}<br><small>Sửa các câu sai rồi mới nộp lần 2 nhé!</small>`, '', 'Dạ, em sửa bài 😅'); return false; }
  const go = await modal(`Em đã sửa <b>${c}/${w}</b> câu sai.<br>Nộp lần 2 cho cô nhé? Nộp xong sẽ hiện đáp án, không sửa được nữa.`, 'Nộp lần 2', 'Sửa tiếp ✏️');
  return go && S.phase === 'retry';
}
// ?lamlai=MÃ: xoá bài đã nộp (giữ tên, lớp) của bài đang mở. Trả về true nếu vừa xoá.
function applyRedo(key){
  let qp; try { qp = new URLSearchParams(location.search); } catch (e) { return false; }
  const tok = qp.get('lamlai'); if (tok === null) return false;
  qp.delete('lamlai');
  try { history.replaceState(null, '', location.pathname + (qp.toString() ? '?' + qp : '') + location.hash); } catch (e) {} // tải lại trang không xoá nữa
  if (!tok.startsWith(RESET_CODE) || !S.r1) return false;
  const UK = 'lamlai-used', id = key + ':' + tok, got = lsGet(UK), used = Array.isArray(got) ? got : [];
  if (used.includes(id)) return false;
  used.push(id); lsSet(UK, used);
  S = Object.assign(blank(), { name: S.name, cls: S.cls, redo: (S.redo || 0) + 1 });
  save(); return true;
}
const redoTitle = () => S.redo ? ' – LÀM LẠI' + (S.redo > 1 ? ' lần ' + S.redo : '') : '';
const REDO_MSG = '<div class="okmsg">✅ Cô đã cho em làm lại bài. Bấm <b>Start</b> để bắt đầu nhé!</div>';

/* ============ NỘP BÀI ============ */
async function onSubmit(){
  if (REC){ alert('Em đang ghi âm. Bấm ⏹ Stop trước nhé.'); return; }
  if (S.phase === 'work'){
    const noRec = RECS.filter(sl => !S.rec[sl.qk]);
    if (noRec.length){
      alert('Em chưa ghi âm: ' + noRec.map(sl => sl.label).join('; ') + '.\nPhải ghi âm đủ mới nộp được nhé.');
      const box = $('#sq-' + noRec[0].qk); if (box) box.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const left = QS.filter(q => !answered(q)).length;
    stopAllAudio();
    if (!(await guard1(left, QS.length))) return;
    const g = gradeNow(), at = new Date().toISOString();
    S.r1 = { at, leaves: S.leaves || 0, score: g.score, total: g.total, items: g.items };
    S.sid = makeSid();
    S.phase = g.score === g.total ? 'done' : 'review';
    save(); paintAll(); window.scrollTo({ top: 0, behavior: 'smooth' });
    send(); afterSubmit();
    return;
  }
  if (S.phase === 'retry'){
    if (!(await guard2())) return;
    const g = gradeNow();
    // câu đúng ở lần 1 giữ nguyên kết quả
    Object.keys(S.r1.items).forEach(k => { if (S.r1.items[k].ok) g.items[k] = S.r1.items[k]; });
    const ks = Object.keys(g.items);
    S.r2 = { at: new Date().toISOString(), leaves: S.leaves || 0, score: ks.filter(k => g.items[k].ok).length, total: ks.length, items: g.items };
    S.phase = 'done'; save(); paintAll(); window.scrollTo({ top: 0, behavior: 'smooth' });
    send(); afterSubmit();
  }
}

/* ============ GỬI BÀI ============ */
let sendState = null, sendErr = '';
function updateStatus(){
  const el = $('#sendStatus'); if (!el) return;
  const allSent = S.sent1 && (!S.r2 || S.sent2);
  const st = allSent && sendState !== 'sending' ? 'ok' : sendState;
  el.className = 'status ' + (st || '');
  if (st === 'ok') el.innerHTML = S.phase === 'retry' || S.phase === 'review' ? '' : '✅ Cô đã nhận được bài!';
  else if (!st) el.innerHTML = '';
  else if (st === 'sending') el.innerHTML = '⏳ Đang gửi bài…';
  else el.innerHTML = `⚠️ Chưa gửi được bài${sendErr ? ` (${esc(sendErr)})` : ''}. Em kiểm tra mạng rồi bấm: <button class="btn sm" type="button" id="resendBtn">Gửi lại</button>`;
  const rb = $('#resendBtn'); if (rb) rb.onclick = send;
}
const secsBetween = (a, b) => a && b ? Math.max(0, Math.round((new Date(b) - new Date(a)) / 1000)) : null;

// Giống các trang BTVN khác: lần 1 gửi ngay; lần 2 gửi kèm kết quả lần 1 để mail so sánh 2 lần.
const makeSid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const base = () => ({ app: 'btvn', unit: 'PET', title: `PET ${LESSON.code} ${LESSON.title} – Week ${WEEK_NO}` + redoTitle(), name: S.name, cls: S.cls, sid: S.sid || '', redo: S.redo || 0 });
// withRec: mail lần 1 có thêm các dòng ghi âm (cô chấm, file đính kèm); mail lần 2 chỉ so sánh câu chấm điểm
function itemsOf(R, withRec){
  const out = [];
  LESSON.ex.forEach(e => {
    QS.filter(q => q.e === e).forEach(q => out.push({ sec: String(exNo(e)), n: q.label, q: qText(q), ans: R.items[q.k].ans, correct: correctText(q), ok: R.items[q.k].ok }));
    if (withRec) RECS.filter(sl => sl.e === e).forEach(sl => {
      const m = S.rec[sl.qk];
      out.push({ sec: String(exNo(e)), n: sl.kind === 'ra' ? '🎙' : 'Q' + (sl.j + 1),
        q: sl.kind === 'ra' ? 'Read aloud – đọc to các câu đã làm' : plain(e.prompts[sl.j].lead) + ' (nói về bản thân)',
        ans: m ? '🎙 ' + fmtSec(m.dur) : '(chưa ghi âm)', correct: 'cô chấm', ok: null });
    });
  });
  return out;
}
function sectionsOf(items, withRec){
  return LESSON.ex.filter(e => withRec || e.type !== 'speak').map(e => {
    const id = String(exNo(e)), its = items.filter(x => x.sec === id), graded = its.filter(x => x.ok !== null);
    const nRec = withRec ? RECS.filter(sl => sl.e === e).length : 0;
    return { id, title: `Exercise ${id} · ${plain(e.title)}${nRec ? ` (🎙 ${nRec} file ghi âm đính kèm)` : ''}`,
      score: graded.filter(x => x.ok).length, total: graded.length, pending: e.type === 'speak' };
  });
}
const blobToB64 = b => new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(',')[1] || ''); fr.onerror = () => rej(fr.error); fr.readAsDataURL(b); });
async function payload1(){
  const items = itemsOf(S.r1, true), audios = [];
  for (const sl of RECS){
    const m = S.rec[sl.qk], blob = m ? await loadRec(sl.qk) : null;
    if (blob) audios.push({ code: sl.code, label: sl.label, mime: m.mime, ext: m.ext, dur: m.dur, b64: await blobToB64(blob) });
  }
  // ✓/✗ (không chấm điểm): gửi kèm để cô xem
  const extras = LESSON.ex.filter(e => e.tick).map(e => {
    const rows = [];
    (e.examples || []).forEach((t, j) => rows.push([e.id + '-ex' + (j || ''), t]));
    itemsOfEx(e).forEach(it => rows.push([e.id + '-' + it.n, it.t]));
    const filled = t => plain(String(t).replace(TOK, m0 => { const tk = parseTok([...m0.matchAll(TOK)][0]); return tk.kind === 'gap' ? tk.alts[0] : tk.kind === 'ch' ? tk.opts[tk.correct[0]] : tk.sg; }));
    return { label: `Exercise ${exNo(e)} – ✓/✗ ${plain(e.title)}`,
      text: rows.map(([k, t]) => (S.tick[k] === 'y' ? '✓ ' : S.tick[k] === 'n' ? '✗ ' : '– ') + filled(t)).join('\n') };
  });
  return Object.assign(base(), {
    attempt: 1, canRetry: S.r1.score < S.r1.total,
    startedAt: S.startedAt, submittedAt: S.r1.at, timeTakenSec: secsBetween(S.startedAt, S.r1.at), leaves: S.r1.leaves,
    score: S.r1.score, total: S.r1.total, sections: sectionsOf(items, true), items, extras, audios, wantsAudio: RECS.length > 0, audio: null,
  });
}
function payload2(){
  const items = itemsOf(S.r2), first = itemsOf(S.r1);
  return Object.assign(base(), {
    attempt: 2, startedAt: S.retryAt || S.r1.at, submittedAt: S.r2.at, timeTakenSec: secsBetween(S.retryAt || S.r1.at, S.r2.at), leaves: Math.max(0, S.r2.leaves - S.r1.leaves),
    score: S.r2.score, total: S.r2.total, sections: sectionsOf(items, false), items,
    first: { score: S.r1.score, total: S.r1.total, sections: sectionsOf(first, false), items: first,
      startedAt: S.startedAt, submittedAt: S.r1.at, timeTakenSec: secsBetween(S.startedAt, S.r1.at), leaves: S.r1.leaves },
  });
}
async function post(p){
  const tk = window.YumiAuth && YumiAuth.token(); if (tk) p.token = tk; // đã đăng nhập → máy chủ ghi đúng tên + tính XP
  const r = await fetch(SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(p) });
  const j = await r.json();
  if (!j.ok && j.auth && window.YumiAuth){ await YumiAuth.authFailed(YA_OPTS); return post(p); } // hết phiên → đăng nhập lại rồi gửi lại
  if (!j.ok) throw new Error(j.error || 'máy chủ báo lỗi');
}
let sending = false;
async function send(){
  if (sending || !S.r1) return;
  sending = true; sendState = 'sending'; sendErr = ''; updateStatus();
  try {
    for (;;){
      if (!S.sent1){ await post(await payload1()); S.sent1 = true; save(); continue; }
      if (S.r2 && !S.sent2){ await post(payload2()); S.sent2 = true; save(); continue; }
      break;
    }
    sendState = 'ok';
  } catch (err){ sendState = 'err'; sendErr = err && err.message ? err.message : String(err); }
  sending = false; updateStatus();
}

/* ============ ĐẾM SỐ LẦN RỜI TRANG ============ */
let away = false, muteAway = false;
function releaseAway(){ setTimeout(() => { muteAway = false; away = false; }, 800); }
const tracking = () => S && !!S.startedAt && (S.phase === 'work' || S.phase === 'retry') && $('#work') && !$('#work').hidden;
function goAway(){ if (muteAway || away || REC || !tracking()) return; away = true; S.leaves = (S.leaves || 0) + 1; save(); }
function comeBack(){
  if (document.hidden || !document.hasFocus()) return;
  const was = away; away = false;
  if (was && tracking() && (S.leaves || 0) > 5) toast(`🕵️ ${tease('away')} <small>(rời trang ${S.leaves} lần)</small>`);
}
document.addEventListener('visibilitychange', () => document.hidden ? goAway() : comeBack());
window.addEventListener('blur', goAway);
window.addEventListener('focus', comeBack);

/* ============ KHỞI ĐỘNG ============ */
/* ============ CHẶN TRÌNH DUYỆT TRONG ZALO ============ */
// Mở link ngay trong Zalo thì bài làm lưu trong Zalo, mở lại bằng trình duyệt khác sẽ mất → không cho làm,
// hướng dẫn mở bằng Chrome (Android) / Safari (iPhone). Cô xem thử màn này: thêm ?zalo vào link.
const IN_ZALO = /\bZalo/i.test(navigator.userAgent) || new URLSearchParams(location.search).has('zalo');
function zaloBlock(){
  const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && 'ontouchend' in document);
  const br = ios ? 'Safari' : 'Chrome';
  $('#bar').hidden = true; $('#back').hidden = true;
  document.title = 'Mở bằng trình duyệt – PET Arena';
  $('#app').innerHTML = `<section class="card zalo">
    <div class="zic">🚫</div>
    <h2>Không làm bài trong Zalo nhé!</h2>
    <p>Làm bài ngay trong Zalo sẽ <b>không lưu được kết quả</b> (mở lại hoặc đổi máy là mất bài). Em mở link bằng <b>${br}</b> để làm nha.</p>
    <ol class="zsteps">
      <li>Nhấn vào nút <span class="zkey">⋯</span> (3 chấm) ở <b>góc trên bên phải</b> màn hình.</li>
      <li>Chọn <b>“Mở bằng trình duyệt”</b> (hoặc “Open in browser”).</li>
      <li>Chọn <b>${br}</b>${ios ? '' : ' (nếu máy hỏi chọn trình duyệt)'}. Lần sau luôn mở link bằng <b>${br}</b> trên <b>cùng một máy</b> để không mất bài.</li>
    </ol>
    <p class="muted small">Không thấy nút 3 chấm? Bấm <b>Sao chép link</b> rồi dán vào ${br}.</p>
    <button class="btn" type="button" id="zCopy">📋 Sao chép link</button> <span class="zok" id="zOk"></span>
  </section>`;
  $('#zCopy').onclick = async () => {
    const url = location.href.replace(/([?&])zalo(=[^&]*)?(&|$)/, (m, a, b, c) => c ? a : '').replace(/[?&]$/, '');
    let ok = false;
    try { await navigator.clipboard.writeText(url); ok = true; } catch (e) {
      const t = document.createElement('textarea'); t.value = url; document.body.appendChild(t); t.select();
      try { ok = document.execCommand('copy'); } catch (e2) {} t.remove();
    }
    $('#zOk').textContent = ok ? '✅ Đã chép! Mở ' + br + ' và dán vào ô địa chỉ.' : url;
  };
}

function boot(){
  if (YA && !YA.me()){ YA.require(YA_OPTS).then(() => { yaSync(); boot(); }); return; } // bắt đăng nhập trước
  yaSync();
  if (VMODE) return vocabBoot(); // nhiệm vụ từ vựng (vocab.js)
  if (!LESSON){
    $('#bar').hidden = true;
    if (WEEK_NO) { $('#app').innerHTML = '<div class="card">🔒 Mission này chưa mở. <a href="./">← Về Lobby</a></div>'; return; }
    renderHome(); return;
  }
  $('#back').hidden = false;
  S = Object.assign(blank(), lsGet(storeKey(WEEK_NO)) || {});
  const redone = applyRedo(storeKey(WEEK_NO)); // mở link làm lại của cô
  buildLesson();
  if (redone) $('#startErr').insertAdjacentHTML('beforebegin', REDO_MSG);
  $('#submitBtn').addEventListener('click', onSubmit);
  if (S.startedAt && S.name) showWork();
  paintAll();
  if (S.r1 && (!S.sent1 || (S.r2 && !S.sent2))) send(); // lần trước chưa gửi được → gửi lại
}
(function start(){
  initArena(); // gắn nút âm thanh 1 lần (boot() chạy lại sau khi đăng nhập)
  if (IN_ZALO){ zaloBlock(); return; }
  boot();
})();
