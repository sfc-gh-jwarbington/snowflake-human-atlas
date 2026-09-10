/**
 * Remap the atlas onto Cleveland Clinic's 12 canonical body systems and assign
 * sub-systems for systems where sub-division aids isolation.
 *
 * Source taxonomy:
 *   https://my.clevelandclinic.org/health/body/human-body-anatomy
 *
 * Fixes four genuine misfilings in the source data:
 *   1. `cardiac` ("Heart") mixed brain ventricles in with heart valves.
 *   2. `arterial` / `venous` were vessel types, not systems.
 *   3. 30 teeth and gingiva were filed as skeletal (teeth are not bones).
 *   4. Laryngeal and nasal cartilages were skeletal despite forming the airway.
 *
 * Idempotent: re-running on already-remapped data is a no-op. The original file
 * is preserved as atlas.pre-remap.json on first run.
 *
 * Usage: node scripts/remap-systems.mjs [--dry-run]
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ATLAS = join(HERE, '..', 'public', 'models', 'atlas.json');
const BACKUP = join(HERE, '..', 'public', 'models', 'atlas.pre-remap.json');
const REPORT = join(HERE, '..', 'unmapped-parts.md');
const DRY = process.argv.includes('--dry-run');

const VALID_SYSTEMS = [
  'cardiovascular', 'endocrine', 'exocrine', 'gastrointestinal',
  'integumentary', 'lymphatic', 'muscular', 'nervous',
  'reproductive', 'respiratory', 'skeletal', 'urinary',
];

const has = (name, ...kw) => {
  const l = name.toLowerCase();
  return kw.some(k => l.includes(k));
};
const re = (name, pattern) => pattern.test(name.toLowerCase());

// ---------------------------------------------------------------------------
// System assignment
// ---------------------------------------------------------------------------

/** Brain ventricles / CSF spaces that were wrongly filed under `cardiac`. */
const BRAIN_VENTRICLE = /\b(third|fourth|lateral)\b.*\bventricle\b|interventricular foramen/;

/** Teeth and gums: not bones, conventionally taught with digestion. */
const DENTAL = /\b(tooth|teeth|molar|incisor|canine|premolar|gingiva)/;

/** Cartilages that form the larynx or the nasal airway. */
const AIRWAY_CARTILAGE = /\b(cricoid|thyroid|arytenoid|corniculate|cuneiform|epiglottic|alar|septal|tracheal)\b.*cartilage|cartilage of (the )?(nose|larynx|trachea)/;

/**
 * Named muscles and muscle fascia that the source data files under `skeletal`.
 * NOTE: these regexes intentionally use a leading \b only. Adding a trailing
 * \b breaks stem matching -- `\bphalan\b` never matches "phalanx".
 */
const MISFILED_MUSCLE = /\b(fibularis|tibialis anterior|tibialis posterior|subscapularis|levator scapulae|iliotibial tract)/;

/** Returns { system, explicit } — explicit=false means a fallback rule fired. */
function assignSystem(part) {
  const n = part.name;
  const old = part.system;

  switch (old) {
    case 'arterial':
    case 'venous':
      return { system: 'cardiovascular', explicit: true };

    case 'cardiac':
      // The mislabelled brain ventricles.
      if (re(n, BRAIN_VENTRICLE)) return { system: 'nervous', explicit: true };
      return { system: 'cardiovascular', explicit: true };

    case 'sensory':
      // Cleveland Clinic puts tears under the exocrine system.
      if (has(n, 'lacrimal', 'nasolacrimal')) return { system: 'exocrine', explicit: true };
      // Extraocular muscles and their tendinous ring are muscular.
      if (re(n, /\b(rectus|oblique|levator palpebrae|tendinous ring)\b/)) {
        return { system: 'muscular', explicit: true };
      }
      // Remaining eye/ear structures: vision and hearing are nervous functions.
      return { system: 'nervous', explicit: true };

    case 'connective':
      if (has(n, 'tendon', 'trochlea', 'aponeurosis')) return { system: 'muscular', explicit: true };
      if (has(n, 'ligament', 'membrane', 'cartilage', 'meniscus', 'disc', 'labrum')) {
        return { system: 'skeletal', explicit: true };
      }
      // Fascia, raphes, tendinous arches, linea alba, conus elasticus: all
      // muscle-associated connective tissue. Reported for later naming.
      return { system: 'muscular', explicit: false };

    case 'digestive':
      if (has(n, 'submandibular gland', 'sublingual gland', 'parotid')) {
        return { system: 'exocrine', explicit: true };
      }
      return { system: 'gastrointestinal', explicit: true };

    case 'skeletal':
      if (re(n, DENTAL)) return { system: 'gastrointestinal', explicit: true };
      if (re(n, AIRWAY_CARTILAGE)) return { system: 'respiratory', explicit: true };
      // Source data files a handful of named muscles and fascia as skeletal.
      if (re(n, MISFILED_MUSCLE)) return { system: 'muscular', explicit: true };
      return { system: 'skeletal', explicit: true };

    // Systems that keep their identity under the CC taxonomy.
    case 'muscular':
    case 'nervous':
    case 'respiratory':
    case 'urinary':
    case 'reproductive':
    case 'lymphatic':
    case 'endocrine':
    case 'integumentary':
      return { system: old, explicit: true };

    default:
      // Already remapped (idempotent path) or genuinely unknown.
      if (VALID_SYSTEMS.includes(old)) return { system: old, explicit: true };
      return { system: 'muscular', explicit: false };
  }
}

