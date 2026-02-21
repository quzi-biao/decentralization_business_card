#!/bin/bash

# Git 历史清理脚本 - 移除敏感配置信息
# 使用 git filter-branch 方法

set -e

echo "=========================================="
echo "Git 历史清理工具"
echo "=========================================="
echo ""
echo "⚠️  警告：此操作将重写整个 Git 历史！"
echo ""
echo "将要执行的操作："
echo "1. 创建备份分支 backup-before-clean"
echo "2. 从历史中移除 src/config/n8n.config.ts"
echo "3. 从历史中移除 src/config/minio.config.ts"
echo "4. 清理 refs 和执行垃圾回收"
echo ""
echo "请确保："
echo "✓ 已经提交了所有更改"
echo "✓ 已经备份了重要数据"
echo "✓ 已经通知了所有协作者"
echo ""
read -p "是否继续？输入 'yes' 确认: " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ 操作已取消"
    exit 1
fi

echo ""
echo "📦 步骤 1/5: 创建备份分支..."
git branch backup-before-clean 2>/dev/null || echo "备份分支已存在"

echo ""
echo "🔧 步骤 2/5: 重写历史，移除敏感配置文件..."
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch src/config/n8n.config.ts src/config/minio.config.ts' \
  --prune-empty --tag-name-filter cat -- --all

echo ""
echo "🧹 步骤 3/5: 清理 refs..."
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin

echo ""
echo "🗑️  步骤 4/5: 清理 reflog..."
git reflog expire --expire=now --all

echo ""
echo "♻️  步骤 5/5: 垃圾回收和压缩..."
git gc --prune=now --aggressive

echo ""
echo "=========================================="
echo "✅ 历史清理完成！"
echo "=========================================="
echo ""
echo "📋 下一步操作："
echo ""
echo "1. 验证清理结果："
echo "   git log --all --oneline"
echo "   git log --all -p | grep 'eyJhbGci' # 应该没有结果"
echo ""
echo "2. 检查当前文件内容："
echo "   cat src/config/n8n.config.ts"
echo "   cat src/config/minio.config.ts"
echo ""
echo "3. 如果确认无误，推送到远程："
echo "   git push origin --force --all"
echo "   git push origin --force --tags"
echo ""
echo "4. 如果需要恢复，切换到备份分支："
echo "   git checkout backup-before-clean"
echo ""
echo "⚠️  重要提醒："
echo "• 强制推送后，所有协作者需要重新克隆仓库"
echo "• 已泄露的密钥仍需要更换！"
echo "• 联系 GitHub Support 清理缓存的提交"
echo ""
