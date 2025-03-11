'use client';

import { useState } from 'react';
import { useMutation, UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

export interface FileUploadOptions {
  /**
   * The bucket to upload to
   */
  bucket: string;
  
  /**
   * The path within the bucket
   */
  path?: string;
  
  /**
   * Whether to make the file public
   */
  isPublic?: boolean;
  
  /**
   * Custom metadata for the file
   */
  metadata?: Record<string, string>;
  
  /**
   * Show toast notifications for upload progress
   */
  showNotifications?: boolean;
}

export interface FileUploadResult {
  path: string;
  fullPath: string;
  publicUrl: string | null;
}

/**
 * A hook for uploading files to Supabase Storage.
 * 
 * @param options - Upload options and React Query mutation options
 * @returns A React Query mutation result for file uploads
 */
export function useSupabaseUpload(
  options?: Omit<UseMutationOptions<FileUploadResult, Error, File>, 'mutationFn'> & Partial<FileUploadOptions>
): UseMutationResult<FileUploadResult, Error, File> & { progress: number } {
  const [progress, setProgress] = useState(0);
  
  const {
    bucket = 'public',
    path = '',
    isPublic = true,
    metadata = {},
    showNotifications = false,
    ...mutationOptions
  } = options || {};
  
  const mutation = useMutation<FileUploadResult, Error, File>({
    mutationFn: async (file: File) => {
      if (!file) {
        throw new Error('No file provided');
      }
      
      // Generate a unique file name to avoid collisions
      const timestamp = new Date().getTime();
      const fileExt = file.name.split('.').pop();
      const fileName = `${file.name.split('.')[0]}-${timestamp}.${fileExt}`;
      const filePath = path ? `${path}/${fileName}` : fileName;
      
      if (showNotifications) {
        toast.info('Starting file upload...');
      }
      
      // Upload the file
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
          metadata,
          onUploadProgress: (progress) => {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            setProgress(percent);
            
            if (showNotifications && percent % 25 === 0) {
              toast.info(`Upload progress: ${percent}%`);
            }
          },
        });
      
      if (error) {
        console.error('Error uploading file:', error);
        toast.error(`Error uploading file: ${error.message}`);
        throw error;
      }
      
      if (!data?.path) {
        throw new Error('Upload failed: No path returned');
      }
      
      // Get the public URL if requested
      let publicUrl = null;
      if (isPublic) {
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(data.path);
        
        publicUrl = urlData.publicUrl;
      }
      
      if (showNotifications) {
        toast.success('File uploaded successfully');
      }
      
      return {
        path: data.path,
        fullPath: `${bucket}/${data.path}`,
        publicUrl,
      };
    },
    ...mutationOptions,
  });
  
  return {
    ...mutation,
    progress,
  };
}

/**
 * A hook for downloading files from Supabase Storage.
 * 
 * @param bucket - The bucket to download from
 * @param options - React Query mutation options
 * @returns A React Query mutation result for file downloads
 */
export function useSupabaseDownload(
  bucket: string,
  options?: Omit<UseMutationOptions<Blob, Error, string>, 'mutationFn'>
): UseMutationResult<Blob, Error, string> {
  return useMutation<Blob, Error, string>({
    mutationFn: async (path: string) => {
      if (!path) {
        throw new Error('No file path provided');
      }
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(path);
      
      if (error) {
        console.error('Error downloading file:', error);
        toast.error(`Error downloading file: ${error.message}`);
        throw error;
      }
      
      if (!data) {
        throw new Error('Download failed: No data returned');
      }
      
      toast.success('File downloaded successfully');
      
      return data;
    },
    ...options,
  });
}

/**
 * A hook for deleting files from Supabase Storage.
 * 
 * @param bucket - The bucket to delete from
 * @param options - React Query mutation options
 * @returns A React Query mutation result for file deletions
 */
export function useSupabaseDeleteFile(
  bucket: string,
  options?: Omit<UseMutationOptions<void, Error, string>, 'mutationFn'>
): UseMutationResult<void, Error, string> {
  return useMutation<void, Error, string>({
    mutationFn: async (path: string) => {
      if (!path) {
        throw new Error('No file path provided');
      }
      
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);
      
      if (error) {
        console.error('Error deleting file:', error);
        toast.error(`Error deleting file: ${error.message}`);
        throw error;
      }
      
      toast.success('File deleted successfully');
    },
    ...options,
  });
} 