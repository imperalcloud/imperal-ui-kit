'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, CheckCircle2, XCircle, Loader2, RotateCw, FolderUp } from 'lucide-react';
import type { UIComponent } from '../types';
import { formatUploadError } from './formatUploadError';

type Status = 'queued' | 'uploading' | 'done' | 'error';
interface Item {
  id: number;
  file: File;
  name: string;
  size: number;
  status: Status;
  error?: string;
}

const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [400, 1200];

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

const sleep = (ms: number) => new Promise<void>(res => setTimeout(res, ms));

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(2)} GB`;
}

export const DBulkUpload: UIComponent = ({ node }) => {
  const {
    endpoint, concurrency = 6, accept = '*', allow_folders = true,
  } = node.props as {
    endpoint?: string; concurrency?: number; accept?: string; allow_folders?: boolean;
  };

  const [items, setItems] = useState<Item[]>([]);
  const [running, setRunning] = useState(false);
  const idRef = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const dirRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<Item[]>([]);
  itemsRef.current = items;

  const addFiles = useCallback((fl: FileList | null) => {
    if (!fl || !fl.length) return;
    const next: Item[] = [];
    for (const f of Array.from(fl)) {
      next.push({ id: idRef.current++, file: f, name: f.name, size: f.size, status: 'queued' });
    }
    setItems(prev => [...prev, ...next]);
  }, []);

  const patch = useCallback((id: number, p: Partial<Item>) => {
    setItems(prev => prev.map(it => (it.id === id ? { ...it, ...p } : it)));
  }, []);

  const attemptUpload = useCallback(async (
    it: Item,
  ): Promise<{ ok: true } | { ok: false; error: string; retryable: boolean }> => {
    if (it.file.size > 0) {
      try {
        const probe = await it.file.slice(0, Math.min(it.file.size, 65536)).arrayBuffer();
        if (probe.byteLength === 0) throw new Error('unreadable');
      } catch {
        return {
          ok: false,
          retryable: false,
          error: 'Could not read this file. If it is stored online-only in the cloud (OneDrive / iCloud / Dropbox / Google Drive), open it once or enable "Always keep on this device", then retry. Also check it is not locked or on a disconnected drive.',
        };
      }
    }
    try {
      const fd = new FormData();
      fd.append('file', it.file, it.name);
      const r = await fetch(endpoint || '', { method: 'POST', body: fd });
      if (r.ok) return { ok: true };
      let body: unknown = null;
      try { body = await r.json(); } catch { try { body = await r.text(); } catch { /* ignore */ } }
      return { ok: false, error: formatUploadError(body, r.status), retryable: isRetryableStatus(r.status) };
    } catch (e: any) {
      return { ok: false, error: e?.message ? String(e.message) : 'network error', retryable: true };
    }
  }, [endpoint]);

  const uploadOne = useCallback(async (it: Item): Promise<void> => {
    patch(it.id, { status: 'uploading', error: undefined });
    let last = '';
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const res = await attemptUpload(it);
      if (res.ok) { patch(it.id, { status: 'done', error: undefined }); return; }
      last = res.error;
      if (!res.retryable || attempt === MAX_ATTEMPTS) break;
      await sleep(BACKOFF_MS[attempt - 1] ?? 1500);
    }
    patch(it.id, { status: 'error', error: last || 'upload failed' });
  }, [attemptUpload, patch]);

  const run = useCallback(async (pool: Item[]) => {
    if (!pool.length || !endpoint) return;
    setRunning(true);
    const queue = [...pool];
    const workers = Array.from({ length: Math.max(1, Math.min(concurrency, 12)) }, async () => {
      while (queue.length) {
        const it = queue.shift();
        if (!it) break;
        await uploadOne(it);
      }
    });
    await Promise.all(workers);
    setRunning(false);
  }, [concurrency, endpoint, uploadOne]);

  const startAll = useCallback(() => {
    run(itemsRef.current.filter(it => it.status === 'queued' || it.status === 'error'));
  }, [run]);

  const retryFailed = useCallback(() => {
    run(itemsRef.current.filter(it => it.status === 'error'));
  }, [run]);

  const clearDone = useCallback(() => {
    setItems(prev => prev.filter(it => it.status !== 'done'));
  }, []);

  const total = items.length;
  const done = items.filter(i => i.status === 'done').length;
  const failed = items.filter(i => i.status === 'error').length;
  const uploading = items.filter(i => i.status === 'uploading').length;
  const queued = items.filter(i => i.status === 'queued').length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="space-y-3">
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-blue-500'); }}
        onDragLeave={e => e.currentTarget.classList.remove('border-blue-500')}
        onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('border-blue-500'); addFiles(e.dataTransfer.files); }}
        className="border-2 border-dashed border-gray-700 rounded-lg p-5 text-center cursor-pointer hover:border-gray-500 transition-colors"
      >
        <Upload className="w-7 h-7 text-gray-500 mx-auto mb-1.5" />
        <p className="text-sm text-gray-300">Drop files or click to add — hundreds or thousands at once</p>
        <p className="text-xs text-gray-600 mt-0.5">Each file streams directly; no per-batch size limit</p>
      </div>

      <input ref={fileRef} type="file" accept={accept} multiple className="hidden"
             onChange={e => { addFiles(e.target.files); e.currentTarget.value = ''; }} />
      {allow_folders && (
        <input ref={dirRef} type="file" multiple className="hidden"
               // @ts-expect-error — non-standard but widely supported folder picker
               webkitdirectory="" directory=""
               onChange={e => { addFiles(e.target.files); e.currentTarget.value = ''; }} />
      )}

      <div className="flex flex-wrap gap-2">
        <button onClick={startAll} disabled={running || (!queued && !failed)}
                className="px-3 py-1.5 rounded-md text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white inline-flex items-center gap-1.5">
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {running ? 'Uploading…' : `Upload ${queued + failed || ''}`.trim()}
        </button>
        {allow_folders && (
          <button onClick={() => dirRef.current?.click()} disabled={running}
                  className="px-3 py-1.5 rounded-md text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-gray-200 inline-flex items-center gap-1.5">
            <FolderUp className="w-4 h-4" /> Add folder
          </button>
        )}
        {failed > 0 && (
          <button onClick={retryFailed} disabled={running}
                  className="px-3 py-1.5 rounded-md text-sm bg-amber-700 hover:bg-amber-600 disabled:opacity-40 text-amber-50 inline-flex items-center gap-1.5">
            <RotateCw className="w-4 h-4" /> Retry {failed}
          </button>
        )}
        {done > 0 && !running && (
          <button onClick={clearDone}
                  className="px-3 py-1.5 rounded-md text-sm bg-gray-800 hover:bg-gray-700 text-gray-400">
            Clear done
          </button>
        )}
      </div>

      {total > 0 && (
        <div className="space-y-1.5">
          <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{done}/{total} done{uploading ? ` · ${uploading} uploading` : ''}{queued ? ` · ${queued} queued` : ''}</span>
            {failed > 0 ? <span className="text-red-400">{failed} failed</span> : <span>{pct}%</span>}
          </div>
        </div>
      )}

      {total > 0 && total <= 200 && (
        <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
          {items.map(it => (
            <div key={it.id} className="flex items-center gap-2 bg-gray-800/40 rounded px-2 py-1 text-sm">
              {it.status === 'done' && <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />}
              {it.status === 'error' && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
              {it.status === 'uploading' && <Loader2 className="w-4 h-4 text-blue-400 shrink-0 animate-spin" />}
              {it.status === 'queued' && <div className="w-4 h-4 shrink-0 rounded-full border border-gray-600" />}
              <span className="text-gray-300 truncate flex-1">{it.name}</span>
              {it.status === 'error' && it.error
                ? <span className="text-red-400 text-xs shrink-0 truncate max-w-[40%]" title={String(it.error)}>{String(it.error)}</span>
                : <span className="text-gray-500 text-xs shrink-0">{fmtSize(it.size)}</span>}
            </div>
          ))}
        </div>
      )}
      {total > 200 && (
        <p className="text-xs text-gray-500">{total} files queued — list hidden for performance; the bar above tracks progress.</p>
      )}
    </div>
  );
};
