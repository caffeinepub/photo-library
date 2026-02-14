import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useCreateAlbum, useRenameAlbum, useDeleteAlbum } from '../hooks/useQueries';
import type { SharedAlbum } from '../backend';

interface AlbumActionsDialogProps {
  mode: 'create' | 'rename' | 'delete';
  album?: SharedAlbum;
  onClose: () => void;
  onDeleted?: () => void;
}

export default function AlbumActionsDialog({ mode, album, onClose, onDeleted }: AlbumActionsDialogProps) {
  const [albumName, setAlbumName] = useState(album?.name || '');
  const { mutate: createAlbum, isPending: isCreating } = useCreateAlbum();
  const { mutate: renameAlbum, isPending: isRenaming } = useRenameAlbum();
  const { mutate: deleteAlbum, isPending: isDeleting } = useDeleteAlbum();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'create') {
      if (!albumName.trim()) return;
      createAlbum(albumName.trim(), {
        onSuccess: () => onClose(),
      });
    } else if (mode === 'rename' && album) {
      if (!albumName.trim()) return;
      renameAlbum({ albumId: album.id, newName: albumName.trim() }, {
        onSuccess: () => onClose(),
      });
    }
  };

  const handleDelete = () => {
    if (!album) return;
    deleteAlbum(album.id, {
      onSuccess: () => {
        onClose();
        if (onDeleted) onDeleted();
      },
    });
  };

  const isPending = isCreating || isRenaming || isDeleting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-card border border-border shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-card-foreground">
            {mode === 'create' && 'Create Album'}
            {mode === 'rename' && 'Rename Album'}
            {mode === 'delete' && 'Delete Album'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors min-h-[44px] min-w-[44px]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        {mode === 'delete' ? (
          <div className="px-6 py-4">
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete "{album?.name}"? This will not delete the photos in the album.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                disabled={isPending}
                className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 active:scale-[0.98] disabled:opacity-50 min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 active:scale-[0.98] disabled:opacity-50 min-h-[44px]"
              >
                {isDeleting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-destructive-foreground border-t-transparent" />
                    Deleting...
                  </span>
                ) : (
                  'Delete Album'
                )}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4">
              <label htmlFor="albumName" className="block text-sm font-medium text-foreground mb-2">
                Album Name
              </label>
              <input
                id="albumName"
                type="text"
                value={albumName}
                onChange={(e) => setAlbumName(e.target.value)}
                placeholder="Enter album name"
                className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[44px]"
                autoFocus
                disabled={isPending}
              />
            </div>

            <div className="flex gap-3 justify-end border-t border-border px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 active:scale-[0.98] disabled:opacity-50 min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || !albumName.trim()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 min-h-[44px]"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    {mode === 'create' ? 'Creating...' : 'Renaming...'}
                  </span>
                ) : (
                  mode === 'create' ? 'Create' : 'Rename'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
