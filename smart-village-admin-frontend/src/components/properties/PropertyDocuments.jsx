/**
 * Property Documents Component
 * Manages property documents with upload, categorization, and preview functionality
 */

import React, { useState, useRef } from 'react';
import { FileText, Upload, Download, Eye, X, Plus, File, FileImage } from 'lucide-react';

const PropertyDocuments = ({ propertyId, documents = [], onDocumentsChange, readOnly = false }) => {
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({});
  const [filterCategory, setFilterCategory] = useState('all');
  const fileInputRef = useRef(null);

  // Document categories
  const categories = [
    { id: 'all', name: 'All Documents', color: 'gray' },
    { id: 'legal', name: 'Legal Documents', color: 'blue' },
    { id: 'financial', name: 'Financial Records', color: 'green' },
    { id: 'technical', name: 'Technical Drawings', color: 'purple' },
    { id: 'permits', name: 'Permits & Licenses', color: 'orange' },
    { id: 'maintenance', name: 'Maintenance Records', color: 'red' },
    { id: 'other', name: 'Other Documents', color: 'gray' }
  ];

  // Mock document data for demonstration
  const mockDocuments = documents.length > 0 ? documents : [
    {
      id: 'doc1',
      name: 'Property Title Deed',
      category: 'legal',
      type: 'pdf',
      size: '2.4 MB',
      uploadDate: '2025-06-28',
      description: 'Official property title deed document',
      url: '#',
      version: '1.0'
    },
    {
      id: 'doc2',
      name: 'Building Permit',
      category: 'permits',
      type: 'pdf',
      size: '1.8 MB',
      uploadDate: '2025-06-25',
      description: 'Construction permit from local authority',
      url: '#',
      version: '2.1'
    },
    {
      id: 'doc3',
      name: 'Property Valuation Report',
      category: 'financial',
      type: 'pdf',
      size: '3.2 MB',
      uploadDate: '2025-06-20',
      description: 'Professional property valuation assessment',
      url: '#',
      version: '1.0'
    },
    {
      id: 'doc4',
      name: 'Floor Plan',
      category: 'technical',
      type: 'image',
      size: '5.1 MB',
      uploadDate: '2025-06-18',
      description: 'Architectural floor plan drawing',
      url: '#',
      version: '3.0'
    }
  ];

  const [propertyDocuments, setPropertyDocuments] = useState(mockDocuments);

  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-500" />;
      case 'image':
        return <FileImage className="h-8 w-8 text-blue-500" />;
      default:
        return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  const getCategoryColor = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.color : 'gray';
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  const filteredDocuments = filterCategory === 'all' 
    ? propertyDocuments 
    : propertyDocuments.filter(doc => doc.category === filterCategory);

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    files.forEach(file => {
      uploadDocument(file);
    });
  };

  const uploadDocument = (file) => {
    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Simulate upload progress
    setUploadProgress(prev => ({ ...prev, [documentId]: 0 }));
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const newDocument = {
        id: documentId,
        name: file.name.replace(/\.[^/.]+$/, ""),
        category: 'other',
        type: file.type.includes('pdf') ? 'pdf' : file.type.includes('image') ? 'image' : 'other',
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        uploadDate: new Date().toISOString().split('T')[0],
        description: `Uploaded document: ${file.name}`,
        url: e.target.result,
        version: '1.0'
      };

      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 25;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[documentId];
            return newProgress;
          });
          setPropertyDocuments(prev => [...prev, newDocument]);
          onDocumentsChange && onDocumentsChange([...propertyDocuments, newDocument]);
        }
        setUploadProgress(prev => ({ ...prev, [documentId]: Math.min(progress, 100) }));
      }, 300);
    };
    
    reader.readAsDataURL(file);
  };

  const removeDocument = (documentId) => {
    const updatedDocuments = propertyDocuments.filter(doc => doc.id !== documentId);
    setPropertyDocuments(updatedDocuments);
    onDocumentsChange && onDocumentsChange(updatedDocuments);
  };

  const openDocumentModal = (document) => {
    setSelectedDocument(document);
  };

  const closeDocumentModal = () => {
    setSelectedDocument(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Property Documents</h3>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {propertyDocuments.length} documents
          </span>
        </div>
        
        {!readOnly && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Documents
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setFilterCategory(category.id)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filterCategory === category.id
                ? `bg-${category.color}-100 text-${category.color}-800 border-${category.color}-200`
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200'
            } border`}
          >
            {category.name}
            {category.id !== 'all' && (
              <span className="ml-1 text-xs">
                ({propertyDocuments.filter(doc => doc.category === category.id).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([documentId, progress]) => (
            <div key={documentId} className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                <span>Uploading document...</span>
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

      {/* Documents List */}
      {filteredDocuments.length > 0 ? (
        <div className="space-y-3">
          {filteredDocuments.map((document) => (
            <div key={document.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {getFileIcon(document.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-medium text-gray-900 truncate">{document.name}</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${getCategoryColor(document.category)}-100 text-${getCategoryColor(document.category)}-800`}>
                        {getCategoryName(document.category)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{document.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                      <span>Size: {document.size}</span>
                      <span>Version: {document.version}</span>
                      <span>Uploaded: {document.uploadDate}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => openDocumentModal(document)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="View Document"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <a
                    href={document.url}
                    download={document.name}
                    className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                    title="Download Document"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  {!readOnly && (
                    <button
                      onClick={() => removeDocument(document.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Remove Document"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {filterCategory === 'all' ? 'No documents uploaded' : `No ${getCategoryName(filterCategory).toLowerCase()}`}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {readOnly 
              ? `No ${filterCategory === 'all' ? 'documents' : getCategoryName(filterCategory).toLowerCase()} available for this property.`
              : `Get started by uploading ${filterCategory === 'all' ? 'property documents' : getCategoryName(filterCategory).toLowerCase()}.`
            }
          </p>
          {!readOnly && (
            <div className="mt-6">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Documents
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
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Document Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeDocumentModal}></div>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start space-x-3">
                  {getFileIcon(selectedDocument.type)}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{selectedDocument.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{selectedDocument.description}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${getCategoryColor(selectedDocument.category)}-100 text-${getCategoryColor(selectedDocument.category)}-800`}>
                        {getCategoryName(selectedDocument.category)}
                      </span>
                      <span className="text-xs text-gray-500">Version {selectedDocument.version}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={closeDocumentModal}
                  className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="mt-4 bg-gray-100 rounded-lg p-8 text-center">
                {getFileIcon(selectedDocument.type)}
                <p className="mt-2 text-sm text-gray-600">
                  Document preview not available. Click download to view the full document.
                </p>
              </div>

              <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
                <div className="flex space-x-4">
                  <span>Size: {selectedDocument.size}</span>
                  <span>Uploaded: {selectedDocument.uploadDate}</span>
                </div>
                <div className="flex space-x-2">
                  <a
                    href={selectedDocument.url}
                    download={selectedDocument.name}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </a>
                  {!readOnly && (
                    <button
                      onClick={() => {
                        removeDocument(selectedDocument.id);
                        closeDocumentModal();
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

export default PropertyDocuments;

