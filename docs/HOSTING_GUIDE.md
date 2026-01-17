# 技术支持页面托管指南（非 IPFS 方案）

本指南提供多种简单、免费且国内可访问的托管方案。

## 🇨🇳 方案 1: GitHub Pages（最推荐）⭐

**优势：**
- ✅ 完全免费
- ✅ 国内可访问（速度较慢但稳定）
- ✅ 自动 HTTPS
- ✅ 可以绑定自定义域名
- ✅ 版本控制

### 步骤：

1. **确保代码已推送到 GitHub**
   ```bash
   cd /Users/zhengbiaoxie/Workspace/business-card
   git add docs/support.html
   git commit -m "Add support page"
   git push origin main
   ```

2. **启用 GitHub Pages**
   - 访问仓库：https://github.com/quzi-biao/decentralization_business_card
   - 点击 Settings → Pages
   - Source 选择 "Deploy from a branch"
   - Branch 选择 "main"，文件夹选择 "/docs"
   - 点击 Save

3. **访问链接**
   - 等待 1-2 分钟部署完成
   - 访问地址：
     ```
     https://quzi-biao.github.io/decentralization_business_card/support.html
     ```

4. **在 app.json 中配置**
   ```json
   {
     "expo": {
       "supportUrl": "https://quzi-biao.github.io/decentralization_business_card/support.html"
     }
   }
   ```

---

## 🚀 方案 2: Vercel（速度最快）

**优势：**
- ✅ 完全免费
- ✅ 国内访问速度快
- ✅ 自动部署
- ✅ 自动 HTTPS
- ✅ 可绑定自定义域名

### 步骤：

1. **安装 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **部署**
   ```bash
   cd /Users/zhengbiaoxie/Workspace/business-card
   vercel --prod
   ```

4. **选择配置**
   - 选择项目目录
   - 选择 "docs" 作为输出目录
   - 确认部署

5. **获取链接**
   - 部署完成后会显示访问链接
   - 格式：`https://your-project.vercel.app/support.html`

---

## 📦 方案 3: Netlify（简单易用）

**优势：**
- ✅ 完全免费
- ✅ 国内可访问
- ✅ 拖拽上传
- ✅ 自动 HTTPS
- ✅ 表单处理功能

### 方法 A: 网页上传（最简单）

1. **访问 Netlify**
   - 打开 https://app.netlify.com/
   - 注册/登录账号

2. **拖拽上传**
   - 在首页找到 "Want to deploy a new site without connecting to Git?"
   - 将 `docs` 文件夹直接拖拽到页面
   - 等待上传完成

3. **获取链接**
   - 上传成功后会生成随机域名
   - 格式：`https://random-name.netlify.app/support.html`
   - 可以在设置中修改域名

### 方法 B: CLI 部署

```bash
# 安装 Netlify CLI
npm install -g netlify-cli

# 登录
netlify login

# 部署
cd /Users/zhengbiaoxie/Workspace/business-card
netlify deploy --prod --dir=docs

# 输出会包含访问链接
```

---

## 🌐 方案 4: Cloudflare Pages

**优势：**
- ✅ 完全免费
- ✅ 国内访问速度快（有 CDN）
- ✅ 无限带宽
- ✅ 自动 HTTPS

### 步骤：

1. **访问 Cloudflare Pages**
   - 打开 https://pages.cloudflare.com/
   - 登录/注册账号

2. **连接 GitHub**
   - 点击 "Create a project"
   - 选择 "Connect to Git"
   - 授权 GitHub 仓库

3. **配置部署**
   - 选择仓库：decentralization_business_card
   - Build directory: `docs`
   - 点击 "Save and Deploy"

4. **获取链接**
   - 格式：`https://your-project.pages.dev/support.html`

---

## 📱 方案 5: 腾讯云静态网站托管

**优势：**
- ✅ 国内访问速度最快
- ✅ 免费额度充足
- ✅ 备案后可用自定义域名

### 步骤：

1. **开通服务**
   - 登录腾讯云控制台
   - 搜索"静态网站托管"
   - 开通服务（需要实名认证）

2. **上传文件**
   - 进入控制台
   - 创建存储桶
   - 上传 `support.html`
   - 设置为公开读

3. **获取链接**
   - 在文件详情中获取访问链接
   - 格式：`https://your-bucket.cos.ap-guangzhou.myqcloud.com/support.html`

---

## 🎯 方案 6: 阿里云 OSS

**优势：**
- ✅ 国内访问速度快
- ✅ 稳定可靠
- ✅ 免费额度

### 步骤：

1. **开通 OSS**
   - 登录阿里云控制台
   - 开通对象存储 OSS

2. **创建 Bucket**
   - 选择区域（建议选择离用户近的）
   - 读写权限选择"公共读"

3. **上传文件**
   - 上传 `support.html`
   - 获取文件 URL

4. **获取链接**
   - 格式：`https://your-bucket.oss-cn-hangzhou.aliyuncs.com/support.html`

---

## 📊 方案对比

| 方案 | 国内访问速度 | 部署难度 | 费用 | 推荐指数 |
|------|------------|---------|------|---------|
| GitHub Pages | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 免费 | ⭐⭐⭐⭐⭐ |
| Vercel | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 免费 | ⭐⭐⭐⭐⭐ |
| Netlify | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 免费 | ⭐⭐⭐⭐ |
| Cloudflare Pages | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 免费 | ⭐⭐⭐⭐⭐ |
| 腾讯云 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 免费额度 | ⭐⭐⭐⭐ |
| 阿里云 OSS | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 免费额度 | ⭐⭐⭐⭐ |

---

## 🎯 推荐方案

### 最简单：GitHub Pages
- 代码已经在 GitHub 上，只需在设置中启用即可
- 无需额外工具或注册

### 最快速：Vercel 或 Cloudflare Pages
- 国内访问速度快
- 自动部署，无需手动操作

### 国内最优：腾讯云或阿里云
- 国内访问速度最快
- 但需要实名认证

---

## 📝 快速开始（GitHub Pages）

```bash
# 1. 推送代码到 GitHub
cd /Users/zhengbiaoxie/Workspace/business-card
git add docs/support.html
git commit -m "Add support page"
git push origin main

# 2. 在 GitHub 仓库设置中启用 Pages
# Settings → Pages → Source: main branch, /docs folder

# 3. 等待 1-2 分钟后访问
# https://quzi-biao.github.io/decentralization_business_card/support.html
```

---

## ⚙️ 在 app.json 中配置

选择一个方案部署后，更新 `app.json`：

```json
{
  "expo": {
    "name": "AI名片",
    "supportUrl": "https://your-domain.com/support.html",
    "privacyPolicyUrl": "https://your-domain.com/support.html"
  }
}
```

---

## 🔄 更新文件

当需要更新支持页面时：

### GitHub Pages
```bash
git add docs/support.html
git commit -m "Update support page"
git push origin main
# 自动更新，等待 1-2 分钟
```

### Vercel
```bash
vercel --prod
# 自动部署最新版本
```

### Netlify
```bash
netlify deploy --prod --dir=docs
# 或直接在网页拖拽上传新文件
```

---

**建议：优先使用 GitHub Pages，因为代码已经在 GitHub 上，最方便快捷。**
