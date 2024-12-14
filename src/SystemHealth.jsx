import React from 'react';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

const SystemHealth = ({ healthChecks }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      {Object.entries(healthChecks).map(([service, check]) => (
        <div
          key={service}
          className={`p-4 rounded-lg border ${getStatusStyles(check.status)}`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              {getStatusIcon(check.status)}
              <h3 className="font-medium text-gray-900">
                {service.charAt(0).toUpperCase() + service.slice(1)}
              </h3>
            </div>
            <span className="text-sm text-gray-500">
              {new Date(check.timestamp).toLocaleTimeString()}
            </span>
          </div>
          {check.details && (
            <div className="mt-2 text-sm text-gray-600">
              {Object.entries(check.details).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span>{key}:</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SystemHealth;