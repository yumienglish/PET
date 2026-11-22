/* =====================================================================
   PET Arena – NHIỆM VỤ TỪ VỰNG  (?w=tuần&m=vocab, dữ liệu VOCAB_LESSONS trong lessons.js)
   Bước 1 Learn: đọc truyện, bấm đủ các từ vàng xem nghĩa, xác nhận đã chép vở.
   4 vòng: Recognition (chọn nghĩa) · Meaning recall (lật thẻ, tự đánh giá) · Form recall (gõ từ)
           · Context (điền từ vào câu, đổi dạng). Sai → hỏi lại cuối vòng (tối đa 1 lần). Điểm = lần đầu.
   Xong 4 vòng: gửi 1 mail cho cô, tính XP / xu như bài Grammar, mở Flashcards ở đầu mission.
   Nạp TRƯỚC app.js, chỉ khai báo; app.js boot() gọi vocabBoot() khi có &m=vocab.
   ===================================================================== */
const VMODE = new URLSearchParams(location.search).get('m') === 'vocab';
const VROUNDS = [
  { id: 'rec', icon: '👀', name: 'Recognition', how: 'Look at the word and listen. Tap the correct meaning.', vi: 'Nhìn từ, nghe phát âm rồi chọn nghĩa đúng.' },
  { id: 'mean', icon: '🧠', name: 'Meaning recall', how: 'Read the word and the example. Say the meaning in your head, then flip the card and check. Be honest!',
    vi: 'Đọc từ và câu ví dụ, tự nhớ nghĩa trong đầu rồi lật thẻ để kiểm tra. Trung thực nhé!' },
  { id: 'form', icon: '⌨️', name: 'Form recall', how: 'Read the meaning. Type the missing English word or phrase.', vi: 'Đọc nghĩa rồi gõ từ / cụm từ tiếng Anh còn thiếu.' },
  { id: 'ctx', icon: '🧩', name: 'Context', how: 'Complete each sentence. Change the form if needed (die → died, let → lets…).', vi: 'Điền từ vào câu. Nhớ đổi dạng từ khi cần.' },
];
let VL = null, VS = null, VG = null; // bài từ vựng, trạng thái đã lưu, vòng đang chơi
const vKey = w => 'pet-vocab-' + String(VOCAB_LESSONS[w].code).toLowerCase().replace(/\s+/g, '');
const vsave = () => lsSet(vKey(WEEK_NO), VS);
const vblank = () => ({ name: '', cls: '', startedAt: null, leaves: 0, phase: 'learn', seen: {}, noted: false, res: {}, r1: null, sid: '', sent1: false });
// dạng "bài" cho sảnh chính / thống kê (arena.js)
const vocabAsLesson = w => { const V = VOCAB_LESSONS[w]; return { code: V.code, title: V.title, newWords: V.cards.map(c => c.k), vocab: true }; };
const vocabState = w => lsGet(vKey(w)) || {};

/* ---------- chấm chữ ---------- */
const vnorm = s => nrm(s).replace(/-/g, ' ').replace(/\bsb\b/g, 'somebody').replace(/\bsth\b/g, 'something').replace(/\s+/g, ' ').trim();
const vsame = (a, alts) => alts.some(x => vnorm(x) === vnorm(a));
const fTarget = c => (c.f.match(/\{([^}]+)\}/) || [])[1] || c.w;
const fAlts = c => [fTarget(c), c.f.replace(/[{}]/g, '')].concat(c.fa || []);
const fHint = c => esc(c.f).replace(/\{([^}]+)\}/, (_, t) => `<b class="vx-blank">${t.replace(/[A-Za-z]/g, (ch, i) => i === 0 ? ch : '_')}</b>`);
const cParts = c => { const m = c.c.match(/^(.*?)\[\[([^\]]+)\]\](.*)$/); return { pre: m[1], alts: m[2].split('|'), post: m[3] }; };
const cPlain = c => { const p = cParts(c); return p.pre + '___' + p.post; };

