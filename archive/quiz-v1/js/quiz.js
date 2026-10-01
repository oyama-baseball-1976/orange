/* ============================================================
   quiz.js  出題ロジック・採点
   ------------------------------------------------------------
   このファイルは3つの部分からなる。
     1. QuizUtil        … ランダム関数などの小道具（テンプレートからも使う）
     2. QuizTemplates   … テンプレートの登録先。各テンプレートファイルが register() する
     3. Quiz            … 1セッション分の問題選び・採点（後の段階で実装）

   読み込み順：config → diamond → quiz → templates/* → fixed-questions → storage → api → main
   テンプレートより先に読み込むこと（register の受け皿が必要なため）。
   ============================================================ */

/* ---------- 1. 小道具 ---------- */
const QuizUtil = {
  // 0 以上 n 未満の整数
  randInt: function (n) { return Math.floor(Math.random() * n); },

  // 配列から1つ選ぶ
  pick: function (arr) { return arr[Math.floor(Math.random() * arr.length)]; },

  // 配列をシャッフルした新しい配列を返す（元は変えない）
  shuffle: function (arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  },

  // ランダムなカウント（B 0〜3、S 0〜2）。問題の本筋に関係ないときの「にぎやかし」用
  randomCount: function () {
    return { b: Math.floor(Math.random() * 4), s: Math.floor(Math.random() * 3) };
  },

  // テンプレートから状況を生成する。直前と同じ状況（variantKey）が続かないように数回引き直す
  generateFresh: function (template, level, prevKey) {
    let q = template.generate(level);
    for (let i = 0; i < 8 && prevKey && q.variantKey === prevKey; i++) {
      q = template.generate(level);
    }
    return q;
  }
};

/* ---------- 2. テンプレートの登録先 ---------- */
/*
   各テンプレートは次の形のオブジェクトを register() する。

   {
     id: 'force-or-tag',                 // 一意なID（記録の item_id になる）
     category: 'out',                    // CONFIG.CATEGORIES のキー
     name: 'フォースかタッチか',
     supportedLevels: ['low', 'high'],
     mode: { low: 'C', high: 'B' },      // 出題形式（A/B/C）
     generate(level) {
       return {
         variantKey: 'r12-t2',           // 状況の種類。制覇率と「同じ状況の連続回避」に使う
         situation: {...},               // 生成した状況（記録用。JSONにして保存する）
         diagram: {...},                 // Diamond.render に渡すオプション（bso/animate は出題側が足す）
         answerType: 'choice',           // 'choice'（ボタン） or 'tapBase'（図の塁をタップ）
         question: { low: '...', high: '...' },
         choices: [ { id:'base', label:{ low:'...', high:'...' } }, ... ],  // choice のとき
         correctId: 'base',
         explain: { low: '...', high: '...' },
         hint: { low: '...' }
       };
     }
   }
*/
const QuizTemplates = {
  list: [],
  register: function (t) { this.list.push(t); },
  get: function (id) { return this.list.filter(function (t) { return t.id === id; })[0] || null; },
  forLevel: function (level) {
    return this.list.filter(function (t) { return t.supportedLevels.indexOf(level) >= 0; });
  }
};

