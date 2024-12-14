import React from 'react';

const MetricsCard = ({ title, value, icon, trend, trendLabel }) => {
    const getTrendColor = () => {
        if (!trend) return 'text-gray-500';
        return trend > 0 ? 'text-green-500' : 'text-red-500';
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
                <div className="text-gray-400">{icon}</div>
            </div>
            <div className="flex items-end justify-between">
                <div className="text-2xl font-semibold text-gray-900">{value}</div>
                {trend && (
                    <div className={`flex items-center ${getTrendColor()}`}>
                        <span className="text-sm font-medium">{trend}%</span>
                        <span className="text-xs ml-1">{trendLabel}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MetricsCard;