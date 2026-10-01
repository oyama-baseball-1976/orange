/* ============================================================
   fixed-questions.js  固定問題（状況に依存しない問題）
   ------------------------------------------------------------
   テンプレート化できない問題をここに配列で持つ。すべて形式A（文章＋選択肢）。

   1問の形：
   {
     id: 'f001',                 // 一意。記録の item_id になる
     category: 'count',          // CONFIG.CATEGORIES のキー
     levels: ['low', 'high'],    // 出すレベル
     mode: 'A',
     question: { low: '...', high: '...' },   // 低学年は かな中心・分かち書き
     choices: [ { id:'a', label:{ low:'...', high:'...' } }, ... ],
     correctId: 'a',
     explain: { low: '...', high: '...' },
     hint: { low: '...' }        // 省略可
   }

   追加するときは id を重複させないこと。低学年の文面は数字と小1配当以外の漢字を使わない。
   ============================================================ */

const FIXED_QUESTIONS = [

  /* ---------- カウント ---------- */
  {
    id: 'f001', category: 'count', levels: ['low', 'high'], mode: 'A',
    question: { low: 'フォアボールは ボールが いくつ？', high: 'フォアボールは、ボールがいくつで成立する？' },
    choices: [
      { id: 'a', label: { low: '3つ', high: '3つ' } },
      { id: 'b', label: { low: '4つ', high: '4つ' } },
      { id: 'c', label: { low: '5つ', high: '5つ' } }
    ],
    correctId: 'b',
    explain: { low: 'ボール 4つで ファーストに すすめる。', high: 'ボール4つでファーストへ進む（四球）。' },
    hint: { low: 'フォア＝4。' }
  },
  {
    id: 'f002', category: 'count', levels: ['low', 'high'], mode: 'A',
    question: { low: 'さんしんは ストライクが いくつ？', high: '三振はストライクがいくつ？' },
    choices: [
      { id: 'a', label: { low: '2つ', high: '2つ' } },
      { id: 'b', label: { low: '3つ', high: '3つ' } },
      { id: 'c', label: { low: '4つ', high: '4つ' } }
    ],
    correctId: 'b',
    explain: { low: 'ストライク 3つで バッターは アウト。', high: 'ストライク3つで打者はアウト。' },
    hint: { low: 'さん しん ＝ 3つ。' }
  },
  {
    id: 'f003', category: 'count', levels: ['low', 'high'], mode: 'A',
    question: { low: '2ストライクから ファールを うった。ストライクは どうなる？', high: '2ストライクからファールを打った。カウントはどうなる？' },
    choices: [
      { id: 'a', label: { low: 'ストライク 3つで アウト', high: 'ストライク3つでアウト' } },
      { id: 'b', label: { low: '2ストライクの まま', high: '2ストライクのまま' } },
      { id: 'c', label: { low: 'ボールが 1つ ふえる', high: 'ボールが1つ増える' } }
    ],
    correctId: 'b',
    explain: {
      low: '2ストライクからの ファールは カウントが かわらない。なんかい うっても アウトに ならない（バントは べつ）。',
      high: '2ストライクからのファールはカウントが変わらない。何回打ってもアウトにならない（バントは別）。'
    },
    hint: { low: 'ファールで さんしんに なるかな？' }
  },
  {
    id: 'f009', category: 'count', levels: ['low', 'high'], mode: 'A',
    question: {
      low: '2ストライクから、バットに かすった ボールを キャッチャーが そのまま とった（ファールチップ）。バッターは？',
      high: '2ストライクから、バットにかすった球を捕手が直接捕った（ファールチップ）。打者は？'
    },
    choices: [
      { id: 'a', label: { low: 'アウト（さんしん）', high: 'アウト（三振）' } },
      { id: 'b', label: { low: 'ファールで かわらない', high: 'ファールで変わらない' } },
      { id: 'c', label: { low: 'ボール', high: 'ボール' } }
    ],
    correctId: 'a',
    explain: {
      low: 'ファールチップは ストライク。2ストライクからだと さんしんで アウト。キャッチャーが おとしたら ただの ファール。',
      high: 'ファールチップはストライク扱い。2ストライクからなら三振でアウト。捕手が落とせばただのファール。'
    },
    hint: { low: 'キャッチャーが そのまま とった ところが ポイント。' }
  },
  {
    id: 'f021', category: 'count', levels: ['low', 'high'], mode: 'A',
    question: { low: 'カウントを いう とき、さきに いうのは？', high: 'カウントを言うとき、先に言うのは？' },
    choices: [
      { id: 'a', label: { low: 'ボール', high: 'ボール' } },
      { id: 'b', label: { low: 'ストライク', high: 'ストライク' } },
      { id: 'c', label: { low: 'アウト', high: 'アウト' } }
    ],
    correctId: 'a',
    explain: { low: '「2ボール 1ストライク」のように ボールが さき。', high: '「2ボール1ストライク」のようにボールが先。' }
  },

  /* ---------- バッターのルール ---------- */
  {
    id: 'f004', category: 'batter', levels: ['low', 'high'], mode: 'A',
    question: { low: '2ストライクから バントを して ファールに なった。バッターは？', high: '2ストライクからバントをしてファールになった。打者は？' },
    choices: [
      { id: 'a', label: { low: 'アウト', high: 'アウト' } },
      { id: 'b', label: { low: 'かわらない', high: '変わらない' } },
      { id: 'c', label: { low: 'もういちど バント', high: 'もう一度バント' } }
    ],
    correctId: 'a',
    explain: {
      low: '2ストライクからの バントの ファールは、スリーバントしっぱいで アウト。ふつうの ファールとは ちがう。',
      high: '2ストライクからのバントがファールになると、スリーバント失敗でアウト。通常のファールとは違う。'
    },
    hint: { low: 'ふつうの ファールとは ちがう ルールが ある。' }
  },
  {
    id: 'f008', category: 'batter', levels: ['low', 'high'], mode: 'A',
    question: { low: 'ワンバウンドした ボールが バッターに あたった。これは？', high: 'ワンバウンドした投球が打者に当たった。判定は？' },
    choices: [
      { id: 'a', label: { low: 'デッドボール（ファーストに すすむ）', high: 'デッドボール（ファーストへ進む）' } },
      { id: 'b', label: { low: 'ボール', high: 'ボール' } },
      { id: 'c', label: { low: 'ストライク', high: 'ストライク' } }
    ],
    correctId: 'a',
    explain: {
      low: 'バウンドしてから あたっても デッドボール。ふっていなければ ファーストに すすめる。',
      high: 'バウンドしてから当たっても死球。振っていなければファーストへ進める。'
    }
  },
  {
    id: 'f013', category: 'batter', levels: ['high'], mode: 'A',
    question: { low: 'うつ じゅんばんを まちがえて、べつの バッターが うった。まもりが しんぱんに いった。だれが アウト？', high: '打順を間違えて別の打者が打ち、守備側がアピールした。誰がアウト？' },
    choices: [
      { id: 'a', label: { low: 'ほんとうに うつはずだった バッター', high: '本来打つはずだった打者' } },
      { id: 'b', label: { low: 'じっさいに うった バッター', high: '実際に打った打者' } },
      { id: 'c', label: { low: 'だれも アウトに ならない', high: '誰もアウトにならない' } }
    ],
    correctId: 'a',
    explain: {
      low: 'じゅんばんを まちがえると、ほんとうの バッターが アウトに なる。うった ひとの きろくは けされる。',
      high: '打順間違いは、本来の打者がアウトになる。打った打者の記録は取り消される。'
    }
  },
  {
    id: 'f023', category: 'batter', levels: ['low', 'high'], mode: 'A',
    question: { low: 'フォアボールに なった。バッターは どこまで すすめる？', high: '四球になった。打者はどこまで進める？' },
    choices: [
      { id: 'a', label: { low: 'ファーストまで', high: 'ファーストまで' } },
      { id: 'b', label: { low: 'セカンドまで', high: 'セカンドまで' } },
      { id: 'c', label: { low: 'すすめない', high: '進めない' } }
    ],
    correctId: 'a',
    explain: {
      low: 'フォアボールは ファーストまで あんぜんに すすめる。かならず ファーストを ふむ。',
      high: '四球はファーストまで安全に進める。必ずファーストを踏むこと。'
    }
  },

  /* ---------- ランナーのルール ---------- */
  {
    id: 'f012', category: 'runner', levels: ['low', 'high'], mode: 'A',
    question: { low: 'バッターと ランナーは ヘルメットを かぶる？', high: '打者と走者はヘルメットをかぶる？' },
    choices: [
      { id: 'a', label: { low: 'かならず かぶる', high: '必ずかぶる' } },
      { id: 'b', label: { low: 'かぶらなくて いい', high: 'かぶらなくてよい' } },
      { id: 'c', label: { low: 'ピッチャーだけ かぶる', high: 'ピッチャーだけかぶる' } }
    ],
    correctId: 'a',
    explain: {
      low: 'バッター・ランナー・つぎの バッター・コーチャーは ヘルメットが ひつよう。あたまを まもるため。',
      high: '打者・走者・次打者・コーチャーはヘルメット着用が必要。頭を守るため。'
    }
  },
  {
    id: 'f014', category: 'runner', levels: ['high'], mode: 'A',
    question: { low: 'ボールを もっていない やしゅが、ランナーの はしる みちを ふさいだ。どうなる？', high: 'ボールを持っていない野手が走者の走路をふさいだ（走塁妨害）。どうなる？' },
    choices: [
      { id: 'a', label: { low: 'ランナーは つぎの ベースまで すすめる', high: '走者は妨害がなければ進めた塁まで進める' } },
      { id: 'b', label: { low: 'ランナーは アウト', high: '走者はアウト' } },
      { id: 'c', label: { low: 'やりなおし', high: 'やり直し' } }
    ],
    correctId: 'a',
    explain: {
      low: 'ボールを もたない やしゅは みちを ふさげない。ふさいだら ランナーは あんぜんに すすめる。',
      high: 'ボールを持たない野手は走路をふさげない。妨害があれば走者は安全に進塁できる。'
    }
  },
  {
    id: 'f015', category: 'runner', levels: ['high'], mode: 'A',
    question: { low: 'ゴロを とろうと している やしゅに ランナーが ぶつかった。どうなる？', high: '打球を処理しようとしている野手に走者がぶつかった（守備妨害）。どうなる？' },
    choices: [
      { id: 'a', label: { low: 'ランナーが アウト', high: '走者がアウト' } },
      { id: 'b', label: { low: 'やしゅが アウト', high: '野手がアウト' } },
      { id: 'c', label: { low: 'なにも おこらない', high: '何も起こらない' } }
    ],
    correctId: 'a',
    explain: {
      low: 'ゴロを とる やしゅが ゆうせん。ランナーは よけないと いけない。じゃまを したら アウト。',
      high: '打球を処理する野手が優先。走者はよけなければならず、妨害すればアウト。'
    }
  },
  {
    id: 'f016', category: 'runner', levels: ['low', 'high'], mode: 'A',
    question: {
      low: 'うった ボールが、やしゅが さわる まえに フェアゾーンで ランナーに あたった。ランナーは？',
      high: '打球が、野手が触れる前にフェアゾーンで走者に当たった。走者は？'
    },
    choices: [
      { id: 'a', label: { low: 'アウト', high: 'アウト' } },
      { id: 'b', label: { low: 'セーフ', high: 'セーフ' } },
      { id: 'c', label: { low: 'バッターが アウト', high: '打者がアウト' } }
    ],
    correctId: 'a',
    explain: {
      low: 'うった ボールに あたった ランナーは アウト。バッターは ファーストに すすめる。',
      high: '打球に当たった走者はアウト。打者はファーストへ進める。'
    },
    hint: { low: 'ボールに あたった ひとが どうなるか。' }
  },
  {
    id: 'f024', category: 'runner', levels: ['low', 'high'], mode: 'A',
    question: { low: 'まんるいで フォアボール。サードの ランナーは？', high: '満塁で四球。サードの走者は？' },
    choices: [
      { id: 'a', label: { low: 'ホームに すすんで 1てん', high: 'ホームへ進んで1点' } },
      { id: 'b', label: { low: 'うごけない', high: '動けない' } },
      { id: 'c', label: { low: 'アウト', high: 'アウト' } }
    ],
    correctId: 'a',
    explain: {
      low: 'ぜんいんが 1つずつ すすむので、サードの ランナーは ホームへ（おしだし）。',
      high: '全員が1つずつ進むので、サードの走者はホームへ（押し出し）。'
    },
    hint: { low: 'バッターが ファーストに いくと、ファーストの ひとは？' }
  },
  {
    id: 'f027', category: 'runner', levels: ['low', 'high'], mode: 'A',
    question: { low: 'ホームランを うった。どうする？', high: 'ホームランを打った。どうする？' },
    choices: [
      { id: 'a', label: { low: 'ぜんぶの ベースを じゅんばんに ふんで ホームまで はしる', high: '全部のベースを順番に踏んでホームまで走る' } },
      { id: 'b', label: { low: 'ホームに まっすぐ はしる', high: 'ホームへまっすぐ走る' } },
      { id: 'c', label: { low: 'はしらなくて いい', high: '走らなくてよい' } }
    ],
    correctId: 'a',
    explain: {
      low: 'ホームランでも ベースを ぜんぶ ふまないと とくてんに ならない。ふみわすれは アピールで アウト。',
      high: 'ホームランでもベースを全部踏まないと得点にならない。踏み忘れはアピールでアウト。'
    }
  },

  /* ---------- ピッチング ---------- */
  {
    id: 'f005', category: 'pitch', levels: ['low', 'high'], mode: 'A',
    question: { low: 'ストライクゾーンの たかさは、どこから どこまで？', high: 'ストライクゾーンの高さは、どこからどこまで？' },
    choices: [
      { id: 'a', label: { low: 'かたと ベルトの まんなかから、ひざの したまで', high: '肩とベルトの中間から、膝の下まで' } },
      { id: 'b', label: { low: 'あたまから あしまで', high: '頭から足まで' } },
      { id: 'c', label: { low: 'ベルトから ひざまで', high: 'ベルトから膝まで' } }
    ],
    correctId: 'a',
    explain: {
      low: 'うえは「かたと ベルトの まんなか」、したは「ひざの した」。はばは ホームベースの うえ。',
      high: '上は「肩とベルトの中間」、下は「膝頭の下」。幅はホームベースの上。'
    }
  },
  {
    id: 'f006', category: 'pitch', levels: ['low', 'high'], mode: 'A',
    question: { low: 'ワンバウンドした ボールを バッターが ふって、あたらなかった。これは？', high: 'ワンバウンドした投球を打者が空振りした。判定は？' },
    choices: [
      { id: 'a', label: { low: 'ストライク', high: 'ストライク' } },
      { id: 'b', label: { low: 'ボール', high: 'ボール' } },
      { id: 'c', label: { low: 'やりなおし', high: 'やり直し' } }
    ],
    correctId: 'a',
    explain: {
      low: 'ふったら ワンバウンドでも ストライク。バウンドした ボールは ふらない。',
      high: '空振りすればワンバウンドでもストライク。バウンドした球は振らない。'
    }
  },
  {
    id: 'f007', category: 'pitch', levels: ['low', 'high'], mode: 'A',
    question: { low: 'ワンバウンドした ボールを バッターは ふらなかった。これは？', high: 'ワンバウンドした投球を打者は見送った。判定は？' },
    choices: [
      { id: 'a', label: { low: 'ボール', high: 'ボール' } },
      { id: 'b', label: { low: 'ストライク', high: 'ストライク' } },
      { id: 'c', label: { low: 'デッドボール', high: 'デッドボール' } }
    ],
    correctId: 'a',
    explain: {
      low: 'バウンドした ボールは ストライクゾーンを とおれないので ボール。',
      high: 'バウンドした球はストライクゾーンを通過できないのでボール。'
    }
  },
  {
    id: 'f025', category: 'pitch', levels: ['high'], mode: 'A',
    question: { low: 'ランナーが いる とき、ピッチャーが なげる うごきを とちゅうで やめた（ボーク）。どうなる？', high: '走者がいるとき、投手が投球動作を途中でやめた（ボーク）。どうなる？' },
    choices: [
      { id: 'a', label: { low: 'ランナーが 1つ すすむ', high: '走者が1つ進む' } },
      { id: 'b', label: { low: 'バッターが アウト', high: '打者がアウト' } },
      { id: 'c', label: { low: 'なにも おこらない', high: '何も起こらない' } }
    ],
    correctId: 'a',
    explain: {
      low: 'ボークは ランナーを だます うごきを ふせぐ ルール。ランナーは ぜんいん 1つ すすむ。',
      high: 'ボークは走者をだます動作を防ぐ規則。すべての走者が1つ進塁する。'
    }
  },

  /* ---------- アウトのとりかた ---------- */
  {
    id: 'f011', category: 'out', levels: ['low', 'high'], mode: 'A',
    question: { low: 'フライを とった あと、すぐに ボールを おとした。これは？', high: 'フライを捕った直後にボールを落とした。判定は？' },
    choices: [
      { id: 'a', label: { low: 'とったことに ならない', high: '捕ったことにならない' } },
      { id: 'b', label: { low: 'アウト', high: 'アウト' } },
      { id: 'c', label: { low: 'ファール', high: 'ファール' } }
    ],
    correctId: 'a',
    explain: {
      low: 'しっかり もって いないと「ほきゅう」に ならない。ボールを にぎった まま とめられて はじめて アウト。',
      high: 'しっかり保持していないと「捕球」にならない。確実に持って止められて初めてアウト。'
    }
  },
  {
    id: 'f017', category: 'out', levels: ['low', 'high'], mode: 'A',
    question: {
      low: 'ノーアウトで ランナーが ファーストと セカンド。ないやに フライが あがり、しんぱんが「インフィールドフライ」と いった。バッターは？',
      high: 'ノーアウトでランナーがファーストとセカンド。内野フライが上がり、審判が「インフィールドフライ」を宣告した。打者は？'
    },
    choices: [
      { id: 'a', label: { low: 'とられなくても アウト', high: '捕られなくてもアウト' } },
      { id: 'b', label: { low: 'とられたら アウト', high: '捕られたらアウト' } },
      { id: 'c', label: { low: 'セーフ', high: 'セーフ' } }
    ],
    correctId: 'a',
    explain: {
      low: 'わざと おとして ダブルプレーを ねらうのを ふせぐ ルール。バッターは そのばで アウト。ランナーは すすまなくて いい。',
      high: 'わざと落としてダブルプレーを狙うのを防ぐ規則。打者はその場でアウト。走者は進む義務がない。'
    },
    hint: { low: 'しんぱんが いった しゅんかんに きまる。' }
  },
  {
    id: 'f018', category: 'out', levels: ['low', 'high'], mode: 'A',
    question: { low: 'フライを やしゅに とられた。バッターは？', high: 'フライを野手に捕られた。打者は？' },
    choices: [
      { id: 'a', label: { low: 'アウト', high: 'アウト' } },
      { id: 'b', label: { low: 'セーフ', high: 'セーフ' } },
      { id: 'c', label: { low: 'もういちど うつ', high: 'もう一度打つ' } }
    ],
    correctId: 'a',
    explain: {
      low: 'フライを ちょくせつ とられたら アウト。フェアでも ファールでも おなじ。',
      high: 'フライを直接捕られたらアウト。フェアでもファールでも同じ。'
    }
  },
  {
    id: 'f022', category: 'out', levels: ['low', 'high'], mode: 'A',
    question: { low: 'アウトが 3つに なったら？', high: 'アウトが3つになったら？' },
    choices: [
      { id: 'a', label: { low: 'こうたい（せめと まもりが かわる）', high: '攻守交代' } },
      { id: 'b', label: { low: '1てん はいる', high: '1点入る' } },
      { id: 'c', label: { low: 'しあいが おわる', high: '試合が終わる' } }
    ],
    correctId: 'a',
    explain: { low: '3アウトで こうたい。', high: '3アウトで攻守交代。' }
  },

  /* ---------- まもりのうごき ---------- */
  {
    id: 'f019', category: 'defense', levels: ['low', 'high'], mode: 'A',
    question: { low: 'ランナーに タッチする とき、どうやって さわる？', high: '走者にタッチするとき、どう触れる？' },
    choices: [
      { id: 'a', label: { low: 'ボールを もった てか、ボールの はいった グラブで', high: 'ボールを持った手か、ボールの入ったグラブで' } },
      { id: 'b', label: { low: 'からの グラブで', high: '空のグラブで' } },
      { id: 'c', label: { low: 'あしで', high: '足で' } }
    ],
    correctId: 'a',
    explain: {
      low: 'ボールが ない てや グラブで さわっても タッチに ならない。',
      high: 'ボールのない手やグラブで触れてもタッチにならない。'
    }
  },
  {
    id: 'f026', category: 'defense', levels: ['low', 'high'], mode: 'A',
    question: {
      low: 'ゴロを とって ファーストに なげた。バッターより さきに ボールが とどき、ファーストが ベースを ふんでいた。バッターは？',
      high: 'ゴロを捕ってファーストへ送球。打者より先にボールが届き、一塁手がベースを踏んでいた。打者は？'
    },
    choices: [
      { id: 'a', label: { low: 'アウト', high: 'アウト' } },
      { id: 'b', label: { low: 'セーフ', high: 'セーフ' } },
      { id: 'c', label: { low: 'やりなおし', high: 'やり直し' } }
    ],
    correctId: 'a',
    explain: {
      low: 'バッターは ファーストに いくしかない（フォース）ので、さきに ベースを ふまれたら アウト。',
      high: '打者はファーストへ行くしかない（フォース）ので、先にベースを踏まれればアウト。'
    }
  },

  /* ---------- しあいのきまり ---------- */
  {
    id: 'f010', category: 'manner', levels: ['low', 'high'], mode: 'A',
    question: { low: 'タイムを かけたい とき、どうする？', high: 'タイムをかけたいとき、どうする？' },
    choices: [
      { id: 'a', label: { low: 'しんぱんに「タイム」と いって、みとめられてから', high: '審判に「タイム」と言って、認められてから' } },
      { id: 'b', label: { low: 'じぶんで プレーを とめて いい', high: '自分でプレーを止めてよい' } },
      { id: 'c', label: { low: 'ベンチが さけべば いい', high: 'ベンチが叫べばよい' } }
    ],
    correctId: 'a',
    explain: {
      low: 'タイムは しんぱんが みとめて はじめて タイムに なる。いうだけでは プレーは とまらない。',
      high: 'タイムは審判が認めて初めて成立する。言っただけではプレーは止まらない。'
    }
  },
  {
    id: 'f020', category: 'manner', levels: ['low', 'high'], mode: 'A',
    question: { low: 'せめている とき、ベンチの そとに でて いいのは？', high: '攻撃中、ベンチの外に出てよいのは？' },
    choices: [
      { id: 'a', label: { low: 'バッター・つぎの バッター・コーチャー', high: '打者・次打者・コーチャー' } },
      { id: 'b', label: { low: 'だれでも', high: '誰でも' } },
      { id: 'c', label: { low: 'かんとくだけ', high: '監督だけ' } }
    ],
    correctId: 'a',
    explain: {
      low: 'せめの ときに でて いいのは この 3つ。ほかの ひとは ベンチの なかで おうえん。',
      high: '攻撃中に出てよいのはこの3つ。ほかの人はベンチ内で応援する。'
    }
  }
];