// ---------------------------------------------------------------------------
// Sub-system assignment (four high-value systems only)
//
// IMPORTANT: every regex below uses a LEADING \b only. A trailing \b breaks
// stem matching, e.g. /\bphalan\b/ never matches "phalanx" and /\btrapezi\b/
// never matches "trapezium".
// ---------------------------------------------------------------------------

/** Chambers, valves and heart wall -- deliberately excludes vessel names. */
const HEART_STRUCTURE = /\b(valve|cusp|leaflet|chordae|papillary|myocard|endocard|pericard|trabecula)|\b(cavity|wall|septum) of (the )?(left |right )?(atrium|ventricle|heart)/;
/**
 * Vessels, including coronary vessels that merely mention a chamber.
 * `venous` has no leading \b so it also catches "hepatovenous"; arterial
 * trunks and arches (celiac trunk, plantar arch) are arteries.
 */
const VEINISH = /\b(vein|vena|venule)|venous/;
const ARTERYISH = /\b(artery|arteries|arterial|aorta|aortic|arteriole|arteria|coronary|trunk|arch)/;

/**
 * Eye *globe* structures only. Bare `optic` and `ciliar` are deliberately
 * excluded: they would drag the optic nerve and ciliary ganglion (peripheral)
 * plus the optic chiasm and optic tract (central visual pathway) into the eye
 * group. PERIPHERAL is tested first so nerves win regardless.
 */
const EYE = /\b(eyeball|cornea|iris|lens|retina|choroid|sclera|pupil|vitreous|aqueous|conjunctiv|uvea|fovea|macula|zonular|optic disc|corona ciliaris|anterior chamber|posterior chamber)/;
const PERIPHERAL = /\b(nerve|nerves|plexus|ganglion|ganglia|ramus|rami|cauda equina)/;

const AXIAL = /\b(skull|crani|vertebra|rib|sternum|manubrium|xiphoid|sacrum|sacral|coccyx|hyoid|mandible|maxilla|occipital|temporal bone|parietal bone|frontal bone|sphenoid|ethmoid|nasal bone|zygomat|palatine|vomer|atlas|axis|lacrimal bone|concha)/;
const APPENDICULAR = /\b(femur|tibia|fibula|patella|tarsal|metatarsal|phalan|humerus|radius|ulna|carpal|metacarpal|scapula|clavicle|pelvi|ilium|ischium|pubis|hip bone|calcaneus|talus|navicular|cuboid|cuneiform|lunate|scaphoid|capitate|hamate|triquetr|pisiform|trapezi|trapezoid|sesamoid|toe|finger|thumb)/;
const JOINTISH = /\b(cartilage|ligament|meniscus|disc|disk|membrane|labrum|joint|symphysis|suture)/;

const GI_ACCESSORY = /\b(liver|hepatic|pancrea|gallbladder|bile|biliary|cystic duct|spleen)/;
const GI_TRACT = /\b(stomach|gastric|esophag|oesophag|cardia|pylor|intestin|duoden|jejun|ileum|ileal|ileo|colon|colic|cecum|caecum|appendix|rectum|rectal|anal|anus|sigmoid|flexure|haustra|taenia|omentum|mesenter)/;
const GI_ORAL = /\b(tongue|tooth|teeth|molar|incisor|canine|premolar|gingiva|palate|palatine|oral|lip|cheek|uvula|mouth|pharyn)/;

