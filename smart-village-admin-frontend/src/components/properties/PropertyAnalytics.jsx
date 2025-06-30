/**
 * Property Analytics Component
 * Advanced analytics dashboard for property insights and trends
 */

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Home, Users, MapPin, Calendar, PieChart, Activity } from 'lucide-react';

const PropertyAnalytics = ({ propertyId, properties = [] }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('6months');

  // Mock analytics data
  const mockAnalyticsData = {
    overview: {
      totalValue: 15750000,
      averageValue: 3150000,
      totalArea: 1030,
      averageArea: 206,
      occupancyRate: 85,
      maintenanceCost: 125000
    },
    trends: {
      valueGrowth: 12.5,
      areaUtilization: 78.3,
      maintenanceEfficiency: 92.1,
      ownerSatisfaction: 88.7
    },
    distribution: {
      byType: [
        { type: 'Residential', count: 2, percentage: 40, value: 8500000 },
        { type: 'Commercial', count: 1, percentage: 20, value: 3200000 },
        { type: 'Agricultural', count: 1, percentage: 20, value: 2800000 },
        { type: 'Public', count: 1, percentage: 20, value: 1250000 }
      ],
      byArea: [
        { range: '0-100 ตร.ม.', count: 0, percentage: 0 },
        { range: '101-200 ตร.ม.', count: 3, percentage: 60 },
        { range: '201-300 ตร.ม.', count: 1, percentage: 20 },
        { range: '300+ ตร.ม.', count: 1, percentage: 20 }
      ],
      byValue: [
        { range: '0-1M', count: 1, percentage: 20 },
        { range: '1-3M', count: 1, percentage: 20 },
        { range: '3-5M', count: 2, percentage: 40 },
        { range: '5M+', count: 1, percentage: 20 }
      ]
    },
    timeline: [
      { month: 'Jan 2025', properties: 3, value: 9500000 },
      { month: 'Feb 2025', properties: 4, value: 12200000 },
      { month: 'Mar 2025', properties: 4, value: 12800000 },
      { month: 'Apr 2025', properties: 5, value: 14500000 },
      { month: 'May 2025', properties: 5, value: 15200000 },
      { month: 'Jun 2025', properties: 5, value: 15750000 }
    ],
    insights: [
      {
        type: 'positive',
        title: 'Property Value Growth',
        description: 'Total property value increased by 12.5% over the last 6 months',
        impact: 'high'
      },
      {
        type: 'neutral',
        title: 'Area Utilization',
        description: 'Current area utilization is at 78.3%, within optimal range',
        impact: 'medium'
      },
      {
        type: 'positive',
        title: 'Maintenance Efficiency',
        description: 'Maintenance costs reduced by 8% while improving service quality',
        impact: 'high'
      },
      {
        type: 'warning',
        title: 'Owner Satisfaction',
        description: 'Owner satisfaction at 88.7%, slight decrease from last quarter',
        impact: 'medium'
      }
    ]
  };

  useEffect(() => {
    // Simulate loading analytics data
    setLoading(true);
    const timer = setTimeout(() => {
      setAnalyticsData(mockAnalyticsData);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeRange, propertyId]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat('th-TH').format(number);
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'positive':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <TrendingDown className="h-5 w-5 text-yellow-500" />;
      default:
        return <Activity className="h-5 w-5 text-blue-500" />;
    }
  };

  const getInsightColor = (type) => {
    switch (type) {
      case 'positive':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Property Analytics</h3>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Property Analytics</h3>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Analytics Data</h3>
          <p className="mt-1 text-sm text-gray-500">
            Analytics data will be available once property data is collected.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Property Analytics</h3>
        </div>
        
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
        >
          <option value="1month">Last Month</option>
          <option value="3months">Last 3 Months</option>
          <option value="6months">Last 6 Months</option>
          <option value="1year">Last Year</option>
        </select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Value</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(analyticsData.overview.totalValue)}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600 font-medium">+{analyticsData.trends.valueGrowth}%</span>
              <span className="text-gray-500 ml-1">vs last period</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Home className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Area</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatNumber(analyticsData.overview.totalArea)} ตร.ม.
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <Activity className="h-4 w-4 text-blue-500 mr-1" />
              <span className="text-blue-600 font-medium">{analyticsData.trends.areaUtilization}%</span>
              <span className="text-gray-500 ml-1">utilization</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Occupancy Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {analyticsData.overview.occupancyRate}%
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600 font-medium">Optimal</span>
              <span className="text-gray-500 ml-1">range</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <MapPin className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Maintenance Cost</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(analyticsData.overview.maintenanceCost)}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600 font-medium">-8%</span>
              <span className="text-gray-500 ml-1">vs last period</span>
            </div>
          </div>
        </div>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Property Type Distribution */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <PieChart className="h-5 w-5 mr-2 text-blue-600" />
            Property Type Distribution
          </h4>
          <div className="space-y-3">
            {analyticsData.distribution.byType.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    index === 0 ? 'bg-blue-500' :
                    index === 1 ? 'bg-green-500' :
                    index === 2 ? 'bg-yellow-500' : 'bg-purple-500'
                  }`}></div>
                  <span className="text-sm text-gray-700">{item.type}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{item.count} properties</div>
                  <div className="text-xs text-gray-500">{formatCurrency(item.value)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Area Distribution */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
            Area Distribution
          </h4>
          <div className="space-y-3">
            {analyticsData.distribution.byArea.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{item.range}</span>
                <div className="flex items-center">
                  <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline Chart */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-blue-600" />
          Property Value Timeline
        </h4>
        <div className="mt-4">
          <div className="flex items-end space-x-2 h-32">
            {analyticsData.timeline.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-blue-600 rounded-t"
                  style={{ 
                    height: `${(item.value / Math.max(...analyticsData.timeline.map(t => t.value))) * 100}%`,
                    minHeight: '4px'
                  }}
                ></div>
                <div className="mt-2 text-xs text-gray-500 text-center">
                  {item.month.split(' ')[0]}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Property value growth over the last 6 months
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Activity className="h-5 w-5 mr-2 text-blue-600" />
          Key Insights
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analyticsData.insights.map((insight, index) => (
            <div key={index} className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {getInsightIcon(insight.type)}
                </div>
                <div className="ml-3">
                  <h5 className="text-sm font-medium text-gray-900">{insight.title}</h5>
                  <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      insight.impact === 'high' ? 'bg-red-100 text-red-800' :
                      insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {insight.impact} impact
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PropertyAnalytics;

