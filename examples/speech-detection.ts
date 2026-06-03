/**
 * Pure speech-frame detection functions for the voice interface.
 *
 * The browser AudioContext polls the microphone at 100ms intervals and passes
 * each frame's RMS amplitude through `processSpeechFrame`. The function is
 * intentionally pure so it can be unit-tested without a browser environment.
 *
 * State machine:
 *   - consecutive frames above SPEECH_THRESHOLD → hasSpoken = true
 *   - hasSpoken + RMS drops below threshold → startSilenceTimer signal
 *   - RMS rises again before timer fires → cancelSilenceTimer signal
 *
 * This hysteresis prevents background noise from triggering false positives
 * while still catching the end of soft utterances.
 */

export const SPEECH_THRESHOLD = 20; // RMS units (0–128 scale)
export const SILENCE_THRESHOLD = 12;
export const SPEECH_FRAMES_REQUIRED = 2; // ~200ms at 100ms polling interval

export type SpeechState = {
  speechFrames: number;
  hasSpoken: boolean;
};

export type FrameResult = SpeechState & {
  startSilenceTimer: boolean;
  cancelSilenceTimer: boolean;
};

/** RMS amplitude of a Web Audio frequency-domain byte buffer. */
export function computeRms(data: Uint8Array): number {
  if (data.length === 0) return 0;
  return Math.sqrt(data.reduce((sum, v) => sum + (v - 128) ** 2, 0) / data.length);
}

/**
 * Advance the speech state machine by one audio frame.
 *
 * Returns the new state plus two one-shot signals for the caller to act on:
 *   - `startSilenceTimer` — user just stopped speaking, start countdown
 *   - `cancelSilenceTimer` — user resumed speaking, cancel the countdown
 */
export function processSpeechFrame(
  rms: number,
  state: SpeechState,
  config: {
    speechThreshold?: number;
    framesRequired?: number;
  } = {},
): FrameResult {
  const speechThreshold = config.speechThreshold ?? SPEECH_THRESHOLD;
  const framesRequired = config.framesRequired ?? SPEECH_FRAMES_REQUIRED;

  if (rms >= speechThreshold) {
    const speechFrames = state.speechFrames + 1;
    const hasSpoken = state.hasSpoken || speechFrames >= framesRequired;

    return {
      speechFrames,
      hasSpoken,
      startSilenceTimer: false,
      cancelSilenceTimer: state.hasSpoken, // was speaking, now still speaking → cancel any pending timer
    };
  }

  return {
    speechFrames: Math.max(0, state.speechFrames - 1),
    hasSpoken: state.hasSpoken,
    startSilenceTimer: state.hasSpoken && rms < speechThreshold,
    cancelSilenceTimer: false,
  };
}

/** Supported MIME type for MediaRecorder, in preference order. */
export function getSupportedMimeType(): string {
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];

  for (const type of types) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return "";
}
