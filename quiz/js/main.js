/* ============================================================
   main.js  画面遷移の制御
   ------------------------------------------------------------
   [1] レベル選択 → [2] ニックネーム登録（2回目以降はスキップ）
     → [3] 出題（10問） → [4] 結果（ここで1回だけGASへ送信） → [5] ランキング

   1つの関数が「画面遷移」「採点」「通信」を兼ねないように分けてある。
   採点は Quiz.grade、通信は Api、保存は Storage が担当する。
   ============================================================ */
(function () {

  const $ = function (id) { return document.getElementById(id); };

  const state = {
    level: null,      // 'low' | 'high'
    profile: null,    // { nickname, grade }
    session: null,    // Quiz.buildSession の戻り
    qStart: 0,        // 今の問題を表示した時刻（回答時間の計測用）
    d: null,          // 今の問題のダイヤモンド（Diamond.render の戻り）
    answered: false,
    hintUsed: false
  };

  /* ---------- 共通 ---------- */

  function show(id) {
    Array.prototype.forEach.call(document.querySelectorAll('.screen'), function (s) {
      s.hidden = (s.id !== id);
    });
    window.scrollTo(0, 0);
  }

  function updateHeader() {
    const p = state.profile;
    if (!p) { $('hdrSub').textContent = 'やきゅうの ルールを おぼえよう'; return; }
    const lv = state.level ? '・' + CONFIG.LEVELS[state.level].label : '';
    $('hdrSub').textContent = p.nickname + '（' + p.grade + 'ねんせい）' + lv;
  }

  function isModeC(q) {
    return q.mode === 'C' && CONFIG.LEVELS[state.session.level].allowModeC;
  }

  /* ---------- [1] レベル選択 ---------- */

  function initLevelScreen() {
    $('btnLow').textContent = CONFIG.LEVELS.low.label;
    $('btnHigh').textContent = CONFIG.LEVELS.high.label;
    $('btnLow').onclick = function () { chooseLevel('low'); };
    $('btnHigh').onclick = function () { chooseLevel('high'); };
    $('changeName').onclick = function () { show('scr-name'); };
    refreshLevelScreen();
  }

  function refreshLevelScreen() {
    const p = state.profile;
    $('changeName').hidden = !p;
    $('levelNote').textContent = p ? (p.nickname + ' として あそぶよ') : '';
  }

  function chooseLevel(level) {
    state.level = level;
    updateHeader();
    if (state.profile) startQuiz();
    else show('scr-name');
  }

  /* ---------- [2] ニックネーム登録 ---------- */

  function initNameScreen() {
    const sel = $('grade');
    sel.innerHTML = '<option value="">えらんでね</option>';
    for (let g = 1; g <= 6; g++) {
      const o = document.createElement('option');
      o.value = String(g);
      o.textContent = g + 'ねんせい';
      sel.appendChild(o);
    }
    if (state.profile) {
      $('nickname').value = state.profile.nickname;
      sel.value = String(state.profile.grade);
    }
    $('btnSaveName').onclick = saveName;
  }

  function saveName() {
    const name = $('nickname').value.trim();
    const grade = parseInt($('grade').value, 10);
    let ok = true;
    // 未入力のまま進ませない。入力欄の下に赤字で出す
    if (!name) { $('errName').textContent = 'ニックネームを いれてね'; $('errName').hidden = false; ok = false; }
    else { $('errName').hidden = true; }
    if (!grade) { $('errGrade').textContent = 'がくねんを えらんでね'; $('errGrade').hidden = false; ok = false; }
    else { $('errGrade').hidden = true; }
    if (!ok) return;

    state.profile = { nickname: name, grade: grade };
    Storage.setProfile(state.profile);
    updateHeader();
    refreshLevelScreen();
    if (state.level) startQuiz();
    else show('scr-level');
  }

  /* ---------- [3] 出題 ---------- */

  function startQuiz() {
    state.session = Quiz.buildSession(state.level);
    show('scr-quiz');
    renderQuestion();
  }

  function renderQuestion() {
    const s = state.session, i = s.index, q = s.questions[i], lv = s.level;
    state.answered = false;
    state.hintUsed = false;
    state.qStart = Date.now();
    state.d = null;

    $('progress').innerHTML = '<b>' + (i + 1) + '</b> / ' + s.questions.length;

    // 図（テンプレート問題だけ）
    const modeC = isModeC(q);
    if (q.diagram) {
      $('diagramWrap').hidden = false;
      const opts = Object.assign({}, q.diagram, {
        bso: q.situation ? q.situation.bso : null,
        animate: modeC,
        lockUntilPlayed: modeC,
        onLockedTap: showLockMsg,
        onTap: function (key) { answer(key); },
        onPlayEnd: function () { $('lockmsg').textContent = ''; }
      });
      if (q.answerType === 'tapBase') opts.tappable = q.tappable || ['1B', '2B', '3B', 'H'];
      state.d = Diamond.render($('diagram'), opts);
    } else {
      $('diagramWrap').hidden = true;
      $('diagram').innerHTML = '';
    }

    // 再生ボタン（Cモードだけ）
    $('playrow').hidden = !modeC;
    $('btnPlay').textContent = 'さいせい';
    $('lockmsg').textContent = '';

    // 問題文と選択肢
    $('question').textContent = q.question[lv];
    renderChoices(q, lv);

    // ヒント（低学年だけ、各問1回）
    const hasHint = CONFIG.LEVELS[lv].hint && q.hint && q.hint.low;
    $('hintrow').hidden = !hasHint;
    $('hinttext').textContent = '';
    $('btnHint').disabled = false;

    $('answerBox').innerHTML = '';
    $('btnNext').hidden = true;
  }

  function renderChoices(q, lv) {
    const box = $('choices');
    box.innerHTML = '';
    if (q.answerType === 'tapBase') {
      const p = document.createElement('p');
      p.className = 'tapguide';
      p.textContent = 'ずの ベースを タップして こたえてね';
      box.appendChild(p);
      return;
    }
    q.choices.forEach(function (c) {
      const b = document.createElement('button');
      b.className = 'choice';
      b.dataset.id = c.id;
      b.textContent = c.label[lv];
      b.onclick = function () { answer(c.id); };
      box.appendChild(b);
    });
  }

  function showLockMsg() {
    $('lockmsg').textContent = 'さきに さいせいを おしてね';
  }

  function answer(id) {
    if (state.answered) return;
    const s = state.session, q = s.questions[s.index], lv = s.level;
    // Cモードは「再生 → 停止 → 停止した図で回答」。再生前は受け付けない
    if (isModeC(q) && state.d && !state.d.isPlayed()) { showLockMsg(); return; }
    state.answered = true;

    const elapsed = Date.now() - state.qStart;
    const res = Quiz.grade(s, s.index, id, elapsed);

    // 選択肢の色付け
    Array.prototype.forEach.call(document.querySelectorAll('.choice'), function (b) {
      b.disabled = true;
      if (b.dataset.id === q.correctId) b.classList.add('correct');
      else if (b.dataset.id === id) b.classList.add('wrong');
    });
    // 図の塁に印
    let head = res.ok ? 'せいかい！' : 'ざんねん';
    if (q.answerType === 'tapBase' && state.d) {
      state.d.mark(q.correctId, true);
      if (!res.ok) state.d.mark(id, false);
      head += '（こたえ：' + CONFIG.FIELD.BASES[q.correctId].name + '）';
      state.d.setLocked(true);
    }
    $('answerBox').innerHTML =
      '<div class="result ' + (res.ok ? 'ok' : 'ng') + '"><b>' + head + '</b>' + q.explain[lv] + '</div>';

    const last = s.index >= s.questions.length - 1;
    $('btnNext').textContent = last ? 'けっかを みる' : 'つぎへ';
    $('btnNext').hidden = false;
  }

  function next() {
    const s = state.session;
    s.index += 1;
    if (s.index >= s.questions.length) showResult();
    else renderQuestion();
  }

  function initQuizScreen() {
    $('btnPlay').onclick = function () {
      if (!state.d) return;
      state.d.play();
      $('btnPlay').textContent = 'もういちど';
    };
    $('btnHint').onclick = function () {
      if (state.hintUsed) return;
      state.hintUsed = true;
      $('btnHint').disabled = true;
      $('hinttext').textContent = state.session.questions[state.session.index].hint.low;
    };
    $('btnNext').onclick = next;
  }

  /* ---------- [4] 結果 ---------- */

  function showResult() {
    const s = state.session;
    const correct = Quiz.correctCount(s);
    const stats = Storage.addSession(s.level, correct);
    const cr = Storage.clearRate(s.level);

    $('score').innerHTML = correct + ' <small>/ ' + s.questions.length + '</small>';
    $('stTotal').textContent = stats.totalCorrect;
    $('stPlays').textContent = stats.playCount;
    $('stClear').textContent = Math.round(cr.rate * 100) + '%';
    $('stBest').textContent = stats.best;
    $('sendmsg').textContent = '';
    show('scr-result');
    sendResults(correct, cr.cleared);
  }

  // GAS へは結果画面で1回だけ送る。失敗しても小さく出すだけでプレーは完了させる
  function sendResults(correct, clearedCount) {
    const s = state.session, p = state.profile;
    if (!Api.enabled()) {
      $('sendmsg').textContent = '（きろくの おくりさきが せっていされていません）';
      return;
    }
    const year = Quiz.fiscalYear();
    const common = { session_id: s.id, nickname: p.nickname, grade: p.grade, year: year, level: s.level };
    const payload = {
      type: 'session',
      session: Object.assign({}, common, {
        correct_count: correct,
        total_count: s.questions.length,
        duration_ms: Date.now() - s.startedAt,
        cleared_count: clearedCount || 0     // 制覇した状況の数（ランキングの cleared_count に使う）
      }),
      answers: s.answers.map(function (a) { return Object.assign({}, common, a); })
    };
    $('sendmsg').textContent = 'きろくしています…';
    Api.sendSession(payload).then(function (r) {
      $('sendmsg').textContent = r.ok ? 'きろくしました' : 'きろくできませんでした';
    });
  }

  function initResultScreen() {
    $('btnAgain').onclick = startQuiz;
    $('btnRank').onclick = showRanking;
    $('btnLevel').onclick = function () { refreshLevelScreen(); show('scr-level'); };
  }

  /* ---------- [5] ランキング ---------- */

  function showRanking() {
    show('scr-rank');
    renderRankTable('low', null, Api.enabled() ? 'よみこみちゅう…' : 'ランキングの おくりさきが せっていされていません');
    renderRankTable('high', null, Api.enabled() ? 'よみこみちゅう…' : 'ランキングの おくりさきが せっていされていません');
    if (!Api.enabled()) return;
    ['low', 'high'].forEach(function (level) {
      Api.getRanking(level).then(function (r) {
        if (!r.ok) { renderRankTable(level, null, 'よみこめませんでした'); return; }
        renderRankTable(level, r.rows, r.rows.length ? '' : 'まだ きろくが ありません');
      });
    });
  }

  function renderRankTable(level, rows, msg) {
    const box = $(level === 'low' ? 'rankLow' : 'rankHigh');
    if (!rows || !rows.length) {
      box.innerHTML = '<p class="rankmsg">' + (msg || '') + '</p>';
      return;
    }
    // 累計正解数の降順。副指標としてプレイ回数を併記
    rows = rows.slice().sort(function (a, b) {
      return (b.total_correct - a.total_correct) || (a.play_count - b.play_count);
    });
    const me = state.profile ? state.profile.nickname : null;
    let html = '<table class="rank"><tr><th>じゅんい</th><th>なまえ</th><th>せいかい</th><th>かいすう</th></tr>';
    rows.forEach(function (r, i) {
      html += '<tr class="' + (r.nickname === me ? 'me' : '') + '">' +
        '<td class="num">' + (i + 1) + '</td>' +
        '<td>' + escapeHtml(r.nickname) + '</td>' +
        '<td class="num">' + r.total_correct + '</td>' +
        '<td class="num">' + r.play_count + '</td></tr>';
    });
    box.innerHTML = html + '</table>';
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function initRankScreen() {
    $('btnRankBack').onclick = function () {
      show(state.session ? 'scr-result' : 'scr-level');
    };
  }

  /* ---------- 起動 ---------- */

  function init() {
    state.profile = Storage.getProfile();
    initLevelScreen();
    initNameScreen();
    initQuizScreen();
    initResultScreen();
    initRankScreen();
    updateHeader();
    show('scr-level');
  }

  init();
})();
