/* Vector Calculus Lab: shared engine (DOM helpers, 2D plots, 3D viewer, controls, router) */
(function () {
  'use strict';
  const VC = (window.VC = { modules: [], scope: null });
  VC.register = (m) => VC.modules.push(m);
  const { sin, cos, tanh, hypot, min, max, PI } = Math;

  /* ---------- DOM ---------- */
  const el = (VC.el = function (tag, attrs, ...kids) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (k === 'class') e.className = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v);
    }
    for (const k of kids.flat()) { if (k == null) continue; e.append(k.nodeType ? k : document.createTextNode(k)); }
    return e;
  });
  VC.tex = function (s, display) {
    const sp = el('span', { class: display ? 'tex-block' : 'tex' });
    try { window.katex.render(s, sp, { displayMode: !!display, throwOnError: false }); } catch (e) { sp.textContent = s; }
    return sp;
  };
  /* text with $inline math$ */
  VC.rich = function (str) {
    const frag = document.createDocumentFragment();
    String(str).split('$').forEach((part, i) => { if (!part) return; frag.append(i % 2 ? VC.tex(part) : document.createTextNode(part)); });
    return frag;
  };
  VC.fmt = function (x, d) {
    if (!isFinite(x)) return '—';
    d = d == null ? 3 : d;
    let s = x.toFixed(d);
    if (parseFloat(s) === 0) s = (0).toFixed(d);
    return s.replace('-', '−');
  };

  /* ---------- colors ---------- */
  function hex2rgb(h) {
    h = h.trim().replace('#', '');
    if (h.length === 3) h = [...h].map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const KEYS = ['bg', 'panel', 'ink', 'muted', 'line', 'accent', 'gold', 'pos', 'neg', 'field', 'surf'];
  VC.colors = function () {
    const cs = getComputedStyle(document.documentElement), o = {};
    for (const k of KEYS) { const v = cs.getPropertyValue('--' + k).trim() || '#888888'; o[k] = v; o[k + 'Rgb'] = hex2rgb(v); }
    return o;
  };
  VC.rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a == null ? 1 : a})`;
  VC.mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  /* diverging color: t in [-1,1]; negative = cool, positive = warm */
  VC.divRgb = function (c, t) {
    t = max(-1, min(1, isFinite(t) ? t : 0));
    return VC.mix(c.panelRgb, t >= 0 ? c.posRgb : c.negRgb, 0.12 + 0.88 * Math.abs(t));
  };

  /* ---------- vectors & numerics ---------- */
  const V = (VC.V = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
    sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
    dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    len: (a) => hypot(a[0], a[1], a[2]),
    unit: (a) => { const m = hypot(a[0], a[1], a[2]); return m > 1e-12 ? [a[0] / m, a[1] / m, a[2] / m] : [0, 0, 0]; },
  });
  /* Catmull-Rom spline through 2D points [{x,y}], returns [[x,y],...] */
  VC.spline = function (P, per) {
    per = per || 40;
    const out = [], n = P.length, g = (i) => P[max(0, min(n - 1, i))];
    for (let i = 0; i < n - 1; i++) {
      const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
      for (let k = 0; k < per; k++) {
        const t = k / per, t2 = t * t, t3 = t2 * t;
        const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
        out.push([f(p0.x, p1.x, p2.x, p3.x), f(p0.y, p1.y, p2.y, p3.y)]);
      }
    }
    out.push([P[n - 1].x, P[n - 1].y]);
    return out;
  };
  /* work of 2D field F along polyline pts */
  VC.work2 = function (F, pts) {
    let s = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], f = F((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
      s += f[0] * (b[0] - a[0]) + f[1] * (b[1] - a[1]);
    }
    return s;
  };
  /* patches of a parametric surface r(u,v): centers, corners, normals, area elements */
  VC.patches = function (r, U, Vr, nu, nv, sign) {
    sign = sign || 1;
    const out = [], du = (U[1] - U[0]) / nu, dv = (Vr[1] - Vr[0]) / nv, h = 1e-4;
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
      const u = U[0] + (i + 0.5) * du, v = Vr[0] + (j + 0.5) * dv, p = r(u, v);
      const ru = V.mul(V.sub(r(u + h, v), r(u - h, v)), 1 / (2 * h));
      const rv = V.mul(V.sub(r(u, v + h), r(u, v - h)), 1 / (2 * h));
      const N = V.mul(V.cross(ru, rv), sign), m = V.len(N);
      out.push({ i, j, u, v, p, ru, rv, N, m, n: m > 1e-9 ? V.mul(N, 1 / m) : [0, 0, 0], dA: m * du * dv,
        q: [r(u - du / 2, v - dv / 2), r(u + du / 2, v - dv / 2), r(u + du / 2, v + dv / 2), r(u - du / 2, v + dv / 2)] });
    }
    return out;
  };

  /* two-point Gauss nodes on n cells: [[x, w], ...] */
  VC.gl = function (lo, hi, n) {
    const o = [], h = (hi - lo) / n / 2, d = h / Math.sqrt(3);
    for (let i = 0; i < n; i++) { const c = lo + (2 * i + 1) * h; o.push([c - d, h], [c + d, h]); }
    return o;
  };
  /* accurate surface integral: sum of fn(p, N) du dv with N = r_u x r_v */
  VC.surfInt = function (r, U, Vr, nu, nv, fn) {
    let s = 0; const h = 1e-4;
    for (const [u, wu] of VC.gl(U[0], U[1], nu)) for (const [v, wv] of VC.gl(Vr[0], Vr[1], nv)) {
      const ru = V.mul(V.sub(r(u + h, v), r(u - h, v)), 1 / (2 * h)), rv = V.mul(V.sub(r(u, v + h), r(u, v - h)), 1 / (2 * h));
      s += fn(r(u, v), V.cross(ru, rv)) * wu * wv;
    }
    return s;
  };

  /* exact work of the vortex <-y, x>/(x^2+y^2) along a polyline: the total change in polar angle */
  VC.vortexWork = function (pts, closed) {
    let s = 0;
    const n = pts.length, m = closed ? n : n - 1;
    for (let i = 0; i < m; i++) {
      const a = pts[i], b = pts[(i + 1) % n];
      s += Math.atan2(a[0] * b[1] - a[1] * b[0], a[0] * b[0] + a[1] * b[1]);
    }
    return s;
  };
  /* closest a polyline comes to the origin */
  VC.minDist = (pts) => pts.reduce((m, p) => Math.min(m, Math.hypot(p[0], p[1])), Infinity);

  /* ---------- scope / animation ---------- */
  VC.Scope = function () {
    const fns = [];
    return { add(f) { fns.push(f); return f; }, dispose() { fns.splice(0).reverse().forEach((f) => { try { f(); } catch (e) { /* ignore */ } }); } };
  };
  VC.reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  VC.loop = function (fn) {
    let id, last = performance.now(), on = true;
    const tick = (t) => { if (!on) return; const dt = min(0.05, (t - last) / 1000); last = t; fn(dt, t / 1000); id = requestAnimationFrame(tick); };
    id = requestAnimationFrame(tick);
    const stop = () => { on = false; cancelAnimationFrame(id); };
    VC.scope.add(stop);
    return stop;
  };

  /* ---------- canvas base ---------- */
  function makeCanvas(host, aspect, draw) {
    host.classList.add('cv');
    host.style.aspectRatio = String(aspect);
    const cv = el('canvas');
    host.append(cv);
    const ctx = cv.getContext('2d'), st = { w: 0, h: 0, cv, ctx, host };
    st.redraw = () => { if (st.w && host.offsetParent !== null) draw(); };
    function size() {
      const r = host.getBoundingClientRect();
      if (r.width < 2) return;
      const dpr = min(window.devicePixelRatio || 1, 2);
      st.w = r.width; st.h = r.height;
      cv.width = Math.round(st.w * dpr); cv.height = Math.round(st.h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      st.redraw();
    }
    const ro = new ResizeObserver(size);
    ro.observe(host);
    VC.scope.add(() => ro.disconnect());
    const th = () => st.redraw();
    window.addEventListener('vc-theme', th);
    VC.scope.add(() => window.removeEventListener('vc-theme', th));
    return st;
  }
  function arrowPx(ctx, ax, ay, bx, by, color, lw, head) {
    const dx = bx - ax, dy = by - ay, L = hypot(dx, dy);
    if (L < 0.6) return;
    const ux = dx / L, uy = dy / L, h = min(head, L * 0.6);
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx - ux * h * 0.8, by - uy * h * 0.8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx, by);
    ctx.lineTo(bx - ux * h - uy * h * 0.5, by - uy * h + ux * h * 0.5);
    ctx.lineTo(bx - ux * h + uy * h * 0.5, by - uy * h - ux * h * 0.5);
    ctx.closePath(); ctx.fill();
  }
  const evPos = (cv, e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };

  /* ---------- 2D plot ---------- */
  VC.Plot = function (host, o) {
    const p = { x0: o.xmin, x1: o.xmax, y0: o.ymin, y1: o.ymax, handles: [], c: null };
    const st = makeCanvas(host, o.aspect || (o.xmax - o.xmin) / (o.ymax - o.ymin), () => {
      p.c = VC.colors();
      st.ctx.clearRect(0, 0, st.w, st.h);
      o.draw(p);
      drawHandles();
    });
    const ctx = (p.ctx = st.ctx);
    p.st = st; p.redraw = st.redraw;
    p.X = (x) => ((x - p.x0) / (p.x1 - p.x0)) * st.w;
    p.Y = (y) => ((p.y1 - y) / (p.y1 - p.y0)) * st.h;
    p.wx = (px) => p.x0 + (px / st.w) * (p.x1 - p.x0);
    p.wy = (py) => p.y1 - (py / st.h) * (p.y1 - p.y0);
    p.grid = function (step) {
      step = step || 1;
      ctx.lineWidth = 1; ctx.setLineDash([]);
      for (let x = Math.ceil(p.x0 / step) * step; x <= p.x1 + 1e-9; x += step) {
        ctx.strokeStyle = VC.rgba(p.c.mutedRgb, Math.abs(x) < 1e-9 ? 0.55 : 0.14);
        ctx.beginPath(); ctx.moveTo(p.X(x), 0); ctx.lineTo(p.X(x), st.h); ctx.stroke();
      }
      for (let y = Math.ceil(p.y0 / step) * step; y <= p.y1 + 1e-9; y += step) {
        ctx.strokeStyle = VC.rgba(p.c.mutedRgb, Math.abs(y) < 1e-9 ? 0.55 : 0.14);
        ctx.beginPath(); ctx.moveTo(0, p.Y(y)); ctx.lineTo(st.w, p.Y(y)); ctx.stroke();
      }
      ctx.fillStyle = p.c.muted; ctx.font = '12px "IBM Plex Sans", sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      if (p.y0 < 0 && p.y1 > 0) ctx.fillText(o.xlabel || 'x', st.w - 14, p.Y(0) - 6);
      if (p.x0 < 0 && p.x1 > 0) ctx.fillText(o.ylabel || 'y', p.X(0) + 6, 14);
    };
    p.path = function (pts, color, lw, dash, close) {
      if (pts.length < 2) return;
      ctx.strokeStyle = color; ctx.lineWidth = lw || 2; ctx.setLineDash(dash || []); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(p.X(pts[0][0]), p.Y(pts[0][1]));
      for (let i = 1; i < pts.length; i++) ctx.lineTo(p.X(pts[i][0]), p.Y(pts[i][1]));
      if (close) ctx.closePath();
      ctx.stroke(); ctx.setLineDash([]);
    };
    p.arrow = (x, y, vx, vy, color, lw, head) => arrowPx(ctx, p.X(x), p.Y(y), p.X(x + vx), p.Y(y + vy), color, lw || 2, head || 8);
    /* arrowhead only, at (x,y) pointing along (vx,vy) */
    p.head = function (x, y, vx, vy, color, size) {
      const m = hypot(vx, vy) || 1, s = (size || 10) / st.w * (p.x1 - p.x0);
      p.arrow(x - (vx / m) * s * 0.5, y - (vy / m) * s * 0.5, (vx / m) * s, (vy / m) * s, color, 0.01, size || 10);
    };
    p.field = function (F, n, opt) {
      opt = opt || {}; n = n || 15;
      const dx = (p.x1 - p.x0) / n, ny = Math.round((p.y1 - p.y0) / dx), ref = opt.ref || 1.5;
      for (let i = 0; i < n; i++) for (let j = 0; j < ny; j++) {
        const x = p.x0 + (i + 0.5) * dx, y = p.y0 + (j + 0.5) * dx, f = F(x, y), m = hypot(f[0], f[1]);
        if (!isFinite(m) || m < 1e-6) continue;
        const k = tanh(m / ref), L = dx * 0.85 * (0.25 + 0.75 * k);
        p.arrow(x - (f[0] / m) * L / 2, y - (f[1] / m) * L / 2, (f[0] / m) * L, (f[1] / m) * L,
          VC.rgba(opt.rgb || p.c.fieldRgb, (opt.alpha || 1) * (0.3 + 0.7 * k)), 1.3, 5);
      }
    };
    p.heat = function (fn, vmax, res, alpha) {
      res = res || 44;
      const dx = (p.x1 - p.x0) / res, ny = Math.round((p.y1 - p.y0) / dx), w = st.w / res + 1, h = st.h / ny + 1;
      for (let i = 0; i < res; i++) for (let j = 0; j < ny; j++) {
        const x = p.x0 + (i + 0.5) * dx, y = p.y0 + (j + 0.5) * dx;
        ctx.fillStyle = VC.rgba(VC.divRgb(p.c, fn(x, y) / vmax), alpha == null ? 0.75 : alpha);
        ctx.fillRect(p.X(x - dx / 2), p.Y(y + dx / 2), w, h);
      }
    };
    p.dot = function (x, y, r, color, ring) {
      ctx.beginPath(); ctx.arc(p.X(x), p.Y(y), r, 0, 2 * PI); ctx.fillStyle = color; ctx.fill();
      if (ring) { ctx.lineWidth = 2; ctx.strokeStyle = ring; ctx.stroke(); }
    };
    p.label = function (t, x, y, color, dx, dy, bold) {
      ctx.font = (bold ? '600 ' : '') + '13px "IBM Plex Sans", sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      const px = p.X(x) + (dx || 0), py = p.Y(y) + (dy || 0);
      ctx.lineWidth = 3; ctx.strokeStyle = VC.rgba(p.c.panelRgb, 0.85); ctx.strokeText(t, px, py);
      ctx.fillStyle = color || p.c.ink; ctx.fillText(t, px, py);
    };
    p.handle = function (h) { p.handles.push(h); host.classList.add('drag'); return h; };
    function drawHandles() {
      for (const h of p.handles) {
        if (h.hidden) continue;
        const col = typeof h.color === 'function' ? h.color(p.c) : h.color || p.c.ink;
        p.dot(h.x, h.y, h.r || 8, col, p.c.panel);
        if (h.label) p.label(h.label, h.x, h.y, p.c.ink, 12, -12, true);
      }
    }
    let drag = null;
    const near = (mx, my) => {
      let best = null, bd = 26;
      for (const h of p.handles) { if (h.hidden) continue; const d = hypot(p.X(h.x) - mx, p.Y(h.y) - my); if (d < bd) { bd = d; best = h; } }
      return best;
    };
    st.cv.addEventListener('pointerdown', (e) => {
      const [mx, my] = evPos(st.cv, e), h = near(mx, my);
      if (h) { drag = h; st.cv.setPointerCapture(e.pointerId); e.preventDefault(); }
    });
    st.cv.addEventListener('pointermove', (e) => {
      const [mx, my] = evPos(st.cv, e);
      if (!drag) { st.cv.style.cursor = near(mx, my) ? 'grab' : ''; return; }
      const pad = 0.04 * (p.x1 - p.x0);
      const lim = drag.lim || [p.x0 + pad, p.x1 - pad, p.y0 + pad, p.y1 - pad];
      drag.x = max(lim[0], min(lim[1], p.wx(mx)));
      drag.y = max(lim[2], min(lim[3], p.wy(my)));
      if (drag.onmove) drag.onmove(drag);
      p.redraw();
    });
    const end = () => { drag = null; };
    st.cv.addEventListener('pointerup', end);
    st.cv.addEventListener('pointercancel', end);
    return p;
  };

  /* ---------- 3D viewer (orthographic, z up, drag to rotate) ---------- */
  VC.View3D = function (host, o) {
    const v = { yaw: o.yaw == null ? -0.65 : o.yaw, pitch: o.pitch == null ? 0.42 : o.pitch, R: o.R || 3, cz: o.cz || 0, c: null };
    let items = [];
    const st = makeCanvas(host, o.aspect || 1, () => {
      v.c = VC.colors();
      st.ctx.clearRect(0, 0, st.w, st.h);
      items = [];
      o.draw(v);
      flush();
    });
    const ctx = st.ctx;
    host.classList.add('drag', 'rot');
    v.redraw = st.redraw;
    v.P = function (p) {
      const ca = cos(v.yaw), sa = sin(v.yaw), X = p[0] * ca - p[1] * sa, Y = p[0] * sa + p[1] * ca;
      const sp = sin(v.pitch), cp = cos(v.pitch), k = min(st.w, st.h) / (2 * v.R), z = p[2] - v.cz;
      return [st.w / 2 + X * k, st.h / 2 - (Y * sp + z * cp) * k, Y * cp - z * sp];
    };
    v.toViewer = () => { const cp = cos(v.pitch), sp = sin(v.pitch); return [-cp * sin(v.yaw), -cp * cos(v.yaw), sp]; };
    v.shade = function (rgb, n, amt) {
      const l = Math.abs(V.dot(n, v.toViewer()));
      return VC.mix(rgb, v.c.inkRgb, (1 - l) * (amt == null ? 0.35 : amt));
    };
    v.poly = function (pts, fill, stroke, lw, bias) {
      const q = pts.map(v.P); let d = 0; for (const a of q) d += a[2];
      items.push({ t: 0, q, fill, stroke, lw: lw || 1, d: d / q.length + (bias || 0) });
    };
    v.line = function (a, b, color, lw, bias, dash) {
      const A = v.P(a), B = v.P(b);
      items.push({ t: 1, A, B, color, lw: lw || 1.5, d: (A[2] + B[2]) / 2 + (bias || 0), dash });
    };
    v.polyline = function (pts, color, lw, bias, dash) { for (let i = 0; i < pts.length - 1; i++) v.line(pts[i], pts[i + 1], color, lw, bias, dash); };
    v.arrow = function (p, vec, color, lw, bias, head) {
      const A = v.P(p), B = v.P(V.add(p, vec));
      items.push({ t: 2, A, B, color, lw: lw || 1.8, head: head || 7, d: (A[2] + B[2]) / 2 + (bias || 0) });
    };
    v.dot = function (p, r, color, bias) { const A = v.P(p); items.push({ t: 3, A, r, color, d: A[2] + (bias || 0) }); };
    v.text = function (p, s, color) { const A = v.P(p); items.push({ t: 4, A, s, color, d: A[2] - 100 }); };
    v.axes = function (L) {
      const col = VC.rgba(v.c.mutedRgb, 0.8);
      [[L, 0, 0, 'x'], [0, L, 0, 'y'], [0, 0, L, 'z']].forEach((a) => {
        v.arrow([0, 0, 0], [a[0], a[1], a[2]], col, 1.2, 0, 6);
        v.text([a[0] * 1.07, a[1] * 1.07, a[2] * 1.07], a[3], v.c.muted);
      });
    };
    function flush() {
      items.sort((a, b) => b.d - a.d);
      for (const it of items) {
        if (it.t === 0) {
          ctx.beginPath(); ctx.moveTo(it.q[0][0], it.q[0][1]);
          for (let i = 1; i < it.q.length; i++) ctx.lineTo(it.q[i][0], it.q[i][1]);
          ctx.closePath();
          if (it.fill) { ctx.fillStyle = it.fill; ctx.fill(); }
          if (it.stroke) { ctx.setLineDash([]); ctx.strokeStyle = it.stroke; ctx.lineWidth = it.lw; ctx.lineJoin = 'round'; ctx.stroke(); }
        } else if (it.t === 1) {
          ctx.setLineDash(it.dash || []); ctx.strokeStyle = it.color; ctx.lineWidth = it.lw; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(it.A[0], it.A[1]); ctx.lineTo(it.B[0], it.B[1]); ctx.stroke(); ctx.setLineDash([]);
        } else if (it.t === 2) arrowPx(ctx, it.A[0], it.A[1], it.B[0], it.B[1], it.color, it.lw, it.head);
        else if (it.t === 3) { ctx.beginPath(); ctx.arc(it.A[0], it.A[1], it.r, 0, 2 * PI); ctx.fillStyle = it.color; ctx.fill(); }
        else { ctx.font = 'italic 14px "STIX Two Text", serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = it.color; ctx.fillText(it.s, it.A[0], it.A[1]); }
      }
    }
    let last = null;
    st.cv.addEventListener('pointerdown', (e) => { last = [e.clientX, e.clientY]; st.cv.setPointerCapture(e.pointerId); e.preventDefault(); });
    st.cv.addEventListener('pointermove', (e) => {
      if (!last) return;
      v.yaw += (e.clientX - last[0]) * 0.01;
      v.pitch = max(-0.3, min(1.5, v.pitch + (e.clientY - last[1]) * 0.01));
      last = [e.clientX, e.clientY];
      st.redraw();
    });
    const end = () => { last = null; };
    st.cv.addEventListener('pointerup', end);
    st.cv.addEventListener('pointercancel', end);
    return v;
  };

  /* ---------- controls ---------- */
  let uid = 0;
  const lab = (s) => (typeof s === 'string' ? VC.rich(s) : s);
  VC.slider = function (o) {
    const id = 'ctl' + ++uid, out = el('output', { for: id });
    const inp = el('input', { type: 'range', id, min: o.min, max: o.max, step: o.step, value: o.value });
    const f = o.fmt || ((x) => x), upd = () => { out.textContent = f(+inp.value); };
    inp.addEventListener('input', () => { upd(); o.oninput(+inp.value); });
    upd();
    const w = el('div', { class: 'ctl' }, el('div', { class: 'ctl-head' }, el('label', { for: id }, lab(o.label)), out), inp);
    w.set = (x) => { inp.value = x; upd(); };
    w.input = inp;
    return w;
  };
  VC.select = function (o) {
    const id = 'ctl' + ++uid;
    const s = el('select', { id }, o.options.map((op, i) => el('option', { value: i }, op)));
    s.value = o.value || 0;
    s.addEventListener('change', () => o.onchange(+s.value));
    return el('div', { class: 'ctl' }, el('label', { for: id }, lab(o.label)), s);
  };
  VC.seg = function (o) {
    const btns = o.options.map((op, i) => el('button', { type: 'button', 'aria-pressed': i === (o.value || 0) ? 'true' : 'false',
      onclick: () => { btns.forEach((b, k) => b.setAttribute('aria-pressed', k === i ? 'true' : 'false')); o.onchange(i); } }, lab(op)));
    return el('div', { class: 'ctl' }, o.label ? el('div', { class: 'ctl-label' }, lab(o.label)) : null, el('div', { class: 'seg', role: 'group' }, btns));
  };
  VC.check = function (o) {
    const id = 'ctl' + ++uid, inp = el('input', { type: 'checkbox', id });
    inp.checked = !!o.checked;
    inp.addEventListener('change', () => o.onchange(inp.checked));
    const w = el('div', { class: 'ctl check' }, inp, el('label', { for: id }, lab(o.label)));
    w.input = inp;
    return w;
  };
  VC.button = (label, onclick) => el('button', { type: 'button', class: 'btn', onclick }, label);
  VC.readout = function (label, cls) {
    const val = el('div', { class: 'ro-val' }, '—');
    const w = el('div', { class: 'ro ' + (cls || '') }, el('div', { class: 'ro-label' }, lab(label)), val);
    return { el: w, set: (t) => { val.textContent = t; }, node: val };
  };
  VC.pill = function () {
    const e = el('div', { class: 'pill' });
    return { el: e, set(text, kind) { e.textContent = text; e.dataset.kind = kind || ''; } };
  };
  VC.note = (s) => el('p', { class: 'note' }, lab(s));
  VC.legend = (items) => el('div', { class: 'legend' }, items.map((it) => el('span', null, el('i', { style: 'background:var(--' + it[0] + ')' }), lab(it[1]))));

  /* ---------- page scaffold ---------- */
  VC.page = function (root, m, o) {
    const idx = VC.modules.indexOf(m), prev = VC.modules[idx - 1], next = VC.modules[idx + 1];
    const stage = el('div', { class: 'stage' }), panel = el('aside', { class: 'panel', 'aria-label': 'Controls and results' });
    const tryList = el('ol');
    root.append(
      el('header', { class: 'mod-head' },
        el('p', { class: 'eyebrow' }, 'Module ' + m.n + ' of ' + VC.modules.length),
        el('h1', null, m.title),
        el('p', { class: 'lede' }, VC.rich(o.lede)),
        el('div', { class: 'formula' }, VC.tex(o.formula || m.formula, true))),
      el('div', { class: 'work' }, stage, panel),
      el('section', { class: 'try' }, el('h2', null, 'Try this'), tryList),
      el('nav', { class: 'pager', 'aria-label': 'Modules' },
        prev ? el('a', { href: '#' + prev.id, class: 'prev' }, el('small', null, 'Previous'), prev.title) : el('span'),
        el('a', { href: '#', class: 'home' }, 'All modules'),
        next ? el('a', { href: '#' + next.id, class: 'next' }, el('small', null, 'Next'), next.title) : el('span')));
    return {
      stage, panel,
      pane(caption) { const host = el('div'), fig = el('figure', { class: 'pane' }, host, caption ? el('figcaption', null, lab(caption)) : null); stage.append(fig); host.fig = fig; return host; },
      tries(list) { tryList.replaceChildren(...list.map((t) => el('li', null, VC.rich(t)))); },
    };
  };

  /* ---------- home + router ---------- */
  function home(root) {
    root.append(el('header', { class: 'hub-head' }, el('h1', null, 'Vector Calculus Interactive Modules')));
    root.append(el('div', { class: 'cards' }, VC.modules.map((m) => el('a', { class: 'card', href: '#' + m.id },
      el('span', { class: 'card-n' }, String(m.n)),
      el('h3', null, m.title),
      el('div', { class: 'card-f' }, VC.tex(m.formula))))));
  }
  function route() {
    const root = document.getElementById('app');
    if (VC.scope) VC.scope.dispose();
    VC.scope = VC.Scope();
    root.replaceChildren();
    const id = location.hash.replace('#', ''), m = VC.modules.find((x) => x.id === id);
    root.className = m ? 'mod' : 'hub';
    if (m) m.init(root); else home(root);
    window.scrollTo(0, 0);
  }
  VC.start = function () {
    VC.modules.sort((a, b) => a.n - b.n);
    window.addEventListener('hashchange', route);
    const fire = () => window.dispatchEvent(new Event('vc-theme'));
    new MutationObserver(fire).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', fire);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fire);
    route();
  };
})();
