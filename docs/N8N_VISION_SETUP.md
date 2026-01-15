# n8n Vision API 配置指南

## 概述

本文档说明如何在 n8n AI 助手 workflow 中添加图片识别能力，实现名片、证件、文档的 OCR 识别和信息提取。

## 推荐方案：使用 OpenRouter

OpenRouter 提供统一的 API 接口，支持多个 Vision 模型，配置简单且价格透明。

### 支持的 Vision 模型

#### 国际模型（通过 OpenRouter）

| 模型 | 价格（输入/输出） | 特点 | 推荐度 |
|------|------------------|------|--------|
| `anthropic/claude-3.5-sonnet` | $3/$15 per 1M tokens | 准确度最高，中文支持好 | ⭐⭐⭐⭐⭐ |
| `google/gemini-pro-1.5` | $1.25/$5 per 1M tokens | 性价比高 | ⭐⭐⭐⭐ |
| `openai/gpt-4o` | $5/$15 per 1M tokens | OpenAI 最新 | ⭐⭐⭐⭐ |
| `meta-llama/llama-3.2-90b-vision` | $0.9/$0.9 per 1M tokens | 开源，最便宜 | ⭐⭐⭐ |

#### 中国可用模型（推荐）

| 模型 | 价格 | 特点 | 推荐度 | API 提供商 |
|------|------|------|--------|-----------|
| **通义千问 VL Plus** | ¥0.008/千tokens | 专为中文优化，名片识别准确 | ⭐⭐⭐⭐⭐ | 阿里云 |
| **GLM-4V** | ¥0.05/千tokens | 智谱 AI，中文理解强 | ⭐⭐⭐⭐ | 智谱 AI |
| **文心一言 4.0** | ¥0.012/千tokens | 百度，稳定可靠 | ⭐⭐⭐⭐ | 百度智能云 |
| **讯飞星火 Vision** | ¥0.036/千tokens | 科大讯飞，OCR 准确 | ⭐⭐⭐⭐ | 讯飞开放平台 |

**中国用户推荐**：
- **首选**：通义千问 VL Plus（价格便宜，中文名片识别效果最好）
- **备选**：GLM-4V（智谱 AI，效果也很好）

**国际用户推荐**：`anthropic/claude-3.5-sonnet`（通过 OpenRouter）

## Workflow 配置

### 节点流程图

```
Webhook (接收请求)
  ↓
Set (提取 chatInput, imageUrl, sessionId)
  ↓
IF (检查是否有图片)
  ↓
  ├─ True → Code (构建 Vision 请求) → HTTP Request (OpenRouter Vision)
  │                                        ↓
  └─ False → Code (构建普通请求) → HTTP Request (OpenRouter Chat)
                                           ↓
Merge (合并两个分支)
  ↓
Code (解析响应，提取 JSON)
  ↓
Respond to Webhook
```

### 节点 1: Webhook 触发器

- **Path**: `f18884f3-9866-4649-a82b-543ac6873d6f`（或你的自定义路径）
- **HTTP Method**: POST
- **Response Mode**: When Last Node Finishes

### 节点 2: Set（提取输入数据）

**Values to Set**:
```javascript
{
  "chatInput": "={{ $json.body.chatInput || $json.chatInput }}",
  "imageUrl": "={{ $json.body.imageUrl || $json.imageUrl }}",
  "sessionId": "={{ $json.body.sessionId || $json.sessionId }}"
}
```

### 节点 3: IF（判断是否有图片）

**Conditions**: Filter

**条件配置**:
- **Field**: `imageUrl`
- **Operation**: `is not empty`

**注意**：不要使用表达式 `{{ $json.imageUrl ? true : false }}`，会报类型错误。

### 节点 4a: Code（构建 Vision 请求）- True 分支

**Mode**: Run Once for Each Item

```javascript
const chatInput = $json.chatInput;
const imageUrl = $json.imageUrl;
const sessionId = $json.sessionId;

// 完整的 OCR 系统提示词（见 N8N_OCR_PROMPT.md）
const systemPrompt = `你是一个专业的 OCR（光学字符识别）和信息提取助手，同时也是商务名片信息收集助手。

## 当用户发送图片时的处理流程：

### 第一步：全面识别文字
按照从上到下、从左到右的顺序，识别图片中的所有文字内容（中文、英文、数字、符号）。

