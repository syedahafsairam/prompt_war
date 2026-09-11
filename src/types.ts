export type TriageLevel = 'EMERGENCY_RED' | 'URGENT_AMBER' | 'ROUTINE_GREEN' | 'SELF_CARE_BLUE';

export interface RedFlagAlert {
  id: string;
  title: string;
  riskFactor: string;
  criticalWarning: string;
  immediateMitigation: string;
}

export interface ActionStep {
  id: string;
  stepNumber: number;
  title: string;
  instruction: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  category: 'FIRST_AID' | 'LOGISTICS' | 'MEDICATION_SAFETY' | 'MONITORING';
}

export interface SBARHandover {
  situation: string;
  background: string;
  assessment: string;
  recommendation: string;
  vitalTriggers: string[];
}

export interface MedicationDetection {
  name: string;
  notes: string;
  cautionaryWarning?: string;
}

export interface VitalSignMetric {
  metric: string;
  normalRange: string;
  warningThreshold: string;
  instruction: string;
}

export interface ClinicalAnalysisResult {
  id: string;
  timestamp: string;
  rawInputSummary: string;
  hasImage: boolean;
  triage: {
    level: TriageLevel;
    title: string;
    timeframe: string;
    score: number; // 1-10 severity score
    rationale: string;
  };
  redFlags: RedFlagAlert[];
  sbar: SBARHandover;
  patientSummary: {
    plainEnglish: string;
    keyFindings: string[];
    whatToAvoid: string[];
  };
  actionSteps: ActionStep[];
  questionsForDoctor: string[];
  targetSpecialty: string;
  recommendedFacility: string;
  prescriptionsOrMedsDetected: MedicationDetection[];
  vitalSignsToWatch: VitalSignMetric[];
  verificationMetadata: {
    model: string;
    protocol: string;
    samdCheckPassed: boolean;
    confidenceScore: number;
  };
}

export interface SampleCase {
  id: string;
  tag: string;
  badgeColor: string;
  title: string;
  category: string;
  description: string;
  rawText: string;
  imageThumbnail?: string;
  imageDataUri?: string;
  hint: string;
}
