# IPFS 上传指南

本指南将帮助您将技术支持页面上传到 IPFS 并创建访问链接。

## 方法 1: 使用 Pinata（推荐）

Pinata 是最简单的 IPFS 托管服务。

### 步骤：

1. **注册 Pinata 账号**
   - 访问 https://pinata.cloud/
   - 注册免费账号（提供 1GB 免费存储）

2. **上传文件**
   - 登录后点击 "Upload" → "File"
   - 选择 `docs/support.html` 文件
   - 点击 "Upload"

3. **获取访问链接**
   - 上传成功后，复制 CID（内容标识符）
   - 访问链接格式：
     ```
     https://gateway.pinata.cloud/ipfs/[YOUR_CID]
     ```
   - 或使用公共网关：
     ```
     https://ipfs.io/ipfs/[YOUR_CID]
     ```

## 方法 2: 使用 IPFS Desktop

### 步骤：

1. **安装 IPFS Desktop**
   - 下载：https://docs.ipfs.tech/install/ipfs-desktop/
   - 安装并启动应用

2. **添加文件**
   - 打开 IPFS Desktop
   - 点击 "Files" → "Import"
   - 选择 `docs/support.html`

3. **获取 CID**
   - 文件上传后会显示 CID
   - 右键点击文件 → "Copy CID"

4. **访问文件**
   ```
   https://ipfs.io/ipfs/[YOUR_CID]
   ```

## 方法 3: 使用命令行

### 安装 IPFS CLI：

```bash
# macOS
brew install ipfs

# 或下载二进制文件
# https://docs.ipfs.tech/install/command-line/
```

### 初始化并启动：

```bash
# 初始化 IPFS
ipfs init

# 启动 IPFS 守护进程
ipfs daemon
```

### 上传文件：

```bash
# 进入项目目录
cd /Users/zhengbiaoxie/Workspace/business-card

# 上传文件
ipfs add docs/support.html

# 输出示例：
# added QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX support.html
```

### 访问文件：

```
https://ipfs.io/ipfs/QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

## 方法 4: 使用 Web3.Storage

### 步骤：

1. **注册账号**
   - 访问 https://web3.storage/
   - 注册免费账号

2. **获取 API Token**
   - 登录后进入 "Account" → "Create API Token"
   - 复制 token

3. **使用命令行上传**

```bash
# 安装 w3 CLI
npm install -g @web3-storage/w3cli

# 登录
w3 login

# 上传文件
w3 up docs/support.html

# 输出会包含访问链接
```

## 公共 IPFS 网关列表

上传成功后，可以通过以下任意网关访问：

- https://ipfs.io/ipfs/[CID]
- https://gateway.pinata.cloud/ipfs/[CID]
- https://cloudflare-ipfs.com/ipfs/[CID]
- https://dweb.link/ipfs/[CID]
- https://[CID].ipfs.dweb.link/

## 在 app.json 中配置支持链接

上传成功后，将 IPFS 链接添加到 `app.json`：

```json
{
  "expo": {
    "name": "AI名片",
    "supportUrl": "https://ipfs.io/ipfs/[YOUR_CID]",
    "privacyPolicyUrl": "https://ipfs.io/ipfs/[YOUR_CID]"
  }
}
```

## 固定（Pin）文件

为了确保文件长期可用，建议使用固定服务：

### Pinata（推荐）
- 免费账号提供 1GB 存储
- 文件会自动固定
- 提供 CDN 加速

### Web3.Storage
- 完全免费
- 自动固定
- 由 Filecoin 网络支持

### IPFS Cluster
- 自托管方案
- 需要运行自己的节点

## 更新文件

IPFS 是内容寻址的，每次更新文件都会生成新的 CID。

### 使用 IPNS（可选）

IPNS 允许使用固定的名称指向可变的内容：

```bash
# 发布到 IPNS
ipfs name publish [CID]

# 输出会包含 IPNS 名称
# Published to k51qzi5uqu5xxxxxxxxxxxxxxxxxxxxx: /ipfs/QmXXXXXX

# 访问链接
https://ipfs.io/ipns/k51qzi5uqu5xxxxxxxxxxxxxxxxxxxxx
```

## 验证上传

上传后，建议在多个网关测试访问：

```bash
# 测试不同网关
curl -I https://ipfs.io/ipfs/[CID]
curl -I https://cloudflare-ipfs.com/ipfs/[CID]
curl -I https://gateway.pinata.cloud/ipfs/[CID]
```

## 注意事项

1. **文件大小**：support.html 约 15KB，所有服务都支持
2. **访问速度**：首次访问可能较慢，后续会被缓存
3. **持久性**：使用 Pinata 或 Web3.Storage 确保文件长期可用
4. **更新**：每次更新需要重新上传并更新链接

## 推荐方案

**最简单：** Pinata（网页上传，无需命令行）
**最快速：** IPFS Desktop（图形界面）
**最灵活：** IPFS CLI（命令行控制）
**最稳定：** Web3.Storage（免费且可靠）

---

上传完成后，请将生成的 IPFS 链接添加到应用商店的支持 URL 中。
