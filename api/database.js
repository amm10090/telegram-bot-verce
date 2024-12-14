import { MongoClient } from 'mongodb';
import { logger } from '../services/logger';
import { DatabaseError } from './types.js';

class DatabaseManager {
    constructor() {
        this.client = null;
        this.db = null;
        this.connectionOptions = {
            ssl: true,
            tls: true,
            tlsAllowInvalidCertificates: false,
            minPoolSize: 1,
            maxPoolSize: 10,
            retryWrites: true,
            w: 'majority',
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 10000,
            readPreference: 'primary'
        };
    }

    async connect() {
        if (this.db) {
            return this.db;
        }

        try {
            this.client = await MongoClient.connect(
                process.env.MONGODB_URI,
                this.connectionOptions
            );
            this.db = this.client.db('bot_monitoring');
            logger.info('数据库连接成功');
            return this.db;
        } catch (error) {
            logger.error('数据库连接失败', error);
            throw new DatabaseError('数据库连接失败', error);
        }
    }

    async getCollection(name) {
        const db = await this.connect();
        return db.collection(name);
    }

    async executeTransaction(operations) {
        const session = this.client.startSession();
        try {
            await session.withTransaction(async () => {
                await operations(this.db, session);
            });
        } catch (error) {
            logger.error('事务执行失败', error);
            throw new DatabaseError('事务执行失败', error);
        } finally {
            await session.endSession();
        }
    }

    async disconnect() {
        if (this.client) {
            try {
                await this.client.close();
                this.client = null;
                this.db = null;
                logger.info('数据库连接已关闭');
            } catch (error) {
                logger.error('数据库关闭失败', error);
                throw new DatabaseError('数据库关闭失败', error);
            }
        }
    }

    isConnected() {
        return !!(this.client?.topology?.isConnected?.());
    }
}

export const dbManager = new DatabaseManager();