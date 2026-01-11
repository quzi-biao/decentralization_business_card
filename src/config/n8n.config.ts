/**
 * n8n 配置文件
 * 
 * 使用说明：
 * 1. 将此文件复制为 n8n.config.local.ts
 * 2. 在 .gitignore 中添加 *.local.ts
 * 3. 在 local 文件中填入真实的 API Key
 */

export const N8N_CONFIG = {
    // n8n 服务器地址列表（按优先级排序）
    baseUrls: [
        'http://101.34.87.172:5678',      // 优先使用 IP 地址
        'https://n8n.waters-ai.work',     // 备用域名 1
        'https://n8n.quzi-tech.xyz',      // 备用域名 2
    ],
    
    // 当前使用的服务器地址（运行时自动选择）
    baseUrl: 'http://101.34.87.172:5678',
    
    // API Key - 请在 n8n 设置中生成
    // 路径：Settings > API > Create API Key
    apiKey: process.env.N8N_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTVlNzNmYS0zNWE2LTRiMjItYWM1Yi0yMTU3ZWM0N2UyMjEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY4MTQyNjIxfQ.srEtupJd_zxll1FJBAk96Bvssi9x08TGco0ipADanLY',
    
    // AI Agent Webhook 路径
    // 在 n8n 中创建 webhook 触发器后获得
    agentWebhookPath: 'f18884f3-9866-4649-a82b-543ac6873d6f',
    
    // 或者使用 Workflow ID（如果使用 API 方式）
    agentWorkflowId: 'KVico7Zps62RFNb4',
    
    // 获取 AI API Key 的 Workflow ID
    apiKeyWorkflowId: 'jDf6woXVzj2k_0wGWViwy',
    
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
 * POST http://101.34.87.172:5678/webhook/business-card-agent
 * 
 * 请求体示例：
 * {
 *   "chatInput": "你好，请介绍一下这个名片系统",
 *   "sessionId": "user-did-xxx"
 * }
 */
