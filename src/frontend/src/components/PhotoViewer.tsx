import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Trash2, Save } from 'lucide-react';
import { useDeletePhoto, useUpdatePhotoCaption } from '../hooks/useQueries';
import type { Photo } from '../backend';

interface PhotoViewerProps {
  photos: Photo[];
  initialIndex: number;
  onClose: () => void;
}

export default function PhotoViewer({ photos, initialIndex, onClose }: PhotoViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [caption, setCaption] = useState('');
  const [isCaptionEdited, setIsCaptionEdited] = useState(false);
  const [captionError, setCaptionError] = useState<string | null>(null);
  
  const { mutate: deletePhoto, isPending: isDeleting } = useDeletePhoto();
  const { mutate: updateCaption, isPending: isSavingCaption } = useUpdatePhotoCaption();

  const currentPhoto = photos[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < photos.length - 1;

  // Update caption when photo changes
  useEffect(() => {
    if (currentPhoto) {
      setCaption(currentPhoto.caption || '');
      setIsCaptionEdited(false);
      setCaptionError(null);
    }
  }, [currentPhoto]);

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

  const handleCaptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCaption(e.target.value);
    setIsCaptionEdited(true);
    setCaptionError(null);
  };

  const handleSaveCaption = () => {
    if (!currentPhoto || isSavingCaption) return;

    const captionToSave = caption.trim() || null;
    
    updateCaption(
      { photoId: currentPhoto.id, caption: captionToSave },
      {
        onSuccess: () => {
          setIsCaptionEdited(false);
          setCaptionError(null);
        },
        onError: (error) => {
          setCaptionError(error instanceof Error ? error.message : 'Failed to save caption');
        },
      }
    );
  };

  const handleClearCaption = () => {
    setCaption('');
    setIsCaptionEdited(true);
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
      <div className="flex h-full items-center justify-center p-4 pt-20 pb-48">
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

      {/* Bottom Info and Caption Editor */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
        <div className="mx-auto max-w-3xl">
          <p className="text-center text-sm text-white/80 mb-4">{currentPhoto.name}</p>
          
          {/* Caption Editor */}
          <div className="space-y-2">
            <label htmlFor="caption" className="block text-sm font-medium text-white/90">
              Caption
            </label>
            <textarea
              id="caption"
              value={caption}
              onChange={handleCaptionChange}
              placeholder="Add a caption..."
              rows={2}
              className="w-full rounded-lg border border-white/20 bg-black/50 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 resize-none"
            />
            
            {captionError && (
              <p className="text-sm text-red-400">{captionError}</p>
            )}
            
            <div className="flex gap-2 justify-end">
              {caption && (
                <button
                  onClick={handleClearCaption}
                  disabled={isSavingCaption}
                  className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px]"
                >
                  Clear
                </button>
              )}
              <button
                onClick={handleSaveCaption}
                disabled={!isCaptionEdited || isSavingCaption}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px]"
              >
                {isSavingCaption ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
