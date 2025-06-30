import React, { useState } from 'react';
import { useEnhancedAuth } from '../contexts/EnhancedAuthContext';
import { 
  MapPin, 
  ChevronDown, 
  Check,
  Building
} from 'lucide-react';

const VillageSelector = ({ className = '' }) => {
  const { 
    currentVillage, 
    availableVillages, 
    setCurrentVillage,
    isVillageAdmin,
    canManageMultipleVillages 
  } = useEnhancedAuth();
  
  const [isOpen, setIsOpen] = useState(false);

  // Don't show selector if user is not village admin or has only one village
  if (!isVillageAdmin || !canManageMultipleVillages) {
    return null;
  }

  const handleVillageSelect = async (village) => {
    try {
      await setCurrentVillage(village);
      setIsOpen(false);
    } catch (error) {
      console.error('Error selecting village:', error);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Current Village Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-w-[200px]"
      >
        <MapPin className="h-4 w-4 text-gray-500" />
        <div className="flex-1 text-left">
          <div className="text-sm font-medium text-gray-900">
            {currentVillage?.name || 'เลือกหมู่บ้าน'}
          </div>
          {currentVillage && (
            <div className="text-xs text-gray-500">
              {currentVillage.district}, {currentVillage.province}
            </div>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 px-2 py-1 mb-1">
              หมู่บ้านที่คุณสามารถจัดการได้
            </div>
            
            {availableVillages.map((village) => (
              <button
                key={village.id}
                onClick={() => handleVillageSelect(village)}
                className={`w-full flex items-center space-x-3 px-2 py-2 rounded-md hover:bg-gray-100 transition-colors ${
                  currentVillage?.id === village.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                <Building className="h-4 w-4 text-gray-400" />
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium">
                    {village.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {village.district}, {village.province}
                  </div>
                </div>
                {currentVillage?.id === village.id && (
                  <Check className="h-4 w-4 text-blue-600" />
                )}
              </button>
            ))}
          </div>
          
          {availableVillages.length === 0 && (
            <div className="p-4 text-center text-gray-500 text-sm">
              ไม่พบหมู่บ้านที่สามารถจัดการได้
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VillageSelector;

