import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, MapPin, Users, Building, Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { useVillages } from '../hooks/useVillages';
import VillageForm from '../components/VillageForm';

const VillageManagementPage = () => {
  const { user, hasPermission } = useAuth();
  const { villages, loading, error, fetchVillages, createVillage, updateVillage, deleteVillage } = useVillages();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedVillage, setSelectedVillage] = useState(null);

  useEffect(() => {
    fetchVillages();
  }, [fetchVillages]);

  const handleVillageCreated = (newVillage) => {
    fetchVillages(); // Refresh the list
    setShowCreateForm(false);
  };

  const handleVillageUpdated = (updatedVillage) => {
    fetchVillages(); // Refresh the list
  };

  const handleEditVillage = (village) => {
    setSelectedVillage(village);
    setShowEditForm(true);
  };

  const handleDeleteVillage = async (village) => {
    const confirmed = window.confirm(`คุณต้องการลบหมู่บ้าน "${village.name}" หรือไม่?`);
    
    if (confirmed) {
      try {
        await deleteVillage(village.id);
        // Refresh villages list
        await fetchVillages();
      } catch (error) {
        console.error('Error deleting village:', error);
        alert('เกิดข้อผิดพลาดในการลบหมู่บ้าน');
      }
    }
  };

  const handleCloseForm = () => {
    setShowCreateForm(false);
    setShowEditForm(false);
    setSelectedVillage(null);
  };

  const filteredVillages = villages.filter(village => {
    const matchesSearch = village.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         village.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         village.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProvince = !selectedProvince || village.province === selectedProvince;
    return matchesSearch && matchesProvince;
  });

  const provinces = [...new Set(villages.map(v => v.province))];

  const VillageCard = ({ village }) => (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">
              {village.name}
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 mt-1">
              รหัส: {village.code}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant={village.is_active ? "default" : "secondary"}>
              {village.is_active ? 'ใช้งาน' : 'ไม่ใช้งาน'}
            </Badge>
            <Badge variant={village.is_verified ? "success" : "warning"}>
              {village.is_verified ? 'ยืนยันแล้ว' : 'รอยืนยัน'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-gray-700 line-clamp-2">
            {village.description}
          </p>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>{village.province}, {village.district}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-blue-500" />
              <span>{village.total_properties} ทรัพย์สิน</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-500" />
              <span>{village.total_residents} ผู้อยู่อาศัย</span>
            </div>
          </div>
          
          <div className="text-xs text-gray-500">
            ติดต่อ: {village.contact_person} | {village.contact_phone}
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button size="sm" variant="outline" className="flex-1">
              <Eye className="h-4 w-4 mr-1" />
              ดูรายละเอียด
            </Button>
            {hasPermission('villages.update') && (
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1"
                onClick={() => handleEditVillage(village)}
              >
                <Edit className="h-4 w-4 mr-1" />
                แก้ไข
              </Button>
            )}
            {hasPermission('villages.delete') && (
              <Button 
                size="sm" 
                variant="destructive" 
                className="flex-1"
                onClick={() => handleDeleteVillage(village)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                ลบ
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const VillageStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">หมู่บ้านทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900">{villages.length}</p>
            </div>
            <Building className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">หมู่บ้านที่ใช้งาน</p>
              <p className="text-2xl font-bold text-green-600">
                {villages.filter(v => v.is_active).length}
              </p>
            </div>
            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
              <div className="h-4 w-4 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">ทรัพย์สินรวม</p>
              <p className="text-2xl font-bold text-blue-600">
                {villages.reduce((sum, v) => sum + v.total_properties, 0)}
              </p>
            </div>
            <Building className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">ผู้อยู่อาศัยรวม</p>
              <p className="text-2xl font-bold text-purple-600">
                {villages.reduce((sum, v) => sum + v.total_residents, 0)}
              </p>
            </div>
            <Users className="h-8 w-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการหมู่บ้าน</h1>
          <p className="text-gray-600 mt-1">จัดการข้อมูลหมู่บ้านในระบบ Smart Village</p>
        </div>
        {hasPermission('villages.create') && (
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            เพิ่มหมู่บ้านใหม่
          </Button>
        )}
      </div>

      {/* Statistics */}
      <VillageStats />

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="ค้นหาหมู่บ้าน (ชื่อ, รหัส, คำอธิบาย)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">ทุกจังหวัด</option>
                {provinces.map(province => (
                  <option key={province} value={province}>{province}</option>
                ))}
              </select>
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              ตัวกรอง
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Villages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVillages.map(village => (
          <VillageCard key={village.id} village={village} />
        ))}
      </div>

      {filteredVillages.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบหมู่บ้าน</h3>
            <p className="text-gray-600 mb-4">
              ไม่พบหมู่บ้านที่ตรงกับเงื่อนไขการค้นหา
            </p>
            {hasPermission('villages.create') && (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มหมู่บ้านใหม่
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Village Forms */}
      <VillageForm
        village={null}
        isOpen={showCreateForm}
        onClose={handleCloseForm}
        onSuccess={handleVillageCreated}
      />

      <VillageForm
        village={selectedVillage}
        isOpen={showEditForm}
        onClose={handleCloseForm}
        onSuccess={handleVillageUpdated}
      />
    </div>
  );
};

export default VillageManagementPage;

