/**
 * Advanced Property Form Component
 * Enhanced property form with tabs for images, documents, history, and analytics
 */

import React, { useState, useEffect } from 'react';
import { X, Home, Building2, Tractor, Users, MapPin, User, FileText, Camera, History, BarChart3, Save } from 'lucide-react';
import PropertyImageGallery from './PropertyImageGallery';
import PropertyDocuments from './PropertyDocuments';
import PropertyAnalytics from './PropertyAnalytics';
import PropertyMap from './PropertyMap';

const PropertyFormAdvanced = ({ isOpen, onClose, property = null, onSave }) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    propertyCode: '',
    propertyName: '',
    propertyType: 'residential',
    address: '',
    area: '',
    unit: 'sqm',
    ownerName: '',
    contactInfo: '',
    isActive: true,
    description: '',
    latitude: '',
    longitude: ''
  });

  const tabs = [
    { id: 'basic', name: 'Basic Info', icon: Home },
    { id: 'images', name: 'Images', icon: Camera },
    { id: 'documents', name: 'Documents', icon: FileText },
    { id: 'map', name: 'Map', icon: MapPin },
    { id: 'analytics', name: 'Analytics', icon: BarChart3 },
    { id: 'history', name: 'History', icon: History }
  ];

  const propertyTypes = [
    { id: 'residential', name: 'ที่อยู่อาศัย', icon: Home, description: 'Houses, condos, apartments' },
    { id: 'commercial', name: 'พาณิชยกรรม', icon: Building2, description: 'Shops, offices, businesses' },
    { id: 'agricultural', name: 'เกษตรกรรม', icon: Tractor, description: 'Farms, plantations, fields' },
    { id: 'public', name: 'สาธารณะ', icon: Users, description: 'Community spaces, parks' }
  ];

  const areaUnits = [
    { id: 'sqm', name: 'Square Meters (ตร.ม.)' },
    { id: 'rai', name: 'Rai (ไร่)' },
    { id: 'ngan', name: 'Ngan (งาน)' }
  ];

  useEffect(() => {
    if (property) {
      setFormData({
        propertyCode: property.propertyCode || '',
        propertyName: property.propertyName || '',
        propertyType: property.propertyType || 'residential',
        address: property.address || '',
        area: property.area?.toString() || '',
        unit: property.unit || 'sqm',
        ownerName: property.owner?.name || '',
        contactInfo: property.owner?.contact || '',
        isActive: property.status === 'active',
        description: property.description || '',
        latitude: property.coordinates?.lat?.toString() || '',
        longitude: property.coordinates?.lng?.toString() || ''
      });
    } else {
      setFormData({
        propertyCode: '',
        propertyName: '',
        propertyType: 'residential',
        address: '',
        area: '',
        unit: 'sqm',
        ownerName: '',
        contactInfo: '',
        isActive: true,
        description: '',
        latitude: '',
        longitude: ''
      });
    }
  }, [property]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const propertyData = {
        id: property?.id || `PROP${Date.now()}`,
        propertyCode: formData.propertyCode,
        propertyName: formData.propertyName,
        propertyType: formData.propertyType,
        address: formData.address,
        area: parseFloat(formData.area) || 0,
        unit: formData.unit,
        owner: {
          id: property?.owner?.id || `USR${Date.now()}`,
          name: formData.ownerName,
          contact: formData.contactInfo
        },
        status: formData.isActive ? 'active' : 'inactive',
        description: formData.description,
        coordinates: {
          lat: parseFloat(formData.latitude) || null,
          lng: parseFloat(formData.longitude) || null
        },
        lastUpdated: new Date().toISOString().split('T')[0]
      };

      await onSave(propertyData);
      onClose();
    } catch (error) {
      console.error('Error saving property:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setActiveTab('basic');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                  <Home className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {property ? 'Edit Property' : 'Add New Property'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {property ? 'Update the property information' : 'Create a new property record for the village'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="mt-6">
              <nav className="flex space-x-8" aria-label="Tabs">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            {activeTab === 'basic' && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Home className="h-5 w-5 mr-2 text-blue-600" />
                    Basic Information
                  </h4>
                  <p className="text-sm text-gray-600 mb-6">Enter the basic details of the property</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Property Code *
                      </label>
                      <input
                        type="text"
                        value={formData.propertyCode}
                        onChange={(e) => handleInputChange('propertyCode', e.target.value)}
                        placeholder="e.g., SV-RES-001"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Property Name *
                      </label>
                      <input
                        type="text"
                        value={formData.propertyName}
                        onChange={(e) => handleInputChange('propertyName', e.target.value)}
                        placeholder="e.g., บ้านเลขที่ 123 หมู่ 1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Property Type *
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {propertyTypes.map((type) => {
                          const Icon = type.icon;
                          return (
                            <button
                              key={type.id}
                              type="button"
                              onClick={() => handleInputChange('propertyType', type.id)}
                              className={`p-3 border rounded-lg text-left transition-colors ${
                                formData.propertyType === type.id
                                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                            >
                              <Icon className="h-6 w-6 mb-2" />
                              <div className="font-medium text-sm">{type.name}</div>
                              <div className="text-xs text-gray-500">{type.description}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address *
                      </label>
                      <textarea
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder="Enter full address"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Area *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.area}
                        onChange={(e) => handleInputChange('area', e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unit *
                      </label>
                      <select
                        value={formData.unit}
                        onChange={(e) => handleInputChange('unit', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        {areaUnits.map((unit) => (
                          <option key={unit.id} value={unit.id}>
                            {unit.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Owner Information */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2 text-blue-600" />
                    Owner Information
                  </h4>
                  <p className="text-sm text-gray-600 mb-6">Enter the property owner details</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Owner Name *
                      </label>
                      <input
                        type="text"
                        value={formData.ownerName}
                        onChange={(e) => handleInputChange('ownerName', e.target.value)}
                        placeholder="e.g., นายสมชาย ใจดี"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Information *
                      </label>
                      <input
                        type="text"
                        value={formData.contactInfo}
                        onChange={(e) => handleInputChange('contactInfo', e.target.value)}
                        placeholder="e.g., 081-234-5678"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                    Additional Information
                  </h4>
                  <p className="text-sm text-gray-600 mb-6">Optional details and settings</p>
                  
                  <div className="space-y-6">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) => handleInputChange('isActive', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                        Active Property
                      </label>
                      <span className="ml-2 text-sm text-gray-500">Enable this property for active use</span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Additional notes about the property..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Latitude
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={formData.latitude}
                          onChange={(e) => handleInputChange('latitude', e.target.value)}
                          placeholder="14.9799"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Longitude
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={formData.longitude}
                          onChange={(e) => handleInputChange('longitude', e.target.value)}
                          placeholder="102.0977"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {activeTab === 'images' && (
              <PropertyImageGallery
                propertyId={property?.id}
                images={property?.images || []}
                onImagesChange={(images) => {
                  // Handle images change
                  console.log('Images updated:', images);
                }}
                readOnly={false}
              />
            )}

            {activeTab === 'documents' && (
              <PropertyDocuments
                propertyId={property?.id}
                documents={property?.documents || []}
                onDocumentsChange={(documents) => {
                  // Handle documents change
                  console.log('Documents updated:', documents);
                }}
                readOnly={false}
              />
            )}

            {activeTab === 'map' && (
              <PropertyMap
                propertyId={property?.id}
                properties={property ? [property] : []}
                selectedProperty={property}
                onPropertySelect={(selectedProp) => {
                  // Handle property selection from map
                  console.log('Property selected from map:', selectedProp);
                }}
                readOnly={false}
              />
            )}

            {activeTab === 'analytics' && (
              <PropertyAnalytics
                propertyId={property?.id}
                properties={property ? [property] : []}
              />
            )}

            {activeTab === 'history' && (
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <History className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Property History</h3>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <History className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Property History</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Track all changes and updates to this property over time.
                  </p>
                  <p className="mt-2 text-xs text-gray-400">
                    Feature coming soon in advanced version.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            {activeTab === 'basic' ? (
              <>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : (property ? 'Update Property' : 'Create Property')}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleClose}
                className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyFormAdvanced;

