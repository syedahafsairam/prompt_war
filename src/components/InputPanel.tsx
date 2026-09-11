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
  CheckCircle2
} from 'lucide-react';
import { SAMPLE_CASES } from '../data/sampleCases';
import { SampleCase } from '../types';

interface InputPanelProps {
  onAnalyze: (payload: {
    text: string;
    image?: { data: string; mimeType: string };
    urgencyHint?: string;
  }) => void;
  isLoading: boolean;
}

export const InputPanel: React.FC<InputPanelProps> = ({ onAnalyze, isLoading }) => {
  const [textInput, setTextInput] = useState('');
  const [urgencyHint, setUrgencyHint] = useState('Standard Clinical Assessment');
  const [selectedImage, setSelectedImage] = useState<{ data: string; mimeType: string; name?: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

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
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload an image file (JPG, PNG, WebP, or SVG).');
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
    setSelectedPresetId(preset.id);
    setTextInput(preset.rawText);
    setUrgencyHint(preset.category);
    if (preset.imageDataUri) {
      setSelectedImage({
        data: preset.imageDataUri,
        mimeType: 'image/svg+xml',
        name: `${preset.id}-visual.svg`,
      });
    } else {
      setSelectedImage(null);
    }
  };

  // Speech Recognition
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your notes or paste text.');
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setTextInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      setIsRecording(false);
    }
  };

  // Clear all
  const handleReset = () => {
    setTextInput('');
    setSelectedImage(null);
    setSelectedPresetId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Submit Handler
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!textInput.trim() && !selectedImage) {
      alert('Please describe symptoms or attach an image/record before processing.');
      return;
    }
    onAnalyze({
      text: textInput.trim(),
      image: selectedImage ? { data: selectedImage.data, mimeType: selectedImage.mimeType } : undefined,
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
        {(textInput || selectedImage) && (
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
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Messy Human Health Intent (Notes / Symptoms / Vitals)
            </label>
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${
                isRecording
                  ? 'bg-rose-500/20 text-rose-300 animate-pulse border border-rose-500/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
              title="Speak to dictate symptoms"
            >
              {isRecording ? <MicOff className="h-3.5 w-3.5 text-rose-400" /> : <Mic className="h-3.5 w-3.5" />}
              <span>{isRecording ? 'Listening...' : 'Voice Dictation'}</span>
            </button>
          </div>

          <div className="relative">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Describe symptoms in your own raw words (e.g. 'Sudden intense pain behind ribs, sweating cold sweat, took one aspirin, left hand has weird prickling sensations, father had heart attack at 60...')"
              rows={4}
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
            disabled={isLoading || (!textInput.trim() && !selectedImage)}
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
