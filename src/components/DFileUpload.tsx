'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Upload, X, FileText, Image as ImageIcon, Film, Music, Archive, File,
  CheckCircle2, XCircle, Loader2,
} from 'lucide-react';
import type { UIComponent, UIAction } from '../types';

/**
 * DFileUpload — the one upload widget every Imperal app inherits (File Mage
 * Phase 2, 2026-07-18). The base64-batch uploader: files are read client-side,
 * validated, and handed to the kernel in ONE `on_upload` chat-tool call
 * (payload-ceiling capped — see DBulkUpload for the streaming, thousands-of-
 * files sibling). This is the surface behind `ui.FileUpload`.
 *
 * One source of truth for rows: every file is a row keyed by a stable
 * `client_id`. Optimistic local statuses (reading → ready → uploading) drive
 * the UI immediately; if the extension echoes server statuses back through a
 * panel refresh via the optional `statuses` prop (keyed by that same
 * `client_id`), the row reconciles in place — never a second list, never a
 * duplicate row (the terminal-queue dedup lesson, applied here).
 *
 * Presentational props (from ui.FileUpload): title, hint, variant
 * ("default" | "futuristic" | "compact"), show_previews (image thumbnails).
 * Accessible (keyboard-openable dropzone, ARIA, focus ring) and
 * reduced-motion aware.
 */

type Status = 'reading' | 'ready' | 'uploading' | 'queued' | 'indexing' | 'done' | 'error';

interface FileRow {
  client_id: string;
  name: string;
  size: number;
  mime_type: string;
  data_base64: string;
  status: Status;
  error?: string;
  preview?: string; // object URL for image thumbnails (show_previews)
}

// The base64 batch the kernel receives. client_id rides along so server-side
// status events can reconcile back to the exact row (forward-compat with the
// file-reader files_received events; harmless extra field for any consumer).
interface FileEntry {
  client_id: string;
  name: string;
  size: number;
  mime_type: string;
  data_base64: string;
}

interface ServerStatus {
  status?: Status;
  error?: string;
}

const ICON_MAP: Record<string, typeof File> = {
  'image/': ImageIcon, 'video/': Film, 'audio/': Music,
  'application/pdf': FileText, 'application/zip': Archive,
  'application/x-rar': Archive,
};

