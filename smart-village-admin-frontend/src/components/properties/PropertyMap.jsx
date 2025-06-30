/**
 * Property Map Component
 * Interactive map for property location visualization and management
 */

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Maximize2, Minimize2, Search, Filter, Home, Building2, Tractor, Users } from 'lucide-react';

const PropertyMap = ({ propertyId, properties = [], selectedProperty, onPropertySelect, readOnly = false }) => {
  const [mapView, setMapView] = useState('satellite'); // satellite, street, hybrid
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [mapCenter, setMapCenter] = useState({ lat: 14.9799, lng: 102.0977 }); // Nakhon Ratchasima
  const [zoom, setZoom] = useState(15);

  // Mock property data with coordinates
  const mockProperties = properties.length > 0 ? properties : [
    {
      id: 'SV-RES-001',
      propertyName: 'บ้านเลขที่ 123 หมู่ 1',
      propertyType: 'residential',
      coordinates: { lat: 14.9799, lng: 102.0977 },
      owner: { name: 'นายสมชาย ใจดี' },
      area: 200,
      unit: 'sqm',
      status: 'active'
    },
    {
      id: 'SV-COM-001',
      propertyName: 'ร้านค้าหมู่ 2',
      propertyType: 'commercial',
      coordinates: { lat: 14.9820, lng: 102.0990 },
      owner: { name: 'นางสาวมาลี รักดี' },
      area: 150,
      unit: 'sqm',
      status: 'active'
    },
    {
      id: 'SV-AGR-001',
      propertyName: 'ไร่นาหมู่ 3',
      propertyType: 'agricultural',
      coordinates: { lat: 14.9750, lng: 102.1020 },
      owner: { name: 'นายวิชัย เกษตรกร' },
      area: 5,
      unit: 'rai',
      status: 'active'
    },
    {
      id: 'SV-PUB-001',
      propertyName: 'ศาลาประชาคม',
      propertyType: 'public',
      coordinates: { lat: 14.9830, lng: 102.0950 },
      owner: { name: 'องค์การบริหารส่วนตำบลบ้านใหม่' },
      area: 300,
      unit: 'sqm',
      status: 'active'
    },
    {
      id: 'SV-TEST-001',
      propertyName: 'บ้านทดสอบ หมู่ 4',
      propertyType: 'residential',
      coordinates: { lat: 14.9780, lng: 102.1000 },
      owner: { name: 'นายทดสอบ ระบบ' },
      area: 180,
      unit: 'sqm',
      status: 'active'
    }
  ];

  const propertyTypes = [
    { id: 'all', name: 'All Properties', icon: MapPin, color: 'gray' },
    { id: 'residential', name: 'Residential', icon: Home, color: 'blue' },
    { id: 'commercial', name: 'Commercial', icon: Building2, color: 'green' },
    { id: 'agricultural', name: 'Agricultural', icon: Tractor, color: 'yellow' },
    { id: 'public', name: 'Public', icon: Users, color: 'purple' }
  ];

  const getPropertyIcon = (type) => {
    const typeConfig = propertyTypes.find(t => t.id === type);
    if (!typeConfig) return { icon: MapPin, color: 'gray' };
    return { icon: typeConfig.icon, color: typeConfig.color };
  };

  const getPropertyColor = (type) => {
    switch (type) {
      case 'residential':
        return 'bg-blue-500 border-blue-600';
      case 'commercial':
        return 'bg-green-500 border-green-600';
      case 'agricultural':
        return 'bg-yellow-500 border-yellow-600';
      case 'public':
        return 'bg-purple-500 border-purple-600';
      default:
        return 'bg-gray-500 border-gray-600';
    }
  };

  const filteredProperties = mockProperties.filter(property => {
    const matchesSearch = property.propertyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         property.owner.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || property.propertyType === filterType;
    return matchesSearch && matchesFilter;
  });

  const handlePropertyClick = (property) => {
    if (onPropertySelect) {
      onPropertySelect(property);
    }
    setMapCenter(property.coordinates);
    setZoom(18);
  };

  const handleMapViewChange = (view) => {
    setMapView(view);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const resetMapView = () => {
    setMapCenter({ lat: 14.9799, lng: 102.0977 });
    setZoom(15);
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'space-y-6'}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Property Map</h3>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {filteredProperties.length} properties
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={resetMapView}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
            title="Reset Map View"
          >
            <Navigation className="h-4 w-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search properties by name or owner..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {propertyTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        {/* Map View */}
        <div className="flex rounded-md shadow-sm">
          <button
            onClick={() => handleMapViewChange('satellite')}
            className={`px-3 py-2 text-sm font-medium rounded-l-md border ${
              mapView === 'satellite'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => handleMapViewChange('street')}
            className={`px-3 py-2 text-sm font-medium border-t border-b ${
              mapView === 'street'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Street
          </button>
          <button
            onClick={() => handleMapViewChange('hybrid')}
            className={`px-3 py-2 text-sm font-medium rounded-r-md border ${
              mapView === 'hybrid'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Hybrid
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className={`${isFullscreen ? 'h-screen' : 'h-96'} bg-gray-100 rounded-lg border border-gray-200 relative overflow-hidden`}>
        {/* Mock Map Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-blue-100">
          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="grid grid-cols-20 grid-rows-20 h-full w-full">
              {Array.from({ length: 400 }).map((_, i) => (
                <div key={i} className="border border-gray-300"></div>
              ))}
            </div>
          </div>

          {/* Property Markers */}
          {filteredProperties.map((property, index) => {
            const { icon: Icon, color } = getPropertyIcon(property.propertyType);
            const isSelected = selectedProperty?.id === property.id;
            
            // Calculate position based on coordinates (mock positioning)
            const x = ((property.coordinates.lng - 102.0900) * 2000) + 50;
            const y = ((14.9850 - property.coordinates.lat) * 2000) + 50;
            
            return (
              <div
                key={property.id}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 ${
                  isSelected ? 'scale-125 z-20' : 'hover:scale-110 z-10'
                }`}
                style={{
                  left: `${Math.max(5, Math.min(95, (x / 400) * 100))}%`,
                  top: `${Math.max(5, Math.min(95, (y / 400) * 100))}%`
                }}
                onClick={() => handlePropertyClick(property)}
              >
                {/* Marker */}
                <div className={`w-8 h-8 rounded-full border-2 ${getPropertyColor(property.propertyType)} shadow-lg flex items-center justify-center`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                
                {/* Property Info Popup */}
                {isSelected && (
                  <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-48 z-30">
                    <div className="text-sm font-medium text-gray-900">{property.propertyName}</div>
                    <div className="text-xs text-gray-500 mt-1">{property.owner.name}</div>
                    <div className="text-xs text-gray-500">
                      {property.area} {property.unit === 'sqm' ? 'ตร.ม.' : property.unit === 'rai' ? 'ไร่' : 'งาน'}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      {property.coordinates.lat.toFixed(6)}, {property.coordinates.lng.toFixed(6)}
                    </div>
                    {/* Arrow pointing down */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Map Center Indicator */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-1 h-1 bg-red-500 rounded-full"></div>
          </div>
        </div>

        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2">
          <button
            onClick={() => setZoom(Math.min(20, zoom + 1))}
            className="w-8 h-8 bg-white rounded shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50"
          >
            +
          </button>
          <button
            onClick={() => setZoom(Math.max(10, zoom - 1))}
            className="w-8 h-8 bg-white rounded shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50"
          >
            −
          </button>
        </div>

        {/* Map Info */}
        <div className="absolute bottom-4 left-4 bg-white rounded shadow-md p-2 text-xs text-gray-600">
          <div>Center: {mapCenter.lat.toFixed(6)}, {mapCenter.lng.toFixed(6)}</div>
          <div>Zoom: {zoom}</div>
          <div>View: {mapView}</div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-white rounded shadow-md p-3">
          <div className="text-xs font-medium text-gray-900 mb-2">Property Types</div>
          <div className="space-y-1">
            {propertyTypes.slice(1).map((type) => {
              const Icon = type.icon;
              return (
                <div key={type.id} className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded-full border ${getPropertyColor(type.id)} flex items-center justify-center`}>
                    <Icon className="h-2 w-2 text-white" />
                  </div>
                  <span className="text-xs text-gray-600">{type.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Property List */}
      {!isFullscreen && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h4 className="text-lg font-medium text-gray-900">Properties on Map</h4>
          </div>
          <div className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
            {filteredProperties.map((property) => {
              const { icon: Icon } = getPropertyIcon(property.propertyType);
              const isSelected = selectedProperty?.id === property.id;
              
              return (
                <div
                  key={property.id}
                  className={`p-4 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handlePropertyClick(property)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full border-2 ${getPropertyColor(property.propertyType)} flex items-center justify-center`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {property.propertyName}
                      </div>
                      <div className="text-sm text-gray-500">{property.owner.name}</div>
                      <div className="text-xs text-gray-400">
                        {property.coordinates.lat.toFixed(6)}, {property.coordinates.lng.toFixed(6)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-900">
                        {property.area} {property.unit === 'sqm' ? 'ตร.ม.' : property.unit === 'rai' ? 'ไร่' : 'งาน'}
                      </div>
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        property.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {property.status}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyMap;

