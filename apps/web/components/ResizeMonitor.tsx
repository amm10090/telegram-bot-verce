// components/ResizeMonitor.tsx
import React, { useEffect, useRef, useState } from 'react';

interface ResizeMonitorProps {
  children: React.ReactNode;
  enableLogging?: boolean;
  className?: string;
}

interface DeviceInfo {
  width: number;
  height: number;
  isMobile: boolean;
  devicePixelRatio: number;
  userAgent: string;
  orientation: string;
  timestamp: string;
}

/**
 * 增强版的 ResizeMonitor 组件
 * - 添加了更多设备信息的监控
 * - 增加了设备类型的判断逻辑
 * - 提供了更详细的调试信息
 */
const ResizeMonitor: React.FC<ResizeMonitorProps> = ({
  children,
  enableLogging = true,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    width: 0,
    height: 0,
    isMobile: false,
    devicePixelRatio: 1,
    userAgent: '',
    orientation: '',
    timestamp: '',
  });

  // 检测设备类型的函数
  const checkDeviceType = () => {
    const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const touchEnabled = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    return mobile || touchEnabled;
  };

  // 获取设备方向
  const getOrientation = () => {
    if (window.screen && window.screen.orientation) {
      return window.screen.orientation.type;
    }
    return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
  };

  useEffect(() => {
    const updateDeviceInfo = (entries?: ResizeObserverEntry[]) => {
      const width = entries?.[0]?.contentRect.width || containerRef.current?.clientWidth || 0;
      const height = entries?.[0]?.contentRect.height || containerRef.current?.clientHeight || 0;

      const newDeviceInfo: DeviceInfo = {
        width,
        height,
        isMobile: checkDeviceType(),
        devicePixelRatio: window.devicePixelRatio,
        userAgent: navigator.userAgent,
        orientation: getOrientation(),
        timestamp: new Date().toLocaleTimeString(),
      };

      setDeviceInfo(newDeviceInfo);

      if (enableLogging) {
        console.log('设备信息更新:', {
          ...newDeviceInfo,
          breakpoint: width <= 768 ? 'mobile' : width <= 1024 ? 'tablet' : 'desktop',
          cssMediaQuery: window.matchMedia('(max-width: 768px)').matches ? 'mobile' : 'desktop',
        });
      }
    };

    // 创建 ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      updateDeviceInfo(entries);
    });

    // 初始更新
    updateDeviceInfo();

    // 开始观察
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // 监听方向变化
    const orientationHandler = () => updateDeviceInfo();
    window.addEventListener('orientationchange', orientationHandler);

    // 清理函数
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('orientationchange', orientationHandler);
    };
  }, [enableLogging]);

  return (
    <div
      ref={containerRef}
      className={`resize-monitor ${className}`}
      style={{ width: '100%', height: '100%' }}
    >
      {children}
      
      {/* 调试信息浮层 */}
      <div className="fixed bottom-4 right-4 bg-black/75 text-white p-2 rounded-md text-sm pointer-events-none z-50">
        <div>宽度: {Math.round(deviceInfo.width)}px</div>
        <div>高度: {Math.round(deviceInfo.height)}px</div>
        <div>设备类型: {deviceInfo.isMobile ? '移动端' : '桌面端'}</div>
        <div>设备像素比: {deviceInfo.devicePixelRatio}</div>
        <div>屏幕方向: {deviceInfo.orientation}</div>
      </div>
    </div>
  );
};

export default ResizeMonitor;