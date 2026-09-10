import {type Difficulty, LEGACY_DIFFICULTY_MULTIPLIER} from './game-questions';

export interface ScoreEntry {
  name: string;
  score: number;
  difficulty: Difficulty;
  date: string;
  correct: number;
  total: number;
}

const STORAGE_KEY = 'human-atlas-leaderboard';
const MIGRATED_KEY = 'human-atlas-leaderboard-migrated';
const API = '/api';

/** True once a request to the API has failed, so we stop retrying every read. */
let apiDown = false;

// ---------------------------------------------------------------------------
// Local cache. Doubles as the offline/dev store and as an optimistic cache so
// the leaderboard renders instantly before the network round-trip lands.
// ---------------------------------------------------------------------------

function loadLocal(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function saveLocal(entries: ScoreEntry[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); } catch { /* private mode */ }
}

function addLocal(entry: ScoreEntry) {
  const entries = loadLocal();
  entries.push(entry);
  entries.sort((a, b) => b.score - a.score);
  if (entries.length > 200) entries.length = 200;
  saveLocal(entries);
}

function topLocal(entries: ScoreEntry[], limit: number): ScoreEntry[] {
  return [...entries].sort((a, b) => b.score - a.score).slice(0, limit);
}

// ---------------------------------------------------------------------------
// Remote (Snowflake-backed) store
// ---------------------------------------------------------------------------

async function fetchRemote(scope: 'today'|'alltime', limit: number): Promise<ScoreEntry[]|null> {
  if (apiDown) return null;
  try {
    const res = await fetch(`${API}/leaderboard?scope=${scope}&limit=${limit}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json() as { entries?: unknown };
    return Array.isArray(body.entries) ? body.entries as ScoreEntry[] : [];
  } catch {
    // One failure is enough to assume we're running without the API (local dev).
    apiDown = true;
    return null;
  }
}

async function postRemote(entry: ScoreEntry): Promise<boolean> {
  if (apiDown) return false;
  try {
    const res = await fetch(`${API}/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: entry.name, score: entry.score, difficulty: entry.difficulty,
        correct: entry.correct, total: entry.total,
      }),
    });
    return res.ok;
  } catch {
    apiDown = true;
    return false;
  }
}

/**
 * One-time upload of any scores that were recorded before the shared
 * leaderboard existed, so upgrading doesn't appear to lose history.
 *
 * Legacy scores were multiplied by a per-difficulty factor (up to 5x for
 * Medical School) that has since been removed. They are divided back down here
 * so an inflated old score can't permanently top the shared board.
 */
async function migrateLocalScores() {
  try {
    if (localStorage.getItem(MIGRATED_KEY) === '1') return;
    const local = loadLocal();
    if (local.length === 0) { localStorage.setItem(MIGRATED_KEY, '1'); return; }
    const normalized = local.map(normalizeLegacyScore);
    const results = await Promise.all(normalized.map(e => postRemote(e)));
    // Only mark done if every row made it, otherwise retry on the next load.
    if (results.every(Boolean)) {
      localStorage.setItem(MIGRATED_KEY, '1');
      // Keep the local cache consistent with what we just uploaded.
      saveLocal(normalized.sort((a, b) => b.score - a.score));
    }
  } catch { /* ignore */ }
}

/** Divide out the retired difficulty multiplier from a pre-existing score. */
function normalizeLegacyScore(e: ScoreEntry): ScoreEntry {
  const factor = LEGACY_DIFFICULTY_MULTIPLIER[e.difficulty] ?? 1;
  if (factor === 1) return e;
  return { ...e, score: Math.max(0, Math.round(e.score / factor)) };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Persist a score. Writes to the shared table when the API is reachable and
 * always keeps a local copy so the player still sees their own history offline.
 */
export async function saveScore(entry: ScoreEntry): Promise<void> {
  addLocal(entry);
  await postRemote(entry);
}

export async function getTopAllTime(limit = 10): Promise<ScoreEntry[]> {
  const remote = await fetchRemote('alltime', limit);
  return remote ?? topLocal(loadLocal(), limit);
}

export async function getTopToday(limit = 10): Promise<ScoreEntry[]> {
  const remote = await fetchRemote('today', limit);
  if (remote) return remote;
  const today = new Date().toISOString().slice(0, 10);
  return topLocal(loadLocal().filter(e => e.date.startsWith(today)), limit);
}

/** Whether the shared leaderboard is currently reachable. */
export function isRemoteAvailable(): boolean { return !apiDown; }

/** Kick off the legacy-score migration; safe to call more than once. */
export function initLeaderboard() { void migrateLocalScores(); }
