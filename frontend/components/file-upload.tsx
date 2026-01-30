import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { File, Upload, X } from 'lucide-react';
import { uploadFile } from '@/lib/file-utils';

interface FileUploadProps {
  accept?: Record<string, string[]>;
  maxSize?: number;
  onUploadComplete?: (response: any) => void;
  onError?: (error: Error) => void;
  endpoint: string;
  label?: string;
  multiple?: boolean;
}

export function FileUpload({
  accept = { 'application/json': ['.json', '.conf', '.txt'] },
  maxSize = 10 * 1024 * 1024, // 10MB
  onUploadComplete,
  onError,
  endpoint,
  label = 'Drag & drop files here, or click to select',
  multiple = false,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple,
  });

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      setIsUploading(true);
      setProgress(0);

      for (const file of selectedFiles) {
        await uploadFile(file, endpoint, {
          onProgress: (p) => setProgress(p),
          onSuccess: (response) => {
            onUploadComplete?.(response);
            setSelectedFiles([]);
          },
          onError: (error) => {
            console.error('Upload failed:', error);
            onError?.(error);
          },
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      onError?.(error as Error);
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {isDragActive ? 'Drop the files here' : label}
          </p>
          <p className="text-xs text-muted-foreground">
            {Object.values(accept).flat().join(', ')} (max {maxSize / 1024 / 1024}MB)
          </p>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Selected Files</h4>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 border rounded-md"
              >
                <div className="flex items-center space-x-2">
                  <File className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Button
              onClick={handleUpload}
              disabled={isUploading || selectedFiles.length === 0}
              className="w-full"
            >
              {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} file(s)`}
            </Button>
            {isUploading && progress > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Uploading...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
