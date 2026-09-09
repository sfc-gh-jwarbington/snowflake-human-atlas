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
    'heart','brain','stomach','femur',
    'skull','mandible','sternum','rib',
    'humerus','scapula','clavicle','vertebral column',
    'tibia','pelvis','patella','left lung',
    'right lung','left kidney','right kidney','spinal cord',
    'manubrium','xiphoid process','right first rib','right second rib',
    'right third rib','right fourth rib','left first rib','left second rib',
    'left third rib','right fifth rib','left fifth rib','left fourth rib',
    'right sixth rib','left sixth rib','right seventh rib','left seventh rib',
    'right eighth rib','left eighth rib','right ninth rib','left ninth rib',
    'right tenth rib','left tenth rib','right eleventh rib','left eleventh rib',
    'right twelfth rib','left twelfth rib','first thoracic vertebra','second thoracic vertebra',
    'third thoracic vertebra','fourth thoracic vertebra','vomer','fifth thoracic vertebra',
    'sixth thoracic vertebra','eighth thoracic vertebra','ninth thoracic vertebra','tenth thoracic vertebra',
    'zone of bone organ','zone of sternum','atlas','axis',
    'third cervical vertebra','fourth cervical vertebra','fifth cervical vertebra','sixth cervical vertebra',
    'first lumbar vertebra','second lumbar vertebra','third lumbar vertebra','fourth lumbar vertebra',
    'fifth lumbar vertebra','right clavicle','left clavicle','right scapula',
    'left scapula','right subscapularis','left subscapularis','sacrum',
    'right hip bone','left hip bone','right tibialis anterior','left tibialis anterior',
    'right fibularis tertius','left fibularis tertius','right fibularis longus','left fibularis longus',
    'right fibularis brevis','left fibularis brevis','right humerus','left humerus',
    'right radius','left radius','right ulna','left ulna',
    'right trapezoid','right scaphoid','left scaphoid','right lunate',
    'left lunate','right triquetral','left triquetral','right pisiform',
    'left pisiform','right trapezium','left trapezium','left trapezoid',
    'right capitate','left capitate','right hamate','left hamate',
    'right femur','left femur','right tibia','left tibia',
    'right fibula','left fibula','right talus','left talus',
    'right patella','left patella','right calcaneus','left calcaneus',
    'right cuboid bone','left cuboid bone','right levator scapulae','left levator scapulae',
    'frontal bone',
  ],
  middle: [
    'liver','spleen','pancreas','trachea',
    'esophagus','urinary bladder','diaphragm','aorta',
    'large intestine','small intestine','rectum','bronchus',
    'fibula','radius','ulna','gallbladder',
    'appendix','right atrium','duodenum','salivary gland',
    'bile duct','pancreatic duct','ileocecal junction','caudate lobe of liver',
    'cystic duct','ascending colon','transverse colon','descending colon',
    'mesentery of small intestine','mesentery of large intestine','transverse mesocolon','common hepatic duct',
    'right hepatic duct','left hepatic duct','extrahepatic bile duct','taenia coli',
    'taenia mesocolica','taenia omentalis','taenia libera','mesoappendix',
    'middle part of jejunum','region of peritoneum','peritoneal mesentery','region of visceral peritoneum',
    'parenchyma','tongue','submandibular gland','major salivary gland',
    'sublingual gland','right submandibular gland','left submandibular gland','right sublingual gland',
    'left sublingual gland','parenchyma of pancreas','region of serous membrane','heterogeneous cluster',
    'left duct of caudate lobe of liver','lobular organ component','lobular segment','peritoneum',
    'peritoneal sac','cecum','wall of small intestine','wall of ileum',
    'wall of large intestine','visceral peritoneum','muscle layer of large intestine','wall of distal part of ileum',
    'upper gastrointestinal tract','left main bronchus','main bronchus','constrictor muscle of pharynx',
    'superior pharyngeal constrictor','middle pharyngeal constrictor','inferior pharyngeal constrictor','right superior pharyngeal constrictor',
    'left superior pharyngeal constrictor','right middle pharyngeal constrictor','left middle pharyngeal constrictor','right inferior pharyngeal constrictor',
    'left inferior pharyngeal constrictor','stylopharyngeus','salpingopharyngeus','palatopharyngeus',
    'right stylopharyngeus','left stylopharyngeus','right salpingopharyngeus','left salpingopharyngeus',
    'right palatopharyngeus','left palatopharyngeus','inferior nasal concha','right inferior nasal concha',
    'left inferior nasal concha','epiglottis','septal nasal cartilage','lateral nasal cartilage',
    'right lateral nasal cartilage','left lateral nasal cartilage','right main bronchus proper','right anterior basal bronchopulmonary segment',
    'right medial basal bronchopulmonary segment','inferior lingular bronchopulmonary segment','left medial basal bronchopulmonary segment','right main bronchus',
    'posterior mediastinum','nasal septum','dorsum of nose','internal nose',
    'osseous skeleton of nose','osseous skeleton of internal nose','wall of internal nose','right lateral wall of internal nose',
    'left lateral wall of internal nose','right side of internal nose','left side of internal nose','wall of right side of internal nose',
    'wall of left side of internal nose','cartilaginous part of nasal septum','skeleton of nasal septum','content of posterior mediastinum',
    'kidney','ureter','right ureter','left ureter',
    'urethra',
  ],
  high: [
    'adrenal gland','prostate','thymus','cerebellum',
    'left atrium','left ventricle','right ventricle','testis',
    'epididymis','seminal vesicle','pituitary gland','superior vena cava',
    'inferior vena cava','common carotid artery','subclavian artery','subclavian vein',
    'gluteus maximus','hippocampus','cervical vertebra','cusp of cardiac valve',
    'leaflet of tricuspid valve','anterior leaflet of tricuspid valve','posterior leaflet of tricuspid valve','septal leaflet of tricuspid valve',
    'leaflet of mitral valve','anterior leaflet of mitral valve','posterior leaflet of mitral valve','left anterior cusp of pulmonary valve',
    'cusp of pulmonary valve','right anterior cusp of pulmonary valve','posterior cusp of pulmonary valve','cusp of aortic valve',
    'right posterior cusp of aortic valve','anterior cusp of aortic valve','left posterior cusp of aortic valve','cavity of right ventricle',
    'wall of right atrium','cavity of cardiac chamber','cavity of left atrium','cavity of left ventricle',
    'wall of left atrium','cavity of right atrium','cavity of atrium','cavity of ventricle',
    'wall of cardiac chamber','wall of atrium','wall of ventricle','cavity of organ part',
    'leaf of cardiac valve','interventricular foramen','lateral ventricle','right lateral ventricle',
    'left lateral ventricle','third ventricle','fourth ventricle','region of wall of heart',
    'outflow part of right ventricle','tricuspid valve','mitral valve','aortic valve',
    'pulmonary valve','subaortic curtain of left ventricle','outflow part of left ventricle','fibrous skeleton of heart',
    'fibrous ring of mitral valve','outflow part of right atrium','outflow part of left atrium','inferior wall of left ventricle',
    'diencephalon','myocardial zone 4','myocardium of inferior wall of left ventricle','anterior papillary muscle of right ventricle',
    'posterior papillary muscle of right ventricle','septal papillary muscle of right ventricle','lateral papillary muscle of left ventricle','anterolateral head of lateral papillary muscle of left ventricle',
    'external intercostal muscle','internal intercostal muscle','innermost intercostal muscle','transversus thoracis',
    'right transversus thoracis','left transversus thoracis','right external oblique','left external oblique',
    'right pectoralis minor','left pectoralis minor','right rhomboid major','right rhomboid minor',
    'right scalenus posterior','left scalenus posterior','right scalenus medius','left scalenus medius',
    'right scalenus anterior','left scalenus anterior','right serratus anterior','left serratus anterior',
    'serratus posterior superior','serratus posterior inferior','right serratus posterior superior','left serratus posterior superior',
    'right serratus posterior inferior','left serratus posterior inferior','right sternocleidomastoid','left sternocleidomastoid',
    'muscle of anterior abdominal wall','right obturator internus','left obturator internus','right obturator externus',
    'left obturator externus','right gluteus maximus','left gluteus maximus','right gluteus medius',
    'right gluteus minimus','left gluteus minimus','right gemellus superior','left gemellus superior',
    'right gemellus inferior','left gemellus inferior','right quadratus femoris','left quadratus femoris',
    'right semitendinosus','muscle of anterior compartment of thigh','right semimembranosus','left semimembranosus',
    'right adductor brevis',
  ],
  college: [
    'thalamus','hypothalamus','pons','medulla oblongata',
    'corpus callosum','optic nerve','celiac trunk','splenic artery',
    'renal artery','common iliac artery','external iliac artery','internal iliac artery',
    'coronary artery','amygdala','abdominal aorta','variant artery',
    'arterial anastomosis','ascending aorta','arch of aorta','descending aorta',
    'trunk of right coronary artery','right conus artery','trunk of left coronary artery','internal carotid artery',
    'vertebral artery','internal thoracic artery','right internal thoracic artery','right superior epigastric artery',
    'thyrocervical trunk','right thyrocervical trunk','second posterior intercostal artery','right dorsal scapular artery',
    'left internal thoracic artery','left musculophrenic artery','left superior epigastric artery','left thyrocervical trunk',
    'left costocervical trunk','left superior intercostal artery','left deep cervical artery','esophageal artery',
    'posterior intercostal artery','subcostal artery','right subcostal artery','left subcostal artery',
    'trunk of branch of coronary artery','right costocervical trunk','right superior intercostal artery','pulmonary trunk',
    'pulmonary arterial trunk','left apical segmental artery','left posterior segmental artery','superior lingular artery',
    'inferior lingular artery','left medial basal segmental artery','left anterior basal segmental artery','left lateral basal segmental artery',
    'upper lobar artery','apical segmental artery','medial basal segmental artery','anterior basal segmental artery',
    'lateral basal segmental artery','left dorsal scapular artery','costocervical trunk','musculophrenic artery',
    'superior epigastric artery','deep cervical artery','right deep cervical artery','inferior thyroid artery',
    'suprascapular artery','transverse cervical artery','superficial cervical artery','left inferior thyroid artery',
    'left suprascapular artery','left transverse cervical artery','left superficial cervical artery','right musculophrenic artery',
    'right inferior thyroid artery','right suprascapular artery','right transverse cervical artery','right superficial cervical artery',
    'variant bronchial artery','posterior segmental artery','bronchial branch of arch of aorta','lumbar artery',
    'left renal artery','middle suprarenal artery','right middle suprarenal artery','left middle suprarenal artery',
    'testicular artery','right testicular artery','left testicular artery','trunk of branch of coeliac artery',
    'left gastric artery','right gastric artery','right gastro-epiploic artery','dorsal pancreatic artery',
    'inferior pancreatic artery','great pancreatic artery','caudal pancreatic artery','left gastro-epiploic artery',
    'inferior pancreaticoduodenal artery','ileal artery','middle colic artery','right colic artery',
    'anterior cecal artery','posterior cecal artery','appendicular artery','marginal colic artery',
    'left colic artery','ascending branch of left colic artery','descending branch of left colic artery','sigmoid artery',
    'marginal artery of colon','superior rectal artery','right internal iliac artery','left internal iliac artery',
    'dorsal artery of penis','inferior epigastric artery','right inferior epigastric artery','left inferior epigastric artery',
    'superficial epigastric artery','right superficial epigastric artery','left superficial epigastric artery','lateral circumflex femoral artery',
    'right lateral circumflex femoral artery',
  ],
  medical: [
    'popliteal artery','radial artery','ulnar artery','azygos vein',
    'accessory hemiazygos vein','anterior tibial artery','anterior cerebral artery','anterior inferior cerebellar artery',
    'anterior communicating artery','anterior spinal artery','posterior cerebral artery','basilar artery',
    'anterior interventricular branch of left coronary artery','anterior interventricular vein','anterior circumflex humeral artery','posterior circumflex humeral artery',
    'anterior ulnar recurrent artery','anterior interosseous artery','first anterior ventricular branch of right coronary artery','septal branch of right posterior interventricular artery',
    'first septal branch of right posterior interventricular artery','second septal branch of right posterior interventricular artery','conus branch of anterior interventricular branch of left coronary artery','first right anterior branch of anterior interventricular branch of left coronary artery',
    'second right anterior branch of anterior interventricular branch of left coronary artery','third right anterior branch of anterior interventricular branch of left coronary artery','septal branch of anterior interventricular artery','left second posterior intercostal artery',
    'right second posterior intercostal artery','anterior superior pancreaticoduodenal artery','posterior superior pancreaticoduodenal artery','ileal branch of inferior branch of ileocolic artery',
    'ascending branch of inferior branch of ileocolic artery','trunk of branch of inferior mesenteric artery','left lateral circumflex femoral artery','branch of lateral circumflex femoral artery',
    'descending branch of lateral circumflex femoral artery','descending branch of right lateral circumflex femoral artery','descending branch of left lateral circumflex femoral artery','trunk of branch of left colic artery',
    'right descending genicular artery','left descending genicular artery','superior medial genicular artery','superior lateral genicular artery',
    'right medial superior genicular artery','left medial superior genicular artery','right lateral superior genicular artery','left lateral superior genicular artery',
    'right anterior circumflex humeral artery','left anterior circumflex humeral artery','right posterior circumflex humeral artery','left posterior circumflex humeral artery',
    'superior ulnar collateral artery','right superior ulnar collateral artery','left superior ulnar collateral artery','inferior ulnar collateral artery',
    'right inferior ulnar collateral artery','left inferior ulnar collateral artery','dorsal carpal branch of radial artery','dorsal carpal branch of right radial artery',
    'dorsal carpal branch of left radial artery','right arteria radialis indicis','right anterior ulnar recurrent artery','left anterior ulnar recurrent artery',
    'posterior ulnar recurrent artery','right posterior ulnar recurrent artery','left posterior ulnar recurrent artery','right common interosseous artery',
    'left common interosseous artery','right anterior interosseous artery','left anterior interosseous artery','dorsal carpal branch of ulnar artery',
    'right dorsal carpal branch of ulnar artery','left dorsal carpal branch of ulnar artery','superficial palmar arterial arch','right superficial palmar arterial arch',
    'left superficial palmar arterial arch','branch of deep palmar arterial arch','first common palmar digital artery','second common palmar digital artery',
    'right first common palmar digital artery','lateral proper palmar digital artery of middle finger','lateral proper palmar digital artery of right middle finger','lateral proper palmar digital artery of left middle finger',
    'right palmar metacarpal artery','right arteria princeps pollicis','left arteria princeps pollicis','medial proper palmar digital artery of ring finger',
    'medial proper palmar digital artery of index finger','lateral proper palmar digital artery of little finger','medial proper palmar digital artery of right index finger','medial proper palmar digital artery of left index finger',
    'medial proper palmar digital artery of right ring finger','lateral proper palmar digital artery of right little finger','lateral proper palmar digital artery of left little finger','pectoral branch of thoraco-acromial artery',
    'pectoral branch of right thoraco-acromial artery','pectoral branch of left thoraco-acromial artery','acromial branch of thoraco-acromial artery','deltoid branch of thoraco-acromial artery',
    'acromial branch of right thoraco-acromial artery','acromial branch of left thoraco-acromial artery','deltoid branch of right thoraco-acromial artery','deltoid branch of left thoraco-acromial artery',
    'middle collateral branch of right deep brachial artery','middle collateral branch of left deep brachial artery','radial collateral branch of right deep brachial artery','radial collateral branch of left deep brachial artery',
    'right circumflex scapular artery','left circumflex scapular artery','inferior lateral genicular artery','inferior medial genicular artery',
    'right inferior medial genicular artery','left inferior medial genicular artery','right inferior lateral genicular artery','left inferior lateral genicular artery',
    'anterior tibial recurrent artery','right anterior tibial recurrent artery','left anterior tibial recurrent artery','superficial medial plantar artery',
    'right superficial medial plantar artery','left superficial medial plantar artery','branch of lateral plantar artery','branch of medial plantar artery',
    'right anterior cerebral artery',
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
