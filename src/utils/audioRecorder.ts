/**
 * HealthBridge Audio & Voice Recording Engine
 * Implements safe microphone acquisition, MediaRecorder capture,
 * RFC-compliant time formatting, and deterministic state transitions.
 *
 * SAFETY INVARIANT:
 * Never claim recording or transcription succeeded if permission is denied,
 * the browser is unsupported, or the audio stream fails.
 */

export type RecordingStatus =
  | 'idle'
  | 'requesting_permission'
  | 'recording'
  | 'recorded'
  | 'transcribing'
  | 'error'
  | 'unsupported';

export type MicrophonePermissionState =
  | 'prompt'
  | 'granted'
  | 'denied'
  | 'unsupported';

export interface AudioRecordingState {
  status: RecordingStatus;
  permission: MicrophonePermissionState;
  elapsedSeconds: number;
  error: string | null;
  audioBlob: Blob | null;
  audioUrl: string | null;
  audioMimeType: string;
  audioDuration: number;
  transcript: string;
  isLiveTranscribing: boolean;
  speechRecognitionSupported: boolean;
  speechRecognitionNotice: string | null;
}

/**
 * Formats seconds into MM:SS display
 */
export function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Checks whether audio recording APIs are supported in this environment
 */
export function checkAudioRecordingSupport(
  nav?: any,
  win?: any
): { supported: boolean; reason?: string } {
  const targetNav = nav !== undefined ? nav : (typeof navigator !== 'undefined' ? navigator : null);
  const targetWin = win !== undefined ? win : (typeof window !== 'undefined' ? window : null);

  if (!targetNav || !targetNav.mediaDevices || typeof targetNav.mediaDevices.getUserMedia !== 'function') {
    return {
      supported: false,
      reason: 'Browser does not support navigator.mediaDevices.getUserMedia audio capture.',
    };
  }

  const MR = targetWin?.MediaRecorder || (typeof MediaRecorder !== 'undefined' ? MediaRecorder : null);
  if (!MR) {
    return {
      supported: false,
      reason: 'Browser does not support the MediaRecorder API for audio capture.',
    };
  }

  return { supported: true };
}

/**
 * Checks whether SpeechRecognition or webkitSpeechRecognition is available
 */
export function checkSpeechRecognitionSupport(win?: any): boolean {
  const targetWin = win !== undefined ? win : (typeof window !== 'undefined' ? window : null);
  if (!targetWin) return false;
  return Boolean(targetWin.SpeechRecognition || targetWin.webkitSpeechRecognition);
}

/**
 * Determines the best supported audio MIME type for MediaRecorder
 */
export function getSupportedAudioMimeType(mediaRecorderClass?: any): string {
  const MR = mediaRecorderClass || (typeof MediaRecorder !== 'undefined' ? MediaRecorder : null);
  if (!MR || typeof MR.isTypeSupported !== 'function') {
    return 'audio/webm';
  }

  const preferredTypes = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/aac',
  ];

  for (const type of preferredTypes) {
    if (MR.isTypeSupported(type)) {
      return type;
    }
  }

  return '';
}

/**
 * Standardizes microphone errors into actionable clinical messages
 */
export function mapMicrophoneError(err: any): {
  permission: MicrophonePermissionState;
  error: string;
} {
  const errorName = err?.name || '';
  const message = err?.message || '';

  if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
    return {
      permission: 'denied',
      error: 'Microphone permission was denied. Please allow microphone access in your browser settings/address bar to record voice notes.',
    };
  }

  if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
    return {
      permission: 'prompt',
      error: 'No microphone was detected on your device. Please connect an audio input device.',
    };
  }

  if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
    return {
      permission: 'prompt',
      error: 'Microphone hardware is busy or in use by another application.',
    };
  }

  if (errorName === 'SecurityError') {
    return {
      permission: 'denied',
      error: 'Microphone access is restricted in this context (e.g. non-HTTPS or sandboxed iframe).',
    };
  }

  return {
    permission: 'prompt',
    error: message ? `Microphone error: ${message}` : 'Unable to access microphone stream.',
  };
}

