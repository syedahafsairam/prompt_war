import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Volume2,
  Paperclip,
  Info,
  X
} from 'lucide-react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { formatDuration } from '../utils/audioRecorder';

export interface VoiceRecorderWidgetProps {
  onAppendTextToNotes: (text: string) => void;
  onAttachAudio?: (audio: { data: string; mimeType: string; duration: number; name: string }) => void;
  attachedAudioName?: string | null;
  onRemoveAttachedAudio?: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceRecorderWidget: React.FC<VoiceRecorderWidgetProps> = ({
  onAppendTextToNotes,
  onAttachAudio,
  attachedAudioName,
  onRemoveAttachedAudio,
  isOpen,
  onClose,
}) => {
  const {
    status,
    permission,
    elapsedSeconds,
    error,
    audioBlob,
    audioUrl,
    audioMimeType,
    audioDuration,
    transcript,
    speechRecognitionSupported,
    speechRecognitionNotice,
    isRecording,
    isRecorded,
    startRecording,
    stopRecording,
    resetRecording,
    transcribeAudioWithBackend,
  } = useAudioRecorder();

  const [isTranscribingWithAi, setIsTranscribingWithAi] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [attachFeedback, setAttachFeedback] = useState(false);

  if (!isOpen) return null;

  const handleTranscribeWithAi = async () => {
    setIsTranscribingWithAi(true);
    try {
      const result = await transcribeAudioWithBackend();
      if (result) {
        // Successfully transcribed
      }
    } finally {
      setIsTranscribingWithAi(false);
    }
  };

  const handleAppendNotes = () => {
    if (!transcript.trim()) return;
    onAppendTextToNotes(transcript.trim());
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleAttachAudioToInput = async () => {
    if (!audioBlob || !onAttachAudio) return;

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(audioBlob);
      const dataUri = await base64Promise;

      const durationSec = audioDuration || elapsedSeconds || 1;
      const cleanMime = audioMimeType || 'audio/webm';
      const fileName = `voice-note-${new Date().toISOString().slice(11, 19).replace(/:/g, '')}.${
        cleanMime.includes('mp4') ? 'mp4' : 'webm'
      }`;

      onAttachAudio({
        data: dataUri,
        mimeType: cleanMime,
        duration: durationSec,
        name: fileName,
      });

      setAttachFeedback(true);
      setTimeout(() => setAttachFeedback(false), 2500);
    } catch (err) {
      console.error('Failed to attach audio:', err);
    }
  };

  return (
    <div
      role="region"
      aria-label="Voice input and audio dictation console"
      className="relative overflow-hidden rounded-2xl border border-cyan-500/40 bg-slate-950/95 p-4 shadow-xl shadow-cyan-950/20 backdrop-blur transition-all mb-3 animate-in fade-in slide-in-from-top-2 duration-200"
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              isRecording
                ? 'bg-rose-500/20 text-rose-400 ring-2 ring-rose-500/50 animate-pulse'
                : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
            }`}
          >
            {isRecording ? <Mic className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Voice Clinical Dictation
            </h3>
            <p className="text-[11px] text-slate-400">
              High-fidelity microphone capture with live transcription and audio attachment
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close voice recorder widget"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Status & Timer Ribbon */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-900/80 p-3 border border-slate-800">
        <div className="flex items-center gap-3">
          {/* Status Indicator */}
          <div aria-live="polite" className="flex items-center gap-2">
            {isRecording && (
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
            )}
            <span
              className={`text-xs font-semibold ${
                isRecording
                  ? 'text-rose-400'
                  : isRecorded
                  ? 'text-emerald-400'
                  : error
                  ? 'text-rose-400'
                  : 'text-slate-300'
              }`}
            >
              {status === 'idle' && 'Ready to record · Press Record Voice'}
              {status === 'requesting_permission' && 'Requesting microphone access...'}
              {status === 'recording' && 'Recording Audio (Microphone Live)'}
              {status === 'recorded' && `Recorded · ${formatDuration(audioDuration || elapsedSeconds)} captured`}
              {status === 'transcribing' && 'Transcribing audio...'}
              {status === 'error' && 'Microphone Notice'}
              {status === 'unsupported' && 'Audio API Unsupported'}
            </span>
          </div>
        </div>

        {/* Elapsed Timer */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
            {isRecording ? 'Elapsed' : 'Duration'}:
          </span>
          <span
            aria-label={`Elapsed time ${formatDuration(isRecorded ? audioDuration : elapsedSeconds)}`}
            className={`font-mono text-sm font-bold px-2 py-0.5 rounded border ${
              isRecording
                ? 'bg-rose-950/60 text-rose-300 border-rose-500/40 animate-pulse'
                : 'bg-slate-950 text-cyan-300 border-slate-800'
            }`}
          >
            {formatDuration(isRecorded ? audioDuration : elapsedSeconds)}
          </span>
        </div>
      </div>

      {/* Permission & Error Alerts */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="mt-3 rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-xs text-rose-200 flex items-start gap-2.5"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-rose-300">
              {permission === 'denied'
                ? 'Microphone Permission Blocked'
                : status === 'unsupported'
                ? 'Audio Recording Unsupported'
                : 'Microphone Issue'}
            </p>
            <p className="text-rose-200/90 leading-relaxed">{error}</p>
            {permission === 'denied' && (
              <p className="text-[11px] text-rose-300/80 pt-1">
                Tip: Click the padlock or settings icon in your browser address bar and switch
                Microphone to "Allow", then try again.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Unsupported Browser Speech Recognition Fallback Advisory */}
      {!speechRecognitionSupported && speechRecognitionNotice && (
        <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-950/20 p-2.5 text-xs text-amber-200 flex items-start gap-2">
          <Info className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-amber-300">Speech Recognition Fallback Mode</p>
            <p className="text-[11px] text-amber-200/90 leading-relaxed">
              Live in-browser speech recognition is unavailable in this browser. Your voice note is
              being recorded directly with high-fidelity audio, which you can preview and attach
              directly for clinical analysis or AI transcription.
            </p>
          </div>
        </div>
      )}

      {/* Audio Waveform / Live Visualizer Simulation */}
      {isRecording && (
        <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-950/20 p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-rose-300 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              Listening to voice input...
            </span>
            <span className="text-[10px] font-mono text-rose-400">Opus Audio Stream</span>
          </div>
          <div className="flex items-center justify-center gap-1 h-8 py-1">
            {[40, 75, 55, 90, 65, 30, 85, 95, 60, 45, 80, 70, 35, 90, 50, 75, 40].map((h, i) => (
              <div
                key={i}
                style={{ height: `${Math.max(15, (h * (0.5 + Math.random() * 0.5)))}%` }}
                className="w-1.5 rounded-full bg-gradient-to-t from-rose-500 to-amber-400 transition-all duration-150 animate-pulse"
              />
            ))}
          </div>
        </div>
      )}

      {/* Audio Playback Preview Section */}
      {isRecorded && audioUrl && (
        <div className="mt-3 space-y-2 rounded-xl border border-slate-800 bg-slate-900/80 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Volume2 className="h-3.5 w-3.5 text-cyan-400" />
              Recorded Audio Playback Preview
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {audioMimeType || 'audio/webm'} · {formatDuration(audioDuration)}
            </span>
          </div>

          <div className="pt-1">
            <audio
              controls
              src={audioUrl}
              aria-label="Recorded voice note audio player"
              className="w-full h-10 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            />
          </div>
        </div>
      )}

      {/* Live / Transcribed Text Display */}
      {transcript && (
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-cyan-400" />
              {isRecording ? 'Live Transcription Preview:' : 'Transcribed Voice Text:'}
            </span>
            <button
              type="button"
              onClick={handleAppendNotes}
              aria-label="Append transcribed text directly to symptom notes textarea"
              className="text-[11px] font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 rounded px-1"
            >
              {copyFeedback ? (
                <>
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  <span className="text-emerald-400">Appended to Notes!</span>
                </>
              ) : (
                <>
                  <Paperclip className="h-3 w-3" />
                  <span>Insert into Notes</span>
                </>
              )}
            </button>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-2.5 text-xs text-slate-200 font-mono max-h-28 overflow-y-auto leading-relaxed select-text">
            {transcript}
          </div>
        </div>
      )}

      {/* Main Recording & Action Buttons */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
        <div className="flex items-center gap-2">
          {!isRecording ? (
            <button
              type="button"
              id="start-voice-recording-btn"
              onClick={startRecording}
              aria-label="Start recording voice note"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-950/50 hover:brightness-110 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            >
              <Mic className="h-4 w-4" />
              <span>{isRecorded ? 'Record New Voice Note' : 'Record Voice'}</span>
            </button>
          ) : (
            <button
              type="button"
              id="stop-voice-recording-btn"
              onClick={stopRecording}
              aria-label="Stop recording voice note"
              className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-950/50 hover:bg-rose-500 active:scale-95 transition-all animate-pulse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            >
              <Square className="h-4 w-4 fill-current" />
              <span>Stop Recording ({formatDuration(elapsedSeconds)})</span>
            </button>
          )}

          {/* Reset / Discard Button */}
          {(isRecorded || elapsedSeconds > 0 || error) && (
            <button
              type="button"
              id="reset-voice-recording-btn"
              onClick={resetRecording}
              aria-label="Discard current recording and reset microphone state"
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-rose-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Discard / Reset</span>
            </button>
          )}
        </div>

        {/* Secondary Actions: Transcribe & Attach */}
        {isRecorded && (
          <div className="flex items-center gap-2">
            {/* AI Transcribe with Server Button */}
            <button
              type="button"
              onClick={handleTranscribeWithAi}
              disabled={isTranscribingWithAi}
              aria-label="Transcribe recorded audio with AI"
              className="flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-950/30 px-3 py-2 text-xs font-semibold text-indigo-200 hover:bg-indigo-900/50 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>{isTranscribingWithAi ? 'Transcribing...' : 'AI Transcribe'}</span>
            </button>

            {/* Attach Audio to Clinical Analysis */}
            {onAttachAudio && (
              <button
                type="button"
                id="attach-audio-to-consultation-btn"
                onClick={handleAttachAudioToInput}
                aria-label="Attach audio recording to clinical consultation payload"
                className="flex items-center gap-1.5 rounded-xl bg-cyan-600 px-3 py-2 text-xs font-bold text-white hover:bg-cyan-500 shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                {attachFeedback ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                    <span>Audio Attached!</span>
                  </>
                ) : (
                  <>
                    <Paperclip className="h-3.5 w-3.5" />
                    <span>Attach Audio</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Currently Attached Indicator */}
      {attachedAudioName && (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-3 py-2 text-xs text-emerald-200">
          <div className="flex items-center gap-2 truncate">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span className="font-semibold text-emerald-300">Attached to Consultation:</span>
            <span className="truncate font-mono text-[11px] text-emerald-200">{attachedAudioName}</span>
          </div>
          {onRemoveAttachedAudio && (
            <button
              type="button"
              onClick={onRemoveAttachedAudio}
              aria-label="Remove attached audio file"
              className="ml-2 text-slate-400 hover:text-rose-400 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
