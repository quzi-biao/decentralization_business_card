# 🚀 快速开始指南

## 📋 前置要求

- Node.js 18+ 
- npm 或 yarn
- Expo CLI: `npm install -g expo-cli`
- iOS 模拟器或 Android 模拟器（可选）

## ⚡ 5 分钟快速启动

### 1. 克隆并安装

```bash
git clone https://github.com/yourusername/business-card.git
cd business-card
npm install
```

### 2. 配置（可选）

如果您想使用 AI 功能和云存储：

```bash
# 复制配置文件
cp src/config/n8n.config.ts src/config/n8n.config.local.ts
cp src/config/minio.config.ts src/config/minio.config.local.ts

# 编辑 *.local.ts 文件，填入您的配置
```

**注意**：不配置也可以使用，应用会在本地模式下运行。

### 3. 启动应用

```bash
npx expo start
```

### 4. 运行

- 按 `i` 在 iOS 模拟器中运行
- 按 `a` 在 Android 模拟器中运行
- 扫描二维码在真机上运行（需要安装 Expo Go）

## 🎯 基本使用

### 创建您的第一张名片

1. 打开应用
2. 点击"我的名片"
3. 填写您的信息
4. 保存

### 交换名片

1. 点击"交换"标签
2. 向对方展示您的二维码
3. 或点击"扫描二维码"扫描对方的名片

### 管理联系人

1. 在"名片"标签查看所有联系人
2. 点击名片查看详情
3. 添加标签和备注

## 🔧 可选配置

### n8n AI 功能

如果您想使用 AI 助手功能：

1. 搭建 n8n 实例（[n8n.io](https://n8n.io)）
2. 创建 AI 工作流
3. 在 `n8n.config.local.ts` 中配置

### MinIO 云存储

如果您想跨设备同步：

1. 搭建 MinIO 服务器
2. 创建存储桶
3. 在 `minio.config.local.ts` 中配置

## 📱 在真机上运行

### 使用 Expo Go（推荐新手）

1. 在手机上安装 Expo Go 应用
2. 运行 `npx expo start`
3. 扫描终端中的二维码

### 构建独立应用

```bash
# iOS
eas build --platform ios

# Android
eas build --platform android
```

## ❓ 常见问题

### Q: 应用启动失败？
A: 确保已安装所有依赖：`npm install`

### Q: 无法扫描二维码？
A: 检查相机权限是否已授予

### Q: AI 功能不工作？
A: 检查 n8n 配置是否正确，或在本地模式下使用

### Q: 数据丢失了？
A: 数据存储在设备本地，确保定期备份设备

## 📚 更多文档

- [完整文档](./README.md)
- [贡献指南](./CONTRIBUTING.md)
- [安全政策](./SECURITY.md)

## 💬 获取帮助

- GitHub Issues: 报告问题
- GitHub Discussions: 提问和讨论

祝您使用愉快！🎉
