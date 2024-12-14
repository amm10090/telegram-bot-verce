// api/database.js
import { MongoClient } from 'mongodb';
import { logger } from '../services/logger.js';
import { DatabaseError } from './types.js';

class DatabaseManager {
    constructor() {
        this.connectionOptions = {
            ...this.connectionOptions,
            reconnectTries: 3,
            reconnectInterval: 1000,
            autoReconnect: true,
            poolSize: 10
        };
        this.healthCheck = setInterval(() => this.checkConnection(), 30000);
    }

    async checkConnection() {
        if (!this.isConnected()) {
            logger.warn('数据库连接断开，尝试重新连接');
            await this.connect();
        }
    }
}

export const dbManager = new DatabaseManager();