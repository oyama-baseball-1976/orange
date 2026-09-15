/* ============================================================
   templates/tag-up.js  フライが上がったときの走者の動き（タッチアップ）
   ------------------------------------------------------------
   外野フライが上がった場面で、白い輪で示したランナーがどう動くべきかを問う。

   判定の根拠（野球規則の考え方）
   ・フライが捕られると、ランナーは「捕られる前にいた塁」に戻ってタッチ（触塁）し直さないと
     いけない。戻る前にその塁へ送球されるとアウト（アピールプレー）。
   ・だから2アウト未満のときは、まず塁に戻って捕球を待ち、捕った瞬間に次の塁へ走る
     （これがタッチアップ）。リードしたままだと、捕られたとき戻り切れずアウトになる。
   ・2アウトのときは、捕られた時点で3アウト＝チェンジ。戻る意味がないので、
     打った瞬間から全力で走る（落ちたときに少しでも先へ進むため）。
   ・つまり「2アウト未満 → ベースに戻って待つ」「2アウト → すぐ走る」。
     この対比が学習の要点なので、両方の状況が均等に出るようにする。
   ============================================================ */
(function () {

  const NAME = { 1: 'ファースト', 2: 'セカンド', 3: 'サード' };
  const RUNNER_SETS = [[1], [2], [3], [1, 2], [1, 3], [2, 3], [1, 2, 3]];   // 1人以上いる配置
  const OUTFIELD = ['lf', 'cf', 'rf'];
  const OUTS_WORD = {
    low:  { 0: 'ノーアウト', 1: 'ワンアウト', 2: 'ツーアウト' },
    high: { 0: 'ノーアウト', 1: '1アウト',   2: '2アウト' }
  };

  // 解説は固定文ではなく、その場のアウト数を根拠にして組み立てる
  function buildExplain(outs) {
    if (outs < 2) {
      return {
        low: 'まだ ' + OUTS_WORD.low[outs] + 'なので、とられたら もどらないと いけない。' +
             'リードしているなら まず ベースに もどる。とった しゅんかんから はしって いい（タッチアップ）。',
        high: 'まだ' + OUTS_WORD.high[outs] + 'なので、捕られたら戻らないといけない。' +
              'リードしているならまずベースに戻る。捕った瞬間から走ってよい（タッチアップ）。'
      };
    }
    return {
      low: 'ツーアウトだから、とられたら そこで こうたい。もどる いみが ないので ぜんりょくで はしる。',
      high: '2アウトだから、捕られたらそこでチェンジ。戻る意味がないので全力で走る。'
    };
  }

  QuizTemplates.register({
    id: 'tag-up',
    category: 'runner',
    name: 'タッチアップ',
    supportedLevels: ['low', 'high'],
    mode: { low: 'C', high: 'B' },

    generate: function (level) {
      const maxRunners = CONFIG.LEVELS[level].maxRunners;
      const sets = RUNNER_SETS.filter(function (s) { return s.length <= maxRunners; });
      const runners = QuizUtil.pick(sets);
      const target = QuizUtil.pick(runners);
      const fielder = QuizUtil.pick(OUTFIELD);
      const count = QuizUtil.randomCount();

      // 「2アウト未満」と「2アウト」が半々で出るように、先にどちらかを決める
      const outs = Math.random() < 0.5 ? 2 : QuizUtil.randInt(2);
      const fielderLabel = CONFIG.FIELD.POSITIONS[fielder].label;

      return {
        variantKey: 'r' + runners.join('') + '-t' + target + '-o' + outs,
        situation: {
          runners: runners, outs: outs, bso: { b: count.b, s: count.s, o: outs },
          target: target, ball: fielder, twoOuts: outs === 2
        },
        diagram: {
          runners: runners, batter: false, target: target,   // バッターは出さず、ランナーの判断に集中させる
          ball: { kind: 'fly', to: fielder },
          labelMode: 'positions',
          runnerAdvance: false
        },
        answerType: 'choice',
        question: {
          low: fielderLabel + 'に フライが あがった！ しろい わの ランナー（' + NAME[target] + 'に いる）は どう うごく？',
          high: fielderLabel + 'へフライが上がった。白い輪のランナー（' + NAME[target] + 'にいる）はどう動く？'
        },
        choices: [
          { id: 'go',    label: { low: 'すぐ はしる',           high: 'すぐ走る' } },
          { id: 'tagup', label: { low: 'ベースに もどって まつ', high: 'ベースに戻って待つ' } },
          { id: 'stay',  label: { low: 'うごかない',            high: '動かない' } }
        ],
        correctId: outs === 2 ? 'go' : 'tagup',
        explain: buildExplain(outs),
        hint: {
          low: 'アウトは いくつかな？ ツーアウトなら もどらなくて いい。それより すくなければ、とられたときの ために ベースに もどる。'
        }
      };
    }
  });

})();
