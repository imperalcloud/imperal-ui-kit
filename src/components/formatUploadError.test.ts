import { describe, expect, it } from 'vitest';
import { formatUploadError } from './formatUploadError';

describe('formatUploadError', () => {
  it('flattens Pydantic validation arrays into render-safe text', () => {
    const result = formatUploadError({ detail: [
      { type: 'missing', loc: ['body', 'file'], msg: 'Field required' },
      { type: 'value_error', loc: ['body', 'name'], msg: 'Invalid name' },
    ] }, 422);
    expect(result).toBe('Field required (body.file); Invalid name (body.name)');
  });

  it.each([
    [{ error: 'Upload failed' }, 502, 'Upload failed'],
    [{ detail: 'Bad file' }, 422, 'Bad file'],
    ['Bad Gateway', 502, 'Bad Gateway'],
    [null, 500, 'HTTP 500'],
    [{}, 500, 'HTTP 500'],
  ] as const)('normalizes %o', (body, status, expected) => {
    expect(formatUploadError(body, status)).toBe(expected);
  });
});