/**
 * Pure state transition functions for strict predictability and unit-testing
 */
export function createInitialAudioState(hasSpeechRec = false): AudioRecordingState {
  return {
    status: 'idle',
    permission: 'prompt',
    elapsedSeconds: 0,
    error: null,
    audioBlob: null,
    audioUrl: null,
    audioMimeType: 'audio/webm',
    audioDuration: 0,
    transcript: '',
    isLiveTranscribing: false,
    speechRecognitionSupported: hasSpeechRec,
    speechRecognitionNotice: hasSpeechRec
      ? null
      : 'Live browser transcription unavailable in this browser; recorded audio is preserved for clinical review.',
  };
}

export function transitionToRequesting(prev: AudioRecordingState): AudioRecordingState {
  return {
    ...prev,
    status: 'requesting_permission',
    error: null,
  };
}

export function transitionToRecording(
  prev: AudioRecordingState,
  mimeType: string,
  isLiveTranscribing: boolean
): AudioRecordingState {
  return {
    ...prev,
    status: 'recording',
    permission: 'granted',
    error: null,
    audioMimeType: mimeType,
    elapsedSeconds: 0,
    isLiveTranscribing,
  };
}

export function transitionToRecorded(
  prev: AudioRecordingState,
  blob: Blob,
  url: string,
  duration: number,
  transcript?: string
): AudioRecordingState {
  return {
    ...prev,
    status: 'recorded',
    audioBlob: blob,
    audioUrl: url,
    audioDuration: duration,
    isLiveTranscribing: false,
    transcript: transcript !== undefined ? transcript : prev.transcript,
    error: null,
  };
}

export function transitionToError(
  prev: AudioRecordingState,
  error: string,
  permission?: MicrophonePermissionState
): AudioRecordingState {
  return {
    ...prev,
    status: permission === 'unsupported' ? 'unsupported' : 'error',
    permission: permission || prev.permission,
    error,
    isLiveTranscribing: false,
    // CRITICAL: Clear any partial audio or transcript so we never claim success on failure
    audioBlob: null,
    audioUrl: null,
  };
}

export function transitionToReset(
  prev: AudioRecordingState,
  revokeFn?: (url: string) => void
): AudioRecordingState {
  if (prev.audioUrl && revokeFn) {
    try {
      revokeFn(prev.audioUrl);
    } catch {
      // ignore
    }
  }

  return {
    ...createInitialAudioState(prev.speechRecognitionSupported),
    permission: prev.permission === 'denied' ? 'denied' : 'prompt',
  };
}

export function transitionToTranscribing(prev: AudioRecordingState): AudioRecordingState {
  return {
    ...prev,
    status: 'transcribing',
    error: null,
  };
}

export function transitionToTranscribed(
  prev: AudioRecordingState,
  transcript: string
): AudioRecordingState {
  return {
    ...prev,
    status: 'recorded',
    transcript,
    error: null,
  };
}

/**
 * Safely stops all tracks of a MediaStream
 */
export function cleanupMediaStream(stream: any): void {
  if (!stream) return;
  try {
    if (typeof stream.getTracks === 'function') {
      const tracks = stream.getTracks();
      for (const track of tracks) {
        if (typeof track.stop === 'function') {
          track.stop();
        }
        if ('enabled' in track) {
          track.enabled = false;
        }
      }
    }
  } catch (err) {
    console.warn('[AudioRecorder] Stream cleanup warning:', err);
  }
}

export const cleanupMediaStreamTracks = cleanupMediaStream;

/**
 * Safely revokes an object URL
 */
