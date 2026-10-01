/* ============================================================
   templates/force-or-tag.js  フォースかタッチか
   ------------------------------------------------------------
   内野ゴロのとき、白い輪で示したランナーをアウトにするには
   「ベースを踏む（フォースアウト）」か「タッチ」か、を問う。

   判定の根拠（野球規則の考え方）
   ・打者はゴロを打つと必ずファーストへ走る。だからファーストのランナーは
     セカンドへ「進まなければならない」。これがフォース（押し出し）の状態。
   ・ファーストのランナーがセカンドへ来るなら、セカンドのランナーはサードへ
     進まなければならない……と、下の塁がすべて埋まっている限り連鎖する。
   ・どこか1つでも空いている塁があると、そこで連鎖が切れる。その先のランナーには
     進む義務がないので、ベースを踏んでもアウトにならず、タッチが必要になる。
   ・つまり「塁 N のランナーがフォースになる ⇔ N より下の塁がすべて埋まっている」。
   ============================================================ */
(function () {

  const NAME = { 1: 'ファースト', 2: 'セカンド', 3: 'サード', 4: 'ホーム' };
  const RUNNER_SETS = [[1], [2], [3], [1, 2], [1, 3], [2, 3], [1, 2, 3]];
  const FIELDERS = ['ss', '2b', '3b', '1b'];   // 内野ゴロの行き先

  // 塁 base のランナーがフォースかどうか。base より下の塁がすべて埋まっていれば true
  function isForced(base, runners) {
    for (let b = 1; b < base; b++) {
      if (runners.indexOf(b) < 0) return false;
    }
    return true;
  }

  // 連鎖が切れる（空いている）いちばん低い塁。フォースのときは null
  function firstEmptyBelow(base, runners) {
    for (let b = 1; b < base; b++) {
      if (runners.indexOf(b) < 0) return b;
    }
    return null;
  }

  // 「ファーストと セカンド」のように、base より下の塁名をつなぐ
  function filledBelow(base, level) {
    const names = [];
    for (let b = 1; b < base; b++) names.push(NAME[b]);
    return names.join(level === 'low' ? 'と ' : 'と');
  }

  // 「セカンドの ベース」「ホームベース」
  function baseWord(n, level) {
    if (n === 4) return 'ホームベース';
    return NAME[n] + (level === 'low' ? 'の ベース' : 'のベース');
  }

  // 解説は固定文ではなく、その場の配置を根拠にして組み立てる
  function buildExplain(base, runners, forced) {
    const next = base + 1;
    if (forced) {
      if (base === 1) {
        return {
          low: 'バッターが ファーストに はしってくるので、この ランナーは セカンドへ すすむしかない。' +
               baseWord(2, 'low') + 'を ふむだけで アウト。',
          high: '打者がファーストへ走ってくるので、このランナーはセカンドへ進むしかない（フォース）。' +
                baseWord(2, 'high') + 'を踏むだけでアウトになる。'
        };
      }
      return {
        low: filledBelow(base, 'low') + 'が うまっているので、この ランナーは ' + NAME[next] + 'へ すすむしかない。' +
             baseWord(next, 'low') + 'を ふむだけで アウト。',
        high: filledBelow(base, 'high') + 'が埋まっているので、このランナーは' + NAME[next] + 'へ進むしかない（フォース）。' +
              baseWord(next, 'high') + 'を踏むだけでアウトになる。'
      };
    }
    const empty = NAME[firstEmptyBelow(base, runners)];
    return {
      low: empty + 'が あいているので、この ランナーは すすまなくても いい。ボールを もって タッチしないと アウトに ならない。',
      high: empty + 'が空いているので、このランナーは進まなくてもよい。ボールを持ってタッチしないとアウトにならない。'
    };
  }

  QuizTemplates.register({
    id: 'force-or-tag',
    category: 'out',
    name: 'フォースかタッチか',
    supportedLevels: ['low', 'high'],
    mode: { low: 'C', high: 'B' },

    generate: function (level) {
      const maxRunners = CONFIG.LEVELS[level].maxRunners;
      const sets = RUNNER_SETS.filter(function (s) { return s.length <= maxRunners; });
      const runners = QuizUtil.pick(sets);
      const outs = QuizUtil.randInt(3);
      const count = QuizUtil.randomCount();
      const fielder = QuizUtil.pick(FIELDERS);
      const target = QuizUtil.pick(runners);
      const forced = isForced(target, runners);
      const fielderLabel = CONFIG.FIELD.POSITIONS[fielder].label;

      // 選択肢は「サードに なげて ベースを ふむ」のように、プレーする塁（対象ランナーの次の塁）を含める。
      // 捕った野手がその塁を守る人（例：セカンドが捕ってセカンドを踏む）なら「そのまま」にする
      const next = target + 1;
      const fielderBase = { '1b': 1, '2b': 2, '3b': 3 }[fielder] || null;
      const prefixLow = fielderBase === next ? 'そのまま ' : NAME[next] + 'に なげて ';
      const prefixHigh = fielderBase === next ? 'そのまま' : NAME[next] + 'に投げて';

      return {
        variantKey: 'r' + runners.join('') + '-t' + target,
        situation: {
          runners: runners, outs: outs, bso: { b: count.b, s: count.s, o: outs },
          target: target, ball: fielder, forced: forced
        },
        diagram: {
          runners: runners, batter: true, target: target,
          ball: { kind: 'grounder', to: fielder },
          labelMode: 'positions',
          // 再生で動かすランナー：バッターランナー（必ず走る）＋フォースで進むしかない全員＋対象ランナー。
          // 見ているだけで「誰が走らされるか」が分かるようにする。進む義務のないランナーはその場に残る
          advance: [0].concat(
            runners.filter(function (b) { return isForced(b, runners) || b === target; })
          )
        },
        answerType: 'choice',
        question: {
          low: fielderLabel + 'が ゴロを とった。しろい わの ランナー（' + NAME[target] + 'に いる）を アウトに するには？',
          high: fielderLabel + 'がゴロを捕った。白い輪のランナー（' + NAME[target] + 'にいる）をアウトにするには？'
        },
        choices: [
          { id: 'base', label: { low: prefixLow + 'ベースを ふむ', high: prefixHigh + 'ベースを踏む' } },
          { id: 'tag',  label: { low: prefixLow + 'タッチする',   high: prefixHigh + 'タッチする' } }
        ],
        correctId: forced ? 'base' : 'tag',
        explain: buildExplain(target, runners, forced),
        hint: {
          low: 'この ランナーより ホームに ちかい がわの ベースが、ぜんぶ うまっているかな？ ぜんぶ うまっていたら、ランナーは すすむしかない。'
        }
      };
    }
  });

})();