### 第二步：结构化整理
将识别到的文字按照逻辑关系分类：
- 主要信息（姓名、职位、公司）
- 联系方式（手机、邮箱、微信、地址）
- 其他信息

### 第三步：JSON 格式输出
\`\`\`json
{
  "formData": {
    "realName": "姓名",
    "position": "职位",
    "companyName": "公司",
    "phone": "电话",
    "email": "邮箱",
    "wechat": "微信",
    "address": "地址"
  },
  "completed": false
}
\`\`\`

### 第四步：询问用户
识别完成后，说明提取的信息，询问是否需要更新到名片中。

## 识别质量说明：
- high: 图片清晰，识别准确率 > 95%
- medium: 略有模糊，识别准确率 80-95%
- low: 图片模糊，识别准确率 < 80%，建议重新拍摄

## 注意事项：
1. 只识别实际存在的文字，不要臆测
2. 模糊文字用 [?] 标注
3. 提醒用户核对关键信息
4. 按照名片助手的标准格式返回 JSON`;

// 构建 OpenRouter 请求
return {
  json: {
    model: "anthropic/claude-3.5-sonnet",
    messages: [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: chatInput || "请识别这张图片中的所有文字信息，并提取名片相关字段"
          },
          {
            type: "image_url",
            image_url: {
              url: imageUrl
            }
          }
        ]
      }
    ],
    temperature: 0.7,
    max_tokens: 2000,
    sessionId: sessionId
  }
};
```

### 节点 4b: Code（构建普通请求）- False 分支

**Mode**: Run Once for Each Item

```javascript
const chatInput = $json.chatInput;
const sessionId = $json.sessionId;

// 使用原有的名片助手系统提示词
const systemPrompt = `你是一个专业且友善的商务名片信息收集助手...（完整提示词见 N8N_AI_ASSISTANT_PROMPT.md）`;

return {
  json: {
    model: "anthropic/claude-3.5-sonnet",
    messages: [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: chatInput
      }
    ],
    temperature: 0.7,
    max_tokens: 2000,
    sessionId: sessionId
  }
};
```

### 节点 5a & 5b: HTTP Request（OpenRouter API）

**URL**: `https://openrouter.ai/api/v1/chat/completions`

**Method**: POST

**Authentication**: None（使用 Header）

**Headers**:
```json
{
  "Authorization": "Bearer YOUR_OPENROUTER_API_KEY",
  "Content-Type": "application/json",
  "HTTP-Referer": "https://business-card-app.com",
  "X-Title": "Business Card AI Assistant"
}
```

**Body**: `{{ $json }}`（直接使用 Code 节点的输出）

**Options**:
- Response Format: JSON

### 节点 6: Merge

合并两个分支的输出。

### 节点 7: Code（解析响应）

**Mode**: Run Once for Each Item

```javascript
const response = $input.item.json;
const sessionId = $('Set').item.json.sessionId || 'unknown';

// OpenRouter 返回格式（兼容多种模型）
let aiMessage = '';

// 尝试多种可能的响应格式
if (response.choices && response.choices[0]) {
  aiMessage = response.choices[0].message.content;
} else if (response.output) {
  aiMessage = response.output;
} else if (response.message) {
  aiMessage = response.message;
} else {
  aiMessage = JSON.stringify(response);
}

console.log('AI 响应内容:', aiMessage);

// 检查是否包含 JSON 格式的表单数据
const jsonMatch = aiMessage.match(/```json\s*([\s\S]*?)\s*```/);

if (jsonMatch) {
  try {
    const parsedData = JSON.parse(jsonMatch[1]);
    
    return {
      json: {
        output: aiMessage,
        formData: parsedData.formData || null,
        completed: parsedData.completed || false,
        sessionId: sessionId,
        rawText: parsedData.rawText || null
      }
    };
  } catch (e) {
    console.error('JSON 解析失败:', e.message);
    return {
      json: {
        output: aiMessage,
        formData: null,
        completed: false,
        sessionId: sessionId,
        error: 'JSON parse failed: ' + e.message
      }
    };
  }
} else {
  // 没有 JSON 格式，返回纯文本响应
  return {
    json: {
      output: aiMessage,
      formData: null,
      completed: false,
      sessionId: sessionId
    }
  };
}
```

**说明**：
- 支持 OpenRouter 的多种模型返回格式（Claude、GPT-4o、Llama Vision 等）
- 从 `response.choices[0].message.content` 提取文本内容
- 自动查找并解析 JSON 代码块
- 添加日志输出便于调试