/* ---------- vào nhiệm vụ ---------- */
function vocabBoot(){
  VL = (WEEK_NO <= OPEN_WEEK || PREVIEW) ? VOCAB_LESSONS[WEEK_NO] : null;
  $('#bar').hidden = true;
  if (!VL){ $('#app').innerHTML = '<div class="card">🔒 This mission is locked. <a href="./">← Back to Lobby</a></div>'; return; }
  $('#back').hidden = false;
  document.title = `Vocab ${String(WEEK_NO).padStart(2, '0')} · ${VL.title} – PET Arena`;
  $('#heroSub').textContent = `MISSION ${String(WEEK_NO).padStart(2, '0')} · VOCAB · ${VL.code}: ${VL.title}`;
  VS = Object.assign(vblank(), vocabState(WEEK_NO));
  const me = lsGet(ME_KEY) || {};
  if (!VS.name && me.name){ VS.name = me.name; VS.cls = me.cls || ''; }
  if (!VS.startedAt){ VS.startedAt = new Date().toISOString(); }
  vsave();
  vtrack();
  vrender();
  if (VS.r1 && !VS.sent1) vsend(); // lần trước chưa gửi được → gửi lại
}

/* ---------- vẽ trang theo bước ---------- */
function vsteps(){
  const order = ['learn'].concat(VROUNDS.map(r => r.id), ['done']);
  const cur = VG && VG.practice ? 'done' : VS.phase, ci = order.indexOf(cur);
  const items = [['learn', '📖', 'Learn']].concat(VROUNDS.map((r, i) => [r.id, r.icon, 'Round ' + (i + 1)]), [['done', '🃏', 'Flashcards']]);
  return `<div class="vx-steps">${items.map(([id, ic, lb], i) => {
    const st = i < ci || cur === 'done' ? 'done' : i === ci ? 'on' : 'lock';
    return `<span class="vx-step ${st}"><i>${st === 'done' && id !== 'done' ? '✓' : st === 'lock' && id === 'done' ? '🔒' : ic}</i>${lb}</span>`; }).join('')}</div>`;
}
function vrender(){
  if (VS.phase === 'learn') return vlearn();
  if (VS.phase === 'done' && !(VG && VG.practice)) return vdone();
  vintro();
}
const vwrap = html => { $('#app').innerHTML = vsteps() + html; window.scrollTo({ top: 0 }); };

