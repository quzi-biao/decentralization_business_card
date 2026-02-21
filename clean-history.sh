#!/bin/bash

# 清理 Git 历史中的敏感信息
# 警告：这将重写 Git 历史！

echo "⚠️  警告：此操作将重写 Git 历史！"
echo "请确保您已经备份了仓库。"
echo ""
read -p "是否继续？(yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "操作已取消"
    exit 1
fi

echo "开始清理历史..."

# 备份当前分支
git branch backup-before-clean

# 使用 git filter-branch 替换敏感信息
git filter-branch --force --index-filter \
'git rm --cached --ignore-unmatch src/config/n8n.config.ts || true
 git rm --cached --ignore-unmatch src/config/minio.config.ts || true' \
--prune-empty --tag-name-filter cat -- --all

# 清理 refs
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "✅ 历史清理完成！"
echo ""
echo "下一步操作："
echo "1. 检查历史是否已清理：git log --all --oneline"
echo "2. 如果确认无误，强制推送到远程：git push origin --force --all"
echo "3. 如果需要恢复，切换到备份分支：git checkout backup-before-clean"
echo ""
echo "⚠️  注意：强制推送会影响所有协作者，请确保通知他们重新克隆仓库！"
