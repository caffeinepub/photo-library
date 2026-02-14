import { useState } from 'react';
import { ChevronLeft, Plus, Trash2, Image } from 'lucide-react';
import { useGetAlbum, useGetAlbumPhotosPaginated, useRemovePhotoFromAlbum } from '../hooks/useQueries';
import AlbumActionsDialog from '../components/AlbumActionsDialog';
import PhotoPickerDialog from '../components/PhotoPickerDialog';
import AlbumPhotoGridItem from '../components/AlbumPhotoGridItem';
import PhotoViewer from '../components/PhotoViewer';
import AlbumCoverPhotoDialog from '../components/AlbumCoverPhotoDialog';
import type { Photo } from '../backend';

interface AlbumDetailScreenProps {
  albumId: string;
  onBack: () => void;
}

export default function AlbumDetailScreen({ albumId, onBack }: AlbumDetailScreenProps) {
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPhotoPickerDialog, setShowPhotoPickerDialog] = useState(false);
  const [showCoverPhotoDialog, setShowCoverPhotoDialog] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  const { data: album, isLoading: albumLoading } = useGetAlbum(albumId);
  const { data: photosData, isLoading: photosLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetAlbumPhotosPaginated(albumId);
  const { mutate: removePhoto } = useRemovePhotoFromAlbum();

  const allPhotos: Photo[] = photosData?.pages.flatMap((page) => page.photos) ?? [];
  const isLoading = albumLoading || photosLoading;

  const handleRemovePhoto = (photoId: string) => {
    removePhoto({ albumId, photoId });
  };

  const handlePhotoClick = (index: number) => {
    setSelectedPhotoIndex(index);
  };

  const handleCloseViewer = () => {
    setSelectedPhotoIndex(null);
  };

  if (!album && !albumLoading) {
    return (
      <main className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <h2 className="mb-2 text-xl font-semibold text-foreground">Album not found</h2>
            <button
              onClick={onBack}
              className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.98] min-h-[44px]"
            >
              Back to Albums
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 px-4 py-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Albums
          </button>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-foreground truncate">{album?.name ?? 'Loading...'}</h2>
              <p className="text-sm text-muted-foreground">
                {album ? `${album.photoIds.length} ${album.photoIds.length === 1 ? 'photo' : 'photos'}` : ''}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
              <button
                onClick={() => setShowCoverPhotoDialog(true)}
                className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 active:scale-[0.98] min-h-[44px]"
              >
                <Image className="h-4 w-4" />
                <span className="hidden sm:inline">Album Cover Photo</span>
                <span className="sm:hidden">Cover</span>
              </button>

              <button
                onClick={() => setShowPhotoPickerDialog(true)}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.98] min-h-[44px]"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Photos</span>
              </button>

              <button
                onClick={() => setShowRenameDialog(true)}
                className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 active:scale-[0.98] min-h-[44px]"
              >
                Rename
              </button>

              <button
                onClick={() => setShowDeleteDialog(true)}
                className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 active:scale-[0.98] min-h-[44px]"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Photos Grid */}
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
            <h2 className="mb-2 text-xl font-semibold text-foreground">No photos in this album</h2>
            <p className="text-muted-foreground mb-4">Add photos from your library to get started</p>
            <button
              onClick={() => setShowPhotoPickerDialog(true)}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.98] min-h-[44px]"
            >
              <Plus className="h-4 w-4" />
              Add Photos
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {allPhotos.map((photo, index) => (
                <AlbumPhotoGridItem
                  key={photo.id}
                  photo={photo}
                  onRemove={() => handleRemovePhoto(photo.id)}
                  onClick={() => handlePhotoClick(index)}
                />
              ))}
            </div>

            {hasNextPage && (
              <div className="mt-8 flex justify-center">
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

      {/* Dialogs */}
      {album && showRenameDialog && (
        <AlbumActionsDialog
          mode="rename"
          album={album}
          onClose={() => setShowRenameDialog(false)}
        />
      )}

      {album && showDeleteDialog && (
        <AlbumActionsDialog
          mode="delete"
          album={album}
          onClose={() => setShowDeleteDialog(false)}
          onDeleted={onBack}
        />
      )}

      {showPhotoPickerDialog && (
        <PhotoPickerDialog
          albumId={albumId}
          onClose={() => setShowPhotoPickerDialog(false)}
        />
      )}

      {showCoverPhotoDialog && (
        <AlbumCoverPhotoDialog
          albumId={albumId}
          currentCoverPhotoId={album?.coverPhotoId}
          onClose={() => setShowCoverPhotoDialog(false)}
        />
      )}

      {/* Photo Viewer */}
      {selectedPhotoIndex !== null && (
        <PhotoViewer
          photos={allPhotos}
          initialIndex={selectedPhotoIndex}
          onClose={handleCloseViewer}
        />
      )}
    </main>
  );
}
