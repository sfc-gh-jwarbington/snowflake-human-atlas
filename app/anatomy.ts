export type SystemId = 'cardiovascular'|'endocrine'|'exocrine'|'gastrointestinal'|'integumentary'|'lymphatic'|'muscular'|'nervous'|'reproductive'|'respiratory'|'skeletal'|'urinary';
export type SubsystemId = 'cv-heart'|'cv-arteries'|'cv-veins'|'nv-central'|'nv-peripheral'|'nv-eye'|'sk-axial'|'sk-appendicular'|'sk-cartilage'|'gi-oral'|'gi-tract'|'gi-accessory';
/**
 * The 12 organ systems as defined by Cleveland Clinic:
 * https://my.clevelandclinic.org/health/body/human-body-anatomy
 */
export const SYSTEMS: {id:SystemId;name:string;color:string;description:string}[] = [
 {id:'skeletal',name:'Skeletal',color:'#e2d9ba',description:'Bones form the supporting framework of the body, protect organs, and provide attachment points for muscles. Their internal tissue also stores minerals and produces blood cells.'},
 {id:'muscular',name:'Muscular',color:'#a85b50',description:'Skeletal muscles generate movement by pulling on their attachments. Together with tendons, they move joints, stabilize posture, and produce heat.'},
 {id:'cardiovascular',name:'Cardiovascular',color:'#c05245',description:'The heart and blood vessels circulate blood, carrying oxygen and nutrients to tissues and returning carbon dioxide and waste. Arteries lead away from the heart; veins return blood to it.'},
 {id:'nervous',name:'Nervous',color:'#d88ca0',description:'The brain, spinal cord, and peripheral nerves carry and process signals. They support sensation, movement, coordination, and automatic regulation of body functions. Vision and hearing are nervous functions.'},
 {id:'respiratory',name:'Respiratory',color:'#b98991',description:'The airways conduct air to the lungs, where oxygen and carbon dioxide move between air and blood. Breathing depends on pressure changes produced by respiratory muscles.'},
 {id:'gastrointestinal',name:'Gastrointestinal',color:'#b8916b',description:'Also called the digestive system. The tract breaks down food, absorbs nutrients and water, and moves waste onward. Accessory organs contribute bile and digestive enzymes.'},
 {id:'urinary',name:'Urinary',color:'#b47961',description:'The kidneys filter blood and regulate fluid, electrolyte, and acid-base balance. Urine travels through the ureters to the bladder and exits through the urethra.'},
 {id:'lymphatic',name:'Lymphatic',color:'#879f7c',description:'Lymphatic vessels return excess tissue fluid to the circulation. Lymph nodes and other lymphoid organs support immune surveillance and responses.'},
 {id:'endocrine',name:'Endocrine',color:'#c5a09a',description:'Endocrine organs release hormones into the blood to coordinate processes such as metabolism, growth, stress responses, and reproduction.'},
 {id:'exocrine',name:'Exocrine',color:'#9fb8c4',description:'Exocrine glands release secretions through ducts rather than into the blood. Tears, saliva, and mucus provide moisture and lubrication that protect sensitive tissues.'},
 {id:'reproductive',name:'Reproductive',color:'#bda098',description:'The male reproductive structures represented here contribute to sperm production, maturation, transport, and the production of sex hormones.'},
 {id:'integumentary',name:'Integumentary',color:'#ba9b7d',description:'Skin, hair, and nails form a protective outer barrier. The integumentary system guards against injury and infection and helps regulate body temperature.'},
];
/**
 * Sub-systems for the four systems where sub-division genuinely aids visual
 * isolation. Systems not listed here render as a single row.
 */
