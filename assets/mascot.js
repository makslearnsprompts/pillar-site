/* Pillar site — the mascot rig.
 *
 * A port of `carry-mascot/rig/vector.html` to a mountable component. The
 * geometry is the traced rig in `rig-vectors.js` (the same paths the app draws)
 * and the motion is the same critically-damped spring engine: breath, sway,
 * follow-through in the petals, blinks, saccades, an occasional hop, and the
 * reward bloom. Nothing here is a new drawing — pose is `lean` and `expr`.
 *
 * Usage, from markup:
 *   <div class="mascot" data-lean="0.9" data-expr="-0.4" data-reward="1"></div>
 *
 * Every instance shares one rAF loop and only ticks while it is on screen.
 * Under `prefers-reduced-motion` each one renders a single settled frame and
 * never animates. If this file or the geometry fails to load, the <img>
 * fallback already inside the element stays where it is.
 */
(function () {
  'use strict';

  var R = window.RIGV;
  if (!R) return;

  var W = R.canvas.w, H = R.canvas.h, P = R.palette, J = R.joints;
  var TAU = Math.PI * 2;
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── engine ─────────────────────────────────────────────────────────── */

  function Spring(f, z, x0) { this.f = f; this.z = z; this.x = x0 || 0; this.v = 0; }
  Spring.prototype.step = function (target, dt) {
    var w = TAU * this.f, k = w * w, c = 2 * this.z * w;
    var n = Math.max(1, Math.ceil(dt / (1 / 240))), h = dt / n;
    for (var i = 0; i < n; i++) {
      var a = -k * (this.x - target) - c * this.v;
      this.v += a * h;
      this.x += this.v * h;
    }
    return this.x;
  };

  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function easeOutBack(p) { var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); }
  function easeInOut(p) { return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; }

  var RDUR = 1.7;
  function rewardB(tau) {
    if (tau < 0 || tau > RDUR) return 0;
    if (tau < 0.13) return -0.07 * Math.sin(tau / 0.13 * Math.PI);   // the dip before the bloom
    if (tau < 0.52) return easeOutBack((tau - 0.13) / 0.39);
    if (tau < 1.02) return 1;
    return 1 - easeInOut((tau - 1.02) / (RDUR - 1.02));
  }

  /* ── one mascot ─────────────────────────────────────────────────────── */

  function svg(inner) { return '<svg viewBox="0 0 ' + W + ' ' + H + '">' + inner + '</svg>'; }
  function eyeSVG(e) {
    return svg('<path d="' + e.eye + '" fill="' + P.ink + '"/>' +
      (e.dot ? '<path d="' + e.dot + '" fill="' + P.white + '"/>' : ''));
  }
  var swirls = (R.swirls || []).map(function (d) { return '<path d="' + d + '" fill="' + P.petal + '"/>'; }).join('');

  function Mascot(el) {
    this.el = el;
    this.lean = parseFloat(el.dataset.lean || '0');
    this.expr = el.dataset.expr === undefined || el.dataset.expr === '' ? null : parseFloat(el.dataset.expr);
    this.rewards = el.dataset.reward === '1';
    this.visible = false;
    this.t = Math.random() * 9;          // so a page of mascots does not breathe in lockstep

    el.innerHTML =
      '<div class="mascot__stage">' +
        '<div class="mascot__root"><div class="mascot__spine">' +
          '<div class="mascot__layer mascot__body">' + svg('<path d="' + R.body + '" fill="' + P.body + '"/>') + '</div>' +
          '<div class="mascot__neck">' +
            '<div class="mascot__glow"></div>' +
            '<div class="mascot__layer mascot__petals">' + svg('<path d="' + R.crown + '" fill="' + P.petal + '"/>') + '</div>' +
            '<div class="mascot__layer mascot__face">' + svg('<path d="' + R.face + '" fill="' + P.face + '"/>' + swirls) + '</div>' +
            '<div class="mascot__eyes">' +
              '<div class="mascot__layer mascot__eyeL">' + eyeSVG(R.eyeL) + '</div>' +
              '<div class="mascot__layer mascot__eyeR">' + eyeSVG(R.eyeR) + '</div>' +
            '</div>' +
            '<div class="mascot__layer mascot__mouth">' +
              svg('<path fill="none" stroke="' + P.ink + '" stroke-width="13" stroke-linecap="round"/>') + '</div>' +
            '<div class="mascot__sweat"></div>' +
          '</div>' +
        '</div></div>' +
      '</div>';

    var q = this.q = {};
    ['stage', 'root', 'spine', 'neck', 'petals', 'eyes', 'eyeL', 'eyeR', 'glow', 'sweat'].forEach(function (k) {
      q[k] = el.querySelector('.mascot__' + k);
    }, this);
    this.mouthPath = el.querySelector('.mascot__mouth path');

    origin(q.root, J.root); origin(q.spine, J.root); origin(q.neck, J.neck);
    origin(q.petals, J.flowerCenter); origin(q.eyeL, J.eyeL); origin(q.eyeR, J.eyeR);
    q.glow.style.left = J.flowerCenter[0] + 'px';
    q.glow.style.top = J.flowerCenter[1] + 'px';
    q.sweat.style.left = (J.eyeR[0] + 72) + 'px';
    q.sweat.style.top = (J.eyeR[1] - 42) + 'px';

    this.bodyLean = new Spring(3.5, 0.8, this.lean);
    this.headLean = new Spring(2.2, 0.55, this.lean);
    this.head = new Spring(1.7, 0.55);
    this.petal = new Spring(3.2, 0.42);
    this.dance = new Spring(1.65, 0.30);
    this.gx = new Spring(2.2, 0.7);
    this.gy = new Spring(2.2, 0.7);
    this.smile = new Spring(3.4, 0.85, this.expr !== null ? this.expr : 1 - this.lean);

    this.blinkAt = -99; this.dbl = false;
    this.nextBlink = this.t + 2 + Math.random() * 3;
    this.gazeTX = 0; this.gazeTY = 0; this.nextGaze = this.t + 2;
    this.nextGruv = this.t + 6 + Math.random() * 6;
    this.rewardT0 = this.rewards ? this.t + 1.2 : null;
    this.nextReward = this.t + 6.5;

    this.fit();
    this.render(this.t);
  }

  function origin(el, j) { el.style.transformOrigin = j[0] + 'px ' + j[1] + 'px'; }
  function setT(el, s) { el.style.transform = s; }

  Mascot.prototype.fit = function () {
    var w = this.el.clientWidth;
    if (!w) return;
    this.q.stage.style.transform = 'scale(' + (w / W) + ')';
  };

  Mascot.prototype.render = function (t) {
    var q = this.q;
    var swayW = TAU / 3.6, brW = TAU / 5.2, breath = Math.sin(t * brW);

    this.bodyLean.step(this.lean, 1 / 60);
    this.headLean.step(this.bodyLean.x, 1 / 60);
    var Lb = clamp(this.bodyLean.x, 0, 1.1), Lh = clamp(this.headLean.x, 0, 1.1);
    var D = 1 - 0.5 * Math.min(1, Lb);     // a slumped flower moves less

    if (this.rewards && this.rewardT0 === null && t >= this.nextReward) this.rewardT0 = t;
    var tau = this.rewardT0 !== null ? (t - this.rewardT0) : -1;
    var b = rewardB(tau);
    if (tau > RDUR) { this.rewardT0 = null; this.nextReward = t + 5.5 + Math.random() * 3; b = 0; }
    var bp = Math.max(0, b);

    var spineBend = (1.2 * Math.sin(t * swayW) + 0.22 * Math.sin(t * swayW * 0.5 + 1.0)) * D;
    var swayX = 2.4 * Math.sin(t * swayW - 0.2) * D;
    if (t >= this.nextGruv) {
      if (Lb < 0.25 && this.rewardT0 === null) this.dance.v += 3.0;
      this.nextGruv = t + 11 + Math.random() * 6;
    }
    this.dance.step(0, 1 / 60);
    var hop = Math.max(0, this.dance.x);

    var sY = 1 + 0.008 * breath * D + 0.014 * hop, sX = 1 - 0.004 * breath * D - 0.006 * hop;
    setT(q.root, 'translate(' + swayX.toFixed(2) + 'px,' + (-5 * hop).toFixed(2) + 'px) scale(' + sX.toFixed(4) + ',' + sY.toFixed(4) + ')');
    setT(q.spine, 'rotate(' + (spineBend + Lb * 4.2).toFixed(3) + 'deg)');

    this.head.step(spineBend * 0.5, 1 / 60);
    var ny = 2.4 * Math.sin(t * swayW + 0.6) * D - bp * 10, nx = 2 * Math.sin(t * swayW - 0.3) * D;
    setT(q.neck, 'translate(' + nx.toFixed(2) + 'px,' + ny.toFixed(2) + 'px) rotate(' + (this.head.x + Lh * 16).toFixed(3) + 'deg) scale(' + (1 + bp * 0.12).toFixed(4) + ')');

    // The petals lag behind the head: idle follow-through plus the slouch tilt.
    this.petal.step(-this.head.v * 0.045 - this.headLean.v * 4.5 + 0.35 * Math.sin(t * TAU / 2.3) * D, 1 / 60);
    setT(q.petals, 'rotate(' + this.petal.x.toFixed(3) + 'deg) scale(' + ((1 + 0.005 * breath * D) * (1 + bp * 0.06)).toFixed(4) + ')');

    if (t >= this.nextBlink) { this.blinkAt = t; this.dbl = Math.random() < 0.20; this.nextBlink = t + 3.2 + Math.random() * 4.2; }
    if (t >= this.nextGaze) { this.nextGaze = t + 3.2 + Math.random() * 3.6; this.gazeTX = (Math.random() * 2 - 1) * 4; this.gazeTY = (Math.random() * 2 - 1) * 2.4; }
    this.gx.step(this.gazeTX, 1 / 60); this.gy.step(this.gazeTY, 1 / 60);
    setT(q.eyes, 'translate(' + (this.gx.x * D).toFixed(2) + 'px,' + (this.gy.x * D).toFixed(2) + 'px)');

    var eo = this.eyeOpen(t) * (1 - 0.30 * bp);
    setT(q.eyeL, 'scaleY(' + eo.toFixed(3) + ')');
    setT(q.eyeR, 'scaleY(' + eo.toFixed(3) + ')');

    // The mouth is a parametric quadratic: only the control point moves.
    this.smile.step(this.expr !== null ? this.expr : 1 - this.lean, 1 / 60);
    var S = clamp(this.smile.x, -0.05, 1.15);
    var mcx = J.mouth[0], my = J.mouth[1] - 7;
    var ctrlY = my + (-28 + S * 70) + bp * 12, hw = 38 + bp * 6;
    this.mouthPath.setAttribute('d', 'M ' + (mcx - hw).toFixed(1) + ' ' + my.toFixed(1) + ' Q ' + mcx + ' ' + ctrlY.toFixed(1) + ' ' + (mcx + hw).toFixed(1) + ' ' + my.toFixed(1));

    q.glow.style.opacity = (0.5 * bp).toFixed(3);
    setT(q.glow, 'translate(-50%,-50%) scale(' + (1 + 0.35 * bp).toFixed(3) + ')');

    // Sweat appears past a real slump and slides down the temple.
    var sweat = clamp((Lb - 0.6) / 0.4, 0, 1);
    q.sweat.style.opacity = (0.85 * Math.min(1, sweat * 2)).toFixed(3);
    setT(q.sweat, 'translate(0,' + (sweat * 78).toFixed(1) + 'px) rotate(45deg)');
  };

  Mascot.prototype.eyeOpen = function (t) {
    function env(p) {
      if (p < 0 || p > 0.30) return 1;
      if (p < 0.085) return 1 - (p / 0.085) * 0.9;
      if (p < 0.15) return 0.1;
      return 0.1 + ((p - 0.15) / 0.15) * 0.9;
    }
    var e = t - this.blinkAt, o = env(e);
    if (this.dbl) o = Math.min(o, env(e - 0.32));
    return o;
  };

  /* Pose from outside — the nudge panel uses this to slump the flower as the
     section arrives, the way the app does when a nudge fires. */
  Mascot.prototype.setPose = function (lean, expr) {
    this.lean = lean;
    this.expr = expr === undefined ? null : expr;
  };

  /* ── one loop for every instance on the page ────────────────────────── */

  var live = [];
  var last = 0;

  function frame(now) {
    var dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60;
    last = now;
    for (var i = 0; i < live.length; i++) {
      var m = live[i];
      if (!m.visible) continue;
      m.t += dt;
      m.render(m.t);
    }
    requestAnimationFrame(frame);
  }

  function mountAll(root) {
    var els = (root || document).querySelectorAll('.mascot:not([data-mounted])');
    if (!els.length) return;

    var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.target.__mascot) e.target.__mascot.visible = e.isIntersecting; });
    }, { rootMargin: '120px' }) : null;

    var ro = 'ResizeObserver' in window ? new ResizeObserver(function (entries) {
      entries.forEach(function (e) { if (e.target.__mascot) e.target.__mascot.fit(); });
    }) : null;

    els.forEach(function (el) {
      el.setAttribute('data-mounted', '');
      var m = new Mascot(el);
      el.__mascot = m;
      live.push(m);
      if (ro) ro.observe(el);
      if (REDUCED) { m.visible = false; return; }   // one settled frame, then still
      if (io) io.observe(el); else m.visible = true;
    });

    if (!REDUCED && live.length && !last) requestAnimationFrame(frame);
  }

  window.PillarMascot = {
    mount: mountAll,
    get: function (el) { return el && el.__mascot; }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { mountAll(); });
  } else {
    mountAll();
  }
})();