/* ---------- Bước 1: đọc truyện, bấm từ, chép vở ---------- */
let vlearnBound = false, vupd = null;
function vlearn(){
  const n = VL.cards.filter(c => VS.seen[c.k]).length, all = n === VL.cards.length;
  const needName = !VS.name && !(typeof YA !== 'undefined' && YA && YA.me());
  vwrap(`<section class="card vx-learn">
      <div class="pl-tag">STEP 1 · READ & LEARN</div>
      <h2 class="vx-h">📖 ${esc(VL.story.title)}</h2>
      <div class="vx-note">✍️ <b>Tap every yellow word</b> to see its meaning and hear it. <b>Copy each new word, its meaning and an example into your notebook.</b>
        <span class="vx-vi">Bấm vào từng từ màu vàng để xem nghĩa, nghe đọc. Chép từ mới, nghĩa và 1 câu ví dụ vào vở để nhớ lâu.</span></div>
      <div class="vx-story">${VL.story.paras.map(p => `<p>${vt(p)}</p>`).join('')}</div>
    </section>
    <section class="card vx-words">
      <h2 class="sech" style="margin:0 0 10px">📒 New words <span class="cnt" id="vxSeen">${n}/${VL.cards.length}</span></h2>
      <div class="vx-chips">${VL.cards.map(c => `<button type="button" class="vx-chip${VS.seen[c.k] ? ' seen' : ''}" data-k="${esc(c.k)}">${VS.seen[c.k] ? '✓ ' : ''}${esc(c.w)}</button>`).join('')}</div>
      <p class="muted small" style="margin:8px 0 0">Words you have checked turn green. Tap a word here to hear it again.</p>
      ${needName ? `<div class="field"><label for="vxName">Full name</label><input id="vxName" autocomplete="name" placeholder="e.g. Nguyễn Minh Anh"></div>
        <div class="field"><label for="vxCls">Class</label><input id="vxCls" placeholder="e.g. PET01"></div>` : ''}
      <label class="vx-check"><input type="checkbox" id="vxNoted"${VS.noted ? ' checked' : ''}${all ? '' : ' disabled'}> ✍️ I have copied all the new words into my notebook.</label>
      <div class="err" id="vxErr">${all ? '' : 'Check all the yellow words first (' + n + '/' + VL.cards.length + ').'}</div>
      <button class="btn" id="vxGo" type="button"${all && VS.noted ? '' : ' disabled'}>START ROUND 1 ▶</button>
    </section>`);
  const upd = () => {
    const k = VL.cards.filter(c => VS.seen[c.k]).length, ok = k === VL.cards.length;
    $('#vxSeen').textContent = k + '/' + VL.cards.length;
    $('#vxNoted').disabled = !ok; if (!ok) { $('#vxNoted').checked = false; VS.noted = false; }
    $('#vxErr').textContent = ok ? '' : 'Check all the yellow words first (' + k + '/' + VL.cards.length + ').';
    $('#vxGo').disabled = !(ok && VS.noted);
  };
  // bấm từ vàng (bong bóng nghĩa do app.js mở, app.js chặn sự kiện ở document) → nghe ở window để đánh dấu đã xem
  vupd = upd;
  if (!vlearnBound){ vlearnBound = true; window.addEventListener('click', ev => {
    const b = ev.target.closest && ev.target.closest('.vw'); if (!b || !VL || !VL.cards.some(c => c.k === b.dataset.v)) return;
    if (!VS.seen[b.dataset.v]){ VS.seen[b.dataset.v] = 1; vsave(); sfx('tick'); }
    $$(`.vx-chip[data-k="${CSS.escape(b.dataset.v)}"]`).forEach(x => { x.classList.add('seen'); x.textContent = '✓ ' + VL.cards.find(c => c.k === b.dataset.v).w; });
    if ($('#vxSeen') && vupd) vupd();
  }, true); }
  $$('.vx-chip').forEach(x => x.onclick = () => { const c = VL.cards.find(y => y.k === x.dataset.k); say(c.say || c.w); });
  $('#vxNoted').onchange = ev => { VS.noted = ev.target.checked; vsave(); upd(); };
  $('#vxGo').onclick = () => {
    if (needName){
      const nm = $('#vxName').value.trim(), cl = $('#vxCls').value.trim();
      if (nm.length < 2 || !cl){ $('#vxErr').textContent = 'Type your full name and class.'; return; }
      VS.name = nm.slice(0, 80); VS.cls = cl.slice(0, 30); lsSet(ME_KEY, Object.assign(lsGet(ME_KEY) || {}, { name: VS.name, cls: VS.cls }));
    }
    VS.phase = VROUNDS[0].id; vsave(); sfx('pop'); vintro();
  };
}

/* ---------- Giới thiệu vòng ---------- */
function vintro(){
  const i = VG && VG.practice ? VG.i : VROUNDS.findIndex(r => r.id === VS.phase), R = VROUNDS[i];
  vwrap(`<section class="card vx-intro">
    <div class="pl-tag">${VG && VG.practice ? 'PRACTICE · ' : ''}ROUND ${i + 1} OF ${VROUNDS.length}</div>
    <div class="vx-big">${R.icon}</div><h2 class="vx-h">${R.name}</h2>
    <p class="vx-how">${R.how}<span class="vx-vi">${R.vi}</span></p>
    <p class="muted small">${VL.cards.length} words · wrong answers come back at the end of the round.</p>
    <button class="btn" id="vxStart" type="button">START ▶</button></section>`);
  $('#vxStart').onclick = () => { sfx('tick'); vround(i, VG && VG.practice); };
}

