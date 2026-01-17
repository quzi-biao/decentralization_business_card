# 语音输入功能集成说明

## 已完成的工作

### 1. **n8n 工作流配置**
- ✅ 创建了腾讯云语音识别工作流 JSON 文件
- ✅ 工作流 ID: `vMshNKu_8EM85rLGB8ByS`
- ✅ Webhook 路径: `speech-to-text`

### 2. **前端代码集成**
- ✅ 创建了 `SpeechToTextService` 服务 (`src/services/speechToText.ts`)
- ✅ 更新了 `ChatInput` 组件，添加了语音输入按钮
- ✅ 集成了录音、语音识别和文字填充功能
- ✅ 更新了 n8n 配置文件，添加了语音识别工作流配置

### 3. **依赖安装**
- ⏳ 正在安装 `expo-av` 包（用于录音功能）

## 下一步操作

### 步骤 1: 配置 n8n 工作流

1. **导入工作流到 n8n**
   - 打开你的 n8n 界面：http://101.34.87.172:5678
   - 点击右上角 "+" → "Import from File"
   - 选择文件：`n8n-workflows/tencent-speech-to-text.json`

2. **配置腾讯云密钥**
   - 打开导入的工作流
   - 找到 "生成签名" 节点
   - 修改以下参数：
     ```javascript
     const SecretId = 'YOUR_SECRET_ID';     // 替换为你的腾讯云 SecretId
     const SecretKey = 'YOUR_SECRET_KEY';   // 替换为你的腾讯云 SecretKey
     const Region = 'ap-guangzhou';         // 可选地域
     ```

3. **获取腾讯云密钥**
   - 登录腾讯云控制台：https://console.cloud.tencent.com/
   - 进入"访问管理" → "访问密钥" → "API密钥管理"
   - 创建或查看现有密钥
   - 开通"语音识别"服务：https://console.cloud.tencent.com/asr

4. **激活工作流**
   - 保存工作流
   - 点击右上角的激活开关
   - 确认 Webhook URL 为：`http://101.34.87.172:5678/webhook/speech-to-text`

### 步骤 2: 配置应用权限

在 `app.json` 中添加麦克风权限（如果还没有）：

```json
{
  "expo": {
    "plugins": [
      [
        "expo-av",
        {
          "microphonePermission": "允许使用麦克风进行语音输入"
        }
      ]
    ],
    "ios": {
      "infoPlist": {
        "NSMicrophoneUsageDescription": "需要使用麦克风进行语音输入"
      }
    },
    "android": {
      "permissions": [
        "android.permission.RECORD_AUDIO"
      ]
    }
  }
}
```

### 步骤 3: 测试语音输入

1. **重新构建应用**（如果修改了 app.json）
   ```bash
   npx expo prebuild --clean
   ```

2. **运行应用**
   ```bash
   npm start
   ```

3. **测试流程**
   - 打开 AI 助手页面
   - 点击麦克风图标开始录音（图标变红）
   - 说话（建议 5-10 秒）
   - 再次点击停止录音
   - 等待语音识别完成（显示"正在识别语音..."）
   - 识别结果自动填入输入框

## 功能说明

### UI 交互
- **麦克风按钮**：位于输入框左侧第二个按钮
- **录音状态**：录音时按钮变红色，显示停止图标
- **识别状态**：显示加载动画和"正在识别语音..."提示
- **结果填充**：识别的文字自动追加到输入框中

### 支持的音频格式
- 格式：m4a（iOS 默认录音格式）
- 采样率：16000Hz
- 时长限制：≤60 秒（腾讯云一句话识别限制）

### 错误处理
- 权限不足：提示用户授予麦克风权限
- 录音失败：显示错误提示
- 识别失败：显示具体错误信息
- 网络错误：提示检查网络连接

## 测试 n8n 工作流

使用 curl 命令测试工作流是否正常：

```bash
# 准备一个测试音频文件并转换为 Base64
base64 -i test.wav -o test.txt

# 调用 API
curl -X POST http://101.34.87.172:5678/webhook/speech-to-text \
  -H "Content-Type: application/json" \
  -d '{
    "audio": "BASE64_ENCODED_AUDIO_DATA",
    "format": "wav",
    "sampleRate": 16000
  }'
```

预期响应：
```json
{
  "success": true,
  "text": "识别的文字内容",
  "requestId": "xxx",
  "audioTime": 1500
}
```

## 费用说明

腾讯云一句话识别计费：
- **免费额度**：每月 30,000 次
- **超出后**：0.0048 元/次
- **计费方式**：按调用次数计费

## 故障排查

### 问题 1: 录音权限被拒绝
- **解决**：在手机设置中授予应用麦克风权限

### 问题 2: 语音识别失败
- **检查**：n8n 工作流是否已激活
- **检查**：腾讯云密钥是否正确配置
- **检查**：腾讯云语音识别服务是否已开通
- **检查**：网络连接是否正常

### 问题 3: 识别结果为空
- **原因**：录音时间过短或环境噪音过大
- **解决**：在安静环境下录音，时长至少 2-3 秒

### 问题 4: n8n 工作流报错
- **查看**：n8n 工作流执行日志
- **检查**：音频数据是否正确 Base64 编码
- **检查**：腾讯云 API 签名是否正确

## 文件清单

- ✅ `n8n-workflows/tencent-speech-to-text.json` - n8n 工作流配置
- ✅ `src/services/speechToText.ts` - 语音识别服务
- ✅ `src/components/ChatInput.tsx` - 聊天输入组件（已添加语音按钮）
- ✅ `src/config/n8n.config.ts` - n8n 配置（已添加语音识别配置）

## 后续优化建议

1. **添加录音时长显示**：显示当前录音时长
2. **添加音量可视化**：显示录音音量波形
3. **支持长语音**：超过 60 秒自动切换到录音文件识别
4. **离线缓存**：网络异常时缓存录音，稍后重试
5. **多语言支持**：支持英文、粤语等其他语言识别