/** Extraocular + mastication + hyoid/laryngeal + named neck muscles. */
const MU_HEAD_NECK = /\b(sternocleidomastoid|scalenus|longus colli|longus capitis|platysma|masseter|temporalis|pterygoid|digastric|stylohyoid|mylohyoid|geniohyoid|omohyoid|sternohyoid|thyrohyoid|sternothyroid|cricothyroid|arytenoid|vocalis|thyroarytenoid|cricoarytenoid|levator palpebrae|tendinous ring|trochlea of|(superior|inferior|medial|lateral) rectus|(superior|inferior) oblique|orbicularis|zygomaticus|risorius|frontalis|occipito|mentalis|buccinator|splenius|rectus capitis|obliquus capitis|nasalis|procerus|corrugator|uvular)/;
/** Chest, back, abdomen, diaphragm, pelvic floor. Limb muscles fall through. */
const MU_TRUNK = /\b(pectoralis|rectus abdominis|external oblique|internal oblique|transversus|diaphragm|intercostal|trapezius|latissimus|rhomboid|serratus|quadratus lumborum|multifidus|spinalis|iliocostalis|longissimus|semispinalis|linea alba|perineal|levator ani|tendinous arch|coccygeus|sphincter|pyramidalis|erector|rotator|interspinal|intertransvers|thoracic rotator|obliquus (internus|externus)|cremaster)/;

/** Conducting airway vs lung parenchyma / bronchial tree. */
const RS_LUNGS = /\b(lung|bronchus|bronchi|bronchial|bronchopulmonary|alveol|lingular|pulmonary segment)/;

