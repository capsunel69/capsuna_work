import type { OrchestrateUserImage } from '../services/piovra';

export const ORCHESTRATE_IMAGE_MAX_COUNT = 6;
export const ORCHESTRATE_IMAGE_MAX_BYTES = 4 * 1024 * 1024;

const ALLOWED: OrchestrateUserImage['mimeType'][] = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
];

export function isOrchestrateImageMime(m: string): m is OrchestrateUserImage['mimeType'] {
  return (ALLOWED as string[]).includes(m);
}

/** Read a file as raw base64 (no data URL prefix). */
export function fileToOrchestrateImage(file: File): Promise<OrchestrateUserImage> {
  if (!isOrchestrateImageMime(file.type)) {
    return Promise.reject(new Error(`Unsupported image type: ${file.type || 'unknown'}`));
  }
  if (file.size > ORCHESTRATE_IMAGE_MAX_BYTES) {
    return Promise.reject(new Error('Image must be 4MB or smaller'));
  }
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = r.result as string;
      const m = /^data:[^;]+;base64,(.+)$/.exec(s);
      resolve({ mimeType: file.type, data: m ? m[1]! : s.replace(/\s/g, '') });
    };
    r.onerror = () => reject(r.error ?? new Error('read failed'));
    r.readAsDataURL(file);
  });
}

export async function filesToOrchestrateImages(files: File[]): Promise<OrchestrateUserImage[]> {
  const out: OrchestrateUserImage[] = [];
  for (const f of files) {
    out.push(await fileToOrchestrateImage(f));
  }
  return out;
}
