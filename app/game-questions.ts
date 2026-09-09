import {type Atlas, type Concept, type SystemId, SYSTEMS, EXPLANATIONS} from './anatomy';

export type Difficulty = 'elementary'|'middle'|'high'|'college'|'medical';
export type QuestionType = 'find'|'multiple-choice'|'system-id';

export interface Question {
  type: QuestionType;
  prompt: string;
  targetConceptName: string;
  targetPartIds: string[];
  targetSystem?: SystemId;
  choices?: string[];
  correctChoice?: number;
  difficulty: Difficulty;
  hint?: string;
  fact?: string;
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  elementary: 'Elementary',
  middle: 'Middle School',
  high: 'High School',
  college: 'College',
  medical: 'Medical School',
};

export const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
  elementary: 1, middle: 1.5, high: 2, college: 3, medical: 5,
};

export const DIFFICULTY_TIME: Record<Difficulty, number> = {
  elementary: 60, middle: 45, high: 30, college: 20, medical: 10,
};

export const DIFFICULTY_HINTS: Record<Difficulty, number> = {
  elementary: 3, middle: 2, high: 1, college: 0, medical: 0,
};

const FACTS: Record<string, string> = {
  'heart': 'The heart beats about 100,000 times per day, pumping roughly 2,000 gallons of blood through 60,000 miles of blood vessels.',
  'brain': 'The brain uses about 20% of the body\'s oxygen and energy despite being only 2% of total body weight. It contains approximately 86 billion neurons.',
  'stomach': 'The stomach produces a new lining every 3-4 days to protect itself from its own digestive acids, which are strong enough to dissolve metal.',
  'liver': 'The liver performs over 500 functions and is the only organ that can regenerate itself. It can regrow to full size from as little as 25% of remaining tissue.',
  'spleen': 'The spleen filters about 200 ml of blood per minute, removing old red blood cells and recycling iron for new ones.',
  'pancreas': 'The pancreas produces both digestive enzymes and hormones (insulin and glucagon), making it both an exocrine and endocrine organ.',
  'urinary bladder': 'The bladder can stretch to hold about 500 ml of urine. The urge to urinate typically begins when it holds about 200 ml.',
  'trachea': 'The trachea is supported by 16-20 C-shaped cartilage rings that keep the airway open. The open part faces the esophagus to allow food to pass.',
  'diaphragm': 'The diaphragm is the primary muscle of respiration. Hiccups occur when it contracts involuntarily.',
  'femur': 'The femur is the longest and strongest bone in the body. It can support up to 30 times your body weight.',
  'skull': 'The skull consists of 22 bones, 8 of which form the cranium protecting the brain. At birth, the bones are not fully fused, creating soft spots called fontanelles.',
  'left lung': 'The left lung is slightly smaller than the right to make room for the heart. It has two lobes while the right lung has three.',
  'right lung': 'The right lung is larger and heavier than the left. Together, the lungs contain about 1,500 miles of airways and 300-500 million alveoli.',
  'cerebellum': 'Though only 10% of total brain volume, the cerebellum contains more than 50% of all neurons in the brain, crucial for motor coordination.',
  'spinal cord': 'The spinal cord is about 45 cm long and 1 cm in diameter. It carries signals between the brain and body at speeds up to 270 mph.',
  'aorta': 'The aorta is the largest artery in the body, about 30 cm long and 2.5 cm in diameter. Blood exits the heart through it at about 1 mph.',
  'hippocampus': 'The hippocampus is essential for forming new memories. London taxi drivers who memorize complex routes develop a measurably larger hippocampus.',
  'thalamus': 'The thalamus relays 98% of all sensory information (except smell) to the cerebral cortex. It acts as the brain\'s switchboard.',
  'pituitary gland': 'Despite being only pea-sized, the pituitary gland is called the "master gland" because its hormones control many other endocrine glands.',
  'thymus': 'The thymus is largest during puberty and slowly shrinks with age. It trains T-cells to recognize pathogens, crucial for immune function.',
  'adrenal gland': 'The adrenal glands produce adrenaline (epinephrine), which can increase heart rate, blood pressure, and energy in seconds during stress.',
  'appendix': 'Once thought vestigial, the appendix may serve as a reservoir for beneficial gut bacteria, helping repopulate the intestines after illness.',
  'gallbladder': 'The gallbladder stores and concentrates bile produced by the liver. It can be removed without major impact on digestion.',
  'duodenum': 'The duodenum is only about 25 cm long but is where most chemical digestion occurs, receiving bile and pancreatic enzymes.',
  'mandible': 'The mandible is the largest and strongest bone of the face, and the only movable bone in the skull.',
  'patella': 'The patella (kneecap) is the largest sesamoid bone. Babies are born without kneecaps, which develop between ages 2-6.',
  'sacrum': 'The sacrum is formed by 5 fused vertebrae and transfers the weight of the upper body to the pelvis and legs.',
  'scapula': 'The scapula (shoulder blade) has 17 muscles attached to it, making it one of the most mobile bones in the body.',
  'sternum': 'The sternum protects the heart and major blood vessels. It contains bone marrow and is sometimes used for bone marrow biopsies.',
};

