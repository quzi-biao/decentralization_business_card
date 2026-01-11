# n8n AI Agent 集成指南

## 1. 在 n8n 中配置 AI Agent

### 步骤 1: 创建 Webhook Workflow

1. 登录你的 n8n: `http://101.34.87.172:5678`
2. 创建新的 Workflow
3. 添加 **Webhook** 节点作为触发器

### 步骤 2: 配置 Webhook 节点

```
Webhook 节点设置：
- HTTP Method: POST
- Path: business-card-agent (自定义路径)
- Response Mode: When Last Node Finishes
- Response Data: First Entry JSON
```

### 步骤 3: 添加 AI Agent 节点

推荐节点：
- **OpenAI Chat Model** - 使用 GPT-4 或 GPT-3.5
- **Anthropic Claude** - 使用 Claude 3
- **LangChain Agent** - 更复杂的 Agent 功能

配置示例（OpenAI）：
```
Model: gpt-4
System Message: 你是一个专业的商务名片助手，帮助用户管理和优化他们的商务名片信息。
User Message: {{ $json.chatInput }}
Temperature: 0.7
Max Tokens: 500
```

### 步骤 4: 处理输入数据

添加 **Set** 节点来提取 webhook 数据：
```json
{
  "chatInput": "={{ $json.body.chatInput }}",
  "sessionId": "={{ $json.body.sessionId }}"
}
```

### 步骤 5: 返回响应

添加 **Respond to Webhook** 节点：
```json
{
  "output": "={{ $json.output }}",
  "sessionId": "={{ $json.sessionId }}"
}
```

### 步骤 6: 激活 Workflow

点击右上角的 **Active** 开关激活 Workflow

## 2. 获取 API Key

1. 进入 n8n 设置: `http://101.34.87.172:5678/settings/api`
2. 点击 **Create API Key**
3. 复制生成的 API Key
4. 保存到项目配置文件

## 3. 在项目中配置

### 方法 1: 使用环境变量（推荐）

创建 `.env` 文件：
```bash
N8N_API_KEY=your_actual_api_key_here
N8N_WEBHOOK_PATH=business-card-agent
```

### 方法 2: 修改配置文件

编辑 `src/config/n8n.config.ts`:
```typescript
export const N8N_CONFIG = {
    baseUrl: 'http://101.34.87.172:5678',
    apiKey: 'n8n_api_xxxxxxxxxxxxx', // 你的真实 API Key
    agentWebhookPath: 'business-card-agent', // 你的 webhook 路径
};
```

## 4. 使用示例

### 基础调用

```typescript
import { callN8NAgent } from './services/n8nService';
import { N8N_CONFIG } from './config/n8n.config';

// 发送消息给 AI Agent
const response = await callN8NAgent(
    N8N_CONFIG.agentWebhookPath,
    '请帮我优化名片上的个人简介',
    'user-session-123'
);

console.log(response.output); // AI 的回复
```

### 在组件中使用

```typescript
import React, { useState } from 'react';
import { callN8NAgent } from '../services/n8nService';

function MyComponent() {
    const [response, setResponse] = useState('');
    
    const askAI = async () => {
        try {
            const result = await callN8NAgent(
                'business-card-agent',
                '你好，请介绍一下自己',
                'session-001'
            );
            setResponse(result.output);
        } catch (error) {
            console.error('AI 调用失败:', error);
        }
    };
    
    return (
        <button onClick={askAI}>询问 AI</button>
    );
}
```

## 5. 测试 API 连接

使用 curl 测试：

```bash
# 测试 n8n 健康状态
curl http://101.34.87.172:5678/healthz

# 测试 webhook
curl -X POST http://101.34.87.172:5678/webhook/business-card-agent \
  -H "Content-Type: application/json" \
  -H "X-N8N-API-KEY: your_api_key" \
  -d '{
    "chatInput": "你好",
    "sessionId": "test-session"
  }'
```

## 6. 常见问题

### Q: 如何保持对话上下文？
A: 使用相同的 `sessionId` 进行多次调用。建议使用用户的 DID 作为 sessionId。

### Q: 如何限制 API 调用次数？
A: 在 n8n workflow 中添加 Rate Limit 节点，或在后端实现频率限制。

### Q: 如何处理超时？
A: 在 fetch 请求中添加 timeout：
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

fetch(url, {
    signal: controller.signal,
    // ...
});
```

### Q: 如何保护 API Key？
A: 
1. 永远不要将 API Key 提交到 Git
2. 使用环境变量
3. 考虑使用后端代理服务
4. 在 n8n 中设置 IP 白名单

## 7. 安全建议

1. **使用 HTTPS**: 将 n8n 部署在 HTTPS 后面
2. **API Key 轮换**: 定期更换 API Key
3. **请求验证**: 在 n8n 中验证请求来源
4. **速率限制**: 防止 API 滥用
5. **日志监控**: 监控异常调用模式

## 8. n8n Workflow 示例

完整的 AI Agent Workflow JSON：

```json
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300],
      "webhookId": "business-card-agent",
      "parameters": {
        "httpMethod": "POST",
        "path": "business-card-agent",
        "responseMode": "lastNode"
      }
    },
    {
      "name": "OpenAI Chat",
      "type": "@n8n/n8n-nodes-langchain.openAi",
      "position": [450, 300],
      "parameters": {
        "model": "gpt-4",
        "messages": {
          "values": [
            {
              "role": "system",
              "content": "你是一个专业的商务名片助手"
            },
            {
              "role": "user",
              "content": "={{ $json.chatInput }}"
            }
          ]
        }
      }
    },
    {
      "name": "Respond",
      "type": "n8n-nodes-base.respondToWebhook",
      "position": [650, 300],
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ { \"output\": $json.output, \"sessionId\": $('Webhook').item.json.body.sessionId } }}"
      }
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{ "node": "OpenAI Chat", "type": "main", "index": 0 }]]
    },
    "OpenAI Chat": {
      "main": [[{ "node": "Respond", "type": "main", "index": 0 }]]
    }
  }
}
```

## 9. 下一步

- [ ] 配置 n8n AI Agent Workflow
- [ ] 获取并配置 API Key
- [ ] 测试 API 连接
- [ ] 在应用中集成 AI 助手页面
- [ ] 添加错误处理和重试逻辑
- [ ] 实现对话历史存储
