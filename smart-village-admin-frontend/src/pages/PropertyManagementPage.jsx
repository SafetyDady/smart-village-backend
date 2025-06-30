/**
 * Property Management Page for Smart Village Management System
 * Main page for managing village properties and assets
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Search, Plus, Building, MapPin, Users, Filter } from 'lucide-react';
import PropertyList from '../components/properties/PropertyList';
import PropertyFormAdvanced from '../components/properties/PropertyFormAdvanced';

export default function PropertyManagementPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'

  // Mock data for properties
  const mockProperties = [
    {
      id: 'PROP001',
      propertyCode: 'SV-RES-001',
      propertyName: 'บ้านเลขที่ 123 หมู่ 1',
      propertyType: 'residential',
      address: '123 หมู่ 1 ตำบลบ้านใหม่ อำเภอเมือง จังหวัดนครราชสีมา 30000',
      area: 200,
      unit: 'sqm',
      owner: {
        id: 'USR001',
        name: 'นายสมชาย ใจดี',
        contact: '081-234-5678'
      },
      status: 'active',
      registrationDate: '2024-01-15',
      lastUpdated: '2025-06-28',
      description: 'บ้านเดี่ยว 2 ชั้น พร้อมที่ดิน',
      coordinates: {
        lat: 14.9799,
        lng: 102.0977
      }
    },
    {
      id: 'PROP002',
      propertyCode: 'SV-COM-001',
      propertyName: 'ร้านค้าชุมชน หมู่ 2',
      propertyType: 'commercial',
      address: '45 หมู่ 2 ตำบลบ้านใหม่ อำเภอเมือง จังหวัดนครราชสีมา 30000',
      area: 150,
      unit: 'sqm',
      owner: {
        id: 'USR002',
        name: 'นางสาวมาลี รักดี',
        contact: '082-345-6789'
      },
      status: 'active',
      registrationDate: '2024-02-20',
      lastUpdated: '2025-06-25',
      description: 'ร้านค้าขายของชำ และเครื่องใช้ในครัวเรือน',
      coordinates: {
        lat: 14.9850,
        lng: 102.1020
      }
    },
    {
      id: 'PROP003',
      propertyCode: 'SV-AGR-001',
      propertyName: 'นาข้าว หมู่ 3',
      propertyType: 'agricultural',
      address: 'หมู่ 3 ตำบลบ้านใหม่ อำเภอเมือง จังหวัดนครราชสีมา 30000',
      area: 5,
      unit: 'rai',
      owner: {
        id: 'USR003',
        name: 'นายวิชัย เกษตรกร',
        contact: '083-456-7890'
      },
      status: 'active',
      registrationDate: '2024-03-10',
      lastUpdated: '2025-06-20',
      description: 'พื้นที่เพาะปลูกข้าว มีระบบชลประทาน',
      coordinates: {
        lat: 14.9900,
        lng: 102.1100
      }
    },
    {
      id: 'PROP004',
      propertyCode: 'SV-PUB-001',
      propertyName: 'ศาลาประชาคม หมู่ 1',
      propertyType: 'public',
      address: 'หมู่ 1 ตำบลบ้านใหม่ อำเภอเมือง จังหวัดนครราชสีมา 30000',
      area: 300,
      unit: 'sqm',
      owner: {
        id: 'ORG001',
        name: 'องค์การบริหารส่วนตำบลบ้านใหม่',
        contact: '044-123-456'
      },
      status: 'active',
      registrationDate: '2024-01-01',
      lastUpdated: '2025-06-15',
      description: 'ศาลาประชาคมสำหรับจัดกิจกรรมชุมชน',
      coordinates: {
        lat: 14.9750,
        lng: 102.0950
      }
    }
  ];

  // Load mock data
  useEffect(() => {
    const loadProperties = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProperties(mockProperties);
      setLoading(false);
    };

    loadProperties();
  }, []);

  // Filter properties based on search term
  const filteredProperties = properties.filter(property =>
    property.propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.propertyCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.owner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.propertyType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle add new property
  const handleAddProperty = () => {
    setSelectedProperty(null);
    setFormMode('add');
    setIsFormOpen(true);
  };

  // Handle edit property
  const handleEditProperty = (property) => {
    setSelectedProperty(property);
    setFormMode('edit');
    setIsFormOpen(true);
  };

  // Handle delete property
  const handleDeleteProperty = async (propertyId) => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบทรัพย์สินนี้?')) {
      setProperties(prev => prev.filter(p => p.id !== propertyId));
      // TODO: Call API to delete property
    }
  };

  // Handle form submit
  const handleFormSubmit = async (propertyData) => {
    if (formMode === 'add') {
      const newProperty = {
        ...propertyData,
        id: `PROP${String(properties.length + 1).padStart(3, '0')}`,
        registrationDate: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString().split('T')[0]
      };
      setProperties(prev => [...prev, newProperty]);
    } else {
      setProperties(prev => prev.map(p => 
        p.id === selectedProperty.id 
          ? { ...p, ...propertyData, lastUpdated: new Date().toISOString().split('T')[0] }
          : p
      ));
    }
    setIsFormOpen(false);
    setSelectedProperty(null);
  };

  // Get property type statistics
  const getPropertyStats = () => {
    const stats = properties.reduce((acc, property) => {
      acc[property.propertyType] = (acc[property.propertyType] || 0) + 1;
      return acc;
    }, {});

    return {
      total: properties.length,
      residential: stats.residential || 0,
      commercial: stats.commercial || 0,
      agricultural: stats.agricultural || 0,
      public: stats.public || 0,
      active: properties.filter(p => p.status === 'active').length
    };
  };

  const stats = getPropertyStats();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Property Management</h1>
          <p className="text-gray-600 mt-1">Manage village properties and assets</p>
        </div>
        <Button onClick={handleAddProperty} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Property
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Residential</CardTitle>
            <MapPin className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.residential}</div>
            <p className="text-xs text-muted-foreground">
              Houses & homes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commercial</CardTitle>
            <Building className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.commercial}</div>
            <p className="text-xs text-muted-foreground">
              Shops & businesses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agricultural</CardTitle>
            <MapPin className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.agricultural}</div>
            <p className="text-xs text-muted-foreground">
              Farms & fields
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Public</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.public}</div>
            <p className="text-xs text-muted-foreground">
              Community spaces
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Property Management Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Property Management
              </CardTitle>
              <CardDescription>
                Manage village properties and their information
              </CardDescription>
            </div>
            <Button onClick={handleAddProperty} size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Property
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search properties by name, code, address, owner, or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{filteredProperties.length} of {properties.length} properties</span>
            </div>
          </div>

          {/* Property List */}
          <PropertyList
            properties={filteredProperties}
            loading={loading}
            onEdit={handleEditProperty}
            onDelete={handleDeleteProperty}
          />
        </CardContent>
      </Card>

      {/* Property Form Modal */}
      {isFormOpen && (
        <PropertyFormAdvanced
          isOpen={isFormOpen}
          property={selectedProperty}
          onSave={handleFormSubmit}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedProperty(null);
          }}
        />
      )}
    </div>
  );
}

