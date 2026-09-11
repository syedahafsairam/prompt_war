import {
  audioRecorderReducer,
  initialAudioRecordingState,
  mapAudioErrorToMessage,
  cleanupMediaStreamTracks,
  revokeAudioUrl,
  formatDuration,
  isRecordingApiSupported,
  isSpeechRecognitionSupported,
} from '../utils/audioRecorder';

export async function runAudioRecorderTests(
  executeTest: (suite: string, name: string, fn: () => void | Promise<void>) => Promise<void>
) {
  const SUITE = 'Voice Input & Audio State Machine';

  // 1. Permission Denial
  await executeTest(SUITE, 'Permission Denial: Handles NotAllowedError and sets error state without claiming success', () => {
    let state = audioRecorderReducer(initialAudioRecordingState, { type: 'REQUEST_PERMISSION' });
    if (state.status !== 'requesting_permission') {
      throw new Error(`Expected requesting_permission, got ${state.status}`);
    }

    const deniedError = new Error('Permission denied by user');
    deniedError.name = 'NotAllowedError';

    const mappedMessage = mapAudioErrorToMessage(deniedError);
    if (!mappedMessage.includes('Microphone permission was denied')) {
      throw new Error(`Unexpected mapped error message: ${mappedMessage}`);
    }

    state = audioRecorderReducer(state, {
      type: 'RECORDING_ERROR',
      error: mappedMessage,
      permission: 'denied',
    });

    if (state.status !== 'error') {
      throw new Error(`Expected error status, got ${state.status}`);
    }
    if (state.permission !== 'denied') {
      throw new Error(`Expected permission to be denied, got ${state.permission}`);
    }
    if (state.audioBlob !== null || state.audioUrl !== null) {
      throw new Error('Violated requirement: Audio blob/url must be null on permission denial');
    }
    // Never claim recording succeeded
    if ((state.status as any) === 'recorded') {
      throw new Error('Violated requirement: Never claim recording succeeded on permission denial');
    }
  });

  // 2. Unsupported MediaRecorder and Browser Audio APIs
  await executeTest(SUITE, 'Unsupported MediaRecorder: Sets unsupported status and clear explanatory message', () => {
    // Test detection logic when APIs are missing
    const originalNavigator = globalThis.navigator;
    const originalMediaRecorder = (globalThis as any).MediaRecorder;

    try {
      // Temporarily mock unsupported environment
      delete (globalThis as any).MediaRecorder;

      const supported = isRecordingApiSupported();
      if (supported) {
        throw new Error('isRecordingApiSupported should return false when MediaRecorder is undefined');
      }

      let state = audioRecorderReducer(initialAudioRecordingState, {
        type: 'SET_UNSUPPORTED',
        message: 'Audio recording is not supported in this browser environment.',
      });

      if (state.status !== 'unsupported') {
        throw new Error(`Expected unsupported status, got ${state.status}`);
      }
      if (!state.error?.includes('not supported')) {
        throw new Error(`Expected error explaining lack of support, got ${state.error}`);
      }
      if (state.isRecording) {
        throw new Error('isRecording must be false in unsupported state');
      }
    } finally {
      if (originalMediaRecorder) {
        (globalThis as any).MediaRecorder = originalMediaRecorder;
      }
    }
  });

  // 3. Start / Stop State Transitions
  await executeTest(SUITE, 'State Transitions: Smoothly cycles idle -> requesting -> recording -> recorded -> reset', () => {
    // Initial State
    let state = initialAudioRecordingState;
    if (state.status !== 'idle' || state.isRecording || state.isRecorded) {
      throw new Error('Initial state must be idle with isRecording=false and isRecorded=false');
    }

    // Step 1: User clicks "Record Voice" -> requesting permission
    state = audioRecorderReducer(state, { type: 'REQUEST_PERMISSION' });
    if (state.status !== 'requesting_permission') {
      throw new Error(`Expected requesting_permission, got ${state.status}`);
    }

    // Step 2: Permission granted -> start recording
    state = audioRecorderReducer(state, { type: 'START_RECORDING' });
    if (state.status !== 'recording' || !state.isRecording) {
      throw new Error('Expected recording status with isRecording=true');
    }
    if (state.permission !== 'granted') {
      throw new Error('Expected permission to be granted');
    }

    // Step 3: Timer ticks during recording
    state = audioRecorderReducer(state, { type: 'UPDATE_ELAPSED', seconds: 5 });
    if (state.elapsedSeconds !== 5) {
      throw new Error(`Expected elapsedSeconds=5, got ${state.elapsedSeconds}`);
    }

    // Step 4: Live transcription update
    state = audioRecorderReducer(state, {
      type: 'UPDATE_TRANSCRIPT',
      transcript: 'Severe chest tightness and dyspnea',
    });
    if (state.transcript !== 'Severe chest tightness and dyspnea') {
      throw new Error(`Expected transcript update, got ${state.transcript}`);
    }

    // Step 5: Stop recording -> recorded state with audio metadata
    const mockBlob = new Blob(['mock-audio-bytes'], { type: 'audio/webm' });
    const mockUrl = 'blob:http://localhost:3000/mock-uuid-1234';

    state = audioRecorderReducer(state, {
      type: 'STOP_RECORDING',
      audioBlob: mockBlob,
      audioUrl: mockUrl,
      duration: 5,
      mimeType: 'audio/webm',
    });

    if (state.status !== 'recorded' || !state.isRecorded) {
      throw new Error('Expected status to be recorded and isRecorded=true');
    }
    if (state.isRecording) {
      throw new Error('isRecording must be false after stop');
    }
    if (state.audioUrl !== mockUrl || state.audioBlob !== mockBlob) {
      throw new Error('Audio blob and preview URL must be preserved');
    }
    if (state.audioDuration !== 5) {
      throw new Error(`Expected audioDuration=5, got ${state.audioDuration}`);
    }

    // Step 6: Reset / Discard -> return to idle
    state = audioRecorderReducer(state, { type: 'RESET' });
    if (state.status !== 'idle' || state.isRecording || state.isRecorded) {
      throw new Error('Expected status to be idle after reset');
    }
    if (state.audioBlob !== null || state.audioUrl !== null) {
      throw new Error('Audio blob and URL must be cleared on reset');
    }
    if (state.transcript !== '') {
      throw new Error('Transcript must be reset');
    }
    if (state.elapsedSeconds !== 0) {
      throw new Error('Elapsed seconds must be reset to 0');
    }
  });

  // 4. Stream and Object URL Cleanup
  await executeTest(SUITE, 'Cleanup: Stops all MediaStream tracks and safely revokes Object URLs', () => {
    let stoppedCount = 0;
    let enabledDisabledCount = 0;

    const mockTrack1 = {
      enabled: true,
      stop: () => {
        stoppedCount++;
      },
    };
    const mockTrack2 = {
      enabled: true,
      stop: () => {
        stoppedCount++;
      },
    };

    const mockStream = {
      getTracks: () => [mockTrack1, mockTrack2],
    } as unknown as MediaStream;

    cleanupMediaStreamTracks(mockStream);

    if (stoppedCount !== 2) {
      throw new Error(`Expected 2 tracks stopped, got ${stoppedCount}`);
    }
    if (mockTrack1.enabled !== false || mockTrack2.enabled !== false) {
      throw new Error('Expected all tracks to have enabled set to false');
    }

    // Safely handles null stream
    cleanupMediaStreamTracks(null);

    // Test URL Revocation
    let revokedUrl = '';
    const originalRevoke = (globalThis as any).URL?.revokeObjectURL;
    (globalThis as any).URL = {
      ...(globalThis as any).URL,
      revokeObjectURL: (url: string) => {
        revokedUrl = url;
      },
    };

    try {
      revokeAudioUrl('blob:http://localhost:3000/test-1234');
      if (revokedUrl !== 'blob:http://localhost:3000/test-1234') {
        throw new Error(`Expected revoked URL 'blob:http://localhost:3000/test-1234', got '${revokedUrl}'`);
      }

      // Safely handles null
      revokeAudioUrl(null);
    } finally {
      if (originalRevoke) {
        (globalThis as any).URL.revokeObjectURL = originalRevoke;
      }
    }
  });

  // 5. Formatter & Speech Recognition Detection Tests
  await executeTest(SUITE, 'Utilities: formatDuration and speech recognition availability checks', () => {
    if (formatDuration(0) !== '00:00') {
      throw new Error(`Expected 00:00, got ${formatDuration(0)}`);
    }
    if (formatDuration(9) !== '00:09') {
      throw new Error(`Expected 00:09, got ${formatDuration(9)}`);
    }
    if (formatDuration(65) !== '01:05') {
      throw new Error(`Expected 01:05, got ${formatDuration(65)}`);
    }
    if (formatDuration(3605) !== '60:05') {
      throw new Error(`Expected 60:05, got ${formatDuration(3605)}`);
    }

    // Verify speech recognition detection returns boolean
    const speechSupported = isSpeechRecognitionSupported();
    if (typeof speechSupported !== 'boolean') {
      throw new Error('isSpeechRecognitionSupported must return a boolean');
    }
  });
}
