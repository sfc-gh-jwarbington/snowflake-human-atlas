import {type Difficulty} from './game-questions';

export interface ScoreEntry {
  name: string;
  score: number;
  difficulty: Difficulty;
  date: string;
  correct: number;
  total: number;
}

const STORAGE_KEY = 'human-atlas-leaderboard';

function load(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function save(entries: ScoreEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function saveScore(entry: ScoreEntry) {
  const entries = load();
  entries.push(entry);
  entries.sort((a, b) => b.score - a.score);
  if (entries.length > 200) entries.length = 200;
  save(entries);
}

export function getTopAllTime(limit = 10): ScoreEntry[] {
  return load().sort((a, b) => b.score - a.score).slice(0, limit);
}

export function getTopToday(limit = 10): ScoreEntry[] {
  const today = new Date().toISOString().slice(0, 10);
  return load()
    .filter(e => e.date.startsWith(today))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