### 节点 8: Respond to Webhook

**Response Body**:
```json
{
  "output": "={{ $json.output }}",
  "formData": "={{ $json.formData }}",
  "completed": "={{ $json.completed }}",
  "sessionId": "={{ $json.sessionId }}"
}
```

## 获取 OpenRouter API Key

1. 访问 https://openrouter.ai/
2. 注册账号
3. 进入 Keys 页面创建 API Key
4. 充值（最低 $5）
5. 将 API Key 填入 HTTP Request 节点的 Headers

## 前端代码配置

前端代码已完成配置：

### 1. n8nService.ts
- ✅ 扩展 `N8NAgentRequest` 接口，添加 `imageUrl` 字段
- ✅ 修改 `callN8NAgent` 函数，支持传递图片 URL

### 2. AIAssistantScreen.tsx
- ✅ 修改 `sendMessage` 函数，传递 `imageMinioUrl` 给 n8n

### 3. fileManager.ts
- ✅ 上传图片到 MinIO（二进制格式）
- ✅ 去重检查时补充上传 MinIO URL
- ✅ 返回公网可访问的 URL

## 测试步骤

### 1. 测试图片上传

在聊天界面拍照或选择图片，检查控制台输出：

```
开始上传到 MinIO: { originalPath: '...', hash: '...', fileName: '...' }
✓ MinIO 上传成功: http://101.34.87.172:9000/business-card/files/xxx.jpg
完整 metadata: { ..., minioUrl: 'http://...' }
```

### 2. 测试 MinIO 可访问性

复制 `minioUrl`，在浏览器中打开，确认：
- 图片可以正常下载
- 图片格式正确（JPEG/PNG）
- 图片内容完整

### 3. 测试图片识别

1. 在聊天界面发送一张名片图片
2. 检查 n8n workflow 执行日志
3. 确认 AI 返回了识别的文字和提取的信息
4. 确认返回了 JSON 格式的表单数据

### 4. 测试信息更新

点击"确认更新"按钮，检查：
- 名片信息是否正确更新
- 字段映射是否正确
- 数据是否持久化保存

## 成本估算

使用 Claude 3.5 Sonnet，假设每天处理 100 张名片图片：

- 每张图片约 1000 tokens 输入 + 500 tokens 输出
- 成本：100 × (1000 × $3/1M + 500 × $15/1M) ≈ **$1.05/天**

使用 Gemini Pro 1.5 会更便宜，约 **$0.35/天**。

## 常见问题

### Q1: 图片上传到 MinIO 后无法访问

**检查**：
1. MinIO 服务器是否可公网访问（`http://101.34.87.172:9000`）
2. 端口 9000 是否开放
3. Bucket `business-card` 是否存在
4. Bucket 策略是否设置为公开读取

**解决**：
```bash
# 使用 MinIO Client 设置 bucket 策略
mc anonymous set download myminio/business-card
```

### Q2: AI 无法识别图片

**可能原因**：
1. MinIO URL 不是公网可访问
2. 图片格式不正确（上传的是 base64 文本）
3. 模型不支持 Vision

**解决**：
1. 确保 MinIO 公网可访问
2. 检查上传代码，确保使用 `Uint8Array` 上传二进制数据
3. 使用支持 Vision 的模型（claude-3.5-sonnet、gpt-4o 等）

### Q3: 识别准确率低

**优化方法**：
1. 提高图片质量（清晰、光线充足、正面拍摄）
2. 使用更强的模型（Claude 3.5 Sonnet > GPT-4o > Gemini）
3. 优化系统提示词，添加更多示例
4. 对模糊图片提示用户重新拍摄

### Q4: IF 节点报错

**错误**：`Wrong type: 'true' is a boolean but was expecting a string`

**解决**：不要使用表达式模式，使用字段比较：
- Field: `imageUrl`
- Operation: `is not empty`

## 通义千问 VL Plus 配置（中国用户推荐）

### HTTP Request 节点配置

**URL**: `https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation`

**Method**: POST

**Headers**:
```json
{
  "Authorization": "Bearer YOUR_DASHSCOPE_API_KEY",
  "Content-Type": "application/json"
}
```

**Body**（在 Code 节点中构建）:
```javascript
const chatInput = $json.chatInput;
const imageUrl = $json.imageUrl;
const sessionId = $json.sessionId;

// 读取 OCR 提示词文件内容
const systemPrompt = `你是一个专业的 OCR（光学字符识别）和信息提取助手，同时也是商务名片信息收集助手。

