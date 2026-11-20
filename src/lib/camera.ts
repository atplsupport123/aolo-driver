// Lets any screen open the in-app camera and await the photos.
import { navRef } from '../navigation/navRef';
import type { UploadFile } from '../api/endpoints';

let pending: ((files: UploadFile[] | null) => void) | null = null;

export function captureWithCamera(opts: { count?: number; title?: string } = {}): Promise<UploadFile[] | null> {
  if (!navRef.isReady()) return Promise.resolve(null);
  pending?.(null);
  return new Promise((resolve) => {
    pending = resolve;
    navRef.navigate('Camera', { count: opts.count ?? 1, title: opts.title });
  });
}

export function finishCapture(files: UploadFile[] | null) {
  pending?.(files);
  pending = null;
}
