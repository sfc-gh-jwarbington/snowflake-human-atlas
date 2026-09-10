/**
 * Quiz fairness simulation.
 *
 * Generates many rounds per difficulty and asserts the properties we actually
 * care about, rather than eyeballing a couple of rounds:
 *   - no `system-id` ("tap anything in system X") above Middle School
 *   - no two adjacent questions from the same system
 *   - no "which system does X belong to?" where the name gives it away
 *   - reasonable spread of systems, i.e. cardiovascular no longer dominates
 *
 * Run: npx tsx scripts/simulate-quizzes.mts
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  generateQuiz, answerLeaksFromName, DIFFICULTY_TYPES,
  type Difficulty, type Question,
} from '../app/game-questions';
import { SYSTEMS, type Atlas, type SystemId } from '../app/anatomy';

const HERE = dirname(fileURLToPath(import.meta.url));
const atlas: Atlas = JSON.parse(readFileSync(join(HERE, '..', 'public', 'models', 'atlas.json'), 'utf8'));

const ROUNDS = 30;
const DIFFICULTIES: Difficulty[] = ['elementary', 'middle', 'high', 'college', 'medical'];
const HARD: Difficulty[] = ['high', 'college', 'medical'];

const partById = new Map(atlas.parts.map(p => [p.id, p]));
function systemOf(q: Question): string {
  if (q.targetSystem) return q.targetSystem;
  for (const id of q.targetPartIds) {
    const p = partById.get(id);
    if (p) return p.system;
  }
  return 'unknown';
}

const failures: string[] = [];
let totalQuestions = 0;
const systemHits: Record<string, number> = {};
const typeHits: Record<string, Record<string, number>> = {};
let adjacentRepeats = 0;
let duplicateWithinRound = 0;
let replayOverlap = 0;

for (const difficulty of DIFFICULTIES) {
  typeHits[difficulty] = {};
  let prevRound: string[] = [];

  for (let r = 0; r < ROUNDS; r++) {
    const quiz = generateQuiz(atlas, difficulty, prevRound);

    if (quiz.length !== 5) failures.push(`${difficulty} round ${r}: got ${quiz.length} questions, expected 5`);

    // Cross-round variety: an immediate replay should not reuse concepts.
    const names = quiz.map(q => q.targetConceptName);
    if (prevRound.length) {
      const overlap = names.filter(n => prevRound.includes(n));
      if (overlap.length) replayOverlap += overlap.length;
    }

    // No duplicate concept inside a single round.
    if (new Set(names).size !== names.length) duplicateWithinRound++;

    for (let i = 0; i < quiz.length; i++) {
      const q = quiz[i];
      totalQuestions++;
      typeHits[difficulty][q.type] = (typeHits[difficulty][q.type] ?? 0) + 1;
      const sys = systemOf(q);
      systemHits[sys] = (systemHits[sys] ?? 0) + 1;

      // 1. system-id must not appear at high/college/medical
      if (q.type === 'system-id' && HARD.includes(difficulty)) {
        failures.push(`${difficulty}: system-id question appeared ("${q.prompt}")`);
      }

      // 2. giveaway trivia
      if (q.type === 'multiple-choice' && /^Which system does the /.test(q.prompt)) {
        const sysName = SYSTEMS.find(s => s.id === sys)?.name ?? '';
        if (answerLeaksFromName(q.targetConceptName, sys as SystemId, sysName)) {
          failures.push(`${difficulty}: leaky trivia "${q.prompt}" -> ${sysName}`);
        }
        if (['college', 'medical'].includes(difficulty)) {
          failures.push(`${difficulty}: system-trivia MC should be banned ("${q.prompt}")`);
        }
      }

      // 3. adjacent same-system
      if (i > 0 && systemOf(quiz[i - 1]) === sys && sys !== 'unknown') adjacentRepeats++;
    }

    prevRound = names;
  }
}

// --- report ---------------------------------------------------------------
console.log(`\nsimulated ${ROUNDS} rounds x ${DIFFICULTIES.length} difficulties = ${totalQuestions} questions\n`);

console.log('question types by difficulty:');
for (const d of DIFFICULTIES) {
  const expected = DIFFICULTY_TYPES[d].reduce<Record<string, number>>((a, t) => { a[t] = (a[t] ?? 0) + 1; return a; }, {});
  const got = Object.entries(typeHits[d]).map(([k, v]) => `${k}=${v}`).join('  ');
  console.log(`  ${d.padEnd(11)} ${got}`);
  console.log(`  ${''.padEnd(11)} expected per round: ${JSON.stringify(expected)}`);
}

console.log('\nsystem distribution across all questions:');
const totalSys = Object.values(systemHits).reduce((a, b) => a + b, 0);
for (const [k, v] of Object.entries(systemHits).sort((a, b) => b[1] - a[1])) {
  const pct = ((v / totalSys) * 100).toFixed(1);
  console.log(`  ${k.padEnd(18)} ${String(v).padStart(5)}  ${pct}%`);
}

// Share of parts that are cardiovascular, for comparison.
const cvParts = atlas.parts.filter(p => p.system === 'cardiovascular').length;
console.log(`\n  (cardiovascular is ${((cvParts / atlas.parts.length) * 100).toFixed(1)}% of all parts)`);

console.log(`\nadjacent same-system questions: ${adjacentRepeats}`);
console.log(`duplicate concept within a round: ${duplicateWithinRound}`);
console.log(`concepts reused on immediate replay: ${replayOverlap}`);

if (adjacentRepeats > 0) failures.push(`${adjacentRepeats} adjacent same-system question pairs`);
if (duplicateWithinRound > 0) failures.push(`${duplicateWithinRound} rounds had a duplicate concept`);
if (replayOverlap > 0) failures.push(`${replayOverlap} concepts reused on an immediate replay`);

const unique = [...new Set(failures)];
console.log(unique.length ? `\nFAILURES (${failures.length} total, ${unique.length} distinct):` : '\nALL FAIRNESS CHECKS PASSED');
for (const f of unique.slice(0, 15)) console.log('  - ' + f);
process.exit(unique.length ? 1 : 0);