/* ---------- Một vòng chơi ---------- */
function vround(i, practice){
  VG = { i, R: VROUNDS[i], practice: !!practice, queue: shuffle(VL.cards.map((_, j) => j)), first: {}, tries: {}, lock: false };
  vq();
}
function vprog(){
  const d = Object.keys(VG.first).length, ok = Object.values(VG.first).filter(x => x.ok).length, back = VG.queue.filter(j => VG.first[j]).length;
  return `<div class="vx-top"><b>${VG.R.icon} ${VG.R.name}</b><span>${d}/${VL.cards.length} · ✅ ${ok}${back ? ` · 🔁 ${back}` : ''}</span></div>
    <div class="vx-bar"><i style="width:${Math.round(d / VL.cards.length * 100)}%"></i></div>`;
}
// ghi kết quả 1 lượt; sai lần đầu → đưa về cuối hàng (tối đa 1 lần)
function vmark(j, ok, ans){
  VG.tries[j] = (VG.tries[j] || 0) + 1;
  if (!VG.first[j]) VG.first[j] = { ok, ans };
  if (!ok && VG.tries[j] < 2) VG.queue.push(j);
  sfx(ok ? 'ok' : 'bad');
}
function vnext(ms){ setTimeout(() => { VG.lock = false; vq(); }, ms); }
function vq(){
  if (!VG.queue.length) return vroundEnd();
  const j = VG.queue.shift(), c = VL.cards[j], again = !!VG.first[j];
  VG.cur = j;
  const tagAgain = again ? '<div class="vx-again">🔁 Try this one again</div>' : '';
  const id = VG.R.id;
  if (id === 'rec'){
    const opts = shuffle([j].concat(shuffle(VL.cards.map((_, x) => x).filter(x => x !== j)).slice(0, 3)));
    vwrap(`<section class="card vx-game">${vprog()}${tagAgain}
      <div class="vx-q"><button class="vx-say" type="button" aria-label="Listen">🔊</button> ${esc(c.w)}</div>
      <div class="vx-sub">What does it mean?</div>
      <div class="vx-opts">${opts.map(x => `<button class="vx-opt" type="button" data-j="${x}">${esc(VL.cards[x].vi)}</button>`).join('')}</div></section>`);
    say(c.say || c.w); $('.vx-say').onclick = () => say(c.say || c.w);
    $$('.vx-opt').forEach(b => b.onclick = () => {
      if (VG.lock) return; VG.lock = true;
      const ok = Number(b.dataset.j) === j;
      $$('.vx-opt').forEach(x => { if (Number(x.dataset.j) === j) x.classList.add('ok'); });
      if (!ok) b.classList.add('bad');
      vmark(j, ok, VL.cards[Number(b.dataset.j)].vi); vnext(ok ? 750 : 1700);
    });
  } else if (id === 'mean'){
    vwrap(`<section class="card vx-game">${vprog()}${tagAgain}
      <div class="vx-flip" id="vxFlip"><div class="vx-face front">
          <div class="vx-q"><button class="vx-say" type="button" aria-label="Listen">🔊</button> ${esc(c.w)}</div>
          <div class="vx-ex">“${esc(c.ex)}”</div>
          <div class="vx-sub">Say the meaning in your head… 🤔</div></div>
        <div class="vx-face back"><div class="vx-mean">${esc(c.vi)}</div><div class="vx-en">${esc(c.en)}</div><div class="vx-ipa">${esc(c.ipa)}</div></div></div>
      <div class="vx-row" id="vxRow"><button class="btn" id="vxShow" type="button">🔄 FLIP</button></div></section>`);
    say(c.say || c.w); $('.vx-say').onclick = ev => { ev.stopPropagation(); say(c.say || c.w); };
    const flip = () => {
      if ($('#vxFlip').classList.contains('on')) return;
      $('#vxFlip').classList.add('on'); sfx('pop');
      $('#vxRow').innerHTML = '<button class="btn grey" id="vxNo" type="button">🔁 Not yet</button><button class="btn" id="vxYes" type="button">✅ I knew it</button>';
      $('#vxYes').onclick = () => { if (VG.lock) return; VG.lock = true; vmark(j, true, 'I knew it'); vnext(250); };
      $('#vxNo').onclick = () => { if (VG.lock) return; VG.lock = true; vmark(j, false, 'Not yet (chưa nhớ)'); vnext(250); };
    };
    $('#vxShow').onclick = flip; $('#vxFlip').onclick = flip;
  } else {
    const ctx = id === 'ctx', p = ctx ? cParts(c) : null, alts = ctx ? p.alts : fAlts(c);
    const bank = ctx ? `<div class="vx-bank">${VL.cards.map(x => `<span>${esc(x.w)}</span>`).join('')}</div>` : '';
    vwrap(`<section class="card vx-game">${vprog()}${tagAgain}
      ${ctx ? `<div class="vx-sent">${esc(p.pre)}<input class="vx-in" id="vxIn" ${ia} aria-label="Answer">${esc(p.post)}</div>`
        : `<div class="vx-mean">${esc(c.vi)}</div><div class="vx-en">${esc(c.en)}</div>
           <div class="vx-pat">${fHint(c)}</div><input class="vx-in wide" id="vxIn" ${ia} placeholder="Type the missing part" aria-label="Answer">`}
      <div class="vx-fb" id="vxFb"></div>
      <div class="vx-row"><button class="btn" id="vxCheck" type="button">CHECK ✔</button></div>
      ${ctx ? `<details class="vx-bankd"><summary>📒 Word list</summary>${bank}</details>` : ''}</section>`);
    const inp = $('#vxIn'); setTimeout(() => inp.focus(), 50);
    let shown = false, firstAns = null;
    const check = () => {
      if (VG.lock) return;
      const v = inp.value.trim(); if (!v) { inp.focus(); return; }
      const ok = vsame(v, alts);
      if (!shown){
        firstAns = v;
        if (ok){ VG.lock = true; inp.classList.add('ok'); $('#vxFb').innerHTML = `<span class="ok">✅ Correct!</span>`; say(ctx ? alts[0] : c.say || c.w); vmark(j, true, v); vnext(900); return; }
        // sai: hiện đáp án, em gõ lại đúng rồi mới đi tiếp (để nhớ mặt chữ)
        shown = true; inp.classList.add('bad'); sfx('bad');
        $('#vxFb').innerHTML = `<span class="bad">❌ Answer: <b>${esc(alts[0])}</b></span><span class="muted small">Type it once to remember it.</span>`;
        say(ctx ? alts[0] : c.say || c.w); inp.value = ''; inp.focus();
        return;
      }
      if (ok){ VG.lock = true; inp.classList.remove('bad'); inp.classList.add('ok'); vmark(j, false, firstAns); vnext(500); }
      else { inp.classList.add('shake'); setTimeout(() => inp.classList.remove('shake'), 400); }
    };
    $('#vxCheck').onclick = check;
    inp.addEventListener('keydown', ev => { if (ev.key === 'Enter'){ ev.preventDefault(); check(); } });
  }
}
// kết thúc 1 vòng
function vroundEnd(){
  const R = VG.R, js = Object.keys(VG.first).map(Number);
  const score = js.filter(j => VG.first[j].ok).length, total = VL.cards.length;
  const last = VG.i === VROUNDS.length - 1;
  if (!VG.practice){
    VS.res[R.id] = { score, total, wrong: js.filter(j => !VG.first[j].ok).map(j => ({ j, ans: VG.first[j].ans })) };
    if (last) return vfinish();
    VS.phase = VROUNDS[VG.i + 1].id; vsave();
  }
  const pct = score / total;
  vwrap(`<section class="card vx-intro">
    <div class="pl-tag">${VG.practice ? 'PRACTICE · ' : ''}ROUND ${VG.i + 1} CLEAR</div>
    <div class="vx-big">${pct === 1 ? '💎' : pct >= .8 ? '🔥' : pct >= .5 ? '💪' : '🌱'}</div>
    <div class="score">${score}<span>/${total}</span></div>
    <p class="vx-how">${pct === 1 ? 'Flawless round!' : pct >= .8 ? 'Great round!' : 'Keep going – the next round will help you remember.'}</p>
    ${last ? '<button class="btn" id="vxNext" type="button">BACK TO FLASHCARDS 🃏</button>'
      : `<button class="btn" id="vxNext" type="button">NEXT: ROUND ${VG.i + 2} · ${VROUNDS[VG.i + 1].name} ▶</button>`}</section>`);
  if (pct === 1) confetti(80);
  $('#vxNext').onclick = () => {
    if (last){ VG = null; return vrender(); }
    if (VG.practice){ VG = { i: VG.i + 1, practice: true }; return vintro(); }
    VG = null; vintro();
  };
}

