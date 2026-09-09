/**
 * Leaderboard API for the Human Atlas SPCS service.
 *
 * Runs alongside nginx inside the same container; nginx reverse-proxies /api/
 * here on localhost. Because it lives in the existing container, the SPCS
 * service spec is untouched and the public endpoint URL stays stable.
 *
 * Auth uses the SPCS-injected OAuth token at /snowflake/session/token against
 * the Snowflake SQL API. No npm dependencies — Node built-ins only.
 */

import http from 'node:http';
import https from 'node:https';
import { readFileSync } from 'node:fs';

const PORT = Number(process.env.API_PORT || 3001);
const TOKEN_PATH = '/snowflake/session/token';
const HOST = process.env.SNOWFLAKE_HOST || '';
const DATABASE = process.env.SNOWFLAKE_DATABASE || 'HUMAN_ATLAS_DB';
const SCHEMA = process.env.SNOWFLAKE_SCHEMA || 'PUBLIC';
const WAREHOUSE = process.env.SNOWFLAKE_WAREHOUSE || 'COMPUTE_WH';
const TABLE = 'LEADERBOARD';

const DIFFICULTIES = new Set(['elementary', 'middle', 'high', 'college', 'medical']);
const MAX_NAME = 24;

function log(...args) { console.log('[leaderboard-api]', ...args); }

function readToken() {
  try {
    return readFileSync(TOKEN_PATH, 'utf8').trim();
  } catch (err) {
    log('token read failed:', err.message);
    return null;
  }
}

/**
 * Execute one statement through the Snowflake SQL API.
 * Bindings are always used for user-supplied values — no string interpolation.
 */
function execSQL(statement, bindings) {
  return new Promise((resolve, reject) => {
    const token = readToken();
    if (!token) return reject(new Error('no OAuth token available'));
    if (!HOST) return reject(new Error('SNOWFLAKE_HOST not set'));

    const payload = JSON.stringify({
      statement,
      timeout: 30,
      database: DATABASE,
      schema: SCHEMA,
      warehouse: WAREHOUSE,
      ...(bindings ? { bindings } : {}),
    });

    const req = https.request({
      hostname: HOST,
      port: 443,
      path: '/api/v2/statements',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Snowflake-Authorization-Token-Type': 'OAUTH',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(body)); }
          catch (e) { reject(new Error('bad JSON from SQL API: ' + e.message)); }
        } else {
          reject(new Error(`SQL API ${res.statusCode}: ${body.slice(0, 500)}`));
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

/** Map SQL API row arrays into leaderboard entry objects. */
function toEntries(result) {
  const rows = result?.data ?? [];
  return rows.map((r) => ({
    name: r[0],
    score: Number(r[1]),
    difficulty: r[2],
    correct: r[3] == null ? 0 : Number(r[3]),
    total: r[4] == null ? 0 : Number(r[4]),
    date: r[5],
  }));
}

const SELECT_COLS = 'PLAYER_NAME, SCORE, DIFFICULTY, CORRECT_COUNT, TOTAL_COUNT, TO_VARCHAR(CREATED_AT, \'YYYY-MM-DD"T"HH24:MI:SS\')';

async function getLeaderboard(scope, limit) {
  const where = scope === 'today' ? 'WHERE CREATED_AT >= CURRENT_DATE()' : '';
  // `limit` is already clamped to an integer in the request handler. Snowflake
  // does not reliably accept a bind variable in LIMIT, so it is interpolated
  // here — safe precisely because it can only ever be a validated integer.
  const n = Math.min(50, Math.max(1, Number.parseInt(limit, 10) || 10));
  const sql = `SELECT ${SELECT_COLS} FROM ${TABLE} ${where} ORDER BY SCORE DESC, CREATED_AT ASC LIMIT ${n}`;
  const result = await execSQL(sql);
  return toEntries(result);
}

async function insertScore(entry) {
  const sql = `INSERT INTO ${TABLE} (PLAYER_NAME, SCORE, DIFFICULTY, CORRECT_COUNT, TOTAL_COUNT)
               SELECT ?, ?, ?, ?, ?`;
  await execSQL(sql, {
    '1': { type: 'TEXT', value: entry.name },
    '2': { type: 'FIXED', value: String(entry.score) },
    '3': { type: 'TEXT', value: entry.difficulty },
    '4': { type: 'FIXED', value: String(entry.correct) },
    '5': { type: 'FIXED', value: String(entry.total) },
  });
}

/** Reject anything that isn't a well-formed score submission. */
function validate(body) {
  if (!body || typeof body !== 'object') return 'body must be an object';
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, MAX_NAME) : '';
  if (!name) return 'name is required';
  const score = Number(body.score);
  if (!Number.isFinite(score) || score < 0 || score > 1e7) return 'score out of range';
  if (!DIFFICULTIES.has(body.difficulty)) return 'unknown difficulty';
  const correct = Number(body.correct ?? 0), total = Number(body.total ?? 0);
  if (!Number.isFinite(correct) || !Number.isFinite(total)) return 'correct/total must be numbers';
  return {
    name,
    score: Math.round(score),
    difficulty: body.difficulty,
    correct: Math.max(0, Math.round(correct)),
    total: Math.max(0, Math.round(total)),
  };
}

function json(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (url.pathname === '/api/health') {
    return json(res, 200, { ok: true, host: HOST ? 'set' : 'missing', token: readToken() ? 'set' : 'missing' });
  }

  if (req.method === 'GET' && url.pathname === '/api/leaderboard') {
    const scope = url.searchParams.get('scope') === 'today' ? 'today' : 'alltime';
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit')) || 10));
    try {
      return json(res, 200, { scope, entries: await getLeaderboard(scope, limit) });
    } catch (err) {
      log('read failed:', err.message);
      return json(res, 502, { error: 'leaderboard unavailable' });
    }
  }

  if (req.method === 'POST' && url.pathname === '/api/score') {
    let raw = '';
    let tooBig = false;
    req.on('data', (c) => {
      raw += c;
      if (raw.length > 4096) { tooBig = true; req.destroy(); }
    });
    req.on('end', async () => {
      if (tooBig) return json(res, 413, { error: 'payload too large' });
      let parsed;
      try { parsed = JSON.parse(raw); } catch { return json(res, 400, { error: 'invalid JSON' }); }
      const entry = validate(parsed);
      if (typeof entry === 'string') return json(res, 400, { error: entry });
      try {
        await insertScore(entry);
        return json(res, 201, { ok: true });
      } catch (err) {
        log('write failed:', err.message);
        return json(res, 502, { error: 'could not save score' });
      }
    });
    return;
  }

  json(res, 404, { error: 'not found' });
});

server.listen(PORT, '127.0.0.1', () => log(`listening on 127.0.0.1:${PORT}`));