/* ---------- 3. セッション（1回10問の選び方と採点） ---------- */
/*
   選び方（完全ランダムにしない。偏ると学習効果が落ちる）
     1. カテゴリごとに最低 MIN_PER_CATEGORY 問を確保する（カテゴリ数×最低数 ≤ 出題数のとき）
     2. 残りは重み付き抽選。直近で間違えた項目は WRONG_BOOST 倍、未出題は UNSEEN_WEIGHT、
        テンプレートは固定問題より TEMPLATE_WEIGHT 倍出やすい
     3. 同じテンプレートは1セッション MAX_PER_TEMPLATE 問まで。固定問題は1問1回
     4. 出題順はシャッフル
     5. テンプレートの状況は出題のたびに新規生成（同じテンプレの直前と同じ状況は避ける）
*/
const Quiz = (function () {

  // 固定問題をテンプレートの出力と同じ形にそろえる
  function normalizeFixed(f) {
    return {
      variantKey: f.id, situation: null, diagram: null, answerType: 'choice', mode: f.mode || 'A',
      question: f.question, choices: f.choices, correctId: f.correctId,
      explain: f.explain, hint: f.hint || null
    };
  }

  // 出題候補（テンプレート＋固定問題）をレベルで絞る
  function poolFor(level) {
    const items = [];
    QuizTemplates.forLevel(level).forEach(function (t) {
      items.push({ type: 'template', id: t.id, category: t.category, template: t });
    });
    FIXED_QUESTIONS.filter(function (f) { return f.levels.indexOf(level) >= 0; }).forEach(function (f) {
      items.push({ type: 'fixed', id: f.id, category: f.category, fixed: f });
    });
    return items;
  }

  // 抽選の重み
  function weightOf(item, history) {
    const h = history[item.id];
    let w;
    if (!h || h.length === 0) w = CONFIG.QUIZ.UNSEEN_WEIGHT;
    else w = (h[h.length - 1] === 0) ? CONFIG.QUIZ.WRONG_BOOST : 1;
    if (item.type === 'template') w *= CONFIG.QUIZ.TEMPLATE_WEIGHT;
    return w;
  }

  function weightedPick(items, history) {
    let total = 0;
    items.forEach(function (i) { total += weightOf(i, history); });
    let r = Math.random() * total;
    for (let i = 0; i < items.length; i++) {
      r -= weightOf(items[i], history);
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  }

  // 1セッション分の項目を選ぶ
  function chooseItems(level) {
    const N = CONFIG.QUIZ.QUESTIONS_PER_SESSION;
    const pool = poolFor(level);
    const history = Storage.getHistory();
    const chosen = [];
    const templateCount = {};
    const usedFixed = {};

    function canUse(item) {
      if (item.type === 'fixed') return !usedFixed[item.id];
      return (templateCount[item.id] || 0) < CONFIG.QUIZ.MAX_PER_TEMPLATE;
    }
    function take(item) {
      chosen.push(item);
      if (item.type === 'fixed') usedFixed[item.id] = true;
      else templateCount[item.id] = (templateCount[item.id] || 0) + 1;
    }

    // 1. カテゴリごとに最低数を確保
    const cats = [];
    pool.forEach(function (i) { if (cats.indexOf(i.category) < 0) cats.push(i.category); });
    if (cats.length * CONFIG.QUIZ.MIN_PER_CATEGORY <= N) {
      QuizUtil.shuffle(cats).forEach(function (cat) {
        for (let k = 0; k < CONFIG.QUIZ.MIN_PER_CATEGORY; k++) {
          const cand = pool.filter(function (i) { return i.category === cat && canUse(i); });
          if (cand.length) take(weightedPick(cand, history));
        }
      });
    }
    // 2. テンプレート問題（図つき）が少なすぎる回をなくす。最低 MIN_TEMPLATES 問まで足す
    let guard = 0;
    function templateCountTotal() {
      return chosen.filter(function (i) { return i.type === 'template'; }).length;
    }
    while (chosen.length < N && templateCountTotal() < CONFIG.QUIZ.MIN_TEMPLATES && guard++ < 100) {
      const cand = pool.filter(function (i) { return i.type === 'template' && canUse(i); });
      if (!cand.length) break;
      take(weightedPick(cand, history));
    }
    // 3. 残りを重み付きで
    guard = 0;
    while (chosen.length < N && guard++ < 500) {
      const cand = pool.filter(canUse);
      if (!cand.length) break;
      take(weightedPick(cand, history));
    }
    // 4. 出題順をシャッフル
    return QuizUtil.shuffle(chosen);
  }

  // 項目 → 実際の1問。テンプレートは状況をその場で生成する
  function materialize(items, level) {
    const lastKey = {};
    return items.map(function (item) {
      if (item.type === 'fixed') return normalizeFixed(item.fixed);
      const q = QuizUtil.generateFresh(item.template, level, lastKey[item.id] || null);
      lastKey[item.id] = q.variantKey;
      q.mode = item.template.mode[level];
      return q;
    });
  }

  function buildSession(level) {
    const items = chooseItems(level);
    return {
      id: Storage.newSessionId(),
      level: level,
      items: items,
      questions: materialize(items, level),
      index: 0,
      answers: [],
      startedAt: Date.now()
    };
  }

  // 採点して記録する（localStorage への反映もここで行う）
  function grade(session, i, answerId, elapsedMs) {
    const item = session.items[i], q = session.questions[i];
    const ok = answerId === q.correctId;
    const record = {
      item_type: item.type,
      item_id: item.id,
      situation: q.situation ? JSON.stringify(q.situation) : '',
      answer_id: answerId,
      is_correct: ok,
      elapsed_ms: elapsedMs,
      is_fast: elapsedMs < CONFIG.QUIZ.FAST_ANSWER_MS
    };
    session.answers[i] = record;
    Storage.recordResult(item.id, ok);
    const seenKey = item.type === 'template' ? item.id + ':' + q.variantKey : item.id;
    Storage.markSeen(session.level, seenKey, ok);
    return { ok: ok, record: record };
  }

  function correctCount(session) {
    return session.answers.filter(function (a) { return a && a.is_correct; }).length;
  }

  // 年度（CONFIG.YEAR_START_MONTH 始まり）
  function fiscalYear(d) {
    d = d || new Date();
    const y = d.getFullYear();
    return (d.getMonth() + 1) >= CONFIG.YEAR_START_MONTH ? y : y - 1;
  }

  return {
    buildSession: buildSession, grade: grade, correctCount: correctCount,
    fiscalYear: fiscalYear, normalizeFixed: normalizeFixed, poolFor: poolFor
  };
})();
