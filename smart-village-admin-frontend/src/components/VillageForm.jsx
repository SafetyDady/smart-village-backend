import React, { useState, useEffect } from 'react';
import { X, Save, MapPin, Building, Users, Phone, Mail, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/apiClient';

const VillageForm = ({ village = null, isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    address: '',
    sub_district: '',
    district: '',
    province: '',
    postal_code: '',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    established_date: '',
    is_active: true,
    is_verified: false
  });

  // Load village data for editing
  useEffect(() => {
    if (village) {
      setFormData({
        name: village.name || '',
        code: village.code || '',
        description: village.description || '',
        address: village.address || '',
        sub_district: village.sub_district || '',
        district: village.district || '',
        province: village.province || '',
        postal_code: village.postal_code || '',
        contact_person: village.contact_person || '',
        contact_phone: village.contact_phone || '',
        contact_email: village.contact_email || '',
        established_date: village.established_date ? village.established_date.split('T')[0] : '',
        is_active: village.is_active !== undefined ? village.is_active : true,
        is_verified: village.is_verified !== undefined ? village.is_verified : false
      });
    } else {
      // Reset form for new village
      setFormData({
        name: '',
        code: '',
        description: '',
        address: '',
        sub_district: '',
        district: '',
        province: '',
        postal_code: '',
        contact_person: '',
        contact_phone: '',
        contact_email: '',
        established_date: '',
        is_active: true,
        is_verified: false
      });
    }
    setErrors({});
  }, [village, isOpen]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'กรุณากรอกชื่อหมู่บ้าน';
    }
    
    if (!formData.code.trim()) {
      newErrors.code = 'กรุณากรอกรหัสหมู่บ้าน';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'กรุณากรอกคำอธิบาย';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'กรุณากรอกที่อยู่';
    }
    
    if (!formData.sub_district.trim()) {
      newErrors.sub_district = 'กรุณากรอกตำบล/แขวง';
    }
    
    if (!formData.district.trim()) {
      newErrors.district = 'กรุณากรอกอำเภอ/เขต';
    }
    
    if (!formData.province.trim()) {
      newErrors.province = 'กรุณากรอกจังหวัด';
    }
    
    if (!formData.postal_code.trim()) {
      newErrors.postal_code = 'กรุณากรอกรหัสไปรษณีย์';
    } else if (!/^\d{5}$/.test(formData.postal_code)) {
      newErrors.postal_code = 'รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก';
    }
    
    if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }
    
    if (formData.contact_phone && !/^[0-9-+\s()]+$/.test(formData.contact_phone)) {
      newErrors.contact_phone = 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const submitData = {
        ...formData,
        established_date: formData.established_date || null
      };
      
      let response;
      if (village) {
        // Update existing village
        response = await apiClient.villagesApi.update(village.id, submitData);
      } else {
        // Create new village
        response = await apiClient.villagesApi.create(submitData);
      }
      
      console.log('Village saved successfully:', response);
      
      // Call success callback
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      // Close form
      onClose();
      
    } catch (error) {
      console.error('Error saving village:', error);
      
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({
          general: error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-none">
          <CardHeader className="border-b">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl font-semibold">
                  {village ? 'แก้ไขข้อมูลหมู่บ้าน' : 'เพิ่มหมู่บ้านใหม่'}
                </CardTitle>
                <CardDescription>
                  {village ? 'แก้ไขข้อมูลหมู่บ้านในระบบ' : 'กรอกข้อมูลหมู่บ้านใหม่เพื่อเพิ่มเข้าสู่ระบบ'}
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{errors.general}</p>
                </div>
              )}
              
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  ข้อมูลพื้นฐาน
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">ชื่อหมู่บ้าน *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="เช่น หมู่บ้านสมาร์ทวิลเลจ"
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="code">รหัสหมู่บ้าน *</Label>
                    <Input
                      id="code"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      placeholder="เช่น SV001"
                      className={errors.code ? 'border-red-500' : ''}
                    />
                    {errors.code && <p className="text-sm text-red-600">{errors.code}</p>}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">คำอธิบาย *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="อธิบายเกี่ยวกับหมู่บ้าน เช่น ลักษณะเด่น สิ่งอำนวยความสะดวก"
                    rows={3}
                    className={errors.description ? 'border-red-500' : ''}
                  />
                  {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
                </div>
              </div>
              
              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  ที่อยู่
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="address">ที่อยู่ *</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="เช่น 123 ถนนสมาร์ท"
                    className={errors.address ? 'border-red-500' : ''}
                  />
                  {errors.address && <p className="text-sm text-red-600">{errors.address}</p>}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sub_district">ตำบล/แขวง *</Label>
                    <Input
                      id="sub_district"
                      name="sub_district"
                      value={formData.sub_district}
                      onChange={handleInputChange}
                      placeholder="เช่น แขวงสีลม"
                      className={errors.sub_district ? 'border-red-500' : ''}
                    />
                    {errors.sub_district && <p className="text-sm text-red-600">{errors.sub_district}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="district">อำเภอ/เขต *</Label>
                    <Input
                      id="district"
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                      placeholder="เช่น เขตบางรัก"
                      className={errors.district ? 'border-red-500' : ''}
                    />
                    {errors.district && <p className="text-sm text-red-600">{errors.district}</p>}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="province">จังหวัด *</Label>
                    <Input
                      id="province"
                      name="province"
                      value={formData.province}
                      onChange={handleInputChange}
                      placeholder="เช่น กรุงเทพมหานคร"
                      className={errors.province ? 'border-red-500' : ''}
                    />
                    {errors.province && <p className="text-sm text-red-600">{errors.province}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">รหัสไปรษณีย์ *</Label>
                    <Input
                      id="postal_code"
                      name="postal_code"
                      value={formData.postal_code}
                      onChange={handleInputChange}
                      placeholder="เช่น 10500"
                      maxLength={5}
                      className={errors.postal_code ? 'border-red-500' : ''}
                    />
                    {errors.postal_code && <p className="text-sm text-red-600">{errors.postal_code}</p>}
                  </div>
                </div>
              </div>
              
              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  ข้อมูลติดต่อ
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact_person">ผู้ติดต่อ</Label>
                    <Input
                      id="contact_person"
                      name="contact_person"
                      value={formData.contact_person}
                      onChange={handleInputChange}
                      placeholder="เช่น นายสมชาย ใจดี"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">เบอร์โทรศัพท์</Label>
                    <Input
                      id="contact_phone"
                      name="contact_phone"
                      value={formData.contact_phone}
                      onChange={handleInputChange}
                      placeholder="เช่น 02-123-4567"
                      className={errors.contact_phone ? 'border-red-500' : ''}
                    />
                    {errors.contact_phone && <p className="text-sm text-red-600">{errors.contact_phone}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">อีเมล</Label>
                    <Input
                      id="contact_email"
                      name="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={handleInputChange}
                      placeholder="เช่น contact@village.com"
                      className={errors.contact_email ? 'border-red-500' : ''}
                    />
                    {errors.contact_email && <p className="text-sm text-red-600">{errors.contact_email}</p>}
                  </div>
                </div>
              </div>
              
              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  ข้อมูลเพิ่มเติม
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="established_date">วันที่ก่อตั้ง</Label>
                    <Input
                      id="established_date"
                      name="established_date"
                      type="date"
                      value={formData.established_date}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="is_active">สถานะการใช้งาน</Label>
                      <p className="text-sm text-gray-600">เปิดใช้งานหมู่บ้านในระบบ</p>
                    </div>
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, is_active: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="is_verified">สถานะการยืนยัน</Label>
                      <p className="text-sm text-gray-600">ยืนยันข้อมูลหมู่บ้านแล้ว</p>
                    </div>
                    <Switch
                      id="is_verified"
                      checked={formData.is_verified}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, is_verified: checked }))
                      }
                    />
                  </div>
                </div>
              </div>
              
              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button type="button" variant="outline" onClick={onClose}>
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {village ? 'บันทึกการแก้ไข' : 'เพิ่มหมู่บ้าน'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VillageForm;

