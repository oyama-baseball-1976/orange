/* ============================================================
   api.js  GAS との通信
   ------------------------------------------------------------
   ・起動時や1問ごとには通信しない。結果画面で1回だけ送る。
   ・GitHub Pages から GAS へ POST するときは Content-Type を
     text/plain;charset=utf-8 にする（application/json だとプリフライトで失敗する）。
     GAS 側は JSON.parse(e.postData.contents) で受ける。
   ・CONFIG.GAS_URL が空なら何もしない（出題〜結果表示は GAS なしで動く）。
   ============================================================ */

const Api = {

  enabled: function () {
    return !!(CONFIG.GAS_URL && CONFIG.GAS_URL.length > 0);
  },

  // セッション結果（回答10件＋セッション情報）をまとめて1回で送る
  sendSession: function (payload) {
    if (!this.enabled()) return Promise.resolve({ ok: false, skipped: true });
    return fetch(CONFIG.GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    })
      .then(function (r) { return r.json(); })
      .then(function (j) { return { ok: !!j.ok, data: j }; })
      .catch(function (e) { return { ok: false, error: String(e) }; });
  },

  // ランキング取得（level = 'low' | 'high'）
  getRanking: function (level) {
    if (!this.enabled()) return Promise.resolve({ ok: false, skipped: true, rows: [] });
    const sep = CONFIG.GAS_URL.indexOf('?') >= 0 ? '&' : '?';
    const url = CONFIG.GAS_URL + sep + 'action=ranking&level=' + encodeURIComponent(level);
    return fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (j) { return { ok: !!j.ok, rows: j.rows || [] }; })
      .catch(function (e) { return { ok: false, error: String(e), rows: [] }; });
  }
};
