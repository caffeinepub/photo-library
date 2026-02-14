import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useGetAlbumPhotosPaginated, useSetAlbumCoverPhoto } from '../hooks/useQueries';
import type { Photo } from '../backend';
import { toast } from 'sonner';

interface AlbumCoverPhotoDialogProps {
  albumId: string;
  currentCoverPhotoId?: string;
  onClose: () => void;
}

export default function AlbumCoverPhotoDialog({
  albumId,
  currentCoverPhotoId,
  onClose,
}: AlbumCoverPhotoDialogProps) {
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(currentCoverPhotoId ?? null);
  const { data: photosData, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetAlbumPhotosPaginated(albumId);
  const { mutate: setAlbumCoverPhoto, isPending } = useSetAlbumCoverPhoto();

  const allPhotos: Photo[] = photosData?.pages.flatMap((page) => page.photos) ?? [];

  const handleConfirm = () => {
    if (!selectedPhotoId) {
      toast.error('Please select a photo');
      return;
    }

    setAlbumCoverPhoto(
      { albumId, photoId: selectedPhotoId },
      {
        onSuccess: () => {
          toast.success('Album cover photo updated');
          onClose();
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : 'Failed to set album cover photo');
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-lg bg-background shadow-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-xl font-semibold text-foreground">Album Cover Photo</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                <p className="text-muted-foreground">Loading photos...</p>
              </div>
            </div>
          ) : allPhotos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 rounded-full bg-muted p-6">
                <svg
                  className="h-12 w-12 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">No photos in this album</h3>
              <p className="text-muted-foreground">Add photos to the album before setting a cover photo</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">Select a photo to use as the album cover</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {allPhotos.map((photo) => (
                  <button
                    key={photo.id}
                    onClick={() => setSelectedPhotoId(photo.id)}
                    className={`relative aspect-square overflow-hidden rounded-lg transition-all ${
                      selectedPhotoId === photo.id
                        ? 'ring-4 ring-primary'
                        : 'ring-2 ring-transparent hover:ring-muted-foreground/50'
                    }`}
                  >
                    <img
                      src={photo.blob.getDirectURL()}
                      alt={photo.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    {selectedPhotoId === photo.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                        <div className="rounded-full bg-primary p-2">
                          <Check className="h-6 w-6 text-primary-foreground" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {hasNextPage && (
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="rounded-lg bg-secondary px-6 py-3 font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
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
        {allPhotos.length > 0 && (
          <div className="flex items-center justify-end gap-2 border-t border-border p-4">
            <button
              onClick={onClose}
              className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 active:scale-[0.98] min-h-[44px]"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isPending || !selectedPhotoId}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Setting...
                </span>
              ) : (
                'Set as Cover'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
