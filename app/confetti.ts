/**
 * Dependency-free canvas confetti.
 *
 * Two entry points:
 *   burst()     - short celebratory pop for a correct answer
 *   celebrate() - longer, denser show for making the leaderboard
 *
 * A single full-screen canvas is lazily created, shared by both, and torn down
 * once the last particle settles so we never keep a compositing layer alive.
 */

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  rot: number; vr: number;
  color: string;
  /** Remaining life in frames; drives the fade-out. */
  life: number;
  maxLife: number;
  /** Flat ribbons tumble; circles just spin. */
  shape: 'rect'|'circle';
}

const PALETTE = ['#458a85', '#d88ca0', '#d9a520', '#538d9a', '#c05245', '#7a5ea8', '#2f6f8f', '#e8c04a'];

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let particles: Particle[] = [];
let raf = 0;
let dpr = 1;

function ensureCanvas(): CanvasRenderingContext2D | null {
  if (ctx && canvas && canvas.isConnected) return ctx;
  canvas = document.createElement('canvas');
  canvas.className = 'confetti-canvas';
  // Inline so this works even if the stylesheet hasn't loaded yet.
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:200';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  ctx = canvas.getContext('2d');
  resize();
  return ctx;
}

function resize() {
  if (!canvas || !ctx) return;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function teardown() {
  cancelAnimationFrame(raf);
  raf = 0;
  particles = [];
  if (canvas && canvas.isConnected) canvas.remove();
  canvas = null;
  ctx = null;
}

function frame() {
  if (!ctx || !canvas) return;
  const w = window.innerWidth, h = window.innerHeight;
  ctx.clearRect(0, 0, w, h);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.vy += 0.12;          // gravity
    p.vx *= 0.995;         // air drag
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    p.life--;

    // Retire once spent or comfortably off the bottom.
    if (p.life <= 0 || p.y > h + 40) { particles.splice(i, 1); continue; }

    const alpha = Math.min(1, p.life / (p.maxLife * 0.35));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    if (p.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Squash vertically as it tumbles so ribbons read as 3D.
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    }
    ctx.restore();
  }

  if (particles.length === 0) { teardown(); return; }
  raf = requestAnimationFrame(frame);
}

function start() {
  if (!raf) raf = requestAnimationFrame(frame);
}

function spawn(
  count: number,
  originX: number,
  originY: number,
  opts: { spread?: number; power?: number; angle?: number; life?: number; size?: number } = {}
) {
  const { spread = Math.PI * 2, power = 9, angle = -Math.PI / 2, life = 90, size = 9 } = opts;
  for (let i = 0; i < count; i++) {
    const a = angle + (Math.random() - 0.5) * spread;
    const speed = power * (0.45 + Math.random() * 0.75);
    const maxLife = life * (0.7 + Math.random() * 0.6);
    particles.push({
      x: originX, y: originY,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      size: size * (0.6 + Math.random() * 0.8),
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.3,
      color: PALETTE[(Math.random() * PALETTE.length) | 0],
      life: maxLife, maxLife,
      shape: Math.random() > 0.35 ? 'rect' : 'circle',
    });
  }
}

/** Honour users who have asked for reduced motion. */
function motionOK(): boolean {
  return !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Short pop for a correct answer. Defaults to the upper-right quadrant, near
 * the question panel, but accepts an explicit origin.
 */
export function burst(originX?: number, originY?: number) {
  if (!motionOK() || !ensureCanvas()) return;
  const x = originX ?? window.innerWidth * 0.72;
  const y = originY ?? window.innerHeight * 0.42;
  spawn(80, x, y, { spread: Math.PI * 2, power: 8, life: 70, size: 9 });
  start();
}

/**
 * Bigger, longer show for landing on the leaderboard: two angled side cannons
 * plus a few seconds of rain from the top edge.
 */
export function celebrate() {
  if (!motionOK() || !ensureCanvas()) return;
  const w = window.innerWidth, h = window.innerHeight;

  // Side cannons, angled inward and up.
  spawn(110, 0, h * 0.72, { angle: -Math.PI / 3.2, spread: Math.PI / 2.6, power: 17, life: 150, size: 11 });
  spawn(110, w, h * 0.72, { angle: -Math.PI + Math.PI / 3.2, spread: Math.PI / 2.6, power: 17, life: 150, size: 11 });
  start();

  // Staggered rain so the show sustains rather than front-loading.
  let waves = 0;
  const rain = setInterval(() => {
    if (++waves > 8 || !ensureCanvas()) { clearInterval(rain); return; }
    spawn(26, Math.random() * w, -20, { angle: Math.PI / 2, spread: Math.PI / 3, power: 4, life: 140, size: 10 });
    start();
  }, 380);
}

window.addEventListener('resize', () => { if (canvas) resize(); });
