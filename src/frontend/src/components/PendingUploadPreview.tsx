import { X } from 'lucide-react';

interface PendingFile {
  file: File;
  previewUrl: string;
  id: string;
}

interface PendingUploadPreviewProps {
  pendingFiles: PendingFile[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
  disabled?: boolean;
}

export default function PendingUploadPreview({
  pendingFiles,
  onRemove,
  onClearAll,
  disabled = false,
}: PendingUploadPreviewProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-card-foreground">
          {pendingFiles.length} {pendingFiles.length === 1 ? 'photo' : 'photos'} pending
        </p>
        <button
          onClick={onClearAll}
          disabled={disabled}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Clear all pending photos"
        >
          Clear all
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
        {pendingFiles.map((pendingFile) => (
          <div key={pendingFile.id} className="relative aspect-square group">
            <img
              src={pendingFile.previewUrl}
              alt={pendingFile.file.name}
              className="h-full w-full rounded object-cover"
            />
            <button
              onClick={() => onRemove(pendingFile.id)}
              disabled={disabled}
              className="absolute -right-1 -top-1 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={`Remove ${pendingFile.file.name}`}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
