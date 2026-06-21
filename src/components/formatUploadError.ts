/**
 * Coerce ANY upload error response into a single human-readable string.
 *
 * FastAPI / Pydantic 422 bodies arrive as `{ detail: [{ type, loc, msg, input }] }`
 * — an ARRAY OF OBJECTS. Assigning that array to a field that is later rendered
 * as a React child throws React error #31 ("Objects are not valid as a React
 * child") and, with no error boundary in place, crashed the WHOLE panel midway
 * through a 56-file bulk evidence upload (2026-06-13). This helper guarantees a
 * string for every shape the stack can produce:
 *   - `{ error: "..." }`            (our proxy / normalised Cases API errors)
 *   - `{ detail: "..." }`           (manually-raised HTTPException with str detail)
 *   - `{ detail: [{ msg, loc }] }`  (Pydantic RequestValidationError — the crasher)
 *   - a bare string                 (non-JSON upstream body)
 *   - null / unknown                (falls back to `HTTP <status>`)
 */
export function formatUploadError(body: unknown, status: number): string {
  const fallback = `HTTP ${status}`;
  if (body == null) return fallback;
  if (typeof body === 'string') return body.trim() || fallback;
  if (typeof body !== 'object') return fallback;

  const o = body as Record<string, unknown>;

  // Preferred: a flat string `error` (proxy + Cases API both emit this now).
  if (typeof o.error === 'string' && o.error.trim()) return o.error.trim();

  const detail = o.detail;
  if (typeof detail === 'string' && detail.trim()) return detail.trim();

  if (Array.isArray(detail)) {
    const msgs = detail
      .map(item => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          const it = item as Record<string, unknown>;
          if (typeof it.msg === 'string') {
            const loc = Array.isArray(it.loc)
              ? it.loc.filter(x => typeof x === 'string').join('.')
              : '';
            return loc ? `${it.msg} (${loc})` : it.msg;
          }
        }
        return null;
      })
      .filter((x): x is string => !!x);
    if (msgs.length) return msgs.join('; ');
  }

  return fallback;
}
