import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface ListPhotosResponse {
    photos: Array<Photo>;
    nextCursor?: bigint;
}
export type Time = bigint;
export interface UserProfile {
    name: string;
}
export interface Photo {
    id: string;
    blob: ExternalBlob;
    name: string;
    createdAt: Time;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deletePhoto(photoId: string): Promise<void>;
    getAllPhotosPaginated(cursor: bigint | null, size: bigint | null): Promise<ListPhotosResponse>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getPhoto(photoId: string): Promise<Photo>;
    getUserPhoto(userId: Principal, photoId: string): Promise<Photo>;
    getUserPhotosPaginated(userId: Principal, cursor: bigint | null, size: bigint | null): Promise<ListPhotosResponse>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    uploadMultiplePhotos(newPhotos: Array<Photo>): Promise<void>;
}
