import React from 'react';
import { AlertCircle, ChevronRight, XCircle } from 'lucide-react';

const ErrorLog = ({ errors }) => {
  const getErrorTypeStyles = (type) => {
    switch (type.toLowerCase()) {
      case 'error':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'warning':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getErrorIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  if (!errors || errors.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        暂无错误记录</div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {errors.map((error, index) => (
        <div
          key={index}
          className={`p-4 rounded-lg border mb-4 ${getErrorTypeStyles(error.type)}`}
        >
          <div className="flex items-start space-x-3">
            {getErrorIcon(error.type)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-medium truncate">{error.message}</p>
                <span className="text-sm text-gray-500">
                  {new Date(error.timestamp).toLocaleString()}
                </span>
              </div>
              
              {error.details && (
                <div className="mt-2 text-sm space-y-1">
                  {Object.entries(error.details).map(([key, value]) => (
                    <div key={key} className="flex items-center">
                      <ChevronRight className="w-4 h-4 mr-1 opacity-50" />
                      <span className="font-medium mr-2">{key}:</span>
                      <span className="break-all">{JSON.stringify(value)}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {error.stack && (
                <div className="mt-2">
                  <details className="text-sm">
                    <summary className="cursor-pointer hover:text-gray-600">
                      查看详细信息
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-50 rounded overflow-x-auto text-xs">
                      {error.stack}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ErrorLog;