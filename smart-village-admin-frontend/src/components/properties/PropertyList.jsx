/**
 * Property List Component for Smart Village Management System
 * Displays list of properties with CRUD operations
 */

import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { 
  Edit, 
  Trash2, 
  MapPin, 
  User, 
  Calendar, 
  Ruler,
  Building,
  Home,
  Store,
  Wheat,
  Users
} from 'lucide-react';

const PropertyList = ({ properties, loading, onEdit, onDelete }) => {
  // Property type configurations
  const propertyTypeConfig = {
    residential: {
      label: 'Residential',
      labelTh: 'ที่อยู่อาศัย',
      color: 'bg-blue-100 text-blue-800',
      icon: Home
    },
    commercial: {
      label: 'Commercial',
      labelTh: 'พาณิชยกรรม',
      color: 'bg-green-100 text-green-800',
      icon: Store
    },
    agricultural: {
      label: 'Agricultural',
      labelTh: 'เกษตรกรรม',
      color: 'bg-yellow-100 text-yellow-800',
      icon: Wheat
    },
    public: {
      label: 'Public',
      labelTh: 'สาธารณะ',
      color: 'bg-purple-100 text-purple-800',
      icon: Users
    }
  };

  // Status configurations
  const statusConfig = {
    active: {
      label: 'Active',
      labelTh: 'ใช้งาน',
      color: 'bg-green-100 text-green-800'
    },
    inactive: {
      label: 'Inactive',
      labelTh: 'ไม่ใช้งาน',
      color: 'bg-gray-100 text-gray-800'
    }
  };

  // Format area display
  const formatArea = (area, unit) => {
    const unitLabels = {
      sqm: 'ตร.ม.',
      rai: 'ไร่',
      ngan: 'งาน'
    };
    return `${area.toLocaleString()} ${unitLabels[unit] || unit}`;
  };

  // Format date display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get initials for avatar
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
          <p className="text-gray-600 mb-4">
            No properties match your search criteria. Try adjusting your search terms.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {properties.map((property) => {
        const typeConfig = propertyTypeConfig[property.propertyType];
        const statusConfig_ = statusConfig[property.status];
        const TypeIcon = typeConfig?.icon || Building;

        return (
          <Card key={property.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                {/* Property Info */}
                <div className="flex items-start space-x-4 flex-1">
                  {/* Property Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <TypeIcon className="h-6 w-6 text-gray-600" />
                    </div>
                  </div>

                  {/* Property Details */}
                  <div className="flex-1 min-w-0">
                    {/* Property Name and Code */}
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {property.propertyName}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {property.propertyCode}
                      </Badge>
                    </div>

                    {/* Property Type and Status */}
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={typeConfig?.color}>
                        {typeConfig?.labelTh || property.propertyType}
                      </Badge>
                      <Badge className={statusConfig_?.color}>
                        {statusConfig_?.labelTh || property.status}
                      </Badge>
                    </div>

                    {/* Address */}
                    <div className="flex items-start gap-2 mb-3">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {property.address}
                      </p>
                    </div>

                    {/* Property Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {/* Owner Info */}
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{property.owner.name}</p>
                          <p className="text-gray-500">{property.owner.contact}</p>
                        </div>
                      </div>

                      {/* Area */}
                      <div className="flex items-center gap-2">
                        <Ruler className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {formatArea(property.area, property.unit)}
                          </p>
                          <p className="text-gray-500">Area</p>
                        </div>
                      </div>

                      {/* Last Updated */}
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {formatDate(property.lastUpdated)}
                          </p>
                          <p className="text-gray-500">Last updated</p>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {property.description && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {property.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(property)}
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(property.id)}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default PropertyList;

