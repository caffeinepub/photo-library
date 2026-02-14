import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserProfile, Photo, ListPhotosResponse } from '../backend';
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
    },
  });
}

