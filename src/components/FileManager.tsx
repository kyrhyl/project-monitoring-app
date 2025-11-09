'use client';

import React, { useState, useEffect, useMemo } from 'react';
import FileUpload, { UploadedFile } from './FileUpload';
import { PaperClipIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface FileManagerProps {
  projectId?: string;
  taskId?: string;
  initialFiles?: UploadedFile[];
  onFilesChange?: (files: UploadedFile[]) => void;
  showTitle?: boolean;
  maxFiles?: number;
  maxFileSize?: number;
  allowedTypes?: string[];
}

const FileManager: React.FC<FileManagerProps> = ({
  projectId,
  taskId,
  initialFiles = [],
  onFilesChange,
  showTitle = true,
  maxFiles = 10,
  maxFileSize = 10,
  allowedTypes = [
    'image/*',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ]
}) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Memoize initialFiles to prevent unnecessary re-renders
  const memoizedInitialFiles = useMemo(() => initialFiles, [initialFiles.length]);

  // Initialize files only once when component mounts or when initialFiles changes meaningfully
  useEffect(() => {
    if (memoizedInitialFiles && memoizedInitialFiles.length > 0 && !hasInitialized) {
      setFiles(memoizedInitialFiles);
      setHasInitialized(true);
    }
  }, [memoizedInitialFiles, hasInitialized]);

  useEffect(() => {
    // Fetch existing files when component mounts
    const fetchFiles = async () => {
      if (!projectId && !taskId) {
        // No ID provided, just initialize as empty and mark as initialized
        setFiles([]);
        setHasInitialized(true);
        return;
      }
      
      if (memoizedInitialFiles && memoizedInitialFiles.length > 0) return; // Skip if we already have initial files
      
      setIsLoading(true);
      try {
        const url = projectId 
          ? `/api/projects/${projectId}/files`
          : `/api/tasks/${taskId}/files`;
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setFiles(data.files || []);
        } else {
          // If API endpoint doesn't exist or returns error, just initialize with empty array
          console.log(`Files endpoint not available: ${url} (${response.status})`);
          setFiles([]);
        }
        setHasInitialized(true);
      } catch (error) {
        console.error('Error fetching files:', error);
        // Initialize with empty array on error
        setFiles([]);
        setHasInitialized(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (!hasInitialized && memoizedInitialFiles.length === 0) {
      fetchFiles();
    }
  }, [projectId, taskId, hasInitialized, memoizedInitialFiles]);

  const handleFilesUploaded = (newFiles: UploadedFile[]) => {
    setFiles(newFiles);
    onFilesChange?.(newFiles);
  };

  const handleFileDeleted = (updatedFiles: UploadedFile[]) => {
    setFiles(updatedFiles);
    onFilesChange?.(updatedFiles);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <PaperClipIcon className="h-5 w-5 text-gray-500" />
          {showTitle && (
            <h3 className="text-lg font-semibold text-gray-900">
              File Attachments
            </h3>
          )}
          {files.length > 0 && (
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
              {files.length}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {isLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          )}
          {isExpanded ? (
            <ChevronUpIcon className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-500" />
          )}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-200">
          {!projectId && !taskId ? (
            <div className="text-center py-8 text-gray-500">
              <p>File upload requires a valid project or task ID.</p>
            </div>
          ) : (
            <FileUpload
              onFilesUploaded={handleFilesUploaded}
              existingFiles={files}
              maxFileSize={maxFileSize}
              allowedTypes={allowedTypes}
              maxFiles={maxFiles}
              projectId={projectId}
              taskId={taskId}
            />
          )}
        </div>
      )}

      {/* Quick Preview (when collapsed) */}
      {!isExpanded && files.length > 0 && (
        <div className="px-4 pb-4">
          <div className="text-sm text-gray-600">
            {files.length} file{files.length !== 1 ? 's' : ''} attached
            {files.length <= 3 && (
              <span className="ml-2">
                ({files.map(f => f.originalName).join(', ')})
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileManager;