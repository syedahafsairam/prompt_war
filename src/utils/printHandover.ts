import { ClinicalAnalysisResult } from '../types';

export interface PrintHandoverOptions {
  sourceInputType?: string;
  clinicianName?: string;
}

/**
 * Generates an accessible, print-optimized HTML document for clinical SBAR handover.
 * Contains clear title, timestamp, urgency, Situation, Background, Assessment, Recommendation,
 * safety warnings, vital triggers, and source/input type.
 */
export function generatePrintHandoverMarkup(
  result: ClinicalAnalysisResult,
  options: PrintHandoverOptions = {}
): string {
  const dateFormatted = new Date(result.timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });

  const sourceInputKey = options.sourceInputType || result.sourceInputType || result.inputClassification?.detectedType;
  let sourceDisplay = 'Clinical Narrative Notes';
  if (sourceInputKey === 'PRESCRIPTION_DOCUMENT') {
    sourceDisplay = 'Prescription / Medication Document';
  } else if (sourceInputKey === 'GENERAL_SYMPTOM') {
    sourceDisplay = result.hasImage ? 'General Symptom / Multimodal Photo' : 'General Symptom Notes';
  } else if (sourceInputKey === 'TRAFFIC_NEWS_OTHER') {
    sourceDisplay = 'Traffic / News / Other (Non-Clinical)';
  } else if (result.hasImage) {
    sourceDisplay = 'Multimodal Medical Visual';
  }

  const urgencyBadgeColor =
    result.triage.level === 'EMERGENCY_RED'
      ? '#dc2626'
      : result.triage.level === 'URGENT_AMBER'
      ? '#d97706'
      : '#059669';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>HealthBridge Clinical Handover - SBAR Protocol - ${result.id}</title>
  <style>
    @page {
      margin: 15mm 20mm;
      size: letter portrait;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      background: #ffffff;
      line-height: 1.45;
      font-size: 13px;
      margin: 0;
      padding: 0;
    }
    .header-table {
      width: 100%;
      border-bottom: 3px solid #111827;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .brand-title {
      font-size: 20px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #0f172a;
    }
    .sub-title {
      font-size: 11px;
      color: #475569;
      margin-top: 2px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .meta-box {
      text-align: right;
      font-size: 11px;
      color: #334155;
    }
    .urgency-banner {
      border: 2px solid ${urgencyBadgeColor};
      background-color: #f8fafc;
      padding: 10px 14px;
      border-radius: 6px;
      margin-bottom: 16px;
    }
    .urgency-title {
      font-size: 14px;
      font-weight: 800;
      color: ${urgencyBadgeColor};
      text-transform: uppercase;
      margin: 0 0 4px 0;
    }
    .urgency-details {
      font-size: 12px;
      color: #1e293b;
      margin: 0;
    }
    .sbar-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 16px;
    }
    .sbar-section {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px 12px;
      background: #ffffff;
    }
    .sbar-label {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .label-badge {
      display: inline-block;
      width: 18px;
      height: 18px;
      line-height: 18px;
      text-align: center;
      border-radius: 4px;
      color: #ffffff;
      font-weight: 800;
      font-size: 11px;
    }
    .badge-s { background: #dc2626; }
    .badge-b { background: #d97706; }
    .badge-a { background: #0284c7; }
    .badge-r { background: #059669; }
    .sbar-text {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11.5px;
      line-height: 1.5;
      color: #0f172a;
      margin: 0;
      white-space: pre-wrap;
    }
    .warning-box {
      border-left: 4px solid #dc2626;
      background: #fef2f2;
      padding: 10px 14px;
      border-radius: 0 6px 6px 0;
      margin-bottom: 14px;
    }
    .warning-title {
      font-size: 11px;
      font-weight: 800;
      color: #991b1b;
      text-transform: uppercase;
      margin: 0 0 6px 0;
    }
    .warning-list {
      margin: 0;
      padding-left: 18px;
      font-size: 11.5px;
      color: #7f1d1d;
    }
    .vitals-box {
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      padding: 8px 12px;
      border-radius: 6px;
      margin-bottom: 14px;
    }
    .vitals-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #475569;
      margin-bottom: 4px;
    }
    .vitals-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .vital-pill {
      border: 1px solid #cbd5e1;
      background: #ffffff;
      border-radius: 4px;
      padding: 2px 8px;
      font-family: monospace;
      font-size: 11px;
      color: #b91c1c;
      font-weight: 600;
    }
    .signature-row {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px dashed #94a3b8;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
      font-size: 11px;
      color: #475569;
    }
    .sign-line {
      border-bottom: 1px solid #64748b;
      height: 24px;
      margin-bottom: 4px;
    }
    .disclaimer-footer {
      margin-top: 20px;
      font-size: 9.5px;
      color: #64748b;
      line-height: 1.4;
      text-align: justify;
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
    }
    @media print {
      .no-print { display: none !important; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <table class="header-table">
    <tr>
      <td>
        <div class="brand-title">HEALTHBRIDGE CLINICAL HANDOVER - SBAR PROTOCOL</div>
        <div class="sub-title">Universal SBAR Triage Bridge · PromptWars SaMD CDS Protocol</div>
      </td>
      <td class="meta-box">
        <div><strong>Record ID:</strong> ${result.id}</div>
        <div><strong>Timestamp:</strong> ${dateFormatted}</div>
        <div><strong>Input Source:</strong> ${sourceDisplay}</div>
        <div><strong>Routing Target:</strong> ${result.targetSpecialty}</div>
      </td>
    </tr>
  </table>

  <div class="urgency-banner">
    <div class="urgency-title">
      TRIAGE: ${result.triage.level.replace('_', ' ')} · Severity ${result.triage.score}/10 · ${result.triage.timeframe}
    </div>
    <p class="urgency-details">
      <strong>${result.triage.title}</strong> — ${result.triage.rationale}
    </p>
  </div>

  ${(result.redFlags && result.redFlags.length > 0) || (result.patientSummary?.whatToAvoid && result.patientSummary.whatToAvoid.length > 0) ? `
  <div class="warning-box">
    <div class="warning-title">Clinical Warnings & Contraindications (Immediate Attention)</div>
    ${result.redFlags && result.redFlags.length > 0 ? `
    <ul class="warning-list" style="margin-bottom: 6px;">
      ${result.redFlags.map(rf => `<li><strong>RED FLAG: ${rf.title}:</strong> ${rf.criticalWarning} (Immediate Mitigation: ${rf.immediateMitigation})</li>`).join('')}
    </ul>
    ` : ''}
    ${result.patientSummary?.whatToAvoid && result.patientSummary.whatToAvoid.length > 0 ? `
    <div style="font-size: 11px; font-weight: 700; color: #991b1b; text-transform: uppercase; margin-top: 4px;">Contraindications / What Patient Must Strictly Avoid:</div>
    <ul class="warning-list">
      ${result.patientSummary.whatToAvoid.map(w => `<li>${w}</li>`).join('')}
    </ul>
    ` : ''}
  </div>
  ` : ''}

  <div class="sbar-grid">
    <div class="sbar-section">
      <div class="sbar-label">
        <span class="label-badge badge-s">S</span>
        <span style="color:#b91c1c;">Situation (Acute Chief Complaint)</span>
      </div>
      <p class="sbar-text">${result.sbar.situation}</p>
    </div>

    <div class="sbar-section">
      <div class="sbar-label">
        <span class="label-badge badge-b">B</span>
        <span style="color:#b45309;">Background & Comorbidities</span>
      </div>
      <p class="sbar-text">${result.sbar.background}</p>
    </div>

    <div class="sbar-section">
      <div class="sbar-label">
        <span class="label-badge badge-a">A</span>
        <span style="color:#0369a1;">Clinical Assessment & Differential</span>
      </div>
      <p class="sbar-text">${result.sbar.assessment}</p>
    </div>

    <div class="sbar-section">
      <div class="sbar-label">
        <span class="label-badge badge-r">R</span>
        <span style="color:#047857;">Recommendation & Requested Diagnostics</span>
      </div>
      <p class="sbar-text">${result.sbar.recommendation}</p>
    </div>
  </div>

  ${result.sbar.vitalTriggers && result.sbar.vitalTriggers.length > 0 ? `
  <div class="vitals-box">
    <div class="vitals-title">Critical Vital Thresholds to Monitor</div>
    <div class="vitals-pills">
      ${result.sbar.vitalTriggers.map(v => `<span class="vital-pill">${v}</span>`).join('')}
    </div>
  </div>
  ` : ''}

  ${result.prescriptionsOrMedsDetected && result.prescriptionsOrMedsDetected.length > 0 ? `
  <div class="vitals-box">
    <div class="vitals-title">Documented Active Medications & Drug Interactions</div>
    <ul style="margin:4px 0 0 0; padding-left:16px; font-size:11px; color:#334155;">
      ${result.prescriptionsOrMedsDetected.map(m => `<li><strong>${m.name}:</strong> ${m.notes} ${m.cautionaryWarning ? `<span style="color:#b91c1c; font-weight:600;">(Alert: ${m.cautionaryWarning})</span>` : ''}</li>`).join('')}
    </ul>
  </div>
  ` : ''}

  ${result.extractedPrescriptions && result.extractedPrescriptions.length > 0 ? `
  <div class="vitals-box">
    <div class="vitals-title">Extracted Prescription Items (Never Hallucinate Illegible Details)</div>
    <table style="width:100%; border-collapse: collapse; margin-top: 6px; font-size: 11px;">
      <thead>
        <tr style="background:#f1f5f9; border-bottom: 1px solid #cbd5e1; text-align: left;">
          <th style="padding: 4px 6px;">Medicine</th>
          <th style="padding: 4px 6px;">Dose</th>
          <th style="padding: 4px 6px;">Frequency</th>
          <th style="padding: 4px 6px;">Uncertainty & Safety Flags</th>
        </tr>
      </thead>
      <tbody>
        ${result.extractedPrescriptions.map(p => `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 4px 6px; font-weight: bold;">${p.medicineName}</td>
            <td style="padding: 4px 6px; font-family: monospace;">${p.dose}</td>
            <td style="padding: 4px 6px;">${p.frequency}</td>
            <td style="padding: 4px 6px; color: #b91c1c;">${p.uncertaintyFlags.length > 0 ? p.uncertaintyFlags.join('; ') : 'None (Legible)'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  <div class="signature-row">
    <div>
      <div class="sign-line"></div>
      <div>Attending Clinician / Triage Nurse Name</div>
    </div>
    <div>
      <div class="sign-line"></div>
      <div>Professional License / Badge #</div>
    </div>
    <div>
      <div class="sign-line"></div>
      <div>Time & Date of Handover Acknowledgment</div>
    </div>
  </div>

  <div class="disclaimer-footer">
    <strong>HealthBridge Clinical Decision Support (CDS) Notice:</strong> This synthesized SBAR handover document is generated to support human medical communication and triage workflow. It does not replace independent clinical evaluation or licensed medical diagnosis. For acute emergencies, contact local emergency services (911 / 112) immediately.
  </div>

  <script>
    window.addEventListener('DOMContentLoaded', () => {
      // Auto-trigger print if launched in standalone window
      if (window.location.search.includes('autoprint=true')) {
        setTimeout(() => {
          window.print();
        }, 300);
      }
    });
  </script>
</body>
</html>`;
}

/**
 * Attempts to trigger print via a new window, with detection of popup blocking
 * so the parent application can gracefully display an inline printable view.
 */
export function openPrintWindowOrFallback(
  result: ClinicalAnalysisResult,
  options: PrintHandoverOptions = {}
): { success: boolean; isPopupBlocked: boolean } {
  try {
    const markup = generatePrintHandoverMarkup(result, options);
    const printWindow = window.open('', '_blank', 'width=860,height=900,menubar=no,toolbar=no,location=no,status=no');

    if (!printWindow || printWindow.closed || typeof printWindow.closed === 'undefined') {
      // Browser popup blocker prevented window from opening
      return { success: false, isPopupBlocked: true };
    }

    printWindow.document.open();
    printWindow.document.write(markup);
    printWindow.document.close();

    // Trigger print once document is ready
    setTimeout(() => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch (e) {
        console.warn('Direct print execution failed', e);
      }
    }, 400);

    return { success: true, isPopupBlocked: false };
  } catch (err) {
    console.warn('Failed to open standalone print window, relying on inline print fallback:', err);
    return { success: false, isPopupBlocked: true };
  }
}