## 当用户发送图片时的处理流程：

### 第一步：全面识别文字
按照从上到下、从左到右的顺序，识别图片中的所有文字内容（中文、英文、数字、符号）。

### 第二步：结构化整理
将识别到的文字按照逻辑关系分类：
- 主要信息（姓名、职位、公司）
- 联系方式（手机、邮箱、微信、地址）
- 其他信息

### 第三步：JSON 格式输出
\`\`\`json
{
  "formData": {
    "realName": "姓名",
    "position": "职位",
    "companyName": "公司",
    "phone": "电话",
    "email": "邮箱",
    "wechat": "微信",
    "address": "地址"
  },
  "completed": false
}
\`\`\`

### 第四步：询问用户
识别完成后，说明提取的信息，询问是否需要更新到名片中。

## 识别质量说明：
- high: 图片清晰，识别准确率 > 95%
- medium: 略有模糊，识别准确率 80-95%
- low: 图片模糊，识别准确率 < 80%，建议重新拍摄

## 注意事项：
1. 只识别实际存在的文字，不要臆测
2. 模糊文字用 [?] 标注
3. 提醒用户核对关键信息
4. 按照名片助手的标准格式返回 JSON`;

// 构建通义千问请求
return {
  json: {
    model: "qwen-vl-plus",
    input: {
      messages: [
        {
          role: "system",
          content: [
            {
              text: systemPrompt
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              text: chatInput || "请识别这张图片中的所有文字信息，并提取名片相关字段"
            },
            {
              image: imageUrl
            }
          ]
        }
      ]
    },
    parameters: {
      result_format: "message"
    },
    sessionId: sessionId
  }
};
```

### 解析响应 Code 节点

```javascript
const response = $input.item.json;
const sessionId = $input.item.json.sessionId;

// 通义千问返回格式
const aiMessage = response.output.choices[0].message.content[0].text;

// 检查是否包含 JSON 格式的表单数据
const jsonMatch = aiMessage.match(/```json\s*([\s\S]*?)\s*```/);

if (jsonMatch) {
  try {
    const parsedData = JSON.parse(jsonMatch[1]);
    
    return {
      json: {
        output: aiMessage,
        formData: parsedData.formData || null,
        completed: parsedData.completed || false,
        sessionId: sessionId
      }
    };
  } catch (e) {
    return {
      json: {
        output: aiMessage,
        formData: null,
        completed: false,
        sessionId: sessionId,
        error: 'JSON parse failed: ' + e.message
      }
    };
  }
} else {
  return {
    json: {
      output: aiMessage,
      formData: null,
      completed: false,
      sessionId: sessionId
    }
  };
}
```

### 获取通义千问 API Key

1. 访问 https://dashscope.console.aliyun.com/
2. 注册/登录阿里云账号
3. 开通 DashScope 服务
4. 创建 API Key
5. 充值（按量付费，约 ¥0.008/千tokens）

### 成本对比

使用通义千问 VL Plus，每天处理 100 张名片图片：
- 每张图片约 1000 tokens 输入 + 500 tokens 输出
- 成本：100 × 1500 × ¥0.008/1000 ≈ **¥1.2/天**（约 $0.17/天）

比 OpenRouter 的 Claude 3.5 Sonnet 便宜约 **85%**！

## 扩展功能

### 1. 批量识别

支持一次上传多张图片：
```typescript
interface Message {
  images?: Array<{
    localPath: string;
    minioUrl: string;
  }>;
}
```

### 2. 图片压缩

在上传前压缩以节省存储：
```typescript
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const compressed = await manipulateAsync(
  uri,
  [{ resize: { width: 1024 } }],
  { compress: 0.8, format: SaveFormat.JPEG }
);
```

### 3. 专门的 OCR API

使用专业 OCR 服务（更准确）：
- Google Cloud Vision API
- Azure Computer Vision
- 百度 OCR
- 腾讯 OCR

## 相关文档

- [N8N_OCR_PROMPT.md](./N8N_OCR_PROMPT.md) - OCR 识别系统提示词
- [N8N_AI_ASSISTANT_PROMPT.md](./N8N_AI_ASSISTANT_PROMPT.md) - AI 助手系统提示词
- [N8N_INTEGRATION.md](./N8N_INTEGRATION.md) - n8n 集成说明
