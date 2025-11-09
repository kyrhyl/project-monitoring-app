'use client';

import React, { useState, useRef, useCallback } from 'react';
import { MapPinIcon, PhotoIcon, CalendarIcon, XMarkIcon, EyeIcon } from '@heroicons/react/24/outline';
import { CameraIcon } from '@heroicons/react/24/solid';

export interface GeotaggedPhoto {
  _id?: string;
  filename: string;
  originalName: string;
  cloudinaryId: string;
  url: string;
  thumbnailUrl: string;
  mimetype: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
  description?: string;
  geoData?: {
    latitude: number;
    longitude: number;
    altitude?: number;
    accuracy?: number;
    address?: string;
    city?: string;
    country?: string;
  };
  exifData?: {
    make?: string;
    model?: string;
    dateTime?: string;
    orientation?: number;
    flash?: boolean;
  };
}

export interface GeoPhotoGalleryProps {
  projectId: string;
  onPhotosUploaded?: (photos: GeotaggedPhoto[]) => void;
  maxPhotos?: number;
  maxFileSize?: number;
  compact?: boolean;
  onViewAllPhotos?: () => void;
}

const GeoPhotoGallery: React.FC<GeoPhotoGalleryProps> = ({
  projectId,
  onPhotosUploaded,
  maxPhotos = 50,
  maxFileSize = 25, // 25MB for high-quality photos
  compact = false,
  onViewAllPhotos
}) => {
  const [photos, setPhotos] = useState<GeotaggedPhoto[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<GeotaggedPhoto | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'location' | 'name'>('date');
  const [viewMode, setViewMode] = useState<'grid' | 'timeline' | 'map'>('grid');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load photos on component mount
  React.useEffect(() => {
    fetchPhotos();
  }, [projectId]);

  const fetchPhotos = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/photos`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.photos) {
          setPhotos(data.photos);
        } else {
          setPhotos([]);
        }
      } else {
        console.log(`Photos API not available: ${response.status}`);
        setPhotos([]);
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
      setPhotos([]);
    }
  };

  const extractExifData = (file: File): Promise<any> => {
    return new Promise((resolve) => {
      // Simple EXIF extraction using FileReader
      const reader = new FileReader();
      reader.onload = () => {
        // This is a simplified version - in production, you'd use a proper EXIF library
        resolve({
          make: 'Unknown',
          model: 'Unknown',
          dateTime: new Date().toISOString(),
          orientation: 1
        });
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const getCurrentLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      // Using a free geocoding service - you might want to use Google Maps API in production
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      const data = await response.json();
      return {
        address: data.locality || data.city || 'Unknown',
        city: data.city || data.locality || 'Unknown',
        country: data.countryName || 'Unknown'
      };
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return {
        address: 'Unknown',
        city: 'Unknown', 
        country: 'Unknown'
      };
    }
  };

  const handleFileUpload = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (fileArray.length === 0) {
      alert('Please select image files only.');
      return;
    }

    if (photos.length + fileArray.length > maxPhotos) {
      alert(`Maximum ${maxPhotos} photos allowed per project.`);
      return;
    }

    setIsUploading(true);

    try {
      // Get current location
      let geoData = null;
      try {
        const position = await getCurrentLocation();
        const locationInfo = await reverseGeocode(
          position.coords.latitude,
          position.coords.longitude
        );
        
        geoData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude,
          accuracy: position.coords.accuracy,
          ...locationInfo
        };
      } catch (geoError) {
        console.warn('Could not get location:', geoError);
        // Continue without geolocation
      }

      const uploadedPhotos: GeotaggedPhoto[] = [];

      for (const file of fileArray) {
        if (file.size > maxFileSize * 1024 * 1024) {
          alert(`${file.name} is too large. Max size is ${maxFileSize}MB.`);
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', projectId);
        formData.append('type', 'geotagged-photo');
        
        if (geoData) {
          formData.append('geoData', JSON.stringify(geoData));
        }

        // Extract EXIF data
        const exifData = await extractExifData(file);
        formData.append('exifData', JSON.stringify(exifData));

        const response = await fetch('/api/upload/photo', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          uploadedPhotos.push(result.photo);
        } else {
          const error = await response.json();
          alert(`Failed to upload ${file.name}: ${error.message}`);
        }
      }

      if (uploadedPhotos.length > 0) {
        const newPhotos = [...photos, ...uploadedPhotos];
        setPhotos(newPhotos);
        onPhotosUploaded?.(uploadedPhotos);
        
        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }

    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [photos.length, maxPhotos, maxFileSize, projectId, onPhotosUploaded]);

  const sortedPhotos = React.useMemo(() => {
    const sorted = [...photos];
    switch (sortBy) {
      case 'date':
        return sorted.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      case 'location':
        return sorted.sort((a, b) => {
          const aLocation = a.geoData?.city || 'Unknown';
          const bLocation = b.geoData?.city || 'Unknown';
          return aLocation.localeCompare(bLocation);
        });
      case 'name':
        return sorted.sort((a, b) => a.originalName.localeCompare(b.originalName));
      default:
        return sorted;
    }
  }, [photos, sortBy]);

  const deletePhoto = async (photoId: string) => {
    try {
      const response = await fetch(`/api/upload/photo?photoId=${photoId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPhotos(photos.filter(p => p._id !== photoId));
      } else {
        alert('Failed to delete photo');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete photo');
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${compact ? 'p-4' : 'p-6'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between ${compact ? 'mb-4' : 'mb-6'}`}>
        <div className="flex items-center space-x-3">
          <CameraIcon className={`${compact ? 'h-5 w-5' : 'h-6 w-6'} text-blue-600`} />
          <h3 className={`${compact ? 'text-base' : 'text-lg'} font-semibold text-gray-900`}>
            {compact ? 'Photos' : 'Project Photos'}
          </h3>
          {photos.length > 0 && (
            <span className={`bg-blue-100 text-blue-800 font-medium px-2.5 py-0.5 rounded-full ${compact ? 'text-xs' : 'text-sm'}`}>
              {photos.length}
            </span>
          )}
        </div>

        {!compact && (
          <div className="flex items-center space-x-3">
            {/* Sort Options */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm border border-gray-300 rounded px-3 py-1"
            >
              <option value="date">Sort by Date</option>
              <option value="location">Sort by Location</option>
              <option value="name">Sort by Name</option>
            </select>

            {/* View Mode */}
            <div className="flex rounded-md border border-gray-300">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 text-sm ${viewMode === 'grid' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1 text-sm border-l ${viewMode === 'timeline' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
              >
                Timeline
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-1 text-sm border-l ${viewMode === 'map' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
              >
                Map
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Upload Area - Hidden in compact mode */}
      {!compact && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6 hover:border-gray-400 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          />
          
          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          
          {isUploading ? (
            <div className="text-blue-600">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p>Uploading photos...</p>
            </div>
          ) : (
            <>
              <p className="text-lg text-gray-600 mb-2">
                Upload geotagged photos
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Photos will be tagged with your current location • Max {maxFileSize}MB per photo
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Choose Photos
              </button>
            </>
          )}
        </div>
      )}

      {/* Photo Display */}
      {photos.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <CameraIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <p>No photos uploaded yet</p>
          <p className="text-sm">Upload your first geotagged photo to get started</p>
        </div>
      ) : (
        <div>
          {viewMode === 'grid' && (
            <>
              <div className={`grid gap-4 ${compact ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'}`}>
                {(compact ? sortedPhotos.slice(0, 8) : sortedPhotos).map((photo, index) => (
                  <div key={photo._id || `photo-${index}-${photo.filename}`} className="group relative bg-gray-100 rounded-lg overflow-hidden aspect-square">
                    <img
                      src={photo.thumbnailUrl || photo.url}
                      alt={photo.originalName}
                      className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-200"
                      onClick={() => setSelectedPhoto(photo)}
                    />
                    
                    {/* Overlay with info */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200">
                      <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setSelectedPhoto(photo)}
                          className="p-1 bg-white text-gray-700 rounded-full hover:bg-gray-100"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        {!compact && (
                          <button
                            onClick={() => photo._id && deletePhoto(photo._id)}
                            className="p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Location indicator */}
                    {photo.geoData && (
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded flex items-center">
                        <MapPinIcon className="h-3 w-3 mr-1" />
                        {photo.geoData.city}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* View All Photos link in compact mode */}
              {compact && sortedPhotos.length > 8 && (
                <div className="text-center mt-4">
                  <button
                    onClick={() => {
                      if (onViewAllPhotos) {
                        onViewAllPhotos();
                      }
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View All {sortedPhotos.length} Photos →
                  </button>
                </div>
              )}
            </>
          )}

          {viewMode === 'timeline' && (
            <div className="space-y-6">
              {Object.entries(
                sortedPhotos.reduce((groups: { [key: string]: GeotaggedPhoto[] }, photo) => {
                  const date = new Date(photo.uploadedAt).toDateString();
                  if (!groups[date]) groups[date] = [];
                  groups[date].push(photo);
                  return groups;
                }, {})
              ).map(([date, dayPhotos]) => (
                <div key={date}>
                  <div className="flex items-center mb-4">
                    <CalendarIcon className="h-5 w-5 text-gray-500 mr-2" />
                    <h4 className="text-lg font-medium text-gray-900">{date}</h4>
                    <div className="flex-1 border-b border-gray-200 ml-4"></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
                    {dayPhotos.map((photo, photoIndex) => (
                      <div key={photo._id || `day-photo-${date}-${photoIndex}-${photo.filename}`} className="relative bg-gray-100 rounded overflow-hidden aspect-square">
                        <img
                          src={photo.thumbnailUrl || photo.url}
                          alt={photo.originalName}
                          className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                          onClick={() => setSelectedPhoto(photo)}
                        />
                        {photo.geoData && (
                          <div className="absolute bottom-1 left-1 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded flex items-center">
                            <MapPinIcon className="h-2 w-2 mr-0.5" />
                            {photo.geoData.city}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'map' && (
            <div className="bg-gray-100 rounded-lg p-8 text-center">
              <MapPinIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-600">Map view coming soon!</p>
              <p className="text-sm text-gray-500">This will show your photos on an interactive map</p>
            </div>
          )}
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{selectedPhoto.originalName}</h3>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="flex">
              <div className="flex-1">
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.originalName}
                  className="w-full h-auto"
                />
              </div>
              
              <div className="w-80 p-4 border-l bg-gray-50 overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Photo Details</h4>
                    <div className="text-sm space-y-1">
                      <p><span className="text-gray-500">Uploaded:</span> {new Date(selectedPhoto.uploadedAt).toLocaleString()}</p>
                      <p><span className="text-gray-500">Size:</span> {(selectedPhoto.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>

                  {selectedPhoto.geoData && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        Location
                      </h4>
                      <div className="text-sm space-y-1">
                        <p><span className="text-gray-500">Address:</span> {selectedPhoto.geoData.address}</p>
                        <p><span className="text-gray-500">City:</span> {selectedPhoto.geoData.city}</p>
                        <p><span className="text-gray-500">Country:</span> {selectedPhoto.geoData.country}</p>
                        <p><span className="text-gray-500">Coordinates:</span> {selectedPhoto.geoData.latitude.toFixed(6)}, {selectedPhoto.geoData.longitude.toFixed(6)}</p>
                        {selectedPhoto.geoData.accuracy && (
                          <p><span className="text-gray-500">Accuracy:</span> ±{selectedPhoto.geoData.accuracy}m</p>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedPhoto.exifData && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Camera Info</h4>
                      <div className="text-sm space-y-1">
                        {selectedPhoto.exifData.make && (
                          <p><span className="text-gray-500">Camera:</span> {selectedPhoto.exifData.make} {selectedPhoto.exifData.model}</p>
                        )}
                        {selectedPhoto.exifData.dateTime && (
                          <p><span className="text-gray-500">Taken:</span> {new Date(selectedPhoto.exifData.dateTime).toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <button
                      onClick={() => selectedPhoto._id && deletePhoto(selectedPhoto._id)}
                      className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
                    >
                      Delete Photo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeoPhotoGallery;