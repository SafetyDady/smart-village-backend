/**
 * Property Image Gallery Component
 * Manages property images with upload, preview, and gallery functionality
 */

import React, { useState, useRef } from 'react';
import { Upload, X, Eye, Download, Plus, Image as ImageIcon } from 'lucide-react';

const PropertyImageGallery = ({ propertyId, images = [], onImagesChange, readOnly = false }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);

  // Mock image data for demonstration
  const mockImages = images.length > 0 ? images : [
    {
      id: 'img1',
      url: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=200&h=150&fit=crop',
      title: 'Front View',
      description: 'Main entrance of the property',
      uploadDate: '2025-06-28',
      size: '2.4 MB'
    },
    {
      id: 'img2',
      url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=200&h=150&fit=crop',
      title: 'Living Room',
      description: 'Spacious living area with modern furniture',
      uploadDate: '2025-06-28',
      size: '1.8 MB'
    },
    {
      id: 'img3',
      url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=200&h=150&fit=crop',
      title: 'Kitchen',
      description: 'Modern kitchen with island',
      uploadDate: '2025-06-28',
      size: '2.1 MB'
    }
  ];

  const [propertyImages, setPropertyImages] = useState(mockImages);

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        uploadImage(file);
      }
    });
  };

  const uploadImage = (file) => {
    const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Simulate upload progress
    setUploadProgress(prev => ({ ...prev, [imageId]: 0 }));
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const newImage = {
        id: imageId,
        url: e.target.result,
        thumbnail: e.target.result,
        title: file.name.replace(/\.[^/.]+$/, ""),
        description: `Uploaded image: ${file.name}`,
        uploadDate: new Date().toISOString().split('T')[0],
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`
      };

      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[imageId];
            return newProgress;
          });
          setPropertyImages(prev => [...prev, newImage]);
          onImagesChange && onImagesChange([...propertyImages, newImage]);
        }
        setUploadProgress(prev => ({ ...prev, [imageId]: Math.min(progress, 100) }));
      }, 200);
    };
    
    reader.readAsDataURL(file);
  };

  const removeImage = (imageId) => {
    const updatedImages = propertyImages.filter(img => img.id !== imageId);
    setPropertyImages(updatedImages);
    onImagesChange && onImagesChange(updatedImages);
  };

  const openImageModal = (image) => {
    setSelectedImage(image);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ImageIcon className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Property Images</h3>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {propertyImages.length} images
          </span>
        </div>
        
        {!readOnly && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Images
          </button>
        )}
      </div>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([imageId, progress]) => (
            <div key={imageId} className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                <span>Uploading image...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Gallery */}
      {propertyImages.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {propertyImages.map((image) => (
            <div key={image.id} className="relative group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-w-4 aspect-h-3">
                <img
                  src={image.thumbnail}
                  alt={image.title}
                  className="w-full h-32 object-cover"
                />
              </div>
              
              {/* Image Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                  <button
                    onClick={() => openImageModal(image)}
                    className="p-2 bg-white rounded-full text-gray-700 hover:text-blue-600 transition-colors"
                    title="View Image"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <a
                    href={image.url}
                    download={image.title}
                    className="p-2 bg-white rounded-full text-gray-700 hover:text-green-600 transition-colors"
                    title="Download Image"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  {!readOnly && (
                    <button
                      onClick={() => removeImage(image.id)}
                      className="p-2 bg-white rounded-full text-gray-700 hover:text-red-600 transition-colors"
                      title="Remove Image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Image Info */}
              <div className="p-3">
                <h4 className="text-sm font-medium text-gray-900 truncate">{image.title}</h4>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{image.description}</p>
                <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                  <span>{image.uploadDate}</span>
                  <span>{image.size}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No images uploaded</h3>
          <p className="mt-1 text-sm text-gray-500">
            {readOnly ? 'No images available for this property.' : 'Get started by uploading property images.'}
          </p>
          {!readOnly && (
            <div className="mt-6">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Images
              </button>
            </div>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeImageModal}></div>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{selectedImage.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{selectedImage.description}</p>
                </div>
                <button
                  onClick={closeImageModal}
                  className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="mt-4">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.title}
                  className="w-full h-auto max-h-96 object-contain rounded-lg"
                />
              </div>

              <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
                <div className="flex space-x-4">
                  <span>Uploaded: {selectedImage.uploadDate}</span>
                  <span>Size: {selectedImage.size}</span>
                </div>
                <div className="flex space-x-2">
                  <a
                    href={selectedImage.url}
                    download={selectedImage.title}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </a>
                  {!readOnly && (
                    <button
                      onClick={() => {
                        removeImage(selectedImage.id);
                        closeImageModal();
                      }}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyImageGallery;