const HINTS: Record<string, string> = {
  'heart': 'It\'s in the center of your chest, slightly to the left',
  'brain': 'Look inside the head, at the very top of the body',
  'stomach': 'It\'s in the upper left area of the abdomen, below the ribs',
  'liver': 'It\'s a large organ in the upper right area of the abdomen',
  'spleen': 'It\'s on the left side of the abdomen, behind the stomach',
  'femur': 'It\'s the long bone in the upper leg, between the hip and knee',
  'skull': 'It\'s the bony structure surrounding the brain',
  'mandible': 'It\'s the lower jaw bone',
  'sternum': 'It\'s the flat bone in the center of the chest',
  'left lung': 'Look in the left side of the chest cavity',
  'right lung': 'Look in the right side of the chest cavity',
  'left kidney': 'It\'s behind the abdomen, on the left side of the spine',
  'right kidney': 'It\'s behind the abdomen, on the right side of the spine',
  'spinal cord': 'It runs through the vertebral column from brain to lower back',
  'vertebral column': 'It\'s the column of bones running down the center of the back',
  'humerus': 'It\'s the long bone in the upper arm',
  'tibia': 'It\'s the larger of the two lower leg bones, on the inner side',
  'pelvis': 'It\'s the large bone structure at the base of the spine, connecting the legs',
  'rib': 'These curved bones wrap around the chest to protect the organs',
  'scapula': 'It\'s the flat triangular bone on the upper back (shoulder blade)',
  'clavicle': 'It\'s the bone that runs horizontally across the top of the chest (collarbone)',
  'patella': 'It\'s the small round bone at the front of the knee',
  'pancreas': 'It sits behind the stomach, stretching across the abdomen',
  'trachea': 'It\'s the tube running down the front of the neck into the chest',
  'esophagus': 'It\'s the tube behind the trachea that connects the throat to the stomach',
  'urinary bladder': 'It\'s in the lower pelvis, in front of the rectum',
  'diaphragm': 'It\'s the dome-shaped muscle separating the chest from the abdomen',
  'aorta': 'It\'s the large artery that arches up from the heart and descends through the torso',
  'cerebellum': 'It\'s at the back and bottom of the brain',
  'hippocampus': 'It\'s deep inside the brain, in the temporal lobe',
};

const POOLS: Record<Difficulty, string[]> = {
  elementary: [
    'heart','brain','stomach','femur','skull','mandible','sternum',
    'rib','humerus','scapula','clavicle','vertebral column',
    'tibia','pelvis','patella','left lung','right lung',
    'left kidney','right kidney','spinal cord',
  ],
  middle: [
    'liver','spleen','pancreas','trachea','esophagus','urinary bladder',
    'diaphragm','aorta','large intestine','small intestine',
    'rectum','bronchus','sacrum','fibula','radius','ulna',
    'gallbladder','appendix','right atrium','duodenum',
  ],
  high: [
    'adrenal gland','prostate','thymus','cerebellum',
    'left atrium','left ventricle','right ventricle','testis',
    'epididymis','seminal vesicle','pituitary gland',
    'superior vena cava','inferior vena cava','common carotid artery',
    'subclavian artery','subclavian vein','cystic duct',
    'gluteus maximus','hippocampus','cervical vertebra',
  ],
  college: [
    'thalamus','hypothalamus','pons','medulla oblongata','corpus callosum',
    'optic nerve','celiac trunk','splenic artery','renal artery',
    'common iliac artery','external iliac artery','internal iliac artery',
    'mitral valve','tricuspid valve','aortic valve','pulmonary valve',
    'common hepatic duct','coronary artery','amygdala',
    'abdominal aorta',
  ],
  medical: [
    'popliteal artery','radial artery','ulnar artery','azygos vein',
    'accessory hemiazygos vein','anterior tibial artery',
    'anterior cerebral artery','anterior inferior cerebellar artery',
    'anterior communicating artery','anterior spinal artery',
    'posterior cerebral artery','basilar artery',
    'anterior interventricular branch of left coronary artery',
    'anterior interventricular vein','internal iliac artery',
    'anterior circumflex humeral artery','posterior circumflex humeral artery',
    'anterior ulnar recurrent artery','anterior interosseous artery',
    'anterior papillary muscle of right ventricle',
  ],
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function findConcept(atlas: Atlas, name: string): Concept | undefined {
  const lower = name.toLowerCase();
  return atlas.concepts.find(c => c.name.toLowerCase() === lower)
    ?? atlas.concepts.find(c => c.name.toLowerCase().includes(lower) && c.elements.length > 0 && c.elements.length <= 10);
}

function systemForConcept(atlas: Atlas, concept: Concept): SystemId | undefined {
  const partId = concept.elements[0];
  if (!partId) return undefined;
  return atlas.parts.find(p => p.id === partId)?.system;
}

function expandPartIds(atlas: Atlas, concept: Concept): string[] {
  const ids = new Set(concept.elements);
  const systems = new Set(concept.elements.map(id => atlas.parts.find(p => p.id === id)?.system).filter(Boolean));
  if (systems.size > 1) return [...ids];
  for (const el of concept.elements) {
    const part = atlas.parts.find(p => p.id === el);
    if (!part) continue;
    const nearby = atlas.parts.filter(p =>
      p.id !== el && concept.elements.includes(p.id) === false &&
      p.name.toLowerCase().includes(concept.name.toLowerCase().split(' ')[0])
    );
    nearby.forEach(p => ids.add(p.id));
  }
  return [...ids];
}

function getFact(name: string): string {
  const lower = name.toLowerCase();
  if (FACTS[lower]) return FACTS[lower];
  for (const [key, val] of Object.entries(FACTS)) {
    if (lower.includes(key) || key.includes(lower)) return val;
  }
  const sys = SYSTEMS.find(s => s.name.toLowerCase() === lower);
  if (sys) return sys.description;
  return '';
}

function getHint(name: string): string {
  const lower = name.toLowerCase();
  if (HINTS[lower]) return HINTS[lower];
  for (const [key, val] of Object.entries(HINTS)) {
    if (lower.includes(key) || key.includes(lower)) return val;
  }
  return '';
}

function generateFindQuestion(atlas: Atlas, concept: Concept, difficulty: Difficulty): Question {
  const expanded = expandPartIds(atlas, concept);
  return {
    type: 'find',
    prompt: `Find and tap the ${concept.name}`,
    targetConceptName: concept.name,
    targetPartIds: expanded.length > 0 ? expanded : concept.elements,
    difficulty,
    hint: getHint(concept.name),
    fact: getFact(concept.name),
  };
}

function generateSystemIdQuestion(atlas: Atlas, concept: Concept, difficulty: Difficulty): Question {
  const sys = systemForConcept(atlas, concept);
  const sysInfo = SYSTEMS.find(s => s.id === sys);
  const allPartsInSystem = atlas.parts.filter(p => p.system === sys).map(p => p.id);
  return {
    type: 'system-id',
    prompt: `Tap any structure in the ${sysInfo?.name ?? 'unknown'} system`,
    targetConceptName: sysInfo?.name ?? 'unknown',
    targetPartIds: allPartsInSystem,
    targetSystem: sys,
    difficulty,
    hint: sysInfo ? `This system includes: ${sysInfo.description.split('.')[0].toLowerCase()}` : '',
    fact: sysInfo?.description ?? '',
  };
}

function generateMultipleChoiceQuestion(atlas: Atlas, concept: Concept, difficulty: Difficulty): Question {
  const sys = systemForConcept(atlas, concept);
  const sysInfo = SYSTEMS.find(s => s.id === sys);
  const hasExplanation = EXPLANATIONS[concept.name.toLowerCase()];

  if (hasExplanation && Math.random() > 0.4) {
    const correctAnswer = concept.name;
    const otherConcepts = shuffle(
      atlas.concepts.filter(c => c.name !== concept.name && c.elements.length > 0 && c.elements.length < 20)
    ).slice(0, 3).map(c => c.name);
    const choices = shuffle([correctAnswer, ...otherConcepts]);
    return {
      type: 'multiple-choice',
      prompt: `Which structure: "${hasExplanation}"`,
      targetConceptName: concept.name,
      targetPartIds: concept.elements,
      choices,
      correctChoice: choices.indexOf(correctAnswer),
      difficulty,
      hint: `It belongs to the ${sysInfo?.name ?? 'unknown'} system`,
      fact: getFact(concept.name),
    };
  }

  const correctAnswer = sysInfo?.name ?? 'Unknown';
  const otherSystems = shuffle(
    SYSTEMS.filter(s => s.id !== sys && atlas.parts.some(p => p.system === s.id))
  ).slice(0, 3).map(s => s.name);
  const choices = shuffle([correctAnswer, ...otherSystems]);
  return {
    type: 'multiple-choice',
    prompt: `Which system does the ${concept.name} belong to?`,
    targetConceptName: concept.name,
    targetPartIds: concept.elements,
    choices,
    correctChoice: choices.indexOf(correctAnswer),
    difficulty,
    hint: hasExplanation ? `Clue: ${hasExplanation.split('.')[0]}` : '',
    fact: getFact(concept.name),
  };
}

export function generateQuiz(atlas: Atlas, difficulty: Difficulty): Question[] {
  const pool = POOLS[difficulty];
  const matched = shuffle(
    pool.map(name => findConcept(atlas, name)).filter((c): c is Concept => !!c && c.elements.length > 0)
  );

  if (matched.length < 5) {
    const extra = shuffle(
      atlas.concepts.filter(c => c.elements.length > 0 && c.elements.length < 20 && !matched.includes(c))
    ).slice(0, 5 - matched.length);
    matched.push(...extra);
  }

  const selected = matched.slice(0, 5);
  const types: QuestionType[] = shuffle(['find', 'find', 'multiple-choice', 'multiple-choice', 'system-id']);

  return selected.map((concept, i) => {
    const t = types[i];
    if (t === 'find') return generateFindQuestion(atlas, concept, difficulty);
    if (t === 'system-id') return generateSystemIdQuestion(atlas, concept, difficulty);
    return generateMultipleChoiceQuestion(atlas, concept, difficulty);
  });
}

export function scoreQuestion(timeRemaining: number, maxTime: number, attempts: number, difficulty: Difficulty): number {
  const base = 100;
  const timeBonus = Math.max(0, Math.floor((timeRemaining / maxTime) * 100));
  const penalty = (attempts - 1) * 25;
  return Math.max(0, Math.round((base + timeBonus - penalty) * DIFFICULTY_MULTIPLIER[difficulty]));
}
