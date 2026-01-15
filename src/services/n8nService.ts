import { getIdentity } from './identityService';
import { N8N_CONFIG } from '../config/n8n.config';

let currentBaseUrl: string | null = null;
let lastHealthCheck: number = 0;
const HEALTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5分钟重新检测一次

let cachedAIApiKey: string | null = null;
let apiKeyExpireTime: number = 0;
const API_KEY_CACHE_DURATION = 60 * 60 * 1000; // API Key 缓存1小时

/**
 * 检测单个服务器是否可用
 */
async function checkServerHealth(baseUrl: string): Promise<boolean> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), N8N_CONFIG.healthCheckTimeout);
        
        const response = await fetch(`${baseUrl}/healthz`, {
            method: 'GET',
            signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        return response.ok;
    } catch (error) {
        return false;
    }
}

/**
 * 自动检测并选择可用的 n8n 服务器
 */
async function getAvailableBaseUrl(): Promise<string> {
    const now = Date.now();
    
    // 如果最近检测过且有可用服务器，直接返回
    if (currentBaseUrl && (now - lastHealthCheck) < HEALTH_CHECK_INTERVAL) {
        return currentBaseUrl;
    }
    
    // 按优先级检测所有服务器
    for (const baseUrl of N8N_CONFIG.baseUrls) {
        console.log(`检测 n8n 服务器: ${baseUrl}`);
        const isHealthy = await checkServerHealth(baseUrl);
        
        if (isHealthy) {
            console.log(`✓ 使用 n8n 服务器: ${baseUrl}`);
            currentBaseUrl = baseUrl;
            lastHealthCheck = now;
            N8N_CONFIG.baseUrl = baseUrl; // 更新配置
            return baseUrl;
        }
    }
    
    // 如果所有服务器都不可用，使用第一个作为默认值
    console.warn('所有 n8n 服务器都不可用，使用默认地址');
    currentBaseUrl = N8N_CONFIG.baseUrls[0];
    return currentBaseUrl;
}

export interface N8NAgentRequest {
    chatInput: string;
    sessionId?: string;
    imageUrl?: string; // 图片 URL，用于 Vision API
    evaluation?: string; // 评分模式，设置为 "1" 时导向评分 agent
}

export interface N8NAgentResponse {
    output: string;
    sessionId: string;
}

/**
 * 获取 AI API Key
 * 通过调用指定的 workflow 获取动态 API Key
 */
async function getAIApiKey(): Promise<string> {
    const now = Date.now();
    
    // 如果缓存的 API Key 还未过期，直接返回
    if (cachedAIApiKey && now < apiKeyExpireTime) {
        console.log('使用缓存的 AI API Key');
        return cachedAIApiKey;
    }
    
    try {
        console.log('获取新的 AI API Key...');
        const baseUrl = await getAvailableBaseUrl();
        
        // 使用 webhook 方式调用获取 API Key 的 workflow (GET 方法)
        const webhookUrl = `${baseUrl}/webhook/${N8N_CONFIG.apiKeyWebhookPath}`;
        console.log('API Key Webhook URL:', webhookUrl);
        
        const response = await fetch(webhookUrl, {
            method: 'GET',
        });
        
        console.log('API Key 响应状态:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Key 错误响应:', errorText);
            throw new Error(`Failed to get AI API Key: ${response.status}`);
        }
        
        // 响应可能是直接的字符串或 JSON
        const contentType = response.headers.get('content-type');
        let apiKey: string;
        
        if (contentType?.includes('application/json')) {
            const data = await response.json();
            console.log('API Key 响应数据 (JSON):', data);
            apiKey = data.apiKey || data.key || data.data?.apiKey || data;
        } else {
            // 直接返回字符串
            apiKey = await response.text();
            console.log('API Key 响应数据 (文本):', apiKey.substring(0, 50) + '...');
        }
        
        if (!apiKey) {
            throw new Error('API Key not found in response');
        }
        
        // 缓存 API Key
        cachedAIApiKey = apiKey;
        apiKeyExpireTime = now + API_KEY_CACHE_DURATION;
        
        console.log('✓ 成功获取 AI API Key');
        return apiKey;
    } catch (error) {
        console.error('获取 AI API Key 失败:', error);
        throw error;
    }
}

