'use client';

import React, { useState, useRef, useCallback } from 'react';
import { CloudArrowUpIcon, DocumentIcon, PhotoIcon, TrashIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';

export interface FileUploadProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
  existingFiles?: UploadedFile[];
  maxFileSize?: number; // in MB
  allowedTypes?: string[];
  maxFiles?: number;
  projectId?: string;
  taskId?: string;
}

export interface UploadedFile {
  _id?: string;
  filename: string;
  originalName: string;
  cloudinaryId: string;
  url: string;
  mimetype: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
  description?: string;
}

interface UploadStatus {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
  uploadedFile?: UploadedFile;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesUploaded,
  existingFiles = [],
  maxFileSize = 10, // 10MB default
  allowedTypes = ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  maxFiles = 10,
  projectId,
  taskId
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploads, setUploads] = useState<UploadStatus[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith('image/')) {
      return <PhotoIcon className="h-8 w-8 text-blue-500" />;
    }
    return <DocumentIcon className="h-8 w-8 text-gray-500" />;
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size must be less than ${maxFileSize}MB`;
    }

    // Check file type
    const isAllowed = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.replace('/*', '/'));
      }
      return file.type === type;
    });

    if (!isAllowed) {
      return 'File type not allowed';
    }

    // Check total files limit
    if (existingFiles.length + uploads.length >= maxFiles) {
      return `Maximum ${maxFiles} files allowed`;
    }

    return null;
  };

  const uploadFile = async (file: File): Promise<UploadedFile> => {
    const formData = new FormData();
    formData.append('file', file);
    if (projectId) formData.append('projectId', projectId);
    if (taskId) formData.append('taskId', taskId);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Upload failed');
    }

    const data = await response.json();
    return data.file;
  };

  const handleFiles = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files);
    
    // Validate all files first
    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        alert(`${file.name}: ${error}`);
        return;
      }
    }

    // Initialize upload status for all files
    const newUploads: UploadStatus[] = fileArray.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const,
    }));

    setUploads(prev => [...prev, ...newUploads]);

    // Upload files one by one
    const uploadedFiles: UploadedFile[] = [];
    
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      
      try {
        // Update progress
        for (let progress = 0; progress <= 100; progress += 20) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setUploads(prev => prev.map((upload) => 
            upload.file === file 
              ? { ...upload, progress }
              : upload
          ));
        }

        const uploadedFile = await uploadFile(file);
        uploadedFiles.push(uploadedFile);

        // Update status to success
        setUploads(prev => prev.map((upload) => 
          upload.file === file 
            ? { ...upload, status: 'success', uploadedFile }
            : upload
        ));

      } catch (error) {
        // Update status to error
        setUploads(prev => prev.map((upload) => 
          upload.file === file 
            ? { 
                ...upload, 
                status: 'error', 
                error: error instanceof Error ? error.message : 'Upload failed' 
              }
            : upload
        ));
      }
    }

    // Notify parent component of successful uploads
    if (uploadedFiles.length > 0) {
      onFilesUploaded(uploadedFiles);
    }

    // Clear completed uploads after a delay
    setTimeout(() => {
      setUploads(prev => prev.filter(upload => upload.status === 'uploading'));
    }, 3000);

  }, [maxFileSize, allowedTypes, maxFiles, existingFiles.length, projectId, taskId, onFilesUploaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const deleteFile = async (file: UploadedFile) => {
    try {
      const response = await fetch(`/api/upload?fileId=${file.cloudinaryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      // Remove from existing files and notify parent
      const updatedFiles = existingFiles.filter(f => f.cloudinaryId !== file.cloudinaryId);
      onFilesUploaded(updatedFiles);

    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file');
    }
  };

  return (
    <div className="w-full">
      {/* Drop Zone */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200
          ${isDragOver 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-lg text-gray-600">
          Drag and drop files here, or <span className="text-blue-600 underline cursor-pointer">browse</span>
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Max {maxFileSize}MB per file • {maxFiles} files max
        </p>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept={allowedTypes.join(',')}
        />
      </div>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Uploading Files</h3>
          <div className="space-y-3">
            {uploads.map((upload, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(upload.file.type)}
                    <div>
                      <p className="font-medium text-gray-900">{upload.file.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(upload.file.size)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {upload.status === 'uploading' && (
                      <div className="text-blue-600">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                    {upload.status === 'success' && (
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    )}
                    {upload.status === 'error' && (
                      <ExclamationCircleIcon className="h-5 w-5 text-red-600" />
                    )}
                    <span className="text-sm text-gray-600">{upload.progress}%</span>
                  </div>
                </div>

                {/* Progress Bar */}
                {upload.status === 'uploading' && (
                  <div className="mt-2">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${upload.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {upload.status === 'error' && upload.error && (
                  <p className="text-red-600 text-sm mt-2">{upload.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing Files */}
      {existingFiles.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Attached Files ({existingFiles.length})</h3>
          <div className="space-y-3">
            {existingFiles.map((file) => (
              <div key={file.cloudinaryId} className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-3">
                  {getFileIcon(file.mimetype)}
                  <div>
                    <p className="font-medium text-gray-900">{file.originalName}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                    <p className="text-xs text-gray-400">
                      Uploaded on {new Date(file.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
                  >
                    View
                  </a>
                  <button
                    onClick={() => deleteFile(file)}
                    className="p-1 text-red-600 hover:text-red-800 transition-colors"
                    title="Delete file"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;