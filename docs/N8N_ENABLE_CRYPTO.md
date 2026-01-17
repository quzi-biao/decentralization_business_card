# 在 n8n 中启用 crypto 模块

## 问题
n8n 默认禁止在 Code 节点中使用 Node.js 内置模块如 `crypto`。

## 解决方法

### 1. 设置环境变量（推荐）

在启动 n8n 之前设置以下环境变量：

```bash
export NODE_FUNCTION_ALLOW_BUILTIN=crypto,buffer
export NODE_FUNCTION_ALLOW_EXTERNAL=*
```

### 2. Docker 部署方式

如果使用 Docker 运行 n8n，在 `docker-compose.yml` 中添加：

```yaml
version: '3.8'
services:
  n8n:
    image: n8nio/n8n
    environment:
      - NODE_FUNCTION_ALLOW_BUILTIN=crypto,buffer
      - NODE_FUNCTION_ALLOW_EXTERNAL=*
    ports:
      - "5678:5678"
```

### 3. 直接启动命令

```bash
NODE_FUNCTION_ALLOW_BUILTIN=crypto,buffer NODE_FUNCTION_ALLOW_EXTERNAL=* n8n start
```

### 4. PM2 配置

如果使用 PM2 管理 n8n，在 `ecosystem.config.js` 中：

```javascript
module.exports = {
  apps: [{
    name: 'n8n',
    script: 'n8n',
    env: {
      NODE_FUNCTION_ALLOW_BUILTIN: 'crypto,buffer',
      NODE_FUNCTION_ALLOW_EXTERNAL: '*'
    }
  }]
}
```

## 重启 n8n

配置完成后，重启 n8n 服务使配置生效。

## 验证

在 n8n 的 Code 节点中测试：

```javascript
const crypto = require('crypto');
const hash = crypto.createHash('sha256').update('test').digest('hex');
return { json: { hash } };
```

如果能正常执行，说明配置成功。

## 安全提示

- `NODE_FUNCTION_ALLOW_BUILTIN=crypto,buffer` 只允许特定的内置模块
- `NODE_FUNCTION_ALLOW_EXTERNAL=*` 允许所有外部模块（生产环境建议限制具体模块）
- 确保 n8n 运行在受信任的环境中
