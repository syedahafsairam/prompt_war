import { useState, useRef, useEffect, useCallback } from 'react';
import {
  AudioRecordingState,
  createInitialAudioState,
  checkAudioRecordingSupport,
  checkSpeechRecognitionSupport,
  getSupportedAudioMimeType,
  mapMicrophoneError,
  transitionToRequesting,
  transitionToRecording,
  transitionToRecorded,
  transitionToError,
  transitionToReset,
  transitionToTranscribing,
  transitionToTranscribed,
  cleanupMediaStream,
  cleanupAudioUrl,
} from '../utils/audioRecorder';

export interface UseAudioRecorderReturn extends AudioRecordingState {
  isRecording: boolean;
  isRecorded: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  resetRecording: () => void;
  transcribeAudioWithBackend: () => Promise<string | null>;
  setTranscriptManual: (text: string) => void;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [state, setState] = useState<AudioRecordingState>(() =>
    createInitialAudioState(checkSpeechRecognitionSupport())
  );

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);
  const chunksRef = useRef<Blob[]>([]);
  const currentAudioUrlRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(0);
  const currentTranscriptRef = useRef<string>('');

  // Keep ref synchronized with state audioUrl for cleanup
  useEffect(() => {
    currentAudioUrlRef.current = state.audioUrl;
  }, [state.audioUrl]);

  // Keep transcript ref updated
  useEffect(() => {
    currentTranscriptRef.current = state.transcript;
  }, [state.transcript]);

  // Comprehensive cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // ignore
        }
        mediaRecorderRef.current = null;
      }

      cleanupMediaStream(mediaStreamRef.current);
      mediaStreamRef.current = null;

      cleanupAudioUrl(currentAudioUrlRef.current);
    };
  }, []);

  /**
   * Starts microphone recording flow.
   * STRICT SAFETY: Requests permission ONLY on user trigger.
   */
  const startRecording = useCallback(async () => {
    // 1. Check browser support
    const supportCheck = checkAudioRecordingSupport();
    if (!supportCheck.supported) {
      setState((prev) =>
        transitionToError(
          prev,
          supportCheck.reason || 'Audio recording is not supported in this browser.',
          'unsupported'
        )
      );
      return;
    }

    // Clean up previous recording if any
    if (state.audioUrl) {
      cleanupAudioUrl(state.audioUrl);
    }
    chunksRef.current = [];
    currentTranscriptRef.current = '';

    setState((prev) => transitionToRequesting(prev));

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
    } catch (err: any) {
      const { permission, error } = mapMicrophoneError(err);
      // NEVER claim recording succeeded if permission was denied or stream failed
      setState((prev) => transitionToError(prev, error, permission));
      return;
    }

    try {
      const preferredMime = getSupportedAudioMimeType();
      const recorder = preferredMime
        ? new MediaRecorder(stream, { mimeType: preferredMime })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onerror = (e: any) => {
        console.error('[AudioRecorder] MediaRecorder error:', e);
        setState((prev) =>
          transitionToError(prev, 'MediaRecorder encountered an error while capturing audio.')
        );
      };

      recorder.onstop = () => {
        const mimeType = preferredMime || 'audio/webm';
        const finalBlob = new Blob(chunksRef.current, { type: mimeType });
        const finalUrl = URL.createObjectURL(finalBlob);
        currentAudioUrlRef.current = finalUrl;

        const duration = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));

        // Stop stream tracks
        cleanupMediaStream(mediaStreamRef.current);
        mediaStreamRef.current = null;

        setState((prev) =>
          transitionToRecorded(prev, finalBlob, finalUrl, duration, currentTranscriptRef.current)
        );
      };

      // Live SpeechRecognition setup if supported
      let isLiveTranscribing = false;
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          recognition.onresult = (event: any) => {
            let full = '';
            for (let i = 0; i < event.results.length; i++) {
              full += event.results[i][0].transcript + ' ';
            }
            const trimmed = full.trim();
            currentTranscriptRef.current = trimmed;
            setState((prev) => ({ ...prev, transcript: trimmed }));
          };

          recognition.onerror = (event: any) => {
            console.warn('[AudioRecorder] SpeechRecognition event:', event.error);
            // Speech error should not crash audio recording; audio is still preserved!
            setState((prev) => ({
              ...prev,
              speechRecognitionNotice: `Live transcription notice (${event.error || 'speech engine unavailable'}). Recorded audio is fully preserved for upload.`,
            }));
          };

          recognition.start();
          recognitionRef.current = recognition;
          isLiveTranscribing = true;
        } catch (recognitionErr) {
          console.warn('[AudioRecorder] Could not start live recognition:', recognitionErr);
        }
      }

      // Start recording
      recorder.start(250); // Emit slices every 250ms for safety
      startTimeRef.current = Date.now();

      // Start elapsed timer
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setState((prev) => ({ ...prev, elapsedSeconds: elapsed }));
      }, 500);

      setState((prev) => transitionToRecording(prev, preferredMime || 'audio/webm', isLiveTranscribing));
    } catch (recorderErr: any) {
      console.error('[AudioRecorder] Initialization failed:', recorderErr);
      cleanupMediaStream(stream);
      mediaStreamRef.current = null;
      setState((prev) =>
        transitionToError(
          prev,
          `Failed to initialize MediaRecorder: ${recorderErr.message || 'Unknown recorder error'}`
        )
      );
    }
  }, [state.audioUrl]);

  /**
   * Stops microphone recording and finalizes audio blob
   */
  const stopRecording = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.warn('[AudioRecorder] Stop error:', err);
      }
    }
  }, []);

  /**
   * Discards the recording, releases memory, and resets to clean state
   */
  const resetRecording = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }

    cleanupMediaStream(mediaStreamRef.current);
    mediaStreamRef.current = null;
    mediaRecorderRef.current = null;

    chunksRef.current = [];
    currentTranscriptRef.current = '';

    setState((prev) => transitionToReset(prev, (url) => cleanupAudioUrl(url)));
  }, []);

  /**
   * Transcribe recorded audio with server-side Gemini endpoint if available
   */
  const transcribeAudioWithBackend = useCallback(async (): Promise<string | null> => {
    if (!state.audioBlob) return null;

    setState((prev) => transitionToTranscribing(prev));

    try {
      // Convert Blob to Base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(state.audioBlob);
      const dataUri = await base64Promise;

      const res = await fetch('/api/transcribe-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioData: dataUri,
          mimeType: state.audioMimeType || 'audio/webm',
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Transcription request failed with status ${res.status}`);
      }

      const data = await res.json();
      const transcript = data.transcript || '';
      currentTranscriptRef.current = transcript;
      setState((prev) => transitionToTranscribed(prev, transcript));
      return transcript;
    } catch (err: any) {
      console.warn('[AudioRecorder] Server transcription failed:', err);
      // Restore state without overwriting existing live transcript
      setState((prev) => ({
        ...prev,
        status: 'recorded',
        error: `Transcription notice: ${err.message || 'Server transcription unavailable'}`,
      }));
      return null;
    }
  }, [state.audioBlob, state.audioMimeType]);

  const setTranscriptManual = useCallback((text: string) => {
    currentTranscriptRef.current = text;
    setState((prev) => ({ ...prev, transcript: text }));
  }, []);

  return {
    ...state,
    isRecording: state.status === 'recording',
    isRecorded: state.status === 'recorded',
    startRecording,
    stopRecording,
    resetRecording,
    transcribeAudioWithBackend,
    setTranscriptManual,
  };
}
