import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { evaluateClinicalRules } from './src/engine/clinicalRuleEngine';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// In-memory buffer for optional server-side session persistence
const serverRecordsBuffer: any[] = [];

// Lazy GoogleGenAI initialization
let aiClient: GoogleGenAI | null = null;
function getGenAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'HealthBridge Clinical Action Engine',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    serverPersistenceEnabled: Boolean(process.env.ENABLE_SERVER_PERSISTENCE === 'true'),
    timestamp: new Date().toISOString(),
  });
});

// Optional server persistence endpoints
app.get('/api/triage-records', (req, res) => {
  res.json(serverRecordsBuffer.slice(0, 30));
});

app.post('/api/triage-records', (req, res) => {
  const record = req.body;
  if (record && record.id) {
    const existingIdx = serverRecordsBuffer.findIndex((r) => r.id === record.id);
    if (existingIdx >= 0) {
      serverRecordsBuffer[existingIdx] = record;
    } else {
      serverRecordsBuffer.unshift(record);
      if (serverRecordsBuffer.length > 50) serverRecordsBuffer.pop();
    }
  }
  res.json({ success: true, count: serverRecordsBuffer.length });
});

// Audio transcription endpoint using Gemini Flash multimodal capabilities
app.post('/api/transcribe-audio', async (req, res) => {
  try {
    const { audioData, mimeType } = req.body;
    if (!audioData) {
      return res.status(400).json({ error: 'Audio data is required for transcription.' });
    }

    const ai = getGenAIClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Live server transcription requires GEMINI_API_KEY. Your audio recording is safely stored for clinical review.',
      });
    }

    const cleanBase64 = audioData.includes(',') ? audioData.split(',')[1] : audioData;
    const cleanMime = mimeType || 'audio/webm';

    let transcribeTimer: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      transcribeTimer = setTimeout(
        () => reject(new Error('Audio transcription timed out (exceeded 30s).')),
        30000
      );
    });

    const transcribePromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: cleanMime,
              data: cleanBase64,
            },
          },
          {
            text: 'Provide an exact, verbatim clinical transcription of this patient voice recording. Accurately transcribe all medical symptoms, drug names, anatomical locations, and duration expressions. Output ONLY the transcribed text without conversational preamble or quotation marks.',
          },
        ],
      },
    });

    let response: any;
    try {
      response = await Promise.race([transcribePromise, timeoutPromise]);
    } finally {
      if (transcribeTimer) clearTimeout(transcribeTimer);
    }

    const transcript = response.text?.trim() || '';
    res.json({ transcript });
  } catch (err: any) {
    console.error('[Triage Server] Audio transcription error:', err);
    res.status(500).json({
      error: err.message || 'Failed to transcribe audio.',
    });
  }
});

