import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Badge } from '../components/ui/badge';
import { 
  Shield, 
  AlertTriangle, 
  Clock, 
  User, 
  MapPin, 
  Plus, 
  Eye, 
  X,
  History,
  Activity,
  CheckCircle,
  XCircle,
  Timer
} from 'lucide-react';

const EmergencyOverridePage = () => {
  const { user, hasPermission } = useAuth();
  const [activeOverrides, setActiveOverrides] = useState([]);
  const [overrideHistory, setOverrideHistory] = useState([]);
  const [statistics, setStatistics] = useState({
    totalActive: 0,
    totalToday: 0,
    totalThisWeek: 0,
    totalThisMonth: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Check if user is Super Admin
  const isSuperAdmin = hasPermission('system.emergency_override');

  useEffect(() => {
    if (isSuperAdmin) {
      fetchOverrideData();
    }
  }, [isSuperAdmin]);

  const fetchOverrideData = async () => {
    try {
      setLoading(true);
      
      // Simulate API calls - replace with actual API calls
      const mockActiveOverrides = [
        {
          id: 1,
          targetResource: 'village.1',
          targetResourceName: 'หมู่บ้านสมาร์ทวิลเลจ 1',
          action: 'full_access',
          reason: 'ระบบการเงินขัดข้อง ต้องการเข้าถึงข้อมูลเพื่อแก้ไขปัญหาเร่งด่วน',
          createdBy: 'Super Admin',
          createdAt: '2024-01-15T10:30:00Z',
          expiresAt: '2024-01-15T18:30:00Z',
          status: 'active',
          remainingTime: '6 ชั่วโมง 15 นาที'
        },
        {
          id: 2,
          targetResource: 'user.village_admin_2',
          targetResourceName: 'นางสาวมาลี สวยงาม',
          action: 'account_unlock',
          reason: 'บัญชีถูกล็อคผิดพลาด ต้องการปลดล็อคเพื่อให้สามารถทำงานได้ต่อ',
          createdBy: 'Super Admin',
          createdAt: '2024-01-15T14:00:00Z',
          expiresAt: '2024-01-15T16:00:00Z',
          status: 'active',
          remainingTime: '1 ชั่วโมง 45 นาที'
        }
      ];

      const mockHistory = [
        {
          id: 3,
          targetResource: 'village.2',
          targetResourceName: 'หมู่บ้านเทคโนโลยี',
          action: 'data_recovery',
          reason: 'ข้อมูลสูญหาย ต้องการกู้คืนข้อมูลจาก backup',
          createdBy: 'Super Admin',
          createdAt: '2024-01-14T09:15:00Z',
          expiresAt: '2024-01-14T17:15:00Z',
          status: 'completed',
          completedAt: '2024-01-14T15:30:00Z'
        },
        {
          id: 4,
          targetResource: 'system.maintenance',
          targetResourceName: 'ระบบทั้งหมด',
          action: 'maintenance_mode',
          reason: 'อัปเดตระบบและซ่อมแซมฐานข้อมูล',
          createdBy: 'Super Admin',
          createdAt: '2024-01-13T02:00:00Z',
          expiresAt: '2024-01-13T06:00:00Z',
          status: 'expired',
          completedAt: '2024-01-13T05:45:00Z'
        }
      ];

      const mockStatistics = {
        totalActive: mockActiveOverrides.length,
        totalToday: 2,
        totalThisWeek: 4,
        totalThisMonth: 8
      };

      setActiveOverrides(mockActiveOverrides);
      setOverrideHistory(mockHistory);
      setStatistics(mockStatistics);
    } catch (error) {
      console.error('Error fetching override data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeOverride = async (overrideId) => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะยกเลิก Emergency Override นี้?')) {
      try {
        // API call to revoke override
        console.log('Revoking override:', overrideId);
        // Refresh data after revoke
        fetchOverrideData();
      } catch (error) {
        console.error('Error revoking override:', error);
      }
    }
  };

  const handleExtendOverride = async (overrideId) => {
    const additionalHours = prompt('ต้องการขยายเวลาเพิ่มกี่ชั่วโมง?', '2');
    if (additionalHours && !isNaN(additionalHours)) {
      try {
        // API call to extend override
        console.log('Extending override:', overrideId, 'by', additionalHours, 'hours');
        // Refresh data after extend
        fetchOverrideData();
      } catch (error) {
        console.error('Error extending override:', error);
      }
    }
  };

  const filteredActiveOverrides = activeOverrides.filter(override => {
    const matchesSearch = override.targetResourceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         override.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || override.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const filteredHistory = overrideHistory.filter(override => {
    const matchesSearch = override.targetResourceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         override.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || override.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (!isSuperAdmin) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            ไม่มีสิทธิ์เข้าถึง
          </h2>
          <p className="text-red-600">
            คุณไม่มีสิทธิ์เข้าถึงหน้า Emergency Override นี้ เฉพาะ Super Admin เท่านั้นที่สามารถเข้าถึงได้
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">กำลังโหลดข้อมูล...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-red-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Emergency Override</h1>
            <p className="text-gray-600">จัดการสิทธิ์พิเศษในสถานการณ์ฉุกเฉิน</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>สร้าง Override ใหม่</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">ใช้งานอยู่</p>
              <p className="text-2xl font-bold text-red-600">{statistics.totalActive}</p>
            </div>
            <Activity className="h-8 w-8 text-red-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">วันนี้</p>
              <p className="text-2xl font-bold text-blue-600">{statistics.totalToday}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">สัปดาห์นี้</p>
              <p className="text-2xl font-bold text-green-600">{statistics.totalThisWeek}</p>
            </div>
            <History className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">เดือนนี้</p>
              <p className="text-2xl font-bold text-purple-600">{statistics.totalThisMonth}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="ค้นหาตามชื่อทรัพยากรหรือเหตุผล..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">ทุกสถานะ</option>
            <option value="active">ใช้งานอยู่</option>
            <option value="completed">เสร็จสิ้น</option>
            <option value="expired">หมดอายุ</option>
            <option value="revoked">ยกเลิกแล้ว</option>
          </select>
        </div>
      </div>

      {/* Active Overrides */}
      {filteredActiveOverrides.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Activity className="h-5 w-5 text-red-600 mr-2" />
              Override ที่ใช้งานอยู่
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredActiveOverrides.map((override) => (
              <div key={override.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Badge variant="destructive">
                        <Activity className="h-3 w-3 mr-1" />
                        ใช้งานอยู่
                      </Badge>
                      <span className="text-sm text-gray-500">
                        สร้างโดย {override.createdBy}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      {override.targetResourceName}
                    </h3>
                    
                    <p className="text-gray-600 mb-3">
                      {override.reason}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        เหลือเวลา: {override.remainingTime}
                      </div>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        การดำเนินการ: {override.action}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleExtendOverride(override.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      <Timer className="h-4 w-4 mr-1 inline" />
                      ขยายเวลา
                    </button>
                    <button
                      onClick={() => handleRevokeOverride(override.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      <X className="h-4 w-4 mr-1 inline" />
                      ยกเลิก
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Override History */}
      {filteredHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <History className="h-5 w-5 text-gray-600 mr-2" />
              ประวัติ Override
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredHistory.map((override) => (
              <div key={override.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Badge variant={override.status === 'completed' ? 'default' : 'secondary'}>
                        {override.status === 'completed' ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {override.status === 'completed' ? 'เสร็จสิ้น' : 'หมดอายุ'}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        สร้างโดย {override.createdBy}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      {override.targetResourceName}
                    </h3>
                    
                    <p className="text-gray-600 mb-3">
                      {override.reason}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        สร้างเมื่อ: {new Date(override.createdAt).toLocaleDateString('th-TH')}
                      </div>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        การดำเนินการ: {override.action}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors">
                      <Eye className="h-4 w-4 mr-1 inline" />
                      ดูรายละเอียด
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Data Message */}
      {filteredActiveOverrides.length === 0 && filteredHistory.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            ไม่พบข้อมูล Override
          </h3>
          <p className="text-gray-600">
            {searchTerm || filterStatus !== 'all' 
              ? 'ไม่พบข้อมูลที่ตรงกับการค้นหาหรือตัวกรอง' 
              : 'ยังไม่มี Emergency Override ในระบบ'}
          </p>
        </div>
      )}
    </div>
  );
};

export default EmergencyOverridePage;