function getIcon(mime: string) {
  for (const [prefix, Icon] of Object.entries(ICON_MAP)) {
    if (mime.startsWith(prefix)) return Icon;
  }
  return File;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

// L1 coded errors (core/file_engine.normalize_engine_error) → friendly text,
// so a server-side rejection surfaces the same way a local one does. Any
// unknown code falls through to the raw string.
const CODED_ERROR_TEXT: Record<string, string> = {
  FILE_TOO_LARGE: 'File is too large.',
  FILE_TYPE_UNSUPPORTED: 'This file type is not supported.',
  FILE_ENGINE_UNAVAILABLE: 'The file service is temporarily unavailable — try again.',
  FILE_NOT_FOUND: 'File could not be found.',
};

function friendlyError(raw?: string): string {
  if (!raw) return 'Upload failed';
  return CODED_ERROR_TEXT[raw] || raw;
}

let _seq = 0;
function nextClientId(): string {
  _seq += 1;
  // No crypto/random needed — a monotonic per-widget id is stable across
  // re-renders and unique within the batch, which is all reconciliation needs.
  return `f${Date.now().toString(36)}-${_seq}`;
}

const READABLE_STATUS: Record<Status, string> = {
  reading: 'reading', ready: 'ready', uploading: 'uploading',
  queued: 'queued', indexing: 'indexing', done: 'ready', error: 'failed',
};

export const DFileUpload: UIComponent = ({ node, onAction }) => {
  const {
    accept = '*', max_size_mb = 10, multiple = false, on_upload,
    param_name = 'files', blocked_extensions = [], max_total_mb = 0, max_files = 0,
    title = '', hint = '', variant = 'default', show_previews = false,
    statuses,
  } = node.props as {
    accept?: string; max_size_mb?: number; multiple?: boolean; on_upload?: UIAction;
    param_name?: string; blocked_extensions?: string[]; max_total_mb?: number; max_files?: number;
    title?: string; hint?: string; variant?: string; show_previews?: boolean;
    statuses?: Record<string, ServerStatus>;
  };

  const [rows, setRows] = useState<FileRow[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [notice, setNotice] = useState(''); // batch-level message (e.g. "max 5 files")
  const ref = useRef<HTMLInputElement>(null);
  const compact = variant === 'compact';
  const futuristic = variant === 'futuristic';

  // Reconcile server-provided statuses by client_id, in place. The local row
  // is the single source; a server status only *updates* it — it can never add
  // a row the user did not create, so there is exactly one list.
  const view: FileRow[] = useMemo(() => {
    if (!statuses) return rows;
    return rows.map(r => {
      const s = statuses[r.client_id];
      if (!s || !s.status) return r;
      return { ...r, status: s.status, error: s.error ?? r.error };
    });
  }, [rows, statuses]);

  const removeRow = useCallback((client_id: string) => {
    setRows(prev => {
      const gone = prev.find(r => r.client_id === client_id);
      if (gone?.preview) URL.revokeObjectURL(gone.preview);
      return prev.filter(r => r.client_id !== client_id);
    });
    setNotice('');
  }, []);

  const clearAll = useCallback(() => {
    setRows(prev => { prev.forEach(r => r.preview && URL.revokeObjectURL(r.preview)); return []; });
    setNotice('');
  }, []);

  const processFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList || !fileList.length) return;
    setNotice('');

    const existing = rows;
    const accepted: FileRow[] = [];
    const fileByRow = new Map<string, File>();
    let totalBytes = existing.reduce((s, r) => s + r.size, 0);
    let count = existing.length;

    for (const file of Array.from(fileList)) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (blocked_extensions.length && blocked_extensions.includes(ext)) {
        accepted.push({
          client_id: nextClientId(), name: file.name, size: file.size,
          mime_type: file.type, data_base64: '', status: 'error',
          error: `Blocked file type: .${ext}`,
        });
        continue;
      }
      if (file.size > max_size_mb * 1048576) {
        accepted.push({
          client_id: nextClientId(), name: file.name, size: file.size,
          mime_type: file.type, data_base64: '', status: 'error',
          error: `Exceeds ${max_size_mb} MB per-file limit`,
        });
        continue;
      }
      if (max_files && count >= max_files) { setNotice(`Maximum ${max_files} files`); break; }
      if (max_total_mb && totalBytes + file.size > max_total_mb * 1048576) {
        setNotice(`Total size exceeds ${max_total_mb} MB`); break;
      }
      count += 1;
      totalBytes += file.size;
      const preview = show_previews && file.type.startsWith('image/')
        ? URL.createObjectURL(file) : undefined;
      const row: FileRow = {
        client_id: nextClientId(), name: file.name, size: file.size,
        mime_type: file.type, data_base64: '', status: 'reading', preview,
      };
      accepted.push(row);
      fileByRow.set(row.client_id, file);
    }

    // Show rows immediately (reading state), then fill base64 and flip to ready.
    setRows(prev => [...prev, ...accepted]);

    const encoded: FileEntry[] = [];
    await Promise.all(accepted.filter(r => r.status === 'reading').map(async (row) => {
      const file = fileByRow.get(row.client_id);
      if (!file) { setRows(prev => prev.map(r => r.client_id === row.client_id ? { ...r, status: 'error', error: 'Could not read file' } : r)); return; }
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(',')[1] || '');
          reader.onerror = () => reject(new Error('read failed'));
          reader.readAsDataURL(file);
        });
        if (!base64) throw new Error('empty');
        encoded.push({ client_id: row.client_id, name: row.name, size: row.size, mime_type: row.mime_type, data_base64: base64 });
        setRows(prev => prev.map(r => r.client_id === row.client_id ? { ...r, data_base64: base64, status: 'uploading' } : r));
      } catch {
        setRows(prev => prev.map(r => r.client_id === row.client_id ? { ...r, status: 'error', error: 'Could not read this file. If it is stored online-only in the cloud, open it once, then retry.' } : r));
      }
    }));

    // Dispatch the successfully-read files in ONE on_upload call. Without a
    // server statuses feed the rows stay "uploading" (a spinner) until the
    // panel refreshes; the extension reconciles them via `statuses`.
    if (on_upload && onAction && encoded.length) {
      onAction({ ...on_upload, params: { ...(on_upload.params || {}), [param_name]: encoded } });
    }
  }, [rows, blocked_extensions, max_size_mb, max_files, max_total_mb, show_previews, on_upload, onAction, param_name]);

  const openPicker = () => ref.current?.click();
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPicker(); }
  };

  const totalReadable = view.reduce((s, r) => s + r.size, 0);
  const errored = view.filter(r => r.status === 'error').length;

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        aria-label={title || 'Upload files'}
        onClick={openPicker}
        onKeyDown={onKeyDown}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); processFiles(e.dataTransfer.files); }}
        className={[
          'group relative rounded-xl border-2 border-dashed cursor-pointer text-center',
          'outline-none transition-all duration-200 motion-reduce:transition-none',
          'focus-visible:ring-2 focus-visible:ring-blue-500/70 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent',
          compact ? 'p-3' : 'p-6',
          dragOver
            ? 'border-blue-500 bg-blue-500/10 scale-[1.01] motion-reduce:scale-100'
            : 'border-gray-700 hover:border-gray-500 hover:bg-white/[0.02]',
          futuristic && dragOver ? 'shadow-[0_0_0_4px_rgba(59,130,246,0.15)]' : '',
        ].join(' ')}
      >
        <div className={[
          'mx-auto mb-2 flex items-center justify-center rounded-full',
          compact ? 'w-8 h-8' : 'w-12 h-12',
          dragOver ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800 text-gray-400',
          futuristic ? 'transition-transform group-hover:scale-105 motion-reduce:transition-none' : '',
        ].join(' ')}>
          <Upload className={compact ? 'w-4 h-4' : 'w-6 h-6'} />
        </div>
        <p className={['text-gray-200', compact ? 'text-xs' : 'text-sm font-medium'].join(' ')}>
          {title || (dragOver ? 'Drop to upload' : 'Drop files or click to browse')}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {hint || `Up to ${max_size_mb} MB per file${max_total_mb ? `, ${max_total_mb} MB total` : ''}${max_files ? `, ${max_files} files max` : ''}`}
        </p>
      </div>

      <input
        ref={ref} type="file" accept={accept} multiple={multiple}
        onChange={e => { processFiles(e.target.files); e.currentTarget.value = ''; }}
        className="hidden"
      />

      {notice && <p className="text-xs text-amber-400" role="alert">{notice}</p>}

      {view.length > 0 && (
        <ul className="space-y-1" aria-label="Selected files">
          {view.map((r) => {
            const Icon = getIcon(r.mime_type);
            const busy = r.status === 'reading' || r.status === 'uploading' || r.status === 'indexing' || r.status === 'queued';
            const ok = r.status === 'ready' || r.status === 'done';
            const bad = r.status === 'error';
            return (
              <li
                key={r.client_id}
                className="flex items-center gap-2 bg-gray-800/50 rounded-lg px-2 py-1.5 text-sm"
              >
                {show_previews && r.preview
                  ? <img src={r.preview} alt="" className="w-6 h-6 rounded object-cover shrink-0" />
                  : <Icon className="w-4 h-4 text-gray-400 shrink-0" />}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-200 truncate">{r.name}</span>
                    <span className="text-gray-500 text-xs shrink-0">{formatSize(r.size)}</span>
                  </div>
                  {bad
                    ? <p className="text-xs text-red-400 truncate" title={friendlyError(r.error)}>{friendlyError(r.error)}</p>
                    : (
                      <div className="mt-1 h-1 w-full bg-gray-700/60 rounded-full overflow-hidden" aria-hidden="true">
                        <div className={[
                          'h-full rounded-full transition-all duration-300 motion-reduce:transition-none',
                          ok ? 'w-full bg-green-500' : 'w-2/3 bg-blue-500 animate-pulse motion-reduce:animate-none',
                        ].join(' ')} />
                      </div>
                    )}
                </div>
                <span className="shrink-0" title={READABLE_STATUS[r.status]} aria-label={READABLE_STATUS[r.status]}>
                  {busy && <Loader2 className="w-4 h-4 text-blue-400 animate-spin motion-reduce:animate-none" />}
                  {ok && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                  {bad && <XCircle className="w-4 h-4 text-red-400" />}
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeRow(r.client_id); }}
                  aria-label={`Remove ${r.name}`}
                  className="text-gray-500 hover:text-red-400 shrink-0 rounded p-0.5 focus-visible:ring-2 focus-visible:ring-blue-500/70 outline-none"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {view.length > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {view.length} file{view.length > 1 ? 's' : ''} · {formatSize(totalReadable)}
            {errored ? <span className="text-red-400"> · {errored} failed</span> : null}
          </span>
          <button
            type="button" onClick={clearAll}
            className="text-gray-500 hover:text-gray-300 rounded px-1 focus-visible:ring-2 focus-visible:ring-blue-500/70 outline-none"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};
