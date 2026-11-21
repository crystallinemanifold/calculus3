/* Modules 5–8: surfaces and space */
(function () {
  'use strict';
  const { el, fmt, rgba, V } = VC, { sin, cos, hypot, max, min, abs, tanh, PI } = Math, TAU = 2 * PI;
  const piLabel = (x) => {
    const k = x / (PI / 2);
    if (abs(k - Math.round(k)) < 1e-6) { const m = Math.round(k); return ({ 0: '0', 1: 'π/2', 2: 'π', 3: '3π/2', 4: '2π', '-1': '−π/2', '-2': '−π' })[m] || fmt(x, 1); }
    return fmt(x, 1);
  };
  const vec3 = (a, d) => '⟨' + a.map((x) => fmt(x, d == null ? 2 : d)).join(', ') + '⟩';

  /* ================= 5. Parametric surfaces ================= */
  VC.register({
    id: 'parametric-surfaces', n: 5, group: 'Surfaces', title: 'Parametric surfaces',
    blurb: 'A flat rectangle of inputs gets bent into a surface in space.',
    formula: '\\mathbf r(u,v)=\\langle x(u,v),\\,y(u,v),\\,z(u,v)\\rangle',
    init(root) {
      const pg = VC.page(root, this, {
        lede: 'A parametric surface is a function that takes a point $(u, v)$ from a flat region and returns a point in space. Move the point in the flat $uv$-rectangle on the left and watch where it lands on the surface. Holding $v$ fixed and changing $u$ traces one curve on the surface. Holding $u$ fixed traces another.',
        formula: '\\mathbf r(u,v)=\\langle x(u,v),\\,y(u,v),\\,z(u,v)\\rangle \\qquad dS=|\\mathbf r_u\\times\\mathbf r_v|\\,du\\,dv',
      });
      const surfs = [
        { name: 'Plane', tex: '\\langle u,\\; v,\\; 0.5u+0.25v\\rangle', r: (u, v) => [u, v, 0.5 * u + 0.25 * v], U: [-2, 2], V: [-2, 2] },
        { name: 'Cylinder', tex: '\\langle 1.5\\cos u,\\; 1.5\\sin u,\\; v\\rangle', r: (u, v) => [1.5 * cos(u), 1.5 * sin(u), v], U: [0, TAU], V: [-1.5, 1.5] },
        { name: 'Sphere', tex: '\\langle 2\\sin v\\cos u,\\; 2\\sin v\\sin u,\\; 2\\cos v\\rangle', r: (u, v) => [2 * sin(v) * cos(u), 2 * sin(v) * sin(u), 2 * cos(v)], U: [0, TAU], V: [0, PI] },
        { name: 'Cone', tex: '\\langle v\\cos u,\\; v\\sin u,\\; v\\rangle', r: (u, v) => [v * cos(u), v * sin(u), v], U: [0, TAU], V: [0, 2] },
        { name: 'Paraboloid', tex: '\\langle v\\cos u,\\; v\\sin u,\\; v^2/2\\rangle', r: (u, v) => [v * cos(u), v * sin(u), (v * v) / 2], U: [0, TAU], V: [0, 2] },
        { name: 'Torus', tex: '\\langle (1.6+0.6\\cos v)\\cos u,\\; (1.6+0.6\\cos v)\\sin u,\\; 0.6\\sin v\\rangle', r: (u, v) => [(1.6 + 0.6 * cos(v)) * cos(u), (1.6 + 0.6 * cos(v)) * sin(u), 0.6 * sin(v)], U: [0, TAU], V: [0, TAU] },
        { name: 'Helicoid (spiral ramp)', tex: '\\langle v\\cos u,\\; v\\sin u,\\; (u-\\pi)/2\\rangle', r: (u, v) => [v * cos(u), v * sin(u), (u - PI) / 2], U: [0, TAU], V: [0, 2] },
      ];
      const S = { si: 2, fu: 1, fv: 1, vec: true };
      const pt = { x: 0, y: 0, r: 8, color: (c) => c.gold, onmove: update };
      const NU = 12, NV = 8;
      const hD = pg.pane('The $uv$-rectangle. Drag the gold point.'), h3 = pg.pane('The surface. Drag to rotate.');
      const dom = VC.Plot(hD, { xmin: 0, xmax: 1, ymin: 0, ymax: 1, aspect: 1, draw(p) {
        const c = p.c, ctx = p.ctx, s = surfs[S.si], [u0, u1] = s.U, [v0, v1] = s.V, ue = u0 + S.fu * (u1 - u0), ve = v0 + S.fv * (v1 - v0);
        const pu = 0.14 * (u1 - u0), pv = 0.14 * (v1 - v0);
        p.x0 = u0 - pu; p.x1 = u1 + pu; p.y0 = v0 - pv; p.y1 = v1 + pv;
        const rect = (a, b, d, e, fill, stroke) => { ctx.beginPath(); ctx.rect(p.X(a), p.Y(e), p.X(d) - p.X(a), p.Y(b) - p.Y(e)); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); } };
        rect(u0, v0, u1, v1, rgba(c.mutedRgb, 0.1), rgba(c.mutedRgb, 0.6));
        rect(u0, v0, ue, ve, rgba(c.surfRgb, 0.6), c.ink);
        for (let i = 1; i < NU; i++) { const u = u0 + (i / NU) * (u1 - u0); if (u < ue) p.path([[u, v0], [u, ve]], rgba(c.inkRgb, 0.18), 1); }
        for (let j = 1; j < NV; j++) { const v = v0 + (j / NV) * (v1 - v0); if (v < ve) p.path([[u0, v], [ue, v]], rgba(c.inkRgb, 0.18), 1); }
        p.path([[u0, pt.y], [u1, pt.y]], c.pos, 2.5); p.path([[pt.x, v0], [pt.x, v1]], c.neg, 2.5);
        const du = (u1 - u0) / NU, dv = (v1 - v0) / NV;
        rect(pt.x - du / 2, pt.y - dv / 2, pt.x + du / 2, pt.y + dv / 2, rgba(c.goldRgb, 0.55), c.gold);
        p.label('u = ' + piLabel(u0), u0, v0, c.muted, -4, 14); p.label('u = ' + piLabel(u1), u1, v0, c.muted, -44, 14);
        p.label('v = ' + piLabel(v1), u0, v1, c.muted, -4, -12); p.label('v = ' + piLabel(v0), u1, v0, c.muted, 4, -10);
      } });
      dom.handle(pt);
      const view = VC.View3D(h3, { R: 3.3, draw(v) {
        const c = v.c, s = surfs[S.si], [u0, u1] = s.U, [v0, v1] = s.V, ue = u0 + S.fu * (u1 - u0), ve = v0 + S.fv * (v1 - v0);
        const nu = max(2, Math.round(28 * S.fu)), nv = max(2, Math.round(16 * S.fv));
        for (const q of VC.patches(s.r, [u0, ue], [v0, ve], nu, nv)) v.poly(q.q, rgba(v.shade(c.surfRgb, q.n), 0.93), rgba(c.inkRgb, 0.16), 1);
        const cu = [], cv = [];
        for (let i = 0; i <= 60; i++) { cu.push(s.r(u0 + (i / 60) * (ue - u0), pt.y)); cv.push(s.r(pt.x, v0 + (i / 60) * (ve - v0))); }
        v.polyline(cu, c.pos, 2.5, -0.04); v.polyline(cv, c.neg, 2.5, -0.04);
        const du = (u1 - u0) / NU, dv = (v1 - v0) / NV, P = s.r(pt.x, pt.y);
        v.poly([s.r(pt.x - du / 2, pt.y - dv / 2), s.r(pt.x + du / 2, pt.y - dv / 2), s.r(pt.x + du / 2, pt.y + dv / 2), s.r(pt.x - du / 2, pt.y + dv / 2)], rgba(c.goldRgb, 0.85), c.gold, 1.5, -0.06);
        if (S.vec) {
          const g = geo();
          v.arrow(P, V.mul(g.ru, 0.55), c.pos, 3, -0.3, 9); v.arrow(P, V.mul(g.rv, 0.55), c.neg, 3, -0.3, 9);
          v.arrow(P, V.mul(V.unit(g.N), 0.9), c.ink, 2.5, -0.3, 9);
        }
        v.dot(P, 5, c.gold, -0.4);
        v.axes(2.9);
      } });
      function geo() {
        const s = surfs[S.si], h = 1e-4;
        const ru = V.mul(V.sub(s.r(pt.x + h, pt.y), s.r(pt.x - h, pt.y)), 1 / (2 * h)), rv = V.mul(V.sub(s.r(pt.x, pt.y + h), s.r(pt.x, pt.y - h)), 1 / (2 * h));
        return { ru, rv, N: V.cross(ru, rv) };
      }
      const eq = el('div', { class: 'note', style: 'overflow-x:auto' });
      const rU = VC.readout('$(u, v)$', 'sm'), rP = VC.readout('Point $\\mathbf r(u,v)$', 'sm'), rS = VC.readout('Stretch factor $|\\mathbf r_u\\times\\mathbf r_v|$', 'a');
      pg.panel.append(
        VC.select({ label: 'Surface', options: surfs.map((x) => x.name), value: S.si, onchange: (i) => { S.si = i; reset(); update(); } }), eq,
        VC.slider({ label: 'Let $u$ run this far', min: 0.05, max: 1, step: 0.01, value: 1, fmt: (x) => Math.round(x * 100) + '%', oninput: (x) => { S.fu = x; update(); } }),
        VC.slider({ label: 'Let $v$ run this far', min: 0.05, max: 1, step: 0.01, value: 1, fmt: (x) => Math.round(x * 100) + '%', oninput: (x) => { S.fv = x; update(); } }),
        VC.check({ label: 'Show $\\mathbf r_u$, $\\mathbf r_v$ and the normal', checked: true, onchange: (b) => { S.vec = b; view.redraw(); } }),
        el('hr'), rU.el, rP.el, rS.el,
        VC.legend([['pos', '$u$ changes ($\\mathbf r_u$)'], ['neg', '$v$ changes ($\\mathbf r_v$)'], ['ink', 'normal $\\mathbf r_u\\times\\mathbf r_v$'], ['gold', 'patch $\\Delta u\\times\\Delta v$']]));
      function reset() {
        const s = surfs[S.si];
        pt.lim = [s.U[0], s.U[1], s.V[0], s.V[1]];
        pt.x = s.U[0] + 0.3 * (s.U[1] - s.U[0]); pt.y = s.V[0] + 0.4 * (s.V[1] - s.V[0]);
      }
      function update() {
        const s = surfs[S.si], g = geo();
        eq.replaceChildren(VC.tex('\\mathbf r(u,v)=' + s.tex));
        rU.set('(' + fmt(pt.x, 2) + ', ' + fmt(pt.y, 2) + ')'); rP.set(vec3(s.r(pt.x, pt.y))); rS.set(fmt(V.len(g.N)));
        dom.redraw(); view.redraw();
      }
      reset(); update();
      pg.tries([
        'Cylinder: drag the point left and right, then up and down. Which parameter carries you around the cylinder, and which carries you along it?',
        'Sphere: pull the "$v$ runs this far" slider down to 50%. You get a hemisphere. Pull $u$ down to 25%. Which parameter is the angle around the $z$-axis, and which is the angle down from the north pole?',
        'The gold rectangle on the left always has the same size. Its image on the surface does not. On the sphere, move the point toward $v = 0$ and watch the gold patch shrink while the stretch factor drops toward 0.',
        'That stretch factor is $|\\mathbf r_u\\times\\mathbf r_v|$, the area of the parallelogram built on the two tangent arrows. It is why $dS = |\\mathbf r_u\\times\\mathbf r_v|\\,du\\,dv$. Find a surface where the stretch factor is the same at every point.',
        'On the cone, drag the point to $v = 0$. What happens to $\\mathbf r_u$, and what does that say about the tip?',
      ]);
    },
  });

  /* ================= 6. Surface integrals ================= */
  const SURFS = [
    { name: 'Hemisphere (radius 2)', r: (u, v) => [2 * sin(v) * cos(u), 2 * sin(v) * sin(u), 2 * cos(v)], U: [0, TAU], V: [0, PI / 2], sign: -1, dir: 'outward' },
    { name: 'Paraboloid cap', r: (u, v) => [v * cos(u), v * sin(u), 2 - (v * v) / 2], U: [0, TAU], V: [0, 2], sign: -1, dir: 'upward' },
    { name: 'Cylinder wall (radius 1.5)', r: (u, v) => [1.5 * cos(u), 1.5 * sin(u), v], U: [0, TAU], V: [0, 2], sign: 1, dir: 'outward' },
    { name: 'Tilted plane', r: (u, v) => [u, v, 1 + 0.4 * u + 0.2 * v], U: [-1.5, 1.5], V: [-1.5, 1.5], sign: 1, dir: 'upward' },
  ];
  VC.register({
    id: 'surface-integrals', n: 6, group: 'Surfaces', title: 'Surface integrals',
    blurb: 'Add up a function over a surface, or measure the flow passing through it.',
    formula: '\\iint_S f\\,dS \\qquad \\iint_S \\mathbf F\\cdot d\\mathbf S',
    init(root) {
      const pg = VC.page(root, this, {
        lede: 'Cut the surface into small patches. For a function $f$, multiply the value on each patch by the patch area and add. For a vector field, use the part of $\\mathbf F$ that points along the normal $\\mathbf n$: that is how much flows through the patch. The total is called the flux.',
        formula: '\\iint_S f\\,dS=\\iint_D f(\\mathbf r(u,v))\\,|\\mathbf r_u\\times\\mathbf r_v|\\,dA \\qquad\\quad \\iint_S \\mathbf F\\cdot d\\mathbf S=\\iint_S \\mathbf F\\cdot\\mathbf n\\,dS',
      });
      const fs = [
        { name: 'f = 1  (gives surface area)', f: () => 1 },
        { name: 'f = z  (height)', f: (p) => p[2] },
        { name: 'f = x² + y²', f: (p) => p[0] * p[0] + p[1] * p[1] },
        { name: 'f = x  (changes sign)', f: (p) => p[0] },
      ];
      const Fs = [
        { name: 'Straight up:  F = ⟨0, 0, 1⟩', F: () => [0, 0, 1] },
        { name: 'Outward:  F = ⟨x, y, z⟩', F: (p) => p },
        { name: 'Swirl:  F = ⟨−y, x, 0⟩', F: (p) => [-p[1], p[0], 0] },
        { name: 'Wind along x:  F = ⟨1, 0, 0⟩', F: () => [1, 0, 0] },
        { name: 'Stronger with height:  F = ⟨0, 0, z⟩', F: (p) => [0, 0, p[2]] },
      ];
      const S = { mode: 0, si: 0, fi: 1, Fi: 0, n: 8, flip: false, nrm: true };
      const val = (q) => (S.mode === 0 ? fs[S.fi].f(q.p) : V.dot(Fs[S.Fi].F(q.p), q.n));
      const total = (n) => { const s = SURFS[S.si]; let t = 0; for (const q of VC.patches(s.r, s.U, s.V, n, n, s.sign * (S.flip ? -1 : 1))) t += val(q) * q.dA; return t; };
      const host = pg.pane('Each patch is colored by its contribution. Drag to rotate.');
      const view = VC.View3D(host, { aspect: 1.3, R: 3.1, cz: 0.8, draw(v) {
        const c = v.c, s = SURFS[S.si], P = VC.patches(s.r, s.U, s.V, S.n, S.n, s.sign * (S.flip ? -1 : 1));
        let vm = 1e-6; for (const q of P) { q.val = val(q); vm = max(vm, abs(q.val)); }
        const step = Math.ceil(S.n / 10);
        for (const q of P) {
          v.poly(q.q, rgba(VC.divRgb(c, q.val / vm), 0.92), rgba(c.inkRgb, 0.3), 1);
          if (S.mode === 1 && q.i % step === 0 && q.j % step === 0) {
            const f = Fs[S.Fi].F(q.p), m = V.len(f);
            if (m > 1e-6) v.arrow(q.p, V.mul(f, (0.75 * tanh(m / 2)) / m), c.accent, 2, -0.2, 7);
            if (S.nrm) v.arrow(q.p, V.mul(q.n, 0.4), c.ink, 1.4, -0.15, 5);
          }
        }
        v.axes(2.8);
      } });
      const selS = VC.select({ label: 'Function $f$', options: fs.map((x) => x.name), value: S.fi, onchange: (i) => { S.fi = i; update(); } });
      const selV = VC.select({ label: 'Vector field $\\mathbf F$', options: Fs.map((x) => x.name), onchange: (i) => { S.Fi = i; update(); } });
      const cF = VC.check({ label: 'Flip the orientation (reverse $\\mathbf n$)', onchange: (b) => { S.flip = b; update(); } });
      const cN = VC.check({ label: 'Show normal vectors', checked: true, onchange: (b) => { S.nrm = b; view.redraw(); } });
      const r1 = VC.readout('', 'a'), r2 = VC.readout('Exact value (limit of many patches)'), note = el('p', { class: 'note' });
      pg.panel.append(
        VC.seg({ options: ['Scalar  $\\iint f\\,dS$', 'Flux  $\\iint \\mathbf F\\cdot d\\mathbf S$'], onchange: (i) => { S.mode = i; update(); } }),
        VC.select({ label: 'Surface', options: SURFS.map((x) => x.name), onchange: (i) => { S.si = i; update(); } }),
        selS, selV, cF, cN,
        VC.slider({ label: 'Patches per side', min: 2, max: 30, step: 1, value: S.n, oninput: (x) => { S.n = x; update(); } }),
        el('hr'), r1.el, r2.el, note, VC.legend([['pos', 'positive'], ['neg', 'negative']]));
      function update() {
        const sc = S.mode === 0, s = SURFS[S.si];
        selS.hidden = !sc; selV.hidden = sc; cF.hidden = sc; cN.hidden = sc;
        r1.el.firstChild.replaceChildren(VC.rich('Sum over ' + S.n * S.n + ' patches'));
        const sg = s.sign * (S.flip ? -1 : 1);
        r1.set(fmt(total(S.n)));
        r2.set(fmt(VC.surfInt(s.r, s.U, s.V, 24, 24, (p, N) => (sc ? fs[S.fi].f(p) * V.len(N) : sg * V.dot(Fs[S.Fi].F(p), N)))));
        note.replaceChildren(VC.rich(sc ? 'Each patch adds $f\\cdot\\Delta S$.' : 'Blue arrows: $\\mathbf F$. Short dark arrows: $\\mathbf n$, pointing ' + (S.flip ? 'the opposite way from ' : '') + s.dir + '. Each patch adds $(\\mathbf F\\cdot\\mathbf n)\\,\\Delta S$.'));
        view.redraw();
      }
      update();
      pg.tries([
        'Hemisphere with $f = 1$: the integral is the surface area. Compare the exact value with $2\\pi r^2$ for $r = 2$. How many patches per side do you need to be within 1%?',
        'Hemisphere with $f = x$: half the surface is warm and half is cool. Predict the total before you read it.',
        'Flux mode, hemisphere, "straight up" field. The answer is $4\\pi\\approx 12.566$, the area of the flat disk underneath. Why should the dome and the disk catch the same flow?',
        'Cylinder wall with the swirl field: the arrows slide along the surface and never cross it. What is the flux? Now try the outward field on the same wall.',
        'Flip the orientation. Every color swaps and the flux changes sign. A flux only means something once you have chosen which side of the surface counts as "through".',
      ]);
    },
  });

  /* ================= 7. Stokes' theorem ================= */
  VC.register({
    id: 'stokes-theorem', n: 7, group: 'The theorems in space', title: "Stokes' theorem",
    blurb: 'Circulation around a rim equals the curl passing through any surface on that rim.',
    formula: '\\oint_C \\mathbf F\\cdot d\\mathbf r=\\iint_S \\operatorname{curl}\\mathbf F\\cdot d\\mathbf S',
    init(root) {
      const pg = VC.page(root, this, {
        lede: 'This is Green\'s theorem lifted off the page. Take a closed curve $C$ in space and stretch any surface $S$ across it, like a soap film on a wire loop. The circulation of $\\mathbf F$ around the wire equals the flux of $\\operatorname{curl}\\mathbf F$ through the film. The film can bulge any way you like. Only the wire matters.',
      });
      const R0 = 1.6;
      const fields = [
        { name: 'Swirl:  F = ⟨−y, x, 0⟩', F: (p) => [-p[1], p[0], 0], curl: () => [0, 0, 2], ctex: '\\langle 0,0,2\\rangle' },
        { name: 'F = ⟨z, x, y⟩', F: (p) => [p[2], p[0], p[1]], curl: () => [1, 1, 1], ctex: '\\langle 1,1,1\\rangle' },
        { name: 'Swirl that grows with height:  F = ⟨−y(1+z), x(1+z), 0⟩', F: (p) => [-p[1] * (1 + p[2]), p[0] * (1 + p[2]), 0], curl: (p) => [-p[0], -p[1], 2 * (1 + p[2])], ctex: '\\langle -x,\\,-y,\\,2(1+z)\\rangle' },
        { name: 'Outward:  F = ⟨x, y, z⟩', F: (p) => p, curl: () => [0, 0, 0], ctex: '\\langle 0,0,0\\rangle' },
        { name: 'F = ⟨y², z², x²⟩', F: (p) => [p[1] * p[1], p[2] * p[2], p[0] * p[0]], curl: (p) => [-2 * p[2], -2 * p[0], -2 * p[1]], ctex: '\\langle -2z,\\,-2x,\\,-2y\\rangle' },
      ];
      const shapes = [
        { name: 'Dome', z: (r, t, h) => h * (1 - (r * r) / (R0 * R0)) },
        { name: 'Lopsided dome', z: (r, t, h) => h * (1 - (r * r) / (R0 * R0)) * (1 + 0.9 * (r / R0) * cos(t)) },
        { name: 'Three-lobed', z: (r, t, h) => h * (1 - (r * r) / (R0 * R0)) * (1 + 0.8 * (r / R0) * cos(3 * t)) },
      ];
      const S = { fi: 0, sh: 0, h: 1.4, flip: false, curl: true, nrm: false };
      const surf = () => (u, v) => [u * cos(v), u * sin(v), shapes[S.sh].z(u, v, S.h)];
      const rim = (t) => [R0 * cos(t), R0 * sin(t), 0];
      const host = pg.pane('Gold: the rim $C$ with its direction. Surface color: $\\operatorname{curl}\\mathbf F\\cdot\\mathbf n$ on each patch. Drag to rotate.');
      const view = VC.View3D(host, { aspect: 1.3, R: 3.1, cz: 0.3, draw(v) {
        const c = v.c, fd = fields[S.fi], o = S.flip ? -1 : 1, P = VC.patches(surf(), [0, R0], [0, TAU], 9, 28, o);
        let vm = 0.5; for (const q of P) { q.val = V.dot(fd.curl(q.p), q.n); vm = max(vm, abs(q.val)); }
        for (const q of P) {
          v.poly(q.q, rgba(VC.divRgb(c, q.val / vm), 0.9), rgba(c.inkRgb, 0.22), 1);
          if (q.i % 2 === 1 && q.j % 2 === 0) {
            if (S.curl) { const w = fd.curl(q.p), m = V.len(w); if (m > 1e-6) v.arrow(q.p, V.mul(w, (0.6 * tanh(m / 2)) / m), c.ink, 1.8, -0.2, 6); }
            if (S.nrm) v.arrow(q.p, V.mul(q.n, 0.4), rgba(c.mutedRgb, 0.9), 1.3, -0.15, 5);
          }
        }
        const pts = []; for (let i = 0; i <= 96; i++) pts.push(rim((i / 96) * TAU));
        v.polyline(pts, c.gold, 4, -0.25);
        for (let i = 0; i < 16; i++) {
          const t = (i / 16) * TAU, p = rim(t), f = fd.F(p), m = V.len(f);
          if (m > 1e-6) v.arrow(p, V.mul(f, (0.7 * tanh(m / 2)) / m), c.accent, 2.2, -0.3, 7);
          if (i % 4 === 0) v.arrow(p, [-sin(t) * 0.45 * o, cos(t) * 0.45 * o, 0], c.gold, 4, -0.35, 13);
        }
        v.axes(2.5);
      } });
      const rC = VC.readout('Around the rim: $\\oint_C \\mathbf F\\cdot d\\mathbf r$', 'g'), rS = VC.readout('Through the surface: $\\iint_S \\operatorname{curl}\\mathbf F\\cdot d\\mathbf S$', 'a');
      const eq = el('div', { class: 'note', style: 'overflow-x:auto' });
      pg.panel.append(
        VC.select({ label: 'Vector field', options: fields.map((x) => x.name), onchange: (i) => { S.fi = i; update(); } }), eq,
        VC.select({ label: 'Surface shape', options: shapes.map((x) => x.name), onchange: (i) => { S.sh = i; update(); } }),
        VC.slider({ label: 'Bulge of the surface', min: -2.4, max: 2.4, step: 0.05, value: S.h, fmt: (x) => fmt(x, 2), oninput: (x) => { S.h = x; update(); } }),
        VC.check({ label: 'Flip the orientation', onchange: (b) => { S.flip = b; update(); } }),
        VC.check({ label: 'Show curl arrows on the surface', checked: true, onchange: (b) => { S.curl = b; view.redraw(); } }),
        VC.check({ label: 'Show normal vectors', onchange: (b) => { S.nrm = b; view.redraw(); } }),
        el('hr'), rC.el, rS.el,
        VC.legend([['accent', '$\\mathbf F$ on the rim'], ['ink', '$\\operatorname{curl}\\mathbf F$'], ['pos', 'curl with $\\mathbf n$'], ['neg', 'curl against $\\mathbf n$']]));
      function update() {
        const fd = fields[S.fi], o = S.flip ? -1 : 1, M = 720;
        let circ = 0;
        for (let i = 0; i < M; i++) { const a = rim((i / M) * TAU), b = rim(((i + 1) / M) * TAU), f = fd.F(V.mul(V.add(a, b), 0.5)); circ += V.dot(f, V.sub(b, a)); }
        let flux = 0;
        flux = o * VC.surfInt(surf(), [0, R0], [0, TAU], 16, 48, (p, N) => V.dot(fd.curl(p), N));
        rC.set(fmt(circ * o)); rS.set(fmt(flux));
        eq.replaceChildren(VC.tex('\\operatorname{curl}\\mathbf F=' + fd.ctex));
        view.redraw();
      }
      update();
      pg.tries([
        'Slide the bulge from a tall dome, through 0 (a flat disk), down to a bowl. The colors on the surface change a lot. The number for the surface does not. Why is the flat disk the easiest surface to compute with?',
        'With the bulge at 0 and the swirl field, you are looking at Green\'s theorem from module 4: curl 2 times the area $\\pi(1.6)^2$.',
        'Choose the "swirl that grows with height". On a tall dome the curl arrows at the top are much longer, yet the total is the same as for the flat disk. Look at the sides of the dome for the patches that make up the difference.',
        'Pick $\\langle z, x, y\\rangle$ and the lopsided shape. Rotate the view until you can see patches of both colors. Stokes\' theorem says the cool patches cancel exactly the right amount of the warm ones.',
        'Flip the orientation. The normals reverse and so does the direction around the rim. Curl your right-hand fingers along the gold arrows: your thumb points to the side $\\mathbf n$ is on.',
        'Outward field: the curl is zero. What does that force the circulation around every closed loop to be? Connect this to module 2.',
      ]);
    },
  });

  /* ================= 8. Divergence theorem ================= */
  VC.register({
    id: 'divergence-theorem', n: 8, group: 'The theorems in space', title: 'The divergence theorem',
    blurb: 'What flows out through a closed surface equals what is created inside.',
    formula: '\\iint_S \\mathbf F\\cdot d\\mathbf S=\\iiint_E \\operatorname{div}\\mathbf F\\,dV',
    init(root) {
      const pg = VC.page(root, this, {
        lede: 'Wrap a closed surface $S$ around a solid region $E$. The net flow of $\\mathbf F$ out through $S$ equals the total divergence inside $E$. Divergence acts like a source: where it is positive the field is being created, where it is negative the field is being absorbed. Whatever is created inside has to leave through the walls.',
        formula: '\\oiint_S \\mathbf F\\cdot d\\mathbf S=\\iiint_E \\operatorname{div}\\mathbf F\\,dV',
      });
      const fields = [
        { name: 'Outward:  F = ⟨x, y, z⟩', F: (p) => p, div: () => 3, dtex: '3' },
        { name: 'F = ⟨x²/2, 0, 0⟩', F: (p) => [(p[0] * p[0]) / 2, 0, 0], div: (p) => p[0], dtex: 'x' },
        { name: 'F = ⟨xy², yz², zx²⟩', F: (p) => [p[0] * p[1] * p[1], p[1] * p[2] * p[2], p[2] * p[0] * p[0]], div: (p) => p[0] * p[0] + p[1] * p[1] + p[2] * p[2], dtex: 'x^2+y^2+z^2' },
        { name: 'Swirl:  F = ⟨−y, x, 0⟩', F: (p) => [-p[1], p[0], 0], div: () => 0, dtex: '0' },
        { name: 'Uniform wind:  F = ⟨1, 0, 0⟩', F: () => [1, 0, 0], div: () => 0, dtex: '0' },
        { name: 'Point source at the origin:  F = r/|r|³', F: (p) => { const m = max(V.len(p), 0.08); return V.mul(p, 1 / (m * m * m)); }, div: () => 0, dtex: '0\\ \\text{(except at the origin)}', sing: true },
      ];
      const S = { fi: 0, sh: 0, a: 1.1, cx: 0 };
      const mid = (lo, hi, n, i) => lo + ((i + 0.5) / n) * (hi - lo), gl = VC.gl;
      const shapes = [
        { name: 'Sphere', parts: (c, a) => [{ r: (u, v) => [c[0] + a * sin(v) * cos(u), c[1] + a * sin(v) * sin(u), c[2] + a * cos(v)], U: [0, TAU], V: [0, PI], nu: 20, nv: 10 }],
          inside: (d, a) => V.len(d) <= a,
          vol(g, c, a) { let s = 0; for (const [r, wr] of gl(0, a, 8)) for (const [ph, wp] of gl(0, PI, 12)) for (const [th, wt] of gl(0, TAU, 16)) s += g([c[0] + r * sin(ph) * cos(th), c[1] + r * sin(ph) * sin(th), c[2] + r * cos(ph)]) * r * r * sin(ph) * wr * wp * wt; return s; } },
        { name: 'Cube', parts(c, a) { const out = []; for (let k = 0; k < 3; k++) for (const s of [-1, 1]) out.push({ r: (u, v) => { const p = [c[0], c[1], c[2]]; p[k] += s * a; p[(k + 1) % 3] += u; p[(k + 2) % 3] += v; return p; }, U: [-a, a], V: [-a, a], nu: 5, nv: 5 }); return out; },
          inside: (d, a) => max(abs(d[0]), abs(d[1]), abs(d[2])) <= a,
          vol(g, c, a) { let s = 0; const N = gl(-a, a, 8); for (const [x, wx] of N) for (const [y, wy] of N) for (const [z, wz] of N) s += g([c[0] + x, c[1] + y, c[2] + z]) * wx * wy * wz; return s; } },
        { name: 'Cylinder', parts: (c, a) => [
            { r: (u, v) => [c[0] + a * cos(u), c[1] + a * sin(u), c[2] + v], U: [0, TAU], V: [-a, a], nu: 20, nv: 5 },
            { r: (u, v) => [c[0] + v * cos(u), c[1] + v * sin(u), c[2] + a], U: [0, TAU], V: [0, a], nu: 20, nv: 3 },
            { r: (u, v) => [c[0] + v * cos(u), c[1] + v * sin(u), c[2] - a], U: [0, TAU], V: [0, a], nu: 20, nv: 3 }],
          inside: (d, a) => hypot(d[0], d[1]) <= a && abs(d[2]) <= a,
          vol(g, c, a) { let s = 0; for (const [r, wr] of gl(0, a, 8)) for (const [th, wt] of gl(0, TAU, 16)) for (const [z, wz] of gl(-a, a, 8)) s += g([c[0] + r * cos(th), c[1] + r * sin(th), c[2] + z]) * r * wr * wt * wz; return s; } },
      ];
      function patches(fine) {
        const c = [S.cx, 0, 0], out = [];
        for (const pt of shapes[S.sh].parts(c, S.a)) for (const q of VC.patches(pt.r, pt.U, pt.V, pt.nu * fine, pt.nv * fine)) {
          if (V.dot(q.n, V.sub(q.p, c)) < 0) { q.n = V.mul(q.n, -1); }
          out.push(q);
        }
        return out;
      }
      const host = pg.pane('Wall color: flow out (warm) or in (cool). Dots inside: divergence, sized by strength. Drag to rotate.');
      const view = VC.View3D(host, { aspect: 1.3, R: 3.3, draw(v) {
        const c = v.c, fd = fields[S.fi], P = patches(1), ctr = [S.cx, 0, 0];
        let vm = 0.3; for (const q of P) { q.val = V.dot(fd.F(q.p), q.n); vm = max(vm, abs(q.val)); }
        P.forEach((q, idx) => {
          v.poly(q.q, rgba(VC.divRgb(c, q.val / vm), 0.5), rgba(c.inkRgb, 0.2), 1);
          if ((q.i + q.j) % 2 === 0) { const f = fd.F(q.p), m = V.len(f); if (m > 1e-6) v.arrow(q.p, V.mul(f, (0.6 * tanh(m / 2)) / m), q.val >= 0 ? c.pos : c.neg, 1.8, -0.05, 6); }
        });
        const g = 5, b = S.a * 1.0;
        for (let i = 0; i < g; i++) for (let j = 0; j < g; j++) for (let k = 0; k < g; k++) {
          const d = [mid(-b, b, g, i), mid(-b, b, g, j), mid(-b, b, g, k)];
          if (!shapes[S.sh].inside(d, S.a * 0.97)) continue;
          const p = V.add(ctr, d), dv = fd.div(p);
          if (abs(dv) > 0.02) v.dot(p, 1.5 + 3.5 * tanh(abs(dv) / 2), rgba(dv > 0 ? c.posRgb : c.negRgb, 0.95));
        }
        if (fd.sing) v.dot([0, 0, 0], 7, c.gold);
        v.axes(2.9);
      } });
      const rF = VC.readout('Out through the surface: $\\iint_S \\mathbf F\\cdot d\\mathbf S$', 'g'), rV = VC.readout('Created inside: $\\iiint_E \\operatorname{div}\\mathbf F\\,dV$', 'a');
      const eq = el('div', { class: 'note', style: 'overflow-x:auto' }), note = el('p', { class: 'note' });
      pg.panel.append(
        VC.select({ label: 'Vector field', options: fields.map((x) => x.name), onchange: (i) => { S.fi = i; update(); } }), eq,
        VC.select({ label: 'Closed surface', options: shapes.map((x) => x.name), onchange: (i) => { S.sh = i; update(); } }),
        VC.slider({ label: 'Size', min: 0.5, max: 1.6, step: 0.05, value: S.a, fmt: (x) => x.toFixed(2), oninput: (x) => { S.a = x; update(); } }),
        VC.slider({ label: 'Slide the region along $x$', min: -1.8, max: 1.8, step: 0.05, value: 0, fmt: (x) => fmt(x, 2), oninput: (x) => { S.cx = x; update(); } }),
        el('hr'), rF.el, rV.el, note,
        VC.legend([['pos', 'out / source'], ['neg', 'in / sink']]));
      function update() {
        const fd = fields[S.fi], sh = shapes[S.sh], c = [S.cx, 0, 0];
        let flux = 0; for (const pt of sh.parts(c, S.a)) flux += VC.surfInt(pt.r, pt.U, pt.V, pt.nu * 2, pt.nv * 3, (p, N) => { const d = V.dot(fd.F(p), N); return V.dot(N, V.sub(p, c)) < 0 ? -d : d; });
        rF.set(fmt(flux, 2));
        const encl = fd.sing && sh.inside(V.sub([0, 0, 0], c), S.a);
        rV.set(encl ? 'undefined' : fmt(sh.vol(fd.div, c, S.a), 2));
        eq.replaceChildren(VC.tex('\\operatorname{div}\\mathbf F=' + fd.dtex));
        note.replaceChildren(VC.rich(!fd.sing ? '' : encl ? 'The source (gold dot) is inside, and $\\mathbf F$ blows up there, so the theorem does not apply directly. The flux is $4\\pi\\approx 12.566$ for every surface that encloses the source.' : 'The source (gold dot) is outside. Everything that enters the region also leaves it.'));
        view.redraw();
      }
      update();
      pg.tries([
        'Outward field: the divergence is 3 everywhere, so the flux is 3 times the volume. Check it for the cube: side length is twice the size setting.',
        'Slide the region along $x$ with the outward field. The colors on the walls change, and one side can even turn cool, but the total does not move. Why not?',
        'Swirl and uniform wind both have divergence 0. For the wind, find where the flow enters and where it leaves. For the swirl, does anything cross the wall of the cylinder at all?',
        'Choose $\\langle x^2/2, 0, 0\\rangle$, whose divergence is $x$. Slide the region left of the origin, then right. When is the net flow inward? When is it exactly 0?',
        'Point source: with the origin inside, change the shape and the size. The flux stays at $4\\pi$. Slide the region until the gold dot is outside and it drops to 0. This is Gauss\'s law from physics.',
      ]);
    },
  });
})();
