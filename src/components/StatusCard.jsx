import React from 'react';

const StatusCard = ({ title, value, icon, type = 'info' }) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'warning':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'error':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className={`rounded-lg p-6 border ${getTypeStyles()}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="font-medium">{title}</div>
        <div className="text-opacity-80">{icon}</div>
      </div>
      <div className="text-2xl font-bold">
        {value}
      </div>
    </div>
  );
};

export default StatusCard;