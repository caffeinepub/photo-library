import { useGetPhoto } from '../hooks/useQueries';
import type { SharedAlbum } from '../backend';

interface AlbumCardProps {
  album: SharedAlbum;
  onClick: () => void;
}

export default function AlbumCard({ album, onClick }: AlbumCardProps) {
  // Prefer explicit cover photo, otherwise use first photo
  const coverPhotoId = album.coverPhotoId ?? album.photoIds[0];
  const { data: coverPhoto } = useGetPhoto(coverPhotoId);

  return (
    <button
      onClick={onClick}
      className="group flex flex-col gap-2 text-left transition-all active:scale-[0.98]"
    >
      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted transition-all hover:ring-2 hover:ring-primary">
        {coverPhoto ? (
          <img
            src={coverPhoto.blob.getDirectURL()}
            alt={album.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
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
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
        )}
      </div>

      <div className="px-1">
        <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
          {album.name}
        </h3>
        <p className="text-sm text-muted-foreground">
          {album.photoIds.length} {album.photoIds.length === 1 ? 'photo' : 'photos'}
        </p>
      </div>
    </button>
  );
}
