import { SampleCase } from '../types';

// Inline lightweight clinical test graphics for immediate one-click testing
const ECG_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200" fill="%230f172a"><rect width="400" height="200" fill="%230f172a"/><path d="M0 100 L60 100 L70 85 L80 120 L90 20 L105 180 L120 70 L140 100 L180 100 L190 85 L200 120 L210 20 L225 180 L240 70 L260 100 L300 100 L310 85 L320 120 L330 20 L345 180 L360 70 L380 100 L400 100" stroke="%23ef4444" stroke-width="3" fill="none"/><text x="20" y="30" fill="%2394a3b8" font-size="12" font-family="monospace">LEAD II - ST ELEVATION DETECTED [SIMULATED ECG]</text></svg>`;

const RASH_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200" fill="%230f172a"><rect width="400" height="200" fill="%231e293b"/><circle cx="120" cy="80" r="14" fill="%23dc2626" opacity="0.85"/><circle cx="160" cy="110" r="18" fill="%23b91c1c" opacity="0.9"/><circle cx="210" cy="70" r="12" fill="%23dc2626" opacity="0.8"/><circle cx="250" cy="120" r="16" fill="%23991b1b" opacity="0.95"/><circle cx="180" cy="140" r="8" fill="%23ef4444" opacity="0.75"/><circle cx="290" cy="85" r="11" fill="%23dc2626" opacity="0.85"/><text x="20" y="30" fill="%23cbd5e1" font-size="12" font-family="monospace">PEDIATRIC NON-BLANCHING PETECHIAL ERYTHEMA</text></svg>`;

const PRESCRIPTION_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200" fill="%231e293b"><rect width="400" height="200" fill="%23f8fafc"/><path d="M30 40 L370 40 M30 80 L320 80 M30 120 L350 120 M30 160 L280 160" stroke="%2394a3b8" stroke-width="1.5" stroke-dasharray="4 4"/><text x="30" y="30" fill="%230f172a" font-size="14" font-weight="bold" font-family="sans-serif">Rx: Dr. Miller Clinic - Urgent Care</text><text x="30" y="70" fill="%231e293b" font-size="13" font-family="cursive">Metoprolol 50mg BID + Warfarin 5mg daily</text><text x="30" y="110" fill="%231e293b" font-size="13" font-family="cursive">Add Ibuprofen 800mg TID for knee ache [POTENTIAL INTERACTION]</text><text x="30" y="150" fill="%2364748b" font-size="11" font-family="sans-serif">Patient reports dizziness, dark stools, bruised forearm</text></svg>`;

const DIABETIC_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200" fill="%230f172a"><rect width="400" height="200" fill="%231e293b"/><path d="M160 50 Q200 40 240 70 Q260 110 240 160 Q200 180 160 160 Q130 110 160 50 Z" fill="%23fdba74" opacity="0.4"/><ellipse cx="190" cy="120" rx="22" ry="16" fill="%23b91c1c" stroke="%23fca5a5" stroke-width="3"/><text x="20" y="30" fill="%23f87171" font-size="12" font-family="monospace">PLANTAR METATARSAL ULCER - GRADE 2 ERYTHEMA</text></svg>`;

export const SAMPLE_CASES: SampleCase[] = [
  {
    id: 'chest-pain-emergency',
    tag: 'Red-Flag Emergency',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    title: 'Acute Crushing Chest Pain & Radiation',
    category: 'Cardiovascular Triage',
    description: 'Sudden onset substernal pressure, diaphoresis, left arm tingling in a 58-year-old with hypertension history.',
    rawText: 'My 58yo father suddenly collapsed into the armchair clutching his chest 25 mins ago. Says it feels like a heavy elephant sitting on his sternum. Radiating to his left jaw and left arm. Cold sweat, short of breath, pale. BP monitor shows 168/102, HR 108. He took one aspirin 10 mins ago.',
    imageDataUri: ECG_SVG,
    hint: 'Tests emergency routing, acute coronary syndrome protocol, 911 activation, and contraindication checks.'
  },
  {
    id: 'petechial-rash-pediatric',
    tag: 'Urgent Pediatric',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    title: 'High Fever & Non-Blanching Rash in Toddler',
    category: 'Pediatric Infection',
    description: '3-year-old with 39.8°C fever, lethargy, and purpuric pinprick spots that did not fade under a glass tumbler.',
    rawText: 'Our 3yo daughter has had a spiking fever of 103.6 F (39.8 C) since morning. Won\'t drink fluids, unusually irritable then drowsy. Noticed tiny red/purple spots on her abdomen and legs. We pressed a transparent glass tumbler against them and the spots DO NOT fade or turn white. Neck feels stiff when we try to lift her chin.',
    imageDataUri: RASH_SVG,
    hint: 'Tests meningococcal/sepsis red-flag detection, glass test verification, and immediate pediatric ER dispatch.'
  },
  {
    id: 'confusing-prescription-interaction',
    tag: 'Medication Safety',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    title: 'Prescription Jargon & Dangerous Drug Interaction',
    category: 'Pharmacy Bridge',
    description: 'Patient confused by handwritten doctor note taking Warfarin blood thinner plus high-dose NSAID with bruising.',
    rawText: 'I went to a walk-in clinic for bad knee pain. The doctor scribbled a note for high-dose Ibuprofen (800mg 3x/day). I already take Warfarin 5mg daily and Metoprolol for my heart stent. Now I have black tarry stools and large purple bruises on my forearm. Should I keep taking the new pills?',
    imageDataUri: PRESCRIPTION_SVG,
    hint: 'Tests drug-drug interaction warning (Warfarin + NSAID GI bleed), triage escalation, and pharmacy handover.'
  },
  {
    id: 'diabetic-foot-blister',
    tag: 'Specialist Bridge',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    title: 'Diabetic Neuropathy & Deep Foot Wound',
    category: 'Endocrinology / Podiatry',
    description: 'Type 2 diabetic noticed yellowish fluid draining from bottom of foot with loss of pain sensation.',
    rawText: 'Diagnosed with Type 2 diabetes 8 years ago, last HbA1c was 8.6. Took off my socks today and found a quarter-sized yellowish blister on the ball of my right foot that popped. It has redness spreading about 2 inches around the border and mild odor, but strangely I don\'t feel any pain there at all.',
    imageDataUri: DIABETIC_SVG,
    hint: 'Tests diabetic neuropathy blind-spot warning, osteomyelitis risk mitigation, and urgent podiatry/wound clinic triage.'
  }
];