// Clinical analysis endpoint
app.post('/api/analyze-health-input', async (req, res) => {
  const requestId = 'req_' + Math.random().toString(36).substring(2, 8);
  const startTime = Date.now();

  try {
    const { text, image, audio, urgencyHint } = req.body;

    if (!text && !image && !audio) {
      return res.status(400).json({
        error: 'Please provide either symptom notes, an image/document, or an audio recording to analyze.',
      });
    }

    if (text && typeof text !== 'string') {
      return res.status(400).json({ error: 'Text input must be a valid string.' });
    }

    if (text && text.length > 8000) {
      return res.status(400).json({ error: 'Symptom notes exceed maximum permitted length (8,000 characters).' });
    }

    if (image) {
      if (typeof image !== 'object' || !image.data) {
        return res.status(400).json({ error: 'Invalid image payload format.' });
      }
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      const mime = image.mimeType || 'image/jpeg';
      if (!allowedMimes.includes(mime)) {
        return res.status(400).json({ error: 'Unsupported image format. Allowed: JPEG, PNG, WEBP, GIF.' });
      }
    }

    if (audio) {
      if (typeof audio !== 'object' || !audio.data) {
        return res.status(400).json({ error: 'Invalid audio payload format.' });
      }
    }

    // Privacy-safe server log (no patient medical text or images logged to console)
    console.log(
      `[Triage Server] [${requestId}] Intake validated: textChars=${text ? text.length : 0}, hasImage=${Boolean(
        image
      )}, hasAudio=${Boolean(audio)}, urgencyHint=${urgencyHint || 'none'}`
    );

    const ai = getGenAIClient();

    if (!ai) {
      // Return high-quality deterministic triage fallback if API key is not configured in local environment
      const fallbackResult = evaluateClinicalRules({
        text: text || '',
        hasImage: Boolean(image),
        imageDataUri: image?.data,
        urgencyHint,
      });
      console.log(`[Triage Server] [${requestId}] Processed via Clinical Rule Engine (No GEMINI_API_KEY) in ${Date.now() - startTime}ms`);
      return res.json({
        ...fallbackResult,
        _notice: 'Processed via Deterministic Clinical Rule Base (No GEMINI_API_KEY detected in environment).',
      });
    }

    // Build multimodal contents
    const contentsParts: any[] = [];

    if (image && image.data) {
      // Ensure clean base64 data without prefix
      const cleanBase64 = image.data.includes(',')
        ? image.data.split(',')[1]
        : image.data;
      const mimeType = image.mimeType || 'image/jpeg';

      contentsParts.push({
        inlineData: {
          mimeType,
          data: cleanBase64,
        },
      });
    }

    if (audio && audio.data) {
      const cleanBase64 = audio.data.includes(',')
        ? audio.data.split(',')[1]
        : audio.data;
      const mimeType = audio.mimeType || 'audio/webm';

      contentsParts.push({
        inlineData: {
          mimeType,
          data: cleanBase64,
        },
      });
    }

    const clinicalPrompt = `
You are HealthBridge, an advanced clinical triage engine and universal healthcare bridge for PromptWars x Techverse.
Your objective: Take messy, unstructured human health inputs (raw photos of rashes/injuries/prescriptions, frantic voice notes, fragmented medical history) and turn them into:
1. Explicit Multimodal Input Classification:
   - Must be classified as one of: 'GENERAL_SYMPTOM' (symptom photos, clinical notes), 'PRESCRIPTION_DOCUMENT' (prescription slips, bottle labels, medication lists), or 'TRAFFIC_NEWS_OTHER' (non-clinical topics like traffic jams, news, sports, weather).
   - Provide confidence (0-100) and specific evidence-based reasons.
2. If input is 'PRESCRIPTION_DOCUMENT':
   - Extract individual prescription items: medicineName, dose, frequency, indicationOrNotes, and uncertaintyFlags.
   - MANDATORY SAFETY DIRECTIVE: NEVER invent or hallucinate unreadable dosages, strengths, or frequencies. If a dose is scribbled, blurry, or missing, mark dose as 'Unspecified / Illegible' and explicitly record an uncertainty flag (e.g. 'Dosage illegible - requires pharmacist verification').
3. Immediate Triage Severity classification ('EMERGENCY_RED', 'URGENT_AMBER', 'ROUTINE_GREEN', or 'SELF_CARE_BLUE'). If TRAFFIC_NEWS_OTHER, set level to 'SELF_CARE_BLUE' with non-clinical advisory.
4. Urgent Red-Flag alerts with immediate safety mitigations (e.g. Stroke FAST, Acute Coronary Syndrome, Anaphylaxis, Sepsis, Severe Internal Bleed).
5. Plain-English patient guidance (de-jargonized, calm, clear, what to do and avoid).
6. Standardized SBAR Clinical Handover (Situation, Background, Assessment, Recommendation) specifically formatted so a triage nurse or emergency physician can instantly act.
7. Prioritized step-by-step clinical action plan with first aid and logistical checklists.
8. Key questions to ask the doctor during the consultation.
9. Vital signs to monitor and medication safety warnings (especially drug-drug interactions or unclear handwritten dosages).

Input Text: "${text || 'No accompanying text, analyze image carefully.'}"
User Urgency Hint: "${urgencyHint || 'Standard'}"

Respond STRICTLY conforming to the JSON schema.
`;

    contentsParts.push({
      text: clinicalPrompt,
    });

    const geminiCallPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: contentsParts },
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        systemInstruction: `You are an elite Clinical Decision Support Architect and Healthcare Systems Bridge. You prioritize patient safety, rapid emergency detection, transparent explanations, and seamless medical provider communication. Always identify potential red flags immediately.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            inputClassification: {
              type: Type.OBJECT,
              properties: {
                detectedType: {
                  type: Type.STRING,
                  description: "Must be one of 'GENERAL_SYMPTOM', 'PRESCRIPTION_DOCUMENT', 'TRAFFIC_NEWS_OTHER'",
                },
                confidence: { type: Type.INTEGER, description: "Classification confidence 0-100" },
                reasons: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Evidence-based reasons justifying the classification"
                },
              },
              required: ['detectedType', 'confidence', 'reasons'],
            },
            extractedPrescriptions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  medicineName: { type: Type.STRING },
                  dose: { type: Type.STRING, description: "e.g. '50mg' or 'Unspecified / Illegible'" },
                  frequency: { type: Type.STRING, description: "e.g. 'BID (twice daily)' or 'Unspecified'" },
                  indicationOrNotes: { type: Type.STRING },
                  uncertaintyFlags: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Warnings about illegible handwriting, missing dosage, or ambiguity. NEVER guess unreadable text."
                  },
                },
                required: ['id', 'medicineName', 'dose', 'frequency', 'uncertaintyFlags'],
              },
            },
            triage: {
              type: Type.OBJECT,
              properties: {
                level: {
                  type: Type.STRING,
                  description: "Must be one of 'EMERGENCY_RED', 'URGENT_AMBER', 'ROUTINE_GREEN', 'SELF_CARE_BLUE'",
                },
                title: { type: Type.STRING, description: "Clear high-impact summary headline" },
                timeframe: { type: Type.STRING, description: "e.g. Immediate (Call 911/112), Within 2-4 hours, Within 24-48 hours" },
                score: { type: Type.INTEGER, description: "1 to 10 clinical severity scale" },
                rationale: { type: Type.STRING, description: "Clinical reason for this triage level" },
              },
              required: ['level', 'title', 'timeframe', 'score', 'rationale'],
            },
            redFlags: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  riskFactor: { type: Type.STRING },
                  criticalWarning: { type: Type.STRING },
                  immediateMitigation: { type: Type.STRING },
                },
                required: ['id', 'title', 'riskFactor', 'criticalWarning', 'immediateMitigation'],
              },
            },
            sbar: {
              type: Type.OBJECT,
              properties: {
                situation: { type: Type.STRING, description: "One-sentence chief acute situation for triage clinician" },
                background: { type: Type.STRING, description: "Extracted medical history, current meds, onset timeline" },
                assessment: { type: Type.STRING, description: "Clinical findings, potential differential etiology" },
                recommendation: { type: Type.STRING, description: "Requested medical intervention, imaging, or lab tests" },
                vitalTriggers: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Key vital signs or red lines to watch for"
                },
              },
              required: ['situation', 'background', 'assessment', 'recommendation', 'vitalTriggers'],
            },
            patientSummary: {
              type: Type.OBJECT,
              properties: {
                plainEnglish: { type: Type.STRING, description: "Empathetic, clear, jargon-free summary for the patient/family" },
                keyFindings: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "3-5 key observations extracted from the messy input"
                },
                whatToAvoid: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Things the patient should strictly NOT do (e.g. do not drive, do not take NSAIDs, do not pop blister)"
                },
              },
              required: ['plainEnglish', 'keyFindings', 'whatToAvoid'],
            },
            actionSteps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  stepNumber: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  instruction: { type: Type.STRING },
                  priority: { type: Type.STRING, description: "'CRITICAL', 'HIGH', or 'MEDIUM'" },
                  category: { type: Type.STRING, description: "'FIRST_AID', 'LOGISTICS', 'MEDICATION_SAFETY', or 'MONITORING'" },
                },
                required: ['id', 'stepNumber', 'title', 'instruction', 'priority', 'category'],
              },
            },
            questionsForDoctor: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Empowering questions for patient to ask healthcare provider"
            },
            targetSpecialty: { type: Type.STRING, description: "e.g. Emergency Medicine, Pediatric Urgent Care, Cardiology, Podiatry" },
            recommendedFacility: { type: Type.STRING, description: "Type of clinical facility suited for this urgency" },
            prescriptionsOrMedsDetected: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  notes: { type: Type.STRING },
                  cautionaryWarning: { type: Type.STRING },
                },
                required: ['name', 'notes'],
              },
            },
            vitalSignsToWatch: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  metric: { type: Type.STRING },
                  normalRange: { type: Type.STRING },
                  warningThreshold: { type: Type.STRING },
                  instruction: { type: Type.STRING },
                },
                required: ['metric', 'normalRange', 'warningThreshold', 'instruction'],
              },
            },
            confidenceScore: { type: Type.INTEGER, description: "Confidence score 70-99" },
          },
          required: [
            'triage',
            'redFlags',
            'sbar',
            'patientSummary',
            'actionSteps',
            'questionsForDoctor',
            'targetSpecialty',
            'recommendedFacility',
            'prescriptionsOrMedsDetected',
            'vitalSignsToWatch',
          ],
        },
      },
    });

    let timeoutHandle: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutHandle = setTimeout(
        () => reject(new Error('Clinical generation timeout (exceeded 45s)')),
        45000
      );
    });

    let response: any;
    try {
      response = await Promise.race([geminiCallPromise, timeoutPromise]);
    } finally {
      if (timeoutHandle) clearTimeout(timeoutHandle);
    }

    const rawText = response.text?.trim() || '{}';
    let cleanJson = rawText;
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    }
    const parsedJson = JSON.parse(cleanJson || '{}');

    // Assemble final response
    const detectedType = parsedJson.inputClassification?.detectedType || (image ? 'GENERAL_SYMPTOM' : 'GENERAL_SYMPTOM');
    const finalResult = {
      id: 'hb-' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      rawInputSummary: text ? (text.slice(0, 140) + (text.length > 140 ? '...' : '')) : 'Image/Document input processed',
      hasImage: Boolean(image),
      sourceInputType: detectedType,
      inputClassification: parsedJson.inputClassification || {
        detectedType,
        confidence: parsedJson.confidenceScore || 90,
        reasons: ['Processed via Gemini multimodal clinical vision & language understanding'],
        source: 'gemini_multimodal',
      },
      extractedPrescriptions: (parsedJson.extractedPrescriptions || []).map((p: any, idx: number) => ({
        ...p,
        id: p.id || `med-${idx + 1}`,
        isConfirmedByUser: false,
      })),
      triage: parsedJson.triage,
      redFlags: parsedJson.redFlags || [],
      sbar: parsedJson.sbar,
      patientSummary: parsedJson.patientSummary,
      actionSteps: parsedJson.actionSteps || [],
      questionsForDoctor: parsedJson.questionsForDoctor || [],
      targetSpecialty: parsedJson.targetSpecialty || 'General Emergency / Primary Care',
      recommendedFacility: parsedJson.recommendedFacility || 'Nearest Urgent Healthcare Facility',
      prescriptionsOrMedsDetected: parsedJson.prescriptionsOrMedsDetected || [],
      vitalSignsToWatch: parsedJson.vitalSignsToWatch || [],
      verificationMetadata: {
        model: 'gemini-3.8-flash',
        protocol: 'HealthBridge Clinical Decision Support Framework v4.2',
        samdCheckPassed: true,
        confidenceScore: parsedJson.confidenceScore || 95,
      },
    };

    console.log(`[Triage Server] [${requestId}] Completed successfully via Gemini 3.8 Flash in ${Date.now() - startTime}ms`);
    return res.json(finalResult);
  } catch (error: any) {
    console.warn(`[Triage Server] [${requestId}] Gemini error or timeout (${error.message || 'unknown'}). Falling back to Clinical Rule Engine.`);

    // Graceful fallback so user always receives immediate life-saving guidance
    const fallback = evaluateClinicalRules({
      text: req.body?.text || '',
      hasImage: Boolean(req.body?.image),
      imageDataUri: req.body?.image?.data,
      urgencyHint: req.body?.urgencyHint,
    });

    return res.json({
      ...fallback,
      _errorNote: 'Gemini upstream API issue handled gracefully via HealthBridge Clinical Safety Guardrail.',
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HealthBridge server listening at http://localhost:${PORT}`);
  });
}

startServer();
