import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CloudUpload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface UploadFileItem {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

interface Props {
  folderId?: number | null;
  onUploaded?(): void;
}

const ACCEPTED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'video/mp4', 'video/webm',
];

export default function UploadZone({ folderId, onUploaded }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [uploads, setUploads] = useState<UploadFileItem[]>([]);
  const queryClient = useQueryClient();

  const updateUpload = (idx: number, update: Partial<UploadFileItem>) => {
    setUploads((prev) => prev.map((u, i) => (i === idx ? { ...u, ...update } : u)));
  };

  const uploadFile = async (file: File, idx: number) => {
    updateUpload(idx, { status: 'uploading', progress: 30 });
    try {
      const form = new FormData();
      form.append('file', file);
      if (folderId) form.append('folder_id', String(folderId));
      await api.post('/api/media/upload', form);
      updateUpload(idx, { status: 'done', progress: 100 });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Upload fehlgeschlagen';
      updateUpload(idx, { status: 'error', error: msg });
    }
  };

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => ACCEPTED_TYPES.includes(f.type));
    if (fileArray.length === 0) return;

    const newUploads: UploadFileItem[] = fileArray.map((f) => ({
      file: f,
      progress: 0,
      status: 'pending' as const,
    }));
    setUploads(newUploads);

    for (let i = 0; i < fileArray.length; i++) {
      await uploadFile(fileArray[i], i);
    }

    queryClient.invalidateQueries({ queryKey: ['media-library'] });
    onUploaded?.();

    setTimeout(() => setUploads([]), 3000);
  }, [queryClient, onUploaded, folderId]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
    e.target.value = '';
  }, [handleFiles]);

  return (
    <div>
      <label
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center gap-2 px-6 py-8 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
          dragOver
            ? 'border-[var(--primary)] bg-[var(--primary)]/5'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <CloudUpload size={28} className={dragOver ? 'text-[var(--primary)]' : 'text-gray-400'} />
        <p className="text-sm text-[var(--text-muted)]">
          Dateien hierher ziehen oder <span className="text-[var(--primary)] underline">klicken zum Auswählen</span>
        </p>
        <p className="text-[10px] text-gray-400">Bilder (JPG, PNG, WebP, SVG, GIF) · PDF · Word · Excel · Video (MP4, WebM)</p>
        <input
          type="file"
          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,video/mp4,video/webm"
          multiple
          className="hidden"
          onChange={handleFileInput}
        />
      </label>

      {uploads.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {uploads.map((u, idx) => (
            <div key={idx} className="flex items-center gap-3 text-xs">
              {u.status === 'uploading' && <Loader2 size={14} className="animate-spin text-[var(--primary)]" />}
              {u.status === 'done' && <CheckCircle size={14} className="text-green-500" />}
              {u.status === 'error' && <AlertCircle size={14} className="text-[var(--danger)]" />}
              {u.status === 'pending' && <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300" />}
              <span className="truncate flex-1">{u.file.name}</span>
              {u.status === 'uploading' && (
                <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--primary)] rounded-full transition-all" style={{ width: `${u.progress}%` }} />
                </div>
              )}
              {u.status === 'error' && <span className="text-[var(--danger)]">{u.error}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
