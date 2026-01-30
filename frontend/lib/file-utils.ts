import { apiClient } from './api';

export interface FileUploadOptions {
  onProgress?: (progress: number) => void;
  onSuccess?: (response: any) => void;
  onError?: (error: Error) => void;
}

export const uploadFile = async (
  file: File,
  endpoint: string,
  options: FileUploadOptions = {}
) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await apiClient.upload(endpoint, formData, {
      onUploadProgress: (progressEvent) => {
        const progress = Math.round(
          (progressEvent.loaded * 100) / (progressEvent.total || 1)
        );
        options.onProgress?.(progress);
      },
    });

    options.onSuccess?.(response);
    return response;
  } catch (error) {
    options.onError?.(error as Error);
    throw error;
  }
};

export const downloadFile = async (url: string, filename: string) => {
  const response = await fetch(url);
  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
};

export const processBulkOperation = async <T>(
  items: T[],
  operation: (item: T) => Promise<void>,
  batchSize = 5
) => {
  const results: { item: T; success: boolean; error?: Error }[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (item) => {
        try {
          await operation(item);
          results.push({ item, success: true });
        } catch (error) {
          results.push({
            item,
            success: false,
            error: error as Error,
          });
        }
      })
    );
  }

  return results;
};
