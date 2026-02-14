import { useState } from 'react';
import { X } from 'lucide-react';
import type { Photo } from '../backend';

interface AlbumPhotoGridItemProps {
  photo: Photo;
  onRemove: () => void;
  onClick: () => void;
}

export default function AlbumPhotoGridItem({ photo, onRemove, onClick }: AlbumPhotoGridItemProps) {
  const [showRemove, setShowRemove] = useState(false);

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove();
  };

  return (
    <div
      className="group relative aspect-square overflow-hidden rounded-lg bg-muted"
      onMouseEnter={() => setShowRemove(true)}
      onMouseLeave={() => setShowRemove(false)}
    >
      <button
        onClick={onClick}
        className="h-full w-full transition-all hover:ring-2 hover:ring-primary active:scale-[0.98]"
      >
        <img
          src={photo.blob.getDirectURL()}
          alt={photo.name}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
        />
      </button>

      {/* Remove Button */}
      {showRemove && (
        <button
          onClick={handleRemove}
          className="absolute top-2 right-2 rounded-full bg-destructive p-1.5 text-destructive-foreground shadow-lg transition-all hover:bg-destructive/90 active:scale-[0.95] min-h-[32px] min-w-[32px]"
          aria-label="Remove from album"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
