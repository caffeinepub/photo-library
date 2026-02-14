import { useState, useMemo } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useGetAllPhotosPaginated } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import PhotoGrid from '../components/PhotoGrid';
import PhotoViewer from '../components/PhotoViewer';
import UploadButton from '../components/UploadButton';
import AlbumsScreen from './AlbumsScreen';
import { LogOut, Search } from 'lucide-react';
import type { Photo } from '../backend';

type Tab = 'library' | 'albums';

export default function HomeScreen() {
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: userProfile } = useGetCallerUserProfile();
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('library');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: photosData, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetAllPhotosPaginated();

  const allPhotos: Photo[] = photosData?.pages.flatMap((page) => page.photos) ?? [];

  // Filter photos based on search query (caption, name, filename)
  const filteredPhotos = useMemo(() => {
    if (!searchQuery.trim()) return allPhotos;
    
    const query = searchQuery.toLowerCase();
    return allPhotos.filter((photo) => {
      const caption = photo.caption?.toLowerCase() || '';
      const name = photo.name.toLowerCase();
      return caption.includes(query) || name.includes(query);
    });
  }, [allPhotos, searchQuery]);

  const handleSignOut = async () => {
    await clear();
    queryClient.clear();
  };

  const handlePhotoClick = (index: number) => {
    setSelectedPhotoIndex(index);
  };

  const handleCloseViewer = () => {
    setSelectedPhotoIndex(null);
  };

  const handleUploadError = (error: string) => {
    setUploadError(error);
    setTimeout(() => setUploadError(null), 5000);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <div className="min-w-0 flex-shrink">
            <h1 className="text-xl font-bold text-card-foreground">Photo Library</h1>
            {userProfile && (
              <p className="text-sm text-muted-foreground truncate">{userProfile.name}</p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 active:scale-[0.98] min-h-[44px]"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex gap-1 border-b border-border">
            <button
              onClick={() => setActiveTab('library')}
              className={`px-4 py-2 text-sm font-medium transition-colors relative min-h-[44px] ${
                activeTab === 'library'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Library
              {activeTab === 'library' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('albums')}
              className={`px-4 py-2 text-sm font-medium transition-colors relative min-h-[44px] ${
                activeTab === 'albums'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Albums
              {activeTab === 'albums' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mx-auto max-w-7xl px-4 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-h-[44px]"
            />
          </div>
        </div>

        {/* Upload Section - Only show on Library tab */}
        {activeTab === 'library' && (
          <div className="mx-auto max-w-7xl px-4 pb-4 pt-4">
            <UploadButton onError={handleUploadError} />
          </div>
        )}
      </header>

      {/* Upload Error */}
      {uploadError && activeTab === 'library' && (
        <div className="mx-auto w-full max-w-7xl px-4 pt-4">
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {uploadError}
          </div>
        </div>
      )}

      {/* Main Content */}
      {activeTab === 'library' ? (
        <main className="flex-1 px-4 py-6">
          <div className="mx-auto max-w-7xl">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                  <p className="text-muted-foreground">Loading photos...</p>
                </div>
              </div>
            ) : filteredPhotos.length === 0 ? (
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
                <h2 className="mb-2 text-xl font-semibold text-foreground">
                  {searchQuery ? 'No matching photos' : 'No photos yet'}
                </h2>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? 'Try a different search term'
                    : 'Select and upload your first photo to get started'}
                </p>
              </div>
            ) : (
              <>
                <PhotoGrid photos={filteredPhotos} onPhotoClick={handlePhotoClick} />

                {hasNextPage && !searchQuery && (
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
        </main>
      ) : (
        <AlbumsScreen searchQuery={searchQuery} />
      )}

      {/* Footer */}
      <footer className="border-t border-border bg-card py-6">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} · Built with{' '}
            <span className="text-destructive">♥</span> using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:text-primary transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>

      {/* Photo Viewer */}
      {selectedPhotoIndex !== null && activeTab === 'library' && (
        <PhotoViewer
          photos={filteredPhotos}
          initialIndex={selectedPhotoIndex}
          onClose={handleCloseViewer}
        />
      )}
    </div>
  );
}
