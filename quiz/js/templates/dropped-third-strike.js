/* ============================================================
   templates/dropped-third-strike.js  ふりにげができるか
   ------------------------------------------------------------
   第3ストライクをキャッチャーが捕れなかった場面で、
   バッターがファーストへ走ってよいか（振り逃げ）を問う。

   判定の根拠（野球規則の考え方）
   ・第3ストライクをキャッチャーが正規に捕球できなかったとき、バッターはまだアウトではなく
     ファーストへ走ることができる。これが振り逃げ。
   ・ただし「ファーストにランナーがいて、2アウト未満」のときは振り逃げできない。
     もし許すと、キャッチャーがわざと落として、ファーストのランナーとバッターの
     2人をまとめてフォースアウトにできてしまう（インフィールドフライと同じ発想の防止規則）。
   ・2アウトなら、その心配がない（1つアウトを取ればチェンジ）ので、ファーストに
     ランナーがいても走れる。
   ・つまり「振り逃げできる ⇔ ファーストが空いている、または 2アウト」。
   ============================================================ */
(function () {

  const RUNNER_SETS = [[], [1], [2], [3], [1, 2], [1, 3], [2, 3], [1, 2, 3]];

  // 振り逃げできるか。ファーストが空いている、または2アウトなら true
  function canRun(runners, outs) {
    return runners.indexOf(1) < 0 || outs === 2;
  }

  // 解説は固定文ではなく、その場の状況（ファーストの有無・アウト数）を根拠にして組み立てる
  function buildExplain(runners, outs, ok) {
    const firstEmpty = runners.indexOf(1) < 0;
    const tailLow = 'タッチされるか、ファーストに なげられる まえに つけば セーフ。';
    const tailHigh = 'タッチされるか、ファーストへ送球される前に着けばセーフ。';
    if (ok) {
      if (firstEmpty) {
        return {
          low: 'ファーストが あいているので、バッターは ファーストに はしれる。' +
               (outs === 2 ? 'ツーアウトなので、どちらにしても はしれる。' : '') + tailLow,
          high: 'ファーストが空いているので、バッターはファーストへ走れる。' +
                (outs === 2 ? '2アウトなので、どちらにしても走れる。' : '') + tailHigh
        };
      }
      return {
        low: 'ツーアウトなので、ファーストに ランナーが いても はしれる。' + tailLow,
        high: '2アウトなので、ファーストにランナーがいても走れる。' + tailHigh
      };
    }
    return {
      low: 'ファーストに ランナーが いて ツーアウトでは ないので、バッターは そのまま アウト。はしっては いけない。',
      high: 'ファーストにランナーがいて2アウトではないので、バッターはそのままアウト。走ってはいけない。'
    };
  }

  QuizTemplates.register({
    id: 'dropped-third-strike',
    category: 'batter',
    name: 'ふりにげができるか',
    supportedLevels: ['low', 'high'],
    mode: { low: 'C', high: 'B' },

    generate: function (level) {
      const maxRunners = CONFIG.LEVELS[level].maxRunners;
      const sets = RUNNER_SETS.filter(function (s) { return s.length <= maxRunners; });

      // 「できる」「できない」が半々で出るように、先に結果を決めてから状況を引く。
      // 偏ると「いつも はしる」で正解してしまい、学習にならない
      const wantOk = Math.random() < 0.5;
      let runners, outs;
      for (let i = 0; i < 30; i++) {
        runners = QuizUtil.pick(sets);
        outs = QuizUtil.randInt(3);
        if (canRun(runners, outs) === wantOk) break;
      }
      const ok = canRun(runners, outs);
      const balls = QuizUtil.randInt(4);

      return {
        variantKey: 'r' + runners.join('') + '-o' + outs,
        situation: {
          runners: runners, outs: outs, bso: { b: balls, s: 2, o: outs },
          firstOccupied: runners.indexOf(1) >= 0, canRun: ok
        },
        diagram: {
          runners: runners, batter: true, target: 0,           // バッターを強調
          ball: {
            kind: 'grounder', from: 'p',
            to: CONFIG.FIELD.PASSED_BALL_SPOT,                 // キャッチャーの後ろへ転がる
            style: CONFIG.BALL_STYLE.pitchOverride
          },
          fielder: 'c',                                        // キャッチャーを描く
          labelMode: 'bases',
          runnerAdvance: false
        },
        answerType: 'choice',
        question: {
          low: '3つめの ストライク！ でも キャッチャーが ボールを とれなかった。バッターは ファーストに はしって いい？',
          high: '3つ目のストライク。しかしキャッチャーがボールを捕れなかった。バッターはファーストへ走ってよい？'
        },
        choices: [
          { id: 'run',  label: { low: 'はしる',   high: '走る' } },
          { id: 'stay', label: { low: 'はしらない', high: '走らない' } }
        ],
        correctId: ok ? 'run' : 'stay',
        explain: buildExplain(runners, outs, ok),
        hint: {
          low: 'ファーストに ランナーが いるかな？ アウトは いくつかな？ 「ファーストが あいている」か「ツーアウト」なら はしれる。'
        }
      };
    }
  });

})();