export function cleanupAudioUrl(url: string | null, revokeFn?: (url: string) => void): void {
  if (!url) return;
  try {
    const revoker = revokeFn || (typeof URL !== 'undefined' && URL.revokeObjectURL ? URL.revokeObjectURL : null);
    if (revoker) {
      revoker(url);
    }
  } catch (err) {
    console.warn('[AudioRecorder] Object URL revocation warning:', err);
  }
}

export const revokeAudioUrl = cleanupAudioUrl;

export function mapAudioErrorToMessage(err: any): string {
  return mapMicrophoneError(err).error;
}

export function isRecordingApiSupported(nav?: any, win?: any): boolean {
  return checkAudioRecordingSupport(nav, win).supported;
}

export function isSpeechRecognitionSupported(win?: any): boolean {
  return checkSpeechRecognitionSupport(win);
}

export type AudioRecorderAction =
  | { type: 'REQUEST_PERMISSION' }
  | { type: 'START_RECORDING'; mimeType?: string; isLiveTranscribing?: boolean }
  | { type: 'UPDATE_ELAPSED'; seconds: number }
  | { type: 'UPDATE_TRANSCRIPT'; transcript: string }
  | { type: 'STOP_RECORDING'; audioBlob: Blob; audioUrl: string; duration: number; mimeType?: string }
  | { type: 'START_TRANSCRIBING' }
  | { type: 'TRANSCRIBE_SUCCESS'; transcript: string }
  | { type: 'RECORDING_ERROR'; error: string; permission?: MicrophonePermissionState }
  | { type: 'SET_UNSUPPORTED'; message: string }
  | { type: 'RESET' };

export interface ExtendedAudioRecordingState extends AudioRecordingState {
  isRecording: boolean;
  isRecorded: boolean;
}

export const initialAudioRecordingState: ExtendedAudioRecordingState = {
  ...createInitialAudioState(false),
  isRecording: false,
  isRecorded: false,
};

export function audioRecorderReducer(
  state: ExtendedAudioRecordingState,
  action: AudioRecorderAction
): ExtendedAudioRecordingState {
  switch (action.type) {
    case 'REQUEST_PERMISSION': {
      const next = transitionToRequesting(state);
      return {
        ...next,
        isRecording: false,
        isRecorded: false,
      };
    }
    case 'START_RECORDING': {
      const next = transitionToRecording(state, action.mimeType || 'audio/webm', Boolean(action.isLiveTranscribing));
      return {
        ...next,
        isRecording: true,
        isRecorded: false,
      };
    }
    case 'UPDATE_ELAPSED':
      return {
        ...state,
        elapsedSeconds: action.seconds,
      };
    case 'UPDATE_TRANSCRIPT':
      return {
        ...state,
        transcript: action.transcript,
      };
    case 'STOP_RECORDING': {
      const next = transitionToRecorded(
        state,
        action.audioBlob,
        action.audioUrl,
        action.duration,
        state.transcript
      );
      return {
        ...next,
        audioMimeType: action.mimeType || state.audioMimeType,
        isRecording: false,
        isRecorded: true,
      };
    }
    case 'START_TRANSCRIBING': {
      const next = transitionToTranscribing(state);
      return {
        ...next,
        isRecording: false,
        isRecorded: true,
      };
    }
    case 'TRANSCRIBE_SUCCESS': {
      const next = transitionToTranscribed(state, action.transcript);
      return {
        ...next,
        isRecording: false,
        isRecorded: true,
      };
    }
    case 'RECORDING_ERROR': {
      const next = transitionToError(state, action.error, action.permission);
      return {
        ...next,
        isRecording: false,
        isRecorded: false,
      };
    }
    case 'SET_UNSUPPORTED':
      return {
        ...state,
        status: 'unsupported',
        permission: 'unsupported',
        error: action.message,
        isRecording: false,
        isRecorded: false,
      };
    case 'RESET': {
      const next = transitionToReset(state, cleanupAudioUrl);
      return {
        ...next,
        isRecording: false,
        isRecorded: false,
      };
    }
    default:
      return state;
  }
}
