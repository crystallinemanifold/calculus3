/* Modules 1–4: the plane */
(function () {
  'use strict';
  const { el, fmt, rgba } = VC, { sin, cos, exp, hypot, max, min, abs, PI } = Math, TAU = 2 * PI;

  /* ================= 1. Line integrals ================= */
  VC.register({
    id: 'line-integrals', n: 1, group: 'Along curves', title: 'Line integrals',
    blurb: 'Add up a function, or the push of a field, along a curve.',
    formula: '\\int_C f\\,ds \\qquad \\int_C \\mathbf F\\cdot d\\mathbf r',
    init(root) {
      const pg = VC.page(root, this, {
        lede: 'A line integral adds something up along a curve $C$. For a function $f$, the total is the area of a curtain hanging from the graph of $f$ down to $C$. For a vector field $\\mathbf F$, the total is the work the field does on something that travels along $C$.',
        formula: '\\int_C f\\,ds=\\int_a^b f(\\mathbf r(t))\\,|\\mathbf r\'(t)|\\,dt \\qquad\\quad \\int_C \\mathbf F\\cdot d\\mathbf r=\\int_C \\mathbf F\\cdot\\mathbf T\\,ds',
      });
      const fs = [
        { name: 'f = 1  (flat, height 1)', f: () => 1 },
        { name: 'Hill:  f = 2.5·exp(−(x² + y²)/4)', f: (x, y) => 2.5 * exp(-(x * x + y * y) / 4) },
        { name: 'Ramp:  f = 1.6 + 0.3x + 0.2y', f: (x, y) => 1.6 + 0.3 * x + 0.2 * y },
        { name: 'Waves:  f = 1.3 + 0.8·sin x·cos y', f: (x, y) => 1.3 + 0.8 * sin(x) * cos(y) },
        { name: 'Saddle:  f = xy/2  (changes sign)', f: (x, y) => (x * y) / 2 },
      ];
      const Fs = [
        { name: 'Uniform wind:  F = ⟨1, 0.4⟩', F: () => [1, 0.4] },
        { name: 'Rotation:  F = ⟨−y, x⟩', F: (x, y) => [-y, x] },
        { name: 'Outward:  F = ⟨x, y⟩', F: (x, y) => [x, y] },
        { name: 'Shear:  F = ⟨y, 0⟩', F: (x, y) => [y, 0] },
        { name: 'Waves:  F = ⟨sin y, sin x⟩', F: (x, y) => [sin(y), sin(x)] },
      ];
      const S = { mode: 0, fi: 1, Fi: 1, T: 1, rev: false };
      const P = [{ x: -2.4, y: -1.4 }, { x: -0.9, y: 1.3 }, { x: 1, y: -0.9 }, { x: 2.4, y: 1.3 }];
      let C = [], seg = [], L = 0, total = 0, k = 0, gm = 1;
      function compute() {
        let pts = VC.spline(P, 40);
        if (S.rev) pts = pts.slice().reverse();
        const f = fs[S.fi].f, F = Fs[S.Fi].F;
        C = [pts[0]]; seg = []; let s = 0, I = 0; gm = 0.5;
        for (let i = 0; i < pts.length - 1; i++) {
          const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], ds = hypot(dx, dy);
          if (ds < 1e-9) continue;
          const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, tx = dx / ds, ty = dy / ds;
          let g; if (S.mode === 0) g = f(mx, my); else { const w = F(mx, my); g = w[0] * tx + w[1] * ty; }
          I += g * ds; seg.push({ s0: s, s1: s + ds, tx, ty, g, I }); s += ds; C.push(b); gm = max(gm, abs(g));
        }
        L = s; total = I; k = Math.round(S.T * seg.length);
      }
      const hTop = pg.pane(''), h3 = pg.pane('The curtain: its base is $C$, its height is $f$. Drag to rotate.'), hG = pg.pane('$\\mathbf F\\cdot\\mathbf T$ along the curve. The shaded area is the work so far.');
      const capTop = hTop.fig.querySelector('figcaption') || hTop.fig.appendChild(el('figcaption'));
      const plot = VC.Plot(hTop, { xmin: -3, xmax: 3, ymin: -3, ymax: 3, draw(p) {
        const c = p.c;
        if (S.mode === 0) p.heat(fs[S.fi].f, 2.6, 36, 0.5);
        p.grid();
        if (S.mode === 1) p.field(Fs[S.Fi].F, 15, { ref: 2 });
        p.path(C, rgba(c.inkRgb, 0.35), 2, [5, 5]);
        if (S.mode === 0) p.path(C.slice(0, k + 1), c.ink, 3.5);
        else for (let i = 0; i < k; i++) p.path([C[i], C[i + 1]], seg[i].g >= 0 ? c.pos : c.neg, 4.5);
        for (const fr of [0.3, 0.72]) { const i = min(seg.length - 1, Math.floor(fr * seg.length)); p.head(C[i][0], C[i][1], seg[i].tx, seg[i].ty, c.ink, 12); }
        const q = C[k], sg = seg[min(k, seg.length - 1)];
        if (S.mode === 1) {
          const w = Fs[S.Fi].F(q[0], q[1]), m = hypot(w[0], w[1]) || 1, sc = (0.5 + 0.9 * Math.tanh(m / 2)) / m;
          p.arrow(q[0], q[1], w[0] * sc, w[1] * sc, c.accent, 2.6, 9);
          p.arrow(q[0], q[1], sg.tx * 0.8, sg.ty * 0.8, c.gold, 2.6, 9);
        }
        p.dot(q[0], q[1], 6, c.gold, c.panel);
      } });
      P.forEach((h) => plot.handle(Object.assign(h, { r: 7, onmove: update })));
      const view = VC.View3D(h3, { R: 4.7, cz: 0.9, draw(v) {
        const c = v.c, f = fs[S.fi].f, grid = rgba(c.mutedRgb, 0.32);
        v.polyline([[-3, -3, 0], [3, -3, 0], [3, 3, 0], [-3, 3, 0], [-3, -3, 0]], rgba(c.mutedRgb, 0.6), 1);
        for (let a = -3; a <= 3.001; a += 0.75) for (let b = -3; b < 2.999; b += 0.375) {
          v.line([a, b, f(a, b)], [a, b + 0.375, f(a, b + 0.375)], grid, 1);
          v.line([b, a, f(b, a)], [b + 0.375, a, f(b + 0.375, a)], grid, 1);
        }
        for (let i = 0; i < k; i++) {
          const a = C[i], b = C[i + 1], fa = f(a[0], a[1]), fb = f(b[0], b[1]);
          v.poly([[a[0], a[1], 0], [b[0], b[1], 0], [b[0], b[1], fb], [a[0], a[1], fa]], rgba(seg[i].g >= 0 ? c.posRgb : c.negRgb, 0.72), null);
          v.line([a[0], a[1], fa], [b[0], b[1], fb], c.ink, 2, -0.02);
        }
        v.polyline(C.map((q) => [q[0], q[1], 0]), c.gold, 2.5, -0.02);
        v.axes(3.5);
      } });
      const graph = VC.Plot(hG, { xmin: 0, xmax: 1, ymin: -1, ymax: 1, aspect: 1, draw(p) {
        const c = p.c, ctx = p.ctx;
        p.x0 = -0.03 * L; p.x1 = L * 1.03; p.y0 = -gm * 1.2; p.y1 = gm * 1.2;
        for (let i = 0; i < k; i++) { const s = seg[i]; ctx.fillStyle = rgba(s.g >= 0 ? c.posRgb : c.negRgb, 0.6); ctx.fillRect(p.X(s.s0), p.Y(max(s.g, 0)), p.X(s.s1) - p.X(s.s0) + 0.7, abs(p.Y(s.g) - p.Y(0))); }
        p.path([[0, 0], [L, 0]], rgba(c.mutedRgb, 0.7), 1);
        p.path(seg.map((s) => [(s.s0 + s.s1) / 2, s.g]), c.ink, 2);
        p.label('F · T', p.x0, p.y1, c.muted, 10, 14);
        p.label('arc length s →', L, p.y0, c.muted, -98, -12);
      } });
      const selF = VC.select({ label: 'Function $f$', options: fs.map((x) => x.name), value: S.fi, onchange: (i) => { S.fi = i; update(); } });
      const selV = VC.select({ label: 'Vector field $\\mathbf F$', options: Fs.map((x) => x.name), value: S.Fi, onchange: (i) => { S.Fi = i; update(); } });
      const sT = VC.slider({ label: 'Travel along $C$', min: 0, max: 1, step: 0.005, value: 1, fmt: (x) => Math.round(x * 100) + '%', oninput: (x) => { S.T = x; update(); } });
      let stop = null;
      const play = VC.button('Play from the start', () => {
        if (stop) stop();
        S.T = 0;
        stop = VC.loop((dt) => { S.T = min(1, S.T + dt / 4); sT.set(S.T); update(); if (S.T >= 1) { stop(); stop = null; } });
      });
      const r1 = VC.readout('', 'a'), r2 = VC.readout(''), r3 = VC.readout('Length of $C$', 'sm');
      const leg = el('div');
      pg.panel.append(
        VC.seg({ options: ['Scalar  $\\int f\\,ds$', 'Vector  $\\int \\mathbf F\\cdot d\\mathbf r$'], onchange: (i) => { S.mode = i; update(); } }),
        selF, selV, sT, play,
        VC.check({ label: 'Reverse the direction of $C$', onchange: (b) => { S.rev = b; update(); } }),
        el('hr'), r1.el, r2.el, r3.el, leg);
      function update() {
        compute();
        const sc = S.mode === 0;
        selF.hidden = !sc; selV.hidden = sc; h3.fig.hidden = !sc; hG.fig.hidden = sc;
        capTop.replaceChildren(VC.rich(sc ? 'Top view. Color shows $f$. Drag the four points to reshape $C$.' : 'Blue arrow: $\\mathbf F$. Gold arrow: unit tangent $\\mathbf T$. Drag the points to reshape $C$.'));
        r1.el.firstChild.replaceChildren(VC.rich(sc ? '$\\int f\\,ds$ so far' : 'Work so far'));
        r2.el.firstChild.replaceChildren(VC.rich(sc ? '$\\int_C f\\,ds$ over all of $C$' : '$\\int_C \\mathbf F\\cdot d\\mathbf r$ over all of $C$'));
        r1.set(fmt(k ? seg[k - 1].I : 0)); r2.set(fmt(total)); r3.set(fmt(L));
        leg.replaceChildren(VC.legend(sc ? [['pos', '$f>0$'], ['neg', '$f<0$']] : [['pos', 'field helps ($\\mathbf F\\cdot\\mathbf T>0$)'], ['neg', 'field resists']]));
        plot.redraw(); view.redraw(); graph.redraw();
      }
      update();
      pg.tries([
        'Choose $f = 1$. The integral now equals the length of $C$. Why does that make sense for a curtain of height 1?',
        'With the hill selected, drag the curve so it passes over the top of the hill, then so it stays out in the flat part. Predict which gives the larger integral before you look.',
        'Check the box to reverse $C$. The scalar integral does not change. Switch to the vector integral and try again. What happens, and why?',
        'In vector mode, pick the rotation field. Reshape $C$ so the work is as large as you can make it. Then find a curve with a work of about 0.',
        'Pick the uniform wind. Move only the two middle points. The work does not change. The next module explains why.',
      ]);
    },
  });

  /* ================= 2. Conservative fields ================= */
  VC.register({
    id: 'conservative-fields', n: 2, group: 'Along curves', title: 'Conservative vector fields',
    blurb: 'When does the work depend only on where you start and stop?',
    formula: '\\int_C \\nabla f\\cdot d\\mathbf r=f(\\mathbf r(b))-f(\\mathbf r(a))',
    init(root) {
      const pg = VC.page(root, this, {
        lede: 'A field is conservative when it is the gradient of some function $f$, called a potential. Then the work from $A$ to $B$ is the same along every path, and the work around any closed loop is zero. Two paths below share their endpoints. Compare them.',
        formula: '\\mathbf F=\\nabla f \\;\\Longrightarrow\\; \\int_C \\mathbf F\\cdot d\\mathbf r=f(B)-f(A) \\quad\\text{and}\\quad \\oint \\mathbf F\\cdot d\\mathbf r=0',
      });
      const hill = (x, y) => 3 * exp(-(x * x + y * y) / 3);
      const fields = [
        { name: 'F = ⟨x, y⟩', F: (x, y) => [x, y], f: (x, y) => (x * x + y * y) / 2, fmax: 9, ptex: 'f=\\tfrac12(x^2+y^2)' },
        { name: 'F = ⟨y, x⟩', F: (x, y) => [y, x], f: (x, y) => x * y, fmax: 7, ptex: 'f=xy' },
        { name: 'F = ∇(hill),  hill = 3·exp(−(x² + y²)/3)', F: (x, y) => { const h = hill(x, y); return [(-2 * x / 3) * h, (-2 * y / 3) * h]; }, f: hill, fmax: 3, ptex: 'f=3e^{-(x^2+y^2)/3}' },
        { name: 'F = ⟨−y, x⟩  (rotation)', F: (x, y) => [-y, x], why: 'This field has curl 2 everywhere, so no potential exists. A path that goes with the rotation collects more work.' },
        { name: 'F = ⟨y, 0⟩  (shear)', F: (x, y) => [y, 0], why: 'Here $\\partial Q/\\partial x=0$ but $\\partial P/\\partial y=1$, so the field fails the test for a potential.' },
        { name: 'F = ⟨−y, x⟩/(x² + y²)  (vortex)', vortex: true, F: (x, y) => { const r2 = max(x * x + y * y, 0.02); return [-y / r2, x / r2]; }, why: 'This one passes the test $\\partial Q/\\partial x=\\partial P/\\partial y$ everywhere except the origin, where it is undefined. Paths that pass on the same side of the origin agree. Paths that go around opposite sides differ by $2\\pi$.' },
      ];
      const S = { fi: 0, pot: true };
      const A = { x: -1, y: -0.8, label: 'A' }, B = { x: 2.2, y: 1.3, label: 'B' };
      const w1 = [{ x: -1.2, y: 1.2 }, { x: 0.8, y: 2.3 }], w2 = [{ x: 0.4, y: -2 }, { x: 2.2, y: -0.9 }];
      let P1 = [], P2 = [];
      const host = pg.pane('Drag $A$, $B$ and the small points on each path. Path 1 is blue, path 2 is gold.');
      const plot = VC.Plot(host, { xmin: -3, xmax: 3, ymin: -3, ymax: 3, draw(p) {
        const c = p.c, fd = fields[S.fi];
        if (S.pot && fd.f) p.heat(fd.f, fd.fmax, 40, 0.5);
        p.grid();
        p.field(fd.F, 15, { ref: 2 });
        [[P1, c.accent], [P2, c.gold]].forEach(([pts, col]) => {
          p.path(pts, col, 3.5);
          const i = Math.floor(pts.length / 2);
          p.head(pts[i][0], pts[i][1], pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1], col, 14);
        });
      } });
      w1.forEach((h) => plot.handle(Object.assign(h, { r: 6, color: (c) => c.accent, onmove: update })));
      w2.forEach((h) => plot.handle(Object.assign(h, { r: 6, color: (c) => c.gold, onmove: update })));
      [A, B].forEach((h) => plot.handle(Object.assign(h, { r: 9, onmove: update })));
      const rA = VC.readout('Work along path 1', 'a'), rB = VC.readout('Work along path 2', 'g');
      const rL = VC.readout('Loop: out on path 1, back on path 2', 'sm'), rF = VC.readout('$f(B)-f(A)$', 'sm');
      const pill = VC.pill(), why = el('p', { class: 'note' });
      const chk = VC.check({ label: 'Color the plane by the potential $f$', checked: true, onchange: (b) => { S.pot = b; plot.redraw(); } });
      pg.panel.append(VC.select({ label: 'Vector field', options: fields.map((x) => x.name), onchange: (i) => { S.fi = i; update(); } }),
        chk, el('hr'), rA.el, rB.el, rL.el, rF.el, pill.el, why);
      function update() {
        const fd = fields[S.fi];
        P1 = VC.spline([A, w1[0], w1[1], B], 60); P2 = VC.spline([A, w2[0], w2[1], B], 60);
        const W = (pts) => (fd.vortex ? (VC.minDist(pts) < 0.02 ? NaN : VC.vortexWork(pts)) : VC.work2(fd.F, pts)), a = W(P1), b = W(P2);
        rA.set(fmt(a)); rB.set(fmt(b)); rL.set(fmt(a - b));
        rF.el.hidden = !fd.f; chk.hidden = !fd.f;
        if (fd.f) rF.set(fmt(fd.f(B.x, B.y) - fd.f(A.x, A.y)));
        pill.set(fd.f ? 'Conservative: path independent' : 'Not conservative: the path matters', fd.f ? 'yes' : 'no');
        why.replaceChildren(VC.rich(fd.f ? 'Potential: $' + fd.ptex + '$. Warm colors are high $f$, cool colors are low. The work only cares about the color at $A$ and at $B$.' : fd.why));
        plot.redraw();
      }
      update();
      pg.tries([
        'With $\\mathbf F=\\langle x, y\\rangle$, bend both paths as wildly as you like. The two work values stay equal, and they match $f(B)-f(A)$.',
        'Drag $B$ on top of $A$. What is the work around a closed loop in a conservative field?',
        'Leave $A$ where it is and find a spot for $B$, away from $A$, where the work is zero. What do $A$ and $B$ have in common? (Look at the colors.)',
        'Switch to the rotation field. Make one path go with the arrows and the other against them. How different can you make the two answers?',
        'Try the vortex. Keep both paths above the origin and the values agree. Now send one path below the origin. The loop value jumps to about $\\pm 6.283$. Where have you seen that number?',
      ]);
    },
  });

  /* ================= 3. Curl and divergence ================= */
  VC.register({
    id: 'curl-divergence', n: 3, group: 'Fields up close', title: 'Curl and divergence',
    blurb: 'Two ways to measure a field at a point: how much it spins and how much it spreads.',
    formula: '\\operatorname{curl}\\mathbf F=\\nabla\\times\\mathbf F \\qquad \\operatorname{div}\\mathbf F=\\nabla\\cdot\\mathbf F',
    init(root) {
      const pg = VC.page(root, this, {
        lede: 'Think of the field as the velocity of a fluid. Drop a tiny paddle wheel in the flow: curl tells you how fast it spins. Release a tiny ring of dye: divergence tells you whether the ring grows or shrinks. Both are measured at a single point.',
        formula: '\\mathbf F=\\langle P,Q\\rangle:\\qquad \\operatorname{curl}\\mathbf F\\cdot\\mathbf k=\\frac{\\partial Q}{\\partial x}-\\frac{\\partial P}{\\partial y} \\qquad \\operatorname{div}\\mathbf F=\\frac{\\partial P}{\\partial x}+\\frac{\\partial Q}{\\partial y}',
      });
      const fields = [
        { name: 'Rotation:  ⟨−y, x⟩', F: (x, y) => [-y, x], curl: () => 2, div: () => 0 },
        { name: 'Source:  ⟨x, y⟩', F: (x, y) => [x, y], curl: () => 0, div: () => 2 },
        { name: 'Sink:  ⟨−x, −y⟩', F: (x, y) => [-x, -y], curl: () => 0, div: () => -2 },
        { name: 'Shear:  ⟨y, 0⟩', F: (x, y) => [y, 0], curl: () => -1, div: () => 0 },
        { name: 'Spiral:  ⟨x − y, x + y⟩', F: (x, y) => [x - y, x + y], curl: () => 2, div: () => 2 },
        { name: 'Vortex:  ⟨−y, x⟩/(x² + y²)', vortex: true, F: (x, y) => { const r2 = max(x * x + y * y, 0.03); return [-y / r2, x / r2]; }, curl: () => 0, div: () => 0 },
        { name: 'Waves:  ⟨sin y, sin x⟩', F: (x, y) => [sin(y), sin(x)], curl: (x, y) => cos(x) - cos(y), div: () => 0 },
        { name: 'Pulses:  ⟨sin x, sin y⟩', F: (x, y) => [sin(x), sin(y)], curl: () => 0, div: (x, y) => cos(x) + cos(y) },
      ];
      const S = { fi: 0, bg: 0, r: 0.7, anim: !VC.reduced };
      const probe = { x: 1.2, y: 0.8, r: 7, color: (c) => c.gold, onmove: update };
      const B = 3.2, parts = [];
      for (let i = 0; i < 240; i++) parts.push({ x: (Math.random() * 2 - 1) * B, y: (Math.random() * 2 - 1) * B, life: Math.random() * 3 });
      let theta = 0, tau = 0.5;
      const host = pg.pane('Drag the gold point. The wheel spins at half the curl. The dotted ring grows where divergence is positive and shrinks where it is negative.');
      const plot = VC.Plot(host, { xmin: -B, xmax: B, ymin: -B, ymax: B, draw(p) {
        const c = p.c, ctx = p.ctx, fd = fields[S.fi];
        if (S.bg) p.heat(S.bg === 1 ? fd.curl : fd.div, 2, 44, 0.6);
        p.grid();
        p.field(fd.F, 14, { ref: 2, alpha: 0.7 });
        ctx.lineCap = 'round'; ctx.lineWidth = 1.6;
        for (const q of parts) {
          const f = fd.F(q.x, q.y), a = min(1, q.life, 3 - q.life) * 0.8;
          if (a <= 0) continue;
          ctx.strokeStyle = rgba(c.accentRgb, a);
          ctx.beginPath(); ctx.moveTo(p.X(q.x - f[0] * 0.07), p.Y(q.y - f[1] * 0.07)); ctx.lineTo(p.X(q.x), p.Y(q.y)); ctx.stroke();
        }
        const x = probe.x, y = probe.y, r = S.r, k = p.X(r) - p.X(0), cx = p.X(x), cy = p.Y(y);
        ctx.setLineDash([4, 4]); ctx.strokeStyle = rgba(c.inkRgb, 0.6); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(cx, cy, k, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
        const dv = fd.div(x, y), rr = k * exp(dv * 0.3 * (tau - 0.5)), col = abs(dv) < 0.02 ? c.mutedRgb : dv > 0 ? c.posRgb : c.negRgb;
        for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; ctx.beginPath(); ctx.arc(cx + rr * cos(a), cy + rr * sin(a), 3, 0, TAU); ctx.fillStyle = rgba(col, 0.35 + 0.65 * sin(PI * tau)); ctx.fill(); }
        const bl = k * 0.62;
        for (let i = 0; i < 4; i++) {
          const a = -theta + (i * PI) / 2;
          ctx.strokeStyle = i === 0 ? c.gold : c.ink; ctx.lineWidth = 3.5;
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + bl * cos(a), cy + bl * sin(a)); ctx.stroke();
        }
      } });
      plot.handle(probe);
      const rC = VC.readout('Curl at the point', 'a'), rD = VC.readout('Divergence at the point', 'a');
      const rCa = VC.readout('Circulation around the ring ÷ its area', 'sm'), rDa = VC.readout('Flow out of the ring ÷ its area', 'sm');
      const vnote = el('p', { class: 'note' });
      pg.panel.append(
        VC.select({ label: 'Vector field', options: fields.map((x) => x.name), onchange: (i) => { S.fi = i; update(); } }),
        VC.seg({ label: 'Color the plane by', options: ['Nothing', 'Curl', 'Divergence'], onchange: (i) => { S.bg = i; plot.redraw(); } }),
        VC.slider({ label: 'Ring radius', min: 0.15, max: 1.5, step: 0.05, value: S.r, fmt: (x) => x.toFixed(2), oninput: (x) => { S.r = x; update(); } }),
        VC.check({ label: 'Animate the flow', checked: S.anim, onchange: (b) => { S.anim = b; } }),
        el('hr'), rC.el, rCa.el, rD.el, rDa.el, vnote,
        VC.legend([['pos', 'positive'], ['neg', 'negative']]));
      function update() {
        const fd = fields[S.fi], x = probe.x, y = probe.y, r = S.r, n = 180;
        let circ = 0, flux = 0;
        for (let i = 0; i < n; i++) {
          const a = ((i + 0.5) / n) * TAU, f = fd.F(x + r * cos(a), y + r * sin(a)), ds = (TAU * r) / n;
          circ += (-f[0] * sin(a) + f[1] * cos(a)) * ds; flux += (f[0] * cos(a) + f[1] * sin(a)) * ds;
        }
        const A = PI * r * r, d0 = hypot(x, y), atOrigin = fd.vortex && d0 < 0.1;
        if (fd.vortex) {
          /* exact: circulation is the winding of the ring around the origin, flux is 0 */
          const onRing = abs(d0 - r) < 0.02;
          circ = onRing ? NaN : d0 < r ? TAU : 0; flux = onRing ? NaN : 0;
        }
        rC.set(atOrigin ? 'undefined' : fmt(fd.curl(x, y), 2)); rD.set(atOrigin ? 'undefined' : fmt(fd.div(x, y), 2));
        rCa.set(fmt(circ / A, 3)); rDa.set(fmt(flux / A, 3));
        vnote.replaceChildren(fd.vortex ? VC.rich(d0 < r - 0.02
          ? 'The ring goes around the origin, where $\\mathbf F$ is undefined. The circulation is $2\\pi$ for every such ring, so circulation ÷ area is $2/r^2$. It grows as the ring shrinks instead of approaching the curl.'
          : 'The flow goes around the origin, but the curl is 0 at every point except the origin. The fluid moves faster near the center, and on its own that would turn the wheel clockwise. The bending of the flow around the origin would turn it counterclockwise. The two effects cancel exactly.') : '');
        plot.redraw();
      }
      VC.loop((dt, t) => {
        if (!S.anim) return;
        const fd = fields[S.fi];
        for (const q of parts) {
          const f = fd.F(q.x, q.y), m = hypot(f[0], f[1]), s = m > 3 ? 3 / m : 1;
          q.x += f[0] * s * dt * 0.6; q.y += f[1] * s * dt * 0.6; q.life -= dt;
          if (q.life < 0 || abs(q.x) > B || abs(q.y) > B) { q.x = (Math.random() * 2 - 1) * B; q.y = (Math.random() * 2 - 1) * B; q.life = 3; }
        }
        theta += (fd.curl(probe.x, probe.y) / 2) * dt * 1.5;
        tau = (t * 0.55) % 1;
        plot.redraw();
      });
      update();
      pg.tries([
        'Rotation field: the wheel spins the same way at every point, even far from the center. Curl is about spinning in place, not about orbiting the origin.',
        'Shear: the arrows are all straight and parallel, yet the wheel turns. Look at the arrows just above and just below the wheel to see why. Which way does it turn, and what sign is the curl?',
        'Vortex: the fluid clearly goes around the origin, yet the wheel does not spin anywhere you can put it. Now move the ring so the origin is inside it and read "circulation ÷ area". Shrink the ring. What is special about the origin?',
        'Waves: color the plane by curl, then find a point where the wheel spins counterclockwise, one where it spins clockwise, and one where it stops.',
        'Pick any field and shrink the ring radius toward 0. The two "÷ area" numbers approach the curl and the divergence. That limit is what curl and divergence mean, and it is the idea behind Green\'s theorem in the next module.',
      ]);
    },
  });

  /* ================= 4. Green's theorem ================= */
  VC.register({
    id: 'greens-theorem', n: 4, group: 'Fields up close', title: "Green's theorem",
    blurb: 'Circulation around the boundary equals all the little spins inside, added up.',
    formula: '\\oint_C P\\,dx+Q\\,dy=\\iint_D\\left(\\frac{\\partial Q}{\\partial x}-\\frac{\\partial P}{\\partial y}\\right)dA',
    init(root) {
      const pg = VC.page(root, this, {
        lede: 'Cut a region $D$ into small cells. Each cell has its own small circulation, about curl × area. Where two cells share an edge, their circulations run in opposite directions and cancel. Only the outer boundary $C$ survives. The same picture works for flow across the boundary, with divergence in place of curl.',
        formula: '\\oint_C \\mathbf F\\cdot d\\mathbf r=\\iint_D\\left(\\frac{\\partial Q}{\\partial x}-\\frac{\\partial P}{\\partial y}\\right)dA \\qquad\\quad \\oint_C \\mathbf F\\cdot\\mathbf n\\,ds=\\iint_D \\operatorname{div}\\mathbf F\\,dA',
      });
      const fields = [
        { name: 'F = ⟨−y, x⟩   (curl 2, div 0)', F: (x, y) => [-y, x], curl: () => 2, div: () => 0 },
        { name: 'F = ⟨0, x⟩   (curl 1, div 0)', F: (x) => [0, x], curl: () => 1, div: () => 0 },
        { name: 'F = ⟨x, y⟩   (curl 0, div 2)', F: (x, y) => [x, y], curl: () => 0, div: () => 2 },
        { name: 'F = ⟨−y²/2, x²/2⟩   (curl x + y)', F: (x, y) => [(-y * y) / 2, (x * x) / 2], curl: (x, y) => x + y, div: () => 0 },
        { name: 'F = ⟨x²/2, y²/2⟩   (div x + y)', F: (x, y) => [(x * x) / 2, (y * y) / 2], curl: () => 0, div: (x, y) => x + y },
        { name: 'F = ⟨sin y, sin x⟩   (curl cos x − cos y)', F: (x, y) => [sin(y), sin(x)], curl: (x, y) => cos(x) - cos(y), div: () => 0 },
      ];
      const shapes = [
        { name: 'Disk', rho: () => 1, ext: 1 },
        { name: 'Square', rho: (t) => 1 / max(abs(cos(t)), abs(sin(t))), ext: 1 },
        { name: 'Ellipse', rho: (t) => 1 / hypot(cos(t) / 1.3, sin(t) / 0.7), ext: 1.3 },
        { name: 'Blob', rho: (t) => 1 + 0.25 * cos(3 * t), ext: 1.25 },
      ];
      const S = { fi: 0, sh: 0, mode: 0, n: 6, s: 1.6 };
      const ctr = { x: 0, y: 0, r: 7, lim: [-1.6, 1.6, -1.6, 1.6], onmove: update };
      let bd = [], cells = [], cell = 1;
      const g = () => (S.mode === 0 ? fields[S.fi].curl : fields[S.fi].div);
      const host = pg.pane('Drag the center point to move the region. Each cell is colored by the curl (or divergence) at its center.');
      const plot = VC.Plot(host, { xmin: -4, xmax: 4, ymin: -4, ymax: 4, draw(p) {
        const c = p.c, ctx = p.ctx, fd = fields[S.fi], px = p.X(cell) - p.X(0);
        p.grid();
        for (const q of cells) {
          ctx.fillStyle = rgba(VC.divRgb(c, q.g / 2.5), 0.85);
          ctx.fillRect(p.X(q.x - cell / 2), p.Y(q.y + cell / 2), px, px);
          ctx.strokeStyle = rgba(c.mutedRgb, 0.5); ctx.lineWidth = 1; ctx.strokeRect(p.X(q.x - cell / 2), p.Y(q.y + cell / 2), px, px);
        }
        p.field(fd.F, 16, { ref: 2.5, alpha: 0.75 });
        if (S.n <= 10) for (const q of cells) {
          if (abs(q.g) < 0.05) continue;
          const cx = p.X(q.x), cy = p.Y(q.y), R = px * 0.27, col = rgba(c.inkRgb, 0.75);
          ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1.6;
          if (S.mode === 0) {
            const ccw = q.g > 0, ey = ccw ? cy + R : cy - R;
            ctx.beginPath(); if (ccw) ctx.arc(cx, cy, R, 0, -1.5 * PI, true); else ctx.arc(cx, cy, R, 0, 1.5 * PI, false); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx + 6, ey); ctx.lineTo(cx - 2, ey - 4.5); ctx.lineTo(cx - 2, ey + 4.5); ctx.closePath(); ctx.fill();
          } else for (let i = 0; i < 4; i++) {
            const a = (i * PI) / 2 + PI / 4, r0 = q.g > 0 ? R * 0.35 : R * 1.15, r1 = q.g > 0 ? R * 1.15 : R * 0.35;
            p.arrow(q.x + (r0 * cos(a)) / px * cell, q.y + (r0 * sin(a)) / px * cell, ((r1 - r0) * cos(a)) / px * cell, ((r1 - r0) * sin(a)) / px * cell, col, 1.5, 5);
          }
        }
        p.path(bd, c.gold, 4, null, true);
        const N = bd.length;
        if (S.mode === 0) for (let i = 0; i < 6; i++) { const j = Math.floor(((i + 0.5) / 6) * N), a = bd[j], b = bd[(j + 1) % N]; p.head(a[0], a[1], b[0] - a[0], b[1] - a[1], c.gold, 15); }
        else for (let i = 0; i < 16; i++) { const j = Math.floor(((i + 0.5) / 16) * N), a = bd[j], b = bd[(j + 1) % N], m = hypot(b[0] - a[0], b[1] - a[1]) || 1; p.arrow(a[0], a[1], ((b[1] - a[1]) / m) * 0.4, (-(b[0] - a[0]) / m) * 0.4, c.gold, 2, 7); }
      } });
      plot.handle(ctr);
      const rB = VC.readout('', 'g'), rS = VC.readout('', 'a'), rE = VC.readout('Difference', 'sm'), rN = VC.readout('Cells inside the region', 'sm');
      pg.panel.append(
        VC.seg({ options: ['Circulation and curl', 'Flux and divergence'], onchange: (i) => { S.mode = i; update(); } }),
        VC.select({ label: 'Vector field', options: fields.map((x) => x.name), onchange: (i) => { S.fi = i; update(); } }),
        VC.select({ label: 'Region $D$', options: shapes.map((x) => x.name), onchange: (i) => { S.sh = i; update(); } }),
        VC.slider({ label: 'Size of the region', min: 0.6, max: 2.2, step: 0.05, value: S.s, fmt: (x) => x.toFixed(2), oninput: (x) => { S.s = x; update(); } }),
        VC.slider({ label: 'Cells across', min: 2, max: 60, step: 1, value: S.n, oninput: (x) => { S.n = x; update(); } }),
        el('hr'), rB.el, rS.el, rE.el, rN.el, VC.legend([['pos', 'positive'], ['neg', 'negative'], ['gold', 'boundary $C$']]));
      function update() {
        const fd = fields[S.fi], sh = shapes[S.sh], M = 720, gf = g();
        bd = [];
        for (let i = 0; i < M; i++) { const t = (i / M) * TAU, r = S.s * sh.rho(t); bd.push([ctr.x + r * cos(t), ctr.y + r * sin(t)]); }
        let line = 0;
        for (let i = 0; i < M; i++) {
          const a = bd[i], b = bd[(i + 1) % M], f = fd.F((a[0] + b[0]) / 2, (a[1] + b[1]) / 2), dx = b[0] - a[0], dy = b[1] - a[1];
          line += S.mode === 0 ? f[0] * dx + f[1] * dy : f[0] * dy - f[1] * dx;
        }
        const half = S.s * sh.ext; cell = (2 * half) / S.n; cells = []; let sum = 0;
        for (let i = 0; i < S.n; i++) for (let j = 0; j < S.n; j++) {
          const dx = -half + (i + 0.5) * cell, dy = -half + (j + 0.5) * cell;
          if (hypot(dx, dy) > S.s * sh.rho(Math.atan2(dy, dx)) + 1e-9) continue;
          const q = { x: ctr.x + dx, y: ctr.y + dy }; q.g = gf(q.x, q.y); sum += q.g * cell * cell; cells.push(q);
        }
        rB.el.firstChild.replaceChildren(VC.rich(S.mode === 0 ? 'Around the boundary: $\\oint_C \\mathbf F\\cdot d\\mathbf r$' : 'Out across the boundary: $\\oint_C \\mathbf F\\cdot\\mathbf n\\,ds$'));
        rS.el.firstChild.replaceChildren(VC.rich(S.mode === 0 ? 'Inside: sum of curl × cell area' : 'Inside: sum of div × cell area'));
        rB.set(fmt(line)); rS.set(fmt(sum)); rE.set(fmt(line - sum)); rN.set(String(cells.length));
        plot.redraw();
      }
      update();
      pg.tries([
        'Start with the disk and $\\langle -y, x\\rangle$. With few cells the inside sum misses the curved edge. Slide "cells across" up and watch the two numbers meet.',
        'At a low cell count, look at two neighboring cells. Along the edge they share, their little arrows point in opposite directions. That cancellation is the whole proof.',
        'Pick $\\langle 0, x\\rangle$. Its curl is 1, so the circulation equals the area of $D$. Check it for the disk: is the number $\\pi\\cdot(\\text{size})^2$? This is how a line integral can measure area.',
        'Pick $\\langle -y^2/2, x^2/2\\rangle$ with the region centered at the origin. The circulation is 0. Why, given the colors? Now drag the region up and to the right.',
        'Switch to "flux and divergence" with $\\langle x, y\\rangle$, then with $\\langle -y, x\\rangle$. Which field pushes fluid out of the region, and which only moves it around inside?',
      ]);
    },
  });
})();
