'use client';

import { useState, useRef } from 'react';
import { Upload, X, FileText, Image as ImageIcon, Film, Music, Archive, File } from 'lucide-react';
import type { UIComponent, UIAction } from '../types';

interface FileEntry {
  name: string;
  size: number;
  mime_type: string;
  data_base64: string;
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
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1048576).toFixed(1)}MB`;
}

export const DFileUpload: UIComponent = ({ node, onAction }) => {
  const {
    accept = '*', max_size_mb = 10, multiple = false, on_upload,
    param_name = 'files', blocked_extensions = [], max_total_mb = 0, max_files = 0,
  } = node.props as {
    accept?: string; max_size_mb?: number; multiple?: boolean; on_upload?: UIAction;
    param_name?: string; blocked_extensions?: string[]; max_total_mb?: number; max_files?: number;
  };

  const [files, setFiles] = useState<FileEntry[]>([]);
  const [error, setError] = useState('');
  const ref = useRef<HTMLInputElement>(null);

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
    setError('');
  };

  const processFiles = async (fileList: FileList | null) => {
    if (!fileList) return;
    setError('');
    const newFiles: FileEntry[] = [...files];

    for (const file of Array.from(fileList)) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (blocked_extensions.length && blocked_extensions.includes(ext)) {
        setError(`Blocked file type: .${ext}`);
        continue;
      }
      if (file.size > max_size_mb * 1048576) {
        setError(`${file.name} exceeds ${max_size_mb}MB limit`);
        continue;
      }
      if (max_files && newFiles.length >= max_files) {
        setError(`Maximum ${max_files} files`);
        break;
      }
      const totalSize = newFiles.reduce((s, f) => s + f.size, 0) + file.size;
      if (max_total_mb && totalSize > max_total_mb * 1048576) {
        setError(`Total size exceeds ${max_total_mb}MB`);
        break;
      }
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
      });
      newFiles.push({ name: file.name, size: file.size, mime_type: file.type, data_base64: base64 });
    }

    setFiles(newFiles);
    if (on_upload && onAction && newFiles.length) {
      onAction({ ...on_upload, params: { ...(on_upload.params || {}), [param_name]: newFiles } });
    }
  };

  return (
    <div className="space-y-2">
      <div
        onClick={() => ref.current?.click()}
        onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-blue-500'); }}
        onDragLeave={e => e.currentTarget.classList.remove('border-blue-500')}
        onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('border-blue-500'); void processFiles(e.dataTransfer.files); }}
        className="border-2 border-dashed border-gray-700 rounded-lg p-4 text-center cursor-pointer hover:border-gray-500 transition-colors"
      >
        <Upload className="w-6 h-6 text-gray-500 mx-auto mb-1" />
        <p className="text-sm text-gray-400">Drop files or click to browse</p>
        <p className="text-xs text-gray-600">Max {max_size_mb}MB per file{max_total_mb ? `, ${max_total_mb}MB total` : ''}{max_files ? `, up to ${max_files} files` : ''}</p>
      </div>
      <input ref={ref} type="file" accept={accept} multiple={multiple} onChange={e => void processFiles(e.target.files)} className="hidden" />
      {error && <p className="text-xs text-red-400">{error}</p>}
      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((f, i) => {
            const Icon = getIcon(f.mime_type);
            return (
              <div key={i} className="flex items-center gap-2 bg-gray-800/50 rounded px-2 py-1 text-sm">
                <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-gray-300 truncate flex-1">{f.name}</span>
                <span className="text-gray-500 text-xs shrink-0">{formatSize(f.size)}</span>
                <button onClick={() => removeFile(i)} className="text-gray-500 hover:text-red-400 shrink-0"><X className="w-3.5 h-3.5" /></button>
              </div>
            );
          })}
          <p className="text-xs text-gray-500 text-right">
            {files.length} file{files.length > 1 ? 's' : ''} · {formatSize(files.reduce((s, f) => s + f.size, 0))}
          </p>
        </div>
      )}
    </div>
  );
};
