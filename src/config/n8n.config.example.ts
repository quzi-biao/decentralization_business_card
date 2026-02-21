/**
 * n8n 配置文件示例
 * 
 * 使用说明：
 * 1. 复制 .env.example 为 .env
 * 2. 在 .env 中填入真实的配置值
 * 3. 本文件展示了如何从环境变量读取配置
 */

// 注意：在 React Native 中，环境变量需要通过 app.config.js 或 expo-constants 访问
// 这里提供一个示例配置结构

export const N8N_CONFIG = {
    // n8n 服务器地址列表（按优先级排序）
    baseUrls: [
        process.env.N8N_BASE_URL || 'https://your-n8n-server.com',
        // 可以添加备用地址
    ],
    
    // 当前使用的服务器地址
    baseUrl: process.env.N8N_BASE_URL || 'https://your-n8n-server.com',
    
    // API Key - 从环境变量读取
    apiKey: process.env.N8N_API_KEY || '',
    
    // AI Agent Webhook 路径
    agentWebhookPath: process.env.N8N_AGENT_WEBHOOK_PATH || '',
    
    // Workflow IDs
    agentWorkflowId: process.env.N8N_AGENT_WORKFLOW_ID || '',
    apiKeyWorkflowId: process.env.N8N_API_KEY_WORKFLOW_ID || '',
    
    // Webhook 路径
    apiKeyWebhookPath: process.env.N8N_API_KEY_WEBHOOK_PATH || '',
    speechToTextWebhookPath: process.env.N8N_SPEECH_TO_TEXT_WEBHOOK_PATH || 'speech-to-text',
    
    // 语音识别 Workflow ID
    speechToTextWorkflowId: process.env.N8N_SPEECH_TO_TEXT_WORKFLOW_ID || '',
    
    // 健康检查超时时间（毫秒）
    healthCheckTimeout: 3000,
};

/**
 * n8n Webhook 调用方式说明：
 * 
 * 1. 在 n8n 中创建一个新的 Workflow
 * 2. 添加 "Webhook" 触发器节点
 * 3. 设置 Webhook 路径，例如：business-card-agent
 * 4. 添加 AI Agent 节点（如 OpenAI Chat Model）
 * 5. 配置 Agent 的 prompt 和参数
 * 6. 添加 "Respond to Webhook" 节点返回结果
 * 7. 激活 Workflow
 * 
 * 调用 URL 格式：
 * POST https://your-n8n-server.com/webhook/business-card-agent
 * 
 * 请求体示例：
 * {
 *   "chatInput": "你好，请介绍一下这个名片系统",
 *   "sessionId": "user-did-xxx"
 * }
 */
