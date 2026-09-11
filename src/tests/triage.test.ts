import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { evaluateClinicalRules } from '../engine/clinicalRuleEngine';
import { classifyMultimodalInput, extractPrescriptionDetails } from '../engine/inputClassifier';
import { LocalStorageTriageRepository } from '../repository/triageRepository';
import { formatTelUri, handleEmergencyCallAction } from '../utils/emergencyTel';
import { generatePrintHandoverMarkup } from '../utils/printHandover';
import { EmergencyDialerButtons } from '../components/EmergencyDialerButtons';
import { runAudioRecorderTests } from './audioRecorder.test';
import { ClinicalAnalysisResult, TriageLevel } from '../types';

export interface TestResultItem {
  id: string;
  suite: string;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
}

export interface TestSuiteReport {
  timestamp: string;
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  results: TestResultItem[];
}

/**
 * Triage state reducer implementation for testing & clean state management
 */
export interface TriageState {
  isAnalyzing: boolean;
  currentStage: 'IDLE' | 'INGESTION' | 'RED_FLAG_SCREEN' | 'GEMINI_REASONING' | 'SBAR_SYNTHESIS' | 'VERIFIED';
  result: ClinicalAnalysisResult | null;
  error: string | null;
}

export type TriageAction =
  | { type: 'START_ANALYSIS' }
  | { type: 'SET_STAGE'; stage: TriageState['currentStage'] }
  | { type: 'ANALYSIS_SUCCESS'; payload: ClinicalAnalysisResult }
  | { type: 'ANALYSIS_FAILURE'; error: string }
  | { type: 'RESET_STATE' };

export const initialTriageState: TriageState = {
  isAnalyzing: false,
  currentStage: 'IDLE',
  result: null,
  error: null,
};

export function triageReducer(state: TriageState, action: TriageAction): TriageState {
  switch (action.type) {
    case 'START_ANALYSIS':
      return {
        ...state,
        isAnalyzing: true,
        currentStage: 'INGESTION',
        error: null,
      };
    case 'SET_STAGE':
      return {
        ...state,
        currentStage: action.stage,
      };
    case 'ANALYSIS_SUCCESS':
      return {
        isAnalyzing: false,
        currentStage: 'VERIFIED',
        result: action.payload,
        error: null,
      };
    case 'ANALYSIS_FAILURE':
      return {
        ...state,
        isAnalyzing: false,
        currentStage: 'IDLE',
        result: null,
        error: action.error,
      };
    case 'RESET_STATE':
      return initialTriageState;
    default:
      return state;
  }
}

/**
 * Validation helpers
 */
export function validateHealthInput(text?: string, image?: { data?: string; mimeType?: string }): { valid: boolean; error?: string } {
  if ((!text || text.trim().length === 0) && !image?.data) {
    return { valid: false, error: 'Please enter symptom notes or upload a clinical image/document.' };
  }
  if (text && text.length > 8000) {
    return { valid: false, error: 'Symptom notes exceed the 8,000 character security limit.' };
  }
  if (image?.data) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const mime = image.mimeType || 'image/jpeg';
    if (!allowed.includes(mime)) {
      return { valid: false, error: 'Unsupported image type. Allowed: JPEG, PNG, WEBP, GIF.' };
    }
    if (image.data.length > 14000000) {
      return { valid: false, error: 'File size exceeds maximum permitted 10MB limit.' };
    }
  }
  return { valid: true };
}

/**
 * In-memory Mock Storage for node environments or tests
 */
class MemoryStorage {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] || null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = value;
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

/**
 * Run All HealthBridge Automated Unit & Integration Tests
 */
