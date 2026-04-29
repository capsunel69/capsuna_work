import { useCallback, useEffect, useRef, useState } from 'react';

export type RecorderState = 'idle' | 'requesting' | 'recording' | 'processing' | 'error';

interface UseVoiceRecorderOptions {
  /** Hard cap to avoid forgotten mics holding the stream open. Default 2 min. */
  maxDurationMs?: number;
}

interface UseVoiceRecorderResult {
  state: RecorderState;
  error: string | null;
  /** Elapsed milliseconds for the *current* recording (live ticking when recording). */
  elapsedMs: number;
  /** True if the user has previously granted mic permission this session. */
  hasPermission: boolean;
  /** True if MediaRecorder + getUserMedia are available in this browser. */
  isSupported: boolean;
  start: () => Promise<void>;
  /** Stop the recording and resolve with the captured audio blob (or `null` on cancel). */
  stop: () => Promise<Blob | null>;
  cancel: () => void;
}

const DEFAULT_MAX_MS = 2 * 60 * 1000;

/** Pick the best mime the current browser will let us record. */
function pickMimeType(): string | undefined {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') return undefined;
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
    'audio/mpeg',
  ];
  for (const t of candidates) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return undefined;
}

/**
 * Browser microphone recorder. Uses MediaRecorder under the hood and resolves
 * `stop()` with the final Blob so callers can fire-and-forget into Whisper.
 */
export function useVoiceRecorder(opts: UseVoiceRecorderOptions = {}): UseVoiceRecorderResult {
  const { maxDurationMs = DEFAULT_MAX_MS } = opts;

  const [state, setState] = useState<RecorderState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [hasPermission, setHasPermission] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const tickRef = useRef<number | null>(null);
  const maxTimerRef = useRef<number | null>(null);
  const stopResolverRef = useRef<((blob: Blob | null) => void) | null>(null);
  const cancelledRef = useRef(false);

  const isSupported =
    typeof window !== 'undefined' &&
    typeof MediaRecorder !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia;

  const cleanupStream = useCallback((): void => {
    if (streamRef.current) {
      for (const t of streamRef.current.getTracks()) t.stop();
      streamRef.current = null;
    }
  }, []);

  const clearTimers = useCallback((): void => {
    if (tickRef.current !== null) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (maxTimerRef.current !== null) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimers();
      cleanupStream();
    };
  }, [clearTimers, cleanupStream]);

  const start = useCallback(async (): Promise<void> => {
    if (!isSupported) {
      setError('Microphone recording is not supported in this browser.');
      setState('error');
      return;
    }
    if (state === 'recording' || state === 'requesting') return;

    setError(null);
    setState('requesting');
    cancelledRef.current = false;
    chunksRef.current = [];
    setElapsedMs(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setHasPermission(true);

      const mimeType = pickMimeType();
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = rec;

      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onerror = (e) => {
        const msg =
          (e as unknown as { error?: { message?: string } }).error?.message ?? 'Recorder error';
        setError(msg);
        setState('error');
      };
      rec.onstop = () => {
        clearTimers();
        cleanupStream();
        const resolver = stopResolverRef.current;
        stopResolverRef.current = null;
        if (cancelledRef.current) {
          chunksRef.current = [];
          setState('idle');
          resolver?.(null);
          return;
        }
        const blob = new Blob(chunksRef.current, {
          type: rec.mimeType || mimeType || 'audio/webm',
        });
        chunksRef.current = [];
        setState('processing');
        resolver?.(blob);
      };

      startedAtRef.current = Date.now();
      rec.start(250);
      setState('recording');

      tickRef.current = window.setInterval(() => {
        setElapsedMs(Date.now() - startedAtRef.current);
      }, 100);

      maxTimerRef.current = window.setTimeout(() => {
        if (recorderRef.current?.state === 'recording') {
          recorderRef.current.stop();
        }
      }, maxDurationMs);
    } catch (err) {
      cleanupStream();
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setState('error');
    }
  }, [cleanupStream, clearTimers, isSupported, maxDurationMs, state]);

  const stop = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const rec = recorderRef.current;
      if (!rec || rec.state === 'inactive') {
        resolve(null);
        return;
      }
      stopResolverRef.current = resolve;
      cancelledRef.current = false;
      rec.stop();
    });
  }, []);

  const cancel = useCallback((): void => {
    const rec = recorderRef.current;
    cancelledRef.current = true;
    if (rec && rec.state !== 'inactive') {
      rec.stop();
    } else {
      clearTimers();
      cleanupStream();
      setState('idle');
    }
  }, [cleanupStream, clearTimers]);

  return { state, error, elapsedMs, hasPermission, isSupported, start, stop, cancel };
}
