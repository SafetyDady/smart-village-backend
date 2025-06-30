import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import VillageCard from './VillageCard';
import VillageForm from './VillageForm';
import { Plus, Search, RefreshCw, AlertCircle, CheckCircle, MapPin } from 'lucide-react';

const VillageList = ({ 
  villages, 
  loading, 
  error, 
  onRefresh, 
  onCreate, 
  onUpdate, 
  onDelete 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVillage, setEditingVillage] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Filter villages based on search term
  const filteredVillages = villages.filter(village =>
    village.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async (villageData) => {
    setFormLoading(true);
    try {
      await onCreate(villageData);
      setIsFormOpen(false);
    } catch (error) {
      throw error; // Let VillageForm handle the error display
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (villageData) => {
    setFormLoading(true);
    try {
      await onUpdate(editingVillage.id, villageData);
      setEditingVillage(null);
    } catch (error) {
      throw error; // Let VillageForm handle the error display
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (village) => {
    setEditingVillage(village);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingVillage(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-6 w-6 text-green-600" />
                การจัดการหมู่บ้าน
              </CardTitle>
              <CardDescription>
                จัดการข้อมูลหมู่บ้านในระบบ Smart Village Management
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-sm">
              {villages.length} หมู่บ้าน
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาหมู่บ้าน..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onRefresh}
                disabled={loading}
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                รีเฟรช
              </Button>
              <Button
                onClick={() => setIsFormOpen(true)}
                disabled={loading}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มหมู่บ้าน
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Message for Empty State */}
      {!loading && !error && villages.length === 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            ยังไม่มีข้อมูลหมู่บ้านในระบบ คลิก "เพิ่มหมู่บ้าน" เพื่อเริ่มต้น
          </AlertDescription>
        </Alert>
      )}

      {/* Search Results Info */}
      {searchTerm && (
        <div className="text-sm text-muted-foreground">
          {filteredVillages.length === 0 
            ? `ไม่พบหมู่บ้านที่ตรงกับ "${searchTerm}"`
            : `พบ ${filteredVillages.length} หมู่บ้านที่ตรงกับ "${searchTerm}"`
          }
        </div>
      )}

      {/* Villages Grid */}
      {!loading && filteredVillages.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVillages.map((village) => (
            <VillageCard
              key={village.id}
              village={village}
              onEdit={handleEdit}
              onDelete={onDelete}
              loading={loading}
            />
          ))}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin" />
            กำลังโหลดข้อมูล...
          </div>
        </div>
      )}

      {/* Village Form Dialog */}
      <VillageForm
        isOpen={isFormOpen || Boolean(editingVillage)}
        onClose={handleCloseForm}
        onSubmit={editingVillage ? handleUpdate : handleCreate}
        village={editingVillage}
        loading={formLoading}
      />
    </div>
  );
};

export default VillageList;

