// services/logger.js
class Logger {
    constructor() {
        this.logLevels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        };

        this.currentLevel = this.logLevels.info;
        this.logs = [];
        this.maxLogs = 1000;
    }

    formatMessage(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        return {
            timestamp,
            level,
            message,
            meta: {
                ...meta,
                environment: process.env.NODE_ENV || 'development'
            }
        };
    }

    storelog(logEntry) {
        this.logs.unshift(logEntry);
        if (this.logs.length > this.maxLogs) {
            this.logs.pop();
        }
    }

    error(message, meta = {}) {
        if (this.currentLevel >= this.logLevels.error) {
            const logEntry = this.formatMessage('error', message, meta);
            console.error(`[ERROR] ${logEntry.timestamp}:`, message, meta);
            this.storelog(logEntry);
        }
    }

    warn(message, meta = {}) {
        if (this.currentLevel >= this.logLevels.warn) {
            const logEntry = this.formatMessage('warn', message, meta);
            console.warn(`[WARN] ${logEntry.timestamp}:`, message, meta);
            this.storelog(logEntry);
        }
    }

    info(message, meta = {}) {
        if (this.currentLevel >= this.logLevels.info) {
            const logEntry = this.formatMessage('info', message, meta);
            console.info(`[INFO] ${logEntry.timestamp}:`, message, meta);
            this.storelog(logEntry);
        }
    }

    debug(message, meta = {}) {
        if (this.currentLevel >= this.logLevels.debug) {
            const logEntry = this.formatMessage('debug', message, meta);
            console.debug(`[DEBUG] ${logEntry.timestamp}:`, message, meta);
            this.storelog(logEntry);
        }
    }

    setLevel(level) {
        if (this.logLevels.hasOwnProperty(level)) {
            this.currentLevel = this.logLevels[level];
        }
    }

    getLogs(level = null, limit = 100) {
        let filteredLogs = this.logs;
        if (level) {
            filteredLogs = this.logs.filter(log => log.level === level);
        }
        return filteredLogs.slice(0, limit);
    }

    clearLogs() {
        this.logs = [];
    }
}

const logger = new Logger();
export { logger };