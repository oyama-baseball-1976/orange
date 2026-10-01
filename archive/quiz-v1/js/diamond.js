/* ============================================================
   diamond.js  ダイヤモンド描画の共通コンポーネント
   ------------------------------------------------------------
   バックネット裏から見下ろした斜め視点でグラウンドを描く。
   座標・配色はすべて config.js の FIELD / COLORS を参照する。
   ここに数値を直書きしないこと。

   使い方：
     const d = Diamond.render(container, {
       runners: [1, 2],            // ランナーのいる塁
       batter: true,               // バッターランナーを描くか
       target: 2,                  // 強調表示するランナー（塁番号）
       ball: { kind:'grounder', to:'ss' },
       tappable: ['1B','2B','3B','H'],
       onTap: fn,
       labelMode: 'bases',         // 'bases' | 'positions' | 'none'
       showZoneLabels: false,
       bso: { b:1, s:2, o:1 },
       animate: false              // true にすると Cモード（再生つき）
     });
     d.play();      // 再生（animate:true のときだけ意味がある）
     d.setLocked(false);  // タップの受付を許可する
   ============================================================ */

const Diamond = (function () {

  const NS = 'http://www.w3.org/2000/svg';
  const F = () => CONFIG.FIELD;
  const C = () => CONFIG.COLORS;
  const B = () => CONFIG.BALL_STYLE;

  /* ---------- 小さな道具 ---------- */

  function el(tag, attrs) {
    const node = document.createElementNS(NS, tag);
    for (const k in attrs) {
      if (attrs[k] === null || attrs[k] === undefined) continue;
      node.setAttribute(k, attrs[k]);
    }
    return node;
  }

  function lerp(a, b, t) {
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  }

  // 二次ベジェ上の点
  function quadAt(p0, p1, p2, t) {
    const u = 1 - t;
    return {
      x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
      y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y
    };
  }

  // 座標指定を {x,y} に正規化する。'ss' のような守備位置キー、'1B' のような塁キー、{x,y} を受ける
  function toPoint(spec) {
    if (!spec) return null;
    if (typeof spec === 'object' && typeof spec.x === 'number') return { x: spec.x, y: spec.y };
    if (F().POSITIONS[spec]) return { x: F().POSITIONS[spec].x, y: F().POSITIONS[spec].y };
    if (F().BASES[spec]) return { x: F().BASES[spec].x, y: F().BASES[spec].y };
    return null;
  }

  // 動きを減らす設定のときは、アニメーションせず最終状態を即座に見せる
  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // offset-path が使えるか（使えなければアニメーションなしで最終状態を描く）
  function supportsOffsetPath() {
    return !!(window.CSS && CSS.supports && CSS.supports('offset-path', 'path("M 0 0 L 1 1")'));
  }

  /* ---------- 打球の軌跡を組み立てる ---------- */
  /*
     共通の約束：ボールと地面の影の距離が「高さ」を表す。
     ゴロ＝影なし、ライナー＝影がすぐ下、フライ＝影が大きく離れる。
     この一貫性を崩さないこと（子どもがゲームで見慣れている表現）。
  */
  // 守備位置 posKey に立つ野手のグラブの位置（足もとの個別オフセット＋グラブのオフセット）
  function glovePoint(posKey) {
    const p = F().POSITIONS[posKey], D = F().FIELDER;
    const off = p.fielderOffset || D.offset;
    return {
      x: p.x + off.dx + D.glove.dx * D.scale * (D.face || 1),
      y: p.y + off.dy + D.glove.dy * D.scale
    };
  }

  function buildBallGeometry(ball, fielderShown) {
    const kind = ball.kind || 'grounder';
    const from = toPoint(ball.from) || { x: F().BASES.H.x, y: F().BASES.H.y };
    let to = toPoint(ball.to);
    if (!to) return null;
    if (typeof ball.to === 'string' && F().POSITIONS[ball.to]) {
      if (fielderShown) {
        // 野手を描くときは、その野手のグラブで止める
        to = glovePoint(ball.to);
      } else {
        // 野手を描かないときは、ラベルの文字に隠れないよう少し手前で止める
        to.x += F().BALL_STOP_OFFSET.dx;
        to.y += F().BALL_STOP_OFFSET.dy;
      }
    }

    // ball.style で見た目を部分的に上書きできる（例：投球は跳ねを小さくする）
    const style = Object.assign({}, B()[kind], ball.style || {});
    const g = { kind: kind, from: from, to: to, style: style };

    if (kind === 'grounder') {
      // 地面を跳ねる形（∩∩∩）。画面の上方向（-y）へ跳ねるので、斜め視点でも「弾んでいる」と読める。
      // 最初の跳ねが一番高く、だんだん低くなり、最後の rollRatio の区間は転がるだけ
      const n = style.bounces;
      const bounceEnd = 1 - style.rollRatio;      // ここまでが跳ねる区間
      // 跳ねる向き：真上（-y）だけだと、上へ向かう打球では進行方向と重なって見えなくなる。
      // 進行方向に垂直で上向きの成分を持つベクトルに、少し真上を足したものを使う
      const dx = to.x - from.x, dy = to.y - from.y;
      const len = Math.hypot(dx, dy) || 1;
      let px = -dy / len, py = dx / len;          // 垂直ベクトル
      if (py > 0 || (py === 0 && px < 0)) { px = -px; py = -py; }   // 上向き（y<0）の方を選ぶ
      py -= 0.5;
      const pl = Math.hypot(px, py) || 1;
      px /= pl; py /= pl;
      let d = 'M ' + from.x + ',' + from.y;
      for (let i = 0; i < n; i++) {
        const t0 = bounceEnd * i / n, t1 = bounceEnd * (i + 1) / n;
        const p1 = lerp(from, to, t1);
        const mid = lerp(from, to, (t0 + t1) / 2);
        const h = style.bounceH * Math.pow((n - i) / n, 1.4);   // 跳ねる高さは回を追うごとに低く
        // 制御点を2倍離すと山の高さが h になる
        d += ' Q ' + (mid.x + px * h * 2) + ',' + (mid.y + py * h * 2) + ' ' + p1.x + ',' + p1.y;
      }
      d += ' L ' + to.x + ',' + to.y;             // 最後は転がる
      g.ballPath = d;
      g.ballAt = (t) => lerp(from, to, t);        // 静止位置は直線で近似（端点は一致する）
      g.shadowPath = null;
      g.shadowAt = null;

    } else if (kind === 'liner') {
      // まっすぐ。ボールと影は一定の間隔を保つので、ひとつのグループにまとめて動かす
      g.ballPath = 'M ' + from.x + ',' + from.y + ' L ' + to.x + ',' + to.y;
      g.ballAt = (t) => lerp(from, to, t);
      g.shadowPath = g.ballPath;
      g.shadowAt = g.ballAt;

    } else {
      // フライ：ボールは大きな弧、影は地面の直線。影が先に着地してボールが追いつく
      const mid = lerp(from, to, 0.5);
      const ctrl = { x: mid.x, y: mid.y - style.gap * 2 };   // 頂点の高さが gap になる制御点
      g.ballPath = 'M ' + from.x + ',' + from.y +
                   ' Q ' + ctrl.x + ',' + ctrl.y + ' ' + to.x + ',' + to.y;
      g.ballAt = (t) => quadAt(from, ctrl, to, t);
      g.shadowPath = 'M ' + from.x + ',' + from.y + ' L ' + to.x + ',' + to.y;
      g.shadowAt = (t) => lerp(from, to, t);
    }
    return g;
  }

  /* ---------- グラウンドを描く（順番が重要。後のものが上に重なる） ---------- */

  function drawField(svg, opts) {
    const P = F().PATHS, col = C();

    // 1. パネル背景とクリップ
    const clipId = 'dmClip' + Math.random().toString(36).slice(2, 8);
    const defs = el('defs', {});
    const clip = el('clipPath', { id: clipId });
    clip.appendChild(el('rect', { x: 0, y: 0, width: F().W, height: F().H, rx: 14, ry: 14 }));
    defs.appendChild(clip);
    svg.appendChild(defs);
    svg.appendChild(el('rect', { x: 0, y: 0, width: F().W, height: F().H, rx: 14, ry: 14, fill: col.panel }));

    const g = el('g', { 'clip-path': 'url(#' + clipId + ')' });
    svg.appendChild(g);

    // 2. ボールデッドゾーン
    g.appendChild(el('path', { d: P.deadZone, fill: col.deadZone }));
    // 3. ファールゾーン
    g.appendChild(el('path', { d: P.foulZone, fill: col.foulZone }));
    // 4. ボールデッドライン（白の破線。プレーが死ぬかどうかを決める線）
    g.appendChild(el('path', {
      d: P.deadLine, fill: 'none', stroke: col.deadLine,
      'stroke-width': 2, 'stroke-dasharray': '9 7'
    }));
    // 5. フェンスの外
    g.appendChild(el('path', { d: P.beyondFence, fill: col.beyondFence }));
    // 6. フェンスの線
    g.appendChild(el('path', { d: P.fence, fill: 'none', stroke: col.fence, 'stroke-width': 2 }));
    // 7. ウォーニングトラック
    g.appendChild(el('path', { d: P.warning, fill: col.warning }));
    // 8. 芝（単色。縞を入れるとランナーや打球が読み取りにくくなる）
    g.appendChild(el('path', { d: P.grass, fill: col.grass }));
    // 9. 内野の土
    g.appendChild(el('path', { d: P.infieldDirt, fill: col.infieldDirt }));
    // 10. 内野の芝
    g.appendChild(el('path', { d: P.infieldGrass, fill: col.infieldGrass }));
    // 11. マウンドとホーム周りの土
    g.appendChild(el('ellipse', Object.assign({ fill: col.infieldDirt }, F().MOUND)));
    g.appendChild(el('ellipse', Object.assign({ fill: col.infieldDirt }, F().HOME_DIRT)));
    // 12. ファールライン（白の実線。打球のフェア／ファールを決める線）
    g.appendChild(el('path', { d: P.foulLineL, fill: 'none', stroke: col.foulLine, 'stroke-width': 2.5 }));
    g.appendChild(el('path', { d: P.foulLineR, fill: 'none', stroke: col.foulLine, 'stroke-width': 2.5 }));

    return g;
  }

  /* ---------- ベース ---------- */

  function drawBases(g) {
    const half = F().BASE_SIZE * 0.7;       // 横半径
    const halfY = half * 0.5;               // 斜め視点なので縦は半分に圧縮
    ['1B', '2B', '3B'].forEach(function (key) {
      const b = F().BASES[key];
      g.appendChild(el('polygon', {
        points: [
          b.x + ',' + (b.y - halfY),
          (b.x + half) + ',' + b.y,
          b.x + ',' + (b.y + halfY),
          (b.x - half) + ',' + b.y
        ].join(' '),
        fill: C().base, stroke: C().baseEdge, 'stroke-width': 1
      }));
    });
    // ホームベースは五角形
    const h = F().BASES.H;
    g.appendChild(el('polygon', {
      points: [
        (h.x - 11) + ',' + (h.y - 5),
        (h.x + 11) + ',' + (h.y - 5),
        (h.x + 11) + ',' + (h.y + 2),
        h.x + ',' + (h.y + 8),
        (h.x - 11) + ',' + (h.y + 2)
      ].join(' '),
      fill: C().base, stroke: C().baseEdge, 'stroke-width': 1
    }));
  }

  /* ---------- 打球 ---------- */

  // ボール1個。白い丸に赤い縫い目「( )」を入れて、野球のボールだと一目で分かるようにする
  function ballNode(cx, cy, r) {
    const grp = el('g', {});
    grp.appendChild(el('circle', {
      cx: cx, cy: cy, r: r, fill: C().ball, stroke: C().ballEdge, 'stroke-width': 1
    }));
    const seam = function (sgn) {
      return 'M ' + (cx + sgn * r * 0.35) + ',' + (cy - r * 0.8) +
             ' Q ' + (cx + sgn * r * 0.9) + ',' + cy +
             ' ' + (cx + sgn * r * 0.35) + ',' + (cy + r * 0.8);
    };
    [-1, 1].forEach(function (sgn) {
      grp.appendChild(el('path', {
        d: seam(sgn), fill: 'none', stroke: C().ballSeam, 'stroke-width': 1, 'stroke-linecap': 'round'
      }));
    });
    return grp;
  }

  function drawBall(g, geo, animate) {
    if (!geo) return null;
    const s = B(), st = geo.style;
    const parts = {};

    // 軌跡
    g.appendChild(el('path', {
      d: geo.ballPath, fill: 'none', stroke: C().trail,
      'stroke-width': s.trailWidth, 'stroke-dasharray': s.trailDash,
      opacity: s.trailOpacity, 'stroke-linecap': 'round'
    }));

    if (geo.kind === 'fly') {
      // 影が通る地面の直線を薄く添える
      g.appendChild(el('path', {
        d: geo.shadowPath, fill: 'none', stroke: C().trail,
        'stroke-width': 1, 'stroke-dasharray': '4 6', opacity: st.groundLineOpacity
      }));
      // 落下地点のマーカー（タッチアップ等で判断材料になる）
      g.appendChild(el('circle', {
        cx: geo.to.x, cy: geo.to.y, r: st.markerR, fill: 'none',
        stroke: C().trail, 'stroke-width': 1.5,
        'stroke-dasharray': st.markerDash, opacity: st.markerOpacity
      }));
    }

    if (geo.kind === 'liner') {
      // ボール・つなぎ線・影を1つのグループにまとめる（間隔が一定なので一緒に動かせる）
      const grp = el('g', {});
      grp.appendChild(el('ellipse', {
        cx: 0, cy: 0, rx: st.shadowRx, ry: st.shadowRy,
        fill: C().shadow, opacity: s.shadowOpacity
      }));
      grp.appendChild(el('line', {
        x1: 0, y1: 0, x2: 0, y2: -st.gap, stroke: C().trail,
        'stroke-width': s.linkWidth, 'stroke-dasharray': s.linkDash, opacity: s.linkOpacity
      }));
      grp.appendChild(ballNode(0, -st.gap, st.r));
      g.appendChild(grp);
      parts.ball = { node: grp, path: geo.ballPath, at: geo.ballAt, lead: 1, kind: 'liner' };

    } else if (geo.kind === 'fly') {
      // 影（地面の直線を進む）
      const sh = el('g', {});
      sh.appendChild(el('ellipse', {
        cx: 0, cy: 0, rx: st.shadowRx, ry: st.shadowRy,
        fill: C().shadow, opacity: s.shadowOpacity
      }));
      g.appendChild(sh);
      // ボール（弧を進む）
      const bl = ballNode(0, 0, st.r);
      g.appendChild(bl);
      parts.shadow = { node: sh, path: geo.shadowPath, at: geo.shadowAt, lead: CONFIG.ANIM.SHADOW_LEAD, kind: 'fly' };
      parts.ball = { node: bl, path: geo.ballPath, at: geo.ballAt, lead: 1, kind: 'fly' };

      if (!animate) {
        // 静止図では、飛んでいる途中の姿を見せる。ボールと影の距離が高さを表す。
        // ボールと影の両方を同じ t に置かないと、つなぎ線がずれる
        const t = st.snapshotT;
        const bp = geo.ballAt(t), sp = geo.shadowAt(t);
        g.appendChild(el('line', {
          x1: sp.x, y1: sp.y, x2: bp.x, y2: bp.y, stroke: C().trail,
          'stroke-width': s.linkWidth, 'stroke-dasharray': s.linkDash, opacity: s.linkOpacity
        }));
        parts.ball.snapshotT = t;
        parts.shadow.snapshotT = t;
      }

    } else {
      // ゴロ：影は描かない。ボールは地面の上にある
      const grp = ballNode(0, 0, st.r);
      g.appendChild(grp);
      parts.ball = { node: grp, path: geo.ballPath, at: geo.ballAt, lead: 1, kind: 'grounder' };
    }

    return parts;
  }

  /* ---------- 野手（ボールを持つ1人だけ） ---------- */
  /*
     立ってグラブを構えた姿。ランナー（オレンジ・走る姿）とは色も姿勢も変えて、
     図の中で「守る人」と「走る人」がひと目で区別できるようにする。
     9人全員は描かない（図がうるさくなり、ランナーを探すことになる）。
  */
  function drawFielder(g, posKey) {
    const D = F().FIELDER;
    if (!D || !D.show || !posKey || !F().POSITIONS[posKey]) return;
    const p = F().POSITIONS[posKey];
    const off = p.fielderOffset || D.offset;   // 守備位置ごとの個別指定があればそちらを使う
    const grp = el('g', {
      transform: 'translate(' + (p.x + off.dx) + ',' + (p.y + off.dy) + ') ' +
                 'scale(' + (D.scale * (D.face || 1)) + ',' + D.scale + ')'
    });
    // まっすぐ立った胴、開いた足、左へ伸ばしたグラブの腕（ボール側）、右の腕
    const torso = 'M 0,-19 L 0,-8';
    const limbs = 'M 0,-8 L -4,0 M 0,-8 L 4,0 M 0,-18 L -9,-13 M 0,-18 L 6,-11';
    const strokes = [{ d: torso, w: D.torsoW }, { d: limbs, w: D.limbW }];
    // 1回目：縁取り
    strokes.forEach(function (s) {
      grp.appendChild(el('path', {
        d: s.d, fill: 'none', stroke: C().fielderEdge,
        'stroke-width': s.w + D.outline, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
      }));
    });
    grp.appendChild(el('circle', { cx: 0, cy: -26, r: D.headR + D.outline / 2, fill: C().fielderEdge }));
    // 2回目：本体
    strokes.forEach(function (s) {
      grp.appendChild(el('path', {
        d: s.d, fill: 'none', stroke: C().fielder,
        'stroke-width': s.w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
      }));
    });
    grp.appendChild(el('circle', { cx: 0, cy: -26, r: D.headR, fill: C().fielder }));
    // グラブ（打球はこの位置で止まる。buildBallGeometry が同じ config.FIELDER.glove を参照する）
    grp.appendChild(el('circle', {
      cx: D.glove.dx, cy: D.glove.dy, r: D.gloveR, fill: C().glove, stroke: C().fielderEdge, 'stroke-width': 1.2
    }));
    g.appendChild(grp);
  }

  /* ---------- ランナー ---------- */

  function drawRunners(g, opts) {
    const movers = { byNum: {} };   // byNum[塁番号] に描いたランナーを控える（0＝バッターランナー）
    const list = (opts.runners || []).slice();

    // 走っている人のピクトグラム。右向きに描く。足もとが (0,0)、x は前方。
    // 太い線を「縁取り色で太く → 本体色で細く」の順に2回描いて、輪郭つきの線にする
    function figure(isTarget, face) {
      const R = F().RUNNER;
      const grp = el('g', { transform: 'scale(' + (R.scale * (face || 1)) + ',' + R.scale + ')' });
      if (isTarget) {
        // 対象ランナーは輪で囲んで強調
        grp.appendChild(el('ellipse', {
          cx: 0, cy: R.ringCy, rx: R.ringRx, ry: R.ringRy, fill: 'none',
          stroke: C().runnerMark, 'stroke-width': 2.5, opacity: 0.95
        }));
      }
      // 前傾した胴、振り上げた前の腕、後ろへ引いた腕、膝を上げた前の足、蹴り出した後ろの足
      const torso = 'M 3,-19 L -3,-9';
      const limbs = [
        'M -3,-9 L 8,-7 L 9,0',        // 前の足（膝を前に上げ、足は下へ）
        'M -3,-9 L -9,-4 L -15,1',     // 後ろの足（まっすぐ後ろへ蹴り出す）
        'M 3,-19 L 10,-16 L 13,-22',   // 前の腕（肘を曲げて振り上げる）
        'M 3,-19 L -4,-15 L -8,-20'    // 後ろの腕（後ろへ引く）
      ].join(' ');
      const strokes = [
        { d: torso, w: R.torsoW }, { d: limbs, w: R.limbW }
      ];
      // 1回目：縁取り
      strokes.forEach(function (s) {
        grp.appendChild(el('path', {
          d: s.d, fill: 'none', stroke: C().runnerEdge,
          'stroke-width': s.w + R.outline, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
        }));
      });
      grp.appendChild(el('circle', { cx: 7, cy: -27, r: R.headR + R.outline / 2, fill: C().runnerEdge }));
      // 2回目：本体
      strokes.forEach(function (s) {
        grp.appendChild(el('path', {
          d: s.d, fill: 'none', stroke: C().runner,
          'stroke-width': s.w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
        }));
      });
      grp.appendChild(el('circle', { cx: 7, cy: -27, r: R.headR, fill: C().runner }));
      return grp;
    }

    function place(baseKey, isTarget) {
      const b = F().BASES[baseKey];
      const off = F().RUNNER_OFFSET[baseKey] || { dx: 0, dy: 0 };
      const grp = el('g', {});
      const inner = el('g', { transform: 'translate(' + (b.x + off.dx) + ',' + (b.y + off.dy) + ')' });
      inner.appendChild(figure(isTarget, off.face));
      grp.appendChild(inner);
      g.appendChild(grp);
      return { outer: grp, base: baseKey, x: b.x + off.dx, y: b.y + off.dy };
    }

    list.forEach(function (num) {
      const key = F().BASE_OF_NUM[num];
      if (!key) return;
      const r = place(key, opts.target === num);
      movers.byNum[num] = r;
      if (opts.target === num) movers.target = r;
    });

    if (opts.batter) {
      const r = place('H', opts.target === 0);
      movers.byNum[0] = r;
      if (opts.target === 0) movers.target = r;
    }
    return movers;
  }

  /* ---------- ラベル ---------- */

  function textNode(x, y, str, size, fill, anchor) {
    const t = el('text', {
      x: x, y: y, 'font-size': size, fill: fill,
      'text-anchor': anchor || 'middle',
      'font-weight': 700,
      'paint-order': 'stroke',
      stroke: C().labelStroke, 'stroke-width': 3.5, 'stroke-linejoin': 'round'
    });
    t.textContent = str;
    return t;
  }

  function drawLabels(g, opts) {
    const mode = opts.labelMode || 'none';
    // 塁と守備位置を同時に出さない。
    // 「セカンド」「サード」「ファースト」は塁の名前でもあり守備位置の名前でもあるが
    // 場所が違うため、両方出すと同じ言葉が2か所に現れて子どもが混乱する。
    if (mode === 'bases') {
      for (const key in F().BASE_LABELS) {
        const L = F().BASE_LABELS[key];
        g.appendChild(textNode(L.x, L.y, F().BASES[key].name, CONFIG.FONT.labelBase, C().labelBase, L.anchor));
      }
    } else if (mode === 'positions') {
      for (const key in F().POSITIONS) {
        const p = F().POSITIONS[key];
        g.appendChild(textNode(p.x, p.y, p.label, CONFIG.FONT.labelPos, C().labelPos, 'middle'));
      }
    }

    if (opts.showZoneLabels) {
      const Z = F().ZONE_LABELS;
      g.appendChild(textNode(Z.foul.x, Z.foul.y, Z.foul.text, CONFIG.FONT.labelZone, C().labelZone, 'middle'));
      g.appendChild(textNode(Z.dead.x, Z.dead.y, Z.dead.text, CONFIG.FONT.labelZone, C().labelZone, 'middle'));
    }
  }

  /* ---------- タップ範囲 ---------- */

  function drawTapTargets(g, opts, state) {
    const keys = opts.tappable || [];
    keys.forEach(function (key) {
      const b = F().BASES[key];
      if (!b) return;
      // 目印の輪（ここが押せると分かるように）
      g.appendChild(el('circle', {
        cx: b.x, cy: b.y, r: F().TAP_R - 6, fill: 'none',
        stroke: C().runner, 'stroke-width': 2, 'stroke-dasharray': '5 5', opacity: 0.85
      }));
      const hit = el('circle', {
        cx: b.x, cy: b.y, r: F().TAP_R, fill: 'transparent',
        style: 'cursor:pointer'
      });
      hit.addEventListener('click', function () {
        if (state.locked) {
          if (opts.onLockedTap) opts.onLockedTap();
          return;
        }
        if (opts.onTap) opts.onTap(key);
      });
      g.appendChild(hit);
    });
  }

  /* ---------- BSOカウント（必ず最後に描く） ---------- */

  function drawBso(svg, bso) {
    if (!bso) return;
    const S = CONFIG.BSO, col = C();
    svg.appendChild(el('rect', { x: 0, y: 0, width: F().W, height: S.bandH, fill: col.bsoBand }));
    svg.appendChild(el('line', {
      x1: 0, y1: S.bandH, x2: F().W, y2: S.bandH, stroke: col.bsoDivider, 'stroke-width': 2
    }));
    const onColor = { b: col.bsoBall, s: col.bsoStrike, o: col.bsoOut };

    S.groups.forEach(function (grp) {
      const t = el('text', {
        x: grp.x, y: S.y + 5, 'font-size': S.fontSize, fill: col.bsoText,
        'font-weight': 700, 'text-anchor': 'end'
      });
      t.textContent = grp.label;
      svg.appendChild(t);
      const n = Math.max(0, Math.min(grp.max, bso[grp.key] || 0));
      for (let i = 0; i < grp.max; i++) {
        const on = i < n;
        svg.appendChild(el('circle', {
          cx: grp.x + 14 + i * S.dotGap, cy: S.y, r: S.dotR,
          fill: on ? onColor[grp.key] : 'none',
          stroke: on ? 'none' : col.bsoOff, 'stroke-width': on ? 0 : 1.5
        }));
      }
    });
  }

  /* ---------- 動くもののセットアップ ---------- */
  /*
     動きは CSS transition（offset-distance）で行う。
     prefers-reduced-motion のときは時間を0にして最終状態を即座に表示する。
  */
  function setupMotion(mover, animate, canAnimate) {
    if (!mover) return;
    const node = mover.node || mover.outer;
    if (!node) return;

    if (!animate || !canAnimate) {
      // 静止図：最終位置に置くだけ
      const t = (mover.snapshotT !== undefined) ? mover.snapshotT : 1;
      const p = mover.at(t);
      node.setAttribute('transform', 'translate(' + p.x + ',' + p.y + ')');
      return;
    }
    const dur = reducedMotion() ? 0 : Math.round(CONFIG.ANIM.DURATION_MS * (mover.lead || 1));
    node.style.offsetPath = 'path("' + mover.path + '")';
    node.style.offsetRotate = '0deg';
    node.style.offsetDistance = '0%';
    node.style.transition = 'offset-distance ' + dur + 'ms ' + easingOf(mover);
  }

  // 種類ごとの緩急（config の ANIM.EASING）。指定がなければ一定速度
  function easingOf(mover) {
    return (CONFIG.ANIM.EASING && CONFIG.ANIM.EASING[mover.kind]) || 'linear';
  }

  /* ---------- 本体 ---------- */

  function render(container, opts) {
    opts = opts || {};
    const state = { locked: !!opts.animate && !!opts.lockUntilPlayed, played: false };

    container.innerHTML = '';
    const svg = el('svg', {
      viewBox: F().VIEWBOX, width: '100%',
      preserveAspectRatio: 'xMidYMid meet',
      role: 'img', class: 'diamond-svg'
    });

    const g = drawField(svg, opts);
    drawBases(g);

    const fielderShown = opts.showFielder !== false && !!(F().FIELDER && F().FIELDER.show);
    const geo = opts.ball ? buildBallGeometry(
      typeof opts.ball === 'string' ? { kind: 'grounder', to: opts.ball } : opts.ball,
      fielderShown
    ) : null;

    const canAnimate = supportsOffsetPath();
    // ボールを持つ野手は、打球の行き先が守備位置のときだけ描く（showFielder:false で消せる）。
    // opts.fielder で守備位置を明示すれば、打球の行き先と無関係に描ける（例：キャッチャー）
    if (fielderShown) {
      const toKey = opts.fielder ||
        (opts.ball ? (typeof opts.ball === 'string' ? opts.ball : opts.ball.to) : null);
      if (typeof toKey === 'string') drawFielder(g, toKey);
    }
    const ballParts = drawBall(g, geo, !!opts.animate && canAnimate);
    const movers = drawRunners(g, opts);

    drawLabels(g, opts);
    drawTapTargets(g, opts, state);

    // 打球の動き
    if (ballParts) {
      if (ballParts.shadow) setupMotion(ballParts.shadow, opts.animate, canAnimate);
      if (ballParts.ball) setupMotion(ballParts.ball, opts.animate, canAnimate);
    }

    // ランナーの動き（次の塁へ半分ほど進んで止まる）。
    // opts.advance に塁番号の配列（0＝バッターランナー）を渡すと、その全員が動く。
    // 省略時は runnerAdvance:true で対象ランナーだけが動く（従来どおり）
    let advanceList = [];
    if (Array.isArray(opts.advance)) advanceList = opts.advance;
    else if (opts.runnerAdvance && typeof opts.target === 'number') advanceList = [opts.target];

    const runnerMovers = [];
    advanceList.forEach(function (num) {
      const r = movers.byNum[num];
      if (!r) return;
      const nextKey = F().NEXT_BASE[r.base];
      if (!nextKey) return;
      const nb = F().BASES[nextKey];
      const noff = F().RUNNER_OFFSET[nextKey] || { dx: 0, dy: 0 };
      const from = { x: 0, y: 0 };
      const to = {
        x: (nb.x + noff.dx - r.x) * CONFIG.ANIM.RUNNER_ADVANCE,
        y: (nb.y + noff.dy - r.y) * CONFIG.ANIM.RUNNER_ADVANCE
      };
      const m = {
        node: r.outer,
        path: 'M 0,0 L ' + to.x + ',' + to.y,
        at: (t) => lerp(from, to, t),
        lead: 1,
        kind: 'runner'
      };
      setupMotion(m, opts.animate, canAnimate);
      runnerMovers.push(m);
    });

    drawBso(svg, opts.bso);
    container.appendChild(svg);

    const all = [];
    if (ballParts && ballParts.shadow) all.push(ballParts.shadow);
    if (ballParts && ballParts.ball) all.push(ballParts.ball);
    runnerMovers.forEach(function (m) { all.push(m); });

    return {
      svg: svg,
      // 再生。何度でも呼べる
      play: function () {
        if (!opts.animate || !canAnimate) { state.played = true; state.locked = false; return; }
        // いったん最初へ戻してから動かす
        all.forEach(function (m) {
          const node = m.node;
          node.style.transition = 'none';
          node.style.offsetDistance = '0%';
        });
        // レイアウトを確定させてから transition を戻す（戻さないと動かない）
        void svg.getBoundingClientRect();
        const base = reducedMotion() ? 0 : CONFIG.ANIM.DURATION_MS;
        all.forEach(function (m) {
          m.node.style.transition = 'offset-distance ' + Math.round(base * (m.lead || 1)) + 'ms ' + easingOf(m);
          m.node.style.offsetDistance = '100%';
        });
        state.played = true;
        const wait = reducedMotion() ? 0 : CONFIG.ANIM.DURATION_MS;
        setTimeout(function () {
          state.locked = false;
          if (opts.onPlayEnd) opts.onPlayEnd();
        }, wait);
      },
      setLocked: function (v) { state.locked = v; },
      isPlayed: function () { return state.played; },
      // 回答後に塁へ印を付ける。ok:true＝正解の塁（緑）、false＝間違えた塁（赤）
      mark: function (baseKey, ok) {
        const b = F().BASES[baseKey];
        if (!b) return;
        g.appendChild(el('circle', {
          cx: b.x, cy: b.y, r: F().TAP_R - 6, fill: 'none',
          stroke: ok ? C().markOk : C().markNg, 'stroke-width': 4, opacity: 0.95
        }));
        if (ok) {
          // 正解の塁は塗りも薄く入れて目立たせる
          g.appendChild(el('circle', {
            cx: b.x, cy: b.y, r: F().TAP_R - 8, fill: C().markOk, opacity: 0.25
          }));
        }
      }
    };
  }

  return { render: render };
})();
