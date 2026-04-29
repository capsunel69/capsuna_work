/**
 * Voice client for the piovra orchestrator.
 *
 * Endpoints (proxied through Netlify, same as the rest of the API):
 *   GET  /voice/capabilities    -> { stt: { available, ... }, tts: { ... } }
 *   POST /voice/stt             -> { text }   (raw audio body, content-type = mime)
 *   POST /voice/tts             -> audio/*   (JSON body { text, voice?, ... })
 */

const BASE_URL = import.meta.env.VITE_PIOVRA_PROXY_URL ?? '/api/piovra';

export interface VoiceCapabilities {
  stt: {
    available: boolean;
    provider: 'openai' | null;
    model: string;
  };
  tts: {
    available: boolean;
    provider: 'openai' | null;
    model: string;
    voices: string[];
    defaultVoice: string;
  };
}

export type TtsVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

export interface TtsOptions {
  text: string;
  voice?: TtsVoice;
  model?: 'tts-1' | 'tts-1-hd';
  format?: 'mp3' | 'opus' | 'aac' | 'flac' | 'wav';
  speed?: number;
  signal?: AbortSignal;
}

export const VoiceAPI = {
  async getCapabilities(signal?: AbortSignal): Promise<VoiceCapabilities> {
    const res = await fetch(`${BASE_URL}/voice/capabilities`, { signal });
    if (!res.ok) throw new Error(`Voice capabilities -> ${res.status}`);
    return (await res.json()) as VoiceCapabilities;
  },

  async transcribe(audio: Blob, opts?: { language?: string; signal?: AbortSignal }): Promise<string> {
    const qs = opts?.language ? `?language=${encodeURIComponent(opts.language)}` : '';
    const res = await fetch(`${BASE_URL}/voice/stt${qs}`, {
      method: 'POST',
      headers: { 'Content-Type': audio.type || 'audio/webm' },
      body: audio,
      signal: opts?.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(text || `Voice STT -> ${res.status}`);
    }
    const data = (await res.json()) as { text?: string };
    return (data.text ?? '').trim();
  },

  async synthesize(opts: TtsOptions): Promise<Blob> {
    const { signal, ...body } = opts;
    const res = await fetch(`${BASE_URL}/voice/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(text || `Voice TTS -> ${res.status}`);
    }
    return res.blob();
  },
};
