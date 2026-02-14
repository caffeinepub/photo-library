import { useRef, useState, useEffect } from 'react';
import { Upload, X } from 'lucide-react';
import { useUploadPhotos } from '../hooks/useQueries';
import { ExternalBlob } from '../backend';
import PendingUploadPreview from './PendingUploadPreview';

interface UploadButtonProps {
  onError: (error: string) => void;
}

interface PendingFile {
  file: File;
  previewUrl: string;
  id: string;
}

export default function UploadButton({ onError }: UploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const { mutate: uploadPhotos, isPending } = useUploadPhotos();

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      pendingFiles.forEach((pf) => URL.revokeObjectURL(pf.previewUrl));
    };
  }, []);

  const handleSelectClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPendingFiles: PendingFile[] = Array.from(files).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }));

    // Append to existing pending files
    setPendingFiles((prev) => [...prev, ...newPendingFiles]);

    // Reset input value so selecting the same file again triggers onChange
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePending = (id: string) => {
    setPendingFiles((prev) => {
      const fileToRemove = prev.find((pf) => pf.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
      }
      return prev.filter((pf) => pf.id !== id);
    });
  };

  const handleClearAll = () => {
    pendingFiles.forEach((pf) => URL.revokeObjectURL(pf.previewUrl));
    setPendingFiles([]);
  };

  const handleUpload = async () => {
    if (pendingFiles.length === 0) return;

    try {
      setUploadProgress(0);

      // Convert pending files to Photo objects with ExternalBlob
      const photoPromises = pendingFiles.map(async (pendingFile) => {
        const bytes = new Uint8Array(await pendingFile.file.arrayBuffer());
        const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((percentage) => {
          setUploadProgress(percentage);
        });

        return {
          id: pendingFile.id,
          blob,
          name: pendingFile.file.name,
          createdAt: BigInt(Date.now() * 1_000_000), // Convert to nanoseconds
        };
      });

      const photos = await Promise.all(photoPromises);

      uploadPhotos(photos, {
        onSuccess: () => {
          // Clear pending state on success
          pendingFiles.forEach((pf) => URL.revokeObjectURL(pf.previewUrl));
          setPendingFiles([]);
          setUploadProgress(null);
        },
        onError: (error) => {
          // Keep pending files on failure so user can retry
          setUploadProgress(null);
          onError('Upload failed. Please try again.');
          console.error('Upload error:', error);
        },
      });
    } catch (error) {
      setUploadProgress(null);
      onError('Upload failed. Please try again.');
      console.error('File processing error:', error);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
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
          onClick={handleSelectClick}
          disabled={isPending}
          className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
          aria-label="Select photos"
        >
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">Select</span>
        </button>

        {pendingFiles.length > 0 && (
          <button
            onClick={handleUpload}
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
                <span className="hidden sm:inline">Upload ({pendingFiles.length})</span>
                <span className="sm:hidden">{pendingFiles.length}</span>
              </>
            )}
          </button>
        )}
      </div>

      {pendingFiles.length > 0 && (
        <PendingUploadPreview
          pendingFiles={pendingFiles}
          onRemove={handleRemovePending}
          onClearAll={handleClearAll}
          disabled={isPending}
        />
      )}
    </div>
  );
}
