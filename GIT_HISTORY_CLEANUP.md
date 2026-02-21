# Git 历史清理指南

## ⚠️ 重要警告

清理 Git 历史是一个**破坏性操作**，会重写整个仓库历史。请务必：

1. ✅ 备份整个仓库
2. ✅ 通知所有协作者
3. ✅ 确保没有正在进行的工作

## 🎯 目标

从 Git 历史中移除以下文件的敏感信息：
- `src/config/n8n.config.ts` - 包含 n8n API Key 和服务器地址
- `src/config/minio.config.ts` - 包含 MinIO 服务器地址

## 📋 方法一：使用 BFG Repo-Cleaner（推荐）

### 1. 安装 BFG

```bash
# macOS
brew install bfg

# 或下载 jar 文件
# https://rtyley.github.io/bfg-repo-cleaner/
```

### 2. 创建敏感信息替换文件

创建 `passwords.txt` 文件，包含需要替换的敏感信息：

```
# n8n API Key（示例 - 替换为您实际泄露的 key）
your-actual-leaked-api-key-here

# n8n 服务器地址（示例 - 替换为您实际的服务器地址）
https://your-n8n-server.com
http://your.server.ip:5678

# MinIO 服务器地址（示例）
https://your-minio-server.com:9000

# Webhook 路径和 Workflow IDs（示例 - 替换为您实际的 IDs）
your-webhook-path-1
your-workflow-id-1
your-workflow-id-2
your-webhook-path-2
your-workflow-id-3
```

### 3. 运行 BFG 清理

```bash
# 克隆一个新的镜像仓库
git clone --mirror git@github.com:yourusername/business-card.git business-card-mirror.git
cd business-card-mirror.git

# 使用 BFG 替换敏感信息
bfg --replace-text ../passwords.txt

# 清理和压缩仓库
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 推送清理后的历史
git push --force
```

## 📋 方法二：使用 git filter-branch

### 1. 备份仓库

```bash
# 创建备份分支
git branch backup-before-clean

# 或完整备份仓库
cp -r /Users/zhengbiaoxie/Workspace/business-card /Users/zhengbiaoxie/Workspace/business-card-backup
```

### 2. 运行清理脚本

```bash
# 使用提供的脚本
./clean-history.sh

# 或手动执行
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch src/config/n8n.config.ts
   git rm --cached --ignore-unmatch src/config/minio.config.ts' \
  --prune-empty --tag-name-filter cat -- --all
```

### 3. 清理 refs 和垃圾回收

```bash
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

## 📋 方法三：使用 git-filter-repo（最推荐）

### 1. 安装 git-filter-repo

```bash
# macOS
brew install git-filter-repo

# 或使用 pip
pip3 install git-filter-repo
```

### 2. 创建路径替换文件

创建 `path-changes.txt`：

```
# 从历史中移除文件
src/config/n8n.config.ts==>
src/config/minio.config.ts==>
```

### 3. 运行清理

```bash
git filter-repo --path-rename path-changes.txt --force
```

## ✅ 验证清理结果

### 1. 检查历史

```bash
# 查看提交历史
git log --all --oneline

# 搜索敏感信息（不应该有结果）
git log --all -p | grep "your-actual-api-key"
git log --all -p | grep "your-server-address"
```

### 2. 检查文件内容

```bash
# 查看当前文件
cat src/config/n8n.config.ts
cat src/config/minio.config.ts

# 确认只包含占位符，不包含真实配置
```

## 🚀 推送清理后的历史

### ⚠️ 最后警告

强制推送会影响所有协作者！请确保：
1. 已通知所有协作者
2. 所有人都已保存他们的工作
3. 准备好让大家重新克隆仓库

### 推送命令

```bash
# 强制推送所有分支
git push origin --force --all

# 强制推送所有标签
git push origin --force --tags
```

## 👥 协作者需要做什么

清理后，所有协作者需要：

```bash
# 1. 保存当前工作
git stash

# 2. 删除本地仓库
cd ..
rm -rf business-card

# 3. 重新克隆
git clone git@github.com:yourusername/business-card.git
cd business-card

# 4. 恢复工作（如果有）
git stash pop
```

## 🔍 额外检查

### 检查 GitHub 上的敏感信息

即使清理了 Git 历史，GitHub 可能仍然缓存了旧的提交。您需要：

1. 联系 GitHub Support 请求清理缓存
2. 或者删除仓库并重新创建（如果还没有公开）

### 撤销已泄露的密钥

**重要**：即使从历史中移除，已泄露的密钥仍然不安全！

1. ✅ 立即更换所有 API Key
2. ✅ 更新 n8n API Key
3. ✅ 如果可能，更改服务器地址
4. ✅ 检查访问日志，确认没有未授权访问

## 📝 清理后的配置

清理完成后，创建本地配置文件：

```bash
# 复制配置模板
cp src/config/n8n.config.ts src/config/n8n.config.local.ts
cp src/config/minio.config.ts src/config/minio.config.local.ts

# 编辑 *.local.ts 文件，填入新的配置
# 这些文件已在 .gitignore 中，不会被提交
```

## 🆘 如果出错了

如果清理过程出现问题：

```bash
# 恢复到备份分支
git checkout backup-before-clean

# 或从备份目录恢复
rm -rf /Users/zhengbiaoxie/Workspace/business-card
cp -r /Users/zhengbiaoxie/Workspace/business-card-backup /Users/zhengbiaoxie/Workspace/business-card
```

## 📚 参考资源

- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [git-filter-repo](https://github.com/newren/git-filter-repo)
- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)

---

**记住**：预防胜于治疗。使用 `.gitignore` 和环境变量来避免将来的泄露！