/** Returns a SubsystemId or null when the parent system isn't sub-divided. */
function assignSubsystem(name, system) {
  switch (system) {
    case 'cardiovascular':
      // Unambiguous heart terms first, so "cusp of aortic valve" is not
      // mistaken for an artery on the strength of the word "aortic".
      // HEART_STRUCTURE deliberately omits bare "ventricle"/"atrium", so
      // coronary vessels naming a chamber still fall through to the vessel
      // tests below.
      if (re(name, HEART_STRUCTURE)) return 'cv-heart';
      if (re(name, VEINISH)) return 'cv-veins';
      if (re(name, ARTERYISH)) return 'cv-arteries';
      return 'cv-heart';

    case 'nervous':
      // Nerves and ganglia first: the optic nerve and ciliary ganglion are
      // peripheral even though they serve the eye.
      if (re(name, PERIPHERAL)) return 'nv-peripheral';
      if (re(name, EYE)) return 'nv-eye';
      // Inverted test: anything left that isn't a nerve is central. This
      // correctly absorbs deep brain structures (amygdala, hippocampus,
      // putamen, insula, colliculus, optic chiasm, optic tract) that a
      // brain-keyword list would miss entirely.
      return 'nv-central';

    case 'skeletal':
      if (re(name, JOINTISH)) return 'sk-cartilage';
      if (re(name, APPENDICULAR)) return 'sk-appendicular';
      if (re(name, AXIAL)) return 'sk-axial';
      return 'sk-axial';

    case 'gastrointestinal':
      if (re(name, GI_ACCESSORY)) return 'gi-accessory';
      if (re(name, GI_ORAL)) return 'gi-oral';
      if (re(name, GI_TRACT)) return 'gi-tract';
      return 'gi-tract';

    case 'muscular':
      if (re(name, MU_HEAD_NECK)) return 'mu-head-neck';
      if (re(name, MU_TRUNK)) return 'mu-trunk';
      return 'mu-limbs';

    case 'respiratory':
      if (re(name, RS_LUNGS)) return 'rs-lungs';
      return 'rs-upper';

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

// Always remap from the pristine original when we have it. Reading the already
// remapped file would make the run a no-op AND silently empty the fallback
// report, since remapped parts match the valid-system passthrough.
const SOURCE = existsSync(BACKUP) ? BACKUP : ATLAS;
const atlas = JSON.parse(readFileSync(SOURCE, 'utf8'));
if (SOURCE === BACKUP) console.log(`(remapping from pristine backup ${BACKUP})`);
const before = {};
for (const p of atlas.parts) before[p.system] = (before[p.system] ?? 0) + 1;
const originalCount = atlas.parts.length;

const after = {};
const subCounts = {};
const fallbacks = [];

for (const part of atlas.parts) {
  const oldSystem = part.system;
  const { system, explicit } = assignSystem(part);
  const subsystem = assignSubsystem(part.name, system);

  if (!explicit) fallbacks.push({ name: part.name, oldSystem, system });

  part.system = system;
  if (subsystem) part.subsystem = subsystem;
  else delete part.subsystem;

  after[system] = (after[system] ?? 0) + 1;
  if (subsystem) subCounts[subsystem] = (subCounts[subsystem] ?? 0) + 1;
}

// --- integrity assertions -------------------------------------------------
const errors = [];
if (atlas.parts.length !== originalCount) {
  errors.push(`part count changed: ${originalCount} -> ${atlas.parts.length}`);
}
const invalid = atlas.parts.filter(p => !VALID_SYSTEMS.includes(p.system));
if (invalid.length) {
  errors.push(`${invalid.length} parts have an invalid system, e.g. ${invalid[0].system}`);
}
if (errors.length) {
  console.error('REMAP FAILED:');
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}

// --- report ---------------------------------------------------------------
const pad = (s, n) => String(s).padEnd(n);
console.log(`\nparts: ${originalCount} (unchanged)\n`);
console.log('BEFORE                    AFTER');
console.log('------                    -----');
const oldKeys = Object.keys(before).sort((a, b) => before[b] - before[a]);
const newKeys = Object.keys(after).sort((a, b) => after[b] - after[a]);
for (let i = 0; i < Math.max(oldKeys.length, newKeys.length); i++) {
  const l = oldKeys[i] ? `${pad(oldKeys[i], 16)}${pad(before[oldKeys[i]], 8)}` : pad('', 24);
  const r = newKeys[i] ? `${pad(newKeys[i], 18)}${after[newKeys[i]]}` : '';
  console.log(l + r);
}

console.log('\nsub-systems:');
for (const k of Object.keys(subCounts).sort()) {
  console.log(`  ${pad(k, 18)}${subCounts[k]}`);
}

console.log(`\nfallback-assigned (see unmapped-parts.md): ${fallbacks.length}`);

if (DRY) {
  console.log('\n--dry-run: no files written');
  process.exit(0);
}

if (!existsSync(BACKUP)) {
  writeFileSync(BACKUP, readFileSync(ATLAS));
  console.log(`\nbacked up original -> ${BACKUP}`);
}
writeFileSync(ATLAS, JSON.stringify(atlas));
console.log(`wrote ${ATLAS}`);

// Group fallbacks by name so the report is reviewable rather than repetitive.
const grouped = new Map();
for (const f of fallbacks) {
  const key = `${f.name}|${f.oldSystem}|${f.system}`;
  grouped.set(key, (grouped.get(key) ?? 0) + 1);
}
const rows = [...grouped.entries()]
  .map(([k, count]) => { const [name, oldSystem, system] = k.split('|'); return { name, oldSystem, system, count }; })
  .sort((a, b) => a.name.localeCompare(b.name));

const md = `# Unmapped / fallback-assigned parts

These parts did not match an explicit rule in \`scripts/remap-systems.mjs\` and
were placed by a fallback. They are fully visible and clickable in the app, but
are worth reviewing and renaming or reassigning.

Generated: ${new Date().toISOString().slice(0, 10)}
Total parts affected: ${fallbacks.length} (${rows.length} distinct names)

| Part name | Old system | Assigned to | Instances |
|---|---|---|---|
${rows.map(r => `| ${r.name} | \`${r.oldSystem}\` | \`${r.system}\` | ${r.count} |`).join('\n')}

## Why these fell through

All are muscle-associated connective tissue with no single obvious home under
the Cleveland Clinic taxonomy: fasciae, raphes, tendinous arches, the linea
alba, and the conus elasticus. They attach to or invest muscle, so they default
to \`muscular\`. Moving any of them to \`skeletal\` is defensible.
`;
writeFileSync(REPORT, md);
console.log(`wrote ${REPORT}`);
