/* ============================================================
   config.js  すべての設定値をここに集約する
   ------------------------------------------------------------
   調整したくなったら、まずこのファイルだけを見ればよい状態に保つ。
   他のファイルに数値を直書きしないこと。
   ============================================================ */

const CONFIG = {

  /* ---------- GAS 連携 ---------- */
  // Google Apps Script のウェブアプリURL（末尾 /exec）。
  // 空文字のままでも出題〜結果表示までは動く（送信とランキングだけが無効になる）。
  GAS_URL: 'https://script.google.com/macros/s/AKfycbyt5yi-R9oXQoF25CdQh9uu2Z7uMfEANcLqEdP_qtU2FF_e9pHmwiImLiXALC57iexfyg/exec',

  /* ---------- 出題 ---------- */
  QUIZ: {
    QUESTIONS_PER_SESSION: 10,   // 1回のセッションの問題数
    MIN_PER_CATEGORY: 1,         // カテゴリごとに最低これだけ確保する
    MAX_PER_TEMPLATE: 3,         // 同じテンプレートからの出題上限（1セッション）
    MIN_TEMPLATES: 4,            // テンプレート問題（図つき）は1セッション最低これだけ入れる
    RECENT_HISTORY_KEEP: 5,      // 1項目あたり保持する正誤履歴の件数
    WRONG_BOOST: 3,              // 直近で間違えた項目の抽選重み（正解済みの何倍か）
    UNSEEN_WEIGHT: 2,            // まだ出したことのない項目の抽選重み
    TEMPLATE_WEIGHT: 3,          // テンプレートは固定問題より出やすくする（1件で何問分の重みか）
    FAST_ANSWER_MS: 2000         // これ未満で答えたら is_fast = TRUE
  },

  /* ---------- レベル ---------- */
  LEVELS: {
    low: {
      key: 'low',
      label: 'しょきゅう（1〜3年）',      // 画面の表示名。内部キー low と記録の値は変えない
      maxRunners: 2,      // 同時に出すランナーの上限
      allowModeC: true,   // 再生つき（Cモード）を使う
      hint: true          // ヒントボタンを出す（各問1回）
    },
    high: {
      key: 'high',
      label: 'ちゅうきゅう（4〜6年）',
      maxRunners: 3,
      allowModeC: false,
      hint: false
    }
  },

  /* ---------- カテゴリ（出題のばらけ具合をここで決める） ---------- */
  CATEGORIES: {
    out:      'アウトの とりかた',
    batter:   'バッターの ルール',
    runner:   'ランナーの ルール',
    count:    'カウント',
    pitch:    'ピッチング',
    defense:  'まもりの うごき',
    manner:   'しあいの きまり'
  },

  /* ---------- 年度（4月始まり） ---------- */
  YEAR_START_MONTH: 4,

  /* ---------- localStorage ---------- */
  STORAGE: {
    PREFIX: 'orange_quiz_',
    KEYS: {
      PROFILE: 'profile',     // ニックネーム・学年
      HISTORY: 'history',     // 項目ごとの正誤履歴
      STATS: 'stats',         // 累計正解数・プレイ回数・自己ベスト
      SEEN: 'seen'            // 出会った状況の種類（制覇率の計算用）
    }
  },

  /* ---------- アニメーション（Cモード） ---------- */
  ANIM: {
    DURATION_MS: 1100,        // 打球が動く時間
    SHADOW_LEAD: 0.88,        // フライの影はボールより早く着地する（比率）
    RUNNER_ADVANCE: 0.5,      // 対象ランナーが次の塁へ進む割合（0.5＝半分）
    // 動きの緩急。ゴロは転がって減速するので ease-out、フライ・ライナーは一定
    EASING: { grounder: 'ease-out', liner: 'linear', fly: 'linear', runner: 'ease-out' }
  },

  /* ============================================================
     ダイヤモンドの座標（viewBox 0 0 680 420）
     バックネット裏から見下ろした斜め視点。縦は横の約半分に圧縮。
     ここを直せば図全体の見え方が変わる。座標を二重に持たないこと。
     ============================================================ */
  FIELD: {
    VIEWBOX: '0 0 680 420',
    W: 680,
    H: 420,

    // 塁の座標
    BASES: {
      'H':  { x: 340, y: 372, name: 'ホーム' },
      '1B': { x: 496, y: 288, name: 'ファースト' },
      '2B': { x: 340, y: 208, name: 'セカンド' },
      '3B': { x: 184, y: 288, name: 'サード' }
    },

    // 塁番号（1,2,3）→ 塁キー の対応
    BASE_OF_NUM: { 1: '1B', 2: '2B', 3: '3B' },
    // 次の塁（進塁先）。H→1B はバッターランナーが走る先
    NEXT_BASE: { 'H': '1B', '1B': '2B', '2B': '3B', '3B': 'H' },

    // 守備位置の座標（ラベル表示にも、打球の行き先にも、この1か所を使う）
    POSITIONS: {
      'lf': { x: 150, y: 176, label: 'レフト',       kind: 'of' },
      'cf': { x: 340, y: 126, label: 'センター',     kind: 'of' },
      'rf': { x: 530, y: 176, label: 'ライト',       kind: 'of' },
      'ss': { x: 262, y: 242, label: 'ショート',     kind: 'if' },
      '2b': { x: 424, y: 242, label: 'セカンド',     kind: 'if' },
      // サード・ファーストの野手は、標準の位置だと塁のランナーと重なるので個別にずらす
      '3b': { x: 222, y: 318, label: 'サード',       kind: 'if', fielderOffset: { dx:  22, dy: -6 } },
      '1b': { x: 462, y: 318, label: 'ファースト',   kind: 'if', fielderOffset: { dx: -22, dy:  2 } },
      'p':  { x: 340, y: 276, label: 'ピッチャー',   kind: 'if' },
      // キャッチャーだけは、ラベル位置に立たせるとボールデッドラインの上に乗るので
      // 足もとをホームのすぐ後ろへ個別にずらす（fielderOffset は FIELDER.offset より優先）
      'c':  { x: 340, y: 402, label: 'キャッチャー', kind: 'if', fielderOffset: { dx: 14, dy: -22 } }
    },

    // 打球の到着点。守備位置の座標そのものだとラベルの文字に隠れるのでずらす。
    // 野手を出すときは、この位置が野手のグラブに重なるように合わせてある（FIELDER.offset と連動）
    BALL_STOP_OFFSET: { dx: 5, dy: -22 },

    // ボールを持つ野手（1人だけ描く）。9人全員は出さない：図がうるさくなりランナーと混ざる。
    // ランナー（オレンジ・走る姿）と区別するため、色を変え、立ってグラブを構えた姿にする
    FIELDER: {
      show: true,          // false にすると野手を描かない
      scale: 1.0,
      headR: 5,
      torsoW: 6,
      limbW: 4.2,
      outline: 2.2,
      gloveR: 4,
      glove: { dx: -11, dy: -12 },   // 足もとから見たグラブの位置。打球はここで止まる
      offset: { dx: 16, dy: -10 },   // 守備位置の座標から足もとをずらす量（POSITIONS の fielderOffset が優先）
      face: 1                        // 1＝グラブが画面左（ボール側）、-1＝反転
    },

    // キャッチャーが捕れなかった投球が転がって止まる場所（ホームの後ろ、ボールデッドラインの内側）
    PASSED_BALL_SPOT: { x: 316, y: 388 },

    // 塁ラベルの描画位置（塁そのものの座標とは別。重ならないようにずらしてある）
    BASE_LABELS: {
      '2B': { x: 340, y: 184, anchor: 'middle' },
      '1B': { x: 524, y: 292, anchor: 'start'  },
      '3B': { x: 156, y: 292, anchor: 'end'    },
      'H':  { x: 378, y: 372, anchor: 'start'  }
    },

    // ゾーンのラベル（ボールデッド関連の問題のときだけ表示する）
    ZONE_LABELS: {
      foul: { x: 70,  y: 262, text: 'ファールゾーン' },
      dead: { x: 560, y: 352, text: 'ボールデッド'   }
    },

    // グラウンドを構成するパス（描く順に並べてある。後のものが上に重なる）
    // beyondFence / warning / grass は側辺を共有する。
    // ホーム(340,374) から (-34,168) と (714,168) へ。違うのは制御点のY値だけ。
    PATHS: {
      deadZone:     'M -20,232 L 250,382 Q 340,406 430,382 L 700,232 L 700,430 L -20,430 Z',
      foulZone:     'M -34,168 L 340,374 L 714,168 L 700,232 L 430,382 Q 340,406 250,382 L -20,232 Z',
      deadLine:     'M -20,232 L 250,382 Q 340,406 430,382 L 700,232',
      beyondFence:  'M 340,374 L -34,168 Q 340,-30 714,168 Z',
      fence:        'M -34,168 Q 340,-30 714,168',
      warning:      'M 340,374 L -34,168 Q 340,16 714,168 Z',
      grass:        'M 340,374 L -34,168 Q 340,56 714,168 Z',
      infieldDirt:  'M 150,316 Q 340,120 530,316 L 402,384 L 278,384 Z',
      infieldGrass: 'M 340,228 L 462,290 L 340,352 L 218,290 Z',
      foulLineL:    'M 340,374 L -34,168',
      foulLineR:    'M 340,374 L 714,168'
    },

    MOUND:     { cx: 340, cy: 292, rx: 26, ry: 14 },
    HOME_DIRT: { cx: 340, cy: 372, rx: 50, ry: 20 },

    BASE_SIZE: 20,   // 白い菱形の一辺（およそ）
    TAP_R: 30,       // タップ範囲（見た目より大きく取る）

    // ランナーは「走っている人」のピクトグラムで描く（ボールの丸と見分けがつくように）。
    // 足もとが基準点。右向きに描いて、進む向きに応じて左右反転する
    RUNNER: {
      scale: 1.0,      // 全体の大きさ
      headR: 5,        // 頭の半径
      torsoW: 6,       // 胴の太さ
      limbW: 4.2,      // 腕・足の太さ
      outline: 2.2,    // 縁取りの太さ（線の外側に足す分）
      ringRx: 21,      // 対象ランナーを囲む輪（横）
      ringRy: 22,      // 対象ランナーを囲む輪（縦）
      ringCy: -15      // 輪の中心（足もとからの高さ）
    },

    // ランナーは塁の真上に描くとベースが隠れるので、少しだけずらす。
    // ファースト・サードはファールラインの真上にあるので、必ず内野側（フェアゾーン）へ
    // ずらすこと。外側へずらすとランナーがファールゾーンに立っているように見える。
    // それぞれ「次の塁の方向へリードしている」位置に置く。
    // セカンドのランナーを真上にずらすと塁ラベルと重なるので、三塁側へずらす。
    // face は走る向き（1＝画面右へ、-1＝画面左へ）。反時計回りに進むので塁ごとに決まる
    RUNNER_OFFSET: {
      '1B': { dx: -26, dy:   6, face: -1 },   // ファースト→セカンドは左上へ
      '2B': { dx: -26, dy:  13, face: -1 },   // セカンド→サードは左下へ
      '3B': { dx:  26, dy:   6, face:  1 },   // サード→ホームは右下へ
      'H':  { dx:  26, dy: -18, face:  1 }    // バッターランナーはファースト寄り（ラインの内側）、右上へ
    }
  },

  /* ============================================================
     配色
     グラウンドは実物の色。ダークモードでも反転させない固定値。
     CSS変数は使わない（パネルの外のUIだけがテーマに追従する）。
     ============================================================ */
  COLORS: {
    panel:        '#0B0B0B',
    deadZone:     '#3A3A36',
    foulZone:     '#B39A72',
    deadLine:     '#F2F2EE',
    beyondFence:  '#1E5023',
    fence:        '#E8C547',
    warning:      '#C9A87C',
    grass:        '#3E8B3E',
    infieldDirt:  '#C9A87C',
    infieldGrass: '#3E8B3E',
    foulLine:     '#F2F2EE',
    base:         '#F7F7F4',
    baseEdge:     '#1A1A18',
    runner:       '#EF9F27',
    runnerEdge:   '#1A1A18',
    runnerMark:   '#FFFFFF',
    fielder:      '#4F9BE0',   // 野手はランナーと違う色（青）
    fielderEdge:  '#1A1A18',
    glove:        '#8B5A2B',
    markOk:       '#4CD964',   // 回答後に正解の塁へ付ける印
    markNg:       '#FF5A5A',   // 回答後に間違えた塁へ付ける印
    ball:         '#F7F7F4',
    ballEdge:     '#1A1A18',
    ballSeam:     '#C8433C',   // 縫い目（野球のボールだと分かるように）
    shadow:       '#000000',
    trail:        '#F7F7F4',
    labelBase:    '#F2F2EE',
    labelPos:     '#EDEBE2',
    labelZone:    '#D8D6CD',
    labelStroke:  '#0B0B0B',
    bsoBand:      '#0B0B0B',
    bsoDivider:   '#2A2A28',
    bsoText:      '#E8E8E6',
    bsoOff:       '#55544F',
    bsoBall:      '#7CC24A',
    bsoStrike:    '#EF9F27',
    bsoOut:       '#E24B4A'
  },

  /* ---------- 打球の見た目（ゴロ・ライナー・フライで変える） ---------- */
  BALL_STYLE: {
    // 共通の約束：ボールと地面の影の距離が「高さ」を表す。この一貫性を崩さないこと。
    trailWidth: 2,
    trailDash: '5 5',
    trailOpacity: 0.85,
    linkDash: '3 4',
    linkWidth: 1.5,
    linkOpacity: 0.8,
    shadowOpacity: 0.4,

    // ゴロ：地面を跳ねる。最初の跳ねが一番高く、だんだん低くなって最後は転がる。影なし
    grounder: { r: 6, gap: 0, bounces: 5, bounceH: 18, rollRatio: 0.18 },
    // 投球（ワンバウンドしてキャッチャーの後ろへ）：ゴロの設定をこの値で上書きする
    pitchOverride: { bounces: 2, bounceH: 8, rollRatio: 0.35 },
    liner:    { r: 6, gap: 16, shadowRx: 5, shadowRy: 2.5 }, // まっすぐ。影はすぐ下
    fly:      { r: 7, gap: 60, shadowRx: 9, shadowRy: 4.5,   // 大きな弧。影は遠い
                markerR: 9, markerDash: '3 3', markerOpacity: 0.7,
                groundLineOpacity: 0.35, snapshotT: 0.55 }
  },

  /* ---------- BSOカウント（最後に描く。先に描くと図に隠れる） ---------- */
  BSO: {
    bandH: 50,
    y: 30,
    dotR: 5,
    dotGap: 15,
    fontSize: 14,
    groups: [
      { key: 'b', label: 'B', max: 3, x: 130 },
      { key: 's', label: 'S', max: 2, x: 300 },
      { key: 'o', label: 'O', max: 2, x: 440 }
    ]
  },

  /* ---------- 文字サイズ（低学年が読む。11px未満を使わない） ---------- */
  FONT: {
    question: 17,
    explain: 15,
    labelPos: 12,
    labelBase: 13,
    labelZone: 12
  }
};
