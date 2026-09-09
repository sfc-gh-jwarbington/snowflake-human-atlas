/**
 * Synthesized sound effects for Game Mode.
 *
 * Everything is generated at runtime with the Web Audio API — no audio files,
 * no licensing, no bundle cost. The AudioContext is created lazily on the first
 * user gesture because browsers block audio before one.
 *
 * Volume is deliberately conservative (MASTER_GAIN) so the effects read as
 * subtle feedback rather than arcade noise.
 */

const MUTE_KEY = 'human-atlas-muted';
const MASTER_GAIN = 0.25;

let actx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
/** Shared noise buffer for the explode-scrub sweep. */
let noiseBuffer: AudioBuffer | null = null;

try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch { /* private mode */ }

export function isMuted(): boolean { return muted; }

export function setMuted(next: boolean) {
  muted = next;
  try { localStorage.setItem(MUTE_KEY, next ? '1' : '0'); } catch { /* ignore */ }
  if (master && actx) master.gain.setTargetAtTime(next ? 0 : MASTER_GAIN, actx.currentTime, 0.02);
}

/**
 * Returns a running context, or null when audio is unavailable or muted.
 * Safe to call on every effect — it resumes a suspended context, which is what
 * happens after tab-switching.
 */
function ctx(): AudioContext | null {
  if (muted) return null;
  if (!actx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    try { actx = new AC(); } catch { return null; }
    master = actx.createGain();
    master.gain.value = MASTER_GAIN;
    master.connect(actx.destination);
  }
  if (actx.state === 'suspended') void actx.resume();
  return actx;
}

/** One enveloped oscillator note. */
function note(
  freq: number,
  start: number,
  dur: number,
  opts: { type?: OscillatorType; gain?: number; sweepTo?: number } = {}
) {
  const a = ctx(); if (!a || !master) return;
  const { type = 'sine', gain = 0.6, sweepTo } = opts;
  const t = a.currentTime + start;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (sweepTo != null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, sweepTo), t + dur);
  // Short attack, exponential decay — reads as a struck tone.
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.015, dur * 0.2));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g); g.connect(master);
  osc.start(t); osc.stop(t + dur + 0.02);
}

// 1. Entering Game Mode — ascending arpeggio.
export function gameStart() {
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
    note(f, i * 0.075, 0.28, { type: 'triangle', gain: 0.45 }));
}

// 2. Picking an option in a dialog — tiny blip.
export function uiSelect() {
  note(880, 0, 0.05, { type: 'sine', gain: 0.3 });
}

// 3. Clicking a body structure in the 3D model — soft low thud.
export function bodyClick() {
  const a = ctx(); if (!a || !master) return;
  const t = a.currentTime;
  const osc = a.createOscillator();
  const g = a.createGain();
  const lp = a.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 500;
  osc.type = 'sine';
  osc.frequency.setValueAtTime(190, t);
  osc.frequency.exponentialRampToValueAtTime(110, t + 0.12);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.5, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
  osc.connect(lp); lp.connect(g); g.connect(master);
  osc.start(t); osc.stop(t + 0.16);
}

// 4. Correct answer — bright major triad.
export function correct() {
  [659.25, 830.61, 987.77].forEach((f, i) =>
    note(f, i * 0.045, 0.42, { type: 'triangle', gain: 0.42 }));
}

// 5. Wrong answer — descending two-tone buzz.
export function wrong() {
  note(233.08, 0, 0.16, { type: 'sawtooth', gain: 0.22, sweepTo: 196 });
  note(155.56, 0.13, 0.22, { type: 'sawtooth', gain: 0.2, sweepTo: 130.81 });
}

// 6. End of the round — four-note resolving cadence.
export function roundEnd() {
  [392, 523.25, 659.25, 783.99].forEach((f, i) =>
    note(f, i * 0.13, 0.4, { type: 'triangle', gain: 0.4 }));
}

// 7. Made the leaderboard — celebratory fanfare.
export function leaderboard() {
  const seq: [number, number][] = [
    [523.25, 0], [659.25, 0.1], [783.99, 0.2],
    [1046.5, 0.32], [783.99, 0.46], [1046.5, 0.56], [1318.5, 0.68],
  ];
  seq.forEach(([f, t]) => note(f, t, 0.5, { type: 'triangle', gain: 0.4 }));
  // Fifth underneath for body.
  note(261.63, 0.32, 0.9, { type: 'sine', gain: 0.22 });
  note(392, 0.68, 0.8, { type: 'sine', gain: 0.2 });
}

/**
 * 8. Countdown tick for the final seconds. Pitch climbs as the clock runs out,
 * so urgency is audible without changing volume.
 */
export function tick(secondsLeft: number) {
  const pitch = 660 + Math.max(0, 10 - secondsLeft) * 55;
  note(pitch, 0, 0.055, { type: 'square', gain: secondsLeft <= 5 ? 0.3 : 0.18 });
}

/**
 * 9. Explode scrubber — short bandpass-filtered noise burst whose centre
 * frequency tracks the explode amount (0..1), so scrubbing sounds like a sweep.
 */
export function scrub(amount: number) {
  const a = ctx(); if (!a || !master) return;
  if (!noiseBuffer) {
    const len = Math.floor(a.sampleRate * 0.25);
    noiseBuffer = a.createBuffer(1, len, a.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }
  const t = a.currentTime;
  const src = a.createBufferSource();
  src.buffer = noiseBuffer;
  const bp = a.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 320 + Math.min(1, Math.max(0, amount)) * 2600;
  bp.Q.value = 6;
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.14, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
  src.connect(bp); bp.connect(g); g.connect(master);
  src.start(t); src.stop(t + 0.09);
}
