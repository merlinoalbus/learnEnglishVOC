
// =====================================================
// 📁 src/components/ServiceStatusIndicator.js - Service Status Dashboard
// =====================================================

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { 
  Brain, 
  Database, 
  Wifi, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw,
  Info
} from 'lucide-react';
import { enhancedAIService } from '../services/enhancedAIService';
import { enhancedStorageService } from '../services/enhancedStorageService';

const ServiceStatusIndicator = ({ 
  compact = false, 
  showDetails = false,
  onStatusChange = null 
}) => {
  const [aiStatus, setAiStatus] = useState(null);
  const [storageStatus, setStorageStatus] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const checkAllServices = async () => {
    setIsRefreshing(true);
    
    try {
      const [aiResult, storageResult] = await Promise.all([
        enhancedAIService.getServiceStatus(),
        enhancedStorageService.getServiceStatus()
      ]);
      
      setAiStatus(aiResult);
      setStorageStatus(storageResult);
      setLastUpdate(Date.now());
      
      if (onStatusChange) {
        onStatusChange({
          ai: aiResult,
          storage: storageResult,
          overall: getOverallHealth(aiResult, storageResult)
        });
      }
    } catch (error) {
      console.error('❌ Failed to check service status:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getOverallHealth = (ai, storage) => {
    if (!ai || !storage) return 'unknown';
    
    if (ai.health === 'down' || storage.health === 'down') return 'critical';
    if (ai.health === 'degraded' || storage.health === 'degraded') return 'warning';
    if (ai.health === 'healthy' && storage.health === 'healthy') return 'healthy';
    
    return 'unknown';
  };

  const getStatusIcon = (health) => {
    switch (health) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'degraded': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'down': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (health) => {
    switch (health) {
      case 'healthy': return 'border-green-200 bg-green-50';
      case 'degraded': return 'border-yellow-200 bg-yellow-50';
      case 'down': return 'border-red-200 bg-red-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  // Check services on mount and every 30 seconds
  useEffect(() => {
    checkAllServices();
    const interval = setInterval(checkAllServices, 30000);
    return () => clearInterval(interval);
  }, []);

  if (compact && (!aiStatus || !storageStatus)) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span className="text-sm">Checking...</span>
      </div>
    );
  }

  if (compact) {
    const overallHealth = getOverallHealth(aiStatus, storageStatus);
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getStatusColor(overallHealth)}`}>
        {getStatusIcon(overallHealth)}
        <span className="text-sm font-medium">
          {overallHealth === 'healthy' ? 'All Services OK' : 
           overallHealth === 'warning' ? 'Some Issues' : 
           overallHealth === 'critical' ? 'Service Issues' : 'Checking...'}
        </span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={checkAllServices}
          disabled={isRefreshing}
          className="h-6 w-6 p-0"
        >
          <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Wifi className="w-5 h-5" />
            Service Status
          </span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={checkAllServices}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardTitle>
        {lastUpdate && (
          <p className="text-sm text-gray-500">
            Last updated: {new Date(lastUpdate).toLocaleTimeString()}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* AI Service Status */}
        <div className={`p-4 rounded-lg border ${aiStatus ? getStatusColor(aiStatus.health) : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Brain className="w-6 h-6 text-purple-600" />
              <div>
                <h3 className="font-semibold">AI Assistant</h3>
                <p className="text-sm text-gray-600">
                  {aiStatus?.configured ? 'Configured' : 'Not configured'}
                </p>
              </div>
            </div>
            {aiStatus && getStatusIcon(aiStatus.health)}
          </div>
          
          {aiStatus && showDetails && (
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Health:</span> {aiStatus.health}
                </div>
                <div>
                  <span className="font-medium">Failures:</span> {aiStatus.consecutiveFailures}
                </div>
              </div>
              
              {aiStatus.recommendations.length > 0 && (
                <div>
                  <span className="font-medium">Recommendations:</span>
                  <ul className="list-disc list-inside mt-1">
                    {aiStatus.recommendations.map((rec, index) => (
                      <li key={index} className="text-xs">{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Storage Service Status */}
        <div className={`p-4 rounded-lg border ${storageStatus ? getStatusColor(storageStatus.health) : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="font-semibold">Local Storage</h3>
                <p className="text-sm text-gray-600">
                  {storageStatus?.available ? 'Available' : 'Unavailable'}
                </p>
              </div>
            </div>
            {storageStatus && getStatusIcon(storageStatus.health)}
          </div>
          
          {storageStatus && showDetails && (
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Used:</span> {storageStatus.usage.usedMB}MB
                </div>
                <div>
                  <span className="font-medium">Available:</span> {storageStatus.usage.availableMB}MB
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    storageStatus.usage.critical ? 'bg-red-500' : 
                    storageStatus.usage.warning ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${storageStatus.usage.usagePercentage}%` }}
                />
              </div>
              
              {storageStatus.recommendations.length > 0 && (
                <div>
                  <span className="font-medium">Recommendations:</span>
                  <ul className="list-disc list-inside mt-1">
                    {storageStatus.recommendations.map((rec, index) => (
                      <li key={index} className="text-xs">{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Overall Status Summary */}
        {aiStatus && storageStatus && (
          <div className={`p-3 rounded-lg border ${getStatusColor(getOverallHealth(aiStatus, storageStatus))}`}>
            <div className="flex items-center gap-3">
              {getStatusIcon(getOverallHealth(aiStatus, storageStatus))}
              <div>
                <h4 className="font-semibold">Overall System Health</h4>
                <p className="text-sm">
                  {getOverallHealth(aiStatus, storageStatus) === 'healthy' ? 
                    'All systems operational' :
                    getOverallHealth(aiStatus, storageStatus) === 'warning' ?
                    'Some services experiencing issues' :
                    getOverallHealth(aiStatus, storageStatus) === 'critical' ?
                    'Critical service issues detected' :
                    'System status unknown'
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceStatusIndicator;