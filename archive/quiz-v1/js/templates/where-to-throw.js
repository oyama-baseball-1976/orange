/* ============================================================
   templates/where-to-throw.js  どこへ投げるか
   ------------------------------------------------------------
   内野ゴロを捕った野手が、どの塁へ投げるべきかを問う。図の塁をタップして答える。

   判定の根拠（野球規則の考え方）
   ・「確実にアウトが取れる塁」を正解とする。
   ・フォース（塁を踏むだけでアウト）が成立している塁なら、タッチが要らないので確実。
     - バッターは必ずファーストへ走るので、ファーストは常にフォース。
     - ファーストにランナーがいれば、そのランナーはセカンドへ進むしかない → セカンドもフォース。
     - ファースト・セカンドにいれば → サードもフォース。満塁なら → ホームもフォース。
   ・フォースが成立している塁のうち「一番進んだ塁」を正解にする。
     先の塁でアウトにするほど相手の得点に近いランナーを消せるから。
   ・フォースが成立する塁がなければ、バッターをアウトにするファースト。

   注意：この問題は唯一解ではない場面がある（点差やイニングで選択は変わる）。
   解説には必ず「かくじつに アウトが とれる ところ」という判断基準を書き、
   「ほかの えらびかたも あるけど、まずは ここ」と添える。
   ============================================================ */
(function () {

  const NAME = { 1: 'ファースト', 2: 'セカンド', 3: 'サード', 4: 'ホーム' };
  const BASE_KEY = { 1: '1B', 2: '2B', 3: '3B', 4: 'H' };
  const RUNNER_SETS = [[], [1], [2], [3], [1, 2], [1, 3], [2, 3], [1, 2, 3]];
  const FIELDERS = ['ss', '2b', '3b', '1b', 'p'];

  // 塁 base のランナーがフォースかどうか（force-or-tag と同じ判定）
  function isForced(base, runners) {
    for (let b = 1; b < base; b++) {
      if (runners.indexOf(b) < 0) return false;
    }
    return true;
  }

  // フォースが成立している塁（番号）を列挙する。ファーストは常に含む
  function forceBases(runners) {
    const list = [1];
    runners.forEach(function (b) {
      if (isForced(b, runners)) list.push(b + 1);
    });
    return list;
  }

  // 正解＝一番進んだフォースの塁
  function bestBase(runners) {
    return Math.max.apply(null, forceBases(runners));
  }

  // 解説は固定文ではなく、その場の配置を根拠にして組み立てる
  function buildExplain(runners, best) {
    const tailLow = 'いちばん すすんだ フォースの ベースが「かくじつに アウトが とれる ところ」。ほかの えらびかたも あるけど、まずは ここ。';
    const tailHigh = '一番進んだフォースの塁が「確実にアウトが取れるところ」。ほかの選び方もあるが、まずはここ。';
    let low, high;
    if (best === 1) {
      if (runners.length === 0) {
        low = 'ランナーが いないので、なげる ところは ファーストだけ。バッターを アウトに する。';
        high = 'ランナーがいないので、投げるところはファーストだけ。バッターをアウトにする。';
      } else {
        low = 'ファーストが あいているので、いる ランナーは すすまなくて いい（フォースに ならない）。かくじつに アウトが とれるのは、バッターが はしってくる ファースト。';
        high = 'ファーストが空いているので、いるランナーは進まなくてよい（フォースにならない）。確実にアウトが取れるのは、バッターが走ってくるファースト。';
      }
    } else if (best === 2) {
      low = 'ファーストに ランナーが いるので、その ランナーは セカンドへ すすむしかない（フォース）。セカンドの ベースを ふむだけで アウト。';
      high = 'ファーストにランナーがいるので、そのランナーはセカンドへ進むしかない（フォース）。セカンドのベースを踏むだけでアウト。';
    } else if (best === 3) {
      low = 'ファーストと セカンドに ランナーが いるので、セカンドの ランナーは サードへ すすむしかない（フォース）。サードの ベースを ふむだけで アウト。';
      high = 'ファーストとセカンドにランナーがいるので、セカンドのランナーはサードへ進むしかない（フォース）。サードのベースを踏むだけでアウト。';
    } else {
      low = 'まんるいなので、サードの ランナーは ホームへ すすむしかない（フォース）。ホームベースを ふむだけで アウト。';
      high = '満塁なので、サードのランナーはホームへ進むしかない（フォース）。ホームベースを踏むだけでアウト。';
    }
    return { low: low + tailLow, high: high + tailHigh };
  }

  QuizTemplates.register({
    id: 'where-to-throw',
    category: 'defense',
    name: 'どこへ投げるか',
    supportedLevels: ['low', 'high'],
    mode: { low: 'B', high: 'B' },

    generate: function (level) {
      const maxRunners = CONFIG.LEVELS[level].maxRunners;
      const sets = RUNNER_SETS.filter(function (s) { return s.length <= maxRunners; });

      // 正解の塁が偏らないよう、先に「正解にする塁」を選び、それに合う配置を引く
      const answers = [];
      sets.forEach(function (s) { const b = bestBase(s); if (answers.indexOf(b) < 0) answers.push(b); });
      const wantBest = QuizUtil.pick(answers);
      const runners = QuizUtil.pick(sets.filter(function (s) { return bestBase(s) === wantBest; }));

      const best = bestBase(runners);
      const outs = QuizUtil.randInt(3);
      const count = QuizUtil.randomCount();
      const fielder = QuizUtil.pick(FIELDERS);
      const fielderLabel = CONFIG.FIELD.POSITIONS[fielder].label;

      return {
        variantKey: 'r' + runners.join(''),
        situation: {
          runners: runners, outs: outs, bso: { b: count.b, s: count.s, o: outs },
          ball: fielder, forceBases: forceBases(runners), best: best
        },
        diagram: {
          runners: runners, batter: true,
          ball: { kind: 'grounder', to: fielder },
          labelMode: 'bases'
        },
        answerType: 'tapBase',
        tappable: ['1B', '2B', '3B', 'H'],
        question: {
          low: fielderLabel + 'が ゴロを とった。どこに なげる？ ずの ベースを タップ！',
          high: fielderLabel + 'がゴロを捕った。どこへ投げる？ 図のベースをタップ。'
        },
        choices: [
          { id: '1B', label: { low: 'ファースト', high: 'ファースト' } },
          { id: '2B', label: { low: 'セカンド',   high: 'セカンド' } },
          { id: '3B', label: { low: 'サード',     high: 'サード' } },
          { id: 'H',  label: { low: 'ホーム',     high: 'ホーム' } }
        ],
        correctId: BASE_KEY[best],
        explain: buildExplain(runners, best),
        hint: {
          low: 'ランナーが すすむしかない ベース（フォース）は どこかな？ その なかで いちばん ホームに ちかい ベースを えらぼう。'
        }
      };
    }
  });

})();
