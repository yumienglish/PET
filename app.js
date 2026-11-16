/* PET Grammar – giao diện, chấm điểm, làm lại câu sai, gửi bài */
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
  if (g.startsWith('N:')){ const [sg, pl] = g.slice(2).split('/').map(x => x.trim()); return { kind: 'noun', sg, pl }; }
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
function nounCheck(ans, sg, pl){
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
  spell: 'Gần đúng rồi! So lại chính tả với từ trong khung.',
  word: 'Nhìn kỹ chữ cái trong tranh rồi chọn lại từ trong khung.',
};

/* ============ ĐIỀU HƯỚNG ============ */
const WEEK_NO = parseInt(new URLSearchParams(location.search).get('w'), 10);
const LESSON = WEEK_NO && WEEK_NO <= OPEN_WEEK ? LESSONS[WEEK_NO] : null;
const ME_KEY = 'pet-me';
const storeKey = w => 'pet-w' + w;

function renderHome(){
  document.title = 'PET Grammar';
  $('#heroSub').textContent = 'Cambridge PET · Oxford Grammar for Schools 5';
  const weeks = Object.keys(LESSONS).map(Number).filter(w => w <= OPEN_WEEK).sort((a, b) => b - a);
  const next = LESSONS[OPEN_WEEK + 1];
  $('#app').innerHTML = `<section class="card">
      <h2 style="margin:0 0 4px">👋 Hello!</h2>
      <p class="muted" style="margin:0">Mỗi tuần 1 bài. Chọn bài tuần này, làm xong bấm <b>Submit</b>.</p>
    </section>
    ${weeks.map(w => {
      const L = LESSONS[w], s = lsGet(storeKey(w)) || {};
      const st = s.phase === 'done' ? `<span class="tag ok">✅ Done${s.r2 ? ' · ' + s.r2.score + '/' + s.r2.total : s.r1 ? ' · ' + s.r1.score + '/' + s.r1.total : ''}</span>`
        : s.phase === 'retry' || s.phase === 'review' ? '<span class="tag warn">✏️ Làm lại câu sai</span>'
        : s.startedAt ? '<span class="tag">⏳ In progress</span>' : '<span class="tag new">🆕 New</span>';
      return `<a class="card lesson" href="?w=${w}">
        <div class="lnum">${w}</div>
        <div class="linfo"><div class="lt">Week ${w}${w === OPEN_WEEK ? ' · <b class="now">This week</b>' : ''}</div>
          <div class="ln">${esc(L.code)} · ${esc(L.title)}</div></div>
        <div>${st}</div></a>`;
    }).join('')}
    ${next ? `<div class="card lesson locked"><div class="lnum">🔒</div><div class="linfo"><div class="lt">Week ${OPEN_WEEK + 1}</div><div class="ln">Coming next week</div></div></div>` : ''}`;
}

/* ============ DANH SÁCH CÂU HỎI ============ */
// Mỗi chỗ trống = 1 câu chấm điểm. k = "<bài>-<câu><a,b…>"
let QS = [];
function itemsOfEx(e){
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
  LESSON.ex.forEach(e => itemsOfEx(e).forEach(it => {
    const ts = toks(it.t);
    ts.forEach((tok, ti) => QS.push({
      k: e.id + '-' + it.n + (ts.length > 1 ? 'abcdefgh'[ti] : ''), e, it, ti, tok,
      label: it.n + (ts.length > 1 ? 'abcdefgh'[ti] : ''),
      h: Array.isArray(it.h) ? it.h[ti] : it.h,
    }));
  }));
}
const qOf = k => QS.find(q => q.k === k);
const tokText = tok => tok.kind === 'ch' ? tok.correct.map(i => tok.opts[i]).join(' + ')
  : tok.kind === 'noun' ? `${vowelStart(tok.sg) ? 'an' : 'a'} ${tok.sg} / (số đếm) ${tok.pl}` : tok.alts[0];
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
  const pre = e.type === 'label' ? `Picture ${q.it.grp}${q.it.head ? ' – topic' : ' – ' + q.it.n.slice(-1)}: ` : e.type === 'pics' ? 'Picture: ' : '';
  return pre + plain(pick);
}

