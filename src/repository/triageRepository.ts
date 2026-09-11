import { ClinicalAnalysisResult, TriageLevel } from '../types';

export interface TriageExportItem {
  id: string;
  timestamp: string;
  urgencyLevel: TriageLevel;
  urgencyScore: number;
  title: string;
  summary: string;
  recommendedFacility: string;
  targetSpecialty: string;
  hasImage: boolean;
}

export interface ITriageRepository {
  getAll(): Promise<ClinicalAnalysisResult[]>;
  getById(id: string): Promise<ClinicalAnalysisResult | null>;
  save(result: ClinicalAnalysisResult): Promise<void>;
  delete(id: string): Promise<boolean>;
  clear(): Promise<void>;
  exportSanitizedJSON(): Promise<string>;
  exportSanitizedCSV(): Promise<string>;
}

const STORAGE_KEY = 'healthbridge_triage_v2';

/**
 * Default zero-configuration client-side repository using localStorage.
 * Sanitizes exports and isolates patient session state safely.
 */
export class LocalStorageTriageRepository implements ITriageRepository {
  private key: string;

  constructor(key: string = STORAGE_KEY) {
    this.key = key;
  }

  private readStorage(): ClinicalAnalysisResult[] {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return [];
      }
      const raw = window.localStorage.getItem(this.key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return [];
    } catch (e) {
      console.warn('[LocalStorageTriageRepository] Failed to read from localStorage:', e);
      return [];
    }
  }

  private writeStorage(items: ClinicalAnalysisResult[]): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }
      window.localStorage.setItem(this.key, JSON.stringify(items));
    } catch (e) {
      console.error('[LocalStorageTriageRepository] Storage write failed (quota exceeded?):', e);
    }
  }

  async getAll(): Promise<ClinicalAnalysisResult[]> {
    return this.readStorage();
  }

  async getById(id: string): Promise<ClinicalAnalysisResult | null> {
    const all = this.readStorage();
    return all.find((item) => item.id === id) || null;
  }

  async save(result: ClinicalAnalysisResult): Promise<void> {
    const existing = this.readStorage();
    // Filter out duplicates and keep latest 30 triage sessions
    const updated = [result, ...existing.filter((item) => item.id !== result.id)].slice(0, 30);
    this.writeStorage(updated);
  }

  async delete(id: string): Promise<boolean> {
    const existing = this.readStorage();
    const updated = existing.filter((item) => item.id !== id);
    if (updated.length === existing.length) {
      return false;
    }
    this.writeStorage(updated);
    return true;
  }

  async clear(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(this.key);
      }
    } catch (e) {
      console.warn('[LocalStorageTriageRepository] Failed to clear storage:', e);
    }
  }

  async exportSanitizedJSON(): Promise<string> {
    const records = this.readStorage();
    const sanitized = records.map((r) => ({
      id: r.id,
      timestamp: r.timestamp,
      triage: {
        level: r.triage.level,
        title: r.triage.title,
        score: r.triage.score,
        timeframe: r.triage.timeframe,
      },
      summary: r.patientSummary.plainEnglish,
      keyFindings: r.patientSummary.keyFindings,
      recommendedFacility: r.recommendedFacility,
      targetSpecialty: r.targetSpecialty,
      actionStepsCount: r.actionSteps?.length || 0,
      sbarSummary: {
        situation: r.sbar?.situation,
        assessment: r.sbar?.assessment,
      },
      protocol: r.verificationMetadata?.protocol,
    }));
    return JSON.stringify(sanitized, null, 2);
  }

  async exportSanitizedCSV(): Promise<string> {
    const records = this.readStorage();
    const headers = [
      'ID',
      'Timestamp',
      'Urgency Level',
      'Severity Score (1-10)',
      'Clinical Headline',
      'Summary',
      'Target Specialty',
      'Recommended Facility',
      'Has Image',
    ];

    const escapeCsv = (val: string | number | boolean) => {
      const stringified = String(val ?? '').replace(/"/g, '""');
      return `"${stringified}"`;
    };

    const rows = records.map((r) => [
      escapeCsv(r.id),
      escapeCsv(r.timestamp),
      escapeCsv(r.triage.level),
      escapeCsv(r.triage.score),
      escapeCsv(r.triage.title),
      escapeCsv(r.patientSummary?.plainEnglish || r.rawInputSummary),
      escapeCsv(r.targetSpecialty),
      escapeCsv(r.recommendedFacility),
      escapeCsv(r.hasImage),
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }
}

/**
 * Optional server-backed repository adapter for enterprise synchronization.
 * Gracefully falls back to local storage if server route is unavailable.
 */
export class ServerBackedTriageRepository implements ITriageRepository {
  private fallback: LocalStorageTriageRepository;
  private apiEndpoint: string;

  constructor(endpoint: string = '/api/triage-records') {
    this.fallback = new LocalStorageTriageRepository();
    this.apiEndpoint = endpoint;
  }

  async getAll(): Promise<ClinicalAnalysisResult[]> {
    try {
      const res = await fetch(this.apiEndpoint, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data) ? data : await this.fallback.getAll();
      }
    } catch {
      // Fallback
    }
    return this.fallback.getAll();
  }

  async getById(id: string): Promise<ClinicalAnalysisResult | null> {
    return this.fallback.getById(id);
  }

  async save(result: ClinicalAnalysisResult): Promise<void> {
    // Always persist to fallback local repository
    await this.fallback.save(result);

    try {
      await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      });
    } catch {
      // Server offline is non-fatal
    }
  }

  async delete(id: string): Promise<boolean> {
    return this.fallback.delete(id);
  }

  async clear(): Promise<void> {
    return this.fallback.clear();
  }

  async exportSanitizedJSON(): Promise<string> {
    return this.fallback.exportSanitizedJSON();
  }

  async exportSanitizedCSV(): Promise<string> {
    return this.fallback.exportSanitizedCSV();
  }
}

// Repository Factory
let repositoryInstance: ITriageRepository | null = null;

export function getTriageRepository(): ITriageRepository {
  if (!repositoryInstance) {
    // Check if server sync is enabled via env variable, else default to pure LocalStorage
    const isServerEnabled =
      typeof process !== 'undefined' &&
      process.env &&
      process.env.VITE_ENABLE_SERVER_PERSISTENCE === 'true';

    repositoryInstance = isServerEnabled
      ? new ServerBackedTriageRepository()
      : new LocalStorageTriageRepository();
  }
  return repositoryInstance;
}