export const SUBSYSTEMS: {id:SubsystemId;parent:SystemId;name:string;description:string}[] = [
 {id:'cv-heart',parent:'cardiovascular',name:'Heart',description:'The four chambers, their valves, and the muscular wall of the heart.'},
 {id:'cv-arteries',parent:'cardiovascular',name:'Arteries',description:'Vessels carrying blood away from the heart, including the aorta and its branches.'},
 {id:'cv-veins',parent:'cardiovascular',name:'Veins',description:'Vessels returning blood toward the heart, including the superficial and deep networks.'},
 {id:'nv-central',parent:'nervous',name:'Central',description:'The brain and spinal cord, including deep structures and the ventricular spaces.'},
 {id:'nv-peripheral',parent:'nervous',name:'Peripheral',description:'Nerves, plexuses, and ganglia carrying signals between the central nervous system and the body.'},
 {id:'nv-eye',parent:'nervous',name:'Eye',description:'Structures of the eyeball itself, including the cornea, lens, iris, and retina.'},
 {id:'sk-axial',parent:'skeletal',name:'Axial skeleton',description:'The skull, vertebral column, ribs, and sternum, forming the central axis of the body.'},
 {id:'sk-appendicular',parent:'skeletal',name:'Appendicular skeleton',description:'The bones of the limbs along with the shoulder and pelvic girdles.'},
 {id:'sk-cartilage',parent:'skeletal',name:'Cartilage and joints',description:'Cartilage, ligaments, discs, and other structures that connect and cushion bones.'},
 {id:'gi-oral',parent:'gastrointestinal',name:'Oral cavity',description:'The mouth, tongue, teeth, gums, and palate, where digestion begins.'},
 {id:'gi-tract',parent:'gastrointestinal',name:'Digestive tract',description:'The continuous passage from esophagus and stomach through the intestines to the rectum.'},
 {id:'gi-accessory',parent:'gastrointestinal',name:'Accessory organs',description:'The liver, pancreas, gallbladder, and spleen, which support digestion without carrying food.'},
];
/** Sub-systems belonging to a given parent system, in registry order. */
export function subsystemsOf(system:SystemId){return SUBSYSTEMS.filter(s=>s.parent===system);}
export interface Part {id:string;name:string;conceptId:string;system:SystemId;subsystem?:SubsystemId;chunk:number;positions:number;normals:number;indices:number;vertexCount:number;indexCount:number;bounds:[number[],number[]]}
export interface Concept {id:string;name:string;elements:string[]}
export interface Atlas {version:string;sex?:'male';source?:string;scope?:string;parts:Part[];concepts:Concept[];chunks:{url:string;bytes:number;gzip?:string;gzipBytes?:number}[];triangles:number}
export type View = 'three-quarter'|'front'|'back'|'side';
/**
 * `visible` holds the enabled parent systems. `hiddenSubsystems` lets a parent
 * stay on while individual sub-systems are switched off, so a part renders only
 * when its system is visible AND its sub-system is not hidden.
 */
export interface SceneState {inspectorOpen?:boolean;explode:number;visible:SystemId[];hiddenSubsystems:SubsystemId[];selected:string[];isolate:boolean;view:View;rotate:boolean;reset:number}
export const DEFAULT_VISIBLE:SystemId[] = ['cardiovascular','skeletal','muscular','nervous','respiratory','gastrointestinal','urinary','lymphatic','endocrine','exocrine','reproductive'];
export const EXPLANATIONS:Record<string,string> = {
 'heart':'A muscular pump in the chest. Its right side sends blood to the lungs; its left side sends blood through the systemic circulation.',
 'liver':'A large organ beneath the right side of the diaphragm. It processes absorbed nutrients, produces bile, and synthesizes many proteins carried in the blood.',
 'brain':'The central organ of the nervous system. Its interconnected regions support perception, movement, memory, language, and the regulation of bodily functions.',
 'stomach':'A muscular chamber between the esophagus and small intestine. It stores and mixes food with acid and enzymes before releasing it into the duodenum.',
 'spleen':'A lymphoid organ in the upper left abdomen. It filters blood, removes aging blood cells, and participates in immune responses.',
 'pancreas':'An abdominal organ with digestive and endocrine roles. It supplies enzymes to the small intestine and releases hormones including insulin and glucagon.',
 'urinary bladder':'A muscular reservoir in the pelvis that stores urine arriving from the kidneys through the ureters.',
 'trachea':'The main airway connecting the larynx to the bronchi. Its cartilage supports keep the airway open during breathing.',
 'diaphragm':'A broad muscle separating the chest and abdomen. When it contracts, it increases chest volume and helps draw air into the lungs.',
};
export function explanation(name:string,system:SystemId){return EXPLANATIONS[name.toLowerCase()] ?? SYSTEMS.find(s=>s.id===system)?.description ?? '';}
