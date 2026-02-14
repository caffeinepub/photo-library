import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useListAlbums } from '../hooks/useQueries';
import AlbumCard from '../components/AlbumCard';
import AlbumActionsDialog from '../components/AlbumActionsDialog';
import AlbumDetailScreen from './AlbumDetailScreen';

interface AlbumsScreenProps {
  searchQuery?: string;
}

export default function AlbumsScreen({ searchQuery = '' }: AlbumsScreenProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const { data: albums, isLoading } = useListAlbums();

  // Filter albums based on search query (album name)
  const filteredAlbums = useMemo(() => {
    if (!albums) return [];
    if (!searchQuery.trim()) return albums;
    
    const query = searchQuery.toLowerCase();
    return albums.filter((album) => album.name.toLowerCase().includes(query));
  }, [albums, searchQuery]);

  if (selectedAlbumId) {
    return (
      <AlbumDetailScreen
        albumId={selectedAlbumId}
        onBack={() => setSelectedAlbumId(null)}
      />
    );
  }

  return (
    <main className="flex-1 px-4 py-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Albums</h2>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.98] min-h-[44px]"
          >
            <Plus className="h-4 w-4" />
            Create Album
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
        ) : filteredAlbums.length === 0 ? (
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
            <h2 className="mb-2 text-xl font-semibold text-foreground">
              {searchQuery ? 'No matching albums' : 'No albums yet'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? 'Try a different search term'
                : 'Create your first album to organize your photos'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowCreateDialog(true)}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.98] min-h-[44px]"
              >
                <Plus className="h-4 w-4" />
                Create Album
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filteredAlbums.map((album) => (
              <AlbumCard
                key={album.id}
                album={album}
                onClick={() => setSelectedAlbumId(album.id)}
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
