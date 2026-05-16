#!/bin/bash
# scripts/push.sh — Auto commit & push ke GitHub
set -e

# Warna output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Ambil pesan commit dari argumen atau gunakan default
COMMIT_MSG="${1:-chore: auto-sync $(date '+%Y-%m-%d %H:%M')}"
BRANCH="${2:-$(git rev-parse --abbrev-ref HEAD)}"

echo -e "${YELLOW}📦 Staging semua perubahan...${NC}"
git add -A

# Cek apakah ada yang perlu di-commit
if git diff --cached --quiet; then
  echo -e "${GREEN}✅ Tidak ada perubahan baru. Repo sudah sinkron.${NC}"
  exit 0
fi

echo -e "${YELLOW}📝 Commit: ${COMMIT_MSG}${NC}"
git commit -m "$COMMIT_MSG"

echo -e "${YELLOW}🚀 Push ke origin/${BRANCH}...${NC}"
git push origin "$BRANCH"

echo -e "${GREEN}✅ Push berhasil ke branch '${BRANCH}'.${NC}"