/* ---------- Xong 4 vòng: chấm, gửi bài, mở Flashcards ---------- */
function vfinish(){
  const score = VROUNDS.reduce((a, R) => a + VS.res[R.id].score, 0), total = VROUNDS.reduce((a, R) => a + VS.res[R.id].total, 0);
  VS.r1 = { at: new Date().toISOString(), leaves: VS.leaves || 0, score, total, items: {} };
  VS.phase = 'done'; VS.sid = VS.sid || makeSid(); vsave(); VG = null;
  vsend();
  vdone(true);
  if (score === total){ confetti(); sfx('win'); } else sfx('ok');
  setTimeout(() => { if (!checkRank()) checkBadges(); }, 2200);
}
function vdone(fresh){
  const R = VS.r1, z = missionXP(VS);
  const parts = [['Accuracy', z.acc], ['Focus', z.focus], ['Flawless', z.flawless]].filter(p => p[1]);
  vwrap(`${vflashHtml()}
    <section class="card summary vx-sum">
      <div class="sumr"><div class="pl-tag">MISSION CLEAR${fresh ? ' 🎉' : ''}</div>
        <div class="score">${R.score}<span>/${R.total}</span></div>
        <div class="vx-rounds">${VROUNDS.map((r, i) => `<span class="tag${VS.res[r.id].score === VS.res[r.id].total ? ' ok' : ''}">${r.icon} R${i + 1} ${VS.res[r.id].score}/${VS.res[r.id].total}</span>`).join('')}</div>
        ${z.total ? `<div class="xpgain"><b>+${z.total} XP</b><span>${parts.map(p => `${p[0]} +${p[1]}`).join(' · ')}</span></div>` : ''}
        <div class="status" id="vxStatus"></div>
        <div class="vx-row left"><button class="btn ghost" id="vxPractice" type="button">🔁 PRACTICE AGAIN</button>
          <button class="btn ghost" id="vxStory" type="button">📖 READ THE STORY</button></div>
        <p class="muted small" style="margin:6px 0 0">Practice does not send a new result to your teacher.</p></div>
    </section>`);
  vstatus();
  vflashBind();
  $('#vxPractice').onclick = () => { VG = { i: 0, practice: true }; vintro(); };
  $('#vxStory').onclick = () => vstoryView();
}
function vstoryView(){
  vwrap(`<section class="card vx-learn"><div class="pl-tag">STORY</div><h2 class="vx-h">📖 ${esc(VL.story.title)}</h2>
    <div class="vx-story">${VL.story.paras.map(p => `<p>${vt(p)}</p>`).join('')}</div>
    <button class="btn" id="vxBack" type="button">← BACK TO FLASHCARDS</button></section>`);
  $('#vxBack').onclick = () => vdone();
}