/* ============ TRẠNG THÁI BÀI ============ */
let S = null;
// phase: work → (Submit) review: xem đúng/sai, khoá hết → (Làm lại câu sai) retry: chỉ hiện câu sai + gợi ý → (Nộp lần 2) done
const blank = () => ({ name: '', cls: '', startedAt: null, leaves: 0, a: {}, phase: 'work', r1: null, r2: null, sid: '', sent1: false, sent2: false, retryAt: null });
const save = () => lsSet(storeKey(WEEK_NO), S);

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
    return `<span class="gw"><input class="txt ${tok.kind === 'noun' ? 'noun' : 'gap'}" data-k="${k}" ${ia} aria-label="Answer ${esc(k)}"></span>`;
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
    <p class="how">${unv(e.how)}</p>${e.vn ? `<p class="vn">👉 ${e.vn}</p>` : ''}
    ${ws.length ? `<div class="words"><span class="wl">📒 New words:</span> ${ws.map(w => vt(`{{${w}}}`)).join(' ')}</div>` : ''}`;
}
function exList(e){
  const ex = (e.examples || []).map(t => `<div class="it example${e.conv ? ' conv' : ''}"><span class="cn">▶</span><div class="itb">${renderT(t, null, true)}</div></div>`).join('');
  return `<div class="items">${ex}${itemsOfEx(e).map(it => `<div class="it${e.conv ? ' conv' : ''}" data-item="${e.id}-${it.n}">
      <span class="cn">${it.n}</span><div class="itb">${renderT(it.t, keysOf(e, it))}${fixBox(e, it)}</div></div>`).join('')}</div>`;
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
  document.title = 'PET ' + LESSON.code + ' · ' + LESSON.title;
  $('#heroSub').textContent = `Week ${WEEK_NO} · ${LESSON.code}: ${LESSON.title}`;
  buildQS();
  const allWords = [];
  LESSON.ex.map(e => JSON.stringify(Object.assign({}, e, { how: '' }))).join(' ').replace(/\{\{([^}|]+)/g, (_, k) => { if (VOCAB[k] && !allWords.includes(k)) allWords.push(k); });
  $('#app').innerHTML = `
    <section class="card start" id="start">
      <h2>👋 Hi! What’s your name?</h2>
      <p class="muted" style="margin:0">Điền tên và lớp rồi bấm <b>Start</b>.</p>
      <div class="field"><label for="inName">Full name</label><input id="inName" autocomplete="name" placeholder="e.g. Nguyễn Minh Anh"></div>
      <div class="field"><label for="inCls">Class</label><input id="inCls" placeholder="e.g. PET01"></div>
      <div class="err" id="startErr"></div>
      <button class="btn" id="startBtn" type="button">Start →</button>
    </section>
    <div id="work" hidden>
      <div class="topbar" id="topbar" hidden></div>
      <div id="summaryBox"></div>
      <div class="card who" id="whoBar"></div>
      <section class="card guide">
        <h2>📌 How to do this homework</h2>
        <ul class="steps">
          <li>📘 Chưa chắc ngữ pháp? Mở ô <b>Grammar</b> bên dưới để xem lại.</li>
          <li>👆 Chữ tô vàng như ${vt('{{furniture}}')} là <b>từ mới</b>: chạm vào để xem nghĩa và nghe đọc.</li>
          <li>✅ Làm xong bấm <b>Submit</b>. Câu sai sẽ hiện ra để em <b>làm lại 1 lần</b> (có gợi ý), rồi bấm <b>Nộp lần 2</b>.</li>
          <li>⏱ Cô xem được thời gian làm bài và số lần em rời khỏi trang, nên làm 1 mạch nha.</li>
        </ul>
        <div class="note">✍️ Em nhớ <b>chép từ mới vào vở</b> nha!</div>
        <details class="gram"><summary>📘 Grammar: ${esc(LESSON.title)}</summary><div class="gbody">${LESSON.grammar || ''}</div></details>
        <details class="vlist"><summary>📒 New words in this lesson (${allWords.length})</summary>
          <div class="vgrid">${allWords.map(k => `<div class="vi">${vt('{{' + k + '}}')}<span class="vipa">${esc(VOCAB[k].ipa)}</span><span class="vmean">${esc(VOCAB[k].vi)}</span></div>`).join('')}</div>
        </details>
      </section>
      ${LESSON.ex.map(e => `<section class="card ex" id="ex${e.id}">${exHead(e)}${
        e.type === 'label' ? exLabel(e) : e.type === 'pics' ? exPics(e) : exList(e)}</section>`).join('')}
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
    const b = ev.target.closest('.ch[data-k] .opt'); if (!b || b.disabled) return;
    const k = b.closest('.ch').dataset.k, q = qOf(k), i = Number(b.dataset.i);
    if (!(S.phase === 'work' || (S.phase === 'retry' && !S.r1.items[k].ok))) return;
    let cur = Array.isArray(S.a[k]) ? S.a[k].slice() : [];
    if (q.tok.need <= 1) cur = cur[0] === i ? [] : [i];
    else if (cur.includes(i)) cur = cur.filter(x => x !== i);
    else { cur.push(i); if (cur.length > q.tok.need) cur.shift(); }
    S.a[k] = cur; save(); paintChoices(); progress(); if (S.phase === 'retry') topProgress();
  });
  const me = lsGet(ME_KEY) || {};
  $('#inName').value = S.name || me.name || ''; $('#inCls').value = S.cls || me.cls || '';
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
  save(); lsSet(ME_KEY, { name: S.name, cls: S.cls });
  showWork(); window.scrollTo({ top: 0 });
}
function renderWho(){
  const when = S.phase === 'done' ? (S.r2 || S.r1).at : null;
  $('#whoBar').innerHTML = `<span>👤 <b>${esc(S.name)}</b> · Class <b>${esc(S.cls)}</b></span>` +
    (when ? `<span class="muted small">Submitted ${new Date(when).toLocaleString('vi-VN')}</span>`
      : S.phase === 'work' ? '<button class="linkbtn" type="button" id="editName">Sửa tên / lớp</button>' : '');
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
    const d = QS.filter(answered).length;
    $('#progT').textContent = `Done ${d}/${QS.length}`;
    $('#progF').style.width = (QS.length ? d / QS.length * 100 : 0) + '%';
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
  if (q.tok.kind === 'noun') return nounCheck(v, q.tok.sg, q.tok.pl).ok;
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
  if (q.tok.kind === 'noun') return NOUN_HINT[nounCheck(r.ans, q.tok.sg, q.tok.pl).why] || NOUN_HINT.word;
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
    tb.innerHTML = `<div class="tt" id="topT"></div><button class="btn orange" type="button" id="submit2Btn">Nộp lần 2 ✔</button>`;
    $('#submit2Btn').onclick = onSubmit;
    topProgress();
  }
}
function topProgress(){
  const el = $('#topT'); if (!el) return;
  const w = wrongKeys(), fixed = w.filter(k => !sameAns(k)).length;
  el.textContent = `✏️ Đã sửa ${fixed}/${w.length} câu`;
}
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
    if (!R.ok) el.insertAdjacentHTML('afterend', `<span class="sol">→ ${esc(q.tok.kind === 'noun' ? (vowelStart(q.tok.sg) ? 'an ' : 'a ') + q.tok.sg : q.tok.alts[0])}</span>`);
  });
  // gợi ý (chỉ lúc làm lại) gom theo câu
  $$('[data-fix]').forEach(f => { f.innerHTML = ''; });
  if (S.phase === 'retry'){
    const by = {};
    wrongKeys().forEach(k => { const q = qOf(k), id = q.e.id + '-' + q.it.n; (by[id] = by[id] || []).push(q); });
    Object.entries(by).forEach(([id, qs]) => {
      const f = $(`[data-fix="${id}"]`); if (!f) return;
      f.innerHTML = qs.map(q => `<div class="again">💡 ${qs.length > 1 || toks(q.it.t).length > 1 ? `<b>(${q.ti + 1})</b> ` : ''}${hintFor(q.k)}</div>`).join('');
    });
  }
  // đánh số chỗ trống khi câu có nhiều chỗ và đang làm lại
  $$('.gw, .ch[data-k]').forEach(w => w.removeAttribute('data-n'));
  if (S.phase === 'retry') wrongKeys().forEach(k => {
    const q = qOf(k); if (toks(q.it.t).length < 2) return;
    const el = $(`input.txt[data-k="${k}"]`), w = el ? el.parentNode : $(`.ch[data-k="${k}"]`);
    if (w) w.setAttribute('data-n', q.ti + 1);
  });
}
function renderSummary(){
  const box = $('#summaryBox');
  if (S.phase === 'work'){ box.innerHTML = ''; return; }
  const secs = R => LESSON.ex.map(e => {
    const ks = QS.filter(q => q.e === e).map(q => q.k), sc = ks.filter(k => R.items[k].ok).length;
    return `<span class="sec${sc === ks.length ? ' full' : ''}">Ex ${exNo(e)}: ${sc}/${ks.length}</span>`;
  }).join('');
  if (S.phase === 'review' || S.phase === 'retry'){
    box.innerHTML = `<div class="card summary retry"><div class="score">${S.r1.score}<span>/${S.r1.total}</span></div>
      <div class="sumr"><div class="secs">${secs(S.r1)}</div>
      <div class="muted small">Màu đỏ = câu sai.</div>
      <div class="status" id="sendStatus"></div></div></div>`;
    updateStatus();
    return;
  }
  const R = S.r2 || S.r1, pct = R.total ? R.score / R.total : 0;
  box.innerHTML = `<div class="card summary"><div class="score">${R.score}<span>/${R.total}</span></div>
    <div class="sumr"><div class="big">${R.score === R.total ? '🎉 Excellent! All correct!' : pct >= .8 ? '👏 Great job!' : pct >= .5 ? '💪 Good try!' : '📚 Let’s review the answers below.'}</div>
    <div class="secs">${S.r2 ? `<span class="sec">1st try: ${S.r1.score}/${S.r1.total}</span><span class="sec full">2nd try: ${S.r2.score}/${S.r2.total}</span>` : '<span class="sec full">All correct the first time ⭐</span>'}${secs(R)}</div>
    <div class="muted small">Câu còn sai có đáp án màu xanh (→).</div>
    <div class="status" id="sendStatus"></div></div></div>`;
  updateStatus();
}
function paintAll(){ paintMarks(); paintChoices(); focusWrong(S.phase === 'retry'); renderTop(); renderSummary(); renderWho(); progress(); }

