import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  Users, 
  MapPin, 
  Plus, 
  Search, 
  Filter,
  UserPlus,
  Trash2,
  Edit,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

export default function UserVillageAssignmentPage() {
  const { user, hasPermission } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [users, setUsers] = useState([]);
  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedVillage, setSelectedVillage] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Sample data - ในการใช้งานจริงจะดึงจาก API
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setUsers([
        {
          id: '1',
          username: 'admin001',
          name: 'นายสมชาย ใจดี',
          email: 'somchai@smartvillage.com',
          role: 'village_admin',
          status: 'active',
          created_at: '2025-01-15T10:30:00Z'
        },
        {
          id: '2',
          username: 'admin002',
          name: 'นางสาวมาลี สวยงาม',
          email: 'malee@smartvillage.com',
          role: 'village_admin',
          status: 'active',
          created_at: '2025-02-01T14:20:00Z'
        },
        {
          id: '3',
          username: 'user001',
          name: 'นายประยุทธ์ มั่นคง',
          email: 'prayuth@smartvillage.com',
          role: 'village_user',
          status: 'pending',
          created_at: '2025-03-10T09:15:00Z'
        }
      ]);

      setVillages([
        {
          id: 'SV001',
          name: 'หมู่บ้านสมาร์ทวิลเลจ 1',
          province: 'กรุงเทพมหานคร',
          district: 'เขตบางรัก',
          status: 'active'
        },
        {
          id: 'SV002',
          name: 'หมู่บ้านเทคโนโลยี',
          province: 'เชียงใหม่',
          district: 'เมืองเชียงใหม่',
          status: 'active'
        },
        {
          id: 'SV003',
          name: 'หมู่บ้านอนาคต',
          province: 'ภูเก็ต',
          district: 'เมืองภูเก็ต',
          status: 'inactive'
        }
      ]);

      setAssignments([
        {
          id: '1',
          user_id: '1',
          village_id: 'SV001',
          role: 'village_admin',
          assigned_at: '2025-01-15T10:30:00Z',
          assigned_by: 'superadmin',
          status: 'active'
        },
        {
          id: '2',
          user_id: '2',
          village_id: 'SV002',
          role: 'village_admin',
          assigned_at: '2025-02-01T14:20:00Z',
          assigned_by: 'superadmin',
          status: 'active'
        },
        {
          id: '3',
          user_id: '3',
          village_id: 'SV001',
          role: 'village_user',
          assigned_at: '2025-03-10T09:15:00Z',
          assigned_by: 'admin001',
          status: 'pending'
        }
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  // Filter assignments based on search and filters
  const filteredAssignments = assignments.filter(assignment => {
    const user = users.find(u => u.id === assignment.user_id);
    const village = villages.find(v => v.id === assignment.village_id);
    
    if (!user || !village) return false;

    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      village.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = selectedRole === 'all' || assignment.role === selectedRole;
    const matchesVillage = selectedVillage === 'all' || assignment.village_id === selectedVillage;

    return matchesSearch && matchesRole && matchesVillage;
  });

  // Statistics
  const stats = {
    totalAssignments: assignments.length,
    activeAssignments: assignments.filter(a => a.status === 'active').length,
    pendingAssignments: assignments.filter(a => a.status === 'pending').length,
    villageAdmins: assignments.filter(a => a.role === 'village_admin').length
  };

  const handleCreateAssignment = () => {
    if (hasPermission('users.create') && hasPermission('villages.update')) {
      setShowCreateModal(true);
    }
  };

  const handleDeleteAssignment = (assignmentId) => {
    if (hasPermission('users.delete')) {
      // Implement delete logic
      console.log('Delete assignment:', assignmentId);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'village_admin': return 'bg-blue-100 text-blue-800';
      case 'village_user': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">กำลังโหลดข้อมูล...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">การมอบหมายหมู่บ้าน</h1>
          <p className="text-gray-600">จัดการการมอบหมายผู้ใช้งานให้กับหมู่บ้านต่างๆ</p>
        </div>
        {hasPermission('users.create') && hasPermission('villages.update') && (
          <Button onClick={handleCreateAssignment} className="bg-green-600 hover:bg-green-700">
            <UserPlus className="w-4 h-4 mr-2" />
            มอบหมายใหม่
          </Button>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">การมอบหมายทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAssignments}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">ใช้งานอยู่</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeAssignments}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">รออนุมัติ</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingAssignments}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MapPin className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">ผู้ดูแลหมู่บ้าน</p>
              <p className="text-2xl font-bold text-gray-900">{stats.villageAdmins}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="ค้นหาผู้ใช้งานหรือหมู่บ้าน..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">ทุกบทบาท</option>
            <option value="village_admin">ผู้ดูแลหมู่บ้าน</option>
            <option value="village_user">ผู้ใช้งานหมู่บ้าน</option>
          </select>

          <select
            value={selectedVillage}
            onChange={(e) => setSelectedVillage(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">ทุกหมู่บ้าน</option>
            {villages.map(village => (
              <option key={village.id} value={village.id}>
                {village.name}
              </option>
            ))}
          </select>

          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            ตัวกรอง
          </Button>
        </div>
      </Card>

      {/* Assignments Table */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">รายการการมอบหมาย</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ผู้ใช้งาน
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  หมู่บ้าน
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  บทบาท
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  สถานะ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  วันที่มอบหมาย
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  การดำเนินการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAssignments.map((assignment) => {
                const user = users.find(u => u.id === assignment.user_id);
                const village = villages.find(v => v.id === assignment.village_id);
                
                return (
                  <tr key={assignment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                          <div className="text-sm text-gray-500">{user?.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{village?.name}</div>
                          <div className="text-sm text-gray-500">{village?.province}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getRoleColor(assignment.role)}>
                        {assignment.role === 'village_admin' ? 'ผู้ดูแลหมู่บ้าน' : 'ผู้ใช้งานหมู่บ้าน'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getStatusColor(assignment.status)}>
                        {assignment.status === 'active' ? 'ใช้งานอยู่' : 
                         assignment.status === 'pending' ? 'รออนุมัติ' : 'ไม่ใช้งาน'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(assignment.assigned_at).toLocaleDateString('th-TH')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        {hasPermission('users.update') && (
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {hasPermission('users.delete') && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteAssignment(assignment.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredAssignments.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่พบข้อมูลการมอบหมาย</h3>
            <p className="mt-1 text-sm text-gray-500">
              ลองเปลี่ยนเงื่อนไขการค้นหาหรือสร้างการมอบหมายใหม่
            </p>
          </div>
        )}
      </Card>

      {/* Create Assignment Modal - Placeholder */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">สร้างการมอบหมายใหม่</h3>
            <p className="text-gray-600 mb-4">ฟีเจอร์นี้จะพัฒนาในขั้นตอนถัดไป</p>
            <Button onClick={() => setShowCreateModal(false)}>
              ปิด
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

