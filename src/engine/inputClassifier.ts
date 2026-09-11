import { InputClassification, MultimodalInputType, ExtractedPrescriptionItem } from '../types';

export interface ClassifierInput {
  text?: string;
  hasImage?: boolean;
  imageMimeType?: string;
  imageDataUri?: string;
  urgencyHint?: string;
}

/**
 * Deterministic Input Classifier & Heuristic Extraction Engine
 * Classifies multimodal inputs into:
 * 1. 'GENERAL_SYMPTOM' - Human symptom notes, clinical photos (rashes, wounds, injuries, swelling)
 * 2. 'PRESCRIPTION_DOCUMENT' - Prescription slips, pill labels, Rx orders, medication lists
 * 3. 'TRAFFIC_NEWS_OTHER' - Irrelevant non-clinical content (traffic, weather, news, sports, crypto)
 *
 * CRITICAL SAFETY MANDATE:
 * Never invent unreadable prescription details. If a dose, unit, or frequency
 * is not explicitly present or legible, mark as 'Unspecified / Illegible' with uncertainty flags.
 */
export function classifyMultimodalInput(
  inputOrText: ClassifierInput | string,
  hasImageArg?: boolean
): InputClassification {
  const input: ClassifierInput =
    typeof inputOrText === 'string'
      ? { text: inputOrText, hasImage: Boolean(hasImageArg) }
      : inputOrText || {};

  const rawText = (input.text || '').toLowerCase().trim();
  const hasImage = Boolean(input.hasImage || input.imageDataUri);

  // 1. Non-clinical / Traffic / News / Other Heuristics
  const trafficKeywords = [
    'traffic',
    'traffic jam',
    'highway',
    'freeway',
    'expressway',
    'commute',
    'gridlock',
    'lane closure',
    'rush hour',
    'car crash news',
    'weather forecast',
    'weather report',
    'breaking news',
    'sports score',
    'stock market',
    'bitcoin',
    'cryptocurrency',
    'recipe',
    'restaurant menu',
    'movie review',
  ];

  const symptomKeywords = [
    'pain',
    'ache',
    'chest',
    'rash',
    'fever',
    'cough',
    'breath',
    'dizzy',
    'nausea',
    'vomit',
    'bleed',
    'wound',
    'ulcer',
    'swelling',
    'headache',
    'stiff',
    'temperature',
    'bp',
    'heart',
    'pulse',
    'blister',
    'throat',
    'chills',
    'sprain',
    'fracture',
    'numb',
  ];

  const prescriptionKeywords = [
    'rx',
    'prescription',
    'rx#',
    'dr.',
    'clinic',
    'pharmacy',
    'take 1 tablet',
    'take 2 tablets',
    'tablet',
    'tablets',
    'capsule',
    'capsules',
    'dosage',
    'refill',
    'refills',
    'dispense',
    'sig:',
    'mg',
    'mcg',
    'bid',
    'tid',
    'qid',
    'prn',
    'po',
    'daily',
    'warfarin',
    'metoprolol',
    'ibuprofen',
    'lisinopril',
    'amoxicillin',
    'atorvastatin',
    'aspirin',
    'prednisone',
    'insulin',
    'bottle label',
    'pill bottle',
  ];

  const matchedTraffic = trafficKeywords.filter((kw) => rawText.includes(kw));
  const matchedSymptoms = symptomKeywords.filter((kw) => rawText.includes(kw));
  const matchedPrescription = prescriptionKeywords.filter((kw) => rawText.includes(kw));

  // Check if image data hints at SVG text (like in our sample cases or OCR text)
  const imageSvgText = (input.imageDataUri || '').toLowerCase();
  const imageHasRx = imageSvgText.includes('rx:') || imageSvgText.includes('clinic') || imageSvgText.includes('mg');
  const imageHasTraffic = imageSvgText.includes('traffic') || imageSvgText.includes('highway') || imageSvgText.includes('weather');

  // Decision Logic:
  // Check for traffic/non-clinical first IF there are NO personal clinical symptoms
  if ((matchedTraffic.length > 0 || imageHasTraffic) && matchedSymptoms.length === 0 && matchedPrescription.length === 0) {
    return {
      detectedType: 'TRAFFIC_NEWS_OTHER',
      confidence: 94,
      reasons: [
        `Identified non-clinical keywords/topics: ${matchedTraffic.slice(0, 3).join(', ') || 'traffic/news layout'}`,
        'Zero human symptom indicators or anatomical complaints detected',
        'Input content does not represent a clinical healthcare encounter',
      ],
      source: 'deterministic_heuristics',
      rawExtractedText: input.text,
    };
  }

  // Check for prescription / medication document
  // Either strong prescription terminology or Rx image layout
  const isPrescriptionContext =
    input.urgencyHint?.toLowerCase().includes('pharmacy') ||
    input.urgencyHint?.toLowerCase().includes('medication');

  if (
    matchedPrescription.length >= 2 ||
    imageHasRx ||
    (matchedPrescription.length >= 1 && isPrescriptionContext) ||
    (rawText.includes('rx') && (rawText.includes('mg') || rawText.includes('tablet')))
  ) {
    const reasons = [
      `Detected prescription markers: ${matchedPrescription.slice(0, 4).join(', ') || 'Rx notation'}`,
      'Identified pharmaceutical dosing metrics or formulation keywords (e.g. mg, tablet, BID)',
      'Clinical intent centers on medication therapy, dosage schedule, or pharmacological safety',
    ];
    if (imageHasRx) {
      reasons.push('Visual document layout exhibits structured pharmaceutical Rx heading and dosage line items');
    }

    return {
      detectedType: 'PRESCRIPTION_DOCUMENT',
      confidence: 92,
      reasons,
      source: 'deterministic_heuristics',
      rawExtractedText: input.text,
    };
  }

  // Default to General Symptom
  const symptomReasons: string[] = [];
  if (matchedSymptoms.length > 0) {
    symptomReasons.push(`Reported physiological symptoms: ${matchedSymptoms.slice(0, 4).join(', ')}`);
  } else {
    symptomReasons.push('Narrative describing human physiological status or observation');
  }

  if (hasImage) {
    symptomReasons.push('Multimodal medical visual attached (e.g. dermatological lesion, wound, or biometric tracing)');
  }

  return {
    detectedType: 'GENERAL_SYMPTOM',
    confidence: 89,
    reasons: symptomReasons,
    source: 'deterministic_heuristics',
    rawExtractedText: input.text,
  };
}