/* ============ NỘP BÀI ============ */
async function onSubmit(){
  if (S.phase === 'work'){
    const left = QS.filter(q => !answered(q)).length;
    muteAway = true;
    const go = confirm(left ? `Còn ${left} câu chưa làm. Nộp luôn?` : 'Nộp bài nhé?');
    releaseAway(); if (!go) return;
    const g = gradeNow(), at = new Date().toISOString();
    S.r1 = { at, leaves: S.leaves || 0, score: g.score, total: g.total, items: g.items };
    S.sid = makeSid();
    S.phase = g.score === g.total ? 'done' : 'review';
    save(); paintAll(); window.scrollTo({ top: 0, behavior: 'smooth' });
    send();
    return;
  }
  if (S.phase === 'retry'){
    muteAway = true;
    const go = confirm('Nộp lần 2? Nộp xong sẽ hiện đáp án.');
    releaseAway(); if (!go) return;
    const g = gradeNow();
    // câu đúng ở lần 1 giữ nguyên kết quả
    Object.keys(S.r1.items).forEach(k => { if (S.r1.items[k].ok) g.items[k] = S.r1.items[k]; });
    const ks = Object.keys(g.items);
    S.r2 = { at: new Date().toISOString(), leaves: S.leaves || 0, score: ks.filter(k => g.items[k].ok).length, total: ks.length, items: g.items };
    S.phase = 'done'; save(); paintAll(); window.scrollTo({ top: 0, behavior: 'smooth' });
    send();
  }
}

