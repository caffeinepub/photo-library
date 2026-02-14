import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { useDeletePhoto } from '../hooks/useQueries';
import type { Photo } from '../backend';

interface PhotoViewerProps {
  photos: Photo[];
  initialIndex: number;
  onClose: () => void;
}

export default function PhotoViewer({ photos, initialIndex, onClose }: PhotoViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const { mutate: deletePhoto, isPending: isDeleting } = useDeletePhoto();

  const currentPhoto = photos[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < photos.length - 1;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) setCurrentIndex((i) => i - 1);
      if (e.key === 'ArrowRight' && hasNext) setCurrentIndex((i) => i + 1);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasPrev, hasNext, onClose]);

  const handlePrev = () => {
    if (hasPrev) setCurrentIndex((i) => i - 1);
  };

  const handleNext = () => {
    if (hasNext) setCurrentIndex((i) => i + 1);
  };

  const handleDelete = () => {
    if (!currentPhoto || isDeleting) return;

    deletePhoto(currentPhoto.id, {
      onSuccess: () => {
        // Navigate to next photo or close if none remain
        if (photos.length === 1) {
          onClose();
        } else if (hasNext) {
          // Stay at same index (next photo will shift into this position)
        } else if (hasPrev) {
          setCurrentIndex((i) => i - 1);
        } else {
          onClose();
        }
      },
    });
  };

  if (!currentPhoto) {
    onClose();
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex-1">
          <p className="text-sm text-white/80">
            {currentIndex + 1} / {photos.length}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            aria-label="Delete photo"
          >
            {isDeleting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-destructive-foreground border-t-transparent" />
                <span className="hidden sm:inline">Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Delete</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="rounded-lg bg-white/10 p-2 text-white transition-colors hover:bg-white/20 active:scale-[0.98] min-h-[44px] min-w-[44px]"
            aria-label="Close viewer"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Main Image */}
      <div className="flex h-full items-center justify-center p-4 pt-20 pb-20">
        <img
          src={currentPhoto.blob.getDirectURL()}
          alt={currentPhoto.name}
          className="max-h-full max-w-full object-contain"
        />
      </div>

      {/* Navigation Buttons */}
      {hasPrev && (
        <button
          onClick={handlePrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20 active:scale-[0.98] min-h-[56px] min-w-[56px]"
          aria-label="Previous photo"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>
      )}

      {hasNext && (
        <button
          onClick={handleNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20 active:scale-[0.98] min-h-[56px] min-w-[56px]"
          aria-label="Next photo"
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      )}

      {/* Bottom Info */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <p className="text-center text-sm text-white/80">{currentPhoto.name}</p>
      </div>
    </div>
  );
}

