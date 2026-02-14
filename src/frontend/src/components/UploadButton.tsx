import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { useUploadPhotos } from '../hooks/useQueries';
import { ExternalBlob } from '../backend';

interface UploadButtonProps {
  onError: (error: string) => void;
}

export default function UploadButton({ onError }: UploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const { mutate: uploadPhotos, isPending } = useUploadPhotos();

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadProgress(0);
      const fileArray = Array.from(files);

      // Convert files to bytes and create Photo objects
      const photoPromises = fileArray.map(async (file) => {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((percentage) => {
          setUploadProgress(percentage);
        });

        return {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          blob,
          name: file.name,
          createdAt: BigInt(Date.now() * 1_000_000), // Convert to nanoseconds
        };
      });

      const photos = await Promise.all(photoPromises);

      uploadPhotos(photos, {
        onSuccess: () => {
          setUploadProgress(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        },
        onError: (error) => {
          setUploadProgress(null);
          onError('Upload failed. Please try again.');
          console.error('Upload error:', error);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        },
      });
    } catch (error) {
      setUploadProgress(null);
      onError('Upload failed. Please try again.');
      console.error('File processing error:', error);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
        disabled={isPending}
      />

      <button
        onClick={handleClick}
        disabled={isPending}
        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        aria-label="Upload photos"
      >
        {isPending ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            <span className="hidden sm:inline">
              {uploadProgress !== null ? `${Math.round(uploadProgress)}%` : 'Uploading...'}
            </span>
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Upload</span>
          </>
        )}
      </button>
    </>
  );
}