/* ============ GỬI BÀI ============ */
let sendState = null, sendErr = '';
function updateStatus(){
  const el = $('#sendStatus'); if (!el) return;
  const allSent = S.sent1 && (!S.r2 || S.sent2);
  const st = allSent && sendState !== 'sending' ? 'ok' : sendState;
  el.className = 'status ' + (st || '');
  if (st === 'ok') el.innerHTML = S.phase === 'retry' || S.phase === 'review' ? '✅ Cô đã nhận bài lần 1.' : S.r2 ? '✅ Cô đã nhận được bài lần 2!' : '✅ Cô đã nhận được bài!';
  else if (!st) el.innerHTML = '';
  else if (st === 'sending') el.innerHTML = '⏳ Đang gửi bài cho cô…';
  else el.innerHTML = `⚠️ Chưa gửi được bài${sendErr ? ` (${esc(sendErr)})` : ''}. Em kiểm tra mạng rồi bấm: <button class="btn sm" type="button" id="resendBtn">Gửi lại</button>`;
  const rb = $('#resendBtn'); if (rb) rb.onclick = send;
}
const secsBetween = (a, b) => a && b ? Math.max(0, Math.round((new Date(b) - new Date(a)) / 1000)) : null;

// Giống các trang BTVN khác: lần 1 gửi ngay; lần 2 gửi kèm kết quả lần 1 để mail so sánh 2 lần.
const makeSid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const base = () => ({ app: 'btvn', unit: 'PET', title: `PET Grammar ${LESSON.code} – Week ${WEEK_NO}`, name: S.name, cls: S.cls, sid: S.sid || '' });
function itemsOf(R){
  return QS.map(q => ({ sec: String(exNo(q.e)), n: q.label, q: qText(q), ans: R.items[q.k].ans, correct: correctText(q), ok: R.items[q.k].ok }));
}
function sectionsOf(items){
  return LESSON.ex.map(e => {
    const its = items.filter(x => x.sec === String(exNo(e)));
    return { id: String(exNo(e)), title: `Exercise ${exNo(e)} · ${plain(e.title)}`, score: its.filter(x => x.ok).length, total: its.length, pending: false };
  });
}
function payload1(){
  const items = itemsOf(S.r1);
  return Object.assign(base(), {
    attempt: 1, canRetry: S.r1.score < S.r1.total,
    startedAt: S.startedAt, submittedAt: S.r1.at, timeTakenSec: secsBetween(S.startedAt, S.r1.at), leaves: S.r1.leaves,
    score: S.r1.score, total: S.r1.total, sections: sectionsOf(items), items, wantsAudio: false, audio: null,
  });
}
function payload2(){
  const items = itemsOf(S.r2), first = itemsOf(S.r1);
  return Object.assign(base(), {
    attempt: 2, startedAt: S.retryAt || S.r1.at, submittedAt: S.r2.at, timeTakenSec: secsBetween(S.retryAt || S.r1.at, S.r2.at), leaves: Math.max(0, S.r2.leaves - S.r1.leaves),
    score: S.r2.score, total: S.r2.total, sections: sectionsOf(items), items,
    first: { score: S.r1.score, total: S.r1.total, sections: sectionsOf(first), items: first,
      startedAt: S.startedAt, submittedAt: S.r1.at, timeTakenSec: secsBetween(S.startedAt, S.r1.at), leaves: S.r1.leaves },
  });
}
async function post(p){
  const r = await fetch(SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(p) });
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || 'máy chủ báo lỗi');
}
let sending = false;
async function send(){
  if (sending || !S.r1) return;
  sending = true; sendState = 'sending'; sendErr = ''; updateStatus();
  try {
    for (;;){
      if (!S.sent1){ await post(payload1()); S.sent1 = true; save(); continue; }
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
function goAway(){ if (muteAway || away || !tracking()) return; away = true; S.leaves = (S.leaves || 0) + 1; save(); }
function comeBack(){ if (!document.hidden && document.hasFocus()) away = false; }
document.addEventListener('visibilitychange', () => document.hidden ? goAway() : comeBack());
window.addEventListener('blur', goAway);
window.addEventListener('focus', comeBack);

/* ============ KHỞI ĐỘNG ============ */
(function boot(){
  if (!LESSON){
    $('#bar').hidden = true;
    if (WEEK_NO) { $('#app').innerHTML = '<div class="card">🔒 Bài này chưa mở. <a href="./">← Quay lại danh sách bài</a></div>'; return; }
    renderHome(); return;
  }
  $('#back').hidden = false;
  S = Object.assign(blank(), lsGet(storeKey(WEEK_NO)) || {});
  buildLesson();
  $('#submitBtn').addEventListener('click', onSubmit);
  if (S.startedAt && S.name) showWork();
  paintAll();
  if (S.r1 && (!S.sent1 || (S.r2 && !S.sent2))) send(); // lần trước chưa gửi được → gửi lại
})();