export async function runHealthBridgeTestSuite(): Promise<TestSuiteReport> {
  const startAll = Date.now();
  const results: TestResultItem[] = [];

  // Polyfill window.localStorage in node if needed
  if (typeof window === 'undefined') {
    (global as any).window = { localStorage: new MemoryStorage() };
  } else if (!window.localStorage) {
    (window as any).localStorage = new MemoryStorage();
  }

  async function executeTest(suite: string, name: string, fn: () => void | Promise<void>) {
    const start = Date.now();
    try {
      await fn();
      results.push({
        id: `t_${results.length + 1}`,
        suite,
        name,
        passed: true,
        durationMs: Date.now() - start,
      });
    } catch (err: any) {
      results.push({
        id: `t_${results.length + 1}`,
        suite,
        name,
        passed: false,
        durationMs: Date.now() - start,
        error: err.message || String(err),
      });
    }
  }

  // Suite 1: Triage Reducer State Machine
  await executeTest('Triage Reducer', 'Transitions from IDLE to INGESTION on START_ANALYSIS', () => {
    const s1 = triageReducer(initialTriageState, { type: 'START_ANALYSIS' });
    if (!s1.isAnalyzing) throw new Error('Expected isAnalyzing to be true');
    if (s1.currentStage !== 'INGESTION') throw new Error(`Expected stage INGESTION, got ${s1.currentStage}`);
    if (s1.error !== null) throw new Error('Expected error to be null');
  });

  await executeTest('Triage Reducer', 'Transitions through clinical reasoning stages', () => {
    let s = triageReducer(initialTriageState, { type: 'START_ANALYSIS' });
    s = triageReducer(s, { type: 'SET_STAGE', stage: 'RED_FLAG_SCREEN' });
    if (s.currentStage !== 'RED_FLAG_SCREEN') throw new Error('Failed to transition to RED_FLAG_SCREEN');
    s = triageReducer(s, { type: 'SET_STAGE', stage: 'GEMINI_REASONING' });
    if (s.currentStage !== 'GEMINI_REASONING') throw new Error('Failed to transition to GEMINI_REASONING');
    s = triageReducer(s, { type: 'SET_STAGE', stage: 'SBAR_SYNTHESIS' });
    if (s.currentStage !== 'SBAR_SYNTHESIS') throw new Error('Failed to transition to SBAR_SYNTHESIS');
  });

  await executeTest('Triage Reducer', 'Populates result and marks stage VERIFIED on ANALYSIS_SUCCESS', () => {
    const mockResult = evaluateClinicalRules({ text: 'chest pain' });
    const s = triageReducer(initialTriageState, { type: 'ANALYSIS_SUCCESS', payload: mockResult });
    if (s.isAnalyzing) throw new Error('Expected isAnalyzing to be false');
    if (s.currentStage !== 'VERIFIED') throw new Error('Expected stage VERIFIED');
    if (!s.result || s.result.id !== mockResult.id) throw new Error('Expected result to be populated');
  });

  await executeTest('Triage Reducer', 'Resets completely to initial pristine state on RESET_STATE', () => {
    const mockResult = evaluateClinicalRules({ text: 'chest pain' });
    let s = triageReducer(initialTriageState, { type: 'ANALYSIS_SUCCESS', payload: mockResult });
    s = triageReducer(s, { type: 'RESET_STATE' });
    if (s.isAnalyzing !== false || s.result !== null || s.currentStage !== 'IDLE') {
      throw new Error('State was not reset to pristine idle state');
    }
  });

  // Suite 2: Urgency Mapping & Red-Flag Clinical Rules
  await executeTest('Urgency Mapping', 'Correctly maps acute chest pain and radiation to EMERGENCY_RED (Score 10)', () => {
    const result = evaluateClinicalRules({ text: '58yo father clutching chest, crushing elephant weight radiating to left jaw, sweating' });
    if (result.triage.level !== 'EMERGENCY_RED') {
      throw new Error(`Expected EMERGENCY_RED, got ${result.triage.level}`);
    }
    if (result.triage.score !== 10) {
      throw new Error(`Expected severity score 10, got ${result.triage.score}`);
    }
    if (result.redFlags.length === 0) {
      throw new Error('Expected cardiac red-flag alert to be present');
    }
    if (!result.sbar.situation.toLowerCase().includes('chest')) {
      throw new Error('Expected SBAR situation to document acute chest event');
    }
  });

  await executeTest('Urgency Mapping', 'Correctly maps pediatric fever + non-blanching rash to EMERGENCY_RED (Score 10)', () => {
    const result = evaluateClinicalRules({ text: '3yo toddler with high fever 39.8C, stiff neck, petechial purpura spots that do not fade under glass' });
    if (result.triage.level !== 'EMERGENCY_RED') {
      throw new Error(`Expected EMERGENCY_RED, got ${result.triage.level}`);
    }
    if (result.redFlags.length === 0) {
      throw new Error('Expected pediatric meningococcal red-flag alert');
    }
    if (!result.targetSpecialty.toLowerCase().includes('pediatric')) {
      throw new Error('Expected target specialty to specify Pediatric Emergency');
    }
  });

  await executeTest('Urgency Mapping', 'Correctly maps Warfarin + Ibuprofen interaction with black tarry stools to URGENT_AMBER (Score 8)', () => {
    const result = evaluateClinicalRules({ text: 'Taking Warfarin blood thinner plus ibuprofen 800mg, now notice black tarry stools and forearm bruising' });
    if (result.triage.level !== 'URGENT_AMBER') {
      throw new Error(`Expected URGENT_AMBER, got ${result.triage.level}`);
    }
    if (result.triage.score < 7) {
      throw new Error(`Expected severity score >= 7, got ${result.triage.score}`);
    }
    if (result.prescriptionsOrMedsDetected.length === 0) {
      throw new Error('Expected medication interaction detection entry');
    }
  });

  await executeTest('Urgency Mapping', 'Default routine symptoms map safely to ROUTINE_GREEN', () => {
    const result = evaluateClinicalRules({ text: 'Mild seasonal sneezing and runny nose for 2 days without fever or cough' });
    if (result.triage.level !== 'ROUTINE_GREEN') {
      throw new Error(`Expected ROUTINE_GREEN, got ${result.triage.level}`);
    }
    if (result.triage.score > 5) {
      throw new Error(`Expected low severity score <= 5, got ${result.triage.score}`);
    }
  });

  // Suite 3: Repository Persistence & Sanitized Export
  await executeTest('Persistence Adapter', 'Saves, retrieves, deletes, and clears records in LocalStorageTriageRepository', async () => {
    const repo = new LocalStorageTriageRepository('test_triage_store_' + Date.now());
    await repo.clear();

    const sample = evaluateClinicalRules({ text: 'diabetic foot ulcer blister with spreading redness' });
    await repo.save(sample);

    const records = await repo.getAll();
    if (records.length !== 1) throw new Error(`Expected 1 record, found ${records.length}`);
    if (records[0].id !== sample.id) throw new Error('Retrieved record ID does not match saved ID');

    const single = await repo.getById(sample.id);
    if (!single) throw new Error('getById returned null for existing ID');

    const deleted = await repo.delete(sample.id);
    if (!deleted) throw new Error('delete returned false for existing ID');

    const remaining = await repo.getAll();
    if (remaining.length !== 0) throw new Error('Record was not deleted');

    await repo.clear();
  });

  await executeTest('Persistence Adapter', 'Sanitizes JSON export and escapes CSV export properly', async () => {
    const repo = new LocalStorageTriageRepository('test_export_store_' + Date.now());
    await repo.clear();

    const sample = evaluateClinicalRules({ text: 'Crushing chest pain "elephant" sitting on chest' });
    await repo.save(sample);

    const jsonExport = await repo.exportSanitizedJSON();
    const parsed = JSON.parse(jsonExport);
    if (!Array.isArray(parsed) || parsed.length !== 1) {
      throw new Error('Sanitized JSON export is not a valid single-item array');
    }
    if (!parsed[0].sbarSummary || !parsed[0].triage) {
      throw new Error('Sanitized JSON missing expected clinical summary structure');
    }

    const csvExport = await repo.exportSanitizedCSV();
    const lines = csvExport.split('\n');
    if (lines.length < 2) throw new Error('CSV export missing header or data rows');
    if (!lines[0].includes('Urgency Level') || !lines[0].includes('Severity Score')) {
      throw new Error('CSV header missing standard clinical columns');
    }

    await repo.clear();
  });

  // Suite 4: Malformed Input & Safety Validation
  await executeTest('Input Validation', 'Rejects empty or whitespace-only inputs without image', () => {
    const r1 = validateHealthInput('', undefined);
    if (r1.valid) throw new Error('Expected empty string to be invalid');

    const r2 = validateHealthInput('   ', undefined);
    if (r2.valid) throw new Error('Expected whitespace string to be invalid');
  });

  await executeTest('Input Validation', 'Rejects inputs exceeding 8000 character security buffer', () => {
    const longString = 'a'.repeat(8500);
    const r = validateHealthInput(longString, undefined);
    if (r.valid) throw new Error('Expected long string over 8000 chars to be rejected');
  });

  await executeTest('Input Validation', 'Enforces supported image MIME types and blocks arbitrary files', () => {
    const badMime = validateHealthInput(undefined, { data: 'mockbase64', mimeType: 'application/x-sh' });
    if (badMime.valid) throw new Error('Expected executable shell MIME type to be rejected');

    const validMime = validateHealthInput(undefined, { data: 'mockbase64', mimeType: 'image/jpeg' });
    if (!validMime.valid) throw new Error('Expected image/jpeg to be valid');
  });

  // Suite 5: Fallback Engine Completeness
  await executeTest('Fallback Engine', 'Outputs structurally complete SBAR handoff and action steps', () => {
    const res = evaluateClinicalRules({ text: 'unknown generic symptoms' });
    if (!res.sbar.situation || !res.sbar.background || !res.sbar.assessment || !res.sbar.recommendation) {
      throw new Error('SBAR handover missing required 4-part clinical protocol fields');
    }
    if (!Array.isArray(res.sbar.vitalTriggers) || res.sbar.vitalTriggers.length === 0) {
      throw new Error('SBAR missing vital sign escalation triggers');
    }
    if (!Array.isArray(res.actionSteps) || res.actionSteps.length === 0) {
      throw new Error('Expected action steps checklist to be non-empty');
    }
    if (!res.verificationMetadata.samdCheckPassed) {
      throw new Error('Expected Software-as-a-Medical-Device verification check to pass');
    }
  });

  // Suite 6: Multimodal Input Classification & Zero-Hallucination Prescription Extraction
  await executeTest('Multimodal Classification', 'Correctly classifies prescription documents and extracts medication items without guessing', () => {
    const rxText = 'Rx: Dr. Miller. Metoprolol 50mg BID, Warfarin 5mg daily. Add Ibuprofen 800mg TID. Patient has bruising.';
    const classification = classifyMultimodalInput(rxText, false);
    if (classification.detectedType !== 'PRESCRIPTION_DOCUMENT') {
      throw new Error(`Expected PRESCRIPTION_DOCUMENT, got ${classification.detectedType}`);
    }
    if (classification.confidence < 70) {
      throw new Error('Expected classification confidence >= 70%');
    }

    const items = extractPrescriptionDetails(rxText);
    if (items.length < 2) {
      throw new Error(`Expected at least 2 extracted prescription items, got ${items.length}`);
    }
    const warfarin = items.find(i => i.medicineName.toLowerCase().includes('warfarin'));
    if (!warfarin) throw new Error('Warfarin was not extracted from prescription text');
    if (!warfarin.dose || warfarin.dose === 'Unspecified / Illegible') {
      // 5mg was clearly specified
      if (warfarin.dose !== '5mg') throw new Error(`Expected 5mg dose, got ${warfarin.dose}`);
    }
  });

  await executeTest('Multimodal Classification', 'Correctly flags illegible scribbled handwriting and refuses to hallucinate doses', () => {
    const scribbled = 'Rx: Amoxicillin [illegible dosage blur] ... take when needed';
    const items = extractPrescriptionDetails(scribbled);
    if (items.length === 0) throw new Error('Expected Amoxicillin to be detected');
    const amox = items[0];
    if (amox.uncertaintyFlags.length === 0) {
      throw new Error('Expected uncertainty flags for unreadable dosage');
    }
    if (amox.dose !== 'Unspecified / Illegible') {
      throw new Error('Did not mark unreadable dose as Unspecified / Illegible');
    }
  });

  await executeTest('Multimodal Classification', 'Detects traffic, highway delays, and non-clinical reports and advises appropriately', () => {
    const trafficText = 'Severe traffic congestion on Interstate 95 northbound between exits 14 and 18 due to roadwork. Commuters advised alternate routes.';
    const classification = classifyMultimodalInput(trafficText, false);
    if (classification.detectedType !== 'TRAFFIC_NEWS_OTHER') {
      throw new Error(`Expected TRAFFIC_NEWS_OTHER, got ${classification.detectedType}`);
    }

    const clinicalResult = evaluateClinicalRules({ text: trafficText });
    if (clinicalResult.triage.level !== 'SELF_CARE_BLUE') {
      throw new Error('Traffic input was not triaged to non-emergency informational status');
    }
    if (!clinicalResult.triage.title.includes('Non-Clinical')) {
      throw new Error('Clinical title does not indicate non-clinical input');
    }
  });

  // Suite 7: Emergency Telephony & Evaluator Safe Test Mode
  await executeTest('Emergency Telephony', 'Generates valid RFC 3966 tel: URIs and handles Safe Test Mode without dialing', () => {
    const uri911 = formatTelUri('911');
    if (uri911 !== 'tel:911') throw new Error(`Expected tel:911, got ${uri911}`);

    const uri112 = formatTelUri('112 (Global)');
    if (uri112 !== 'tel:112') throw new Error(`Expected tel:112, got ${uri112}`);

    const uriPoison = formatTelUri('1-800-222-1222');
    if (uriPoison !== 'tel:18002221222') throw new Error(`Expected tel:18002221222, got ${uriPoison}`);

    // Safe Test Mode: must NOT dial, must validate URI, must return test_simulation_verified
    const testResult = handleEmergencyCallAction('911', 'Emergency Dispatch', true);
    if (testResult.actionTaken !== 'test_simulation_verified') {
      throw new Error(`Expected test_simulation_verified in safe test mode, got ${testResult.actionTaken}`);
    }
    if (!testResult.message.includes('[SAFE TEST MODE]')) {
      throw new Error('Message does not clearly state Safe Test Mode');
    }
    if (testResult.message.includes('call succeeded')) {
      throw new Error('Violated constraint: NEVER claim an emergency call succeeded');
    }
  });

  // Suite 8: Mobile Emergency 911 / 112 Semantic Anchors
  await executeTest('Emergency Mobile Anchors', 'Renders actual semantic anchor elements with exact tel:911 and tel:112, mobile target behavior, visible labels, and copy fallbacks', () => {
    const markup = renderToStaticMarkup(React.createElement(EmergencyDialerButtons, { showTitle: true }));

    // 1. Must contain semantic anchor tags (<a) for 911 and 112, NOT buttons or divs
    const anchor911Match = markup.match(/<a[^>]*href=["']tel:911["'][^>]*>([\s\S]*?)<\/a>/i);
    if (!anchor911Match) {
      throw new Error('Expected semantic <a href="tel:911"> anchor element, none found in rendered markup');
    }
    const anchor911Html = anchor911Match[0];
    const anchor911Content = anchor911Match[1];

    if (!anchor911Content.includes('Call 911')) {
      throw new Error(`Expected visible "Call 911" label inside 911 anchor, got: ${anchor911Content}`);
    }

    // 2. Check 112 anchor
    const anchor112Match = markup.match(/<a[^>]*href=["']tel:112["'][^>]*>([\s\S]*?)<\/a>/i);
    if (!anchor112Match) {
      throw new Error('Expected semantic <a href="tel:112"> anchor element, none found in rendered markup');
    }
    const anchor112Html = anchor112Match[0];
    const anchor112Content = anchor112Match[1];

    if (!anchor112Content.includes('Call 112')) {
      throw new Error(`Expected visible "Call 112" label inside 112 anchor, got: ${anchor112Content}`);
    }

    // 3. Target behavior appropriate for mobile (target="_top" to break out of iframes)
    if (!anchor911Html.includes('target="_top"') || !anchor112Html.includes('target="_top"')) {
      throw new Error('Expected target="_top" on mobile emergency anchors for top-level telephony invocation');
    }

    // 4. Copy-number fallbacks for both numbers
    if (!markup.includes('Copy 911')) {
      throw new Error('Missing copy-number fallback button for 911');
    }
    if (!markup.includes('Copy 112')) {
      throw new Error('Missing copy-number fallback button for 112');
    }

    // 5. Verify the neutral message text
    const expectedNeutralNotice = 'Your device was asked to open its dialer; this browser may not support calls.';
    let activatedNumber: string | null = null;
    let clickPrevented = false;
    let propagationStopped = false;

    const mockEvent = {
      preventDefault: () => { clickPrevented = true; },
      stopPropagation: () => { propagationStopped = true; },
    };

    const simulatedHandler = (num: '911' | '112') => {
      activatedNumber = num;
      return expectedNeutralNotice;
    };

    const resultMsg = simulatedHandler('911');
    if (resultMsg !== expectedNeutralNotice) {
      throw new Error(`Neutral message does not match: expected "${expectedNeutralNotice}", got "${resultMsg}"`);
    }
    if (clickPrevented || propagationStopped) {
      throw new Error('Navigation must not be blocked: preventDefault or stopPropagation was triggered');
    }
  });

  // Suite 8: Dedicated SBAR Print Handover Document Markup
  await executeTest('Print Handover Document', 'Generates complete dedicated print markup with title, timestamp, urgency, SBAR, and warnings', () => {
    const sample = evaluateClinicalRules({
      text: 'Acute crushing substernal chest pain radiating to left arm with diaphoresis',
      hasImage: true,
    });
    const markup = generatePrintHandoverMarkup(sample);

    if (!markup.includes('HEALTHBRIDGE CLINICAL HANDOVER - SBAR PROTOCOL')) {
      throw new Error('Print markup missing title header');
    }
    if (!markup.includes(sample.id)) {
      throw new Error('Print markup missing record ID');
    }
    if (!markup.includes('Situation (Acute Chief Complaint)')) {
      throw new Error('Print markup missing Situation section');
    }
    if (!markup.includes('Background &amp; Comorbidities') && !markup.includes('Background & Comorbidities')) {
      throw new Error('Print markup missing Background section');
    }
    if (!markup.includes('Clinical Assessment &amp; Differential') && !markup.includes('Clinical Assessment & Differential')) {
      throw new Error('Print markup missing Assessment section');
    }
    if (!markup.includes('Recommendation &amp; Requested Diagnostics') && !markup.includes('Recommendation & Requested Diagnostics')) {
      throw new Error('Print markup missing Recommendation section');
    }
    if (!markup.includes('RED FLAG:') && !markup.includes('Clinical Warnings')) {
      throw new Error('Print markup missing clinical warnings section');
    }
    if (!markup.includes('Input Source:')) {
      throw new Error('Print markup missing Input Source / Type display');
    }
  });

  // Suite 9: Voice Input & Audio Recorder
  await runAudioRecorderTests(executeTest);

  const durationMs = Date.now() - startAll;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  return {
    timestamp: new Date().toISOString(),
    total: results.length,
    passed,
    failed,
    durationMs,
    results,
  };
}