/* ---------- Flashcards (chỉ mở sau khi xong 4 vòng) ---------- */
let VF = { order: null, i: 0 };
function vflashHtml(){
  if (!VF.order) VF.order = VL.cards.map((_, j) => j);
  return `<section class="card vx-fc">
    <h2 class="sech" style="margin:0 0 10px">🃏 Flashcards <span class="cnt" id="vxFcN"></span></h2>
    <div class="vx-flip big" id="vxFc"><div class="vx-face front" id="vxFcF"></div><div class="vx-face back" id="vxFcB"></div></div>
    <div class="vx-row"><button class="btn ghost" id="vxPrev" type="button" aria-label="Previous">◀</button>
      <button class="btn" id="vxTurn" type="button">🔄 FLIP</button>
      <button class="btn ghost" id="vxNextC" type="button" aria-label="Next">▶</button>
      <button class="btn ghost" id="vxMix" type="button" title="Shuffle">🔀</button></div>
    <p class="muted small" style="text-align:center;margin:6px 0 0">Tap the card to flip it. Use the flashcards to review before class.</p></section>`;
}
function vflashBind(){
  const paint = () => {
    const c = VL.cards[VF.order[VF.i]];
    $('#vxFc').classList.remove('on');
    $('#vxFcF').innerHTML = `<div class="vx-q"><button class="vx-say" type="button" aria-label="Listen">🔊</button> ${esc(c.w)}</div><div class="vx-ipa">${esc(c.ipa)}</div>`;
    $('#vxFcB').innerHTML = `<div class="vx-mean">${esc(c.vi)}</div><div class="vx-en">${esc(c.en)}</div><div class="vx-ex">“${esc(c.ex)}”</div>`;
    $('#vxFcN').textContent = (VF.i + 1) + '/' + VL.cards.length;
    $('#vxFcF .vx-say').onclick = ev => { ev.stopPropagation(); say(c.say || c.w); };
  };
  const turn = () => { $('#vxFc').classList.toggle('on'); sfx('tick'); };
  const go = d => { VF.i = (VF.i + d + VL.cards.length) % VL.cards.length; paint(); };
  $('#vxFc').onclick = turn; $('#vxTurn').onclick = turn;
  $('#vxPrev').onclick = () => go(-1); $('#vxNextC').onclick = () => go(1);
  $('#vxMix').onclick = () => { VF.order = shuffle(VF.order); VF.i = 0; paint(); sfx('pop'); };
  paint();
}

