import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  Image as ImageIcon, 
  X, 
  Sparkles, 
  Mic, 
  MicOff, 
  Camera, 
  FileText, 
  AlertCircle, 
  ArrowRight,
  Stethoscope,
  Trash2,
  CheckCircle2,
  Volume2
} from 'lucide-react';
import { SAMPLE_CASES } from '../data/sampleCases';
import { SampleCase } from '../types';
import { VoiceRecorderWidget } from './VoiceRecorderWidget';

interface InputPanelProps {
  onAnalyze: (payload: {
    text: string;
    image?: { data: string; mimeType: string };
    audio?: { data: string; mimeType: string; duration?: number; name?: string };
    urgencyHint?: string;
  }) => void;
  isLoading: boolean;
}

export const InputPanel: React.FC<InputPanelProps> = ({ onAnalyze, isLoading }) => {
  const [textInput, setTextInput] = useState('');
  const [urgencyHint, setUrgencyHint] = useState('Standard Clinical Assessment');
  const [selectedImage, setSelectedImage] = useState<{ data: string; mimeType: string; name?: string } | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<{ data: string; mimeType: string; duration: number; name: string } | null>(null);
  const [isVoiceWidgetOpen, setIsVoiceWidgetOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    setInputError(null);
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setInputError('Please upload an image file (JPEG, PNG, WebP, or GIF). Other file types are blocked for security.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setInputError('File size exceeds the 10MB limit. Please attach a compressed image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage({
        data: reader.result as string,
        mimeType: file.type,
        name: file.name,
      });
      setSelectedPresetId(null);
    };
    reader.readAsDataURL(file);
  };

  // Preset Selection
  const handleSelectPreset = (preset: SampleCase) => {
    setInputError(null);
    setSelectedPresetId(preset.id);
    setTextInput(preset.rawText);
    setUrgencyHint(preset.category);
    if (preset.imageDataUri) {
      setSelectedImage({
        data: preset.imageDataUri,
        mimeType: 'image/jpeg',
        name: `${preset.id}-visual.jpg`,
      });
    } else {
      setSelectedImage(null);
    }
  };

  // Clear all
  const handleReset = () => {
    setTextInput('');
    setSelectedImage(null);
    setSelectedAudio(null);
    setSelectedPresetId(null);
    setInputError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Submit Handler
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setInputError(null);

    if (!textInput.trim() && !selectedImage && !selectedAudio) {
      setInputError('Please describe symptoms, attach an image/record, or record a voice note before processing.');
      return;
    }

    if (textInput.length > 8000) {
      setInputError('Input notes exceed the 8,000 character limit. Please shorten your narrative.');
      return;
    }

    onAnalyze({
      text: textInput.trim(),
      image: selectedImage ? { data: selectedImage.data, mimeType: selectedImage.mimeType } : undefined,
      audio: selectedAudio
        ? {
            data: selectedAudio.data,
            mimeType: selectedAudio.mimeType,
            duration: selectedAudio.duration,
            name: selectedAudio.name,
          }
        : undefined,
      urgencyHint,
    });
  };

  return (
    <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-5 shadow-xl backdrop-blur-sm sm:p-6">
      {/* Card Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
              <Stethoscope className="h-4 w-4" />
            </span>
            <h2 className="text-base font-bold text-white">Unstructured Health Input Hub</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Accepts raw photos of symptoms/prescriptions, frantic notes, or fragmented medical history
          </p>
        </div>

        {/* Clear Button */}
        {(textInput || selectedImage || selectedAudio) && (
          <button
            onClick={handleReset}
            className="self-start sm:self-auto flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear Input</span>
          </button>
        )}
      </div>

      {/* Preset Hackathon Test Scenarios */}
      <div className="mt-4">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Instant Test Scenarios (PromptWars Evaluator Presets):
        </label>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {SAMPLE_CASES.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              className={`flex flex-col text-left rounded-xl border p-2.5 transition-all ${
                selectedPresetId === preset.id
                  ? 'border-cyan-500 bg-cyan-950/40 ring-1 ring-cyan-500/50'
                  : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${preset.badgeColor}`}>
                  {preset.tag}
                </span>
                {selectedPresetId === preset.id && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                )}
              </div>
              <span className="mt-1.5 text-xs font-bold text-slate-200 line-clamp-1">{preset.title}</span>
              <span className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{preset.description}</span>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {/* Multimodal Upload Dropzone */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Attach Medical Visual / Prescription / Photo
          </label>

          {selectedImage ? (
            <div className="relative overflow-hidden rounded-xl border border-cyan-500/40 bg-slate-950/80 p-3">
              <div className="flex items-center gap-3">
                <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-slate-700 bg-slate-900">
                  <img
                    src={selectedImage.data}
                    alt="Uploaded health visual"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-200 truncate">
                    {selectedImage.name || 'Medical Visual Attached'}
                  </p>
                  <p className="text-[11px] text-cyan-400 mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                    <span>Signal Ingested & Ready for Multimodal Analysis</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-rose-400"
                  title="Remove Image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center transition-all ${
                isDragging
                  ? 'border-cyan-400 bg-cyan-950/20 text-cyan-200'
                  : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800/80 text-slate-300">
                <UploadCloud className="h-5 w-5 text-cyan-400" />
              </div>
              <p className="mt-2 text-xs font-semibold text-slate-200">
                Click to browse or drag & drop photo
              </p>
              <p className="text-[11px] text-slate-400">
                Rash photos, prescription labels, ECG traces, injury pictures, or discharge notes
              </p>
            </div>
          )}
        </div>

        {/* Text Note Input Area */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="symptom-notes-input" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Messy Human Health Intent (Notes / Symptoms / Vitals)
            </label>
            <button
              type="button"
              id="toggle-voice-input-btn"
              onClick={() => setIsVoiceWidgetOpen((prev) => !prev)}
              aria-expanded={isVoiceWidgetOpen}
              aria-label={isVoiceWidgetOpen ? 'Close voice recording console' : 'Record voice note'}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                isVoiceWidgetOpen || selectedAudio
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-950/40'
                  : 'border border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
              }`}
              title="Record voice note using microphone"
            >
              <Mic className="h-3.5 w-3.5 text-rose-400" />
              <span>
                {selectedAudio
                  ? 'Voice Note Attached'
                  : isVoiceWidgetOpen
                  ? 'Close Voice Console'
                  : 'Record Voice'}
              </span>
            </button>
          </div>

          {/* Voice Recording Widget */}
          {isVoiceWidgetOpen && (
            <VoiceRecorderWidget
              isOpen={isVoiceWidgetOpen}
              onClose={() => setIsVoiceWidgetOpen(false)}
              onAppendTextToNotes={(spokenText) => {
                setTextInput((prev) => {
                  const trimmed = prev.trim();
                  return trimmed ? `${trimmed}\n\n[Voice Note]: ${spokenText}` : spokenText;
                });
              }}
              onAttachAudio={(audio) => {
                setSelectedAudio(audio);
              }}
              attachedAudioName={selectedAudio?.name}
              onRemoveAttachedAudio={() => setSelectedAudio(null)}
            />
          )}

          {/* Attached Audio Mini Chip if Widget Closed */}
          {selectedAudio && !isVoiceWidgetOpen && (
            <div className="mb-2 flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-2.5 text-xs text-emerald-200">
              <div className="flex items-center gap-2 min-w-0">
                <Volume2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="font-semibold text-emerald-300">Voice Note Attached:</span>
                <span className="truncate font-mono text-[11px] text-slate-200">{selectedAudio.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">({selectedAudio.duration}s)</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsVoiceWidgetOpen(true)}
                  className="text-[11px] font-semibold text-cyan-400 hover:underline"
                >
                  Review
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAudio(null)}
                  aria-label="Remove attached voice note"
                  className="rounded p-1 text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {inputError && (
            <div className="mb-2 rounded-lg border border-rose-500/40 bg-rose-950/30 p-2.5 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{inputError}</span>
            </div>
          )}

          <div className="relative">
            <textarea
              id="symptom-notes-input"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Describe symptoms in your own raw words (e.g. 'Sudden intense pain behind ribs, sweating cold sweat, took one aspirin, left hand has weird prickling sensations, father had heart attack at 60...')"
              rows={4}
              aria-label="Symptom notes and patient narrative"
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-100 placeholder-slate-500 transition-colors focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  handleSubmit();
                }
              }}
            />
          </div>
        </div>

        {/* Urgency Context Hint */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Clinical Context:</span>
            <select
              value={urgencyHint}
              onChange={(e) => setUrgencyHint(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
            >
              <option value="Standard Clinical Assessment">Standard Triage Assessment</option>
              <option value="Potential Life-Threatening Emergency">Potential Emergency Escalation</option>
              <option value="Pediatric Acute Care">Pediatric Acute Care</option>
              <option value="Medication Safety & Drug Interaction">Medication Safety & Drug Interaction</option>
              <option value="Chronic Condition Flare-Up">Chronic Condition Flare-Up</option>
            </select>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isLoading || (!textInput.trim() && !selectedImage && !selectedAudio)}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-900/30 transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            <span>{isLoading ? 'Synthesizing Action Plan...' : 'Process Clinical Action Plan'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
