import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { useGetAllPhotosPaginated, useAddPhotosToAlbum } from '../hooks/useQueries';
import type { Photo } from '../backend';

interface PhotoPickerDialogProps {
  albumId: string;
  onClose: () => void;
}

export default function PhotoPickerDialog({ albumId, onClose }: PhotoPickerDialogProps) {
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
  const { data: photosData, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetAllPhotosPaginated();
  const { mutate: addPhotos, isPending: isAdding } = useAddPhotosToAlbum();

  const allPhotos: Photo[] = photosData?.pages.flatMap((page) => page.photos) ?? [];

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const togglePhoto = (photoId: string) => {
    setSelectedPhotoIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  };

  const handleAdd = () => {
    if (selectedPhotoIds.size === 0) return;
    addPhotos(
      { albumId, photoIds: Array.from(selectedPhotoIds) },
      {
        onSuccess: () => onClose(),
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] rounded-lg bg-card border border-border shadow-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-card-foreground">Add Photos to Album</h2>
            <p className="text-sm text-muted-foreground">
              {selectedPhotoIds.size} {selectedPhotoIds.size === 1 ? 'photo' : 'photos'} selected
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors min-h-[44px] min-w-[44px]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                <p className="text-muted-foreground">Loading photos...</p>
              </div>
            </div>
          ) : allPhotos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-muted-foreground">No photos in your library</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                {allPhotos.map((photo) => {
                  const isSelected = selectedPhotoIds.has(photo.id);
                  return (
                    <button
                      key={photo.id}
                      onClick={() => togglePhoto(photo.id)}
                      className={`relative aspect-square overflow-hidden rounded-lg bg-muted transition-all active:scale-[0.98] ${
                        isSelected ? 'ring-2 ring-primary' : 'hover:ring-2 hover:ring-muted-foreground/50'
                      }`}
                    >
                      <img
                        src={photo.blob.getDirectURL()}
                        alt={photo.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <div className="rounded-full bg-primary p-1">
                            <Check className="h-4 w-4 text-primary-foreground" />
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {hasNextPage && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="rounded-lg bg-secondary px-6 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                  >
                    {isFetchingNextPage ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-secondary-foreground border-t-transparent" />
                        Loading...
                      </span>
                    ) : (
                      'Load more'
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end border-t border-border px-6 py-4 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={isAdding}
            className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 active:scale-[0.98] disabled:opacity-50 min-h-[44px]"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={isAdding || selectedPhotoIds.size === 0}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 min-h-[44px]"
          >
            {isAdding ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Adding...
              </span>
            ) : (
              `Add ${selectedPhotoIds.size > 0 ? `(${selectedPhotoIds.size})` : ''}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
