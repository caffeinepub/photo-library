import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserProfile, Photo, ListPhotosResponse, SharedAlbum, ListAlbumPhotosResponse } from '../backend';
import { ExternalBlob } from '../backend';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Photo Queries
export function useGetAllPhotosPaginated() {
  const { actor, isFetching: actorFetching } = useActor();

  return useInfiniteQuery<ListPhotosResponse>({
    queryKey: ['allPhotos'],
    queryFn: async ({ pageParam }) => {
      if (!actor) throw new Error('Actor not available');
      const cursor = pageParam ? BigInt(pageParam as number) : null;
      return actor.getAllPhotosPaginated(cursor, null);
    },
    getNextPageParam: (lastPage) => {
      return lastPage.nextCursor !== undefined ? Number(lastPage.nextCursor) : undefined;
    },
    initialPageParam: undefined,
    enabled: !!actor && !actorFetching,
  });
}

export function useGetPhoto(photoId: string | undefined) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Photo | null>({
    queryKey: ['photo', photoId],
    queryFn: async () => {
      if (!actor || !photoId) return null;
      try {
        return await actor.getPhoto(photoId);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !actorFetching && !!photoId,
  });
}

export function useUploadPhotos() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (photos: Photo[]) => {
      if (!actor) throw new Error('Actor not available');
      return actor.uploadMultiplePhotos(photos);
    },
    onSuccess: () => {
      // Invalidate and refetch to show new photos at the top
      queryClient.invalidateQueries({ queryKey: ['allPhotos'] });
    },
  });
}

export function useDeletePhoto() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (photoId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deletePhoto(photoId);
    },
    onSuccess: () => {
      // Invalidate queries to update the grid
      queryClient.invalidateQueries({ queryKey: ['allPhotos'] });
      queryClient.invalidateQueries({ queryKey: ['albums'] });
      queryClient.invalidateQueries({ queryKey: ['albumPhotos'] });
    },
  });
}

// Album Queries
export function useListAlbums() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<SharedAlbum[]>({
    queryKey: ['albums'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.listAlbums();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useCreateAlbum() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createAlbum(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
    },
  });
}

export function useRenameAlbum() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ albumId, newName }: { albumId: string; newName: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.renameAlbum(albumId, newName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
    },
  });
}

export function useDeleteAlbum() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (albumId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteAlbum(albumId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
    },
  });
}

export function useGetAlbumPhotosPaginated(albumId: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useInfiniteQuery<ListAlbumPhotosResponse>({
    queryKey: ['albumPhotos', albumId],
    queryFn: async ({ pageParam }) => {
      if (!actor) throw new Error('Actor not available');
      const cursor = pageParam ? BigInt(pageParam as number) : null;
      return actor.getAlbumPhotosPaginated(albumId, cursor, null);
    },
    getNextPageParam: (lastPage) => {
      return lastPage.nextCursor !== undefined ? Number(lastPage.nextCursor) : undefined;
    },
    initialPageParam: undefined,
    enabled: !!actor && !actorFetching,
  });
}

export function useAddPhotosToAlbum() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ albumId, photoIds }: { albumId: string; photoIds: string[] }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addPhotosToAlbum(albumId, photoIds);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
      queryClient.invalidateQueries({ queryKey: ['albumPhotos', variables.albumId] });
    },
  });
}

export function useRemovePhotoFromAlbum() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ albumId, photoId }: { albumId: string; photoId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.removePhotoFromAlbum(albumId, photoId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
      queryClient.invalidateQueries({ queryKey: ['albumPhotos', variables.albumId] });
    },
  });
}
