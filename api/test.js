// api/test.js

/**
 * 测试端点
 * 这个文件用于验证服务器的基本功能和webhook的配置是否正确
 * 它提供了多种测试方法来模拟不同的请求场景
 */

// 用于存储测试会话的临时数据
const testSessions = new Map();

export default async function handler(request, response) {
    // 记录每个测试请求的详细信息，帮助调试
    console.log('Test endpoint accessed:', {
        timestamp: new Date().toISOString(),
        method: request.method,
        path: request.url,
        headers: request.headers,
        query: request.query,
        body: request.body
    });

    // 设置通用的响应头
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 处理预检请求 - 对跨域请求的支持
    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }

    try {
        // 根据不同的请求方法提供不同的测试功能
        switch (request.method) {
            case 'GET':
                return handleGetRequest(request, response);
            case 'POST':
                return handlePostRequest(request, response);
            default:
                return response.status(405).json({
                    status: 'error',
                    message: 'Method not allowed',
                    allowedMethods: ['GET', 'POST', 'OPTIONS']
                });
        }
    } catch (error) {
        // 错误处理和日志记录
        console.error('Test endpoint error:', {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });

        return response.status(500).json({
            status: 'error',
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'production' ? 'Server error' : error.message
        });
    }
}

/**
 * 处理 GET 请求
 * 提供基本的服务器状态检查和各种测试场景
 */
async function handleGetRequest(request, response) {
    // 解析查询参数
    const { test_type = 'status' } = request.query;

    // 根据不同的测试类型返回不同的响应
    switch (test_type) {
        case 'status':
            // 基本的服务器状态检查
            return response.status(200).json({
                status: 'ok',
                message: 'Test endpoint is working',
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'development',
                serverTime: new Date().toISOString()
            });

        case 'echo':
            // 回显所有查询参数，用于测试参数传递
            return response.status(200).json({
                status: 'ok',
                query_parameters: request.query,
                timestamp: new Date().toISOString()
            });

        case 'headers':
            // 显示请求头信息，用于诊断问题
            return response.status(200).json({
                status: 'ok',
                headers: request.headers,
                timestamp: new Date().toISOString()
            });

        default:
            return response.status(400).json({
                status: 'error',
                message: 'Unknown test type',
                validTestTypes: ['status', 'echo', 'headers']
            });
    }
}

/**
 * 处理 POST 请求
 * 模拟 webhook 的行为并提供测试响应
 */
async function handlePostRequest(request, response) {
    // 验证请求体
    if (!request.body) {
        return response.status(400).json({
            status: 'error',
            message: 'Request body is required'
        });
    }

    try {
        // 记录测试会话信息
        const sessionId = Math.random().toString(36).substring(7);
        testSessions.set(sessionId, {
            timestamp: new Date(),
            requestBody: request.body
        });

        // 模拟 webhook 处理延迟
        await new Promise(resolve => setTimeout(resolve, 100));

        // 返回测试结果
        return response.status(200).json({
            status: 'ok',
            message: 'Test POST request processed successfully',
            sessionId,
            receivedData: {
                bodySize: JSON.stringify(request.body).length,
                timestamp: new Date().toISOString(),
                contentSummary: summarizeContent(request.body)
            }
        });
    } catch (error) {
        console.error('POST request processing error:', error);
        return response.status(500).json({
            status: 'error',
            message: 'Error processing POST request',
            error: process.env.NODE_ENV === 'production' ? 'Server error' : error.message
        });
    }
}

/**
 * 辅助函数：总结请求内容
 * 用于在日志中提供请求内容的概览
 */
function summarizeContent(body) {
    try {
        const summary = {
            fields: Object.keys(body),
            totalFields: Object.keys(body).length
        };

        // 如果是 Telegram 更新消息，添加特定信息
        if (body.update_id) {
            summary.updateId = body.update_id;
            summary.messageType = body.message ? 'message' :
                body.callback_query ? 'callback_query' :
                    'other';
        }

        return summary;
    } catch (error) {
        return 'Could not summarize content';
    }
}