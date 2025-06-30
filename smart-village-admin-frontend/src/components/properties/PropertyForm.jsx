/**
 * Property Form Component for Smart Village Management System
 * Add/Edit property form with validation
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Switch } from '../ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Building, 
  MapPin, 
  User, 
  Ruler, 
  FileText,
  Home,
  Store,
  Wheat,
  Users,
  X
} from 'lucide-react';

// Validation schema
const propertySchema = z.object({
  propertyCode: z.string().min(1, 'Property code is required'),
  propertyName: z.string().min(1, 'Property name is required'),
  propertyType: z.enum(['residential', 'commercial', 'agricultural', 'public'], {
    required_error: 'Property type is required',
  }),
  address: z.string().min(1, 'Address is required'),
  area: z.number().min(0.1, 'Area must be greater than 0'),
  unit: z.enum(['sqm', 'rai', 'ngan'], {
    required_error: 'Unit is required',
  }),
  ownerName: z.string().min(1, 'Owner name is required'),
  ownerContact: z.string().min(1, 'Owner contact is required'),
  status: z.enum(['active', 'inactive']),
  description: z.string().optional(),
  coordinates: z.object({
    lat: z.number().optional(),
    lng: z.number().optional(),
  }).optional(),
});

const PropertyForm = ({ property, mode, onSubmit, onClose }) => {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      propertyCode: '',
      propertyName: '',
      propertyType: 'residential',
      address: '',
      area: 0,
      unit: 'sqm',
      ownerName: '',
      ownerContact: '',
      status: 'active',
      description: '',
      coordinates: {
        lat: 0,
        lng: 0
      }
    }
  });

  // Property type configurations
  const propertyTypes = [
    {
      value: 'residential',
      label: 'Residential',
      labelTh: 'ที่อยู่อาศัย',
      icon: Home,
      description: 'Houses, condos, apartments'
    },
    {
      value: 'commercial',
      label: 'Commercial',
      labelTh: 'พาณิชยกรรม',
      icon: Store,
      description: 'Shops, offices, businesses'
    },
    {
      value: 'agricultural',
      label: 'Agricultural',
      labelTh: 'เกษตรกรรม',
      icon: Wheat,
      description: 'Farms, fields, plantations'
    },
    {
      value: 'public',
      label: 'Public',
      labelTh: 'สาธารณะ',
      icon: Users,
      description: 'Community centers, parks'
    }
  ];

  // Area units
  const areaUnits = [
    { value: 'sqm', label: 'Square Meters (ตร.ม.)' },
    { value: 'rai', label: 'Rai (ไร่)' },
    { value: 'ngan', label: 'Ngan (งาน)' }
  ];

  // Load property data for editing
  useEffect(() => {
    if (mode === 'edit' && property) {
      reset({
        propertyCode: property.propertyCode,
        propertyName: property.propertyName,
        propertyType: property.propertyType,
        address: property.address,
        area: property.area,
        unit: property.unit,
        ownerName: property.owner.name,
        ownerContact: property.owner.contact,
        status: property.status,
        description: property.description || '',
        coordinates: property.coordinates || { lat: 0, lng: 0 }
      });
    }
  }, [property, mode, reset]);

  // Handle form submission
  const onFormSubmit = async (data) => {
    setLoading(true);
    try {
      // Transform data to match API structure
      const propertyData = {
        propertyCode: data.propertyCode,
        propertyName: data.propertyName,
        propertyType: data.propertyType,
        address: data.address,
        area: data.area,
        unit: data.unit,
        owner: {
          id: property?.owner?.id || `USR${Date.now()}`,
          name: data.ownerName,
          contact: data.ownerContact
        },
        status: data.status,
        description: data.description,
        coordinates: data.coordinates
      };

      await onSubmit(propertyData);
    } catch (error) {
      console.error('Error submitting property:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle close
  const handleClose = () => {
    reset();
    onClose();
  };

  // Watch property type for dynamic UI
  const selectedPropertyType = watch('propertyType');
  const selectedTypeConfig = propertyTypes.find(type => type.value === selectedPropertyType);

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            {mode === 'add' ? 'Add New Property' : 'Edit Property'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'add' 
              ? 'Create a new property record for the village'
              : 'Update the property information'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
              <CardDescription>
                Enter the basic details of the property
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Property Code */}
                <div className="space-y-2">
                  <Label htmlFor="propertyCode">Property Code *</Label>
                  <Input
                    id="propertyCode"
                    placeholder="e.g., SV-RES-001"
                    {...register('propertyCode')}
                    className={errors.propertyCode ? 'border-red-500' : ''}
                  />
                  {errors.propertyCode && (
                    <p className="text-sm text-red-500">{errors.propertyCode.message}</p>
                  )}
                </div>

                {/* Property Name */}
                <div className="space-y-2">
                  <Label htmlFor="propertyName">Property Name *</Label>
                  <Input
                    id="propertyName"
                    placeholder="e.g., บ้านเลขที่ 123 หมู่ 1"
                    {...register('propertyName')}
                    className={errors.propertyName ? 'border-red-500' : ''}
                  />
                  {errors.propertyName && (
                    <p className="text-sm text-red-500">{errors.propertyName.message}</p>
                  )}
                </div>
              </div>

              {/* Property Type */}
              <div className="space-y-2">
                <Label htmlFor="propertyType">Property Type *</Label>
                <Select
                  value={selectedPropertyType}
                  onValueChange={(value) => setValue('propertyType', value)}
                >
                  <SelectTrigger className={errors.propertyType ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    {propertyTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{type.labelTh}</div>
                              <div className="text-xs text-gray-500">{type.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {errors.propertyType && (
                  <p className="text-sm text-red-500">{errors.propertyType.message}</p>
                )}
                {selectedTypeConfig && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <selectedTypeConfig.icon className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-600">{selectedTypeConfig.description}</span>
                  </div>
                )}
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  placeholder="Enter full address"
                  rows={3}
                  {...register('address')}
                  className={errors.address ? 'border-red-500' : ''}
                />
                {errors.address && (
                  <p className="text-sm text-red-500">{errors.address.message}</p>
                )}
              </div>

              {/* Area and Unit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="area">Area *</Label>
                  <Input
                    id="area"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register('area', { valueAsNumber: true })}
                    className={errors.area ? 'border-red-500' : ''}
                  />
                  {errors.area && (
                    <p className="text-sm text-red-500">{errors.area.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Unit *</Label>
                  <Select
                    value={watch('unit')}
                    onValueChange={(value) => setValue('unit', value)}
                  >
                    <SelectTrigger className={errors.unit ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {areaUnits.map((unit) => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.unit && (
                    <p className="text-sm text-red-500">{errors.unit.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Owner Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Owner Information
              </CardTitle>
              <CardDescription>
                Enter the property owner details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Owner Name */}
                <div className="space-y-2">
                  <Label htmlFor="ownerName">Owner Name *</Label>
                  <Input
                    id="ownerName"
                    placeholder="e.g., นายสมชาย ใจดี"
                    {...register('ownerName')}
                    className={errors.ownerName ? 'border-red-500' : ''}
                  />
                  {errors.ownerName && (
                    <p className="text-sm text-red-500">{errors.ownerName.message}</p>
                  )}
                </div>

                {/* Owner Contact */}
                <div className="space-y-2">
                  <Label htmlFor="ownerContact">Contact Information *</Label>
                  <Input
                    id="ownerContact"
                    placeholder="e.g., 081-234-5678"
                    {...register('ownerContact')}
                    className={errors.ownerContact ? 'border-red-500' : ''}
                  />
                  {errors.ownerContact && (
                    <p className="text-sm text-red-500">{errors.ownerContact.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Additional Information
              </CardTitle>
              <CardDescription>
                Optional details and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="status">Active Property</Label>
                  <p className="text-sm text-gray-500">
                    Enable this property for active use
                  </p>
                </div>
                <Switch
                  id="status"
                  checked={watch('status') === 'active'}
                  onCheckedChange={(checked) => 
                    setValue('status', checked ? 'active' : 'inactive')
                  }
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Additional notes about the property..."
                  rows={3}
                  {...register('description')}
                />
              </div>

              {/* Coordinates (Optional) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lat">Latitude</Label>
                  <Input
                    id="lat"
                    type="number"
                    step="0.000001"
                    placeholder="14.9799"
                    {...register('coordinates.lat', { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lng">Longitude</Label>
                  <Input
                    id="lng"
                    type="number"
                    step="0.000001"
                    placeholder="102.0977"
                    {...register('coordinates.lng', { valueAsNumber: true })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {mode === 'add' ? 'Creating...' : 'Updating...'}
                </div>
              ) : (
                mode === 'add' ? 'Create Property' : 'Update Property'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PropertyForm;