/* ---------- Gửi bài (1 lần, khi xong 4 vòng) ---------- */
let vsending = false, vstate = null, verr = '';
function vstatus(){
  const el = $('#vxStatus'); if (!el) return;
  const st = VS.sent1 ? 'ok' : vstate;
  el.className = 'status ' + (st || '');
  el.innerHTML = st === 'ok' ? '✅ Your teacher has received your result!' : st === 'sending' ? '⏳ Sending your result…'
    : st === 'err' ? `⚠️ Not sent yet${verr ? ` (${esc(verr)})` : ''}. Check your internet, then tap: <button class="btn sm" type="button" id="vxResend">Send again</button>` : '';
  const b = $('#vxResend'); if (b) b.onclick = vsend;
}
function vpayload(){
  const me = lsGet(ME_KEY) || {};
  const sections = VROUNDS.map((R, i) => ({ id: String(i + 1), title: `Round ${i + 1} · ${R.name}${R.id === 'mean' ? ' (học sinh tự đánh giá)' : ''}`,
    score: VS.res[R.id].score, total: VS.res[R.id].total }));
  const q = { rec: c => `${c.w} → chọn nghĩa`, mean: c => `${c.w} → tự nhớ nghĩa`, form: c => `${c.vi} → ${c.f.replace(/[{}]/g, '')}`, ctx: c => cPlain(c) };
  const right = { rec: c => c.vi, mean: c => c.vi, form: c => fTarget(c), ctx: c => cParts(c).alts[0] };
  const items = [];
  VROUNDS.forEach((R, i) => VS.res[R.id].wrong.forEach(x => { const c = VL.cards[x.j];
    items.push({ sec: String(i + 1), n: c.w, q: q[R.id](c), ans: x.ans, correct: right[R.id](c), ok: false }); }));
  const hard = VL.cards.filter((c, j) => VROUNDS.filter(R => VS.res[R.id].wrong.some(x => x.j === j)).length >= 2).map(c => c.w);
  return { app: 'btvn', unit: 'PET', title: `PET Vocab ${VL.code} ${VL.title} – Week ${WEEK_NO}`, name: VS.name || me.name || '', cls: VS.cls || me.cls || '',
    sid: VS.sid, redo: 0, attempt: 1, canRetry: false,
    startedAt: VS.startedAt, submittedAt: VS.r1.at, timeTakenSec: secsBetween(VS.startedAt, VS.r1.at), leaves: VS.r1.leaves,
    score: VS.r1.score, total: VS.r1.total, sections, items,
    extras: [{ label: 'Chép từ mới vào vở', text: VS.noted ? 'Học sinh đã bấm xác nhận đã chép ' + VL.cards.length + ' từ mới vào vở.' : 'Chưa xác nhận.' },
      { label: 'Từ sai từ 2 vòng trở lên (nên ôn lại)', text: hard.join(', ') || 'Không có' },
      { label: 'Ghi chú', text: 'Mỗi vòng ' + VL.cards.length + ' từ. Bảng chỉ liệt kê các từ sai ở lần trả lời đầu (sau đó em được làm lại cuối vòng). Vòng 2 là học sinh tự đánh giá nhớ nghĩa.' }],
    audios: [], wantsAudio: false, audio: null };
}
async function vsend(){
  if (vsending || !VS.r1 || VS.sent1) return;
  vsending = true; vstate = 'sending'; verr = ''; vstatus();
  try { await post(vpayload()); VS.sent1 = true; vsave(); vstate = 'ok'; }
  catch (err){ vstate = 'err'; verr = err && err.message ? err.message : String(err); }
  vsending = false; vstatus();
}

/* ---------- Đếm số lần rời trang (khi đang học / chơi) ---------- */
let vaway = false;
function vtrack(){
  const on = () => VS && VS.phase !== 'done' && !(VG && VG.practice);
  const go = () => { if (vaway || !on()) return; vaway = true; VS.leaves = (VS.leaves || 0) + 1; vsave(); };
  const back = () => {
    if (document.hidden || !document.hasFocus()) return;
    const was = vaway; vaway = false;
    if (was && on() && VS.leaves > 5) toast(`🕵️ ${tease('away')} <small>(left the page ${VS.leaves} times)</small>`);
  };
  document.addEventListener('visibilitychange', () => document.hidden ? go() : back());
  window.addEventListener('blur', go); window.addEventListener('focus', back);
}