/**
 * Deterministic Prescription Extraction
 * Extracts medication name, dose, frequency, and uncertainty flags.
 * NEVER invents unreadable details.
 */
export function extractPrescriptionDetails(inputOrText: ClassifierInput | string): ExtractedPrescriptionItem[] {
  const input: ClassifierInput =
    typeof inputOrText === 'string' ? { text: inputOrText } : inputOrText || {};
  const fullText = `${input.text || ''} ${input.imageDataUri || ''}`.toLowerCase();
  const items: ExtractedPrescriptionItem[] = [];

  // Known medicine catalog for heuristic extraction
  const medCatalog: {
    pattern: RegExp;
    name: string;
    standardDosePattern?: RegExp;
    standardFreqPattern?: RegExp;
    defaultNote?: string;
  }[] = [
    {
      pattern: /\bwarfarin\b/,
      name: 'Warfarin (Coumadin)',
      standardDosePattern: /(\d+(\.\d+)?\s*(mg|mcg))/,
      standardFreqPattern: /\b(daily|once daily|qday|qd)\b/,
      defaultNote: 'Vitamin K Antagonist Oral Anticoagulant',
    },
    {
      pattern: /\bmetoprolol\b/,
      name: 'Metoprolol',
      standardDosePattern: /(\d+(\.\d+)?\s*(mg|mcg))/,
      standardFreqPattern: /\b(bid|twice daily|daily|tid)\b/,
      defaultNote: 'Beta-1 Selective Adrenergic Receptor Blocker',
    },
    {
      pattern: /\bibuprofen\b/,
      name: 'Ibuprofen (Advil/Motrin)',
      standardDosePattern: /(\d+(\.\d+)?\s*(mg))/,
      standardFreqPattern: /\b(tid|3x\/day|three times daily|prn|qid)\b/,
      defaultNote: 'Nonsteroidal Anti-Inflammatory Drug (NSAID)',
    },
    {
      pattern: /\baspirin\b/,
      name: 'Aspirin (Acetylsalicylic Acid)',
      standardDosePattern: /(\d+(\.\d+)?\s*(mg))/,
      standardFreqPattern: /\b(daily|prn|once daily)\b/,
      defaultNote: 'Antiplatelet agent / NSAID',
    },
    {
      pattern: /\blisinopril\b/,
      name: 'Lisinopril',
      standardDosePattern: /(\d+(\.\d+)?\s*(mg))/,
      standardFreqPattern: /\b(daily|once daily)\b/,
      defaultNote: 'ACE Inhibitor for hypertension',
    },
    {
      pattern: /\bamoxicillin\b/,
      name: 'Amoxicillin',
      standardDosePattern: /(\d+(\.\d+)?\s*(mg))/,
      standardFreqPattern: /\b(bid|tid|twice daily)\b/,
      defaultNote: 'Broad-spectrum penicillin antibiotic',
    },
  ];

  let idCounter = 1;

  for (const med of medCatalog) {
    if (med.pattern.test(fullText)) {
      const uncertaintyFlags: string[] = [];
      let extractedDose = 'Unspecified / Illegible';
      let extractedFreq = 'Unspecified / Requires Confirmation';

      const medKeyword = med.name.toLowerCase().split(' ')[0];
      // Find dose strictly in vicinity of medication name
      const vicinityDoseRegex = new RegExp(`${medKeyword}[^\\n\\r,;]{0,40}?(\\d+(?:\\.\\d+)?\\s*(?:mg|mcg|ml|g))`, 'i');
      const doseMatch = fullText.match(vicinityDoseRegex);

      if (doseMatch) {
        extractedDose = doseMatch[1].replace(/\s+/g, '');
      } else {
        uncertaintyFlags.push('Dosage not clearly legible on document — requires physical bottle/pharmacist verification');
      }

      // Find frequency in vicinity of medication name
      const vicinityFreqRegex = new RegExp(`${medKeyword}[^\\n\\r;]{0,60}?\\b(bid|tid|qid|daily|once daily|twice daily|3x\\/day|prn|q\\d+h)\\b`, 'i');
      const freqMatch = fullText.match(vicinityFreqRegex);

      if (freqMatch) {
        extractedFreq = freqMatch[1].toUpperCase();
      } else {
        uncertaintyFlags.push('Dosing frequency ambiguous — check prescription instructions');
      }

      // Check for drug interactions
      if (med.name.includes('Ibuprofen') && fullText.includes('warfarin')) {
        uncertaintyFlags.push('CRITICAL INTERACTION ALERT: Concurrent Warfarin + NSAID increases severe GI hemorrhage risk');
      }
      if (med.name.includes('Warfarin') && fullText.includes('ibuprofen')) {
        uncertaintyFlags.push('CRITICAL INTERACTION ALERT: High risk of anticoagulant synergism with NSAID');
      }

      // Check if image is present and possibly handwritten
      if (input.hasImage) {
        uncertaintyFlags.push('Handwritten / scanned script: Verify numbers with dispensing pharmacist');
      }

      items.push({
        id: `med-${idCounter++}`,
        medicineName: med.name,
        dose: extractedDose,
        frequency: extractedFreq,
        indicationOrNotes: med.defaultNote,
        uncertaintyFlags,
        isConfirmedByUser: false,
      });
    }
  }

  // If no recognized medication matched but input is a prescription document:
  if (items.length === 0 && fullText.includes('rx')) {
    items.push({
      id: `med-${idCounter++}`,
      medicineName: 'Prescription Item (Name Illegible/Unlisted)',
      dose: 'Unspecified / Illegible',
      frequency: 'Unspecified',
      indicationOrNotes: 'Document flagged as prescription; manual transcription required',
      uncertaintyFlags: [
        'Medicine name or strength not definitively recognized in automated scan',
        'Mandatory confirmation: Enter medicine name and dose directly from physical container',
      ],
      isConfirmedByUser: false,
    });
  }

  return items;
}