/**
 * 调用 n8n AI Agent
 * @param workflowId - n8n workflow ID 或 webhook 路径
 * @param message - 发送给 AI 的消息
 * @param sessionId - 可选的会话 ID，用于保持对话上下文
 * @param useAPI - 是否使用 API 方式
 * @param imageUrl - 图片 URL，用于 Vision API
 * @param evaluation - 评分模式，设置为 "1" 时导向评分 agent
 */
export async function callN8NAgent(
    workflowId: string,
    message: string,
    sessionId?: string,
    useAPI: boolean = false,
    imageUrl?: string,
    evaluation?: string
): Promise<N8NAgentResponse> {
    try {
        const identity = await getIdentity();
        if (!identity) {
            throw new Error('Identity not initialized');
        }
        
        // 第一步：获取 AI API Key
        const aiApiKey = await getAIApiKey();
        
        // 第二步：获取可用的服务器地址
        const baseUrl = await getAvailableBaseUrl();
        
        const requestBody: N8NAgentRequest = {
            chatInput: message,
            sessionId: sessionId || identity.did,
            imageUrl: imageUrl, // 传递图片 URL 给 n8n
            evaluation: evaluation, // 传递评分参数
        };
        
        // 尝试 Webhook 方式
        if (!useAPI) {
            try {
                const webhookUrl = `${baseUrl}/webhook/${workflowId}`;
                const response = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-AI-API-KEY': aiApiKey,
                    },
                    body: JSON.stringify(requestBody),
                });
                
                if (response.ok) {
                    const data = await response.json();
                    return {
                        output: data.output || data.text || data.response || '',
                        sessionId: data.sessionId || sessionId || identity.did,
                    };
                }
                
                console.log('Webhook failed, falling back to API method');
            } catch (webhookError) {
                console.log('Webhook error, falling back to API method:', webhookError);
            }
        }
        
        // 使用 API 方式作为后备
        const apiUrl = `${baseUrl}/api/v1/workflows/${workflowId}/execute`;
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-N8N-API-KEY': N8N_CONFIG.apiKey,
                'X-AI-API-KEY': aiApiKey,
            },
            body: JSON.stringify(requestBody),
        });
        
        if (!response.ok) {
            throw new Error(`N8N API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        return {
            output: data.output || data.text || data.response || '',
            sessionId: data.sessionId || sessionId || identity.did,
        };
    } catch (error) {
        console.error('Error calling N8N Agent:', error);
        throw error;
    }
}

/**
 * 使用 n8n API 方式执行 workflow
 * @param workflowId - workflow ID
 * @param inputData - 输入数据
 */
export async function executeN8NWorkflow(
    workflowId: string,
    inputData: any
): Promise<any> {
    try {
        const baseUrl = await getAvailableBaseUrl();
        const url = `${baseUrl}/api/v1/workflows/${workflowId}/execute`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-N8N-API-KEY': N8N_CONFIG.apiKey,
            },
            body: JSON.stringify(inputData),
        });
        
        if (!response.ok) {
            throw new Error(`N8N API Error: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error executing N8N Workflow:', error);
        throw error;
    }
}

/**
 * 测试 n8n 连接
 */
export async function testN8NConnection(): Promise<boolean> {
    try {
        const baseUrl = await getAvailableBaseUrl();
        return currentBaseUrl !== null;
    } catch (error) {
        console.error('N8N connection test failed:', error);
        return false;
    }
}

/**
 * 获取当前使用的服务器地址
 */
export function getCurrentBaseUrl(): string | null {
    return currentBaseUrl;
}

/**
 * 强制重新检测服务器
 */
export async function forceServerRecheck(): Promise<string> {
    lastHealthCheck = 0;
    currentBaseUrl = null;
    return await getAvailableBaseUrl();
}

/**
 * 清除 AI API Key 缓存
 * 强制下次调用时重新获取
 */
export function clearAIApiKeyCache(): void {
    cachedAIApiKey = null;
    apiKeyExpireTime = 0;
    console.log('AI API Key 缓存已清除');
}

/**
 * 手动设置 AI API Key（用于测试）
 */
export function setAIApiKey(apiKey: string, durationMs: number = API_KEY_CACHE_DURATION): void {
    cachedAIApiKey = apiKey;
    apiKeyExpireTime = Date.now() + durationMs;
    console.log('AI API Key 已手动设置');
}
