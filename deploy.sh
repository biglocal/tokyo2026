#!/bin/bash

# 獲取當前時間
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

# 1. 詢問這次的更新內容 (互動式)
echo "🖍️ 準備上傳到 GitHub！"
read -p "請輸入這次更新的簡短描述 (例如: 更新D3地圖、微調配色，直接按 Enter 則使用預設訊息): " USER_MSG

# 如果沒有輸入，就使用預設訊息
if [ -z "$USER_MSG" ]; then
    COMMIT_MSG="Update: AI 產生 HTML 更新 ($TIMESTAMP)"
    LOG_MSG="自動更新"
else
    COMMIT_MSG="Update: $USER_MSG ($TIMESTAMP)"
    LOG_MSG="$USER_MSG"
fi

LOG_FILE="deploy.log"

echo "==================================="
echo "🚀 開始執行自動同步流程..."

# 2. 確保本地端是最新的 (避免衝突)
git pull origin main

# 3. 將檔案加入 Git
git add index.html
git add deploy.sh
git add deploy.log 2>/dev/null

# 4. 進行 Commit
git commit -m "$COMMIT_MSG"

# 5. 推送到 GitHub
echo "⬆️ 正在推送到 GitHub..."
if git push origin main; then
    # 6. 寫入本地端 Log 檔案
    echo "[$TIMESTAMP] ✅ 成功 | 說明: $LOG_MSG" >> "$LOG_FILE"
    echo "🎉 上傳大成功！您的 Web App 已經更新了！"
    echo "==================================="
else
    echo "[$TIMESTAMP] ❌ 失敗 | 說明: $LOG_MSG" >> "$LOG_FILE"
    echo "⚠️ 上傳失敗！請檢查下方的錯誤訊息，確認網路或 GitHub 權限。"
    echo "==================================="
fi
