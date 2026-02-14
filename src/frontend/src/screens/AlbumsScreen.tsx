import { useState } from 'react';
import { useListAlbums } from '../hooks/useQueries';
import AlbumCard from '../components/AlbumCard';
import AlbumActionsDialog from '../components/AlbumActionsDialog';
import AlbumDetailScreen from './AlbumDetailScreen';
import { Plus } from 'lucide-react';
import type { SharedAlbum } from '../backend';

export default function AlbumsScreen() {
  const { data: albums, isLoading } = useListAlbums();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<SharedAlbum | null>(null);

  if (selectedAlbum) {
    return <AlbumDetailScreen album={selectedAlbum} onBack={() => setSelectedAlbum(null)} />;
  }

  return (
    <main className="flex-1 px-4 py-6">
      <div className="mx-auto max-w-7xl">
        {/* Header with Create Button */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Albums</h2>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.98] min-h-[44px]"
          >
            <Plus className="h-4 w-4" />
            <span>New Album</span>
          </button>
        </div>

        {/* Albums Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
              <p className="text-muted-foreground">Loading albums...</p>
            </div>
          </div>
        ) : !albums || albums.length === 0 ? (
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
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-semibold text-foreground">No albums yet</h2>
            <p className="text-muted-foreground">Create your first album to organize your photos</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {albums.map((album) => (
              <AlbumCard
                key={album.id}
                album={album}
                onClick={() => setSelectedAlbum(album)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Album Dialog */}
      {showCreateDialog && (
        <AlbumActionsDialog
          mode="create"
          onClose={() => setShowCreateDialog(false)}
        />
      )}
    </main>
  );
}
