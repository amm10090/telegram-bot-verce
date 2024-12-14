// utils/timeZone.js
import { logger } from '../services/logger';

class TimeZoneUtil {
    constructor() {
        // 默认时区设置
        this.defaultTimeZone = 'Asia/Shanghai';

        // 支持的时区映射
        this.timeZoneMap = new Map([
            ['CN', 'Asia/Shanghai'],
            ['HK', 'Asia/Hong_Kong'],
            ['TW', 'Asia/Taipei'],
            ['SG', 'Asia/Singapore'],
            ['JP', 'Asia/Tokyo']
        ]);

        // 时区偏移缓存
        this.offsetCache = new Map();
    }

    // 获取指定时区的当前时间
    getCurrentTime(timeZone = this.defaultTimeZone) {
        try {
            const options = { timeZone };
            return new Date().toLocaleString('zh-CN', options);
        } catch (error) {
            logger.error('获取当前时间失败', { timeZone, error: error.message });
            // 发生错误时返回系统默认时区的时间
            return new Date().toLocaleString('zh-CN');
        }
    }

    // 转换时间到指定时区
    convertToTimeZone(date, timeZone = this.defaultTimeZone) {
        try {
            const options = {
                timeZone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            };

            return new Date(date).toLocaleString('zh-CN', options);
        } catch (error) {
            logger.error('时区转换失败', { timeZone, error: error.message });
            return date;
        }
    }

    // 获取时区偏移量(小时)
    getTimeZoneOffset(timeZone = this.defaultTimeZone) {
        try {
            // 检查缓存
            if (this.offsetCache.has(timeZone)) {
                return this.offsetCache.get(timeZone);
            }

            const date = new Date();
            const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
            const tzDate = new Date(date.toLocaleString('en-US', { timeZone }));
            const offset = (tzDate - utcDate) / (1000 * 60 * 60);

            // 更新缓存
            this.offsetCache.set(timeZone, offset);

            return offset;
        } catch (error) {
            logger.error('获取时区偏移量失败', { timeZone, error: error.message });
            return 0;
        }
    }

    // 格式化日期时间
    formatDateTime(date, format = 'YYYY-MM-DD HH:mm:ss', timeZone = this.defaultTimeZone) {
        try {
            const tzDate = new Date(this.convertToTimeZone(date, timeZone));

            const tokens = {
                YYYY: tzDate.getFullYear(),
                MM: String(tzDate.getMonth() + 1).padStart(2, '0'),
                DD: String(tzDate.getDate()).padStart(2, '0'),
                HH: String(tzDate.getHours()).padStart(2, '0'),
                mm: String(tzDate.getMinutes()).padStart(2, '0'),
                ss: String(tzDate.getSeconds()).padStart(2, '0')
            };

            return format.replace(/YYYY|MM|DD|HH|mm|ss/g, match => tokens[match]);
        } catch (error) {
            logger.error('日期格式化失败', { format, error: error.message });
            return date.toString();
        }
    }

    // 判断是否为工作时间
    isBusinessHour(date = new Date(), timeZone = this.defaultTimeZone) {
        try {
            const tzTime = new Date(this.convertToTimeZone(date, timeZone));
            const hour = tzTime.getHours();
            const dayOfWeek = tzTime.getDay();

            // 判断是否为工作日(周一到周五)
            const isWorkday = dayOfWeek >= 1 && dayOfWeek <= 5;
            // 判断是否为工作时间(9:00-18:00)
            const isWorkHour = hour >= 9 && hour < 18;

            return isWorkday && isWorkHour;
        } catch (error) {
            logger.error('判断工作时间失败', { timeZone, error: error.message });
            return false;
        }
    }

    // 获取支持的时区列表
    getSupportedTimeZones() {
        return Array.from(this.timeZoneMap.entries()).map(([code, zone]) => ({
            code,
            zone,
            offset: this.getTimeZoneOffset(zone)
        }));
    }
}

// 导出时区工具实例
export const timeZoneUtil = new TimeZoneUtil();