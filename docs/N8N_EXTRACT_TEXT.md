# n8n Code 节点 - 提取 Vision API 返回的文本

## 简单提取文本（Code 节点）

```javascript
// 获取 API 响应
const response = $input.item.json;

// 提取文本内容
const aiMessage = response.choices[0].message.content;

// 返回提取的文本
return {
  json: {
    text: aiMessage,
    sessionId: $('Set').item.json.sessionId
  }
};
```

## 说明

- **输入**：Vision API 的完整响应（包含 `choices` 数组）
- **输出**：提取的文本内容
- **路径**：`response.choices[0].message.content`

## 示例

**输入**：
```json
{
  "choices": [{
    "message": {
      "content": "识别到的文字内容..."
    }
  }]
}
```

**输出**：
```json
{
  "text": "识别到的文字内容...",
  "sessionId": "xxx"
}
```
