/** Browser facts that decide whether an image can be written to the OS clipboard. */
export interface ClipboardEnv {
  readonly secureContext: boolean;
  readonly clipboardWrite: boolean;
  readonly clipboardItem: boolean;
}

export type ImageCopySupport =
  | { readonly supported: true }
  | { readonly supported: false; readonly reason: 'insecure' | 'unsupported'; readonly message: string };

export const COPY_IMAGE_SUCCESS = 'Image copied — paste it into your document';

const INSECURE_MESSAGE = 'Copying images needs a secure page (HTTPS). Use Download instead.';
const UNSUPPORTED_MESSAGE = 'This browser cannot copy images to the clipboard. Use Download instead.';
const BLOCKED_MESSAGE = 'Clipboard access was blocked. Allow clipboard access, keep this tab focused and try again.';
const NO_PNG_MESSAGE = 'This browser cannot copy PNG images. Use Download instead.';

export const imageCopySupport = (env: ClipboardEnv): ImageCopySupport => {
  if (!env.secureContext) return { supported: false, reason: 'insecure', message: INSECURE_MESSAGE };
  if (!env.clipboardWrite || !env.clipboardItem) return { supported: false, reason: 'unsupported', message: UNSUPPORTED_MESSAGE };
  return { supported: true };
};

const MESSAGES_BY_NAME: ReadonlyMap<string, string> = new Map([
  ['NotAllowedError', BLOCKED_MESSAGE],
  ['SecurityError', INSECURE_MESSAGE],
  ['NotSupportedError', NO_PNG_MESSAGE],
  ['DataError', NO_PNG_MESSAGE],
]);

/** Readable status for a rejected clipboard write or a failed PNG export. */
export const copyImageErrorMessage = (error: unknown): string => {
  const { name = '', message = '' } = typeof error === 'object' && error !== null ? (error as Partial<Error>) : {};
  return MESSAGES_BY_NAME.get(name) ?? (message ? `Copy failed: ${message}` : 'Copy failed.');
};
