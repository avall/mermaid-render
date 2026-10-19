import { describe, expect, it } from 'vitest';
import { COPY_IMAGE_SUCCESS, copyImageErrorMessage, imageCopySupport } from '../src/domain/clipboard';

const named = (name: string, message = 'boom'): Error => Object.assign(new Error(message), { name });

describe('image clipboard support detection', () => {
  it.each([
    [{ secureContext: true, clipboardWrite: true, clipboardItem: true }, { supported: true }],
    [{ secureContext: false, clipboardWrite: true, clipboardItem: true }, { supported: false, reason: 'insecure' }],
    [{ secureContext: false, clipboardWrite: false, clipboardItem: false }, { supported: false, reason: 'insecure' }],
    [{ secureContext: true, clipboardWrite: false, clipboardItem: true }, { supported: false, reason: 'unsupported' }],
    [{ secureContext: true, clipboardWrite: true, clipboardItem: false }, { supported: false, reason: 'unsupported' }],
  ] as const)('maps %j to %j', (env, expected) => {
    expect(imageCopySupport(env)).toMatchObject(expected);
  });

  it('explains why copying is unavailable', () => {
    const insecure = imageCopySupport({ secureContext: false, clipboardWrite: true, clipboardItem: true });
    const missing = imageCopySupport({ secureContext: true, clipboardWrite: false, clipboardItem: false });
    expect(insecure.supported ? '' : insecure.message).toMatch(/HTTPS/);
    expect(missing.supported ? '' : missing.message).toMatch(/Download/);
  });
});

describe('image copy error messages', () => {
  it.each([
    [named('NotAllowedError'), /blocked/i],
    [named('SecurityError'), /HTTPS/],
    [named('NotSupportedError'), /cannot copy PNG/],
    [named('DataError'), /cannot copy PNG/],
    [named('Error', 'The diagram could not be rasterized'), /The diagram could not be rasterized/],
    ['nope', /^Copy failed\.$/],
    [undefined, /^Copy failed\.$/],
  ] as const)('maps %s to a readable status', (error, expected) => {
    expect(copyImageErrorMessage(error)).toMatch(expected);
  });

  it('confirms success with a paste hint', () => {
    expect(COPY_IMAGE_SUCCESS).toMatch(/paste/);
  });
});
