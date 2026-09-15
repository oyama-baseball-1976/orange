/* ============================================================
   storage.js  localStorage の読み書き
   ------------------------------------------------------------
   キーはすべて CONFIG.STORAGE.PREFIX（orange_quiz_）で始める。
   保存するもの：
     profile … ニックネーム・学年
     history … 項目（テンプレートID／固定問題ID）ごとの正誤履歴（直近数回）
     stats   … レベルごとの累計正解数・プレイ回数・自己ベスト
     seen    … レベルごとに「出会った状況の種類」と「正解できたか」（制覇率の計算用）
   ============================================================ */

const Storage = (function () {

  const K = CONFIG.STORAGE.KEYS;

  function key(k) { return CONFIG.STORAGE.PREFIX + k; }

  function read(k, def) {
    try {
      const v = localStorage.getItem(key(k));
      return v ? JSON.parse(v) : def;
    } catch (e) { return def; }
  }

  function write(k, v) {
    try { localStorage.setItem(key(k), JSON.stringify(v)); } catch (e) { /* 保存できなくてもプレーは続ける */ }
  }

  function emptyStats() { return { totalCorrect: 0, playCount: 0, best: 0 }; }

  return {
    /* ---------- プロフィール ---------- */
    getProfile: function () { return read(K.PROFILE, null); },
    setProfile: function (p) { write(K.PROFILE, p); },

    /* ---------- 正誤履歴（出題の重み付けに使う） ---------- */
    getHistory: function () { return read(K.HISTORY, {}); },
    recordResult: function (itemId, ok) {
      const h = read(K.HISTORY, {});
      const arr = (h[itemId] || []).concat(ok ? 1 : 0);
      h[itemId] = arr.slice(-CONFIG.QUIZ.RECENT_HISTORY_KEEP);
      write(K.HISTORY, h);
    },

    /* ---------- 累計（レベルごと） ---------- */
    getStats: function (level) {
      const s = read(K.STATS, {});
      return s[level] || emptyStats();
    },
    addSession: function (level, correct) {
      const s = read(K.STATS, {});
      const cur = s[level] || emptyStats();
      cur.totalCorrect += correct;
      cur.playCount += 1;
      cur.best = Math.max(cur.best, correct);
      s[level] = cur;
      write(K.STATS, s);
      return cur;
    },

    /* ---------- 制覇状況（レベルごと） ---------- */
    // itemKey はテンプレートなら「テンプレートID:状況の種類」、固定問題なら問題ID
    markSeen: function (level, itemKey, ok) {
      const all = read(K.SEEN, {});
      const s = all[level] || {};
      const e = s[itemKey] || { n: 0, cleared: false };
      e.n += 1;
      if (ok) e.cleared = true;
      s[itemKey] = e;
      all[level] = s;
      write(K.SEEN, all);
    },
    // 出会った種類のうち、正解できた割合
    clearRate: function (level) {
      const s = (read(K.SEEN, {}))[level] || {};
      const keys = Object.keys(s);
      let cleared = 0;
      keys.forEach(function (k) { if (s[k].cleared) cleared++; });
      return { seen: keys.length, cleared: cleared, rate: keys.length ? cleared / keys.length : 0 };
    },

    /* ---------- セッションID ---------- */
    newSessionId: function () {
      return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    }
  };
})();
