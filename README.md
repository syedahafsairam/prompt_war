# HealthBridge – Clinical Action Engine

HealthBridge is a Gemini-powered clinical triage and handover application built for PromptWars. It transforms messy symptom narratives, medical images, and prescription information into structured clinical action plans, emergency escalation guidance, and SBAR handover notes.

## Links

- **Live demo:** https://healthbridge-clinical-action-engine-886491703106.asia-southeast1.run.app
- **AI Studio project:** https://ai.studio/apps/4ab0b378-74a0-4ee5-bd3f-d6c2ace4f669
- **Repository:** https://github.com/syedahafsairam/prompt_war

## Features

- Multimodal clinical input for notes, images, and prescriptions
- Emergency escalation with native `tel:911` and `tel:112` links
- Copy-number fallbacks for emergency contacts
- Structured clinical action plans with acuity and confidence indicators
- SBAR clinician handover output and clipboard export
- Persistent triage history with search, filtering, and JSON/CSV export
- Preset scenarios for emergency, pediatric, medication-safety, specialist, and non-clinical guardrail testing

## Development

```bash
npm install
npm run dev
```

Build with `npm run build`. Configure runtime secrets through the deployment environment. Never commit API keys or personal health information.

## Safety

HealthBridge is a prototype and does not replace a licensed clinician or emergency services. In a real emergency, contact local emergency services directly. Test telephone links on a real mobile device before relying on them.
